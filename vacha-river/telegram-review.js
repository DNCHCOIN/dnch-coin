/* River Vacha Telegram moderation. Access requires Supabase owner login. */
(()=>{'use strict';
 const api="https://wthzcqgzcbkvhovtcmoe.supabase.co/functions/v1/vacha-telegram";
 const el=id=>document.getElementById(id);
 const sb=window.vachaCommunitySupabase;
 if(!sb||!el('telegram-panel'))return;
 const status=value=>{el('telegram-status').textContent=value};
 const elem=(p,tag,value,cls)=>{const node=document.createElement(tag);if(value!==null)node.textContent=value;if(cls)node.className=cls;p.appendChild(node);return node};
 async function session(){
   const {data,error}=await sb.auth.getSession();
   return error?null:data?.session||null;
 }
 async function owner(){
   const sess=await session();
   if(!sess)return false;
   const {data,error}=await sb.from('vacha_editors').select('role,active').eq('user_id',sess.user.id).maybeSingle();
   return !error&&data?.active===true&&data?.role==='owner';
 }
 async function call(method,action,payload){
   const sess=await session();if(!sess)throw Error('Влез с профила на собственика.');
   const res=await fetch(api,{method,headers:{
     "apikey":"sb_publishable_G4Rf57u-Ty4ZIFxLS7H2lg_OY99dVKb",
     "authorization":"Bearer "+sess.access_token,
     ...(action?{"x-vacha-admin-action":action}:{}),
     ...(payload?{"content-type":"application/json"}:{})
   },...(payload?{body:JSON.stringify(payload)}:{})});
   const data=await res.json().catch(()=>({error:'Invalid server response'}));
   if(!res.ok)throw Error(data.error||"HTTP "+res.status);
   return data;
 }
 async function refresh(){
   const panel=el('telegram-panel');
   const valid=await owner();panel.hidden=!valid;
   if(!valid)return;
   const list=el('telegram-queue');list.replaceChildren();status('Зареждане на материалите…');
   try{
     const data=await call('GET');
     el('telegram-config-status').textContent=data.configured
       ? '✅ Токенът е записан защитено. За проверка натисни „Провери / свържи отново“ и изпрати /start на бота.'
       : '⚠️ Ботът още не е активиран. Вземи токена от BotFather, въведи го тук и натисни „Активирай бота и снимките“.';
     const allowed=el('telegram-allow-list');allowed.replaceChildren();
     const reporters=data.reporters||[];
     elem(allowed,'p','Разрешени активни профили: '+reporters.filter(x=>x.is_active).length+' / 2','lead');
     for(const reporter of reporters){
       const item=elem(allowed,'div',null,'btn-row');
       elem(item,'span',reporter.display_name+' · ID '+reporter.telegram_user_id+(reporter.is_active?' ✅':' (изключен)'));
       if(reporter.is_active){
         const b=elem(item,'button','Отнеми достъпа','ghost');b.type='button';
         b.addEventListener('click',async()=>{
           if(!confirm('Да премахна достъпа на '+reporter.display_name+'?'))return;
           b.disabled=true;
           try{await call('POST','remove-reporter',{telegram_user_id:Number(reporter.telegram_user_id)});await refresh()}
           catch(e){status('Грешка: '+e.message);b.disabled=false}
         });
       }
     }
     const items=data.items||[];
     status(items.length?'Чакат обработка: '+items.length:(data.configured?'Няма чакащи текстови материали. Снимките от разрешените профили се публикуват автоматично.':'Няма получени материали. Първо активирай бота с токена от BotFather.'));
     for(const item of items){
       const article=elem(list,'div',null,'pending-item');
       elem(article,'h4',(item.kind==='photo'?'📷 Снимка':'📝 Текст')+' · '+item.reporter);
       const p=elem(article,'p',item.description||'Без описание');p.style.whiteSpace='pre-wrap';
       elem(article,'small',new Date(item.received_at).toLocaleString('bg-BG'));
       if(item.photo_url){
         const img=elem(article,'img',null);img.src=item.photo_url;img.alt='Снимка за преглед от '+item.reporter;
         img.loading='lazy';img.style.cssText='display:block;max-width:100%;max-height:290px;object-fit:contain;margin:12px 0;border-radius:12px;background:#e6ede8';
       }
       const row=elem(article,'div',null,'btn-row');
       for(const pair of [['approved','✅ Одобри'],['rejected','✕ Откажи']]){
         const decision=pair[0],label=pair[1];
         const b=elem(row,'button',label,decision==='approved'?'primary':'ghost');b.type='button';
         b.addEventListener('click',async()=>{
           if(!confirm('Сигурен ли си, че искаш да '+(decision==='approved'?'публикуваш':'откажеш')+' този материал?'))return;
           row.querySelectorAll('button').forEach(x=>x.disabled=true);
           status('Обработваме решението…');
           try{await call('POST','review',{id:Number(item.id),decision});await refresh()}
           catch(e){status('Неуспешна обработка: '+e.message);row.querySelectorAll('button').forEach(x=>x.disabled=false)}
         });
       }
     }
   }catch(e){status('Неуспешно зареждане: '+e.message)}
 }
 el('telegram-setup-form').addEventListener('submit',async e=>{
   e.preventDefault();
   const field=el('telegram-bot-token'),token=field.value.trim();
   if(!/^[0-9]{5,16}:[A-Za-z0-9_-]{20,100}$/.test(token)){
     status('Токенът не е в правилния формат. Копирай целия токен от BotFather.');return;
   }
   const button=el('telegram-setup-submit');button.disabled=true;
   status('Проверяваме токена с Telegram и активираме връзката…');
   try{
     const result=await call('POST','setup-bot',{token});
     if(!result.activated)throw Error('Telegram не потвърди активирането.');
     field.value='';
     await refresh();
     status('✅ @VachaRiverBot е активиран. Изпрати /start и пробна снимка от разрешен профил.');
   }catch(err){
     status('Неуспешно активиране: '+err.message);
   }finally{button.disabled=false}
 });
 el('telegram-allow-form').addEventListener('submit',async e=>{
   e.preventDefault();
   const telegram_user_id=Number(el('tg-allow-id').value);
   const display_name=el('tg-allow-name').value.trim();
   if(!Number.isSafeInteger(telegram_user_id)||telegram_user_id<=0||display_name.length<2){
     status('Въведи валиден цифров Telegram ID и име.');return;
   }
   status('Записваме разрешения профил…');
   try{
     await call('POST','add-reporter',{telegram_user_id,display_name});
     el('telegram-allow-form').reset();
     await refresh();
   }catch(e){status('Профилът не е добавен: '+e.message)}
 });
 el('telegram-refresh').addEventListener('click',refresh);
 el('telegram-connect').addEventListener('click',async()=>{
   status('Проверяваме сигурната връзка с Telegram…');
   try{const r=await call('POST','connect');status(r.ok?'✅ Telegram webhook е свързан. Репортерите могат да изпращат съобщения.':'Свързването не е потвърдено.')}
   catch(e){status('Връзката още не е готова: '+e.message+'; въведи токена от BotFather в полето „Активиране на @VachaRiverBot“.')}
 });
 sb.auth.onAuthStateChange((event)=>{
   if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='INITIAL_SESSION')
     setTimeout(()=>refresh().catch(()=>{}),0);
 });
 refresh().catch(e=>status('Проверката на правата не успя: '+e.message));
})();