// Store: products, size picker and the cart drawer.
// On Shopify the theme puts window.SHOPIFY_PRODUCTS on the page and the cart is Shopify's own
// (/cart.js, /cart/add.js, /cart/change.js, then /checkout). In local preview there is no Shopify,
// so products come from products.json and the cart lives in localStorage.
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const ON_SHOPIFY = !!window.Shopify || !!window.SHOPIFY_PRODUCTS;
  const asset = p => (window.ASSET ? window.ASSET(p) : p);
  const money = c => '$' + (c / 100).toFixed(2).replace(/\.00$/, '');
  let PRODUCTS = window.SHOPIFY_PRODUCTS || null;
  const ready = PRODUCTS ? Promise.resolve(PRODUCTS) : fetch(asset('products.json')).then(r => r.json()).then(j => (PRODUCTS = j));

  // ---------- cart: Shopify Ajax API, or a local stand-in with the same shape ----------
  const local = {
    read() { try { return JSON.parse(localStorage.getItem('domani-cart') || '{"items":[]}'); } catch (e) { return { items: [] }; } },
    write(c) { c.item_count = c.items.reduce((a, i) => a + i.quantity, 0); c.total_price = c.items.reduce((a, i) => a + i.quantity * i.price, 0); try { localStorage.setItem('domani-cart', JSON.stringify(c)); } catch (e) {} return c; },
  };
  const findVariant = id => { for (const p of Object.values(PRODUCTS || {})) for (const v of p.variants) if (v.id == id) return [p, v]; return []; };
  const api = {
    async get() {
      if (ON_SHOPIFY) return (await fetch('/cart.js', { headers: { Accept: 'application/json' } })).json();
      return local.write(local.read());
    },
    async add(id, qty = 1) {
      if (ON_SHOPIFY) {
        const r = await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items: [{ id, quantity: qty }] }) });
        if (!r.ok) throw new Error((await r.json()).description || 'Could not add to cart');
        return api.get();
      }
      await ready; const c = local.read(), [p, v] = findVariant(id);
      const line = c.items.find(i => i.variant_id == id);
      if (line) line.quantity += qty;
      else c.items.push({ key: String(id), variant_id: id, quantity: qty, price: v.price, product_title: p.title, variant_title: v.title === 'Default Title' ? null : v.title, image: p.featured_image, handle: p.handle });
      return local.write(c);
    },
    async change(key, qty) {
      if (ON_SHOPIFY) return (await fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ id: key, quantity: qty }) })).json();
      const c = local.read(); const l = c.items.find(i => i.key == key); if (l) l.quantity = qty; c.items = c.items.filter(i => i.quantity > 0); return local.write(c);
    },
  };

  // ---------- cart drawer ----------
  const drawer = document.createElement('aside'); drawer.className = 'cartd'; drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-label', 'Cart');
  drawer.innerHTML = `<div class="cartd-h"><h2>Your bag</h2><button class="close" aria-label="Close cart">×</button></div><div class="cartd-b"></div><div class="cartd-f"></div>`;
  document.body.appendChild(drawer);
  const scrim = document.createElement('div'); scrim.className = 'cartscrim'; document.body.appendChild(scrim);
  const lineImg = l => l.image ? (typeof l.image === 'string' ? l.image : l.image.url || '') : (l.featured_image && l.featured_image.url) || '';
  function paint(c) {
    $$('[data-cart-count]').forEach(e => { e.textContent = c.item_count || ''; e.classList.toggle('on', c.item_count > 0); });
    const b = drawer.querySelector('.cartd-b'), f = drawer.querySelector('.cartd-f');
    if (!c.items.length) { b.innerHTML = `<p class="cart-empty">Your bag is empty.<br>Check the rack, the records and the tickets.</p>`; f.innerHTML = ''; return; }
    b.innerHTML = c.items.map(l => `<div class="cl" data-key="${l.key}">
        <img src="${lineImg(l)}" alt="">
        <div><b>${l.product_title}</b>${l.variant_title ? `<small>${l.variant_title}</small>` : ''}<span>${money(l.final_line_price ?? l.price * l.quantity)}</span>
          <div class="qty"><button data-q="-1" aria-label="One less">−</button><em>${l.quantity}</em><button data-q="1" aria-label="One more">+</button><button data-q="x" class="rm">Remove</button></div></div></div>`).join('');
    f.innerHTML = `<div class="sub"><span>Subtotal</span><b>${money(c.total_price)}</b></div><p class="tax">Shipping and taxes at checkout.</p>
      <button class="cta solid checkout">Checkout <span>→</span></button>`;
  }
  const refresh = () => api.get().then(paint);
  const openCart = () => { refresh(); drawer.classList.add('on'); scrim.classList.add('on'); };
  const closeCart = () => { drawer.classList.remove('on'); scrim.classList.remove('on'); };
  drawer.querySelector('.close').onclick = closeCart; scrim.onclick = closeCart;
  addEventListener('keydown', e => e.key === 'Escape' && closeCart());
  drawer.addEventListener('click', async e => {
    const q = e.target.closest('[data-q]');
    if (q) { const row = q.closest('.cl'), cur = +row.querySelector('em').textContent; paint(await api.change(row.dataset.key, q.dataset.q === 'x' ? 0 : Math.max(0, cur + +q.dataset.q))); }
    if (e.target.closest('.checkout')) {
      if (ON_SHOPIFY) location.href = '/checkout';
      else { const t = drawer.querySelector('.tax'); t.textContent = 'Preview only: on the live Shopify theme this goes straight to checkout.'; t.classList.add('warn'); }
    }
  });
  $$('[data-open-cart]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openCart(); }));
  ready.then(refresh);

  // ---------- size / date picker + add to cart (inside the existing panel) ----------
  async function showProduct(handle, artHTML) {
    await ready; const p = PRODUCTS[handle]; if (!p) return;
    const single = p.variants.length === 1 && p.variants[0].title === 'Default Title';
    const first = p.variants.find(v => v.available) || p.variants[0];
    const isTix = /ticket/.test(handle);
    window.__openPanelNow(p.title, `<div class="pd">
      <div class="pd-art">${artHTML || (window.__art ? window.__art(handle) : `<img src="${p.featured_image}" alt="">`)}</div>
      <div class="pd-price" id="pdPrice">${money(first.price)}</div>
      ${single ? '' : `<p class="pd-l">${isTix ? 'Choose a city' : 'Choose a size'}</p><div class="pd-v ${isTix ? 'tix' : ''}">${p.variants.map(v => `<button data-v="${v.id}" data-p="${v.price}" ${v.available ? '' : 'disabled'} class="${v === first ? 'on' : ''}">${v.title}${v.available ? '' : ' · sold out'}</button>`).join('')}</div>`}
      <button class="cta add" data-add="${first.id}" ${first.available ? '' : 'disabled'}>${first.available ? 'Add to bag' : 'Sold out'} <span>+</span></button>
    </div>`);
    const body = $('#pbody'), add = body.querySelector('.add');
    body.querySelectorAll('.pd-v button').forEach(b => b.onclick = () => {
      body.querySelectorAll('.pd-v button').forEach(x => x.classList.toggle('on', x === b));
      add.dataset.add = b.dataset.v; $('#pdPrice').textContent = money(+b.dataset.p);
    });
    add.onclick = async () => {
      add.disabled = true; add.firstChild.textContent = 'Adding… ';
      try { paint(await api.add(+add.dataset.add)); add.firstChild.textContent = 'Added '; setTimeout(() => { window.__closePanel && window.__closePanel(); openCart(); }, 450); }
      catch (err) { add.firstChild.textContent = err.message + ' '; }
      setTimeout(() => { add.disabled = false; add.firstChild.textContent = 'Add to bag '; }, 1600);
    };
  }
  window.STORE = { showProduct, openCart, add: id => api.add(id).then(c => (paint(c), openCart())), addQuiet: id => api.add(id).then(paint), ready, products: () => PRODUCTS, money };
})();
