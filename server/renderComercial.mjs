// RENDER del comercial final (mp4 9:16) desde un MontajePlan (Fase 4). Es el render que faltaba:
// video por escena (trim + xfade encadenado) + las TRES fuentes de audio (diálogo de los clips
// 'keep' + voz en off + música con DUCKING y SILENCIO) → un solo mp4. Reutiliza los patrones ffmpeg
// battle-tested de assemble.mjs (SC/AF/xfade/amix). La llamada a ffmpeg la inyecta index.mjs (runFfmpeg).
//
// NOTA: duplica la derivación de tiempos de src/lib/montajePlan.ts (el server no puede importar TS
// del front). Mantener en sync: sceneStarts/totalDuration/duckRanges/silenceRanges.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SC = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1';
const AF = 'aformat=sample_rates=44100:channel_layouts=stereo';
const ms = (s) => Math.round(s * 1000);
const CUT_DUR = 0.03, XFADE_DUR = 0.4, DUCK_GAIN = 0.4;
const XFADE_MAP = { fade: 'fade', crossfade: 'dissolve', wipe: 'wipeleft', zoom: 'zoomin', cut: 'fade' };
const trDur = (tr) => (!tr || tr === 'cut' ? CUT_DUR : XFADE_DUR);
const dur = (s) => Math.max(0, (Number(s.out) || 0) - (Number(s.in) || 0));

function sceneStarts(scenes) {
  const starts = []; let t = 0;
  scenes.forEach((s, i) => { starts.push(t); t += dur(s) - (i < scenes.length - 1 ? trDur(s.transition) : 0); });
  return starts;
}
const totalDuration = (scenes) => scenes.reduce((t, s, i) => t + dur(s) - (i < scenes.length - 1 ? trDur(s.transition) : 0), 0);

function mergeRanges(ranges) {
  const sorted = ranges.filter((r) => r[1] > r[0]).sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else out.push([r[0], r[1]]);
  }
  return out;
}
function duckRanges(scenes, starts, voice, voiceDur) {
  const ranges = [];
  scenes.forEach((s, i) => { if (s.audio === 'keep' && s.dialogo && String(s.dialogo).trim()) ranges.push([starts[i], starts[i] + dur(s)]); });
  if (voice) ranges.push([voice.at || 0, (voice.at || 0) + (voiceDur || 0)]);
  return mergeRanges(ranges);
}
function silenceRanges(plan, scenes, starts) {
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
  if (!r.ok) throw new Error(`no se pudo bajar la música/voz (${r.status})`);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

// resuelve un src a un path local: fileRef RELATIVO → STORAGE_DIR/<rel>; http(s) → descarga a tmp.
async function resolveSrc(src, storageDir, tmpDir, i) {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) { const dest = path.join(tmpDir, `dl-${i}-${path.basename(src.split('?')[0]) || 'a'}`); await downloadTo(src, dest); return dest; }
  const local = path.join(storageDir, src);
  if (!fs.existsSync(local)) throw new Error(`no existe el clip: ${src}`);
  return local;
}

// enable de ffmpeg para un set de rangos → una cadena de filtros volume.
const volEnables = (ranges, gain) => ranges.map(([a, b]) => `volume=${gain}:enable='between(t,${a.toFixed(3)},${b.toFixed(3)})'`);

export async function renderComercial(plan, { runFfmpeg, storageDir, probeDuration }) {
  // Escenas sin clip: ERROR claro, no filtrado silencioso — si se descartara una escena del medio,
  // los silencios/duración del mp4 se corren respecto de lo que la UI estimó (cuenta TODAS).
  const scenes = plan.scenes || [];
  if (!scenes.length) throw new Error('el montaje no tiene escenas con clip importado');
  const sinClip = scenes.filter((s) => !s.src).map((s) => s.escenaN);
  if (sinClip.length) throw new Error(`faltan clips en las escenas ${sinClip.join(',')} — importalos en Rodaje o sacalas del montaje`);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mstudio-render-'));
  try {
    // 1. resolver inputs (una entrada -i por escena, + música + voz + logo)
    const inputs = [];
    for (let i = 0; i < scenes.length; i++) inputs.push(await resolveSrc(scenes[i].src, storageDir, tmpDir, i));
    let musicIdx = -1, voiceIdx = -1, logoIdx = -1;
    if (plan.music?.src) { musicIdx = inputs.length; inputs.push(await resolveSrc(plan.music.src, storageDir, tmpDir, 'music')); }
    if (plan.voice?.src) { voiceIdx = inputs.length; inputs.push(await resolveSrc(plan.voice.src, storageDir, tmpDir, 'voice')); }
    if (plan.logo?.src) { logoIdx = inputs.length; inputs.push(await resolveSrc(plan.logo.src, storageDir, tmpDir, 'logo')); }

    const starts = sceneStarts(scenes);
    const total = totalDuration(scenes);
    const voiceDur = (voiceIdx >= 0 && probeDuration) ? (await probeDuration(inputs[voiceIdx]) || 0) : 0;

    const fc = [];
    // 2. video: trim + SC por escena, luego xfade encadenado
    scenes.forEach((s, i) => fc.push(`[${i}:v]trim=${(Number(s.in) || 0).toFixed(3)}:${(Number(s.out) || 0).toFixed(3)},setpts=PTS-STARTPTS,${SC}[v${i}]`));
    let vlabel = '[v0]', accLen = dur(scenes[0]);
    for (let i = 1; i < scenes.length; i++) {
      const td = trDur(scenes[i - 1].transition);
      const xname = XFADE_MAP[scenes[i - 1].transition] || 'fade';
      const offset = Math.max(0, accLen - td);
      const out = i === scenes.length - 1 ? '[vout]' : `[vx${i}]`;
      fc.push(`${vlabel}[v${i}]xfade=transition=${xname}:duration=${td.toFixed(3)}:offset=${offset.toFixed(3)}${out}`);
      vlabel = out; accLen = accLen + dur(scenes[i]) - td;
    }
    // logo overlay abajo-izquierda (patrón assemble)
    if (logoIdx >= 0) { fc.push(`[${logoIdx}:v]scale=86:-1[logo]`, `${vlabel}[logo]overlay=46:1784[vlogo]`); vlabel = '[vlogo]'; }

    // 3. audio: diálogo de escenas keep + voz + música (ducking + silencio)
    const alabels = [];
    scenes.forEach((s, i) => {
      if (s.audio === 'keep') {
        fc.push(`[${i}:a]atrim=${(Number(s.in) || 0).toFixed(3)}:${(Number(s.out) || 0).toFixed(3)},asetpts=PTS-STARTPTS,adelay=${ms(starts[i])}:all=1,volume=${Number(s.audioGain) || 1},${AF}[as${i}]`);
        alabels.push(`[as${i}]`);
      }
    });
    if (voiceIdx >= 0) { fc.push(`[${voiceIdx}:a]adelay=${ms(plan.voice.at || 0)}:all=1,volume=1.4,${AF}[avoice]`); alabels.push('[avoice]'); }
    if (musicIdx >= 0) {
      const ducks = plan.music.duck ? duckRanges(scenes, starts, plan.voice, voiceDur) : [];
      const sils = silenceRanges(plan, scenes, starts);
      const chain = [`volume=${Number(plan.music.gain) || 0.28}`, ...volEnables(ducks, DUCK_GAIN), ...volEnables(sils, 0), `afade=t=in:st=0:d=0.4`, AF].join(',');
      fc.push(`[${musicIdx}:a]${chain}[amusic]`);
      alabels.push('[amusic]');
    }

    let amap = null;
    if (alabels.length === 1) { fc.push(`${alabels[0]}afade=t=out:st=${Math.max(0, total - 0.3).toFixed(3)}:d=0.3[a]`); amap = '[a]'; }
    else if (alabels.length > 1) { fc.push(`${alabels.join('')}amix=inputs=${alabels.length}:duration=longest:normalize=0,afade=t=out:st=${Math.max(0, total - 0.3).toFixed(3)}:d=0.3[a]`); amap = '[a]'; }

    // 4. ffmpeg
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
  } finally { try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* noop */ } }
}
