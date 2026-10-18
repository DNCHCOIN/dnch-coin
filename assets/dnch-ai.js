/* DNCH AI widget — clear preview state until a secure backend is activated.
   No iframe of ChatGPT, no secret API key and no fabricated AI replies. */
(()=>{'use strict';
const bg=document.documentElement.lang==='bg';
const T=bg?{
 title:'DNCH AI',open:'Отвори DNCH AI',close:'Затвори чата',start:'Добре дошъл в DNCH AI!',
 preview:'Подготвяме AI асистент за въпросите ти. Истинският разговор ще се включи след настройка на защитената връзка с OpenAI.',
 notLive:'AI чатът все още не е активиран.',openChatGPT:'Междувременно: отвори ChatGPT',privacy:'Не изпращай пароли, лични или финансови данни. След активиране текстът ще се обработва от OpenAI.',
 login:'За пилотния тест е необходим потвърден DNCH профил.',signIn:'Вход в DNCH Community',input:'Напиши съобщение...',send:'Изпрати',thinking:'DNCH AI подготвя отговор…',failure:'Временно няма връзка с AI. Опитай пак по-късно.',daily:'Лимитът за днес е достигнат.',busy:'Изпращане…',
 powered:'Планирана интеграция с OpenAI',newChat:'Нов разговор'
}:{
 title:'DNCH AI',open:'Open DNCH AI',close:'Close chat',start:'Welcome to DNCH AI!',
 preview:'We are preparing a helpful AI assistant. Real AI replies will work after the secure OpenAI connection is configured.',
 notLive:'AI chat is not active yet.',openChatGPT:'For now: open ChatGPT',privacy:'Do not share passwords, sensitive personal or financial details. After activation messages are processed by OpenAI.',
 login:'A verified DNCH account is required for this early pilot.',signIn:'Sign in to DNCH Community',input:'Type a message...',send:'Send',thinking:'DNCH AI is thinking…',failure:'AI is temporarily unavailable. Try later.',daily:'Daily usage limit reached.',busy:'Sending…',
 powered:'Planned OpenAI integration',newChat:'New chat'
};
const cfg=window.DNCH_AI_CONFIG||{};
const active=cfg.enabled===true;
const wrap=document.createElement('div');wrap.className='dnch-ai-root';
function el(tag,cls,label){const node=document.createElement(tag);if(cls)node.className=cls;if(label!==undefined)node.textContent=label;return node}
const toggle=el('button','dnch-ai-toggle','✦  '+T.title);toggle.type='button';toggle.setAttribute('aria-label',T.open);toggle.setAttribute('aria-expanded','false');
const dialog=el('section','dnch-ai-window');dialog.id='dnch-ai-window';dialog.setAttribute('role','region');dialog.setAttribute('aria-label',T.title);dialog.hidden=true;
const header=el('div','dnch-ai-header');const heading=el('div','dnch-ai-heading');
const title=el('strong',null,T.title),tagline=el('span',null,T.powered);heading.append(title,tagline);
const close=el('button','dnch-ai-close','×');close.type='button';close.setAttribute('aria-label',T.close);
header.append(heading,close);
const content=el('div','dnch-ai-content');
const intro=el('p','dnch-ai-intro',T.start);content.appendChild(intro);
const notice=el('p','dnch-ai-notice',T.preview);notice.hidden=active;
const external=el('a','dnch-ai-external',T.openChatGPT+' ↗');external.href='https://chatgpt.com/';external.target='_blank';external.rel='noopener noreferrer';external.hidden=active;
const privacy=el('p','dnch-ai-privacy',T.privacy);
const login=el('div','dnch-ai-login',T.login);login.hidden=!active;
const loginLink=el('a',null,T.signIn+' →');loginLink.href=(bg?'forum.html?pilot=1':'forum.html?pilot=1');login.appendChild(loginLink);
const messages=el('div','dnch-ai-messages');messages.setAttribute('role','log');messages.setAttribute('aria-live','polite');
const status=el('p','dnch-ai-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const form=el('form','dnch-ai-form');
const input=el('textarea','dnch-ai-input');input.rows=2;input.maxLength=600;input.required=true;input.placeholder=T.input;input.setAttribute('aria-label',T.input);
const send=el('button','dnch-ai-send',T.send);send.type='submit';
const reset=el('button','dnch-ai-reset',T.newChat);reset.type='button';
form.append(input,send);
if(!active){input.disabled=true;send.disabled=true;status.textContent=T.notLive}else{form.hidden=true}
content.append(notice,external,login,messages,status,form,reset,privacy);
reset.hidden=!active;
dialog.append(header,content);wrap.append(toggle,dialog);document.body.appendChild(wrap);
function toggleOpen(open){dialog.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?T.close:T.open);if(open&&!input.disabled)input.focus()}
toggle.addEventListener('click',()=>toggleOpen(dialog.hidden));
close.addEventListener('click',()=>toggleOpen(false));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialog.hidden){toggleOpen(false);toggle.focus()}});
if(!active)return;
// Limited owner's pilot: server enforces verified JWT, admin membership and daily quota.
const settings=window.DNCH_FORUM_CONFIG;
if(!settings?.url||!settings?.publishableKey||!/^https:\/\/[^/]+\.supabase\.co\/functions\/v1\/dnch-ai-chat$/.test(cfg.endpoint||'')){
 status.textContent=T.notLive;return;
}
let client,session=null,busy=false;const history=[];
async function loadSession(){
 try{
 const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
 client=mod.createClient(settings.url,settings.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 const s=await client.auth.getSession();session=s.data.session;
 client.auth.onAuthStateChange((_evt,next)=>{session=next;updateSession()});
 updateSession();
 }catch(e){console.warn('AI session could not initialize',e);status.textContent=T.failure}
}
function updateSession(){
 const valid=!!session?.access_token;
 login.hidden=valid;form.hidden=!valid;input.disabled=!valid||busy;send.disabled=!valid||busy;
 status.textContent=valid?'':T.login
}
function message(role,text){const item=el('div','dnch-ai-msg '+(role==='user'?'is-user':'is-ai'),text);messages.appendChild(item);messages.scrollTop=messages.scrollHeight}
function setBusy(value){busy=value;input.disabled=value;send.disabled=value;send.textContent=value?T.busy:T.send}
reset.addEventListener('click',()=>{history.length=0;messages.replaceChildren();status.textContent='';input.value=''});
form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!session?.access_token)return;
 const question=input.value.trim();if(!question||question.length>600)return;
 input.value='';message('user',question);setBusy(true);status.textContent=T.thinking;
 try{
  const conversation=[...history.slice(-6),{role:'user',content:question}];
  const result=await fetch(cfg.endpoint,{method:'POST',headers:{
   'Content-Type':'application/json','Authorization':'Bearer '+session.access_token
  },body:JSON.stringify({messages:conversation})});
  if(result.status===429){status.textContent=T.daily;return}
  if(!result.ok){status.textContent=T.failure;return}
  const data=await result.json();if(typeof data?.reply!=='string'||!data.reply.trim())throw Error('Empty response');
  history.push({role:'user',content:question},{role:'assistant',content:data.reply});
  if(history.length>8)history.splice(0,history.length-8);
  message('assistant',data.reply);status.textContent='';
 }catch(e){console.warn('AI request unavailable',e);status.textContent=T.failure}
 finally{setBusy(false);if(!dialog.hidden)input.focus()}
});
loadSession();
})();
