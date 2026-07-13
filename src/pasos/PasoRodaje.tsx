// Paso 7 — RODAJE (solo filmado). Un BIN por escena del storyboard: importás el clip que bajaste
// de Flow → POST /api/projects/<id>/assets (server/storage, con duración real por ffprobe) → se crea
// la Toma vinculada a la escena y el clip del pack pasa a 'importado'. Preview inline + aviso de duración.
import { useRef, useState } from 'react';
import { Upload, Loader2, Check, Video, ArrowRight } from 'lucide-react';
import { errMsg, PasoEmpty } from './pasoKit';
import type { PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
import { API_BASE } from '../config';
import type { Toma } from '../lib/comercial';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', gag: 'Remate', cta: 'CTA' };
const roleKind = (r: string) => (r === 'hook' ? 'hook' : r === 'cta' ? 'cta' : r === 'gag' ? 'gag' : 'mid');
const DUR_TOLERANCIA = 1.5;

export default function PasoRodaje({ project, comercial, setComercial, goNext }: PasoProps) {
  const escenas = comercial?.storyboard || [];
  const tomas = comercial?.rodaje || [];
  const [busyN, setBusyN] = useState<number | null>(null);
  const [error, setError] = useState('');
  const inputs = useRef<Record<number, HTMLInputElement | null>>({});

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
      // WO-6b/D8: snapshot del prompt de Flow que originó este clip (dato histórico — el packFlow puede
      // regenerarse después, pero la toma preserva el prompt con el que se generó).
      const promptUsado = comercial.packFlow?.escenas.find((e) => e.escenaN === escenaN)?.prompt;
      const toma: Toma = { id: `toma-${escenaN}-${Date.now().toString(36)}`, escenaN, fileRef: d.asset.fileRef, durSec: d.asset.duration_sec || 0, ...(promptUsado ? { promptUsado } : {}) };
      setComercial((c) => {
        const rodaje = [...(c.rodaje || []), toma];
        const packFlow = c.packFlow
          ? { ...c.packFlow, escenas: (c.packFlow.escenas ?? []).map((k) => (k.escenaN === escenaN ? { ...k, estado: 'importado' as const, tomaId: toma.id } : k)) }
          : c.packFlow;
        return { ...c, rodaje, packFlow, estados: { ...c.estados, rodaje: c.estados.rodaje === 'aprobado' ? 'aprobado' : 'generado' } };
      });
    } catch (e) { setError(errMsg(e)); } finally { setBusyN(null); }
  };

  // elegir una variante como activa = moverla al final (la última de su escena queda activa).
  const usarToma = (t: Toma) =>
    setComercial((c) => ({ ...c, rodaje: [...(c.rodaje || []).filter((x) => x.id !== t.id), t] }));

  return (
    <div className="paso">
      <div className="paso-head">
        <div className="paso-head-txt">
          <h2 className="paso-title">Rodaje</h2>
          <p className="paso-sub">Importá los clips que bajaste de Flow; cada uno se vincula a su escena para el montaje.</p>
        </div>
      </div>
      {error && <div className="paso-error">{error}</div>}
      <div className="paso-body">
        {escenas.length > 0 ? (
          <div className="rodaje-bins">
            {escenas.map((e) => {
              const act = activaDe(e.n);
              const variantes = tomasDe(e.n);
              const warn = act && act.durSec > 0 && Math.abs(act.durSec - e.durSec) > DUR_TOLERANCIA;
              return (
                <article key={e.n} className={`rodaje-bin${act ? ' rodaje-bin--filled' : ''}`}>
                  <div className="rodaje-bin-top">
                    <span className="rodaje-bin-n">#{e.n}</span>
                    <span className={`paso-role paso-role--${roleKind(e.rol)}`}>{ROL_LABEL[e.rol] || e.rol}</span>
                    <span className="paso-t">{e.durSec}s</span>
                    <span className={`pack-estado pack-estado--${act ? 'importado' : 'pendiente'}`}>{act ? 'importado' : 'pendiente'}</span>
                  </div>

                  {act ? (
                    <>
                      <video className="rodaje-video rodaje-bin-video" src={`${API_BASE}/api/storage/${act.fileRef}`} controls playsInline preload="metadata" />
                      {act.durSec > 0 && (
                        <div className={warn ? 'rodaje-dur rodaje-dur--warn' : 'rodaje-dur'}>
                          clip {act.durSec.toFixed(1)}s{warn ? ` · la escena pide ${e.durSec}s` : ''}
                        </div>
                      )}
                      <button className="rodaje-import rodaje-bin-replace" onClick={() => inputs.current[e.n]?.click()} disabled={busyN === e.n}>
                        {busyN === e.n ? <Loader2 size={13} className="paso-spin" /> : <Check size={13} />} {busyN === e.n ? 'Subiendo…' : 'Reemplazar'}
                      </button>
                    </>
                  ) : (
                    <button className="rodaje-drop" onClick={() => inputs.current[e.n]?.click()} disabled={busyN === e.n}>
                      {busyN === e.n ? <Loader2 size={22} className="paso-spin" /> : <Upload size={22} />}
                      <span className="rodaje-drop-t">{busyN === e.n ? 'Subiendo…' : 'Importar clip'}</span>
                      <span className="rodaje-drop-sub">escena #{e.n} · {e.durSec}s objetivo</span>
                    </button>
                  )}

                  {e.dialogo && <div className="rodaje-bin-dlg">{e.dialogo}</div>}

                  <input
                    ref={(el) => { inputs.current[e.n] = el; }}
                    type="file" accept="video/*" hidden
                    onChange={(ev) => { const f = ev.target.files?.[0]; if (f) importar(e.n, f); ev.target.value = ''; }}
                  />

                  {variantes.length > 1 && (
                    <div className="rodaje-variantes">
                      {variantes.map((t, i) => (
                        <button key={t.id} className={t.id === act?.id ? 'rodaje-var rodaje-var--on' : 'rodaje-var'} onClick={() => usarToma(t)}>
                          toma {i + 1}{t.id === act?.id ? ' (activa)' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <PasoEmpty icon={Video}>Primero generá el storyboard y el pack: acá vas a importar el clip que bajaste de Flow por cada escena.</PasoEmpty>
        )}
      </div>
      <div className="paso-foot paso-foot--split">
        <span className="paso-estado">{estadoDelPaso('rodaje', comercial)}</span>
        <button className="paso-approve" disabled={!tomas.length} onClick={goNext}>
          Rodaje listo, al montaje <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
