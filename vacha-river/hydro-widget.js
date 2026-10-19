/* Public measurements from same-origin JSON written by GitHub Actions.
   Do not claim live data if the newest observation is stale. */
(()=>{'use strict';
const byId=id=>document.getElementById(id);
const set=(id,value)=>{const el=byId(id);if(el)el.textContent=value};
const TWO_HOURS=2*60*60*1000;
const FOUR_HOURS=4*60*60*1000;
const bgNumber=(n,max=3)=>new Intl.NumberFormat('bg-BG',{maximumFractionDigits:max,minimumFractionDigits:max===3?3:0}).format(n);
function timestamp(item){
 if(item.observedAt && /[+-]\d\d:\d\d$|Z$/.test(item.observedAt))return new Date(item.observedAt);
 if(item.observedAtLocal)return new Date(item.observedAtLocal+'+03:00'); // only for 19 Oct initial snapshot
 return new Date(NaN);
}
function label(t){return Number.isFinite(t.getTime())?new Intl.DateTimeFormat('bg-BG',{timeZone:'Europe/Sofia',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(t):'неизвестно'}
function mark(state,msg){for(const id of ['hydro-pill','hydro-hero-pill']){let e=byId(id);if(!e)continue;e.classList.remove('hydro-current','hydro-stale','hydro-error');e.classList.add('hydro-'+state);e.textContent=msg}}
function chart(items){
 const svg=byId('hydro-chart');if(!svg)return;
 const points=items.filter(r=>Number.isFinite(r.levelCm)).slice(-24);
 if(points.length<2){svg.innerHTML='<text x="22" y="68" fill="#d2e3d7">Все още няма достатъчно измервания.</text>';return;}
 const levels=points.map(r=>r.levelCm),lo=Math.min(...levels),hi=Math.max(...levels);
 const margin=Math.max(4,(hi-lo)*.12),min=Math.max(0,lo-margin),max=hi+margin;
 const W=640,H=140,x0=30,x1=W-8,y0=9,y1=H-22;
 const x=i=>x0+(x1-x0)*(i/(points.length-1));const y=v=>y1-(v-min)/(max-min)*(y1-y0);
 const line=points.map((r,i)=>(i===0?'M':'L')+x(i).toFixed(1)+' '+y(r.levelCm).toFixed(1)).join(' ');
 const last=points.at(-1),lx=x(points.length-1),ly=y(last.levelCm);
 svg.innerHTML=`<line class="hydro-grid" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}"/><line class="hydro-grid" x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}"/><text class="hydro-axis-label" x="1" y="${y0+9}">${Math.ceil(max)}</text><text class="hydro-axis-label" x="1" y="${y1}">${Math.floor(min)}</text><path class="hydro-line" d="${line}"/><circle class="hydro-dot" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="5"/>`;
 set('hydro-from',label(timestamp(points[0]))+' ч.');set('hydro-to',label(timestamp(last))+' ч.');
 svg.setAttribute('aria-label','Измерено водно ниво през последните 24 записа, от '+Math.round(lo)+' до '+Math.round(hi)+' сантиметра');
}
async function update(){
 set('hydro-check','Проверка за нови измервания… (на всеки 5 минути)');
 try{
   // Query NIMH via a serverless proxy and our archived GitHub snapshot in parallel.
   // Always select the newest *observed* reading, never the latest fetch timestamp.
   async function requestJson(url){
     const control=new AbortController();
     const timer=setTimeout(()=>control.abort(),18000);
     try {
       const response=await fetch(url,{cache:'no-store',signal:control.signal});
       if(!response.ok)throw new Error('HTTP '+response.status);
       const payload=await response.json();
       if(!payload.latest||!Number.isFinite(payload.latest.levelCm)||!Number.isFinite(payload.latest.flowM3s))throw Error('Некоректен запис');
       if(!Number.isFinite(timestamp(payload.latest).getTime()))throw Error('Некоректна дата');
       return payload;
     } finally {clearTimeout(timer);}
   }
   const endpoint='https://wthzcqgzcbkvhovtcmoe.supabase.co/functions/v1/vacha-hydro';
   const [directResult,archiveResult]=await Promise.allSettled([
     requestJson(endpoint),
     requestJson('./data/hydro.json?fresh='+Date.now())
   ]);
   const candidates=[];
   if(directResult.status==='fulfilled')candidates.push({data:directResult.value,kind:'direct'});
   if(archiveResult.status==='fulfilled')candidates.push({data:archiveResult.value,kind:'archive'});
   if(!candidates.length)throw new Error('Няма достъп нито до НИМХ, нито до резервния запис');
   candidates.sort((a,b)=>timestamp(b.data.latest)-timestamp(a.data.latest));
   const selected=candidates[0];
   const data=selected.data,r=data.latest;
   const observed=timestamp(r);
   const sourceStatus=selected.kind==='direct'
     ? (data.feed==='cached-after-error'?'Последни успешно получени данни · временна грешка на източника':'Проверка чрез сървъра на НИМХ')
     : 'Резервен файл от GitHub · директният източник временно е недостъпен или по-стар';
   set('hydro-check',sourceStatus+' · проверено в '+new Intl.DateTimeFormat('bg-BG',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Sofia'}).format(new Date())+' ч. · следваща проверка след 5 мин.');
   const age=Date.now()-observed.getTime();
   set('hydro-hero',String(r.levelCm));set('hydro-level',String(r.levelCm));set('hydro-flow',bgNumber(r.flowM3s));
   set('hydro-stamp','Измерено на '+label(observed)+' ч. · НИМХ');
   set('hydro-hero-status',label(observed)+' ч.');
   const h=Array.isArray(data.history)?data.history:[];chart(h);
   if(h.length>1){const prev=h.at(-2),diff=r.levelCm-prev.levelCm;set('hydro-trend',diff>0?'↗ Покачване с '+diff+' см спрямо предишния запис':diff<0?'↘ Спад с '+Math.abs(diff)+' см спрямо предишния запис':'→ Без промяна спрямо предишния запис')}
   if(age<0){mark('error','Невалиден час');set('hydro-info','Часът на записа е в бъдещето. Не приемайте стойностите за актуални.');}
   else if(age<=TWO_HOURS){mark('current','Последни данни');set('hydro-info','Измервания на НИМХ, не прогноза. Не гарантират безопасност при изпускане на вода от ВЕЦ.');}
   else{mark('stale','Остарели данни');set('hydro-info','⚠ Последното измерване е преди '+Math.floor(age/3600000)+' ч. Не е информация в реално време! При работа на ВЕЦ нивото може рязко да се промени.');}
 }catch(err){set('hydro-check','Неуспешна проверка за нови данни · нов опит след 5 мин.');mark('error','Няма данни');set('hydro-hero-status','Връзката към измерванията е недостъпна');set('hydro-stamp','Няма потвърдени измервания');set('hydro-info','⚠ Данните временно не са достъпни. Проверете официалния източник.');console.warn('Vacha hydrology unavailable:',err)}
}
update();setInterval(update,5*60*1000);
})();
