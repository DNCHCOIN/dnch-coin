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
  <div id="ntz-ai-draft"></div><div class="ntz-ai-actions"><button id="ntz-ai-import" type="button">Добави проверените товари</button><button id="ntz-ai-reject" type="button">Откажи</button></div>
 </div>
 <details id="ntz-ai-ocr-details" hidden><summary>Редактирай разпознатия текст</summary><textarea id="ntz-ai-ocr-text" rows="4" placeholder="Например: Товар 1: 120x80x160 см 450 кг 8 бр."></textarea><button id="ntz-ai-parse" type="button">Извлечи размерите от текста</button></details>
 <div id="ntz-ai-status" role="status"></div>
 <div class="ntz-ai-shortcuts"><button type="button" data-prompt="Какво можеш да правиш?">Помощ</button><button type="button" data-prompt="Как работи виртуалното продължение?">Извън ремаркето</button><button type="button" data-prompt="Подреди">Подреди</button></div>
 <form id="ntz-ai-form">
  <label class="ntz-ai-attach" for="ntz-ai-image" title="Добави снимка">📷<span class="ntz-ai-sr">Добави изображение</span></label>
  <input id="ntz-ai-image" type="file" multiple accept="image/*" hidden>
  <textarea id="ntz-ai-input" rows="2" placeholder="Питай или постави размери…" aria-label="Съобщение до NTZ помощника"></textarea>
  <button id="ntz-ai-send" type="submit">Изпрати</button>
 </form>
 <p class="ntz-ai-disclaimer">Локален помощник, не облачен AI. OCR разчита на телефона и изтегля езикови файлове при първа употреба. Провери всеки товар.</p>
</section>`;
document.body.appendChild(dock);
const $=id=>document.getElementById(id);
const win=$('ntz-ai-window'),launch=$('ntz-ai-launch'),log=$('ntz-ai-log'),status=$('ntz-ai-status');
let worker=null,busy=false;
function message(text,from='bot'){const bubble=document.createElement('div');bubble.className='ntz-ai-bubble '+(from==='user'?'ntz-ai-user':'ntz-ai-bot');bubble.textContent=String(text);log.appendChild(bubble);log.scrollTop=log.scrollHeight;}
message('Здравейте, аз съм NTZ AI помощникът. С какво да помогна?');
function open(){win.hidden=false;launch.setAttribute('aria-expanded','true');$('ntz-ai-input').focus();}
function close(){win.hidden=true;launch.setAttribute('aria-expanded','false');}
launch.onclick=()=>win.hidden?open():close();$('ntz-ai-close').onclick=close;
function clearDraft(){$('ntz-ai-review').hidden=true;$('ntz-ai-draft').replaceChildren();}
function makeInput(value,label){const input=document.createElement('input');input.value=String(value??'');input.setAttribute('aria-label',label);return input;}
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
 message('Разпознах '+rows.length+' реда. Провери данните в таблицата, преди да ги добавиш.');
}
function parseText(text){const rows=core.parseRows(text);$('ntz-ai-ocr-details').hidden=false;$('ntz-ai-ocr-text').value=text;if(rows.length){showDraft(rows);}else{clearDraft();message('Не намерих достатъчно ясни размери. Можеш да поправиш разпознатия текст. Пример: Товар 1: 120x80x160 см 450 кг 8 бр.');}return rows.length;}
function applyDraft(){
 const rows=[],errors=[];let n=0;
 for(const tr of $('ntz-ai-draft').querySelectorAll('tbody tr')){
  n++;const v={};for(const input of tr.querySelectorAll('input'))v[input.dataset.col]=input.value.trim();
  const l=Number(v.l.replace(',','.')),w=Number(v.w.replace(',','.')),height=v.height===''?'':Number(v.height.replace(',','.')),weight=Number(v.weight.replace(',','.')),q=Number(v.q.replace(',','.'));
  if(!Number.isFinite(l)||l<=0||!Number.isFinite(w)||w<=0||height!==''&&(!Number.isFinite(height)||height<=0)||!Number.isFinite(weight)||weight<=0||!Number.isInteger(q)||q<1||q>100){errors.push(n);continue;}
  rows.push({name:v.name||'Товар '+n,l,w,height,weight,q,unit:'cm',rotate:true,stackable:false});
 }
 const existing=Array.from($('rows').children).filter(tr=>tr.querySelector('[aria-label="Дължина на товара"]')?.value.trim());
 if(errors.length||rows.reduce((s,r)=>s+r.q,0)+existing.length>100){status.textContent=errors.length?'Поправи невалидните стойности в редове: '+errors.join(', '):'Прекалено много товарни единици — лимитът е 100.';return;}
 for(const tr of [...$('rows').children]){const a=tr.querySelector('[aria-label="Дължина на товара"]'),b=tr.querySelector('[aria-label="Ширина на товара"]'),c=tr.querySelector('[aria-label="Килограми за един брой"]');if(a&&!a.value.trim()&&b&&!b.value.trim()&&c&&!c.value.trim())tr.remove();}
 for(const r of rows)add(r);
 changed();clearDraft();$('ntz-ai-ocr-details').hidden=true;status.textContent='';
 message('Добавих '+rows.length+' реда ('+rows.reduce((s,r)=>s+r.q,0)+' товарни единици). Не разреших стифиране. Натисни „Подреди“, за да изчислиш плана.');
}
$('ntz-ai-import').onclick=applyDraft;$('ntz-ai-reject').onclick=()=>{clearDraft();message('Отказано. Няма промени по товарите.');};
$('ntz-ai-parse').onclick=()=>parseText($('ntz-ai-ocr-text').value);
function submitText(input){
 const text=String(input||'').trim();if(!text)return;message(text,'user');
 const rows=core.parseRows(text);if(rows.length){parseText(text);return;}
 if(core.intent(text)==='solve'){$('solve').click();message('Стартирах подреждането на въведените товари. Резултатът е в „План на товарене“.');return;}
 message(core.help(text));
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
window.NTZAssistantUI={open,parseText,submitText};
})();