/* DNCH Admin v0.7 — no privileged secrets in the browser.
   Supabase RLS authorizes every read/write. This UI cannot assign admins. */
(async()=>{'use strict';
const bg=document.documentElement.lang==='bg';
const T=bg?{
 denied:'Нямаш администраторски достъп. Влез с потвърдения акаунт на собственика.',
 error:'Възникна грешка. Опитай отново.',loading:'Зареждане…',empty:'Няма записи.',
 reportTopic:'Сигнал за тема',reportReply:'Сигнал за отговор',reason:'Причина',
 author:'Автор',from:'Подател',created:'Създадена',visible:'Видима',hidden:'Скрита',locked:'Заключена',
 reviewed:'Разгледай',dismiss:'Отхвърли',open:'Нов сигнал',reviewedLabel:'Прегледан',dismissedLabel:'Отхвърлен',
 hide:'Скрий',show:'Покажи',lock:'Заключи',unlock:'Отключи',
 block:'Спри публикуването',unblock:'Разреши публикуване',blocked:'Ограничен',active:'Активен',admin:'Администратор',
 reportLink:'Към темата',confirmHide:'Сигурен ли си, че искаш да скриеш публикацията?',confirmBlock:'Да ограничим ли публикуването от този профил?',
 blockReason:'Причина за ограничението (5–300 символа):',mustReason:'Необходима е причина между 5 и 300 символа.',
 confirmUnblock:'Да разрешим ли отново публикуването?',saved:'Промяната е запазена.',date:'bg-BG'
}:{
 denied:'Administrator access required. Sign in with the verified project owner account.',
 error:'Something went wrong. Please try again.',loading:'Loading…',empty:'No records yet.',
 reportTopic:'Topic report',reportReply:'Reply report',reason:'Reason',
 author:'Author',from:'Reported by',created:'Created',visible:'Visible',hidden:'Hidden',locked:'Locked',
 reviewed:'Mark reviewed',dismiss:'Dismiss',open:'Open report',reviewedLabel:'Reviewed',dismissedLabel:'Dismissed',
 hide:'Hide',show:'Restore',lock:'Lock',unlock:'Unlock',
 block:'Restrict posting',unblock:'Restore posting',blocked:'Restricted',active:'Active',admin:'Administrator',
 reportLink:'Open topic',confirmHide:'Hide this post from the community?',confirmBlock:'Restrict this member from publishing?',
 blockReason:'Reason for restriction (5–300 characters):',mustReason:'A reason between 5 and 300 characters is required.',
 confirmUnblock:'Allow this member to publish again?',saved:'Change saved.',date:'en-GB'
};
const $=id=>document.getElementById(id);
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e};
const cfg=window.DNCH_FORUM_CONFIG||{};
const locked=$('admin-locked'),panel=$('admin-panel');
function deny(s){const strong=locked.querySelector('strong');if(strong)strong.textContent=s||T.denied;locked.hidden=false;panel.hidden=true}
if(!/^https:\/\/[^/]+\.supabase\.co$/.test(cfg.url||'')||typeof cfg.publishableKey!=='string'||!cfg.publishableKey.startsWith('sb_publishable_')){deny(T.error);return}
let client;
try{const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
 client=mod.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}
catch(e){deny(T.error);console.warn('SDK unavailable',e);return}
let currentUser=null,view='reports',cache={};
function msg(t){$('admin-status').textContent=t||''}
function safeDate(v){const date=new Date(v);return Number.isNaN(+date)?'':new Intl.DateTimeFormat(T.date,{dateStyle:'medium',timeStyle:'short'}).format(date)}
function button(label,fn,secondary=false){const b=make('button',secondary?'btn':'btn primary',label);b.type='button';b.addEventListener('click',async()=>{b.disabled=true;try{await fn()}catch(e){console.warn('Admin action failed',e);msg(T.error)}finally{b.disabled=false}});return b}
function actions(...items){const row=make('div','admin-actions');for(const b of items)row.appendChild(b);return row}
function card(title,description){const c=make('article','admin-card');c.appendChild(make('h3',null,title));if(description)c.appendChild(make('p','admin-description',description));return c}
function spanLine(key,value){const row=make('div','admin-line');row.append(make('strong',null,key+': '),make('span',null,value));return row}
function getName(id){return cache.names.get(id)||('Member-'+String(id||'').slice(0,6))}
function categoryName(id){const c=cache.categories.get(id);return c?(bg?c.title_bg:c.title_en):''}
function topicAddress(id){const prefix=bg?'bg/':'';return 'https://dnchcoin.github.io/dnch-coin/'+prefix+'forum.html?pilot=1#topic='+id}
async function write(table,id,column,value){
 if(!currentUser)throw Error('Not authenticated');
 msg(T.loading);
 const {data,error}=await client.from(table).update({[column]:value}).eq('id',id).select('id').maybeSingle();
 if(error||!data)throw Error(error?.message||'Update was not authorized');
 await refresh();msg(T.saved);
}
async function updateFlag(table,entry,key,hide){
 if(hide&&!window.confirm(T.confirmHide))return;
 await write(table,entry.id,key,hide);
}
function reportCard(report){
 const isTopic=!!report.thread_id,related=isTopic?cache.topics.get(report.thread_id):cache.replies.get(report.reply_id);
 const type=isTopic?T.reportTopic:T.reportReply;
 const heading=(related&&isTopic?related.title:type)+' · '+(report.status==='open'?T.open:(report.status==='reviewed'?T.reviewedLabel:T.dismissedLabel));
 const c=card(heading,report.reason);
 c.append(spanLine(T.from,getName(report.reporter_id)),spanLine(T.created,safeDate(report.created_at)));
 if(related){c.appendChild(spanLine(T.author,getName(related.author_id)));if(!isTopic)c.appendChild(make('p','admin-excerpt',related.body.slice(0,350)))}
 const row=actions();
 if(report.status!=='reviewed')row.appendChild(button(T.reviewed,()=>write('forum_reports',report.id,'status','reviewed'),true));
 if(report.status!=='dismissed')row.appendChild(button(T.dismiss,()=>write('forum_reports',report.id,'status','dismissed'),true));
 if(related)row.appendChild(button(related.is_hidden?T.show:T.hide,()=>updateFlag(isTopic?'forum_threads':'forum_replies',related,'is_hidden',!related.is_hidden),true));
 if(related){const tid=isTopic?report.thread_id:related.thread_id;const a=make('a','btn',T.reportLink);a.href=topicAddress(tid);row.appendChild(a)}
 c.appendChild(row);return c
}
function topicCard(t){
 const c=card(t.title,t.body);
 c.append(spanLine(T.author,getName(t.author_id)),spanLine(T.created,safeDate(t.created_at)),spanLine('Category',categoryName(t.category_id)));
 const flags=make('p','admin-flags',(t.is_hidden?T.hidden:T.visible)+' · '+(t.is_locked?T.locked:T.active));c.appendChild(flags);
 const a=make('a','btn',T.reportLink);a.href=topicAddress(t.id);
 c.appendChild(actions(
  button(t.is_hidden?T.show:T.hide,()=>updateFlag('forum_threads',t,'is_hidden',!t.is_hidden),true),
  button(t.is_locked?T.unlock:T.lock,()=>write('forum_threads',t.id,'is_locked',!t.is_locked),true),
  a));return c
}
async function setMemberBlock(member,blocked){
 if(member.id===currentUser.id)return;
 let reason='Posting restored by moderator';
 if(blocked){
  if(!window.confirm(T.confirmBlock))return;
  const typed=window.prompt(T.blockReason);if(typed===null)return;
  reason=typed.trim();if(reason.length<5||reason.length>300){msg(T.mustReason);return}
 }else if(!window.confirm(T.confirmUnblock))return;
 msg(T.loading);
 const record=cache.blocks.get(member.id);
 let r;
 if(record)r=await client.from('forum_member_blocks').update({is_blocked:blocked,reason,updated_at:new Date().toISOString(),updated_by:currentUser.id}).eq('user_id',member.id).select('user_id').maybeSingle();
 else r=await client.from('forum_member_blocks').insert({user_id:member.id,is_blocked:blocked,reason,updated_by:currentUser.id}).select('user_id').maybeSingle();
 if(r.error||!r.data)throw Error(r.error?.message||'Unable to update member restrictions');
 await refresh();msg(T.saved)
}
function memberCard(m){
 const isAdmin=m.id===currentUser.id,restricted=!!cache.blocks.get(m.id)?.is_blocked;
 const c=card(getName(m.id),null);
 c.append(spanLine(T.created,safeDate(m.created_at)),spanLine('Status',isAdmin?T.admin:(restricted?T.blocked:T.active)));
 if(!isAdmin)c.appendChild(actions(button(restricted?T.unblock:T.block,()=>setMemberBlock(m,!restricted),true)));
 return c
}
function render(){
 const destinations={reports:$('admin-reports-list'),topics:$('admin-topics-list'),members:$('admin-members-list')};
 for(const [kind,element] of Object.entries(destinations)){
  element.replaceChildren();
  const values=kind==='reports'?cache.reportList:kind==='topics'?cache.topicList:cache.memberList;
  if(!values.length)element.appendChild(make('p','forum-empty',T.empty));
  else for(const row of values)element.appendChild(kind==='reports'?reportCard(row):kind==='topics'?topicCard(row):memberCard(row));
 }
}
function switchView(next){view=next;for(const t of document.querySelectorAll('.admin-tab')){
 const selected=t.dataset.view===next;t.classList.toggle('active',selected);t.setAttribute('aria-pressed',selected?'true':'false')}
 for(const v of ['reports','topics','members'])$('admin-'+v).hidden=v!==next;
}
async function fetchRows(table,fields,limit=100){const {data,error}=await client.from(table).select(fields).limit(limit);if(error)throw Error(table+': '+error.message);return data||[]}
async function refresh(){
 msg(T.loading);
 const [reports,topics,replies,members,blocks,categories]=await Promise.all([
  fetchRows('forum_reports','id,thread_id,reply_id,reporter_id,reason,status,created_at'),
  fetchRows('forum_threads','id,author_id,category_id,title,body,is_hidden,is_locked,created_at'),
  fetchRows('forum_replies','id,thread_id,author_id,body,is_hidden,created_at'),
  fetchRows('forum_profiles','id,display_name,created_at'),
  fetchRows('forum_member_blocks','user_id,is_blocked,reason'),
  fetchRows('forum_categories','id,title_en,title_bg')
 ]);
 cache={
  reportList:reports.sort((a,b)=>(a.status==='open'?0:1)-(b.status==='open'?0:1)||Date.parse(b.created_at)-Date.parse(a.created_at)),
  topicList:topics.sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)),
  memberList:members.sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)),
  topics:new Map(topics.map(t=>[t.id,t])),
  replies:new Map(replies.map(t=>[t.id,t])),
  names:new Map(members.map(t=>[t.id,t.display_name])),
  categories:new Map(categories.map(t=>[t.id,t])),
  blocks:new Map(blocks.map(t=>[t.user_id,t]))
 };
 render();msg('')
}
for(const b of document.querySelectorAll('.admin-tab'))b.addEventListener('click',()=>switchView(b.dataset.view));
$('admin-refresh').addEventListener('click',()=>refresh().catch(e=>{console.warn(e);msg(T.error)}));
try{
 const {data:res,error:authError}=await client.auth.getUser();
 if(authError||!res?.user){deny(T.denied);return}
 const user=res.user;
 const {data:admin,error:roleError}=await client.from('forum_admins').select('user_id').eq('user_id',user.id).maybeSingle();
 if(roleError||!admin){deny(T.denied);return}
 currentUser=user;
 await refresh();locked.hidden=true;panel.hidden=false;switchView(view);
}catch(e){console.warn('Admin dashboard failed',e);deny(T.error)}
})();