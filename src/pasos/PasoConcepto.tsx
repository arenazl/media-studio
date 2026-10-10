import { useState, useEffect, useRef } from 'react';
import { Check, Users, Monitor, Lightbulb, ArrowLeft, Wand2 } from 'lucide-react';
import { PasoShell, runMolde, errMsg, type PasoProps } from './pasoKit';
import { KitTira } from '../components/KitCapturas';
import { mediaKitParaMolde } from '../lib/mediaKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { getFormato } from '../lib/formato';
import { pasoHabilitado, type Comercial, type Concepto, type TipoComercial } from '../lib/comercial';
import creativeDirections from '../data/creativeDirections.json';

// Al elegir otro rumbo, no deben sobrevivir un guion ni renders creados con la idea anterior.
function reiniciarDesdeConcepto(c: Comercial): Comercial {
  return {
    ...c,
    concepto: undefined, guion: undefined, cast: undefined, storyboard: undefined,
    packFlow: undefined, renderRef: undefined, renderDurSec: undefined,
    rodaje: undefined, montaje: undefined, qa: undefined, publicacion: undefined,
    estados: {
      ...c.estados,
      concepto: 'pendiente', guion: 'pendiente', cast: 'pendiente', storyboard: 'pendiente',
      pack: 'pendiente', render: 'pendiente', rodaje: 'pendiente',
      montaje: 'pendiente', publicar: 'pendiente',
    },
  };
}

export default function PasoConcepto({ project, reelId, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // las 2-3 opciones son transitorias (la ELEGIDA persiste en comercial.concepto).
  const [opciones, setOpciones] = useState<Concepto[]>(comercial?.concepto ? [comercial.concepto] : []);
  const tipo: TipoComercial = comercial?.tipo ?? 'filmado';
  const enfoque = comercial?.enfoque || 'caso';
  const tratamiento = enfoque === 'humor' ? 'humor' : comercial?.tratamiento || 'sobrio';
  const durationSec = project.reels.find((x) => x.id === reelId)?.durationSec
    ?? getFormato(comercial?.formatoId)?.duracion.default ?? 20;
  // La técnica la fija el FORMATO elegido en el wizard (WO-1/D2: tecnicaProduccion → tipo). Si la
  // pieza nació con formato, acá NO se re-elige (volvería a desincronizar formato↔pipeline): se
  // muestra informativa. Sin formatoId (piezas viejas) el selector sigue siendo la única fuente.
  const formato = getFormato(comercial?.formatoId);
  const elegido = comercial?.concepto;
  
  // Si hay un concepto elegido al cargar, abrimos el detalle de ese; sino null (Gateway)
  const [previewCptId, setPreviewCptId] = useState<string | null>(elegido?.id || null);

  // Si cambian las opciones (ej. al regenerar), volver al Gateway
  useEffect(() => { setPreviewCptId(null); }, [opciones]);

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

  const confirmarReinicio = () => {
    const hayProduccion = !!(comercial?.guion || comercial?.cast || comercial?.storyboard ||
      comercial?.packFlow || comercial?.renderRef || comercial?.rodaje?.length || comercial?.montaje);
    return !hayProduccion || window.confirm('Cambiar el concepto descarta el guion y las etapas posteriores de esta pieza. ¿Continuar?');
  };

  const cambiarDireccion = (campo: 'enfoque' | 'tratamiento', valor: string) => {
    if (busy || (campo === 'enfoque' ? enfoque : tratamiento) === valor) return;
    if (!confirmarReinicio()) return;
    setComercial((c) => ({
      ...reiniciarDesdeConcepto(c),
      enfoque: campo === 'enfoque' ? valor : enfoque,
      tratamiento: campo === 'enfoque' && valor === 'humor' ? 'humor' : campo === 'tratamiento' ? valor : tratamiento,
    }));
    setOpciones([]);
    setError('');
  };

  const generar = async (provider?: 'claude' | 'gemini') => {
    if (!confirmarReinicio()) return;
    setBusy(true); setError('');
    try {
      const mediaKit = mediaKitParaMolde(project.pantallasKit, project.momentos, project.cta);
      const piece = { angulo: comercial?.angulo || comercial?.titulo || '', creativeBrief: comercial?.creativeBrief || '', messageScope: comercial?.messageScope, primaryMessage: comercial?.primaryMessage, enfoque, tratamiento, durationSec, tipo, ...(mediaKit ? { mediaKit } : {}) };
      const res = await runMolde('concept', project, piece, { perfil: 'campaña', enfoque, tratamiento }, undefined, comercial, provider);
      setOpciones((res.conceptos as Concepto[]) || []);
      setComercial((c) => { const limpio = reiniciarDesdeConcepto(c); return { ...limpio, estados: { ...limpio.estados, concepto: 'generado' } }; });
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const elegir = (cpt: Concepto) => {
    if (elegido?.id === cpt.id && elegido.idea === cpt.idea) return;
    if (!confirmarReinicio()) return;
    setComercial((c) => {
      const limpio = reiniciarDesdeConcepto(c);
      return { ...limpio, enfoque, tratamiento, concepto: cpt, estados: { ...limpio.estados, concepto: 'editado' } };
    });
  };

  const setTipo = (t: TipoComercial) => {
    if (t === tipo || !confirmarReinicio()) return;
    setComercial((c) => ({ ...reiniciarDesdeConcepto(c), tipo: t }));
    setOpciones([]);
  };

  const previewCpt = opciones.find(c => c.id === previewCptId);

  return (
    <PasoShell
      titulo="Concepto"
      sub="Elegí cómo contar el spot y su tratamiento. La IA propone tres historias distintas para la marca."
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

      {/* El enfoque decide QUÉ historia; el tratamiento, CÓMO se cuenta. */}
      <div className="paso-tipo">
        <span className="paso-tipo-lbl">Enfoque narrativo</span>
        <div className="paso-chips" style={{ flexWrap: 'wrap' }}>
          {creativeDirections.enfoques.map((x) => (
            <button key={x.id} type="button" disabled={busy}
              className={enfoque === x.id ? 'paso-chip paso-chip--on' : 'paso-chip'}
              onClick={() => cambiarDireccion('enfoque', x.id)}>{x.label}</button>
          ))}
        </div>
        <p className="paso-sub" style={{ marginTop: 8 }}>
          {creativeDirections.enfoques.find((x) => x.id === enfoque)?.ficha.ideaCentral}
        </p>
      </div>
      <div className="paso-tipo">
        <span className="paso-tipo-lbl">Tratamiento publicitario</span>
        <div className="paso-chips" style={{ flexWrap: 'wrap' }}>
          {creativeDirections.tratamientos.map((x) => (
            <button key={x.id} type="button" disabled={busy || (enfoque === 'humor' && x.id !== 'humor')}
              className={tratamiento === x.id ? 'paso-chip paso-chip--on' : 'paso-chip'}
              onClick={() => cambiarDireccion('tratamiento', x.id)}>{x.label}</button>
          ))}
        </div>
        <p className="paso-sub" style={{ marginTop: 8 }}>
          {creativeDirections.tratamientos.find((x) => x.id === tratamiento)?.descripcion}
        </p>
      </div>

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
                
                {previewCpt.topico && (
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#A78BFA', marginTop: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                    "{previewCpt.topico}"
                  </h2>
                )}
                <h3 className="cinematic-idea" style={{ marginTop: '8px', fontSize: '1.05rem', lineHeight: 1.5, color: '#F1F5F9' }}>
                  "{previewCpt.idea}"
                </h3>

                <div className="paso-concept-meta cinematic-meta" style={{ marginTop: '16px' }}>
                  <div className="paso-concept-row"><span className="paso-concept-k">Tono Actoral</span><span className="paso-concept-v">{previewCpt.tono}</span></div>
                  <div className="paso-concept-row"><span className="paso-concept-k">Dirección Visual</span><span className="paso-concept-v">{previewCpt.estetica}</span></div>
                  <div className="paso-concept-row"><span className="paso-concept-k">Referencia Anuncio</span><span className="paso-concept-v">{previewCpt.referencia}</span></div>
                </div>
                <div className="cinematic-footer">
                  {previewCpt.porQueFunciona && <p className="paso-concept-why">💡 <strong>Por qué convierte:</strong> {previewCpt.porQueFunciona}</p>}
                  <button className={elegido?.id === previewCpt.id ? 'paso-pick paso-pick--on' : 'paso-pick'} onClick={() => elegir(previewCpt)}>
                    {elegido?.id === previewCpt.id ? <><Check size={13} /> Elegido</> : 'Elegir este concepto'}
                  </button>
                </div>
              </div>
            </article>
          </div>
        )
      ) : (
        !busy && (
          <div className="paso-empty paso-empty--full">
            <Lightbulb size={34} strokeWidth={1.5} className="paso-empty-ico" />
            <span>Elegí el enfoque, el tratamiento y la técnica. Vas a recibir tres spots de marca diferentes, para un comercial {tipo === 'animado' ? 'animado sobre las pantallas reales' : 'filmado con personas'}.</span>
            <button className="paso-gen paso-empty-cta" onClick={() => generar()}>
              <Wand2 size={15} /> Generar 3 propuestas · {tipo === 'animado' ? 'Animado' : 'Filmado'}
            </button>
          </div>
        )
      )}
    </PasoShell>
  );
}
