/* MY DNCH v0.1 — read-only aggregation of existing local browser data.
   No accounts, blockchain actions, Supabase requests or new paid services.
   Do not assume this browser's bookmarks belong to an authenticated user. */
(()=>{
'use strict';
const bg=document.documentElement.lang==='bg';
const T=bg?{
 welcome:'Добре дошъл в MY DNCH',withName:'Добре дошъл, ',challengeDone:'Изпълнил си днешното предизвикателство ✓',challengeTodo:'Днешното предизвикателство те очаква',
 idea:'Идея',topic:'Запазена дискусия',read:'Отвори идея',topicOpen:'Отвори темата',youtube:'Отвори в YouTube',
 extra:'и още',saved:'запазени',nameError:'Името не можа да се запази в този браузър.',date:'bg-BG'
}:{
 welcome:'Welcome to MY DNCH',withName:'Welcome, ',challengeDone:'You completed today’s challenge ✓',challengeTodo:'Today’s challenge is waiting for you',
 idea:'Idea',topic:'Saved discussion',read:'Open idea',topicOpen:'Open discussion',youtube:'Open in YouTube',
 extra:'and',saved:'more saved',nameError:'Could not save your name in this browser.',date:'en-GB'
};
const IDEA_TITLES={"sec01":{"en":"A different password for each important account","bg":"Различна парола за всеки важен профил"},"sec02":{"en":"Give your accounts a second lock","bg":"Още една защита за профилите ти"},"sec03":{"en":"Review one app permission","bg":"Провери едно разрешение на приложение"},"sec04":{"en":"Check the address before you log in","bg":"Погледни адреса преди вход"},"tech01":{"en":"The backup you can actually restore","bg":"Архивът трябва и да се възстановява"},"tech02":{"en":"Make your phone easier to use","bg":"Направи телефона по-удобен"},"tech03":{"en":"Quiet one noisy notification","bg":"Спри едно досадно известие"},"tech04":{"en":"Name files so future-you can find them","bg":"Именувай файловете така, че да ги намираш"},"nature01":{"en":"Find a tiny patch of green","bg":"Открий малко зелено място"},"nature02":{"en":"Look up for a minute","bg":"Погледни небето за минута"},"nature03":{"en":"Listen for the small sounds","bg":"Чуй малките звуци"},"nature04":{"en":"A photo of the same place","bg":"Снимай едно и също място"},"creative01":{"en":"Take an unusual angle","bg":"Опитай необичаен ъгъл за снимка"},"creative02":{"en":"Write only two sentences","bg":"Напиши само две изречения"},"creative03":{"en":"Give an old idea a new use","bg":"Дай втори живот на стара идея"},"creative04":{"en":"Build a tiny playlist with a theme","bg":"Направи кратък тематичен плейлист"},"science01":{"en":"Watch how shadows move","bg":"Виж как се местят сенките"},"science02":{"en":"Ask one better question","bg":"Задай един по-точен въпрос"},"science03":{"en":"The Moon is worth noticing","bg":"Луната заслужава внимание"},"science04":{"en":"Trace a claim to its source","bg":"Проследи твърдението до източника"},"people01":{"en":"Pass on one useful trick","bg":"Сподели един полезен трик"},"people02":{"en":"Ask about someone's latest discovery","bg":"Попитай някого какво ново е открил"},"people03":{"en":"Say thanks for an invisible effort","bg":"Благодари за незабелязано усилие"},"people04":{"en":"One idea can start a community","bg":"Една идея може да създаде общност"}};
const $=id=>document.getElementById(id);
const localKeys=Object.freeze({
 ideas:'dnch-today-favorites-v1',
 days:'dnch-today-challenge-days-v1',
 music:'dnch-radio-personal-v1',
 forum:'dnch-forum-saved-topics-v1',
 name:'my-dnch-local-alias-v1'
});
const uuid=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const yt=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{11}$/.test(id);
const day=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
const localDay=value=>[value.getFullYear(),String(value.getMonth()+1).padStart(2,'0'),String(value.getDate()).padStart(2,'0')].join('-');
const make=(tag,cls,label)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(label!==undefined)e.textContent=label;return e};
function readArray(key){
 try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}
 catch(e){return []}
}
function readName(){
 try{return String(localStorage.getItem(localKeys.name)||'').trim().slice(0,32)}
 catch(e){return ''}
}
function safeArray(key,check,max){
 return [...new Set(readArray(key).filter(check))].slice(0,max)
}
function remainingNote(total,displayed){
 if(total<=displayed)return null;
 return make('p','my-more',bg?T.extra+' '+(total-displayed)+' '+T.saved:T.extra+' '+(total-displayed)+' '+T.saved)
}
function entry(title,href,action,external=false){
 const row=make('div','my-item');
 const label=make('span','my-item-title',title);
 const anchor=make('a','my-item-action',action+' →');
 anchor.href=href;
 if(external){anchor.target='_blank';anchor.rel='noopener noreferrer'}
 row.append(label,anchor);return row;
}
function render(){
 const name=readName();
 $('my-welcome').textContent=name?T.withName+name+'!':T.welcome;
 $('my-name-input').value=name;
 const now=new Date();
 $('my-current-date').textContent=new Intl.DateTimeFormat(T.date,{dateStyle:'full'}).format(now);
 const today=localDay(now);
 const completed=safeArray(localKeys.days,day,100);
 const lastWeek=Array.from({length:7},(_,i)=>localDay(new Date(now.getFullYear(),now.getMonth(),now.getDate()-i)));
 $('my-days').textContent=lastWeek.filter(k=>completed.includes(k)).length+'/7';
 $('my-challenge-check').textContent=completed.includes(today)?T.challengeDone:T.challengeTodo;
 $('my-challenge-check').classList.toggle('my-done',completed.includes(today));

 const ideas=safeArray(localKeys.ideas,id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(IDEA_TITLES,id),100);
 $('my-ideas-count').textContent=String(ideas.length);
 $('my-ideas-empty').hidden=ideas.length!==0;
 const ideaList=$('my-ideas-list');ideaList.replaceChildren();
 for(const id of ideas.slice(0,5)){
  ideaList.appendChild(entry(IDEA_TITLES[id][bg?'bg':'en'],'today.html#idea='+encodeURIComponent(id),T.read))
 }
 const ideaNote=remainingNote(ideas.length,5);if(ideaNote)ideaList.appendChild(ideaNote);

 const music=[],known=new Set();
 for(const item of readArray(localKeys.music)){
  if(!item||typeof item!=='object'||!yt(item.id)||known.has(item.id))continue;
  if(typeof item.title!=='string'||item.title.length>80)continue;
  known.add(item.id);
  music.push({id:item.id,title:item.title.trim()||'YouTube video'});
  if(music.length>=20)break;
 }
 $('my-music-count').textContent=String(music.length);
 $('my-music-empty').hidden=music.length!==0;
 const musicList=$('my-music-list');musicList.replaceChildren();
 for(const track of music.slice(0,5)){
  musicList.appendChild(entry(track.title,'https://www.youtube.com/watch?v='+track.id,T.youtube,true))
 }
 const musicNote=remainingNote(music.length,5);if(musicNote)musicList.appendChild(musicNote);

 const topics=safeArray(localKeys.forum,uuid,100);
 $('my-forum-count').textContent=String(topics.length);
 $('my-forum-empty').hidden=topics.length!==0;
 const forumList=$('my-forum-list');forumList.replaceChildren();
 for(const [i,id] of topics.slice(0,5).entries()){
  forumList.appendChild(entry(T.topic+' '+(i+1),'forum.html?pilot=1#topic='+encodeURIComponent(id),T.topicOpen))
 }
 const forumNote=remainingNote(topics.length,5);if(forumNote)forumList.appendChild(forumNote);
}
$('my-name-form').addEventListener('submit',event=>{
 event.preventDefault();
 const value=$('my-name-input').value.trim().slice(0,32);
 try{
  if(value)localStorage.setItem(localKeys.name,value);
  else localStorage.removeItem(localKeys.name);
  $('my-profile-status').textContent=value?$('my-profile-status').dataset.saved:$('my-profile-status').dataset.cleared;
  render();
 }catch(e){$('my-profile-status').textContent=T.nameError}
});
$('my-name-clear').addEventListener('click',()=>{
 try{
  localStorage.removeItem(localKeys.name);
  $('my-profile-status').textContent=$('my-profile-status').dataset.cleared;
  render();
 }catch(e){$('my-profile-status').textContent=T.nameError}
});
$('my-refresh').addEventListener('click',render);
window.addEventListener('focus',render);
window.addEventListener('storage',event=>{
 if(event.key===null||Object.values(localKeys).includes(event.key))render();
});
render();
})();
