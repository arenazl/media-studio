// Selección creativa simple. La IA decide los enfoques técnicos a partir del brief.
// NO se consume Flow, no se crean voces y no se elige entre 12 etiquetas abstractas.
import { useState } from 'react';
import { Check, Lightbulb, Clapperboard, Sparkles, AlertTriangle } from 'lucide-react';
import { PasoShell, PasoEmpty, runMolde, errMsg, type PasoProps } from './pasoKit';
import { KitTira } from '../components/KitCapturas';
import { mediaKitParaMolde } from '../lib/mediaKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { getFormato } from '../lib/formato';
import { pasoHabilitado, type Concepto, type Prototipo } from '../lib/comercial';
import BotonChatGPT from './BotonChatGPT';
import { pedidoPaso } from '../lib/paraChatGPT';

const ENFOQUES = new Set(['caso', 'producto', 'dos-lados', 'antes-despues', 'testimonio', 'institucional', 'humor']);
const TRATAMIENTOS = new Set(['natural', 'sobrio', 'calido', 'aspiracional', 'humor']);

export default function PasoConcepto({ project, reelId, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const propuestas = comercial?.propuestas?.length ? comercial.propuestas : comercial?.concepto ? [comercial.concepto] : [];
  const elegido = comercial?.concepto;
  const formato = getFormato(comercial?.formatoId || project.formatoId);
  const duracion = project.reels.find((r) => r.id === reelId)?.durationSec ?? formato?.duracion.default ?? 20;

  const generar = async (provider?: 'claude' | 'gemini') => {
    if (!comercial || !pasoHabilitado(comercial, 'concepto')) return;
    setBusy(true); setError(''); setAviso('');
    try {
      const mediaKit = mediaKitParaMolde(project.pantallasKit, project.momentos, project.cta);
      const piece = {
        angulo: comercial.angulo || comercial.titulo,
        creativeBrief: comercial.creativeBrief || '',
        messageScope: comercial.messageScope,
        primaryMessage: comercial.primaryMessage,
        supportingFacts: comercial.supportingFacts,
        durationSec: duracion,
        tipo: comercial.tipo,
        cierreMarca: comercial.cierreMarca || '',
        ...(mediaKit ? { mediaKit } : {}),
      };
      const res = await runMolde('concept', project, piece, { molde: 'director', perfil: comercial.perfilCampana || 'campaña' }, undefined, comercial, provider);
      const opciones = (res.conceptos as Concepto[] | undefined) || [];
      if (opciones.length !== 3 || opciones.some((o) => !o.id || !o.idea || !o.topico)) {
        throw new Error('La IA no devolvió tres propuestas completas. Volvé a intentarlo.');
      }
      // Se guardan las tres: al volver al paso no se pierde la comparación.
      setComercial((c) => ({
        ...c, propuestas: opciones,
        estados: { ...c.estados, concepto: c.estados.concepto === 'aprobado' ? 'aprobado' : 'generado' },
      }));
    } catch (e) { setError(errMsg(e)); }
    finally { setBusy(false); }
  };

  const elegir = (op: Concepto) => {
    if (elegido?.id === op.id) return;
    const cambiar = !!elegido && !!(comercial?.guion || comercial?.storyboard);
    setComercial((c) => {
      const anteriores: Prototipo[] = c.prototipos || [];
      const conservados = c.concepto?.id && (c.guion || c.storyboard)
        ? [...anteriores.filter((v) => v.conceptoId !== c.concepto?.id), {
            conceptoId: c.concepto.id, guion: c.guion, cast: c.cast, storyboard: c.storyboard,
            audios: anteriores.find((v) => v.conceptoId === c.concepto?.id)?.audios,
          }]
        : anteriores;
      const recuperado = conservados.find((v) => v.conceptoId === op.id);
      const estados = { ...c.estados };
      for (const p of ['guion', 'cast', 'storyboard', 'rodaje', 'preproduccion', 'pack', 'render', 'montaje', 'publicar'] as const) {
        estados[p] = 'pendiente';
      }
      if (recuperado?.guion) estados.guion = 'generado';
      if (recuperado?.cast) estados.cast = 'generado';
      if (recuperado?.storyboard) estados.storyboard = 'generado';
      return {
        ...c,
        concepto: op,
        enfoque: ENFOQUES.has(op.enfoque || '') ? op.enfoque : 'caso',
        tratamiento: TRATAMIENTOS.has(op.tratamiento || '') ? op.tratamiento : 'natural',
        prototipos: conservados,
        guion: recuperado?.guion, cast: recuperado?.cast, storyboard: recuperado?.storyboard,
        packFlow: undefined, renderRef: undefined, rodaje: [], montaje: undefined,
        estados: { ...estados, concepto: 'editado' },
      };
    });
    if (cambiar) setAviso('Cambiamos la propuesta. Conservamos el guion/storyboard anterior como variante; lo producido después queda pendiente para no mezclar campañas.');
  };

  return (
    <PasoShell
      titulo="Tres caminos para tu publicidad"
      sub="Media Studio estudia el negocio y propone tres comerciales concretos. Vos elegís la historia; el motor resuelve enfoque, tratamiento y técnica."
      hasContent={propuestas.length > 0} busy={busy} onGenerate={generar} error={error}
      onApprove={goNext} canApprove={!!elegido} approveLabel="Trabajar esta propuesta → guion"
      functionId="concept" estado={estadoDelPaso('concepto', comercial)}
      chatgpt={comercial ? <BotonChatGPT armar={() => pedidoPaso(project, comercial, 'concepto')} nombre={`${comercial.titulo}-concepto`} /> : undefined}
    >
      <KitTira pantallas={project.pantallasKit} />
      <p className="paso-sub" style={{ margin: '12px 0' }}>
        {project.name} · {formato?.nombre || (comercial?.tipo === 'animado' ? 'Animado' : 'Filmado')} · aproximadamente {duracion}s.
        No necesitás seleccionar «marca y visión», «aspiracional» ni otras categorías técnicas.
      </p>
      <div className="paso-card">
        <div className="paso-card-h"><Sparkles size={15} /> ¿Qué querés que proponga la agencia?</div>
        <p>Usaremos el resumen real del producto, el público y las pantallas del kit. Las tres propuestas se generan con IA sólo al pedirlas; no se consume Flow ni ElevenLabs en este paso.</p>
        <button className="paso-gen" disabled={busy || !comercial || !pasoHabilitado(comercial, 'concepto')} onClick={() => void generar()}>
          {busy ? 'Preparando las propuestas…' : propuestas.length ? 'Rehacer las tres propuestas' : 'Proponer tres anuncios'}
        </button>
      </div>
      {aviso && <div className="paso-empty"><AlertTriangle size={13} /> {aviso}</div>}
      {propuestas.length ? (
        <div className="paso-cards" style={{ marginTop: 16 }}>
          {propuestas.map((op, i) => (
            <article key={op.id} className="paso-card" style={{ border: elegido?.id === op.id ? '2px solid var(--rd-accent, #7c3aed)' : undefined }}>
              <div className="paso-card-h"><Lightbulb size={14} /> Opción {i + 1}{elegido?.id === op.id ? <span style={{ marginLeft: 'auto' }}><Check size={14} /> Elegida</span> : null}</div>
              <h3 style={{ margin: '8px 0' }}>{op.topico || `Propuesta ${i + 1}`}</h3>
              <p>{op.idea}</p>
              {op.audiencia && <p><strong>Para quién:</strong> {op.audiencia}</p>}
              {op.mensaje && <p><strong>Mensaje que queda:</strong> {op.mensaje}</p>}
              <p><strong>Qué se verá:</strong> {op.seVe || op.estetica}</p>
              {op.porQueFunciona && <p><strong>Por qué podría funcionar:</strong> {op.porQueFunciona}</p>}
              <button className={elegido?.id === op.id ? 'paso-pick paso-pick--on' : 'paso-pick'} disabled={busy}
                onClick={() => elegir(op)}>
                {elegido?.id === op.id ? <><Check size={14} /> Elegida</> : <><Clapperboard size={14} /> Quiero explorar esta</>}
              </button>
            </article>
          ))}
        </div>
      ) : !busy && <PasoEmpty icon={Lightbulb}>Pedí tres propuestas para elegir por la idea comercial, no por variables internas del motor.</PasoEmpty>}
    </PasoShell>
  );
}
