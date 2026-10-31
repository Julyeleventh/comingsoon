// Contact form: the field checks, error messages under each field and the inactive Submit button come from core.js (<form data-form>).
// This script only sends the message. While action is "#" nothing is sent (look-only); set it to the form service URL to go live.
(function () {
  var f = document.querySelector('.contact__form'); if (!f) return;
  var thanks = f.querySelector('.contact__thanks'), err = f.querySelector('.contact__error'), btn = f.querySelector('button[type="submit"]');
  function say(msg) { err.textContent = msg || ''; err.hidden = !msg; if (msg) err.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  function done() { thanks.hidden = false; f.siteReset(); if (window.grecaptcha && grecaptcha.reset) grecaptcha.reset(); f.siteUpdate(); }
  f.addEventListener('submit', function (e) {
    e.preventDefault(); say(''); thanks.hidden = true;
    var bad = f.siteValidate();
    if (bad) { f.siteAnchor(bad); return; }
    var url = f.getAttribute('action');
    if (!url || url === '#') { done(); return; }
    btn.disabled = true;
    fetch(url, { method: 'POST', body: new FormData(f), headers: { 'Accept': 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(); done(); })
      .catch(function () { say('Sorry, something went wrong. Please email us at hello@julyeleventh.ca.'); f.siteUpdate(); });
  });
})();
