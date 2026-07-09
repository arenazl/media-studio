// Paso 7 — RODAJE (solo filmado). Una fila por escena del storyboard: importás el clip que bajaste
// de Flow → POST /api/projects/<id>/assets (server/storage, con duración real por ffprobe) → se crea
// la Toma vinculada a la escena y el clip del pack pasa a 'importado'. Preview inline + aviso de duración.
import { useRef, useState } from 'react';
import { Upload, Loader2, Check } from 'lucide-react';
import { errMsg } from './pasoKit';
import type { PasoProps } from './pasoKit';
import { API_BASE } from '../config';
import type { Toma } from '../lib/comercial';

const ROL_LABEL: Record<string, string> = { hook: 'Hook', desarrollo: 'Desarrollo', gag: 'Remate', cta: 'CTA' };
const roleClass = (r: string) => (r === 'hook' ? 'paso-role--hook' : r === 'cta' ? 'paso-role--cta' : 'paso-role--mid');
const DUR_TOLERANCIA = 1.5;

export default function PasoRodaje({ project, comercial, setComercial, goNext }: PasoProps) {
  const escenas = comercial?.storyboard || [];
  const tomas = comercial?.rodaje || [];
  const [busyN, setBusyN] = useState<number | null>(null);
  const [error, setError] = useState('');
  const inputs = useRef<Record<number, HTMLInputElement | null>>({});

  const tomasDe = (n: number) => tomas.filter((t) => t.escenaN === n);
  const activaDe = (n: number): Toma | undefined => { const ts = tomasDe(n); return ts[ts.length - 1]; };
  const conClip = escenas.filter((e) => tomasDe(e.n).length > 0).length;

  const importar = async (escenaN: number, file: File) => {
    if (!comercial) return;
    setBusyN(escenaN); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(project.id)}/assets`, { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo subir el clip');
      const toma: Toma = { id: `toma-${escenaN}-${Date.now().toString(36)}`, escenaN, fileRef: d.asset.fileRef, durSec: d.asset.duration_sec || 0 };
      setComercial((c) => {
        const rodaje = [...(c.rodaje || []), toma];
        const packFlow = c.packFlow
          ? { ...c.packFlow, clips: c.packFlow.clips.map((k) => (k.escenaN === escenaN ? { ...k, estado: 'importado' as const, tomaId: toma.id } : k)) }
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
        <span className="pack-prog">{conClip}/{escenas.length} escenas con clip</span>
      </div>
      {error && <div className="paso-error">{error}</div>}
      <div className="paso-body">
        {escenas.map((e) => {
          const act = activaDe(e.n);
          const variantes = tomasDe(e.n);
          const warn = act && act.durSec > 0 && Math.abs(act.durSec - e.durSec) > DUR_TOLERANCIA;
          return (
            <article key={e.n} className="paso-scene">
              <div className="paso-scene-h">
                <span className="paso-scene-n">#{e.n}</span>
                <span className={`paso-role ${roleClass(e.rol)}`}>{ROL_LABEL[e.rol] || e.rol}</span>
                <span className="paso-t">{e.durSec}s</span>
                <span className={`pack-estado pack-estado--${act ? 'importado' : 'pendiente'}`}>{act ? 'importado' : 'pendiente'}</span>
                <button className="rodaje-import" onClick={() => inputs.current[e.n]?.click()} disabled={busyN === e.n}>
                  {busyN === e.n ? <Loader2 size={13} className="paso-spin" /> : act ? <Check size={13} /> : <Upload size={13} />}
                  {busyN === e.n ? 'Subiendo…' : act ? 'Reemplazar' : 'Importar clip'}
                </button>
                <input
                  ref={(el) => { inputs.current[e.n] = el; }}
                  type="file" accept="video/*" hidden
                  onChange={(ev) => { const f = ev.target.files?.[0]; if (f) importar(e.n, f); ev.target.value = ''; }}
                />
              </div>
              {e.dialogo && <div className="paso-block-visual">{e.dialogo}</div>}
              {act && <video className="rodaje-video" src={`${API_BASE}/api/storage/${act.fileRef}`} controls playsInline preload="metadata" />}
              {act && act.durSec > 0 && (
                <div className={warn ? 'rodaje-dur rodaje-dur--warn' : 'rodaje-dur'}>
                  clip: {act.durSec.toFixed(1)}s{warn ? ` — la escena pide ${e.durSec}s (se ajusta en el montaje o regenerá en Flow)` : ''}
                </div>
              )}
              {variantes.length > 1 && (
                <div className="rodaje-variantes">
                  {variantes.length} tomas:
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
        {!escenas.length && <div className="paso-empty">Primero generá el storyboard y el pack.</div>}
      </div>
      <div className="paso-foot">
        <button className="paso-approve" disabled={!tomas.length} onClick={goNext}>Rodaje listo, al montaje →</button>
      </div>
    </div>
  );
}
