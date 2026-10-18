/* MY DNCH v0.2 — portable browser-only JSON backup.
   Fixed allowlist: no authentication, wallets, API keys, tokens or unrelated storage.
   Imported data is checked before a separate, explicit confirmation action. */
(()=>{
'use strict';
const bg=document.documentElement.lang==='bg';
const T=bg?{
 ready:'Архивът е подготвен за изтегляне. Пази файла на сигурно място.',
 fileError:'Избери JSON файл от MY DNCH (максимум 64 KB).',
 invalid:'Невалиден или несъвместим DNCH архив. Нищо не е променено.',
 localError:'Не мога да прочета настоящите запазени данни. Нищо не е променено.',
 saveError:'Не успях да запазя архива. Възможно е браузърът да ограничава локалното хранилище.',
 changed:'Данните в браузъра се промениха след прегледа. Избери файла отново.',
 reviewed:'Проверен архив',mergeNote:'При обединяване наличните елементи се запазват; дублираните се пропускат. Ако се достигне лимит, част от новите записи няма да се добавят.',
 ideas:'Идеи',days:'Дни с предизвикателства',music:'YouTube песни',topics:'Форум теми',name:'Лично име',
 local:'Сега',incoming:'Във файла',result:'След обединяване',
 done:'Архивът е възстановен успешно. Личното табло е обновено.',
 canceled:'Възстановяването е отменено. Нищо не е променено.',
 nameRetained:'При вече зададено име в браузъра то се запазва.'
}:{
 ready:'Your backup was prepared for download. Keep the file somewhere safe.',
 fileError:'Choose a MY DNCH JSON file (maximum 64 KB).',
 invalid:'Invalid or incompatible DNCH backup. Nothing has changed.',
 localError:'Unable to read your existing saved items. Nothing has changed.',
 saveError:'Could not save the backup. The browser may be blocking local storage.',
 changed:'Your browser data changed after the preview. Please choose the file again.',
 reviewed:'Verified backup',mergeNote:'Merging preserves existing items and skips duplicates. If a list is full, some incoming items will not be added.',
 ideas:'Ideas',days:'Challenge days',music:'YouTube songs',topics:'Forum topics',name:'Local name',
 local:'Now',incoming:'In file',result:'After merge',
 done:'Backup successfully restored. Your dashboard has been refreshed.',
 canceled:'Restore canceled. Nothing has changed.',
 nameRetained:'If a local name is already set, the existing name is kept.'
};
const $=id=>document.getElementById(id);
const format='dnch-my-backup',version=1,maxBytes=65536;
const keys=Object.freeze({
 ideas:'dnch-today-favorites-v1',challengeDays:'dnch-today-challenge-days-v1',
 music:'dnch-radio-personal-v1',forumTopics:'dnch-forum-saved-topics-v1',
 nickname:'my-dnch-local-alias-v1'
});
const ideaIds=new Set([
 'sec01','sec02','sec03','sec04','tech01','tech02','tech03','tech04',
 'nature01','nature02','nature03','nature04','creative01','creative02','creative03','creative04',
 'science01','science02','science03','science04','people01','people02','people03','people04'
]);
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const yt=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{11}$/.test(v);
const isoDay=v=>{
 if(typeof v!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(v))return false;
 const [y,m,d]=v.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));
 return date.getUTCFullYear()===y&&date.getUTCMonth()+1===m&&date.getUTCDate()===d;
};
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function validateArray(list,limit,predicate){
 if(!Array.isArray(list)||list.length>limit)throw Error('Invalid list');
 const unique=new Set();
 return list.filter(item=>{
  if(!predicate(item))throw Error('Invalid item');
  const id=typeof item==='string'?item:item.id;
  if(unique.has(id))return false;
  unique.add(id);return true;
 });
}
function normalize(input){
 if(!plain(input))throw Error('Invalid backup data');
 const needed=['ideas','challengeDays','music','forumTopics','nickname'];
 if(needed.some(k=>!own(input,k))||Object.keys(input).some(k=>!needed.includes(k)))throw Error('Unexpected data fields');
 const ideas=validateArray(input.ideas,24,id=>ideaIds.has(id));
 const challengeDays=validateArray(input.challengeDays,90,isoDay);
 const music=validateArray(input.music,20,item=>plain(item)&&yt(item.id)&&
  typeof item.title==='string'&&item.title.trim().length>0&&item.title.length<=80&&
  Object.keys(item).every(key=>key==='id'||key==='title')).map(x=>({id:x.id,title:x.title.trim()}));
 const forumTopics=validateArray(input.forumTopics,100,uuid);
 if(typeof input.nickname!=='string'||input.nickname.length>32||/[\u0000-\u001f\u007f]/.test(input.nickname))throw Error('Invalid nickname');
 const nickname=input.nickname.trim();
 return {ideas,challengeDays,music,forumTopics,nickname};
}
function readCurrent(){
 const data={};
 for(const type of ['ideas','challengeDays','music','forumTopics']){
  const raw=localStorage.getItem(keys[type]);
  data[type]=raw===null?[]:JSON.parse(raw);
 }
 data.nickname=localStorage.getItem(keys.nickname)||'';
 return normalize(data);
}
function count(data){return {
 ideas:data.ideas.length,challengeDays:data.challengeDays.length,
 music:data.music.length,forumTopics:data.forumTopics.length,nickname:data.nickname?1:0
}}
function merge(local,incoming){
 const combine=(a,b,limit,idOf)=>{
  const ids=new Set(a.map(idOf));const arr=[...a];
  for(const item of b){const id=idOf(item);if(!ids.has(id)&&arr.length<limit){ids.add(id);arr.push(item)}}
  return arr;
 };
 return {
  ideas:combine(local.ideas,incoming.ideas,24,x=>x),
  challengeDays:combine(local.challengeDays,incoming.challengeDays,90,x=>x).sort().slice(-90),
  music:combine(local.music,incoming.music,20,x=>x.id),
  forumTopics:combine(local.forumTopics,incoming.forumTopics,100,x=>x),
  nickname:local.nickname||incoming.nickname
 };
}
function status(message){$('my-backup-status').textContent=message}
function clearPreview(){
 pending=null;previewSnapshot=null;fileToken++;
 $('my-backup-preview').hidden=true;
 $('my-backup-summary').textContent='';
 $('my-backup-counts').replaceChildren();
 $('my-backup-input').value='';
}
function renderPreview(imported,local){
 const projected=merge(local,imported);
 $('my-backup-summary').textContent=T.reviewed+' · '+T.mergeNote+' '+T.nameRetained;
 const cols=[['ideas',T.ideas],['challengeDays',T.days],['music',T.music],['forumTopics',T.topics],['nickname',T.name]];
 const table=document.createElement('table');table.className='my-backup-table';
 const head=document.createElement('thead'),tr=document.createElement('tr');
 for(const h of ['',T.local,T.incoming,T.result]){const th=document.createElement('th');th.textContent=h;tr.appendChild(th)}
 head.appendChild(tr);table.appendChild(head);
 const body=document.createElement('tbody');
 const localCounts=count(local),incomingCounts=count(imported),resultCounts=count(projected);
 for(const [key,label] of cols){
  const row=document.createElement('tr');
  for(const value of [label,localCounts[key],incomingCounts[key],resultCounts[key]]){
   const cell=document.createElement('td');cell.textContent=String(value);row.appendChild(cell);
  }
  body.appendChild(row);
 }
 table.appendChild(body);$('my-backup-counts').replaceChildren(table);
 $('my-backup-preview').hidden=false;
}
let pending=null,previewSnapshot=null,fileToken=0;
$('my-backup-export').addEventListener('click',()=>{
 try{
  const data=readCurrent();
  const payload={format,version,exportedAt:new Date().toISOString(),data};
  const blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download='dnch-my-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.style.display='none';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
  status(T.ready);
 }catch(e){console.warn('MY DNCH export failed',e);status(T.localError)}
});
$('my-backup-input').addEventListener('change',async()=>{
 pending=null;previewSnapshot=null;$('my-backup-preview').hidden=true;status('');
 const token=++fileToken;
 const file=$('my-backup-input').files?.[0];
 if(!file)return;
 if(file.size<=0||file.size>maxBytes){status(T.fileError);$('my-backup-input').value='';return}
 try{
  const source=JSON.parse(await file.text());
  if(token!==fileToken)return;
  if(!plain(source)||source.format!==format||source.version!==version||
     typeof source.exportedAt!=='string'||Number.isNaN(Date.parse(source.exportedAt))||
     Object.keys(source).some(k=>!['format','version','exportedAt','data'].includes(k)))
   throw Error('Unknown backup format');
  const imported=normalize(source.data);
  const local=readCurrent();
  pending=imported;previewSnapshot=JSON.stringify(local);
  renderPreview(imported,local);
 }catch(e){
  if(token!==fileToken)return;
  console.warn('MY DNCH backup verification failed',e);
  status(T.invalid);$('my-backup-input').value='';$('my-backup-preview').hidden=true;
 }
});
$('my-backup-cancel').addEventListener('click',()=>{clearPreview();status(T.canceled)});
$('my-backup-confirm').addEventListener('click',()=>{
 if(!pending||previewSnapshot===null)return;
 let local;
 try{local=readCurrent()}catch(e){status(T.localError);clearPreview();return}
 if(JSON.stringify(local)!==previewSnapshot){clearPreview();status(T.changed);return}
 const next=merge(local,pending);
 const snapshot=new Map();
 try{
  for(const key of Object.values(keys))snapshot.set(key,localStorage.getItem(key));
  for(const type of ['ideas','challengeDays','music','forumTopics']){
   localStorage.setItem(keys[type],JSON.stringify(next[type]));
  }
  if(next.nickname)localStorage.setItem(keys.nickname,next.nickname);
  else localStorage.removeItem(keys.nickname);
 }catch(e){
  // localStorage is not transactional. Restore snapshots on a failed write.
  let rollbackFailed=false;
  for(const [key,value] of snapshot){
   try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}
   catch(err){rollbackFailed=true;console.warn('Backup rollback issue',err)}
  }
  console.warn('MY DNCH restore failed',e,rollbackFailed?'Rollback incomplete':'');
  clearPreview();status(T.saveError);return;
 }
 clearPreview();status(T.done);
 window.dispatchEvent(new Event('my-dnch-data-updated'));
});
})();