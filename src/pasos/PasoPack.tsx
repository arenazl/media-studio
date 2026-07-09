// Paso 6a — PACK FLOW (solo filmado). Corre `flowpack` (Fase 1: consistencia garantizada),
// muestra el MASTER + un prompt por escena con Copiar/Regenerar/estado, y exporta el pack a .txt.
// Es la SALIDA 1: lo que el usuario pega a mano en Google Flow (no hay API de Flow).
import { useState } from 'react';
import { Copy, Check, RefreshCw, Loader2, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { PasoShell, runMolde, errMsg, type PasoProps } from './pasoKit';
import { packProgress, type ClipFlow } from '../lib/comercial';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', gag: 'Remate', cta: 'CTA' };
const roleClass = (r: string) => (r === 'hook' ? 'paso-role--hook' : r === 'cta' ? 'paso-role--cta' : 'paso-role--mid');

function downloadTxt(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PasoPack({ project, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [busyN, setBusyN] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [openMaster, setOpenMaster] = useState(false);
  const [openClip, setOpenClip] = useState<number | null>(null);

  const pack = comercial?.packFlow;
  const escenas = comercial?.storyboard || [];
  const prog = packProgress(pack);

  const generar = async () => {
    setBusy(true); setError('');
    try {
      const res = await runMolde('flowpack', project, { storyboard: escenas, cast: comercial?.cast });
      setComercial((c) => ({
        ...c,
        packFlow: { master: (res.master as string) || '', clips: (res.clips as ClipFlow[]) || [] },
        estados: { ...c.estados, pack: c.estados.pack === 'aprobado' ? 'aprobado' : 'generado' },
      }));
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const flash = (id: string) => { setCopied(id); setTimeout(() => setCopied(''), 1400); };

  const copyMaster = async () => {
    if (!pack) return;
    try { await navigator.clipboard.writeText(pack.master); } catch { /* noop */ }
    flash('master');
  };

  const copyClip = async (clip: ClipFlow) => {
    try { await navigator.clipboard.writeText(clip.prompt); } catch { /* noop */ }
    flash('c' + clip.escenaN);
    setComercial((c) => (c.packFlow
      ? { ...c, packFlow: { ...c.packFlow, clips: c.packFlow.clips.map((k) => (k.escenaN === clip.escenaN && k.estado === 'pendiente' ? { ...k, estado: 'copiado' } : k)) }, estados: { ...c.estados, pack: c.estados.pack === 'aprobado' ? 'aprobado' : 'editado' } }
      : c));
  };

  const regenClip = async (escenaN: number) => {
    setBusyN(escenaN); setError('');
    try {
      const res = await runMolde('flowpack', project, { storyboard: escenas, cast: comercial?.cast }, {}, { escenaN });
      const clip = res.clip as { escenaN: number; prompt: string } | undefined;
      if (clip) setComercial((c) => (c.packFlow
        ? { ...c, packFlow: { ...c.packFlow, clips: c.packFlow.clips.map((k) => (k.escenaN === escenaN ? { ...k, prompt: clip.prompt, estado: 'pendiente' } : k)) } }
        : c));
    } catch (e) { setError(errMsg(e)); } finally { setBusyN(null); }
  };

  const exportTxt = () => {
    if (!pack) return;
    const lines = [`# PACK FLOW — ${project.name} — ${comercial?.titulo || ''}`, '', '## MASTER', pack.master, ''];
    for (const clip of pack.clips) {
      const esc = escenas.find((e) => e.n === clip.escenaN);
      lines.push(`## CLIP escena ${clip.escenaN}${esc ? ` — ${esc.rol} — ${esc.durSec}s` : ''}`, clip.prompt, '');
    }
    downloadTxt(`pack-flow-${project.name}`.replace(/\s+/g, '-').toLowerCase() + '.txt', lines.join('\n'));
  };

  return (
    <PasoShell
      titulo="Pack Flow"
      sub="Pegá cada prompt en Google Flow (Veo 3, 9:16, 8s), bajá el clip y volvé a Rodaje para importarlo."
      hasContent={!!pack} busy={busy} onGenerate={generar} error={error}
      onApprove={goNext} canApprove={!!pack?.clips?.length} approveLabel="Pack listo, al rodaje"
    >
      {pack ? (
        <>
          <div className="pack-bar">
            <span className="pack-prog">{prog.copiados}/{prog.total} copiados · {prog.importados} importados</span>
            <button className="pack-export" onClick={exportTxt}><Download size={14} /> Exportar .txt</button>
          </div>

          <div className="paso-card">
            <button className="pack-master-h" onClick={() => setOpenMaster((o) => !o)}>
              {openMaster ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>MASTER — estilo + personajes + locación</span>
              <span className="paso-icon pack-copy-inline" title="Copiar master" onClick={(e) => { e.stopPropagation(); copyMaster(); }}>
                {copied === 'master' ? <Check size={12} /> : <Copy size={12} />}
              </span>
            </button>
            {openMaster && <pre className="pack-prompt">{pack.master}</pre>}
          </div>

          <div className="paso-cards">
            {pack.clips.map((clip) => {
              const esc = escenas.find((e) => e.n === clip.escenaN);
              const open = openClip === clip.escenaN;
              return (
                <article key={clip.escenaN} className="paso-scene">
                  <div className="paso-scene-h">
                    <span className="paso-scene-n">#{clip.escenaN}</span>
                    {esc && <span className={`paso-role ${roleClass(esc.rol)}`}>{ROL_LABEL[esc.rol] || esc.rol}</span>}
                    {esc && <span className="paso-t">{esc.durSec}s</span>}
                    <span className={`pack-estado pack-estado--${clip.estado}`}>{clip.estado}</span>
                    <button className="paso-icon" title="Copiar prompt" onClick={() => copyClip(clip)}>
                      {copied === 'c' + clip.escenaN ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <button className="paso-icon" title="Regenerar (mismo personaje, otra idea visual)" disabled={busyN !== null} onClick={() => regenClip(clip.escenaN)}>
                      {busyN === clip.escenaN ? <Loader2 size={12} className="paso-spin" /> : <RefreshCw size={12} />}
                    </button>
                    <button className="paso-icon" title={open ? 'Colapsar' : 'Ver prompt'} onClick={() => setOpenClip(open ? null : clip.escenaN)}>
                      {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  </div>
                  {open && <pre className="pack-prompt">{clip.prompt}</pre>}
                </article>
              );
            })}
          </div>
        </>
      ) : (
        !busy && <div className="paso-empty">Generá el pack desde el storyboard y el cast. Cada clip lleva el personaje verbatim (consistencia garantizada por el motor).</div>
      )}
    </PasoShell>
  );
}
