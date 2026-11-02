/* DNCH STUDIO NEXUS — real interaction; retain existing studio.js form prefill */
(()=>{"use strict";
const meter=document.getElementById("scrollMeter");let queued=false;
function progress(){queued=false;if(!meter)return;const d=document.documentElement;meter.style.width=(d.scrollHeight>innerHeight?Math.min(100,100*d.scrollTop/(d.scrollHeight-innerHeight)):0)+"%"}
window.addEventListener("scroll",()=>{if(!queued){queued=true;requestAnimationFrame(progress)}},{passive:true});addEventListener("resize",progress,{passive:true});progress();
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches,logo=document.querySelector(".hero-ds");
if(logo&&!reduce){const visual=logo.closest(".hero-visual");visual?.addEventListener("pointermove",e=>{if(e.pointerType==="touch")return;const b=visual.getBoundingClientRect();const dx=(e.clientX-b.left)/b.width-.5,dy=(e.clientY-b.top)/b.height-.5;logo.style.transform="translate("+(-dx*8).toFixed(1)+"px,"+(-dy*8).toFixed(1)+"px)";},{passive:true});visual?.addEventListener("pointerleave",()=>{logo.style.transform="translate(0,0)"})}
document.querySelectorAll(".demo-directory").forEach(d=>d.addEventListener("toggle",()=>{const b=d.querySelector("summary b");if(b)b.textContent=d.open?"−":"+"}));
})();