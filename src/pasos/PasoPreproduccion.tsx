// Sala de preproducción: comparar hasta tres variantes audiovisuales antes de gastar
// créditos en Flow. Los prototipos usan imágenes o mockups existentes y TTS optativo.
import { lazy, Suspense, useMemo, useState } from 'react';
import { ArrowRight, Check, Headphones, Loader2, Play, Sparkles } from 'lucide-react';
import { errMsg, runMolde, PasoEmpty, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { mediaKitParaMolde } from '../lib/mediaKit';
import { getFormato } from '../lib/formato';
import { generarLocutor, VOZ_LOCUTOR } from '../lib/locutorCierre';
import { planAnimatic, numeroAudiosPendientes } from '../lib/preproduccion';
import type { Cast, Concepto, Escena, GuionBloque, GuionEstructurado, Prototipo } from '../lib/comercial';

const PlayerAnimatic = lazy(() => import('../remotion/PlayerAnimatic'));
const enfoques = new Set(['caso', 'producto', 'dos-lados', 'antes-despues', 'testimonio', 'institucional', 'humor']);
const tratamientos = new Set(['natural', 'sobrio', 'calido', 'aspiracional', 'humor']);
function enfoqueDe(c: Concepto) { return enfoques.has(c.enfoque || '') ? c.enfoque! : 'caso'; }
function tratamientoDe(c: Concepto) { return tratamientos.has(c.tratamiento || '') ? c.tratamiento! : 'natural'; }

export default function PasoPreproduccion({ project, reelId, comercial, setComercial, goNext }: PasoProps) {
  const opciones = comercial?.propuestas?.length ? comercial.propuestas : comercial?.concepto ? [comercial.concepto] : [];
  const [viendo, setViendo] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const id = (viendo && opciones.some((o) => o.id === viendo)) ? viendo : (comercial?.concepto?.id || opciones[0]?.id);
  const concepto = opciones.find((o) => o.id === id);
  const actual = !!concepto && comercial?.concepto?.id === concepto.id;
  const prev = comercial?.prototipos?.find((p) => p.conceptoId === id);
  const proto: Prototipo | undefined = concepto ? (actual ? {
    ...prev, conceptoId: concepto.id, guion: comercial?.guion,
    cast: comercial?.cast, storyboard: comercial?.storyboard,
  } : prev) : undefined;

  const plan = useMemo(() => comercial && concepto && proto?.storyboard?.length
    ? planAnimatic(project, comercial, concepto, proto) : undefined,
    [project, comercial, concepto, proto]);
  const reel = project.reels.find((r) => r.id === reelId);
  const durationSec = reel?.durationSec ?? getFormato(comercial?.formatoId || project.formatoId)?.duracion.default ?? 20;
  const vozBase = reel?.voiceConfig?.voice_id || (project as { vozLocutor?: string }).vozLocutor || VOZ_LOCUTOR;
  const [voces, setVoces] = useState<Record<string, string>>({});

  // La voz es configurable por actor. No alteramos texto ni tags: el motor
  // compartido curado de SalesBot se conectará aquí sin modificar el animatic.
  const vozDe = (actor: string): string => voces[actor] || prev?.vozPorActor?.[actor] || vozBase;
  const elegirVoz = (actor: string, v: string) => {
    setVoces((old) => ({ ...old, [actor]: v }));
    if (!id) return;
    setComercial((c) => {
      const anteriores = c.prototipos || [];
      const anterior = anteriores.find((p) => p.conceptoId === id);
      return { ...c, prototipos: [...anteriores.filter((p) => p.conceptoId !== id), {
        ...(anterior || { conceptoId: id }), vozPorActor: { ...(anterior?.vozPorActor || {}), [actor]: v },
      }] };
    });
  };

  // Otra propuesta NO se fabrica automáticamente al navegar: serían 2-3
  // llamadas de IA y el dueño debe autorizarlas con un clic explícito.
  const preparar = async (cpt: Concepto) => {
    if (!comercial) return;
    setBusy('creativo'); setError(''); setMensaje('');
    try {
      const forma = getFormato(comercial.formatoId || project.formatoId);
      const mediaKit = mediaKitParaMolde(project.pantallasKit, project.momentos, project.cta);
      const meta = { ...comercial, id: `${comercial.id}-${cpt.id}`, concepto: cpt,
        enfoque: enfoqueDe(cpt), tratamiento: tratamientoDe(cpt) };
      const comun = { enfoque: meta.enfoque, tratamiento: meta.tratamiento, tipo: meta.tipo,
        ...(mediaKit ? { mediaKit } : {}) };
      const resGuion = await runMolde('script', project, {
        concepto: cpt, durationSec, messageScope: comercial.messageScope,
        primaryMessage: comercial.primaryMessage, supportingFacts: comercial.supportingFacts, ...comun,
      }, { tono: meta.tratamiento }, undefined, meta);
      const blocks = resGuion.blocks as GuionBloque[] | undefined;
      if (!blocks?.length) throw Error('La variante no produjo guion.');
      const guion: GuionEstructurado = { blocks, music: resGuion.music as GuionEstructurado['music'] };
      let cast: Cast | undefined;
      if (meta.tipo === 'filmado') {
        const resCast = await runMolde('cast', project, { concepto: cpt, guion, ...comun }, {}, undefined, meta);
        if (!(resCast.personajes as unknown[])?.length) throw Error('La variante no produjo cast.');
        cast = { personajes: resCast.personajes as Cast['personajes'], lugar: resCast.lugar as Cast['lugar'] };
      }
      const resSb = await runMolde('storyboard', project, {
        guion, cast, durationSec, ...comun,
      }, {}, undefined, meta);
      const storyboard = resSb.escenas as Escena[] | undefined;
      if (!storyboard?.length) throw Error('La variante no produjo storyboard.');
      setComercial((c) => ({
        ...c, prototipos: [...(c.prototipos || []).filter((p) => p.conceptoId !== cpt.id), {
          conceptoId: cpt.id, guion, cast, storyboard,
        }],
        estados: { ...c.estados, preproduccion: 'generado' },
      }));
      setMensaje(`El prototipo «${cpt.topico}» está listo para comparar. Sin gastos de Flow.`);
    } catch (e) { setError(errMsg(e)); }
    finally { setBusy(''); }
  };

  const prepararVoces = async () => {
    if (!plan || !id || !comercial) return;
    setBusy('voz'); setError(''); setMensaje('');
    try {
      let nuevos = 0;
      let guardados = [...(prev?.audios || [])];
      for (const e of plan.escenas) {
        if (!e.dialogo) continue;
        const voiceId = vozDe(e.actor).trim();
        if (!voiceId) throw Error(`Falta elegir una voz para ${e.actor || 'la narración'}.`);
        if (guardados.some((a) => a.escenaN === e.n && a.texto === e.dialogo && a.voiceId === voiceId)) continue;
        const resultado = await generarLocutor(e.dialogo, voiceId, `prepro-${project.id}-${id}-${e.n}`);
        const nuevo = { escenaN: e.n, texto: e.dialogo, voiceId, src: resultado.src, durSec: resultado.durSec };
        guardados = [...guardados.filter((a) => a.escenaN !== e.n), nuevo];
        nuevos++;
        // Guardar CADA respuesta: si falla una posterior, no volvemos a pagar por las anteriores.
        setComercial((c) => {
          const lista = c.prototipos || [];
          const viejo = lista.find((p) => p.conceptoId === id);
          return { ...c, prototipos: [...lista.filter((p) => p.conceptoId !== id), {
            ...(viejo || { conceptoId: id }), audios: [...(viejo?.audios || []).filter((a) => a.escenaN !== e.n), nuevo],
          }] };
        });
      }
      setMensaje(nuevos ? `Listas ${nuevos} voces nuevas. Los audios sin cambios se reutilizan.` : 'Todas las voces ya estaban guardadas: no se generó nada nuevo.');
    } catch (e) { setError(errMsg(e)); }
    finally { setBusy(''); }
  };

  const adoptar = () => {
    if (!concepto || !proto?.storyboard?.length) return;
    setComercial((c) => {
      if (c.concepto?.id === concepto.id) return c;
      const lista = c.prototipos || [];
      const guardarActual = c.concepto?.id && c.storyboard
        ? { conceptoId: c.concepto.id, guion: c.guion, cast: c.cast, storyboard: c.storyboard,
            audios: lista.find((p) => p.conceptoId === c.concepto?.id)?.audios,
            vozPorActor: lista.find((p) => p.conceptoId === c.concepto?.id)?.vozPorActor }
        : undefined;
      const estados = { ...c.estados, concepto: 'editado' as const, guion: 'generado' as const,
        storyboard: 'generado' as const, cast: proto.cast ? 'generado' as const : 'pendiente' as const,
        rodaje: 'pendiente' as const, preproduccion: 'generado' as const,
        pack: 'pendiente' as const, render: 'pendiente' as const, montaje: 'pendiente' as const, publicar: 'pendiente' as const };
      return {
        ...c, concepto, enfoque: enfoqueDe(concepto), tratamiento: tratamientoDe(concepto),
        guion: proto.guion, cast: proto.cast, storyboard: proto.storyboard,
        packFlow: undefined, renderRef: undefined, rodaje: [], montaje: undefined,
        prototipos: guardarActual ? [...lista.filter((p) => p.conceptoId !== guardarActual.conceptoId), guardarActual] : lista,
        estados,
      };
    });
    setMensaje(`«${concepto.topico}» pasó a ser la opción de producción. Revisá el prototipo y aprobalo.`);
  };

  const aprobar = () => {
    if (!actual || !plan?.escenas.length || busy) return;
    // La autorización es sólo para AVANZAR al Pack, no para lanzar Flow.
    goNext();
  };

  const actores = [...new Set((plan?.escenas || []).filter((e) => e.dialogo).map((e) => e.actor))];
  return (
    <div className="paso">
      <div className="paso-head">
        <div className="paso-head-txt">
          <h2 className="paso-title">Preproducción · mirá el anuncio antes de pagarlo</h2>
          <p className="paso-sub">Animatic del storyboard: imágenes fijas, mockups existentes, duración por escena y diálogo. Sin generación de video en Flow.</p>
        </div>
      </div>
      {error && <div className="paso-error">{error}</div>}
      {mensaje && <div className="paso-card">{mensaje}</div>}
      <div className="paso-body">
        <div className="paso-cards">
          {opciones.map((op, i) => {
            const tiene = op.id === comercial?.concepto?.id ? !!comercial?.storyboard?.length
              : !!comercial?.prototipos?.find((p) => p.conceptoId === op.id)?.storyboard?.length;
            return (
              <button key={op.id} type="button" className={op.id === id ? 'paso-pick paso-pick--on' : 'paso-pick'}
                onClick={() => { setViendo(op.id); setMensaje(''); setError(''); }} disabled={!!busy}>
                Opción {i + 1}: {op.topico}{tiene ? ' · lista' : ' · sin prototipo'}
              </button>
            );
          })}
        </div>
        {!plan ? (
          <div className="paso-card" style={{ marginTop: 18 }}>
            <PasoEmpty icon={Sparkles}>Esta alternativa todavía no tiene guion/cast/storyboard. Podés prepararla para compararla con la primera antes de elegir cuál producir.</PasoEmpty>
            {concepto && <button className="paso-gen" disabled={!!busy || !comercial}
              onClick={() => void preparar(concepto)}>
              {busy === 'creativo' ? <Loader2 size={14} className="paso-spin" /> : <Sparkles size={14} />}
              {busy === 'creativo' ? 'Armando guion, cast y storyboard…' : `Preparar prototipo «${concepto.topico}»`}
            </button>}
            <p className="paso-sub">Se ejecutan {comercial?.tipo === 'animado' ? '2' : '3'} tareas de IA bajo demanda. No se consume Flow ni ElevenLabs.</p>
          </div>
        ) : (
          <div className="paso-card" style={{ marginTop: 16 }}>
            <div className="paso-card-h"><Play size={15} /> {concepto?.topico} · {plan.escenas.length} escenas · ~{plan.escenas.reduce((a, e) => a + e.durSec, 0).toFixed(1)}s</div>
            <div className="mont-preview-frame" style={{ maxWidth: 470, margin: '12px auto' }}>
              <Suspense fallback={<div className="paso-empty">Cargando el animatic…</div>}>
                <PlayerAnimatic plan={plan} />
              </Suspense>
            </div>
            <p className="paso-sub">Donde no hay captura real se ve una tarjeta con la acción del storyboard. Esto no representa la actuación, el lip-sync ni la calidad final de Veo.</p>
            {actores.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="paso-card-h"><Headphones size={14} /> Voces de muestra (opcional)</div>
                <p className="paso-sub">Se usa el endpoint de ElevenLabs actual, sin alterar textos ni tags. Más adelante se conecta el motor de voz ya curado en SalesBot. Cada personaje puede usar otro voice ID.</p>
                {actores.map((actor) => (
                  <label key={actor} style={{ display: 'flex', gap: 9, alignItems: 'center', marginTop: 9, flexWrap: 'wrap' }}>
                    <span style={{ minWidth: 130 }}>{actor || 'Narración'}</span>
                    <input className="paso-inline" style={{ flex: 1, minWidth: 160 }} placeholder="ElevenLabs voice ID"
                      value={vozDe(actor)} disabled={!!busy} onChange={(e) => elegirVoz(actor, e.target.value)} />
                  </label>
                ))}
                <button className="paso-gen" disabled={!!busy} style={{ marginTop: 12 }} onClick={() => void prepararVoces()}>
                  {busy === 'voz' ? <Loader2 size={14} className="paso-spin" /> : <Headphones size={14} />}
                  {busy === 'voz' ? 'Generando audios…' : 'Generar / actualizar voces para este prototipo'}
                </button>
                <p className="paso-sub">ElevenLabs puede descontar créditos; esta acción requiere clic explícito. Con los textos y voces iguales se reusan audios. {numeroAudiosPendientes(plan)} escenas aún no tienen voz guardada.</p>
              </div>
            )}
            {!actual && (
              <button className="paso-pick paso-pick--on" disabled={!!busy} style={{ marginTop: 14 }} onClick={adoptar}>
                <Check size={14} /> Elegir esta propuesta para producir
              </button>
            )}
          </div>
        )}
      </div>
      <div className="paso-foot paso-foot--split">
        <span className="paso-estado">{estadoDelPaso('preproduccion', comercial)} · ningún clip de Flow se inicia en este paso</span>
        <button className="paso-approve" disabled={!actual || !plan?.escenas.length || !!busy} onClick={aprobar}>
          Aprobar prototipo, ir a Pack Flow / Render <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
