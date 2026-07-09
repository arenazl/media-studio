// Paso 9 — PUBLICAR. Corre el molde `publish` (PERSISTIENDO el resultado, que antes se perdía) y
// muestra el paquete final: caption/hashtags/CTA con Copiar + el mp4 exportado del montaje.
import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { PasoShell, runMolde, errMsg, type PasoProps } from './pasoKit';
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
    setCopied(id); setTimeout(() => setCopied(''), 1400);
  };
  const ic = (id: string) => (copied === id ? <Check size={12} /> : <Copy size={12} />);

  return (
    <PasoShell
      titulo="Publicar" sub="El copy del posteo + el paquete final (mp4 + texto) para subir a la red."
      hasContent={!!pub} busy={busy} onGenerate={generar} error={error}
    >
      {pub ? (
        <div className="paso-cards">
          {pub.hookOnScreen && <div className="paso-card"><div className="paso-card-h">Hook en pantalla (primeros 2s)</div><p>{pub.hookOnScreen}</p></div>}
          <div className="paso-card">
            <div className="paso-card-h">Caption <button className="paso-icon" onClick={() => copy('cap', pub.caption)}>{ic('cap')}</button></div>
            <p>{pub.caption}</p>
          </div>
          {!!pub.hashtags?.length && (
            <div className="paso-card">
              <div className="paso-card-h">Hashtags <button className="paso-icon" onClick={() => copy('ht', pub.hashtags.join(' '))}>{ic('ht')}</button></div>
              <p>{pub.hashtags.join('  ')}</p>
            </div>
          )}
          {pub.cta && <div className="paso-card"><div className="paso-card-h">CTA</div><p>{pub.cta}</p></div>}
        </div>
      ) : (
        !busy && <div className="paso-empty">Generá el copy de publicación para la red elegida.</div>
      )}

      {ultimo && (
        <div className="paso-card mont-result">
          <div className="paso-card-h">Paquete final — el comercial{exports.length > 1 ? ` (${exports.length} exports)` : ''}</div>
          <video className="rodaje-video mont-video" src={`${API_BASE}/api/storage/${ultimo.fileRef}`} controls playsInline preload="metadata" />
          <a className="pack-export" href={`${API_BASE}/api/storage/${ultimo.fileRef}`} download><Download size={14} /> Descargar el comercial</a>
        </div>
      )}
    </PasoShell>
  );
}
