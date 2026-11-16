// Motion: GSAP + ScrollTrigger. The hero stays put and the second section slides over it like a page;
// everything else rises in as you reach it. Skipped entirely for people who ask for reduced motion.
(() => {
  if (!window.gsap || !window.ScrollTrigger || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('gsap');
  gsap.registerPlugin(ScrollTrigger);
  const $$ = s => [...document.querySelectorAll(s)];
  const ease = 'power3.out';

  // ---------- page over: the hero recedes while #videos slides up over it ----------
  const over = { trigger: '#videos', start: 'top bottom', end: 'top top', scrub: true };
  gsap.fromTo('.hero-c', { yPercent: 0, scale: 1, opacity: 1 }, { scrollTrigger: over, yPercent: -18, scale: 0.9, opacity: 0, ease: 'none', immediateRender: false });
  gsap.fromTo('.hero-tt', { y: 0, opacity: 1 }, { scrollTrigger: over, y: -80, opacity: 0, ease: 'none', immediateRender: false });
  gsap.fromTo('.hero-bg', { scale: 1, filter: 'brightness(1)', borderRadius: 0 }, { scrollTrigger: over, scale: 0.92, filter: 'brightness(0.35)', borderRadius: 28, ease: 'none', immediateRender: false });
  gsap.fromTo('#videos', { '--lift': 0 }, { scrollTrigger: over, '--lift': 1, ease: 'none' });

  // ---------- headings: words rise out of a mask ----------
  $$('.sec .big, .about .bio').forEach(el => {
    if (el.classList.contains('bio')) return; // the bio already writes itself in on scroll
    el.innerHTML = el.innerHTML.split(/(<br\s*\/?>)/).map(part => /^<br/.test(part) ? part :
      part.split(/(\s+)/).map(w => /^\s*$/.test(w) ? w : `<span class="wm"><span class="wi">${w}</span></span>`).join('')).join('');
    gsap.from(el.querySelectorAll('.wi'), { yPercent: 110, rotate: 4, duration: 1.1, ease, stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  $$('.sec .eyebrow, .sec .sub, .hint, .tabs, .row-h > .sub, .signup, .social').forEach(el =>
    gsap.from(el, { y: 24, opacity: 0, duration: 0.9, ease, scrollTrigger: { trigger: el, start: 'top 92%' } }));

  // ---------- groups stagger in ----------
  const batch = (sel, from) => ScrollTrigger.batch(sel, { start: 'top 90%', once: true,
    onEnter: els => gsap.fromTo(els, from, { y: 0, x: 0, opacity: 1, scale: 1, rotate: 0, duration: 1, ease, stagger: 0.09, overwrite: true }) });
  batch('.alb', { y: 70, opacity: 0, rotate: -3 });
  batch('.vids-more .vid', { y: 60, opacity: 0, scale: 0.96 });
  // product cards are built after the store loads; animate the first set once they exist
  const cards = setInterval(() => { if (document.querySelector('#rail .pc')) { clearInterval(cards); batch('#rail .pc', { y: 80, opacity: 0 }); ScrollTrigger.refresh(); } }, 120);

  // ---------- set pieces ----------
  gsap.fromTo('.stadium svg', { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.stadium', start: 'top bottom', end: 'bottom 40%', scrub: true } });
  gsap.from('.ticket', { x: 160, y: 40, rotate: 14, opacity: 0, duration: 1.3, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.ticket', start: 'top 85%' } });
  gsap.fromTo('.portrait', { y: 80 }, { y: -60, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.tracks', { y: 30, opacity: 0, duration: 1, ease, scrollTrigger: { trigger: '.tracks', start: 'top 92%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
