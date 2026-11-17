const assert = require('node:assert/strict');
globalThis.Packer = require('../pack.js');
globalThis.WeightPacker = require('../weight.js');
const StackPacker = require('../stack.js');
const Manual = require('../manual.js');

// 17 Nov 2026: 9 cargo types, 22 pieces, no stacking.
const types = [
  [140,76,100,1],[115,76,100,1],[150,76,100,1],
  [122,76,100,1],[140,160,100,4],[115,160,25,4],
  [150,160,1000,4],[130,160,1000,4],[140,70,120,2]
];
const items=[];
types.forEach(([l,w,weight,count],type)=>{
  for(let i=0;i<count;i++)items.push({id:items.length+1,type,l,w,actualL:l,actualW:w,
    weight,rotate:true,stackable:false,height:140});
});
assert.equal(items.length,22);
for(const enforceWeight of [false,true]){
  const plan=StackPacker.solve(items,240,3500,220,0,false,enforceWeight);
  assert(plan,'extended virtual layout exists');
  assert.equal(plan.placed.length,22,'all units are included');
  assert.equal(plan.stacked,0,'nothing is stacked');
  assert.equal(plan.used,2000,'compact 20 m solution, not former 21.40 m');
  assert.deepEqual(Manual.validate(plan.placed,{
    W:240,L:2050,H:220,g:0,stacking:false,enforceWeight
  }),[],'plan has no overlaps and respects geometry and configured weight constraint');
  assert(plan.used>1360,'20 m must be explicitly outside the 13.60 m actual trailer');
}
console.log('PASS: 22 cargo / 20m / no stacking / geometry and weight');
