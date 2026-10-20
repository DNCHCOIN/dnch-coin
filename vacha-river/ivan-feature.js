/* Vacha River homepage: compact reporter spotlight, using approved public Ivan photos. */
(()=>{'use strict';
 const id=(name)=>document.getElementById(name);
 const image=id('ivan-mini-image'),placeholder=id('ivan-mini-placeholder'),caption=id('ivan-mini-caption'),count=id('ivan-mini-count');
 if(!image||!placeholder)return;
 const label=id('ivan-mini-loading'),prev=id('ivan-mini-prev'),next=id('ivan-mini-next'),spotlight=id('ivan-mini-gallery');
 const SUPABASE_URL='https://wthzcqgzcbkvhovtcmoe.supabase.co';
 const ANON='sb_publishable_G4Rf57u-Ty4ZIFxLS7H2lg_OY99dVKb';
 const BUCKET='vacha-river-gallery';
 const client=window.supabase?.createClient(SUPABASE_URL,ANON,{auth:{persistSession:false,autoRefreshToken:false}});
 let slides=[],index=0,interval=null;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let pauseOnHover=false,pauseOnFocus=false;
 function display(n){
   if(!slides.length)return;
   index=(n+slides.length)%slides.length;
   const current=slides[index];
   image.hidden=false;image.src=current.url;image.alt=current.caption||'Фотоистория на Иван от река Въча';
   image.decoding='async';image.loading='lazy';
   placeholder.hidden=true;
   caption.textContent=current.caption||'Момент край река Въча';
   count.textContent=(index+1)+' / '+slides.length;
 }
 function showError(message){
   image.hidden=true;placeholder.hidden=false;placeholder.textContent=message;
   caption.textContent='Историите на Иван';count.textContent='';
   if(label)label.textContent='';
 }
 function move(n){display(index+n)}
 prev.addEventListener('click',()=>move(-1));
 next.addEventListener('click',()=>move(1));
 spotlight.addEventListener('mouseenter',()=>{pauseOnHover=true});
 spotlight.addEventListener('mouseleave',()=>{pauseOnHover=false});
 spotlight.addEventListener('focusin',()=>{pauseOnFocus=true});
 spotlight.addEventListener('focusout',()=>{pauseOnFocus=false});
 let startX=null;
 spotlight.addEventListener('touchstart',event=>{startX=event.changedTouches[0]?.screenX??null},{passive:true});
 spotlight.addEventListener('touchend',event=>{if(startX===null)return;const diff=(event.changedTouches[0]?.screenX??startX)-startX;startX=null;if(Math.abs(diff)>55)move(diff<0?1:-1)},{passive:true});
 image.addEventListener('error',()=>{placeholder.hidden=false;placeholder.textContent='Кадърът не може да се зареди. Опитай следващия.';image.hidden=true});
 async function load(){
   if(!client){showError('Снимките временно не са достъпни. Отвори страницата на Иван.');return}
   const r=await client.from('vacha_telegram_public')
     .select('object_path,caption,published_at')
     .eq('credit','Ванко').order('published_at',{ascending:false}).limit(12);
   if(r.error){showError('Не успяхме да заредим кадрите. Страницата на Иван е достъпна.');return}
   slides=(r.data||[]).filter(x=>x.object_path).map(x=>({
     url:client.storage.from(BUCKET).getPublicUrl(x.object_path).data.publicUrl,
     caption:x.caption||''
   }));
   if(!slides.length){showError('Очакваме следващите снимки от Иван.');return}
   if(label)label.textContent='Фотоистории · Иван';
   display(0);
   prev.disabled=slides.length<2;next.disabled=slides.length<2;
   if(slides.length>1&&!reduced){
     interval=window.setInterval(()=>{if(!pauseOnHover&&!pauseOnFocus&&!document.hidden)display(index+1)},5500);
   }
 }
 load().catch(()=>showError('Снимките временно не са достъпни. Отвори страницата на Иван.'));
 window.addEventListener('pagehide',()=>{if(interval)window.clearInterval(interval)});
})();