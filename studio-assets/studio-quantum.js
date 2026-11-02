/* DNCH / Quantum UI: unobtrusive scroll progress & accessible section reveal */
(()=>{
'use strict';
const bar=document.createElement('div');bar.className='q-scroll-progress';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar);
let pending=false;
function update(){
  const doc=document.documentElement,limit=doc.scrollHeight-window.innerHeight;
  bar.style.width=(limit>0?Math.min(100,Math.max(0,doc.scrollTop/limit*100)):0)+'%';pending=false;
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(update)}}
document.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});update();
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduce&&'IntersectionObserver' in window){
 const list=[...document.querySelectorAll('.quantum-section .section-header,.quantum-showcase .q-intro,.quantum-showcase .q-capability,.quantum-section .service-card,.quantum-section .project-card,.quantum-section .tool-panel,.quantum-section .step-card')];
 const obs=new IntersectionObserver(entries=>{
   for(const e of entries)if(e.isIntersecting){e.target.classList.add('q-in');obs.unobserve(e.target)}
 },{rootMargin:'0px 0px 70px 0px',threshold:0.02});
 list.forEach(el=>el.classList.add('q-reveal'));
 document.documentElement.classList.add('q-ready');
 list.forEach(el=>obs.observe(el));
}
})();
