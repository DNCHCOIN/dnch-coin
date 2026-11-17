const assert=require('node:assert/strict');
const C=require('../assistant-core.js');
const cases=[
 ['Товар 5: 140x160x75 см 350 кг 4 бр.',{l:140,w:160,height:75,weight:350,q:4,unit:'cm'}],
 ['Палет 2: 1200×800×1600 мм 450 кг 8 бр.',{l:1200,w:800,height:1600,weight:450,q:8,unit:'mm'}],
 ['Товар 3: 1.2x0.8x1.6 м 500 кг 2 бр.',{l:1.2,w:0.8,height:1.6,weight:500,q:2,unit:'m'}],
 ['120 x 80 x 160 cm kg: 320 qty: 3',{l:120,w:80,height:160,weight:320,q:3,unit:'cm'}]
];
for(const [text,expect] of cases){
 const rows=C.parseRows(text);assert.equal(rows.length,1);
 for(const [key,val] of Object.entries(expect))assert.equal(rows[0][key],val);
}
assert.equal(C.parseRows('Товар 1: 120×80×100 см 200 кг 2 бр.\nТовар 2: 100×120×120 см 250 кг 3 бр.').length,2);
assert.equal(C.parseRows('случайно съобщение').length,0);
assert.equal(C.intent('Подреди'),'solve');
assert(C.help('Как да направя PDF?').includes('PDF'));
assert(C.help('Стифиране').includes('без стифиране'));
assert(C.help('виртуално продължение').includes('реалното ремарке'));
console.log('PASS: cargo parser, quantity, unit conversion, intents and help topics');