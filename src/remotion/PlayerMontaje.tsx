// Vista previa EXACTA del montaje: el Player corre la misma composición que renderiza el servidor.
import { useMemo } from 'react';
import { Player } from '@remotion/player';
import { API_BASE } from '../config';
import type { MontajePlan } from '../lib/montajePlan';
import { Comercial } from './Comercial';
import { derivarRender } from './derivar';

export default function PlayerMontaje({ plan }: { plan: MontajePlan }) {
  const r = useMemo(() => derivarRender(plan, API_BASE), [plan]);
  const inputProps = useMemo(() => ({ plan, base: API_BASE }), [plan]);
  return (
    <Player
      component={Comercial}
      inputProps={inputProps}
      durationInFrames={r.totalFrames}
      fps={r.fps}
      compositionWidth={r.width}
      compositionHeight={r.height}
      controls
      acknowledgeRemotionLicense
      style={{ width: '100%', aspectRatio: `${r.width} / ${r.height}`, borderRadius: 12, overflow: 'hidden', background: '#000' }}
    />
  );
}
