
/* DNCH / Cinematic Holographic Core (zero dependencies, reduced-motion aware) */
(()=>{
  'use strict';
  const stage=document.querySelector('.cinema-cosmos');
  const canvas=stage&&stage.querySelector('canvas.cinema-core-canvas');
  if(!stage||!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const stars=Array.from({length:115},(_,i)=>{
    const rnd=n=>{const v=Math.sin((i+1)*n*19.179)*43758.5453123;return v-Math.floor(v)};
    return {x:rnd(3.1),y:rnd(7.3),r:rnd(2.7)*1.5+.3,phase:rnd(11.1)*Math.PI*2};
  });
  let w=1,h=1,dpr=1,visible=true,raf=0,lastFrame=0,pointX=0,pointY=0,targetX=0,targetY=0;
  function resize(){
    const box=stage.getBoundingClientRect();
    w=Math.max(1,box.width);h=Math.max(1,box.height);
    dpr=Math.min(window.devicePixelRatio||1,1.6);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw(performance.now());
  }
  function pt(lat,lon,rx,ry,r,cx,cy){
    const distortion=1+.025*Math.sin(lat*7+lon*3);
    let x=Math.cos(lat)*Math.cos(lon)*distortion;
    let y=Math.sin(lat)*distortion;
    let z=Math.cos(lat)*Math.sin(lon)*distortion;
    const nx=x*Math.cos(ry)+z*Math.sin(ry);
    const nz=z*Math.cos(ry)-x*Math.sin(ry);
    const ny=y*Math.cos(rx)-nz*Math.sin(rx);
    const zz=y*Math.sin(rx)+nz*Math.cos(rx);
    const projection=3.4/(3.4-zz);
    return{x:cx+nx*r*projection,y:cy+ny*r*projection,z:zz,p:projection};
  }
  function glow(x,y,r,color){
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function ring(x,y,rx,ry,rotation,color,width,dash){
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
    ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
    ctx.strokeStyle=color;ctx.lineWidth=width;
    if(dash)ctx.setLineDash(dash);
    ctx.stroke();ctx.restore();
  }
  function draw(now){
    const time=motion.matches?1.8:now*.00035;
    ctx.clearRect(0,0,w,h);
    const cx=w*.50,cy=h*.50,r=Math.min(w*.40,h*.385);
    const rotY=time*.73+pointX*.43,rotX=.28+Math.sin(time*.7)*.14+pointY*.3;
    ctx.globalCompositeOperation='screen';
    glow(cx,cy,r*1.64,'rgba(36,115,235,.22)');
    glow(cx+r*.3,cy-r*.35,r*1.1,'rgba(119,65,250,.15)');
    glow(cx,cy,r*.71,'rgba(16,123,224,.35)');
    // Distant celestial dust
    for(const s of stars){
      const tw=.45+.45*Math.sin(time*2+s.phase);
      ctx.fillStyle='rgba(143,204,255,'+(tw*.34).toFixed(3)+')';
      ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fill();
    }
    // Outer elliptical tracks, with deliberate perspective tilt
    ring(cx,cy,r*1.22,r*.42,-.27+Math.sin(time*.3)*.15,'rgba(96,211,255,.38)',1.3);
    ring(cx,cy,r*1.36,r*.26,.43+Math.sin(time*.4)*.15,'rgba(149,109,255,.36)',1.4,[4,8]);
    ring(cx,cy,r*.96,r*.96,.02,'rgba(74,187,255,.17)',.8,[3,11]);
    ctx.save();
    const beam=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
    beam.addColorStop(0,'rgba(96,222,255,.05)');
    beam.addColorStop(.47,'rgba(116,232,255,.65)');
    beam.addColorStop(.6,'rgba(153,117,255,.5)');
    beam.addColorStop(1,'rgba(96,222,255,.07)');
    ring(cx,cy,r*1.17,r*.46,.48,'rgba(88,211,255,.20)',6);
    ring(cx,cy,r*1.17,r*.46,.48,beam,1.8);
    ctx.restore();
    // Meridian / latitude web: a *real* projected rotating 3D mesh
    const latCount=w<450?13:19,lonCount=w<450?26:37;
    const nodes=[];
    for(let a=0;a<=latCount;a++){
      const lat=-Math.PI*.5+a*Math.PI/latCount,strip=[];
      for(let b=0;b<=lonCount;b++){
        const lon=b*2*Math.PI/lonCount;
        strip.push(pt(lat,lon,rotX,rotY,r,cx,cy));
      }
      nodes.push(strip);
    }
    ctx.lineWidth=.7;
    for(let a=0;a<=latCount;a++){
      for(let b=0;b<lonCount;b++){
        const p=nodes[a][b],q=nodes[a][b+1];
        const front=(p.z+q.z)*.5;
        const alpha=front>0?.19+front*.30:.065;
        ctx.strokeStyle='rgba(101,220,255,'+alpha.toFixed(3)+')';
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
      }
    }
    for(let a=0;a<latCount;a++){
      for(let b=0;b<=lonCount;b++){
        const p=nodes[a][b],q=nodes[a+1][b];
        const front=(p.z+q.z)*.5;
        const alpha=front>0?.18+front*.34:.07;
        ctx.strokeStyle=b%8===0?'rgba(161,116,255,'+alpha.toFixed(3)+')':'rgba(99,196,255,'+alpha.toFixed(3)+')';
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
      }
    }
    // Floating bright points and occasional luminous arcs
    for(let a=1;a<latCount;a+=2){
      for(let b=0;b<lonCount;b+=3){
        const p=nodes[a][b];
        if(p.z<-.12)continue;
        const alpha=.35+.49*Math.max(0,p.z);
        ctx.fillStyle=(b%4===0?'rgba(182,145,255,':'rgba(145,246,255,')+alpha.toFixed(3)+')';
        ctx.beginPath();ctx.arc(p.x,p.y,p.z>.45?1.65:1.05,0,Math.PI*2);ctx.fill();
      }
    }
    // Satellites traveling on orbital arcs
    for(let i=0;i<5;i++){
      const angle=time*(i%2===0?1.25:-.77)+i*1.256;
      const orbitR=r*(1.03+i*.075), tilt=i%2===0?.43:-.32;
      const ex=Math.cos(angle)*orbitR,ey=Math.sin(angle)*orbitR*.42;
      const x=cx+ex*Math.cos(tilt)-ey*Math.sin(tilt);
      const y=cy+ex*Math.sin(tilt)+ey*Math.cos(tilt);
      glow(x,y,15,i%2===0?'rgba(114,225,255,.23)':'rgba(185,121,255,.26)');
      ctx.fillStyle=i%2===0?'#a2f9ff':'#bb91ff';
      ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
    // Architectural alignment guides
    ctx.strokeStyle='rgba(117,213,255,.14)';ctx.lineWidth=1;
    const offset=r*1.53;
    for(const sign of [-1,1]){
      const x=cx+sign*offset;
      ctx.beginPath();ctx.moveTo(x,cy-20);ctx.lineTo(x,cy+20);ctx.stroke();
      const y=cy+sign*offset;
      ctx.beginPath();ctx.moveTo(cx-18,y);ctx.lineTo(cx+18,y);ctx.stroke();
    }
  }
  function frame(now){
    raf=0;
    if(!visible||document.hidden||motion.matches)return;
    if(now-lastFrame>34){
      pointX+=(targetX-pointX)*.045;
      pointY+=(targetY-pointY)*.045;
      draw(now);lastFrame=now;
    }
    raf=requestAnimationFrame(frame);
  }
  function refresh(){
    cancelAnimationFrame(raf);raf=0;
    draw(performance.now());
    if(visible&&!document.hidden&&!motion.matches)raf=requestAnimationFrame(frame);
  }
  stage.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;
    const rect=stage.getBoundingClientRect();
    targetX=(e.clientX-rect.left)/rect.width-.5;
    targetY=(e.clientY-rect.top)/rect.height-.5;
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{targetX=0;targetY=0});
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize',resize,{passive:true});
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;refresh()}).observe(stage);
  document.addEventListener('visibilitychange',refresh);
  if(motion.addEventListener)motion.addEventListener('change',refresh);
  resize();refresh();
})();
