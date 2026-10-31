(()=>{'use strict';
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(n);
const byId=(id,fn,event='input')=>{const el=$(id);if(el)el.addEventListener(event,fn)};
const products={
parts:[['MANN oil filter','Filters',13.90,'🔩'],['Brake pads','Brakes',54.90,'🛞'],['LED bulbs H7','Lighting',39.90,'💡'],['Air filter','Filters',18.90,'🧰'],['74Ah battery','Electrical',109,'🔋'],['Brake disc set','Brakes',119,'⚙️']],
trade:[['Business laptop','Technology',519,'💻'],['Wireless headphones','Technology',79,'🎧'],['Ergonomic chair','Office',139,'🪑'],['Desk lamp','Office',35,'💡'],['Thermal cup','Lifestyle',18,'🥤'],['Travel backpack','Lifestyle',59,'🎒']],
supplements:[['Whey protein','Protein',39,'🥛'],['Creatine monohydrate','Sport',24,'⚡'],['Vitamin D3','Vitamins',12,'☀️'],['Magnesium','Minerals',15,'🌿'],['Plant protein','Protein',36,'🌱'],['Multivitamins','Vitamins',19,'💊']],
pets:[['Comfy pet bed','Dogs',44,'🛏️'],['Rope toy','Dogs',12,'🦴'],['Cat scratcher','Cats',34,'🐈'],['Bowl set','All pets',18,'🥣'],['Carrier bag','All pets',49,'🧳'],['Cat teaser','Cats',9,'🐾']]
};
function setupShop(){
const kind=document.body.dataset.demo,items=products[kind];if(!items)return;
const grid=$('products'),filters=$('filters'),search=$('search'),cart=$('cartLines'),total=$('cartTotal'),count=$('cartCount');
if(!grid||!filters||!search||!cart||!total)return;
const categories=[...new Set(items.map(p=>p[1]))],counts=Array(items.length).fill(0);
let category='*',query='';
function draw(){
grid.replaceChildren();let found=0;
items.forEach((p,i)=>{const [name,cat,price,symbol]=p;
if(category!=='*'&&category!==cat)return;
if(query&&!((name+' '+cat).toLowerCase().includes(query)))return;
found++;
const card=document.createElement('article');card.className='product';
const media=document.createElement('div');media.className='product-media';
const icon=document.createElement('span');icon.className='symbol';icon.textContent=symbol;
const num=document.createElement('span');num.className='num';num.textContent=String(i+1).padStart(2,'0');
media.append(num,icon);
const info=document.createElement('div');info.className='product-info';
const small=document.createElement('small');small.textContent=cat;
const heading=document.createElement('h3');heading.textContent=name;
const note=document.createElement('p');note.textContent='Sample product · demo catalogue';
const foot=document.createElement('div');foot.className='product-foot';
const amount=document.createElement('b');amount.textContent=money(price);
const add=document.createElement('button');add.type='button';add.textContent='+';
add.setAttribute('aria-label','Add '+name);
add.addEventListener('click',()=>{counts[i]++;drawCart();});
foot.append(amount,add);info.append(small,heading,note,foot);card.append(media,info);grid.append(card);
});
if(!found){const p=document.createElement('p');p.className='no-results';p.textContent='No products match your search.';grid.append(p);}
}
function drawFilters(){filters.replaceChildren();[['*','All'],...categories.map(c=>[c,c])].forEach(([key,label])=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.classList.toggle('active',key===category);button.setAttribute('aria-pressed',String(key===category));button.addEventListener('click',()=>{category=key;drawFilters();draw();});filters.append(button);});}
function drawCart(){cart.replaceChildren();let sum=0,num=0;items.forEach((p,i)=>{const amount=counts[i];if(!amount)return;
num+=amount;sum+=amount*p[2];const row=document.createElement('div');row.className='cartline';
const label=document.createElement('span');label.textContent=amount+' × '+p[0];const right=document.createElement('span');
const price=document.createElement('b');price.textContent=money(amount*p[2]);
const remove=document.createElement('button');remove.type='button';remove.textContent='−';remove.setAttribute('aria-label','Remove '+p[0]);remove.addEventListener('click',()=>{counts[i]=Math.max(0,counts[i]-1);drawCart();});
right.append(price,remove);row.append(label,right);cart.append(row);
});if(!num){const e=document.createElement('p');e.className='empty';e.textContent='Your basket is empty. Add a product to start.';cart.append(e);}
total.textContent=money(sum);if(count)count.textContent=String(num);
const tier=$('cartTier');if(tier)tier.textContent=sum>=250?'Demo bulk order: threshold reached.':'Add products up to €250 for a sample B2B order.';
}
byId('search',()=>{query=search.value.trim().toLowerCase();draw();});byId('clearCart',()=>{counts.fill(0);drawCart();},'click');
drawFilters();draw();drawCart();
}
function setupFactory(){
if(document.body.dataset.demo!=='factory')return;
const rates={steel:1.85,stainless:3.1,aluminium:2.7};
function calculate(){
const material=$('material').value,thick=Math.max(.5,Math.min(25,Number($('thickness').value)||1)),qty=Math.max(1,Math.min(10000,Math.floor(Number($('quantity').value)||1)));
const unit=(rates[material]||rates.steel)*thick*.8+4,setup=25,total=qty*unit+setup;
$('quoteResult').textContent=money(total);$('unitResult').textContent=money(unit);$('totalPieces').textContent=qty.toLocaleString('en-IE')+' pcs';
$('quoteText').textContent='Illustrative demo estimate: '+material+' · '+thick+' mm · '+qty+' × '+money(unit)+' + '+money(setup)+' setup.';
}
['material','thickness','quantity'].forEach(id=>byId(id,calculate));calculate();
}
function setupAI(){
if(document.body.dataset.demo!=='aitech')return;
function estimate(){
const hrs=Math.max(0,Number($('hours').value)||0),cost=Math.max(0,Number($('cost').value)||0),pct=Math.max(0,Math.min(100,Number($('automation').value)||0));
$('hoursLabel').textContent=String(hrs);$('costLabel').textContent=money(cost);$('autoLabel').textContent=pct+'%';
const savings=hrs*cost*(pct/100)*4.33;
$('aiResult').textContent=money(savings);$('aiHours').textContent=(hrs*pct/100*4.33).toFixed(1)+' h';
$('aiDisclaimer').textContent='Illustrative monthly calculation before implementation, maintenance and human-review costs; not a performance guarantee.';
}
['hours','cost','automation'].forEach(id=>byId(id,estimate));
byId('runDemo',()=>{
const out=$('aiStatus'),step=Number(out.dataset.step||0),lines=['Request received → validation','Data categorized → review','Result drafted for human approval','Done: simulated workflow'];
out.textContent='> '+lines[step%lines.length];out.dataset.step=String(step+1);
},'click');estimate();
}
function setupPet(){
if(document.body.dataset.demo!=='pets')return;
const name=$('petName'),type=$('petType'),out=$('petGreeting');
function update(){const pet=name.value.trim().slice(0,30);out.textContent=pet?'Hello, '+pet+' '+(type.value==='dog'?'🐶':'🐱')+'!':'Personalize your demo pet shop here.';}
byId('petName',update);byId('petType',update);update();
}
setupShop();setupFactory();setupAI();setupPet();
})();