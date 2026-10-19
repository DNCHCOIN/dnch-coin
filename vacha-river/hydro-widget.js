/* Public observed NIMH measurements, synced by GitHub Actions. Never imply safety or freshness. */
(()=>{'use strict';
const find=id=>document.getElementById(id);
const put=(id,value)=>{const el=find(id);if(el)el.textContent=value};
const fmt=(n,dp=0)=>new Intl.NumberFormat('bg-BG',{minimumFractionDigits:dp,maximumFractionDigits:dp}).format(n);
const dateOf=r=>new Date(r.observedAt||((r.observedAtLocal||'')+'+03:00'));
const stamp=d=>Number.isFinite(d.getTime())?new Intl.DateTimeFormat('bg-BG',{timeZone:'Europe/Sofia',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d):'неизвестно';
function state(cls,name){for(const id of ['hydro-pill','hydro-hero-pill']){const e=find(id);if(!e)continue;e.classList.remove('hydro-current','hydro-stale','hydro-error');e.classList.add('hydro-'+cls);e.textContent=name;}}
function chart(history){
  const svg=find('hydro-chart');if(!svg)return;
  const items=history.filter(r=>Number.isFinite(r.levelCm)).slice(-24);
  if(items.length<2){svg.textContent='Няма достатъчно измервания';return;}
  const values=items.map(r=>r.levelCm),lo=Math.min(...values),hi=Math.max(...values),margin=Math.max(4,(hi-lo)*.12),min=Math.max(0,lo-margin),max=hi+margin;
  const X=i=>32+i*(600/Math.max(1,items.length-1)),Y=n=>117-(n-min)/(max-min)*103;
  const path=items.map((r,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(r.levelCm).toFixed(1)).join(' ');
  const lx=X(items.length-1),ly=Y(items.at(-1).levelCm);
  svg.innerHTML='<line class="hydro-grid" x1="32" x2="632" y1="14" y2="14"/><line class="hydro-grid" x1="32" x2="632" y1="117" y2="117"/><text class="hydro-axis-label" x="2" y="21">'+Math.ceil(max)+'</text><text class="hydro-axis-label" x="2" y="118">'+Math.floor(min)+'</text><path class="hydro-line" d="'+path+'"/><circle class="hydro-dot" cx="'+lx.toFixed(1)+'" cy="'+ly.toFixed(1)+'" r="5"/>';
  svg.setAttribute('aria-label','Измервания от '+Math.round(lo)+' до '+Math.round(hi)+' сантиметра');
  put('hydro-from',stamp(dateOf(items[0]))+' ч.');put('hydro-to',stamp(dateOf(items.at(-1)))+' ч.');
}
async function update(){
 try{
  const res=await fetch('./data/hydro.json?now='+Date.now(),{cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const data=await res.json(),r=data.latest;
  if(!r||!Number.isFinite(r.levelCm)||!Number.isFinite(r.flowM3s))throw Error('Невалидни измервания');
  const d=dateOf(r);if(!Number.isFinite(d.getTime()))throw Error('Невалидна дата');
  put('hydro-hero',r.levelCm);put('hydro-level',r.levelCm);put('hydro-flow',fmt(r.flowM3s,3));
  put('hydro-stamp','Измерено: '+stamp(d)+' ч. · НИМХ');put('hydro-hero-status',stamp(d)+' ч.');
  const history=Array.isArray(data.history)?data.history:[];chart(history);
  const prev=history.length>1?history.at(-2):null,diff=prev?r.levelCm-prev.levelCm:0;
  put('hydro-trend',!prev?'Тенденция: —':diff===0?'→ Без промяна спрямо предишния час':diff>0?'↗ Покачване с '+diff+' см':'↘ Спад с '+Math.abs(diff)+' см');
  const age=Date.now()-d.getTime();
  if(age<0){state('error','Невалидна дата');put('hydro-info','Внимание: часът на записа е в бъдещето. Данните не са потвърдени.');}
  else if(age<=7200000){state('current','Последни данни');put('hydro-info','Измерени стойности от НИМХ. Не гарантират безопасност при внезапно изпускане на вода от ВЕЦ.');}
  else{state('stale','Остарели данни');put('hydro-info','⚠ Записът е отпреди '+Math.floor(age/3600000)+' часа. НЕ е информация в реално време. При работа на ВЕЦ водата може бързо да се покачи.');}
 }catch(e){state('error','Няма данни');put('hydro-hero-status','Няма връзка');put('hydro-stamp','Липсват достъпни измервания');put('hydro-info','⚠ Измерванията не са достъпни. Проверете официалната станция на НИМХ.');console.warn('Hydrology:',e)}
}
update();setInterval(update,5*60000);
})();