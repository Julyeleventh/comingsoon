// PRODUCT PAGES: ingredient tabs and points, comparison slider, story, hero video, tag sizing. Shared by Waggin' Bites and Beef Wellington.
// Hero video: loops; reduced-motion users get the last frame only (no autoplay, no loop).
(function () {
  var v = document.getElementById('heroVideo');
  if (!v) return;
  function showEnd() {
    if (v.duration) { v.currentTime = v.duration - 0.05; }
    v.pause();
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    v.removeAttribute('autoplay');
    if (v.readyState >= 1) showEnd(); else v.addEventListener('loadedmetadata', showEnd, { once: true });
  }
})();

// Compare slider: drag or use arrow keys.
(function () {
  var box = document.getElementById('cmp');
  var top = document.getElementById('cmpTop');
  var bar = document.getElementById('cmpBar');
  if (!box || !top || !bar) return; // slider removed from the page
  var drag = false;
  function set(p) {
    p = Math.max(0, Math.min(100, p));
    top.style.clipPath = 'inset(0 0 0 ' + p + '%)';
    bar.style.left = p + '%';
    bar.setAttribute('aria-valuenow', Math.round(p));
  }
  function move(e) {
    var r = box.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100);
  }
  box.addEventListener('pointerdown', function (e) { drag = true; box.setPointerCapture(e.pointerId); move(e); });
  box.addEventListener('pointermove', function (e) { if (drag) move(e); });
  box.addEventListener('pointerup', function () { drag = false; });
  bar.addEventListener('keydown', function (e) {
    var v = Number(bar.getAttribute('aria-valuenow'));
    if (e.key === 'ArrowLeft') set(v - 5);
    if (e.key === 'ArrowRight') set(v + 5);
  });
})();

// Ingredient points: click to expand / collapse the description.
(function () {
  document.querySelectorAll('.tag').forEach(function (tag) {
    var head = tag.querySelector('.tag__head');
    head.addEventListener('click', function () {
      if (window.matchMedia('(max-width: 599px)').matches) return; // phones: the card strip below the board shows the text
      var open = tag.classList.toggle('is-open');
      head.setAttribute('aria-expanded', open);
    });
  });
})();

// Comparison story: switch the sticky image as each step reaches the middle of the screen.
(function () {
  var steps = document.querySelectorAll('.story__step');
  var imgs = document.querySelectorAll('.story__img');
  if (!steps.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var i = Number(e.target.dataset.i);
      steps.forEach(function (s, n) { s.classList.toggle('is-on', n === i); });
      imgs.forEach(function (m, n) { m.classList.toggle('is-on', n === i); });
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  steps.forEach(function (s) { io.observe(s); });
})();

// Ingredients: points open one by one every 1.5s (they stay open), in whichever tab is showing.
// Starts when the board scrolls into view, when a tab is switched, and when the visitor opens a point (the rest follow).
// Points the visitor closed themselves are left alone.
(function () {
  var board = document.querySelector('.board');
  if (!board || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(max-width: 599px)').matches) return; // phones use the card strip instead
  var timer = null, entered = false;
  function visibleSet() { return document.querySelector('.tagset:not([hidden])'); }
  function run(set, delay) {
    clearTimeout(timer);
    if (!set) return;
    timer = setTimeout(function step() {
      if (visibleSet() !== set) return;
      var tag = Array.prototype.slice.call(set.querySelectorAll('.tag')).filter(function (t) {
        return !t.classList.contains('is-open') && !t.dataset.userClosed;
      })[0];
      if (!tag) return;
      tag.classList.add('is-open');
      tag.querySelector('.tag__head').setAttribute('aria-expanded', 'true');
      timer = setTimeout(step, 1500);
    }, delay);
  }
  document.querySelectorAll('.tag').forEach(function (t) {
    t.querySelector('.tag__head').addEventListener('click', function () {
      if (!entered) return;
      if (t.classList.contains('is-open')) run(t.closest('.tagset'), 1500);
      else t.dataset.userClosed = '1';
    });
  });
  document.querySelectorAll('.ingredients .tab').forEach(function (t) {
    // Wait one tick: the page script swaps the visible tab set on the same click, and the points must open in the new set.
    t.addEventListener('click', function () { if (entered) setTimeout(function () { run(visibleSet(), 700); }, 0); });
  });
  var io = new IntersectionObserver(function (entries) {
    if (entered || !entries[0].isIntersecting) return;
    entered = true; io.disconnect();
    run(visibleSet(), 600);
  }, { threshold: 0.5 });
  io.observe(board);
})();

// "Why Choose Rabbit?" scrolls to the Rabbit section without leaving #why-rabbit in the address bar, so a refresh starts at the top.
(function () {
  document.querySelectorAll('a.protein-link[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();

// Base tab: Chicken / Rabbit tabs inside one point. Picking a tab shows its text and keeps the point open;
// clicking the tab that is already selected opens/closes the point like any other.
(function () {
  document.querySelectorAll('.tag--meat').forEach(function (tag) {
    var opts = tag.querySelectorAll('.meat__opt');
    var head = tag.querySelector('.tag__head');
    opts.forEach(function (o) {
      o.addEventListener('click', function (e) {
        if (o.classList.contains('is-on')) return; // let the normal open/close toggle run
        e.stopPropagation();
        opts.forEach(function (x) {
          var on = x === o;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-selected', on);
        });
        tag.querySelectorAll('[data-meat-txt]').forEach(function (p) { p.hidden = p.dataset.meatTxt !== o.dataset.meat; });
        tag.classList.add('is-open');
        head.setAttribute('aria-expanded', 'true');
        delete tag.dataset.userClosed;
      });
    });
  });
})();

// Points: shrink each open card to its text, so the space to the right of the text matches the space on the left.
// (CSS cannot shrink a box to the widest wrapped line, so this measures the lines and sets --tw on the point.)
(function () {
  // Natural width of the title row (name + dot), so the text area can open from that width instead of from 0:
  // the card then widens steadily for the whole animation, with no last-moment jump.
  function headWidth(tag) {
    var head = tag.querySelector('.tag__head');
    if (!head) return 0;
    var cs = getComputedStyle(head), sum = 0, n = 0;
    Array.prototype.forEach.call(head.children, function (c) { var w = c.getBoundingClientRect().width; if (w) { sum += w; n++; } });
    if (!n) return 0;
    return Math.ceil(sum + (n - 1) * (parseFloat(cs.columnGap) || 0) + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
  }
  function fit(tag) {
    var hw = headWidth(tag);
    if (hw) tag.style.setProperty('--hw', hw + 'px');
    tag.style.removeProperty('--tw');
    var txt = Array.prototype.filter.call(tag.querySelectorAll('.tag__txt'), function (e) { return !e.hidden; })[0];
    if (!txt) return;
    var base = txt.getBoundingClientRect();
    if (!base.width) return; // tab not showing
    var max = 0;
    var walker = document.createTreeWalker(txt, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue;
      var rg = document.createRange();
      rg.selectNodeContents(node);
      Array.prototype.forEach.call(rg.getClientRects(), function (r) { max = Math.max(max, r.right - base.left); });
    }
    if (max > 0 && max < base.width) tag.style.setProperty('--tw', Math.ceil(max) + 2 + 'px');
  }
  function all() { document.querySelectorAll('.tag').forEach(fit); }
  all();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
  window.addEventListener('load', all);
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(all, 150); });
  document.querySelectorAll('.ingredients .tab').forEach(function (b) { b.addEventListener('click', function () { setTimeout(all, 0); }); });
  document.querySelectorAll('.meat__opt').forEach(function (b) { b.addEventListener('click', function () { var tag = b.closest('.tag'); setTimeout(function () { fit(tag); }, 0); }); });
})();

// Rabbit card: draw the hand-drawn circle around "Rabbit" when the section scrolls into view.
(function () {
  var sec = document.getElementById('why-rabbit');
  if (!sec) return;
  if (!('IntersectionObserver' in window)) { sec.classList.add('is-in'); return; }
  var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { sec.classList.add('is-in'); io.disconnect(); } }, { threshold: .35 });
  io.observe(sec);
})();

// Ingredients on phones (599px and below): each board label shows only its dot and name. Under the board, a strip of swipeable cards holds the text.
// While the strip moves, every card is folded; the card that settles in the middle opens, and its label on the board lights up. Tapping a label slides the strip to its card.
(function () {
  var board = document.querySelector('.board');
  if (!board) return;
  var sec = board.closest('.ingredients');
  var mq = window.matchMedia('(max-width: 599px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var strips = [];
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function nearest(s) {
    var mid = s.el.scrollLeft + s.el.clientWidth / 2, best = 0, d = 1e9;
    s.cards.forEach(function (c, i) { var dd = Math.abs(c.card.offsetLeft + c.card.offsetWidth / 2 - mid); if (dd < d) { d = dd; best = i; } });
    return best;
  }
  // phones: the label is centred on its dot; if it would pass the picture edge the point moves inward (--px)
  function fit(s, i) {
    var t = s.cards[i] && s.cards[i].tag; if (!t || !board.offsetWidth) return;
    // the label is always centred on its dot. If it would pass the edge of the picture, the point moves inward (--px, in % of the picture) to the nearest spot where the whole label fits.
    var bw = board.getBoundingClientRect().width, x = parseFloat(t.style.getPropertyValue('--mx') || t.style.getPropertyValue('--x')), half = (t.offsetWidth / 2 + 4) / bw * 100;
    t.style.setProperty('--px', Math.min(Math.max(x, half), 100 - half).toFixed(2));
  }
  function light(s, i) { s.cards.forEach(function (c, n) { c.tag.classList.toggle('is-current', n === i); }); if (s.dots && i >= 0) { s.dots.children[0].setAttribute('aria-disabled', i === 0); s.dots.children[1].setAttribute('aria-disabled', i === s.cards.length - 1); } }
  function fold(s) { s.cards.forEach(function (c) { c.card.classList.remove('is-open'); }); }
  function collapse(s) { s.el.classList.remove('is-expanded'); s.cards.forEach(function (c) { c.more.textContent = 'View All'; c.more.setAttribute('aria-expanded', 'false'); }); }
  function measure(s) {
    if (s.el.hidden) return;
    collapse(s);
    s.cards.forEach(function (c) {
      var t = c.card.querySelector('.pcard__body > div'), first = t.querySelector('.pcard__txt:not([hidden]) span');
      t.style.removeProperty('--clamp-h');
      // default height = the first point only (its title and text), so every card starts short; View All opens the rest
      if (first) t.style.setProperty('--clamp-h', Math.ceil(first.getBoundingClientRect().bottom - t.getBoundingClientRect().top) + 'px');
      // View All only when there is more than the first point
      var all = t.querySelectorAll('.pcard__txt:not([hidden]) span'), last = all[all.length - 1];
      c.card.classList.toggle('has-more', !!(first && last && last !== first && last.getBoundingClientRect().bottom > first.getBoundingClientRect().bottom + 1));
    });
  }
  function refit(s) { if (s.active != null) fit(s, s.active); }
  function open(s, i) { if (s.active !== i) collapse(s); s.moving = false; s.lock = Date.now() + 350; s.cards.forEach(function (c, n) { c.card.classList.toggle('is-open', n === i); }); light(s, i); fit(s, i); s.active = i; }
  function settle(s) { open(s, nearest(s)); }
  function startMove(s) { if (!s.moving) { s.moving = true; fold(s); } }
  function goTo(s, i, jump) {
    var c = s.cards[i].card;
    startMove(s);
    // from the last card back to the first: no long slide past every card (each label would light up on the way). The cards and the label fade out, the strip jumps back while invisible, then the first card and its label fade in.
    if (jump && !reduce) {
      clearTimeout(s.t); light(s, -1); s.el.classList.add('is-fading');
      s.t = setTimeout(function () {
        s.el.style.scrollSnapType = 'none'; s.el.scrollTo({ left: c.offsetLeft, behavior: 'auto' });
        open(s, i); s.el.classList.remove('is-fading');
        setTimeout(function () { s.el.style.scrollSnapType = ''; }, 60);
      }, 260);
      return;
    }
    clearTimeout(s.t); s.t = setTimeout(function () { settle(s); }, 200);
    s.el.scrollTo({ left: c.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  }
  function setMeat(card, meat) {
    card.querySelectorAll('.pcard__opt').forEach(function (b) { var on = b.dataset.meat === meat; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
    card.querySelectorAll('[data-meat-txt]').forEach(function (p) { p.hidden = p.dataset.meatTxt !== meat; });
    strips.forEach(measure);
  }

  // AUTOMATIC EFFECT: until the visitor swipes, the strip moves to the next card every 3 seconds (the picture's label follows: the next one appears, the previous one fades).
  // It runs only while the section is on screen, never with reduced motion, and stops for good after the first swipe.
  var AUTO_MS = 3000, autoTimer = null, swiped = false, inView = false;
  function activeStrip() { for (var k = 0; k < strips.length; k++) if (!strips[k].el.hidden) return strips[k]; return null; }
  function tick() {
    var a = activeStrip();
    if (!a || swiped || !inView || document.hidden || a.el.classList.contains('is-expanded') || a.moving) return;
    var nx = (a.active + 1) % a.cards.length; goTo(a, nx, nx === 0);
  }
  function autoStop() { clearInterval(autoTimer); clearTimeout(autoTimer); autoTimer = null; }
  function autoStart() { autoStop(); if (reduce || swiped || !strips.length) return; autoTimer = setInterval(tick, AUTO_MS); }
  // "In view" = at least 90% of the picture's HEIGHT is on screen. Measured by hand (not IntersectionObserver) because the Wellington picture is wider than the screen on phones and the section crops it, which would make an observer never reach 90%.
  var viewTick = false;
  function checkView() {
    viewTick = false;
    var r = board.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
    var now = r.height > 0 && (Math.min(r.bottom, vh) - Math.max(r.top, 0)) / r.height >= .9;
    if (now === inView) return;
    inView = now;
    // arriving at the section: the first move comes after 2 seconds, then every AUTO_MS
    if (inView && strips.length && !swiped && !reduce) { autoStop(); autoTimer = setTimeout(function () { tick(); autoStart(); }, 2000); }
    if (!inView) autoStop();
  }
  function queueView() { if (!viewTick) { viewTick = true; requestAnimationFrame(checkView); } }
  window.addEventListener('scroll', queueView, { passive: true });
  window.addEventListener('resize', queueView);
  queueView();

  function buildStrip(set) {
    var s = { set: set, tagset: set, el: el('div', 'pcards'), cards: [], moving: false, lock: 0, active: 0, t: null };
    s.el.setAttribute('role', 'group'); s.el.setAttribute('aria-label', 'Ingredient details');
    set.querySelectorAll(':scope > .tag').forEach(function (tag, i) {
      var card = el('div', 'pcard'), head = el('div', 'pcard__head'), body = el('div', 'pcard__body'), inner = el('div');
      body.appendChild(inner);
      var opts = tag.querySelectorAll('.meat__opt');
      if (opts.length) {
        var pills = el('div', 'pcard__pills');
        opts.forEach(function (o) {
          var b = el('button', 'pcard__opt' + (o.classList.contains('is-on') ? ' is-on' : ''));
          b.type = 'button'; b.dataset.meat = o.dataset.meat; b.style.setProperty('--c', o.style.getPropertyValue('--c'));
          b.setAttribute('aria-selected', o.classList.contains('is-on'));
          var d = el('i', 'pcard__dot'); b.appendChild(d); b.appendChild(document.createTextNode(o.textContent.trim()));
          b.addEventListener('click', function () { setMeat(card, b.dataset.meat); o.click(); });
          o.addEventListener('click', function () { setTimeout(function () { setMeat(card, o.dataset.meat); }, 0); });
          if (pills.children.length) { var or = el('span', 'pcard__or'); or.textContent = 'or'; or.setAttribute('aria-hidden', 'true'); pills.appendChild(or); }
          pills.appendChild(b);
        });
        head.appendChild(pills);
        tag.classList.add('is-open'); // keeps the chosen meat pill coloured on the board
        tag.dataset.pcardOpen = '1';
      } else {
        var dot = el('i', 'pcard__dot'); dot.style.setProperty('--c', tag.querySelector('.dot').style.getPropertyValue('--c'));
        var name = el('span'); name.textContent = tag.querySelector('.tag__head span').textContent.trim();
        head.appendChild(dot); head.appendChild(name);
      }
      tag.querySelectorAll('.tag__txt').forEach(function (t) {
        var p = el('div', 'pcard__txt'); p.innerHTML = t.innerHTML;
        if (t.hasAttribute('data-meat-txt')) { p.dataset.meatTxt = t.dataset.meatTxt; p.hidden = t.hidden; }
        inner.appendChild(p);
      });
      var more = el('button', 'pcard__more'); more.type = 'button'; more.textContent = 'View All'; more.setAttribute('aria-expanded', 'false');
      more.addEventListener('click', function () { var ex = !s.el.classList.contains('is-expanded'); s.el.classList.toggle('is-expanded', ex); s.cards.forEach(function (c) { c.more.textContent = ex ? 'View Less' : 'View All'; c.more.setAttribute('aria-expanded', ex); }); });
      card.appendChild(head); card.appendChild(body); card.appendChild(more);
      s.el.appendChild(card);
      s.cards.push({ card: card, tag: tag, more: more });
      tag.addEventListener('click', tag._pc = function () { goTo(s, i); });
    });
    // any press on View All, the meat pills or the arrows stops the automatic effect at once (it must never take the card away under the finger)
    s.el.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('.pcard__more, .pcard__opt')) { swiped = true; autoStop(); } }, { passive: true });
    // only a sideways swipe counts: it stops the automatic effect and folds the card; scrolling the page up or down leaves everything as it is
    var sx = 0;
    s.el.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    s.el.addEventListener('touchmove', function (e) { if (Math.abs(e.touches[0].clientX - sx) > 8) { swiped = true; autoStop(); startMove(s); } }, { passive: true });
    s.el.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { swiped = true; autoStop(); startMove(s); } }, { passive: true });
    s.el.addEventListener('scroll', function () {
      if (Date.now() < s.lock) return;
      startMove(s); light(s, nearest(s));
      clearTimeout(s.t); s.t = setTimeout(function () { settle(s); }, 140);
    }, { passive: true });
    board.insertAdjacentElement('afterend', s.el);
    // round arrows (system `.arrow-btn`) instead of page dots: one card back, one card forward; the one that cannot move is greyed
    s.dots = el('div', 'pcards__ctrl');
    [[-1, 'Previous ingredient', 'M15 5l-7 7 7 7'], [1, 'Next ingredient', 'M9 5l7 7-7 7']].forEach(function (a) {
      var b = el('button', 'arrow-btn'); b.type = 'button'; b.setAttribute('aria-label', a[1]);
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="' + a[2] + '"/></svg>';
      b.addEventListener('click', function () { var i = nearest(s) + a[0]; if (i < 0 || i > s.cards.length - 1) return; swiped = true; autoStop(); goTo(s, i); });
      s.dots.appendChild(b);
    });
    s.el.insertAdjacentElement('afterend', s.dots);
    return s;
  }

  function show() {
    strips.forEach(function (s) {
      var hide = s.tagset.hidden; s.el.hidden = hide; s.dots.hidden = hide;
      if (!hide) { s.el.scrollLeft = 0; open(s, 0); measure(s); }
      else { s.cards.forEach(function (c) { c.tag.classList.remove('is-current'); }); }
    });
  }
  function on() {
    if (strips.length) return;
    sec.classList.add('has-pcards');
    board.querySelectorAll(':scope > .tagset').forEach(function (set) { strips.push(buildStrip(set)); });
    show();
    autoStart();
  }
  function off() {
    autoStop();
    sec.classList.remove('has-pcards');
    strips.forEach(function (s) {
      s.cards.forEach(function (c) { c.tag.classList.remove('is-current'); c.tag.removeEventListener('click', c.tag._pc); if (c.tag.dataset.pcardOpen) { c.tag.classList.remove('is-open'); delete c.tag.dataset.pcardOpen; } });
      s.el.remove(); s.dots.remove();
    });
    strips = [];
  }
  window.addEventListener('resize', function () { strips.forEach(function (s) { measure(s); refit(s); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { strips.forEach(measure); });
  function sync() { if (mq.matches) on(); else off(); }
  sync();
  if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
  sec.querySelectorAll('.tab').forEach(function (t) { t.addEventListener('click', function () { setTimeout(function () { if (strips.length) { show(); autoStart(); } }, 0); }); });
})();
