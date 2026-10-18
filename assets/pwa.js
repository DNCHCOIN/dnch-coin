/* DNCH Mobile v0.1: opt-in installation guidance and scoped PWA registration.
   Native install prompts only run after direct user clicks; no forced install. */
(()=>{
'use strict';
const bg=document.documentElement.lang==='bg';
const T=bg?{
 install:'Инсталирай DNCH',how:'Как да добавиш DNCH',
 ios:'На iPhone отвори менюто за споделяне в Safari и избери „Добави към началния екран“.',
 manual:'Отвори менюто на браузъра и избери „Инсталиране“ или „Добавяне към началния екран“, ако опцията е налична.',
 done:'DNCH е добавен към приложенията ти.',dismiss:'Инсталирането е отменено. Можеш да опиташ отново.',
 unsupported:'Инсталирането зависи от браузъра. Можеш да използваш DNCH и през сайта.'
}:{
 install:'Install DNCH',how:'How to add DNCH',
 ios:'On iPhone, open the Share menu in Safari and choose “Add to Home Screen”.',
 manual:'Open your browser menu and choose “Install app” or “Add to Home screen”, if available.',
 done:'DNCH has been added to your apps.',dismiss:'Installation canceled. You can try again.',
 unsupported:'Installation depends on your browser. DNCH also works directly in the browser.'
};
const script=document.currentScript;
const workerUrl=script?new URL('../service-worker.js',script.src):null;
if(workerUrl&&'serviceWorker' in navigator&&location.protocol==='https:'){
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register(workerUrl.href,{scope:new URL('../',script.src).pathname})
   .catch(e=>console.warn('DNCH PWA registration unavailable',e));
 });
}
const button=document.getElementById('dnch-install-button');
const info=document.getElementById('dnch-install-info');
if(!button||!info)return;
let pending=null;
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=/(iphone|ipad|ipod)/i.test(navigator.userAgent);
function visible(){
 button.hidden=standalone();
 button.textContent=pending?T.install:(ios?T.how:T.install);
}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();
 pending=event;
 visible();
});
window.addEventListener('appinstalled',()=>{
 pending=null;button.hidden=true;info.textContent=T.done;
});
button.addEventListener('click',async()=>{
 if(standalone()){button.hidden=true;return}
 if(pending){
  const prompt=pending;pending=null;
  try{
   await prompt.prompt();
   const result=await prompt.userChoice;
   info.textContent=result?.outcome==='accepted'?T.done:T.dismiss;
  }catch(e){info.textContent=T.manual}
  visible();
 }else{
  info.textContent=ios?T.ios:T.manual;
  info.hidden=false;
 }
});
visible();
})();
