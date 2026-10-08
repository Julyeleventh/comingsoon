/* ==========================================================================
   July Eleventh — Coming Soon: walking dogs along the bottom + gsap entrance
   gsap is loaded from assets/gsap.min.js (installed via npm, copied locally).
   ========================================================================== */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Walking dogs canvas ---------- */

const canvas = document.getElementById('crowd-canvas');
const ctx = canvas.getContext('2d');

// Canvas size follows the canvas element itself (not window.innerHeight, which
// jumps around on phones when the address bar shows/hides, and differs between
// Chrome and Safari). Drawn at device-pixel-ratio so it is sharp on phones.
let width = 0;
let height = 0;

function sizeCanvas() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = w;
  height = h;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

sizeCanvas();
if (window.ResizeObserver) {
  new ResizeObserver(sizeCanvas).observe(canvas);
} else {
  window.addEventListener('resize', sizeCanvas);
}

// Each dog is a horizontal strip of equal-width frames (all facing right).
// frames: 1 = single pose (gets a bounce), >1 = real walk cycle.
const DOG_SPRITES = [
  { src: 'assets/dog-walk.png', frames: 4, scale: 0.85 }, // black dog
  { src: 'assets/dog-walk-white.png', frames: 4, scale: 0.85 }, // white dog, same size as black
  { src: 'assets/dog-walk-dachshund.png', frames: 4, scale: 0.97 }, // long dog, scaled up to match visually
  { src: 'assets/dog-walk-golden.png', frames: 4, scale: 1.55 }, // golden retriever (flipped to face right)
  { src: 'assets/dog-walk-chihuahua.png', frames: 4, scale: 0.72 }, // chihuahua (flipped to face right)
  { src: 'assets/dog-walk-lab.png', frames: 4, scale: 1.46 }, // labrador, same rendered height as the golden
  { src: 'assets/dog-walk-frenchie.png', frames: 4, scale: 0.69 }, // french bulldog, same rendered height as the chihuahua
];

let loaded = 0;
DOG_SPRITES.forEach((s) => {
  s.img = new Image();
  s.img.onload = () => {
    s.fw = s.img.width / s.frames;
    s.fh = s.img.height;
    if (++loaded === DOG_SPRITES.length) start();
  };
  s.img.src = s.src;
});

function start() {
  // Dogs all walk the same direction at the same speed on a looping track, so
  // they stay evenly spaced and never bunch up or overlap. Each time a dog
  // loops back to the start it becomes the next breed in the list, so all
  // five breeds show up over time without crowding the screen.
  const MARGIN = 450;                       // off-screen buffer on each side
  const trackW = width + MARGIN * 2;
  // Dog size follows the window: 240px base on phones / small windows (the size
  // we tuned), growing gently on big screens but capped so dogs never get huge.
  // On phones (narrow screens) it scales down with the screen width so dogs stay
  // in proportion instead of filling the whole screen.
  const baseW = () =>
    width < 650
      ? Math.max(150, width * 0.37)
      : Math.min(300, Math.max(240, width * 0.17));
  const total = Math.max(3, Math.min(Math.floor(trackW / (2 * baseW())), 6));
  const spacing = trackW / total;
  const SPEED = 1.1;                        // px per frame, same for everyone
  let nextSprite = 0;
  const dogs = [];

  function assign(d) {
    d.sprite = DOG_SPRITES[nextSprite++ % DOG_SPRITES.length];
  }

  for (let i = 0; i < total; i++) {
    const d = {
      x: -MARGIN + spacing * i,
      offR: 0.17 + Math.random() * 0.13, // how much of the dog sinks below the bottom edge (feet cropped), as a share of its height
      speed: SPEED,
      direction: 1,
      phase: Math.random() * Math.PI * 2,
      stepMs: 130 + Math.random() * 30, // time per walk-cycle frame
    };
    assign(d);
    dogs.push(d);
  }

  function render(now) {
    ctx.clearRect(0, 0, width, height);

    dogs.forEach((d) => {
      if (!reduceMotion) {
        d.x += d.speed;
        if (d.x > width + MARGIN) {
          d.x -= width + MARGIN * 2; // current track length
          assign(d);
        }
      }

      const s = d.sprite;
      // size always follows the current window width, so every dog on every
      // round (and after any resize) is the same size
      d.w = baseW() * s.scale;
      const h = d.w * (s.fh / s.fw);
      let frame = 0;
      let bounce = 0;
      let sway = 0;
      if (!reduceMotion) {
        if (s.frames > 1) {
          frame = Math.floor((now + d.phase * 1000) / d.stepMs) % s.frames;
        } else {
          // Single-pose sprite: fake a trot with a small bounce and sway
          const t = now / 1000 * 6 * d.speed + d.phase;
          bounce = Math.abs(Math.sin(t)) * 8;
          sway = Math.sin(t) * 0.03;
        }
      }

      ctx.save();
      ctx.translate(d.x, height + d.offR * h - bounce);
      if (d.direction === -1) ctx.scale(-1, 1);
      ctx.rotate(sway);
      ctx.drawImage(s.img, frame * s.fw, 0, s.fw, s.fh, -d.w / 2, -h, d.w, h);
      ctx.restore();
    });

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

/* ---------- Entrance animation (gsap) ---------- */

if (window.gsap && !reduceMotion) {
  gsap.from(['.cs-logo', '.cs-title', '.cs-desc', '.cs-connect-title', '.cs-socials'], {
    y: 24,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.15,
  });
}
