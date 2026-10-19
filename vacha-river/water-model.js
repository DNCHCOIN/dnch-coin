/* РЕКА ВЪЧА | предварителна моделна оценка, НЕ термометрично измерване */
(()=>{'use strict';
const $=id=>document.getElementById(id);
function mean(v){return v.reduce((sum,n)=>sum+n,0)/v.length}
function upd(met){
 const arr=met.hourly?.temperature_2m,times=met.hourly?.time;
 if(!Array.isArray(arr)||!Array.isArray(times))throw Error('Липсват часови температури');
 const now=Date.now(),hist=arr.map((n,i)=>({t:Date.parse(times[i]+'+03:00'),n}))
  .filter(x=>Number.isFinite(x.t)&&x.t<=now&&now-x.t<7*86400000&&Number.isFinite(x.n));
 if(hist.length<72)throw Error('Недостатъчна седмична история');
 const last24=hist.filter(x=>now-x.t<86400000);
 if(last24.length<12)throw Error('Недостатъчна дневна история');
 const avg7=mean(hist.map(x=>x.n)),avg24=mean(last24.map(x=>x.n));
 const d=new Date(), start=new Date(d.getFullYear(),0,0),day=Math.floor((d-start)/86400000);
 // Регулирана река: началната температура от язовира НЕ е известна.
 // Сезонната стойност по-долу е изрично допускане за прототип, не референтно измерване.
 const assumedInflow=11+4.5*Math.sin(2*Math.PI*(day-115)/365.25);
 const estimate=0.65*assumedInflow+0.27*avg7+0.08*avg24;
 // ±5°C е предпазлив ориентировъчен диапазон, НЕ валидиран статистически интервал.
 const low=Math.max(0,estimate-5),high=Math.min(30,estimate+5);
 $('water-estimate').textContent='≈ '+estimate.toFixed(0)+' °C';
 $('water-range').textContent=low.toFixed(0)+'–'+high.toFixed(0)+' °C';
 $('water-estimate-status').textContent='Неизмерена оценка · актуални метеоданни';
 $('water-model-note').textContent='Използвани: среден въздух за 7 дни ('+avg7.toFixed(1)+'°C), последни 24 ч. ('+avg24.toFixed(1)+'°C) и сезонно допускане за водата от язовира. Широкият диапазон не е доказана точност. Данните се калибрират след реални измервания.';
}
window.VachaEstimate={update(met){try{upd(met)}catch(e){$('water-estimate').textContent='— °C';$('water-range').textContent='няма надеждна оценка';$('water-estimate-status').textContent='Недостатъчни метеоданни';$('water-model-note').textContent='Не може да се изчисли без достатъчно исторически данни за въздуха.';}}};
})();