/* DNCH STUDIO / Digital Universe: lightweight animated data constellation */
(()=>{
  'use strict';
  const hero=document.querySelector('.hero');
  if(!hero || !('getContext' in document.createElement('canvas'))) return;
  const canvas=document.createElement('canvas');
  canvas.className='hero-network';
  canvas.setAttribute('aria-hidden','true');
  hero.insertBefore(canvas,hero.firstChild);
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx) return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const particles=[];
  let w=0,h=0,ratio=1,visible=true,raf=0,last=0,px=-9999,py=-9999;
  const rand=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
  const countForWidth=width=>width<580?30:width<900?48:73;
  function resize(){
    const box=hero.getBoundingClientRect();
    w=Math.max(1,Math.round(box.width));h=Math.max(1,Math.round(box.height));
    ratio=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    particles.length=0;
    const n=countForWidth(w);
    for(let i=0;i<n;i++){
      particles.push({x:rand(i+7)*w,y:rand(i+211)*h,
        dx:(rand(i+383)-.5)*13,dy:(rand(i+487)-.5)*11,
        size:rand(i+97)*1.35+.45,phase:rand(i+721)*6.283,
        tint:rand(i+911)>.80?'violet':'cyan'});
    }
  }
  function draw(now){
    ctx.clearRect(0,0,w,h);
    const t=reduce.matches?0:now*.00055;
    const pos=particles.map(p=>({
      x:(p.x+Math.sin(t+p.phase)*p.dx+w)%w,
      y:(p.y+Math.cos(t*.8+p.phase)*p.dy+h)%h,
      size:p.size,phase:p.phase,tint:p.tint
    }));
    ctx.save();
    ctx.globalCompositeOperation='screen';
    if(px>=0){
      const glow=ctx.createRadialGradient(px,py,0,px,py,235);
      glow.addColorStop(0,'rgba(64,184,255,.055)');glow.addColorStop(1,'rgba(64,184,255,0)');
      ctx.fillStyle=glow;ctx.fillRect(px-235,py-235,470,470);
    }
    const limit=w<580?94:145;
    for(let i=0;i<pos.length;i++){
      const a=pos[i];
      for(let j=i+1;j<pos.length;j++){
        const b=pos[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;
        if(d2>limit*limit)continue;
        const alpha=(1-Math.sqrt(d2)/limit)*.145;
        ctx.strokeStyle='rgba(86,207,244,'+alpha.toFixed(3)+')';
        ctx.lineWidth=.65;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      const pulse=.66+.34*Math.sin(t*2.1+a.phase);
      const violet=a.tint==='violet';
      ctx.fillStyle=violet?'rgba(169,126,255,'+(.35*pulse).toFixed(3)+')':'rgba(102,231,255,'+(.56*pulse).toFixed(3)+')';
      ctx.shadowColor=violet?'#a57cff':'#6feeff';
      ctx.shadowBlur=a.size>1.3?10:5;
      ctx.beginPath();ctx.arc(a.x,a.y,a.size,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function tick(now){
    raf=0;
    if(!visible||document.hidden||reduce.matches)return;
    if(now-last>=33){draw(now);last=now;}
    raf=requestAnimationFrame(tick);
  }
  function refresh(){
    cancelAnimationFrame(raf);raf=0;draw(performance.now());
    if(visible&&!document.hidden&&!reduce.matches)raf=requestAnimationFrame(tick);
  }
  resize();refresh();
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;refresh();},{threshold:0});
    observer.observe(hero);
  }
  window.addEventListener('resize',()=>{resize();refresh();},{passive:true});
  hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=hero.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;},{passive:true});
  hero.addEventListener('pointerleave',()=>{px=-9999;py=-9999;});
  document.addEventListener('visibilitychange',refresh);
  if(reduce.addEventListener)reduce.addEventListener('change',refresh);
})();
