/* Gallery persisted in Supabase: uploads require authentication; only approved photos are public. */
(()=>{'use strict';
const url='https://wthzcqgzcbkvhovtcmoe.supabase.co';
const key='sb_publishable_G4Rf57u-Ty4ZIFxLS7H2lg_OY99dVKb'; // public client key, NOT service_role key
const bucket='vacha-river-gallery';
const id=x=>document.getElementById(x);
const msg=s=>{id('gallery-status').textContent=s};
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const client=window.supabase?.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}});
if(!client){msg('Неуспешно зареждане на модула за галерията. Проверете връзката.');return}
let user=null;
function card(r,own=false){
  const link=client.storage.from(bucket).getPublicUrl(r.object_path).data.publicUrl;
  const fig=document.createElement('figure');
  const view=document.createElement('a');
  view.href=link;view.target='_blank';view.rel='noopener noreferrer';
  view.setAttribute('aria-label','Отвори цялата снимка в пълен размер');
  const pic=document.createElement('img');
  pic.src=link;pic.alt=r.caption||'Снимка от река Въча';pic.loading='lazy';pic.decoding='async';
  view.appendChild(pic);
  const caption=document.createElement('figcaption');
  caption.textContent=r.caption||'Река Въча';
  if(r.credit==='Ванко'){
    const reporter=document.createElement('a');reporter.href='./ivan.html';
    reporter.className='gallery-reporter';
    reporter.textContent='📖 Историите на Иван →';
    caption.appendChild(reporter);
  }
  if(own){const info=document.createElement('small');info.textContent=r.status==='pending'?'⏳ Очаква одобрение':r.status==='rejected'?'Не е одобрена':'Публикувана';caption.appendChild(info)}
  fig.append(view,caption);return fig;
}
async function load(){try{
  const pub=await client.from('vacha_photos').select('id,object_path,caption,created_at,status').eq('status','approved').order('created_at',{ascending:false}).limit(36);
  if(pub.error)throw pub.error;
  const telegram=await client.from('vacha_telegram_public').select('object_path,caption,credit,published_at').order('published_at',{ascending:false}).limit(36);
  if(telegram.error)console.warn('Telegram public gallery unavailable',telegram.error);
  const telegramRows=(telegram.data||[]).map(x=>({object_path:x.object_path,caption:(x.caption||'Снимка от Въча')+' · 📷 '+x.credit,credit:x.credit}));
  const allRows=[...telegramRows,...(pub.data||[])];
  const out=id('gallery-public');out.replaceChildren(...allRows.map(x=>card(x)));
  id('gallery-list-status').textContent=allRows.length?'Публикувани снимки: '+allRows.length:'Още няма одобрени снимки. Бъди първият, който ще сподели Въча!';
  const mine=id('gallery-mine');mine.replaceChildren();
  if(user){const result=await client.from('vacha_photos').select('id,object_path,caption,status,created_at').eq('owner_id',user.id).eq('status','pending').order('created_at',{ascending:false}).limit(12);
   if(result.error)throw result.error;
   if(result.data?.length){const heading=document.createElement('p');heading.className='gallery-tip';heading.textContent='Твоите снимки, очакващи одобрение:';mine.before(heading);mine.replaceChildren(...result.data.map(x=>card(x,true)))}}
 }catch(e){id('gallery-list-status').textContent='Галерията временно не може да се зареди.';console.error('gallery list',e)}}
function updateAuth(){id('gallery-login').hidden=!!user;id('gallery-register').hidden=!!user;id('gallery-logout').hidden=!user;id('gallery-email').parentElement.hidden=!!user;id('gallery-password').parentElement.hidden=!!user;msg(user?`Влязъл профил: ${user.email}. Можеш да качваш снимки, които първо се преглеждат.`:'За качване е необходим профил. Можеш да влезеш или да се регистрираш.');load()}
const credentials=()=>({email:id('gallery-email').value.trim(),password:id('gallery-password').value});
id('gallery-login').addEventListener('click',async()=>{const {email,password}=credentials();if(!email||!password){msg('Въведи имейл и парола.');return}msg('Влизане…');const {error}=await client.auth.signInWithPassword({email,password});if(error)msg('Грешка при вход: '+error.message)});
id('gallery-register').addEventListener('click',async()=>{const {email,password}=credentials();if(!email||password.length<6){msg('За регистрация въведи имейл и парола с поне 6 символа.');return}msg('Регистрация…');const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});if(error)msg('Регистрацията не успя: '+error.message);else if(!data.session)msg('Провери имейла си за потвърждение. След това се върни и влез.');else msg('Профилът е създаден. Можеш да качиш снимка.')});
id('gallery-logout').addEventListener('click',async()=>{await client.auth.signOut()});
client.auth.onAuthStateChange((_ev,session)=>{user=session?.user||null;updateAuth()});
client.auth.getSession().then(({data})=>{user=data.session?.user||null;updateAuth()}).catch(()=>msg('Временно няма връзка с профилите.'));
id('choose-photo').addEventListener('click',()=>{if(!user){msg('Първо влез или се регистрирай по-долу, за да качиш снимките си.');id('gallery-auth').scrollIntoView({behavior:'smooth',block:'center'});id('gallery-email').focus();return;}id('photo-input').click()});
id('photo-input').addEventListener('change',async ev=>{
 const selected=Array.from(ev.target.files||[]),photos=selected.slice(0,3);ev.target.value='';if(selected.length>3){msg('Избери максимум 3 снимки наведнъж.');return}
 if(!user){msg('Първо влез или се регистрирай, после избери снимките отново.');id('gallery-email').focus();return}
 if(!photos.length)return;
 const title=window.prompt('Кратък надпис за снимките (до 140 знака):','Красотата на река Въча')||'Река Въча';
 if(title.length>140){msg('Надписът трябва да е до 140 знака.');return}
 for(let i=0;i<photos.length;i++){
  const f=photos[i],allowed={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
  if(!allowed[f.type]||f.size>5*1024*1024){msg(`Файлът ${f.name} не се приема. Само JPG, PNG или WebP до 5 MB.`);return}
  const path=`${user.id}/${crypto.randomUUID()}.${allowed[f.type]}`;
  msg(`Качване на снимка ${i+1} от ${photos.length}…`);
  try{
   const {error:upErr}=await client.storage.from(bucket).upload(path,f,{cacheControl:'3600',contentType:f.type,upsert:false});if(upErr)throw upErr;
   const {error:dbErr}=await client.from('vacha_photos').insert({owner_id:user.id,object_path:path,caption:title.trim(),status:'pending'});if(dbErr)throw dbErr;
  }catch(e){msg('Неуспешно качване: '+e.message);console.error('upload error',e);return}
 }
 msg('✅ Снимките са качени успешно и чакат преглед, преди да се появят публично.');await load();
});
})();
