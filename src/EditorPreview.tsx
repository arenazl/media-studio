// Stage central: frame compuesto + transport (prototipo líneas 897-926). 2026-10-11 (Lucas: "no sale el audio"): con
// un plan armado, el frame es el Player de Remotion con la MISMA composición del render (lib remotion/Comercial.tsx):
// suena el audio de los clips y la música, se ven los mockups de su pista, las transiciones, los subtítulos y la placa.
// Antes era un <video> mudo del clip de la pista Video, sin nada de lo demás. Sin plan, queda el placeholder.
import { lazy, Suspense } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import type { EditorClip } from './lib/editorTracks';
import type { MontajePlan } from './lib/montajePlan';
import type { PlayerRef } from '@remotion/player';
import './EditorPreview.css';

// el Player entra sólo cuando se abre el editor: no va al bundle inicial
const PlayerEditor = lazy(() => import('./remotion/PlayerEditor'));

const fmt = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export interface EditorPreviewProps {
  aspect: string;
  playing: boolean;
  onTogglePlay: (e?: React.SyntheticEvent) => void;   // con el evento del click: el Player lo necesita para el audio
  onStepScene: (dir: 1 | -1) => void;
  playheadSec: number;
  totalSec: number;
  currentVideoClip?: EditorClip;   // la escena bajo el cabezal (filmada o mockup), para el rótulo
  activeTexts: EditorClip[];
  plan?: MontajePlan;              // el plan que sale del draft: con escenas, el frame es el Player del render
  playerApi: React.MutableRefObject<PlayerRef | null>;   // el editor le pide play/pausa al Player desde el click
  onTime: (sec: number) => void;   // el Player avisa cada cuadro mientras reproduce
  onPlayingChange: (playing: boolean) => void;
}

export default function EditorPreview({
  aspect, playing, onTogglePlay, onStepScene, playheadSec, totalSec, currentVideoClip, activeTexts, plan, playerApi, onTime, onPlayingChange,
}: EditorPreviewProps) {
  const sceneRange = currentVideoClip
    ? `${currentVideoClip.label} · ${fmt(currentVideoClip.startSec)}–${fmt(currentVideoClip.startSec + currentVideoClip.durSec)}`
    : 'Sin clip en este instante';
  const conPlayer = !!plan?.scenes.some((s) => s.src);

  return (
    <div className="editor-stage">
      <div className="ed-frame">
        {conPlayer ? (
          <div className="ed-frame-video">
            <Suspense fallback={<div className="ed-frame-placeholder" />}>
              <PlayerEditor plan={plan!} playheadSec={playheadSec} apiRef={playerApi} onTime={onTime} onPlayingChange={onPlayingChange} />
            </Suspense>
          </div>
        ) : (
          <div className="ed-frame-placeholder" />
        )}

        {/* los textos de la pista Texto todavía no los dibuja la composición: van encima como guía */}
        {activeTexts.map((t) => (
          <span
            key={t.id}
            className="ed-frame-text"
            style={{ left: `${(t.nx ?? 0.5) * 100}%`, top: `${(t.ny ?? 0.21) * 100}%` }}
          >
            {t.label}
          </span>
        ))}

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
