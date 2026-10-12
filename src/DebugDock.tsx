// Consola de debug (2026-10-10, Lucas: "una consola abajo, con menú colapsable como Habláh, que me vaya mostrando lo que
// pasa detrás del capot"; después: "que quede fija, que pueda colapsarse, que ocupe un 20%, con scroll, y lo importante").
// Herramienta de desarrollo: se pliega con el botón "Debug" y recuerda si quedó abierta. Para el paso abierto muestra
// primero el resumen en una línea y las alertas; después lo que escribió la IA, lo que vino decidido, el prompt por capas
// (con el texto) y qué hizo con el kit. Los datos salen de la radiografía del backend (server/radiografia.mjs), que no
// llama al modelo; se recargan solos cuando cambia la pieza.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, RefreshCw, Bug } from 'lucide-react';
import { API_BASE } from './config';
import type { Project } from './lib/projects';
import type { Comercial } from './lib/comercial';
import './DebugDock.css';

type Origen = 'kit' | 'anterior' | 'creativo' | 'imaginado';
type Naturaleza = 'estatico' | 'preset' | 'dinamico';
interface Frase { campo: string; texto: string; origen: Origen; hecho: { etiqueta: string } | null; parecido: number; alertas: string[]; n?: number; rol?: string }
interface Capa { n: number; titulo: string; naturaleza: Naturaleza; palabras: number; texto?: string; enSalida: number }
interface Hecho { id: string; etiqueta: string; grupo: string; estado: 'usado' | 'ignorado' | 'no-llego' }
interface Paso {
  id: string; label: string; decideLaIA: string;
  corrida: null | { version: string; modelo: string; segundos: number; costo: number; veces: number; porHorario?: boolean };
  decisiones: Record<string, unknown>; promptReconstruido: boolean; palabrasPrompt: number; editadoAMano?: boolean;
  palabrasPorNaturaleza: Record<Naturaleza, number>; capas: Capa[]; frases: Frase[]; hechos: Hecho[];
  origen: Record<Origen, number>; alertas: number;
}
interface Radio { pasos: Paso[]; hechos: Hecho[]; resumen: { hechos: { total: number; usados: number; ignorados: number; noLlegaron: number }; alertas: number; costo: number } }

// paso del Pipeline → molde de la radiografía (Negocio es la estrategia: ahí la IA decidió el ángulo de la pieza)
const MOLDE: Record<string, { id: string; label: string }> = {
  negocio: { id: 'strategy', label: 'Negocio' }, concepto: { id: 'concept', label: 'Concepto' }, guion: { id: 'script', label: 'Guion' },
  cast: { id: 'cast', label: 'Personajes' }, storyboard: { id: 'storyboard', label: 'Storyboard' },
};
const ORIGEN: Record<Origen, string> = { kit: 'sale del kit', anterior: 'de un paso anterior', creativo: 'invención creativa', imaginado: 'lo imaginó' };
const NAT: Record<Naturaleza, string> = { estatico: 'fijo', preset: 'elegido', dinamico: 'datos' };
const ESTADO: Record<Hecho['estado'], string> = { usado: 'Lo usó', ignorado: 'Le llegó y no lo usó', 'no-llego': 'No le llegó' };
const OCULTAS = new Set(['cache', 'regenerate', 'modeloPedido', 'molde']);
const pct = (v: number, t: number) => (t ? Math.round((v / t) * 100) : 0);

function Seccion({ id, titulo, extra, abiertas, toggle, children }: { id: string; titulo: string; extra?: string; abiertas: Record<string, boolean>; toggle: (id: string) => void; children: React.ReactNode }) {
  const on = !!abiertas[id];
  return (
    <section className="dbg-sec">
      <button type="button" className="dbg-sec-cab" onClick={() => toggle(id)} aria-expanded={on}>
        {on ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="dbg-sec-t">{titulo}</span>
        {extra && <span className="dbg-sec-x">{extra}</span>}
      </button>
      {on && <div className="dbg-sec-cuerpo">{children}</div>}
    </section>
  );
}

const leer = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const guardar = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sin storage */ } };

export default function DebugDock({ project, comercial, paso }: { project: Project; comercial?: Comercial; paso: string }) {
  const [abierto, setAbierto] = useState(() => leer('ms:debug', '0') === '1');
  const [data, setData] = useState<Radio | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({ salida: true });
  const timer = useRef<number | undefined>(undefined);
  const molde = MOLDE[paso];

  const cargar = useCallback(async () => {
    if (!comercial) return;
    setCargando(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/radiografia`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: project.id, comercial }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setData(d as Radio);
    } catch (e) { setError(e instanceof Error ? e.message : 'no pude leer la radiografía'); }
    finally { setCargando(false); }
  }, [project.id, comercial]);

  // se recarga sola cuando cambia la pieza (al terminar un paso) o el paso, también plegada (la barra muestra el resumen)
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void cargar(); }, abierto ? 500 : 1200);
    return () => window.clearTimeout(timer.current);
  }, [abierto, paso, cargar]);

  const toggle = (id: string) => setAbiertas((a) => ({ ...a, [id]: !a[id] }));
  const abrir = (v: boolean) => { setAbierto(v); guardar('ms:debug', v ? '1' : '0'); };
  // el registro: todos los pasos que ya corrieron, en el orden del pipeline (Negocio, Concepto, Guion, Personajes, Storyboard)
  const corridos = (data?.pasos || []).filter((p) => p.corrida || p.frases.length);
  const ultimo = corridos[corridos.length - 1];
  const P = data?.pasos.find((p) => p.id === molde?.id);
  const cuerpo = useRef<HTMLDivElement | null>(null);
  const vistos = useRef(0);
  // cuando entra un paso nuevo al registro, se abre y la consola baja hasta él
  useEffect(() => {
    if (!abierto || corridos.length <= vistos.current) { vistos.current = Math.max(vistos.current, corridos.length); return; }
    vistos.current = corridos.length;
    if (ultimo) setAbiertas((a) => ({ ...a, [`${ultimo.id}:salida`]: true }));
    window.setTimeout(() => { cuerpo.current?.scrollTo({ top: cuerpo.current.scrollHeight, behavior: 'smooth' }); }, 60);
  }, [abierto, corridos.length, ultimo]);

  const lineaDe = (x: Paso) => {
    const n = x.palabrasPorNaturaleza;
    const usados = x.hechos.filter((h) => h.estado === 'usado').length;
    return `prompt ${x.palabrasPrompt} pal (fijo ${pct(n.estatico, x.palabrasPrompt)}% · elegido ${pct(n.preset, x.palabrasPrompt)}% · datos ${pct(n.dinamico, x.palabrasPrompt)}%) → ${x.frases.length} frases (kit ${x.origen.kit}% · anterior ${x.origen.anterior}% · creativo ${x.origen.creativo}% · imaginó ${x.origen.imaginado}%) · kit: usó ${usados} de ${x.hechos.length}${x.alertas ? ` · ${x.alertas} alerta${x.alertas === 1 ? '' : 's'}` : ''}`;
  };
  const barra = P ? lineaDe(P)
    : !data ? (cargando ? 'leyendo…' : error ? 'sin conexión con el backend' : '')
      : `${corridos.length} paso${corridos.length === 1 ? '' : 's'} con IA en esta pieza · usó ${data.resumen.hechos.usados} de ${data.resumen.hechos.total} hechos del kit · ${data.resumen.alertas} alertas · USD ${data.resumen.costo}`;

  const entrada = (x: Paso) => {
    const k = (s: string) => `${x.id}:${s}`;
    const alertas = x.frases.flatMap((f) => f.alertas.map((a) => ({ a, f })));
    const usados = x.hechos.filter((h) => h.estado === 'usado').length;
    const on = !!abiertas[k('entrada')] || x === ultimo;
    return (
      <div key={x.id} className={`dbg-ent${molde?.id === x.id ? ' dbg-ent--actual' : ''}`}>
        <button type="button" className="dbg-ent-cab" onClick={() => toggle(k('entrada'))} aria-expanded={on}>
          {on ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <span className="dbg-ent-t">{x.label}</span>
          {x.corrida && <span className="dbg-bar-run">{x.corrida.modelo || '?'} · {x.corrida.segundos} s · USD {x.corrida.costo.toFixed(3)}</span>}
          <span className={`dbg-sec-x${x.alertas ? ' dbg-bar-info--al' : ''}`}>{lineaDe(x)}</span>
        </button>
        {on && (
          <div className="dbg-ent-cuerpo">
            {x.corrida?.porHorario && <div className="dbg-aviso">La estrategia corrió antes de que se registrara con el proyecto: es la que corrió a la hora en que se creó.</div>}
            {x.promptReconstruido && <div className="dbg-aviso">Esta corrida no guardó su prompt: se rearmó con los datos de la pieza.</div>}
            {x.editadoAMano && <div className="dbg-aviso">El concepto elegido lo retocaste a mano después de generarlo: lo que dice ya no es sólo de la IA.</div>}
            {alertas.length > 0 && (
              <div className="dbg-alertas">
                {alertas.map((y, i) => <div key={i}><b>{y.a}</b> · <span>{y.f.campo}{y.f.n ? ` ${y.f.n}` : ''}: “{y.f.texto.slice(0, 110)}{y.f.texto.length > 110 ? '…' : ''}”</span></div>)}
              </div>
            )}
            <Seccion id={k('salida')} titulo="Lo que escribió la IA" extra={`${x.frases.length} frases`} abiertas={abiertas} toggle={toggle}>
              <div className="dbg-frases">
                {x.frases.map((f, i) => (
                  <div key={i} className={`dbg-frase dbg-b-${f.alertas.length ? 'alerta' : f.origen}`}>
                    <span className={`dbg-t-${f.origen}`}>{ORIGEN[f.origen]}</span>
                    <span className="dbg-frase-campo">{f.campo}{f.n ? ` ${f.n}` : ''}{f.hecho ? ` ← ${f.hecho.etiqueta}` : ''}</span>
                    <span className="dbg-frase-tx">{f.texto}</span>
                  </div>
                ))}
              </div>
            </Seccion>
            <Seccion id={k('decidido')} titulo="Qué vino decidido y qué decidió la IA" extra={x.corrida ? x.corrida.version : ''} abiertas={abiertas} toggle={toggle}>
              <div className="dbg-chips">
                {Object.entries(x.decisiones || {}).filter(([kk, v]) => v !== null && v !== '' && v !== false && !OCULTAS.has(kk)).map(([kk, v]) => <span key={kk} className="dbg-chip">{kk} <b>{String(v)}</b></span>)}
              </div>
              <p className="dbg-p"><b>La IA decidió:</b> {x.decideLaIA}</p>
            </Seccion>
            <Seccion id={k('prompt')} titulo="El prompt que recibió" extra={`${x.capas.length} capas · ${x.palabrasPrompt} palabras`} abiertas={abiertas} toggle={toggle}>
              <div className="dbg-capas">
                {x.capas.map((c) => (
                  <details key={c.n} className={`dbg-capa dbg-b-${c.naturaleza}`}>
                    <summary><span className="dbg-capa-t">{c.titulo}</span><span className="dbg-capa-n">{NAT[c.naturaleza]} · {c.palabras} pal · {c.enSalida}% en la salida</span></summary>
                    <pre>{c.texto}</pre>
                  </details>
                ))}
              </div>
            </Seccion>
            <Seccion id={k('kit')} titulo="Qué hizo con el kit" extra={`usó ${usados} · le llegaron y no usó ${x.hechos.filter((h) => h.estado === 'ignorado').length} · no le llegaron ${x.hechos.filter((h) => h.estado === 'no-llego').length}`} abiertas={abiertas} toggle={toggle}>
              {(['usado', 'ignorado', 'no-llego'] as const).map((e) => (
                <div key={e} className="dbg-hechos">
                  <span className="dbg-hechos-t">{ESTADO[e]}</span>
                  {x.hechos.filter((h) => h.estado === e).map((h) => <span key={h.id} className={`dbg-h dbg-h--${e}`}>{h.etiqueta}</span>)}
                </div>
              ))}
            </Seccion>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* el lugar que ocupa la consola al pie, para que no tape el final del paso */}
      <div className={abierto ? 'dbg-espacio dbg-espacio--on' : 'dbg-espacio'} aria-hidden="true" />
      <div className={`dbg${abierto ? ' dbg--on' : ''}`}>
        <div className="dbg-bar">
          <button type="button" className="dbg-tog" onClick={() => abrir(!abierto)} aria-expanded={abierto} title="Consola de debug: el registro de lo que pasa detrás de cada paso">
            <Bug size={13} /> Debug {abierto ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <span className="dbg-bar-paso">{molde?.label || paso}</span>
          {P?.corrida && <span className="dbg-bar-run">{P.corrida.modelo || '?'} · {P.corrida.segundos} s · USD {P.corrida.costo.toFixed(3)}</span>}
          <span className={`dbg-bar-info${P?.alertas ? ' dbg-bar-info--al' : ''}`} title={barra}>{barra}</span>
          <button type="button" className="dbg-bar-btn" onClick={() => void cargar()} disabled={cargando} title="Volver a leer"><RefreshCw size={12} className={cargando ? 'dbg-gira' : ''} /></button>
        </div>
        {abierto && (
          <div className="dbg-cuerpo" ref={cuerpo}>
            {error && <div className="dbg-vacio dbg-error">{error}. Si el backend se reinició, tocá el botón de recargar.</div>}
            {data && !corridos.length && <div className="dbg-vacio">Todavía no corrió ningún paso con IA en esta pieza.</div>}
            {corridos.map(entrada)}
            {molde && data && !P && <div className="dbg-vacio">{molde.label} todavía no corrió. Para ver el prompt que va a recibir, tocá "Orquestador" arriba.</div>}
          </div>
        )}
      </div>
    </>
  );
}
