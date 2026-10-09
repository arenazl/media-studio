// Raíz de Remotion (la lee el empaquetador del servidor). La duración, el fps y el tamaño salen del plan.
import { Composition } from 'remotion';
import { Comercial, type ComercialProps } from './Comercial';
import { derivarRender } from './derivar';
import type { MontajePlan } from '../lib/montajePlan';

const PLAN_VACIO: MontajePlan = { width: 1080, height: 1920, fps: 30, scenes: [], silences: [], texts: [] };

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Comercial"
    component={Comercial}
    defaultProps={{ plan: PLAN_VACIO, base: '' }}
    durationInFrames={30}
    fps={30}
    width={1080}
    height={1920}
    calculateMetadata={({ props }: { props: ComercialProps }) => {
      const r = derivarRender(props.plan, props.base || '');
      return { durationInFrames: r.totalFrames, fps: r.fps, width: r.width, height: r.height };
    }}
  />
);
