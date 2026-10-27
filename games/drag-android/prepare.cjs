const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),dst=path.join(__dirname,'www');
const assets=['drag-engine.js','drag-game.js','drag-game.css','site.css'];
fs.rmSync(dst,{recursive:true,force:true});
fs.mkdirSync(path.join(dst,'assets','icons'),{recursive:true});
for(const f of assets)fs.copyFileSync(path.join(root,'assets',f),path.join(dst,'assets',f));
for(const f of ['dnch-192.png','dnch-512.png'])fs.copyFileSync(path.join(root,'assets','icons',f),path.join(dst,'assets','icons',f));
let html=fs.readFileSync(path.join(root,'bg','drag-racing.html'),'utf8');
html=html.replaceAll('../assets/','assets/').replace('../manifest-bg.webmanifest','manifest.webmanifest');
html=html.replace('<script defer src="assets/pwa.js"></script>','');
const css=[
'<style>',
':root{color-scheme:dark}body{background:#080a10}',
'.site-head,body>footer,.skip,.drag-topline,.drag-privacy>a{display:none!important}',
'.drag-page{padding:10px 0 35px;background:radial-gradient(circle at 60% 0%,#332718,transparent 48%)}',
'.wrap{width:min(900px,calc(100% - 20px))}',
'.drag-hero{margin:0 0 12px}.drag-hero h1{font-size:clamp(28px,7vw,42px);margin:5px 0}',
'.drag-hero p{font-size:12px;line-height:1.4}.drag-stage{font-size:clamp(32px,9vw,64px)}',
'.drag-stats{margin:12px 0}.drag-controls button{touch-action:manipulation;user-select:none}',
'@media(max-width:650px){',
'.drag-dashboard{grid-template-columns:repeat(3,minmax(0,1fr));gap:0}',
'.drag-gauge{min-width:0;padding:8px 4px}.drag-gauge span{font-size:9px}.drag-gauge strong{font-size:22px}',
'.drag-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px}',
'.drag-controls #drag-start{grid-column:1/-1;min-height:48px}',
'.drag-controls #drag-gas,.drag-controls #drag-shift{min-height:72px;font-size:18px}',
'.drag-controls #drag-gas{background:#386a43;border-color:#69c083}',
'.drag-controls #drag-shift{background:#745027;border-color:#dfb66a}',
'.drag-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
'.drag-stat{padding:8px 10px}.drag-stat strong{font-size:16px}',
'.drag-grid{grid-template-columns:1fr}.drag-car-list{grid-template-columns:1fr}',
'}','</style>'
].join('');
html=html.replace('</head>',css+'</head>');
html=html.replace('</body>',"<script>window.addEventListener('DOMContentLoaded',()=>{const stats=document.querySelector('.drag-stats'),race=document.querySelector('.drag-racing-shell');if(stats&&race)race.after(stats)});</script></body>");
fs.writeFileSync(path.join(dst,'index.html'),html);
fs.writeFileSync(path.join(dst,'manifest.webmanifest'),JSON.stringify({
name:'DNCH Drag Racing',short_name:'DNCH DRAG',display:'standalone',start_url:'./',
theme_color:'#080a10',background_color:'#080a10',
icons:[{src:'assets/icons/dnch-192.png',sizes:'192x192',type:'image/png'},{src:'assets/icons/dnch-512.png',sizes:'512x512',type:'image/png'}]
}));
console.log('Bulgarian DNCH Drag Racing prepared offline for Android.');
