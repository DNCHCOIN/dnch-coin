const assert=require('node:assert/strict');
globalThis.WeightPacker=require('../weight.js');const M=require('../manual.js');
const c={W:240,L:1360,H:220,g:0,stacking:true};
function p(id,x,y,l=120,w=80,weight=500,height=80){return {id,x,y,l,w,h:l,actualL:l,actualW:w,weight,height,rotate:true,rot:false,parent:null,z:0,level:0,stackable:true};}
const a=[p(1,0,0),p(2,80,0)];assert.deepEqual(M.validate(M.copy(a),c),[]);
assert(M.change(a,1,{x:80},c).errors.some(e=>e.includes('Застъпване')));assert.equal(a[0].x,0,'rejected edits leave original unchanged');
assert(M.change(a,1,{y:1350},c).errors.length);assert(M.change([{...a[0],rotate:false}],1,{rot:true},c).errors.length);
let move=M.change(a,1,{y:300},c);assert.deepEqual(move.errors,[]);assert.equal(move.placed[0].y,300);assert.equal(M.stats(move.placed,c).used,420);
let stack=[p(1,0,0,160,120,400,80),{...p(2,0,0,120,80,400,70),parent:1}];assert.deepEqual(M.validate(stack,c),[]);let shifted=M.change(stack,1,{x:100,y:300},c);assert.deepEqual(shifted.errors,[]);assert.equal(shifted.placed[1].x,100);assert.equal(shifted.placed[1].y,300);assert.equal(shifted.placed[1].z,80);
let rotated=M.change(stack,1,{rot:true},c);assert.deepEqual(rotated.errors,[]);assert(rotated.placed.every(t=>t.rot));assert.equal(rotated.placed[1].z,80);
let locked=M.copy(stack);locked[0].locked=true;assert(M.change(locked,2,{x:10},c).errors.length);assert(M.change(stack,1,{parent:2},c).errors.length);
let tooTall=M.copy(stack);tooTall[1].height=150;assert(M.validate(tooTall,c).some(e=>e.includes('височина')));
let unsupported=M.copy(stack);unsupported[0].stackable=false;assert(M.validate(unsupported,c).length);
let load=[p(1,0,0,100,80,1000),p(2,80,200,100,80,1000)];assert.deepEqual(M.validate(load,c),[]);assert(M.change(load,2,{y:0},c).errors.some(e=>e.includes('1700')));
let gapC={...c,g:5},tight=[p(1,0,0),p(2,80,0)];assert(M.validate(tight,gapC).length);tight[1].x=85;assert.deepEqual(M.validate(tight,gapC),[]);
let anchors=[{...p(1,0,300),locked:true},p(2,80,700),p(3,0,1000)];let arranged=M.arrange(anchors,c);assert.deepEqual(arranged.errors,[]);assert.deepEqual(M.validate(arranged.placed,c),[]);assert.equal(arranged.placed.find(p=>p.id===1).y,300);assert.equal(arranged.placed.length,3);
console.log('PASS: moves, rotation, bounds, collision/gap, stacked transforms, support/height, locks, cycles, rolling weight, anchored arrangement');
