/* DNCH Drag Racing v0.1 — standalone arcade physics and progression.
   Fictional cars, local-only game credits. No crypto, wallets, gambling or APIs. */
(function(global){
 'use strict';
 const DISTANCE=402.336,REDLINE=7200,IDLE=950,MAX_GEAR=5;
 const CARS=Object.freeze([
  {id:'v8',en:'V8 Street Beast',bg:'V8 Уличен звяр',hp:360,mass:1550,grip:.91,color:'#e4bd78',accent:'#8e5c2f'},
  {id:'turbo',en:'Turbo Spark',bg:'Турбо Искра',hp:290,mass:1220,grip:.86,color:'#55bff0',accent:'#155a7b'},
  {id:'muscle',en:'Midnight Muscle',bg:'Среднощен мускул',hp:420,mass:1750,grip:.98,color:'#ee6a72',accent:'#73313d'}
 ]);
 const LEVEL_COST=Object.freeze({engine:[120,250,450],grip:[100,210,380],gearbox:[110,240,410]});
 const RATIOS=[0,3.38,2.25,1.60,1.21,.96];
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 const round=n=>Math.round(n*1000)/1000;
 function tune(car,parts){return {
  hp:car.hp*(1+.125*parts.engine),
  mass:car.mass,
  grip:car.grip+.13*parts.grip,
  shift:.34-.065*parts.gearbox,
  nitroPower:1.46
 }}
 function initVehicle(car,parts,reaction=0){return {
  pos:0,speed:0,rpm:IDLE,gear:1,shiftLeft:0,nitroLeft:0,nitroUsed:false,
  launchAt:reaction,elapsed:0,finishTime:null,penalty:0,
  car:car.id,parts:{...parts},stats:tune(car,parts)
 }}
 function shift(v){
  if(v.finishTime!==null||v.gear>=MAX_GEAR||v.shiftLeft>0)return false;
  v.gear++;v.shiftLeft=v.stats.shift;return true;
 }
 function useNitro(v){
  if(v.finishTime!==null||v.nitroUsed||v.gear<2||v.elapsed<v.launchAt)return false;
  v.nitroUsed=true;v.nitroLeft=2.7;return true;
 }
 function advance(v,dt,gas){
  if(v.finishTime!==null)return;
  const prev=v.pos;
  v.elapsed+=dt;
  v.shiftLeft=Math.max(0,v.shiftLeft-dt);
  v.nitroLeft=Math.max(0,v.nitroLeft-dt);
  const ratio=RATIOS[v.gear]*3.15;
  const wheelRpm=v.speed/(2*Math.PI*.335)*60;
  v.rpm=clamp(Math.max(gas?2800:IDLE,wheelRpm*ratio),IDLE,9000);
  const cutoff=v.rpm>REDLINE?Math.max(.15,1-(v.rpm-REDLINE)/2200):1;
  const powerBand=clamp((v.rpm-1100)/3400,.49,1);
  const engineForce=(v.stats.hp*745.7*.64*powerBand*cutoff)/(Math.max(v.speed,8));
  const tireForce=v.stats.mass*9.81*v.stats.grip;
  const thrust=gas&&v.elapsed>=v.launchAt&&v.shiftLeft<=0?
   Math.min(tireForce,engineForce)*(v.nitroLeft>0?v.stats.nitroPower:1):0;
  const airDrag=.37*v.speed*v.speed;
  const rolling=v.speed>0?180:0;
  const accel=(thrust-airDrag-rolling)/v.stats.mass;
  const nextSpeed=clamp(v.speed+accel*dt,0,100);
  const nextPos=v.pos+(v.speed+nextSpeed)*.5*dt;
  v.speed=nextSpeed;v.pos=Math.min(DISTANCE,nextPos);
  if(nextPos>=DISTANCE&&nextPos>prev){
   const fraction=clamp((DISTANCE-prev)/(nextPos-prev),0,1);
   v.finishTime=round(v.elapsed-dt+dt*fraction+v.penalty);
   v.pos=DISTANCE;
  }
 }
 function makeRace(carId,parts,autoShift=false){
  const car=CARS.find(x=>x.id===carId)||CARS[0];
  const opponent=CARS[(CARS.findIndex(c=>c.id===car.id)+1)%CARS.length];
  return {
   phase:'countdown',clock:0,countdown:3.25,time:0,result:null,
   player:initVehicle(car,parts,.02),
   opponent:initVehicle(opponent,{engine:0,grip:1,gearbox:1},.24),
   autoShift:!!autoShift,opponentName:opponent.id,finishHold:0
  };
 }
 function tick(race,dt,throttle){
  dt=clamp(Number(dt)||0,0,.05);
  if(race.phase==='finished')return race;
  race.clock+=dt;
  if(race.phase==='countdown'){
   if(race.clock>=race.countdown){
    race.phase='running';race.clock=0;
   }
   return race;
  }
  race.time+=dt;
  if(race.autoShift&&race.player.rpm>=6650)shift(race.player);
  if(race.opponent.rpm>=6450)shift(race.opponent);
  advance(race.player,dt,!!throttle);
  advance(race.opponent,dt,true);
  if(race.player.finishTime!==null&&race.opponent.finishTime!==null){
   race.phase='finished';
   race.result=race.player.finishTime<race.opponent.finishTime?'win':
    race.player.finishTime>race.opponent.finishTime?'loss':'tie';
  } else if(race.time>45){
   // Avoid an endless race if the player never presses the throttle.
   if(race.player.finishTime===null)race.player.finishTime=round(race.time+10);
   if(race.opponent.finishTime===null)race.opponent.finishTime=round(race.time+10);
   race.phase='finished';race.result='loss';
  }
  return race;
 }
 const DEFAULT=()=>({version:1,credits:300,car:'v8',parts:{
  v8:{engine:0,grip:0,gearbox:0},turbo:{engine:0,grip:0,gearbox:0},muscle:{engine:0,grip:0,gearbox:0}
 },best:{},races:0,wins:0,autoShift:false});
 function sanitize(src){
  const p=DEFAULT();
  if(!src||typeof src!=='object'||src.version!==1)return p;
  if(Number.isSafeInteger(src.credits))p.credits=clamp(src.credits,0,999999);
  if(CARS.some(c=>c.id===src.car))p.car=src.car;
  for(const car of CARS){
   for(const part of Object.keys(LEVEL_COST)){
    const n=src.parts?.[car.id]?.[part];
    if(Number.isInteger(n))p.parts[car.id][part]=clamp(n,0,3);
   }
   const best=src.best?.[car.id];
   if(Number.isFinite(best)&&best>=5&&best<=45)p.best[car.id]=round(best);
  }
  if(Number.isSafeInteger(src.races))p.races=clamp(src.races,0,999999);
  if(Number.isSafeInteger(src.wins))p.wins=clamp(src.wins,0,p.races);
  p.autoShift=src.autoShift===true;
  return p;
 }
 function upgrade(save,part){
  if(!LEVEL_COST[part])return {ok:false,reason:'part'};
  const lvl=save.parts[save.car][part];
  if(lvl>=3)return {ok:false,reason:'max'};
  const cost=LEVEL_COST[part][lvl];
  if(save.credits<cost)return {ok:false,reason:'credits',cost};
  save.credits-=cost;save.parts[save.car][part]++;
  return {ok:true,cost};
 }
 function award(save,race){
  if(race.phase!=='finished'||race.player.pos<DISTANCE)return 0;
  const payout=race.result==='win'?150:race.result==='tie'?100:65;
  save.credits=clamp(save.credits+payout,0,999999);
  save.races=clamp(save.races+1,0,999999);
  if(race.result==='win')save.wins=clamp(save.wins+1,0,999999);
  const prev=save.best[save.car];
  if(!prev||race.player.finishTime<prev)save.best[save.car]=race.player.finishTime;
  return payout;
 }
 global.DNCH_DRAG_ENGINE=Object.freeze({
  DISTANCE,REDLINE,CARS,LEVEL_COST,DEFAULT,sanitize,upgrade,
  makeRace,tick,shift,useNitro,award,clamp
 });
})(typeof window!=='undefined'?window:globalThis);
