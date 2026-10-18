/* DNCH Radio v0.1 — YouTube embeds only, no audio-only/background stream.
   Loading a video requires a user action; own selections stay in localStorage.
   No paid API, external library, video scraping or auto-play. */
(()=>{
'use strict';
const bg=document.documentElement.lang==='bg';
const T=bg?{
 all:'Всички',pop:'Поп',rock:'Рок',dance:'Денс',chill:'Чил',mine:'Моите песни',
 play:'Избери видео',remove:'Премахни',added:'Песента е добавена в „Моите песни“.',removed:'Песента е премахната.',
 invalid:'Постави валиден линк към конкретно YouTube видео.',duplicate:'Това видео вече присъства в списъка.',
 limit:'Можеш да запазиш до 20 собствени песни.',storage:'Не можах да запазя песните. Провери настройките на браузъра.',
 defaultTitle:'Моята YouTube песен',empty:'В тази категория още няма песни. Добави своя!',
 from:'Твоя песен',selected:'Избрано',deleted:'Видео от твоя плейлист',
 nothing:'Избери песен от списъка, за да отвориш видеото.',date:'bg-BG'
}:{
 all:'All',pop:'Pop',rock:'Rock',dance:'Dance',chill:'Chill',mine:'My picks',
 play:'Select video',remove:'Remove',added:'Track added to My picks.',removed:'Track removed.',
 invalid:'Paste a valid link to a specific YouTube video.',duplicate:'This video is already listed.',
 limit:'You can save up to 20 personal tracks.',storage:'Could not save your picks. Check browser storage settings.',
 defaultTitle:'My YouTube track',empty:'No videos in this category yet. Add one!',
 from:'Your pick',selected:'Selected',deleted:'Video from your playlist',
 nothing:'Choose a track to load its video.',date:'en-GB'
};
const $=id=>document.getElementById(id);
const make=(tag,cls,label)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;if(label!==undefined)e.textContent=label;return e;
};
// Verified official artist videos. Playback availability is controlled by YouTube.
const curated=[
 {id:'TUVcZfQe-Kw',title:'Levitating',artist:'Dua Lipa (feat. DaBaby)',genre:'pop'},
 {id:'hTWKbfoikeg',title:'Smells Like Teen Spirit',artist:'Nirvana',genre:'rock'},
 {id:'4NRXx6U8ABQ',title:'Blinding Lights',artist:'The Weeknd',genre:'dance'},
 {id:'yKNxeF4KMsY',title:'Yellow',artist:'Coldplay',genre:'chill'}
];
const KEY='dnch-radio-personal-v1';
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{11}$/.test(value);
function readCustom(){
 try{
  const value=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(!Array.isArray(value))return [];
  const unique=new Set();
  return value.filter(item=>{
   if(!item||!validId(item.id)||typeof item.title!=='string'||item.title.length>80||unique.has(item.id)||curated.some(t=>t.id===item.id))return false;
   unique.add(item.id);return true;
  }).slice(0,20).map(x=>({id:x.id,title:x.title||T.defaultTitle,artist:T.from,genre:'mine'}));
 }catch{return []}
}
let custom=readCustom(),filter='all',currentId=null;
const genreValues=['all','pop','rock','dance','chill','mine'];
function tracks(){return filter==='all'?[...curated,...custom]:filter==='mine'?custom:curated.filter(t=>t.genre===filter)}
function clearVideo(){
 const shell=$('radio-frame-shell');
 shell.replaceChildren();
 const p=make('div','radio-placeholder');
 p.append(make('span','radio-glyph','♫'),make('p',null,T.nothing));
 shell.appendChild(p);
 $('radio-youtube-link').hidden=true;
 $('radio-selected-title').textContent='—';
 $('radio-selected-artist').textContent='';
 currentId=null;
}
function selectTrack(track){
 if(!track||!validId(track.id))return;
 currentId=track.id;
 const shell=$('radio-frame-shell');shell.replaceChildren();
 const iframe=document.createElement('iframe');
 // URL can contain ONLY validated 11-character YouTube video IDs.
 iframe.src='https://www.youtube-nocookie.com/embed/'+track.id+'?playsinline=1';
 iframe.title='YouTube — '+track.title;
 iframe.loading='eager';
 iframe.referrerPolicy='strict-origin-when-cross-origin';
 iframe.allow='accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
 iframe.allowFullscreen=true;
 iframe.setAttribute('allowfullscreen','');
 iframe.setAttribute('width','560');iframe.setAttribute('height','315');
 shell.appendChild(iframe);
 $('radio-selected-title').textContent=track.title;
 $('radio-selected-artist').textContent=track.artist;
 const link=$('radio-youtube-link');
 link.href='https://www.youtube.com/watch?v='+track.id;link.hidden=false;
 renderTracks();
}
function genreButtons(){
 const parent=$('radio-genres');parent.replaceChildren();
 for(const genre of genreValues){
  const btn=make('button','radio-genre',T[genre]);
  btn.type='button';btn.setAttribute('aria-pressed',String(genre===filter));
  if(genre===filter)btn.classList.add('active');
  btn.addEventListener('click',()=>{filter=genre;genreButtons();renderTracks()});
  parent.appendChild(btn);
 }
}
function renderTracks(){
 const choices=tracks(),list=$('radio-track-list');list.replaceChildren();
 $('radio-track-count').textContent=String(choices.length);
 if(!choices.length)list.appendChild(make('p','radio-empty',T.empty));
 for(const [idx,track] of choices.entries()){
  const row=make('div','radio-track'+(track.id===currentId?' is-selected':''));
  const btn=make('button','radio-track-play');
  btn.type='button';btn.setAttribute('aria-label',T.play+': '+track.title);
  if(track.id===currentId)btn.setAttribute('aria-current','true');
  const num=make('span','radio-track-index',String(idx+1).padStart(2,'0'));
  const labels=make('span','radio-track-labels');
  labels.append(make('strong',null,track.title),make('small',null,track.artist));
  btn.append(num,labels);
  btn.addEventListener('click',()=>selectTrack(track));
  row.appendChild(btn);
  if(track.genre==='mine'){
   const remove=make('button','radio-track-remove','×');
   remove.type='button';remove.title=T.remove;remove.setAttribute('aria-label',T.remove+': '+track.title);
   remove.addEventListener('click',()=>{
    custom=custom.filter(x=>x.id!==track.id);
    try{localStorage.setItem(KEY,JSON.stringify(custom.map(x=>({id:x.id,title:x.title}))))}
    catch(e){$('radio-form-status').textContent=T.storage}
    if(currentId===track.id)clearVideo();
    renderTracks();$('radio-form-status').textContent=T.removed;
   });row.appendChild(remove);
  }
  list.appendChild(row);
 }
 const has=choices.length>0;
 $('radio-prev').disabled=!has;$('radio-next').disabled=!has;$('radio-shuffle').disabled=!has;
}
function nav(delta){
 const list=tracks();if(!list.length)return;
 const i=list.findIndex(track=>track.id===currentId);
 const nextIndex=i===-1?(delta>0?0:list.length-1):(i+delta+list.length)%list.length;
 selectTrack(list[nextIndex]);
}
function extractId(value){
 const input=String(value||'').trim();
 if(validId(input))return input;
 try{
  const url=new URL(input);
  if(url.protocol!=='https:')return null;
  const host=url.hostname.toLowerCase();
  let id=null;
  if(host==='youtu.be')id=url.pathname.split('/')[1];
  else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(host)){
   if(url.pathname==='/watch')id=url.searchParams.get('v');
   else if(/^\/(shorts|live|embed)\/[A-Za-z0-9_-]{11}\/?$/.test(url.pathname))id=url.pathname.split('/')[2];
  }
  return validId(id)?id:null;
 }catch{return null}
}
$('radio-prev').addEventListener('click',()=>nav(-1));
$('radio-next').addEventListener('click',()=>nav(1));
$('radio-shuffle').addEventListener('click',()=>{
 const list=tracks();if(!list.length)return;
 const others=list.length>1?list.filter(x=>x.id!==currentId):list;
 selectTrack(others[Math.floor(Math.random()*others.length)]);
});
$('radio-add-form').addEventListener('submit',event=>{
 event.preventDefault();
 const status=$('radio-form-status'),videoId=extractId($('radio-add-url').value);
 if(!videoId){status.textContent=T.invalid;return}
 if([...curated,...custom].some(t=>t.id===videoId)){status.textContent=T.duplicate;return}
 if(custom.length>=20){status.textContent=T.limit;return}
 const title=$('radio-add-title').value.trim().slice(0,80)||T.defaultTitle;
 custom.push({id:videoId,title,artist:T.from,genre:'mine'});
 try{localStorage.setItem(KEY,JSON.stringify(custom.map(x=>({id:x.id,title:x.title}))))}
 catch(e){status.textContent=T.storage}
 $('radio-add-form').reset();
 filter='mine';genreButtons();renderTracks();status.textContent=T.added;
});
window.addEventListener('storage',event=>{
 if(event.key!==KEY)return;
 custom=readCustom();
 if(currentId&&!curated.some(t=>t.id===currentId)&&!custom.some(t=>t.id===currentId))clearVideo();
 renderTracks();
});
genreButtons();renderTracks();
})();
