// Paso 9 — PUBLICAR. Corre el molde `publish` (PERSISTIENDO el resultado, que antes se perdía) y
// muestra el paquete final: caption/hashtags/CTA con Copiar + el mp4 exportado del montaje.
import { useState } from 'react';
import { Copy, Check, Download, Megaphone, Film } from 'lucide-react';
import { PasoShell, PasoEmpty, runMolde, errMsg, type PasoProps } from './pasoKit';
import { API_BASE } from '../config';
import type { PublishPack } from '../lib/comercial';
import type { MontajeState } from '../lib/montajePlan';

export default function PasoPublicar({ project, comercial, setComercial }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const pub = comercial?.publicacion;
  const exports = (comercial?.montaje as MontajeState | undefined)?.exports || [];
  const ultimo = exports[exports.length - 1];

  const generar = async () => {
    setBusy(true); setError('');
    try {
      const narr = comercial?.guion?.blocks?.map((b) => b.narration).filter(Boolean) || [];
      const res = await runMolde('publish', project, { guion: narr, objetivo: comercial?.concepto?.idea }, { red: 'instagram' });
      setComercial((c) => ({ ...c, publicacion: res as unknown as PublishPack, estados: { ...c.estados, publicar: c.estados.publicar === 'aprobado' ? 'aprobado' : 'generado' } }));
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
    setCopied(id); setTimeout(() => setCopied(''), 2000);
  };
  const CopyBtn = ({ id, text }: { id: string; text: string }) => (
    <button className="pub-copy" onClick={() => copy(id, text)}>
      {copied === id ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
    </button>
  );

  return (
    <PasoShell
      titulo="Publicar" sub="El copy del posteo + el paquete final (mp4 + texto) para subir a la red."
      hasContent={!!pub} busy={busy} onGenerate={generar} error={error}
      functionId="publish"
    >
      {pub ? (
        <div className="pub-grid">
          {pub.hookOnScreen && (
            <div className="pub-card">
              <div className="pub-card-h"><span>Hook en pantalla · primeros 2s</span><CopyBtn id="hook" text={pub.hookOnScreen} /></div>
              <p className="pub-card-body">{pub.hookOnScreen}</p>
            </div>
          )}
          <div className="pub-card">
            <div className="pub-card-h"><span>Caption</span><CopyBtn id="cap" text={pub.caption} /></div>
            <p className="pub-card-body">{pub.caption}</p>
          </div>
          {!!pub.hashtags?.length && (
            <div className="pub-card">
              <div className="pub-card-h"><span>Hashtags</span><CopyBtn id="ht" text={pub.hashtags.join(' ')} /></div>
              <div className="pub-tags">
                {pub.hashtags.map((h, i) => <span key={i} className="pub-tag">{h.startsWith('#') ? h : `#${h}`}</span>)}
              </div>
            </div>
          )}
          {pub.cta && (
            <div className="pub-card">
              <div className="pub-card-h"><span>CTA</span><CopyBtn id="cta" text={pub.cta} /></div>
              <p className="pub-card-body">{pub.cta}</p>
            </div>
          )}
        </div>
      ) : (
        !busy && <PasoEmpty icon={Megaphone}>Generá el copy de publicación para la red elegida: hook en pantalla, caption, hashtags y CTA listos para copiar.</PasoEmpty>
      )}

      {ultimo && (
        <div className="mont-export-card">
          <div className="paso-card-h"><Film size={12} /> Paquete final — el comercial{exports.length > 1 ? ` (${exports.length} exports)` : ''}</div>
          <div className="mont-export-frame">
            <video className="mont-export-video" src={`${API_BASE}/api/storage/${ultimo.fileRef}`} controls playsInline preload="metadata" />
          </div>
          <a className="pack-export" href={`${API_BASE}/api/storage/${ultimo.fileRef}`} download><Download size={14} /> Descargar el comercial</a>
        </div>
      )}
    </PasoShell>
  );
}
