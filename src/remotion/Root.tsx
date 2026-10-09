// Raíz de Remotion (la lee el empaquetador del servidor). La duración, el fps y el tamaño salen del plan.
import { Composition } from 'remotion';
import { Comercial, type ComercialProps } from './Comercial';
import { Mockups, type MockupsProps } from './Mockups';
import { derivarRender } from './derivar';
import { derivarMockups } from './derivarMockups';
import { ESTILO_OSCURO } from '../lib/mockups';
import type { MontajePlan, PlanMockup } from '../lib/montajePlan';

const PLAN_VACIO: MontajePlan = { width: 1080, height: 1920, fps: 30, scenes: [], silences: [], texts: [] };
const MOCKUPS_VACIO: PlanMockup = { width: 1080, height: 1920, fps: 30, escenas: [], marca: { nombre: '', estilo: ESTILO_OSCURO } };

export const RemotionRoot: React.FC = () => (
  <>
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
    <Composition
      id="Mockups"
      component={Mockups}
      defaultProps={{ plan: MOCKUPS_VACIO, base: '' }}
      durationInFrames={30}
      fps={30}
      width={1080}
      height={1920}
      calculateMetadata={({ props }: { props: MockupsProps }) => {
        const r = derivarMockups(props.plan, props.base || '');
        return { durationInFrames: r.totalFrames, fps: r.fps, width: r.width, height: r.height };
      }}
    />
  </>
);
