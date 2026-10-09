// Render del comercial con Remotion (motor v2): empaqueta la composición compartida (src/remotion), la
// renderiza cuadro por cuadro en Chrome sin ventana y normaliza el volumen al estándar de las redes.
// El plan viaja como está (semántico); la derivación a cuadros ocurre adentro de la composición, igual
// que en la vista previa del front. Las URLs se resuelven contra `base` (este mismo servidor).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { bundle } from '@remotion/bundler';
import { ensureBrowser, renderMedia, selectComposition } from '@remotion/renderer';

let bundlePromise = null;
let bundleStamp = 0;

// última modificación bajo las carpetas que entran al bundle: si cambió el código, se vuelve a empaquetar.
function ultimaModificacion(dir) {
  let max = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    max = Math.max(max, e.isDirectory() ? ultimaModificacion(p) : fs.statSync(p).mtimeMs);
  }
  return max;
}

async function obtenerBundle(root, log) {
  const stamp = Math.max(ultimaModificacion(path.join(root, 'src/remotion')), ultimaModificacion(path.join(root, 'src/lib')));
  if (!bundlePromise || stamp > bundleStamp) {
    bundleStamp = stamp;
    const t0 = Date.now();
    bundlePromise = bundle({ entryPoint: path.join(root, 'src/remotion/index.ts'), onProgress: () => {} })
      .then((url) => { log(`bundle listo en ${((Date.now() - t0) / 1000).toFixed(1)} s`); return url; })
      .catch((e) => { bundlePromise = null; throw e; });
  }
  return bundlePromise;
}

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let err = '';
    proc.stderr.on('data', (d) => (err += d));
    proc.on('error', (e) => reject(new Error(`no se pudo lanzar ffmpeg: ${e.message}`)));
    proc.on('close', (code) => (code === 0 ? resolve(err) : reject(new Error(`ffmpeg exit ${code}: ${err.slice(-500)}`))));
  });
}

// loudnorm en dos pasadas (I=-14 LUFS, TP=-1.5) + limitador: sin el limitador la ganancia lineal deja picos a 0 dBFS.
export async function normalizarVolumen(input, output) {
  const med = await ffmpeg(['-hide_banner', '-i', input, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']);
  const m = /\{[\s\S]*\}/.exec(med);
  const j = m ? JSON.parse(m[0]) : null;
  const af = j
    ? `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,alimiter=limit=0.84:attack=5:release=60:level=false`
    : 'loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84:attack=5:release=60:level=false';
  await ffmpeg(['-y', '-i', input, '-c:v', 'copy', '-af', af, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', output]);
}

// Renderiza una composición del bundle. `normalizar: false` para composiciones sin audio (los mockups): ahí sólo
// se mueve el moov al principio para que el navegador arranque rápido.
async function renderComposicion({ id, inputProps, root = process.cwd(), log = () => {}, normalizar = true }) {
  const [serveUrl] = await Promise.all([obtenerBundle(root, log), ensureBrowser()]);
  const composition = await selectComposition({ serveUrl, id, inputProps });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ms-remotion-'));
  const raw = path.join(tmp, 'raw.mp4');
  const out = path.join(tmp, 'out.mp4');
  const t0 = Date.now();
  await renderMedia({
    composition, serveUrl, inputProps,
    codec: 'h264', crf: 18, audioCodec: 'aac', imageFormat: 'jpeg', jpegQuality: 90,
    outputLocation: raw,
  });
  log(`${id}: ${composition.durationInFrames} cuadros en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (normalizar) await normalizarVolumen(raw, out);
  else await ffmpeg(['-y', '-i', raw, '-c', 'copy', '-movflags', '+faststart', out]);
  const buffer = fs.readFileSync(out);
  fs.rmSync(tmp, { recursive: true, force: true });
  return { buffer, durationSec: composition.durationInFrames / composition.fps };
}

// Comercial (línea Flow / montaje): clips + voz + música → con normalización de volumen.
export async function renderRemotion(plan, { port, root, log } = {}) {
  return renderComposicion({ id: 'Comercial', inputProps: { plan, base: `http://localhost:${port}` }, root, log, normalizar: true });
}

// Mockups (línea animada): sólo imagen; la voz y la música las pone el paso Montaje.
export async function renderMockups(plan, { port, root, log } = {}) {
  return renderComposicion({ id: 'Mockups', inputProps: { plan, base: `http://localhost:${port}` }, root, log, normalizar: false });
}
