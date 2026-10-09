// La composición de MOCKUPS ("PowerPoint avanzado"): fondo oscuro de marca con degradé y grano, barra de
// progreso, logo arriba, y por escena o un título (con cifra que cuenta si la hay) o una pantalla real en su
// marco (navegador o teléfono) con zoom lento, chip con el nombre de la pantalla y título con palabra resaltada.
// Cierra con la placa de la marca. Sin voz ni música: eso lo pone el paso Montaje. Todo es función del cuadro.
import { useMemo } from 'react';
import { AbsoluteFill, Easing, Img, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { loadFont as loadSans } from '@remotion/google-fonts/PlusJakartaSans';
import { loadFont as loadSerif } from '@remotion/google-fonts/InstrumentSerif';
import type { PlanMockup } from '../lib/montajePlan';
import { partesResaltadas } from '../lib/mockups';
import { derivarMockups, formatearCifra, type EscenaMockupRender, type PlanMockupRender } from './derivarMockups';

const { fontFamily: sans } = loadSans('normal', { weights: ['500', '600', '700', '800'], subsets: ['latin', 'latin-ext'] });
const { fontFamily: serif } = loadSerif('normal', { weights: ['400'], subsets: ['latin', 'latin-ext'] });
const { fontFamily: serifItalic } = loadSerif('italic', { weights: ['400'], subsets: ['latin', 'latin-ext'] });

export type MockupsProps = { plan: PlanMockup; base?: string };

const GRANO = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0"/></filter><rect width="240" height="240" filter="url(#n)"/></svg>')}")`;

const hexARgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};
const rgba = (hex: string, a: number) => { const [r, g, b] = hexARgb(hex); return `rgba(${r},${g},${b},${a})`; };
const mezclar = (a: string, b: string, t: number) => {
  const A = hexARgb(a), B = hexARgb(b);
  return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * t)).join(',')})`;
};
const entrada = (f: number, desde: number, dur = 18) => interpolate(f, [desde, desde + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
const salida = (f: number, total: number, dur = 8) => interpolate(f, [total - dur, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const Fondo: React.FC<{ r: PlanMockupRender }> = ({ r }) => {
  const frame = useCurrentFrame();
  const { primario, fondo } = r.marca.estilo;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 50% 28%, ${rgba(primario, 0.28)} 0%, rgba(0,0,0,0) 70%), linear-gradient(170deg, ${mezclar(primario, fondo, 0.78)} 0%, ${fondo} 100%)` }}>
      <AbsoluteFill style={{ backgroundImage: GRANO, backgroundSize: '240px 240px', backgroundPosition: `${(frame * 37) % 240}px ${(frame * 53) % 240}px`, opacity: 0.11, mixBlendMode: 'overlay' }} />
    </AbsoluteFill>
  );
};

const Progreso: React.FC<{ r: PlanMockupRender }> = ({ r }) => {
  const frame = useCurrentFrame();
  const u = r.width / 1080;
  return (
    <div style={{ position: 'absolute', top: 44 * u, left: 48 * u, right: 48 * u, display: 'flex', gap: 8 * u }}>
      {r.escenas.map((e) => {
        const p = interpolate(frame, [e.from, e.from + e.dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div key={e.n} style={{ flex: 1, height: 6 * u, borderRadius: 3 * u, background: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
            <div style={{ width: `${p * 100}%`, height: '100%', background: 'rgba(255,255,255,0.92)' }} />
          </div>
        );
      })}
    </div>
  );
};

const Resaltado: React.FC<{ titulo: string; resaltar?: string; acento: string; size: number; italic?: boolean; frameLocal: number }> = ({ titulo, resaltar, acento, size, italic = true, frameLocal }) => {
  const [a, b, c] = partesResaltadas(titulo, resaltar);
  const palabras = [...a.split(/(\s+)/).map((w) => ({ w, acc: false })), ...(b ? [{ w: b, acc: true }] : []), ...c.split(/(\s+)/).map((w) => ({ w, acc: false }))].filter((x) => x.w !== '');
  let idx = 0;
  return (
    <div style={{ fontFamily: italic ? serifItalic : serif, fontSize: size, lineHeight: 1.08, color: '#fff', textAlign: 'center', letterSpacing: -0.5 }}>
      {palabras.map((p, i) => {
        if (/^\s+$/.test(p.w)) return <span key={i}>{p.w}</span>;
        const k = idx++;
        const t = entrada(frameLocal, 6 + k * 2, 16);
        return (
          <span key={i} style={{ display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * 18}px)`, color: p.acc ? acento : '#fff', textDecoration: p.acc ? 'underline' : 'none', textDecorationThickness: p.acc ? 0.06 * size : undefined, textUnderlineOffset: p.acc ? 0.14 * size : undefined }}>
            {p.w}
          </span>
        );
      })}
    </div>
  );
};

const Chip: React.FC<{ texto: string; acento: string; u: number; opacity: number }> = ({ texto, acento, u, opacity }) => (
  <div style={{ display: 'inline-block', padding: `${8 * u}px ${18 * u}px`, borderRadius: 999, background: rgba(acento, 0.16), border: `1px solid ${rgba(acento, 0.45)}`, color: acento, fontFamily: sans, fontWeight: 700, fontSize: 22 * u, letterSpacing: 2.2 * u, textTransform: 'uppercase', opacity }}>
    {texto}
  </div>
);

// El cuadro 1 es la portada del reel: la primera escena arranca con todo puesto (sin entrada animada).
const relojEntrada = (f: number, e: EscenaMockupRender) => (e.from === 0 ? f + 60 : f);

const EscenaTitulo: React.FC<{ e: EscenaMockupRender; r: PlanMockupRender }> = ({ e, r }) => {
  const f = useCurrentFrame();
  const fe = relojEntrada(f, e);
  const u = r.width / 1080;
  const out = salida(f, e.dur);
  const { acento } = r.marca.estilo;
  const cuenta = interpolate(fe, [6, 6 + Math.round(1.3 * r.fps)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: `0 ${90 * u}px`, opacity: out, transform: `translateY(${(1 - out) * -14}px)` }}>
      {e.badge ? <div style={{ marginBottom: 34 * u }}><Chip texto={e.badge} acento={acento} u={u} opacity={entrada(fe, 0)} /></div> : null}
      {e.numero ? (
        <div style={{ fontFamily: serif, fontSize: 200 * u, lineHeight: 1, color: '#fff', letterSpacing: -4 * u, opacity: entrada(fe, 2), textShadow: `0 0 60px ${rgba(acento, 0.35)}` }}>
          {formatearCifra(e.numero, cuenta)}
        </div>
      ) : null}
      <div style={{ marginTop: e.numero ? 28 * u : 0 }}>
        <Resaltado titulo={e.titulo} resaltar={e.resaltar} acento={acento} size={(e.numero ? 68 : 108) * u} italic={!e.numero} frameLocal={fe} />
      </div>
      {e.sub ? <div style={{ marginTop: 34 * u, fontFamily: sans, fontWeight: 500, fontSize: 36 * u, lineHeight: 1.35, color: 'rgba(255,255,255,0.72)', textAlign: 'center', opacity: entrada(fe, 16) }}>{e.sub}</div> : null}
    </AbsoluteFill>
  );
};

// marco de navegador: la altura sigue la proporción real de la captura (tope 700) para no recortarle los costados
const MARCO_DESKTOP = { top: 320, ancho: 960, barra: 52, contenidoDefault: 620, contenidoMax: 700 };
const MARCO_PHONE = { top: 240, ancho: 440, alto: 900 };
const altoMarco = (e: EscenaMockupRender) => {
  if (e.captura?.alto) return MARCO_PHONE.alto;
  const prop = e.captura?.proporcion;
  const contenido = prop ? Math.min(MARCO_DESKTOP.contenidoMax, Math.round(MARCO_DESKTOP.ancho * prop)) : MARCO_DESKTOP.contenidoDefault;
  return MARCO_DESKTOP.barra + contenido;
};

const Marco: React.FC<{ e: EscenaMockupRender; r: PlanMockupRender; f: number }> = ({ e, r, f }) => {
  const u = r.width / 1080;
  const { primario } = r.marca.estilo;
  const cap = e.captura!;
  const inA = entrada(relojEntrada(f, e), 0, 16);
  const kb = 1 + (cap.alto ? 0.05 : 0.07) * Math.min(1, f / Math.max(1, e.dur));
  const comun: React.CSSProperties = { position: 'absolute', left: '50%', overflow: 'hidden', boxShadow: `0 40px 90px rgba(0,0,0,0.55), 0 0 120px ${rgba(primario, 0.25)}`, border: '1px solid rgba(255,255,255,0.08)' };
  const anim: React.CSSProperties = { transform: `translateX(-50%) translateY(${(1 - inA) * 50}px) scale(${0.94 + 0.06 * inA})`, opacity: inA };
  if (cap.alto) {
    return (
      <div style={{ ...comun, ...anim, top: MARCO_PHONE.top * u, width: MARCO_PHONE.ancho * u, height: MARCO_PHONE.alto * u, borderRadius: 56 * u, background: '#0F0D18', padding: 10 * u }}>
        <div style={{ position: 'absolute', top: 10 * u, left: 10 * u, right: 10 * u, bottom: 10 * u, borderRadius: 46 * u, overflow: 'hidden', background: '#000' }}>
          <Img src={cap.src} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transform: `scale(${kb})`, transformOrigin: '50% 10%' }} />
        </div>
        <div style={{ position: 'absolute', top: 22 * u, left: '50%', transform: 'translateX(-50%)', width: 120 * u, height: 30 * u, borderRadius: 15 * u, background: '#0F0D18' }} />
      </div>
    );
  }
  return (
    <div style={{ ...comun, ...anim, top: MARCO_DESKTOP.top * u, width: MARCO_DESKTOP.ancho * u, height: altoMarco(e) * u, borderRadius: 26 * u, background: '#15121F' }}>
      <div style={{ height: MARCO_DESKTOP.barra * u, display: 'flex', alignItems: 'center', gap: 10 * u, padding: `0 ${22 * u}px`, background: 'rgba(255,255,255,0.05)' }}>
        {['#F43F5E', '#F59E0B', '#16A34A'].map((c) => <div key={c} style={{ width: 13 * u, height: 13 * u, borderRadius: 7 * u, background: c, opacity: 0.9 }} />)}
        <div style={{ marginLeft: 14 * u, height: 28 * u, flex: 1, borderRadius: 14 * u, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', fontSize: 19 * u, display: 'flex', alignItems: 'center', paddingLeft: 16 * u, fontFamily: sans }}>
          {r.marca.sitio || cap.nombre || ''}
        </div>
      </div>
      <div style={{ position: 'absolute', top: MARCO_DESKTOP.barra * u, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <Img src={cap.src} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transform: `scale(${kb})`, transformOrigin: '50% 12%' }} />
      </div>
    </div>
  );
};

const EscenaPantalla: React.FC<{ e: EscenaMockupRender; r: PlanMockupRender }> = ({ e, r }) => {
  const f = useCurrentFrame();
  const fe = relojEntrada(f, e);
  const u = r.width / 1080;
  const out = salida(f, e.dur);
  const { acento, primario } = r.marca.estilo;
  const alto = !!e.captura?.alto;
  const baseMarco = (alto ? MARCO_PHONE.top : MARCO_DESKTOP.top) + altoMarco(e);   // borde inferior del marco
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: 'absolute', top: (baseMarco - 30) * u, left: '50%', transform: 'translateX(-50%)', width: 700 * u, height: 120 * u, borderRadius: '50%', background: rgba(primario, 0.35), filter: `blur(${60 * u}px)` }} />
      <Marco e={e} r={r} f={f} />
      <div style={{ position: 'absolute', top: (baseMarco + 64) * u, left: 70 * u, right: 70 * u, textAlign: 'center' }}>
        {e.badge ? <Chip texto={e.badge} acento={acento} u={u} opacity={entrada(fe, 8)} /> : null}
        <div style={{ marginTop: 26 * u }}>
          <Resaltado titulo={e.titulo} resaltar={e.resaltar} acento={acento} size={(alto ? 64 : 76) * u} frameLocal={fe} />
        </div>
        {e.sub ? <div style={{ marginTop: 24 * u, fontFamily: sans, fontWeight: 500, fontSize: 34 * u, lineHeight: 1.35, color: 'rgba(255,255,255,0.72)', opacity: entrada(fe, 18) }}>{e.sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

const Placa: React.FC<{ r: PlanMockupRender }> = ({ r }) => {
  const f = useCurrentFrame();
  const u = r.width / 1080;
  const card = r.placa!;
  const a = entrada(f, 0, 10);
  const up = interpolate(f, [4, 24], [26, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const b = entrada(f, 10, 14);
  const { primario, acento, fondo } = r.marca.estilo;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${mezclar(primario, fondo, 0.15)} 0%, ${mezclar(primario, fondo, 0.7)} 100%)`, justifyContent: 'center', alignItems: 'center', opacity: a, padding: `0 ${80 * u}px` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 26 * u, transform: `translateY(${up}px)` }}>
        {card.logoSrc ? <Img src={card.logoSrc} style={{ maxWidth: 560 * u, maxHeight: 150 * u, objectFit: 'contain' }} /> : null}
        {r.marca.mostrarNombre && r.marca.nombre ? <span style={{ fontFamily: serif, fontSize: 92 * u, color: '#fff', letterSpacing: -1 }}>{r.marca.nombre}</span> : null}
      </div>
      <div style={{ marginTop: 80 * u, fontFamily: serifItalic, fontSize: (card.linea1.length > 26 ? 72 : 96) * u, color: '#fff', textAlign: 'center', lineHeight: 1.1, opacity: b, transform: `translateY(${up * 1.3}px)` }}>
        {card.linea1}
      </div>
      {card.linea2 ? <div style={{ marginTop: 40 * u, fontFamily: sans, fontWeight: 700, fontSize: 42 * u, color: acento, opacity: b, textAlign: 'center' }}>{card.linea2}</div> : null}
    </AbsoluteFill>
  );
};

export const Mockups: React.FC<MockupsProps> = ({ plan, base = '' }) => {
  const r = useMemo(() => derivarMockups(plan, base), [plan, base]);
  const u = r.width / 1080;
  const finEscenas = r.placa ? r.placa.from : r.totalFrames;
  return (
    <AbsoluteFill style={{ backgroundColor: r.marca.estilo.fondo }}>
      <Fondo r={r} />
      {r.escenas.map((e) => (
        <Sequence key={e.n} from={e.from} durationInFrames={e.dur} name={`${e.n} ${e.tipo}`}>
          {e.tipo === 'pantalla' && e.captura ? <EscenaPantalla e={e} r={r} /> : <EscenaTitulo e={e} r={r} />}
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={finEscenas} name="marco">
        <Progreso r={r} />
        <div style={{ position: 'absolute', top: 92 * u, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18 * u }}>
          {r.marca.logoSrc ? <Img src={r.marca.logoSrc} style={{ height: 60 * u, maxWidth: 340 * u, objectFit: 'contain' }} /> : null}
          {r.marca.mostrarNombre && r.marca.nombre ? <span style={{ fontFamily: serif, fontSize: 46 * u, color: '#fff', letterSpacing: -0.5 }}>{r.marca.nombre}</span> : null}
        </div>
        {r.marca.sitio ? <div style={{ position: 'absolute', bottom: 150 * u, left: 0, right: 0, textAlign: 'center', fontFamily: sans, fontWeight: 600, fontSize: 24 * u, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>{r.marca.sitio}</div> : null}
      </Sequence>
      {r.placa ? (
        <Sequence from={r.placa.from} durationInFrames={r.placa.dur} name="placa">
          <Placa r={r} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
