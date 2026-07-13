// Paso 3 — GUION. Corre el molde `script` (adaptado: GuionEstructurado hook/desarrollo/gag/cta),
// editable inline, con regen por bloque. Persiste el guion ENTERO en comercial.guion (no aplana).
import { useState } from 'react';
import { RefreshCw, Loader2, Camera, Music2, FileText } from 'lucide-react';
import { PasoShell, PasoEmpty, runMolde, errMsg, InlineEdit, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import type { GuionEstructurado, GuionBloque, EstadoPaso } from '../lib/comercial';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', gag: 'Remate', cta: 'CTA' };
const roleKind = (r: string) => (r === 'hook' ? 'hook' : r === 'cta' ? 'cta' : r === 'gag' ? 'gag' : 'mid');

export default function PasoGuion({ project, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [error, setError] = useState('');
  const guion = comercial?.guion;
  const blocks = guion?.blocks || [];

  const applyGuion = (g: GuionEstructurado, estado: EstadoPaso = 'generado') =>
    setComercial((c) => ({ ...c, guion: g, estados: { ...c.estados, guion: c.estados.guion === 'aprobado' ? 'aprobado' : estado } }));

  const generar = async () => {
    setBusy(true); setError('');
    try {
      const res = await runMolde('script', project, { concepto: comercial?.concepto, durationSec: 20 }, { tono: 'cercano', duracion: '20' }, undefined, comercial);
      applyGuion({ blocks: (res.blocks as GuionBloque[]) || [], music: res.music as { mood: string } | undefined });
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const regenBlock = async (i: number) => {
    if (!guion) return;
    setBusyIdx(i); setError('');
    try {
      const res = await runMolde('script', project, { concepto: comercial?.concepto }, { tono: 'cercano' }, { index: i, blocks }, comercial);
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
