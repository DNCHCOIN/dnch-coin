const assert=require('node:assert/strict');
const C=require('../assistant-core.js');
const input='2Х 120Х80\n2Х 120Х100\n2Х 120Х120';
const rows=C.parseRows(input);
assert.equal(rows.length,3,'must remain three cargo rows');
assert.deepEqual(rows.map(r=>[r.q,r.l,r.w,r.height,r.weight,r.unit]),[
 [2,120,80,'','','cm'],
 [2,120,100,'','','cm'],
 [2,120,120,'','','cm']
]);
assert.equal(rows.reduce((s,r)=>s+r.q,0),6,'six pallets total');
assert.deepEqual(C.parseRows('2 x 120 x 80 cm\n2× 120×100 см\n2 бр. 120x120 см').map(x=>[x.q,x.l,x.w]),[[2,120,80],[2,120,100],[2,120,120]]);
const threeDim=C.parseRows('Товар 1: 120x80x150 см 400 кг 2 бр.');
assert.deepEqual([threeDim[0].l,threeDim[0].w,threeDim[0].height,threeDim[0].weight,threeDim[0].q],[120,80,150,400,2],'existing unambiguous three-dimension cargo must stay intact');
assert.equal(C.parseRows('120x80x160 см 500 кг 3 бр.')[0].height,160);
console.log('PASS quantity-column test: 2Х 120Х80, 2Х 120Х100, 2Х 120Х120 → 3 rows × 2, correct dimensions, absent kg/height');