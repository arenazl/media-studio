// Paso 6a — PACK FLOW (solo filmado). Corre `flowpack` (Fase 1: consistencia garantizada),
// muestra el MASTER + un prompt por escena con Copiar/Regenerar/estado, y exporta el pack a .txt.
// Es la SALIDA 1: lo que el usuario pega a mano en Google Flow (no hay API de Flow).
import { useState } from 'react';
import { Copy, Check, RefreshCw, Loader2, Download, ChevronDown, ChevronRight, PackageOpen } from 'lucide-react';
import { PasoShell, PasoEmpty, runMolde, errMsg, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { packProgress, type ClipFlow } from '../lib/comercial';
import BrandBlock from '../BrandBlock';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', gag: 'Remate', cta: 'CTA' };
const roleKind = (r: string) => (r === 'hook' ? 'hook' : r === 'cta' ? 'cta' : r === 'gag' ? 'gag' : 'mid');

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
  // el próximo clip sin copiar (se resalta como "el que sigue"): guía el ritual de Flow
  const nextClipN = pack?.clips.find((c) => c.estado === 'pendiente')?.escenaN;

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

  const flash = (id: string) => { setCopied(id); setTimeout(() => setCopied(''), 2000); };

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
      functionId="flowpack" estado={estadoDelPaso('pack', comercial)}
    >
      {pack ? (
        <>
          <div className="pack-bar">
            <span className="pack-prog">{prog.copiados}/{prog.total} copiados · {prog.importados} importados</span>
            <button className="pack-export" onClick={exportTxt}><Download size={14} /> Exportar .txt</button>
          </div>

          {/* C3: los assets de marca, a mano y cerca del MASTER (para subirlos a Flow) */}
          <BrandBlock brandKit={project.brandKit} variant="pack" />

          {/* C4: leyenda de estados — qué significan pendiente / copiado / importado */}
          <div className="pack-legend">
            <span className="pack-legend-lbl">Estados</span>
            <span className="pack-legend-i"><span className="pack-estado pack-estado--pendiente">pendiente</span> sin copiar</span>
            <span className="pack-legend-i"><span className="pack-estado pack-estado--copiado">copiado</span> ya lo pegaste en Flow</span>
            <span className="pack-legend-i"><span className="pack-estado pack-estado--importado">importado</span> ya trajiste el video a Rodaje</span>
          </div>

          {/* C4: MASTER como fila DESTACADA del MISMO sistema colapsable (no un widget aparte) */}
          <div className="pack-group">
            <p className="pack-group-lead">Pegá esto <strong>primero</strong>: define el estilo y los personajes. Una sola vez en Flow.</p>
            <div className={`pack-clip pack-clip--master${openMaster ? ' pack-clip--open' : ''}`}>
              <div className="pack-clip-row">
                <span className="pack-clip-tag">MASTER</span>
                <span className="pack-clip-desc">estilo · personajes · locación</span>
                <div className="pack-clip-actions">
                  <button className="paso-icon" title="Copiar el master" onClick={copyMaster}>
                    {copied === 'master' ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button className="paso-icon" title={openMaster ? 'Colapsar' : 'Ver prompt'} onClick={() => setOpenMaster((o) => !o)} aria-expanded={openMaster}>
                    {openMaster ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                </div>
              </div>
              {openMaster && <pre className="pack-prompt">{pack.master}</pre>}
            </div>
          </div>

          {/* C4: clips = un prompt POR ESCENA, con el mismo sistema de fila; se resalta el próximo sin copiar */}
          <div className="pack-group">
            <p className="pack-group-lead">Un prompt <strong>por escena</strong>: generá un video de 8s con cada uno.</p>
            <div className="pack-clips">
              {pack.clips.map((clip) => {
                const esc = escenas.find((e) => e.n === clip.escenaN);
                const open = openClip === clip.escenaN;
                const isNext = clip.escenaN === nextClipN;
                return (
                  <div key={clip.escenaN} className={`pack-clip${open ? ' pack-clip--open' : ''}${isNext ? ' pack-clip--next' : ''}`}>
                    <div className="pack-clip-row">
                      <span className="pack-clip-n">#{clip.escenaN}</span>
                      {isNext && <span className="pack-clip-next-tag">el que sigue</span>}
                      {esc && <span className={`paso-role paso-role--${roleKind(esc.rol)}`}>{ROL_LABEL[esc.rol] || esc.rol}</span>}
                      {esc && <span className="paso-t">{esc.durSec}s</span>}
                      <span className={`pack-estado pack-estado--${clip.estado}`}>{clip.estado}</span>
                      <div className="pack-clip-actions">
                        <button className="paso-icon" title="Copiar prompt" onClick={() => copyClip(clip)}>
                          {copied === 'c' + clip.escenaN ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <button className="paso-icon" title="Regenerar (mismo personaje, otra idea visual)" disabled={busyN !== null} onClick={() => regenClip(clip.escenaN)}>
                          {busyN === clip.escenaN ? <Loader2 size={13} className="paso-spin" /> : <RefreshCw size={13} />}
                        </button>
                        <button className="paso-icon" title={open ? 'Colapsar' : 'Ver prompt'} onClick={() => setOpenClip(open ? null : clip.escenaN)}>
                          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>
                      </div>
                    </div>
                    {open && <pre className="pack-prompt">{clip.prompt}</pre>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        !busy && <PasoEmpty icon={PackageOpen}>Generá el pack desde el storyboard y el cast. Cada clip lleva el personaje verbatim: la consistencia la garantiza el motor.</PasoEmpty>
      )}
    </PasoShell>
  );
}
