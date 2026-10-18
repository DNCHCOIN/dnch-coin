/* DNCH Drag Racing v0.2 — side-view cars, traction telemetry and pilot physics controls. */
(()=>{
'use strict';
const E=window.DNCH_DRAG_ENGINE;
if(!E)return;
const bg=document.documentElement.lang==='bg';
const T=bg?{
 ready:'Избери кола, направи тунинг и натисни СТАРТ.',count:'Приготви се…',go:'СТАРТ! Дръж ГАЗ!',shift:'Смени предавката преди червената зона.',nitro:'',
 already:'',goodShift:'Скоростта е сменена!',finalWin:'ПОБЕДА!',finalLoss:'СЛЕДВАЩИЯ ПЪТ!',finalTie:'РАВЕНСТВО!',
 launch:'Газ при старт',tc:'Тракшън контрол',spin:'Буксуване',drive:'Задвижване',rpmDrop:'Сменяй близо до червените обороти.',
 result:'Твоето време',opponent:'Съперник',payout:'Награда',record:'Личен рекорд',credits:'Кредити',
 insufficient:'Недостатъчно игрови кредити.',max:'Максимален тунинг!',upgraded:'Подобрението е монтирано.',
 playAgain:'Нов старт',offline:'Играта работи без акаунт. Рекордите са само в този браузър.',
 engine:'Двигател',grip:'Сцепление',gearbox:'Скорости',next:'Следващо подобрение',limit:'МАКС',
 ai:'Съперник',you:'ТИ',garage:'ГАРАЖ',race:'СЪСТЕЗАНИЕ',
 start:'СТАРТ',gas:'ГАЗ',manual:'СМЯНА',boost:'НИТРО',finished:'ФИНИШ',early:'Чакай зеленото!'
}:{
 ready:'Pick a car, tune it, and press START.',count:'Get ready…',go:'GO! Hold GAS!',shift:'Shift before the redline.',nitro:'',
 already:'',goodShift:'Gear changed!',finalWin:'VICTORY!',finalLoss:'NEXT TIME!',finalTie:'DRAW!',
 launch:'Launch throttle',tc:'Traction control',spin:'Wheelspin',drive:'Drivetrain',rpmDrop:'Shift near the engine redline.',
 result:'Your time',opponent:'Opponent',payout:'Reward',record:'Personal best',credits:'Credits',
 insufficient:'Not enough game credits.',max:'Fully upgraded!',upgraded:'Upgrade installed.',
 playAgain:'Race again',offline:'The game needs no account. Records stay in this browser.',
 engine:'Engine',grip:'Traction',gearbox:'Transmission',next:'Next upgrade',limit:'MAX',
 ai:'Rival',you:'YOU',garage:'GARAGE',race:'RACE',
 start:'START',gas:'GAS',manual:'SHIFT',boost:'NITRO',finished:'FINISH',early:'Wait for green!'
};
const $=id=>document.getElementById(id);
const canvas=$('drag-canvas'),ctx=canvas.getContext('2d');
const KEY='dnch-drag-v2',PREVIOUS_KEY='dnch-drag-v1';
let save=E.DEFAULT();
try{save=E.sanitize(JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(PREVIOUS_KEY)))}catch(err){save=E.DEFAULT()}
let game=null,gasHeld=false,frame=0,lastFrame=0,announced=false;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save))}catch(e){}}
function format(n){return(Number(n)||0).toFixed(2)}
function carOf(id){return E.CARS.find(c=>c.id===id)||E.CARS[0]}
function say(txt){$('drag-message').textContent=txt}
function drawBox(x,y,w,h,color,r=10){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();
}
function shadeCar(x,y,car,angle,spin,speed){
 const col=car.color,accent=car.accent;
 ctx.save();ctx.translate(x,y);
 // The chassis follows speed and tire slip with subtle squat.
 ctx.translate(0,Math.min(3,speed/28));
 ctx.shadowColor='#000b';ctx.shadowBlur=14;
 // Wheelbase and body silhouette, side view facing right.
 ctx.fillStyle='#000a';ctx.beginPath();ctx.ellipse(2,-4,109,10,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.beginPath();ctx.moveTo(-93,-18);ctx.lineTo(-84,-46);ctx.lineTo(-34,-56);
 ctx.lineTo(19,-61);ctx.lineTo(54,-49);ctx.lineTo(88,-33);ctx.lineTo(98,-18);
 ctx.lineTo(96,-10);ctx.lineTo(-97,-10);ctx.closePath();ctx.fillStyle=col;ctx.fill();
 ctx.beginPath();ctx.moveTo(-53,-48);ctx.lineTo(-28,-72);ctx.lineTo(20,-74);
 ctx.lineTo(54,-53);ctx.closePath();ctx.fillStyle=accent;ctx.fill();
 ctx.beginPath();ctx.moveTo(-48,-50);ctx.lineTo(-26,-67);ctx.lineTo(12,-68);
 ctx.lineTo(12,-50);ctx.closePath();ctx.fillStyle='#152332';ctx.fill();
 ctx.beginPath();ctx.moveTo(17,-68);ctx.lineTo(46,-52);ctx.lineTo(17,-52);
 ctx.closePath();ctx.fill();
 ctx.lineWidth=2;ctx.strokeStyle='#ffffff58';ctx.beginPath();ctx.moveTo(-92,-20);
 ctx.lineTo(88,-20);ctx.stroke();
 ctx.strokeStyle='#141b23';ctx.beginPath();ctx.moveTo(15,-52);ctx.lineTo(15,-21);ctx.stroke();
 ctx.fillStyle='#fff2c6';ctx.fillRect(88,-27,9,8);
 ctx.fillStyle='#e2414c';ctx.fillRect(-95,-25,9,9);
 for(const wx of [-54,57]){
  ctx.beginPath();ctx.arc(wx,-11,22,0,Math.PI*2);ctx.fillStyle='#090c14';ctx.fill();
  ctx.beginPath();ctx.arc(wx,-11,14,0,Math.PI*2);ctx.fillStyle='#717d87';ctx.fill();
  ctx.save();ctx.translate(wx,-11);ctx.rotate(angle*(wx<0?1:1));
  ctx.strokeStyle='#dfddd8';ctx.lineWidth=4;
  for(let a=0;a<5;a++){ctx.rotate(2*Math.PI/5);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(12,0);ctx.stroke()}
  ctx.restore();
  ctx.beginPath();ctx.arc(wx,-11,4,0,Math.PI*2);ctx.fillStyle='#20252b';ctx.fill();
 }
 if(spin>.10&&speed<32){
  // Deterministic slip visualization behind the powered wheels.
  ctx.fillStyle='#b1b9c0'+(Math.floor(Math.min(.6,spin*.4)*255)).toString(16).padStart(2,'0');
  for(let k=0;k<5;k++){
   const sx=-91-k*18-(Math.sin((angle+k)*.7)+1)*6;
   const sy=-12-k*10;
   ctx.beginPath();ctx.ellipse(sx,sy,10+k*3,6+k*3,0,0,Math.PI*2);ctx.fill();
  }
 }
 ctx.restore();
}
function track(){
 if(!ctx)return;
 const w=960,h=430,progress=game?.player.pos||0,scroll=progress*3.6;
 ctx.clearRect(0,0,w,h);
 const sky=ctx.createLinearGradient(0,0,0,220);
 sky.addColorStop(0,'#07111e');sky.addColorStop(.7,'#223042');sky.addColorStop(1,'#483f43');
 ctx.fillStyle=sky;ctx.fillRect(0,0,w,220);
 ctx.fillStyle='#e9cb84';ctx.font='700 16px system-ui';
 ctx.fillText('DNCH DRAG · PERFORMANCE v0.2',22,27);
 // Track lights and night city form a scrolling parallax.
 for(let i=0;i<32;i++){
  const px=(i*68-scroll*.15%68+1060)%1080-60;
  const building=(i*37%58)+28;
  ctx.fillStyle=i%3?'#18212c':'#252a36';
  ctx.fillRect(px,188-building,49,building+23);
  ctx.fillStyle='#d2aa61';for(let j=0;j<2;j++)ctx.fillRect(px+11+j*20,183-building+10,5,5);
 }
 ctx.fillStyle='#111820';ctx.fillRect(0,193,w,237);
 for(const y of [195,319]){ctx.fillStyle='#615a4d';ctx.fillRect(0,y,w,4)}
 ctx.fillStyle='#24262c';ctx.fillRect(0,203,w,106);ctx.fillRect(0,326,w,104);
 ctx.fillStyle='#ac955c';ctx.fillRect(0,203,w,3);ctx.fillRect(0,427,w,3);
 ctx.strokeStyle='#717379';ctx.lineWidth=3;ctx.setLineDash([40,33]);
 ctx.lineDashOffset=-scroll%73;ctx.beginPath();ctx.moveTo(0,318);ctx.lineTo(w,318);ctx.stroke();ctx.setLineDash([]);
 for(let n=50;n<500;n+=50){
  const x=286+(n-progress)*3.0;
  if(x<-25||x>980)continue;
  ctx.fillStyle='#a39d8c';ctx.fillRect(x,197,4,227);
  ctx.font='700 14px system-ui';ctx.fillStyle='#e3cc9f';ctx.fillText(n+' m',x+7,217);
 }
 const finishX=286+(E.DISTANCE-progress)*3.0;
 if(finishX>0&&finishX<w){
  for(let i=0;i<22;i++)for(let j=0;j<2;j++){
   ctx.fillStyle=(i+j)%2?'#e9e8db':'#0e1013';
   ctx.fillRect(finishX+j*13,194+i*11,13,11);
  }
 }
 if(game){
  const rival=carOf(game.opponentName),mine=carOf(save.car);
  const dx=(game.opponent.pos-game.player.pos)*3.0;
  shadeCar(E.clamp(287+dx,-115,1090),306,rival,game.opponent.wheelAngle,game.opponent.spin,game.opponent.speed);
  shadeCar(287,423,mine,game.player.wheelAngle,game.player.spin,game.player.speed);
 }else{
  shadeCar(258,306,carOf('turbo'),.4,0,0);
  shadeCar(287,423,carOf(save.car),0,0,0);
 }
 ctx.font='800 15px system-ui';ctx.fillStyle='#f0dbae';
 ctx.fillText(T.ai,16,255);ctx.fillText(T.you,16,374);
 ctx.fillStyle='#111924';ctx.fillRect(570,32,325,11);
 ctx.fillStyle='#dfbc78';ctx.fillRect(570,32,325*E.clamp(progress/E.DISTANCE,0,1),11);
 ctx.textAlign='right';ctx.fillStyle='#f8e9bd';ctx.font='700 17px system-ui';
 ctx.fillText(Math.round(progress)+' / 402 m',896,28);ctx.textAlign='left';
 // Drag launch light — count orange bulbs, then green.
 for(let i=0;i<4;i++){
  const lit=game&&((game.phase==='countdown'&&i===Math.min(2,Math.floor(game.clock)))||
   (game.phase==='running'&&i===3));
  ctx.beginPath();ctx.arc(925,61+i*36,11,0,Math.PI*2);
  ctx.fillStyle=lit?(i===3?'#7cffa1':'#f5bd5b'):'#34353a';
  ctx.shadowColor=lit?(i===3?'#7cffa1':'#f6a83a'):'transparent';
  ctx.shadowBlur=lit?15:0;ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='#8c8170';ctx.lineWidth=1.5;ctx.stroke();
 }
}
function refreshGarage(){
 const holder=$('drag-cars');holder.replaceChildren();
 for(const car of E.CARS){
  const btn=document.createElement('button');btn.type='button';
  btn.className='drag-car-choice'+(save.car===car.id?' active':'');
  btn.setAttribute('aria-pressed',String(save.car===car.id));
  const chip=document.createElement('span');chip.className='drag-car-chip';chip.style.background=car.color;
  const words=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');
  name.textContent=bg?car.bg:car.en;
  detail.textContent=car.hp+' HP · '+car.mass+' kg';
  words.append(name,detail);btn.append(chip,words);
  btn.addEventListener('click',()=>{if(game&&game.phase!=='finished')return;save.car=car.id;persist();refreshGarage();track()});
  holder.appendChild(btn);
 }
 const car=carOf(save.car),parts=save.parts[save.car],stats=E.CARS.find(x=>x.id===save.car);
 $('drag-selected').textContent=bg?car.bg:car.en;
 $('drag-credits').textContent=String(save.credits);
 $('drag-best').textContent=save.best[save.car]?format(save.best[save.car])+' s':'—';
 $('drag-history').textContent=save.wins+' / '+save.races;
 $('drag-spec').textContent=Math.round(stats.hp*(1+.105*parts.engine))+' HP · '+stats.mass+' kg · '+stats.drive+' · '+stats.induction;
 $('drag-drive').textContent=stats.drive+' · '+stats.induction;
 for(const part of ['engine','grip','gearbox']){
  const level=parts[part],price=E.LEVEL_COST[part][level];
  const button=$('drag-upgrade-'+part);
  $('drag-level-'+part).textContent=level+' / 3';
  button.textContent=price===undefined?T.limit:T.next+' · '+price+' CR';
  button.disabled=level>=3||save.credits<(price||0)||(game&&game.phase!=='finished');
 }
 $('drag-auto').checked=save.autoShift;
 $('drag-tcs').checked=save.tractionControl;
 $('drag-launch').value=String(save.launchPct);
 $('drag-launch-value').textContent=String(save.launchPct)+'%';
}
function hud(){
 if(!game){
  $('drag-speed').textContent='0';$('drag-rpm').textContent='950';
  $('drag-gear').textContent='1';$('drag-distance').textContent='0';
  $('drag-time').textContent='0.00';$('drag-rpm-bar').style.width='8%';
  $('drag-shift').disabled=true;$('drag-slip').textContent='0%';return;
 }
 const v=game.player;
 $('drag-speed').textContent=String(Math.round(v.speed*3.6));
 $('drag-rpm').textContent=String(Math.round(v.rpm));
 $('drag-gear').textContent=String(v.gear);
 $('drag-distance').textContent=String(Math.round(v.pos));
 $('drag-time').textContent=format(game.time);
 $('drag-rpm-bar').style.width=(E.clamp(v.rpm/carOf(game.player.car).redline,0,1)*100).toFixed(1)+'%';
 $('drag-rpm-bar').classList.toggle('redline',v.rpm>carOf(game.player.car).redline-350);
 $('drag-slip').textContent=Math.round(Math.min(v.spin,3)*100)+'%';
 $('drag-shift').disabled=game.phase!=='running'||v.gear>=5||v.shiftLeft>0||v.finishTime!==null;
 $('drag-gas').disabled=game.phase==='finished';
}
function settle(){
 if(!game||game.phase!=='finished'||announced)return;
 announced=true;gasHeld=false;const payout=E.award(save,game);
 persist();refreshGarage();hud();
 const result=game.result==='win'?T.finalWin:game.result==='loss'?T.finalLoss:T.finalTie;
 const own=game.player.pos>=E.DISTANCE?format(game.player.finishTime+game.player.penalty)+' s':'DNF';
 $('drag-result-title').textContent=result;
 $('drag-result-detail').textContent=T.result+': '+own+' · '+T.opponent+': '+(game.opponent.finishTime===null?'DNF':format(game.opponent.finishTime)+' s')+' · '+T.payout+': '+payout+' CR'+' · '+T.spin+': '+Math.round(game.player.maxWheelspin*100)+'%';
 $('drag-result').hidden=false;$('drag-stage').textContent=T.finished;
 say(result);$('drag-start').textContent=T.playAgain;
}
function step(time){
 if(!lastFrame)lastFrame=time;
 const dt=Math.min(Math.max((time-lastFrame)/1000,0),.05);lastFrame=time;
 if(game&&game.phase!=='finished'){
  const phase=game.phase;
  E.tick(game,dt,gasHeld);
  if(phase==='countdown'&&game.phase==='running'){say(T.go);$('drag-stage').textContent='GO!'}
  if(game.phase==='countdown'){
   const left=Math.max(1,Math.ceil(game.countdown-game.clock));
   $('drag-stage').textContent=left>3?'●':String(left);
  }
  settle();hud();
 }
 track();
 frame=requestAnimationFrame(step);
}
function start(){
 if(game&&(game.phase==='running'||game.phase==='countdown'))return;
 game=E.makeRace(save.car,save.parts[save.car],save.autoShift,{launchPct:save.launchPct,tractionControl:save.tractionControl});
 announced=false;gasHeld=false;
 $('drag-result').hidden=true;$('drag-start').textContent=T.playAgain;
 $('drag-stage').textContent='3';$('drag-stage').classList.remove('drag-idle');
 say(T.count);
 refreshGarage();hud();
}
function shift(){
 if(!game||game.phase!=='running')return;
 if(E.shift(game.player)){say(T.goodShift);hud()}
}
function gas(state){
 if(state&&game?.phase==='countdown'&&game.player.penalty===0){
  game.player.penalty=.35;say(T.early);
 }
 gasHeld=!!state;
}
$('drag-start').addEventListener('click',start);
$('drag-shift').addEventListener('click',shift);
$('drag-gas').addEventListener('pointerdown',ev=>{ev.preventDefault();ev.currentTarget.setPointerCapture?.(ev.pointerId);gas(true)});
for(const e of ['pointerup','pointercancel','lostpointercapture','pointerleave'])$('drag-gas').addEventListener(e,()=>gas(false));
document.addEventListener('pointerup',()=>gas(false));
document.addEventListener('keydown',ev=>{
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 const k=ev.key.toLowerCase();
 if(['arrowright','w',' ','arrowup','enter'].includes(k))ev.preventDefault();
 if(k==='arrowright'||k==='w')gas(true);
 if((k===' '||k==='arrowup')&&!ev.repeat)shift();
 if(k==='enter'&&!ev.repeat)start();
});
document.addEventListener('keyup',ev=>{const k=ev.key.toLowerCase();if(k==='arrowright'||k==='w')gas(false)});
window.addEventListener('blur',()=>gas(false));
document.addEventListener('visibilitychange',()=>{if(document.hidden)gas(false);lastFrame=0});
$('drag-auto').addEventListener('change',ev=>{save.autoShift=!!ev.target.checked;persist();if(game&&game.phase==='countdown')game.autoShift=save.autoShift});
$('drag-tcs').addEventListener('change',ev=>{save.tractionControl=!!ev.target.checked;persist();if(game&&game.phase==='countdown')game.options.tractionControl=save.tractionControl});
$('drag-launch').addEventListener('input',ev=>{save.launchPct=E.clamp(Number(ev.target.value)||68,35,100);$('drag-launch-value').textContent=save.launchPct+'%';persist();if(game&&game.phase==='countdown')game.options.launchPct=save.launchPct});
for(const part of ['engine','grip','gearbox']){
 $('drag-upgrade-'+part).addEventListener('click',()=>{
  if(game&&game.phase!=='finished')return;
  const out=E.upgrade(save,part);
  if(out.ok){persist();refreshGarage();say(T.upgraded)}
  else if(out.reason==='max')say(T.max);else if(out.reason==='credits')say(T.insufficient);
 });
}
say(T.ready);refreshGarage();hud();track();
$('drag-result').hidden=true;
frame=requestAnimationFrame(step);
})();
