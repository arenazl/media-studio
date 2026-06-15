// Extrae N frames (thumbnails) de un video buscando a tiempos repartidos y
// dibujando a un canvas. Sirve para mostrar los slides reales del boceto del reel
// como imágenes (en vez de placeholders). El video tiene que ser same-origin
// (o con CORS) para no "tintar" el canvas; los bocetos viven en /public.
export async function extractFrames(url: string, count: number, w = 90, h = 160): Promise<string[]> {
  if (!url || count <= 0) return [];
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.muted = true; v.preload = 'auto'; v.crossOrigin = 'anonymous'; v.src = url;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const out: string[] = [];
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(out); } };

    v.addEventListener('error', finish, { once: true });
    v.addEventListener('loadedmetadata', async () => {
      const dur = v.duration && isFinite(v.duration) ? v.duration : 0;
      if (!dur || !ctx) { finish(); return; }
      for (let i = 0; i < count; i++) {
        const t = ((i + 0.5) / count) * dur;
        const ok = await seekTo(v, t);
        if (!ok) break;
        try { ctx.drawImage(v, 0, 0, w, h); out.push(canvas.toDataURL('image/jpeg', 0.72)); }
        catch { /* canvas tinted o seek incompleto */ break; }
      }
      finish();
    }, { once: true });
  });
}

function seekTo(v: HTMLVideoElement, t: number): Promise<boolean> {
  return new Promise((res) => {
    let settled = false;
    const ok = () => { if (!settled) { settled = true; res(true); } };
    const fail = () => { if (!settled) { settled = true; res(false); } };
    v.addEventListener('seeked', ok, { once: true });
    v.addEventListener('error', fail, { once: true });
    try { v.currentTime = t; } catch { fail(); }
    window.setTimeout(ok, 2500); // anti-cuelgue si 'seeked' no dispara
  });
}
