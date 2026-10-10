// La composición del comercial: la MISMA para la vista previa (Player) y el render (servidor).
// Montaje sobrio: cortes en frase, acercamiento digital leve, insertos de pantalla real, subtítulos de dos
// líneas con la palabra hablada resaltada, logo discreto, música con ducking y placa final. Todo es función
// del cuadro: sin relojes ni estado acumulado, cualquier cuadro se dibuja en cualquier orden.
import { useMemo } from 'react';
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadSans } from '@remotion/google-fonts/PlusJakartaSans';
import { loadFont as loadSerif } from '@remotion/google-fonts/InstrumentSerif';
import type { MontajePlan } from '../lib/montajePlan';
import { derivarRender, volumenMusica, type InsertoRender, type PaginaSubtitulo, type PlanRender, type SegmentoRender } from './derivar';
import { Semaforo, Tramite, Mapa, Dashboard } from './munify/Tarjetas';

const { fontFamily: sans } = loadSans('normal', { weights: ['600', '700', '800'], subsets: ['latin', 'latin-ext'] });
const { fontFamily: serif } = loadSerif('normal', { weights: ['400'], subsets: ['latin', 'latin-ext'] });
const { fontFamily: serifItalic } = loadSerif('italic', { weights: ['400'], subsets: ['latin', 'latin-ext'] });

// type (no interface): el Player y la Composition exigen props asignables a Record<string, unknown>.
export type ComercialProps = { plan: MontajePlan; base?: string };

const Segmento: React.FC<{ seg: SegmentoRender }> = ({ seg }) => {
  const frame = useCurrentFrame();
  const p = Math.min(1, frame / Math.max(1, seg.dur - 1));
  const scale = seg.scaleFrom + (seg.scaleTo - seg.scaleFrom) * p;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: '50% 30%' }}>
      <OffthreadVideo
        src={seg.src}
        startFrom={seg.startFrom}
        muted={seg.audio !== 'keep'}
        volume={seg.audio === 'keep' ? seg.gain : 0}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  );
};

// Pantalla real del producto en un marco de navegador, sobre el fondo claro de la marca, con un zoom lento.
// Inserto con TARJETA diseñada (la del sistema de Munify): fondo de noche y la tarjeta actuando, nada de capturas.
const InsertoTarjeta: React.FC<{ ins: InsertoRender; width: number; height: number }> = ({ ins, width, height }) => {
  const frame = useCurrentFrame();
  const a = Math.min(
    interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' }),
    interpolate(frame, [ins.dur - 8, ins.dur], [1, 0], { extrapolateLeft: 'clamp' }),
  );
  const sx = width / 1080, sy = height / 1920;
  const T = ins.tarjeta === 'tramite' ? <Tramite f={frame} dur={ins.dur} /> : ins.tarjeta === 'mapa' ? <Mapa f={frame} /> : ins.tarjeta === 'dashboard' ? <Dashboard f={frame} /> : <Semaforo f={frame} dur={ins.dur} />;
  return (
    <AbsoluteFill style={{ opacity: a, background: 'radial-gradient(70% 45% at 50% 18%, #1B3A6B 0%, rgba(27,58,107,0) 70%), linear-gradient(180deg, #0E2140 0%, #0A1428 45%, #060B16 100%)' }}>
      <div style={{ position: 'absolute', left: 0, top: -260 * sy, width: 1080, height: 1920, transform: `scale(${sx}, ${sy})`, transformOrigin: '0 0' }}>{T}</div>
    </AbsoluteFill>
  );
};

const Inserto: React.FC<{ ins: InsertoRender; estilo: PlanRender['estilo']; width: number; height: number }> = ({ ins, estilo, width, height }) => {
  const frame = useCurrentFrame();
  const a = Math.min(
    interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' }),
    interpolate(frame, [ins.dur - 8, ins.dur], [1, 0], { extrapolateLeft: 'clamp' }),
  );
  const kb = 1 + 0.07 * (frame / Math.max(1, ins.dur));
  const u = width / 1080;                       // todo en unidades del lienzo de referencia 1080x1920
  return (
    <AbsoluteFill style={{ opacity: a, background: `radial-gradient(60% 45% at 50% 35%, #EDE4FF 0%, ${estilo.fondo} 72%)` }}>
      <div
        style={{
          position: 'absolute', left: 60 * u, top: (height * 0.0885) + (1 - a) * 14, width: 960 * u, height: height * 0.453,
          borderRadius: 26 * u, background: '#fff', boxShadow: '0 30px 80px rgba(60,20,120,.22)', overflow: 'hidden',
        }}
      >
        <div style={{ height: 56 * u, background: '#F3EEFF', display: 'flex', alignItems: 'center', gap: 10 * u, padding: `0 ${22 * u}px` }}>
          {['#F43F5E', '#F59E0B', '#16A34A'].map((c) => (
            <div key={c} style={{ width: 14 * u, height: 14 * u, borderRadius: 7 * u, background: c }} />
          ))}
          <div style={{ marginLeft: 16 * u, height: 30 * u, flex: 1, borderRadius: 15 * u, background: '#fff', color: '#8b86a0', fontSize: 20 * u, display: 'flex', alignItems: 'center', paddingLeft: 16 * u, fontFamily: sans }}>
            {ins.nombre || ''}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 56 * u, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
          <Img src={ins.src} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transform: `scale(${kb})`, transformOrigin: '50% 15%' }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Subtitulos: React.FC<{ pages: PaginaSubtitulo[]; acento: string; width: number; height: number }> = ({ pages, acento, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const page = pages.find((p) => t >= p.startMs && t < p.endMs);
  if (!page) return null;
  const a = interpolate(t, [page.startMs, page.startMs + 90], [0, 1], { extrapolateRight: 'clamp' });
  const u = width / 1080;
  return (
    <AbsoluteFill style={{ alignItems: 'center' }}>
      <div
        style={{
          position: 'absolute', top: height * 0.615, maxWidth: 920 * u, padding: `${14 * u}px ${30 * u}px`, borderRadius: 22 * u,
          background: 'rgba(22,16,34,0.58)', textAlign: 'center', fontFamily: sans, fontWeight: 700, fontSize: 58 * u,
          lineHeight: 1.22, color: '#fff', opacity: a, transform: `translateY(${(1 - a) * 8}px)`,
        }}
      >
        {page.words.map((w, i) => (
          <span key={i} style={{ color: t >= w.startMs && t < w.endMs + 60 ? acento : '#fff' }}>
            {w.text}
            {i < page.words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// El logo del kit suele tener el texto blanco: sobre clips claros va dentro de una pastilla oscura, la misma de los subtítulos.
const Logo: React.FC<{ src: string; width: number }> = ({ src, width }) => {
  const u = width / 1080;
  return (
    <div style={{ position: 'absolute', top: 76 * u, right: 48 * u, padding: `${10 * u}px ${18 * u}px ${8 * u}px`, borderRadius: 18 * u, background: 'rgba(22,16,34,0.55)' }}>
      <Img src={src} style={{ width: 184 * u, display: 'block' }} />
    </div>
  );
};

// Placa final con el mismo sistema que las tarjetas de Munify: noche con estrellas, isotipo chico con el nombre en
// serif, la llamada en serif cursiva, el dominio como botón dorado. Nada de degradé de marca a pantalla completa.
const ESTRELLAS = Array.from({ length: 60 }, (_, i) => ({ x: (i * 73) % 100, y: (i * 37) % 100, r: 1 + (i % 3), f: 0.2 + ((i * 11) % 10) / 10 }));
const PlacaFinal: React.FC<{ card: NonNullable<PlanRender['endCard']>; estilo: PlanRender['estilo']; width: number; nombre?: string }> = ({ card, estilo, width, nombre }) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const up = interpolate(frame, [4, 24], [26, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const b = interpolate(frame, [10, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const u = width / 1080;
  const oro = '#F2B84B';
  const [r, g, bl] = [parseInt(estilo.primario.slice(1, 3), 16), parseInt(estilo.primario.slice(3, 5), 16), parseInt(estilo.primario.slice(5, 7), 16)];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 50% 20%, rgba(${r},${g},${bl},0.35) 0%, rgba(0,0,0,0) 70%), linear-gradient(180deg, #0E2140 0%, #0A1428 50%, #060B16 100%)`, justifyContent: 'center', alignItems: 'center', opacity: a, padding: `0 ${80 * u}px` }}>
      {ESTRELLAS.map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2 * u, height: s.r * 2 * u, borderRadius: '50%', background: '#fff', opacity: 0.25 + 0.45 * Math.abs(Math.sin((frame / 30) * s.f * 2 + i)) }} />
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 * u, transform: `translateY(${up}px)` }}>
        {card.logoSrc ? <Img src={card.logoSrc} style={{ height: 96 * u, maxWidth: 300 * u, objectFit: 'contain' }} /> : null}
        {nombre ? <span style={{ fontFamily: serif, fontSize: 96 * u, color: '#fff', letterSpacing: -1 }}>{nombre}</span> : null}
      </div>
      <div style={{ marginTop: 70 * u, fontFamily: serifItalic, fontSize: (card.linea1.length > 26 ? 72 : 88) * u, color: '#fff', textAlign: 'center', lineHeight: 1.1, opacity: b, transform: `translateY(${up * 1.3}px)` }}>
        {card.linea1}
      </div>
      {card.linea2 ? (
        <div style={{ marginTop: 44 * u, padding: `${18 * u}px ${40 * u}px`, borderRadius: 999, background: oro, color: '#1a1206', fontFamily: sans, fontWeight: 800, fontSize: 32 * u, boxShadow: `0 20px 60px ${oro}55`, opacity: b }}>
          {card.linea2}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const Comercial: React.FC<ComercialProps> = ({ plan, base = '' }) => {
  const r = useMemo(() => derivarRender(plan, base), [plan, base]);
  return (
    <AbsoluteFill style={{ backgroundColor: '#120d1c' }}>
      {r.segments.map((s) => (
        <Sequence key={`${s.nombre}-${s.from}`} from={s.from} durationInFrames={s.dur} premountFor={20} name={s.nombre}>
          <Segmento seg={s} />
        </Sequence>
      ))}
      {r.inserts.map((ins, i) => (
        <Sequence key={`ins-${i}`} from={ins.from} durationInFrames={ins.dur} name={`inserto ${i + 1}`}>
          {ins.tarjeta ? <InsertoTarjeta ins={ins} width={r.width} height={r.height} /> : <Inserto ins={ins} estilo={r.estilo} width={r.width} height={r.height} />}
        </Sequence>
      ))}
      {r.logo ? (
        <Sequence from={0} durationInFrames={r.endCard ? r.endCard.from : r.totalFrames} name="logo">
          <Logo src={r.logo.src} width={r.width} />
        </Sequence>
      ) : null}
      <Subtitulos pages={r.captions} acento="#FBBF24" width={r.width} height={r.height} />
      {r.endCard ? (
        <Sequence from={r.endCard.from} durationInFrames={r.endCard.dur} name="placa final">
          <PlacaFinal card={r.endCard} estilo={r.estilo} width={r.width} nombre={plan.marcaNombre} />
        </Sequence>
      ) : null}
      {r.voice ? (
        <Sequence from={r.voice.from} name="voz en off">
          <Audio src={r.voice.src} />
        </Sequence>
      ) : null}
      {r.music ? <Audio src={r.music.src} volume={(f) => volumenMusica(f, r)} /> : null}
    </AbsoluteFill>
  );
};
