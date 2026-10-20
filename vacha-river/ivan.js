/* Vacha River | Ivan the reporter — approved photos and stories, one accessible carousel. */
(()=>{'use strict';
 const URL='https://wthzcqgzcbkvhovtcmoe.supabase.co';
 const KEY='sb_publishable_G4Rf57u-Ty4ZIFxLS7H2lg_OY99dVKb';
 const BUCKET='vacha-river-gallery';
 const REPORTER_CREDIT='Ванко';
 const id=(name)=>document.getElementById(name);
 const sb=window.supabase?.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const date=(v)=>{try{return new Date(v).toLocaleDateString('bg-BG',{day:'numeric',month:'long',year:'numeric'})}catch(_){return 'Репортаж от брега'}};
 let photos=[],position=0,paused=reducedMotion,timer=null,touchStartX=null;
 const viewer=id('ivan-viewer'),thumbs=id('ivan-thumbs'),dialog=id('ivan-lightbox');
 function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined&&txt!==null)e.textContent=txt;return e}
 function wrap(n){return (n+photos.length)%photos.length}
 function setPlaying(){id('ivan-play').textContent=paused?'▶ Пусни':'⏸ Пауза';id('ivan-play').setAttribute('aria-pressed',String(paused))}
 function slide(n,focusThumb=false){
   if(!photos.length)return;
   position=wrap(n);
   const p=photos[position],img=id('ivan-slide-image');
   img.src=p.url;img.alt=p.caption||'Снимка на Иван от река Въча';img.decoding='async';
   id('ivan-slide-title').textContent=p.caption||'Момент край река Въча';
   id('ivan-slide-meta').textContent=date(p.date)+' · Иван, репортер от брега';
   id('ivan-counter').textContent=(position+1)+' / '+photos.length;
   [...thumbs.children].forEach((button,i)=>{
     const active=i===position;
     button.classList.toggle('active',active);
     button.setAttribute('aria-pressed',String(active));
     if(active&&focusThumb)button.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'nearest',inline:'center'});
   });
   if(dialog.open){
     const dimg=id('ivan-lightbox-image');dimg.src=p.url;dimg.alt=img.alt;
     id('ivan-lightbox-caption').textContent=p.caption||'Река Въча · кадър на Иван';
     id('ivan-lightbox-count').textContent=(position+1)+' / '+photos.length;
   }
 }
 function move(dir){slide(position+dir,true)}
 function openDialog(){
   if(!photos.length)return;
   paused=true;setPlaying();
   dialog.showModal();slide(position);
 }
 function closeDialog(){if(dialog.open)dialog.close()}
 function buildThumbs(){
   thumbs.textContent='';
   photos.forEach((p,i)=>{
     const button=el('button','thumb');button.type='button';
     button.setAttribute('aria-label','Покажи снимка '+(i+1)+' от '+photos.length);
     const img=el('img');img.src=p.url;img.alt='';img.loading='lazy';img.decoding='async';
     button.append(img);
     button.addEventListener('click',()=>{paused=true;setPlaying();slide(i,true)});
     thumbs.append(button);
   });
 }
 function slideshow(rows){
   photos=rows.filter(row=>row.object_path).map(row=>({
     url:sb.storage.from(BUCKET).getPublicUrl(row.object_path).data.publicUrl,
     caption:row.caption||'',
     date:row.published_at
   }));
   id('ivan-photo-count').textContent=photos.length+' публикувани кадъра';
   if(!photos.length){id('ivan-photo-empty').hidden=false;return}
   viewer.hidden=false;thumbs.hidden=false;
   buildThumbs();slide(0);setPlaying();
   id('ivan-prev').disabled=photos.length<2;
   id('ivan-next').disabled=photos.length<2;
   id('ivan-play').disabled=photos.length<2;
   timer=window.setInterval(()=>{if(!paused&&!dialog.open&&!document.hidden&&photos.length>1)slide(position+1,true)},6000);
 }
 function storiesRender(rows){
   const list=id('ivan-story-list');list.textContent='';
   for(const row of rows){
     const item=el('details','story-card');
     const summary=el('summary');
     summary.append(el('span','meta',date(row.created_at)+' · Иван'),el('h3',null,row.title||'Разказ от река Въча'));
     item.append(summary,el('p','story-body',row.body||''));
     list.append(item);
   }
   id('ivan-story-empty').hidden=rows.length>0;
 }
 id('ivan-prev').addEventListener('click',()=>{paused=true;setPlaying();move(-1)});
 id('ivan-next').addEventListener('click',()=>{paused=true;setPlaying();move(1)});
 id('ivan-play').addEventListener('click',()=>{paused=!paused;setPlaying()});
 id('ivan-open').addEventListener('click',openDialog);
 id('ivan-slide-image').addEventListener('click',openDialog);
 id('ivan-lightbox-close').addEventListener('click',closeDialog);
 id('ivan-lightbox-prev').addEventListener('click',()=>move(-1));
 id('ivan-lightbox-next').addEventListener('click',()=>move(1));
 dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog()});
 document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&dialog.open){closeDialog();return}
   if(event.key==='ArrowRight'&&(dialog.open||document.activeElement.closest('#ivan-viewer'))){event.preventDefault();paused=true;setPlaying();move(1)}
   if(event.key==='ArrowLeft'&&(dialog.open||document.activeElement.closest('#ivan-viewer'))){event.preventDefault();paused=true;setPlaying();move(-1)}
 });
 [id('ivan-stage'),dialog].forEach(target=>{
   target.addEventListener('touchstart',event=>{touchStartX=event.changedTouches[0]?.screenX??null},{passive:true});
   target.addEventListener('touchend',event=>{
     if(touchStartX===null)return;
     const distance=(event.changedTouches[0]?.screenX??touchStartX)-touchStartX;
     touchStartX=null;
     if(Math.abs(distance)>55){paused=true;setPlaying();move(distance<0?1:-1)}
   },{passive:true});
 });
 async function load(){
   if(!sb){id('ivan-status').textContent='Публикациите временно не могат да се заредят. Опитай по-късно.';id('ivan-photo-count').textContent='Галерията не е достъпна';return}
   const [photoResult,storyResult]=await Promise.all([
     sb.from('vacha_telegram_public')
       .select('object_path,caption,credit,published_at')
       .eq('credit',REPORTER_CREDIT).order('published_at',{ascending:false}).limit(200),
     sb.from('vacha_community_posts')
       .select('title,body,created_at')
       .eq('status','approved').eq('kind','post')
       .contains('payload',{source:'telegram',source_credit:REPORTER_CREDIT})
       .order('created_at',{ascending:false}).limit(200)
   ]);
   if(!photoResult.error)slideshow(photoResult.data||[]);
   else {id('ivan-photo-count').textContent='Снимките временно не са достъпни';id('ivan-photo-empty').textContent='Не успяхме да заредим снимките. Опитай пак след малко.';id('ivan-photo-empty').hidden=false}
   if(!storyResult.error)storiesRender(storyResult.data||[]);
   else{id('ivan-story-empty').textContent='Разказите временно не могат да се заредят.';id('ivan-story-empty').hidden=false}
   const anyError=photoResult.error||storyResult.error;
   if(anyError)id('ivan-status').textContent='Част от публикациите временно не са достъпни.';
   else if(!photos.length&&!(storyResult.data||[]).length)id('ivan-status').textContent='Очакваме първите истории на Иван.';
   else id('ivan-status').hidden=true;
 }
 load().catch(()=>{id('ivan-status').textContent='Публикациите временно не могат да се заредят.';id('ivan-photo-count').textContent='Опитай отново по-късно'});
 window.addEventListener('pagehide',()=>{if(timer)window.clearInterval(timer)});
})();