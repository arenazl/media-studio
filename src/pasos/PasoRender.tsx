// Paso 6b — RENDER animado (solo tipo 'animado'). El storyboard (orientado a pantalla) se renderiza
// DIRECTO como reel animado (server/mockupReel.mjs, Playwright + ffmpeg), se persiste y queda en
// comercial.renderRef → habilita el MONTAJE (voz + música sobre el render, igual que filmado).
import { useState } from 'react';
import { Loader2, Clapperboard } from 'lucide-react';
import { API_BASE } from '../config';
import { errMsg, type PasoProps } from './pasoKit';
import { escenasToSlides } from '../lib/montajePlan';

export default function PasoRender({ project, reelId, comercial, setComercial, goNext }: PasoProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const renderRef = comercial?.renderRef;
  const escenas = comercial?.storyboard || [];

  const render = async () => {
    if (!comercial) return;
    setBusy(true); setError('');
    try {
      const bk = project.brandKit as { color?: string; logoSvg?: string } | undefined;
      const brand = { name: project.name, colors: { accent: bk?.color }, logo: bk?.logoSvg ? { svg: bk.logoSvg } : undefined };
      const slides = escenasToSlides(comercial);
      const r = await fetch(`${API_BASE}/api/mockup-reel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides, brand, projectId: project.id, reelId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'no se pudo renderizar el reel animado');
      setComercial((c) => ({ ...c, renderRef: d.fileRef, estados: { ...c.estados, render: c.estados.render === 'aprobado' ? 'aprobado' : 'generado' } }));
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="paso">
      <div className="paso-head">
        <div className="paso-head-txt">
          <h2 className="paso-title">Render animado</h2>
          <p className="paso-sub">El storyboard se renderiza directo como reel animado de las pantallas del producto (sin filmar).</p>
        </div>
        <button className="paso-gen" onClick={render} disabled={busy || !escenas.length}>
          {busy ? <Loader2 size={15} className="paso-spin" /> : <Clapperboard size={15} />}
          {busy ? 'Renderizando…' : renderRef ? 'Regenerar el reel' : 'Renderizar el reel'}
        </button>
      </div>
      {error && <div className="paso-error">{error}</div>}
      <div className="paso-body">
        {!escenas.length && <div className="paso-empty">Primero generá el storyboard (animado).</div>}
        {renderRef ? (
          <div className="paso-card mont-result">
            <div className="paso-card-h">Reel animado</div>
            <video className="rodaje-video mont-video" src={`${API_BASE}/api/storage/${renderRef}`} controls playsInline preload="metadata" />
          </div>
        ) : escenas.length ? (
          <div className="paso-empty">Tocá «Renderizar el reel» para armar el animado desde el storyboard.</div>
        ) : null}
      </div>
      {renderRef && (
        <div className="paso-foot">
          <button className="paso-approve" onClick={goNext}>Render listo, al montaje →</button>
        </div>
      )}
    </div>
  );
}
