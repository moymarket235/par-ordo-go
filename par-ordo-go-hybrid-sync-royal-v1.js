/* PAR ORDO GO — HYBRID SYNC ROYAL BACKDROP V1
   Wraps the existing #deck + #pager without changing their cards or handlers. */
(function(){
  'use strict';
  const deck=document.getElementById('deck');
  const pager=document.getElementById('pager');
  if(!deck||!pager)return;

  let stage=document.getElementById('deckStage');
  let backdrop=document.getElementById('deckBackdrop');
  if(!stage){
    stage=document.createElement('div');
    stage.id='deckStage';
    stage.className='deck-stage';
    stage.dataset.activeSlide='0';
    backdrop=document.createElement('div');
    backdrop.id='deckBackdrop';
    backdrop.className='deck-backdrop';
    backdrop.setAttribute('aria-hidden','true');
    for(let i=0;i<3;i++){
      const panel=document.createElement('span');
      panel.className='deck-backdrop-panel';
      backdrop.appendChild(panel);
    }
    const parent=deck.parentNode;
    parent.insertBefore(stage,deck);
    stage.appendChild(backdrop);
    stage.appendChild(deck);
    stage.appendChild(pager);
  }
  if(!backdrop)return;

  const slides=Array.from(deck.children);
  if(!slides.length)return;
  let raf=0,lastActive=-1;
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

  function paint(){
    raf=0;
    const maxScroll=Math.max(1,deck.scrollWidth-deck.clientWidth);
    const progress=clamp(deck.scrollLeft/maxScroll,0,1);
    const travel=Math.max(0,backdrop.offsetWidth-stage.clientWidth);
    // Background follows the swipe at 88% speed for a gentle cinematic depth.
    const shift=-travel*progress*.88;
    const y=-Math.sin(progress*Math.PI)*5;
    backdrop.style.transform='translate3d('+shift.toFixed(2)+'px,'+y.toFixed(2)+'px,0) scale(1.045)';

    const center=deck.scrollLeft+deck.clientWidth/2;
    let active=0,nearest=Infinity;
    slides.forEach((slide,index)=>{
      const slideCenter=slide.offsetLeft+slide.offsetWidth/2;
      const distance=Math.abs(slideCenter-center);
      if(distance<nearest){nearest=distance;active=index}
    });
    if(active!==lastActive){
      lastActive=active;
      stage.dataset.activeSlide=String(active);
      stage.style.setProperty('--deck-active-slide',String(active));
    }
    stage.style.setProperty('--deck-progress',progress.toFixed(4));
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(paint)}
  deck.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(raf){cancelAnimationFrame(raf);raf=0}}
    else schedule();
  });
  if('ResizeObserver' in window){
    const ro=new ResizeObserver(schedule);
    ro.observe(deck);ro.observe(stage);
  }
  paint();
})();
