// Paso 6a — PACK FLOW (solo filmado). Flujo NUEVO de Google Flow (imagen-first): corre `flowpack` y
// muestra 3 piezas — ESTILO global + PERSONAJES (cada uno con su prompt de IMAGEN de referencia para
// generar en la sección Personaje de Flow con Nano Banana) + ESCENAS (un prompt por escena, con
// Copiar/Regenerar/estado). Es la SALIDA 1: lo que el usuario pega a mano en Google Flow (no hay API).
import { useState, useEffect, useRef } from 'react';
import { Copy, Check, RefreshCw, Loader2, Download, ChevronDown, ChevronRight, PackageOpen, User, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { PasoShell, PasoEmpty, runMolde, errMsg, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { packProgress, pasoHabilitado, type EscenaFlow, type PersonajeFlow } from '../lib/comercial';
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
  // AUTO-GENERAR al entrar: sólo con el paso HABILITADO y el INSUMO DIRECTO del molde (el storyboard
  // — flowpack arma un prompt POR ESCENA). Mismo criterio de deps que el resto: corre una sola vez al
  // montar, con el guard del ref (las deps viejas lo re-evaluaban en cada tecleo del paso).
  const hasAutoFired = useRef(false);
  useEffect(() => {
    const listo = !!comercial && pasoHabilitado(comercial, 'pack') && !!comercial.storyboard?.length;
    if (listo && !comercial?.packFlow && !busy && !error && !hasAutoFired.current) {
      hasAutoFired.current = true;
      generar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [copied, setCopied] = useState('');
  const [openEstilo, setOpenEstilo] = useState(false);
  const [openPersona, setOpenPersona] = useState<string | null>(null);
  const [openEscena, setOpenEscena] = useState<number | null>(null);

  const pack = comercial?.packFlow;
  const escenasSb = comercial?.storyboard || [];
  const prog = packProgress(pack);
  // el shape VIEJO ({master, clips}) persistido no tiene `escenas`: pedimos regenerar al flujo nuevo.
  const esViejo = !!pack && !Array.isArray(pack.escenas);
  const esNuevo = !!pack && !esViejo;
  const personajes = pack?.personajes ?? [];
  const escenas = pack?.escenas ?? [];
  // la próxima escena sin copiar (se resalta como "la que sigue"): guía el ritual de Flow
  const nextEscenaN = escenas.find((e) => e.estado === 'pendiente')?.escenaN;

  const generar = async (provider?: 'claude' | 'gemini') => {
    setBusy(true); setError('');
    try {
      const res = await runMolde('flowpack', project, { storyboard: escenasSb, cast: comercial?.cast }, {}, undefined, comercial, provider);
      setComercial((c) => ({
        ...c,
        packFlow: {
          estilo: (res.estilo as string) || '',
          personajes: (res.personajes as PersonajeFlow[]) || [],
          escenas: (res.escenas as EscenaFlow[]) || [],
        },
        estados: { ...c.estados, pack: c.estados.pack === 'aprobado' ? 'aprobado' : 'generado' },
      }));
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const flash = (id: string) => { setCopied(id); setTimeout(() => setCopied(''), 2000); };

  const copyText = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
    flash(id);
  };

  // copiar una escena marca su estado 'copiado' (si estaba pendiente) → alimenta el progreso/ritual.
  const copyEscena = async (esc: EscenaFlow) => {
    await copyText('e' + esc.escenaN, esc.prompt);
    setComercial((c) => (c.packFlow?.escenas
      ? { ...c, packFlow: { ...c.packFlow, escenas: c.packFlow.escenas.map((k) => (k.escenaN === esc.escenaN && k.estado === 'pendiente' ? { ...k, estado: 'copiado' } : k)) }, estados: { ...c.estados, pack: c.estados.pack === 'aprobado' ? 'aprobado' : 'editado' } }
      : c));
  };

  const regenEscena = async (escenaN: number) => {
    setBusyN(escenaN); setError('');
    try {
      const res = await runMolde('flowpack', project, { storyboard: escenasSb, cast: comercial?.cast }, {}, { escenaN }, comercial);
      const esc = res.escena as { escenaN: number; prompt: string } | undefined;
      if (esc) setComercial((c) => (c.packFlow?.escenas
        ? { ...c, packFlow: { ...c.packFlow, escenas: c.packFlow.escenas.map((k) => (k.escenaN === escenaN ? { ...k, prompt: esc.prompt, estado: 'pendiente' } : k)) } }
        : c));
    } catch (e) { setError(errMsg(e)); } finally { setBusyN(null); }
  };

  const exportTxt = () => {
    if (!esNuevo || !pack) return;
    const lines = [`# PACK FLOW — ${project.name} — ${comercial?.titulo || ''}`, '', '## ESTILO', pack.estilo, ''];
    lines.push('## PERSONAJES (imagen de referencia — Nano Banana)', '');
    for (const p of personajes) lines.push(`### ${p.nombre}`, p.promptImagen, '');
    lines.push('## ESCENAS (animar en Flow)', '');
    for (const esc of escenas) {
      const sb = escenasSb.find((e) => e.n === esc.escenaN);
      lines.push(`### Escena ${esc.escenaN}${sb ? ` — ${esc.rol} — ${sb.durSec}s` : ` — ${esc.rol}`}`, esc.prompt, '');
    }
    downloadTxt(`pack-flow-${project.name}`.replace(/\s+/g, '-').toLowerCase() + '.txt', lines.join('\n'));
  };

  return (
    <PasoShell
      titulo="Pack Flow"
      sub="¡Ya tenés los prompts perfectos! Ahora seguí esta guía paso a paso para generar tus videos en Google Flow."
      hasContent={esNuevo} busy={busy} onGenerate={generar} error={error}
      onApprove={goNext} canApprove={esNuevo && !!escenas.length} approveLabel="Pack listo, al rodaje"
      functionId="flowpack" estado={estadoDelPaso('pack', comercial)}
    >
      {esViejo && (
        <div className="pack-migrate">
          <AlertTriangle size={16} />
          <span>Este pack es del flujo <strong>viejo</strong> de Flow. <strong>Regenerá el pack</strong> para usar la nueva guía paso a paso.</span>
        </div>
      )}

      {esNuevo && pack ? (
        <div className="pack-guided-experience">
          <div className="pack-guide-intro">
            <h3>Guía de Trabajo en Google Flow</h3>
            <p>Mantené esta pestaña abierta. Vas a ir copiando cada prompt de acá y pegándolo en Flow para armar el comercial pieza por pieza.</p>
            <div className="pack-bar">
              <span className="pack-prog">{prog.copiados}/{prog.total} escenas copiadas · {prog.importados} importadas</span>
              <button className="pack-export" onClick={exportTxt}><Download size={14} /> Exportar .txt</button>
            </div>
          </div>

          {/* PASO 1 */}
          <div className="pack-guide-step">
            <div className="step-header">
              <span className="step-number">1</span>
              <div>
                <h4>Configurá el Estilo Global</h4>
                <p>Copiá este prompt y pegalo en la configuración de estilo de tu proyecto en Flow. Si te pide assets de marca, acá los tenés a mano.</p>
              </div>
            </div>
            
            <BrandBlock brandKit={project.brandKit} variant="pack" />

            <div className={`pack-clip pack-clip--master${openEstilo ? ' pack-clip--open' : ''}`}>
              <div className="pack-clip-row">
                <span className="pack-clip-tag">ESTILO</span>
                <span className="pack-clip-desc">estética · formato · luz</span>
                <div className="pack-clip-actions">
                  <button className="paso-icon" title="Copiar el estilo" onClick={() => copyText('estilo', pack.estilo)}>
                    {copied === 'estilo' ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button className="paso-icon" title={openEstilo ? 'Colapsar' : 'Ver prompt'} onClick={() => setOpenEstilo((o) => !o)} aria-expanded={openEstilo}>
                    {openEstilo ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                </div>
              </div>
              {openEstilo && <pre className="pack-prompt">{pack.estilo}</pre>}
            </div>
          </div>

          {/* PASO 2 */}
          <div className="pack-guide-step">
            <div className="step-header">
              <span className="step-number">2</span>
              <div>
                <h4>Creá los Personajes</h4>
                <p>Flow reusa esta imagen en cada escena. Copiá cada prompt, pegalo en la sección "Personajes" de Flow, generá la imagen y guardalo con su nombre.</p>
              </div>
            </div>
            <div className="pack-clips">
                {personajes.map((p) => {
                  const open = openPersona === p.id;
                  return (
                    <div key={p.id} className={`pack-clip pack-clip--persona${open ? ' pack-clip--open' : ''}`}>
                      <div className="pack-clip-row">
                        <span className="pack-persona-ico"><User size={15} /></span>
                        <span className="pack-persona-nombre">{p.nombre}</span>
                        <span className="pack-clip-desc"><ImageIcon size={12} /> imagen de referencia</span>
                        <div className="pack-clip-actions">
                          <button className="paso-icon" title="Copiar el prompt de la imagen" onClick={() => copyText('p' + p.id, p.promptImagen)}>
                            {copied === 'p' + p.id ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                          <button className="paso-icon" title={open ? 'Colapsar' : 'Ver prompt'} onClick={() => setOpenPersona(open ? null : p.id)} aria-expanded={open}>
                            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </button>
                        </div>
                      </div>
                      {open && <pre className="pack-prompt">{p.promptImagen}</pre>}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* PASO 3 */}
          <div className="pack-guide-step">
            <div className="step-header">
              <span className="step-number">3</span>
              <div>
                <h4>Animá las Escenas</h4>
                <p>Ahora copiá cada prompt, generá el video en Flow, y cuando esté listo descargalo a tu computadora. Los estados se irán marcando acá para que lleves control.</p>
              </div>
            </div>
            
            <div className="pack-legend">
              <span className="pack-legend-lbl">Estados</span>
              <span className="pack-legend-i"><span className="pack-estado pack-estado--pendiente">pendiente</span> sin copiar</span>
              <span className="pack-legend-i"><span className="pack-estado pack-estado--copiado">copiado</span> ya lo enviaste a Flow</span>
              <span className="pack-legend-i"><span className="pack-estado pack-estado--importado">importado</span> video descargado</span>
            </div>

            <div className="pack-clips">
              {escenas.map((esc) => {
                const sb = escenasSb.find((e) => e.n === esc.escenaN);
                const open = openEscena === esc.escenaN;
                const isNext = esc.escenaN === nextEscenaN;
                return (
                  <div key={esc.escenaN} className={`pack-clip${open ? ' pack-clip--open' : ''}${isNext ? ' pack-clip--next' : ''}`}>
                    <div className="pack-clip-row">
                      <span className="pack-clip-n">#{esc.escenaN}</span>
                      {isNext && <span className="pack-clip-next-tag">la que sigue</span>}
                      <span className={`paso-role paso-role--${roleKind(esc.rol)}`}>{ROL_LABEL[esc.rol] || esc.rol}</span>
                      {sb && <span className="paso-t">{sb.durSec}s</span>}
                      <span className={`pack-estado pack-estado--${esc.estado}`}>{esc.estado}</span>
                      <div className="pack-clip-actions">
                        <button className="paso-icon" title="Copiar prompt" onClick={() => copyEscena(esc)}>
                          {copied === 'e' + esc.escenaN ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <button className="paso-icon" title="Regenerar (mismo personaje, otra idea visual)" disabled={busyN !== null} onClick={() => regenEscena(esc.escenaN)}>
                          {busyN === esc.escenaN ? <Loader2 size={13} className="paso-spin" /> : <RefreshCw size={13} />}
                        </button>
                        <button className="paso-icon" title={open ? 'Colapsar' : 'Ver prompt'} onClick={() => setOpenEscena(open ? null : esc.escenaN)}>
                          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>
                      </div>
                    </div>
                    {open && <pre className="pack-prompt">{esc.prompt}</pre>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        !busy && !esViejo && <PasoEmpty icon={PackageOpen}>Generá el pack desde el storyboard y el cast: personajes con su imagen de referencia + un prompt por escena para animar en Flow.</PasoEmpty>
      )}
    </PasoShell>
  );
}
