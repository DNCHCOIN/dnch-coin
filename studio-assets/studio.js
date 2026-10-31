(()=>{'use strict';
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(n);
const menu=$('menuToggle'),nav=$('siteNav');
if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');}));document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');}});}
const prices={website:149,calculator:79,catalog:79};
function showEstimate(){const sel=$('estimateType');if(!sel)return;const v=sel.value;const out=$('estimateResult');out.textContent=prices[v]!==undefined?'from '+money(prices[v]):'Custom quote';$('estimateNote').textContent=prices[v]!==undefined?'Starting price for a basic version, not a final quote.':'We will scope the features and prepare a tailored quote.';}
if($('estimateType')){$('estimateType').addEventListener('change',showEstimate);showEstimate();}
function value(id){const el=$(id);const n=el?Number(el.value):0;return Number.isFinite(n)?Math.max(0,n):0;}
function calculateTransport(){if(!$('transportResult'))return;const km=value('km'),fuel=value('fuel'),price=value('fuelprice'),other=value('othercost'),markup=value('margin');$('transportResult').textContent=money((km*fuel/100*price+other)*(1+markup/100));}
['km','fuel','fuelprice','othercost','margin'].forEach(id=>{if($(id))$(id).addEventListener('input',calculateTransport);});calculateTransport();
const serviceMap={website:'Website / landing page',calculator:'Business software / calculator',catalog:'QR menu / digital catalog',shop:'Online store',ai:'AI assistant / automation',design:'Design / branding',support:'Maintenance and growth','3d-design':'3D Design & Visualization','media-editing':'Photo, Video & Audio Editing','ai-assistants':'AI Assistants & Automation','android-apps':'Android App Development & Maintenance','linux-os':'Linux OS Customization & Optimization','os-ai-integration':'OS Tools & AI Assistant Integration','crypto-tokens':'Crypto Token Creation & Technical Optimization','windows-repair':'Windows Repair & Optimization','pc-configurator':'Custom Desktop PC Configuration','overclocking':'Hardware Overclocking & Modifications'};
function selectService(key){const service=$('projectService');if(service&&serviceMap[key])service.value=serviceMap[key];}
document.querySelectorAll('[data-pick]').forEach(el=>el.addEventListener('click',()=>{const type=el.closest('#tools')&&$('estimateType')?$('estimateType').value:el.getAttribute('data-pick');selectService(type);if($('estimateType')&&prices[type]!==undefined){$('estimateType').value=type;showEstimate();}}));
const query=new URLSearchParams(window.location.search);
const requestedService=query.get('service'),requestedTool=query.get('tool');
if(requestedService && Object.prototype.hasOwnProperty.call(serviceMap,requestedService) && $('projectService')){
selectService(requestedService);
if($('projectDetails')) $('projectDetails').value='I would like a proposal for '+serviceMap[requestedService]+'.\n\nMy project requirements: ';
}
if(requestedTool&&$('projectService')&&$('projectDetails')){selectService('calculator');$('projectDetails').value='I am interested in a customized implementation of: '+requestedTool.slice(0,180)+'\n\nCompany requirements: ';}
const form=$('projectInquiryForm'),submit=$('sendInquiry');if(form&&submit){form.addEventListener('submit',()=>{submit.textContent='Opening secure form verification…';submit.setAttribute('aria-busy','true');setTimeout(()=>{submit.textContent='Send project inquiry ↗';submit.removeAttribute('aria-busy');},6000);});}
})();