// Panel de la función "Prompts Veo" (proceso guiado, nivel pieza). Toma el contexto del
// proyecto (KB ya importado: brief, marca, pantallas) + el guion de un reel, y pide al backend
// (/api/run-function, Claude headless) la SECUENCIA de clips para un human reel. Todo on-demand:
// "Generar" hace 1 llamada; "Regenerar" rehace la secuencia o un clip puntual (variantes).
// Embebido en GuidedPanel: oculta su header y toma la pieza por prop (reelId controlado).
import { useState, useEffect } from 'react';
import { Clapperboard, RefreshCw, Loader2, Copy, Check, Wand2, Music, Mic } from 'lucide-react';
import { API_BASE } from './config';
import { getFunction } from './lib/functionCatalog';
import type { Project } from './lib/projects';
import './VeoPanel.css';

interface Clip { id: string; role?: string; tStart?: number; tEnd?: number; durationSec?: number; label?: string; prompt: string }
interface Sequence { clips: Clip[]; music?: { mood?: string }; narration?: string[] }
type Phase = 'idle' | 'loading' | 'done' | 'error';

const screensOf = (p: Project) => (Array.isArray(p.screens) && p.screens.length
  ? (p.screens as Record<string, unknown>[])
  : (p.screenshots || []).map((s) => ({ label: (s.split('/').pop() || s).replace(/\.\w+$/, '').replace(/[-_]/g, ' ') })));

export default function VeoPanel({ project, reelId: reelIdProp, embedded }: { project: Project; reelId?: string; embedded?: boolean }) {
  const fn = getFunction('veo');
  const reels = project.reels || [];
  const [internalReel, setInternalReel] = useState(reels[0]?.id || '');
  const reelId = reelIdProp || internalReel;
  const [opts, setOpts] = useState<Record<string, string>>(
    Object.fromEntries((fn?.options || []).map((o) => [o.id, o.default || o.choices?.[0]?.value || ''])),
  );
  const [seq, setSeq] = useState<Sequence | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [err, setErr] = useState('');
  const [busyClip, setBusyClip] = useState('');
  const [copied, setCopied] = useState('');

  const reel = reels.find((r) => r.id === reelId);

  // carga la secuencia de prompts veo que el wizard YA generó (guardada en la pieza) — ver/regenerar sin gastar.
  useEffect(() => {
    if (reel?.videoPrompts?.length) { setSeq({ clips: reel.videoPrompts as Clip[] }); setPhase('done'); }
    else { setSeq(null); setPhase('idle'); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reelId]);

  const context = () => ({
    project: { name: project.name, phonetic: project.brandKit?.phonetic || project.name, brief: project.brief || '', screens: screensOf(project) },
    piece: { guion: reel?.guion || [], durationSec: reel?.durationSec || 17 },
  });

  const run = async (regenerate?: { clipId: string; sequence: Sequence }) => {
    if (regenerate) setBusyClip(regenerate.clipId); else { setPhase('loading'); setSeq(null); }
    setErr('');
    try {
      const r = await fetch(`${API_BASE}/api/run-function`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId: 'veo', context: context(), options: opts, regenerate }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo generar');
      if (regenerate && d.result?.clip) {
        setSeq((s) => (s ? { ...s, clips: s.clips.map((c) => (c.id === d.result.clip.id ? d.result.clip : c)) } : s));
      } else { setSeq(d.result); setPhase('done'); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); if (!regenerate) setPhase('error'); }
    finally { setBusyClip(''); }
  };

  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(''), 1200); } catch { /* noop */ }
  };

  if (!fn) return <div className="veo-empty">La función "Prompts Veo" no está en el catálogo.</div>;

  const inner = (
    <>
      <div className="veo-bar">
        {!embedded && reels.length > 1 && (
          <label className="veo-field">
            <span>Pieza</span>
            <select value={reelId} onChange={(e) => setInternalReel(e.target.value)}>
              {reels.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </label>
        )}
        {fn.options.map((o) => (
          <div key={o.id} className="veo-field">
            <span>{o.label}</span>
            <div className="veo-chips">
              {(o.choices || []).map((c) => (
                <button key={c.value} className={opts[o.id] === c.value ? 'veo-chip veo-chip--on' : 'veo-chip'}
                  onClick={() => setOpts((m) => ({ ...m, [o.id]: c.value }))}>{c.label}</button>
              ))}
            </div>
          </div>
        ))}
        <button className="veo-run" disabled={phase === 'loading' || !reel} onClick={() => run()}>
          {phase === 'loading' ? <Loader2 size={15} className="veo-spin" /> : seq ? <RefreshCw size={15} /> : <Wand2 size={15} />}
          {seq ? 'Regenerar secuencia' : 'Generar secuencia'}
        </button>
      </div>

      {err && <div className="veo-error">{err}</div>}
      {phase === 'loading' && <div className="veo-loading"><Loader2 size={26} className="veo-spin" /> armando la secuencia…</div>}

      {seq && (
        <div className="veo-result">
          <div className="veo-clips">
            {seq.clips.map((c) => (
              <article key={c.id} className="veo-clip">
                <div className="veo-clip-h">
                  <span className={`veo-role veo-role--${c.role || 'broll'}`}>{c.role || 'broll'}</span>
                  <span className="veo-clip-label">{c.label}</span>
                  <span className="veo-clip-t">{c.durationSec ? `${c.durationSec}s` : ''}</span>
                  <button className="veo-icon" title="Copiar prompt" onClick={() => copy(c.id, c.prompt)}>
                    {copied === c.id ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button className="veo-icon" title="Regenerar este clip" disabled={!!busyClip} onClick={() => run({ clipId: c.id, sequence: seq })}>
                    {busyClip === c.id ? <Loader2 size={13} className="veo-spin" /> : <RefreshCw size={13} />}
                  </button>
                </div>
                <pre className="veo-prompt">{c.prompt}</pre>
              </article>
            ))}
          </div>

          <aside className="veo-side">
            {seq.music?.mood && <div className="veo-card"><div className="veo-card-h"><Music size={14} /> Música</div><p>{seq.music.mood}</p></div>}
            {!!seq.narration?.length && (
              <div className="veo-card">
                <div className="veo-card-h"><Mic size={14} /> Narración (voz en off) — probá las 3</div>
                {seq.narration.map((n, i) => (
                  <div key={i} className="veo-narr">
                    <p>{n}</p>
                    <button className="veo-icon" title="Copiar" onClick={() => copy(`n${i}`, n)}>{copied === `n${i}` ? <Check size={12} /> : <Copy size={12} />}</button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );

  if (embedded) return <div className="veo-fn">{inner}</div>;
  return (
    <div className="veo-root">
      <header className="veo-head">
        <div className="veo-title"><Clapperboard size={18} /> Prompts Veo — secuencia 9:16</div>
        <p className="veo-sub">{fn.description} · se genera desde la data del proyecto, on-demand.</p>
      </header>
      {inner}
    </div>
  );
}
