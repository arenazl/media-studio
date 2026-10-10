// Del plan SEMÁNTICO (segundos, por escena) al plan de RENDER (cuadros, absoluto). Es la ÚNICA derivación:
// la usan la vista previa (Player en el navegador) y el render (Remotion en el servidor), así no hay dos
// relojes que se desincronicen. Pura, sin DOM.
import { duckRanges, sceneStarts, totalDuration, type MontajePlan, type PalabraTiempo } from '../lib/montajePlan';
import { frasesDe, partirFrase } from '../lib/montajista';

export interface PalabraMs { text: string; startMs: number; endMs: number }
export interface PaginaSubtitulo { startMs: number; endMs: number; words: PalabraMs[] }
export interface SegmentoRender { nombre: string; src: string; from: number; dur: number; startFrom: number; scaleFrom: number; scaleTo: number; audio: 'keep' | 'mute'; gain: number }
export interface InsertoRender { from: number; dur: number; src: string; nombre?: string; tarjeta?: string }
export interface PlanRender {
  fps: number; width: number; height: number; totalFrames: number;
  segments: SegmentoRender[];
  inserts: InsertoRender[];
  captions: PaginaSubtitulo[];
  endCard?: { from: number; dur: number; linea1: string; linea2?: string; logoSrc?: string };
  music?: { src: string; gain: number; duck: boolean; duckFrames: [number, number][] };
  voice?: { src: string; from: number };
  logo?: { src: string };
  estilo: { primario: string; acento: string; fondo: string; texto: string };
}

export const ESTILO_DEFAULT = { primario: '#7C3AED', acento: '#F59E0B', fondo: '#FAF7FF', texto: '#1E1B2E' };
const PLACA_SOLAPE = 6;        // cuadros en que la placa funde sobre el último clip

// Resuelve un fileRef o ruta de API a una URL que el navegador (vista previa) o Chrome (render) puedan pedir.
export function resolverSrc(base: string, src: string): string {
  if (!src) return '';
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (src.startsWith('/')) return `${base}${src}`;
  return `${base}/api/storage/${src.split('/').map(encodeURIComponent).join('/')}`;
}

export function paginarSubtitulos(words: PalabraMs[]): PaginaSubtitulo[] {
  const enSeg: PalabraTiempo[] = words.map((w) => ({ text: w.text, start: w.startMs / 1000, end: w.endMs / 1000 }));
  const paginas = frasesDe(enSeg).flatMap(partirFrase).map((ws) => ({
    words: ws.map((w) => ({ text: w.text, startMs: Math.round(w.start * 1000), endMs: Math.round(w.end * 1000) })),
    startMs: 0, endMs: 0,
  }));
  paginas.forEach((p, i) => {
    p.startMs = p.words[0].startMs - 80;
    const natural = p.words[p.words.length - 1].endMs + 350;
    p.endMs = i + 1 < paginas.length ? Math.min(natural, paginas[i + 1].words[0].startMs - 80) : natural;
  });
  return paginas;
}

const rampa = (f: number, a: number, b: number) => Math.max(0, Math.min(1, (f - a) / Math.max(1, b - a)));

// música: fade de entrada, baja bajo el diálogo (rangos de ducking del plan), sube en la placa, fade de salida.
export function volumenMusica(f: number, r: PlanRender): number {
  if (!r.music) return 0;
  const enDuck = r.music.duck && r.music.duckFrames.some(([a, b]) => f >= a && f < b);
  const bed = r.music.gain * (enDuck ? 0.35 : 1);
  const fadeIn = rampa(f, 0, 20);
  const fadeOut = 1 - rampa(f, r.totalFrames - 20, r.totalFrames - 1);
  return Math.max(0, Math.min(1, bed * fadeIn * fadeOut));
}

export function derivarRender(plan: MontajePlan, base = ''): PlanRender {
  const fps = plan.fps || 30;
  const F = (s: number) => Math.round(s * fps);
  const starts = sceneStarts(plan);
  const total = totalDuration(plan);
  const segments: SegmentoRender[] = [];
  const inserts: InsertoRender[] = [];
  const captions: PaginaSubtitulo[] = [];
  plan.scenes.forEach((s, i) => {
    const dur = Math.max(0, s.out - s.in);
    if (!s.src || dur <= 0) return;
    const from = F(starts[i]);
    const finSegMs = Math.round((starts[i] + dur) * 1000);
    segments.push({
      nombre: s.rol ? `${i + 1} ${s.rol}` : `escena ${s.escenaN}`,
      src: resolverSrc(base, s.src), from, dur: F(dur), startFrom: F(s.in),
      scaleFrom: s.punchFrom ?? 1, scaleTo: s.punchTo ?? s.punchFrom ?? 1,
      audio: s.audio, gain: s.audioGain ?? 1,
    });
    // subtítulos POR ESCENA: una página nunca cruza un corte, y su fin queda acotado al fin del clip
    const words: PalabraMs[] = [];
    for (const w of s.words || []) {
      if (w.start < s.in || w.end > s.out || !w.text) continue;
      const startMs = Math.round((starts[i] + (w.start - s.in)) * 1000);
      words.push({ text: w.text, startMs, endMs: Math.min(finSegMs, Math.round((starts[i] + (w.end - s.in)) * 1000)) });
    }
    for (const p of paginarSubtitulos(words)) captions.push({ ...p, endMs: Math.min(p.endMs, finSegMs) });
    for (const ins of s.inserts || []) {
      inserts.push({ from: from + F(ins.atSec - s.in), dur: F(ins.durSec), src: resolverSrc(base, ins.src), nombre: ins.nombre, tarjeta: ins.tarjeta });
    }
  });
  const finClips = F(total);
  const endCard = plan.endCard
    ? { from: Math.max(0, finClips - PLACA_SOLAPE), dur: PLACA_SOLAPE + F(plan.endCard.durSec), linea1: plan.endCard.linea1, linea2: plan.endCard.linea2, logoSrc: plan.endCard.logoSrc ? resolverSrc(base, plan.endCard.logoSrc) : undefined }
    : undefined;
  const totalFrames = Math.max(1, endCard ? endCard.from + endCard.dur : finClips);
  return {
    fps, width: plan.width, height: plan.height, totalFrames,
    segments, inserts, captions, endCard,
    music: plan.music ? { src: resolverSrc(base, plan.music.src), gain: plan.music.gain, duck: plan.music.duck, duckFrames: duckRanges(plan).map(([a, b]) => [F(a), F(b)] as [number, number]) } : undefined,
    voice: plan.voice ? { src: resolverSrc(base, plan.voice.src), from: F(plan.voice.at) } : undefined,
    logo: plan.logo?.src ? { src: resolverSrc(base, plan.logo.src) } : undefined,
    estilo: { ...ESTILO_DEFAULT, ...(plan.estilo || {}) },
  };
}
