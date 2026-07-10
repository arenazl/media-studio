// Paso 8 — MONTAJE + EXPORT (la Salida 2). "Armar desde el storyboard" arma el MontajePlan (escenas
// en orden con su toma, audio keep/mute, música por mood, silencio antes del gag). "Exportar mp4"
// llama al render server-side (video xfade + diálogo de clips + voz + música con ducking/silencio) y
// registra el export en el comercial. Este es el botón de render que hoy NO existía.
import { useRef, useState } from 'react';
import { Loader2, Clapperboard, Film, Download, Music2, VolumeX, Gauge, Mic, Upload, X } from 'lucide-react';
import { API_BASE } from '../config';
import { errMsg, runMolde, type PasoProps } from './pasoKit';
import { storyboardToMontaje, totalDuration, type MontajeState, type MontajePlan } from '../lib/montajePlan';
import { MUSIC_TRACKS } from '../lib/music';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', gag: 'Remate', cta: 'CTA' };
const trackLabel = (url: string | undefined) => MUSIC_TRACKS.find((t) => t.url === url)?.label;

interface QaResult { score: number; verdict: string; issues?: { severity: string; note: string }[] }

export default function PasoMontaje({ project, reelId, comercial, setComercial }: PasoProps) {
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const [qa, setQa] = useState<QaResult | null>(null);
  const [qaBusy, setQaBusy] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const voiceInput = useRef<HTMLInputElement | null>(null);
  const montaje = comercial?.montaje as MontajeState | undefined;
  const plan = montaje?.plan;
  const exports = montaje?.exports || [];
  const ultimo = exports[exports.length - 1];
  const conClip = plan ? plan.scenes.filter((s) => s.src).length : 0;
  const sinClip = plan ? plan.scenes.filter((s) => !s.src).map((s) => s.escenaN) : [];
  const reel = project.reels.find((r) => r.id === reelId);
  const voiceGrabada = reel?.voiceConfig?.audioRef;   // voz persistida desde la tab Audio

  const armar = () => setComercial((c) => ({
    ...c,
    montaje: { plan: storyboardToMontaje(c), exports: (c.montaje as MontajeState | undefined)?.exports || [] },
    estados: { ...c.estados, montaje: c.estados.montaje === 'aprobado' ? 'aprobado' : 'generado' },
  }));

  const setMusica = (url: string) => setComercial((c) => {
    const m = c.montaje as MontajeState | undefined;
    if (!m?.plan) return c;
    const music = url ? { src: url, gain: 0.28, duck: true } : undefined;
    return { ...c, montaje: { ...m, plan: { ...m.plan, music } } };
  });

  const patch = (up: (p: MontajePlan) => MontajePlan) => setComercial((c) => {
    const m = c.montaje as MontajeState | undefined;
    return m?.plan ? { ...c, montaje: { ...m, plan: up(m.plan) } } : c;
  });

  // ── Voz en off ──────────────────────────────────────────────────────────────
  const setVoice = (src: string, at = 0) => patch((pl) => ({ ...pl, voice: { src, at } }));
  const usarVozGrabada = () => { if (voiceGrabada) setVoice(voiceGrabada, plan?.voice?.at || 0); };
  const setVoiceAt = (at: number) => patch((pl) => (pl.voice ? { ...pl, voice: { ...pl.voice, at } } : pl));
  const quitarVoz = () => patch((pl) => ({ ...pl, voice: undefined }));
  // subir un mp3/wav propio como voz en off: va por el mismo endpoint de assets (fileRef) que el rodaje.
  const subirVoz = async (file: File) => {
    setVoiceBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(project.id)}/assets`, { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo subir la voz');
      setVoice(d.asset.fileRef, plan?.voice?.at || 0);
    } catch (e) { setError(errMsg(e)); } finally { setVoiceBusy(false); }
  };

  const chequear = async () => {
    if (!comercial) return;
    setQaBusy(true); setError('');
    try {
      const res = await runMolde('qa', project, {
        concepto: comercial.concepto, guion: comercial.guion, cast: comercial.cast,
        storyboard: comercial.storyboard, packFlow: comercial.packFlow, objetivo: comercial.concepto?.idea,
      }, { foco: 'todo' });
      setQa(res as unknown as QaResult);
    } catch (e) { setError(errMsg(e)); } finally { setQaBusy(false); }
  };

  const exportar = async () => {
    if (!plan) return;
    setRendering(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/render-comercial`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, projectId: project.id, reelId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo renderizar');
      setComercial((c) => {
        const m = c.montaje as MontajeState | undefined;
        const exps = [...(m?.exports || []), { fileRef: d.fileRef, createdAt: Date.now() }];
        return { ...c, montaje: { plan: m?.plan || plan, exports: exps }, estados: { ...c.estados, montaje: 'aprobado' } };
      });
    } catch (e) { setError(errMsg(e)); } finally { setRendering(false); }
  };

  return (
    <div className="paso">
      <div className="paso-head">
        <div className="paso-head-txt">
          <h2 className="paso-title">Montaje</h2>
          <p className="paso-sub">Se arma solo desde el storyboard: clips en orden, diálogo de los actores, música con ducking y silencio antes del remate.</p>
        </div>
        <button className="paso-gen" onClick={armar} disabled={rendering}>
          <Clapperboard size={15} /> {plan ? 'Rearmar desde el storyboard' : 'Armar desde el storyboard'}
        </button>
      </div>
      {error && <div className="paso-error">{error}</div>}

      {plan ? (
        <div className="paso-body">
          <div className="pack-bar">
            <span className="pack-prog">{plan.scenes.length} escenas · {conClip} con clip · ~{totalDuration(plan).toFixed(1)}s</span>
          </div>

          {/* música */}
          <div className="paso-card mont-music">
            <div className="paso-card-h"><Music2 size={12} /> Música {plan.music ? `— ${trackLabel(plan.music.src) || 'elegida'} (con ducking)` : '— sin música'}</div>
            <select className="mont-select" value={plan.music?.src || ''} onChange={(e) => setMusica(e.target.value)}>
              <option value="">Sin música</option>
              {MUSIC_TRACKS.map((t) => <option key={t.id} value={t.url}>{t.cat} · {t.label}</option>)}
            </select>
          </div>

          {/* voz en off — la música baja debajo de ella (ducking) */}
          <div className="paso-card mont-music">
            <div className="paso-card-h"><Mic size={12} /> Voz en off {plan.voice ? '— cargada (la música baja debajo)' : '— sin voz'}</div>
            <div className="mont-voice">
              {voiceGrabada && (
                <button className="rodaje-var" onClick={usarVozGrabada} disabled={voiceBusy}>
                  Usar la voz grabada del comercial
                </button>
              )}
              <button className="rodaje-var" onClick={() => voiceInput.current?.click()} disabled={voiceBusy}>
                {voiceBusy ? <Loader2 size={12} className="paso-spin" /> : <Upload size={12} />} Subir mp3/wav
              </button>
              <input ref={voiceInput} type="file" accept="audio/*" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) subirVoz(f); e.target.value = ''; }} />
              {plan.voice && (
                <>
                  <label className="mont-voice-at">
                    empieza en
                    <input type="number" min={0} step={0.5} value={plan.voice.at}
                      onChange={(e) => setVoiceAt(Math.max(0, Number(e.target.value) || 0))} /> s
                  </label>
                  <button className="rodaje-var" onClick={quitarVoz} title="Quitar la voz en off"><X size={12} /> quitar voz</button>
                </>
              )}
            </div>
            {!voiceGrabada && !plan.voice && <div className="mont-voice-hint">Grabá la voz en la tab Audio (queda guardada) o subí un mp3 acá.</div>}
          </div>

          {/* escenas */}
          <div className="paso-cards">
            {plan.scenes.map((s) => (
              <article key={s.escenaN} className="paso-scene">
                <div className="paso-scene-h">
                  <span className="paso-scene-n">#{s.escenaN}</span>
                  {s.rol && <span className="paso-scene-tag">{ROL_LABEL[s.rol] || s.rol}</span>}
                  <span className="paso-t">{(s.out - s.in).toFixed(1)}s</span>
                  <span className={`pack-estado pack-estado--${s.audio === 'keep' ? 'copiado' : 'pendiente'}`}>{s.audio === 'keep' ? 'con voz' : 'sin audio'}</span>
                  <span className="mont-tr">{s.transition === 'cut' ? 'corte' : s.transition}</span>
                  {!s.src && <span className="mont-nocl">falta clip</span>}
                </div>
                {s.dialogo && <div className="paso-block-visual">{s.dialogo}</div>}
              </article>
            ))}
          </div>

          {/* silencios */}
          {plan.silences.length > 0 && (
            <div className="paso-card">
              <div className="paso-card-h"><VolumeX size={12} /> Silencio estratégico</div>
              {plan.silences.map((sil, i) => (
                <div key={i} className="mont-sil">
                  {sil.durSec}s de silencio antes de la escena #{sil.antesDeEscena}
                  <button className="rodaje-var" onClick={() => patch((pl) => ({ ...pl, silences: pl.silences.filter((_, j) => j !== i) }))}>quitar</button>
                </div>
              ))}
            </div>
          )}

          {/* QA holístico */}
          {qa && (
            <div className={`paso-card mont-qa${qa.score < 38 ? ' mont-qa--warn' : ' mont-qa--ok'}`}>
              <div className="paso-card-h"><Gauge size={12} /> Calidad del comercial</div>
              <p className="mont-qa-score">{qa.score}<span>/50</span> · {qa.verdict}{qa.score < 38 ? ' — conviene ajustar antes de exportar (no bloquea)' : ''}</p>
              {!!qa.issues?.length && qa.issues.map((it, i) => (
                <div key={i} className="mont-qa-issue"><strong>[{it.severity}]</strong> {it.note}</div>
              ))}
            </div>
          )}

          {/* acciones: chequear calidad + exportar */}
          <div className="paso-foot mont-foot">
            <button className="rodaje-import mont-qa-btn" onClick={chequear} disabled={qaBusy || rendering}>
              {qaBusy ? <Loader2 size={13} className="paso-spin" /> : <Gauge size={13} />} Chequear calidad
            </button>
            <button className="paso-approve mont-export" onClick={exportar} disabled={rendering || !conClip || sinClip.length > 0}>
              {rendering ? <><Loader2 size={15} className="paso-spin" /> Renderizando el mp4…</> : <><Film size={15} /> Exportar mp4</>}
            </button>
          </div>

          {!conClip && <div className="paso-empty">Faltan clips importados en el Rodaje: el render necesita al menos una escena con clip.</div>}
          {conClip > 0 && sinClip.length > 0 && (
            <div className="paso-empty">Faltan clips en las escenas {sinClip.join(', ')} — importalos en Rodaje o sacalas del montaje antes de exportar.</div>
          )}

          {ultimo && (
            <div className="paso-card mont-result">
              <div className="paso-card-h">Último export</div>
              <video className="rodaje-video mont-video" src={`${API_BASE}/api/storage/${ultimo.fileRef}`} controls playsInline preload="metadata" />
              <a className="pack-export" href={`${API_BASE}/api/storage/${ultimo.fileRef}`} download>
                <Download size={14} /> Descargar mp4
              </a>
              {exports.length > 1 && <span className="pack-prog">{exports.length} exports</span>}
            </div>
          )}
        </div>
      ) : (
        <div className="paso-empty">Armá el montaje desde el storyboard. Necesitás clips importados en el Rodaje.</div>
      )}
    </div>
  );
}
