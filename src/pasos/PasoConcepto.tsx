import { useState, useEffect, useRef } from 'react';
import { Check, Users, Monitor, Lightbulb, ArrowLeft, Wand2, Pencil, X } from 'lucide-react';
import { PasoShell, runMolde, errMsg, type PasoProps } from './pasoKit';
import { KitTira } from '../components/KitCapturas';
import { mediaKitParaMolde } from '../lib/mediaKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { getFormato } from '../lib/formato';
import { pasoHabilitado, type Comercial, type Concepto, type TipoComercial } from '../lib/comercial';
import { getFunction } from '../lib/functionCatalog';
import { ENFOQUES_EXPLICADOS, TRATAMIENTOS_EXPLICADOS } from '../lib/guiaCampana';

// concept/3.0 (curación 2026-10-10): lo que el dueño elige antes de pedir propuestas. Intensidad y mecanismo sólo con humor.
type Eleccion = 'enfoque' | 'tratamiento' | 'intensidadHumor' | 'recursoHumorId';
const ELECCIONES: { id: Eleccion; label: string; def: string; soloHumor?: boolean }[] = [
  { id: 'enfoque', label: 'Cómo contamos la historia', def: 'caso' },
  { id: 'tratamiento', label: 'Qué sensación queremos transmitir', def: 'natural' },
  { id: 'intensidadHumor', label: 'Intensidad del humor', def: 'sutil', soloHumor: true },
  { id: 'recursoHumorId', label: 'Mecanismo de humor', def: 'auto', soloHumor: true },
];

// Al cambiar la dirección hay que cortar la dependencia: dejar artefactos viejos marcados
// "pendientes" pero todavía presentes permite que el paso siguiente use una historia anterior.
function invalidarDesdeConcepto(c: Comercial): Comercial {
  const estados = { ...c.estados };
  for (const id of ['concepto','guion','cast','storyboard','pack','render','rodaje','montaje','publicar'] as const) {
    estados[id] = 'pendiente';
  }
  return {
    ...c, concepto: undefined, guion: undefined, cast: undefined, storyboard: undefined,
    packFlow: undefined, renderRef: undefined, renderDurSec: undefined,
    mockups: undefined, rodaje: undefined, montaje: undefined, qa: undefined,
    estados,
  };
}

function confirmarCambioDeHistoria(c?: Comercial): boolean {
  const tieneTrabajo = !!(c?.guion || c?.cast || c?.storyboard?.length || c?.packFlow ||
    c?.mockups?.length || c?.rodaje?.length || c?.montaje || c?.renderRef);
  return !tieneTrabajo || window.confirm(
    'Cambiar de concepto o enfoque descarta el guion, storyboard, clips vinculados y montaje de ESTA pieza. ' +
    'Los archivos originales del proyecto no se borran. ¿Continuar?'
  );
}

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

  // AUTO-DISPARO sólo cuando la técnica YA está decidida (dueño, 2026-10-07): el molde concept
  // cambia el prompt y las propuestas según Filmado/Animado (bloque de técnica + pantallas). Si la
  // pieza nació con formato, la técnica viene fija de ahí y el selector ni se muestra: generar al
  // entrar es correcto. Si no hay formato (pieza vieja), la técnica se elige acá y hay que esperar.
  const hasAutoFired = useRef(false);
  useEffect(() => {
    const tecnicaFija = !!formato;
    const hayInsumo = !!(project.brief || comercial?.angulo || comercial?.creativeBrief);
    const listo = !!comercial && pasoHabilitado(comercial, 'concepto') && hayInsumo && tecnicaFija;
    if (listo && opciones.length === 0 && !busy && !error && !hasAutoFired.current) {
      hasAutoFired.current = true;
      generar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generar = async (provider?: 'claude' | 'gemini') => {
    if (comercial?.concepto && !confirmarCambioDeHistoria(comercial)) return;
    setBusy(true); setError('');
    try {
      const mediaKit = mediaKitParaMolde(project.pantallasKit, project.momentos, project.cta);
      const eleccion = Object.fromEntries(ELECCIONES.map((e) => [e.id, comercial?.[e.id] || e.def])) as Record<Eleccion, string>;
      const piece = { angulo: comercial?.angulo || comercial?.titulo || '', creativeBrief: comercial?.creativeBrief || '', messageScope: comercial?.messageScope, primaryMessage: comercial?.primaryMessage, durationSec: 20, tipo, ...eleccion, cierreMarca: comercial?.cierreMarca || '', ...(mediaKit ? { mediaKit } : {}) };
      const res = await runMolde('concept', project, piece, { perfil: 'campaña', ...eleccion }, undefined, comercial, provider);
      setOpciones((res.conceptos as Concepto[]) || []);
      setComercial((c) => { const limpio = c.concepto ? invalidarDesdeConcepto(c) : c; return { ...limpio, estados: { ...limpio.estados, concepto: 'generado' } }; });
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  // Edición a mano (2026-10-10): cambiar una palabra de una propuesta sin volver a generar. Si es la elegida, la pieza
  // toma el texto nuevo; si ya había guion, se avisa que se armó con la versión anterior.
  const [editando, setEditando] = useState<Concepto | null>(null);
  const guardarEdicion = () => {
    if (!editando) return;
    if (elegido?.id === editando.id && !confirmarCambioDeHistoria(comercial)) return;
    const editado: Concepto = { ...editando, editadoAMano: true };
    setOpciones((os) => os.map((o) => (o.id === editado.id ? editado : o)));
    if (elegido?.id === editado.id) {
      setComercial((c) => {
        const limpio = invalidarDesdeConcepto(c);
        return { ...limpio, concepto: editado, estados: { ...limpio.estados, concepto: 'editado' } };
      });
      setAviso('Se actualizaron las dependencias de la pieza. Guion y montaje deberán generarse desde este nuevo concepto.');
    }
    setEditando(null);
  };
  const elegir = (cpt: Concepto) => {
    if (elegido?.id === cpt.id && elegido.idea === cpt.idea) return;
    if (!confirmarCambioDeHistoria(comercial)) return;
    setComercial((c) => {
      const limpio = invalidarDesdeConcepto(c);
      return { ...limpio, concepto: cpt, estados: { ...limpio.estados, concepto: 'editado' } };
    });
  };

  const setTipo = (t: TipoComercial) => {
    if (t === tipo || !confirmarCambioDeHistoria(comercial)) return;
    setComercial((c) => ({ ...invalidarDesdeConcepto(c), tipo: t }));
    setOpciones([]);
  };

  // Enfoque y tratamiento son decisiones del concepto. Si cambian, todos los derivados se invalidan.
  const [aviso, setAviso] = useState('');
  const elegirOpcion = (k: Eleccion, v: string) => {
    if ((comercial?.[k] || ELECCIONES.find((e) => e.id === k)?.def) === v) return;
    if (!confirmarCambioDeHistoria(comercial)) return;
    setComercial((c) => ({ ...invalidarDesdeConcepto(c), [k]: v }));
    setOpciones([]);
    setPreviewCptId(null);
    setAviso('Cambiaste la dirección de la historia: pedí conceptos nuevos antes de continuar.');
  };
  const conHumor = (comercial?.enfoque || 'caso') === 'humor' || (comercial?.tratamiento || 'natural') === 'humor';
  const opcionesConcept = getFunction('concept')?.options || [];

  const previewCpt = opciones.find(c => c.id === previewCptId);

  return (
    <PasoShell
      titulo="Concepto"
      sub="El objetivo ya se decidió en la campaña. Ahora elegí cómo contar ESTA historia y con qué tono; después recibís tres conceptos diferentes."
      hasContent={opciones.length > 0}
      busy={busy} onGenerate={generar} error={error}
      onApprove={goNext} canApprove={!!elegido} approveLabel="Concepto listo, al guion"
      functionId="concept" estado={estadoDelPaso('concepto', comercial)}
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

      {ELECCIONES.filter((e) => !e.soloHumor || conHumor).map((e) => {
        const opt = opcionesConcept.find((o) => o.id === e.id);
        const actual = comercial?.[e.id] || e.def;
        return (
          <div className="paso-tipo" key={e.id}>
            <span className="paso-tipo-lbl">{e.label}</span>
            <div className="paso-chips">
              {(opt?.choices || []).map((ch) => (
                <button key={ch.value} className={actual === ch.value ? 'paso-chip paso-chip--on' : 'paso-chip'} disabled={busy} onClick={() => elegirOpcion(e.id, ch.value)}>{ch.label}</button>
              ))}
            </div>
            {(e.id === 'enfoque' || e.id === 'tratamiento') && (
              <p className="paso-sub" style={{ marginTop: 5 }}>
                {e.id === 'enfoque' ? ENFOQUES_EXPLICADOS[actual] : TRATAMIENTOS_EXPLICADOS[actual]}
              </p>
            )}
          </div>
        );
      })}

      {aviso && <div className="paso-empty" style={{ marginBottom: 8 }}>{aviso}</div>}

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
        !busy && (
          <div className="paso-empty paso-empty--full">
            <Lightbulb size={34} strokeWidth={1.5} className="paso-empty-ico" />
            <span>Elegí la técnica arriba y pedí las propuestas: tres ideas distintas pensadas para un comercial {tipo === 'animado' ? 'animado sobre las pantallas reales' : 'filmado con personas'}.</span>
            <button className="paso-gen paso-empty-cta" onClick={() => generar()}>
              <Wand2 size={15} /> Generar 3 propuestas · {tipo === 'animado' ? 'Animado' : 'Filmado'}
            </button>
          </div>
        )
      )}
    </PasoShell>
  );
}
