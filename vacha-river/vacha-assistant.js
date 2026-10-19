/* Река Въча — local rules-based assistant v0.1. No paid model or pretend AI. */
(() => {
  'use strict';
  const form=document.getElementById('vacha-ai-form');
  const result=document.getElementById('vacha-ai-result');
  if(!form||!result)return;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nf=(n,d=1)=>new Intl.NumberFormat('bg-BG',{maximumFractionDigits:d}).format(n);
  const month=Number(new Intl.DateTimeFormat('en-US',{month:'numeric',timeZone:'Europe/Sofia'}).format(new Date()));
  const troutClosed=month>=10||month===1;
  const MONTHS=['','януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];
  const phrases={
    upper:'Кричим и участъците под язовирната система: търси достъпни, обществено разрешени крайбрежни пътеки с добра видимост към реката. Не приближавай водовземания, преливници и ВЕЦ съоръжения.',
    middle:'Надолу след Кричим: оглеждай от брега редуване на чакълести плитчини, малки вирове и сенчести завои. Не публикуваме координати на чувствителни рибни укрития.',
    lower:'По-ниските участъци към вливането в Марица: за наблюдения и фотография са интересни по-тихите завои, заливчета и широките брегове, ако достъпът е разрешен.',
    any:'За първи излет разгледай бреговите пътеки от общодостъпно място. Добри ориентири са разликите между бързеи, вирове и засенчени участъци; конкретните участъци и ограниченията трябва да се проверят.'
  };
  const lures={
    spinning:'При разрешен риболов: леки въртящи блесни № 0–2, малки клатушки, воблери около 3–5 см или силикони 3–5 см. Избери по-тежка примамка само ако се налага за контрол в течението; не гази, за да я извадиш.',
    fly:'При разрешен риболов: нимфи, имитиращи еднодневки и ручейници (куки приблизително № 12–18), гамарус и сухи мухи, ако има видима активност на повърхността. Внимавай с тежките нимфи и естествения дрифт.',
    photos:'За снимки: телефон или фотоапарат с поляризиращ филтър, естествена светлина, нисък ъгъл към водата и достатъчно дистанция, без да безпокоиш рибите.',
    noPlan:'Започни с наблюдение на повърхността и подводните камъни от брега. Едва след проверка на закона, участъка и текущите условия избирай снасти и примамки.'
  };
  async function readJson(url,ms=11000){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),ms);
    try {
      const res=await fetch(url,{cache:'no-store',signal:controller.signal});
      if(!res.ok)throw Error('HTTP '+res.status);
      const data=await res.json();
      return data;
    }finally{clearTimeout(timeout)}
  }
  function dateOf(entry){
    if(!entry)return NaN;
    if(entry.observedAt)return Date.parse(entry.observedAt);
    return NaN;
  }
  async function readWater(){
    const vals=await Promise.allSettled([
      readJson('https://wthzcqgzcbkvhovtcmoe.supabase.co/functions/v1/vacha-hydro'),
      readJson('./data/hydro.json?t='+Date.now())
    ]);
    const found=vals.filter(v=>v.status==='fulfilled').map(v=>v.value).filter(v=>Number.isFinite(dateOf(v.latest))&&Number.isFinite(v.latest.levelCm));
    if(!found.length)return null;
    found.sort((a,b)=>dateOf(b.latest)-dateOf(a.latest));
    return found[0];
  }
  async function readWeather(){
    const url='https://api.open-meteo.com/v1/forecast?latitude=42.03&longitude=24.47&current=temperature_2m,precipitation,wind_speed_10m&timezone=Europe%2FSofia';
    const data=await readJson(url,9000);
    const c=data?.current;
    return c&&Number.isFinite(c.temperature_2m)?c:null;
  }
  function row(label,body){
    return '<div class="va-answer-row"><h4>'+esc(label)+'</h4><p>'+esc(body)+'</p></div>';
  }
  function display(data) {
    const question=$('va-question').value.trim().toLocaleLowerCase('bg-BG');
    const region=$('va-region').value;
    const target=$('va-target').value;
    const method=$('va-method').value;
    const clarity=$('va-clarity').value;
    const intentPhoto=method==='photos'||/(сним|разход|природ|фото|пейзаж)/.test(question);
    const intentTrout=target==='trout'||/(пъстърв|балканк|дъгов)/.test(question);
    const closed=intentTrout&&troutClosed&&!intentPhoto;
    const intentChub=target==='chub'||/кефал/.test(question);
    let tactic=method==='fly'?lures.fly:method==='spinning'?lures.spinning:lures.photos;
    let area=phrases[region]||phrases.any;
    const ideaLines=[];
    if(intentPhoto){
      tactic=lures.photos;
      ideaLines.push('Предложение: направи серия от три снимки — общ изглед, движение на водата и макроснимка на водно насекомо. Не мести организми за кадъра.');
    }else if(closed){
      tactic='За балканската пъстърва през октомври–януари има законова забрана за улов. Вместо примамки предлагам наблюдение, снимки и събиране на данни за река Въча. Проверявай и допълнителните местни ограничения.';
      ideaLines.push('Наблюдавай от брега чакълестите зони и местата за укритие, без да безпокоиш рибите по време на размножаването.');
    }else if(intentChub){
      tactic=method==='fly'?'При законно разрешен риболов на кефал: сухи имитации на бръмбари/мравки през топлите месеци, дребни нимфи и стримери според активността.':'При законно разрешен риболов на кефал: малки кранк воблери около 2–4 см, мини клатушки и леки въртящи блесни; следи за насекоми по повърхността.';
      ideaLines.push('Кефалът често е предпазлив — подхождай без тропане и наблюдавай под дърветата и край спокойните граници на течението.');
    }else if(intentTrout){
      ideaLines.push('След проверка, че сезонът и конкретният участък са разрешени: сравни активността в сенчестите граници на течението и под камъните.');
    }else{
      ideaLines.push('Не избирай метод само по водното ниво: провери кой вид е разрешен за улов днес и в този участък.');
    }
    if(clarity==='clear')ideaLines.push('При бистра вода рибите виждат движенията по брега. Подхождай дискретно; ако риболовът е разрешен, подбирай ненатрапчиви размери и естествени цветове на примамките.');
    if(clarity==='turbid')ideaLines.push('Мътната вода не доказва високо или безопасно ниво. От разрешен бряг наблюдавай дали видимостта се подобрява; не навлизай във водата.');
    if(/гамарус|ручейник|нимф|насеком/.test(question))ideaLines.push('Гамарусът е дребно ракообразно, а ручейниците имат водни ларви. Еднодневките и веснянките имат водни нимфи — полезни за наблюдение и мухарски имитации.');
    if(/дъжд|мътн|мътна|валеж/.test(question))ideaLines.push('След валеж не приемай бистротата и дебита за известни без измерване. Оглеждай от сигурен бряг; внезапният приток може да промени условията.');
    if(region==='upper')ideaLines.push('Близостта до хидросъоръжения не е препоръка за риболов: избирай само разрешен и публично достъпен участък далеч от инфраструктурата.');
    const water=data.water;
    let waterLine='Последните измервания на НИМХ не са достъпни за проверка. Не знаем дали реката се покачва.';
    if(water){
      const latest=water.latest;
      const observed=new Date(dateOf(latest));
      const age=Date.now()-observed.getTime();
      const moment=observed.toLocaleString('bg-BG',{timeZone:'Europe/Sofia',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
      const prefix='Ниво '+nf(latest.levelCm,0)+' см, дебит '+nf(latest.flowM3s,3)+' м³/с, измерено на '+moment+' ч.';
      waterLine=age<0?'Времето на измерването е невалидно — не използвай данните за решение.':age>2*3600000?prefix+' Записът е остарял. Не правим извод за сегашното състояние.':prefix+' Това са моментни данни, не гаранция за безопасност.';
      if(age<=2*3600000 && water.history?.length>=2){
        const h=water.history;
        const prev=h.at(-2);
        const delta=latest.levelCm-prev.levelCm;
        if(delta>=10)waterLine+=' Последният запис показва покачване с '+delta+' см; избягвай опасни брегове.';
      }
    }
    let weatherLine='Текущият метеомодел не е достъпен.';
    if(data.weather){
      const w=data.weather;
      weatherLine='Модел за района на Кричим: '+nf(w.temperature_2m)+'°C, валеж '+nf(w.precipitation||0)+' мм, вятър '+nf(w.wind_speed_10m||0)+' км/ч. Това не е измерена температура на водата.';
      if(w.precipitation>1)ideaLines.push('Моделът показва валеж. Бистрата вода може бързо да стане мътна; прогнозата не замества наблюдение на брега.');
    }
    const headline=closed?'Сега: наблюдение вместо риболов на пъстърва':intentPhoto?'Идея за фоторазходка по Въча':'Предложение за излет по Въча';
    const zone=region==='upper'?'Кричим / горен участък':region==='middle'?'Надолу от Кричим':region==='lower'?'Към вливането в Марица':'Без избран район';
    result.innerHTML='<div class="va-answer-tag">Препоръки по правила · '+esc(MONTHS[month])+'</div>'+
      '<h3>'+esc(headline)+'</h3>'+
      '<p class="va-small">Район: '+esc(zone)+' · Въпрос: '+esc($('va-question').value.trim()||'обща препоръка')+'</p>'+
      row('📍 Къде да гледаш',area)+row('🎣 Подход и примамки',tactic)+
      row('💧 Данни за реката',waterLine)+row('☀️ Условия за Кричим',weatherLine)+
      row('💡 Допълнителни идеи',ideaLines.join(' '))+
      '<p class="va-legal">⚠ Реката е под влиянието на ВЕЦ и нивото може да се покачи внезапно. Никакви данни, алгоритъм или камера не гарантират безопасност. Преди улов провери <a href="https://www.mzh.government.bg/bg/sektori/ribarstvo/" target="_blank" rel="noopener noreferrer">официалните забрани</a> и ограниченията за конкретния участък. Асистентът не потвърждава свободен достъп или риболовно право.</p>';
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const go=$('va-submit');go.disabled=true;go.textContent='Проверявам условията…';
    result.innerHTML='<p class="va-wait">Подготвям насоки и проверявам наличните данни за водата…</p>';
    const [water,weather]=await Promise.allSettled([readWater(),readWeather()]);
    display({water:water.status==='fulfilled'?water.value:null,weather:weather.status==='fulfilled'?weather.value:null});
    go.disabled=false;go.textContent='🐟 Предложи ми план';
    result.scrollIntoView({block:'nearest',behavior:'smooth'});
  });
  document.querySelectorAll('[data-va-prompt]').forEach(b=>b.addEventListener('click',()=>{
    $('va-question').value=b.dataset.vaPrompt;
    form.requestSubmit();
  }));
})();
