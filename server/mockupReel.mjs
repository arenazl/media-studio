// MOCKUP REEL v2 — genera el "boceto animado" con MOCKUPS 3D DE DISPOSITIVO (estilo public/bocetos/tesoreria.mp4).
// Incorpora las CAPTURAS REALES del Media Kit dentro de marcos de pantalla (browser / mobile frame) con
// paneo suave (scroll fluido), glassmorphism, tipografía de marca y logotipo.
// Grabación a mp4 9:16 mediante Playwright (chrome headless) + ffmpeg.

const PER_SLIDE = 4.0;
const FPS = 30;

const durOf = (s) => { const d = Number(s?.durSec); return d > 0 ? d : PER_SLIDE; };

function dots(n = 26) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (i * 67) % 100;
    const y = (i * 39 + 13) % 100;
    const s = 3 + (i % 3);
    const d = (i % 7) * 0.4;
    const o = 0.15 + (i % 4) * 0.12;
    out += `<span class="dot" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;opacity:${o};animation-delay:${d}s"></span>`;
  }
  return out;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
  const navy2 = c.secondary || '#071226';
  const gold = c.accent || '#d4a559';
  const logoSvg = brand.logo?.svg || '';
  const logoUrl = brand.logoUrl || brand.logo?.primary || '';

  const list = slides.length ? slides : [{ badge: 'SIN VUELTAS ¡YA!', title: 'Cotizá tu evento de forma transparente', accent: 'transparente' }];
  let acc = 0;
  const timed = list.map((s) => { const off = acc; const d = durOf(s); acc += d; return { s, off, d }; });

  const segs = timed.map(({ off, d }) =>
    `<span class="seg"><span class="fill" style="--off:${off.toFixed(2)}s;--dur:${d.toFixed(2)}s"></span></span>`).join('');

  const cards = timed.map(({ s, off, d }, i) => {
    const badge = esc(s.badge || s.screen || s.label || `PANTALLA 0${i + 1}`);
    const { head, tail } = splitTitle(s.title || s.highlight || s.copy || '', s.accent || s.copy);
    const imgSrc = s.image || s.archivoCaptura || s.url || '';

    return `<div class="slide" style="--off:${off.toFixed(2)}s;--dur:${d.toFixed(2)}s">
      <div class="device-mockup">
        <div class="device-bar">
          <span class="dot-btn red"></span>
          <span class="dot-btn yellow"></span>
          <span class="dot-btn green"></span>
          <span class="device-url">${badge.toLowerCase()}.sinvueltasya.com.ar</span>
        </div>
        <div class="device-body">
          ${imgSrc ? `<img src="${imgSrc}" class="device-img" alt="${badge}" />` : `<div class="device-fallback">${badge}</div>`}
        </div>
      </div>

      <div class="content-box">
        ${badge ? `<div class="badge">${badge}</div>` : ''}
        <h1 class="title">${head ? `<span class="head">${esc(head)}</span> ` : ''}<span class="tail">${esc(tail)}</span></h1>
      </div>
    </div>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;600;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:1080px; height:1920px; overflow:hidden; background:#040a17; }
    .stage { position:relative; width:1080px; height:1920px;
      background:radial-gradient(130% 90% at 50% 10%, ${navy} 0%, ${navy2} 60%, #030812 100%);
      font-family:'Sora','Inter',sans-serif; color:#fff; overflow:hidden; }
    .glow-1 { position:absolute; top:-200px; left:50%; transform:translateX(-50%); width:900px; height:800px;
      background:radial-gradient(closest-side, rgba(212,165,89,.22), transparent 75%); filter:blur(40px); }
    .glow-2 { position:absolute; bottom:-200px; left:50%; transform:translateX(-50%); width:800px; height:700px;
      background:radial-gradient(closest-side, color-mix(in srgb, ${gold} 25%, transparent), transparent 75%); filter:blur(50px); }
    .dot { position:absolute; border-radius:50%; background:${gold}; animation:tw 3.5s ease-in-out infinite; }
    @keyframes tw { 0%,100%{ transform:scale(.6); opacity:.2; } 50%{ transform:scale(1.3); opacity:.6; } }

    .progress { position:absolute; top:44px; left:56px; right:56px; display:flex; gap:8px; z-index:10; }
    .seg { flex:1; height:6px; border-radius:3px; background:rgba(255,255,255,.15); overflow:hidden; }
    .seg .fill { display:block; width:100%; height:100%; background:${gold}; transform:translateX(-100%);
      animation:fill var(--dur,4s) linear forwards; animation-delay:var(--off,0s); }
    @keyframes fill { to { transform:translateX(0); } }

    .logo-bar { position:absolute; top:80px; left:0; right:0; display:flex; justify-content:center; align-items:center;
      gap:16px; z-index:10; }
    .logo-bar img, .logo-bar svg { height:76px; width:auto; filter:drop-shadow(0 4px 12px rgba(0,0,0,.4)); }
    .logo-bar .brand-text { font-size:44px; font-weight:800; color:#fff; letter-spacing:-.5px; }

    .slide { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
      padding-top:200px; opacity:0; pointer-events:none;
      animation:slideInOut var(--dur,4s) cubic-bezier(.16,1,.3,1) forwards; animation-delay:var(--off,0s); }

    @keyframes slideInOut {
      0% { opacity:0; transform:scale(.94) translateY(40px); }
      8% { opacity:1; transform:scale(1) translateY(0); }
      88% { opacity:1; transform:scale(1) translateY(0); }
      100% { opacity:0; transform:scale(.96) translateY(-30px); }
    }

    /* MOCKUP 3D DE DISPOSITIVO */
    .device-mockup {
      width: 920px; height: 980px; background: #0f172a; border-radius: 28px;
      border: 1px solid rgba(255,255,255,.2);
      box-shadow: 0 40px 120px rgba(0,0,0,.7), 0 0 60px rgba(212,165,89,.22);
      overflow: hidden; display: flex; flex-direction: column;
      transform: perspective(1200px) rotateX(4deg);
      transition: transform .5s ease;
    }
    .device-bar {
      height: 48px; background: #1e293b; border-bottom: 1px solid rgba(255,255,255,.1);
      display: flex; align-items: center; padding: 0 18px; gap: 8px;
    }
    .dot-btn { width: 12px; height: 12px; border-radius: 50%; }
    .dot-btn.red { background: #ef4444; }
    .dot-btn.yellow { background: #f59e0b; }
    .dot-btn.green { background: #10b981; }
    .device-url {
      margin-left: 12px; font-size: 14px; color: rgba(255,255,255,.6); font-family:'Inter',sans-serif;
      background: rgba(0,0,0,.3); padding: 4px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,.05);
    }

    .device-body { flex: 1; position: relative; overflow: hidden; background: #020617; }
    .device-img {
      width: 100%; height: auto; display: block;
      animation: panScroll var(--dur,4s) ease-in-out infinite alternate;
    }
    @keyframes panScroll {
      0% { transform: translateY(0%) scale(1); }
      100% { transform: translateY(-18%) scale(1.05); }
    }
    .device-fallback {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      font-size: 32px; font-weight: 700; color: rgba(255,255,255,.4);
    }

    /* COPY INFERIOR */
    .content-box {
      width: 920px; margin-top: 60px; text-align: center; display: flex; flex-direction: column; align-items: center;
    }
    .badge {
      display: inline-block; padding: 10px 24px; margin-bottom: 20px; border: 2px solid ${gold};
      border-radius: 999px; color: ${gold}; font-family: 'Inter',sans-serif; font-weight: 800;
      letter-spacing: .15em; font-size: 22px; text-transform: uppercase;
      background: rgba(212,165,89,.1); backdrop-filter: blur(10px);
    }
    .title { font-size: 68px; line-height: 1.12; font-weight: 800; letter-spacing: -.5px; }
    .title .head { color: #fff; }
    .title .tail { color: ${gold}; font-style: italic; border-bottom: 5px solid ${gold}; padding-bottom: 2px; }

    .footer { position:absolute; bottom:60px; left:0; right:0; text-align:center;
      font-family:'Inter',sans-serif; font-weight:600; font-size:26px; letter-spacing:.04em; color:rgba(255,255,255,.6); }
  </style></head><body>
    <div class="stage">
      <div class="glow-1"></div>
      <div class="glow-2"></div>
      ${dots()}
      <div class="progress">${segs}</div>
      <div class="logo-bar">
        ${logoSvg || (logoUrl ? `<img src="${logoUrl}" alt="logo" />` : `<span class="brand-text">${esc(brand.name || '')}</span>`)}
      </div>
      ${cards}
      ${footer ? `<div class="footer">${esc(footer)}</div>` : ''}
    </div>
  </body></html>`;
}

export function reelDuration(slides = []) {
  const total = (slides || []).reduce((t, s) => t + durOf(s), 0);
  return Math.max(PER_SLIDE, total || PER_SLIDE);
}

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
    try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch { /* noop */ }
    await page.waitForTimeout((total + 0.6) * 1000);
    const video = page.video();
    await context.close();
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
