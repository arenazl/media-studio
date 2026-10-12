// Curación externa del guion (2026-10-10, Lucas: "ni vos ni yo somos expertos en guiones ni en comerciales"). Exportar arma
// el paquete entero para ChatGPT (ficha, brief, concepto, guion, la radiografía del camino y los prompts con su modelo) y lo
// copia y lo baja; importar lee la respuesta (diagnóstico + guion en JSON + curación de prompts), la muestra y, si la
// aplicás, reemplaza el guion. La curación de los prompts queda guardada en la carpeta compartida, pendiente de aplicar.
import { useState } from 'react';
import { Download, Upload, Copy, Check, X, Loader2 } from 'lucide-react';
import { API_BASE } from '../config';
import type { Project } from '../lib/projects';
import type { Comercial, GuionEstructurado, EstadoPaso } from '../lib/comercial';

// El guion curado reemplaza al anterior; lo que se construyó encima (personajes, storyboard, pack) queda pendiente.
// eslint-disable-next-line react-refresh/only-export-components
export function conGuionCurado(c: Comercial, g: GuionEstructurado, archivo: string): Comercial {
  const estados = { ...c.estados, guion: 'editado' as EstadoPaso };
  for (const p of ['cast', 'storyboard', 'pack'] as const) if (estados[p] && estados[p] !== 'pendiente') estados[p] = 'pendiente';
  return { ...c, guion: g, guionCurado: { fecha: Date.now(), fuente: 'ChatGPT', archivo }, estados };
}

interface Leido { guion: GuionEstructurado | null; errores: string[]; resumen: string; curacionPrompts?: string; archivo?: string }

async function post<T>(accion: string, body: object): Promise<T> {
  const r = await fetch(`${API_BASE}/api/curacion/guion/${accion}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
  return d as T;
}

function bajar(nombre: string, texto: string) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function CuracionGuion({ project, comercial, durationSec, formatoNombre, onAplicar }: {
  project: Project; comercial: Comercial; durationSec: number; formatoNombre: string;
  onAplicar: (guion: GuionEstructurado, info: { archivo: string; conPrompts: boolean }) => void;
}) {
  const [panel, setPanel] = useState<'exportar' | 'importar' | null>(null);
  const [exportado, setExportado] = useState('');
  const [palabras, setPalabras] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [leido, setLeido] = useState<Leido | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const base = { projectId: project.id, comercial, durationSec, formatoNombre };
  const nombreArchivo = `curacion-guion-${(comercial.titulo || comercial.id).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.md`;

  const copiar = async (t: string) => {
    try { await navigator.clipboard.writeText(t); setCopiado(true); window.setTimeout(() => setCopiado(false), 2500); }
    catch { setCopiado(false); }
  };
  const exportar = async () => {
    setBusy(true); setError(''); setPanel('exportar');
    try {
      const d = await post<{ texto: string; palabras: number }>('exportar', base);
      setExportado(d.texto); setPalabras(d.palabras);
      await copiar(d.texto);
      bajar(nombreArchivo, d.texto);
    } catch (e) { setError(e instanceof Error ? e.message : 'no pude exportar'); }
    finally { setBusy(false); }
  };
  const leer = async () => {
    setBusy(true); setError(''); setLeido(null);
    try { setLeido(await post<Leido>('leer', { ...base, texto: respuesta })); }
    catch (e) { setError(e instanceof Error ? e.message : 'no pude leer la respuesta'); }
    finally { setBusy(false); }
  };
  const aplicar = async () => {
    setBusy(true); setError('');
    try {
      const d = await post<Leido>('aplicar', { ...base, texto: respuesta, exportado });
      if (!d.guion) throw new Error(d.errores?.[0] || 'la respuesta no trae un guion');
      onAplicar(d.guion, { archivo: d.archivo || '', conPrompts: !!d.curacionPrompts });
      setPanel(null); setRespuesta(''); setLeido(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'no pude aplicar la curación'); }
    finally { setBusy(false); }
  };

  return (
    <div className="cur-guion">
      <div className="cur-bar">
        <span className="cur-bar-t">Curación con ChatGPT</span>
        <span className="cur-bar-s">Mandá el camino entero a ChatGPT: diagnostica, cura el guion y los prompts.</span>
        <button type="button" className="paso-pick" onClick={exportar} disabled={busy}><Download size={13} /> Exportar para curar</button>
        <button type="button" className="paso-pick" onClick={() => { setPanel(panel === 'importar' ? null : 'importar'); setError(''); }} disabled={busy}><Upload size={13} /> Importar curación</button>
      </div>
      {error && <div className="paso-error">{error}</div>}

      {panel === 'exportar' && (
        <div className="cur-panel">
          {busy && !exportado ? <p><Loader2 size={13} className="paso-spin" /> Armando el paquete…</p> : (
            <>
              <p>{copiado ? 'Copiado y descargado.' : 'Descargado.'} Pegalo en ChatGPT, o subile el archivo <b>{nombreArchivo}</b>. Son {palabras.toLocaleString('es-AR')} palabras: la ficha, el brief, el concepto, el guion, la radiografía de cada paso y los prompts con su modelo. Cuando te conteste, tocá "Importar curación" y pegá la respuesta entera.</p>
              <div className="cur-acc">
                <button type="button" className="paso-pick" onClick={() => void copiar(exportado)}>{copiado ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}</button>
                <button type="button" className="paso-pick" onClick={() => bajar(nombreArchivo, exportado)}><Download size={13} /> Bajar de nuevo</button>
                <button type="button" className="paso-pick" onClick={() => setPanel(null)}><X size={13} /> Cerrar</button>
              </div>
              <textarea className="cur-txt" readOnly value={exportado} rows={8} aria-label="Lo que se exportó para ChatGPT" />
            </>
          )}
        </div>
      )}

      {panel === 'importar' && (
        <div className="cur-panel">
          <label className="cur-k" htmlFor="cur-respuesta">Pegá la respuesta entera de ChatGPT</label>
          <textarea id="cur-respuesta" className="cur-txt" rows={8} value={respuesta} onChange={(e) => { setRespuesta(e.target.value); setLeido(null); }} placeholder="El diagnóstico, el guion en JSON y la curación de prompts, tal cual los devolvió." />
          <div className="cur-acc">
            <button type="button" className="paso-pick" onClick={leer} disabled={busy || !respuesta.trim()}>{busy && !leido ? <Loader2 size={13} className="paso-spin" /> : <Check size={13} />} Leer la respuesta</button>
            <button type="button" className="paso-pick" onClick={() => setPanel(null)}><X size={13} /> Cancelar</button>
          </div>
          {leido && (
            <div className="cur-leido">
              {leido.resumen && <div className="cur-bloque"><div className="cur-k">El diagnóstico</div><p className="cur-pre">{leido.resumen}</p></div>}
              {leido.guion ? (
                <div className="cur-bloque">
                  <div className="cur-k">El guion curado</div>
                  {leido.guion.blocks.map((b, i) => (
                    <div key={i} className="cur-blk"><b>{b.role}{b.durSec ? ` · ${b.durSec} s` : ''}</b> <span>“{b.narration}”</span>{b.visual && <em> Se ve: {b.visual}</em>}</div>
                  ))}
                </div>
              ) : null}
              {leido.errores.length > 0 && <div className="cur-avisos">{leido.errores.map((e, i) => <div key={i}>{e}</div>)}</div>}
              <p className="cur-nota">{leido.curacionPrompts ? 'Trae la curación de los prompts: al aplicar queda guardada en la carpeta compartida, pendiente de tu dale para pasarla al código.' : 'No trae la sección "CURACIÓN DE PROMPTS": sólo se aplica el guion.'}</p>
              {leido.guion && (
                <button type="button" className="paso-pick paso-pick--on" onClick={aplicar} disabled={busy}>{busy ? <Loader2 size={13} className="paso-spin" /> : <Check size={13} />} {leido.errores.length ? 'Aplicar igual' : 'Aplicar este guion'}</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
