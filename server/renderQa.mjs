// QA técnico del MP4 REAL exportado: no sustituye la escucha profesional.
// Ejecución opcional (decode de video/audio puede ser costosa); requiere un archivo local.
import { spawn } from 'node:child_process';

export function parseAudioQa(stderr) {
  // Se utiliza el bloque FINAL de ebur128; no las mediciones periódicas de 100ms.
  const summary = stderr.lastIndexOf('Integrated loudness:');
  const end = summary >= 0 ? stderr.slice(summary) : '';
  const i = end.match(/\bI:\s*(-?\d+(?:\.\d+)?)\s+LUFS/i);
  const peak = end.match(/\bPeak:\s*(-?\d+(?:\.\d+)?)\s+dBFS/i);
  const starts = [...stderr.matchAll(/silence_start:\s*(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
  const ends = [...stderr.matchAll(/silence_end:\s*(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
  return {
    integratedLufs: i ? Number(i[1]) : null,
    truePeakDbfs: peak ? Number(peak[1]) : null,
    silencios: starts.map((desde, idx) => ({ desde, hasta: ends[idx] ?? null })),
  };
}

export function parseVideoQa(stderr) {
  return [...stderr.matchAll(/black_start:\s*(\d+(?:\.\d+)?)\s+black_end:\s*(\d+(?:\.\d+)?)\s+black_duration:\s*(\d+(?:\.\d+)?)/g)]
    .map((m) => ({ desde: Number(m[1]), hasta: Number(m[2]), durSec: Number(m[3]) }));
}

function runFfmpegQa(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-hide_banner', '-nostdin', ...args], { windowsHide: true });
    let stderr = '';
    let done = false;
    const fail = (error) => { if (done) return; done = true; reject(error); };
    const timeout = setTimeout(() => { proc.kill('SIGKILL'); fail(new Error('QA excedió 120 segundos')); }, 120000);
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); if (stderr.length > 600000) stderr = stderr.slice(-400000); });
    proc.on('error', (err) => { clearTimeout(timeout); fail(err); });
    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (done) return;
      done = true;
      code === 0 ? resolve(stderr) : reject(new Error(`ffmpeg QA exit ${code}: ${stderr.slice(-250)}`));
    });
  });
}

export async function auditarRenderLocal(file) {
  const aviso = [];
  let audio = { integratedLufs: null, truePeakDbfs: null, silencios: [] };
  let negros = [];
  try {
    audio = parseAudioQa(await runFfmpegQa(['-i', file, '-vn', '-af', 'ebur128=peak=true,silencedetect=noise=-45dB:d=0.8', '-f', 'null', '-']));
    if (audio.integratedLufs != null && (audio.integratedLufs < -16 || audio.integratedLufs > -12)) aviso.push('Sonoridad final fuera del rango orientativo -16 a -12 LUFS');
    if (audio.truePeakDbfs != null && audio.truePeakDbfs > -1) aviso.push('Pico verdadero elevado: revisar clipping');
    if (audio.silencios.some((s) => s.hasta != null && s.hasta - s.desde > 1.6)) aviso.push('Hay silencios prolongados: comprobar si son intencionales');
  } catch (e) { aviso.push('No se pudo medir la pista de audio: ' + String(e.message || e).slice(0,130)); }
  try {
    negros = parseVideoQa(await runFfmpegQa(['-i', file, '-an', '-vf', 'blackdetect=d=0.7:pix_th=0.10', '-f', 'null', '-']));
    if (negros.length) aviso.push('Se detectaron cuadros negros prolongados: revisar inicio, cortes y cierre');
  } catch (e) { aviso.push('No se pudo inspeccionar video: ' + String(e.message || e).slice(0,130)); }
  return { ...audio, negros, avisos: aviso, alcance: 'QA técnico de archivo final, no mide uniformidad por actor, legibilidad ni calidad narrativa' };
}
