
(()=>{'use strict';
const $=id=>document.getElementById(id);
const bg=document.documentElement.lang==='bg';
const t=(b,e)=>bg?b:e;
const money=n=>new Intl.NumberFormat(bg?'bg-BG':'en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(n);
const menu=$('menuToggle'),nav=$('siteNav');
if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false')}));document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false')}});}
const prices={website:149,calculator:79,catalog:79};
function showEstimate(){const sel=$('estimateType');if(!sel)return;const v=sel.value;const out=$('estimateResult');out.textContent=prices[v]!==undefined?t('от ','from ')+money(prices[v]):t('По оферта','Custom quote');$('estimateNote').textContent=prices[v]!==undefined?t('Начална цена за базов вариант, не автоматична окончателна оферта.','Starting price for the basic version, not a final quote.'):t('Ще уточним функционалността и ще подготвим индивидуална оферта.','We will scope the features and prepare a tailored quote.');}
if($('estimateType')){$('estimateType').addEventListener('change',showEstimate);showEstimate();}
function value(id){const el=$(id);const n=el?Number(el.value):0;return Number.isFinite(n)?Math.max(0,n):0}
function calculateTransport(){if(!$('transportResult'))return;const km=value('km'),fuel=value('fuel'),price=value('fuelprice'),other=value('othercost'),margin=value('margin');const sum=(km*fuel/100*price+other)*(1+margin/100);$('transportResult').textContent=money(sum);};
['km','fuel','fuelprice','othercost','margin'].forEach(id=>{if($(id))$(id).addEventListener('input',calculateTransport)});calculateTransport();
document.querySelectorAll('[data-pick]').forEach(el=>el.addEventListener('click',()=>{const v=(el.closest('#tools')&&$('estimateType'))?$('estimateType').value:el.getAttribute('data-pick');if($('projectService')){$('projectService').value=v;updateInquiry();}if($('estimateType')){$('estimateType').value=v;showEstimate();}}));
function updateInquiry(){if(!$('inquiryPreview'))return;const serv=$('projectService');const service=serv.options[serv.selectedIndex]?.text||'';const fields=bg?[
['Име / фирма',$('clientName').value],['Контакт',$('clientContact').value],['Услуга',service],['Бюджет',$('projectBudget').value],['Описание',$('projectDetails').value]
]:[
['Name / business',$('clientName').value],['Contact',$('clientContact').value],['Service',service],['Budget',$('projectBudget').value],['Project details',$('projectDetails').value]
];$('inquiryPreview').value='DNCH DIGITAL STUDIO · '+t('ЗАПИТВАНЕ','PROJECT INQUIRY')+'\n\n'+fields.map(a=>a[0]+': '+(a[1].trim()||'—')).join('\n\n');}
['clientName','clientContact','projectService','projectBudget','projectDetails'].forEach(id=>{if($(id)){ $(id).addEventListener('input',updateInquiry);$(id).addEventListener('change',updateInquiry)}});updateInquiry();
if($('copyInquiry'))$('copyInquiry').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('inquiryPreview').value);$('copyStatus').textContent=t('Текстът е копиран. Изпрати го по избран от теб канал.','Copied. Send the inquiry using your preferred channel.');}catch(e){$('inquiryPreview').focus();$('inquiryPreview').select();$('copyStatus').textContent=t('Маркирах текста — копирай го ръчно.','Text selected — copy it manually.');}});
if($('downloadInquiry'))$('downloadInquiry').addEventListener('click',()=>{const blob=new Blob([$('inquiryPreview').value],{type:'text/plain;charset=utf-8'});const link=document.createElement('a');const url=URL.createObjectURL(blob);link.href=url;link.download='dnch-studio-inquiry.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('copyStatus').textContent=t('Файлът със запитването е подготвен.','Inquiry text file prepared.');});
})();
