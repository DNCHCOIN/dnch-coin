(function(root){
'use strict';
function fit(spaces,placed,W,end,H,g,l,w,height,weight,rotate,enforceWeight=true){
 const E=1e-6;
 if(![l,w,height,weight].every(v=>Number.isFinite(v)&&v>0))return {error:'Въведи положителни дължина, ширина, височина и килограми.'};
 if(height>H+E)return {error:'Височината надвишава ремаркето с '+(height-H).toFixed(2)+' см.'};
 const total=placed.reduce((s,p)=>s+p.weight,0)+weight;
 if(enforceWeight&&total>end/100*1700+E)return {error:'Общото тегло с новата пратка надвишава лимита за участъка до оранжевата линия с '+(total-end/100*1700).toFixed(2)+' кг. Нужно е повече дължина или намаляване на товара.'};
 let geometry=false;const deadline=Date.now()+1500;
 for(let index=0;index<spaces.length;index++){const f=spaces[index];
 for(const turned of rotate?[false,true]:[false]){
 const length=turned?w:l,width=turned?l:w;
 if(length>f.h+E||width>f.w+E)continue;geometry=true;
 const maxY=f.y+f.h-length,ys=new Set([f.y,maxY]);
 if(enforceWeight){for(let y=f.y+10;y<maxY;y+=10)ys.add(y);for(const p of placed){const span=p.h-g;for(const edge of [p.y,p.y+span])for(const shift of [0,-length,100,-100,100-length,-100-length]){const y=edge+shift;if(y>=f.y&&y<=maxY)ys.add(y);}}}
 for(const y of [...ys].sort((a,b)=>a-b)){
 if(Date.now()>deadline)return {error:'Не е намерено място в рамките на проверката. Опитай друга ориентация, размер или ръчно разместване.'};
 const p={id:Math.max(0,...placed.map(p=>p.id))+1,x:f.x,y,actualL:l,actualW:w,w:width+g,h:length+g,height,weight,rot:turned,parent:null,level:0,z:0};
 if(!enforceWeight||root.WeightPacker.peak([...placed,p],g,1700).kg<=1700+E)return {index,turned,x:p.x,y,length,width,height,weight};
 }
 }}
 return {error:geometry?'Размерите се побират, но не е намерена позиция в тези места с максимум 1700 кг във всеки 1-метров участък.':'Размерът не се побира в отделните номерирани места до оранжевата линия. Мястото след нея не се включва.'};
}
root.FreeSpaceCheck={fit};if(typeof module!=='undefined')module.exports=root.FreeSpaceCheck;
})(typeof window!=='undefined'?window:globalThis);
