// Waveform de CADENCIA — el LIENZO de edición (como un editor de sonido).
//  · El TEXTO es solo el guión de referencia: palabras + , ? ! le dan la cadencia
//    base a la onda. El texto NUNCA se modifica con los markers.
//  · UN SOLO cursor: el SLIDER. Lo arrastrás por la onda. Donde lo dejás, ahí
//    se aplica el marker que toques arriba.
//      - Pausa / Pausa larga = puntual (en la posición del slider).
//      - Énfasis / Tono = rango: 1er toque marca INICIO, movés el slider, 2º
//        toque marca FIN. Quedan los topes de inicio y fin + la banda.
//  · Los markers son una CAPA aparte (borrables con click). Al generar, el host
//    combina guión + markers para el TTS.
import { useMemo, useRef } from 'react';
import { Pause } from 'lucide-react';
import './CadenceWave.css';

export const TONES = [
  { tag: '[excited]', label: 'Entusiasmo', color: '#F5A623' },
  { tag: '[serious]', label: 'Serio', color: '#3B82F6' },
  { tag: '[whispers]', label: 'Susurro', color: '#8B5CF6' },
  { tag: '[curious]', label: 'Curioso', color: '#22D3EE' },
  { tag: '[sighs]', label: 'Suspiro', color: '#EC4899' },
] as const;

export interface PlacedMarker { id: string; kind: 'pause' | 'pauseLong' | 'emphasis' | 'tone'; tag?: string; label: string; color: string; start: number; end: number }

// Tokeniza el texto para renderizarlo palabra por palabra (karaoke / aplicar
// markers desde el texto). Usa el MISMO TOKEN que la onda → los índices [ws,we)
// de cada palabra coinciden con los de buildWave (alineación exacta).
export interface RenderTok { raw: string; ws: number; we: number; word: boolean }
export function renderTokens(text: string): RenderTok[] {
  const out: RenderTok[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0; const tk = m[0];
    if (at > last) out.push({ raw: text.slice(last, at), ws: last, we: at, word: false });
    out.push({ raw: tk, ws: at, we: at + tk.length, word: /[A-Za-zÀ-ÿ0-9'’]/.test(tk[0]) });
    last = at + tk.length;
  }
  if (last < text.length) out.push({ raw: text.slice(last), ws: last, we: text.length, word: false });
  return out;
}

interface Bar { x: number; w: number; h: number }
interface Word { x0: number; x1: number; ws: number; we: number }
interface WaveData { bars: Bar[]; gaps: number[]; words: Word[]; width: number }

const BAR_W = 3.2, BAR_GAP = 1.4, SPACE = 5;
// corrida de puntos/espacios = pausa escrita por el user; punto/coma suelto = respiro.
const TOKEN = /[A-Za-zÀ-ÿ0-9'’]+|\.{2,}|…|[,.;:!?¡¿]|\s+/g;

function buildWave(text: string): WaveData {
  const bars: Bar[] = [], gaps: number[] = [], words: Word[] = [];
  let x = 4;
  let lastWord: Bar[] = [];
  let seed = 7;
  const rnd = (s: string) => { for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) >>> 0; };
  const next = () => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed % 1000) / 1000; };

  for (const m of text.matchAll(TOKEN)) {
    const tk = m[0]; const at = m.index ?? 0;
    if (/^\s+$/.test(tk)) { // corrida de espacios = pausa proporcional (la que escribís)
      const run = Math.min(tk.length, 8);
      if (run > 2) gaps.push(x + (run * SPACE) / 2);
      x += SPACE * run;
      continue;
    }
    if (tk === '…' || /^\.{2,}$/.test(tk)) { // puntos suspensivos = pausa marcada
      const g = Math.min(3 + tk.length, 11);
      gaps.push(x + (g * SPACE) / 2);
      x += SPACE * g;
      continue;
    }
    if (/^[,.;:!?¡¿]$/.test(tk)) { // puntuación suelta = respiro chico, sin gap visible grande
      if (tk === ',') x += SPACE * 1.0;
      else if (tk === '.' || tk === ';' || tk === ':') x += SPACE * 1.4;
      else if (tk === '?') ramp(lastWord);
      else if (tk === '!') spike(lastWord);
      else x += 2; // ¿ ¡
      continue;
    }
    const n = Math.max(2, Math.min(11, Math.round(tk.length / 1.2)));
    rnd(tk);
    const word: Bar[] = [];
    const x0 = x;
    for (let i = 0; i < n; i++) {
      const amp = 0.2 + next() * 0.8;
      const bar: Bar = { x, w: BAR_W, h: 22 + amp * 46 };
      bars.push(bar); word.push(bar);
      x += BAR_W + BAR_GAP;
    }
    words.push({ x0, x1: x, ws: at, we: at + tk.length });
    x += 2;
    lastWord = word;
  }
  return { bars, gaps, words, width: Math.max(x + 4, 80) };
}
function ramp(word: Bar[]) { const n = word.length; word.forEach((b, i) => { b.h = Math.min(118, b.h + (i / Math.max(1, n - 1)) * 36); }); }
function spike(word: Bar[]) { if (!word.length) return; word.forEach((b) => { b.h = Math.min(118, b.h + 12); }); word[word.length - 1].h = 118; }
function nearestWord(words: Word[], xUnits: number): Word | null {
  if (!words.length) return null;
  let best = words[0], bd = Infinity;
  for (const w of words) {
    const d = xUnits >= w.x0 && xUnits <= w.x1 ? 0 : Math.min(Math.abs(xUnits - w.x0), Math.abs(xUnits - w.x1));
    if (d < bd) { bd = d; best = w; }
  }
  return best;
}
// fracción 0..1 → rango de chars [ws,we) entre dos posiciones del slider.
export function resolveRange(text: string, fracA: number, fracB: number): { ws: number; we: number } | null {
  const d = buildWave(text);
  if (!d.words.length) return null;
  const a = nearestWord(d.words, Math.min(fracA, fracB) * d.width);
  const b = nearestWord(d.words, Math.max(fracA, fracB) * d.width);
  if (!a || !b) return null;
  return { ws: Math.min(a.ws, b.ws), we: Math.max(a.we, b.we) };
}
// char index → x (en unidades del viewBox) para dibujar un marker en su posición.
function charToX(words: Word[], c: number): number {
  if (!words.length) return 0;
  for (const w of words) if (c >= w.ws && c <= w.we) { const r = w.we > w.ws ? (c - w.ws) / (w.we - w.ws) : 0; return w.x0 + r * (w.x1 - w.x0); }
  let best = words[0];
  for (const w of words) if (Math.abs(c - w.ws) < Math.abs(c - best.ws)) best = w;
  return c <= best.ws ? best.x0 : best.x1;
}

const H = 120, CY = 60;

export default function CadenceWave({ text, peaks, cursor = 0, pendingStart = null, pendingColor = '#C8A24E', markers = [], onCursor, onRemoveMarker }: {
  text: string; peaks: number[] | null; cursor?: number; pendingStart?: number | null; pendingColor?: string; markers?: PlacedMarker[];
  onCursor?: (frac: number) => void; onRemoveMarker?: (id: string) => void;
}) {
  const data = useMemo(() => buildWave(text), [text]);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const real = !!(peaks && peaks.length);

  const emit = (e: React.PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect(); if (!rect || !onCursor) return;
    onCursor(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  };
  const onDown = (e: React.PointerEvent) => { dragging.current = true; try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* noop */ } emit(e); };
  const onMove = (e: React.PointerEvent) => { if (dragging.current) emit(e); };
  const onUp = (e: React.PointerEvent) => { dragging.current = false; try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* noop */ } };

  const W = data.width;
  // banda del rango que estás armando (inicio fijo → posición actual del slider)
  const pendBand = !real && pendingStart != null
    ? { a: Math.min(pendingStart, cursor) * (real ? 1000 : W), b: Math.max(pendingStart, cursor) * (real ? 1000 : W) }
    : null;

  return (
    <div ref={ref} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
      className={`cw-root ${onCursor ? 'cw-root--scrub' : 'cw-root--static'}`}>
      {real ? (
        <svg viewBox={`0 0 1000 ${H}`} preserveAspectRatio="none" className="cw-svg">
          {peaks!.map((p, i) => { const h = Math.max(3, p * 112); const px = i * (1000 / peaks!.length); const passed = px / 1000 <= cursor; return <rect key={i} x={px} y={(H - h) / 2} width={Math.max(1, 1000 / peaks!.length - 1.2)} height={h} rx={1} fill="#C8A24E" opacity={passed ? 0.95 : 0.45} />; })}
        </svg>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="cw-svg">
            {/* bandas de los markers de rango (énfasis/tono) con topes de inicio y fin */}
            {markers.filter((m) => m.end > m.start).map((m) => {
              const a = charToX(data.words, m.start), b = charToX(data.words, m.end);
              return (
                <g key={`b${m.id}`}>
                  <rect x={Math.min(a, b)} y={6} width={Math.max(1, Math.abs(b - a))} height={H - 12} fill={m.color} opacity={0.16} rx={3} />
                  <rect x={Math.min(a, b) - 0.6} y={6} width={1.6} height={H - 12} fill={m.color} opacity={0.85} />
                  <rect x={Math.max(a, b) - 1} y={6} width={1.6} height={H - 12} fill={m.color} opacity={0.85} />
                </g>
              );
            })}
            {/* banda del rango en construcción */}
            {pendBand && <rect x={pendBand.a} y={4} width={Math.max(1.5, pendBand.b - pendBand.a)} height={H - 8} fill={pendingColor} opacity={0.18} rx={2} />}
            {pendingStart != null && !real && <rect x={pendingStart * W - 0.8} y={4} width={1.8} height={H - 8} fill={pendingColor} opacity={0.95} />}
            <line x1={0} x2={W} y1={CY} y2={CY} stroke="rgba(255,255,255,0.07)" strokeWidth={0.6} />
            {data.gaps.map((g, i) => <line key={`g${i}`} x1={g} x2={g} y1={CY - 6} y2={CY + 6} stroke="rgba(255,255,255,0.28)" strokeWidth={0.8} />)}
            {data.bars.map((b, i) => <rect key={i} x={b.x} y={CY - b.h / 2} width={b.w} height={b.h} rx={1} fill="#C8A24E" opacity={0.74} />)}
          </svg>
          {/* etiquetas de los markers (borrables) */}
          {markers.map((m) => (
            <div key={m.id} className="cw-marker" style={{ ['--x']: `${(charToX(data.words, m.start) / W) * 100}%`, ['--c']: m.color } as React.CSSProperties}>
              <span className="cw-marker-label cw-marker-label--rm" title="click para borrar"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onRemoveMarker ? (e) => { e.stopPropagation(); onRemoveMarker(m.id); } : undefined}>
                {m.kind === 'pause' || m.kind === 'pauseLong' ? <><Pause size={9} /> {m.label}</> : m.label} ✕
              </span>
              <span className="cw-marker-stem" />
            </div>
          ))}
        </>
      )}
      {/* SLIDER único: arrastrable, con manija arriba. En audio real es el playhead. */}
      <div className="cw-cursor" style={{ ['--x']: `${cursor * 100}%`, ['--ph']: real ? '#34d399' : '#C8A24E' } as React.CSSProperties}>
        <div className="cw-cursor-grip" />
      </div>
    </div>
  );
}
