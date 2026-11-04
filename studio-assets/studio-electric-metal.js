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
    // A completely independent, oversized atmosphere stage sits behind the metal.
    const volumeCanvas = document.createElement('canvas');
    volumeCanvas.className = 'dnch-volume-stage';
    volumeCanvas.setAttribute('aria-hidden','true');
    host.appendChild(volumeCanvas);
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.className = 'dnch-smoke-stage';
    smokeCanvas.setAttribute('aria-hidden','true');
    host.appendChild(smokeCanvas);
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
      smokeCanvas,smokeStageCtx:smokeCanvas.getContext('2d',{alpha:true}),
      volumeCanvas,volume:null,volumeLast:-1,
      smokeW:0,smokeH:0,smokeScale:1,smokeOffsetX:0,smokeOffsetY:0,
      w:0,h:0,dpr:1,paint:null,pctx:null,mask:null,contours:[],particles:[],
      visible:true,ready:false,mouse:0,mouseAim:0,smoke:null,smokeCtx:null,smokeLights:[],smokePuffs:[]
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
    // Smoke extends well beyond the DS silhouette in every direction.
    m.smokeW=Math.round(w*(m.mobile?1.68:2.18));
    m.smokeH=Math.round(h*(m.mobile?1.62:2.0));
    m.smokeOffsetX=(m.smokeW-w)*.5;
    m.smokeOffsetY=(m.smokeH-h)*.5;
    m.smokeScale=Math.min(window.devicePixelRatio||1,1.08);
    m.smokeCanvas.width=Math.round(m.smokeW*m.smokeScale);
    m.smokeCanvas.height=Math.round(m.smokeH*m.smokeScale);
    m.smokeCanvas.style.width=m.smokeW+'px';
    m.smokeCanvas.style.height=m.smokeH+'px';
    const volScale=Math.min(1,540/m.smokeW,390/m.smokeH);
    m.volumeCanvas.width=Math.max(2,Math.round(m.smokeW*volScale));
    m.volumeCanvas.height=Math.max(2,Math.round(m.smokeH*volScale));
    m.volumeCanvas.style.width=m.smokeW+'px';
    m.volumeCanvas.style.height=m.smokeH+'px';
    m.paint=makeCanvas(w,h);m.pctx=m.paint.getContext('2d',{willReadFrequently:true});
    const p=m.pctx;
    p.clearRect(0,0,w,h);
    if (m.mobile) {
      // Original emblem, centered over the restored DNCH Studio wordmark.
      const side=Math.min(w*1.13,h*1.04);
      p.drawImage(image,(w-side)/2,-side*.052,side,side);
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
    setupSmoke(m);
    if(!m.volume) m.volume=initVolume(m.volumeCanvas);
    if(m.volume) m.smokeCanvas.style.display='none';
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
    // A physical metal object should feel heavy, not rubbery or wobbly.
    const yaw=Math.sin(t*.36)*.105+m.mouse*.09;
    const pitch=Math.sin(t*.29+.65)*.07;
    const roll=Math.sin(t*.25)*.009, lift=Math.sin(t*.42)*h*.008;
    ctx.translate(mid,h/2+lift);
    ctx.rotate(roll);
    ctx.transform(1,pitch*.12,Math.sin(yaw)*.11,1,0,0);
    ctx.scale(1-Math.abs(Math.sin(yaw))*.08,1-Math.abs(pitch)*.04);
    ctx.translate(-mid,-h/2);
  }

  // Three volumes of slow, pearly smoke, rendered from procedural cloud textures.
  // The illumination is composited INTO the smoke alpha, not pasted over the logo.
  const smokeSprites=[];
  function fract(x){return x-Math.floor(x)}
  function hash2(x,y,seed){
    return fract(Math.sin(x*127.1+y*311.7+seed*71.9)*43758.5453);
  }
  function noise2(x,y,seed){
    const ix=Math.floor(x),iy=Math.floor(y);
    const fx=x-ix,fy=y-iy;
    const ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
    const a=hash2(ix,iy,seed),b=hash2(ix+1,iy,seed);
    const c=hash2(ix,iy+1,seed),d=hash2(ix+1,iy+1,seed);
    return (a+(b-a)*ux)*(1-uy)+(c+(d-c)*ux)*uy;
  }
  function fbm(x,y,seed){
    return noise2(x,y,seed)*.56
      +noise2(x*2.14,y*2.14,seed+13)*.27
      +noise2(x*4.29,y*4.29,seed+31)*.12
      +noise2(x*8.48,y*8.48,seed+43)*.05;
  }
  function prepareSmokeTextures(){
    if(smokeSprites.length)return;
    const n=158;
    for(let k=0;k<5;k++){
      const sprite=makeCanvas(n,n),ctx=sprite.getContext('2d');
      const data=ctx.createImageData(n,n);
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const u=x/(n-1),v=y/(n-1);
        const warp=fbm(u*3.7,v*3.5,k+71)-.5;
        const wave=fbm(u*2.7+warp*.6,v*4.0,k+19);
        const nx=(u-.5)*1.85+Math.sin(v*8+k)*.09+warp*.29;
        const ny=(v-.5)*1.82;
        const envelope=Math.max(0,1-(nx*nx+ny*ny));
        const wisp=fbm(u*6.1+warp*.9,v*6.0-wave*.35,k+5);
        const folds=Math.max(0,Math.min(1,(wisp*.82+wave*.44-.36)*2.5));
        const density=Math.pow(envelope,1.15)*folds;
        const i=(y*n+x)*4;
        data.data[i]=218+Math.round(31*wave);
        data.data[i+1]=225+Math.round(24*wave);
        data.data[i+2]=233+Math.round(20*wave);
        data.data[i+3]=Math.round(203*density);
      }
      ctx.putImageData(data,0,0);
      smokeSprites.push(sprite);
    }
  }
  function setupSmoke(m){
    prepareSmokeTextures();
    m.smoke=makeCanvas(m.smokeW,m.smokeH);
    m.smokeCtx=m.smoke.getContext('2d',{alpha:true});
    const count=m.mobile?50:68;
    m.smokePuffs=Array.from({length:count},(_,i)=>{
      const layer=i%3;
      return {
        layer,
        seed:i*1.671+rand(0,4),phase:Math.random(),
        x:rand(.16,.84),y:rand(.45,.93),
        speed:rand(.0035,.0085)*(layer===0?1.0:1.5),
        drift:rand(.024,.087),w:rand(.20,.41)*(layer===0?1.30:1),
        height:rand(.62,1.08),alpha:rand(.45,.78),
        sprite:smokeSprites[i%smokeSprites.length]
      };
    });
    const targets=[[.19,.40],[.31,.27],[.27,.70],[.44,.78],
                   [.55,.37],[.71,.32],[.78,.54],[.64,.72]];
    const edges=m.contours.filter(c=>c.len>55).slice(0,9);
    m.smokeLights=targets.map((p,i)=>{
      let closest={x:p[0]*m.w,y:p[1]*m.h},best=Infinity;
      for(const edge of edges)for(let k=0;k<edge.points.length;k+=Math.max(1,Math.floor(edge.points.length/110))){
        const v=edge.points[k];
        const ds=(v.x-p[0]*m.w)**2+(v.y-p[1]*m.h)**2;
        if(ds<best){best=ds;closest=v}
      }
      return {
        x:closest.x+m.smokeOffsetX,y:closest.y+m.smokeOffsetY,
        next:performance.now()/1000+rand(.1,5.7)+i*.11,
        start:-100,duration:2,strength:rand(.45,1.0),
        radius:rand(.20,.34)*m.smokeW,
        drift:rand(0,PI2),
        hue:i%3
      };
    });
  }
  function drawSmoke(m,t){
    if(!m.smokeCtx)return;
    const out=m.smokeCtx,w=m.smokeW,h=m.smokeH;
    out.setTransform(1,0,0,1,0,0);
    out.globalAlpha=1;out.globalCompositeOperation='source-over';
    out.clearRect(0,0,w,h);
    // Independent wisps drift mostly upward; offset layers create parallax.
    for(const p of m.smokePuffs){
      const life=(p.phase+t*p.speed)%1;
      const fade=Math.pow(Math.sin(Math.PI*life),.58);
      const direction=(p.layer===2?-1:1);
      const x=w*(p.x+direction*(life-.5)*p.drift*.88
        +Math.sin(t*.13+p.seed)*p.drift*.35);
      const y=h*(p.y-life*.30+Math.sin(t*.15+p.seed)*.018);
      const span=w*p.w*(1+life*.62);
      out.globalAlpha=p.alpha*fade;
      out.save();
      out.translate(x,y);
      out.rotate(Math.sin(t*.09+p.seed)*.12);
      out.scale(1+p.layer*.095,p.height);
      out.drawImage(p.sprite,-span/2,-span/2,span,span);
      out.restore();
    }
    out.globalAlpha=1;
    // Independent, non-synchronized electrical sources attached to the DS edges.
    // Light is visible ONLY where real smoke opacity already exists.
    out.globalCompositeOperation='source-atop';
    for(const light of m.smokeLights){
      if(t>=light.next){
        light.start=t;
        light.duration=rand(1.2,3.4);
        light.strength=rand(.46,1.0);
        light.next=t+light.duration+rand(1.2,7.2);
        light.radius=rand(.18,.30)*w;
      }
      const v=(t-light.start)/light.duration;
      if(v<0||v>1)continue;
      const pulse=Math.pow(Math.sin(Math.PI*v),1.7)*light.strength;
      if(pulse<.012)continue;
      light.power=pulse;
      const x=light.x+Math.sin(t*.63+light.drift)*w*.017;
      const y=light.y+Math.cos(t*.51+light.drift)*h*.012;
      const r=light.radius;
      const g=out.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,'rgba(207,250,255,'+Math.min(.99,pulse*1.12)+')');
      g.addColorStop(.28,'rgba(91,214,255,'+Math.min(.95,pulse*.82)+')');
      g.addColorStop(.63,'rgba(2,96,219,'+(pulse*.36)+')');
      g.addColorStop(1,'rgba(0,80,180,0)');
      out.fillStyle=g;out.fillRect(x-r,y-r,r*2,r*2);
    }
    out.globalCompositeOperation='source-over';
    // Separate canvas: smoke can float outside the logo's former square.
    const stage=m.smokeStageCtx;
    stage.setTransform(m.smokeScale,0,0,m.smokeScale,0,0);
    stage.clearRect(0,0,w,h);
    stage.drawImage(m.smoke,0,0);
    // Tiny scattered blue halos connect the active letter edge to illuminated mist.
    const ctx=stage;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(const light of m.smokeLights){
      const age=(t-light.start)/light.duration;
      if(age<0||age>1)continue;
      const pulse=Math.pow(Math.sin(Math.PI*age),1.7)*light.strength;
      if(pulse<.04)continue;
      const x=light.x,y=light.y,r=light.radius*.7;
      const halo=ctx.createRadialGradient(x,y,0,x,y,r);
      halo.addColorStop(0,'rgba(83,220,255,'+(.19*pulse)+')');
      halo.addColorStop(.28,'rgba(0,130,245,'+(.095*pulse)+')');
      halo.addColorStop(1,'rgba(0,75,195,0)');
      ctx.fillStyle=halo;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
    ctx.restore();
  }


  // Cinematic atmosphere. Smooth domain-warped cloud density flows through multiple
  // depth planes, with irregular light sources attached to the DS letter contours.
  // Shader is physically suggestive, not a pre-rendered texture or cycling sprites.
  const VOLUME_VERTEX=String.raw`
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main(){
      v_uv=a_position*.5+.5;
      gl_Position=vec4(a_position,0.,1.);
    }
  `;
  const VOLUME_FRAGMENT=String.raw`
    precision mediump float;
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_size;
    uniform vec3 u_light[8];

    float hash(vec2 p){
      return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);
    }
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);
      vec2 u=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
                 mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
    }
    float fbm(vec2 p){
      float v=0.,amp=.52;
      for(int i=0;i<4;i++){
        v+=amp*noise(p);
        p=mat2(1.58,-1.17,1.17,1.58)*p+vec2(11.23,4.31);
        amp*=.5;
      }
      return v;
    }
    void main(){
      vec2 uv=v_uv;
      float t=u_time*.020;
      float aspect=u_size.x/max(1.,u_size.y);
      vec2 pos=vec2((uv.x-.5)*aspect*2.2,(uv.y-.5)*2.05);

      // Domain warping yields large coherent curls; offset planes avoid looping wisps.
      float drift=sin(t*.6+pos.y*.55)*.16+sin(t*.29)*.08;
      vec2 p=pos+vec2(drift,-t*.24);
      float curlA=fbm(p*.91+vec2(1.4,t*.19));
      float curlB=fbm(p*.88+vec2(7.3,-t*.12));
      vec2 warp=vec2(curlA-.5,curlB-.5)*.87;

      float density=0.;
      vec3 shade=vec3(0.);
      float transmittance=1.;

      for(int layer=0;layer<3;layer++){
        float z=float(layer);
        vec2 sp=(p+warp*(.7+z*.22))*vec2(1.45,1.25)
          +vec2(z*2.71,-z*.88-t*(.35+z*.16));
        float body=fbm(sp);
        float filaments=fbm(sp*2.38+vec2(z*3.14,t*.23));
        float billow=smoothstep(.33,.68,body+.11*(filaments-.5));
        float curl=smoothstep(.32,.72,filaments);
        float plume=smoothstep(.03,.48,uv.y)*(.98-.23*uv.y);
        float layerDensity=(billow*(.60+.40*curl))*.34*plume;
        layerDensity*=1.+.1*sin(z*3.2+t*.15);
        layerDensity=clamp(layerDensity,0.,.42);
        float absorb=layerDensity*transmittance;
        // Slightly different scattering per layer gives depth, not cartoon smoke.
        float cool=.93+.04*z;
        shade+=vec3(.81*cool,.84*cool,.88*cool)*absorb;
        density+=absorb;
        transmittance*=1.-layerDensity;
      }

      float lighting=0.;
      float core=0.;
      for(int i=0;i<8;i++){
        vec3 l=u_light[i];
        vec2 d=(uv-l.xy)*vec2(aspect,1.);
        float dist2=dot(d,d);
        float local=exp(-dist2*12.5)*l.z;
        lighting=1.-(1.-lighting)*(1.-clamp(local,0.,.95));
        core+=exp(-dist2*46.)*l.z;
      }
      // Illumination is multiplied by available smoke volume, so dark gaps remain dark.
      vec3 base=shade/max(density,.0001);
      vec3 lit=mix(base,vec3(.53,.85,1.),clamp(lighting*.86,0.,.9));
      lit+=vec3(.07,.26,.37)*clamp(core*.20,0.,.5);
      // Fade extremely softly into the site — no square or elliptical hard boundary.
      vec2 edge=(uv-.5)*vec2(1.34,1.43);
      float feather=1.-smoothstep(.43,.74,length(edge));
      float alpha=clamp(density*(1.19+lighting*.29),0.,.74)*feather;
      // Vary opacity with coherent rolls, not synchronized flashing.
      gl_FragColor=vec4(lit,alpha);
    }
  `;

  function initVolume(canvas){
    const gl=canvas.getContext('webgl',{
      alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:false,
      powerPreference:'low-power',preserveDrawingBuffer:false
    });
    if(!gl)return null;
    try{
      function shader(type,source){
        const sh=gl.createShader(type);
        gl.shaderSource(sh,source);gl.compileShader(sh);
        if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))
          throw Error(gl.getShaderInfoLog(sh));
        return sh;
      }
      const program=gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,VOLUME_VERTEX));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,VOLUME_FRAGMENT));
      gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))
        throw Error(gl.getProgramInfoLog(program));
      const buffer=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      gl.useProgram(program);
      const position=gl.getAttribLocation(program,'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
      gl.clearColor(0,0,0,0);
      return {
        gl,program,
        time:gl.getUniformLocation(program,'u_time'),
        size:gl.getUniformLocation(program,'u_size'),
        lights:gl.getUniformLocation(program,'u_light[0]')
      };
    }catch(e){
      console.warn('DNCH volumetric smoke: fallback to layered mist',e);
      return null;
    }
  }
  function drawVolume(m,t){
    if(t-m.volumeLast<1/26)return;
    m.volumeLast=t;
    const v=m.volume,gl=v.gl;
    if(!gl||gl.isContextLost())return;
    const values=new Float32Array(24);
    for(let i=0;i<m.smokeLights.length&&i<8;i++){
      const l=m.smokeLights[i];
      if(t>=l.next){
        l.start=t;
        l.duration=rand(1.8,4.6);
        l.strength=rand(.53,1);
        l.next=t+l.duration+rand(1.9,9.3);
      }
      const age=(t-l.start)/l.duration;
      const fade=age>=0&&age<=1
        ?Math.pow(Math.sin(Math.PI*age),1.45)*l.strength:0;
      values[i*3]=l.x/m.smokeW;
      // WebGL y axis is bottom-up; original silhouette coordinates are top-down.
      values[i*3+1]=1-l.y/m.smokeH;
      values[i*3+2]=fade;
    }
    gl.viewport(0,0,m.volumeCanvas.width,m.volumeCanvas.height);
    gl.useProgram(v.program);
    gl.uniform1f(v.time,t);
    gl.uniform2f(v.size,m.smokeW,m.smokeH);
    gl.uniform3fv(v.lights,values);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }

  function draw(m,t){
    if(!m.ready||!m.visible)return;
    const ctx=m.ctx,w=m.w,h=m.h;
    ctx.setTransform(m.dpr,0,0,m.dpr,0,0);
    ctx.clearRect(0,0,w,h);
    m.mouse+=(m.mouseAim-m.mouse)*.038;
    const cx=w*.5,cy=h*.46;
    ctx.save();
    if(m.volume){ drawVolume(m,t); } else { drawSmoke(m,t); }
    // Volumetric reactor aura behind the DS. Unlike the previous stripe it remains alive.
    let glow=ctx.createRadialGradient(cx,cy,4,cx,cy,w*.5);
    glow.addColorStop(0,'rgba(0,230,255,'+(.038+.03*Math.sin(t*2.6))+')');
    glow.addColorStop(.45,'rgba(0,104,255,.065)');
    glow.addColorStop(1,'rgba(0,50,115,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    // Removed holographic rings: they made the hero look like a game HUD.
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
      if(i<4){
        ctx.lineWidth=.55;ctx.strokeStyle='rgba(0,126,255,'+(.09+.045*Math.sin(t*.7+i))+')';
        ctx.beginPath();
        for(let k=0;k<=Math.min(140,c.points.length);k+=2){
          const q=c.points[k%c.points.length];
          if(k===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);
        }
        ctx.stroke();
      }
      if(i>5)continue;
      const len=Math.min(.19, Math.max(.055,24/c.len));
      for(let a=0;a<1;a++){
        const phase=base+a*.47;
        const pts=[];
        for(let k=0;k<13;k++)pts.push(onContour(c,phase+k*len/12));
        for(let b=0;b<2;b++){
          ctx.beginPath();
          pts.forEach((p,k)=>{if(k===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)});
          ctx.strokeStyle=b===0?'rgba(0,114,255,.16)':'rgba(94,237,255,'+(.20+.14*Math.sin(t*.7+i))+')';
          ctx.lineWidth=b===0?2.3:.7;
          ctx.shadowColor=b===0?'#047bff':'#6df7ff';
          ctx.shadowBlur=b===0?6:2;
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
    for(const p of m.particles.slice(0,m.mobile?7:10)){
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
    for(let i=0;i<6;i++){
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
