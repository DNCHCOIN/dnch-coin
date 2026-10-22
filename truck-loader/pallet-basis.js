(function(root){
const types={euro:{label:'120 × 80 см',area:0.96,rate:2.5},industrial:{label:'120 × 100 см',area:1.2,rate:2},square:{label:'120 × 120 см',area:1.44,rate:5/3}};
root.PalletBasis={types,get:id=>types[id]||types.euro};if(typeof module!=='undefined')module.exports=root.PalletBasis;
})(typeof window!=='undefined'?window:globalThis);
