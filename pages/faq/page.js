// FAQ page. Desktop: the category list on the left switches the question group on the right.
// Phones (599px and below): each category is a row; its questions open right under it, one category at a time.
(function () {
  var list = document.querySelector('.sidetabs');
  var holder = document.querySelector('.faq__panels');
  var cats = Array.prototype.slice.call(document.querySelectorAll('.sidetab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.faq__panel'));
  var mq = window.matchMedia('(max-width: 599px)');
  function panelOf(c) { return document.getElementById(c.getAttribute('aria-controls')); }

  function show(id, push) {
    var c = document.getElementById('tab-' + id);
    if (!c) return;
    var toggleOff = mq.matches && c.classList.contains('is-active');
    cats.forEach(function (x) {
      var on = x === c && !toggleOff, p = panelOf(x), was = !p.hidden;
      x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); x.setAttribute('aria-expanded', on);
      if (mq.matches && push && window.siteSlide && was !== on) {   // phones: slide the category open or shut (same effect as every other open/close)
        if (on) { p.hidden = false; window.siteSlide(p, true); }
        else { window.siteSlide(p, false, null, function () { p.hidden = true; }); }
      } else { p.hidden = !on; }
    });
    if (push) history.replaceState(null, '', toggleOff ? location.pathname : '#' + id);
  }
  cats.forEach(function (c) { c.addEventListener('click', function () { show(c.id.replace('tab-', ''), true); }); });

  function layout() {
    if (mq.matches) {
      // phones: panel sits under its own category; all closed unless the address names one
      cats.forEach(function (c) { c.insertAdjacentElement('afterend', panelOf(c)); c.setAttribute('aria-expanded', 'false'); });
      list.removeAttribute('aria-orientation');
      cats.forEach(function (c) { c.classList.remove('is-active'); c.setAttribute('aria-selected', 'false'); panelOf(c).hidden = true; });
      if (location.hash && document.getElementById('tab-' + location.hash.slice(1))) show(location.hash.slice(1), false);
    } else {
      panels.forEach(function (p) { holder.appendChild(p); });
      list.setAttribute('aria-orientation', 'vertical');
      var id = (location.hash && document.getElementById('tab-' + location.hash.slice(1))) ? location.hash.slice(1) : 'ordering';
      cats.forEach(function (c) { c.removeAttribute('aria-expanded'); });
      show(id, false);
    }
  }
  layout();
  if (mq.addEventListener) mq.addEventListener('change', layout); else mq.addListener(layout);
})();
