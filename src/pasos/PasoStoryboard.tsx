// Paso 5 — STORYBOARD. Corre el molde `storyboard` (bifurca por tipo: filmado = planos/talking
// heads con diálogo · animado = pantallas). Tarjetas de escena editables + chequeo cast↔escena.
import { useState } from 'react';
import { PasoShell, runMolde, errMsg, InlineEdit, type PasoProps } from './pasoKit';
import { escenasAPrompts, type Escena } from '../lib/comercial';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', gag: 'Remate', cta: 'CTA' };
const roleClass = (r: string) => (r === 'hook' ? 'paso-role--hook' : r === 'cta' ? 'paso-role--cta' : 'paso-role--mid');

export default function PasoStoryboard({ project, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const escenas = comercial?.storyboard || [];
  const tipo = comercial?.tipo ?? 'filmado';

  const generar = async () => {
    setBusy(true); setError('');
    try {
      const res = await runMolde('storyboard', project, { guion: comercial?.guion, cast: comercial?.cast, tipo, durationSec: 20 });
      setComercial((c) => ({ ...c, storyboard: (res.escenas as Escena[]) || [], estados: { ...c.estados, storyboard: c.estados.storyboard === 'aprobado' ? 'aprobado' : 'generado' } }));
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const editDialogo = (n: number, v: string) =>
    setComercial((c) => ({ ...c, storyboard: (c.storyboard || []).map((e) => (e.n === n ? { ...e, dialogo: v } : e)), estados: { ...c.estados, storyboard: 'editado' } }));

  const refCheck = comercial?.cast ? escenasAPrompts(escenas, comercial.cast) : { ok: true, faltantes: [] };

  return (
    <PasoShell
      titulo="Storyboard" sub="Escenas numeradas: plano, ángulo, duración, acción, diálogo, continuidad."
      hasContent={escenas.length > 0} busy={busy} onGenerate={generar} error={error}
      onApprove={goNext} canApprove={escenas.length > 0} approveLabel="Storyboard listo"
    >
      {!refCheck.ok && (
        <div className="paso-error">
          Escenas que referencian personajes fuera del cast: {refCheck.faltantes.map((f) => `#${f.escenaN}→${f.personajeId}`).join(', ')}
        </div>
      )}
      <div className="paso-cards">
        {escenas.map((e) => (
          <article key={e.n} className="paso-scene">
            <div className="paso-scene-h">
              <span className="paso-scene-n">#{e.n}</span>
              <span className={`paso-role ${roleClass(e.rol)}`}>{ROL_LABEL[e.rol] || e.rol}</span>
              <span className="paso-t">{e.durSec}s</span>
              {e.plano && <span className="paso-scene-tag">{e.plano}</span>}
              {(e.personajes || []).length > 0 && <span className="paso-scene-tag">{e.personajes.join(', ')}</span>}
              {e.screen && <span className="paso-scene-tag">{e.screen}</span>}
            </div>
            {e.accion && <div className="paso-block-visual">{e.accion}</div>}
            {tipo === 'filmado' && <InlineEdit value={e.dialogo} onChange={(v) => editDialogo(e.n, v)} rows={2} placeholder="diálogo (rioplatense)" />}
            {e.continuidad && <div className="paso-scene-cont">continuidad: {e.continuidad}</div>}
          </article>
        ))}
        {!escenas.length && !busy && <div className="paso-empty">Generá el storyboard desde el guion{tipo === 'filmado' ? ' y el cast' : ''}.</div>}
      </div>
    </PasoShell>
  );
}
