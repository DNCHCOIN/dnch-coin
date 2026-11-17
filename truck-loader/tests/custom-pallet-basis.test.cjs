const assert=require('node:assert/strict');
const PalletBasis=require('../pallet-basis.js');
function close(actual,expected){assert.ok(Math.abs(actual-expected)<1e-10,`expected ${expected}, got ${actual}`)}
for(const [id,rate,area] of [['euro',2.5,.96],['industrial',2,1.2],['square',5/3,1.44]]){
 const basis=PalletBasis.get(id);
 close(basis.rate,rate);
 close(basis.area,area);
}
for(const [l,w,rate] of [['120','80',2.5],['120','100',2],['120','120',5/3],['114','76',24000/(114*76)],['140','100',24000/(140*100)]]){
 const basis=PalletBasis.get('custom',{length:l,width:w});
 assert.ok(basis,'valid custom pallet');
 close(basis.rate,rate);
 close(basis.area,Number(l)*Number(w)/10000);
 close(20*basis.rate,20*2.4/basis.area);
}
assert.equal(PalletBasis.get('custom',{length:'114,5',width:'76'}).label,'114,5 × 76 см');
for(const [length,width] of [['0','80'],['-1','80'],['','80'],['120','0'],['120',''],['Infinity','80'],['a','80'],['10001','100']]){
 assert.equal(PalletBasis.get('custom',{length,width}),null,'invalid: '+length+' × '+width);
}
console.log('PASS: custom pallet tariff conversion and validation');
