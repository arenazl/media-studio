// MOCKUP REEL — genera el "boceto animado" (estilo public/bocetos/*.mp4) DESDE la metadata 1.2.
// Recrea el estilo editorial de marca (fondo + logo + badge de pantalla + titulo grande con palabra
// resaltada + barra de progreso + footer) por cada slide del mockup, animado con CSS keyframes, y lo
// graba a mp4 9:16 con Playwright (chrome headless) + ffmpeg. NO es screenshot ni dibujito: es la UI
// de marca recreada en codigo. Parametrico: sirve para cualquier app (sale del brand + slides del KB).

const PER_SLIDE = 3.4;   // fallback de segundos por slide (cuando el slide no trae durSec)
const FPS = 30;

// C10: duración de un slide = su `durSec` explícito (del storyboard) o el fallback fijo. Mata el 3.4s hardcodeado.
const durOf = (s) => { const d = Number(s?.durSec); return d > 0 ? d : PER_SLIDE; };

// dots/particulas del fondo, deterministas (sin Math.random, para que el render sea reproducible).
function dots(n = 26) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (i * 67) % 100;
    const y = (i * 39 + 13) % 100;
    const s = 2 + (i % 3);
    const d = (i % 7) * 0.4;
    const o = 0.15 + (i % 4) * 0.12;
    out += `<span class="dot" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;opacity:${o};animation-delay:${d}s"></span>`;
  }
  return out;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// parte el titulo en "antes" + ultima frase resaltada (lo que va subrayado en dorado).
function splitTitle(title, accent) {
  const t = String(title || '').trim();
  if (accent && t.toLowerCase().includes(String(accent).toLowerCase())) {
    const i = t.toLowerCase().lastIndexOf(String(accent).toLowerCase());
    return { head: t.slice(0, i).trim(), tail: t.slice(i).trim() };
  }
  const words = t.split(/\s+/);
  if (words.length <= 3) return { head: '', tail: t };
  const cut = Math.max(1, words.length - 2);
  return { head: words.slice(0, cut).join(' '), tail: words.slice(cut).join(' ') };
}

export function buildHtml({ brand = {}, slides = [], footer = '' } = {}) {
  const c = brand.colors || {};
  const navy = c.primary || c.ink || '#0b1c3f';
  const navy2 = c.secondary || '#0a1730';
  const gold = c.accent || '#d4a559';
  const logoSvg = brand.logo?.svg || '';
  const list = (slides.length ? slides : [{ badge: 'PANTALLA', title: 'Tu producto, claro', accent: 'claro' }]);
  // C10: cada slide corre su `durSec`; el offset (delay) es la suma de las duraciones anteriores.
  let acc = 0;
  const timed = list.map((s) => { const off = acc; const d = durOf(s); acc += d; return { s, off, d }; });

  const segs = timed.map(({ off, d }) =>
    `<span class="seg"><span class="fill" style="--off:${off.toFixed(2)}s;--dur:${d.toFixed(2)}s"></span></span>`).join('');

  const cards = timed.map(({ s, off, d }) => {
    const badge = esc(s.badge || s.screen || s.label || '');
    const { head, tail } = splitTitle(s.title || s.highlight || s.copy || '', s.accent || s.copy);
    return `<div class="slide" style="--off:${off.toFixed(2)}s;--dur:${d.toFixed(2)}s">
      ${badge ? `<div class="badge">${badge}</div>` : ''}
      <h1 class="title">${head ? `<span class="head">${esc(head)}</span> ` : ''}<span class="tail">${esc(tail)}</span></h1>
    </div>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;1,700&family=Inter:wght@600;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:1080px; height:1920px; overflow:hidden; }
    .stage { position:relative; width:1080px; height:1920px;
      background:radial-gradient(120% 80% at 78% 8%, ${navy} 0%, ${navy2} 55%, #060f24 100%);
      font-family:'Playfair Display',serif; color:#fff; }
    .glow { position:absolute; top:-180px; right:-120px; width:760px; height:620px;
      background:radial-gradient(closest-side, rgba(245,200,130,.20), transparent 70%); filter:blur(20px); }
    .dot { position:absolute; border-radius:50%; background:${gold};
      animation:tw 3.2s ease-in-out infinite; }
    @keyframes tw { 0%,100%{ transform:scale(.7); } 50%{ transform:scale(1.25); } }
    .progress { position:absolute; top:48px; left:64px; right:64px; display:flex; gap:10px; z-index:5; }
    .seg { flex:1; height:5px; border-radius:3px; background:rgba(255,255,255,.18); overflow:hidden; }
    .seg .fill { display:block; width:100%; height:100%; background:#fff; transform:translateX(-100%);
      animation:fill var(--dur,3.4s) linear forwards; animation-delay:var(--off,0s); }
    @keyframes fill { to { transform:translateX(0); } }
    .logo { position:absolute; top:120px; left:0; right:0; display:flex; justify-content:center; align-items:center;
      gap:16px; z-index:5; animation:logoIn 1s ease forwards; opacity:0; }
    @keyframes logoIn { to { opacity:1; } }
    .logo svg, .logo img { height:88px; width:auto; }
    .logo .wm { font-size:64px; font-weight:800; letter-spacing:.5px; }
    .slide { position:absolute; left:64px; right:64px; bottom:360px; opacity:0;
      animation:slideInOut var(--dur,3.4s) ease forwards; animation-delay:var(--off,0s); }
    @keyframes slideInOut {
      0% { opacity:0; transform:translateY(34px); }
      9% { opacity:1; transform:translateY(0); }
      86% { opacity:1; transform:translateY(0); }
      100% { opacity:0; transform:translateY(-20px); }
    }
    .badge { display:inline-block; padding:13px 30px; margin-bottom:34px; border:2px solid ${gold};
      border-radius:999px; color:${gold}; font-family:'Inter',sans-serif; font-weight:800;
      letter-spacing:.18em; font-size:26px; text-transform:uppercase; }
    .title { font-size:104px; line-height:1.04; font-weight:800; letter-spacing:-.5px; }
    .title .head { color:#fff; }
    .title .tail { color:${gold}; font-style:italic; border-bottom:7px solid ${gold}; padding-bottom:4px; }
    .footer { position:absolute; bottom:120px; left:0; right:0; text-align:center;
      font-family:'Inter',sans-serif; font-weight:600; font-size:30px; letter-spacing:.04em; color:rgba(255,255,255,.55); }
  </style></head><body>
    <div class="stage">
      <div class="glow"></div>
      ${dots()}
      <div class="progress">${segs}</div>
      <div class="logo">${logoSvg || `<span class="wm">${esc(brand.name || '')}</span>`}</div>
      ${cards}
      ${footer ? `<div class="footer">${esc(footer)}</div>` : ''}
    </div>
  </body></html>`;
}

export function reelDuration(slides = []) {
  const total = (slides || []).reduce((t, s) => t + durOf(s), 0);
  return Math.max(PER_SLIDE, total || PER_SLIDE);
}

// Graba el HTML animado a mp4 9:16. runFfmpeg lo inyecta index.mjs (mismo que /api/render).
export async function renderMockupReel(data, outPath, { runFfmpeg, tmpDir }) {
  const { chromium } = await import('playwright');
  const html = buildHtml(data);
  const total = reelDuration(data.slides || []);
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext({
      viewport: { width: 1080, height: 1920 },
      deviceScaleFactor: 1,
      recordVideo: { dir: tmpDir, size: { width: 1080, height: 1920 } },
    });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    // dar tiempo a que carguen las fuentes antes de que corran las animaciones
    try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch { /* noop */ }
    await page.waitForTimeout((total + 0.6) * 1000);
    const video = page.video();
    await context.close();           // finaliza y vuelca el .webm
    const webm = await video.path();
    await runFfmpeg(['-y', '-i', webm, '-t', total.toFixed(2),
      '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', String(FPS),
      '-vf', `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=${FPS}`,
      outPath]);
    return outPath;
  } finally {
    await browser.close();
  }
}
