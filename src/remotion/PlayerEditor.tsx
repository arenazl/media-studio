// Vista previa del EDITOR multipista: la misma composición que el render (Comercial.tsx), armada con el plan que sale
// del draft de pistas, así lo que se ve y se oye en el editor es lo que se exporta (audio de los clips, música, mockups
// encima, transiciones, subtítulos y placa). El Player es el reloj: avisa cada cuadro y el editor mueve el cabezal; en
// pausa, el cabezal de la timeline lo posiciona. Play/pausa se piden al Player DESDE el click (apiRef.toggle(e)): si el
// play sale de un efecto, Chrome puede no dejar sonar el audio.
import { useEffect, useMemo, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { API_BASE } from '../config';
import type { MontajePlan } from '../lib/montajePlan';
import { Comercial } from './Comercial';
import { derivarRender } from './derivar';

export interface PlayerEditorProps {
  plan: MontajePlan;
  playheadSec: number;
  apiRef: React.MutableRefObject<PlayerRef | null>;
  onTime: (sec: number) => void;
  onPlayingChange: (playing: boolean) => void;
}

export default function PlayerEditor({ plan, playheadSec, apiRef, onTime, onPlayingChange }: PlayerEditorProps) {
  const ref = useRef<PlayerRef>(null);
  const r = useMemo(() => derivarRender(plan, API_BASE), [plan]);
  const inputProps = useMemo(() => ({ plan, base: API_BASE }), [plan]);
  const fps = r.fps;
  const cb = useRef({ onTime, onPlayingChange });
  cb.current = { onTime, onPlayingChange };

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    apiRef.current = p;
    const onFrame = (e: { detail: { frame: number } }) => cb.current.onTime(e.detail.frame / fps);
    const onPlay = () => cb.current.onPlayingChange(true);
    const onPause = () => cb.current.onPlayingChange(false);
    p.addEventListener('frameupdate', onFrame);
    p.addEventListener('play', onPlay);
    p.addEventListener('pause', onPause);
    p.addEventListener('ended', onPause);
    return () => {
      p.removeEventListener('frameupdate', onFrame); p.removeEventListener('play', onPlay);
      p.removeEventListener('pause', onPause); p.removeEventListener('ended', onPause);
      if (apiRef.current === p) apiRef.current = null;
    };
  }, [fps, apiRef]);

  // en pausa, el cabezal manda (click o arrastre en la timeline)
  useEffect(() => {
    const p = ref.current;
    if (!p || p.isPlaying()) return;
    const f = Math.min(r.totalFrames - 1, Math.max(0, Math.round(playheadSec * fps)));
    if (p.getCurrentFrame() !== f) p.seekTo(f);
  }, [playheadSec, fps, r.totalFrames]);

  return (
    <Player
      ref={ref}
      component={Comercial}
      inputProps={inputProps}
      durationInFrames={r.totalFrames}
      fps={fps}
      compositionWidth={r.width}
      compositionHeight={r.height}
      acknowledgeRemotionLicense
      clickToPlay={false}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
