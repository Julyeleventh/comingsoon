// CORE: liquid glass, glass-pane tilt, nav shadow, Products dropdown, keyboard focus ring. Used by every page.
// Liquid-glass refraction (Chromium only; other browsers keep the frosted-glass fallback in CSS).
(function () {
  var ua = navigator.userAgent;
  var chromium = /Chrome\/|Chromium\/|Edg\//.test(ua) && !/OPR\/|Firefox\//.test(ua);
  // Which glass panes get the refraction filter is set on <html data-liquid-on="copy tabs strip tag nav sub"> (space-separated; empty/missing = none).
  var ON = (document.documentElement.getAttribute('data-liquid-on') || '').split(/\s+/);
  function nameOf(el) { var c = el.classList; return c.contains('nav') ? 'nav' : c.contains('sub') ? 'sub' : c.contains('strip') ? 'strip' : c.contains('tabs') ? 'tabs' : c.contains('wrapped__copy') ? 'copy' : c.contains('tag') ? 'tag' : ''; }
  var cards = Array.prototype.filter.call(document.querySelectorAll('[data-liquid], .tag'), function (el) { return ON.indexOf(nameOf(el)) > -1; });
  if (!chromium || !cards.length) return;
  var NS = 'http://www.w3.org/2000/svg';
  function sdfMap(W, H, R, B) {
    // Built at a quarter of the size and stretched by the filter: the map is smooth, so it looks the same but is ~16x cheaper to redraw while a card is opening.
    var k = .25, w = Math.max(2, Math.round(W * k)), h = Math.max(2, Math.round(H * k)), r = R * k, bezel = Math.max(1, B * k);
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var ctx = c.getContext('2d'); var img = ctx.createImageData(w, h); var d = img.data;
    var hx = w / 2, hy = h / 2;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var px = x + .5 - hx, py = y + .5 - hy;
      var qx = Math.abs(px) - (hx - r), qy = Math.abs(py) - (hy - r);
      var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
      var dist = Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r; // <0 inside
      var depth = -dist; // distance in from the edge
      var nx = 0, ny = 0;
      if (ox > 0 || oy > 0) { var l = Math.sqrt(ox * ox + oy * oy) || 1; nx = ox / l * Math.sign(px); ny = oy / l * Math.sign(py); }
      else if (qx > qy) { nx = Math.sign(px); } else { ny = Math.sign(py); }
      var m = depth >= bezel ? 0 : Math.pow(1 - Math.max(depth, 0) / bezel, 2);
      var i = (y * w + x) * 4;
      d[i] = 128 + nx * m * 127; d[i + 1] = 128 + ny * m * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); return c.toDataURL();
  }
  cards.forEach(function (card, n) {
    var id = 'liquid-glass-' + n;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;pointer-events:none';
    svg.innerHTML = '<filter id="' + id + '" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" x="0" y="0" width="10" height="10">' +
      '<feImage href="" x="0" y="0" width="10" height="10" result="map" preserveAspectRatio="none"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="48" xChannelSelector="R" yChannelSelector="G" result="dR"/>' +
      '<feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cR"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="44" xChannelSelector="R" yChannelSelector="G" result="dG"/>' +
      '<feColorMatrix in="dG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cG"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="40" xChannelSelector="R" yChannelSelector="G" result="dB"/>' +
      '<feColorMatrix in="dB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cB"/>' +
      '<feBlend in="cR" in2="cG" mode="screen" result="rg"/><feBlend in="rg" in2="cB" mode="screen"/></filter>';
    document.body.appendChild(svg);
    var f = svg.firstChild, fi = f.querySelector('feImage'), dms = f.querySelectorAll('feDisplacementMap');
    function build() {
      var w = Math.round(card.offsetWidth), h = Math.round(card.offsetHeight);
      if (!w || !h) return;
      var r = Math.min(parseFloat(getComputedStyle(card).borderTopLeftRadius) || 28, w / 2, h / 2);
      // phone labels on the picture are small, so their refraction is stronger and its edge band wider
      var small = card.classList.contains('tag') && card.closest('.has-pcards') && window.matchMedia('(max-width: 599px)').matches;
      var S = Math.min(small ? 110 : 72, Math.round(h * (small ? 1.7 : .6)));
      dms[0].setAttribute('scale', S); dms[1].setAttribute('scale', Math.round(S * .92)); dms[2].setAttribute('scale', Math.round(S * .84));
      f.setAttribute('width', w); f.setAttribute('height', h);
      fi.setAttribute('width', w); fi.setAttribute('height', h);
      fi.setAttribute('href', sdfMap(w, h, r, Math.min(56, h / (small ? 2 : 3))));
      card.style.setProperty('--liquid', 'url(#' + id + ')');
      card.classList.add('is-liquid');
    }
    // Build lazily (only once near the viewport) and debounce rebuilds so expanding points don't regenerate the map every frame.
    var wait = null, ready = false;
    // While a point opens or closes, rebuild the glass map at most ~14 times a second (plus once when it stops), instead of every frame: rebuilding each frame made closing stutter and jump.
    var last = 0, tid = 0;
    function later() {
      var now = performance.now();
      if (now - last >= 70) { last = now; build(); }
      clearTimeout(tid); tid = setTimeout(function () { last = performance.now(); build(); }, 90);
    }
    function activate() {
      if (ready) return; ready = true; build();
      if (window.ResizeObserver) new ResizeObserver(later).observe(card); else window.addEventListener('resize', later);
    }
    // Build everything up front so all glass effects appear together; rebuild once fonts/images settle sizes.
    activate();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    window.addEventListener('load', build);
  });
})();

// Glass panes (footer subscribe card + ingredient points): slide and tilt a little toward the cursor, highlight follows it.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.sub, .tag, .btn, .meat__opt, .wrapped__prod').forEach(function (card) {
    var btn = card.classList.contains('btn') || card.classList.contains('meat__opt');
    var small = card.classList.contains('tag') || card.classList.contains('wrapped__prod') || btn;
    card.addEventListener('pointermove', function (e) {
      if (card.classList.contains('meat__opt') && !card.closest('.tag').classList.contains('is-open')) return; // closed: colour hover only
      if (card.classList.contains('btn') && card.closest('.sub') && !card.closest('.sub').matches(':focus-within')) return;
      if ((card.classList.contains('tag') && card.classList.contains('is-open')) || (card.classList.contains('sub') && card.matches(':focus-within'))) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      var ax = btn ? Math.min(6, r.width * .05) : small ? Math.min(8, r.width * .04) : 14, ay = btn ? 3 : small ? Math.min(6, r.height * .1) : 10;
      var ar = btn ? 2.5 : small ? 3 : 5, at = btn ? 3 : small ? 2.5 : 4;
      card.classList.add('is-tracking');
      card.style.setProperty('--mx', (px * 100) + '%');
      card.style.setProperty('--my', (py * 100) + '%');
      card.style.setProperty('--tx', ((px - .5) * ax) + 'px');
      card.style.setProperty('--ty', ((py - .5) * ay) + 'px');
      card.style.setProperty('--ry', ((px - .5) * ar) + 'deg');
      card.style.setProperty('--rx', ((.5 - py) * at) + 'deg');
    });
    // Opening or closing a point: forget the tilt so nothing eases back (or jumps) while the card changes size.
    if (card.classList.contains('tag')) card.addEventListener('click', function () {
      card.classList.remove('is-tracking');
      ['--tx', '--ty', '--rx', '--ry'].forEach(function (p) { card.style.removeProperty(p); });
    });
    card.addEventListener('pointerleave', function () {
      card.classList.remove('is-tracking');
      ['--tx', '--ty', '--rx', '--ry'].forEach(function (p) { card.style.removeProperty(p); });
    });
  });
})();

// Nav: add a soft shadow once the page is scrolled.
(function () {
  var nav = document.getElementById('nav');
  if (!nav) return;
  function on() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', on, { passive: true });
  on();
})();

// Focus ring only for keyboard users: after a mouse/touch press, hide it until a key is used again.
(function () {
  var b = document.body;
  window.addEventListener('pointerdown', function () { b.classList.add('is-mouse'); }, true);
  window.addEventListener('keydown', function (e) { if (e.key === 'Tab' || e.key.indexOf('Arrow') === 0) b.classList.remove('is-mouse'); }, true);
})();

// Products dropdown: opens on hover (CSS) or on click/tap; Products itself links nowhere.
(function () {
  var dd = document.querySelector('.nav__dd');
  if (!dd) return;
  var btn = dd.querySelector('.nav__dd-btn');
  function set(open) { dd.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  btn.addEventListener('click', function (e) { e.preventDefault(); set(!dd.classList.contains('is-open')); });
  document.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); btn.blur(); } });
})();

// OPEN AND CLOSE, one effect everywhere (accordion, FAQ categories, nav menu, Products group): the element slides open or shut (height and spacing) and fades,
// using the motion tokens --dur-open and --ease-open. window.siteSlide(el, opening, options, done): for opening, show the element first, then call it;
// for closing, call it, and hide the element in `done`. options.height === false fades only (for full-screen panels). With reduced motion it just switches.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.siteSlide = function (el, opening, options, done) {
    options = options || {};
    var css = getComputedStyle(document.documentElement);
    var ms = (parseFloat(css.getPropertyValue('--dur-open')) || .4) * 1000;
    var ease = css.getPropertyValue('--ease-open').trim() || 'ease';
    if (el._anim) { el._anim.cancel(); el._anim = null; }
    if (reduce || !el.animate) { if (done) done(); return null; }
    var cs = getComputedStyle(el), full = { opacity: 1 }, shut = { opacity: 0 };
    if (options.height !== false) {
      ['height', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom'].forEach(function (k) { full[k] = cs[k]; shut[k] = '0px'; });
      el.style.overflow = 'hidden';
    }
    var anim = el.animate(opening ? [shut, full] : [full, shut], { duration: ms, easing: ease, fill: opening ? 'none' : 'forwards' }); // closing holds its last frame until `done` has hidden the element
    el._anim = anim;
    anim.onfinish = function () { el.style.overflow = ''; el._anim = null; if (done) done(); if (!opening) anim.cancel(); };
    anim.oncancel = function () { el.style.overflow = ''; };
    return anim;
  };
})();

// Accordion (.acc): opening one question closes the others in the same list.
(function () {
  document.querySelectorAll('.acc').forEach(function (item) {
    var sum = item.querySelector('summary'), a = item.querySelector('.acc__a');
    if (!sum || !a) return;
    function close(it) { var ans = it.querySelector('.acc__a'); window.siteSlide(ans, false, null, function () { it.open = false; }); }
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (item.open) { close(item); return; }
      item.parentElement.querySelectorAll('.acc[open]').forEach(function (o) { if (o !== item) close(o); });
      item.open = true;
      window.siteSlide(a, true);
    });
  });
})();

// Mobile nav: the burger opens / closes the link panel; Escape or a link closes it.
(function () {
  var nav = document.getElementById('nav');
  var btn = nav && nav.querySelector('.nav__burger');
  if (!btn) return;
  var panel = nav.querySelector('.nav__panel');
  function set(open) {
    if (open === nav.classList.contains('is-menu-open')) return;
    nav.classList.toggle('is-menu-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { nav.classList.add('is-menu-shown'); window.siteSlide(panel, true, { height: false }); }
    else { window.siteSlide(panel, false, { height: false }, function () { nav.classList.remove('is-menu-shown'); }); }
  }
  btn.addEventListener('click', function () { set(!nav.classList.contains('is-menu-open')); });
  nav.querySelectorAll('.nav__panel a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
})();

// Mobile menu: the Products row opens / closes its two pages.
(function () {
  var btn = document.querySelector('.nav__pbtn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var g = btn.closest('.nav__pgroup'), sub = g.querySelector('.nav__psub');
    var open = !g.classList.contains('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { g.classList.add('is-open'); window.siteSlide(sub, true); }
    else { window.siteSlide(sub, false, null, function () { g.classList.remove('is-open'); }); }
  });
})();

// FORMS (any <form data-form>): required fields are marked with [required] and an optional data-error message.
// - The submit button stays inactive (disabled) until every required field is valid (and the reCAPTCHA box, if the form has one, is ticked).
// - A field is checked when the visitor leaves it; the message appears under that field.
// - form.siteValidate() shows every error and returns the first field with a problem; form.siteAnchor(el, message) scrolls to a field and shows a message under it.
(function () {
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var forms = [].slice.call(document.querySelectorAll('form[data-form]'));
  function host(el) { return el.closest('.field') || el.closest('.sub__field'); }
  function errEl(el, create) {
    var h = host(el), p = h.querySelector(':scope > .field__error') || (h.nextElementSibling && h.nextElementSibling.classList.contains('field__error') ? h.nextElementSibling : null);
    if (!p && create) {
      p = document.createElement('p'); p.className = 'field__error'; p.setAttribute('role', 'alert'); p.hidden = true;
      if (h.classList.contains('field')) h.appendChild(p); else h.insertAdjacentElement('afterend', p);
    }
    return p;
  }
  function show(el, msg) {
    var p = errEl(el, !!msg); if (!p) return;
    p.textContent = msg || ''; p.hidden = !msg;
    host(el).classList.toggle('is-invalid', !!msg);
    if (el.setAttribute) { if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
  }
  function problem(el) {
    if (!el.value.trim()) return el.getAttribute('data-error') || 'Please fill in this field.';
    if (el.type === 'email' && !EMAIL.test(el.value.trim())) return el.getAttribute('data-error') || 'Please enter a valid email address.';
    return '';
  }
  function captchaBox(f) { return f.querySelector('.g-recaptcha'); }
  function captchaOk(f) { var c = captchaBox(f); return !c || !(window.grecaptcha && grecaptcha.getResponse) || !!grecaptcha.getResponse(); }
  forms.forEach(function (f) {
    var btn = f.querySelector('button[type="submit"]');
    var req = function () { return [].slice.call(f.querySelectorAll('[required]')); };
    function update() { if (btn) btn.disabled = !(req().every(function (i) { return !problem(i); }) && captchaOk(f)); }
    f.siteUpdate = update;
    f.siteValidate = function () {
      var first = null;
      req().forEach(function (i) { var m = problem(i); show(i, m); if (m && !first) first = i; });
      if (!first && !captchaOk(f)) { var c = captchaBox(f); show(c, c.getAttribute('data-captcha-error') || 'Please tick the box.'); first = c; }
      return first;
    };
    f.siteAnchor = function (el, msg) {
      if (msg) show(el, msg);
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      host(el).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      if (el.focus && el.tagName !== 'DIV') el.focus({ preventScroll: true });
    };
    f.siteReset = function () { f.reset(); f.querySelectorAll('.field__error').forEach(function (p) { p.hidden = true; }); f.querySelectorAll('.is-invalid').forEach(function (x) { x.classList.remove('is-invalid'); }); update(); };
    req().forEach(function (i) {
      i.addEventListener('blur', function () { show(i, problem(i)); update(); });
      i.addEventListener('input', function () { if (host(i).classList.contains('is-invalid') && !problem(i)) show(i, ''); update(); });
    });
    f.addEventListener('submit', function (e) {
      if (f.hasAttribute('data-own-submit')) return; // the page script handles the sending
      e.preventDefault(); var bad = f.siteValidate(); if (bad) f.siteAnchor(bad);
    });
    update();
  });
  // reCAPTCHA calls this when the box is ticked or expires
  window.siteCaptchaChanged = function () { forms.forEach(function (f) { if (f.siteUpdate) f.siteUpdate(); var c = captchaBox(f); if (c && captchaOk(f)) show(c, ''); }); };
})();


// NO ONE-WORD LAST LINES: the last space of every headline, subtitle and paragraph becomes a non-breaking space, so the last two words always stay together.
(function () {
  var SEL = '.announce__item, h1, h2, h3, .compare__sub, .ingredients__sub, .rabbit__sub, .pfaq__sub, .faq__sub, .contact__sub, .hero__sub, .story__text p, .story__step > p, .rabbit__list p, .wrapped__copy > p, .strip p, .acc__a p, .faq__more, .split__text p, .hl__item p, .fcard__desc, .promo__sub, .promo__h, .loyalty__sub, .callout__sub';
  function fix(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), last = null, n;
    while ((n = w.nextNode())) { if (n.nodeValue.trim()) last = n; }
    if (!last) return;
    var v = last.nodeValue, t = v.replace(/\s+$/, ''), i = Math.max(t.lastIndexOf(' '), t.lastIndexOf('\u00a0'));
    if (i < 1 || i > t.length - 2 || t.charAt(i) === '\u00a0') return; // already joined
    var nv = t.slice(0, i) + ' ' + t.slice(i + 1) + v.slice(t.length);
    if (nv !== v) last.nodeValue = nv;
  }
  function run(root) { (root || document).querySelectorAll(SEL).forEach(fix); }
  run();
  // text that is swapped later (Ingredients caption under the tabs)
  document.querySelectorAll('.ingredients__sub').forEach(function (el) {
    new MutationObserver(function () { fix(el); }).observe(el, { childList: true, characterData: true, subtree: true });
  });
})();


// Dark mode switch: the button in the nav flips <html data-theme="dark">; the choice is kept in localStorage. (The tiny script in each page's <head> applies it before the page paints.)
(function () {
  var b = document.querySelector('.theme-toggle'); if (!b) return;
  // Testing only: the switch stays hidden for visitors. Open any page with ?darktest to show it on this browser (?darktest=off hides it again).
  try {
    var q = new URLSearchParams(location.search).get('darktest');
    if (q === 'off') { localStorage.removeItem('themeTest'); localStorage.removeItem('theme'); document.documentElement.removeAttribute('data-theme'); }
    else if (q !== null) localStorage.setItem('themeTest', '1');
    if (localStorage.getItem('themeTest') !== '1') { document.documentElement.removeAttribute('data-theme'); return; }
  } catch (e) { return; }
  b.hidden = false;
  function set(dark) {
    document.documentElement.toggleAttribute('data-theme-dark', false);
    if (dark) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
    b.setAttribute('aria-pressed', dark ? 'true' : 'false'); b.setAttribute('aria-label', dark ? 'Light mode' : 'Dark mode');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
  }
  b.setAttribute('aria-pressed', document.documentElement.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
  b.addEventListener('click', function () { set(document.documentElement.getAttribute('data-theme') !== 'dark'); });
})();
