// RENDER v1.5 del comercial (mp4) desde un MontajePlan (WO-K5).
// Nuevas capacidades v1.5:
//   1. Capturas del Media Kit: zoompan (Ken Burns suave) sesgado hacia `zonaClave`.
//   2. Copy en pantalla: usa `dialogo` (la narración) — NUNCA la dirección técnica (`accion`).
//   3. TTS de narración: genera locución local (ElevenLabs) por escena y extiende la escena si la voz dura más.
//   4. Normalización de loudness: ffmpeg `loudnorm` (target I=-16 LUFS, mean > -22dB), matando el bug mudo de -30dB.
//   5. Logo estancado visible: convierte SVG a PNG si hace falta y lo superpone con safe-area.
//   6. Retrocompatibilidad dura: piezas legacy sin kit/capturas renderizan byte-comparable al actual.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveKitFile, MEDIA_KIT_ROOT } from './mediaKit.mjs';

const scaleCrop = (w, h, fps) =>
  `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},fps=${fps},setsar=1`;
const AF = 'aformat=sample_rates=44100:channel_layouts=stereo';
const ms = (s) => Math.round(s * 1000);
const CUT_DUR = 0.03, XFADE_DUR = 0.4, DUCK_GAIN = 0.4;
const XFADE_MAP = { fade: 'fade', crossfade: 'dissolve', wipe: 'wipeleft', zoom: 'zoomin', cut: 'fade' };
const trDur = (tr) => (!tr || tr === 'cut' ? CUT_DUR : XFADE_DUR);
const dur = (s) => Math.max(0, (Number(s.out) || 0) - (Number(s.in) || 0));

export function sceneStarts(scenes) {
  const starts = []; let t = 0;
  scenes.forEach((s, i) => { starts.push(t); t += dur(s) - (i < scenes.length - 1 ? trDur(s.transition) : 0); });
  return starts;
}

export function totalDuration(scenes) {
  return scenes.reduce((t, s, i) => t + dur(s) - (i < scenes.length - 1 ? trDur(s.transition) : 0), 0);
}

function mergeRanges(ranges) {
  const sorted = ranges.filter((r) => r[1] > r[0]).sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else out.push([r[0], r[1]]);
  }
  return out;
}

export function duckRanges(scenes, starts, voice, voiceDur) {
  const ranges = [];
  scenes.forEach((s, i) => { if (s.audio === 'keep' && s.dialogo && String(s.dialogo).trim()) ranges.push([starts[i], starts[i] + dur(s)]); });
  if (voice) ranges.push([voice.at || 0, (voice.at || 0) + (voiceDur || 0)]);
  return mergeRanges(ranges);
}

export function silenceRanges(plan, scenes, starts) {
  const startDe = new Map(scenes.map((s, i) => [s.escenaN, starts[i]]));
  const out = [];
  for (const sil of plan.silences || []) {
    const st = startDe.get(sil.antesDeEscena);
    if (st != null) out.push([Math.max(0, st - (sil.durSec || 0)), st]);
  }
  return out;
}

async function downloadTo(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`no se pudo bajar el asset (${r.status})`);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

export async function resolveSrc(src, storageDir, tmpDir, tag, mediaKitId = null) {
  if (!src) return null;
  if (/^data:/.test(src)) {
    const m = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(src);
    if (!m) throw new Error('dataURL de asset inválida');
    const ext = ((m[1] || '').split('/')[1] || 'bin').replace(/[^a-z0-9]+/gi, '') || 'bin';
    const dest = path.join(tmpDir, `data-${tag}.${ext}`);
    fs.writeFileSync(dest, m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]), 'utf8'));
    return dest;
  }
  if (/^https?:\/\//.test(src)) {
    const m = src.match(/\/api\/media-kit\/([^/]+)\/file\/(.+)$/);
    if (m) {
      const kitId = decodeURIComponent(m[1]);
      const rel = decodeURIComponent(m[2]);
      const r = resolveKitFile(kitId, rel, MEDIA_KIT_ROOT);
      if (r.ok) return r.file;
    }
    const dest = path.join(tmpDir, `dl-${tag}-${path.basename(src.split('?')[0]) || 'a'}`);
    await downloadTo(src, dest);
    return dest;
  }
  if (mediaKitId) {
    const r = resolveKitFile(mediaKitId, src, MEDIA_KIT_ROOT);
    if (r.ok) return r.file;
  }
  const local = path.join(storageDir, src);
  if (fs.existsSync(local)) return local;
  if (fs.existsSync(src)) return src;
  return null;
}

// Convierte un SVG a PNG transparente usando Playwright para que ffmpeg lo renderice correctamente
async function ensurePngLogo(resolvedFile, tmpDir) {
  if (!resolvedFile || !fs.existsSync(resolvedFile)) return null;
  if (resolvedFile.endsWith('.svg')) {
    const destPng = path.join(tmpDir, `logo-${Date.now()}.png`);
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ args: ['--no-sandbox'] });
      try {
        const page = await browser.newPage({ viewport: { width: 500, height: 500 } });
        const svgContent = fs.readFileSync(resolvedFile, 'utf8');
        await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:transparent;display:flex;align-items:center;justify-content:center;">${svgContent}</body></html>`);
        await page.waitForTimeout(100);
        const svgEl = await page.$('svg');
        if (svgEl) {
          await svgEl.screenshot({ path: destPng, omitBackground: true });
        } else {
          await page.screenshot({ path: destPng, omitBackground: true });
        }
        return destPng;
      } finally {
        await browser.close();
      }
    } catch (e) {
      console.warn('[renderComercial] Warning rasterizando SVG logo:', e);
      return resolvedFile;
    }
  }
  return resolvedFile;
}

export function resolveFont() {
  const cands = [
    'C:/Windows/Fonts/arialbd.ttf', 'C:/Windows/Fonts/arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf', '/Library/Fonts/Arial.ttf',
  ];
  for (const f of cands) { try { if (fs.existsSync(f)) return f; } catch { /* noop */ } }
  return null;
}

export const escDrawText = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "'\\''").replace(/:/g, '\\:').replace(/%/g, '\\%');

const volEnables = (ranges, gain) => ranges.map(([a, b]) => `volume=${gain}:enable='between(t,${a.toFixed(3)},${b.toFixed(3)})'`);

const isImageFile = (file) => {
  if (!file) return false;
  const ext = path.extname(file).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif'].includes(ext);
};

// Generación local de TTS ElevenLabs por escena
async function generateSceneTts(text, tmpDir, index) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.4 },
      }),
    });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const dest = path.join(tmpDir, `tts-scene-${index}.mp3`);
    fs.writeFileSync(dest, buf);
    return dest;
  } catch {
    return null;
  }
}

// Filtro Zoompan (Ken Burns suave) sesgado según zonaClave
function buildZoompanFilter(w, h, fps, durSec, zonaClave) {
  const frames = Math.max(1, Math.ceil(durSec * fps));
  const z = "min(zoom+0.0015,1.08)";
  let x = "iw/2-(iw/zoom/2)";
  let y = "ih/2-(ih/zoom/2)";
  if (zonaClave) {
    const zc = String(zonaClave).toLowerCase();
    if (/superior|top|arriba|header|encabezado/.test(zc)) y = "ih*0.02";
    else if (/inferior|bottom|abajo|footer/.test(zc)) y = "ih-(ih/zoom)-ih*0.02";
  }
  return `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},zoompan=z='${z}':x='${x}':y='${y}':d=${frames}:s=${w}x${h}:fps=${fps},setsar=1`;
}

export async function renderComercial(plan, { runFfmpeg, storageDir, probeDuration }) {
  const rawScenes = plan.scenes || [];
  if (!rawScenes.length) throw new Error('el montaje no tiene escenas');
  const scenes = rawScenes.map((s) => ({ ...s }));
  const W = Number(plan.width) || 1080, H = Number(plan.height) || 1920, FPS = Number(plan.fps) || 30;
  const SC = scaleCrop(W, H, FPS);
  const mediaKitId = plan.mediaKitId || null;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mstudio-render-'));

  try {
    // 1. TTS & Alineación de duración de escenas
    const ttsInputs = {};
    if (!process.env.ELEVENLABS_API_KEY) {
      console.warn('[renderComercial] WARNING: ELEVENLABS_API_KEY no configurada — degradando a render sin voz TTS');
    }
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      if (s.dialogo && String(s.dialogo).trim() && !plan.voice?.src) {
        const ttsFile = await generateSceneTts(String(s.dialogo).trim(), tmpDir, i);
        if (ttsFile) {
          ttsInputs[i] = ttsFile;
          if (probeDuration) {
            const ttsDur = await probeDuration(ttsFile);
            if (ttsDur && ttsDur > dur(s)) {
              s.out = (Number(s.in) || 0) + ttsDur + 0.2;
            }
          }
        }
      }
    }

    // 2. Resolver inputs visuales y de audio principales
    const inputs = [];
    const sceneInputMap = [];

    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      const visualSrc = s.archivoCaptura || s.src;
      let resolvedFile = await resolveSrc(visualSrc, storageDir, tmpDir, `v-${i}`, mediaKitId);
      if (!resolvedFile && s.archivoCaptura) {
        resolvedFile = await resolveSrc(s.src, storageDir, tmpDir, `v-alt-${i}`, mediaKitId);
      }
      if (resolvedFile) {
        sceneInputMap.push({ idx: inputs.length, file: resolvedFile, isImage: isImageFile(resolvedFile) });
        inputs.push(resolvedFile);
      } else {
        sceneInputMap.push({ idx: -1, file: null, isImage: false });
      }
    }

    let musicIdx = -1, voiceIdx = -1, logoIdx = -1;
    if (plan.music?.src) { musicIdx = inputs.length; inputs.push(await resolveSrc(plan.music.src, storageDir, tmpDir, 'music', mediaKitId)); }
    if (plan.voice?.src) { voiceIdx = inputs.length; inputs.push(await resolveSrc(plan.voice.src, storageDir, tmpDir, 'voice', mediaKitId)); }

    const logoSrc = plan.logo?.src || plan.marcaKit?.logoUrl || plan.brandKit?.logoUrl;
    if (logoSrc) {
      let resolvedLogo = await resolveSrc(logoSrc, storageDir, tmpDir, 'logo', mediaKitId);
      if (resolvedLogo) {
        resolvedLogo = await ensurePngLogo(resolvedLogo, tmpDir);
        if (resolvedLogo) {
          logoIdx = inputs.length;
          inputs.push(resolvedLogo);
        }
      }
    }

    const ttsInputIndices = {};
    for (const [iStr, file] of Object.entries(ttsInputs)) {
      ttsInputIndices[iStr] = inputs.length;
      inputs.push(file);
    }

    const starts = sceneStarts(scenes);
    const total = totalDuration(scenes);
    const voiceDur = (voiceIdx >= 0 && probeDuration) ? (await probeDuration(inputs[voiceIdx]) || 0) : 0;

    const fc = [];
    // 3. Cadena visual (Video/Imagen + Zoompan)
    scenes.forEach((s, i) => {
      const map = sceneInputMap[i];
      const d = dur(s);
      if (map && map.idx >= 0) {
        if (map.isImage) {
          fc.push(`[${map.idx}:v]${buildZoompanFilter(W, H, FPS, d, s.zonaClave)}[v${i}]`);
        } else {
          fc.push(`[${map.idx}:v]trim=${(Number(s.in) || 0).toFixed(3)}:${(Number(s.out) || 0).toFixed(3)},setpts=PTS-STARTPTS,${SC}[v${i}]`);
        }
      } else {
        fc.push(`color=c=0x0f172a:s=${W}x${H}:d=${d.toFixed(3)}:r=${FPS},setsar=1[v${i}]`);
      }
    });

    let vlabel = '[v0]', accLen = dur(scenes[0]);
    for (let i = 1; i < scenes.length; i++) {
      const td = trDur(scenes[i - 1].transition);
      const xname = XFADE_MAP[scenes[i - 1].transition] || 'fade';
      const offset = Math.max(0, accLen - td);
      const outLabel = i === scenes.length - 1 ? '[vout]' : `[vx${i}]`;
      fc.push(`${vlabel}[v${i}]xfade=transition=${xname}:duration=${td.toFixed(3)}:offset=${offset.toFixed(3)}${outLabel}`);
      vlabel = outLabel; accLen = accLen + dur(scenes[i]) - td;
    }

    if (logoIdx >= 0) {
      fc.push(`[${logoIdx}:v]scale=140:-1[logo]`, `${vlabel}[logo]overlay=46:${H - 160}[vlogo]`);
      vlabel = '[vlogo]';
    }

    // 4. Copy en pantalla (drawtext): usa `dialogo` (copy), jamás `accion`
    const font = resolveFont();
    let textList = Array.isArray(plan.texts) ? [...plan.texts] : [];
    if (!textList.length) {
      scenes.forEach((s, i) => {
        const copyText = s.dialogo && String(s.dialogo).trim() ? String(s.dialogo).trim() : null;
        if (copyText) {
          textList.push({ text: copyText, at: starts[i], dur: dur(s) });
        }
      });
    }

    if (textList.length && font) {
      const ff = font.replace(/\\/g, '/').replace(/:/g, '\\:');
      textList.forEach((t, i) => {
        if (!t || !t.text) return;
        const at = Number(t.at) || 0, d = Number(t.dur) || 3;
        const x = t.nx != null ? `(w*${Number(t.nx).toFixed(3)})` : '(w-text_w)/2';
        const y = t.ny != null ? `(h*${Number(t.ny).toFixed(3)})` : '(h*0.78)';
        const outLabel = `[vt${i}]`;
        fc.push(`${vlabel}drawtext=fontfile='${ff}':text='${escDrawText(t.text)}':fontcolor=white:fontsize=50:borderw=3:bordercolor=black@0.7:x=${x}:y=${y}:enable='between(t,${at.toFixed(3)},${(at + d).toFixed(3)})'${outLabel}`);
        vlabel = outLabel;
      });
    }

    // 5. Cadena de Audio: Clips + TTS local + Música + Ducking + Loudnorm (-16 LUFS)
    const alabels = [];
    scenes.forEach((s, i) => {
      const map = sceneInputMap[i];
      if (s.audio === 'keep' && map && map.idx >= 0 && !map.isImage) {
        fc.push(`[${map.idx}:a]atrim=${(Number(s.in) || 0).toFixed(3)}:${(Number(s.out) || 0).toFixed(3)},asetpts=PTS-STARTPTS,adelay=${ms(starts[i])}:all=1,volume=${Number(s.audioGain) || 1},${AF}[as${i}]`);
        alabels.push(`[as${i}]`);
      }
      if (ttsInputIndices[i] != null) {
        const ttsIdx = ttsInputIndices[i];
        fc.push(`[${ttsIdx}:a]adelay=${ms(starts[i])}:all=1,volume=1.5,${AF}[atts${i}]`);
        alabels.push(`[atts${i}]`);
      }
    });

    if (voiceIdx >= 0) {
      fc.push(`[${voiceIdx}:a]adelay=${ms(plan.voice.at || 0)}:all=1,volume=1.4,${AF}[avoice]`);
      alabels.push('[avoice]');
    }

    if (musicIdx >= 0) {
      const ducks = plan.music.duck ? duckRanges(scenes, starts, plan.voice, voiceDur) : [];
      const sils = silenceRanges(plan, scenes, starts);
      const chain = [`volume=${Number(plan.music.gain) || 0.28}`, ...volEnables(ducks, DUCK_GAIN), ...volEnables(sils, 0), `afade=t=in:st=0:d=0.4`, AF].join(',');
      fc.push(`[${musicIdx}:a]${chain}[amusic]`);
      alabels.push('[amusic]');
    }

    let amap = null;
    if (alabels.length === 1) {
      fc.push(`${alabels[0]}loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=${Math.max(0, total - 0.3).toFixed(3)}:d=0.3[a]`);
      amap = '[a]';
    } else if (alabels.length > 1) {
      fc.push(`${alabels.join('')}amix=inputs=${alabels.length}:duration=longest:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=${Math.max(0, total - 0.3).toFixed(3)}:d=0.3[a]`);
      amap = '[a]';
    }

    // 6. Ejecutar ffmpeg
    const out = path.join(tmpDir, 'comercial.mp4');
    const args = ['-y'];
    for (const f of inputs) args.push('-i', f);
    args.push('-filter_complex', fc.join(';'), '-map', vlabel);
    if (amap) args.push('-map', amap);
    args.push('-t', total.toFixed(3), '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p');
    if (amap) args.push('-c:a', 'aac', '-b:a', '192k');
    args.push('-movflags', '+faststart', out);
    await runFfmpeg(args);
    return { buffer: fs.readFileSync(out), durationSec: total };
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* noop */ }
  }
}
