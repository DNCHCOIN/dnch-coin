(()=>{'use strict';
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
      reg.update().catch(()=>{});
      window.setInterval(()=>reg.update().catch(()=>{}),5*60*1000);
    }).catch(e=>console.warn('PWA:',e));
  });
  // New worker: show a simple update control rather than forcing reload during uploads.
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(document.getElementById('vacha-update-banner'))return;
    const panel=document.createElement('div');
    panel.id='vacha-update-banner';
    panel.setAttribute('role','status');
    panel.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;max-width:420px;margin:auto;background:#153c31;color:#fff;border:1px solid #79bb90;border-radius:14px;box-shadow:0 12px 50px #0005;padding:15px;z-index:9999;display:flex;align-items:center;gap:12px;font-size:13px';
    const note=document.createElement('span');
    note.textContent='Има нова версия на Река Въча.';
    const refresh=document.createElement('button');
    refresh.type='button';refresh.textContent='Обнови';refresh.style.cssText='margin-left:auto;background:#d2efc8;color:#123c29;border:0;border-radius:8px;padding:9px 11px;font-weight:800;cursor:pointer';
    refresh.addEventListener('click',()=>window.location.reload());
    panel.append(note,refresh);document.body.appendChild(panel);
  });
}
let deferred=null;const b=document.getElementById('install-app');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;b.hidden=false});
b.addEventListener('click',async()=>{if(!deferred){alert('На iPhone: Споделяне → Добави към Начален екран. На Android: меню ⋮ → Инсталирай приложението.');return}deferred.prompt();await deferred.userChoice;deferred=null;b.hidden=true});
window.addEventListener('appinstalled',()=>{deferred=null;b.hidden=true});
})();
