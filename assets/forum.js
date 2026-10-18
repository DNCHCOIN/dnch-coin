/* DNCH Community pilot: Supabase browser UI. Requires a provisioned RLS database.
   The publishable key is not a secret; never expose a service-role key.
   User content is always inserted with textContent, never HTML. */
(async()=>{
'use strict';
const locale=document.documentElement.lang==='bg'?'bg':'en';
const bg=locale==='bg';
const T=bg?{
 all:'Всички теми',loading:'Зареждане...',error:'Възникна грешка. Опитай отново.',loginSent:'Провери пощата си за линк за вход. Ако няма писмо, провери и папка „Спам“.',logout:'Излезе от профила.',
 empty:'Все още няма теми в тази категория.',noReplies:'Все още няма отговори.',
 report:'Докладвай',reportPrompt:'Защо докладваш тази публикация? (10–500 символа)',reported:'Сигналът е изпратен за преглед. Благодарим!',invalid:'Опиши причината с поне 10 символа.',wait:'Изчакай малко и опитай отново.',
 created:'Темата е публикувана.',replied:'Отговорът е публикуван.',readonly:'Влез с имейл, за да участваш.',member:'Участник',date:'bg-BG',
 pilotFailed:'Пилотният сървър не е достъпен. Регистрациите и публикациите не работят.',signIn:'Вход с имейл',reply:'Отговори',locked:'Темата е заключена за нови отговори.',user:'Потребител'
}:{
 all:'All topics',loading:'Loading...',error:'Something went wrong. Please try again.',loginSent:'Check your email for a sign-in link. Check spam if needed.',logout:'You have signed out.',
 empty:'No topics in this category yet.',noReplies:'No replies yet.',
 report:'Report',reportPrompt:'Why are you reporting this content? (10–500 characters)',reported:'Your report was sent for review. Thank you!',invalid:'Describe the reason with at least 10 characters.',wait:'Please wait and try again.',
 created:'Your topic was published.',replied:'Your reply was published.',readonly:'Sign in with email to participate.',member:'Member',date:'en-GB',
 pilotFailed:'The pilot server is unavailable. Registration and posting are not active.',signIn:'Email sign-in',reply:'Reply',locked:'This topic is locked for new replies.',user:'User'
};
const $=id=>document.getElementById(id);
const config=window.DNCH_FORUM_CONFIG||{};
const url=typeof config.url==='string'?config.url.trim():'';
const key=typeof config.publishableKey==='string'?config.publishableKey.trim():'';
if(!/^https:\/\/[a-zA-Z0-9.-]+\/$/.test(url.endsWith('/')?url:url+'/')||!key||key.length<20)return;
const status=$('forum-status'),panel=$('forum-app'),offline=$('forum-offline');
const setStatus=(message)=>{status.textContent=message||''};
const make=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e};
const safeDate=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat(T.date,{dateStyle:'medium',timeStyle:'short'}).format(date)};
let client;
try{
 const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
 client=mod.createClient(url,key,{auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
}catch(e){console.warn('Forum SDK unavailable',e);return}
let user=null,categories=[],currentCategory=null,currentThread=null;
let loadSerial=0;
const profileCache=new Map();
async function authorNames(ids){
 const missing=[...new Set(ids.filter(Boolean))].filter(id=>!profileCache.has(id));
 if(!missing.length)return;
 const {data,error}=await client.from('forum_profiles').select('id,display_name').in('id',missing);
 if(error){console.warn('Profile lookup unavailable',error.message);return}
 for(const row of data||[])profileCache.set(row.id,row.display_name);
}
const author=id=>profileCache.get(id)||T.member;
function toggleLogin(session){
 user=session?.user||null;
 $('forum-login-form').hidden=!!user;
 $('forum-session').hidden=!user;
 $('forum-compose-section').hidden=!user;
 $('forum-identity').textContent=user?.email||'';
 $('forum-reply-form').hidden=!(user&&currentThread&&!currentThread.is_locked);
 $('forum-reply-hint').hidden=!!(user&&currentThread&&!currentThread.is_locked);
 if(currentThread&&currentThread.is_locked)$('forum-reply-hint').textContent=T.locked;
 else $('forum-reply-hint').textContent=T.readonly;
}
function renderFilters(){
 const filters=$('forum-filters');filters.replaceChildren();
 const options=[{id:null,label:T.all},...categories.map(c=>({id:c.id,label:locale==='bg'?c.title_bg:c.title_en}))];
 for(const cat of options){
  const btn=make('button','forum-filter',cat.label);btn.type='button';
  const selected=cat.id===currentCategory;
  btn.setAttribute('aria-pressed',selected?'true':'false');
  if(selected)btn.classList.add('active');
  btn.addEventListener('click',()=>{currentCategory=cat.id;renderFilters();loadTopics()});
  filters.appendChild(btn);
 }
 $('forum-category').replaceChildren(...categories.map(c=>{const o=make('option',null,locale==='bg'?c.title_bg:c.title_en);o.value=String(c.id);return o}));
}
function categoryLabel(id){const c=categories.find(x=>x.id===id);return c?(locale==='bg'?c.title_bg:c.title_en):''}
function footer(item){
 const el=make('div','forum-post-meta');
 el.appendChild(make('span',null,author(item.author_id)));
 el.appendChild(make('time',null,safeDate(item.created_at)));
 return el;
}
function reportButton(type,id){
 const b=make('button','forum-report',T.report);b.type='button';b.hidden=!user;
 b.addEventListener('click',async()=>{
  if(!user){setStatus(T.readonly);return}
  const reason=window.prompt(T.reportPrompt);
  if(reason===null)return;
  if(reason.trim().length<10||reason.trim().length>500){setStatus(T.invalid);return}
  b.disabled=true;const field=type==='thread'?'thread_id':'reply_id';
  const {error}=await client.from('forum_reports').insert({reporter_id:user.id,[field]:id,reason:reason.trim()});
  b.disabled=false;setStatus(error?T.error:T.reported);
 });return b;
}
function renderTopic(row,detail=false){
 const card=make('article','forum-topic-card');
 const top=make('div','forum-topic-head');
 top.append(make('span','forum-label',categoryLabel(row.category_id)||'DNCH'));
 top.append(make('span','forum-language',String(row.language||'').toUpperCase()));
 card.appendChild(top);
 const h=make(detail?'h2':'h3','forum-topic-title');
 if(detail)h.textContent=row.title;
 else {const link=make('button','forum-topic-open',row.title);link.type='button';link.addEventListener('click',()=>openTopic(row.id));h.appendChild(link);}
 card.appendChild(h);
 card.appendChild(make('p','forum-topic-body',row.body));
 const actions=make('div','forum-post-actions');actions.appendChild(footer(row));
 if(detail)actions.appendChild(reportButton('thread',row.id));
 card.appendChild(actions);return card;
}
async function loadTopics(){
 const ticket=++loadSerial;setStatus(T.loading);
 $('forum-browser').hidden=false;$('forum-thread-view').hidden=true;currentThread=null;toggleLogin({user});
 let request=client.from('forum_threads').select('id,category_id,author_id,title,body,language,is_locked,created_at').order('created_at',{ascending:false}).limit(50);
 if(currentCategory!==null)request=request.eq('category_id',currentCategory);
 const {data,error}=await request;
 if(ticket!==loadSerial)return;
 const list=$('forum-topics');list.replaceChildren();
 if(error){setStatus(T.error);console.warn(error.message);return}
 await authorNames((data||[]).map(x=>x.author_id));
 if(!data?.length)list.appendChild(make('p','forum-empty',T.empty));
 else list.replaceChildren(...data.map(x=>renderTopic(x)));
 setStatus('');
}
async function openTopic(id){
 if(!/^[0-9a-f-]{36}$/i.test(id))return;
 const ticket=++loadSerial;setStatus(T.loading);
 const {data,error}=await client.from('forum_threads').select('id,category_id,author_id,title,body,language,is_locked,created_at').eq('id',id).maybeSingle();
 if(error||!data){setStatus(T.error);return}
 const result=await client.from('forum_replies').select('id,author_id,body,created_at').eq('thread_id',id).order('created_at',{ascending:true}).limit(100);
 if(ticket!==loadSerial)return;
 if(result.error){setStatus(T.error);return}
 await authorNames([data.author_id,...(result.data||[]).map(x=>x.author_id)]);
 if(ticket!==loadSerial)return;
 currentThread=data;
 $('forum-browser').hidden=true;$('forum-thread-view').hidden=false;
 $('forum-thread').replaceChildren(renderTopic(data,true));
 const replies=$('forum-replies');replies.replaceChildren();
 if(!result.data?.length)replies.appendChild(make('p','forum-empty',T.noReplies));
 else for(const reply of result.data){
  const card=make('article','forum-reply');card.appendChild(make('p','forum-topic-body',reply.body));
  const row=make('div','forum-post-actions');row.appendChild(footer(reply));row.appendChild(reportButton('reply',reply.id));card.appendChild(row);replies.appendChild(card)
 }
 toggleLogin({user});setStatus('');
 const hash='#topic='+id;if(location.hash!==hash)history.replaceState(null,'',hash);
}
async function boot(){
 const {data,error}=await client.from('forum_categories').select('id,slug,title_en,title_bg,sort_order').order('sort_order');
 if(error){console.warn('Categories unavailable',error.message);offline.querySelector('p').textContent=T.pilotFailed;return}
 categories=data||[];
 if(categories.length===0){offline.querySelector('p').textContent=T.pilotFailed;return}
 offline.hidden=true;panel.hidden=false;renderFilters();
 const {data:sessionData}=await client.auth.getSession();
 toggleLogin(sessionData?.session);
 client.auth.onAuthStateChange((_event,s)=>{toggleLogin(s)});
 const match=location.hash.match(/^#topic=([0-9a-f-]{36})$/i);
 if(match)await openTopic(match[1]);else await loadTopics();
}
$('forum-login-form').addEventListener('submit',async e=>{
 e.preventDefault();const email=$('forum-email').value.trim();
 if(!email)return;
 const button=$('forum-login-form').querySelector('button');button.disabled=true;
 const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname,shouldCreateUser:true}});
 button.disabled=false;
 setStatus(error?T.error:T.loginSent);
});
$('forum-logout').addEventListener('click',async()=>{const {error}=await client.auth.signOut();setStatus(error?T.error:T.logout)});
$('forum-thread-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!user||!categories.length)return;
 const title=$('forum-title').value.trim(),body=$('forum-body').value.trim(),category_id=Number($('forum-category').value);
 if(title.length<8||title.length>160||body.length<20||body.length>5000||!categories.some(c=>c.id===category_id))return;
 const button=$('forum-thread-form').querySelector('button');button.disabled=true;
 const {error}=await client.from('forum_threads').insert({author_id:user.id,title,body,category_id,language:$('forum-language').value});
 button.disabled=false;
 if(error){console.warn(error.message);setStatus(error.code==='23514'?T.invalid:T.error);return}
 $('forum-thread-form').reset();currentCategory=null;renderFilters();history.replaceState(null,'',location.pathname);await loadTopics();setStatus(T.created);
});
$('forum-reply-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!user||!currentThread||currentThread.is_locked)return;
 const body=$('forum-reply').value.trim();if(body.length<2||body.length>3000)return;
 const id=currentThread.id;const button=$('forum-reply-form').querySelector('button');button.disabled=true;
 const {error}=await client.from('forum_replies').insert({author_id:user.id,thread_id:id,body});
 button.disabled=false;
 if(error){console.warn(error.message);setStatus(T.error);return}
 $('forum-reply').value='';await openTopic(id);setStatus(T.replied);
});
$('forum-back').addEventListener('click',()=>{history.replaceState(null,'',location.pathname);loadTopics()});
window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#topic=([0-9a-f-]{36})$/i);if(m)openTopic(m[1]);else loadTopics()});
boot().catch(e=>{console.warn('Forum init error',e);offline.querySelector('p').textContent=T.pilotFailed;offline.hidden=false;panel.hidden=true});
})();
