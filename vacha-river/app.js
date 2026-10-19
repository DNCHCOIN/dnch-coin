(()=>{'use strict';
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>console.warn('PWA:',e)))}
let deferred=null;const b=document.getElementById('install-app');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;b.hidden=false});
b.addEventListener('click',async()=>{if(!deferred){alert('На iPhone: Споделяне → Добави към Начален екран. На Android: меню ⋮ → Инсталирай приложението.');return}deferred.prompt();await deferred.userChoice;deferred=null;b.hidden=true});
window.addEventListener('appinstalled',()=>{deferred=null;b.hidden=true});
})();
