// La composición del comercial: la MISMA para la vista previa (Player) y el render (servidor).
// Montaje sobrio: cortes en frase, acercamiento digital leve, insertos de pantalla real, subtítulos de dos
// líneas con la palabra hablada resaltada, logo discreto, música con ducking y placa final. Todo es función
// del cuadro: sin relojes ni estado acumulado, cualquier cuadro se dibuja en cualquier orden.
import { useMemo } from 'react';
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadSans } from '@remotion/google-fonts/PlusJakartaSans';
import { loadFont as loadSerif } from '@remotion/google-fonts/InstrumentSerif';
import type { MontajePlan } from '../lib/montajePlan';
import { derivarRender, rampaFades, volumenMusica, type InsertoRender, type PaginaSubtitulo, type PlanRender, type SegmentoRender } from './derivar';
import { Semaforo, Tramite, Mapa, Dashboard } from './munify/Tarjetas';

const { fontFamily: sans } = loadSans('normal', { weights: ['600', '700', '800'], subsets: ['latin', 'latin-ext'] });
const { fontFamily: serif } = loadSerif('normal', { weights: ['400'], subsets: ['latin', 'latin-ext'] });
const { fontFamily: serifItalic } = loadSerif('italic', { weights: ['400'], subsets: ['latin', 'latin-ext'] });

// type (no interface): el Player y la Composition exigen props asignables a Record<string, unknown>.
export type ComercialProps = { plan: MontajePlan; base?: string };

// la entrada del segmento sobre el anterior: fundido (disolvencia cruzada), deslizar desde la derecha, o zoom que se asienta
function estiloEntrada(seg: SegmentoRender, frame: number): { opacity: number; dx: number; zoom: number } {
  if (!seg.entrada) return { opacity: 1, dx: 0, zoom: 1 };
  const t = interpolate(frame, [0, seg.entrada.frames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  if (seg.entrada.tipo === 'deslizar') return { opacity: 1, dx: (1 - t) * 100, zoom: 1 };
  if (seg.entrada.tipo === 'zoom') return { opacity: t, dx: 0, zoom: 1 + (1 - t) * 0.12 };
  return { opacity: t, dx: 0, zoom: 1 };
}

// el efecto de la escena (Lucas, 2026-10-12: "que anden los efectos"): flash blanco al entrar, zoom rápido de énfasis,
// push-in sutil a lo largo de la toma, fundido desde y hacia negro, y cámara lenta
const CUADROS_FLASH = 7, CUADROS_ZOOM = 9, CUADROS_FADE = 12;
function efectoDe(seg: SegmentoRender, frame: number): { zoom: number; brillo: number; fade: number } {
  const t = (n: number) => interpolate(frame, [0, n], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  if (seg.efecto === 'zoom') return { zoom: 1 + 0.18 * (1 - t(CUADROS_ZOOM)), brillo: 0, fade: 1 };
  if (seg.efecto === 'pushin') return { zoom: 1 + 0.08 * Math.min(1, frame / Math.max(1, seg.dur - 1)), brillo: 0, fade: 1 };
  if (seg.efecto === 'flash') return { zoom: 1, brillo: 1 - t(CUADROS_FLASH), fade: 1 };
  if (seg.efecto === 'fade') return { zoom: 1, brillo: 0, fade: rampaFades(frame, seg.dur, CUADROS_FADE, CUADROS_FADE) };
  return { zoom: 1, brillo: 0, fade: 1 };
}

const Segmento: React.FC<{ seg: SegmentoRender }> = ({ seg }) => {
  const frame = useCurrentFrame();
  const p = Math.min(1, frame / Math.max(1, seg.dur - 1));
  const scale = (seg.scaleFrom + (seg.scaleTo - seg.scaleFrom) * p);
  const e = estiloEntrada(seg, frame);
  const fx = efectoDe(seg, frame);
  const fade = rampaFades(frame, seg.dur, seg.fadeIn, seg.fadeOut) * fx.fade;   // fade in/out del clip: imagen a negro y sonido
  const lenta = seg.efecto === 'ramp';   // cámara lenta: la toma a media velocidad y sin su sonido (la voz no se estira)
  return (
    <AbsoluteFill style={{ opacity: e.opacity * fade, transform: `translateX(${e.dx}%) scale(${scale * e.zoom * fx.zoom})`, transformOrigin: '50% 30%' }}>
      <OffthreadVideo
        src={seg.src}
        startFrom={seg.startFrom}
        playbackRate={lenta ? 0.5 : 1}
        muted={seg.audio !== 'keep' || lenta}
        volume={seg.audio === 'keep' && !lenta ? (f) => seg.gain * rampaFades(f, seg.dur, seg.fadeIn, seg.fadeOut) : 0}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {fx.brillo > 0 && <AbsoluteFill style={{ background: '#FFF', opacity: fx.brillo }} />}
    </AbsoluteFill>
  );
};

// Pantalla real del producto en un marco de navegador, sobre el fondo claro de la marca, con un zoom lento.
// Inserto con TARJETA diseñada (la del sistema de Munify): fondo de noche y la tarjeta actuando, nada de capturas.
const InsertoTarjeta: React.FC<{ ins: InsertoRender; width: number; height: number }> = ({ ins, width, height }) => {
  const frame = useCurrentFrame();
  const a = rampaFades(frame, ins.dur, ins.fadeIn, ins.fadeOut);
  const sx = width / 1080, sy = height / 1920;
  const T = ins.tarjeta === 'tramite' ? <Tramite f={frame} dur={ins.dur} /> : ins.tarjeta === 'mapa' ? <Mapa f={frame} /> : ins.tarjeta === 'dashboard' ? <Dashboard f={frame} /> : <Semaforo f={frame} dur={ins.dur} />;
  return (
    <AbsoluteFill style={{ opacity: a, background: 'radial-gradient(70% 45% at 50% 18%, #1B3A6B 0%, rgba(27,58,107,0) 70%), linear-gradient(180deg, #0E2140 0%, #0A1428 45%, #060B16 100%)' }}>
      <div style={{ position: 'absolute', left: 0, top: -260 * sy, width: 1080, height: 1920, transform: `scale(${sx}, ${sy})`, transformOrigin: '0 0' }}>{T}</div>
    </AbsoluteFill>
  );
};

// el mockup animado de la app como inserto: el clip entero a pantalla completa, con fundido de entrada y salida
const InsertoVideo: React.FC<{ ins: InsertoRender }> = ({ ins }) => {
  const frame = useCurrentFrame();
  const a = rampaFades(frame, ins.dur, ins.fadeIn, ins.fadeOut);
  return (
    <AbsoluteFill style={{ opacity: a, background: '#000' }}>
      <OffthreadVideo src={ins.src} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </AbsoluteFill>
  );
};

const Inserto: React.FC<{ ins: InsertoRender; estilo: PlanRender['estilo']; width: number; height: number }> = ({ ins, estilo, width, height }) => {
  const frame = useCurrentFrame();
  const a = rampaFades(frame, ins.dur, ins.fadeIn, ins.fadeOut);
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

// ── Los tres cierres (2026-10-12), con los colores y el logo de CADA marca ──
const rgba = (hex: string, a: number) => { const h = /^#?([0-9a-f]{6})$/i.exec(hex || '')?.[1] || '7c3aed'; return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; };
// la web como botón con el color de la marca
const PildoraWeb: React.FC<{ texto: string; color: string; u: number; opacity: number }> = ({ texto, color, u, opacity }) => (
  <div style={{ padding: `${20 * u}px ${46 * u}px`, borderRadius: 999, background: color, color: '#fff', fontFamily: sans, fontWeight: 800, fontSize: 36 * u, letterSpacing: 0.5, boxShadow: `0 22px 60px ${rgba(color, 0.45)}`, opacity }}>{texto}</div>
);
// 1) placa grande: fondo oscuro con el brillo del color de la marca, el logo grande, la frase y la web
const CierreLogo: React.FC<{ card: NonNullable<PlanRender['endCard']>; estilo: PlanRender['estilo']; width: number; nombre?: string }> = ({ card, estilo, width, nombre }) => {
  const frame = useCurrentFrame();
  const u = width / 1080;
  const a = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const esc = interpolate(frame, [0, 22], [0.86, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4)) });
  const b = interpolate(frame, [14, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const c = interpolate(frame, [22, 36], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(65% 42% at 50% 40%, ${rgba(estilo.primario, 0.42)} 0%, rgba(0,0,0,0) 72%), linear-gradient(180deg, #121014 0%, #0B0A0D 100%)`, justifyContent: 'center', alignItems: 'center', opacity: a, padding: `0 ${90 * u}px` }}>
      <div style={{ transform: `scale(${esc})`, display: 'flex', justifyContent: 'center' }}>
        {card.logoSrc ? <Img src={card.logoSrc} style={{ width: 760 * u, maxHeight: 420 * u, objectFit: 'contain' }} /> : <span style={{ fontFamily: sans, fontWeight: 800, fontSize: 150 * u, color: '#fff' }}>{nombre}</span>}
      </div>
      <div style={{ marginTop: 80 * u, fontFamily: sans, fontWeight: 700, fontSize: (card.linea1.length > 34 ? 52 : 62) * u, color: '#fff', textAlign: 'center', lineHeight: 1.18, opacity: b }}>{card.linea1}</div>
      {card.linea2 ? <div style={{ marginTop: 56 * u }}><PildoraWeb texto={card.linea2} color={estilo.primario} u={u} opacity={c} /></div> : null}
    </AbsoluteFill>
  );
};
// 2) y 3) un video de cierre (el mockup de la pantalla clave o la presentadora) y la marca encima
const CierreVideo: React.FC<{ card: NonNullable<PlanRender['endCard']>; estilo: PlanRender['estilo']; width: number }> = ({ card, estilo, width }) => {
  const frame = useCurrentFrame();
  const u = width / 1080;
  const a = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const fin = card.dur;
  const esPantalla = card.tipo === 'pantalla';
  // pantalla: el logo entra en el último tramo, sobre un velo; presentadora: logo arriba desde el principio y la web abajo
  const velo = esPantalla ? interpolate(frame, [fin * 0.55, fin * 0.7], [0, 0.9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const desenfoque = esPantalla ? interpolate(frame, [fin * 0.55, fin * 0.7], [0, 16], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const marca = esPantalla ? interpolate(frame, [fin * 0.6, fin * 0.75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : interpolate(frame, [4, 16], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#000', opacity: a }}>
      {card.videoSrc ? <OffthreadVideo src={card.videoSrc} muted={esPantalla} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: desenfoque ? `blur(${desenfoque}px)` : undefined }} /> : null}
      <AbsoluteFill style={{ background: `rgba(10,9,12,${velo})` }} />
      {esPantalla ? (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: marca, padding: `0 ${90 * u}px` }}>
          {card.logoSrc ? <Img src={card.logoSrc} style={{ width: 680 * u, maxHeight: 380 * u, objectFit: 'contain' }} /> : null}
          <div style={{ marginTop: 60 * u, fontFamily: sans, fontWeight: 700, fontSize: 56 * u, color: '#fff', textAlign: 'center', lineHeight: 1.18 }}>{card.linea1}</div>
          {card.linea2 ? <div style={{ marginTop: 48 * u }}><PildoraWeb texto={card.linea2} color={estilo.primario} u={u} opacity={1} /></div> : null}
        </AbsoluteFill>
      ) : (
        <>
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.6) 100%)' }} />
          {card.logoSrc ? <Img src={card.logoSrc} style={{ position: 'absolute', top: 110 * u, left: '50%', transform: 'translateX(-50%)', width: 460 * u, maxHeight: 200 * u, objectFit: 'contain', opacity: marca }} /> : null}
          {card.linea2 ? <div style={{ position: 'absolute', bottom: 170 * u, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}><PildoraWeb texto={card.linea2} color={estilo.primario} u={u} opacity={marca} /></div> : null}
        </>
      )}
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
          {ins.video ? <InsertoVideo ins={ins} /> : ins.tarjeta ? <InsertoTarjeta ins={ins} width={r.width} height={r.height} /> : <Inserto ins={ins} estilo={r.estilo} width={r.width} height={r.height} />}
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
          {r.endCard.tipo && r.endCard.tipo !== 'logo' && r.endCard.videoSrc
            ? <CierreVideo card={r.endCard} estilo={r.estilo} width={r.width} />
            : r.endCard.tipo ? <CierreLogo card={r.endCard} estilo={r.estilo} width={r.width} nombre={plan.marcaNombre} />
              : <PlacaFinal card={r.endCard} estilo={r.estilo} width={r.width} nombre={plan.marcaNombre} />}
        </Sequence>
      ) : null}
      {r.voice ? (
        <Sequence from={r.voice.from} name="voz en off">
          <Audio src={r.voice.src} volume={(f) => r.voice!.volume * rampaFades(f, r.totalFrames - r.voice!.from, r.voice!.fadeIn, r.voice!.fadeOut)} />
        </Sequence>
      ) : null}
      {r.music ? <Audio src={r.music.src} volume={(f) => volumenMusica(f, r)} /> : null}
    </AbsoluteFill>
  );
};
