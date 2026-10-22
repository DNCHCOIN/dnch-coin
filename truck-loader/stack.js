(function(root){
function solveStack(items,W,L,H,g,enabled,enforceWeight=true){
const floor=root.WeightPacker.solve(items,W+g,L+g,g,enforceWeight);let best=floor?{...floor,placed:floor.placed.map(p=>({...p,z:0,level:0,parent:null})),stacked:0}:null;
if(!enabled)return best;
let orders=[items.slice().sort((a,b)=>b.actualW*b.actualL-a.actualW*a.actualL),items.slice().sort((a,b)=>(Number(b.stackable)-Number(a.stackable))||b.actualW*b.actualL-a.actualW*a.actualL)];
for(const order of orders){let towers=[];
for(const item of order){let choice=null;for(const t of towers){let top=t.chain[t.chain.length-1];if(!top.item.stackable||t.height+item.height>H+1e-7)continue;for(const rot of item.rotate?[false,true]:[false]){let w=rot?item.actualL:item.actualW,l=rot?item.actualW:item.actualL;if(w<=top.w+1e-7&&l<=top.l+1e-7&&(!choice||top.w*top.l<choice.area))choice={t,rot,w,l,area:top.w*top.l};}}
if(choice){let t=choice.t;t.chain.push({item,rot:choice.rot,w:choice.w,l:choice.l,z:t.height});t.height+=item.height;}else towers.push({base:item,height:item.height,chain:[{item,rot:false,w:item.actualW,l:item.actualL,z:0}]});}
let groups=towers.map(t=>({...t.base,rotate:t.chain.every(c=>c.item.rotate),tower:t,weight:t.chain.reduce((sum,c)=>sum+c.item.weight,0)}));let r=root.WeightPacker.solve(groups,W+g,L+g,g,enforceWeight);if(!r)continue;let placed=[];for(const p of r.placed){let chain=p.tower.chain;for(let j=0;j<chain.length;j++){let c=chain[j],rot=!!(p.rot!==c.rot);placed.push({...c.item,x:p.x,y:p.y,w:(rot?c.item.actualL:c.item.actualW)+g,h:(rot?c.item.actualW:c.item.actualL)+g,rot,z:c.z,level:j,parent:j?chain[j-1].item.id:null});}}
let stacked=placed.filter(p=>p.level>0).length;let candidate={...r,placed,stacked,optimal:false};if(!best||candidate.used<best.used-1e-7||(Math.abs(candidate.used-best.used)<1e-7&&stacked>best.stacked))best=candidate;
}return best;
}
root.StackPacker={solve:solveStack};if(typeof module!=='undefined')module.exports=root.StackPacker;
})(typeof window!=='undefined'?window:globalThis);
