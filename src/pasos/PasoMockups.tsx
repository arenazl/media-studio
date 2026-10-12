// Paso 7 — MOCKUPS (2026-10-11; antes "Rodaje"). Los crudos de los mockups animados de la app: un botón hace todo
// (el agente escribe un mockup por pantalla del media kit mirando su captura y sus estados, con la barra de progreso, y
// en el mismo paso se convierten en video); cada mockup entra solo en la escena de pantalla que marcó el storyboard.
// Los crudos de Flow viven en Pack Flow (CrudosFlow). Lucas: "primero los crudos de los videos en un paso, los crudos
// de los mockups animados en otro, y después el montaje". El id interno del paso sigue siendo 'rodaje' (estados guardados).
import { useEffect, useRef, useState } from 'react';
import { Loader2, Check, ArrowRight, LayoutTemplate } from 'lucide-react';
import { errMsg, PasoEmpty } from './pasoKit';
import type { PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { API_BASE } from '../config';
import type { MockupApp, Comercial } from '../lib/comercial';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', giro: 'Giro', gag: 'Remate', cta: 'CTA' };
const reloj = (seg: number) => `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, '0')}`;

// El progreso REAL del agente (GET /api/mockups-app/progreso): cuántos van, cuál está mirando y en qué fase.
// Lucas, 2026-10-11: "que tenga un progreso, que te vaya diciendo qué captura está haciendo, así no te pegás un embole".
type Progreso = { fase: string; total?: number; hechas?: number; inicio?: number; tarjetas?: { id: string; nombre: string; estado: string; detalle: string }[] };
function useAhora() {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 500); return () => clearInterval(t); }, []);
  return ahora;
}
function ProgresoEscritura({ prog }: { prog: Progreso | null }) {
  const ahora = useAhora();
  const total = prog?.total || 0, hechas = prog?.hechas || 0;
  const probando = (prog?.fase || '').startsWith('probando');
  const pct = !total ? 3 : probando ? 96 : Math.max(3, Math.round((hechas / total) * 92));
  const seg = prog?.inicio ? Math.max(0, (ahora - prog.inicio) / 1000) : 0;
  const mirando = (prog?.tarjetas || []).filter((t) => t.estado === 'mirando');
  const etapa = !total ? 'Preparando las capturas del kit' : probando ? 'Probando que compilen y se dibujen' : mirando.length ? `Mirando: ${mirando.map((t) => t.nombre).join(' · ')}` : 'Escribiendo';
  return (
    <div className="paso-progreso" role="status" aria-live="polite" style={{ marginTop: 10 }}>
      <div className="paso-progreso-head">
        <span className="paso-progreso-escena">Escribiendo el mockup {Math.min(total, hechas + (probando ? 0 : 1)) || 0} / {total || '…'}</span>
        <span className="paso-progreso-reloj">{reloj(seg)}</span>
      </div>
      <div className="paso-progreso-tira">
        <div className="paso-progreso-fill" style={{ width: `${pct}%` }} />
        <div className="paso-progreso-cabezal" style={{ left: `${pct}%` }} />
      </div>
      <div className="paso-progreso-etapa">{etapa}<span className="paso-progreso-puntos" /></div>
      {(prog?.tarjetas || []).length > 0 && (
        <div className="paso-progreso-sub" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
          {(prog?.tarjetas || []).map((t) => (
            <span key={t.id} style={{ opacity: t.estado === 'en cola' ? 0.5 : 1, color: t.estado === 'falló' ? 'var(--rd-danger, #c0392b)' : undefined }}>
              {t.estado === 'lista' ? <Check size={11} style={{ verticalAlign: -1 }} /> : t.estado === 'mirando' ? <Loader2 size={11} className="paso-spin" style={{ verticalAlign: -1 }} /> : null} {t.nombre}{t.estado === 'falló' ? ' (falló)' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
// pasarlos a video lleva unos 10 s por mockup: la barra se estima con eso (el render no informa avance)
function ProgresoVideo({ inicio, cantidad }: { inicio: number; cantidad: number }) {
  const ahora = useAhora();
  const seg = Math.max(0, (ahora - inicio) / 1000);
  const estimado = Math.max(1, cantidad) * 11;
  const pct = Math.min(95, Math.max(3, Math.round((seg / estimado) * 95)));
  const vamos = Math.min(Math.max(1, cantidad), Math.floor(seg / 11) + 1);
  return (
    <div className="paso-progreso" role="status" aria-live="polite" style={{ marginTop: 10 }}>
      <div className="paso-progreso-head">
        <span className="paso-progreso-escena">Pasando a video {cantidad ? `${vamos} / ${cantidad}` : ''}</span>
        <span className="paso-progreso-reloj">{reloj(seg)}</span>
      </div>
      <div className="paso-progreso-tira">
        <div className="paso-progreso-fill" style={{ width: `${pct}%` }} />
        <div className="paso-progreso-cabezal" style={{ left: `${pct}%` }} />
      </div>
      <div className="paso-progreso-etapa">Convirtiendo cada mockup en un clip y poniéndolo en su escena<span className="paso-progreso-puntos" /></div>
      <div className="paso-progreso-sub">Unos 10 segundos por mockup.</div>
    </div>
  );
}

// cada mockup entra solo en su escena de pantalla (la que el storyboard marcó con esa pantalla), si todavía no tiene toma
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function enganchar(c: Comercial, mks: MockupApp[]): Comercial {
  const nuevas = (c.storyboard || []).filter((e) => e.pantalla && !(c.rodaje || []).some((t) => t.escenaN === e.n)).flatMap((e) => {
    const m = mks.find((x) => norm(x.nombre) === norm(e.pantalla || '')) || mks.find((x) => norm(e.pantalla || '').startsWith(norm(x.nombre)) || norm(x.nombre).startsWith(norm(e.pantalla || '')));
    return m ? [{ id: `toma-${e.n}-mk-${Date.now().toString(36)}`, escenaN: e.n, fileRef: m.fileRef, durSec: m.durSec, origen: 'mockup' as const, promptUsado: `mockup de la app: ${m.nombre}` }] : [];
  });
  return { ...c, mockups: mks, ...(nuevas.length ? { rodaje: [...(c.rodaje || []), ...nuevas], estados: { ...c.estados, rodaje: c.estados.rodaje === 'aprobado' ? 'aprobado' : 'generado' } } : {}) };
}

export default function PasoMockups({ project, reelId, comercial, setComercial, goNext }: PasoProps) {
  const escenas = comercial?.storyboard || [];
  const tomas = comercial?.rodaje || [];
  const mockups: MockupApp[] = comercial?.mockups || [];
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [fase, setFase] = useState<'' | 'escribiendo' | 'video'>('');
  const [prog, setProg] = useState<Progreso | null>(null);
  const [inicioVideo, setInicioVideo] = useState(0);
  const [cantidad, setCantidad] = useState(0);
  const [escritos, setEscritos] = useState(0);   // mockups que la app ya tiene escritos en el motor
  // el kit puede venir en kb.media_kit_id (proyectos viejos) o en mediaKitId (los que se crean desde el kit)
  const kitId = (project.kb as { media_kit_id?: string } | undefined)?.media_kit_id || (project as { mediaKitId?: string }).mediaKitId || '';

  useEffect(() => {
    fetch(`${API_BASE}/api/mockups-app/catalogo?projectId=${encodeURIComponent(project.id)}`).then((r) => r.json()).then((d) => setEscritos((d.tarjetas || []).length)).catch(() => {});
  }, [project.id, fase]);
  // mientras el agente escribe, se pregunta cada segundo y medio por dónde va
  useEffect(() => {
    if (fase !== 'escribiendo' || !kitId) return;
    const t = setInterval(() => {
      fetch(`${API_BASE}/api/mockups-app/progreso?appId=${encodeURIComponent(kitId)}`).then((r) => r.json()).then((d) => setProg(d)).catch(() => {});
    }, 1500);
    return () => clearInterval(t);
  }, [fase, kitId]);

  const pasarAVideo = async (n: number) => {
    setFase('video'); setInicioVideo(Date.now()); setCantidad(n);
    const r = await fetch(`${API_BASE}/api/mockups-app/generar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: project.id, reelId }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'no se pudieron pasar los mockups a video');
    const mks = d.mockups as MockupApp[];
    setComercial((c) => enganchar(c, mks));
    return mks.length;
  };
  // UN botón: escribir (agente, mirando las capturas) y pasar a video, de corrido
  const hacerMockups = async () => {
    if (!kitId || fase) return;
    setError(''); setMsg(''); setProg(null); setFase('escribiendo');
    const t0 = Date.now();
    try {
      const r = await fetch(`${API_BASE}/api/mockups-app/escribir`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: kitId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'el agente no pudo escribir los mockups');
      const n = await pasarAVideo(d.tarjetas?.length || 0);
      setMsg(`Listos ${n} mockups en ${reloj((Date.now() - t0) / 1000)}${d.errores?.length ? `, con ${d.errores.length} aviso(s)` : ''}.`);
    } catch (e) { setError(errMsg(e)); } finally { setFase(''); }
  };
  // la app ya tiene sus mockups escritos (de otra pieza): sólo pasarlos a video para esta pieza
  const soloVideo = async () => {
    if (fase) return;
    setError(''); setMsg('');
    const t0 = Date.now();
    try { const n = await pasarAVideo(escritos); setMsg(`Listos ${n} mockups en ${reloj((Date.now() - t0) / 1000)}.`); }
    catch (e) { setError(errMsg(e)); } finally { setFase(''); }
  };
  // 2026-10-12: si la app ya tiene sus mockups escritos y esta pieza no los tiene, se pasan a video solos al entrar (antes
  // había que tocar el botón y las piezas llegaban al montaje sin mockups)
  const autoMockups = useRef(false);
  useEffect(() => {
    if (autoMockups.current || fase || escritos <= 0 || mockups.length) return;
    autoMockups.current = true;
    void soloVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escritos]);
  const usarEn = (m: MockupApp, escenaN: number) => setComercial((c) => ({
    ...c,
    rodaje: [...(c.rodaje || []), { id: `toma-${escenaN}-mk-${Date.now().toString(36)}`, escenaN, fileRef: m.fileRef, durSec: m.durSec, origen: 'mockup' as const, promptUsado: `mockup de la app: ${m.nombre}` }],
    estados: { ...c.estados, rodaje: c.estados.rodaje === 'aprobado' ? 'aprobado' : 'generado' },
  }));
  const escenasDe = (m: MockupApp) => [...new Set(tomas.filter((t) => t.origen === 'mockup' && t.fileRef === m.fileRef).map((t) => t.escenaN))];

  return (
    <div className="paso">
      <div className="paso-head">
        <div className="paso-head-txt">
          <h2 className="paso-title">Mockups</h2>
          <p className="paso-sub">Un mockup animado por pantalla de la app. El agente mira cada captura del media kit con sus estados y lo escribe; la plantilla pone la marca, las medidas y la animación. Los de las escenas de pantalla entran solos.</p>
        </div>
        {kitId && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <button className="paso-gen" onClick={() => void hacerMockups()} disabled={!!fase || !escenas.length}>
              {fase ? <Loader2 size={14} className="paso-spin" /> : <LayoutTemplate size={14} />} {fase === 'escribiendo' ? 'Escribiendo…' : fase === 'video' ? 'Pasando a video…' : mockups.length ? 'Rehacer los mockups' : 'Hacer los mockups'}
            </button>
            {!fase && escritos > 0 && !mockups.length && (
              <button className="rodaje-var" onClick={() => void soloVideo()} title="La app ya tiene sus mockups escritos: se pasan a video para esta pieza sin volver a escribirlos">
                Usar los {escritos} ya escritos (sólo pasarlos a video)
              </button>
            )}
          </div>
        )}
      </div>
      {error && <div className="paso-error">{error}</div>}
      <div className="paso-body">
        {!kitId ? (
          <PasoEmpty icon={LayoutTemplate}>Esta pieza no viene de un media kit: los mockups salen de las capturas del kit de la app.</PasoEmpty>
        ) : !escenas.length ? (
          <PasoEmpty icon={LayoutTemplate}>Primero generá el storyboard: marca qué escenas muestran una pantalla de la app.</PasoEmpty>
        ) : (
          <>
            {fase === 'escribiendo' && <ProgresoEscritura prog={prog} />}
            {fase === 'video' && <ProgresoVideo inicio={inicioVideo} cantidad={cantidad} />}
            {msg && !fase && <p className="paso-sub" style={{ marginTop: 4, color: 'var(--rd-ink)' }}>{msg}</p>}
            {mockups.length > 0 ? (
              <div className="rodaje-bins" style={{ marginTop: 10 }}>
                {mockups.map((m) => {
                  const en = escenasDe(m);
                  return (
                    <article key={m.id} className={`rodaje-bin${en.length ? ' rodaje-bin--filled' : ''}`}>
                      <video className="rodaje-bin-video" src={`${API_BASE}/api/storage/${m.fileRef.split('/').map(encodeURIComponent).join('/')}#t=2.5`} controls muted playsInline preload="metadata" />
                      <div className="rodaje-bin-top" style={{ marginTop: 6 }}>
                        <b>{m.nombre}</b>
                        <span className="paso-t">{m.durSec ? `${m.durSec.toFixed(1)}s` : ''}</span>
                      </div>
                      <div className="rodaje-bin-dlg">{en.length ? `En la escena ${en.map((n) => `#${n}`).join(', ')}` : 'Disponible: no está en ninguna escena'}</div>
                      <select className="mont-select" style={{ marginTop: 6, width: '100%' }} value="" onChange={(ev) => { const n = Number(ev.target.value); if (n) usarEn(m, n); }}>
                        <option value="">Usar en la escena…</option>
                        {escenas.filter((e) => e.rol !== 'cta').map((e) => <option key={e.n} value={e.n}>#{e.n} · {ROL_LABEL[e.rol] || e.rol} · {e.durSec}s{e.pantalla ? ' · pantalla' : ''}</option>)}
                      </select>
                    </article>
                  );
                })}
              </div>
            ) : !fase && (
              <PasoEmpty icon={LayoutTemplate}>Tocá "Hacer los mockups": el agente escribe uno por pantalla mirando las capturas (unos 3 minutos) y los pasa a video.</PasoEmpty>
            )}
          </>
        )}
      </div>
      <div className="paso-foot paso-foot--split">
        <span className="paso-estado">{estadoDelPaso('rodaje', comercial)}</span>
        <button className="paso-approve" disabled={!tomas.length} onClick={goNext}>
          Mockups listos, al montaje <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
