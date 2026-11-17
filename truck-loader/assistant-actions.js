(function(root){
'use strict';
// Deterministic, offline conversational controller for the existing NTZ loader.
// Never claims to be an LLM; all writes go through the application's own controls.
const $=id=>root.document&&root.document.getElementById(id);
const n=s=>Number(String(s??'').trim().replace(',','.'));
const good=x=>Number.isFinite(x)&&x>0;
const fmt=x=>n(x).toLocaleString('bg-BG',{maximumFractionDigits:2});
const lower=s=>String(s||'').toLocaleLowerCase('bg-BG').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
const nums='(\\d+(?:[.,]\\d+)?)';
const unit='(мм|mm|см|cm|метра|метър|метри|meters?|m|м)';
const fac={mm:.1,cm:1,m:100};
function getUnit(s,def='cm'){
 const t=lower(s).replace(/\./g,'');
 if(/^(мм|mm)$/.test(t))return'mm';
 if(/^(м|m|метър|метри|метра|meter|meters)$/.test(t))return'm';
 if(/^(см|cm|сантиметри|сантиметра)$/.test(t))return'cm';
 return def;
}
function dims(text,defaultUnit='cm'){
 const m=String(text||'').match(/(\d+(?:[.,]\d+)?)\s*(?:мм|mm|см|cm|м|m)?\s*[xх×*]\s*(\d+(?:[.,]\d+)?)\s*(?:мм|mm|см|cm|м|m)?(?:\s*[xх×*]\s*(\d+(?:[.,]\d+)?))?\s*(мм|mm|см|cm|метра|метри|метър|м|m)?/i);
 if(!m)return null;
 const u=getUnit(m[4],defaultUnit),f=fac[u];
 const d={l:n(m[1])*f,w:n(m[2])*f,h:m[3]?n(m[3])*f:null,unit:u,raw:m[0]};
 return good(d.l)&&good(d.w)&&d.l<=100000&&d.w<=100000?d:null;
}
function cargoCount(text){
 const q=lower(text);
 const patterns=[
  /(?:^|[\s,:])(\d{1,3})\s*(?:бр(?:оя|ой|\.?)?|европалет(?:а|и)?|евро\s*палет(?:а|и)?|палет(?:а|и)?|товар(?:а|и)?|кашон(?:а|и)?|pcs\b|pieces\b)/i,
  /(?:бр(?:ой|оя)?|количество|qty)\s*[:=]?\s*(\d{1,3})/i
 ];
 for(const p of patterns){const m=p.exec(q);if(m&&n(m[1])>=1&&n(m[1])<=100)return n(m[1]);}
 return 1;
}
function weight(text){
 let m=String(text||'').match(/(\d+(?:[.,]\d+)?)\s*(?:кг|kg)/i);
 if(!m)m=String(text||'').match(/(?:кг|kg)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
 return m? n(m[1]):null;
}
function pallets(text){
 const q=lower(text);
 if(/(?:евро\s*палет|европалет)/.test(q))return {l:120,w:80,name:'Европалет'};
 if(/индустриал|индустр|120\s*[xх×]\s*100/.test(q))return {l:120,w:100,name:'Индустриален палет'};
 if(/квадрат|120\s*[xх×]\s*120/.test(q))return {l:120,w:120,name:'Квадратен палет'};
 return null;
}
function isAsk(q){
 return /^(колко|какъв|каква|какви|кога|защо|как|може ли|има ли|събира ли|ще се побере ли|побира ли|кажи|покажи|пресметни колко|изчисли колко|провер[ия] колко)/.test(q)||
  /\?\s*$/.test(q);
}
function trailerState(){
 if(!$('truckUnit'))return {l:1360,w:240,h:220,g:0};
 const f=fac[$('truckUnit').value]||1;
 return {l:n($('length').value)*f,w:n($('width').value)*f,h:n($('height').value)*f,g:n($('gap').value)*f};
}
function capacity(a,b,g=0){
 const W=a.w,L=a.l,w=b.w,l=b.l;
 if(![W,L,w,l].every(good)||g<0)return null;
 const rect=(a,b)=>Math.floor((W+1e-7)/(a+g))*Math.floor((L+1e-7)/(b+g));
 const straight=rect(w,l),rotated=rect(l,w);
 // Mixed row patterns can be better; no promise of global mathematical optimum.
 return {straight,rotated,ideal:Math.max(straight,rotated),upper:Math.floor(W*L/(w*l))};
}
function parse(text){
 const q=lower(text);
 if(!q)return {type:'empty'};
 if(/^(откажи|стоп|няма нужда|забрави|cancel|не)$/.test(q))return {type:'cancel'};
 if(/^(потвърждавам|потвърди|да, изчисти|да изчисти|изчисти ги|да, изтрий)$/.test(q))return {type:'confirm'};
 if(/(какво (?:можеш|умееш)|как се работи|списък с команд|какви команд|помощ|инструкци|функци)/.test(q))return {type:'capabilities'};
 const d=dims(text),w=weight(text),qnt=cargoCount(text),p=pallets(text);
 if(/(колко|брой|побира|побир|събира|събере|капацитет|места)/.test(q)&&!/палетомест|линейн|товарн.{0,12}метр|л\.?\s*м\.?/.test(q)&&
    /(палет|товар|ремарке|камион)/.test(q)&&
    !/^(добави|въведи|създай)/.test(q))return {type:'capacity',dim:d,kind:p};
 if(/(?:провери|побира ли|има ли място|свободно място за)\s+(?:още\s+)?(?:товар|пратка|палет)?/.test(q)&&d&&/(място|побира|побере|пратка|свободн)/.test(q))return {type:'freeCheck',dim:d,kg:w};
 if(/(колко|какъв|каква|общо|дай|покажи|провери|текущ)/.test(q)&&/(кг|килограм|тегло|тежи|товар[иъ]|л\.?\s*м|линейн|палетомест|зает|свободн|състояни|статус|план|резултат|товарни метри)/.test(q)&&!/(добави|въведи|промени|изтрий)/.test(q))return {type:'status',question:q};
 if(/(изчисти|изтрий|махни|занули|нулирай)\s+(?:всички\s+)?(?:товарите|всички товари|плана|целия план|всичко)/.test(q))return {type:'clear'};
 if(/(отвори|зареди|импорт|възстанови)\s+(?:файл|план|json)/.test(q))return {type:'load'};
 if(/(запази|съхрани|експорт|изтегли)\s+(?:план|файл|json)/.test(q))return {type:'save'};
 if(/(печат|принтирай|отпечатай|pdf|пдф|разпечатай)/.test(q)&&!isAsk(q))return {type:'print'};
 if(/(подреди около|нареди около)\s+заключен/.test(q))return {type:'manualAround'};
 if(/(върни автоматичн|върни началното подреждане|изходно подреждане)/.test(q))return {type:'manualReset'};
 if(/(отмени последн|върни една стъпка|назад в ръчен|undo)/.test(q))return {type:'manualUndo'};
 if(/(завърти|ротация)\s+(?:товар\s*)?(\d{1,3})/.test(q))return {type:'rotateItem',index:Number(RegExp.$2)};
 if(/(заключи|отключи)\s+(?:стиф|товар)\s*(\d{1,3})/.test(q))return {type:'lockItem',index:Number(RegExp.$2)};
 if(/(премести|сложи на позиция)\s+(?:товар\s*)?(\d{1,3})/.test(q)){
  const index=Number(RegExp.$2),numbers=[...q.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:см|cm)?/g)].map(m=>n(m[1]));
  const tail=q.match(/(?:от челото|по дължина|y)\s*[:=]?\s*(\d+(?:[.,]\d+)?).*?(?:отляво|от ляво|по ширина|x)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/);
  return {type:'moveItem',index,y:tail?n(tail[1]):numbers[1],x:tail?n(tail[2]):numbers[2]};
 }
 if(/(?:изтрий|махни|премахни)\s+(?:ред\s*|товар\s*|палет\s*)(\d{1,3})/.test(q))return {type:'deleteItem',index:Number(RegExp.$1)};
 if(/(?:промени|редактирай|смени|настрой|задай|поправи)\s+(?:товар\s*|ред\s*)(\d{1,3})/.test(q))return {type:'editItem',index:Number(RegExp.$1),dim:d,kg:w,quantity:qnt,raw:q};
 if(/(тарифн|палетомест|приравни|основа|база|премини на палет|за палет)/.test(q)&&
    (d||p)&&!/(колко|побира|събира|събере)/.test(q))return {type:'basis',dim:d,kind:p};
 if(/(отгоре|стифиране|стифиран|претоварване|един върху друг)/.test(q)&&
    /(включи|разреши|изключи|забрани|без|не искам|активирай)/.test(q))return {type:'toggle',key:'stacking',value:!/(изключи|забрани|без|не искам)/.test(q)};
 if(/(ограничение|лимит|1700)/.test(q)&&
    /(включи|изключи|без|спри|активирай)/.test(q))return {type:'toggle',key:'weightLimit',value:!/(изключи|без|спри)/.test(q)};
 if(/(върт[еи]|ротац)/.test(q)&&/(разреши|забрани|включи|изключи)/.test(q)&&/(товар|всички)/.test(q)){
  const m=q.match(/товар\s*(\d{1,3})/);return {type:'toggleRotate',index:m?+m[1]:null,value:!/(забрани|изключи)/.test(q)};
 }
 if(/(разстояние|просвет|между товарите)/.test(q)&& /(задай|сложи|направи|смени|промени|постави|искам|разстояние|просвет)/.test(q)){
  const m=q.match(new RegExp(nums+'\\s*'+unit+'?','i'));if(m)return {type:'gap',value:n(m[1])*(fac[getUnit(m[2],$('truckUnit')?.value||'cm')]||1)};
 }
 if(/(ремарке|камион|товарно пространство|вътрешни размери)/.test(q)&&d&&
    /(задай|настрой|промени|размер|ремарке|камион|дължин|ширин)/.test(q)&&!isAsk(q))return {type:'trailer',dim:d};
 if(/(дължин|ширин|височин)\s+(?:на ремаркето|на камиона)?\s*(?:е|на|=|:|да бъде|да е)?\s*(\d+(?:[.,]\d+)?)\s*(мм|mm|см|cm|м|m|метра|метър|метри)?/.test(q)&&
    !/товар\s*\d/.test(q)&&!isAsk(q)){
   const m=q.match(/(дължин|ширин|височин)\s+(?:на ремаркето|на камиона)?\s*(?:е|на|=|:|да бъде|да е)?\s*(\d+(?:[.,]\d+)?)\s*(мм|mm|см|cm|м|m|метра|метър|метри)?/);
   return {type:'trailerField',field:m[1].startsWith('дължин')?'length':m[1].startsWith('ширин')?'width':'height',value:n(m[2])*(fac[getUnit(m[3],$('truckUnit')?.value||'cm')]||1)};
 }
 if(/(заглавие|номер на ремарке|направление|име на план)/.test(q)&&
    /(задай|промени|сложи|напиши|запиши|въведи)/.test(q))return {type:'title',value:text.replace(/^.*?(?:заглавие|номер на ремарке|направление|име на план)\s*(?:на|е|:|=)?\s*/i,'').trim()};
 if(/(бележка|описание|допълнителна информация|коментар към пратка)/.test(q)&&
    /(добави|запиши|въведи|напиши|сложи)/.test(q))return {type:'notes',value:text.replace(/^.*?(?:бележка|описание|допълнителна информация|коментар към пратка)\s*(?:е|:|=)?\s*/i,'').trim()};
 if(/(подреди|изчисли|пресметни|намери подреждане|оптимизирай|стартирай|направи план)/.test(q)&&
    !/(колко|какво|кои)/.test(q))return {type:'solve'};
 if(/(?:добави|въведи|постави|сложи|запиши|имам|товарим|искам да добавя)/.test(q)&&
    (d||p))return {type:'add',dim:d,kind:p,kg:w,quantity:qnt,raw:text};
 if(/^(?:\d+(?:[.,]\d+)?\s*(?:палет|бр|европалет)|(?:товар|палет)\s+\d+|.*[xх×].*(?:бр|кг|kg))/.test(q)&&
    (d||p))return {type:'add',dim:d,kind:p,kg:w,quantity:qnt,raw:text};
 if(/(палетомест|линейн|товарен метър)/.test(q))return {type:'status',question:q};
 return {type:'help',text};
}
function cmInput(id,cm){
 const field=$(id),unit=$('truckUnit')?.value||'cm';if(!field||!Number.isFinite(cm))return false;
 field.value=String(Math.round(cm/fac[unit]*100000)/100000);
 field.dispatchEvent(new Event('input',{bubbles:true}));return true;
}
function setField(input,value,change='input'){
 if(!input)return false;input.value=String(value);
 input.dispatchEvent(new Event(change,{bubbles:true}));return true;
}
function rowAt(index){return [...($('rows')?.children||[])][index-1]||null;}
function findInput(row,name){return row?.querySelector('[aria-label="'+name+'"]');}
function ensureManual(index){
 if($('manualPanel')?.hidden)return'Първо изчисли план за товарене.';
 if(!$('manualToggle').checked){$('manualToggle').click();}
 const opts=[...$('manualItem').options];
 const option=opts.find(o=>Number(o.value)===index) ||opts[index-1];
 if(!option)return'Няма товар №'+index+' в изчисления план.';
 setField($('manualItem'),option.value,'change');
 return null;
}
const state={pending:null};
function handle(text){
 const q=lower(text);
 if(state.pending){
  if(/^(не|откажи|отказ|cancel|стоп)$/.test(q)){state.pending=null;return'Отменено. Не направих промяна.';}
  if(state.pending.type==='clear'){
   if(/^(да|потвърждавам|потвърди|изчисти|да изчисти)/.test(q)){
    state.pending=null;$('clearCargo')?.click();return'Изчистих всички товари чрез бутона на калкулатора.';
   }return'За изчистване на всички товари напиши „потвърждавам“, или „откажи“.';
  }
  if(state.pending.type==='cargo'){
   const m=weight(text);
   if(!good(m))return'Колко килограма тежи един брой? Например: „350 кг“. За отказ напиши „откажи“.';
   const row=state.pending.row;state.pending=null;row.weight=m;
   return addCargo(row);
  }
  if(state.pending.type==='freeCheck'){
   const m=weight(text);if(!good(m))return'За проверката на свободното място напиши килограмите на пратката, например „220 кг“.';
   const c=state.pending.command;state.pending=null;c.kg=m;return runFreeCheck(c);
  }
 }
 const c=parse(text);
 try{
  switch(c.type){
   case'empty':return'Напиши какво да направя с товарния план.';
   case'cancel':return'Няма чакаща операция.';
   case'confirm':return'Няма операция за потвърждение.';
   case'capabilities':return [
    'Можеш да управляваш калкулатора с текст или глас:',
    '„Колко европалета 120×80 събира ремаркето?“',
    '„Добави 12 европалета по 450 кг“ / „Добави товар 140×100×160 см, 320 кг, 4 бр.“',
    '„Ремарке 1360×240×220 см“, „разстояние 2 см“, „изключи лимита 1700 кг“.',
    '„Смени товар 2 на 120×100 см, 400 кг, 3 бр.“, „изтрий товар 2“.',
    '„Приравни към палет 120×100“, „избери тарифна основа 130×90“.',
    '„Подреди“, „колко л.м. са заети?“, „провери свободно място 100×80×100 см, 250 кг“.',
    '„Премести товар 2 от челото 300 от ляво 80“, „завърти товар 2“, „заключи товар 2“.',
    '„Запази файл“, „отвори файл“, „печат PDF“, „изчисти товарите“.',
    'Винаги можеш да използваш и бутоните. За нестандартни случаи попитай конкретно.'
   ].join('\n');
   case'capacity':{
    const t=trailerState(),p=c.dim||c.kind;
    if(!p)return'Посочи размер на палета, например 120×80 см, или кажи „колко европалета събира ремаркето?“.';
    const k=capacity(t,p,t.g);
    if(!k)return'Провери размерите на ремаркето и палетите.';
    const euro=Math.abs(p.l-120)<.1&&Math.abs(p.w-80)<.1||Math.abs(p.l-80)<.1&&Math.abs(p.w-120)<.1;
    const standard=euro&&Math.abs(t.l-1360)<2&&Math.abs(t.w-240)<2;
    return 'Ремарке '+fmt(t.l/100)+' × '+fmt(t.w/100)+' м, палет '+fmt(p.l)+'×'+fmt(p.w)+' см: '+(standard?'стандартна практическа вместимост 33 европалета. ':'')+
      'Теоретично по правоъгълна решетка: до '+k.ideal+' броя ('+k.straight+' в едната ориентация или '+k.rotated+' в завъртяната)'+(t.g?' при просвет '+fmt(t.g)+' см.':' при нулев просвет.')+
      (standard&&k.ideal>33?' Числото '+k.ideal+' е идеален геометричен максимум без толеранси; не го приемай за гарантирана реална вместимост.':'')+
      ' Това е само проверка по пода, без тегло, височина, укрепване и оперативен просвет.';
   }
   case'status':{
    const rows=[...$('rows').children],units=rows.reduce((s,r)=>s+(n(findInput(r,'Брой')?.value)||0),0);
    const totalKg=rows.reduce((s,r)=>s+(n(r.querySelector('[data-total-weight]')?.value)||0),0);
    const tr=trailerState();
    const txt='Текущо: '+rows.length+' реда, '+units+' товарни единици, '+fmt(totalKg)+' кг по въведените данни. Ремарке '+fmt(tr.l/100)+'×'+fmt(tr.w/100)+'×'+fmt(tr.h/100)+' м. ';
    const used=$('used')?.textContent?.trim(),places=$('pallets')?.textContent?.trim(),rem=$('remaining')?.textContent?.trim();
    return txt+(used&&used!=='—'?'Последно изчислен план: '+used+' л.м., '+places+' тарифни палетоместа; свободни/извън ремаркето '+rem+' л.м.':'Няма изчислен план. Кажи „Подреди“.')+
      ($('dirty')?.textContent?.trim()?' ВНИМАНИЕ: планът трябва да се преизчисли след последните промени.':'');
   }
   case'clear':state.pending={type:'clear'};return'Това ще изтрие всички въведени товари от текущия план. Напиши „потвърждавам“ или „откажи“.';
   case'load':$('load').click();return'Отворих избора на JSON файл. Избери план от устройството си — браузърът изисква това действие да направиш лично.';
   case'save':$('save').click();return'Отворих запазването на товарния план. Потвърди името на файла в прозореца.';
   case'print':$('print').click();return'Отворих диалога за печат. Избери „Запази като PDF“.';
   case'trailer':{
    const d=c.dim;if(d.l>100000||d.w>10000||d.h&&d.h>10000)return'Размерите на ремаркето изглеждат прекалено големи.';
    cmInput('length',d.l);cmInput('width',d.w);if(d.h)cmInput('height',d.h);
    return'Зададох ремарке '+fmt(d.l)+' × '+fmt(d.w)+(d.h?' × '+fmt(d.h):'')+' см. Кажи „Подреди“ за нов план.';
   }
   case'trailerField':cmInput(c.field,c.value);return'Промених '+({length:'дължината',width:'ширината',height:'височината'}[c.field])+' на '+fmt(c.value)+' см.';
   case'gap':cmInput('gap',c.value);return'Разстоянието между товарите е '+fmt(c.value)+' см. Преизчисли плана.';
   case'toggle':{
    const box=$(c.key);if(box.checked!==c.value)box.click();
    return(c.key==='stacking'?'Стифирането':'Ограничението 1700 кг/л.м.')+(c.value?' е включено.':' е изключено.')+' Преизчисли плана.';
   }
   case'toggleRotate':{
    const targets=c.index?[rowAt(c.index)]:[...$('rows').children];
    if(!targets.length||targets.some(x=>!x))return'Не намирам посочения товар.';
    for(const r of targets){const box=findInput(r,'Разрешено завъртане');if(box.checked!==c.value)box.click();}
    return'Завъртането е '+(c.value?'разрешено':'забранено')+(c.index?' за ред '+c.index:' за всички редове')+'.';
   }
   case'basis':{
    const d=c.dim||c.kind;if(!d)return'Посочи размер на тарифния палет в сантиметри.';
    const select=$('palletBasis');let id='custom';
    if(Math.abs(d.l-120)<.01&&Math.abs(d.w-80)<.01)id='euro';
    if(Math.abs(d.l-120)<.01&&Math.abs(d.w-100)<.01)id='industrial';
    if(Math.abs(d.l-120)<.01&&Math.abs(d.w-120)<.01)id='square';
    if(id==='custom'){setField($('palletCustomLength'),d.l);setField($('palletCustomWidth'),d.w);}
    setField(select,id,'change');
    const rate=2.4/(d.l*d.w/10000);
    return'Тарифна основа '+fmt(d.l)+'×'+fmt(d.w)+' см ('+fmt(rate)+' палетоместа за линеен метър). Това е тарифен еквивалент, не физически капацитет. Договорното закръгляване се прилага отделно.';
   }
   case'add':{
    const d=c.dim||c.kind;if(!d)return'Посочи размери на товара.';
    const row={name:c.kind?.name||'Товар',l:d.l,w:d.w,height:d.h??'',weight:c.kg,q:c.quantity,unit:'cm',rotate:true,stackable:false};
    if(!good(c.kg)){state.pending={type:'cargo',row};return'Разбрах: '+c.quantity+' бр. '+fmt(d.l)+'×'+fmt(d.w)+(d.h?'×'+fmt(d.h):'')+' см. Колко килограма тежи ЕДИН брой? Например „350 кг“.';
    }
    return addCargo(row);
   }
   case'deleteItem':{
    const row=rowAt(c.index);if(!row)return'Няма ред №'+c.index+'.';
    row.querySelector('button[aria-label="Изтрий товар"]').click();return'Изтрих ред №'+c.index+'.';
   }
   case'editItem':{
    const row=rowAt(c.index);if(!row)return'Няма ред №'+c.index+'.';
    if(!c.dim&&!good(c.kg)&&!/\bбр\b|брой|количество/.test(c.raw))return'Кажи например: „Смени товар '+c.index+' на 120×80 см, 400 кг, 3 бр.“';
    if(c.dim){const select=row.querySelector('select');if(select.value!=='cm')setField(select,'cm','change');setField(findInput(row,'Дължина на товара'),c.dim.l);setField(findInput(row,'Ширина на товара'),c.dim.w);if(c.dim.h)setField(findInput(row,'Височина на товара'),c.dim.h);}
    if(/(?:\d+\s*бр\.?|брой|количество|палета)/.test(c.raw)&&c.quantity>=1)setField(findInput(row,'Брой'),c.quantity);
    if(good(c.kg))setField(findInput(row,'Килограми за един брой'),c.kg);
    return'Ред №'+c.index+' е редактиран. Кажи „Подреди“, за да се изчисли новият план.';
   }
   case'solve':$('solve').click();return'Стартирах реалното подреждане. Резултатът се появява в „План на товарене“. Ако липсват задължителни данни, виж съобщението за грешка там.';
   case'freeCheck':return runFreeCheck(c);
   case'manualUndo':if($('manualPanel').hidden)return'Няма изчислен план за ръчно редактиране.';$('manualUndo').click();return $('manualMessage')?.textContent||'Върнах една стъпка.';
   case'manualReset':if($('manualPanel').hidden)return'Няма изчислен план.';$('manualReset').click();return $('manualMessage')?.textContent||'Върнах автоматичното подреждане.';
   case'manualAround':if($('manualPanel').hidden)return'Няма изчислен план.';if(!$('manualToggle').checked)$('manualToggle').click();$('manualAuto').click();return $('manualMessage')?.textContent||'Опитах да подредя около заключените товари.';
   case'rotateItem':{
    const err=ensureManual(c.index);if(err)return err;
    $('manualRotate').click();return $('manualMessage')?.textContent||'Опитах да завъртя товар '+c.index+'.';
   }
   case'lockItem':{
    const err=ensureManual(c.index);if(err)return err;
    $('manualLock').click();return $('manualMessage')?.textContent||'Промених заключването на товар '+c.index+'.';
   }
   case'moveItem':{
    const err=ensureManual(c.index);if(err)return err;
    if(!Number.isFinite(c.x)||!Number.isFinite(c.y))return'Посочи две координати в сантиметри: „Премести товар 2 от челото 300 от ляво 80“.';
    setField($('manualY'),c.y);setField($('manualX'),c.x);
    $('manualApply').click();return $('manualMessage')?.textContent||'Проверих новата позиция на товар '+c.index+'.';
   }
   case'title':if(!c.value)return'Посочи заглавие.';setField($('planName'),c.value);return'Записах заглавието: '+c.value;
   case'notes':if(!c.value)return'Продиктувай бележката.';setField($('shipmentNotes'),c.value);return'Записах информацията към пратката.';
   default:{
    const help=root.NTZAssistantCore?.help?.(text)||'';
    return help.startsWith('Работя в локален режим')?'Не съм сигурен коя операция искаш. Например: „Добави 5 европалета по 400 кг“, „Подреди“ или „Колко палета събира ремаркето?“. Напиши „Команди“ за всички възможности.':help;
   }
  }
 }catch(e){return'Не успях да изпълня операцията: '+(e?.message||String(e))+'. Въведените данни остават в калкулатора.';}
}
function addCargo(row){
 const rows=$('rows');if(!rows)return'Калкулаторът още не е готов.';
 const all=[...rows.children],existing=all.reduce((s,r)=>s+(findInput(r,'Дължина на товара')?.value.trim()&&findInput(r,'Ширина на товара')?.value.trim()?(n(findInput(r,'Брой')?.value)||0):0),0);
 const count=row.q;
 if(!good(row.l)||!good(row.w)||!good(row.weight)||!Number.isInteger(count)||count<1||count>100)return'Невалидни размери, килограми или брой.';
 if(existing+count>100)return'Лимитът на калкулатора е 100 товарни единици. Текущо: '+existing+'.';
 for(const r of all){if(!findInput(r,'Дължина на товара')?.value.trim()&&!findInput(r,'Ширина на товара')?.value.trim()&&!findInput(r,'Килограми за един брой')?.value.trim()&&!findInput(r,'Височина на товара')?.value.trim())r.remove();}
 root.add(row);root.changed();
 return'Добавих '+count+' бр. '+row.name+' '+fmt(row.l)+'×'+fmt(row.w)+(row.height?'×'+fmt(row.height):'')+' см, по '+fmt(row.weight)+' кг. Общо '+fmt(count*row.weight)+' кг. Кажи „Подреди“.';
}
function runFreeCheck(c){
 if($('freeSpacePanel')?.hidden)return'Първо кажи „Подреди“, за да изчисля свободните участъци.';
 const d=c.dim;if(!d)return'Посочи размерите на пратката.';
 if(!good(c.kg)){state.pending={type:'freeCheck',command:c};return'Какво е теглото на пратката? Например „250 кг“.';
 }
 setField($('checkSpaceLength'),d.l);setField($('checkSpaceWidth'),d.w);
 setField($('checkSpaceHeight'),d.h||Math.min(100,trailerState().h));
 setField($('checkSpaceWeight'),c.kg);
 $('checkSpace').click();
 return $('freeSpaceCheckResult')?.textContent||'Изпълних проверката за свободно място.';
}
const API={parse,handle,dims,capacity,trailerState,get pending(){return state.pending;}};
root.NTZAssistantActions=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);