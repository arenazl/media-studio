// Raíz de Remotion (la lee el empaquetador del servidor). La duración, el fps y el tamaño salen del plan.
import { Composition } from 'remotion';
import { Comercial, type ComercialProps } from './Comercial';
import { Mockups, type MockupsProps } from './Mockups';
import { MunifyTarjetas, type TarjetasProps, type PlanTarjetas } from './munify/Tarjetas';
import planMunify from './munify/plan-munify.json';
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
    <Composition
      id="MunifyTarjetas"
      component={MunifyTarjetas}
      defaultProps={{ plan: planMunify as unknown as PlanTarjetas }}
      durationInFrames={30}
      fps={30}
      width={1080}
      height={1920}
      calculateMetadata={({ props }: { props: TarjetasProps }) => {
        const fps = props.plan.fps || 30;
        const total = props.plan.escenas.reduce((n, e) => n + Math.round(e.durSec * fps), 0) + Math.round(props.plan.placa.durSec * fps);
        return { durationInFrames: Math.max(1, total), fps, width: props.plan.width, height: props.plan.height };
      }}
    />
  </>
);
