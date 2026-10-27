'use strict';
const fs=require('node:fs'),path=require('node:path');
const src=path.resolve(__dirname,'..'),dst=path.resolve(__dirname,'www');
const files=['index.html','pack.js','weight.js','stack.js','manual.js','editor.js','free-space.js','free-space-check.js','free-space-ui.js','pallet-basis.js','app.js','pwa.js','ntz-background.jpg','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
fs.rmSync(dst,{recursive:true,force:true});
for(const file of files) {
  const from=path.join(src,file),to=path.join(dst,file);
  if(!fs.existsSync(from))throw Error('Missing asset: '+file);
  fs.mkdirSync(path.dirname(to),{recursive:true});
  fs.copyFileSync(from,to);
}
function patch(file,needle,replacement){
  const p=path.join(dst,file),original=fs.readFileSync(p,'utf8');
  if(!original.includes(needle))throw Error('Upstream layout changed: '+file);
  fs.writeFileSync(p,original.replace(needle,replacement),'utf8');
}
patch('pwa.js',"  const status = document.getElementById('app-status');",
"  const status = document.getElementById('app-status');\n  if(window.Capacitor?.isNativePlatform?.()){\n    install.hidden=true;help.hidden=true;\n    status.textContent='Android приложение — плановете се пазят на телефона.';\n    return;\n  }");
patch('app.js',"$('print').onclick=()=>{updatePlanTitle();window.print()};",
"$('print').onclick=async()=>{updatePlanTitle();if(window.Capacitor?.isNativePlatform?.()){try{await window.Capacitor.nativePromise('TruckNative','printPlan',{})}catch(e){alert('Печат / PDF: '+(e.message||e))}}else window.print()};");
patch('app.js',"$('save').onclick=()=>{","$('save').onclick=async()=>{");
patch('app.js',"let url=URL.createObjectURL(new Blob([JSON.stringify(state(),null,2)],{type:'application/json'}))",
"if(window.Capacitor?.isNativePlatform?.()){try{await window.Capacitor.nativePromise('TruckNative','savePlan',{filename,data:JSON.stringify(state(),null,2)});lastSavedFilename=filename}catch(e){if(!String(e.message||e).includes('cancel'))alert('Запис: '+(e.message||e))}return;}let url=URL.createObjectURL(new Blob([JSON.stringify(state(),null,2)],{type:'application/json'}))");
patch('index.html',"  locationButton.addEventListener('click', () => {\n    if (!navigator.geolocation)",
"  locationButton.addEventListener('click', () => {\n    if(window.Capacitor?.isNativePlatform?.()){\n      locationButton.disabled=true;\n      window.Capacitor.nativePromise('Geolocation','getCurrentPosition',{enableHighAccuracy:false,timeout:10000}).then(p=>{place={latitude:p.coords.latitude,longitude:p.coords.longitude,label:'При теб'};locationButton.disabled=false;refresh()}).catch(()=>{locationButton.disabled=false;detail.textContent='Местоположението не е разрешено. Показва се '+place.label+'.'});\n      return;\n    }\n    if (!navigator.geolocation)");
const css="\n@media(max-width:800px){body{overflow-x:hidden}main{padding:12px}header{padding:13px;gap:10px}header h1{font-size:19px}.ntz-brand{width:64px;height:64px}.card{padding:13px;margin-bottom:12px}.grid{display:block;min-width:0}.row{flex-wrap:wrap;align-items:stretch}.row>label{flex:1 1 130px;min-width:0}.toolbar button{min-height:44px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.metric{padding:10px}.metric strong{font-size:20px}.header-live{padding:10px;gap:8px}.header-live time{font-size:28px}.header-live .live-weather{font-size:18px}#diagram{touch-action:pan-y}input,select,textarea{font-size:16px}}\n";
patch('index.html','</style>',css+'</style>');
console.log('Prepared '+files.length+' site assets for Android.');
