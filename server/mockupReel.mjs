// MOCKUP REEL v5 — REPRODUCCIÓN FIEL AL ESTILO MUNIFY / TESORERÍA (100% vector svg + layout exacto)
import fs from 'fs';
import path from 'path';

const PER_SLIDE = 4.2;
const FPS = 30;

const durOf = (s) => { const d = Number(s?.durSec); return d > 0 ? d : PER_SLIDE; };

function dots(n = 32) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (i * 67 + 13) % 100;
    const y = (i * 39 + 23) % 100;
    const s = 3 + (i % 4);
    const d = (i % 8) * 0.45;
    const o = 0.2 + (i % 4) * 0.15;
    out += `<span class="dot" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;opacity:${o};animation-delay:${d}s"></span>`;
  }
  return out;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function resolveMediaDataUrl(src) {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src;
  let cleanPath = src.replace(/^file:\/\/\/?/, '');
  if (process.platform === 'win32') cleanPath = cleanPath.replace(/\//g, '\\');
  try {
    if (fs.existsSync(cleanPath)) {
      const ext = path.extname(cleanPath).toLowerCase();
      const mimeMap = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/mp4',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      };
      const mime = mimeMap[ext] || 'application/octet-stream';
      const buf = fs.readFileSync(cleanPath);
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
  } catch {
    /* fallback */
  }
  return src;
}

export function buildHtml({ brand = {}, slides = [], footer = '' } = {}) {
  const c = brand.colors || {};
  const primary = c.primary || '#7C3AED';
  const secondary = c.secondary || '#0c1527';
  const accent = c.accent || '#F59E0B';

  const list = slides.length ? slides : [
    { badge: 'CATEGORÍAS DE EVENTO', title: '¿Organizás un evento y nadie contesta?', subtitle: 'Cotizá directo con proveedores verificados.' }
  ];
  
  let acc = 0;
  const timed = list.map((s) => { const off = acc; const d = durOf(s); acc += d; return { s, off, d }; });

  const segs = timed.map(({ off, d }) =>
    `<span class="seg"><span class="fill" style="--off:${off.toFixed(2)}s;--dur:${d.toFixed(2)}s"></span></span>`).join('');

  const cards = timed.map(({ s, off, d }, i) => {
    const badge = esc(s.badge || s.screen || s.label || `PASO 0${i + 1}`);
    const title = esc(s.title || s.highlight || s.copy || '');
    const subtitle = esc(s.subtitle || s.description || s.creativeBrief || '');
    const rawSrc = s.image || s.archivoCaptura || s.video || s.url || '';
    const imgSrc = resolveMediaDataUrl(rawSrc);

    const isVideo = /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(rawSrc) || imgSrc.startsWith('data:video/');
    const mediaElement = isVideo
      ? `<video src="${imgSrc}" class="card-media" autoplay loop muted playsinline></video>`
      : imgSrc
      ? `<img src="${imgSrc}" class="card-media" alt="${badge}" />`
      : `<div class="card-fallback"><div class="fb-text">${badge}</div></div>`;

    return `<div class="slide" style="--off:${off.toFixed(2)}s;--dur:${d.toFixed(2)}s">
      <div class="card-container">
        <div class="ui-card">
          <div class="ui-card-body">
            ${mediaElement}
          </div>
        </div>
      </div>

      <div class="text-container">
        ${badge ? `<div class="pill-badge">${badge}</div>` : ''}
        <h1 class="serif-title">${title}</h1>
        ${subtitle ? `<p class="sub-copy">${subtitle}</p>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:1080px; height:1920px; overflow:hidden; background:#060a12; }
    .stage { position:relative; width:1080px; height:1920px;
      background: radial-gradient(110% 85% at 50% 15%, #162035 0%, #0a1120 50%, #03060c 100%);
      font-family:'Plus Jakarta Sans', sans-serif; color:#fff; overflow:hidden; }

    /* Partículas de fondo estilo Munify */
    .dot { position:absolute; border-radius:50%; background:#94a3b8; animation:tw 3.2s ease-in-out infinite; }
    @keyframes tw { 0%,100%{ transform:scale(.5); opacity:.1; } 50%{ transform:scale(1.3); opacity:.45; } }

    .ambient-glow-1 { position:absolute; top:-200px; left:50%; transform:translateX(-50%); width:950px; height:750px;
      background:radial-gradient(closest-side, rgba(124,58,237,.25), transparent 80%); filter:blur(80px); }
    .ambient-glow-2 { position:absolute; bottom:-180px; left:50%; transform:translateX(-50%); width:850px; height:650px;
      background:radial-gradient(closest-side, rgba(245,158,11,.15), transparent 80%); filter:blur(90px); }

    /* Historias / Progress Bar */
    .progress { position:absolute; top:44px; left:56px; right:56px; display:flex; gap:10px; z-index:20; }
    .seg { flex:1; height:5px; border-radius:3px; background:rgba(255,255,255,.16); overflow:hidden; }
    .seg .fill { display:block; width:100%; height:100%; background:${accent}; transform:translateX(-100%);
      animation:fill var(--dur,4s) linear forwards; animation-delay:var(--off,0s); }
    @keyframes fill { to { transform:translateX(0); } }

    /* Top Logo Identidad Oficial - Render Limpio Vectorial */
    .brand-header { position:absolute; top:85px; left:0; right:0; display:flex; justify-content:center; align-items:center; gap:16px; z-index:20; }
    .brand-icon { width:52px; height:52px; background:#7C3AED; border-radius:14px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 16px rgba(124,58,237,.4); }
    .brand-icon svg { width:32px; height:32px; fill:#fff; }
    .brand-title { font-family:'Instrument Serif', Georgia, serif; font-style:italic; font-size:46px; font-weight:600; color:#fff; letter-spacing:-0.5px; }
    .brand-title span { color:#A78BFA; font-weight:700; }

    /* Slide Keyframe Animation */
    .slide { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
      padding-top:100px; opacity:0; pointer-events:none;
      animation:slideInOut var(--dur,4s) cubic-bezier(.16,1,.3,1) forwards; animation-delay:var(--off,0s); }

    @keyframes slideInOut {
      0% { opacity:0; transform:scale(.94) translateY(35px); }
      8% { opacity:1; transform:scale(1) translateY(0); }
      88% { opacity:1; transform:scale(1) translateY(0); }
      100% { opacity:0; transform:scale(.96) translateY(-25px); }
    }

    /* MOCKUP CARD FLOATING (ESTILO TAL CUAL TESORERIA) */
    .card-container {
      perspective: 1200px; margin-top: 15px; margin-bottom: 45px;
    }
    .ui-card {
      width: 760px; height: 860px; background: #0f172a; border-radius: 32px;
      border: 1.5px solid rgba(255,255,255,.15);
      box-shadow: 0 45px 110px rgba(0,0,0,.8), 0 0 60px rgba(124,58,237,.25);
      overflow: hidden; display: flex; flex-direction: column;
    }
    .ui-card-body { flex: 1; position: relative; overflow: hidden; background: #020617; }
    .card-media {
      width: 100%; height: 100%; object-fit: cover; object-position: top; display: block;
      animation: smoothPan var(--dur,4s) ease-in-out infinite alternate;
    }
    @keyframes smoothPan {
      0% { transform: scale(1) translateY(0%); }
      100% { transform: scale(1.05) translateY(-10%); }
    }
    .card-fallback {
      width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: linear-gradient(135deg, rgba(124,58,237,.3) 0%, rgba(15,23,42,1) 100%);
      font-size: 32px; font-weight: 700; color: #fff;
    }

    /* COPIES INFERIORES EDITORIALES CON INSTRUMENT SERIF */
    .text-container {
      width: 920px; text-align: center; display: flex; flex-direction: column; align-items: center;
    }
    .pill-badge {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 10px 28px; margin-bottom: 22px; border-radius: 99px;
      background: rgba(16,36,52,.75); border: 1.5px solid rgba(45,212,191,.5);
      color: #2dd4bf; font-weight: 700; font-size: 19px; letter-spacing: .14em; text-transform: uppercase;
      backdrop-filter: blur(12px); box-shadow: 0 4px 20px rgba(0,0,0,.35);
    }
    .serif-title {
      font-family: 'Instrument Serif', Georgia, serif; font-style: italic;
      font-size: 82px; line-height: 1.08; font-weight: 400; color: #FFFFFF;
      text-shadow: 0 4px 24px rgba(0,0,0,0.7); margin-bottom: 12px;
    }
    .sub-copy {
      font-size: 27px; line-height: 1.35; color: rgba(255,255,255,0.75); max-width: 860px; font-weight: 500;
    }

    .footer { position:absolute; bottom:55px; left:0; right:0; text-align:center;
      font-weight:600; font-size:24px; letter-spacing:.04em; color:rgba(255,255,255,.45); }
  </style></head><body>
    <div class="stage">
      <div class="ambient-glow-1"></div>
      <div class="ambient-glow-2"></div>
      ${dots()}
      <div class="progress">${segs}</div>
      <div class="brand-header">
        <div class="brand-icon">
          <svg viewBox="0 0 100 100">
            <path d="M 22 18 Q 50 10 78 18 Q 80 24 50 26 Q 20 24 22 18 Z M 30 18 Q 50 15 70 18 Q 68 22 50 23 Q 32 22 30 18 Z" fill-rule="evenodd" />
            <path d="M 22 32 Q 50 25 78 32 Q 78 38 50 40 Q 22 38 22 32 Z M 30 32 Q 50 29 70 32 Q 68 36 50 37 Q 35 36 30 32 Z" fill-rule="evenodd" />
            <path d="M 25 46 Q 50 40 75 46 Q 75 51 50 53 Q 25 51 25 46 Z M 33 46 Q 50 43 67 46 Q 65 49 50 50 Q 35 49 33 46 Z" fill-rule="evenodd" />
            <path d="M 30 60 Q 50 54 70 60 Q 70 64 50 66 Q 30 64 30 60 Z M 37 60 Q 50 57 63 60 Q 61 63 50 63 Q 39 63 37 60 Z" fill-rule="evenodd" />
            <path d="M 36 73 Q 50 68 64 73 Q 64 77 50 78 Q 36 77 36 73 Z" fill-rule="evenodd" />
            <path d="M 44 84 Q 50 81 56 84 Q 54 88 50 89 Q 46 88 44 84 Z" fill-rule="evenodd" />
          </svg>
        </div>
        <div class="brand-title">sin vueltas <span>¡YA!</span></div>
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
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
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
    await runFfmpeg([
      '-y', '-i', webm, '-t', total.toFixed(2),
      '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', String(FPS),
      '-vf', `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=${FPS}`,
      outPath,
    ]);
    return outPath;
  } finally {
    await browser.close();
  }
}
