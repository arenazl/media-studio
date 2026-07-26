// Paso 2 — CONCEPTO. Corre el molde `concept` (2-3 propuestas para el ángulo del comercial),
// el usuario elige una (persiste). El TIPO (filmado/animado) lo fija el FORMATO de la pieza; el
// selector de acá sobrevive SOLO para piezas viejas sin formatoId.
import { useState } from 'react';
import { Check, Users, Monitor, Lightbulb } from 'lucide-react';
import { PasoShell, PasoEmpty, runMolde, errMsg, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { getFormato } from '../lib/formato';
import type { Concepto, TipoComercial } from '../lib/comercial';

export default function PasoConcepto({ project, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // las 2-3 opciones son transitorias (la ELEGIDA persiste en comercial.concepto).
  const [opciones, setOpciones] = useState<Concepto[]>(comercial?.concepto ? [comercial.concepto] : []);
  const tipo: TipoComercial = comercial?.tipo ?? 'filmado';
  // La técnica la fija el FORMATO elegido en el wizard (WO-1/D2: tecnicaProduccion → tipo). Si la
  // pieza nació con formato, acá NO se re-elige (volvería a desincronizar formato↔pipeline): se
  // muestra informativa. Sin formatoId (piezas viejas) el selector sigue siendo la única fuente.
  const formato = getFormato(comercial?.formatoId);
  const elegido = comercial?.concepto;

  const generar = async () => {
    setBusy(true); setError('');
    try {
      // C7: el ángulo/brief sembrados por strategy diferencian el concepto; el título es solo fallback.
      // `tipo` viaja al molde: sin él la IA proponía comerciales FILMADOS (actores/locación) para
      // piezas animadas. `formato` lo inyecta runMolde desde el comercial (WO-2).
      const piece = { angulo: comercial?.angulo || comercial?.titulo || '', creativeBrief: comercial?.creativeBrief || '', durationSec: 20, tipo };
      const res = await runMolde('concept', project, piece, { perfil: 'campaña' }, undefined, comercial);
      setOpciones((res.conceptos as Concepto[]) || []);
      setComercial((c) => ({ ...c, estados: { ...c.estados, concepto: c.estados.concepto === 'aprobado' ? 'aprobado' : 'generado' } }));
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const elegir = (cpt: Concepto) =>
    setComercial((c) => ({ ...c, concepto: cpt, estados: { ...c.estados, concepto: 'editado' } }));

  const setTipo = (t: TipoComercial) => setComercial((c) => ({ ...c, tipo: t }));

  return (
    <PasoShell
      titulo="Concepto"
      sub="La idea del comercial: 2-3 propuestas con tono y estética. Elegí una para seguir."
      hasContent={opciones.length > 0}
      busy={busy} onGenerate={generar} error={error}
      onApprove={goNext} canApprove={!!elegido} approveLabel="Concepto listo, al guion"
      functionId="concept" estado={estadoDelPaso('concepto', comercial)}
    >
      <div className="paso-tipo">
        <span className="paso-tipo-lbl">Tipo de comercial</span>
        {formato ? (
          <span className="paso-tipo-fijo">
            {tipo === 'animado' ? <Monitor size={14} /> : <Users size={14} />}
            {tipo === 'animado' ? 'Animado' : 'Filmado'}
            <span className="paso-tipo-src">por el formato {formato.nombre}</span>
          </span>
        ) : (
          <div className="paso-chips">
            <button className={tipo === 'filmado' ? 'paso-chip paso-chip--on' : 'paso-chip'} onClick={() => setTipo('filmado')}>
              <Users size={14} /> Filmado
            </button>
            <button className={tipo === 'animado' ? 'paso-chip paso-chip--on' : 'paso-chip'} onClick={() => setTipo('animado')}>
              <Monitor size={14} /> Animado
            </button>
          </div>
        )}
      </div>

      {opciones.length > 0 ? (
        <div className="concept-grid">
          {opciones.map((cpt) => {
            const on = elegido?.id === cpt.id;
            return (
              <article key={cpt.id} className={`paso-concept${on ? ' paso-concept--on' : ''}`}>
                {on && <span className="paso-concept-badge"><Check size={12} /> Elegido</span>}
                <p className="paso-concept-idea">{cpt.idea}</p>
                <div className="paso-concept-meta">
                  <div className="paso-concept-row"><span className="paso-concept-k">Tono</span><span className="paso-concept-v">{cpt.tono}</span></div>
                  <div className="paso-concept-row"><span className="paso-concept-k">Estética</span><span className="paso-concept-v">{cpt.estetica}</span></div>
                  <div className="paso-concept-row"><span className="paso-concept-k">Referencia</span><span className="paso-concept-v">{cpt.referencia}</span></div>
                </div>
                {cpt.porQueFunciona && <p className="paso-concept-why">{cpt.porQueFunciona}</p>}
                <button className={on ? 'paso-pick paso-pick--on' : 'paso-pick'} onClick={() => elegir(cpt)}>
                  {on ? <><Check size={13} /> Elegido</> : 'Elegir este'}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        !busy && <PasoEmpty icon={Lightbulb}>Todavía no generaste conceptos. Tocá «Generar con IA» y vas a ver 2-3 propuestas con tono, estética y referencia para elegir.</PasoEmpty>
      )}
    </PasoShell>
  );
}
