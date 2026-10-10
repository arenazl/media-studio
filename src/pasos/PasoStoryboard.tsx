// Paso 5 — STORYBOARD. Corre el molde `storyboard` (bifurca por tipo: filmado = planos/talking
// heads con diálogo · animado = pantallas). Tarjetas de escena editables + chequeo cast↔escena.
import { useState, useEffect, useRef } from 'react';
import { Link2, Clapperboard } from 'lucide-react';
import { PasoShell, PasoEmpty, runMolde, errMsg, InlineEdit, type PasoProps } from './pasoKit';
import { KitThumb, KitLightbox } from '../components/KitCapturas';
import { estadoDelPaso } from '../lib/pasoEstado';
import { getFormato } from '../lib/formato';
import { mediaKitParaMolde, pantallaDeEscena, type PantallaKit } from '../lib/mediaKit';
import { escenasAPrompts, pasoHabilitado, type Escena } from '../lib/comercial';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', giro: 'Giro', gag: 'Remate', cta: 'CTA' };
const roleKind = (r: string) => (r === 'hook' ? 'hook' : r === 'cta' ? 'cta' : (r === 'gag' || r === 'giro') ? 'gag' : 'mid');

export default function PasoStoryboard({ project, reelId, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const storyboard = comercial?.storyboard;

  // AUTO-GENERAR al entrar: sólo con el paso HABILITADO y el INSUMO DIRECTO del molde (el guion; el
  // cast lo tolera vacío). Sin el gate, entrar al storyboard sin guion llamaba a la IA al pedo.
  const hasAutoFired = useRef(false);
  useEffect(() => {
    const listo = !!comercial && pasoHabilitado(comercial, 'storyboard') && !!comercial.guion?.blocks?.length;
    if (listo && !storyboard && !busy && !error && !hasAutoFired.current) {
      hasAutoFired.current = true;
      generar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escenas = comercial?.storyboard || [];
  const tipo = comercial?.tipo ?? 'filmado';
  // Duración REAL de la pieza (la suma de durSec del storyboard apunta acá): reel → formato → 20
  // (el hardcodeo viejo, retrocompat). Con 20 fijo, un Spot TV de 25s salía cortado de fábrica.
  const durationSec = project.reels.find((r) => r.id === reelId)?.durationSec
    ?? getFormato(comercial?.formatoId)?.duracion.default ?? 20;

  // WO-K3/K4: las capturas REALES del media kit — se ven acá (thumbnail por escena) y viajan al
  // molde como `piece.mediaKit` (que las nombra en el prompt y asigna `archivoCaptura`).
  const pantallas = project.pantallasKit || [];
  const [zoom, setZoom] = useState<PantallaKit | null>(null);

  const generar = async (provider?: 'claude' | 'gemini') => {
    setBusy(true); setError('');
    try {
      const mediaKit = mediaKitParaMolde(project.pantallasKit, project.momentos, project.cta);
      const piece = { guion: comercial?.guion, cast: comercial?.cast, tipo, durationSec, enfoque: comercial?.enfoque, tratamiento: comercial?.tratamiento, ...(mediaKit ? { mediaKit } : {}) };
      const res = await runMolde('storyboard', project, piece, {}, undefined, comercial, provider);
      setComercial((c) => ({ ...c, storyboard: (res.escenas as Escena[]) || [], estados: { ...c.estados, storyboard: c.estados.storyboard === 'aprobado' ? 'aprobado' : 'generado' } }));
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const editDialogo = (n: number, v: string) =>
    setComercial((c) => ({ ...c, storyboard: (c.storyboard || []).map((e) => (e.n === n ? { ...e, dialogo: v } : e)), estados: { ...c.estados, storyboard: 'editado' } }));

  // asignar/cambiar a mano la captura de una escena (el molde ya propone una; esto la corrige).
  const asignarCaptura = (n: number, archivo: string) =>
    setComercial((c) => ({
      ...c,
      storyboard: (c.storyboard || []).map((e) => (e.n === n ? { ...e, archivoCaptura: archivo || undefined } : e)),
      estados: { ...c.estados, storyboard: 'editado' },
    }));

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
              {pantallas.length > 0 && (() => {
                const cap = pantallaDeEscena(pantallas, e);
                return (
                  <div className="kit-escena">
                    {cap && <KitThumb pantalla={cap} size="md" onClick={() => setZoom(cap)} />}
                    <select
                      className="kit-escena-pick"
                      value={cap?.archivo || ''}
                      onChange={(ev) => asignarCaptura(e.n, ev.target.value)}
                    >
                      <option value="">Sin captura del kit</option>
                      {pantallas.map((p) => <option key={p.archivo} value={p.archivo}>{p.nombre}</option>)}
                    </select>
                  </div>
                );
              })()}
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
      {zoom && <KitLightbox pantalla={zoom} onClose={() => setZoom(null)} />}
    </PasoShell>
  );
}
