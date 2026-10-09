// Vista previa EXACTA del reel de mockups: el Player corre la misma composición que renderiza el servidor.
import { useMemo } from 'react';
import { Player } from '@remotion/player';
import { API_BASE } from '../config';
import type { PlanMockup } from '../lib/montajePlan';
import { Mockups } from './Mockups';
import { derivarMockups } from './derivarMockups';

export default function PlayerMockups({ plan }: { plan: PlanMockup }) {
  const r = useMemo(() => derivarMockups(plan, API_BASE), [plan]);
  const inputProps = useMemo(() => ({ plan, base: API_BASE }), [plan]);
  return (
    <Player
      component={Mockups}
      inputProps={inputProps}
      durationInFrames={r.totalFrames}
      fps={r.fps}
      compositionWidth={r.width}
      compositionHeight={r.height}
      controls
      loop
      acknowledgeRemotionLicense
      style={{ width: '100%', aspectRatio: `${r.width} / ${r.height}`, borderRadius: 12, overflow: 'hidden', background: '#000' }}
    />
  );
}
