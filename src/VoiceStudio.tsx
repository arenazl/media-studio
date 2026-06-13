// Estudio de voz — texto libre + marcadores intuitivos en formato TIMELINE.
// 40+ voces (género → edad), todos los parámetros, reinicio y exportar.
// App-agnóstica: genera contra el media-service (la key vive allá).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Download, Play, Pause, RotateCcw, Search } from 'lucide-react';
import { BRAND, FONT_SANS } from './lib/brand';
import { TTS_SERVICE_URL } from './config';

interface Voice { voice_id: string; name: string; gender?: string; age?: string; accent?: string; use_case?: string; description?: string; }

const TONES = [
  { tag: '[excited]', label: 'Entusiasmo', color: '#F5A623' },
  { tag: '[serious]', label: 'Serio', color: '#3B82F6' },
  { tag: '[whispers]', label: 'Susurro', color: '#8B5CF6' },
  { tag: '[curious]', label: 'Curioso', color: '#22D3EE' },
  { tag: '[sighs]', label: 'Suspiro', color: '#EC4899' },
];
const PAUSES = [
  { label: 'Pausa 0.4s', ins: ' <break time="0.4s" /> ' },
  { label: 'Pausa 0.9s', ins: ' <break time="0.9s" /> ' },
];
const toneColor = (line: string) => {
  const m = line.match(/\[([a-z]+)\]/);
  return (m && TONES.find((t) => t.tag === `[${m[1]}]`)?.color) || null;
};
const cleanLine = (line: string) => line.replace(/\[[a-z]+\]/g, '').replace(/<break[^>]*\/>/g, '⏸').trim();

const DEFAULT_TEXT = 'Escribí o pegá tu texto acá.\nCada línea es una frase del timeline.\nSeleccioná una palabra y marcá énfasis, o poné el cursor y agregá una pausa o un tono.';

let _actx: AudioContext | null = null;
const audioCtx = () => (_actx ||= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());

// barras decorativas deterministas (look de clip, sin audio aún)
const seededBars = (seed: string, n: number) => {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: n }, () => { h = (h * 1103515245 + 12345) >>> 0; return 0.2 + ((h % 1000) / 1000) * 0.8; });
};
function MiniWave({ seed, color }: { seed: string; color: string }) {
  const bars = seededBars(seed, 22);
  return (
    <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{ width: '100%', height: 38, display: 'block' }}>
      {bars.map((b, i) => <rect key={i} x={i * (100 / 22) + 0.4} y={(20 - b * 20) / 2} width={100 / 22 - 1} height={b * 20} rx={0.7} fill={color} opacity={0.6} />)}
    </svg>
  );
}
function BigWave({ peaks }: { peaks: number[] }) {
  const n = peaks.length;
  return (
    <svg viewBox="0 0 1000 56" preserveAspectRatio="none" style={{ width: '100%', height: 52, display: 'block' }}>
      {peaks.map((p, i) => { const h = Math.max(2, p * 54); return <rect key={i} x={i * (1000 / n)} y={(56 - h) / 2} width={Math.max(1, 1000 / n - 1.2)} height={h} rx={1} fill={BRAND.gold} opacity={0.9} />; })}
    </svg>
  );
}

export default function VoiceStudio() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState('yA5jrK1S9cpCAojBYyMu');
  const [q, setQ] = useState('');
  const [model, setModel] = useState('eleven_v3');
  const [stability, setStability] = useState(0.4);
  const [similarity, setSimilarity] = useState(0.8);
  const [style, setStyle] = useState(0.5);
  const [speed, setSpeed] = useState(1.0);
  const [boost, setBoost] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [playing, setPlaying] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch(`${TTS_SERVICE_URL}/voices`).then((r) => r.json()).then((d) => setVoices(d.voices || [])).catch(() => {});
  }, []);

  const lines = useMemo(() => text.split('\n').map((l) => l), [text]);

  const insertAtCursor = (before: string) => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart ?? text.length, e = ta.selectionEnd ?? text.length;
    setText(text.slice(0, s) + before + text.slice(e));
    requestAnimationFrame(() => { ta.focus(); const p = s + before.length; ta.setSelectionRange(p, p); });
  };
  const emphasize = () => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart ?? 0, e = ta.selectionEnd ?? 0; if (s === e) return;
    setText(text.slice(0, s) + text.slice(s, e).toUpperCase() + text.slice(e));
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s, e); });
  };
  const focusLine = (i: number) => {
    const ta = taRef.current; if (!ta) return;
    const start = lines.slice(0, i).reduce((a, l) => a + l.length + 1, 0);
    ta.focus(); ta.setSelectionRange(start, start + lines[i].length);
  };
  const reset = () => { setText(DEFAULT_TEXT); setStability(0.4); setSimilarity(0.8); setStyle(0.5); setSpeed(1.0); setBoost(true); setUrl(null); };

  const generate = async () => {
    if (!text.trim() || !voiceId) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${TTS_SERVICE_URL}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: voiceId, model_id: model, stability, similarity_boost: similarity, style, speed, use_speaker_boost: boost }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status} · ${(await r.text()).slice(0, 140)}`);
      const blob = await r.blob();
      if (url) URL.revokeObjectURL(url);
      const u = URL.createObjectURL(blob); setUrl(u);
      // waveform real del audio generado
      try {
        const ctx = audioCtx(); await ctx.resume();
        const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
        const ch = buf.getChannelData(0); const N = 200; const step = Math.max(1, Math.floor(ch.length / N));
        const pk: number[] = [];
        for (let i = 0; i < N; i++) { let m = 0; for (let j = 0; j < step; j++) { const v = Math.abs(ch[i * step + j] || 0); if (v > m) m = v; } pk.push(m); }
        const mx = Math.max(...pk, 0.001); setPeaks(pk.map((v) => v / mx));
      } catch { setPeaks(null); }
      const a = audioRef.current; if (a) { a.src = u; a.currentTime = 0; a.play().then(() => setPlaying(true)).catch(() => {}); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); } finally { setBusy(false); }
  };
  const toggle = () => { const a = audioRef.current; if (!a || !url) return; if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); } };

  // Voces agrupadas por género → edad
  const GENDERS: [string, string][] = [['female', 'Femeninas'], ['male', 'Masculinas'], ['', 'Otras']];
  const AGES: [string, string][] = [['young', 'Joven'], ['middle_aged', 'Adulta'], ['old', 'Mayor'], ['', '—']];
  const fil = voices.filter((v) => `${v.name} ${v.accent || ''} ${v.use_case || ''}`.toLowerCase().includes(q.toLowerCase()));

  const btn: React.CSSProperties = { cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: '6px 11px' };
  const Slider = ({ label, val, set, min, max, step, hint, fmt }: { label: string; val: number; set: (n: number) => void; min: number; max: number; step: number; hint?: string; fmt: (n: number) => string }) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 12, color: BRAND.gold, fontWeight: 700 }}>{fmt(val)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ accentColor: BRAND.gold, width: '100%' }} />
      {hint && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{hint}</div>}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 24, alignItems: 'start', fontFamily: FONT_SANS, color: '#fff' }}>
      {/* EDITOR */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: BRAND.gold, letterSpacing: '0.04em', marginRight: 2 }}>MARCAR:</span>
          <button onClick={emphasize} style={{ ...btn, color: BRAND.ink, background: BRAND.gold, border: 'none', fontWeight: 800 }}>ÉNFASIS</button>
          {PAUSES.map((p) => (<button key={p.label} onClick={() => insertAtCursor(p.ins)} style={btn}>{p.label}</button>))}
          {TONES.map((t) => (<button key={t.tag} onClick={() => insertAtCursor(t.tag + ' ')} style={{ ...btn, borderColor: `${t.color}66`, color: t.color }}>{t.label}</button>))}
          <button onClick={reset} title="Reiniciar" style={{ ...btn, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}><RotateCcw size={13} /> Reiniciar</button>
        </div>
        <textarea ref={taRef} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false}
          style={{ width: '100%', minHeight: 240, resize: 'vertical', borderRadius: 14, padding: 16, fontSize: 15.5, lineHeight: 1.7, fontFamily: FONT_SANS, color: '#fff', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none' }} />

        {/* TIMELINE */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: BRAND.azure, letterSpacing: '0.04em', marginBottom: 7 }}>TIMELINE</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
            {lines.filter((l) => l.trim()).map((l, i) => {
              const c = toneColor(l) || 'rgba(255,255,255,0.3)';
              return (
                <button key={i} onClick={() => focusLine(lines.indexOf(l))} title={l} style={{ flex: '0 0 auto', width: 124, cursor: 'pointer', borderRadius: 10, padding: '11px 11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `4px solid ${c}` }}>
                  <MiniWave seed={l} color={c} />
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>Cada línea = un clip. Marcá énfasis (MAYÚSCULAS), o poné el cursor y sumá pausa/tono. Solo <b>v3</b> respeta los tonos.</div>
      </div>

      {/* CONTROLES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderRadius: 16, padding: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: BRAND.azure, letterSpacing: '0.04em' }}>VOZ ({voices.length})</span>
          </div>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search size={13} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 9, top: 9 }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar voz / acento…" style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px 6px 28px', fontSize: 12, borderRadius: 8, color: '#fff', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none' }} />
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
            {GENDERS.map(([g, gl]) => {
              const inG = fil.filter((v) => (v.gender || '') === g);
              if (!inG.length) return null;
              return (
                <div key={g || 'x'} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: BRAND.gold, marginBottom: 5 }}>{gl}</div>
                  {AGES.map(([a, al]) => {
                    const inA = inG.filter((v) => (v.age || '') === a);
                    if (!inA.length) return null;
                    return (
                      <div key={a || 'x'} style={{ marginBottom: 5 }}>
                        <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>{al}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {inA.map((v) => {
                            const on = voiceId === v.voice_id;
                            return (<button key={v.voice_id} onClick={() => setVoiceId(v.voice_id)} title={`${v.accent || ''} · ${v.description || ''}`} style={{ cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#fff', borderRadius: 999, padding: '3px 9px', background: on ? `${BRAND.azure}30` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${on ? BRAND.azure : 'rgba(255,255,255,0.12)'}` }}>{v.name}</button>);
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {!voices.length && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>cargando voces…</div>}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Modelo</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ id: 'eleven_v3', label: 'v3' }, { id: 'eleven_multilingual_v2', label: 'v2' }, { id: 'eleven_flash_v2_5', label: 'flash' }].map((m) => (
              <button key={m.id} onClick={() => setModel(m.id)} style={{ cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: '#fff', borderRadius: 8, padding: '6px 10px', flex: 1, background: model === m.id ? `${BRAND.gold}22` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${model === m.id ? BRAND.gold : 'rgba(255,255,255,0.12)'}` }}>{m.label}</button>
            ))}
          </div>
        </div>

        <Slider label="Estabilidad" val={stability} set={setStability} min={0} max={1} step={0.05} hint="bajo = más expresivo" fmt={(v) => v.toFixed(2)} />
        <Slider label="Similitud" val={similarity} set={setSimilarity} min={0} max={1} step={0.05} fmt={(v) => v.toFixed(2)} />
        <Slider label="Estilo" val={style} set={setStyle} min={0} max={1} step={0.05} fmt={(v) => v.toFixed(2)} />
        <Slider label="Cadencia" val={speed} set={setSpeed} min={0.7} max={1.2} step={0.05} hint="0.7 lento — 1.2 rápido" fmt={(v) => `${v.toFixed(2)}×`} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
          <input type="checkbox" checked={boost} onChange={(e) => setBoost(e.target.checked)} style={{ accentColor: BRAND.gold, width: 15, height: 15 }} /> Speaker boost
        </label>

        <button onClick={generate} disabled={busy} style={{ cursor: busy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 13, borderRadius: 12, border: 'none', background: busy ? 'rgba(255,255,255,0.15)' : BRAND.gold, color: busy ? '#fff' : BRAND.ink, fontWeight: 800, fontSize: 15 }}>
          <Mic size={16} /> {busy ? 'Generando…' : 'Generar voz'}
        </button>
        {err && <span style={{ fontSize: 11.5, color: '#ef4444' }}>error: {err}</span>}
        {peaks && <div style={{ borderRadius: 10, padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}><BigWave peaks={peaks} /></div>}
        {url && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={toggle} style={{ cursor: 'pointer', width: 42, height: 42, borderRadius: 11, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <a href={url} download="voz.mp3" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 11, borderRadius: 11, background: BRAND.azure, color: '#fff', fontWeight: 800, fontSize: 13.5 }}><Download size={16} /> Exportar mp3</a>
          </div>
        )}
        <audio ref={audioRef} onEnded={() => setPlaying(false)} />
      </div>
    </div>
  );
}
