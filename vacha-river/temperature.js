/* Preliminary model: seasonal prior and moving average air temperatures. NOT river measurement. */
(()=>{'use strict';
const el=id=>document.getElementById(id);
const set=(id,v)=>{const e=el(id);if(e)e.textContent=v};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const doy=date=>Math.floor((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(date.getFullYear(),0,0))/86400000);
function baseline(d){return 11.5 + 5.5*Math.sin(2*Math.PI*(doy(d)-105)/365.25)}
function rawEstimate(date,avg7,avg3){const season=baseline(date);return clamp(season + .27*(avg7-season) + .08*(avg3-avg7),1,26)}
async function run(){
  try{
    const url='https://api.open-meteo.com/v1/forecast?latitude=42.05&longitude=24.47&daily=temperature_2m_mean&timezone=Europe%2FSofia&past_days=7&forecast_days=1';
    const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw Error('Meteo '+res.status);
    const {daily}=await res.json(),days=daily?.time,air=daily?.temperature_2m_mean;
    if(!Array.isArray(days)||!Array.isArray(air)||days.length<4)throw Error('No daily data');
    const measuredAir=air.slice(0,-1).filter(Number.isFinite);if(measuredAir.length<3)throw Error('Insufficient air data');
    const mean=a=>a.reduce((u,v)=>u+v,0)/a.length;
    const avg7=mean(measuredAir),avg3=mean(measuredAir.slice(-3));
    const date=new Date();let value=rawEstimate(date,avg7,avg3),margin=5,mode='Некалибрирана оценка';
    // Calibration is enabled only for actual readings from this station, dated recently.
    try{
      const r=await fetch('./data/water-calibration.json',{cache:'no-store'});
      if(r.ok){const d=await r.json(),samples=Array.isArray(d.samples)?d.samples:[];
        const valid=samples.filter(s=>Number.isFinite(s.waterC)&&Number.isFinite(s.air7C)&&Number.isFinite(s.air3C)&&!Number.isNaN(Date.parse(s.observedAt)) && Math.abs(Date.now()-Date.parse(s.observedAt))<21*86400000 && s.station==='krichim');
        if(valid.length>=3){const weighted=valid.map(s=>({delta:s.waterC-rawEstimate(new Date(s.observedAt),s.air7C,s.air3C),w:Math.exp(-Math.abs(Date.now()-Date.parse(s.observedAt))/86400000/9)}));const b=weighted.reduce((a,x)=>a+x.delta*x.w,0)/weighted.reduce((a,x)=>a+x.w,0);value=clamp(value+b,1,26);margin=3;mode='Частично калибрирана оценка';}
      }
    }catch(e){console.warn('water calibration:',e)}
    // Show one readable approximate value rather than an unhelpful 10°C-wide headline.
    // ±1°C cannot be claimed for an uncalibrated meteorological model.
    set('water-temp',`≈ ${Math.round(value)} °C`);
    set('temp-details',`${mode} · възможно отклонение около ±${margin} °C (невалидирано) · НЕ е измерено. Цел ±1 °C след реални измервания и проверка на модела.`);
    set('temp-method','Моделна оценка');
  }catch(err){set('water-temp','— °C');set('temp-details','Няма достатъчно метеоданни за ориентировъчна оценка');console.warn('water temp:',err);}
}
run();setInterval(run,3*60*60*1000);
})();
