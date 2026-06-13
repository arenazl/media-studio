// Waveform de CADENCIA — la base de la app. Se redibuja en vivo desde el texto.
// El texto ES la fuente única: la puntuación (, . ? !) y los markers insertados
// (— … MAYÚSCULAS [tono]) se interpretan y se ven reflejados en la onda.
// Al generar, `peaks` trae la onda del audio REAL y reemplaza la sintética.
//
// PLAYHEAD: una línea que se desliza sobre la onda (click/drag → onScrub):
//  · modo sintético → devuelve la palabra más cercana (para marcar el punto
//    donde insertar pausa/acento/tono).
//  · modo audio real → devuelve la fracción 0..1 (para hacer seek / mostrar avance).
import { useMemo, useRef } from 'react';
import { Pause } from 'lucide-react';

export const TONES = [
  { tag: '[excited]', label: 'Entusiasmo', color: '#F5A623' },
  { tag: '[serious]', label: 'Serio', color: '#3B82F6' },
  { tag: '[whispers]', label: 'Susurro', color: '#8B5CF6' },
  { tag: '[curious]', label: 'Curioso', color: '#22D3EE' },
  { tag: '[sighs]', label: 'Suspiro', color: '#EC4899' },
] as const;

export interface ScrubInfo { frac: number; ws: number | null; we: number | null }

interface Bar { x: number; w: number; h: number; emph: boolean }
interface Marker { x: number; kind: 'pause' | 'q' | 'excl' | 'tone'; label: string; color: string }
interface Band { x0: number; x1: number; color: string }
interface Word { x0: number; x1: number; ws: number; we: number }
interface WaveData { bars: Bar[]; markers: Marker[]; bands: Band[]; gaps: number[]; words: Word[]; width: number }

const BAR_W = 3.2, BAR_GAP = 1.4, SPACE = 5;
const TOKEN = /\[[a-zA-Z]+\]|[A-Za-zÀ-ÿ0-9'’]+|[,.;:!?¡¿…—-]|\s+/g;

function buildWave(text: string): WaveData {
  const bars: Bar[] = [], markers: Marker[] = [], bands: Band[] = [], gaps: number[] = [], words: Word[] = [];
  let x = 4;
  let tone: { color: string; x0: number } | null = null;
  let lastWord: Bar[] = [];
  let seed = 7;
  const rnd = (s: string) => { for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) >>> 0; };
  const next = () => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed % 1000) / 1000; };

  for (const m of text.matchAll(TOKEN)) {
    const tk = m[0]; const at = m.index ?? 0;
    if (/^\s+$/.test(tk)) { x += SPACE; continue; }
    if (tk[0] === '[') { // tono — banda de color hasta el próximo tono
      if (tone) bands.push({ ...tone, x1: x });
      const t = TONES.find((z) => z.tag === tk.toLowerCase());
      const color = t?.color || '#4070C0';
      markers.push({ x, kind: 'tone', label: t?.label || tk.replace(/[[\]]/g, ''), color });
      tone = { color, x0: x };
      continue;
    }
    if (/^[,.;:!?¡¿…—-]$/.test(tk)) {
      if (tk === ',') { gaps.push(x); x += SPACE * 1.4; }
      else if (tk === '.' || tk === ';' || tk === ':') { gaps.push(x); x += SPACE * 2.3; }
      else if (tk === '—' || tk === '-' || tk === '…') { markers.push({ x, kind: 'pause', label: tk === '…' ? 'larga' : 'pausa', color: '#C8A24E' }); x += SPACE * 3.2; }
      else if (tk === '?') { markers.push({ x, kind: 'q', label: '?', color: '#22D3EE' }); ramp(lastWord); }
      else if (tk === '!') { markers.push({ x, kind: 'excl', label: '!', color: '#EC4899' }); spike(lastWord); }
      else x += 2; // ¿ ¡
      continue;
    }
    // palabra
    const emph = tk.length > 1 && tk === tk.toUpperCase() && /[A-ZÀ-Ý]/.test(tk);
    const n = Math.max(2, Math.min(11, Math.round(tk.length / 1.2)));
    rnd(tk);
    const word: Bar[] = [];
    const x0 = x;
    for (let i = 0; i < n; i++) {
      const amp = 0.2 + next() * 0.8;
      const h = emph ? 42 + amp * 64 : 22 + amp * 46;
      const bar: Bar = { x, w: BAR_W, h, emph };
      bars.push(bar); word.push(bar);
      x += BAR_W + BAR_GAP;
    }
    words.push({ x0, x1: x, ws: at, we: at + tk.length });
    x += 2;
    lastWord = word;
  }
  if (tone) bands.push({ ...tone, x1: x });
  return { bars, markers, bands, gaps, words, width: Math.max(x + 4, 80) };
}
function ramp(word: Bar[]) { const n = word.length; word.forEach((b, i) => { b.h = Math.min(118, b.h + (i / Math.max(1, n - 1)) * 36); }); }
function spike(word: Bar[]) { if (!word.length) return; word.forEach((b) => { b.h = Math.min(118, b.h + 12); }); word[word.length - 1].h = 118; }
function nearestWord(words: Word[], xUnits: number): { ws: number | null; we: number | null } {
  if (!words.length) return { ws: null, we: null };
  let best = words[0], bd = Infinity;
  for (const w of words) {
    const d = xUnits >= w.x0 && xUnits <= w.x1 ? 0 : Math.min(Math.abs(xUnits - w.x0), Math.abs(xUnits - w.x1));
    if (d < bd) { bd = d; best = w; }
  }
  return { ws: best.ws, we: best.we };
}

const H = 120, CY = 60;

export default function CadenceWave({ text, peaks, playhead = null, onScrub }: { text: string; peaks: number[] | null; playhead?: number | null; onScrub?: (info: ScrubInfo) => void }) {
  const data = useMemo(() => buildWave(text), [text]);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const real = !!(peaks && peaks.length);

  const emit = (e: React.PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect(); if (!rect || !onScrub) return;
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (real) onScrub({ frac, ws: null, we: null });
    else { const { ws, we } = nearestWord(data.words, frac * data.width); onScrub({ frac, ws, we }); }
  };
  const onDown = (e: React.PointerEvent) => { dragging.current = true; try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* noop */ } emit(e); };
  const onMove = (e: React.PointerEvent) => { if (dragging.current) emit(e); };
  const onUp = (e: React.PointerEvent) => { dragging.current = false; try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* noop */ } };

  return (
    <div ref={ref} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: 120, cursor: onScrub ? 'ew-resize' : 'default', touchAction: 'none' }}>
      {real ? (
        <svg viewBox={`0 0 1000 ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          {peaks!.map((p, i) => { const h = Math.max(3, p * 112); const px = i * (1000 / peaks!.length); const passed = playhead != null && px / 1000 <= playhead; return <rect key={i} x={px} y={(H - h) / 2} width={Math.max(1, 1000 / peaks!.length - 1.2)} height={h} rx={1} fill="#C8A24E" opacity={passed ? 0.95 : 0.45} />; })}
        </svg>
      ) : (
        <>
          <svg viewBox={`0 0 ${data.width} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            {data.bands.map((b, i) => <rect key={`bd${i}`} x={b.x0} y={6} width={Math.max(0, b.x1 - b.x0)} height={H - 12} fill={b.color} opacity={0.1} rx={3} />)}
            <line x1={0} x2={data.width} y1={CY} y2={CY} stroke="rgba(255,255,255,0.07)" strokeWidth={0.6} />
            {data.gaps.map((g, i) => <line key={`g${i}`} x1={g} x2={g} y1={CY - 6} y2={CY + 6} stroke="rgba(255,255,255,0.28)" strokeWidth={0.8} />)}
            {data.bars.map((b, i) => <rect key={i} x={b.x} y={CY - b.h / 2} width={b.w} height={b.h} rx={1} fill={b.emph ? '#EAD08A' : '#C8A24E'} opacity={b.emph ? 1 : 0.74} />)}
          </svg>
          {data.markers.map((m, i) => (
            <div key={i} style={{ position: 'absolute', left: `${(m.x / data.width) * 100}%`, top: 2, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5, fontWeight: 800, lineHeight: 1, color: m.color, background: 'rgba(0,0,0,0.35)', border: `1px solid ${m.color}55`, borderRadius: 5, padding: '2px 5px', whiteSpace: 'nowrap' }}>
                {m.kind === 'pause' ? <><Pause size={9} /> {m.label}</> : m.label}
              </span>
              <span style={{ width: 1, height: 10, background: `${m.color}66` }} />
            </div>
          ))}
        </>
      )}
      {/* PLAYHEAD */}
      {playhead != null && (
        <div style={{ position: 'absolute', left: `${playhead * 100}%`, top: 0, bottom: 0, width: 2, marginLeft: -1, background: real ? '#34d399' : BRAND_GOLD, pointerEvents: 'none', boxShadow: '0 0 6px rgba(0,0,0,0.4)' }}>
          <div style={{ position: 'absolute', top: -1, left: -4, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `6px solid ${real ? '#34d399' : BRAND_GOLD}` }} />
        </div>
      )}
    </div>
  );
}
const BRAND_GOLD = '#C8A24E';
