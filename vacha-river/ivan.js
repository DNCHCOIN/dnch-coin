/* Public reporter page: only publicly approved content, no Telegram IDs or secrets. */
(()=>{'use strict';
 const URL='https://wthzcqgzcbkvhovtcmoe.supabase.co';
 const KEY='sb_publishable_G4Rf57u-Ty4ZIFxLS7H2lg_OY99dVKb';
 const BUCKET='vacha-river-gallery';
 // Ivan is credited as "Ванко" in the Telegram editor panel.
 const REPORTER_CREDIT='Ванко';
 const id=n=>document.getElementById(n);
 const sb=window.supabase?.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const date=t=>new Date(t).toLocaleString('bg-BG',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
 function node(parent,tag,text,className){
   const x=document.createElement(tag);
   if(text!==null&&text!==undefined)x.textContent=text;
   if(className)x.className=className;
   parent.appendChild(x);return x;
 }
 async function load(){
   if(!sb){id('ivan-status').textContent='В момента няма връзка със снимките. Опитай пак след малко.';return}
   const [photos,stories]=await Promise.all([
     sb.from('vacha_telegram_public')
       .select('object_path,caption,credit,published_at')
       .eq('credit',REPORTER_CREDIT).order('published_at',{ascending:false}).limit(100),
     sb.from('vacha_community_posts')
       .select('title,body,created_at')
       .eq('status','approved').eq('kind','post')
       .contains('payload',{source:'telegram',source_credit:REPORTER_CREDIT})
       .order('created_at',{ascending:false}).limit(100)
   ]);
   if(photos.error&&stories.error){
     id('ivan-status').textContent='Публикациите временно не могат да се заредят. Опитай пак по-късно.';return;
   }
   const grid=id('ivan-photos');
   if(!photos.error){
     for(const row of photos.data||[]){
       if(!row.object_path)continue;
       const publicUrl=sb.storage.from(BUCKET).getPublicUrl(row.object_path).data.publicUrl;
       const figure=node(grid,'article',null,'photo-card');
       const link=node(figure,'a',null,'photo-link');link.href=publicUrl;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Отвори цялата снимка в пълен размер');
       const image=node(link,'img');image.src=publicUrl;image.alt=row.caption||'Снимка от река Въча';image.loading='lazy';image.decoding='async';
       const details=node(figure,'div',null,'details');
       node(details,'span',date(row.published_at)+' · '+(row.credit||'Репортер'),'meta');
       node(details,'h3',row.caption||'Снимка от река Въча');
       const open=node(details,'a','🔎 Виж в пълен размер ↗','view');open.href=publicUrl;open.target='_blank';open.rel='noopener noreferrer';
     }
   }
   if(!grid.children.length){id('ivan-photo-empty').hidden=false}
   const textGrid=id('ivan-stories');
   if(!stories.error){
     for(const story of stories.data||[]){
       const article=node(textGrid,'article',null,'story-card');
       node(article,'span',date(story.created_at)+' · Иван','meta');
       node(article,'h3',story.title||'Разказ от река Въча');
       node(article,'p',story.body||'', 'story-body');
     }
   }
   if(!textGrid.children.length)id('ivan-story-empty').hidden=false;
   if(photos.error||stories.error)id('ivan-status').textContent='Част от публикациите временно не са достъпни.';
   else if(!grid.children.length&&!textGrid.children.length)id('ivan-status').textContent='Очакваме първите истории на Иван.';
   else id('ivan-status').hidden=true;
 }
 load().catch(()=>{id('ivan-status').textContent='Публикациите временно не могат да се заредят.'});
})();