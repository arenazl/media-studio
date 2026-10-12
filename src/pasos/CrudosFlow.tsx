// LOS CRUDOS DE FLOW (2026-10-11): el clip de cada escena filmada, debajo de la automatización de Pack Flow. Antes vivía
// en el paso Rodaje, mezclado con los mockups; Lucas: "primero los crudos de los videos en un paso, los crudos de los
// mockups animados en otro, y después el montaje". La rutina de Flow los baja sola; acá se ven, se reemplazan o se
// importan a mano (arrastrar o elegir el archivo). Cada clip queda como toma de su escena (comercial.rodaje).
import { useRef, useState } from 'react';
import { Upload, Loader2, Check } from 'lucide-react';
import { errMsg } from './pasoKit';
import type { PasoProps } from './pasoKit';
import { API_BASE } from '../config';
import type { Toma } from '../lib/comercial';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', giro: 'Giro', gag: 'Remate', cta: 'CTA' };
const roleKind = (r: string) => (r === 'hook' ? 'hook' : r === 'cta' ? 'cta' : (r === 'gag' || r === 'giro') ? 'gag' : 'mid');
const DUR_TOLERANCIA = 1.5;

export default function CrudosFlow({ project, comercial, setComercial }: Pick<PasoProps, 'project' | 'comercial' | 'setComercial'>) {
  // sólo las escenas filmadas: las de pantalla llevan mockup (paso Mockups) y la cta es la placa del montaje
  const escenas = (comercial?.storyboard || []).filter((e) => !e.pantalla && e.rol !== 'cta');
  const tomas = (comercial?.rodaje || []).filter((t) => t.origen !== 'mockup');
  const [busyN, setBusyN] = useState<number | null>(null);
  const [error, setError] = useState('');
  const inputs = useRef<Record<number, HTMLInputElement | null>>({});
  if (!escenas.length) return null;

  const tomasDe = (n: number) => tomas.filter((t) => t.escenaN === n);
  const activaDe = (n: number): Toma | undefined => { const ts = tomasDe(n); return ts[ts.length - 1]; };

  const importar = async (escenaN: number, file: File) => {
    if (!comercial) return;
    setBusyN(escenaN); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(project.id)}/assets`, { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo subir el clip');
      // WO-6b/D8: snapshot del prompt de Flow que originó este clip (el pack puede regenerarse; la toma lo preserva)
      const promptUsado = comercial.packFlow?.escenas.find((e) => e.escenaN === escenaN)?.prompt;
      const toma: Toma = { id: `toma-${escenaN}-${Date.now().toString(36)}`, escenaN, fileRef: d.asset.fileRef, durSec: d.asset.duration_sec || 0, origen: 'archivo', ...(promptUsado ? { promptUsado } : {}) };
      setComercial((c) => {
        const rodaje = [...(c.rodaje || []), toma];
        const packFlow = c.packFlow
          ? { ...c.packFlow, escenas: (c.packFlow.escenas ?? []).map((k) => (k.escenaN === escenaN ? { ...k, estado: 'importado' as const, tomaId: toma.id } : k)) }
          : c.packFlow;
        return { ...c, rodaje, packFlow, estados: { ...c.estados, rodaje: c.estados.rodaje === 'aprobado' ? 'aprobado' : 'generado' } };
      });
    } catch (e) { setError(errMsg(e)); } finally { setBusyN(null); }
  };
  // elegir una variante como activa = moverla al final (la última de su escena queda activa)
  const usarToma = (t: Toma) => setComercial((c) => ({ ...c, rodaje: [...(c.rodaje || []).filter((x) => x.id !== t.id), t] }));
  const conClip = escenas.filter((e) => activaDe(e.n)).length;

  return (
    <div className="paso-card" style={{ marginTop: 14 }}>
      <div className="paso-card-h">Los crudos de Flow · {conClip}/{escenas.length} escenas con clip</div>
      <p className="paso-sub" style={{ marginTop: 4 }}>El clip de cada escena filmada. La rutina de Flow los baja solos; si bajaste uno a mano, arrastralo a su escena.</p>
      {error && <div className="paso-error">{error}</div>}
      <div className="rodaje-bins" style={{ marginTop: 8 }}>
        {escenas.map((e) => {
          const act = activaDe(e.n);
          const variantes = tomasDe(e.n);
          const warn = act && act.durSec > 0 && Math.abs(act.durSec - e.durSec) > DUR_TOLERANCIA;
          const soltar = (ev: React.DragEvent) => { ev.preventDefault(); const f = ev.dataTransfer.files?.[0]; if (f && f.type.startsWith('video/')) importar(e.n, f); };
          return (
            <article key={e.n} className={`rodaje-bin${act ? ' rodaje-bin--filled' : ''}`}>
              <div className="rodaje-bin-top">
                <span className="rodaje-bin-n">#{e.n}</span>
                <span className={`paso-role paso-role--${roleKind(e.rol)}`}>{ROL_LABEL[e.rol] || e.rol}</span>
                <span className="paso-t">{e.durSec}s</span>
                <span className={`pack-estado pack-estado--${act ? 'importado' : 'pendiente'}`}>{act ? 'listo' : 'falta'}</span>
              </div>
              {act ? (
                <>
                  <video className="rodaje-video rodaje-bin-video" src={`${API_BASE}/api/storage/${act.fileRef}`} controls playsInline preload="metadata" />
                  {act.durSec > 0 && <div className={warn ? 'rodaje-dur rodaje-dur--warn' : 'rodaje-dur'}>clip {act.durSec.toFixed(1)}s{warn ? ` · la escena pide ${e.durSec}s` : ''}</div>}
                  <button className="rodaje-import rodaje-bin-replace" onClick={() => inputs.current[e.n]?.click()} disabled={busyN === e.n} onDragOver={(ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; }} onDrop={soltar}>
                    {busyN === e.n ? <Loader2 size={13} className="paso-spin" /> : <Check size={13} />} {busyN === e.n ? 'Subiendo…' : 'Reemplazar'}
                  </button>
                </>
              ) : (
                <button className="rodaje-drop" onClick={() => inputs.current[e.n]?.click()} disabled={busyN === e.n} onDragOver={(ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; }} onDrop={soltar}>
                  {busyN === e.n ? <Loader2 size={22} className="paso-spin" /> : <Upload size={22} />}
                  <span className="rodaje-drop-t">{busyN === e.n ? 'Subiendo…' : 'Importar clip o arrastralo acá'}</span>
                  <span className="rodaje-drop-sub">escena #{e.n} · {e.durSec}s objetivo</span>
                </button>
              )}
              {e.dialogo && <div className="rodaje-bin-dlg">{e.dialogo}</div>}
              <input ref={(el) => { inputs.current[e.n] = el; }} type="file" accept="video/*" hidden onChange={(ev) => { const f = ev.target.files?.[0]; if (f) importar(e.n, f); ev.target.value = ''; }} />
              {variantes.length > 1 && (
                <div className="rodaje-variantes">
                  {variantes.map((t, i) => (
                    <button key={t.id} className={t.id === act?.id ? 'rodaje-var rodaje-var--on' : 'rodaje-var'} onClick={() => usarToma(t)}>toma {i + 1}{t.id === act?.id ? ' (activa)' : ''}</button>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
