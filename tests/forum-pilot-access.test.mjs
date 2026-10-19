// DNCH Community v1.1 — deterministic browser access-regression checks.
// Run locally: node --test tests/forum-pilot-access.test.mjs
// No network, credentials, live Supabase project or test accounts are used.
// This exercises the real functions extracted from assets/forum.js, with a stubbed database.
// It does NOT prove PostgreSQL RLS; use a separate disposable DB for that.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const script = readFileSync(new URL('../assets/forum.js', import.meta.url), 'utf8');
function between(start, end) {
  const a = script.indexOf(start);
  const b = script.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'Forum source anchors changed; re-review the test harness');
  return script.slice(a, b);
}
const accessSource = between(
  'let user=null,categories=[],currentCategory=null,currentThread=null;',
  'let loadSerial=0;'
);
const loginSource = between('function toggleLogin(session){', 'function renderFilters(){');
const build = new Function('document', 'client', 'T', 'AccessT', '$', 'console', [
  accessSource,
  'let profileLoadId=0; function loadMyProfile(){}',
  loginSource,
  'return { toggleLogin, refreshPilotAccess, canPost, canReport,',
  ' setThread(value){currentThread=value;applyPilotAccess()},',
  ' snapshot(){return {userId:user?.id||null,pilotAccess:{...pilotAccess}}} };'
].join('\n'));

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}
function fixture() {
  const ids = [
    'forum-compose-section','forum-reply-form','forum-reply-hint','forum-pilot-access',
    'forum-profile-panel','forum-login-form','forum-session',
    'forum-identity','forum-admin-link'
  ];
  const els = Object.fromEntries(ids.map(id => [id, { id, hidden:true, textContent:'' }]));
  const reportButtons = [{hidden:true}, {hidden:true}];
  const document = {querySelectorAll(selector){return selector==='.forum-report'?reportButtons:[]}};
  const $ = id => {
    assert.ok(els[id], 'Unknown element: '+id);
    return els[id];
  };
  const responses = {
    forum_pilot_members: {data:null,error:null},
    forum_pilot_controls: {data:{posting_enabled:true},error:null},
    forum_member_blocks: {data:null,error:null},
    forum_admins: {data:null,error:null}
  };
  const requests=[];
  const client = {from(table){
    assert.ok(Object.hasOwn(responses,table), 'Unexpected database table '+table);
    const request={table,field:null,value:null};
    return {
      select(){return this},
      eq(field,value){request.field=field;request.value=value;return this},
      maybeSingle(){
        requests.push({...request});
        const result=responses[table];
        return typeof result==='function'?result(request):Promise.resolve(result);
      }
    };
  }};
  const api=build(document, client,
    {locked:'locked',readonly:'sign in'},
    {checking:'checking',approved:'approved',invite:'invite',
      paused:'paused',blocked:'blocked',unavailable:'unavailable'},
    $, {warn(){}});
  const login=id=>api.toggleLogin(id?{user:{id,email:id+'@example.invalid'}}:null);
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  return {els,reportButtons,responses,requests,api,login,settle};
}
function verifyUI(h,canWrite,canFlag,note){
  assert.equal(h.api.canPost(),canWrite);
  assert.equal(h.api.canReport(),canFlag);
  assert.equal(h.els['forum-compose-section'].hidden,!canWrite);
  assert.equal(h.els['forum-reply-form'].hidden,!canWrite);
  for(const report of h.reportButtons) assert.equal(report.hidden,!canFlag);
  assert.equal(h.els['forum-pilot-access'].textContent,note);
}

test('forum script parses; both languages expose private-pilot status element',()=>{
  assert.doesNotThrow(()=>new Function(script));
  for(const page of ['forum.html','bg/forum.html']){
    const html=readFileSync(new URL('../'+page,import.meta.url),'utf8');
    for(const id of ['forum-pilot-access','forum-reply-form','forum-compose-section']){
      assert.equal(html.split('id="'+id+'"').length-1,1,page+' '+id);
    }
  }
});

for(const scenario of [
  {name:'invited writer', approved:true, enabled:true, blocked:false, post:true, report:true, message:'approved'},
  {name:'authenticated without invitation', approved:false, enabled:true, blocked:false, post:false, report:false, message:'invite'},
  {name:'emergency posting pause', approved:true, enabled:false, blocked:false, post:false, report:true, message:'paused'},
  {name:'moderator posting restriction', approved:true, enabled:true, blocked:true, post:false, report:true, message:'blocked'},
  {name:'unavailable approval lookup', approved:true, enabled:true, blocked:false, fail:'forum_pilot_members', post:false, report:false, message:'unavailable'},
  {name:'unavailable posting switch', approved:true, enabled:true, blocked:false, fail:'forum_pilot_controls', post:false, report:false, message:'unavailable'},
  {name:'unavailable member block lookup', approved:true, enabled:true, blocked:false, fail:'forum_member_blocks', post:false, report:false, message:'unavailable'},
  {name:'missing posting switch row', approved:true, enabled:true, blocked:false, missing:true, post:false, report:false, message:'unavailable'}
]){
  test('private pilot: '+scenario.name,async()=>{
    const h=fixture();
    h.responses.forum_pilot_members={data:scenario.approved?{user_id:'alice'}:null,error:null};
    h.responses.forum_pilot_controls={data:scenario.missing?null:{posting_enabled:scenario.enabled},error:null};
    h.responses.forum_member_blocks={data:scenario.blocked?{is_blocked:true}:null,error:null};
    if(scenario.fail)h.responses[scenario.fail]={data:null,error:{message:'simulated failure'}};
    h.login('alice');
    await h.settle();
    h.api.setThread({id:'thread1',is_locked:false});
    verifyUI(h,scenario.post,scenario.report,scenario.message);
    assert.ok(h.requests.some(r=>r.table==='forum_pilot_members'&&r.value==='alice'));
    assert.ok(h.requests.some(r=>r.table==='forum_pilot_controls'&&r.value===1));
  });
}

test('locked threads hide replies even for approved members',async()=>{
  const h=fixture();
  h.responses.forum_pilot_members={data:{user_id:'alice'},error:null};
  h.login('alice');await h.settle();
  h.api.setThread({is_locked:true});
  assert.equal(h.api.canPost(),true);
  assert.equal(h.els['forum-reply-form'].hidden,true);
  assert.equal(h.els['forum-reply-hint'].textContent,'locked');
});

test('a revoked invitation takes effect on the next access check',async()=>{
  const h=fixture();
  h.responses.forum_pilot_members={data:{user_id:'alice'},error:null};
  h.login('alice');await h.settle();
  h.api.setThread({is_locked:false});
  assert.equal(h.api.canPost(),true);
  h.responses.forum_pilot_members={data:null,error:null};
  await h.api.refreshPilotAccess('alice');
  verifyUI(h,false,false,'invite');
});

test('sign-out clears approval and hides the pilot status',async()=>{
  const h=fixture();
  h.responses.forum_pilot_members={data:{user_id:'alice'},error:null};
  h.login('alice');await h.settle();
  assert.equal(h.api.canPost(),true);
  h.login(null);
  assert.equal(h.api.canPost(),false);
  assert.equal(h.api.canReport(),false);
  assert.equal(h.els['forum-pilot-access'].hidden,true);
  assert.equal(h.els['forum-compose-section'].hidden,true);
});

test('switching accounts ignores an earlier, slower approval response',async()=>{
  const h=fixture();
  const slow=deferred();
  h.responses.forum_pilot_members=req=>req.value==='alice'
    ?slow.promise:Promise.resolve({data:null,error:null});
  h.login('alice');
  h.login('bob');
  await h.settle();
  assert.equal(h.api.snapshot().userId,'bob');
  verifyUI(h,false,false,'invite');
  slow.resolve({data:{user_id:'alice'},error:null});
  await h.settle();
  verifyUI(h,false,false,'invite');
});

test('later access checks win if an earlier lookup resolves last',async()=>{
  const h=fixture();
  const slow=deferred();
  let calls=0;
  h.responses.forum_pilot_members=()=>++calls===1
    ?slow.promise:Promise.resolve({data:null,error:null});
  h.login('alice');
  await h.api.refreshPilotAccess('alice');
  verifyUI(h,false,false,'invite');
  slow.resolve({data:{user_id:'alice'},error:null});
  await h.settle();
  verifyUI(h,false,false,'invite');
});
