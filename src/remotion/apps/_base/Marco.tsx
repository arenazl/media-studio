// LA PLANTILLA DE LAS TARJETAS DE CUALQUIER APP (2026-10-11).
// Es el procedimiento fijo: resolución (1080x1920 a 30 cps), método de animación, marco (fondo, progreso, logo con lema,
// título debajo de la tarjeta, placa) y las piezas con sus medidas. El branding entra de afuera (Marca, armada desde el
// kit por el motor, sin IA) y el agente sólo escribe lo que muestra cada pantalla, mirando su captura.
// Lucas, 2026-10-11: "le tenías que dejar las capturas con la descripción de la animación, la referencia de Munify y el
// procedimiento (código de generación, método de animación y resoluciones), para que sólo cambie el branding y los forms".
import React, { useMemo } from 'react';
import { AbsoluteFill, Easing, Img, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

// ── contrato ──
export interface Marca {
  acento: string; acentoOscuro: string;
  /** El segundo color de la marca (el "acento" del kit cuando no es el primario; si no hay, el color aclarado). */
  secundario: string;
  fondo: string; fondoProfundo: string; superficie: string; superficie2: string; borde: string;
  texto: string; texto2: string; texto3: string;
  exito: string; alerta: string; error: string; info: string;
  fuenteTitulo: string; fuenteTexto: string;
  lema: string; dominio: string;
}
export interface EscenaTarjetaApp { tipo: string; durSec: number; chip?: string; titulo: string; resaltar?: string; sub?: string }
export interface PlanTarjetasApp {
  app: string; width: number; height: number; fps: number;
  escenas: EscenaTarjetaApp[];
  placa: { linea1: string; linea2: string; durSec: number };
  logoSrc: string;
}
/** Lo que recibe cada tarjeta: f = cuadro dentro de su escena, dur = cuadros que dura, m = la marca. */
export type TarjetaProps = { f: number; dur: number; m: Marca };

// ── medidas (cuadro de 1080x1920) ──
export const MEDIDAS = { ancho: 920, izquierda: 80, arriba: 330, altoMax: 930, texto: 34, titulo: 44, monto: 56, chico: 30, radio: 36 };

// ── método de animación: todo es función del cuadro ──
const SUAVE = Easing.bezier(0.22, 1, 0.36, 1);
/** 0 → 1 entre los cuadros a y b, con salida suave. */
export const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SUAVE });
/** 0 → 1 entre a y b, lineal. */
export const lin = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
/** De "desde" a "hasta" entre los cuadros a y b. */
export const cuenta = (f: number, a: number, b: number, desde: number, hasta: number) => desde + (hasta - desde) * ease(f, a, b);
/** Estilo para que un elemento entre en el cuadro a (sube y aparece en `largo` cuadros). */
export const entra = (f: number, a: number, largo = 12): React.CSSProperties => ({ opacity: ease(f, a, a + largo), transform: `translateY(${(1 - ease(f, a, a + largo)) * 26}px)` });
/** 0..1 que late con el período dado (algo chico siempre vivo). */
export const pulso = (f: number, periodo = 36) => 0.5 + 0.5 * Math.sin((f / periodo) * Math.PI * 2);
/** Momento de la escena: momento(dur, 0.4) = el cuadro al 40% de la duración. */
export const momento = (dur: number, q: number) => Math.round(dur * q);
/** $ 1.250.000 */
export const pesos = (n: number) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// ── íconos (SVG en línea, nada de emojis) ──
export const ICONOS = {
  check: 'M20 6 9 17l-5-5',
  escudo: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  reloj: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  estrella: 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  lista: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  grafico: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  tarjeta: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20',
  casa: 'M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  herramienta: 'M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.3-1.3a4 4 0 0 1-5-5L13 2z',
  usuario: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  pin: 'M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  campana: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  mas: 'M12 5v14M5 12h14',
  calendario: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 3v4M8 3v4M3 11h18',
  documento: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6',
  rayo: 'M13 2 3 14h9l-1 8 10-12h-9z',
} as const;
export type NombreIcono = keyof typeof ICONOS;
export const Icono: React.FC<{ n: NombreIcono; size?: number; color: string; relleno?: boolean }> = ({ n, size = 36, color, relleno }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={relleno ? color : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={ICONOS[n]} />
  </svg>
);

// ── piezas de la tarjeta ──
/** La tarjeta: posición, tamaño, superficie y encabezado fijos. Adentro van las piezas, en columna. */
export const Tarjeta: React.FC<{ f: number; m: Marca; icono: NombreIcono; titulo: string; bajada?: string; derecha?: React.ReactNode; children?: React.ReactNode }> = ({ f, m, icono, titulo, bajada, derecha, children }) => {
  const e = ease(f, 0, 14);
  return (
    <div style={{ position: 'absolute', left: MEDIDAS.izquierda, top: MEDIDAS.arriba, width: MEDIDAS.ancho, maxHeight: MEDIDAS.altoMax, overflow: 'hidden', boxSizing: 'border-box', padding: 40, borderRadius: MEDIDAS.radio, background: m.superficie, border: `2px solid ${m.borde}`, boxShadow: '0 30px 80px rgba(0,0,0,0.45)', opacity: e, transform: `translateY(${(1 - e) * 40}px) scale(${0.96 + 0.04 * e})`, display: 'flex', flexDirection: 'column', gap: 22, fontFamily: m.fuenteTexto, color: m.texto }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 6 }}>
        <div style={{ width: 84, height: 84, borderRadius: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${m.acento}2E` }}>
          <Icono n={icono} size={44} color={m.acento} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: MEDIDAS.titulo, fontWeight: 700, lineHeight: 1.15 }}>{titulo}</div>
          {bajada ? <div style={{ fontSize: MEDIDAS.chico, color: m.texto2, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bajada}</div> : null}
        </div>
        {derecha}
      </div>
      {children}
    </div>
  );
};

/** Una fila: etiqueta a la izquierda (con detalle abajo), valor a la derecha (con pastilla abajo). */
export const Fila: React.FC<{ m: Marca; etiqueta: string; detalle?: string; valor?: string; pastilla?: React.ReactNode; icono?: NombreIcono; destacada?: boolean; color?: string; style?: React.CSSProperties }> = ({ m, etiqueta, detalle, valor, pastilla, icono, destacada, color, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '24px 28px', borderRadius: 24, background: m.superficie2, border: `2px solid ${destacada ? color || m.acento : 'transparent'}`, ...style }}>
    {icono ? <div style={{ width: 64, height: 64, borderRadius: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)' }}><Icono n={icono} size={34} color={color || m.texto2} /></div> : null}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: MEDIDAS.texto, fontWeight: 600, color: m.texto }}>{etiqueta}</div>
      {detalle ? <div style={{ fontSize: MEDIDAS.chico, color: m.texto2, marginTop: 2 }}>{detalle}</div> : null}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      {valor ? <div style={{ fontFamily: m.fuenteTitulo, fontSize: destacada ? MEDIDAS.monto : 44, fontWeight: 700, color: color || m.texto, fontVariantNumeric: 'tabular-nums' }}>{valor}</div> : null}
      {pastilla}
    </div>
  </div>
);

/** Pastilla de estado (Programado, Pagado, Cotizado...). */
export const Pastilla: React.FC<{ m: Marca; texto: string; color: string; style?: React.CSSProperties }> = ({ m, texto, color, style }) => (
  <span style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 999, fontFamily: m.fuenteTexto, fontSize: 26, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color, background: `${color}26`, ...style }}>{texto}</span>
);

/** Botón grande; `apretado` 0..1 lo hunde. */
export const Boton: React.FC<{ m: Marca; texto: string; color?: string; icono?: NombreIcono; apretado?: number; style?: React.CSSProperties }> = ({ m, texto, color, icono, apretado = 0, style }) => (
  <div style={{ height: 104, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, background: color || m.acento, color: '#FFFFFF', fontFamily: m.fuenteTexto, fontSize: 38, fontWeight: 700, transform: `scale(${1 - 0.05 * apretado})`, boxShadow: `0 ${14 - 10 * apretado}px 34px ${(color || m.acento)}55`, ...style }}>
    {icono ? <Icono n={icono} size={40} color="#FFFFFF" /> : null}{texto}
  </div>
);

/** Aviso que llega (ocupa su propio lugar en la columna: nunca va encima de otra pieza). */
export const Aviso: React.FC<{ m: Marca; titulo: string; texto?: string; color?: string; icono?: NombreIcono; style?: React.CSSProperties }> = ({ m, titulo, texto, color, icono = 'check', style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '22px 26px', borderRadius: 24, background: `${color || m.exito}22`, border: `2px solid ${color || m.exito}66`, ...style }}>
    <Icono n={icono} size={40} color={color || m.exito} />
    <div>
      <div style={{ fontSize: MEDIDAS.texto, fontWeight: 700, color: color || m.exito }}>{titulo}</div>
      {texto ? <div style={{ fontSize: MEDIDAS.chico, color: m.texto2 }}>{texto}</div> : null}
    </div>
  </div>
);

/** Barra de progreso (0..1). */
export const Barra: React.FC<{ m: Marca; valor: number; color?: string; tramos?: number }> = ({ m, valor, color, tramos = 1 }) => (
  <div style={{ display: 'flex', gap: 10 }}>
    {Array.from({ length: tramos }, (_, i) => {
      const lleno = Math.max(0, Math.min(1, valor * tramos - i));
      return (
        <div key={i} style={{ flex: 1, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ width: `${lleno * 100}%`, height: '100%', borderRadius: 8, background: color || m.acento }} />
        </div>
      );
    })}
  </div>
);

/** Número grande (montos, totales, notas). */
export const Numero: React.FC<{ m: Marca; texto: string; etiqueta?: string; color?: string; style?: React.CSSProperties }> = ({ m, texto, etiqueta, color, style }) => (
  <div style={{ padding: '22px 26px', borderRadius: 24, background: m.superficie2, ...style }}>
    {etiqueta ? <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: m.texto3 }}>{etiqueta}</div> : null}
    <div style={{ fontFamily: m.fuenteTitulo, fontSize: 64, fontWeight: 700, color: color || m.texto, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{texto}</div>
  </div>
);

/** Conversación por voz: el aro que late mientras alguien habla y se aquieta cuando calla (un tutor, un asistente, una
 *  llamada). `habla` 0..1 = cuánto está hablando en este cuadro, por ejemplo ease(f, a, a + 8) * (1 - ease(f, b, b + 10)).
 *  `color` cambia con el turno (habla el otro / te toca a vos). Mide unos 300 de alto con el rótulo. */
export const Voz: React.FC<{ m: Marca; f: number; habla: number; color?: string; rotulo?: string; style?: React.CSSProperties }> = ({ m, f, habla, color, rotulo, style }) => {
  const c = color || m.acento;
  const h = Math.max(0, Math.min(1, habla));
  const late = h * (0.55 * pulso(f, 13) + 0.45 * pulso(f + 5, 7));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '26px 0 0', ...style }}>
      <div style={{ position: 'relative', width: 220, height: 220 }}>
        {[0, 1, 2].map((i) => {
          const t = ((f + i * 10) % 30) / 30; // ondas que salen del aro mientras habla
          return <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `4px solid ${c}`, opacity: h * (1 - t) * 0.5, transform: `scale(${1 + t * 0.5})` }} />;
        })}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `12px solid ${c}`, background: `radial-gradient(circle at 50% 38%, ${c}45, ${c}12 70%)`, boxShadow: `0 0 ${28 + 64 * late}px ${c}99, inset 0 0 44px ${c}55`, transform: `scale(${0.95 + 0.09 * late})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {[0.5, 0.85, 1, 0.7, 0.45].map((alto, i) => (
            <div key={i} style={{ width: 14, borderRadius: 7, background: c, height: 18 + 84 * alto * h * (0.35 + 0.65 * pulso(f + i * 9, 9 + i * 2)) }} />
          ))}
        </div>
      </div>
      {rotulo ? <div style={{ fontFamily: m.fuenteTexto, fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: c }}>{rotulo}</div> : null}
    </div>
  );
};

/** Lo que se dice, escrito palabra por palabra al ritmo de la voz. `avance` 0..1 = cuánto va dicho; `resaltar` = las
 *  palabras que van en color (la palabra nueva, la corregida). Entran unos 28 caracteres por renglón: dos renglones miden
 *  unos 170 (con `quien`, 210). */
export const Subtitulo: React.FC<{ m: Marca; texto: string; avance: number; resaltar?: string[]; color?: string; quien?: string; style?: React.CSSProperties }> = ({ m, texto, avance, resaltar = [], color, quien, style }) => {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const limpia = (p: string) => p.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
  const marcadas = resaltar.map(limpia);
  const hasta = Math.max(0, Math.min(1, avance)) * palabras.length;
  return (
    <div style={{ padding: '26px 30px', borderRadius: 24, background: m.superficie2, textAlign: 'center', ...style }}>
      {quien ? <div style={{ fontFamily: m.fuenteTexto, fontSize: 24, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: m.texto3, marginBottom: 8 }}>{quien}</div> : null}
      <div style={{ fontFamily: m.fuenteTitulo, fontSize: 46, fontWeight: 700, lineHeight: 1.25, color: m.texto }}>
        {palabras.map((p, i) => {
          const e = Math.max(0, Math.min(1, hasta - i)); // la palabra que todavía no se dijo ya ocupa su lugar: el renglón no salta
          return <span key={i} style={{ display: 'inline-block', marginRight: '0.26em', opacity: e, transform: `translateY(${(1 - e) * 10}px)`, color: marcadas.includes(limpia(p)) ? color || m.secundario : undefined }}>{p}</span>;
        })}
      </div>
    </div>
  );
};

/** Dedo que toca: x, y en px dentro del cuadro; `apreta` 0..1. */
export const Toque: React.FC<{ x: number; y: number; apreta?: number; visible?: number }> = ({ x, y, apreta = 0, visible = 1 }) => (
  <div style={{ position: 'absolute', left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: 34, background: 'rgba(255,255,255,0.28)', border: '3px solid rgba(255,255,255,0.85)', opacity: visible, transform: `scale(${1 - 0.25 * apreta})`, boxShadow: `0 0 0 ${apreta * 22}px rgba(255,255,255,${0.18 * apreta})` }} />
);

// ── el marco (no lo toca el agente) ──
const ESTRELLAS = Array.from({ length: 60 }, (_, i) => ({ x: (i * 397) % 1080, y: (i * 653) % 1920, r: 1 + (i % 3), o: 0.15 + ((i * 7) % 10) / 30 }));
const Fondo: React.FC<{ m: Marca }> = ({ m }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${m.fondo} 0%, ${m.fondoProfundo} 70%)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 700px at 50% 12%, ${m.acento}38, transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(700px 600px at 85% 92%, ${m.acento}1F, transparent 70%)` }} />
      {ESTRELLAS.map((s, i) => <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: s.r, background: '#FFFFFF', opacity: s.o * (0.6 + 0.4 * pulso(f + i * 11, 90)) }} />)}
    </AbsoluteFill>
  );
};
const Progreso: React.FC<{ m: Marca; total: number }> = ({ m, total }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', top: 44, left: 60, right: 60, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.14)' }}>
      <div style={{ width: `${lin(f, 0, Math.max(1, total)) * 100}%`, height: '100%', borderRadius: 4, background: m.acento }} />
    </div>
  );
};
const Logo: React.FC<{ m: Marca; src: string }> = ({ m, src }) => (
  <div style={{ position: 'absolute', top: 92, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
    {src ? <Img src={src} style={{ height: 88 }} /> : null}
    {m.lema ? <div style={{ maxWidth: 880, textAlign: 'center', fontFamily: m.fuenteTexto, fontSize: 24, fontWeight: 600, lineHeight: 1.45, letterSpacing: 4, textTransform: 'uppercase', color: m.texto2 }}>{m.lema}</div> : null}
  </div>
);
const Titulo: React.FC<{ m: Marca; f: number; chip?: string; titulo: string; resaltar?: string; sub?: string; top: number }> = ({ m, f, chip, titulo, resaltar, sub, top }) => {
  const i = resaltar ? titulo.toLowerCase().indexOf(resaltar.toLowerCase()) : -1;
  const partes = i >= 0 ? [titulo.slice(0, i), titulo.slice(i, i + (resaltar || '').length), titulo.slice(i + (resaltar || '').length)] : [titulo, '', ''];
  return (
    <div style={{ position: 'absolute', top, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center', ...entra(f, 8, 16) }}>
      {chip ? <span style={{ padding: '8px 24px', borderRadius: 999, background: m.acento, color: '#FFFFFF', fontFamily: m.fuenteTexto, fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>{chip}</span> : null}
      <div style={{ fontFamily: m.fuenteTitulo, fontSize: 76, fontWeight: 800, lineHeight: 1.05, color: m.texto }}>
        {partes[0]}{partes[1] ? <span style={{ color: m.acento, textDecoration: 'underline', textDecorationThickness: 6, textUnderlineOffset: 10 }}>{partes[1]}</span> : null}{partes[2]}
      </div>
      {sub ? <div style={{ fontFamily: m.fuenteTexto, fontSize: 32, lineHeight: 1.35, color: m.texto2 }}>{sub}</div> : null}
    </div>
  );
};
const Placa: React.FC<{ m: Marca; plan: PlanTarjetasApp }> = ({ m, plan }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36, ...entra(f, 0, 18) }}>
      {plan.logoSrc ? <Img src={plan.logoSrc} style={{ height: 150 }} /> : null}
      <div style={{ fontFamily: m.fuenteTitulo, fontSize: 80, fontWeight: 800, color: m.texto, textAlign: 'center', padding: '0 80px', lineHeight: 1.05 }}>{plan.placa.linea1}</div>
      {plan.placa.linea2 ? <div style={{ fontFamily: m.fuenteTexto, fontSize: 40, color: m.acento, fontWeight: 700 }}>{plan.placa.linea2}</div> : null}
    </AbsoluteFill>
  );
};

/** Arma el reel: fondo, progreso, logo con lema, una escena por tarjeta con su título debajo, y la placa. */
export const Marco: React.FC<{ plan: PlanTarjetasApp; marca: Marca; tarjetas: Record<string, React.FC<TarjetaProps>> }> = ({ plan, marca: m, tarjetas }) => {
  const { fps } = useVideoConfig();
  const esc = useMemo(() => {
    let c = 0;
    return plan.escenas.map((e) => { const dur = Math.max(1, Math.round(e.durSec * fps)); const from = c; c += dur; return { ...e, from, dur }; });
  }, [plan, fps]);
  const fin = esc.length ? esc[esc.length - 1].from + esc[esc.length - 1].dur : 0;
  const placaDur = Math.round((plan.placa?.durSec || 0) * fps);
  return (
    <AbsoluteFill style={{ background: m.fondoProfundo }}>
      <Fondo m={m} />
      {fin > 0 ? <Sequence from={0} durationInFrames={fin} name="marco"><Progreso m={m} total={fin} /><Logo m={m} src={plan.logoSrc} /></Sequence> : null}
      {esc.map((e, i) => (
        <Sequence key={i} from={e.from} durationInFrames={e.dur} name={`${i + 1} ${e.tipo}`}>
          <Escena e={e} m={m} Cuerpo={tarjetas[e.tipo]} />
        </Sequence>
      ))}
      {placaDur > 0 ? <Sequence from={fin} durationInFrames={placaDur} name="placa"><Placa m={m} plan={plan} /></Sequence> : null}
      {m.dominio ? <div style={{ position: 'absolute', bottom: 100, left: 0, right: 0, textAlign: 'center', fontFamily: m.fuenteTexto, fontSize: 26, letterSpacing: 4, color: m.texto3 }}>{m.dominio}</div> : null}
    </AbsoluteFill>
  );
};
const Escena: React.FC<{ e: EscenaTarjetaApp & { dur: number }; m: Marca; Cuerpo?: React.FC<TarjetaProps> }> = ({ e, m, Cuerpo }) => {
  const f = useCurrentFrame();
  const salida = 1 - lin(f, e.dur - 8, e.dur);
  return (
    <AbsoluteFill style={{ opacity: salida }}>
      {Cuerpo ? <Cuerpo f={f} dur={e.dur} m={m} /> : null}
      <Titulo m={m} f={f} chip={e.chip} titulo={e.titulo} resaltar={e.resaltar} sub={e.sub} top={Cuerpo ? MEDIDAS.arriba + MEDIDAS.altoMax + 50 : 760} />
    </AbsoluteFill>
  );
};
