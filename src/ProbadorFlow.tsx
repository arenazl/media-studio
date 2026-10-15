import { useEffect, useState } from 'react';
import { API_BASE } from './config';

interface Escena { escenaN: number; estado: string; fileRef: string | null; motivo?: string }
interface Job { id: string; estado: string; paso: string; escenas: Escena[]; fallas?: string[]; error?: string | null; log?: string[]; flowProjectUrl?: string | null; ajustesReales?: { modelo?: string; resolucion?: string; pastilla?: string } | null }
interface Resultado { id: string; fileRef: string; prompt: string; modeloPedido: string; modeloReal: string; resolucion: string; fecha: number }
const MODELOS = [
  { id: 'omni360', label: 'Omni Flash 1.1 · 360p', info: 'Costo: verificar el importe dentro de tu Flow.' },
  { id: 'lite', label: 'Veo 3.1 Lite · 720p', info: 'Referencia: 10 créditos por clip, según plan.' },
  { id: 'fast', label: 'Veo 3.1 Fast · 720p', info: 'Referencia: 20 créditos por clip, según plan.' },
  { id: 'quality', label: 'Veo 3.1 Quality · 720p', info: 'Referencia: 100 créditos. No admite referencias de personajes.' },
] as const;

export default function ProbadorFlow() {
  const [prompt, setPrompt] = useState('Plano medio de una mujer adulta común, con ropa cotidiana y luz natural. Mira a cámara, sonríe con naturalidad y dice: "Qué bueno verte de nuevo". Movimiento realista de ojos, manos y labios sincronizados, sin exagerar gestos.');
  const [modelo, setModelo] = useState('lite');
  const [flowProjectUrl, setFlowProjectUrl] = useState(() => localStorage.getItem('probadorFlowUrl') || '');
  const [personaje, setPersonaje] = useState(() => localStorage.getItem('probadorPersonaje') || '');
  const [job, setJob] = useState<Job | null>(null);
  const [modeloEnCurso, setModeloEnCurso] = useState('lite');
  const [promptEnCurso, setPromptEnCurso] = useState('');
  const [resultados, setResultados] = useState<Resultado[]>(() => {
    try { const raw = JSON.parse(localStorage.getItem('probadorFlowResultados') || '[]'); return Array.isArray(raw) ? raw.slice(0, 12) : []; }
    catch { return []; }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [consulta, setConsulta] = useState('');
  // el historial del servidor (2026-10-15): también los clips lanzados por la API, no sólo los de esta pantalla
  useEffect(() => {
    const traer = () => fetch(`${API_BASE}/api/flow/probador/resultados`).then((r) => r.json()).then((d) => {
      const delServidor: Resultado[] = (d.resultados || []).map((x: { id: string; fileRef: string; prompt?: string; modeloPedido?: string; modeloReal?: string; resolucion?: string; fecha?: number }) => ({
        id: x.id, fileRef: x.fileRef, prompt: x.prompt || '', modeloPedido: x.modeloPedido || '', modeloReal: x.modeloReal || 'no detectado', resolucion: x.resolucion || 'no detectada', fecha: x.fecha || 0,
      }));
      setResultados((prev) => [...delServidor.filter((s) => !prev.some((p) => p.id === s.id)), ...prev].sort((a, b) => b.fecha - a.fecha).slice(0, 24));
    }).catch(() => { /* sin servidor: queda lo local */ });
    void traer();
    const t = window.setInterval(() => void traer(), 15000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!job || job.estado === 'listo' || job.estado === 'error') return;
    const timer = window.setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/flow/jobs/${encodeURIComponent(job.id)}`);
        const d = await r.json();
        if (r.ok && d.job) {
          const actualizado = d.job as Job;
          setJob(actualizado);
          const tomaFinal = actualizado.escenas?.find((e) => e.fileRef);
          if ((actualizado.estado === 'listo' || actualizado.estado === 'error') && tomaFinal?.fileRef) {
            setResultados((prev) => {
              if (prev.some((x) => x.id === actualizado.id)) return prev;
              const siguiente = [{
                id: actualizado.id, fileRef: tomaFinal.fileRef as string,
                modeloPedido: modeloEnCurso, prompt: promptEnCurso, fecha: Date.now(),
                modeloReal: actualizado.ajustesReales?.modelo || 'no detectado',
                resolucion: actualizado.ajustesReales?.resolucion || 'no detectada',
              }, ...prev].slice(0, 12);
              localStorage.setItem('probadorFlowResultados', JSON.stringify(siguiente));
              return siguiente;
            });
          }
          if (d.job.flowProjectUrl) {
            setFlowProjectUrl(d.job.flowProjectUrl);
            localStorage.setItem('probadorFlowUrl', d.job.flowProjectUrl);
          }
        }
      } catch { /* se consulta de nuevo */ }
    }, 3000);
    return () => clearInterval(timer);
  }, [job?.id, job?.estado, modeloEnCurso, promptEnCurso]);

  const generar = async () => {
    if (!window.confirm('Esto puede consumir créditos reales de Flow. Se solicitará UNA generación, sin reintentos automáticos. ¿Generar?')) return;
    setBusy(true); setError(''); setJob(null);
    setModeloEnCurso(modelo); setPromptEnCurso(prompt);
    try {
      const r = await fetch(`${API_BASE}/api/flow/probador`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, modelo, flowProjectUrl: flowProjectUrl.trim(), personaje: modelo === 'quality' ? '' : personaje.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'No se pudo crear el trabajo');
      localStorage.setItem('probadorFlowUrl', flowProjectUrl.trim());
      localStorage.setItem('probadorPersonaje', personaje.trim());
      setJob(d.job as Job);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const leerAjustes = async () => {
    setConsulta('Consultando Flow sin gastar créditos…'); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/flow/puente/consultar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: flowProjectUrl.trim() || null, pasos: [{ accion: 'irAContenido' }, { accion: 'leerAjustes' }] }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'No se pudo leer Flow');
      setConsulta(JSON.stringify(d, null, 2));
    } catch (e) { setConsulta(''); setError(e instanceof Error ? e.message : String(e)); }
  };

  const toma = job?.escenas?.find((e) => !!e.fileRef);
  const enCurso = !!job && job.estado !== 'error' && job.estado !== 'listo';
  const botonCss = { padding: '10px 16px', cursor: 'pointer', borderRadius: 8 };
  const entradaCss = { display: 'block' as const, boxSizing: 'border-box' as const, width: '100%', marginTop: 7, padding: 10, borderRadius: 8 };

  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: '24px 18px' }}>
      <h1>Probador Flow · local</h1>
      <p>Una sola escena de 8 segundos, salida x1. No cambia los presets ni escribe tomas en tus comerciales.
        El modelo y los parámetros se verifican antes del botón de generar.</p>
      <label style={{ display: 'block', marginTop: 18 }}>
        Modelo
        <select value={modelo} onChange={(e) => setModelo(e.target.value)} style={entradaCss}>
          {MODELOS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </label>
      <p style={{ marginTop: 8 }}>{MODELOS.find((m) => m.id === modelo)?.info} Precio definitivo: el mostrado en tu cuenta de Flow.</p>
      <label style={{ display: 'block', marginTop: 16 }}>
        Prompt de la escena (copiar igual para comparar modelos)
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} style={{ ...entradaCss, resize: 'vertical' }} />
      </label>
      <label style={{ display: 'block', marginTop: 16 }}>
        Proyecto existente en Flow (opcional)
        <input value={flowProjectUrl} onChange={(e) => setFlowProjectUrl(e.target.value)} placeholder="https://flow.google.com/project/..." style={entradaCss} />
      </label>
      <label style={{ display: 'block', marginTop: 16 }}>
        Nombre exacto del personaje existente en ese proyecto (opcional)
        <input value={personaje} onChange={(e) => setPersonaje(e.target.value)} placeholder="Ej. Ana" style={entradaCss} disabled={modelo === 'quality'} />
      </label>
      {modelo === 'quality' && <p>Quality no utiliza referencias de personaje, por lo que no es apto para medir consistencia de un mismo actor.</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        <button style={botonCss} onClick={() => void leerAjustes()} disabled={busy || enCurso}>Leer opciones de Flow (sin generar)</button>
        <button style={botonCss} onClick={() => void generar()} disabled={busy || enCurso || !prompt.trim() || (!!personaje.trim() && modelo !== 'quality' && !flowProjectUrl.trim())}>Generar un clip (consume créditos)</button>
      </div>
      {error && <p role="alert" style={{ color: 'tomato' }}>{error}</p>}
      {consulta && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 290, overflow: 'auto', marginTop: 12 }}>{consulta}</pre>}
      {job && <div style={{ marginTop: 24 }}>
        <h2>Resultado · {job.estado}</h2>
        <p>{job.paso}</p>
        {job.ajustesReales && <p>Confirmado: <strong>{job.ajustesReales.modelo || '?'}</strong> · {job.ajustesReales.resolucion || '?'}</p>}
        {job.error && <p role="alert">{job.error}</p>}
        {job.fallas?.map((f, i) => <p key={i} role="alert">{f}</p>)}
        {toma?.fileRef && <video src={`${API_BASE}/api/storage/${toma.fileRef}`} controls playsInline style={{ maxWidth: '100%', maxHeight: 500 }} />}
        {!!job.log?.length && <details><summary>Registro de pasos</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{job.log.join('\n')}</pre></details>}
      </div>}
      {!!resultados.length && <section style={{ marginTop: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <h2>Comparar resultados ({resultados.length})</h2>
          <button onClick={() => { if (window.confirm('¿Quitar los resultados del historial del probador? Los archivos locales no se borran.')) { setResultados([]); localStorage.removeItem('probadorFlowResultados'); } }}>Limpiar historial</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {resultados.map((r) => <article key={r.id} style={{ border: '1px solid #7776', borderRadius: 10, padding: 12, minWidth: 0 }}>
            <strong>{MODELOS.find((m) => m.id === r.modeloPedido)?.label || r.modeloPedido}</strong>
            <p style={{ fontSize: 12, opacity: 0.8 }}>Flow: {r.modeloReal} · {r.resolucion}</p>
            <video src={`${API_BASE}/api/storage/${r.fileRef}`} controls playsInline preload="metadata" style={{ width: '100%', maxHeight: 380 }} />
            <details><summary>Prompt original</summary><p style={{ whiteSpace: 'pre-wrap' }}>{r.prompt}</p></details>
          </article>)}
        </div>
      </section>}
      <p style={{ marginTop: 24 }}>Extensión: <code>extension-flow-lab</code> v0.6.0. Desactivá el Puente Flow anterior durante las pruebas: ambos usan la misma cola local.</p>
    </section>
  );
}
