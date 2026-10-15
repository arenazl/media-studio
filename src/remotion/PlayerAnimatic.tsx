// Reproducción in situ. No exporta ni hace solicitudes a Flow.
import { Player } from '@remotion/player';
import { Animatic } from './Animatic';
import type { PlanAnimatic } from '../lib/preproduccion';

export default function PlayerAnimatic({ plan }: { plan: PlanAnimatic }) {
  const durationInFrames = Math.max(1, plan.escenas.reduce((n, e) => n + Math.max(1, Math.ceil(e.durSec * plan.fps)), 0));
  return (
    <Player component={Animatic} inputProps={{ plan }}
      compositionWidth={plan.width} compositionHeight={plan.height}
      fps={plan.fps} durationInFrames={durationInFrames}
      controls allowFullscreen acknowledgeRemotionLicense
      style={{ width: '100%', aspectRatio: `${plan.width} / ${plan.height}`, borderRadius: 12, overflow: 'hidden', background: '#100e16' }}
    />
  );
}
