/* DNCH Drag Racing v0.1 — canvas visuals and keyboard/touch garage UI. */
(()=>{
'use strict';
const E=window.DNCH_DRAG_ENGINE;
if(!E)return;
const bg=document.documentElement.lang==='bg';
const T=bg?{
 ready:'Избери кола, направи тунинг и натисни СТАРТ.',count:'Приготви се…',go:'СТАРТ! Дръж ГАЗ!',shift:'Смени предавката преди червената зона.',nitro:'НИТРО — само след първа предавка!',
 already:'Нитрото е използвано или още не е налично.',goodShift:'Скоростта е сменена!',finalWin:'ПОБЕДА!',finalLoss:'СЛЕДВАЩИЯ ПЪТ!',finalTie:'РАВЕНСТВО!',
 result:'Твоето време',opponent:'Съперник',payout:'Награда',record:'Личен рекорд',credits:'Кредити',
 insufficient:'Недостатъчно игрови кредити.',max:'Максимален тунинг!',upgraded:'Подобрението е монтирано.',
 playAgain:'Нов старт',offline:'Играта работи без акаунт. Рекордите са само в този браузър.',
 engine:'Двигател',grip:'Сцепление',gearbox:'Скорости',next:'Следващо подобрение',limit:'МАКС',
 ai:'Съперник',you:'ТИ',garage:'ГАРАЖ',race:'СЪСТЕЗАНИЕ',
 start:'СТАРТ',gas:'ГАЗ',manual:'СМЯНА',boost:'НИТРО',finished:'ФИНИШ',early:'Чакай зеленото!'
}:{
 ready:'Pick a car, tune it, and press START.',count:'Get ready…',go:'GO! Hold GAS!',shift:'Shift before the redline.',nitro:'NITRO — after first gear only!',
 already:'Nitro is already used or not available yet.',goodShift:'Gear changed!',finalWin:'VICTORY!',finalLoss:'NEXT TIME!',finalTie:'DRAW!',
 result:'Your time',opponent:'Opponent',payout:'Reward',record:'Personal best',credits:'Credits',
 insufficient:'Not enough game credits.',max:'Fully upgraded!',upgraded:'Upgrade installed.',
 playAgain:'Race again',offline:'The game needs no account. Records stay in this browser.',
 engine:'Engine',grip:'Traction',gearbox:'Transmission',next:'Next upgrade',limit:'MAX',
 ai:'Rival',you:'YOU',garage:'GARAGE',race:'RACE',
 start:'START',gas:'GAS',manual:'SHIFT',boost:'NITRO',finished:'FINISH',early:'Wait for green!'
};
const $=id=>document.getElementById(id);
const canvas=$('drag-canvas'),ctx=canvas.getContext('2d');
const KEY='dnch-drag-v1';
let save=E.DEFAULT();
try{save=E.sanitize(JSON.parse(localStorage.getItem(KEY)))}catch(err){save=E.DEFAULT()}
let game=null,gasHeld=false,frame=0,lastFrame=0,announced=false;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save))}catch(e){}}
function format(n){return(Number(n)||0).toFixed(2)}
function carOf(id){return E.CARS.find(c=>c.id===id)||E.CARS[0]}
function say(txt){$('drag-message').textContent=txt}
function drawBox(x,y,w,h,color,r=10){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();
}
function paintCar(x,y,color,accent,nitro=false){
 const w=128,h=57;
 ctx.save();ctx.translate(x,y);
 ctx.shadowBlur=18;ctx.shadowColor=nitro?'#19b9ff':'#000b';
 drawBox(-58,-21,118,47,'#000a',15);ctx.shadowBlur=0;
 drawBox(-61,-23,120,48,color,15);
 drawBox(-23,-20,46,42,accent,9);
 drawBox(-16,-17,25,36,'#071522',6);
 ctx.fillStyle='#ffffff40';ctx.fillRect(-13,-16,2,32);
 drawBox(-49,-30,25,9,'#101217',4);drawBox(27,-30,24,9,'#101217',4);
 drawBox(-49,26,25,9,'#101217',4);drawBox(27,26,24,9,'#101217',4);
 drawBox(48,-17,11,11,'#fff6cc',4);drawBox(48,9,11,11,'#fff6cc',4);
 drawBox(-61,-17,7,10,'#f23d4e',2);drawBox(-61,10,7,10,'#f23d4e',2);
 ctx.strokeStyle='#ffffff33';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(31,-20);ctx.lineTo(31,21);ctx.stroke();
 if(nitro){ctx.fillStyle='#53dcff';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-60,-10+i*12);ctx.lineTo(-90-Math.random()*20,-6+i*12);ctx.lineTo(-60,-2+i*12);ctx.fill()}}
 ctx.restore();
}
function track(){
 if(!ctx)return;
 const w=960,h=430;
 ctx.clearRect(0,0,w,h);
 const gr=ctx.createLinearGradient(0,0,0,h);
 gr.addColorStop(0,'#12151b');gr.addColorStop(.28,'#222b2b');gr.addColorStop(.3,'#11141a');gr.addColorStop(1,'#111117');
 ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);
 // Metal barriers and crowd / city lights.
 for(let i=0;i<22;i++){
  const x=(i*64-(game?.player.pos||0)*.9%64+64)%1050-25;
  drawBox(x,17,4,54,'#a99964',1);
  drawBox(x,357,4,55,'#82714b',1);
  ctx.fillStyle=i%3===0?'#e1b85b':'#5e7f85';
  ctx.fillRect(x,11,7,5);ctx.fillRect(x,414,7,4);
 }
 drawBox(0,87,w,269,'#282c31',0);
 drawBox(0,94,w,8,'#b99a5e',0);
 drawBox(0,344,w,8,'#b99a5e',0);
 ctx.strokeStyle='#51545b';ctx.lineWidth=3;ctx.setLineDash([26,23]);
 const shift=((game?.player.pos||0)*2.5)%49;ctx.lineDashOffset=-shift;
 ctx.beginPath();ctx.moveTo(0,219);ctx.lineTo(w,219);ctx.stroke();ctx.setLineDash([]);
 // Lane guides scrolling by distance.
 for(let i=0;i<28;i++){
  const x=((i*57-shift*2)%1100+1100)%1100-55;
  drawBox(x,106,22,3,'#ffffff13',1);drawBox(x,333,22,3,'#ffffff13',1);
 }
 if(game){
  const fin=280+(E.DISTANCE-game.player.pos)*2;
  if(fin>-50&&fin<w+40){
   for(let row=0;row<14;row++)for(let col=0;col<3;col++)
    drawBox(fin+col*11,97+row*18,11,18,(row+col)%2?'#161616':'#f3f0e4',0);
  }
  const rival=carOf(game.opponentName),mine=carOf(save.car);
  const aiX=280+(game.opponent.pos-game.player.pos)*2;
  paintCar(E.clamp(aiX,46,885),160,rival.color,rival.accent,game.opponent.nitroLeft>0);
  paintCar(280,285,mine.color,mine.accent,game.player.nitroLeft>0);
 }else{
  paintCar(276,285,carOf(save.car).color,carOf(save.car).accent);
  paintCar(246,160,'#72a2ae','#35505e');
 }
 ctx.font='700 17px system-ui';ctx.fillStyle='#dce0e2';
 ctx.fillText(T.ai,25,145);ctx.fillText(T.you,25,269);
 ctx.font='700 14px system-ui';ctx.fillStyle='#deb972';
 ctx.fillText('DNCH DRAG • ¼ MILE',22,33);
 const fraction=game?game.player.pos/E.DISTANCE:0;
 drawBox(550,27,340,10,'#151821',6);
 drawBox(550,27,Math.max(0,340*fraction),10,'#dfb86c',6);
 ctx.textAlign='right';ctx.fillStyle='#eef2f5';ctx.fillText(Math.round((game?.player.pos||0))+' / 402 m',892,20);
 ctx.textAlign='left';
 // Drag racing light tree.
 for(let i=0;i<4;i++){
  const visible=game&&game.phase!=='finished';
  const countdown=game?.phase==='countdown';
  const green=game?.phase==='running';
  const active=(i===3&&green)||(countdown&&i===Math.min(2,Math.floor(game.clock)));
  ctx.beginPath();ctx.arc(917,138+i*49,15,0,Math.PI*2);
  const lit=i===3?'#61f09e':'#f6bd54';
  ctx.fillStyle=active?lit:'#24242a';ctx.shadowColor=active?lit:'transparent';ctx.shadowBlur=active?23:0;ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='#626367';ctx.lineWidth=2;ctx.stroke();
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
 $('drag-spec').textContent=Math.round(stats.hp*(1+.125*parts.engine))+' HP • '+stats.mass+' kg';
 for(const part of ['engine','grip','gearbox']){
  const level=parts[part],price=E.LEVEL_COST[part][level];
  const button=$('drag-upgrade-'+part);
  $('drag-level-'+part).textContent=level+' / 3';
  button.textContent=price===undefined?T.limit:T.next+' · '+price+' CR';
  button.disabled=level>=3||save.credits<(price||0)||(game&&game.phase!=='finished');
 }
 $('drag-auto').checked=save.autoShift;
}
function hud(){
 if(!game){
  $('drag-speed').textContent='0';$('drag-rpm').textContent='950';
  $('drag-gear').textContent='1';$('drag-distance').textContent='0';
  $('drag-time').textContent='0.00';$('drag-rpm-bar').style.width='8%';
  $('drag-nitro').disabled=true;$('drag-shift').disabled=true;return;
 }
 const v=game.player;
 $('drag-speed').textContent=String(Math.round(v.speed*3.6));
 $('drag-rpm').textContent=String(Math.round(v.rpm));
 $('drag-gear').textContent=String(v.gear);
 $('drag-distance').textContent=String(Math.round(v.pos));
 $('drag-time').textContent=format(game.time);
 $('drag-rpm-bar').style.width=(E.clamp(v.rpm/7600,0,1)*100).toFixed(1)+'%';
 $('drag-rpm-bar').classList.toggle('redline',v.rpm>6700);
 $('drag-nitro').disabled=game.phase!=='running'||v.nitroUsed||v.gear<2||v.finishTime!==null;
 $('drag-shift').disabled=game.phase!=='running'||v.gear>=5||v.shiftLeft>0||v.finishTime!==null;
 $('drag-gas').disabled=game.phase==='finished';
}
function settle(){
 if(!game||game.phase!=='finished'||announced)return;
 announced=true;gasHeld=false;const payout=E.award(save,game);
 persist();refreshGarage();hud();
 const result=game.result==='win'?T.finalWin:game.result==='loss'?T.finalLoss:T.finalTie;
 const own=game.player.pos>=E.DISTANCE?format(game.player.finishTime)+' s':'DNF';
 $('drag-result-title').textContent=result;
 $('drag-result-detail').textContent=T.result+': '+own+' · '+T.opponent+': '+format(game.opponent.finishTime)+' s · '+T.payout+': '+payout+' CR';
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
 if(game&&game.phase==='running')return;
 game=E.makeRace(save.car,save.parts[save.car],save.autoShift);
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
function nitro(){
 if(!game||game.phase!=='running')return;
 if(E.useNitro(game.player))say(T.nitro);else say(T.already);
 hud();
}
function gas(state){
 if(state&&game?.phase==='countdown'&&game.player.penalty===0){
  game.player.penalty=.35;say(T.early);
 }
 gasHeld=!!state;
}
$('drag-start').addEventListener('click',start);
$('drag-shift').addEventListener('click',shift);
$('drag-nitro').addEventListener('click',nitro);
$('drag-gas').addEventListener('pointerdown',ev=>{ev.preventDefault();ev.currentTarget.setPointerCapture?.(ev.pointerId);gas(true)});
for(const e of ['pointerup','pointercancel','lostpointercapture','pointerleave'])$('drag-gas').addEventListener(e,()=>gas(false));
document.addEventListener('pointerup',()=>gas(false));
document.addEventListener('keydown',ev=>{
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 const k=ev.key.toLowerCase();
 if(['arrowright','w',' ','arrowup','n','enter'].includes(k))ev.preventDefault();
 if(k==='arrowright'||k==='w')gas(true);
 if((k===' '||k==='arrowup')&&!ev.repeat)shift();
 if(k==='n'&&!ev.repeat)nitro();
 if(k==='enter'&&!ev.repeat)start();
});
document.addEventListener('keyup',ev=>{const k=ev.key.toLowerCase();if(k==='arrowright'||k==='w')gas(false)});
window.addEventListener('blur',()=>gas(false));
document.addEventListener('visibilitychange',()=>{if(document.hidden)gas(false);lastFrame=0});
$('drag-auto').addEventListener('change',ev=>{save.autoShift=!!ev.target.checked;persist();if(game)game.autoShift=save.autoShift});
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
