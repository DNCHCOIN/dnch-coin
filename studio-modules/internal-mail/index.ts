import { createClient } from 'npm:@supabase/supabase-js@2.95.3';
const URL = Deno.env.get('SUPABASE_URL')!;
const admin = createClient(URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth:{persistSession:false,autoRefreshToken:false}});
const authClient = () => createClient(URL,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const origins = new Set(['https://dnchcoin.github.io','https://dnch-studio-preview.vercel.app']);
const hash = async (s:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const recovery = () => Array.from(crypto.getRandomValues(new Uint8Array(24))).map(x=>x.toString(16).padStart(2,'0')).join('');
const email = (u:string) => u+'@studio.dnch.invalid';
const uuid = (v:unknown) => typeof v==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
class ApiError extends Error { constructor(public status:number,message:string){super(message);} }
function check(r:any){if(r.error)throw new ApiError(503,'The service could not complete your request. Please retry.');return r.data;}
function username(v:unknown){const u=String(v||'').trim().toLowerCase().replace(/@dnch$/,'');if(!/^[a-z0-9][a-z0-9_]{2,23}$/.test(u))throw new ApiError(400,'Use 3–24 lowercase letters, numbers or underscores for your username.');return u;}
function password(v:unknown){if(typeof v!=='string'||v.length<12||v.length>128)throw new ApiError(400,'Choose a password of 12–128 characters.');return v;}
function text(v:unknown,max:number,required=false){if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new ApiError(400,'Please check the required fields and their length.');return v.trim();}
function session(s:any){return {access_token:s.access_token,refresh_token:s.refresh_token,expires_at:s.expires_at};}
function claimsOf(token:string){return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}
async function trackSession(s:any,userId:string){const id=claimsOf(s.access_token).session_id;if(!uuid(id))throw new ApiError(503,'Could not create session.');check(await admin.from('studio_sessions').insert({id,user_id:userId}));}
async function rate(key:string,limit:number,seconds:number){if(!check(await admin.rpc('studio_take_rate',{p_bucket:key,p_limit:limit,p_seconds:seconds})))throw new ApiError(429,'Too many requests. Please try again later.');}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
 if(origins.has(origin))headers['Access-Control-Allow-Origin']=origin;
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!origins.has(origin))return reply({error:'Origin not allowed.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Use POST.'},405);
 try{
  // Public identity routes require the project's public API key. All private actions validate the user with Auth.
  if(req.headers.get('apikey')!=='sb_publishable_G4Rf57u-Ty4ZIFxLS7H2lg_OY99dVKb')throw new ApiError(401,'Invalid application key.');
  const raw=await req.text();if(raw.length>100000)throw new ApiError(413,'Request is too large.');
  let b:any;try{b=JSON.parse(raw);}catch{throw new ApiError(400,'Invalid request.');}
  const ip=await hash(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown');
  const action=b.action;
  if(['register','login','recover','refresh'].includes(action)){
   await rate('ip:'+ip+':'+action,action==='register'?5:action==='recover'?8:40,900);
   if(action==='refresh'){
    const r=await authClient().auth.refreshSession({refresh_token:text(b.refresh_token,2048,true)});
    if(r.error||!r.data.session)throw new ApiError(401,'Please sign in again.');
    const p=check(await admin.from('studio_members').select('id,revoked_before').eq('id',r.data.user!.id).maybeSingle());
    if(!p)throw new ApiError(401,'Please sign in with a Studio account.');
    const active=check(await admin.from('studio_sessions').select('id').eq('id',claimsOf(r.data.session.access_token).session_id).eq('user_id',p.id).maybeSingle());if(!active)throw new ApiError(401,'Please sign in again.');
    return reply({session:session(r.data.session)});
   }
   const u=username(b.username),pw=password(b.password);
   if(action==='register'){
    if(['admin','administrator','support','postmaster','dnch','studio','system'].includes(u))throw new ApiError(400,'This username is reserved.');
    const name=text(b.display_name||u,60,true),code=recovery();
    const r=await admin.auth.admin.createUser({email:email(u),password:pw,email_confirm:true,app_metadata:{dnch_studio:true}});
    if(r.error||!r.data.user)throw new ApiError(409,'This username is unavailable, or registration could not be completed.');
    const p=await admin.from('studio_members').insert({id:r.data.user.id,username:u,display_name:name,recovery_hash:await hash(code)});
    if(p.error){await admin.auth.admin.deleteUser(r.data.user.id);throw new ApiError(503,'Registration failed. Please retry.');}
    const login=await authClient().auth.signInWithPassword({email:email(u),password:pw});
    if(login.error||!login.data.session)return reply({registered:true,recovery_code:code});
    await trackSession(login.data.session,r.data.user.id);
    return reply({session:session(login.data.session),recovery_code:code});
   }
   if(action==='recover'){
    const code=text(b.recovery_code,100,true);
    // Atomically consume the high-entropy recovery secret, preventing concurrent reuse.
    const p=check(await admin.from('studio_members').update({recovery_hash:null}).eq('username',u).eq('recovery_hash',await hash(code)).select('id').maybeSingle());
    if(!p)throw new ApiError(401,'Username or recovery code is incorrect.');
    const r=await admin.auth.admin.updateUserById(p.id,{password:pw});
    if(r.error){await admin.from('studio_members').update({recovery_hash:await hash(code)}).eq('id',p.id);throw new ApiError(503,'Recovery failed. Retry with the same code.');}
    check(await admin.from('studio_sessions').delete().eq('user_id',p.id));
    const next=recovery();check(await admin.from('studio_members').update({recovery_hash:await hash(next),revoked_before:Math.floor(Date.now()/1000)}).eq('id',p.id));
    await new Promise(r=>setTimeout(r,1100));
    return reply({recovery_code:next,recovered:true});
   }
   const r=await authClient().auth.signInWithPassword({email:email(u),password:pw});
   if(r.error||!r.data.session)throw new ApiError(401,'Username or password is incorrect.');
   const p=check(await admin.from('studio_members').select('id').eq('id',r.data.user.id).maybeSingle());
   if(!p)throw new ApiError(401,'This account is not registered with Studio.');
   await trackSession(r.data.session,r.data.user.id);
   return reply({session:session(r.data.session)});
  }
  const token=(req.headers.get('authorization')||'').replace(/^Bearer /i,'');
  const {data,error}=await admin.auth.getUser(token);
  if(error||!data.user)throw new ApiError(401,'Please sign in again.');
  const me=check(await admin.from('studio_members').select('id,username,display_name,revoked_before').eq('id',data.user.id).maybeSingle());
  if(!me)throw new ApiError(403,'Studio account required.');
  const claims=claimsOf(token);
  const active=check(await admin.from('studio_sessions').select('id').eq('id',claims.session_id).eq('user_id',me.id).maybeSingle());
  if(!active)throw new ApiError(401,'Please sign in again.');
  if(claims.iat<=me.revoked_before)throw new ApiError(401,'Your session has expired. Please sign in again.');
  await rate('user:'+me.id,180,60);
  if(action==='me')return reply({member:{username:me.username,display_name:me.display_name,address:me.username+'@dnch'}});
  if(action==='logout'){check(await admin.from('studio_sessions').delete().eq('id',claims.session_id).eq('user_id',me.id));await admin.auth.admin.signOut(token,'local');return reply({ok:true});}
  if(action==='directory'){
   const q=String(b.query||'').trim().toLowerCase().slice(0,24);
   if(q&&!/^[a-z0-9_]+$/.test(q))throw new ApiError(400,'Search using a DNCH username.');
   let query=admin.from('studio_members').select('username,display_name').order('username').limit(20);
   if(q)query=query.ilike('username',q+'%');
   return reply({members:check(await query)});
  }
  if(action==='list'){
   const offset=Math.max(0,Math.min(100000,Number(b.offset)||0));
   if(b.folder==='drafts')return reply({items:check(await admin.from('studio_drafts').select('*').eq('owner_id',me.id).order('updated_at',{ascending:false}).range(offset,offset+49))});
   const sent=b.folder==='sent';
   const items=check(await admin.from('studio_messages').select('id,subject,body,created_at,read_at,sender:studio_members!sender_id(username,display_name),recipient:studio_members!recipient_id(username,display_name)').eq(sent?'sender_id':'recipient_id',me.id).eq(sent?'sender_deleted':'recipient_deleted',false).order('created_at',{ascending:false}).range(offset,offset+49));
   const unread=await admin.from('studio_messages').select('id',{count:'exact',head:true}).eq('recipient_id',me.id).eq('recipient_deleted',false).is('read_at',null);
   if(unread.error)throw new ApiError(503,'Unable to read inbox.');
   return reply({items,unread:unread.count});
  }
  if(action==='send'){
   if(!uuid(b.request_id))throw new ApiError(400,'Missing message request ID.');
   const existing=check(await admin.from('studio_messages').select('id').eq('sender_id',me.id).eq('request_id',b.request_id).maybeSingle());
   if(existing)return reply(existing);
   await rate('send:'+me.id,30,3600);
   const rawRecipient=String(b.recipient||'').trim().toLowerCase();
   if(!/^[a-z0-9][a-z0-9_]{2,23}(@dnch)?$/.test(rawRecipient))throw new ApiError(400,'Choose a registered DNCH member or enter username@dnch. External email addresses are not supported.');
   const to=username(rawRecipient),subject=text(b.subject,160,true),body=text(b.body,20000,true);
   const recipient=check(await admin.from('studio_members').select('id').eq('username',to).maybeSingle());
   if(!recipient)throw new ApiError(404,'No registered DNCH member has this address.');
   const result=await admin.from('studio_messages').insert({sender_id:me.id,recipient_id:recipient.id,subject,body,request_id:b.request_id}).select('id').single();
   if(result.error?.code==='23505')return reply(check(await admin.from('studio_messages').select('id').eq('sender_id',me.id).eq('request_id',b.request_id).single()));
   return reply(check(result));
  }
  if(action==='read'||action==='delete'){
   if(!uuid(b.id))throw new ApiError(400,'Invalid message ID.');
   if(b.folder==='drafts'&&action==='delete'){check(await admin.from('studio_drafts').delete().eq('id',b.id).eq('owner_id',me.id));return reply({ok:true});}
   const sent=b.folder==='sent';if(action==='read'&&sent)return reply({ok:true});
   const patch=action==='read'?{read_at:new Date().toISOString()}:{[sent?'sender_deleted':'recipient_deleted']:true};
   const changed=check(await admin.from('studio_messages').update(patch).eq('id',b.id).eq(sent?'sender_id':'recipient_id',me.id).select('id').maybeSingle());
   if(!changed)throw new ApiError(404,'Message not found.');
   return reply({ok:true});
  }
  if(action==='save-draft'){
   const values={recipient:text(b.recipient||'',64),subject:text(b.subject||'',160),body:text(b.body||'',20000),updated_at:new Date().toISOString()};
   if(b.id){if(!uuid(b.id))throw new ApiError(400,'Invalid draft ID.');const d=check(await admin.from('studio_drafts').update(values).eq('id',b.id).eq('owner_id',me.id).select('id').maybeSingle());if(!d)throw new ApiError(404,'Draft not found.');return reply(d);}
   await rate('draft:'+me.id,100,3600);
   return reply(check(await admin.from('studio_drafts').insert({...values,owner_id:me.id}).select('id').single()));
  }
  throw new ApiError(400,'Unknown action.');
 }catch(e){if(e instanceof ApiError)return reply({error:e.message},e.status);console.error('studio-mail request failed');return reply({error:'Service temporarily unavailable. Please retry.'},503);}
});
