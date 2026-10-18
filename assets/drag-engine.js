/* DNCH Drag Racing v0.2 — simplified longitudinal vehicle simulation.
 * Torque maps, overall transmission ratios, clutch engagement, driven-axle
 * traction, wheelspin, turbo spool and aero/rolling losses.
 * Not calibrated for any actual production vehicle. No crypto or APIs.
 */
(function(global){
'use strict';
const DISTANCE=402.336,IDLE=900,MAX_GEAR=5,REDLINE=7000;
const CARS=Object.freeze([
 {id:'v8',en:'V8 Street Beast',bg:'V8 Уличен звяр',drive:'RWD',induction:'NA',
  hp:360,torque:505,peakRpm:3800,redline:6600,idle:850,mass:1550,tireRadius:.335,
  finalDrive:3.15,ratios:[0,3.28,2.12,1.54,1.18,.91],mu:1.01,frontShare:.53,
  cdA:.72,shift:.31,color:'#e4bd78',accent:'#8e5c2f'},
 {id:'turbo',en:'Turbo Spark',bg:'Турбо Искра',drive:'FWD',induction:'TURBO',
  hp:290,torque:405,peakRpm:4400,redline:6900,idle:900,mass:1230,tireRadius:.315,
  finalDrive:3.55,ratios:[0,3.18,2.05,1.48,1.11,.86],mu:.99,frontShare:.63,
  cdA:.65,shift:.28,color:'#55bff0',accent:'#155a7b'},
 {id:'muscle',en:'Midnight Muscle',bg:'Среднощен мускул',drive:'AWD',induction:'SC',
  hp:420,torque:550,peakRpm:4200,redline:6800,idle:850,mass:1760,tireRadius:.345,
  finalDrive:3.02,ratios:[0,3.02,2.10,1.53,1.17,.89],mu:1.04,frontShare:.51,
  cdA:.79,shift:.34,color:'#ee6a72',accent:'#73313d'}
]);
const LEVEL_COST=Object.freeze({engine:[120,250,450],grip:[100,210,380],gearbox:[110,240,410]});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),round=n=>Math.round(n*1000)/1000;
const DEFAULT=()=>({version:2,credits:300,car:'v8',parts:{
 v8:{engine:0,grip:0,gearbox:0},turbo:{engine:0,grip:0,gearbox:0},muscle:{engine:0,grip:0,gearbox:0}
},best:{},races:0,wins:0,autoShift:false,launchPct:68,tractionControl:false,legacyBest:{}});
function sanitize(raw){
 const out=DEFAULT();
 if(!raw||typeof raw!=='object'||![1,2].includes(raw.version))return out;
 if(Number.isSafeInteger(raw.credits))out.credits=clamp(raw.credits,0,999999);
 if(CARS.some(c=>c.id===raw.car))out.car=raw.car;
 for(const car of CARS)for(const part of Object.keys(LEVEL_COST)){
  const n=raw.parts?.[car.id]?.[part];
  if(Number.isInteger(n))out.parts[car.id][part]=clamp(n,0,3);
 }
 if(Number.isSafeInteger(raw.races))out.races=clamp(raw.races,0,999999);
 if(Number.isSafeInteger(raw.wins))out.wins=clamp(raw.wins,0,out.races);
 out.autoShift=raw.autoShift===true;
 if(raw.version===2){
  if(Number.isInteger(raw.launchPct))out.launchPct=clamp(raw.launchPct,35,100);
  out.tractionControl=raw.tractionControl===true;
 }
 for(const car of CARS){
  const best=raw.best?.[car.id];
  if(Number.isFinite(best)&&best>=5&&best<=55){
   if(raw.version===2)out.best[car.id]=round(best);
   else out.legacyBest[car.id]=round(best);
  }
 }
 return out;
}
function upgrade(save,part){
 if(!LEVEL_COST[part]||!save.parts[save.car])return {ok:false,reason:'part'};
 const lvl=save.parts[save.car][part];
 if(lvl>=3)return {ok:false,reason:'max'};
 const cost=LEVEL_COST[part][lvl];
 if(save.credits<cost)return {ok:false,reason:'credits',cost};
 save.credits-=cost;save.parts[save.car][part]++;
 return {ok:true,cost};
}
function vehicle(car,parts,reaction){
 const upgrades={
  engine:clamp(parts.engine||0,0,3),grip:clamp(parts.grip||0,0,3),
  gearbox:clamp(parts.gearbox||0,0,3)
 };
 return {car:car.id,gear:1,pos:0,speed:0,rpm:car.idle,elapsed:0,finishTime:null,
  reaction,penalty:0,shiftLeft:0,shiftCount:0,spin:0,accel:0,spool:0,drivenWheelRpm:0,
  wheelAngle:0,clutch:1,throttle:0,parts:upgrades,gearShiftTime:car.shift-.045*upgrades.gearbox,
  maxWheelspin:0};
}
function torqueAt(rpm,car,engineLevel,spool=1){
 const x=(clamp(rpm,car.idle,car.redline+1000)-car.peakRpm)/2550;
 const curve=.65+.35*Math.exp(-x*x);
 const cliff=clamp(1-(rpm-car.redline)/450,.02,1);
 const boosted=car.induction==='TURBO'?.63+.37*spool:1;
 return car.torque*curve*cliff*boosted*(1+.105*engineLevel);
}
function drivetrainTraction(car,parts,accel){
 // Front normal load decreases as the vehicle accelerates; rear increases.
 const transfer=clamp((accel/9.81)*.16,0,.17);
 const front=clamp(car.frontShare-transfer,.3,.7);
 const fraction=car.drive==='FWD'?front:car.drive==='RWD'?1-front:1;
 const mu=(car.mu+.085*parts.grip);
 return car.mass*9.81*mu*fraction;
}
function advance(v,car,dt,throttle,launchPct,tc){
 if(v.finishTime!==null)return;
 const startPos=v.pos;
 v.elapsed+=dt;
 v.shiftLeft=Math.max(0,v.shiftLeft-dt);
 const rawThrottle=clamp(Number(throttle)||0,0,1);
 // User can tune throttle for launch; once rolling, full power is available.
 const pct=v.speed<14?launchPct/100:1;
 let pedal=rawThrottle*pct;
 const overall=car.ratios[v.gear]*car.finalDrive;
 const coupledRpm=v.speed/(2*Math.PI*car.tireRadius)*60*overall;
 const launchRpm=car.idle+(2100+pedal*1300)*rawThrottle;
 // Gradual clutch take-up protects against instant engine-speed coupling.
 v.clutch=v.gear===1?clamp(v.speed/7,0,1):1;
 let rpm=v.gear===1?(1-v.clutch)*launchRpm+v.clutch*coupledRpm:coupledRpm;
 rpm=clamp(rpm+v.spin*600,car.idle,car.redline+850);
 const spoolTarget=clamp((rpm-1850)/2400,0,1)*rawThrottle;
 if(car.induction==='TURBO'){
  const tau=spoolTarget>v.spool?.52:.9;
  v.spool=clamp(v.spool+(spoolTarget-v.spool)*dt/tau,0,1);
 }else v.spool=1;
 let engineTorque=torqueAt(rpm,car,v.parts.engine,v.spool)*pedal;
 const drivenForce=engineTorque*overall*.85/car.tireRadius;
 const tireLimit=drivetrainTraction(car,v.parts,v.accel);
 // Traction control reduces power to near friction threshold. Without it,
 // excessive wheel torque causes sustained spin and reduced useful grip.
 let command=drivenForce;
 if(tc&&command>tireLimit)command=tireLimit*1.015;
 const overshoot=clamp((command-tireLimit)/Math.max(1,tireLimit),0,4);
 v.spin=clamp(v.spin+(overshoot-v.spin)*dt/.11,0,4);
 v.maxWheelspin=Math.max(v.maxWheelspin,v.spin);
 let tractionForce=command<=tireLimit?command:tireLimit/(1+.48*overshoot);
 if(v.shiftLeft>0)tractionForce=0;
 // Aero and rolling force, including real speed dependence.
 const aero=.5*1.225*car.cdA*v.speed*v.speed;
 const rolling=v.speed>0?car.mass*9.81*.014:0;
 v.accel=clamp((tractionForce-aero-rolling)/car.mass,-9.81,14);
 const speed=clamp(v.speed+v.accel*dt,0,99);
 const distance=(v.speed+speed)*.5*dt;
 v.speed=speed;v.pos=Math.min(DISTANCE,startPos+distance);
 v.wheelAngle+=(v.speed/car.tireRadius)*dt*(1+Math.min(v.spin,.75));
 v.rpm=rpm;v.drivenWheelRpm=v.speed/(2*Math.PI*car.tireRadius)*60*(1+v.spin);
 v.throttle=pedal;
 if(v.pos>=DISTANCE&&distance>0){
  const f=clamp((DISTANCE-startPos)/distance,0,1);
  v.finishTime=round(v.elapsed-dt+dt*f);
  v.pos=DISTANCE;
 }
}
function shift(v){
 if(v.finishTime!==null||v.gear>=MAX_GEAR||v.shiftLeft>0)return false;
 v.gear++;v.shiftLeft=v.gearShiftTime;v.shiftCount++;v.spin=0;
 return true;
}
function makeRace(carId,parts,autoShift=false,options={}){
 const car=CARS.find(x=>x.id===carId)||CARS[0],other=CARS[(CARS.indexOf(car)+1)%CARS.length];
 return {phase:'countdown',clock:0,countdown:3.25,time:0,result:null,
  player:vehicle(car,parts||{engine:0,grip:0,gearbox:0},.05),
  opponent:vehicle(other,{engine:0,grip:1,gearbox:1},.20),
  opponentName:other.id,autoShift:!!autoShift,options:{
   launchPct:Number.isInteger(options.launchPct)?clamp(options.launchPct,35,100):68,
   tractionControl:options.tractionControl===true
  }};
}
function tick(race,dt,throttle){
 dt=clamp(Number(dt)||0,0,.05);
 if(race.phase==='finished'||dt<=0)return race;
 race.clock+=dt;
 if(race.phase==='countdown'){
  if(race.clock>=race.countdown){race.phase='running';race.clock=0}
  return race;
 }
 race.time+=dt;
 const mycar=CARS.find(c=>c.id===race.player.car)||CARS[0];
 const aiCar=CARS.find(c=>c.id===race.opponent.car)||CARS[0];
 // Shift when engine speed is actually high and clutch shift has finished.
 if(race.autoShift&&race.player.rpm>mycar.redline-400)shift(race.player);
 if(race.opponent.rpm>aiCar.redline-550)shift(race.opponent);
 const P=race.player,O=race.opponent;
 const gas=typeof throttle==='number'?clamp(throttle,0,1):throttle?1:0;
 const pGas=race.time>=P.reaction?gas:0;
 const oGas=race.time>=O.reaction?1:0;
 advance(P,mycar,dt,pGas,race.options.launchPct,race.options.tractionControl);
 advance(O,aiCar,dt,oGas,79,true);
 if(P.finishTime!==null&&O.finishTime!==null){
  race.phase='finished';
  const playerTime=P.finishTime+P.penalty;
  const opponentTime=O.finishTime;
  race.result=playerTime<opponentTime?'win':playerTime>opponentTime?'loss':'tie';
 }else if(race.time>55){
  race.phase='finished';race.result='loss';
  if(P.finishTime===null)P.finishTime=null;
  if(O.finishTime===null)O.finishTime=null;
 }
 return race;
}
function award(save,race){
 if(race.phase!=='finished'||race.player.pos<DISTANCE)return 0;
 const credits=race.result==='win'?150:race.result==='tie'?100:65;
 save.credits=clamp(save.credits+credits,0,999999);
 save.races=clamp(save.races+1,0,999999);
 if(race.result==='win')save.wins=clamp(save.wins+1,0,999999);
 const prev=save.best[save.car];
 const elapsed=round(race.player.finishTime+race.player.penalty);
 if(!prev||elapsed<prev)save.best[save.car]=elapsed;
 return credits;
}
global.DNCH_DRAG_ENGINE=Object.freeze({
 DISTANCE,REDLINE,CARS,LEVEL_COST,DEFAULT,sanitize,upgrade,torqueAt,
 drivetrainTraction,makeRace,tick,shift,award,clamp
});
})(typeof window!=='undefined'?window:globalThis);
