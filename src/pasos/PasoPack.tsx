// Paso 6a — PACK FLOW (solo filmado). Flujo NUEVO de Google Flow (imagen-first): corre `flowpack` y
// muestra 3 piezas — ESTILO global + PERSONAJES (cada uno con su prompt de IMAGEN de referencia para
// generar en la sección Personaje de Flow con Nano Banana) + ESCENAS (un prompt por escena, con
// Copiar/Regenerar/estado). Es la SALIDA 1: lo que el usuario pega a mano en Google Flow (no hay API).
import { useState, useEffect, useRef } from 'react';
import { Copy, Check, RefreshCw, Loader2, Download, ChevronDown, ChevronRight, PackageOpen, User, Image as ImageIcon, AlertTriangle, Bot, Clapperboard } from 'lucide-react';
import { API_BASE } from '../config';
import { PasoShell, PasoEmpty, runMolde, errMsg, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { packProgress, pasoHabilitado, type EscenaFlow, type PersonajeFlow } from '../lib/comercial';
import BrandBlock from '../BrandBlock';
import CrudosFlow from './CrudosFlow';
import BotonChatGPT from './BotonChatGPT';
import { pedidoPaso } from '../lib/paraChatGPT';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', giro: 'Giro', gag: 'Remate', cta: 'CTA' };
const roleKind = (r: string) => (r === 'hook' ? 'hook' : r === 'cta' ? 'cta' : (r === 'gag' || r === 'giro') ? 'gag' : 'mid');

function downloadTxt(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Job de la rutina automática Media Studio → Flow (server/flowDriver.mjs): el front lo arranca y lo sigue por polling.
interface FlowJob { id: string; estado: string; paso: string; log: string[]; escenas: { escenaN: number; estado: string; fileRef: string | null; motivo?: string }[]; fallas?: string[]; error: string | null; flowProjectUrl: string | null; extension?: boolean; pestanas?: number }

export default function PasoPack({ project, reelId, comercial, setComercial, goNext }: PasoProps) {
  const [job, setJob] = useState<FlowJob | null>(null);
  const [autoBusy, setAutoBusy] = useState(false);
  const [verLog, setVerLog] = useState(false);
  const [verManual, setVerManual] = useState(false);   // los prompts, plegados: para revisar o hacerlo a mano
  useEffect(() => {
    if (!job || job.estado === 'listo' || job.estado === 'error') return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/flow/jobs/${encodeURIComponent(job.id)}`);
        const d = await r.json();
        if (r.ok && d.job) {
          const j = d.job as FlowJob;
          setJob(j);
          // el proyecto de Flow que creó la rutina queda en la pieza: la próxima corrida lo reutiliza (personajes incluidos)
          if (j.flowProjectUrl) setComercial((c) => (c.flowProjectUrl === j.flowProjectUrl ? c : { ...c, flowProjectUrl: j.flowProjectUrl as string }));
          // cada clip que la rutina importó entra al rodaje del comercial en pantalla (el server ya lo guardó en la base)
          const importadas = j.escenas.filter((e) => e.estado === 'importada' && e.fileRef);
          if (importadas.length) {
            setComercial((c) => {
              const actuales = c.rodaje || [];
              const faltan = importadas.filter((e) => !actuales.some((t2) => t2.fileRef === e.fileRef));
              if (!faltan.length) return c;
              const rodaje = [...actuales.filter((t2) => !faltan.some((e) => e.escenaN === t2.escenaN)), ...faltan.map((e) => ({ id: `toma-${e.escenaN}-${Date.now()}`, escenaN: e.escenaN, fileRef: e.fileRef as string, durSec: 8 }))].sort((a, b) => a.escenaN - b.escenaN);
              const packFlow = c.packFlow ? { ...c.packFlow, escenas: c.packFlow.escenas.map((k) => (faltan.some((e) => e.escenaN === k.escenaN) ? { ...k, estado: 'importado' as const } : k)) } : c.packFlow;
              return { ...c, rodaje, packFlow, estados: { ...c.estados, rodaje: c.estados.rodaje === 'aprobado' ? 'aprobado' : 'generado' } };
            });
          }
        }
      } catch { /* el próximo tick reintenta */ }
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, job?.estado]);

  const automatizar = async () => {
    if (!comercial?.packFlow || !Array.isArray(comercial.packFlow.escenas)) return;
    if (comercial.estados.preproduccion !== 'aprobado') {
      setError('Antes de gastar créditos de Flow, aprobá el prototipo en Preproducción.');
      return;
    }
    if (!window.confirm('Esta acción GENERA videos en Google Flow y puede consumir créditos. ¿Autorizás comenzar la producción de esta pieza?')) return;
    setAutoBusy(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/flow/automatizar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, reelId, pack: comercial.packFlow, storyboard: comercial.storyboard || [], flowProjectUrl: (comercial as unknown as { flowProjectUrl?: string }).flowProjectUrl }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo arrancar la rutina de Flow');
      setJob(d.job as FlowJob);
    } catch (e) { setError(errMsg(e)); } finally { setAutoBusy(false); }
  };

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
      sub="Los videos de cada escena filmada: Media Studio los genera en tu Flow y los baja acá."
      hasContent={esNuevo} busy={busy} onGenerate={generar} error={error}
      onApprove={goNext} canApprove={esNuevo && !!escenas.length} approveLabel="Videos listos, al montaje"
      functionId="flowpack" estado={estadoDelPaso('pack', comercial)}
      chatgpt={comercial ? <BotonChatGPT armar={() => pedidoPaso(project, comercial, 'pack')} nombre={`${comercial.titulo}-pedidos-flow`} /> : undefined}
    >
      {esViejo && (
        <div className="pack-migrate">
          <AlertTriangle size={16} />
          <span>Este pack es del flujo <strong>viejo</strong> de Flow. <strong>Regenerá el pack</strong> para usar la nueva guía paso a paso.</span>
        </div>
      )}

      {esNuevo && pack ? (
        <div className="pack-guided-experience">
          {/* el orden es el del trabajo (Lucas, 2026-10-11): arriba automatizar, en el medio los videos, abajo los prompts plegados */}
          <div className="pack-guide-intro">
            <h3>Videos en Google Flow</h3>
            <p>Media Studio usa tu Flow: crea los personajes, genera cada escena y baja los clips. Quedan acá abajo, en Los crudos de Flow.</p>
            <div className="pack-bar">
              <button className="paso-gen pack-auto" onClick={() => void automatizar()} disabled={autoBusy || (!!job && job.estado !== 'listo' && job.estado !== 'error')} title="Media Studio usa tu Flow para crear los personajes, generar cada escena y bajar los clips: quedan abajo, en Los crudos de Flow">
                {autoBusy || (job && job.estado !== 'listo' && job.estado !== 'error') ? <Loader2 size={14} className="paso-spin" /> : <Bot size={14} />} Automatizar creación en Flow
              </button>
            </div>
          </div>

          {job && (
            <div className={`pack-job pack-job--${job.estado}`}>
              <div className="pack-job-h">
                <Clapperboard size={13} />
                <b>{job.estado === 'listo' ? (job.fallas?.length ? 'Terminó, con partes que no salieron' : 'Clips de Flow bajados') : job.estado === 'error' ? 'La rutina se detuvo' : 'Generando en Flow…'}</b>
                <span className="pack-job-paso">{job.paso}</span>
                <button className="rodaje-var" onClick={() => setVerLog((v) => !v)}>{verLog ? 'ocultar detalle' : 'ver detalle'}</button>
              </div>
              {job.error && <div className="paso-error" style={{ marginTop: 6 }}>{job.error}</div>}
              {!!job.escenas.length && (
                <div className="pack-job-escenas">
                  {job.escenas.map((e) => <span key={e.escenaN} className={`tag ${e.estado === 'importada' ? 'pack-job-ok' : 'pack-job-run'}`} title={e.motivo || ''}>Escena {e.escenaN} · {e.estado === 'importada' ? 'bajada' : e.estado === 'falló' ? 'no salió (tocá Automatizar de nuevo)' : e.estado}</span>)}
                </div>
              )}
              {job.estado === 'corriendo' && job.extension === false && (
                <div className="paso-empty" style={{ marginTop: 6 }}>
                  No veo la extensión <b>Media Studio · Puente Flow</b> en tu Chrome. Una sola vez: en Chrome abrí <code>chrome://extensions</code>, activá <b>Modo de desarrollador</b>, <b>Cargar descomprimida</b> y elegí la carpeta <code>D:\\Code\\media-studio\\extension-flow</code> (si ya estaba, tocá <b>Recargar</b> ahí mismo). La rutina arranca sola en cuanto conecta.
                </div>
              )}
              {job.estado === 'corriendo' && job.extension !== false && job.pestanas === 0 && (
                <div className="paso-empty" style={{ marginTop: 6 }}>
                  La extensión está, pero no hay ninguna pestaña de <code>flow.google.com</code> abierta. Abrí una (no hace falta que quede a la vista) y la rutina sigue sola.
                </div>
              )}
              {/* el avance se ve siempre (las últimas líneas); "ver detalle" despliega el log entero. Lucas, 2026-10-10: "el detalle no muestra nada" */}
              {(() => {
                const lineas = verLog ? job.log : job.log.slice(-4);
                return lineas.length
                  ? <pre className="pack-job-log">{lineas.join('\n')}</pre>
                  : <div className="pack-job-paso" style={{ marginTop: 6 }}>Esperando el primer paso de la extensión en tu Chrome…</div>;
              })()}
              {job.estado === 'listo' && <button className="paso-approve" style={{ marginTop: 8 }} onClick={goNext}>Seguir a los mockups</button>}
            </div>
          )}

          {/* los crudos de Flow: el clip de cada escena filmada (antes en el paso Rodaje) */}
          <CrudosFlow project={project} comercial={comercial} setComercial={setComercial} />

          {/* los prompts: lo que se le manda a Flow, para revisar o para hacerlo a mano si la automatización falla */}
          <div className="pack-manual" style={{ marginTop: 18 }}>
            <button className="pack-export" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setVerManual((v) => !v)}>
              {verManual ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Lo que se le manda a Flow · para revisar o hacerlo a mano · {prog.copiados}/{prog.total} escenas copiadas
            </button>
            {verManual && (
              <>
                <div className="pack-bar" style={{ marginTop: 10 }}>
                  <span className="pack-prog">Copiá cada prompt y pegalo en Flow, en este orden.</span>
                  <button className="pack-export" onClick={exportTxt}><Download size={14} /> Exportar .txt</button>
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

                {escenasSb.some((e) => e.rol === 'cta') && (
                  <div className="paso-empty" style={{ marginBottom: 8 }}>
                    La escena {escenasSb.find((e) => e.rol === 'cta')?.n} (cta) es la placa de cierre: logo, marca y llamada a la acción. La dibuja el montaje; no se genera en Flow.
                  </div>
                )}
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
                          {esc.rol === 'cta'
                            ? <span className="pack-estado" title="La placa de cierre (logo, marca y llamada a la acción) la pone el montaje. Esta escena no se genera en Flow ni la toma la rutina.">placa de cierre · no se filma</span>
                            : <span className={`pack-estado pack-estado--${esc.estado}`}>{esc.estado}</span>}
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
              </>
            )}
          </div>
        </div>
      ) : (
        !busy && !esViejo && <PasoEmpty icon={PackageOpen}>Generá el pack desde el storyboard y el cast: personajes con su imagen de referencia + un prompt por escena para animar en Flow.</PasoEmpty>
      )}
    </PasoShell>
  );
}
