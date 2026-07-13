// Paso 8 — MONTAJE + EXPORT (la Salida 2). "Armar desde el storyboard" arma el MontajePlan (escenas
// en orden con su toma, audio keep/mute, música por mood, silencio antes del gag). "Exportar mp4"
// llama al render server-side (video xfade + diálogo de clips + voz + música con ducking/silencio) y
// registra el export en el comercial. Este es el botón de render que hoy NO existía.
import { useRef, useState } from 'react';
import { Loader2, Clapperboard, Film, Download, Music2, VolumeX, Volume2, Gauge, Mic, Upload, X, ArrowRightToLine } from 'lucide-react';
import { API_BASE } from '../config';
import { errMsg, runMolde, PasoEmpty, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { storyboardToMontaje, totalDuration, type MontajeState, type MontajePlan } from '../lib/montajePlan';
import type { QaResult } from '../lib/comercial';
import { MUSIC_TRACKS } from '../lib/music';

const roleKind = (r: string | undefined) => (r === 'hook' ? 'hook' : r === 'cta' ? 'cta' : r === 'gag' ? 'gag' : 'mid');
const trackLabel = (url: string | undefined) => MUSIC_TRACKS.find((t) => t.url === url)?.label;

// Rasteriza el logo (SVG o raster) a PNG dataURL para el overlay del render: ffmpeg NO decodifica SVG.
// Si falla (CORS de una URL externa, formato raro), devuelve null → el montaje se arma sin logo (no rompe).
async function rasterizeLogo(url: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('logo')); img.src = url; });
    const w = 172;                                   // 2× el ancho del overlay (86px) para nitidez
    const h = img.width ? Math.round((img.height / img.width) * w) : w;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h || w;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h || w);
    return canvas.toDataURL('image/png');
  } catch { return null; }
}

export default function PasoMontaje({ project, reelId, comercial, setComercial, onGoEditor }: PasoProps & { onGoEditor?: () => void }) {
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const qa = comercial?.qa ?? null;   // C9: el QA vive en el comercial (persiste); antes era useState y se perdía al salir del paso
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

  // Arma el plan desde el storyboard y le suma el logo del proyecto (rasterizado a PNG) para el overlay.
  const armar = async () => {
    const logoSrc = project.brandKit?.logoUrl ? await rasterizeLogo(project.brandKit.logoUrl) : null;
    setComercial((c) => {
      const plan = storyboardToMontaje(c);
      const planL = logoSrc ? { ...plan, logo: { src: logoSrc } } : plan;
      return {
        ...c,
        montaje: { plan: planL, exports: (c.montaje as MontajeState | undefined)?.exports || [] },
        estados: { ...c.estados, montaje: c.estados.montaje === 'aprobado' ? 'aprobado' : 'generado' },
      };
    });
  };

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
      }, { foco: 'todo' }, undefined, comercial);
      setComercial((c) => ({ ...c, qa: res as unknown as QaResult }));   // persiste (debounce del pipeline; flush al navegar)
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

  // segmentos ordenados de la timeline (silencio antes de su escena + escena), con duración para el ancho.
  const total = plan ? Math.max(1, totalDuration(plan)) : 1;
  const segs: Array<{ type: 'sil' | 'scene'; dur: number; key: string; s?: MontajePlan['scenes'][number] }> = [];
  if (plan) {
    for (const s of plan.scenes) {
      const sil = plan.silences.find((x) => x.antesDeEscena === s.escenaN);
      if (sil) segs.push({ type: 'sil', dur: Math.max(0.3, sil.durSec), key: `sil-${s.escenaN}` });
      segs.push({ type: 'scene', dur: Math.max(0.4, s.out - s.in), key: `sc-${s.escenaN}`, s });
    }
  }
  const voiceLeftPct = plan?.voice ? Math.min(92, (plan.voice.at / total) * 100) : 0;

  return (
    <div className="paso">
      <div className="paso-head">
        <div className="paso-head-txt">
          <h2 className="paso-title">Montaje</h2>
          <p className="paso-sub">Se arma solo desde el storyboard: clips en orden, diálogo de los actores, música con ducking y silencio antes del remate.</p>
        </div>
        <div className="paso-head-actions">
          <button className={plan ? 'paso-regen' : 'paso-gen'} onClick={() => void armar()} disabled={rendering}>
            <Clapperboard size={15} /> {plan ? 'Rearmar' : 'Armar desde el storyboard'}
          </button>
          <button className="rodaje-var" onClick={onGoEditor} disabled={!onGoEditor} title="Ajustar pistas en el editor multipista">
            <ArrowRightToLine size={13} /> Al multipista
          </button>
        </div>
      </div>
      {error && <div className="paso-error">{error}</div>}

      <div className="paso-body">
        {plan ? (
          <>
          <div className="pack-bar">
            <span className="pack-prog">{plan.scenes.length} escenas · {conClip} con clip · ~{totalDuration(plan).toFixed(1)}s</span>
          </div>

          {/* MINI-TIMELINE NLE: bloques proporcionales a duración + pistas de música y voz */}
          <div className="mont-nle">
            <div className="mont-tl">
              {segs.map((seg) => seg.type === 'sil' ? (
                <div key={seg.key} className="mont-tl-sil" style={{ flexGrow: seg.dur }} title={`${seg.dur.toFixed(1)}s de silencio`}>
                  <VolumeX size={12} />
                </div>
              ) : (
                <div key={seg.key} className={`mont-tl-block mont-tl-block--${roleKind(seg.s!.rol)}${seg.s!.src ? '' : ' mont-tl-block--empty'}`} style={{ flexGrow: seg.dur }} title={`Escena #${seg.s!.escenaN} · ${seg.dur.toFixed(1)}s`}>
                  <span className="mont-tl-n">#{seg.s!.escenaN}</span>
                  <span className="mont-tl-ico">{seg.s!.audio === 'keep' ? <Volume2 size={11} /> : <VolumeX size={11} />}</span>
                  <span className="mont-tl-dur">{(seg.s!.out - seg.s!.in).toFixed(1)}s</span>
                  {!seg.s!.src && <span className="mont-tl-flag">falta clip</span>}
                </div>
              ))}
            </div>
            <div className="mont-track">
              <span className="mont-track-lbl"><Music2 size={11} /> Música</span>
              <div className="mont-track-bar">
                {plan.music
                  ? <span className="mont-track-fill mont-track-fill--music">{trackLabel(plan.music.src) || 'música'} · con ducking</span>
                  : <span className="mont-track-empty">sin música</span>}
              </div>
            </div>
            <div className="mont-track">
              <span className="mont-track-lbl"><Mic size={11} /> Voz</span>
              <div className="mont-track-bar">
                {plan.voice
                  ? <span className="mont-track-fill mont-track-fill--voice" style={{ marginLeft: `${voiceLeftPct}%` }}>voz en off · desde {plan.voice.at}s</span>
                  : <span className="mont-track-empty">sin voz</span>}
              </div>
            </div>
          </div>

          {/* MIXER: controles de música + voz */}
          <div className="mont-mixer">
            <div className="paso-card mont-music">
              <div className="paso-card-h"><Music2 size={12} /> Música {plan.music ? `— ${trackLabel(plan.music.src) || 'elegida'}` : '— sin música'}</div>
              <select className="mont-select" value={plan.music?.src || ''} onChange={(e) => setMusica(e.target.value)}>
                <option value="">Sin música</option>
                {MUSIC_TRACKS.map((t) => <option key={t.id} value={t.url}>{t.cat} · {t.label}</option>)}
              </select>
            </div>

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

          {/* QA holístico: gauge + issues por severidad */}
          {qa && (
            <div className={`mont-qa${qa.score < 38 ? ' mont-qa--warn' : ' mont-qa--ok'}`}>
              <div className="paso-card-h"><Gauge size={12} /> Calidad del comercial</div>
              <div className="mont-qa-gauge">
                <span className="mont-qa-num">{qa.score}<span>/50</span></span>
                <div className="mont-qa-meter"><span className="mont-qa-meter-fill" style={{ width: `${Math.min(100, (qa.score / 50) * 100)}%` }} /></div>
                <span className="mont-qa-verdict">{qa.verdict}{qa.score < 38 ? ' — conviene ajustar antes de exportar (no bloquea)' : ''}</span>
              </div>
              {!!qa.issues?.length && (
                <div className="mont-qa-issues">
                  {qa.issues.map((it, i) => (
                    <div key={i} className="mont-qa-issue">
                      <span className={`mont-qa-sev mont-qa-sev--${it.severity}`}>{it.severity}</span>
                      <span>{it.note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* avisos de clips faltantes (explican por qué el export queda bloqueado) */}
          {!conClip && <div className="paso-empty">Faltan clips importados en el Rodaje: el render necesita al menos una escena con clip.</div>}
          {conClip > 0 && sinClip.length > 0 && (
            <div className="paso-empty">Faltan clips en las escenas {sinClip.join(', ')} — importalos en Rodaje o sacalas del montaje antes de exportar.</div>
          )}

          {ultimo && (
            <div className="mont-export-card">
              <div className="paso-card-h"><Film size={12} /> Último export</div>
              <div className="mont-export-frame">
                <video className="mont-export-video" src={`${API_BASE}/api/storage/${ultimo.fileRef}`} controls playsInline preload="metadata" />
              </div>
              <a className="pack-export" href={`${API_BASE}/api/storage/${ultimo.fileRef}`} download>
                <Download size={14} /> Descargar mp4
              </a>
              {exports.length > 1 && <span className="pack-prog">{exports.length} exports</span>}
            </div>
          )}
          </>
        ) : (
          <PasoEmpty icon={Clapperboard}>Armá el montaje desde el storyboard. Necesitás clips importados en el Rodaje.</PasoEmpty>
        )}
      </div>
      {/* PIE del panel: estado del montaje (izq) + acciones chequear/exportar (der) */}
      <div className="paso-foot paso-foot--split">
        <span className="paso-estado">{estadoDelPaso('montaje', comercial)}</span>
        {plan && (
          <div className="mont-foot-actions">
            <button className="rodaje-import mont-qa-btn" onClick={chequear} disabled={qaBusy || rendering}>
              {qaBusy ? <Loader2 size={13} className="paso-spin" /> : <Gauge size={13} />} Chequear calidad
            </button>
            <button className="paso-approve mont-export" onClick={exportar} disabled={rendering || !conClip || sinClip.length > 0}>
              {rendering ? <><Loader2 size={15} className="paso-spin" /> Renderizando el mp4…</> : <><Film size={15} /> Exportar mp4</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
