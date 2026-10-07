// Paso 6b — RENDER animado (solo tipo 'animado'). El storyboard (orientado a pantalla) se renderiza
// DIRECTO como reel animado (server/mockupReel.mjs, Playwright + ffmpeg), se persiste y queda en
// comercial.renderRef → habilita el MONTAJE (voz + música sobre el render, igual que filmado).
import { useState } from 'react';
import { Loader2, Clapperboard, Film, ArrowRight } from 'lucide-react';
import { API_BASE } from '../config';
import { errMsg, PasoEmpty, type PasoProps } from './pasoKit';
import { estadoDelPaso } from '../lib/pasoEstado';
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
      const mk = (project as any).marcaKit || {};
      const bk = (project.brandKit || {}) as { color?: string; logoSvg?: string; logoUrl?: string };
      const primaryColor = mk.colores?.primario || bk.color || '#7C3AED';
      const accentColor = mk.colores?.acento || '#F59E0B';
      const logoSvg = mk.logo?.svg || bk.logoSvg || '';
      const logoUrl = mk.logoUrl || bk.logoUrl || '';

      const brand = {
        name: project.name,
        colors: { primary: primaryColor, secondary: '#1E1B2E', accent: accentColor },
        logoSvg,
        logoUrl,
        logo: logoSvg ? { svg: logoSvg } : logoUrl ? { primary: logoUrl } : undefined,
      };

      const projScreens = (project.screens || project.screenshots || []) as any[];
      const rawSlides = escenasToSlides(comercial);
      const slides = rawSlides.map((s, idx) => {
        let cap = s.archivoCaptura;
        if (!cap && projScreens.length) {
          const match = projScreens.find((p) => (p.nombre && p.nombre === s.badge) || (p.label && p.label === s.badge)) || projScreens[idx % projScreens.length];
          cap = match?.archivo || match?.url || (typeof match === 'string' ? match : '');
        }
        return {
          ...s,
          image: cap,
          archivoCaptura: cap,
        };
      });

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
        <div className="paso-head-actions">
          <button className={renderRef && !busy ? 'paso-regen' : 'paso-gen'} onClick={render} disabled={busy || !escenas.length}>
            {busy ? <Loader2 size={15} className="paso-spin" /> : <Clapperboard size={15} />}
            {busy ? 'Renderizando…' : renderRef ? 'Regenerar el reel' : 'Renderizar el reel'}
          </button>
        </div>
      </div>
      {error && <div className="paso-error">{error}</div>}
      <div className="paso-body">
        {!escenas.length ? (
          <PasoEmpty icon={Film}>Primero generá el storyboard (animado) para poder renderizar el reel.</PasoEmpty>
        ) : renderRef ? (
          <div className="paso-card mont-result">
            <div className="paso-card-h">Reel animado</div>
            <video className="rodaje-video mont-video" src={`${API_BASE}/api/storage/${renderRef}`} controls playsInline preload="metadata" />
          </div>
        ) : (
          <PasoEmpty icon={Clapperboard}>Tocá «Renderizar el reel» para armar el animado desde el storyboard.</PasoEmpty>
        )}
      </div>
      <div className="paso-foot paso-foot--split">
        <span className="paso-estado">{estadoDelPaso('render', comercial)}</span>
        {renderRef && (
          <button className="paso-approve" onClick={goNext}>
            Render listo, al montaje <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
