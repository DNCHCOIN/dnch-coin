(function(root){
const eps=1e-7;
function layout(items,W,L,order,mode){let free=[{x:0,y:0,w:W,h:L}],out=[];for(const item of order){let best=null;for(let f of free)for(let rot of item.rotate?[false,true]:[false]){let w=rot?item.l:item.w,h=rot?item.w:item.l;if(w>f.w+eps||h>f.h+eps)continue;let score=mode===3?[rot===item.prefer?0:1,f.y,f.x]:mode===0?[f.y+h,f.y,f.x]:mode===1?[Math.min(f.w-w,f.h-h),f.y+h,f.x]:[f.y,f.x,f.y+h];if(!best||score.some((v,k)=>v<best.score[k]-eps&&score.slice(0,k).every((a,j)=>Math.abs(a-best.score[j])<eps)))best={x:f.x,y:f.y,w,h,rot,score};}if(!best)return null;let p={...item,...best};out.push(p);let next=[];for(let f of free){if(p.x>=f.x+f.w-eps||p.x+p.w<=f.x+eps||p.y>=f.y+f.h-eps||p.y+p.h<=f.y+eps){next.push(f);continue;}if(p.x>f.x+eps)next.push({...f,w:p.x-f.x});if(p.x+p.w<f.x+f.w-eps)next.push({...f,x:p.x+p.w,w:f.x+f.w-p.x-p.w});if(p.y>f.y+eps)next.push({...f,h:p.y-f.y});if(p.y+p.h<f.y+f.h-eps)next.push({...f,y:p.y+p.h,h:f.y+f.h-p.y-p.h});}free=next.filter((a,i)=>!next.some((b,j)=>i!==j&&a.x>=b.x-eps&&a.y>=b.y-eps&&a.x+a.w<=b.x+b.w+eps&&a.y+a.h<=b.y+b.h+eps&&(j<i||a.x>b.x+eps||a.y>b.y+eps||a.w<b.w-eps||a.h<b.h-eps)));}return {placed:out,used:Math.max(0,...out.map(p=>p.y+p.h))};}
function laneLayout(items,W,L,boundary){
 const eps=1e-7,sideWidth=W-boundary,side=[],wide=[],pair=[];
 for(const item of items){
   const options=(item.rotate?[false,true]:[false]).map(rot=>({rot,w:rot?item.l:item.w,h:rot?item.w:item.l})).filter(o=>o.w<=W+eps);
   const select=a=>a.sort((x,y)=>x.h-y.h||x.w-y.w)[0];
   const s=select(options.filter(o=>o.w<=sideWidth+eps));
   const p=select(options.filter(o=>o.w>sideWidth+eps&&o.w<=W/2+eps));
   const b=select(options.filter(o=>o.w>W/2-eps&&o.w<=boundary+eps));
   if(s)side.push({item,...s});else if(p)pair.push({item,...p});else if(b)wide.push({item,...b});else return null;
 }
 if(!wide.length||!pair.length)return null;
 const placed=[];let y=0;
 for(const t of wide.sort((a,b)=>b.h-a.h)){placed.push({...t.item,x:0,y,w:t.w,h:t.h,rot:t.rot});y+=t.h;}
 const wideEnd=y;
 for(const t of side.sort((a,b)=>b.h-a.h)){
   const start=side._y||0;
   if(start+t.h>wideEnd+eps)return null;
   placed.push({...t.item,x:boundary,y:start,w:t.w,h:t.h,rot:t.rot});
   side._y=start+t.h;
 }
 const pool=pair.slice().sort((a,b)=>b.w-a.w||b.h-a.h);
 while(pool.length){let x=0,rowH=0,remaining=[];
   for(const t of pool){if(x+t.w<=W+eps){placed.push({...t.item,x,y,w:t.w,h:t.h,rot:t.rot});x+=t.w;rowH=Math.max(rowH,t.h);}
     else remaining.push(t);}
   if(!rowH)return null;
   y+=rowH;pool.splice(0,pool.length,...remaining);
 }
 return y<=L+eps?{placed,used:Math.max(y,side._y||0)}:null;
}
function solve(items,W,L){let area=items.reduce((s,p)=>s+p.w*p.l,0),lower=area/W,best=null,seed=9127;for(const width of [...new Set(items.flatMap(p=>[p.w,p.l]))].filter(w=>w>W/2&&w<W).sort((a,b)=>a-b)){const trial=laneLayout(items,W,L,width);if(trial&&(!best||trial.used<best.used))best=trial;}function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}let orders=[items.slice().sort((a,b)=>b.w*b.l-a.w*a.l),items.slice().sort((a,b)=>Math.max(b.w,b.l)-Math.max(a.w,a.l)),items.slice().sort((a,b)=>b.l-a.l),items.slice().sort((a,b)=>b.w-a.w)];for(let i=0;i<Math.min(220,items.length*16);i++){let a=items.slice();for(let j=a.length-1;j>0;j--){let k=Math.floor(rand()*(j+1));[a[j],a[k]]=[a[k],a[j]];}orders.push(a);}for(let order of orders)for(let m=0;m<6;m++){let trial=order.map(p=>({...p,prefer:m===4?false:m===5?true:rand()>.5}));let r=layout(items,W,L,trial,m>=4?3:m);if(r&&(!best||r.used<best.used-eps))best=r;if(best&&best.used<=lower+eps)return {...best,lower,optimal:true};}return best?{...best,lower,optimal:best.used<=lower+eps}:null;}
root.Packer={solve};if(typeof module!=='undefined')module.exports=root.Packer;
})(typeof window!=='undefined'?window:globalThis);
