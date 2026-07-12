// Stage central: frame compuesto (video + overlays de texto + CTA + logo + safe-area) + transport
// (prototipo líneas 897-926). El clip de video se muestra con un <video> real cuando hay fileRef —
// NO es un compositor frame-accurate (eso mezclaría escenas/transiciones/textos en un único canvas,
// que es la "composición final" que REGLAS-IMPLEMENTACION.md pide no inventar); es una vista previa
// honesta: reproduce el clip activo y superpone los overlays reales encima.
import { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { API_BASE } from './config';
import type { EditorClip } from './lib/editorTracks';
import type { BrandKit } from './lib/brandKit';
import './EditorPreview.css';

const fmt = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export interface EditorPreviewProps {
  aspect: string;
  playing: boolean;
  onTogglePlay: () => void;
  onStepScene: (dir: 1 | -1) => void;
  playheadSec: number;
  totalSec: number;
  currentVideoClip?: EditorClip;
  activeTexts: EditorClip[];
  cta?: string;
  brandKit?: BrandKit;
}

export default function EditorPreview({
  aspect, playing, onTogglePlay, onStepScene, playheadSec, totalSec, currentVideoClip, activeTexts, cta, brandKit,
}: EditorPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) void v.play().catch(() => { /* autoplay bloqueado — el usuario ya clickeó play */ });
    else v.pause();
  }, [playing, currentVideoClip?.id]);

  const sceneRange = currentVideoClip
    ? `Escena · ${fmt(currentVideoClip.startSec)}–${fmt(currentVideoClip.startSec + currentVideoClip.durSec)}`
    : 'Sin clip en este instante';

  return (
    <div className="editor-stage">
      <div className="ed-frame">
        {currentVideoClip?.fileRef ? (
          <video
            key={currentVideoClip.fileRef}
            ref={videoRef}
            className="ed-frame-video"
            src={`${API_BASE}/api/storage/${currentVideoClip.fileRef}`}
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="ed-frame-placeholder" />
        )}
        <div className="ed-frame-shade" />

        {activeTexts.map((t) => (
          <span
            key={t.id}
            className="ed-frame-text"
            style={{ left: `${(t.nx ?? 0.5) * 100}%`, top: `${(t.ny ?? 0.21) * 100}%` }}
          >
            {t.label}
          </span>
        ))}

        {cta && <span className="ed-frame-cta">{cta}</span>}
        {brandKit?.logoUrl && (
          <img className={`ed-frame-logo ed-frame-logo--${brandKit.logoPos || 'tr'}`} src={brandKit.logoUrl} alt="" />
        )}

        <div className="ed-frame-safe" />
        <button className="ed-frame-play" onClick={onTogglePlay} title={playing ? 'Pausar' : 'Reproducir'}>
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <span className="ed-frame-badge ed-frame-badge--tl">{sceneRange}</span>
        <span className="ed-frame-badge ed-frame-badge--tr">{aspect}</span>
      </div>

      <div className="ed-transport">
        <button className="ed-transport-step" onClick={() => onStepScene(-1)} title="Escena anterior"><SkipBack size={14} /></button>
        <button className="ed-transport-play" onClick={onTogglePlay} title={playing ? 'Pausar' : 'Reproducir'}>
          {playing ? <Pause size={13} /> : <Play size={13} />}
        </button>
        <button className="ed-transport-step" onClick={() => onStepScene(1)} title="Escena siguiente"><SkipForward size={14} /></button>
        <span className="ed-transport-time">{fmt(playheadSec)} <span className="ed-transport-total">/ {fmt(totalSec)}</span></span>
      </div>
    </div>
  );
}
