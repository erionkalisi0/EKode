/* EKODE — Digital, beyond ordinary
   Scripts: scroll reveal → preview scaling → dashboard → hero torus */

/* ============================================================
   1. SCROLL REVEAL
   Adds `.in` to elements the first time they enter the viewport.
   ============================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.15 }
);

document
  .querySelectorAll('.rv, .ln, .thumb')
  .forEach((el) => revealObserver.observe(el));


/* ============================================================
   2. PROJECT PREVIEW SCALING
   Previews are authored at 624px wide and scaled to fit the card.
   ============================================================ */
function fitPreviews() {
  document.querySelectorAll('.thumb').forEach((thumb) => {
    thumb.style.setProperty('--s', thumb.clientWidth / 624);
  });
}

fitPreviews();
addEventListener('resize', fitPreviews);


/* ============================================================
   3. ORBIT DASHBOARD
   ============================================================ */

/* 3a. Cash-flow chart: gridlines + animated bars */
const cashFlow = document.getElementById('cf');
const barHeights = [20.3, 27.3, 23.8, 37.1, 28.7, 45.5, 40.6, 55.3, 43.4, 58.8, 51.1, 65.8];

[45, 65, 85, 105].forEach((y) => {
  const line = document.createElement('div');
  line.style.cssText = `left:14px;top:${y}px;width:214px;height:1px;background:#26314a`;
  cashFlow.prepend(line);
});

barHeights.forEach((height, i) => {
  const bar = document.createElement('div');
  const isLast = i === barHeights.length - 1;
  bar.className = 'bar';
  bar.style.cssText = `
    --i:${i};
    left:${17 + i * 18}px;
    top:${115 - height}px;
    width:10px;
    height:${height}px;
    border-radius:2px;
    background:${isLast ? '#a8c2ff' : '#3d64f5'}`;
  cashFlow.appendChild(bar);
});

/* 3b. Balance count-up (runs once when visible) */
const balance = document.getElementById('bal');
const BALANCE_TARGET = 84250;
let balanceStarted = false;

function countUp(now, start) {
  const progress = Math.min(1, (now - start) / 1600);
  const eased = 1 - Math.pow(1 - progress, 3);
  balance.textContent =
    '$' +
    (BALANCE_TARGET * eased).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (progress < 1) requestAnimationFrame((t) => countUp(t, start));
}

new IntersectionObserver((entries) => {
  if (!entries[0].isIntersecting || balanceStarted) return;
  balanceStarted = true;
  const start = performance.now();
  countUp(start, start);
}).observe(balance);


/* ============================================================
   4. HERO TORUS (canvas wireframe)
   58 meridians + 16 latitudes, slowly rotating, eased toward the pointer.
   ============================================================ */
const canvas = document.getElementById('torus');
const ctx = canvas.getContext('2d');

const MAJOR_RADIUS = 1;
const MINOR_RADIUS = 0.42;
const MERIDIANS = 58;
const LATITUDES = 16;
const SEGMENTS = 70;

let pointerX = 0, pointerY = 0;   // raw pointer position (-0.5 … 0.5)
let tiltX = 0, tiltY = 0;         // eased values used for drawing

addEventListener('pointermove', (e) => {
  pointerX = e.clientX / innerWidth - 0.5;
  pointerY = e.clientY / innerHeight - 0.5;
});

/* Point on the torus at angles (u, v), rotated by (a, b) */
function torusPoint(u, v, a, b) {
  const ring = MAJOR_RADIUS + MINOR_RADIUS * Math.cos(v);
  const x = ring * Math.cos(u);
  const y = ring * Math.sin(u);
  const z = MINOR_RADIUS * Math.sin(v);

  const y1 = y * Math.cos(a) - z * Math.sin(a);
  const z1 = y * Math.sin(a) + z * Math.cos(a);

  return [
    x * Math.cos(b) + z1 * Math.sin(b),
    y1,
    -x * Math.sin(b) + z1 * Math.cos(b),
  ];
}

function drawFrame(time) {
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  tiltX += (pointerX - tiltX) * 0.05;
  tiltY += (pointerY - tiltY) * 0.05;

  const a = 1.05 + tiltY * 0.8;
  const b = time * 0.00022 + tiltX * 1.2;
  const scale = width * 0.285;
  const cx = width * 0.52;
  const cy = height * 0.5;

  /* Strokes one closed curve; `point(t)` returns a rotated 3D point */
  const strokeCurve = (point, color) => {
    ctx.beginPath();
    for (let i = 0; i <= SEGMENTS; i++) {
      const p = point((i / SEGMENTS) * Math.PI * 2);
      const px = cx + p[0] * scale;
      const py = cy + p[1] * scale;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  ctx.lineWidth = 1.6;

  for (let m = 0; m < MERIDIANS; m++) {
    const u = (m / MERIDIANS) * Math.PI * 2;
    const depth = torusPoint(u, 0, a, b)[2];
    const alpha = 0.35 + (0.4 * (depth + 1.4)) / 2.8;
    strokeCurve((v) => torusPoint(u, v, a, b), `rgba(70,110,255,${alpha})`);
  }

  for (let l = 0; l < LATITUDES; l++) {
    const v = (l / LATITUDES) * Math.PI * 2;
    const alpha = 0.4 + 0.35 * Math.sin(v + b * 2) * 0.5 + 0.2;
    strokeCurve((u) => torusPoint(u, v, a, b), `rgba(90,130,255,${alpha})`);
  }

  requestAnimationFrame(drawFrame);
}

requestAnimationFrame(drawFrame);
