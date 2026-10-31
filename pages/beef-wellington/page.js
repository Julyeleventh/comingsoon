// Beef Wellington only
// Ingredient tabs: swap the one-line caption (copy is a placeholder until confirmed).
(function () {
  var copy = {
    base: 'A wheat-free pastry made from egg, oat flour and coconut oil.',
    filling: 'Lean eye round beef with a rich mushroom purée layer and goat milk powder.'
  };
  var tabs = document.querySelectorAll('.ingredients .tab');
  var sub = document.getElementById('tabSub');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (o) {
        var on = o === t;
        o.classList.toggle('is-active', on);
        o.setAttribute('aria-selected', on);
      });
      sub.textContent = copy[t.dataset.tab];
      document.querySelectorAll('.tagset').forEach(function (g) {
        var on = g.dataset.set === t.dataset.tab;
        g.hidden = !on;
        if (!on) g.querySelectorAll('.tag.is-open').forEach(function (x) { x.classList.remove('is-open'); x.querySelector('.tag__head').setAttribute('aria-expanded', 'false'); });
      });
    });
  });
})();

// Wrapped video: load and play only once the section is near the viewport (poster shows until then).
(function(){
  var v=document.querySelector('.wrapped__video[data-src]');
  if(!v)return;
  var started=false;
  function start(){
    if(started)return;started=true;
    v.src=(window.matchMedia('(max-width:599px)').matches&&v.dataset.srcSm)?v.dataset.srcSm:v.dataset.src;
    v.muted=true;
    var p=v.play();if(p&&p.catch)p.catch(function(){});
  }
  if(!('IntersectionObserver' in window)){start();return;}
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){start();io.disconnect();}});
  },{rootMargin:'300px 0px'});
  io.observe(v);
})();
