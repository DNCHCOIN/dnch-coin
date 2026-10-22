(function(root){
'use strict';const E=1e-6;
function spaces(placed,W,L,g=0){let free=[{x:0,y:0,w:W+g,h:L+g}];const boxes=placed.filter(p=>!p.parent&&!p.level).map(p=>({x:p.x,y:p.y,w:(p.rot?p.actualL:p.actualW)+g,h:(p.rot?p.actualW:p.actualL)+g}));for(let p of boxes){let next=[];for(let f of free){if(p.x>=f.x+f.w-E||p.x+p.w<=f.x+E||p.y>=f.y+f.h-E||p.y+p.h<=f.y+E){next.push(f);continue}if(p.x>f.x+E)next.push({...f,w:p.x-f.x});if(p.x+p.w<f.x+f.w-E)next.push({...f,x:p.x+p.w,w:f.x+f.w-p.x-p.w});if(p.y>f.y+E)next.push({...f,h:p.y-f.y});if(p.y+p.h<f.y+f.h-E)next.push({...f,y:p.y+p.h,h:f.y+f.h-p.y-p.h});}free=next.filter((a,i)=>!next.some((b,j)=>i!==j&&a.x>=b.x-E&&a.y>=b.y-E&&a.x+a.w<=b.x+b.w+E&&a.y+a.h<=b.y+b.h+E&&(j<i||a.w<b.w-E||a.h<b.h-E)));}
return free.map(f=>({x:f.x,y:f.y,w:Math.floor((f.w-g+E)*10)/10,h:Math.floor((f.h-g+E)*10)/10})).filter(f=>f.w>=1&&f.h>=1).sort((a,b)=>b.w*b.h-a.w*a.h||a.y-b.y||a.x-b.x);}
root.FreeSpace={spaces};if(typeof module!=='undefined')module.exports=root.FreeSpace;
})(typeof window!=='undefined'?window:globalThis);
