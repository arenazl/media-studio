// Paso 6b — RENDER animado (solo tipo 'animado'). El storyboard (una escena por pantalla) se vuelve un plan de
// MOCKUPS (src/lib/mockups.ts) que el Player muestra EXACTO antes de renderizar; "Renderizar el reel" lo manda al
// motor Remotion del servidor (/api/render-mockups) y el mp4 queda en comercial.renderRef → habilita el MONTAJE
// (voz + música sobre el render, igual que filmado).
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Loader2, Clapperboard, Film, ArrowRight, Play, MessageSquareText } from 'lucide-react';
import { API_BASE } from '../config';
import { errMsg, runMolde, PasoEmpty, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { armarMockups } from '../lib/mockups';
import { getFormato } from '../lib/formato';
import { mediaKitParaMolde } from '../lib/mediaKit';
import type { Escena } from '../lib/comercial';

const PlayerMockups = lazy(() => import('../remotion/PlayerMockups'));

// mide cada imagen una sola vez (alto/ancho): captura más alta que ancha → marco de teléfono; logo casi
// cuadrado → es un isotipo y el nombre se escribe al lado. Lo que no carga queda sin medida.
function useProporciones(srcs: string[]): Record<string, number> {
  const [props, setProps] = useState<Record<string, number>>({});
  const clave = srcs.join('|');
  useEffect(() => {
    let vivo = true;
    const faltan = srcs.filter((s) => s && !(s in props));
    if (!faltan.length) return;
    void Promise.all(faltan.map((src) => new Promise<[string, number]>((res) => {
      const img = new Image();
      img.onload = () => res([src, img.naturalWidth ? img.naturalHeight / img.naturalWidth : 0]);
      img.onerror = () => res([src, 0]);
      img.src = src.startsWith('/') ? `${API_BASE}${src}` : src;
    }))).then((pares) => { if (vivo) setProps((a) => ({ ...a, ...Object.fromEntries(pares) })); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return props;
}

export default function PasoRender({ project, reelId, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [describiendo, setDescribiendo] = useState(false);
  const [descripcion, setDescripcion] = useState(comercial?.descripcionReel || '');
  const renderRef = comercial?.renderRef;

  // El dueño describe el reel con sus palabras (dictado o escrito) → molde mockupsTexto → escenas sobre el kit.
  const armarDesdeDescripcion = async () => {
    if (!comercial || !descripcion.trim()) return;
    setDescribiendo(true); setError('');
    try {
      const reel = project.reels.find((r) => r.id === reelId);
      const mediaKit = mediaKitParaMolde(project.pantallasKit, project.momentos, project.cta);
      const res = await runMolde('mockupsTexto', project, {
        tipo: 'animado', durationSec: reel?.durationSec, ...(mediaKit ? { mediaKit } : {}),
      }, { descripcion: descripcion.trim() }, undefined, comercial);
      const escenasNuevas = (res as { escenas?: Escena[] }).escenas;
      if (!escenasNuevas?.length) throw new Error('la descripción no alcanzó para armar escenas');
      setComercial((c) => ({
        ...c,
        storyboard: escenasNuevas,
        descripcionReel: descripcion.trim(),
        estados: { ...c.estados, storyboard: c.estados.storyboard === 'aprobado' ? 'aprobado' : 'generado' },
      }));
    } catch (e) { setError(errMsg(e)); } finally { setDescribiendo(false); }
  };
  const escenas = useMemo(() => comercial?.storyboard || [], [comercial?.storyboard]);
  const pantallas = useMemo(() => project.pantallasKit || [], [project.pantallasKit]);
  const logoUrl = project.marcaKit?.logoUrl || project.brandKit?.logoUrl;
  const medidas = useProporciones(useMemo(() => [...pantallas.map((p) => p.url || p.archivo), ...(logoUrl ? [logoUrl] : [])], [pantallas, logoUrl]));

  const plan = useMemo(() => {
    if (!comercial || !escenas.length) return null;
    const f = getFormato(comercial.formatoId || project.formatoId);
    const dims = f ? { width: f.dims.width, height: f.dims.height, fps: f.fps } : undefined;   // sin formato: 9:16 por defecto
    const colores = project.marcaKit?.colores;
    const propLogo = logoUrl ? medidas[logoUrl] || 0 : 0;
    return armarMockups(comercial, {
      pantallas,
      marca: {
        nombre: project.marcaKit?.nombreExacto || project.brandKit?.name || project.name,
        logoUrl,
        url: project.cta?.url,
        colores: { primario: colores?.primario || project.brandKit?.color, acento: colores?.acento },
      },
      cta: project.cta,
      dims,
      medidas,
      logoCuadrado: propLogo > 0.75,
    });
  }, [comercial, escenas, pantallas, medidas, logoUrl, project]);

  const render = async () => {
    if (!plan) return;
    setBusy(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/render-mockups`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, projectId: project.id, reelId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo renderizar el reel animado');
      setComercial((c) => ({ ...c, renderRef: d.fileRef, renderDurSec: d.durationSec, estados: { ...c.estados, render: c.estados.render === 'aprobado' ? 'aprobado' : 'generado' } }));
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const conCaptura = plan ? plan.escenas.filter((e) => e.tipo === 'pantalla').length : 0;

  return (
    <div className="paso">
      <div className="paso-head">
        <div className="paso-head-txt">
          <h2 className="paso-title">Render animado</h2>
          <p className="paso-sub">Cada escena del storyboard es una pantalla real del kit en su marco, o un título cuando no hay pantalla. La vista previa es exacta: lo que ves es lo que se renderiza.</p>
        </div>
        <div className="paso-head-actions">
          <button className={renderRef && !busy ? 'paso-regen' : 'paso-gen'} onClick={render} disabled={busy || !plan}>
            {busy ? <Loader2 size={15} className="paso-spin" /> : <Clapperboard size={15} />}
            {busy ? 'Renderizando…' : renderRef ? 'Regenerar el reel' : 'Renderizar el reel'}
          </button>
        </div>
      </div>
      {error && <div className="paso-error">{error}</div>}
      <div className="paso-body">
        {/* Atajo: describir el reel con las palabras del dueño y armar las escenas sobre las pantallas del kit */}
        <div className="paso-card mont-describir">
          <div className="paso-card-h"><MessageSquareText size={12} /> Describí el reel con tus palabras</div>
          <textarea
            className="paso-inline mont-describir-texto"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Qué querés mostrar y en qué orden. Nombrá las pantallas del kit y qué destacar de cada una. Ejemplo: arrancá con un título, mostrá el tablero con los reclamos abiertos, después la lista de reclamos con su estado, y cerrá con pedí una demo."
            rows={4}
            disabled={describiendo}
          />
          <div className="mont-describir-acciones">
            <span className="pack-prog">{pantallas.length ? `${pantallas.length} pantallas en el kit` : 'sin pantallas en el kit: las escenas saldrán como títulos'}</span>
            <button className="rodaje-import" onClick={() => void armarDesdeDescripcion()} disabled={describiendo || busy || !descripcion.trim()}>
              {describiendo ? <Loader2 size={13} className="paso-spin" /> : <MessageSquareText size={13} />} {describiendo ? 'Armando las escenas…' : escenas.length ? 'Rearmar las escenas desde la descripción' : 'Armar las escenas'}
            </button>
          </div>
        </div>
        {!plan ? (
          <PasoEmpty icon={Film}>Describí el reel arriba, o generá el storyboard (animado), para poder renderizar.</PasoEmpty>
        ) : (
          <>
            <div className="pack-bar">
              <span className="pack-prog">{plan.escenas.length} escenas · {conCaptura} con pantalla real · ~{plan.escenas.reduce((s, e) => s + e.durSec, 0).toFixed(1)}s{plan.placa ? ' + placa' : ''}</span>
            </div>
            {!pantallas.length && (
              <div className="paso-empty">Este proyecto no tiene capturas en su kit: todas las escenas salen como título. Importá el media kit para ver las pantallas reales.</div>
            )}
            <div className="mont-preview">
              <div className="paso-card-h"><Play size={12} /> Vista previa exacta</div>
              <div className="mont-preview-frame">
                <Suspense fallback={<div className="paso-empty">Cargando la vista previa…</div>}>
                  <PlayerMockups plan={plan} />
                </Suspense>
              </div>
            </div>
            {renderRef && (
              <div className="paso-card mont-result">
                <div className="paso-card-h">Reel renderizado</div>
                <video className="rodaje-video mont-video" src={`${API_BASE}/api/storage/${renderRef}`} controls playsInline preload="metadata" />
              </div>
            )}
          </>
        )}
      </div>
      <div className="paso-foot paso-foot--split">
        <span className="paso-estado">{estadoDelPaso('render', comercial)}</span>
        {renderRef && (
          <button className="paso-approve" onClick={goNext}>
            Render listo, al montaje <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
