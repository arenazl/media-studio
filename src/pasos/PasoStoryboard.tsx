// Paso 5 — STORYBOARD. Corre el molde `storyboard` (bifurca por tipo: filmado = planos/talking
// heads con diálogo · animado = pantallas). Tarjetas de escena editables + chequeo cast↔escena.
import { useState } from 'react';
import { Link2, Clapperboard } from 'lucide-react';
import { PasoShell, PasoEmpty, runMolde, errMsg, InlineEdit, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { escenasAPrompts, type Escena } from '../lib/comercial';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', gag: 'Remate', cta: 'CTA' };
const roleKind = (r: string) => (r === 'hook' ? 'hook' : r === 'cta' ? 'cta' : r === 'gag' ? 'gag' : 'mid');

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
      functionId="storyboard" estado={estadoDelPaso('storyboard', comercial)}
    >
      {!refCheck.ok && (
        <div className="paso-error">
          Escenas que referencian personajes fuera del cast: {refCheck.faltantes.map((f) => `#${f.escenaN}→${f.personajeId}`).join(', ')}
        </div>
      )}
      {escenas.length > 0 ? (
        <div className="sb-grid">
          {escenas.map((e) => (
            <article key={e.n} className={`sb-cell sb-cell--${roleKind(e.rol)}`}>
              <div className="sb-cell-top">
                <span className="sb-n">#{e.n}</span>
                <div className="sb-tags">
                  <span className={`paso-role paso-role--${roleKind(e.rol)}`}>{ROL_LABEL[e.rol] || e.rol}</span>
                  <span className="paso-t">{e.durSec}s</span>
                </div>
              </div>
              <div className="sb-meta">
                {e.plano && <span className="paso-scene-tag">{e.plano}</span>}
                {(e.personajes || []).length > 0 && <span className="paso-scene-tag">{e.personajes.join(', ')}</span>}
                {e.screen && <span className="paso-scene-tag">{e.screen}</span>}
              </div>
              {e.accion && <p className="sb-accion">{e.accion}</p>}
              {tipo === 'filmado' && (
                <div className="sb-dialogo">
                  <InlineEdit value={e.dialogo} onChange={(v) => editDialogo(e.n, v)} rows={2} placeholder="diálogo (rioplatense)" />
                </div>
              )}
              {e.continuidad && <div className="sb-cont"><Link2 size={12} /> <span>{e.continuidad}</span></div>}
            </article>
          ))}
        </div>
      ) : (
        !busy && <PasoEmpty icon={Clapperboard}>Generá el storyboard desde el guion{tipo === 'filmado' ? ' y el cast' : ''}: cada escena con su plano, duración, acción{tipo === 'filmado' ? ', diálogo' : ''} y continuidad.</PasoEmpty>
      )}
    </PasoShell>
  );
}
