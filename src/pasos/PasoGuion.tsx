// Paso 3 — GUION. Corre el molde `script` (adaptado: GuionEstructurado hook/desarrollo/gag/cta),
// editable inline, con regen por bloque. Persiste el guion ENTERO en comercial.guion (no aplana).
import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Loader2, Camera, Music2, FileText } from 'lucide-react';
import { PasoShell, PasoEmpty, runMolde, errMsg, InlineEdit, type PasoProps } from './pasoKit';
import { KitTira } from '../components/KitCapturas';
import { mediaKitParaMolde } from '../lib/mediaKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { getFormato } from '../lib/formato';
import { pasoHabilitado, type GuionEstructurado, type GuionBloque, type EstadoPaso } from '../lib/comercial';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', giro: 'Giro', gag: 'Remate', cta: 'CTA' };
const roleKind = (r: string) => (r === 'hook' ? 'hook' : r === 'cta' ? 'cta' : (r === 'gag' || r === 'giro') ? 'gag' : 'mid');

export default function PasoGuion({ project, reelId, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [error, setError] = useState('');
  const guion = comercial?.guion;
  const blocks = guion?.blocks || [];
  const tipo = comercial?.tipo ?? 'filmado';
  // Duración REAL de la pieza: la del reel (la sembró `strategy`) → la default del formato → 20 (el
  // hardcodeo viejo, retrocompat). Ojo con `options.duracion`: en el molde le GANA al durationSec
  // (`options.duracion || x.durationSec`), así que mandarlo dejaba muerta la duración del formato.
  const durationSec = project.reels.find((r) => r.id === reelId)?.durationSec
    ?? getFormato(comercial?.formatoId)?.duracion.default ?? 20;

  // AUTO-GENERAR al entrar: sólo si el paso está HABILITADO (el anterior visible ya generó algo) y
  // existe el INSUMO DIRECTO del molde — acá, el concepto elegido. Entrar a un paso sin insumos no
  // puede llamar a la IA ni marcar estados: salían guiones sin concepto y encima quemaban tokens.
  const hasAutoFired = useRef(false);
  useEffect(() => {
    const listo = !!comercial && pasoHabilitado(comercial, 'guion') && !!comercial.concepto;
    if (listo && !guion && !busy && !error && !hasAutoFired.current) {
      hasAutoFired.current = true;
      generar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyGuion = (g: GuionEstructurado, estado: EstadoPaso = 'generado') =>
    setComercial((c) => ({ ...c, guion: g, estados: { ...c.estados, guion: c.estados.guion === 'aprobado' ? 'aprobado' : estado } }));

  const generar = async (provider?: 'claude' | 'gemini') => {
    setBusy(true); setError('');
    try {
      const mediaKit = mediaKitParaMolde(project.pantallasKit, project.momentos, project.cta);
      const res = await runMolde('script', project, { concepto: comercial?.concepto, durationSec, tipo, messageScope: comercial?.messageScope, primaryMessage: comercial?.primaryMessage, supportingFacts: comercial?.supportingFacts, enfoque: comercial?.enfoque, tratamiento: comercial?.tratamiento, ...(mediaKit ? { mediaKit } : {}) }, { tono: 'cercano' }, undefined, comercial, provider);
      applyGuion({ blocks: (res.blocks as GuionBloque[]) || [], music: res.music as { mood: string } | undefined });
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const regenBlock = async (i: number) => {
    if (!guion) return;
    setBusyIdx(i); setError('');
    try {
      // la regeneración de un bloque también viaja con el enfoque y el tratamiento (si no, un bloque sobrio volvía con otro registro)
      const res = await runMolde('script', project, { concepto: comercial?.concepto, enfoque: comercial?.enfoque, tratamiento: comercial?.tratamiento }, { tono: 'cercano' }, { index: i, blocks }, comercial);
      const item = res.item as GuionBloque | undefined;
      if (item) applyGuion({ ...guion, blocks: blocks.map((b, j) => (j === i ? item : b)) }, 'editado');
    } catch (e) { setError(errMsg(e)); } finally { setBusyIdx(null); }
  };

  const editNarr = (i: number, v: string) => {
    if (!guion) return;
    applyGuion({ ...guion, blocks: blocks.map((b, j) => (j === i ? { ...b, narration: v } : b)) }, 'editado');
  };

  return (
    <PasoShell
      titulo="Guion" sub="El guion por bloques: hook → desarrollo → remate → CTA, con timing."
      hasContent={blocks.length > 0} busy={busy} onGenerate={generar} error={error}
      onApprove={goNext} canApprove={blocks.length > 0} approveLabel="Guion listo, al cast"
      functionId="script" estado={estadoDelPaso('guion', comercial)}
    >
      {/* WO-K3: con qué capturas reales se va a armar el video (solo lectura; sin kit no se monta). */}
      <KitTira pantallas={project.pantallasKit} />

      {blocks.length > 0 ? (
        <>
          <div className="paso-cards">
            {blocks.map((b, i) => (
              <article key={i} className={`paso-block paso-block--${roleKind(b.role)}`}>
                <div className="paso-block-h">
                  <span className={`paso-role paso-role--${roleKind(b.role)}`}>{ROL_LABEL[b.role] || b.role}</span>
                  {b.durSec ? <span className="paso-t">{b.durSec}s</span> : null}
                  <button className="paso-icon" title="Regenerar este bloque (variante)" disabled={busyIdx !== null} onClick={() => regenBlock(i)}>
                    {busyIdx === i ? <Loader2 size={12} className="paso-spin" /> : <RefreshCw size={12} />}
                  </button>
                </div>
                <InlineEdit value={b.narration} onChange={(v) => editNarr(i, v)} rows={2} />
                {b.visual && <div className="paso-block-visual"><Camera size={13} /> <span>{b.visual}</span></div>}
              </article>
            ))}
          </div>
          {guion?.music?.mood && (
            <div className="paso-card guion-music">
              <div className="paso-card-h"><Music2 size={12} /> Música</div>
              <p>{guion.music.mood}</p>
            </div>
          )}
        </>
      ) : (
        !busy && <PasoEmpty icon={FileText}>Generá el guion desde el concepto elegido: hook, desarrollo, remate y CTA con su timing y su intención visual.</PasoEmpty>
      )}
    </PasoShell>
  );
}
