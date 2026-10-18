/* DNCH ID v1.0 — closed pilot. Explicit opt-in cloud upload/restore only.
   Never use a service_role key in the browser. Supabase RLS is the access boundary.
   No automatic sync or account creation from this page. */
(async()=>{
'use strict';
const bg=document.documentElement.lang==='bg';
const T=bg?{
 guest:'Влез с одобрен тестов акаунт през форума, след което се върни тук.',
 server:'DNCH ID временно не може да се свърже. Локалните функции продължават да работят.',
 ineligible:'Този акаунт не е включен в затворения DNCH ID пилот. Няма достъп до облачни записи.',
 ready:'Облачният профил е защитен и готов за тест.',
 empty:'Още няма облачно копие.',exists:'Има запазено облачно копие.',noCloud:'Няма облачно копие за възстановяване.',
 needData:'Настоящите данни в браузъра са повредени или невалидни. Нищо не е променено.',
 invalidCloud:'Облачните данни са невалидни. Възстановяването е спряно.',
 saving:'Запазвам облачното копие…',restoring:'Възстановявам локалните данни…',
 saveNotice:'Това ще замени старото облачно копие с текущите данни от този браузър. Старият облачен вариант няма да бъде възстановим. Продължи само ако това искаш.',
 restoreNotice:'Това ще обедини облачните данни с локалните. Наличните любими елементи няма да се изтрият. При достигнат лимит новите елементи могат да бъдат пропуснати.',
 saved:'Облачното копие е запазено. Другото устройство може да го възстанови след вход със същия акаунт.',
 restored:'Облачните данни са обединени в този браузър. Таблото е обновено.',
 canceled:'Действието е отменено.',
 changed:'Данните са променени след прегледа. Направи нов преглед, преди да потвърдиш.',
 failed:'Операцията не успя. Нищо не е потвърдено; провери връзката и опитай отново.',
 deleteQuestion:'Да изтрия ли окончателно облачното DNCH копие? Запазеното в този браузър няма да се промени.',
 deleted:'Облачното копие е изтрито. Локалните данни са запазени.',
 local:'В браузъра',cloud:'В облака',result:'След действието',
 ideas:'Идеи',days:'Дни',music:'Песни',topics:'Теми',nickname:'Име'
}:{
 guest:'Sign in with an approved test account via the forum, then come back here.',
 server:'DNCH ID is temporarily unavailable. Your local features continue to work.',
 ineligible:'This account is not on the closed DNCH ID pilot allowlist. It cannot access cloud records.',
 ready:'Your pilot account has access to protected cloud storage.',
 empty:'No cloud copy has been saved yet.',exists:'A cloud copy is available.',noCloud:'No cloud copy exists to restore.',
 needData:'Current browser data is corrupted or invalid. Nothing has changed.',
 invalidCloud:'The cloud record is invalid. Restore has been blocked.',
 saving:'Saving your cloud copy…',restoring:'Restoring local data…',
 saveNotice:'This will replace your previous cloud copy with data from this browser. The previous cloud version cannot be restored. Continue only if this is what you want.',
 restoreNotice:'This merges cloud data with this browser. Existing favorites will not be removed. Incoming items may be skipped if the list is full.',
 saved:'Cloud copy saved. Another device can restore it after signing in with the same account.',
 restored:'Cloud data merged into this browser. Dashboard refreshed.',
 canceled:'Action canceled.',
 changed:'Data changed after the preview. Review it again before confirming.',
 failed:'The operation failed. Nothing has been confirmed; check your connection and try again.',
 deleteQuestion:'Permanently delete your DNCH cloud copy? Browser-only items will remain unchanged.',
 deleted:'Cloud copy deleted. Your local items remain.',
 local:'In browser',cloud:'In cloud',result:'After action',
 ideas:'Ideas',days:'Challenge days',music:'Songs',topics:'Topics',nickname:'Name'
};
const $=id=>document.getElementById(id);
const store=Object.freeze({
 ideas:'dnch-today-favorites-v1',challengeDays:'dnch-today-challenge-days-v1',
 music:'dnch-radio-personal-v1',forumTopics:'dnch-forum-saved-topics-v1',
 nickname:'my-dnch-local-alias-v1'
});
const IDs=new Set([
 'sec01','sec02','sec03','sec04','tech01','tech02','tech03','tech04',
 'nature01','nature02','nature03','nature04','creative01','creative02','creative03','creative04',
 'science01','science02','science03','science04','people01','people02','people03','people04'
]);
const okUuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const okYoutube=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{11}$/.test(v);
const okDate=v=>{
 if(typeof v!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(v))return false;
 const [y,m,d]=v.split('-').map(Number),o=new Date(Date.UTC(y,m-1,d));
 return o.getUTCFullYear()===y&&o.getUTCMonth()===m-1&&o.getUTCDate()===d;
};
function validateArray(a,max,valid,key=x=>x){
 if(!Array.isArray(a)||a.length>max)throw Error('Invalid collection');
 const output=[],unique=new Set();
 for(const item of a){
  if(!valid(item))throw Error('Invalid collection item');
  const id=key(item);if(unique.has(id))continue;
  unique.add(id);output.push(item);
 }
 return output;
}
function normalize(obj){
 if(!obj||typeof obj!=='object'||Array.isArray(obj)||
    Object.keys(obj).sort().join(',')!=='challengeDays,forumTopics,ideas,music,nickname')
  throw Error('Bad record');
 const ideas=validateArray(obj.ideas,24,x=>IDs.has(x));
 const challengeDays=validateArray(obj.challengeDays,90,okDate);
 const music=validateArray(obj.music,20,x=>x&&typeof x==='object'&&!Array.isArray(x)
  &&Object.keys(x).every(k=>k==='id'||k==='title')
  &&okYoutube(x.id)&&typeof x.title==='string'&&x.title.trim().length>0&&x.title.length<=80,
  x=>x.id).map(x=>({id:x.id,title:x.title.trim()}));
 const forumTopics=validateArray(obj.forumTopics,100,okUuid);
 if(typeof obj.nickname!=='string'||obj.nickname.length>32||
    /[\u0000-\u001f\u007f]/.test(obj.nickname))throw Error('Bad alias');
 return {ideas,challengeDays,music,forumTopics,nickname:obj.nickname.trim()};
}
function readLocal(){
 const data={};
 for(const k of ['ideas','challengeDays','music','forumTopics']){
  const value=localStorage.getItem(store[k]);
  data[k]=value===null?[]:JSON.parse(value);
 }
 data.nickname=localStorage.getItem(store.nickname)||'';
 return normalize(data);
}
const merge=(local,cloud)=>{
 const join=(a,b,max,idOf)=>{
  const result=a.slice(),seen=new Set(a.map(idOf));
  for(const item of b){const id=idOf(item);if(!seen.has(id)&&result.length<max){result.push(item);seen.add(id)}}
  return result;
 };
 return {
  ideas:join(local.ideas,cloud.ideas,24,x=>x),
  challengeDays:join(local.challengeDays,cloud.challengeDays,90,x=>x).sort().slice(-90),
  music:join(local.music,cloud.music,20,x=>x.id),
  forumTopics:join(local.forumTopics,cloud.forumTopics,100,x=>x),
  nickname:local.nickname||cloud.nickname
 };
};
const counts=data=>({
 ideas:data?.ideas?.length||0,challengeDays:data?.challengeDays?.length||0,
 music:data?.music?.length||0,forumTopics:data?.forumTopics?.length||0,
 nickname:data?.nickname?1:0
});
const setStatus=s=>{$('dnch-account-status').textContent=s};
const guest=$('dnch-account-guest'),member=$('dnch-account-member');
let client=null,user=null,cloudRow=null,allowed=false,pending=null;
function resetPreview(){
 pending=null;$('dnch-account-preview').hidden=true;
 $('dnch-account-preview-counts').replaceChildren();
}
function showPreview(kind,local,cloud){
 const next=kind==='restore'?merge(local,cloud):local;
 const heads=['',T.local,T.cloud,T.result];
 const table=document.createElement('table');table.className='my-backup-table';
 const thead=document.createElement('thead'),hrow=document.createElement('tr');
 for(const title of heads){const th=document.createElement('th');th.textContent=title;hrow.appendChild(th)}
 thead.appendChild(hrow);table.appendChild(thead);
 const tbody=document.createElement('tbody'),a=counts(local),b=counts(cloud),c=counts(next);
 for(const [key,label] of [['ideas',T.ideas],['challengeDays',T.days],['music',T.music],['forumTopics',T.topics],['nickname',T.nickname]]){
  const tr=document.createElement('tr');
  for(const val of [label,a[key],b[key],c[key]]){const td=document.createElement('td');td.textContent=String(val);tr.appendChild(td)}
  tbody.appendChild(tr);
 }
 table.appendChild(tbody);
 $('dnch-account-preview-counts').replaceChildren(table);
 $('dnch-account-preview-message').textContent=kind==='restore'?T.restoreNotice:T.saveNotice;
 $('dnch-account-preview').hidden=false;
}
function cloudState(){
 $('dnch-account-cloud-state').textContent=cloudRow?T.exists:T.empty;
 $('dnch-account-restore').disabled=!cloudRow;
 $('dnch-account-delete').disabled=!cloudRow;
}
async function readCloud(uid){
 const {data,error}=await client.from('dnch_account_data')
  .select('data,updated_at').eq('user_id',uid).maybeSingle();
 if(error)throw error;
 if(!data)return null;
 return {data:normalize(data.data),updated_at:data.updated_at};
}
async function refreshAccount(){
 resetPreview();
 if(!client)return;
 const {data,error}=await client.auth.getUser();
 if(error||!data?.user){
  user=null;cloudRow=null;allowed=false;guest.hidden=false;member.hidden=true;setStatus(T.guest);return;
 }
 user=data.user;guest.hidden=true;member.hidden=true;
 const uid=user.id;
 try{
  const {data:pilot,error:pilotError}=await client.from('dnch_account_pilot_members')
   .select('user_id').eq('user_id',uid).maybeSingle();
  if(pilotError)throw pilotError;
  allowed=!!pilot;
  if(!allowed){setStatus(T.ineligible);return}
  const cloud=await readCloud(uid);
  if(user?.id!==uid)return;
  cloudRow=cloud;member.hidden=false;
  $('dnch-account-identity').textContent=user.email||uid.slice(0,8);
  cloudState();setStatus(T.ready);
 }catch(e){console.warn('DNCH ID error',e);setStatus(T.server)}
}
async function begin(kind){
 resetPreview();
 if(!allowed||!user||!client)return;
 let local;
 try{local=readLocal()}catch(e){setStatus(T.needData);return}
 try{
  const latest=await readCloud(user.id);
  if(kind==='restore'&&!latest){cloudRow=null;cloudState();setStatus(T.noCloud);return}
  cloudRow=latest;cloudState();
  pending={kind,uid:user.id,local:JSON.stringify(local),
   cloudVersion:latest?.updated_at||null,
   cloudContent:latest?JSON.stringify(latest.data):null,
   incoming:latest?.data||null};
  showPreview(kind,local,latest?.data||{ideas:[],challengeDays:[],music:[],forumTopics:[],nickname:''});
  setStatus(T.ready);
 }catch(e){console.warn('DNCH ID preview error',e);setStatus(T.failed)}
}
$('dnch-account-save').addEventListener('click',()=>begin('save'));
$('dnch-account-restore').addEventListener('click',()=>begin('restore'));
$('dnch-account-cancel').addEventListener('click',()=>{resetPreview();setStatus(T.canceled)});
$('dnch-account-confirm').addEventListener('click',async()=>{
 if(!pending||!allowed||!user||pending.uid!==user.id)return;
 const job=pending;resetPreview();
 $('dnch-account-confirm').disabled=true;
 try{
  const {data:authInfo,error:authError}=await client.auth.getUser();
  if(authError||authInfo?.user?.id!==job.uid)throw Error('Sign-in changed');
  const local=readLocal();
  if(JSON.stringify(local)!==job.local){setStatus(T.changed);return}
  const fresh=await readCloud(job.uid);
  if((fresh?.updated_at||null)!==job.cloudVersion||
     (fresh?JSON.stringify(fresh.data):null)!==job.cloudContent){setStatus(T.changed);return}
  if(job.kind==='save'){
   setStatus(T.saving);
   if(fresh){
    const {data,error}=await client.from('dnch_account_data')
     .update({data:local,updated_at:new Date().toISOString()})
     .eq('user_id',job.uid).eq('updated_at',job.cloudVersion)
     .select('updated_at').maybeSingle();
    if(error||!data)throw error||new Error('Cloud update conflict');
   }else{
    const {error}=await client.from('dnch_account_data')
     .insert({user_id:job.uid,data:local});
    if(error)throw error;
   }
   cloudRow=await readCloud(job.uid);cloudState();setStatus(T.saved);
  }else{
   setStatus(T.restoring);
   const combined=merge(local,fresh.data);
   const snapshot=new Map();
   for(const key of Object.values(store))snapshot.set(key,localStorage.getItem(key));
   try{
    for(const k of ['ideas','challengeDays','music','forumTopics'])
     localStorage.setItem(store[k],JSON.stringify(combined[k]));
    if(combined.nickname)localStorage.setItem(store.nickname,combined.nickname);
    else localStorage.removeItem(store.nickname);
   }catch(e){
    for(const [key,value] of snapshot){
     try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}
     catch(rollbackError){console.warn('DNCH ID local rollback could not finish',rollbackError)}
    }
    throw e;
   }
   window.dispatchEvent(new Event('my-dnch-data-updated'));setStatus(T.restored);
  }
 }catch(e){console.warn('DNCH ID operation failed',e);setStatus(T.failed)}
 finally{$('dnch-account-confirm').disabled=false}
});
$('dnch-account-delete').addEventListener('click',async()=>{
 if(!allowed||!user||!cloudRow||!window.confirm(T.deleteQuestion))return;
 resetPreview();
 try{
  const uid=user.id;
  const {data:verified,error:authError}=await client.auth.getUser();
  if(authError||verified?.user?.id!==uid)throw Error('Sign-in changed');
  const {data:deleted,error}=await client.from('dnch_account_data').delete()
   .eq('user_id',uid).eq('updated_at',cloudRow.updated_at)
   .select('user_id').maybeSingle();
  if(error||!deleted)throw error||new Error('Cloud version changed before delete');
  cloudRow=null;cloudState();setStatus(T.deleted);
 }catch(e){console.warn('DNCH ID delete error',e);setStatus(T.failed)}
});
const config=window.DNCH_FORUM_CONFIG;
if(!config||!/^https:\/\/[a-z0-9.-]+$/i.test(config.url||'')||
 !/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey||'')){
 setStatus(T.server);return;
}
try{
 const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
 client=mod.createClient(config.url,config.publishableKey,{
  auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}
 });
 client.auth.onAuthStateChange((event)=>{
  if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='USER_UPDATED')
   setTimeout(refreshAccount,0);
 });
 await refreshAccount();
}catch(e){console.warn('DNCH ID SDK unavailable',e);setStatus(T.server)}
})();
