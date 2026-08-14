/*
  script.js
  - Rich animated interactions: advanced fireworks, mouse trail,
    preloader, split-title animation, parallax, countdown and final celebration.
  - No external libraries; respects prefers-reduced-motion.
*/

/* Helpers */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from((el||document).querySelectorAll(s));
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- PRELOADER & PAGE TRANSITION ---------- */
const preloader = $('#preloader');
function hidePreloader(){
  if(!preloader) return;
  preloader.style.opacity = '0';
  setTimeout(()=> preloader.remove(), 700);
}

window.addEventListener('load', () => {
  setTimeout(()=> {
    hidePreloader();
    document.documentElement.classList.add('loaded');
  }, 700);
});

/* ---------- NAV, HAMBURGER, PROGRESS ---------- */
const navMenu = $('#nav-menu');
const hamburger = $('#hamburger');
if(hamburger){
  hamburger.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
    playSfx('sfx-click');
  });
}
$$('.nav-menu a').forEach(a => a.addEventListener('click', () => { navMenu.classList.remove('open'); hamburger?.setAttribute('aria-expanded','false'); }));

const progress = $('#progress');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
  progress.style.width = `${Math.min(100, Math.max(0, pct*100))}%`;
});

/* ---------- CUSTOM CURSOR & TRAIL ---------- */
if(!prefersReduced){
  const cursor = $('#cursor'), glow = $('#cursor-glow');
  let trailCanvas, trailCtx, trailParticles = [];
  function fitTrail(){
    if(!trailCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    trailCanvas.width = window.innerWidth * dpr;
    trailCanvas.height = window.innerHeight * dpr;
    trailCtx.setTransform(dpr,0,0,dpr,0,0);
    trailCtx.clearRect(0,0,trailCanvas.width,trailCanvas.height);
  }
  trailCanvas = document.createElement('canvas');
  trailCanvas.id = 'trail-canvas'; trailCanvas.className = 'absolute-canvas';
  document.body.appendChild(trailCanvas);
  trailCtx = trailCanvas.getContext('2d');
  fitTrail(); window.addEventListener('resize', fitTrail);

  window.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    trailParticles.push({
      x: e.clientX + (Math.random()-0.5)*8,
      y: e.clientY + (Math.random()-0.5)*8,
      vx: (Math.random()-0.5)*1.2,
      vy: (Math.random()-0.5)*1.2,
      r: 6 + Math.random()*8,
      life: 28 + Math.random()*18,
      op: 0.9
    });
  });

  function stepTrail(){
    if(!trailCtx) return;
    trailCtx.clearRect(0,0,trailCanvas.width,trailCanvas.height);
    for(let i=trailParticles.length-1;i>=0;i--){
      const p = trailParticles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      trailCtx.beginPath();
      trailCtx.fillStyle = `rgba(15,181,127,${Math.max(0, p.life/40)*0.7})`;
      trailCtx.arc(p.x, p.y, Math.max(0.2,p.r*(p.life/60)), 0, Math.PI*2);
      trailCtx.fill();
      if(p.life <= 0) trailParticles.splice(i,1);
    }
    requestAnimationFrame(stepTrail);
  }
  stepTrail();

  document.addEventListener('click', (e) => {
    spawnPointerBurst(e.clientX, e.clientY);
    playSfx('sfx-click');
  });
}

/* ---------- SFX & MUSIC ---------- */
const bgAudio = $('#bg-audio');
const audioToggle = $('#audio-toggle');
function playSfx(id){
  const audio = document.getElementById(id);
  if(!audio) return;
  audio.currentTime = 0;
  audio.play().catch(()=>{/* fail silently if blocked */});
}
if(audioToggle && bgAudio){
  audioToggle.addEventListener('click', async () => {
    try{
      if(bgAudio.paused){ await bgAudio.play(); audioToggle.setAttribute('aria-pressed','true'); }
      else { bgAudio.pause(); audioToggle.setAttribute('aria-pressed','false'); }
    }catch(e){}
    playSfx('sfx-click');
  });
}

/* ---------- SPLIT TITLE ANIMATION ---------- */
function splitTitle(selector){
  const el = $(selector);
  if(!el) return;
  const txt = el.textContent.trim();
  el.innerHTML = '';
  txt.split('').forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    span.style.transition = `transform .75s var(--ease) ${i*0.03}s, opacity .75s var(--ease) ${i*0.03}s`;
    el.appendChild(span);
  });
  setTimeout(()=> {
    $$('.char', el).forEach(c => { c.style.opacity = '1'; c.style.transform = 'translateY(0) rotateX(0deg)'; });
  }, 420);
}
window.addEventListener('load', ()=> splitTitle('#hero-title'));

/* ---------- REVEALS ---------- */
const reveals = $$('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {threshold: 0.12});
reveals.forEach(r => revealObserver.observe(r));

/* ---------- createAndFitCanvas ---------- */
function createAndFitCanvas(id){
  const c = document.getElementById(id);
  if(!c) return null;
  const ctx = c.getContext('2d');
  function fit(){
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth * dpr;
    c.height = c.clientHeight * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fit();
  window.addEventListener('resize', fit);
  return {canvas: c, ctx};
}

/* ---------- FOG & PARTICLES ---------- */
(function initFog(){
  if(prefersReduced) return;
  const o = createAndFitCanvas('bg-fog');
  if(!o) return;
  const {canvas, ctx} = o;
  let t = 0;
  function draw(){
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    for(let i=0;i<4;i++){
      const y = (Math.sin((t*0.0008)+(i*1.2)) + 1) / 2 * canvas.clientHeight;
      const grad = ctx.createLinearGradient(0, y-180, 0, y+180);
      grad.addColorStop(0, `rgba(11,107,63,${0.012 + i*0.006})`);
      grad.addColorStop(1, `rgba(15,181,127,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(canvas.clientWidth*0.5, y, canvas.clientWidth*1.2, 220, 0, 0, Math.PI*2);
      ctx.fill();
    }
    t += 16;
    requestAnimationFrame(draw);
  }
  draw();
})();

(function initParticles(){
  if(prefersReduced) return;
  const o = createAndFitCanvas('particles-canvas');
  if(!o) return;
  const {canvas, ctx} = o;
  const particles = [];
  const count = Math.max(40, Math.round(canvas.clientWidth*canvas.clientHeight/90000));
  for(let i=0;i<count;i++){
    particles.push({
      x: Math.random()*canvas.clientWidth,
      y: Math.random()*canvas.clientHeight,
      r: Math.random()*1.8+0.2,
      vx: (Math.random()-0.5)*0.12,
      vy: -Math.random()*0.18,
      a: Math.random()*0.9+0.1,
      phase: Math.random()*Math.PI*2
    });
  }
  function step(){
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.phase += 0.015;
      if(p.y < -10) { p.y = canvas.clientHeight + 10; p.x = Math.random()*canvas.clientWidth; }
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(p.phase)*0.3})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    requestAnimationFrame(step);
  }
  step();
})();

/* ---------- FIREWORKS ENGINE ---------- */
const Fireworks = (function(){
  if(prefersReduced) return null;
  const o = createAndFitCanvas('cele-canvas') || createAndFitCanvas('final-canvas');
  if(!o) return null;
  const {canvas, ctx} = o;
  canvas.style.background = 'transparent';
  let items = [];

  class Spark {
    constructor(x,y, vx, vy, col, life, size){
      this.x=x; this.y=y; this.vx=vx; this.vy=vy; this.col=col; this.life=life; this.size=size; this.decay = 0.96 + Math.random()*0.02;
    }
    step(){
      this.x += this.vx; this.y += this.vy; this.vy += 0.03;
      this.vx *= 0.998; this.vy *= 0.998; this.life--;
      ctx.beginPath();
      ctx.fillStyle = this.col;
      ctx.globalAlpha = Math.max(0, this.life/70);
      ctx.shadowBlur = 12; ctx.shadowColor = this.col;
      ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
  }

  function launch(x, y, palette){
    const rise = {x: x, y: canvas.clientHeight + 10, vx: (x-canvas.clientWidth/2)/80 + (Math.random()-0.5)*2, vy: - (canvas.clientHeight - y)/35 - (Math.random()*2), life: null, color: '#fff', type: 'rise'};
    items.push(rise);
  }

  function explode(x,y,palette){
    const num = 40 + Math.round(Math.random()*36);
    for(let i=0;i<num;i++){
      const a = Math.random()*Math.PI*2;
      const speed = (Math.random()*4+1) * (0.7 + Math.random()*0.8);
      const col = palette[Math.floor(Math.random()*palette.length)];
      items.push(new Spark(x,y, Math.cos(a)*speed, Math.sin(a)*speed, col, 50 + Math.random()*40, 2 + Math.random()*2));
    }
    for(let i=0;i<10;i++){
      const a = Math.random()*Math.PI*2;
      const speed = Math.random()*2+0.6;
      items.push(new Spark(x,y, Math.cos(a)*speed, Math.sin(a)*speed, '#fff', 24 + Math.random()*16, 1+Math.random()*1.8));
    }
  }

  (function loop(){
    if(!ctx) return;
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    if(Math.random() < 0.02){
      const x = Math.random()*(canvas.clientWidth*0.8) + canvas.clientWidth*0.1;
      const y = Math.random()*(canvas.clientHeight*0.6) + 30;
      launch(x,y, ['#0b6b3f','#14a450','#bfeadf','#ffffff']);
    }
    for(let i=items.length-1;i>=0;i--){
      const it = items[i];
      if(it.type === 'rise'){
        it.x += it.vx; it.y += it.vy; it.vy += 0.22;
        ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.85; ctx.arc(it.x, it.y, 2.4, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
        if(it.vy > 0){ explode(it.x, it.y, ['#0b6b3f','#14a450','#bfeadf','#ffffff']); items.splice(i,1); }
      } else if(it instanceof Spark){
        it.step();
        if(it.life <= 0) items.splice(i,1);
      } else { items.splice(i,1); }
    }
    requestAnimationFrame(loop);
  })();

  return {
    burstAt(x,y,palette=['#0b6b3f','#14a450','#fff']){ launch(x,y,palette); },
    burstSequence(count=6){
      for(let i=0;i<count;i++){
        setTimeout(()=> {
          const x = (i+1)/(count+1) * canvas.clientWidth;
          const y = Math.random()*(canvas.clientHeight*0.55) + 40;
          launch(x,y, ['#0b6b3f','#14a450','#fff']);
          playSfx('sfx-burst');
        }, i*350);
      }
    }
  };
})();

/* fireworks controls */
$('#burst-fireworks')?.addEventListener('click', ()=> { if(Fireworks) Fireworks.burstSequence(6); playSfx('sfx-burst'); });
$('#burst-sequence')?.addEventListener('click', ()=> { if(Fireworks) Fireworks.burstSequence(12); playSfx('sfx-burst'); });

/* pointer burst */
function spawnPointerBurst(x,y){
  if(prefersReduced) return;
  const trailCanvas = document.getElementById('trail-canvas');
  if(!trailCanvas) return;
  const ctx = trailCanvas.getContext('2d');
  let parts = [];
  for(let i=0;i<18;i++){
    parts.push({
      x, y,
      vx: (Math.random()-0.5)*7,
      vy: (Math.random()-0.9)*7,
      life: 28+Math.random()*18,
      col: ['#0b6b3f','#14a450','#fff'][Math.floor(Math.random()*3)],
      size: 2+Math.random()*3
    });
  }
  const t0 = performance.now();
  (function animate(){
    ctx.clearRect(0,0,trailCanvas.width,trailCanvas.height);
    for(let i=parts.length-1;i>=0;i--){
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life--;
      ctx.beginPath(); ctx.fillStyle = p.col; ctx.globalAlpha = Math.max(0, p.life/40); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
      if(p.life <= 0) parts.splice(i,1);
    }
    if(parts.length) requestAnimationFrame(animate);
    else ctx.clearRect(0,0,trailCanvas.width,trailCanvas.height);
  })();
}

/* ---------- SCENE: Parallax sky ---------- */
(function initScene(){
  if(prefersReduced) return;
  const o = createAndFitCanvas('scene-canvas');
  if(!o) return;
  const {canvas, ctx} = o;
  const stars = [];
  for(let i=0;i<120;i++){
    stars.push({x: Math.random()*canvas.clientWidth, y: Math.random()*canvas.clientHeight, r: Math.random()*1.6+0.2, tw: Math.random()*Math.PI*2});
  }
  let mx = 0.5, my = 0.5;
  window.addEventListener('mousemove', (e) => { mx = e.clientX / window.innerWidth; my = e.clientY / window.innerHeight; });
  function draw(){
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    const g = ctx.createLinearGradient(0,0,0,canvas.clientHeight);
    g.addColorStop(0, '#06140b'); g.addColorStop(1, '#00100a');
    ctx.fillStyle = g; ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);
    stars.forEach((s, i) => {
      s.tw += 0.012;
      const ox = (mx-0.5)*30*(i%3+1)/3;
      const oy = (my-0.5)*18*(i%3+1)/3;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.6 + Math.sin(s.tw)*0.3})`;
      ctx.arc(s.x+ox, s.y+oy, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- COUNTDOWN ---------- */
const daysEl = $('#days'), hoursEl = $('#hours'), minsEl = $('#mins'), secsEl = $('#secs'), countMsg = $('#count-msg');
function getNext14Aug(){
  const now = new Date();
  const year = (now.getMonth() > 7 || (now.getMonth() === 7 && now.getDate() > 14)) ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(`${year}-08-14T00:00:00`);
}
let target = getNext14Aug();
function tickCountdown(){
  const now = new Date(); let diff = target - now;
  if(diff <= 0){
    daysEl.textContent = '28,855💚'; hoursEl.textContent = '692,520🎉'; minsEl.textContent = '41,551,200✨'; secsEl.textContent = '2,493,072,000⏱️';
    countMsg.textContent = "Pakistan Independence Day 🇵🇰 — Let's Celebrate!";
    if(Fireworks) Fireworks.burstSequence(14);
    playSfx('sfx-burst');
    return;
  }
  const d = Math.floor(diff / (1000*60*60*24)); diff -= d*(1000*60*60*24);
  const h = Math.floor(diff / (1000*60*60)); diff -= h*(1000*60*60);
  const m = Math.floor(diff / (1000*60)); diff -= m*(1000*60);
  const s = Math.floor(diff / 1000);
  daysEl.textContent = String(d).padStart(2,'0');
  hoursEl.textContent = String(h).padStart(2,'0');
  minsEl.textContent = String(m).padStart(2,'0');
  secsEl.textContent = String(s).padStart(2,'0');
  countMsg.textContent = `Counting down to 14th August — ${target.getFullYear()}`;
}
if(!prefersReduced){
  tickCountdown(); setInterval(tickCountdown, 1000);
} else {
  countMsg.textContent = `Counting down to 14th August — ${target.getFullYear()}`;
}

/* ---------- PAUSE ON HIDDEN ---------- */
document.addEventListener('visibilitychange', () => {
  if(document.hidden){ try{ bgAudio?.play(); }catch(e){} }
});

/* FINAL CELEBRATION BUTTON */
$('#final-btn')?.addEventListener('click', () => {
  if(Fireworks) Fireworks.burstSequence(18);
  playSfx('sfx-burst');
  window.scrollTo({top:0, behavior:'smooth'});
});

/* RESPECT REDUCED MOTION */
if(prefersReduced){
  document.documentElement.classList.add('reduced');
  try{ bgAudio?.play(); }catch(e){}
}
