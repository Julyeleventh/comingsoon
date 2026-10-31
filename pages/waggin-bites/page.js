// Waggin' Bites only
// Ingredient tabs: swap the one-line caption (copy is a placeholder until confirmed).
(function () {
  var copy = {
    base: 'Pick the meat that suits your dog.',
    filling: 'Real freeze-dried strawberry, blueberry and pumpkin, mixed through every piece.',
    color: 'Five colours, each from a different plant powder.',
    others: 'A light dusting of goat milk powder on top.'
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

// Wrapped product card: Chicken / Rabbit selector. Rabbit is not launched yet, so it shows a coming-soon card.
(function(){
  var wrap=document.querySelector('.wrapped__tabs');
  var txt=document.querySelector('.wrapped__prodtxt');
  if(!wrap||!txt)return;
  var p=txt.querySelector('p'),price=txt.querySelector('.wrapped__price');
  var card=document.querySelector('.wrapped__prod');var soon=txt.querySelector('.prodsoon'),badge=txt.querySelector('.prodbadge'),bimg=badge.querySelector('img');
  var data={
    chicken:{desc:p.textContent,price:price.innerHTML,color:'var(--chicken-500)',icon:'assets/icons/icon-chicken.svg?v=6'},
    rabbit:{desc:"Real rabbit meat, goat cheese, goat milk powder, oats and freeze-dried fruit.",price:price.innerHTML,soon:true,color:'var(--rabbit-500)',icon:'assets/icons/icon-rabbit-badge.svg?v=6'}
  };
  function lock(){if(card.classList.contains('is-soon'))return;card.style.minHeight='';card.style.minHeight=card.offsetHeight+'px';}
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(lock);}
  window.addEventListener('load',lock);window.addEventListener('resize',lock);
  wrap.addEventListener('click',function(e){
    var b=e.target.closest('.mtab');if(!b)return;
    e.preventDefault();
    wrap.querySelectorAll('.mtab').forEach(function(t){var on=t===b;t.classList.toggle('is-active',on);t.setAttribute('aria-selected',on?'true':'false');});
    var d=data[b.dataset.meat];p.textContent=d.desc;price.hidden=!!d.soon;
    badge.style.setProperty('--c',d.color);bimg.src=d.icon;soon.hidden=!d.soon;card.classList.toggle('is-soon',!!d.soon);
  });
})();
