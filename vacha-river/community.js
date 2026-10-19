/* Река Въча · общностен кабинет с Supabase Auth и RLS. Няма администраторски ключ в браузъра. */
(()=>{'use strict';
 const url='https://wthzcqgzcbkvhovtcmoe.supabase.co';
 const key='sb_publishable_G4Rf57u-Ty4ZIFxLS7H2lg_OY99dVKb';
 const el=id=>document.getElementById(id);
 const n=(node,tag,text,klass)=>{const child=document.createElement(tag);if(klass)child.className=klass;if(text!==undefined)child.textContent=String(text);node.appendChild(child);return child;};
 const msg=(id,text)=>{el(id).textContent=text};
 const datestr=v=>{try{return new Date(v).toLocaleString('bg-BG',{timeZone:'Europe/Sofia',dateStyle:'medium',timeStyle:'short'})}catch{return 'Неизвестна дата'}};
 const kindText={post:'Новина',poll:'Анкета',event:'Събитие',proposal:'Предложение'};
 const sb=window.supabase?.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}});
 if(sb)window.vachaCommunitySupabase=sb;
 if(!sb){msg('account-state','Няма връзка с модула за профили.');msg('feed-status','Неуспешно зареждане на общността.');return}
 let user=null,membership=null,feed=[],filter='all';
 const isOwner=()=>membership?.active===true&&membership.role==='owner';
 const isEditor=()=>membership?.active===true;
 function safeOptions(p){return Array.isArray(p?.options)?p.options.filter(x=>typeof x==='string').slice(0,6):[]}
 async function loadPublic(){
   const {data,error}=await sb.from('vacha_community_posts').select('id,kind,title,body,payload,created_at').eq('status','approved').order('created_at',{ascending:false}).limit(80);
   if(error){msg('feed-status','Публикациите временно не са достъпни.');return}
   feed=data||[];renderFeed();
 }
 function renderFeed(){
   const list=el('feed-list');list.replaceChildren();
   const items=feed.filter(p=>filter==='all'||p.kind===filter);
   msg('feed-status',items.length?'':'Все още няма одобрени публикации в тази рубрика.');
   items.forEach(p=>{
     const article=n(list,'article',undefined,'post');
     n(article,'span',kindText[p.kind]||'Публикация','kind');
     n(article,'h3',p.title);
     n(article,'div',datestr(p.created_at),'meta');
     n(article,'p',p.body);
     if(p.kind==='event'){
       const loc=typeof p.payload?.location==='string'?p.payload.location:'';
       const when=typeof p.payload?.event_date==='string'?p.payload.event_date:'';
       n(article,'div',('📅 '+(when?datestr(when):'Дата предстои')+(loc?' · 📍 '+loc:'')),'event-meta');
     }
     if(p.kind==='poll')renderPoll(article,p);
   });
 }
 async function renderPoll(article,p){
   const opts=safeOptions(p.payload);if(opts.length<2)return;
   const form=n(article,'form');form.setAttribute('aria-label','Анкета: '+p.title);
   const radname='poll-'+p.id;
   opts.forEach((o,i)=>{
     const label=n(form,'label',undefined,'poll-option');label.style.margin='0';
     const radio=n(label,'input');radio.type='radio';radio.name=radname;radio.value=String(i);
     n(label,'span',o);
   });
   const submit=n(form,'button','Гласувай','secondary');submit.type='submit';submit.disabled=!user;
   const note=n(form,'div',user?'Един глас на профил.':'Влез в профила си, за да гласуваш.','poll-results');
   const results=n(article,'div',undefined,'poll-results');
   form.addEventListener('submit',async ev=>{
     ev.preventDefault();if(!user)return;const checked=form.querySelector('input:checked');if(!checked){note.textContent='Избери отговор.';return}
     submit.disabled=true;const {error}=await sb.from('vacha_poll_votes').insert({post_id:p.id,user_id:user.id,option_index:Number(checked.value)});
     if(error){note.textContent=error.code==='23505'?'Вече си гласувал в тази анкета.':'Гласуването не успя: '+error.message}
     else note.textContent='Благодарим! Гласът ти е записан.';
     await showCounts();submit.disabled=false;
   });
   async function showCounts(){
     const {data,error}=await sb.rpc('vacha_poll_results',{p_post_id:p.id});if(error)return;
     const rows=Array.isArray(data)?data:[];const total=rows.reduce((sum,r)=>sum+Number(r.votes||0),0);
     results.replaceChildren();n(results,'strong','Резултати · '+total+' гласа');
     opts.forEach((o,i)=>{const count=Number(rows.find(x=>Number(x.option_index)===i)?.votes||0);
       n(results,'div',o+' · '+count+' ('+(total?Math.round(count*100/total):0)+'%)');
       const bg=n(results,'div',undefined,'poll-bar');const bar=n(bg,'i');bar.style.width=(total?count*100/total:0)+'%';
     });
   }
   await showCounts();
 }
 function toggleExtra(){
   const kind=el('pub-kind').value;
   el('pub-poll').hidden=kind!=='poll';el('pub-event').hidden=kind!=='event';
 }
 el('pub-kind').addEventListener('change',toggleExtra);
 async function refreshIdentity(){
   const {data,error}=await sb.auth.getUser();user=(!error&&data?.user)||null;membership=null;
   if(user){
     const {data:profile}=await sb.from('vacha_editors').select('display_name,role,active').eq('user_id',user.id).maybeSingle();
     membership=profile||null;
   }
   el('credentials').hidden=!!user;el('editor-logout').hidden=!user;
   el('editor-panel').hidden=!isEditor();el('moderation-panel').hidden=!isOwner();
   el('editor-no-access').hidden=!user||isEditor();
   msg('account-state',user?'Влязъл профил: '+user.email+(isEditor()?' · '+(membership.display_name||'Редактор')+' · '+(isOwner()?'Собственик':'Редактор'):' · Без редакторски права'):'Влез или се регистрирай. Редакторските права се дават отделно.');
   if(isEditor())await loadMine();else el('own-posts').replaceChildren();
   if(isOwner())await loadPending();
   renderFeed();
 }
 async function loadMine(){
   const out=el('own-posts');out.replaceChildren();
   const {data,error}=await sb.from('vacha_community_posts').select('title,status,kind,created_at').eq('author_id',user.id).order('created_at',{ascending:false}).limit(20);
   if(error){out.textContent='Не могат да се заредят предложенията.';return}
   if(!data?.length){out.textContent='Още нямаш предложения.';return}
   data.forEach(p=>n(out,'p',(kindText[p.kind]||'Материал')+': '+p.title+' · '+({pending:'Чака одобрение',approved:'Публикувано',rejected:'Отказано'}[p.status]||p.status)));
 }
 async function loadPending(){
   const out=el('pending-list');out.replaceChildren();
   const {data,error}=await sb.from('vacha_community_posts').select('id,title,body,kind,created_at').eq('status','pending').order('created_at',{ascending:true}).limit(50);
   if(error){msg('review-state','Неуспешно зареждане на черновите: '+error.message);return}
   msg('review-state',data?.length?'За преглед: '+data.length:'Няма чакащи материали.');
   (data||[]).forEach(p=>{
     const box=n(out,'div',undefined,'pending-item');
     n(box,'div',kindText[p.kind]+' · '+datestr(p.created_at),'meta');
     n(box,'h4',p.title);n(box,'p',p.body);
     const row=n(box,'div',undefined,'btn-row');
     for(const [status,label] of [['approved','Одобри'],['rejected','Откажи']]){
       const btn=n(row,'button',label,status==='approved'?'primary':'ghost');btn.type='button';
       btn.addEventListener('click',async()=>{
         btn.disabled=true;
         const {error:err}=await sb.from('vacha_community_posts').update({status,reviewed_at:new Date().toISOString(),reviewed_by:user.id}).eq('id',p.id).eq('status','pending');
         if(err)msg('review-state','Неуспешна промяна: '+err.message);
         else{await loadPending();await loadPublic()}
         btn.disabled=false;
       });
     }
   });
 }
 el('publish-form').addEventListener('submit',async e=>{
   e.preventDefault();if(!user||!isEditor())return;
   const kind=el('pub-kind').value,title=el('pub-title').value.trim(),body=el('pub-body').value.trim();
   const payload={};
   if(kind==='poll'){
     const options=el('pub-options').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
     if(options.length<2||options.length>6||options.some(x=>x.length>120)||new Set(options.map(x=>x.toLowerCase())).size!==options.length){msg('publish-state','Напиши от 2 до 6 различни отговора (до 120 знака всеки).');return}
     payload.options=options;
   }
   if(kind==='event'){
     const date=el('pub-date').value,location=el('pub-location').value.trim();
     if(!date||!Number.isFinite(Date.parse(date))){msg('publish-state','Посочи дата и час на събитието.');return}
     payload.event_date=date;payload.location=location;
   }
   if(title.length<6||body.length<10){msg('publish-state','Заглавието и описанието са твърде кратки.');return}
   const btn=el('pub-submit');btn.disabled=true;msg('publish-state','Изпращане за одобрение…');
   const {error}=await sb.from('vacha_community_posts').insert({author_id:user.id,kind,title,body,payload});
   if(error){msg('publish-state','Неуспешно изпращане: '+error.message)}
   else{el('publish-form').reset();toggleExtra();msg('publish-state','✅ Материалът е изпратен и чака одобрение.');await loadMine();if(isOwner())await loadPending()}
   btn.disabled=false;
 });
 el('editor-login').addEventListener('click',async()=>{
   const email=el('editor-email').value.trim(),password=el('editor-pass').value;
   if(!email||!password){msg('account-state','Въведи имейл и парола.');return}
   msg('account-state','Влизане…');
   const {error}=await sb.auth.signInWithPassword({email,password});
   if(error)msg('account-state','Входът не успя: '+error.message);else await refreshIdentity();
 });
 el('editor-register').addEventListener('click',async()=>{
   const email=el('editor-email').value.trim(),password=el('editor-pass').value;
   if(!email||password.length<6){msg('account-state','Въведи валиден имейл и парола с минимум 6 символа.');return}
   msg('account-state','Регистрация…');
   const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
   if(error)msg('account-state','Регистрацията не успя: '+error.message);
   else msg('account-state',data?.session?'Профилът е създаден. Изчакай да ти бъде дадена редакторска роля.':'Провери имейла за потвърждение. След това собственикът може да даде редакторски достъп.');
 });
 el('editor-logout').addEventListener('click',async()=>{await sb.auth.signOut();await refreshIdentity()});
 sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='TOKEN_REFRESHED')queueMicrotask(()=>refreshIdentity().catch(console.warn))});
 el('feed-tabs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
   filter=b.dataset.kind;el('feed-tabs').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderFeed();
 }));
 toggleExtra();
 refreshIdentity().catch(e=>{msg('account-state','Неуспешна проверка на профила.');console.warn(e)});
 loadPublic().catch(e=>{msg('feed-status','Неуспешно зареждане.');console.warn(e)});
})();