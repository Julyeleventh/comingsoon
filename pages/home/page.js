// HOME PAGE: promotion / events slides, an endless loop. After the last card comes the first again (and before the first comes the last).
// How: the cards are copied before and after the real ones; when the row stops on a copy it jumps, unseen, to the same real card in the middle set.
// The round arrows always work (never greyed). The pause button stops the automatic move. Until the visitor touches or pauses it, the cards move on every 5 seconds while the row is on screen (never with reduced motion).
(function () {
  var box = document.getElementById('promo');
  if (!box) return;
  var track = box.querySelector('.promo__track');
  var real = Array.prototype.slice.call(track.querySelectorAll('.promo__slide'));
  var N = real.length;
  if (N < 2) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function copy(s) {
    var c = s.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.removeAttribute('role'); c.removeAttribute('aria-roledescription'); c.removeAttribute('aria-label');
    c.querySelectorAll('a, button').forEach(function (e) { e.tabIndex = -1; });
    return c;
  }
  var before = real.map(copy), after = real.map(copy);
  before.forEach(function (c) { track.insertBefore(c, real[0]); });
  after.forEach(function (c) { track.appendChild(c); });

  var slides = track.querySelectorAll('.promo__slide');
  var prev = box.querySelector('[data-dir="-1"]'), next = box.querySelector('[data-dir="1"]');
  var pauses = box.querySelectorAll('.promo__pause');
  var paused = reduce, timer = null, inView = false, settleT = null;

  // exact (fractional) distance from one card to the next; rounding it to whole pixels made the picture twitch sideways when the row jumped back
  function step() { return slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().left; }
  function idx() { return Math.round(track.scrollLeft / step()); }
  function shift(by) {
    // move by whole sets of cards, relative to where the row is now (it sits exactly on a card, so the new place is exact too); snapping is off only for this one move
    track.style.scrollSnapType = 'none';
    track.scrollLeft += by;
    requestAnimationFrame(function () { track.style.scrollSnapType = ''; });
  }
  function normalise() {
    var i = idx(), s = step();
    if (i < N) shift(N * s); else if (i >= 2 * N) shift(-N * s);
  }
  function goBy(d) { track.scrollTo({ left: (idx() + d) * step(), behavior: reduce ? 'auto' : 'smooth' }); if (reduce) normalise(); }
  function setPaused(v) {
    paused = v; box.classList.toggle('is-paused', v);
    pauses.forEach(function (b) { b.setAttribute('aria-label', v ? 'Play slides' : 'Pause slides'); });
    if (v) stop(); else start();
  }
  function stop() { clearInterval(timer); timer = null; }
  function start() {
    if (timer || paused || !inView) return;
    timer = setInterval(function () { goBy(1); }, 5000);
  }

  prev.addEventListener('click', function () { setPaused(true); goBy(-1); });
  next.addEventListener('click', function () { setPaused(true); goBy(1); });
  pauses.forEach(function (b) { b.addEventListener('click', function () { setPaused(!paused); }); });
  track.addEventListener('scroll', function () { clearTimeout(settleT); settleT = setTimeout(normalise, 120); }, { passive: true });
  ['pointerdown', 'touchstart', 'wheel'].forEach(function (ev) { track.addEventListener(ev, function () { if (!paused) setPaused(true); }, { passive: true }); });
  window.addEventListener('resize', function () { track.style.scrollSnapType = 'none'; track.scrollLeft = (idx() % N + N) * step(); requestAnimationFrame(function () { track.style.scrollSnapType = ''; }); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) start(); else stop(); }, { threshold: .6 }).observe(box);
  }
  box.classList.toggle('is-paused', paused);
  track.style.scrollSnapType = 'none'; track.scrollLeft = N * step(); requestAnimationFrame(function () { track.style.scrollSnapType = ''; });
})();


// HOME PAGE: customer reviews. A row of dog photos that loops; the photo in the middle (data-d="0") is in colour and its owner's review shows underneath.
// The photos are not clickable. AUTO-PLAY (the system rule): until the visitor uses an arrow or swipes, the middle photo moves to the next one every 3 seconds, first move 2 seconds after the row comes on screen; it runs only while the row is on screen, never with reduced motion, and stops for good after the first arrow press or swipe.
(function () {
  var box = document.getElementById('reviews');
  if (!box) return;
  var stage = box.querySelector('.reviews__stage');
  var cards = Array.prototype.slice.call(box.querySelectorAll('.rcard'));
  if (cards.length < 2) return;
  // copies of the cards, so there are always at least 9 in the row: the photo that goes from one end to the other then jumps far out of sight
  var real = cards.slice();
  while (cards.length < 9) { real.forEach(function (c) { var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); stage.appendChild(k); cards.push(k); }); }
  var N = cards.length;
  var quote = box.querySelector('.reviews__quote p'), who = box.querySelector('.reviews__quote figcaption');
  var cur = Math.floor(N / 2), touched = false, inView = false, timer = null, first = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function nb(t) { var i = t.lastIndexOf(' '); return i > 0 ? t.slice(0, i) + '\u00a0' + t.slice(i + 1) : t; } // last two words stay together
  function render() {
    cards.forEach(function (c, i) {
      var d = i - cur;
      if (d > N / 2) d -= N; else if (d < -N / 2) d += N;
      var nd = d > 3 ? 'far-r' : d < -3 ? 'far-l' : String(d);
      var was = c.dataset.d;
      if (was !== undefined && was !== nd) {
        var a = was === 'far-r' ? 4 : was === 'far-l' ? -4 : +was, b = nd === 'far-r' ? 4 : nd === 'far-l' ? -4 : +nd;
        // jumping from one end to the other (both ends are out of sight): no travelling across
        if (Math.abs(a - b) > 4) { c.classList.add('is-wrap'); c.dataset.d = nd; void c.offsetWidth; requestAnimationFrame(function () { c.classList.remove('is-wrap'); }); return; }
      }
      c.dataset.d = nd;
    });
    quote.textContent = nb(cards[cur].dataset.review || '');
    who.textContent = cards[cur].dataset.owner || '';
  }
  function go(i) { cur = ((i % N) + N) % N; render(); }
  function stop() { clearTimeout(first); clearInterval(timer); first = timer = null; }
  function start() {
    if (reduce || touched || !inView || timer || first) return;
    first = setTimeout(function () { first = null; go(cur + 1); timer = setInterval(function () { go(cur + 1); }, 3000); }, 2000);
  }
  function used() { touched = true; stop(); }
  box.querySelectorAll('[data-dir]').forEach(function (b) { b.addEventListener('click', function () { used(); go(cur + parseInt(b.dataset.dir, 10)); }); });
  var sx = null;
  stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 40) { used(); go(cur + (dx < 0 ? 1 : -1)); } }, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) start(); else stop(); }, { threshold: .6 }).observe(stage);
  }
  render();
})();
