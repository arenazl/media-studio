// Animatic de preproducción, NO es el anuncio terminado.
// Capturas/mockups reales donde existan; si no, storyboard visual. Voz TTS opcional.
// Composición pura, reutilizable en el Player sin generar un MP4 ni gastar Flow.
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, useCurrentFrame } from 'remotion';
import type { PlanAnimatic, AnimaticSlide } from '../lib/preproduccion';

const borde = '1px solid rgba(255,255,255,.23)';
const Escena: React.FC<{ escena: AnimaticSlide; plan: PlanAnimatic; frames: number }> = ({ escena, plan, frames }) => {
  const f = useCurrentFrame();
  const avance = interpolate(f, [0, Math.max(1, frames - 1)], [1, 1.035], { extrapolateRight: 'clamp' });
  const u = plan.width / 1080;
  return (
    <AbsoluteFill style={{ background: '#100e16', color: '#fff', fontFamily: 'Arial, sans-serif', overflow: 'hidden' }}>
      {escena.video ? (
        <OffthreadVideo src={escena.video} muted style={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${avance})` }} />
      ) : escena.imagen ? (
        <Img src={escena.imagen} style={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${avance})` }} />
      ) : (
        <AbsoluteFill style={{ background: `radial-gradient(circle at 40% 30%, ${plan.color}55 0%, #12101a 65%)`, justifyContent: 'center', alignItems: 'center', padding: `0 ${80 * u}px` }}>
          <div style={{ padding: `${15 * u}px ${28 * u}px`, border, borderRadius: 14 * u, textAlign: 'center' }}>
            <div style={{ fontSize: 26 * u, opacity: .7, marginBottom: 18 * u }}>STORYBOARD · ESCENA {escena.n}</div>
            <div style={{ fontSize: 54 * u, fontWeight: 800, lineHeight: 1.16 }}>{escena.titulo}</div>
            <div style={{ fontSize: 28 * u, marginTop: 30 * u, opacity: .78 }}>{escena.descripcion}</div>
          </div>
        </AbsoluteFill>
      )}
      <div style={{ position: 'absolute', left: 38 * u, top: 38 * u, padding: `${11 * u}px ${18 * u}px`, background: '#090812dd', borderRadius: 13 * u, fontSize: 22 * u }}>
        PREPRODUCCIÓN · #{escena.n}
      </div>
      {escena.dialogo && (
        <div style={{ position: 'absolute', left: '6%', right: '6%', bottom: '9%', background: 'rgba(6,6,12,.85)', borderRadius: 20 * u, padding: `${22 * u}px ${28 * u}px`, border, textAlign: 'center' }}>
          {escena.actor && <div style={{ fontSize: 21 * u, color: '#d9c7ff', marginBottom: 9 * u }}>{escena.actor}</div>}
          <div style={{ fontSize: 37 * u, fontWeight: 650, lineHeight: 1.25 }}>{escena.dialogo}</div>
          {!escena.audio && <div style={{ fontSize: 20 * u, opacity: .6, marginTop: 10 * u }}>Audio pendiente · se puede previsualizar sin voz</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const Animatic: React.FC<{ plan: PlanAnimatic }> = ({ plan }) => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: '#100e16' }}>
      {plan.escenas.map((escena) => {
        const dur = Math.max(1, Math.ceil(escena.durSec * plan.fps));
        const inicio = cursor;
        cursor += dur;
        return (
          <Sequence key={escena.n} from={inicio} durationInFrames={dur} premountFor={10}>
            <Escena escena={escena} plan={plan} frames={dur} />
            {escena.audio && <Audio src={escena.audio} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
