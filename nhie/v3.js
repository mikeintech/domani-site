// Domani v3: a scrolling site with one player for the whole visit.
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const money = c => '$' + (c / 100).toFixed(2).replace(/\.00$/, '');
  const root = document.documentElement.style;

  // ---------- albums + one shared player ----------
  const ALBUMS = {
    'nhie': { t: 'Never Have I Ever', k: 'Single', art: 'img/nhie-cover.jpg', c: '#d39a83', d: '#3a1d15' },
    'hot-seat': { t: 'Hot Seat', k: 'Album', art: 'img/sleeve-hot-seat.jpg', c: '#a8604c', d: '#3a1d15' },
    'forever-lasting': { t: 'Forever Lasting', k: 'Album', art: 'img/sleeve-forever-lasting.jpg', c: '#c08a3a', d: '#4a2e0c' },
    'time-will-tell': { t: 'Time Will Tell', k: 'Album', art: 'img/sleeve-time-will-tell.jpg', c: '#3f7a3a', d: '#14290f' },
    'deep-cut': { t: 'Last Letter', k: 'EP', art: 'img/f-ink.jpg', c: '#8a6a9a', d: '#2a1a33' },
  };
  let SONGS = {}; const songsReady = fetch('songs.json?v=3').then(r => r.json()).then(j => (SONGS = j));
  const au = new Audio(); au.preload = 'auto';
  let cur = { key: 'nhie', i: 0 }; // the new single is what plays first
  const mood = key => { const a = ALBUMS[key]; root.setProperty('--acc', a.c); root.setProperty('--accd', a.d); };
  async function play(key, i = 0) {
    await songsReady; const list = SONGS[key]; if (!list) return;
    cur = { key, i: (i + list.length) % list.length }; const s = list[cur.i];
    au.src = s.u; au.play().catch(() => {});
    $('#pT').textContent = s.t; $('#pA').textContent = 'Domani · ' + ALBUMS[key].t; $('#pArt').src = ALBUMS[key].art;
    mood(key); paintTracks();
  }
  const toggle = () => (au.paused ? (au.src ? au.play() : play(cur.key, cur.i)) : au.pause());
  au.onplay = () => { document.body.classList.add('playing'); $('#pPlay').textContent = '❚❚'; };
  au.onpause = () => { document.body.classList.remove('playing'); $('#pPlay').textContent = '▶'; };
  au.onended = () => play(cur.key, cur.i + 1);
  const t = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  au.ontimeupdate = () => { const d = au.duration || 30; $('#pFill').style.width = (au.currentTime / d) * 100 + '%'; $('#pTime').textContent = t(au.currentTime) + ' / ' + t(d); };
  $('#pPlay').onclick = toggle; $('#pDisc').onclick = toggle; // the spinning record is a play/pause button too $('#pNext').onclick = () => play(cur.key, cur.i + 1); $('#pPrev').onclick = () => play(cur.key, cur.i - 1);
  $('.p-bar').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); if (au.duration) au.currentTime = ((e.clientX - r.left) / r.width) * au.duration; };
  $$('[data-play]').forEach(b => (b.onclick = () => play(b.dataset.play, 0)));

  // ---------- dark / light ----------
  const tb = $('#themeBtn'), setTheme = th => { document.documentElement.dataset.theme = th; tb.setAttribute('aria-label', th === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); try { sessionStorage.setItem('nhie-theme', th); } catch (e) {} };
  setTheme(document.documentElement.dataset.theme || 'dark');
  tb.onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

  // ---------- gate: the needle drops, the room ignites ----------
  // tap lights the candle (no music until someone presses play), then join or walk in
  const enterSite = () => { try { localStorage.setItem('domani-entered', '1'); } catch (e) {} setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 350);
    $('#gate').classList.add('gone'); document.body.classList.remove('locked');
    setTimeout(() => document.body.classList.add('lit'), 250);
    // neon flicker by hand: animating opacity on the glowing logo paints a box in Chrome
    const n = $('.neon'), seq = (steps, at = 0) => steps.forEach(([ms, o]) => setTimeout(() => (n.style.opacity = o), at + ms));
    seq([[0, 0], [700, 1], [800, .2], [900, 1], [1050, .4], [1200, '']]);
    setTimeout(() => { n.style.animation = 'none'; n.style.clipPath = 'none'; }, 1800);
    setInterval(() => Math.random() < .5 && seq([[0, .35], [70, 1], [160, .6], [230, '']]), 4000);
  };
  window.__enterSite = enterSite;
  $('#enter').onclick = () => { const g = $('#gate'); if (g.classList.contains('lit')) return; g.classList.add('lit'); setTimeout(enterSite, 1500); };
  // been here before: skip the gate. Already on the list: never ask again
  try { if (localStorage.getItem('domani-joined')) window.__joined = true; if (localStorage.getItem('domani-entered')) enterSite(); } catch (e) {}

  // ---------- hero record: play / pause ----------
  $('#heroPlay').onclick = e => { e.stopPropagation(); toggle(); };
  au.addEventListener('play', () => $('#heroPlay').setAttribute('aria-label', 'Pause'));
  au.addEventListener('pause', () => $('#heroPlay').setAttribute('aria-label', 'Play'));

  // ---------- burger menu ----------
  const menu = $('#menu'), bg = $('#burger'), menuSet = on => { document.body.classList.toggle('menu-open', on); bg.setAttribute('aria-expanded', on); bg.setAttribute('aria-label', on ? 'Close menu' : 'Open menu'); menu.setAttribute('aria-hidden', !on); };
  bg.onclick = () => menuSet(!document.body.classList.contains('menu-open'));
  $$('#menu a').forEach(a => a.addEventListener('click', () => menuSet(false)));
  addEventListener('keydown', e => e.key === 'Escape' && menuSet(false));

  // ---------- email + SMS capture (stored locally until it's wired to the list) ----------
  $$('form.cap').forEach(f => f.onsubmit = e => {
    e.preventDefault();
    const nm = f.fname.value.trim(), em = f.email.value.trim(), ph = f.phone.value.replace(/[^\d+]/g, ''), err = f.querySelector('.cap-e');
    const okE = !em || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em), okP = !ph || ph.replace(/\D/g, '').length >= 10;
    err.textContent = !nm ? 'Add your first name.' : !em && !ph ? 'Add an email or a mobile number.' : !okE ? 'That email doesn\u2019t look right.' : !okP ? 'That number looks short.' : ph && !f.sms.checked ? 'Tick the box so we can text you.' : '';
    if (err.textContent) return;
    try { const L = JSON.parse(localStorage.getItem('domani-list') || '[]'); L.push({ name: nm, email: em, phone: ph, sms: !!ph, from: f.dataset.src, at: Date.now() }); localStorage.setItem('domani-list', JSON.stringify(L)); } catch (x) {}
    window.__joined = true; try { localStorage.setItem('domani-joined', '1'); } catch (x) {} document.documentElement.classList.add('joined');
    $$('form.cap').forEach(x => { x.classList.add('done'); x.querySelector('.cap-t').textContent = 'You’re at the table, ' + nm + '.'; });
    if (f.dataset.src === 'gate') setTimeout(enterSite, 1400);
    if (f.dataset.src === 'game') setTimeout(() => window.__dropCap && window.__dropCap(), 1800);
  });

  // ---------- fire: the photo's own flames move, embers come off the real fire ----------
  const cv = $('#embers'), cx = cv.getContext('2d'); let P = [], SRC = [];
  const size = () => { cv.width = cv.offsetWidth * devicePixelRatio; cv.height = cv.offsetHeight * devicePixelRatio; };
  size(); addEventListener('resize', size);
  // sample the photo: every bright fire pixel (per the mask) is a place an ember can leave from, in its own colour
  Promise.all(['img/projection-hotseat.jpg', 'img/firemask.png?v=2'].map(s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; }))).then(([ph, mk]) => {
    const W = 240, H = 135, o = document.createElement('canvas'); o.width = W; o.height = H; const g = o.getContext('2d', { willReadFrequently: true });
    g.drawImage(ph, 0, 0, W, H); const c = g.getImageData(0, 0, W, H).data; g.clearRect(0, 0, W, H); g.drawImage(mk, 0, 0, W, H); const m = g.getImageData(0, 0, W, H).data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 4; if (m[k] > 150 && c[k] > 170) SRC.push([x / W, y / H, c[k], c[k + 1], c[k + 2]]); }
  });
  const cover = () => { // where the photo's (u,v) lands on screen, matching object-fit:cover + object-position
    const W = cv.width, H = cv.height, s = Math.max(W / 1200, H / 675), dw = 1200 * s, dh = 675 * s, px = innerWidth <= 820 ? 0.24 : 0.3;
    return [s, (W - dw) * px, (H - dh) * 0.5, dw, dh];
  };
  const spawn = () => {
    const [, ox, oy, dw, dh] = cover(), q = SRC[Math.random() * SRC.length | 0];
    return { x: ox + q[0] * dw, y: oy + q[1] * dh, c: [q[2], q[3], q[4]], vx: (Math.random() - 0.35) * 0.5, vy: -(0.5 + Math.random() * 1.6), r: (0.4 + Math.random() ** 2 * 2.4) * devicePixelRatio, l: 1, f: 0.004 + Math.random() * 0.008, w: Math.random() * 6, hz: 0.04 + Math.random() * 0.08 };
  };
  const heat = $('#heatT'), dmap = $('#heatD'), live = $('.hero-bg img.live'); let t0 = 0;
  (function tick(ts) {
    if (document.body.classList.contains('lit') && scrollY < innerHeight * 1.2) {
      // heat shimmer: drift the noise so the real flames lick upward, a little harder on the beat of play
      t0 += au.paused ? 1 : 1.6;
      heat.setAttribute('baseFrequency', `${0.009 + Math.sin(t0 / 90) * 0.0015} ${0.032 + Math.sin(t0 / 37) * 0.006}`);
      if (t0 % 6 < 1) heat.setAttribute('seed', (t0 / 6 | 0) % 40);
      live.style.setProperty('--fl', (Math.min(1, t0 / 150) * ((innerWidth < 820 ? 0.22 : 0.32) + Math.random() * 0.12)).toFixed(2)); // ramps in, then flickers
      dmap.setAttribute('scale', ((innerWidth < 820 ? 7 : 11) + Math.sin(t0 / 23) * 3 + Math.sin(t0 / 7) * 1.5).toFixed(1));
      if (SRC.length) for (let k = 0; k < 1; k++) if (P.length < (innerWidth < 820 ? 40 : 70)) P.push(spawn());
      cx.clearRect(0, 0, cv.width, cv.height); cx.globalCompositeOperation = 'lighter';
      P = P.filter(p => p.l > 0 && p.y > -20);
      for (const p of P) {
        p.w += p.hz; p.x += p.vx + Math.sin(p.w) * 0.7; p.y += p.vy * devicePixelRatio; p.vy *= 0.997; p.l -= p.f;
        const [r, g, b] = p.c, a = p.l * (0.6 + Math.random() * 0.4), rr = p.r * (1 + (1 - p.l));
        const gr = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr * 3);
        gr.addColorStop(0, `rgba(255,${Math.min(255, g + 60)},${Math.min(255, b + 40)},${a})`); gr.addColorStop(0.35, `rgba(${r},${g},${b},${a * 0.6})`); gr.addColorStop(1, `rgba(${r},${g * 0.5 | 0},0,0)`);
        cx.fillStyle = gr; cx.beginPath(); cx.arc(p.x, p.y, rr * 3, 0, 7); cx.fill();
      }
    }
    requestAnimationFrame(tick);
  })();

  // ---------- nav: solid on scroll, active section ----------
  addEventListener('scroll', () => $('#nav').classList.toggle('solid', scrollY > 60), { passive: true });
  const navIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && $$('#nav nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id))), { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach(s => navIO.observe(s));
  const rvIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('in'), rvIO.unobserve(e.target))), { threshold: 0.15 });
  const reveal = els => { if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) return; els.forEach(e => { e.classList.add('rv'); rvIO.observe(e); }); }; // GSAP takes over when it's loaded
  reveal($$('.sec .eyebrow, .sec .big, .sec .sub, .tabs, .ticket, .tour-l, .portrait, .about-c, .signup, .social'));

  // ---------- shop ----------
  const SHOP = [
    ['mayumi-candle-never-have-i-ever', 'nhie'], ['mayumi-candle-forever-lasting', 'nhie'],
    ['forever-lasting-tour-hoodie', 'forever-lasting'], ['hot-seat-vinyl-copy', 'hot-seat', '#a8604c'], ['the-king-s-succession-tour-t-shirt', 'hot-seat'],
    ['forever-lasting-tee-red', 'forever-lasting'], ['good-girl-tank', 'hot-seat'], ['forever-lasting-tape', 'forever-lasting', '#ddd6c8'],
    ['domani-limited-tee', 'hot-seat'], ['forever-lasting-hoodie', 'forever-lasting'], ['time-will-tell-vinyls', 'time-will-tell', '#a3171c'],
    ['domani-woven-blanket', 'forever-lasting'], ['dear-jane-before-the-ink-dry-two-albums-one-vinyl-pre-order', 'time-will-tell', '#d8c9a8'],
  ];
  const VIEWS = { // single front / back shots, already cut out
    'forever-lasting-hoodie': [2, 3], 'forever-lasting-tee-red': [2, 3], 'forever-lasting-tour-hoodie': [2, 3], 'the-king-s-succession-tour-t-shirt': [1, 2] };
  const SLEEVE = { 'hot-seat-vinyl-copy': 'img/sleeve-hot-seat.jpg', 'forever-lasting-tape': 'img/sleeve-forever-lasting.jpg', 'time-will-tell-vinyls': 'img/sleeve-time-will-tell.jpg' };
  const FULL = { 'domani-woven-blanket': 1, 'dear-jane-before-the-ink-dry-two-albums-one-vinyl-pre-order': 1 }; // keep the photo's own background
  const cat = h => /candle/.test(h) ? 'candles' : /ticket/.test(h) ? 'tickets' : /vinyl|tape/.test(h) ? 'vinyls' : 'apparel';
  const rail = $('#rail');
  function bagBump() { const b = $('.bagbtn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  function flyToBag(img) {
    const r = img.getBoundingClientRect(), to = $('.bagbtn').getBoundingClientRect(), f = img.cloneNode();
    f.className = 'fly'; Object.assign(f.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    document.body.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(f.style, { left: to.left + 6 + 'px', top: to.top + 6 + 'px', width: '30px', height: '30px', opacity: '.2', transform: 'rotate(25deg)' })));
    setTimeout(() => { f.remove(); bagBump(); }, 880);
  }
  const ALBUM_OF = Object.fromEntries(SHOP.map(([h, a]) => [h, a])), VC = Object.fromEntries(SHOP.map(([h, , c]) => [h, c]));
  const short = s => ({ Small: 'S', Medium: 'M', Large: 'L', 'X-Large': 'XL', 'XX-Large': 'XXL' }[s] || s);
  // Mayumi candles aren't sold in this store: they always show as available and link to the candle page
  const MAYUMI = 'https://mikeintech.github.io/mayumi-candles/';
  const CANDLE = { 'mayumi-candle-never-have-i-ever': ['Mayumi Candle · Never Have I Ever', 4500, 'nhie'], 'mayumi-candle-forever-lasting': ['Mayumi Candle · Forever Lasting', 4500, 'forever-lasting'] };
  window.__mayumi = h => MAYUMI + '#' + (CANDLE[h] ? CANDLE[h][2] : '');
  const candleCard = (h, n) => { const [t, pr, id] = CANDLE[h], u = MAYUMI + '#' + id;
    return `<article class="pc candle-link" style="animation-delay:${n * 60}ms" data-h="${h}">
      <a class="im" href="${u}" target="_blank" rel="noopener" aria-label="${t}"><div class="flip"><img class="f" src="img/shop2/${h}-1.webp" alt="${t}" loading="lazy"></div></a>
      <h3><a href="${u}" target="_blank" rel="noopener">${t}</a></h3><div class="pr">${money(pr)}</div><div class="sz"></div>
      <a class="add2" href="${u}" target="_blank" rel="noopener">Shop the candle ↗</a></article>`; };
  const card = (P, [h, a, vc], n) => {
    if (CANDLE[h]) return candleCard(h, n);
    const p = P[h]; if (!p) return '';
    const single = p.variants.length === 1 && p.variants[0].title === 'Default Title';
    const first = p.variants.find(v => v.available) || p.variants[0];
    const vw = VIEWS[h], back = !!vw, sl = SLEEVE[h]; vc = sl ? vc : null;
    return `<article class="pc ${back ? 'has-b' : ''} ${vc ? 'vinyl' : ''}" style="animation-delay:${n * 60}ms;${vc ? '--vc:' + vc : ''}" data-h="${h}">
      <a class="im" href="#/products/${h}" aria-label="${p.title}">${vc ? (h === 'time-will-tell-vinyls' ? '<i class="disc d2"></i>' : '') + '<i class="disc"></i>' : ''}<div class="flip">${sl ? `<img class="f sleeve" src="${sl}" alt="${p.title}" loading="lazy">` : `<img class="f" src="${FULL[h] ? `img/shop2/${h}-cut.webp?v=2` : `img/shop2/${h}-${vw ? vw[0] : 1}.webp`}" alt="${p.title}" loading="lazy">`}${back ? `<img class="b" src="img/shop2/${h}-${vw[1]}.webp" alt="" loading="lazy">` : ''}</div>${back ? '<span class="tag">Back</span>' : ''}</a>
      <h3><a href="#/products/${h}">${p.title}</a></h3><div class="pr">${money(first.price)}</div>
      <div class="sz">${single ? '' : p.variants.map(v => `<button data-v="${v.id}" ${v.available ? '' : 'disabled'} class="${v === first ? 'on' : ''}">${short(v.title)}</button>`).join('')}</div>
      <button class="add2" data-add="${first.id}" ${first.available ? '' : 'disabled'}>Add to bag</button></article>`;
  };
  async function buildShop(filter = 'all') {
    const P = await STORE.ready;
    rail.innerHTML = SHOP.filter(([h]) => filter === 'all' || cat(h) === filter).map((s, n) => card(P, s, n)).join('');
    rail.scrollLeft = 0;
  }
  async function railClick(e) {
    const c = e.target.closest('.pc'); if (!c) return;
    const sb = e.target.closest('.sz button');
    if (sb) { c.querySelectorAll('.sz button').forEach(x => x.classList.toggle('on', x === sb)); c.querySelector('.add2').dataset.add = sb.dataset.v; return; }
    const add = e.target.closest('.add2'); if (!add) return;
    flyToBag(c.querySelector('.flip img')); add.textContent = 'Added ✓'; add.classList.add('ok');
    try { await STORE.addQuiet(+add.dataset.add); } catch (err) { add.textContent = err.message; }
    setTimeout(() => { add.textContent = 'Add to bag'; add.classList.remove('ok'); }, 1600);
  }
  rail.addEventListener('click', railClick);

  // ---------- product pages: #/products/<handle>, a full page over the site so the music keeps going ----------
  const DESC = {
    'mayumi-candle-never-have-i-ever': 'Mayumi scented candle for the single. Coconut soy, 16oz, amber glass, in the brown Never Have I Ever box. Light it before the first card.',
    'mayumi-candle-forever-lasting': 'Mayumi scented candle. Coconut soy, 16oz, amber glass, in the sand Forever Lasting box.',
    'forever-lasting-tour-hoodie': 'Heavyweight black hoodie from the Forever Lasting Tour. Every stop printed down the back.',
    'forever-lasting-hoodie': 'Heavyweight black hoodie with the Forever Lasting script across the back in red.',
    'forever-lasting-tee-red': 'Black cotton tee, Forever Lasting script in red on the back, small mark on the chest.',
    'the-king-s-succession-tour-t-shirt': 'Three generations on one tour: Domani, T.I. and King. Dates on the back.',
    'good-girl-tank': 'Fitted red rib tank with GOOD GIRL across the front.',
    'domani-limited-tee': 'Charcoal tee with the Domani portrait print. Limited run.',
    'domani-woven-blanket': 'Woven throw of the signed Forever Lasting portrait.',
    'hot-seat-vinyl-copy': 'Hot Seat on vinyl, in the fire sleeve.',
    'forever-lasting-tape': 'Forever Lasting on vinyl, with the signed red cover.',
    'time-will-tell-vinyls': 'Time Will Tell on vinyl.',
    'dear-jane-before-the-ink-dry-two-albums-one-vinyl-pre-order': 'Two projects, one record: Dear Jane and Before The Ink Dry. Pre-order.',
  };
  let GAL = {}; const galReady = fetch('gallery.json').then(r => r.json()).then(j => (GAL = j)).catch(() => {});
  const pdp = document.createElement('section'); pdp.id = 'pdp'; pdp.setAttribute('aria-label', 'Product'); document.body.appendChild(pdp);
  async function openProduct(h) {
    if (CANDLE[h]) { history.replaceState('', '', location.pathname); window.open(MAYUMI + '#' + CANDLE[h][2], '_blank', 'noopener'); return; }
    const P = await STORE.ready; await galReady; const p = P[h]; if (!p) return closeProduct();
    const al = ALBUM_OF[h], A = ALBUMS[al], sl = h === 'time-will-tell-vinyls' ? null : SLEEVE[h], vc = sl && VC[h];
    if (A) mood(al);
    let imgs = sl ? [sl] : (GAL[h] || [p.featured_image]).slice();
    if (FULL[h]) imgs = [`img/shop2/${h}-cut.webp?v=2`];
    if (h === 'time-will-tell-vinyls') imgs = ['img/shop2/time-will-tell-vinyls-1.webp']; // the real red + black pressing
    if (VIEWS[h]) { const f = `-${VIEWS[h][0]}.webp`; imgs.sort((x, y) => y.endsWith(f) - x.endsWith(f)); }
    const single = p.variants.length === 1 && p.variants[0].title === 'Default Title';
    let pick = p.variants.find(v => v.available) || p.variants[0], qty = 1;
    const isTix = /ticket/.test(h);
    pdp.innerHTML = `<div class="pdp-w">
      <a class="crumb" href="#shop">← Back to shop</a>
      <div class="pdp-g">
        <div class="stage"><div class="stage-main ${vc ? 'vinyl' : ''}" style="${vc ? '--vc:' + vc : ''}">${vc ? '<i class="disc"></i>' : ''}<img id="pdImg" src="${imgs[0]}" alt="${p.title}"></div>
          ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((s, i) => `<button data-i="${i}" class="${i ? '' : 'on'}" aria-label="View ${i + 1}"><img src="${s}" alt=""></button>`).join('')}</div>` : ''}</div>
        <div class="pdp-i">
          <p class="eyebrow">${A ? A.t : 'Domani'} collection</p>
          <h1>${p.title}</h1>
          <div class="pdp-pr" id="pdPr">${money(pick.price)}</div>
          <p class="pdp-d">${(window.SHOPIFY_DESC && window.SHOPIFY_DESC[h]) || DESC[h] || ''}</p>
          ${single ? '' : `<p class="pdp-l"><span>${isTix ? 'City' : 'Size'}</span><span id="pdPick">${pick.title}</span></p>
          <div class="pdp-v ${isTix ? 'col' : ''}">${p.variants.map(v => `<button data-v="${v.id}" ${v.available ? '' : 'disabled'} class="${v === pick ? 'on' : ''}">${isTix ? v.title : short(v.title)}</button>`).join('')}</div>`}
          <div class="pdp-buy"><div class="qty2"><button data-q="-1" aria-label="One less">−</button><em id="pdQ">1</em><button data-q="1" aria-label="One more">+</button></div>
            <button class="add2" id="pdAdd" ${pick.available ? '' : 'disabled'}>${pick.available ? 'Add to bag' : 'Sold out'}</button></div>
          <ul class="perks"><li><b>Ships</b> in 3–5 business days</li><li><b>Checkout</b> secure through Shopify</li><li><b>Questions</b> reply to your order email any time</li></ul>
        </div>
      </div>
      <div class="more"><h2>More from the drop</h2><div class="rail" id="moreRail"></div></div></div>`;
    const more = pdp.querySelector('#moreRail');
    more.innerHTML = SHOP.filter(s => s[0] !== h).sort((x, y) => (y[1] === al) - (x[1] === al)).slice(0, 6).map((s, n) => card(P, s, n)).join('');
    more.addEventListener('click', railClick);
    const img = pdp.querySelector('#pdImg');
    pdp.querySelectorAll('.thumbs button').forEach(b => (b.onclick = () => {
      pdp.querySelectorAll('.thumbs button').forEach(x => x.classList.toggle('on', x === b));
      img.classList.add('swap'); setTimeout(() => { img.src = imgs[b.dataset.i]; img.classList.remove('swap'); }, 300);
    }));
    pdp.querySelectorAll('.pdp-v button').forEach(b => (b.onclick = () => {
      pick = p.variants.find(v => v.id == b.dataset.v); pdp.querySelectorAll('.pdp-v button').forEach(x => x.classList.toggle('on', x === b));
      pdp.querySelector('#pdPr').textContent = money(pick.price); pdp.querySelector('#pdPick').textContent = pick.title;
    }));
    pdp.querySelectorAll('.qty2 button').forEach(b => (b.onclick = () => { qty = Math.max(1, Math.min(10, qty + +b.dataset.q)); pdp.querySelector('#pdQ').textContent = qty; }));
    const add = pdp.querySelector('#pdAdd');
    add.onclick = async () => {
      flyToBag(img); add.textContent = 'Added ✓'; add.classList.add('ok');
      try { for (let i = 0; i < qty; i++) await STORE.addQuiet(pick.id); } catch (err) { add.textContent = err.message; }
      setTimeout(() => { add.textContent = 'Add to bag'; add.classList.remove('ok'); STORE.openCart(); }, 900);
    };
    $('#gate').classList.add('gone'); document.body.classList.remove('locked'); document.body.classList.add('lit');
    pdp.scrollTop = 0; pdp.classList.add('on'); document.body.classList.add('pdp-open');
    document.title = p.title + ' · Domani';
  }
  function closeProduct() { pdp.classList.remove('on'); document.body.classList.remove('pdp-open'); document.title = 'Domani · Hot Seat'; }
  const route = () => { const m = location.hash.match(/^#\/products\/([\w-]+)/); m ? openProduct(m[1]) : closeProduct(); };
  addEventListener('hashchange', route);
  if (/^#\/products\//.test(location.hash)) { // deep link straight to a product: skip the gate
    $('#gate').classList.add('gone'); document.body.classList.remove('locked'); document.body.classList.add('lit'); route();
  }
  const leave = target => { history.pushState('', '', location.pathname + (target || '')); closeProduct(); };
  pdp.addEventListener('click', e => { if (e.target.closest('.crumb')) { e.preventDefault(); leave('#shop'); $('#shop').scrollIntoView(); } });
  $$('#nav a').forEach(a => a.addEventListener('click', () => pdp.classList.contains('on') && leave()));
  $$('.tabs button').forEach(b => (b.onclick = () => {
    $$('.tabs button').forEach(x => x.classList.toggle('on', x === b)); buildShop(b.dataset.f);
    if (ALBUMS[b.dataset.f]) mood(b.dataset.f);
  }));
  $('.arr.l').onclick = () => rail.scrollBy({ left: -rail.clientWidth * 0.8, behavior: 'smooth' });
  $('.arr.r').onclick = () => rail.scrollBy({ left: rail.clientWidth * 0.8, behavior: 'smooth' });
  buildShop();
  // the subtitle is the filter; Tickets jumps to the tour dates
  $$('.shopf button').forEach(b => b.onclick = () => {
    $$('.shopf button').forEach(x => x.classList.toggle('on', x === b));
    const t = $(`#shop .tabs button[data-f="${b.dataset.f}"]`); t && t.click();
  });

  // ---------- tour ticket ----------
  STORE.ready.then(P => {
    const p = P['the-forever-lasting-tour-tickets']; if (!p) return;
    let pick = p.variants.find(v => v.available);
    $('#dates').innerHTML = p.variants.map(v => { const [c, d] = v.title.split(' · '); return `<li data-v="${v.id}" class="${v.available ? '' : 'so'} ${v === pick ? 'on' : ''}"><span>${d || ''}</span><span>${c}</span><i>→</i></li>`; }).join('');
    $('#tixPrice').textContent = money(pick.price);
    $('#dates').onclick = e => { const li = e.target.closest('li:not(.so)'); if (!li) return; pick = p.variants.find(v => v.id == li.dataset.v); $$('#dates li').forEach(x => x.classList.toggle('on', x === li)); $('#tixPrice').textContent = money(pick.price); };
    $('#tixBuy').onclick = async () => {
      const tk = $('#ticket'); tk.classList.remove('back'); tk.classList.add('torn');
      await STORE.addQuiet(pick.id); bagBump();
      setTimeout(() => { tk.classList.remove('torn'); tk.classList.add('back'); STORE.openCart(); }, 1100);
    };
  });

  // ---------- music crate ----------
  const ALINK = k => (SONGS[k] && SONGS[k][0] ? SONGS[k][0].link.split('?')[0] : 'https://music.apple.com/us/artist/domani/');
  songsReady.then(() => $$('.alb-l').forEach(l => (l.querySelector('.ap').href = ALINK(l.dataset.k))));
  $('#crate').innerHTML = Object.entries(ALBUMS).filter(([k]) => k !== 'nhie').map(([k, a]) => `<div class="alb-w"><button class="alb" data-alb="${k}" style="--vc:${a.c};--lbl:url(${a.art})">
    <div class="art"><i class="disc"></i><img src="${a.art}" alt="${a.t} cover"></div>
    <div class="meta"><div><h3>${a.t}</h3><small>${a.k} · Domani</small></div><span class="pb">▶</span></div></button>
    <div class="alb-l" data-k="${k}"><a class="sp" href="https://open.spotify.com/search/${encodeURIComponent('Domani ' + a.t)}" target="_blank" rel="noopener" aria-label="${a.t} on Spotify"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.6 14.4a.6.6 0 0 1-.9.2c-2.4-1.5-5.4-1.8-9-1a.6.6 0 1 1-.3-1.2c3.9-.9 7.2-.5 9.9 1.1.3.2.4.6.3.9zm1.2-2.7a.8.8 0 0 1-1 .3c-2.7-1.7-6.9-2.2-10.1-1.2a.8.8 0 1 1-.5-1.5c3.7-1.1 8.3-.6 11.4 1.4.4.2.5.7.2 1zm.1-2.8C14.7 9 9.4 8.8 6.3 9.7a.9.9 0 1 1-.5-1.8c3.5-1.1 9.4-.9 13.1 1.3a.9.9 0 0 1-1 1.7z"/></svg><span>Spotify</span></a><a class="ap" href="https://music.apple.com/us/artist/domani/" target="_blank" rel="noopener" aria-label="${a.t} on Apple Music"><svg viewBox="0 0 24 24"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-4zM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z"/></svg><span>Apple Music</span></a></div></div>`).join('');
  reveal($$('.alb'));
  $('#crate').onclick = e => { const b = e.target.closest('.alb'); if (b) { if (cur.key === b.dataset.alb && !au.paused) toggle(); else play(b.dataset.alb, 0); } };
  function paintTracks() {
    $$('.alb').forEach(b => { const on = b.dataset.alb === cur.key; b.classList.toggle('on', on && !au.paused); b.querySelector('.pb').textContent = on && !au.paused ? '❚❚' : '▶'; });
    const list = SONGS[cur.key] || [];
    $('#tracks').innerHTML = `<ol>${list.map((s, i) => `<li data-i="${i}" class="${i === cur.i ? 'on' : ''}"><b>${i + 1}</b><span>${s.t}</span><span class="lnk"><a href="https://open.spotify.com/search/${encodeURIComponent('Domani ' + s.t)}" target="_blank" rel="noopener" aria-label="Play ${s.t} on Spotify" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.6 14.4a.6.6 0 0 1-.9.2c-2.4-1.5-5.4-1.8-9-1a.6.6 0 1 1-.3-1.2c3.9-.9 7.2-.5 9.9 1.1.3.2.4.6.3.9zm1.2-2.7a.8.8 0 0 1-1 .3c-2.7-1.7-6.9-2.2-10.1-1.2a.8.8 0 1 1-.5-1.5c3.7-1.1 8.3-.6 11.4 1.4.4.2.5.7.2 1zm.1-2.8C14.7 9 9.4 8.8 6.3 9.7a.9.9 0 1 1-.5-1.8c3.5-1.1 9.4-.9 13.1 1.3a.9.9 0 0 1-1 1.7z"/></svg></a><a href="${s.link}" target="_blank" rel="noopener" aria-label="Play ${s.t} on Apple Music" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-4zM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z"/></svg></a></span></li>`).join('')}</ol>`;
    $('#tracks').classList.add('on');
  }
  au.addEventListener('play', paintTracks); au.addEventListener('pause', paintTracks);
  $('#tracks').onclick = e => { const li = e.target.closest('li'); if (li) play(cur.key, +li.dataset.i); };

  // ---------- videos ----------
  const VIDEOS = ['oQ4F4qxs9ME', 'TiEr90TmQDc', 'YiWIkmITuuM', 'a_CXmh-j054', 't3mn3WYfqI0'];
  // the stadium: Domani's videos on the wrap displays (coords are in img/stadium.jpg, 1760x710)
  const SCREENS = [
    { v: VIDEOS[0], pts: [[435, 252], [1005, 323], [740, 585]], t: 'Watch' },
    { v: VIDEOS[1], pts: [[210, 525], [445, 272], [645, 490]] },
    { v: VIDEOS[2], pts: [[1005, 323], [1230, 478], [770, 578]] },
  ];
  const yt = (v, q = 'hqdefault') => `https://img.youtube.com/vi/${v}/${q}.jpg`;
  const scr = (s, i) => {
    const xs = s.pts.map(p => p[0]), ys = s.pts.map(p => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
    const cx = xs.reduce((a, b) => a + b) / 3, cy = ys.reduce((a, b) => a + b) / 3, poly = s.pts.map(p => p.join(',')).join(' ');
    const r = i ? 24 : 34;
    return `<g class="scr" data-v="${s.v}" tabindex="0" role="button" aria-label="Play video ${i + 1}">
      <clipPath id="sc${i}"><polygon points="${poly}"/></clipPath>
      <g clip-path="url(#sc${i})">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000"/>
        <image class="scr-img" href="${yt(s.v, i ? 'hqdefault' : 'maxresdefault')}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
        <rect class="scr-tint" x="${x}" y="${y}" width="${w}" height="${h}"/>
        <polygon class="scr-glare" points="${x},${y} ${x + w * 0.55},${y} ${x + w * 0.2},${y + h}  ${x - w * 0.15},${y + h}"/>
      </g>
      <polygon class="scr-edge" points="${poly}"/>
      <g class="scr-play" transform="translate(${cx} ${cy})"><circle r="${r}"/><path d="M${-r * 0.28} ${-r * 0.4} L${r * 0.45} 0 L${-r * 0.28} ${r * 0.4} Z"/></g>
    </g>`;
  };
  $('#vids').innerHTML = `<figure class="stadium"><svg viewBox="0 0 1760 710" role="group" aria-label="Domani videos on the stadium displays">
      <defs><filter id="stBlur" x="0" y="0" width="100%" height="100%"><feGaussianBlur stdDeviation="9" edgeMode="duplicate"/><feComponentTransfer><feFuncR type="linear" slope=".62"/><feFuncG type="linear" slope=".62"/><feFuncB type="linear" slope=".66"/></feComponentTransfer></filter></defs><image href="img/stadium.jpg" width="1760" height="710" filter="url(#stBlur)"/>${SCREENS.map(scr).join('')}</svg>
      <figcaption>Tap a screen to play</figcaption></figure>
    <div class="vids-more">${VIDEOS.slice(3).map(v => `<button class="vid" data-v="${v}"><img src="${yt(v)}" alt="Domani video" loading="lazy"><span class="pl">▶</span></button>`).join('')}</div>`;
  reveal($$('.stadium, .vids-more .vid'));
  // phones: the stadium is shown big and swipeable, starting centred on the main screen
  const fitStadium = () => {
    const phone = innerWidth < 820, st = $('.stadium'), sv = $('.stadium svg');
    sv.setAttribute('viewBox', phone ? '110 160 1280 500' : '60 120 1520 560');
    if (phone) requestAnimationFrame(() => (st.scrollLeft = (st.scrollWidth - st.clientWidth) * 0.48));
  };
  fitStadium(); addEventListener('resize', fitStadium);
  let wasPlaying = false;
  const playVid = v => { wasPlaying = !au.paused; au.pause(); $('#tv').src = `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&rel=0&playsinline=1`; $('#theater').classList.add('on'); };
  $('#vids').onclick = e => { const b = e.target.closest('[data-v]'); if (b) playVid(b.dataset.v); };
  $('#vids').onkeydown = e => { const b = e.target.closest('.scr'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); playVid(b.dataset.v); } };
  const closeTV = () => { $('#theater').classList.remove('on'); setTimeout(() => ($('#tv').src = ''), 500); if (wasPlaying) au.play(); };
  $('#theater .x').onclick = closeTV; $('#theater').onclick = e => e.target.id === 'theater' && closeTV();
  addEventListener('keydown', e => e.key === 'Escape' && $('#theater').classList.contains('on') && closeTV());

  // ---------- about: portrait follows you, bio writes in, wordmark sprays on ----------
  const pi = $('#portrait img');
  $('#portrait').onmousemove = e => { const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; pi.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.03)`; };
  $('#portrait').onmouseleave = () => (pi.style.transform = '');
  const bio = $('.bio'); bio.innerHTML = bio.innerHTML.split(/(\s+|<[^>]+>)/).map(w => (/^\s*$|^</.test(w) ? w : `<span class="w">${w}</span>`)).join('');
  const words = $$('.bio .w'), spray = $('#spray');
  addEventListener('scroll', () => {
    const r = bio.getBoundingClientRect(), k = Math.min(1, Math.max(0, (innerHeight * 0.9 - r.top) / (innerHeight * 0.6)));
    words.forEach((w, i) => w.classList.toggle('in', i / words.length < k));
    const s = spray.getBoundingClientRect(), q = Math.min(1, Math.max(0, (innerHeight - s.top) / (innerHeight * 0.55)));
    spray.style.setProperty('--s', q * 108 - 8 + '%');
  }, { passive: true });
})();
