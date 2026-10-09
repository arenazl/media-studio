// Paso 8 — MONTAJE + EXPORT (la Salida 2). "Armar desde el storyboard" arma el MontajePlan (escenas
// en orden con su toma, audio keep/mute, música por mood, silencio antes del gag). "Exportar mp4"
// llama al render server-side (video xfade + diálogo de clips + voz + música con ducking/silencio) y
// registra el export en el comercial. Este es el botón de render que hoy NO existía.
import { useRef, useState, useEffect, lazy, Suspense } from 'react';
import { Loader2, Clapperboard, Film, Download, Music2, VolumeX, Volume2, Gauge, Mic, Upload, X, ArrowRightToLine, Play, Pause } from 'lucide-react';
import { API_BASE } from '../config';
import { errMsg, runMolde, PasoEmpty, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { mediaKitParaMolde } from '../lib/mediaKit';
import { storyboardToMontaje, totalDuration, type MontajeState, type MontajePlan, type PalabraTiempo } from '../lib/montajePlan';
import { afinarMontaje } from '../lib/montajista';

// La vista previa exacta (Player de Remotion) se carga sólo cuando hay un plan v2: no entra al bundle inicial.
const PlayerMontaje = lazy(() => import('../remotion/PlayerMontaje'));
import type { QaResult } from '../lib/comercial';
import { MUSIC_TRACKS } from '../lib/music';

const roleKind = (r: string | undefined) => (r === 'hook' ? 'hook' : r === 'cta' ? 'cta' : r === 'gag' ? 'gag' : 'mid');
const trackLabel = (url: string | undefined) => MUSIC_TRACKS.find((t) => t.url === url)?.label;

export default function PasoMontaje({ project, reelId, comercial, setComercial, onGoEditor }: PasoProps & { onGoEditor?: () => void }) {
  const [rendering, setRendering] = useState(false);
  const [armando, setArmando] = useState(false);
  const [error, setError] = useState('');
  const qa = comercial?.qa ?? null;   // C9: el QA vive en el comercial (persiste); antes era useState y se perdía al salir del paso
  const [qaBusy, setQaBusy] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const voiceInput = useRef<HTMLInputElement | null>(null);

  // Preescucha de audio en vivo
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudioPreview = (url?: string) => {
    if (!url) return;
    if (previewUrl === url) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPreviewUrl(null);
      }
    } else {
      if (audioRef.current) audioRef.current.pause();
      const a = new Audio(url);
      audioRef.current = a;
      setPreviewUrl(url);
      a.play().catch(() => setPreviewUrl(null));
      a.onended = () => setPreviewUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  const montaje = comercial?.montaje as MontajeState | undefined;
  const plan = montaje?.plan;
  const playingTrack = !!(previewUrl && plan?.music?.src && previewUrl === plan.music.src);
  const playingVoice = !!(previewUrl && plan?.voice?.src && previewUrl === plan.voice.src);
  const exports = montaje?.exports || [];
  const ultimo = exports[exports.length - 1];
  const conClip = plan ? plan.scenes.filter((s) => s.src).length : 0;
  const sinClip = plan ? plan.scenes.filter((s) => !s.src).map((s) => s.escenaN) : [];
  const reel = project.reels.find((r) => r.id === reelId);
  const voiceGrabada = reel?.voiceConfig?.audioRef;   // voz persistida desde la tab Audio
  // En una pieza ANIMADA no hay paso Rodaje (pasosVisibles lo excluye): el video sale del paso Render.
  // Los avisos de "faltan clips" mandaban a importar en un paso que ese pipeline ni muestra.
  const esAnimado = comercial?.tipo === 'animado';

  // Arma el plan desde el storyboard. FILMADO: el montajista lo afina con las palabras transcriptas de cada
  // clip (recorta el aire, corta en frase, mete pantallas reales cuando la voz las nombra, placa final) y lo
  // marca para el motor Remotion. ANIMADO: como antes (el reel ya viene renderizado), con el logo rasterizado.
  const armar = async () => {
    if (!comercial) return;
    setArmando(true); setError('');
    try {
      const base = storyboardToMontaje(comercial);
      let planFinal: MontajePlan = base;
      const marca = { exacto: project.marcaKit?.nombreExacto || project.brandKit?.name, fonetica: project.marcaKit?.fonetica || project.brandKit?.phonetic };
      if (esAnimado) {
        // el video de mockups ya trae logo y placa final: acá sólo se le suman voz y música, sin acercamientos
        const afinado = afinarMontaje(base, { palabrasPorToma: {}, marca });
        planFinal = { ...afinado, scenes: afinado.scenes.map((s) => ({ ...s, punchFrom: 1, punchTo: 1 })) };
      } else {
        const refs = [...new Set(base.scenes.map((s) => s.src).filter(Boolean))];
        const pares = await Promise.all(refs.map(async (ref) => {
          try {
            const r = await fetch(`${API_BASE}/api/transcribir`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileRef: ref }) });
            const d = await r.json();
            return [ref, r.ok ? (d.words as PalabraTiempo[]) : undefined] as const;
          } catch { return [ref, undefined] as const; }
        }));
        const colores = project.marcaKit?.colores;
        planFinal = afinarMontaje(base, {
          palabrasPorToma: Object.fromEntries(pares),
          pantallas: project.pantallasKit,
          cta: project.cta,
          logoUrl: project.marcaKit?.logoUrl || project.brandKit?.logoUrl,
          marca,
          estilo: colores?.primario
            ? { primario: colores.primario, acento: colores.acento || '#F59E0B', fondo: colores.fondo || '#FAF7FF', texto: colores.texto || '#1E1B2E' }
            : undefined,
        });
      }
      setComercial((c) => ({
        ...c,
        montaje: { plan: planFinal, exports: (c.montaje as MontajeState | undefined)?.exports || [] },
        estados: { ...c.estados, montaje: c.estados.montaje === 'aprobado' ? 'aprobado' : 'generado' },
      }));
    } catch (e) { setError(errMsg(e)); } finally { setArmando(false); }
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
      // Fase 7: técnica, duración y kit viajan para el lint técnico del back (lintCommercial).
      const reel = project.reels.find((r) => r.comercial?.id === comercial.id);
      const mediaKit = mediaKitParaMolde(project.pantallasKit, project.momentos, project.cta);
      const res = await runMolde('qa', project, {
        concepto: comercial.concepto, guion: comercial.guion, cast: comercial.cast,
        storyboard: comercial.storyboard, packFlow: comercial.packFlow, objetivo: comercial.concepto?.idea,
        tipo: comercial.tipo, durationSec: reel?.durationSec, messageScope: comercial.messageScope, primaryMessage: comercial.primaryMessage, ...(mediaKit ? { mediaKit } : {}),
      }, { foco: 'todo' }, undefined, comercial);
      setComercial((c) => ({ ...c, qa: res as unknown as QaResult }));   // persiste (debounce del pipeline; flush al navegar)
    } catch (e) { setError(errMsg(e)); } finally { setQaBusy(false); }
  };

  const exportar = async () => {
    if (!plan) return;
    setRendering(true); setError('');
    // motor remotion: el plan es la fuente de verdad (el montajista ya decidió logo y placa; en una pieza animada el
    // video de mockups los trae puestos). Legacy ffmpeg: se le inyecta el logo de la marca como siempre.
    const logoSrc = plan.motor === 'remotion' ? plan.logo?.src : (plan.logo?.src || project.brandKit?.logoUrl || project.marcaKit?.logoUrl);
    const fullPlan = {
      ...plan,
      mediaKitId: plan.mediaKitId || project.mediaKitId,
      cta: plan.cta || project.cta,
      marcaKit: plan.marcaKit || project.marcaKit,
      logo: logoSrc ? { src: logoSrc } : undefined,
    };
    try {
      const r = await fetch(`${API_BASE}/api/render-comercial`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: fullPlan, projectId: project.id, reelId }),
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
          <p className="paso-sub">Se arma solo desde el storyboard y el montajista lo afina: recorta el aire de cada clip, corta en frase, mete pantallas reales cuando la voz las nombra, subtitula palabra por palabra y cierra con la placa de la marca.</p>
        </div>
        <div className="paso-head-actions">
          <button className={plan ? 'paso-regen' : 'paso-gen'} onClick={() => void armar()} disabled={rendering || armando}>
            {armando ? <Loader2 size={15} className="paso-spin" /> : <Clapperboard size={15} />} {armando ? 'Armando…' : plan ? 'Rearmar' : 'Armar el montaje'}
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
            <span className="pack-prog">{plan.scenes.length} escenas · {conClip} con clip · ~{totalDuration(plan).toFixed(1)}s{plan.motor === 'remotion' ? ` · ${plan.scenes.reduce((n, s) => n + (s.inserts?.length || 0), 0)} insertos de pantalla` : ''}</span>
          </div>

          {/* VISTA PREVIA EXACTA (plan v2): el Player corre la misma composición que renderiza el servidor */}
          {plan.motor === 'remotion' && conClip > 0 && (
            <div className="mont-preview">
              <div className="paso-card-h"><Play size={12} /> Vista previa exacta: lo que ves es lo que se renderiza</div>
              <div className="mont-preview-frame">
                <Suspense fallback={<div className="paso-empty">Cargando la vista previa…</div>}>
                  <PlayerMontaje plan={plan} />
                </Suspense>
              </div>
            </div>
          )}

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
                {plan.music ? (
                  <span
                    className="mont-track-fill mont-track-fill--music"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => toggleAudioPreview(plan.music?.src)}
                    title="Hacé click para preescuchar esta pista de música"
                  >
                    {playingTrack ? <Pause size={12} /> : <Play size={12} />}
                    {trackLabel(plan.music.src) || 'música'} · con ducking ({playingTrack ? 'reproduciendo...' : 'hacé click para probar'})
                  </span>
                ) : (
                  <span className="mont-track-empty">sin música</span>
                )}
              </div>
            </div>
            <div className="mont-track">
              <span className="mont-track-lbl"><Mic size={11} /> Voz</span>
              <div className="mont-track-bar">
                {plan.voice ? (
                  <span
                    className="mont-track-fill mont-track-fill--voice"
                    style={{ marginLeft: `${voiceLeftPct}%`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => toggleAudioPreview(plan.voice?.src)}
                    title="Hacé click para escuchar la voz en off"
                  >
                    {playingVoice ? <Pause size={12} /> : <Play size={12} />}
                    voz en off · desde {plan.voice.at}s
                  </span>
                ) : (
                  <span className="mont-track-empty">sin voz</span>
                )}
              </div>
            </div>
          </div>

          {/* MIXER: controles de música + voz */}
          <div className="mont-mixer">
            <div className="paso-card mont-music">
              <div className="paso-card-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><Music2 size={12} /> Música {plan.music ? `— ${trackLabel(plan.music.src) || 'elegida'}` : '— sin música'}</span>
                {plan.music?.src && (
                  <button
                    className="rodaje-var"
                    style={{ background: playingTrack ? '#7C3AED' : '#1E293B', color: '#FFF', border: '1px solid #475569', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => toggleAudioPreview(plan.music?.src)}
                  >
                    {playingTrack ? <Pause size={12} /> : <Play size={12} />}
                    {playingTrack ? 'Pausar' : 'Preescuchar'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select className="mont-select" style={{ flex: 1 }} value={plan.music?.src || ''} onChange={(e) => setMusica(e.target.value)}>
                  <option value="">Sin música</option>
                  {MUSIC_TRACKS.map((t) => <option key={t.id} value={t.url}>{t.cat} · {t.label}</option>)}
                </select>
                {plan.music?.src && (
                  <button
                    className="rodaje-var"
                    style={{ background: playingTrack ? '#7C3AED' : '#334155', color: '#FFF', padding: '8px 12px' }}
                    onClick={() => toggleAudioPreview(plan.music?.src)}
                    title="Preescuchar la música seleccionada"
                  >
                    {playingTrack ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                )}
              </div>
            </div>

            <div className="paso-card mont-music">
              <div className="paso-card-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><Mic size={12} /> Voz en off {plan.voice ? '— cargada' : '— sin voz'}</span>
                {plan.voice?.src && (
                  <button
                    className="rodaje-var"
                    style={{ background: playingVoice ? '#7C3AED' : '#1E293B', color: '#FFF', border: '1px solid #475569', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => toggleAudioPreview(plan.voice?.src)}
                  >
                    {playingVoice ? <Pause size={12} /> : <Play size={12} />}
                    {playingVoice ? 'Pausar voz' : 'Escuchar voz'}
                  </button>
                )}
              </div>
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
          {!conClip && (
            <div className="paso-empty">
              {esAnimado
                ? 'Falta el video: renderizá el reel animado primero (paso Render).'
                : 'Faltan clips importados en el Rodaje: el render necesita al menos una escena con clip.'}
            </div>
          )}
          {conClip > 0 && sinClip.length > 0 && (
            <div className="paso-empty">
              Faltan clips en las escenas {sinClip.join(', ')} — {esAnimado ? 'renderizá el reel animado de nuevo' : 'importalos en Rodaje'} o sacalas del montaje antes de exportar.
            </div>
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
          <PasoEmpty icon={Clapperboard}>Armá el montaje desde el storyboard. Necesitás {esAnimado ? 'el reel animado renderizado (paso Render)' : 'clips importados en el Rodaje'}.</PasoEmpty>
        )}
      </div>
      {/* PIE del panel: ir directo al Editor Multipista en Pantalla Completa */}
      <div className="paso-foot paso-foot--split">
        <span className="paso-estado">{estadoDelPaso('montaje', comercial)}</span>
        <div className="mont-foot-actions">
          <button className="rodaje-import mont-qa-btn" onClick={chequear} disabled={qaBusy || rendering}>
            {qaBusy ? <Loader2 size={13} className="paso-spin" /> : <Gauge size={13} />} Chequear calidad
          </button>
          {/* El botón de render se había perdido en la reingeniería (408108c): `exportar` quedó sin uso. */}
          <button className="paso-approve mont-export" onClick={() => void exportar()} disabled={rendering || armando || !plan || conClip === 0} title="Renderiza el mp4 final con el motor del montaje">
            {rendering ? <Loader2 size={15} className="paso-spin" /> : <Download size={15} />} {rendering ? 'Renderizando…' : 'Renderizar mp4'}
          </button>
          {onGoEditor && (
            <button
              className="paso-approve mont-export"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFF' }}
              onClick={onGoEditor}
            >
              <Film size={15} /> Ir al Editor Multipista (Pantalla Completa)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
