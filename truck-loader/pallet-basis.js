(function(root){
'use strict';
const types={
 euro:{label:'120 × 80 см',area:0.96,rate:2.5},
 industrial:{label:'120 × 100 см',area:1.2,rate:2},
 square:{label:'120 × 120 см',area:1.44,rate:5/3}
};
function dimension(value){
 const raw=String(value??'').trim().replace(',','.');
 if(!/^\d+(?:\.\d+)?$/.test(raw))return null;
 const n=Number(raw);
 return Number.isFinite(n)&&n>0&&n<=10000?n:null;
}
function custom(length,width){
 const l=dimension(length),w=dimension(width);
 if(l===null||w===null)return null;
 const area=l*w/10000;
 return {label:String(l).replace('.',',')+' × '+String(w).replace('.',',')+' см',area,rate:2.4/area,length:l,width:w,custom:true};
}
function get(id,dimensions){
 if(id==='custom')return custom(dimensions?.length,dimensions?.width);
 return types[id]||types.euro;
}
root.PalletBasis={types,get,custom,dimension};
if(typeof module!=='undefined')module.exports=root.PalletBasis;
})(typeof window!=='undefined'?window:globalThis);
