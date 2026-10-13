// Del plan SEMÁNTICO (segundos, por escena) al plan de RENDER (cuadros, absoluto). Es la ÚNICA derivación:
// la usan la vista previa (Player en el navegador) y el render (Remotion en el servidor), así no hay dos
// relojes que se desincronicen. Pura, sin DOM.
import { duckRanges, silenceRanges, gananciaDePista, sceneStarts, totalDuration, transitionDur, type MontajePlan, type PalabraTiempo } from '../lib/montajePlan';
import { nivelAutomatizacion, type PuntoMusical } from '../lib/direccionMontaje';
import { frasesDe, partirFrase } from '../lib/montajista';

export interface PalabraMs { text: string; startMs: number; endMs: number }
export interface PaginaSubtitulo { startMs: number; endMs: number; words: PalabraMs[] }
// cómo ENTRA el segmento sobre el anterior (la transición que la escena previa marcó hacia ésta). Los cuadros son el
// solape que ya calcula sceneStarts: el segmento nuevo arranca antes de que termine el viejo y se funde encima.
export interface EntradaRender { tipo: 'fundido' | 'deslizar' | 'zoom'; frames: number }
export interface SegmentoRender { nombre: string; src: string; from: number; dur: number; startFrom: number; scaleFrom: number; scaleTo: number; audio: 'keep' | 'mute'; gain: number; entrada?: EntradaRender; fadeIn?: number; fadeOut?: number; efecto?: string }   // fades en cuadros (menú del clip); efecto: flash · zoom · pushin · fade · ramp
export interface InsertoRender { from: number; dur: number; src: string; nombre?: string; tarjeta?: string; video?: boolean; fadeIn: number; fadeOut: number }
export interface PlanRender {
  fps: number; width: number; height: number; totalFrames: number;
  segments: SegmentoRender[];
  inserts: InsertoRender[];
  captions: PaginaSubtitulo[];
  endCard?: { from: number; dur: number; linea1: string; linea2?: string; logoSrc?: string; tipo?: 'logo' | 'pantalla' | 'presentadora'; videoSrc?: string; aterriza?: number };   // aterriza: cuadro (dentro de la placa) en que el logo se asienta, sincronizado con la voz
  music?: { src: string; gain: number; duck: boolean; duckFrames: [number, number][]; silenceFrames: [number, number][]; automation: PuntoMusical[]; fadeIn: number; fadeOut: number };
  voice?: { src: string; from: number; volume: number; fadeIn: number; fadeOut: number };
  sfx?: { src: string; from: number; dur: number; volume: number; nombre?: string }[];   // efectos de sonido, cada uno en su cuadro
  logo?: { src: string };
  estilo: { primario: string; acento: string; fondo: string; texto: string };
}

export const ESTILO_DEFAULT = { primario: '#7C3AED', acento: '#F59E0B', fondo: '#FAF7FF', texto: '#1E1B2E' };
const PLACA_SOLAPE = 6;        // cuadros en que la placa funde sobre el último clip
const FADE_INSERTO = 8;        // cuadros del fundido de un inserto si el clip no pidió otro
const FADE_MUSICA = 20;        // cuadros del fundido de la música si el clip no pidió otro

// multiplicador 0..1 de un fade de entrada/salida en el cuadro `f` de algo que dura `dur` cuadros
export function rampaFades(f: number, dur: number, fadeIn = 0, fadeOut = 0): number {
  const a = fadeIn > 0 ? Math.max(0, Math.min(1, f / fadeIn)) : 1;
  const b = fadeOut > 0 ? Math.max(0, Math.min(1, (dur - f) / fadeOut)) : 1;
  return Math.min(a, b);
}

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
// Ganancias graduales sin saltos abruptos, tanto en el Player como en el MP4 (misma función).
export function volumenMusica(f: number, r: PlanRender): number {
  if (!r.music) return 0;
  const m = r.music;
  const fadeCuadros = Math.max(1, Math.round(r.fps * 0.12));
  const duck = m.duck && m.duckFrames.length
    ? m.duckFrames.reduce((g, [a, b]) => {
      // Attack anticipado y release suave: evita saltos de volumen entre frases.
      if (f < a - fadeCuadros || f > b + fadeCuadros) return g;
      const entrada = Math.max(0, Math.min(1, (a - f) / fadeCuadros));
      const salida = Math.max(0, Math.min(1, (f - b) / fadeCuadros));
      return Math.min(g, f < a ? 0.35 + 0.65 * entrada : f >= b ? 0.35 + 0.65 * salida : 0.35);
    }, 1) : 1;
  // Un silencio del plan es SILENCIO DE MÚSICA (no corta diálogos ni SFX).
  const sil = m.silenceFrames.reduce((g, [a, b]) => {
    if (f < a || f >= b + fadeCuadros) return g;
    if (f < a + fadeCuadros) return Math.min(g, Math.max(0, 1 - (f - a) / fadeCuadros));
    if (f < b) return 0;
    return Math.min(g, (f - b) / fadeCuadros);
  }, 1);
  const automatizacion = nivelAutomatizacion(f / r.fps, m.automation);
  const fadeIn = rampa(f, 0, Math.max(1, m.fadeIn));
  const fadeOut = 1 - rampa(f, r.totalFrames - Math.max(1, m.fadeOut), r.totalFrames - 1);
  return Math.max(0, Math.min(1, m.gain * duck * sil * automatizacion * fadeIn * fadeOut));
}

export function derivarRender(plan: MontajePlan, base = ''): PlanRender {
  const fps = plan.fps || 30;
  const F = (s: number) => Math.round(s * fps);
  const starts = sceneStarts(plan);
  const total = totalDuration(plan);
  const segments: SegmentoRender[] = [];
  const inserts: InsertoRender[] = [];
  const captions: PaginaSubtitulo[] = [];
  const gVideo = gananciaDePista(plan, 'video');
  plan.scenes.forEach((s, i) => {
    const dur = Math.max(0, s.out - s.in);
    if (!s.src || dur <= 0) return;
    const from = F(starts[i]);
    const finSegMs = Math.round((starts[i] + dur) * 1000);
    const previa = i > 0 ? plan.scenes[i - 1].transition : undefined;
    const entrada: EntradaRender | undefined = previa && previa !== 'cut' && plan.scenes[i - 1].src
      ? { tipo: previa === 'wipe' ? 'deslizar' : previa === 'zoom' ? 'zoom' : 'fundido', frames: Math.max(1, F(transitionDur(previa))) }
      : undefined;
    segments.push({
      nombre: s.rol ? `${i + 1} ${s.rol}` : `escena ${s.escenaN}`,
      src: resolverSrc(base, s.src), from, dur: F(dur), startFrom: F(s.in),
      scaleFrom: s.punchFrom ?? 1, scaleTo: s.punchTo ?? s.punchFrom ?? 1,
      audio: s.audio, gain: (s.audioGain ?? 1) * gVideo,
      ...(entrada ? { entrada } : {}),
      ...(s.fadeIn ? { fadeIn: F(s.fadeIn) } : {}),
      ...(s.fadeOut ? { fadeOut: F(s.fadeOut) } : {}),
      ...(s.effect ? { efecto: s.effect.replace(/^fx-/, '') } : {}),
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
      inserts.push({ from: from + F(ins.atSec - s.in), dur: F(ins.durSec), src: resolverSrc(base, ins.src), nombre: ins.nombre, tarjeta: ins.tarjeta, video: ins.video || /\.(mp4|webm|mov)$/i.test(ins.src), fadeIn: ins.fadeIn != null ? F(ins.fadeIn) : FADE_INSERTO, fadeOut: ins.fadeOut != null ? F(ins.fadeOut) : FADE_INSERTO });
    }
  });
  const finClips = F(total);
  const placaDesde = Math.max(0, finClips - PLACA_SOLAPE);
  // el logo "aterriza" cuando arranca la voz del cierre (el locutor dice la marca justo cuando el logo se asienta); sin voz, al medio segundo
  const vozDesde = plan.voice ? F(plan.voice.at) : null;
  const aterriza = vozDesde != null && vozDesde > placaDesde ? Math.max(8, Math.min(F(1.2), vozDesde - placaDesde)) : F(0.5);
  const endCard = plan.endCard
    ? { from: placaDesde, dur: PLACA_SOLAPE + F(plan.endCard.durSec), linea1: plan.endCard.linea1, linea2: plan.endCard.linea2, logoSrc: plan.endCard.logoSrc ? resolverSrc(base, plan.endCard.logoSrc) : undefined, tipo: plan.endCard.tipo, videoSrc: plan.endCard.videoSrc ? resolverSrc(base, plan.endCard.videoSrc) : undefined, aterriza }
    : undefined;
  const totalFrames = Math.max(1, endCard ? endCard.from + endCard.dur : finClips);
  return {
    fps, width: plan.width, height: plan.height, totalFrames,
    segments, inserts, captions, endCard,
    music: plan.music ? { src: resolverSrc(base, plan.music.src), gain: plan.music.gain * gananciaDePista(plan, 'musica'), duck: plan.music.duck, duckFrames: duckRanges(plan).map(([a, b]) => [F(a), F(b)] as [number, number]), silenceFrames: silenceRanges(plan).map(([a, b]) => [F(a), F(b)] as [number, number]), automation: plan.music.automation || [], fadeIn: plan.music.fadeIn != null ? F(plan.music.fadeIn) : FADE_MUSICA, fadeOut: plan.music.fadeOut != null ? F(plan.music.fadeOut) : FADE_MUSICA } : undefined,
    voice: plan.voice ? { src: resolverSrc(base, plan.voice.src), from: F(plan.voice.at), volume: gananciaDePista(plan, 'voz'), fadeIn: F(plan.voice.fadeIn || 0), fadeOut: F(plan.voice.fadeOut || 0) } : undefined,
    ...(plan.sfx?.length ? { sfx: plan.sfx.map((s) => ({ src: resolverSrc(base, s.src), from: F(s.at), dur: Math.max(1, F(s.durSec || 2)), volume: (s.gain ?? 0.7) * gananciaDePista(plan, 'sfx'), nombre: s.nombre })) } : {}),
    logo: plan.logo?.src ? { src: resolverSrc(base, plan.logo.src) } : undefined,
    estilo: { ...ESTILO_DEFAULT, ...(plan.estilo || {}) },
  };
}
