/* Autoplay/loop only for actual DNCH Studio MP4 logo elements. */
(() => {
  const videos=Array.from(document.querySelectorAll('.dnch-logo-video'));
  if(!videos.length)return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const showFallback=(video)=>video.closest('.dnch-logo-video-host')?.classList.add('dnch-video-fallback');
  const tryPlay=(video)=>{
    if(reduce.matches){video.pause();return}
    video.muted=true;
    video.defaultMuted=true;
    video.loop=true;
    video.playsInline=true;
    const task=video.play();
    if(task&&typeof task.catch==='function')task.catch(()=>showFallback(video));
  };
  videos.forEach(video=>{
    video.addEventListener('error',()=>showFallback(video));
    video.addEventListener('canplay',()=>{
      video.closest('.dnch-logo-video-host')?.classList.remove('dnch-video-fallback');
      tryPlay(video);
    });
    if(video.readyState>=2)tryPlay(video);
  });
  // Pause non-visible videos to avoid two decoders and unnecessary mobile battery drain.
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        const video=entry.target;
        if(entry.isIntersecting && !document.hidden)tryPlay(video);
        else video.pause();
      }
    },{threshold:.01,rootMargin:'60px'});
    videos.forEach(video=>observer.observe(video));
  }
  document.addEventListener('visibilitychange',()=>{
    videos.forEach(video=>{
      if(document.hidden) video.pause();
      else if(video.getBoundingClientRect().bottom>0)tryPlay(video);
    });
  });
})();