// Runner GENÉRICO de una función del catálogo (todas menos 'veo', que tiene su VeoPanel rico).
// Dibuja las opciones (chips del catálogo), corre /api/run-function on-demand (Claude headless),
// y renderiza el resultado con un view por tipo. "Regenerar" rehace el SET; en mockups y guion
// hay además "regenerar un ítem solo" (un slide / un bloque) — variantes, sin tocar lo demás.
import { useState, useEffect } from 'react';
import { Loader2, Wand2, RefreshCw, Copy, Check, Film } from 'lucide-react';
import { API_BASE } from './config';
import type { StudioFunction } from './lib/functionCatalog';
import type { Project, ProjectReel } from './lib/projects';

const screensOf = (p: Project) => (Array.isArray(p.screens) && p.screens.length
  ? (p.screens as Record<string, unknown>[])
  : (p.screenshots || []).map((s) => ({ label: (s.split('/').pop() || s).replace(/\.\w+$/, '').replace(/[-_]/g, ' ') })));

// qué función produce una lista regenerable ítem por ítem, y bajo qué key.
const LIST_KEY: Record<string, string> = { mockup: 'slides', script: 'blocks' };

export default function FunctionRunner({ fn, project, reel }: { fn: StudioFunction; project: Project; reel?: ProjectReel }) {
  const [opts, setOpts] = useState<Record<string, string>>(
    Object.fromEntries(fn.options.map((o) => [o.id, o.default || o.choices?.[0]?.value || ''])),
  );
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [reelUrl, setReelUrl] = useState<string | null>(null);   // mp4 del reel animado generado
  const [reelBusy, setReelBusy] = useState(false);

  const needsPiece = fn.level === 'piece';
  const listKey = LIST_KEY[fn.id];

  // carga el material que el wizard YA generó (guardado en la pieza) — para verlo/editarlo sin regenerar.
  useEffect(() => {
    if (!reel) { setResult(null); setPhase('idle'); return; }
    let loaded: Record<string, unknown> | null = null;
    if (fn.id === 'script' && reel.guion?.length) loaded = { blocks: reel.guion.map((n) => ({ role: '', narration: n })) };
    else if (fn.id === 'mockup' && reel.slides?.length) loaded = { slides: reel.slides };
    else if (fn.id === 'publish' && reel.publish) loaded = reel.publish as Record<string, unknown>;
    else if (fn.id === 'qa' && reel.qa) loaded = reel.qa as Record<string, unknown>;
    setResult(loaded); setPhase(loaded ? 'done' : 'idle'); setErr('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel?.id, fn.id]);
  const context = () => ({
    project: { name: project.name, phonetic: project.brandKit?.phonetic || project.name, brief: project.brief || '', screens: screensOf(project) },
    ...(needsPiece ? { piece: { guion: reel?.guion || [], angle: reel?.angulo, objective: reel?.objetivo, durationSec: reel?.durationSec || 18 } } : {}),
  });

  // regenerar el SET completo
  const run = async () => {
    setPhase('loading'); setErr('');
    try {
      const r = await fetch(`${API_BASE}/api/run-function`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId: fn.id, context: context(), options: opts }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo generar');
      setResult(d.result); setPhase('done');
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); setPhase('error'); }
  };

  // regenerar UN ítem (un slide / un bloque) — variante, sin tocar el resto
  const regenItem = async (index: number) => {
    if (!result || !listKey) return;
    setBusyIdx(index); setErr('');
    try {
      const r = await fetch(`${API_BASE}/api/run-function`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId: fn.id, context: context(), options: opts, regenerate: { index, [listKey]: result[listKey] } }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo regenerar');
      if (d.result?.item) {
        setResult((prev) => {
          if (!prev) return prev;
          const list = [...((prev[listKey] as unknown[]) || [])];
          list[index] = d.result.item;
          return { ...prev, [listKey]: list };
        });
      }
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); }
    finally { setBusyIdx(null); }
  };

  // REEL ANIMADO: manda los slides REALES (la metadata del mockup) + el brand → backend renderiza el mp4.
  const generarReelAnimado = async () => {
    if (!result?.slides || reelBusy) return;
    setReelBusy(true); setErr('');
    try {
      const bk = project.brandKit as Record<string, unknown> | undefined;
      const brand = {
        name: project.name,
        colors: { accent: bk?.color as string | undefined },
        logo: bk?.logoSvg ? { svg: bk.logoSvg as string } : undefined,
      };
      const r = await fetch(`${API_BASE}/api/mockup-reel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: result.slides, brand }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'no se pudo renderizar'); }
      const blob = await r.blob();
      setReelUrl((u) => { if (u) URL.revokeObjectURL(u); return URL.createObjectURL(blob); });
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); } finally { setReelBusy(false); }
  };

  return (
    <div className="veo-fn">
      <div className="veo-bar">
        {fn.options.map((o) => (
          <div key={o.id} className="veo-field">
            <span>{o.label}</span>
            <div className="veo-chips">
              {(o.type === 'screens' ? screensOf(project).map((s) => { const v = String((s as Record<string, unknown>).label ?? ''); return { value: v, label: v }; }) : (o.choices || [])).map((c) => (
                <button key={c.value} className={opts[o.id] === c.value ? 'veo-chip veo-chip--on' : 'veo-chip'}
                  onClick={() => setOpts((m) => ({ ...m, [o.id]: c.value }))}>{c.label}</button>
              ))}
            </div>
          </div>
        ))}
        <button className="veo-run" disabled={phase === 'loading' || (needsPiece && !reel)} onClick={run}>
          {phase === 'loading' ? <Loader2 size={15} className="veo-spin" /> : result ? <RefreshCw size={15} /> : <Wand2 size={15} />}
          {result ? 'Regenerar todo' : 'Generar'}
        </button>
      </div>

      {needsPiece && !reel && <div className="veo-error">Elegí una pieza arriba para esta función.</div>}
      {err && <div className="veo-error">{err}</div>}
      {phase === 'loading' && <div className="veo-loading"><Loader2 size={26} className="veo-spin" /> generando…</div>}
      {phase === 'done' && result != null && <ResultView fnId={fn.id} result={result} onRegenItem={listKey ? regenItem : undefined} busyIdx={busyIdx} />}
      {fn.id === 'mockup' && phase === 'done' && (result?.slides as unknown[])?.length ? (
        <div className="fr-reel">
          <button className="veo-run" onClick={generarReelAnimado} disabled={reelBusy}>
            {reelBusy ? <Loader2 size={15} className="veo-spin" /> : <Film size={15} />}
            {reelBusy ? 'Renderizando el reel…' : reelUrl ? 'Regenerar reel animado' : 'Generar reel animado'}
          </button>
          {reelUrl && <video src={reelUrl} controls playsInline className="fr-reel-video" />}
        </div>
      ) : null}
    </div>
  );
}

function Copyable({ id, text }: { id: string; text: string }) {
  const [hit, setHit] = useState('');
  return (
    <button className="veo-icon" title="Copiar" onClick={async () => { try { await navigator.clipboard.writeText(text); setHit(id); setTimeout(() => setHit(''), 1200); } catch { /* noop */ } }}>
      {hit === id ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// botón "regenerar este ítem"
function RegenBtn({ i, busyIdx, onRegenItem }: { i: number; busyIdx: number | null; onRegenItem?: (i: number) => void }) {
  if (!onRegenItem) return null;
  return (
    <button className="veo-icon" title="Regenerar este (variante)" disabled={busyIdx !== null} onClick={() => onRegenItem(i)}>
      {busyIdx === i ? <Loader2 size={12} className="veo-spin" /> : <RefreshCw size={12} />}
    </button>
  );
}

// render del resultado por tipo de función.
function ResultView({ fnId, result, onRegenItem, busyIdx }: { fnId: string; result: any; onRegenItem?: (i: number) => void; busyIdx: number | null }) {
  if (fnId === 'strategy') return (
    <div className="veo-fn-out">
      {result.positioning && <div className="veo-card"><div className="veo-card-h">Posicionamiento</div><p>{result.positioning}</p></div>}
      {!!result.audiences?.length && (
        <div className="veo-card"><div className="veo-card-h">Públicos</div>
          {result.audiences.map((a: any, i: number) => <div key={i} className="veo-narr"><p><strong>{a.label}</strong> — {a.pain}</p></div>)}
        </div>
      )}
      <div className="veo-clips">
        {(result.pieces || []).map((p: any) => (
          <article key={p.id} className="veo-clip"><div className="veo-clip-h">
            <span className={`veo-role veo-role--${p.objective === 'awareness' ? 'hook' : p.objective === 'conversion' ? 'close' : 'broll'}`}>{p.objective}</span>
            <span className="veo-clip-label">{p.angle}</span><span className="veo-clip-t">{p.durationSec}s</span>
          </div><pre className="veo-prompt">{p.creativeBrief}</pre></article>
        ))}
      </div>
    </div>
  );

  if (fnId === 'script') return (
    <div className="veo-clips">
      {(result.blocks || []).map((b: any, i: number) => (
        <article key={i} className="veo-clip"><div className="veo-clip-h">
          <span className="veo-role veo-role--broll">{b.role}</span>
          <span className="veo-clip-label">{b.narration}</span>
          <Copyable id={`b${i}`} text={b.narration} />
          <RegenBtn i={i} busyIdx={busyIdx} onRegenItem={onRegenItem} />
        </div>{b.visual && <pre className="veo-prompt">visual: {b.visual}</pre>}</article>
      ))}
      {result.music?.mood && <div className="veo-card"><div className="veo-card-h">Música</div><p>{result.music.mood}</p></div>}
    </div>
  );

  if (fnId === 'mockup') return (
    <div className="veo-clips">
      {(result.slides || []).map((s: any, i: number) => (
        <article key={i} className="veo-clip"><div className="veo-clip-h">
          <span className="veo-role veo-role--broll">{s.framing}</span>
          <span className="veo-clip-label">{s.screen} — {s.highlight}</span>
          <span className="veo-clip-t">{s.copy}</span>
          <RegenBtn i={i} busyIdx={busyIdx} onRegenItem={onRegenItem} />
        </div>{s.motion && <pre className="veo-prompt">motion: {s.motion}</pre>}</article>
      ))}
    </div>
  );

  if (fnId === 'publish') return (
    <div className="veo-fn-out">
      {result.hookOnScreen && <div className="veo-card"><div className="veo-card-h">Hook en pantalla</div><p>{result.hookOnScreen}</p></div>}
      <div className="veo-card"><div className="veo-card-h">Caption <Copyable id="cap" text={result.caption || ''} /></div><p>{result.caption}</p></div>
      {!!result.hashtags?.length && <div className="veo-card"><div className="veo-card-h">Hashtags <Copyable id="ht" text={(result.hashtags || []).join(' ')} /></div><p>{(result.hashtags || []).join('  ')}</p></div>}
      {result.cta && <div className="veo-card"><div className="veo-card-h">CTA</div><p>{result.cta}</p></div>}
    </div>
  );

  if (fnId === 'qa') return (
    <div className="veo-fn-out">
      <div className="veo-card"><div className="veo-card-h">Nota</div>
        <p style={{ fontSize: 28, fontWeight: 800 }}>{result.score}<span style={{ fontSize: 14, color: '#8b94a6' }}>/50</span> · {result.verdict}</p>
      </div>
      {!!result.issues?.length && (
        <div className="veo-card"><div className="veo-card-h">Qué ajustar</div>
          {result.issues.map((it: any, i: number) => <div key={i} className="veo-narr"><p><strong>[{it.severity}]</strong> {it.note}</p></div>)}
        </div>
      )}
    </div>
  );

  return <pre className="veo-prompt">{JSON.stringify(result, null, 2)}</pre>;
}
