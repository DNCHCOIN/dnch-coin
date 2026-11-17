(function(){
'use strict';
const core=window.NTZAssistantCore;
const dock=document.createElement('div');dock.id='ntz-ai-dock';
dock.innerHTML=`
<button id="ntz-ai-launch" type="button" aria-controls="ntz-ai-window" aria-expanded="false">✦ NTZ AI помощник</button>
<section id="ntz-ai-window" hidden aria-label="NTZ AI помощник">
 <div class="ntz-ai-head"><div><strong>NTZ AI помощник</strong><small>Локален режим · чат, снимки, товарни планове</small></div><button id="ntz-ai-close" type="button" aria-label="Затвори">×</button></div>
 <div id="ntz-ai-log" role="log" aria-live="polite" aria-relevant="additions"></div>
 <div id="ntz-ai-review" hidden>
  <strong>Провери разпознатите товари</strong>
  <p>Размерите, теглото и бройките може да са разчетени неточно. Поправи ги преди добавяне.</p>
  <div id="ntz-ai-draft"></div><div class="ntz-ai-actions"><button id="ntz-ai-import" type="button">Добави проверените товари</button><button id="ntz-ai-import-solve" type="button">Добави и изчисли</button><button id="ntz-ai-reject" type="button">Откажи</button></div>
 </div>
 <details id="ntz-ai-ocr-details" hidden><summary>Редактирай разпознатия текст</summary><textarea id="ntz-ai-ocr-text" rows="4" placeholder="Например: Товар 1: 120x80x160 см 450 кг 8 бр."></textarea><button id="ntz-ai-parse" type="button">Извлечи размерите от текста</button></details>
 <div id="ntz-ai-status" role="status"></div>
 <div class="ntz-ai-shortcuts"><button type="button" data-prompt="Какво можеш да правиш?">Помощ</button><button type="button" data-prompt="Как работи виртуалното продължение?">Извън ремаркето</button><button type="button" data-prompt="Подреди">Подреди</button></div>
 <form id="ntz-ai-form">
  <label class="ntz-ai-attach" for="ntz-ai-image" title="Добави снимка">📷<span class="ntz-ai-sr">Добави изображение</span></label>
  <input id="ntz-ai-image" type="file" multiple accept="image/*" hidden>
  <textarea id="ntz-ai-input" rows="2" placeholder="Питай, постави снимка с Ctrl+V или въведи размери…" aria-label="Съобщение до NTZ помощника"></textarea>
  <button id="ntz-ai-mic" type="button" aria-label="Говори на NTZ помощника" title="Говори на български">🎙</button>
  <button id="ntz-ai-send" type="submit">Изпрати</button>
 </form>
 <p class="ntz-ai-disclaimer">Локално управление с разговор: товари, палети, подреждане, справки, PDF и ръчни промени. Няма облачен AI модел. Гласовото разпознаване зависи от браузъра; може да използва външна услуга. OCR изтегля езикови файлове при първа употреба. Проверявай резултатите.</p>
</section>`;
document.body.appendChild(dock);
const $=id=>document.getElementById(id);
const win=$('ntz-ai-window'),launch=$('ntz-ai-launch'),log=$('ntz-ai-log'),status=$('ntz-ai-status');
let worker=null,busy=false;
function message(text,from='bot'){const bubble=document.createElement('div');bubble.className='ntz-ai-bubble '+(from==='user'?'ntz-ai-user':'ntz-ai-bot');bubble.textContent=String(text);log.appendChild(bubble);log.scrollTop=log.scrollHeight;}
message('Здравейте, аз съм NTZ AI помощникът. С какво да помогна?');
function open(){win.hidden=false;launch.setAttribute('aria-expanded','true');$('ntz-ai-input').focus();loadOCR().catch(()=>{});}
function close(){win.hidden=true;launch.setAttribute('aria-expanded','false');}
launch.onclick=()=>win.hidden?open():close();$('ntz-ai-close').onclick=close;
function clearDraft(){$('ntz-ai-review').hidden=true;$('ntz-ai-draft').replaceChildren();$('ntz-ai-preview')?.remove();}
function makeInput(value,label){const input=document.createElement('input');input.value=String(value??'');input.setAttribute('aria-label',label);return input;}
function estimateOCR(rows){
 const t=window.NTZAssistantActions.trailerState();
 const f={mm:0.1,cm:1,m:100};
 const quantity=rows.reduce((s,r)=>s+r.q,0);
 const area=rows.reduce((s,r)=>s+r.l*f[r.unit]*r.w*f[r.unit]*r.q,0);
 const kgKnown=rows.every(r=>Number.isFinite(Number(r.weight))&&Number(r.weight)>0);
 const totalWeight=kgKnown?rows.reduce((s,r)=>s+Number(r.weight)*r.q,0):null;
 const basis=window.PalletBasis?.get?.($('palletBasis').value,{length:$('palletCustomLength').value,width:$('palletCustomWidth').value});
 const dec=x=>Number(x).toLocaleString('bg-BG',{maximumFractionDigits:2});
 let text='Бърза справка по снимката: '+rows.length+' реда, '+quantity+' товарни единици, '+dec(area/10000)+' м² площ на товарите.';
 if(t.w>0)text+=' Минимум по площ без стифиране: '+dec(area/t.w/100)+' л.м. (долна граница, НЕ готов план).';
 if(basis&&basis.area>0)text+=' Площен еквивалент: '+dec(area/10000/basis.area)+' палета '+basis.label+' (не тарифни палетоместа по дължина).';
 if(!kgKnown)return text+' Липсват килограми — за товарен план и тегловна проверка ги попълни.';
 text+=' Общо тегло: '+dec(totalWeight)+' кг.';
 if(rows.some(r=>Number(r.height)>t.h/(f[r.unit]||1)))return text+' Внимание: част от товарите надвишават височината на ремаркето.';
 try{
  const g=t.g,items=[],H=t.h;
  for(const [i,r] of rows.entries()){
   const factor=f[r.unit]||1,l=r.l*factor,w=r.w*factor,h=r.height===''?null:Number(r.height)*factor;
   if(!Number.isInteger(r.q)||r.q<1||r.q>100||!Number.isFinite(l)||!Number.isFinite(w)||l<=0||w<=0||Number(r.weight)<=0)throw Error('Invalid draft');
   for(let k=0;k<r.q;k++)items.push({id:items.length+1,type:i,name:r.name,l:l+g,w:w+g,actualL:l,actualW:w,weight:Number(r.weight),height:h,rotate:true,stackable:false});
  }
  if(items.length>100)return text+' Над 100 товара — раздели на отделни планове.';
  if(window.StackPacker?.solve){
   const r=window.StackPacker.solve(items,t.w,t.l,H,g,false,$('weightLimit').checked);
   if(r){const len=Math.max(0,r.used-g);text+=' Намерено предварително подреждане: '+dec(len/100)+' л.м.';
    if(basis)text+=' Приравняване по дължина: '+dec(len/100*basis.rate)+' тарифни палетоместа.';
    text+=' Това е план само за товарите от снимката, без да изменя въведения план.';
   }else text+=' Не е намерено допустимо подреждане за тези товари; може да е необходим друг автомобил или разделяне.';
  }
 }catch(e){text+=' Не може да се изчисли геометричен план преди проверка на данните.';}
 return text;
}
function showDraft(rows){
 clearDraft();const table=document.createElement('table'),thead=document.createElement('thead'),head=document.createElement('tr');
 for(const label of ['Товар','Д, см','Ш, см','В, см','Кг/бр.','Брой']){const th=document.createElement('th');th.textContent=label;head.appendChild(th);}
 thead.appendChild(head);table.appendChild(thead);const tbody=document.createElement('tbody');
 rows.slice(0,100).forEach((r,i)=>{
  const tr=document.createElement('tr');
  const factor=r.unit==='mm'?0.1:r.unit==='m'?100:1;
  [r.name,r.l*factor,r.w*factor,r.height===''?'':r.height*factor,r.weight,r.q].forEach((v,j)=>{
   const td=document.createElement('td'),field=makeInput(v,['Име','Дължина','Ширина','Височина','Кг за брой','Брой'][j]+' товар '+(i+1));
   field.dataset.col=['name','l','w','height','weight','q'][j];td.appendChild(field);tr.appendChild(td);
  });tbody.appendChild(tr);
 });table.appendChild(tbody);$('ntz-ai-draft').appendChild(table);$('ntz-ai-review').hidden=false;
 const preview=document.createElement('p');preview.id='ntz-ai-preview';preview.setAttribute('role','status');preview.textContent=estimateOCR(rows);$('ntz-ai-review').insertBefore(preview,$('ntz-ai-draft'));
 message('Разпознах '+rows.length+' реда ('+rows.reduce((sum,r)=>sum+r.q,0)+' товарни единици). '+(rows.some(r=>!Number(r.weight))?'Липсват килограми за някои товари — попълни „Кг/бр.“ преди добавяне. ':'')+'Провери размерите, височините и броя в таблицата преди добавяне.');
}
function parseText(text){const rows=core.parseRows(text);$('ntz-ai-ocr-details').hidden=false;$('ntz-ai-ocr-text').value=text;if(rows.length){showDraft(rows);}else{clearDraft();message('Не намерих достатъчно ясни размери. Можеш да поправиш разпознатия текст. Пример: Товар 1: 120x80x160 см 450 кг 8 бр.');}return rows.length;}
function applyDraft(solveAfter=false){
 const rows=[],errors=[];let n=0;
 for(const tr of $('ntz-ai-draft').querySelectorAll('tbody tr')){
  n++;const v={};for(const input of tr.querySelectorAll('input'))v[input.dataset.col]=input.value.trim();
  const l=Number(v.l.replace(',','.')),w=Number(v.w.replace(',','.')),height=v.height===''?'':Number(v.height.replace(',','.')),weight=Number(v.weight.replace(',','.')),q=Number(v.q.replace(',','.'));
  if(!Number.isFinite(l)||l<=0||!Number.isFinite(w)||w<=0||height!==''&&(!Number.isFinite(height)||height<=0)||!Number.isFinite(weight)||weight<=0||!Number.isInteger(q)||q<1||q>100){errors.push(n);continue;}
  rows.push({name:v.name||'Товар '+n,l,w,height,weight,q,unit:'cm',rotate:true,stackable:false});
 }
 const existing=Array.from($('rows').children).filter(tr=>tr.querySelector('[aria-label="Дължина на товара"]')?.value.trim());
 const usedCount=existing.reduce((n,tr)=>n+(Number(tr.querySelector('[aria-label="Брой"]')?.value)||0),0);
 if(errors.length||rows.reduce((s,r)=>s+r.q,0)+usedCount>100){status.textContent=errors.length?'Поправи невалидните стойности в редове: '+errors.join(', '):'Прекалено много товарни единици — лимитът е 100.';return;}
 for(const tr of [...$('rows').children]){const a=tr.querySelector('[aria-label="Дължина на товара"]'),b=tr.querySelector('[aria-label="Ширина на товара"]'),c=tr.querySelector('[aria-label="Килограми за един брой"]');if(a&&!a.value.trim()&&b&&!b.value.trim()&&c&&!c.value.trim())tr.remove();}
 for(const r of rows)add(r);
 changed();clearDraft();$('ntz-ai-ocr-details').hidden=true;status.textContent='';
 if(solveAfter){$('solve').click();message('Потвърдените товари са добавени и стартирах подреждане. Провери резултата в „План на товарене“.');}
 else message('Добавих '+rows.length+' реда ('+rows.reduce((s,r)=>s+r.q,0)+' товарни единици). Не разреших стифиране. Натисни „Подреди“, за да изчислиш плана.');
}
$('ntz-ai-import').onclick=()=>applyDraft(false);$('ntz-ai-import-solve').onclick=()=>applyDraft(true);$('ntz-ai-reject').onclick=()=>{clearDraft();message('Отказано. Няма промени по товарите.');};
$('ntz-ai-parse').onclick=()=>parseText($('ntz-ai-ocr-text').value);
function submitText(input){
 const text=String(input||'').trim();if(!text)return;message(text,'user');
 const rows=text.includes('\n')?core.parseRows(text):[];
 if(rows.length>1 && !/\?/.test(text)){parseText(text);return;}
 const reply=window.NTZAssistantActions.handle(text);
 if(reply)message(reply);
}
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let recognition=null;
const mic=$('ntz-ai-mic');
if(!SpeechRecognition){mic.title='Гласовото разпознаване не се поддържа в този браузър';mic.disabled=true;}
else {
 mic.onclick=()=>{
  if(recognition){recognition.stop();return;}
  try{
   const r=new SpeechRecognition();r.lang='bg-BG';r.interimResults=false;r.continuous=false;r.maxAlternatives=1;
   recognition=r;mic.textContent='■';mic.setAttribute('aria-label','Спри слушането');
   status.textContent='Слушам на български…';
   r.onresult=e=>{const value=e.results?.[0]?.[0]?.transcript?.trim();if(value){status.textContent='Разпознато: '+value;submitText(value);}};
   r.onerror=e=>{status.textContent='Гласова грешка: '+(e.error||'неизвестна')+'. Можеш да използваш текста.';};
   r.onend=()=>{recognition=null;mic.textContent='🎙';mic.setAttribute('aria-label','Говори на NTZ помощника');if(status.textContent==='Слушам на български…')status.textContent='Микрофонът е спрян.';};
   r.start();
  }catch(e){recognition=null;mic.textContent='🎙';status.textContent='Микрофонът е недостъпен: '+(e.message||String(e));}
 };
}

$('ntz-ai-form').onsubmit=e=>{e.preventDefault();const text=$('ntz-ai-input').value;$('ntz-ai-input').value='';submitText(text);};
for(const b of dock.querySelectorAll('[data-prompt]'))b.onclick=()=>submitText(b.dataset.prompt);
$('ntz-ai-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('ntz-ai-form').requestSubmit();}});
function loadOCR(){if(window.Tesseract)return Promise.resolve();return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';s.crossOrigin='anonymous';s.onload=()=>window.Tesseract?resolve():reject(Error('Библиотеката не се зареди'));s.onerror=()=>reject(Error('Не може да се изтегли OCR библиотеката'));document.head.appendChild(s);});}
async function extractImages(files){
 if(busy)return;const list=Array.from(files).slice(0,6).filter(f=>f.type.startsWith('image/')&&f.size<=15*1024*1024);if(!list.length){message('Избери до 6 снимки, всяка под 15 MB.');return;}
 busy=true;$('ntz-ai-image').disabled=true;status.textContent='Зареждане на локалното OCR…';message('Прикачени са '+list.length+' изображения. Опитвам да разпозная текст на устройството.');
 try{
  await loadOCR();if(!worker)worker=await Tesseract.createWorker('bul+eng',1,{logger:m=>{if(m.status==='recognizing text')status.textContent='OCR: '+Math.round((m.progress||0)*100)+'%';}});
  const text=[];for(let i=0;i<list.length;i++){status.textContent='Снимка '+(i+1)+'/'+list.length;const r=await worker.recognize(list[i]);text.push(r.data.text||'');}
  status.textContent='Готово: провери стойностите.';parseText(text.join('\n'));
 }catch(e){status.textContent='Неуспешно OCR: '+(e?.message||String(e));message('Не успях да разчета изображението автоматично. Можеш да напишеш или поставиш размери като текст.');}
 finally{busy=false;$('ntz-ai-image').disabled=false;$('ntz-ai-image').value='';}
}
$('ntz-ai-image').onchange=e=>{if(e.target.files?.length)extractImages(e.target.files);};
const chatInput=$('ntz-ai-input');
chatInput.addEventListener('paste',e=>{
 const files=[...e.clipboardData?.files||[]].filter(f=>f.type?.startsWith('image/'));
 if(files.length){e.preventDefault();open();extractImages(files);}
});
chatInput.addEventListener('dragover',e=>{if(e.dataTransfer?.types?.includes('Files'))e.preventDefault();});
chatInput.addEventListener('drop',e=>{
 const files=[...e.dataTransfer?.files||[]].filter(f=>f.type?.startsWith('image/'));
 if(files.length){e.preventDefault();open();extractImages(files);}
});
window.NTZAssistantUI={open,parseText,submitText};
})();