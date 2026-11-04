/* DNCH Studio — Electric Metal motion engine.
   Pixel-aware canvas animation of the ORIGINAL DS emblem. No line sweep. */
(() => {
  'use strict';
  const src = 'studio-assets/ds-emblem-alpha.webp';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  const hosts = Array.from(document.querySelectorAll('.exact-site .brand-hd-main, .responsive-site .hero-visual'));
  if (!hosts.length) return;

  const rand = (a,b) => a + Math.random()*(b-a);
  const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
  const PI2 = Math.PI*2;
  const modes = [];

  function makeCanvas(w,h) {
    const c = document.createElement('canvas');
    c.width = Math.round(w); c.height = Math.round(h);
    return c;
  }
  function create(host, mobile) {
    if (host.querySelector('canvas.dnch-electric-canvas')) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'dnch-electric-canvas';
    canvas.setAttribute('aria-hidden','true');
    host.classList.add('dnch-electric-host');
    host.appendChild(canvas);
    if (mobile && !host.querySelector('.dnch-electric-wordmark')) {
      const word = document.createElement('div');
      word.className = 'dnch-electric-wordmark';
      word.innerHTML = 'DNCH <span>STUDIO</span><small>DIGITAL SYSTEMS ENGINEERED</small>';
      host.appendChild(word);
    }
    const m = {
      host, mobile, canvas, ctx:canvas.getContext('2d',{alpha:true}),
      w:0,h:0,dpr:1,paint:null,pctx:null,mask:null,contours:[],particles:[],
      visible:true,ready:false,mouse:0,mouseAim:0
    };
    if (!m.ctx) return;
    host.addEventListener('pointermove',e=>{
      const b = host.getBoundingClientRect();
      m.mouseAim = clamp(((e.clientX-b.left)/b.width-.5)*2,-1,1);
    },{passive:true});
    host.addEventListener('pointerleave',()=>{m.mouseAim=0},{passive:true});
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {m.visible=entries[0].isIntersecting;},{rootMargin:'160px'}).observe(host);
    }
    modes.push(m);
    size(m);
  }
  function size(m){
    const r=m.host.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height);
    if (w<24||h<24) return;
    if (m.ready&&Math.abs(m.w-w)<2&&Math.abs(m.h-h)<2) return;
    m.w=w;m.h=h;m.dpr=Math.min(window.devicePixelRatio||1,1.65);
    m.canvas.width=Math.round(w*m.dpr);m.canvas.height=Math.round(h*m.dpr);
    m.canvas.style.width=w+'px';m.canvas.style.height=h+'px';
    m.paint=makeCanvas(w,h);m.pctx=m.paint.getContext('2d',{willReadFrequently:true});
    const p=m.pctx;
    p.clearRect(0,0,w,h);
    if (m.mobile) {
      // Original emblem, centered over the restored DNCH Studio wordmark.
      const side=Math.min(w*.94,h*.85);
      p.drawImage(image,(w-side)/2,-side*.065,side,side);
    } else {
      // Exact same crop, size and background-position as the existing desktop artwork.
      const bw=w*1.39024,bh=h*1.64567;
      p.drawImage(image,(w-bw)*.51136,(h-bh)*.49797,bw,bh);
    }
    m.contours=traceContours(m);
    m.particles=Array.from({length:m.mobile?40:62},(_,i)=>{
      const ring=m.contours.filter(c=>c.len>50);
      const edge=ring.length?ring[i%ring.length]:null;
      return {edge,at:Math.random(),speed:rand(.012,.048)*(Math.random()<.5?-1:1),drift:rand(.2,1.3),
        phase:rand(0,PI2),size:rand(.45,1.5),alpha:rand(.35,.95)};
    });
    m.ready=true;
  }
  // Marching-squares: real metallic silhouette contours, not straight fake scan-lines.
  function traceContours(m){
    const w=m.w,h=m.h,scale=Math.max(1,Math.ceil(Math.max(w,h)/205));
    const sw=Math.max(32,Math.round(w/scale)),sh=Math.max(32,Math.round(h/scale));
    const down=makeCanvas(sw,sh),ctx=down.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(m.paint,0,0,sw,sh);
    const pix=ctx.getImageData(0,0,sw,sh).data;
    const a=(x,y)=>pix[(y*sw+x)*4+3]>100?1:0;
    const table=[[],[[3,0]],[[0,1]],[[3,1]],[[1,2]],[[3,0],[1,2]],[[0,2]],[[3,2]],
      [[2,3]],[[0,2]],[[0,1],[2,3]],[[1,2]],[[3,1]],[[0,1]],[[3,0]],[]];
    const nodes=new Map(),segments=[];
    function pt(x,y,e){
      if(e===0)return [x+.5,y];
      if(e===1)return [x+1,y+.5];
      if(e===2)return [x+.5,y+1];
      return [x,y+.5];
    }
    function link(one,two){
      const id1=one[0]*2+','+one[1]*2, id2=two[0]*2+','+two[1]*2;
      const k=segments.length;
      segments.push([id1,id2]);
      for(const id of [id1,id2]){
        if(!nodes.has(id)) nodes.set(id,[]);
        nodes.get(id).push(k);
      }
    }
    for(let y=0;y<sh-1;y++) for(let x=0;x<sw-1;x++){
      const code=a(x,y)|(a(x+1,y)<<1)|(a(x+1,y+1)<<2)|(a(x,y+1)<<3);
      for(const pair of table[code])link(pt(x,y,pair[0]),pt(x,y,pair[1]));
    }
    const visited=new Set(),paths=[];
    for(let s=0;s<segments.length;s++){
      if(visited.has(s))continue;
      let current=s,prev=null,key=segments[s][0],points=[],count=0;
      while(current!==undefined&&!visited.has(current)&&count++<5000){
        visited.add(current);
        let e=segments[current],next=e[0]===key?e[1]:e[0];
        const xy=key.split(',').map(Number);
        points.push({x:xy[0]*w/(2*sw),y:xy[1]*h/(2*sh)});
        prev=current;key=next;
        current=(nodes.get(key)||[]).find(k=>k!==prev&&!visited.has(k));
      }
      if(points.length<20)continue;
      let length=0,dist=[0];
      for(let i=1;i<points.length;i++){
        length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
        dist.push(length);
      }
      length+=Math.hypot(points[0].x-points.at(-1).x,points[0].y-points.at(-1).y);
      if(length>38)paths.push({points,dist,len:length});
    }
    return paths.sort((a,b)=>b.len-a.len).slice(0,17);
  }
  function onContour(c,t){
    const distance=((t%1)+1)%1*c.len;
    const {points,dist}=c;
    let lo=0,hi=dist.length-1;
    while(lo<hi){const mid=(lo+hi+1)>>1;if(dist[mid]<=distance)lo=mid;else hi=mid-1}
    const next=points[(lo+1)%points.length],start=points[lo];
    const endDist=(lo+1<dist.length?dist[lo+1]:c.len),span=Math.max(.01,endDist-dist[lo]);
    const f=(distance-dist[lo])/span;
    return {x:start.x+(next.x-start.x)*f,y:start.y+(next.y-start.y)*f};
  }
  function ring(ctx,x,y,rx,ry,time,i){
    ctx.save();
    ctx.translate(x,y);ctx.rotate(Math.sin(time*.36+i)*.20);
    ctx.scale(1,Math.sin(time*.42+i)*.05+.85);
    ctx.lineWidth=.7;ctx.shadowColor='#00dcff';ctx.shadowBlur=6;
    const start=time*(i?-.34:.25)+i*1.6;
    for(let j=0;j<3;j++){
      ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,start+j*2.1,start+j*2.1+.70);
      ctx.strokeStyle='rgba(30,207,255,'+(.12+j*.055)+')';ctx.stroke();
    }
    ctx.restore();
  }
  function shape(ctx,m,t){
    const w=m.w,h=m.h,mid=w/2,centerY=h*.46;
    const yaw=Math.sin(t*.66)*.38+m.mouse*.17;
    const pitch=Math.sin(t*.48+.65)*.17;
    const roll=Math.sin(t*.45)*.031, lift=Math.sin(t*.86)*h*.023;
    ctx.translate(mid,h/2+lift);
    ctx.rotate(roll);
    ctx.transform(1,pitch*.19,Math.sin(yaw)*.40,1,0,0);
    ctx.scale(1-Math.abs(Math.sin(yaw))*.23,1-Math.abs(pitch)*.12);
    ctx.translate(-mid,-h/2);
  }
  function draw(m,t){
    if(!m.ready||!m.visible)return;
    const ctx=m.ctx,w=m.w,h=m.h;
    ctx.setTransform(m.dpr,0,0,m.dpr,0,0);
    ctx.clearRect(0,0,w,h);
    m.mouse+=(m.mouseAim-m.mouse)*.038;
    const cx=w*.5,cy=h*.46;
    ctx.save();
    // Volumetric reactor aura behind the DS. Unlike the previous stripe it remains alive.
    let glow=ctx.createRadialGradient(cx,cy,4,cx,cy,w*.5);
    glow.addColorStop(0,'rgba(0,230,255,'+(.085+.05*Math.sin(t*2.6))+')');
    glow.addColorStop(.45,'rgba(0,104,255,.065)');
    glow.addColorStop(1,'rgba(0,50,115,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ring(ctx,cx,cy,w*.38,h*.37,t,0);
    ring(ctx,cx,cy,w*.34,h*.39,t,1);
    // Metal has perceived weight: render offset blue extruded shadows then the original surface.
    ctx.save();shape(ctx,m,t);
    const picture=m.paint;
    for(let k=5;k>=1;k--){
      ctx.globalAlpha=.035+k*.012;
      ctx.shadowColor='#00aaff';ctx.shadowBlur=k*1.6;
      ctx.drawImage(picture,k*.68,k*.54);
    }
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.drawImage(picture,0,0);
    // Changing chrome reflections INSIDE exact silhouette, not a sweeping stripe.
    ctx.save();
    ctx.globalCompositeOperation='source-atop';
    const lightX=w*(.15+.7*(.5+.5*Math.sin(t*.67+.2)));
    const silver=ctx.createRadialGradient(lightX,h*.14,0,lightX,h*.38,w*.62);
    silver.addColorStop(0,'rgba(244,255,255,.30)');
    silver.addColorStop(.23,'rgba(53,210,255,.12)');
    silver.addColorStop(.58,'rgba(0,69,150,.07)');
    silver.addColorStop(1,'rgba(0,0,0,.16)');
    ctx.fillStyle=silver;ctx.fillRect(0,0,w,h);
    const underside=ctx.createRadialGradient(w*.65,h*.82,0,w*.65,h*.72,w*.51);
    underside.addColorStop(0,'rgba(0,242,255,'+(.24+.13*Math.sin(t*2.1))+')');
    underside.addColorStop(1,'rgba(0,70,160,0)');
    ctx.fillStyle=underside;ctx.fillRect(0,0,w,h);
    ctx.restore();
    // Energy flows along actual alpha-derived outlines of D AND S.
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<m.contours.length;i++){
      const c=m.contours[i],base=t*(i%2?-0.056:.068)+i*.314;
      // A tiny steady plasma on a subset of physical metal edges
      if(i<8){
        ctx.lineWidth=.65;ctx.strokeStyle='rgba(0,126,255,'+(.14+.08*Math.sin(t*2+i))+')';
        ctx.beginPath();
        for(let k=0;k<=Math.min(140,c.points.length);k+=2){
          const q=c.points[k%c.points.length];
          if(k===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);
        }
        ctx.stroke();
      }
      if(i>11)continue;
      const len=Math.min(.19, Math.max(.055,24/c.len));
      for(let a=0;a<2;a++){
        const phase=base+a*.47;
        const pts=[];
        for(let k=0;k<13;k++)pts.push(onContour(c,phase+k*len/12));
        for(let b=0;b<2;b++){
          ctx.beginPath();
          pts.forEach((p,k)=>{if(k===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)});
          ctx.strokeStyle=b===0?'rgba(0,114,255,.40)':'rgba(94,237,255,'+(.56+.25*Math.sin(t*3+i))+')';
          ctx.lineWidth=b===0?3:1.05;
          ctx.shadowColor=b===0?'#047bff':'#6df7ff';
          ctx.shadowBlur=b===0?12:4;
          ctx.stroke();
        }
        // Electric spark at a traveling leading tip.
        if((i+a)%3===0){
          const head=pts[12];
          const flare=ctx.createRadialGradient(head.x,head.y,0,head.x,head.y,7);
          flare.addColorStop(0,'rgba(224,255,255,.82)');
          flare.addColorStop(.28,'rgba(0,233,255,.36)');
          flare.addColorStop(1,'rgba(0,154,255,0)');
          ctx.fillStyle=flare;ctx.shadowBlur=3;ctx.fillRect(head.x-7,head.y-7,14,14);
        }
      }
    }
    // Fireflies are tethered to the metal contour, not randomly sliding across the screen.
    ctx.shadowBlur=5;ctx.shadowColor='#16dbff';
    for(const p of m.particles){
      if(!p.edge)continue;
      const point=onContour(p.edge,p.at+t*p.speed);
      const x=point.x+Math.sin(t*2.0+p.phase)*p.drift*2.3;
      const y=point.y+Math.cos(t*2.1+p.phase)*p.drift*2.3;
      const twinkle=.35+.65*Math.abs(Math.sin(t*2.7+p.phase));
      ctx.fillStyle='rgba(128,243,255,'+(p.alpha*twinkle)+')';
      ctx.beginPath();ctx.arc(x,y,p.size*twinkle,0,PI2);ctx.fill();
    }
    ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';
    ctx.restore();
    // Ambient motes in front and behind create gentle spatial parallax.
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<20;i++){
      const phase=i*1.67,orb=t*(i%2?.09:-.075)+phase;
      const rad=(.28+i%5*.037)*w;
      const x=cx+Math.cos(orb)*rad, y=cy+Math.sin(orb)*h*.24;
      const alpha=.08+.16*Math.abs(Math.sin(t*.74+phase));
      ctx.fillStyle='rgba(63,197,255,'+alpha+')';
      ctx.beginPath();ctx.arc(x,y,i%7===0?1.4:.65,0,PI2);ctx.fill();
    }
    ctx.restore();
  }
  function tick(now){
    if(document.hidden){requestAnimationFrame(tick);return}
    const t=now/1000;
    for(const m of modes){
      if(Math.abs(m.host.clientWidth-m.w)>2||Math.abs(m.host.clientHeight-m.h)>2)size(m);
      if(m.visible)draw(m,t);
    }
    requestAnimationFrame(tick);
  }
  function start(){
    hosts.forEach(host=>create(host,host.classList.contains('hero-visual')));
    if(!modes.length)return;
    if(reduce.matches){
      modes.forEach(m=>{m.host.classList.add('dnch-motion-reduced');draw(m,0)});
      return;
    }
    requestAnimationFrame(tick);
  }
  image.onload=()=>{start()};
  image.onerror=()=>{console.warn('DNCH animation: original DS asset unavailable; retaining static logo')};
})();
