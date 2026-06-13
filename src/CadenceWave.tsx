// Waveform de CADENCIA — la base de la app. Se redibuja en vivo desde el texto.
// El texto ES la fuente única: la puntuación (, . ? !) y los markers insertados
// (— … MAYÚSCULAS [tono]) se interpretan y se ven reflejados en la onda.
// Al generar, `peaks` trae la onda del audio REAL y reemplaza la sintética.
import { useMemo } from 'react';
import { Pause } from 'lucide-react';

export const TONES = [
  { tag: '[excited]', label: 'Entusiasmo', color: '#F5A623' },
  { tag: '[serious]', label: 'Serio', color: '#3B82F6' },
  { tag: '[whispers]', label: 'Susurro', color: '#8B5CF6' },
  { tag: '[curious]', label: 'Curioso', color: '#22D3EE' },
  { tag: '[sighs]', label: 'Suspiro', color: '#EC4899' },
] as const;

interface Bar { x: number; w: number; h: number; emph: boolean }
interface Marker { x: number; kind: 'pause' | 'q' | 'excl' | 'tone'; label: string; color: string }
interface Band { x0: number; x1: number; color: string }
interface WaveData { bars: Bar[]; markers: Marker[]; bands: Band[]; gaps: number[]; width: number }

const BAR_W = 3.2, BAR_GAP = 1.4, SPACE = 5;
const TOKEN = /\[[a-zA-Z]+\]|[A-Za-zÀ-ÿ0-9'’]+|[,.;:!?¡¿…—-]|\s+/g;

function buildWave(text: string): WaveData {
  const bars: Bar[] = [], markers: Marker[] = [], bands: Band[] = [], gaps: number[] = [];
  let x = 4;
  let tone: { color: string; x0: number } | null = null;
  let lastWord: Bar[] = [];
  const tokens = text.match(TOKEN) || [];
  let seed = 7;
  const rnd = (s: string) => { for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) >>> 0; };
  const next = () => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed % 1000) / 1000; };

  for (const tk of tokens) {
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
    for (let i = 0; i < n; i++) {
      const amp = 0.2 + next() * 0.8;
      const h = emph ? 42 + amp * 64 : 22 + amp * 46;
      const bar: Bar = { x, w: BAR_W, h, emph };
      bars.push(bar); word.push(bar);
      x += BAR_W + BAR_GAP;
    }
    x += 2;
    lastWord = word;
  }
  if (tone) bands.push({ ...tone, x1: x });
  return { bars, markers, bands, gaps, width: Math.max(x + 4, 80) };
}
function ramp(word: Bar[]) { const n = word.length; word.forEach((b, i) => { b.h = Math.min(118, b.h + (i / Math.max(1, n - 1)) * 36); }); }
function spike(word: Bar[]) { if (!word.length) return; word.forEach((b) => { b.h = Math.min(118, b.h + 12); }); word[word.length - 1].h = 118; }

const H = 120, CY = 60;

export default function CadenceWave({ text, peaks }: { text: string; peaks: number[] | null }) {
  const data = useMemo(() => buildWave(text), [text]);

  // Onda del audio REAL (post-generación).
  if (peaks && peaks.length) {
    const n = peaks.length;
    return (
      <svg viewBox={`0 0 1000 ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        {peaks.map((p, i) => { const h = Math.max(3, p * 112); return <rect key={i} x={i * (1000 / n)} y={(H - h) / 2} width={Math.max(1, 1000 / n - 1.2)} height={h} rx={1} fill="#C8A24E" opacity={0.92} />; })}
      </svg>
    );
  }

  // Onda SINTÉTICA de cadencia (live).
  const W = data.width;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 120 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        {data.bands.map((b, i) => <rect key={`bd${i}`} x={b.x0} y={6} width={Math.max(0, b.x1 - b.x0)} height={H - 12} fill={b.color} opacity={0.1} rx={3} />)}
        <line x1={0} x2={W} y1={CY} y2={CY} stroke="rgba(255,255,255,0.07)" strokeWidth={0.6} />
        {data.gaps.map((g, i) => <line key={`g${i}`} x1={g} x2={g} y1={CY - 6} y2={CY + 6} stroke="rgba(255,255,255,0.28)" strokeWidth={0.8} />)}
        {data.bars.map((b, i) => <rect key={i} x={b.x} y={CY - b.h / 2} width={b.w} height={b.h} rx={1} fill={b.emph ? '#EAD08A' : '#C8A24E'} opacity={b.emph ? 1 : 0.74} />)}
      </svg>
      {/* Markers como overlay HTML (texto nítido, no se deforma con el stretch). */}
      {data.markers.map((m, i) => (
        <div key={i} style={{ position: 'absolute', left: `${(m.x / W) * 100}%`, top: 2, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5, fontWeight: 800, lineHeight: 1, color: m.color, background: 'rgba(0,0,0,0.35)', border: `1px solid ${m.color}55`, borderRadius: 5, padding: '2px 5px', whiteSpace: 'nowrap' }}>
            {m.kind === 'pause' ? <><Pause size={9} /> {m.label}</> : m.kind === 'tone' ? m.label : m.label}
          </span>
          <span style={{ width: 1, height: 10, background: `${m.color}66` }} />
        </div>
      ))}
    </div>
  );
}
