// Paso 2 — CONCEPTO. Corre el molde `concept` (2-3 propuestas para el ángulo del comercial),
// el usuario elige una (persiste), y ACÁ vive el selector de TIPO (filmado/animado).
import { useState } from 'react';
import { Check } from 'lucide-react';
import { PasoShell, runMolde, errMsg, type PasoProps } from './pasoKit';
import type { Concepto, TipoComercial } from '../lib/comercial';

export default function PasoConcepto({ project, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // las 2-3 opciones son transitorias (la ELEGIDA persiste en comercial.concepto).
  const [opciones, setOpciones] = useState<Concepto[]>(comercial?.concepto ? [comercial.concepto] : []);
  const tipo: TipoComercial = comercial?.tipo ?? 'filmado';
  const elegido = comercial?.concepto;

  const generar = async () => {
    setBusy(true); setError('');
    try {
      const piece = { angulo: comercial?.titulo || '', creativeBrief: comercial?.titulo || '', durationSec: 20 };
      const res = await runMolde('concept', project, piece, { perfil: 'campaña' });
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
    >
      <div className="paso-tipo">
        <span className="paso-tipo-lbl">Tipo de comercial</span>
        <div className="paso-chips">
          <button className={tipo === 'filmado' ? 'paso-chip paso-chip--on' : 'paso-chip'} onClick={() => setTipo('filmado')}>Filmado (personas)</button>
          <button className={tipo === 'animado' ? 'paso-chip paso-chip--on' : 'paso-chip'} onClick={() => setTipo('animado')}>Animado (pantallas)</button>
        </div>
      </div>

      <div className="paso-cards">
        {opciones.map((cpt) => {
          const on = elegido?.id === cpt.id;
          return (
            <article key={cpt.id} className={`paso-concept${on ? ' paso-concept--on' : ''}`}>
              <div className="paso-concept-idea">{cpt.idea}</div>
              <div className="paso-concept-meta">
                <span><strong>Tono:</strong> {cpt.tono}</span>
                <span><strong>Estética:</strong> {cpt.estetica}</span>
                <span><strong>Referencia:</strong> {cpt.referencia}</span>
                {cpt.porQueFunciona && <span className="paso-concept-why">{cpt.porQueFunciona}</span>}
              </div>
              <button className={on ? 'paso-pick paso-pick--on' : 'paso-pick'} onClick={() => elegir(cpt)}>
                {on ? <><Check size={13} /> Elegido</> : 'Elegir este'}
              </button>
            </article>
          );
        })}
        {!opciones.length && !busy && <div className="paso-empty">Todavía no generaste conceptos. Tocá «Generar con IA».</div>}
      </div>
    </PasoShell>
  );
}
