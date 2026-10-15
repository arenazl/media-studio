import { useState, useEffect, useRef } from 'react';
import { Check, Users, Monitor, Lightbulb, ArrowLeft, Wand2, Pencil, X } from 'lucide-react';
import { PasoShell, runMolde, errMsg, type PasoProps } from './pasoKit';
import { KitTira } from '../components/KitCapturas';
import { mediaKitParaMolde } from '../lib/mediaKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { getFormato } from '../lib/formato';
import { pasoHabilitado, type Concepto, type TipoComercial } from '../lib/comercial';
import { getFunction } from '../lib/functionCatalog';
import BotonChatGPT from './BotonChatGPT';
import { pedidoPaso } from '../lib/paraChatGPT';

// concept/3.0 (curación 2026-10-10): lo que el dueño elige antes de pedir propuestas. Intensidad y mecanismo sólo con humor.
type Eleccion = 'enfoque' | 'tratamiento' | 'intensidadHumor' | 'recursoHumorId';
const ELECCIONES: { id: Eleccion; label: string; def: string; soloHumor?: boolean }[] = [
  { id: 'enfoque', label: 'Enfoque · cómo se cuenta la historia', def: 'caso' },
  { id: 'tratamiento', label: 'Tratamiento · cómo se siente', def: 'natural' },
  { id: 'intensidadHumor', label: 'Intensidad del humor', def: 'sutil', soloHumor: true },
  { id: 'recursoHumorId', label: 'Mecanismo de humor', def: 'auto', soloHumor: true },
];

export default function PasoConcepto({ project, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // las 2-3 opciones son transitorias (la ELEGIDA persiste en comercial.concepto).
  const [opciones, setOpciones] = useState<Concepto[]>(comercial?.concepto ? [comercial.concepto] : []);
  const tipo: TipoComercial = comercial?.tipo ?? 'filmado';
  // La técnica la fija el FORMATO elegido en el wizard (WO-1/D2: tecnicaProduccion → tipo). Si la
  // pieza nació con formato, acá NO se re-elige (volvería a desincronizar formato↔pipeline): se
  // muestra informativa. Sin formatoId (piezas viejas) el selector sigue siendo la única fuente.
  const formato = getFormato(comercial?.formatoId);
  const elegido = comercial?.concepto;
  
  // Si hay un concepto elegido al cargar, abrimos el detalle de ese; sino null (Gateway)
  const [previewCptId, setPreviewCptId] = useState<string | null>(elegido?.id || null);

  // Si cambian las opciones (ej. al regenerar), volver al Gateway
  const idsOpciones = opciones.map((o) => o.id).join('|');
  useEffect(() => { setPreviewCptId(null); }, [idsOpciones]);

  // SIN auto-disparo (2026-10-15, Lucas: "es una corrida perdida"): la pieza nace con "caso + cotidiano" de fábrica y
  // Concepto pedía propuestas al entrar, antes de que el dueño eligiera; si después cambiaba el enfoque, esa vuelta se
  // tiraba. Ahora se eligen las dos líneas, se ve el resumen del comercial y se dispara a mano.
  // Una línea cuenta como elegida cuando el dueño la tocó en esta pantalla, o cuando la pieza ya tiene concepto (ya pasó).
  const [elegidas, setElegidas] = useState(() => ({ enfoque: !!comercial?.concepto, tratamiento: !!comercial?.concepto }));
  const lasDos = elegidas.enfoque && elegidas.tratamiento;
  // al completar la segunda línea, el resumen aparece abajo del todo: se lo trae a la vista para que se vea el botón
  const resumenRef = useRef<HTMLElement>(null);
  useEffect(() => { if (lasDos) resumenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [lasDos]);

  const generar = async (provider?: 'claude' | 'gemini') => {
    setBusy(true); setError('');
    try {
      const mediaKit = mediaKitParaMolde(project.pantallasKit, project.momentos, project.cta);
      const eleccion = Object.fromEntries(ELECCIONES.map((e) => [e.id, comercial?.[e.id] || e.def])) as Record<Eleccion, string>;
      const piece = { angulo: comercial?.angulo || comercial?.titulo || '', creativeBrief: comercial?.creativeBrief || '', messageScope: comercial?.messageScope, primaryMessage: comercial?.primaryMessage, durationSec: 20, tipo, ...eleccion, cierreMarca: comercial?.cierreMarca || '', ...(mediaKit ? { mediaKit } : {}) };
      const res = await runMolde('concept', project, piece, { perfil: comercial?.perfilCampana === 'solo-mockups' ? 'demo' : comercial?.perfilCampana || 'campaña', ...eleccion }, undefined, comercial, provider);
      setOpciones((res.conceptos as Concepto[]) || []);
      setComercial((c) => ({ ...c, estados: { ...c.estados, concepto: c.estados.concepto === 'aprobado' ? 'aprobado' : 'generado' } }));
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  // Edición a mano (2026-10-10): cambiar una palabra de una propuesta sin volver a generar. Si es la elegida, la pieza
  // toma el texto nuevo; si ya había guion, se avisa que se armó con la versión anterior.
  const [editando, setEditando] = useState<Concepto | null>(null);
  const guardarEdicion = () => {
    if (!editando) return;
    const editado: Concepto = { ...editando, editadoAMano: true };
    setOpciones((os) => os.map((o) => (o.id === editado.id ? editado : o)));
    if (elegido?.id === editado.id) {
      setComercial((c) => ({ ...c, concepto: editado, estados: { ...c.estados, concepto: 'editado' } }));
      if (comercial?.guion) setAviso('Retocaste el concepto elegido: el guion y lo que sigue se armaron con la versión anterior. Si el cambio importa para la historia, regeneralos.');
    }
    setEditando(null);
  };
  const elegir = (cpt: Concepto) =>
    setComercial((c) => ({ ...c, concepto: cpt, estados: { ...c.estados, concepto: 'editado' } }));

  const setTipo = (t: TipoComercial) => {
    if (t === tipo) return;
    setComercial((c) => ({ ...c, tipo: t }));
    setOpciones([]);   // las propuestas eran para la otra técnica: se vuelven a pedir
  };

  // cambiar enfoque o tratamiento invalida las propuestas (eran para otra forma de contar) y también el concepto ya
  // elegido y lo que se construyó encima: el guion, el cast, el storyboard y el pack quedan "pendiente" (los textos no
  // se borran, pero el pipeline exige regenerarlos). Revisión externa 2026-10-10: si no, se producía un comercial con el
  // enfoque anterior.
  const [aviso, setAviso] = useState('');
  const elegirOpcion = (k: Eleccion, v: string) => {
    if (k === 'enfoque' || k === 'tratamiento') { setElegidas((el) => ({ ...el, [k]: true })); setAviso(''); }
    if ((comercial?.[k] || ELECCIONES.find((e) => e.id === k)?.def) === v) return;
    const habiaConcepto = !!comercial?.concepto;
    setComercial((c) => {
      const estados = { ...c.estados };
      if (habiaConcepto) for (const p of ['concepto', 'guion', 'cast', 'storyboard', 'pack'] as const) if (p in estados) estados[p] = 'pendiente';
      return { ...c, [k]: v, ...(habiaConcepto ? { concepto: undefined, estados } : {}) };
    });
    setOpciones([]);
    setPreviewCptId(null);
    if (habiaConcepto) setAviso('Cambiaste cómo se cuenta la pieza: el concepto elegido y lo que seguía (guion, cast, storyboard, pack) se hicieron con la elección anterior. Pedí propuestas nuevas y regeneralos.');
  };
  const conHumor = (comercial?.enfoque || 'caso') === 'humor' || (comercial?.tratamiento || 'natural') === 'humor';
  const opcionesConcept = getFunction('concept')?.options || [];
  const elegidaDe = (k: 'enfoque' | 'tratamiento') => {
    const v = comercial?.[k] || ELECCIONES.find((e) => e.id === k)?.def;
    return opcionesConcept.find((o) => o.id === k)?.choices?.find((ch) => ch.value === v);
  };
  // los botones de arriba ("Plan Claude/Gemini") tampoco disparan sin las dos líneas elegidas
  const pedirIdeas = (provider?: 'claude' | 'gemini') => {
    if (!lasDos) { setAviso('Elegí primero las dos líneas: cómo se cuenta la historia y cómo se siente.'); return; }
    generar(provider);
  };

  const previewCpt = opciones.find(c => c.id === previewCptId);

  return (
    <PasoShell
      titulo="Concepto"
      sub="Elegí qué historia querés contar y con qué clima. La IA propone tres ideas diferentes dentro del objetivo comercial de la pieza."
      hasContent={opciones.length > 0}
      busy={busy} onGenerate={pedirIdeas} error={error}
      onApprove={goNext} canApprove={!!elegido} approveLabel="Concepto listo, al guion"
      functionId="concept" estado={estadoDelPaso('concepto', comercial)}
      chatgpt={comercial ? <BotonChatGPT armar={() => pedidoPaso(project, comercial, 'concepto')} nombre={`${comercial.titulo}-concepto`} /> : undefined}
    >
      {/* WO-K3: el material REAL del media kit a la vista desde el primer paso (sin kit no se monta). */}
      <KitTira pantallas={project.pantallasKit} />

      <div className="paso-tipo">
        <span className="paso-tipo-lbl">Tipo de comercial</span>
        {formato ? (
          <span className="paso-tipo-fijo">
            {tipo === 'animado' ? <Monitor size={14} /> : <Users size={14} />}
            {tipo === 'animado' ? 'Animado' : 'Filmado'}
            <span className="paso-tipo-src">por el formato {formato.nombre}</span>
          </span>
        ) : (
          <div className="paso-chips">
            <button className={tipo === 'filmado' ? 'paso-chip paso-chip--on' : 'paso-chip'} onClick={() => setTipo('filmado')}>
              <Users size={14} /> Filmado
            </button>
            <button className={tipo === 'animado' ? 'paso-chip paso-chip--on' : 'paso-chip'} onClick={() => setTipo('animado')}>
              <Monitor size={14} /> Animado
            </button>
          </div>
        )}
      </div>

      <p className="paso-sub" style={{ margin: '10px 0 8px' }}>Elegí las dos líneas: cómo se cuenta la historia y cómo se siente. Con las dos elegidas ves el resumen del comercial y recién ahí se piden las ideas.</p>
      {ELECCIONES.filter((e) => !e.soloHumor || conHumor).map((e) => {
        const opt = opcionesConcept.find((o) => o.id === e.id);
        const actual = comercial?.[e.id] || e.def;
        // las dos líneas principales van como tarjetas con su explicación; nada se ve marcado hasta que el dueño elige
        if (e.id === 'enfoque' || e.id === 'tratamiento') {
          const tocada = elegidas[e.id];
          return (
            <div className="concepto-linea" key={e.id}>
              <span className="paso-tipo-lbl">{e.label}</span>
              <div className="concepto-opcs">
                {(opt?.choices || []).map((ch) => (
                  <button key={ch.value} type="button" disabled={busy} onClick={() => elegirOpcion(e.id, ch.value)}
                    className={tocada && actual === ch.value ? 'concepto-opc concepto-opc--on' : 'concepto-opc'}>
                    <b>{ch.label}</b>
                    {ch.ayuda && <span>{ch.ayuda}</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="paso-tipo" key={e.id}>
            <span className="paso-tipo-lbl">{e.label}</span>
            <div className="paso-chips">
              {(opt?.choices || []).map((ch) => (
                <button key={ch.value} className={actual === ch.value ? 'paso-chip paso-chip--on' : 'paso-chip'} disabled={busy} onClick={() => elegirOpcion(e.id, ch.value)}>{ch.label}</button>
              ))}
            </div>
          </div>
        );
      })}

      {aviso && <div className="paso-empty" style={{ marginBottom: 8 }}>{aviso}</div>}

      {/* Con las dos líneas elegidas: cómo va a ser el comercial, armado con lo que ya se sabe de la pieza (sin llamar a la
          IA), y el botón que pide las ideas. */}
      {lasDos && opciones.length === 0 && (() => {
        const enf = elegidaDe('enfoque');
        const trat = elegidaDe('tratamiento');
        const conApp = (t = '') => t.replace(/la app/g, project.name || 'la app');
        const queda = comercial?.primaryMessage || comercial?.angulo || '';
        return (
          <section className="concepto-resumen" ref={resumenRef}>
            <span className="paso-tipo-lbl">Así va a ser el comercial</span>
            <p>{tipo === 'animado' ? 'Animado' : 'Filmado'}, de unos 20 segundos{comercial?.titulo ? `, sobre «${comercial.titulo}»` : ''}.</p>
            {enf && <p><b>Cómo se cuenta:</b> {enf.label.toLowerCase()}. {conApp(enf.ayuda)}</p>}
            {trat && <p><b>Cómo se siente:</b> {trat.label.toLowerCase()}. {trat.ayuda}</p>}
            {queda && <p><b>Lo que tiene que quedar:</b> {queda}</p>}
            <p className="concepto-resumen-pie">La IA propone tres ideas distintas dentro de esto; elegís una y sigue al guion.</p>
            <button type="button" className="paso-gen concepto-disparar" onClick={() => generar()}
              disabled={busy || !comercial || !pasoHabilitado(comercial, 'concepto')}>
              <Wand2 size={15} /> {busy ? 'Pidiendo las ideas…' : 'Pedir las tres ideas'}
            </button>
          </section>
        );
      })()}

      {opciones.length > 0 ? (
        !previewCpt ? (
          /* VISTA 1: GATEWAY HUB DE IDEAS */
          <div className="concept-hub">
            {opciones.map((cpt, i) => {
              const isSelected = elegido?.id === cpt.id;
              const imgUrl = `https://image.pollinations.ai/prompt/cinematic%20shot,%20commercial%20advertising,%20${encodeURIComponent(cpt.topico || cpt.estetica)}?width=400&height=600&nologo=true`;
              return (
                <article key={cpt.id} className={`concept-poster ${isSelected ? 'poster--on' : ''}`} onClick={() => setPreviewCptId(cpt.id)}>
                  <img src={imgUrl} alt="Thumbnail" className="poster-bg" />
                  <div className="poster-overlay"></div>
                  <div className="poster-content">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="poster-number">Opción {i + 1}</span>
                      {cpt.tipoGancho && <span className="paso-concept-badge" style={{ background: '#7C3AED', color: '#FFF' }}>{cpt.tipoGancho}</span>}
                      {isSelected && <span className="paso-concept-badge"><Check size={12} /> Elegido</span>}
                    </div>
                    <h3 className="poster-title">{cpt.topico || cpt.idea.substring(0, 40)}</h3>
                    <p className="poster-desc">{cpt.idea}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* VISTA 2: DETALLE CINEMÁTICO ESTRUCTURADO */
          <div className="concept-detail-view">
            <div className="concept-detail-nav">
              <button className="back-to-hub-btn" onClick={() => setPreviewCptId(null)}>
                <ArrowLeft size={16} /> Volver al Hub de Ideas
              </button>
            </div>
            
            <article className={`paso-concept-cinematic${elegido?.id === previewCpt.id ? ' on' : ''}`}>
              <img src={`https://image.pollinations.ai/prompt/cinematic%20shot,%20commercial%20advertising,%20${encodeURIComponent(previewCpt.topico || previewCpt.estetica)}?width=800&height=450&nologo=true`} alt="Moodboard" className="cinematic-bg" />
              <div className="cinematic-overlay"></div>
              <div className="cinematic-content">
                <div className="cinematic-top" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {previewCpt.tipoGancho && <span className="paso-concept-badge" style={{ background: '#7C3AED', color: '#FFF', fontSize: '0.8rem', padding: '4px 10px' }}>{previewCpt.tipoGancho}</span>}
                  {elegido?.id === previewCpt.id && <span className="paso-concept-badge"><Check size={12} /> Elegido</span>}
                </div>
                
                {editando?.id === previewCpt.id ? (
                  <div className="concept-edit">
                    <label className="concept-edit-k" htmlFor="cpt-topico">Título</label>
                    <input id="cpt-topico" className="concept-edit-in" value={editando.topico || ''} onChange={(e) => setEditando({ ...editando, topico: e.target.value })} />
                    <label className="concept-edit-k" htmlFor="cpt-idea">La idea</label>
                    <textarea id="cpt-idea" className="concept-edit-in" rows={5} value={editando.idea} onChange={(e) => setEditando({ ...editando, idea: e.target.value })} />
                    <label className="concept-edit-k" htmlFor="cpt-tono">Tono actoral</label>
                    <input id="cpt-tono" className="concept-edit-in" value={editando.tono} onChange={(e) => setEditando({ ...editando, tono: e.target.value })} />
                    <label className="concept-edit-k" htmlFor="cpt-estetica">Dirección visual</label>
                    <textarea id="cpt-estetica" className="concept-edit-in" rows={2} value={editando.estetica} onChange={(e) => setEditando({ ...editando, estetica: e.target.value })} />
                  </div>
                ) : (
                  <>
                    {previewCpt.topico && (
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#A78BFA', marginTop: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                        "{previewCpt.topico}"
                      </h2>
                    )}
                    <h3 className="cinematic-idea" style={{ marginTop: '8px', fontSize: '1.05rem', lineHeight: 1.5, color: '#F1F5F9' }}>
                      "{previewCpt.idea}"
                    </h3>
                    {previewCpt.editadoAMano && <span className="paso-concept-badge" style={{ marginTop: 8, display: 'inline-flex' }}><Pencil size={11} /> Retocado a mano</span>}

                    <div className="paso-concept-meta cinematic-meta" style={{ marginTop: '16px' }}>
                      <div className="paso-concept-row"><span className="paso-concept-k">Tono Actoral</span><span className="paso-concept-v">{previewCpt.tono}</span></div>
                      <div className="paso-concept-row"><span className="paso-concept-k">Dirección Visual</span><span className="paso-concept-v">{previewCpt.estetica}</span></div>
                      <div className="paso-concept-row"><span className="paso-concept-k">Referencia Anuncio</span><span className="paso-concept-v">{previewCpt.referencia}</span></div>
                    </div>
                  </>
                )}
                <div className="cinematic-footer">
                  {previewCpt.porQueFunciona && <p className="paso-concept-why">💡 <strong>Por qué convierte:</strong> {previewCpt.porQueFunciona}</p>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {editando?.id === previewCpt.id ? (
                      <>
                        <button className="paso-pick paso-pick--on" onClick={guardarEdicion}><Check size={13} /> Guardar el cambio</button>
                        <button className="paso-pick" onClick={() => setEditando(null)}><X size={13} /> Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="paso-pick" onClick={() => setEditando(previewCpt)} title="Cambiar el texto a mano, sin volver a generar"><Pencil size={13} /> Editar</button>
                        <button className={elegido?.id === previewCpt.id ? 'paso-pick paso-pick--on' : 'paso-pick'} onClick={() => elegir(previewCpt)}>
                          {elegido?.id === previewCpt.id ? <><Check size={13} /> Elegido</> : 'Elegir este concepto'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </div>
        )
      ) : (
        // el botón para pedir las ideas vive en el resumen; acá sólo se indica qué falta elegir
        !busy && !lasDos && (
          <div className="paso-empty paso-empty--full">
            <Lightbulb size={34} strokeWidth={1.5} className="paso-empty-ico" />
            <span>Elegí arriba cómo se cuenta la historia y cómo se siente. Con las dos aparece el resumen del comercial {tipo === 'animado' ? 'animado' : 'filmado'} y el botón para pedir las tres ideas.</span>
          </div>
        )
      )}
    </PasoShell>
  );
}
