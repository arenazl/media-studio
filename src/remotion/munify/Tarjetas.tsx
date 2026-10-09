// Mockups de Munify al estilo de los bocetos de junio, pero con tarjetas que ACTÚAN: el semáforo del reclamo
// que se va encendiendo, el trámite que avanza de paso, el mapa de calor que se puebla, el tablero que cuenta.
// Fondo de noche con estrellas, serif con resaltado dorado, chip por escena, logo con nombre, placa final.
// Todo es función del cuadro. Los datos de las tarjetas son de muestra: no hay métricas reales en el brief.
import { useMemo } from 'react';
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadSans } from '@remotion/google-fonts/Inter';
import { loadFont as loadSerif } from '@remotion/google-fonts/InstrumentSerif';

const { fontFamily: sans } = loadSans('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin', 'latin-ext'] });
const { fontFamily: serif } = loadSerif('normal', { weights: ['400'], subsets: ['latin', 'latin-ext'] });
const { fontFamily: serifItalic } = loadSerif('italic', { weights: ['400'], subsets: ['latin', 'latin-ext'] });

export type TipoTarjeta = 'titulo' | 'semaforo' | 'tramite' | 'mapa' | 'dashboard';
export interface EscenaTarjeta { tipo: TipoTarjeta; durSec: number; chip?: string; titulo: string; resaltar?: string; sub?: string }
export interface PlanTarjetas {
  width: number; height: number; fps: number;
  escenas: EscenaTarjeta[];
  placa: { linea1: string; linea2: string; durSec: number };
  logoSrc: string;
  voz?: { src: string; desde?: number };
  musica?: { src: string; gain: number };
}
export type TarjetasProps = { plan: PlanTarjetas };

const ORO = '#F2B84B';
const VERDE = '#22c55e';
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
const lin = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

// ── fondo de noche: degradé azul, halo cálido, estrellas que titilan (determinísticas) ──
const ESTRELLAS = Array.from({ length: 70 }, (_, i) => ({ x: ((i * 73) % 100), y: ((i * 37) % 100), r: 1 + (i % 3), f: 0.2 + ((i * 11) % 10) / 10 }));
const Fondo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(70% 45% at 50% 18%, #1B3A6B 0%, rgba(27,58,107,0) 70%), radial-gradient(45% 30% at 85% 90%, rgba(201,162,74,0.22) 0%, rgba(201,162,74,0) 70%), linear-gradient(180deg, #0E2140 0%, #0A1428 45%, #060B16 100%)' }}>
      {ESTRELLAS.map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, borderRadius: '50%', background: '#fff', opacity: 0.25 + 0.45 * Math.abs(Math.sin((f / 30) * s.f * 2 + i)) }} />
      ))}
    </AbsoluteFill>
  );
};

const Progreso: React.FC<{ escenas: { from: number; dur: number }[] }> = ({ escenas }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', top: 44, left: 48, right: 48, display: 'flex', gap: 8 }}>
      {escenas.map((e, i) => (
        <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
          <div style={{ width: `${lin(f, e.from, e.from + e.dur) * 100}%`, height: '100%', background: 'rgba(255,255,255,0.9)' }} />
        </div>
      ))}
    </div>
  );
};

const Logo: React.FC<{ src: string }> = ({ src }) => (
  <div style={{ position: 'absolute', top: 92, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
    <Img src={src} style={{ height: 70 }} />
    <span style={{ fontFamily: serif, fontSize: 72, color: '#fff', letterSpacing: -1 }}>Munify</span>
  </div>
);

// ── piezas de diseño compartidas ──
const Tarjeta: React.FC<{ f: number; titulo: string; sub?: string; icono: string; children: React.ReactNode }> = ({ f, titulo, sub, icono, children }) => {
  const a = ease(f, 0, 16);
  return (
    <div style={{ position: 'absolute', left: 130, top: 600, width: 820, borderRadius: 30, background: 'linear-gradient(180deg, #121B2E 0%, #0C1322 100%)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset', padding: '34px 36px', opacity: a, transform: `translateY(${(1 - a) * 40}px) scale(${0.96 + 0.04 * a})`, fontFamily: sans, color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(242,184,75,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{icono}</div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.3 }}>{titulo}</div>
          {sub ? <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{sub}</div> : null}
        </div>
      </div>
      {children}
    </div>
  );
};

const Chip: React.FC<{ texto: string; color?: string }> = ({ texto, color = ORO }) => (
  <div style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 999, border: `1px solid ${color}88`, background: `${color}22`, color, fontFamily: sans, fontWeight: 700, fontSize: 24, letterSpacing: 3, textTransform: 'uppercase' }}>{texto}</div>
);

const Titulo: React.FC<{ f: number; chip?: string; titulo: string; resaltar?: string; sub?: string; top: number; size?: number }> = ({ f, chip, titulo, resaltar, sub, top, size = 84 }) => {
  const i = resaltar ? titulo.toLowerCase().indexOf(resaltar.toLowerCase()) : -1;
  const [a, b, c] = i >= 0 && resaltar ? [titulo.slice(0, i), titulo.slice(i, i + resaltar.length), titulo.slice(i + resaltar.length)] : [titulo, '', ''];
  const op = ease(f, 10, 28);
  return (
    <div style={{ position: 'absolute', top, left: 80, right: 80, textAlign: 'center', opacity: op, transform: `translateY(${(1 - op) * 20}px)` }}>
      {chip ? <div style={{ marginBottom: 26 }}><Chip texto={chip} /></div> : null}
      <div style={{ fontFamily: serifItalic, fontSize: size, lineHeight: 1.08, color: '#fff', letterSpacing: -1 }}>
        {a}<span style={{ color: ORO, textDecoration: 'underline', textDecorationThickness: 5, textUnderlineOffset: 12 }}>{b}</span>{c}
      </div>
      {sub ? <div style={{ marginTop: 22, fontFamily: sans, fontSize: 34, lineHeight: 1.4, color: 'rgba(255,255,255,0.75)' }}>{sub}</div> : null}
    </div>
  );
};

// ── 1. semáforo del reclamo: se enciende paso a paso ──
const Semaforo: React.FC<{ f: number; dur: number }> = ({ f, dur }) => {
  const pasos = [
    { t: 'Recibido', d: 'Hoy 09:14 · bache en Belgrano 450', c: '#ef4444' },
    { t: 'En curso', d: 'Hoy 09:52 · cuadrilla asignada, en camino', c: ORO },
    { t: 'Resuelto', d: 'Hoy 15:40 · foto del antes y del después', c: VERDE },
  ];
  const paso = (i: number) => ease(f, 20 + i * Math.max(18, (dur - 60) / 3), 20 + i * Math.max(18, (dur - 60) / 3) + 14);
  return (
    <Tarjeta f={f} titulo="Reclamo #1287" sub="Bache · Belgrano 450 · vecino M. González" icono="⚑">
      <div style={{ display: 'flex', gap: 34, alignItems: 'stretch' }}>
        <div style={{ width: 86, borderRadius: 24, background: '#0A0F1B', border: '1px solid rgba(255,255,255,0.08)', padding: 14, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center' }}>
          {pasos.map((p, i) => <div key={i} style={{ width: 54, height: 54, borderRadius: '50%', background: p.c, opacity: 0.18 + 0.82 * paso(i), boxShadow: paso(i) > 0.5 ? `0 0 28px ${p.c}` : 'none' }} />)}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pasos.map((p, i) => (
            <div key={i} style={{ padding: '18px 22px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${paso(i) > 0.5 ? p.c + '66' : 'rgba(255,255,255,0.06)'}`, opacity: 0.35 + 0.65 * paso(i), transform: `translateX(${(1 - paso(i)) * 14}px)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, fontWeight: 700 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: paso(i) > 0.5 ? p.c : 'rgba(255,255,255,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#06101c' }}>{paso(i) > 0.5 ? '✓' : ''}</span>
                {p.t}
              </div>
              <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)', marginTop: 4, marginLeft: 40 }}>{p.d}</div>
            </div>
          ))}
        </div>
      </div>
    </Tarjeta>
  );
};

// ── 2. trámite online: el asistente avanza de paso y valida con RENAPER ──
const Tramite: React.FC<{ f: number; dur: number }> = ({ f, dur }) => {
  const tercio = Math.max(24, (dur - 50) / 3);
  const etapa = f < 16 + tercio ? 0 : f < 16 + tercio * 2 ? 1 : 2;
  const prog = lin(f, 16, 16 + tercio * 3);
  const check = ease(f, 16 + tercio + 10, 16 + tercio + 26);
  const sello = ease(f, 16 + tercio * 2 + 8, 16 + tercio * 2 + 24);
  const pasos = ['Qué trámite', 'Identidad', 'Listo'];
  return (
    <Tarjeta f={f} titulo="Nuevo trámite" sub="Habilitación comercial · desde el celular" icono="▤">
      <div style={{ display: 'flex', gap: 10, marginBottom: 26 }}>
        {pasos.map((p, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, Math.min(1, prog * 3 - i)) * 100}%`, height: '100%', background: ORO }} />
            </div>
            <div style={{ marginTop: 10, fontSize: 22, color: i <= etapa ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: i === etapa ? 700 : 500 }}>{i + 1}. {p}</div>
          </div>
        ))}
      </div>
      <div style={{ minHeight: 250, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: 26 }}>
        {etapa === 0 ? (
          <div>
            <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', marginBottom: 18 }}>Elegí el tipo de trámite</div>
            {['Habilitación comercial', 'Licencia de conducir', 'Certificado de domicilio'].map((t, i) => (
              <div key={i} style={{ padding: '16px 20px', borderRadius: 14, marginBottom: 12, background: i === 0 ? 'rgba(242,184,75,0.16)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? ORO + '88' : 'rgba(255,255,255,0.06)'}`, fontSize: 26, fontWeight: i === 0 ? 700 : 500 }}>{t}</div>
            ))}
          </div>
        ) : etapa === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 250, gap: 16 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', border: `6px solid ${check > 0.5 ? VERDE : ORO}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, color: check > 0.5 ? VERDE : ORO, transform: `scale(${0.8 + 0.2 * check})` }}>{check > 0.5 ? '✓' : '◉'}</div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>{check > 0.5 ? 'Identidad validada' : 'Validando con RENAPER…'}</div>
            <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>DNI + selfie con prueba de vida · 30 segundos</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 250, gap: 14 }}>
            <div style={{ padding: '14px 34px', borderRadius: 999, background: VERDE, color: '#06101c', fontSize: 30, fontWeight: 800, transform: `scale(${0.7 + 0.3 * sello}) rotate(${(1 - sello) * -8}deg)`, opacity: sello }}>ENVIADO</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>Trámite #4410 · seguimiento por la app</div>
            <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>Sin ir al municipio. Sin papel.</div>
          </div>
        )}
      </div>
    </Tarjeta>
  );
};

// ── 3. mapa de calor: los puntos aparecen de a uno ──
const PUNTOS = [{ x: 22, y: 30, c: '#ef4444' }, { x: 62, y: 24, c: ORO }, { x: 48, y: 52, c: '#ef4444' }, { x: 80, y: 60, c: VERDE }, { x: 18, y: 72, c: ORO }, { x: 66, y: 80, c: '#ef4444' }, { x: 40, y: 86, c: VERDE }];
const Mapa: React.FC<{ f: number }> = ({ f }) => (
  <Tarjeta f={f} titulo="Mapa de calor" sub="Concentración de reclamos por zona" icono="◎">
    <div style={{ position: 'relative', height: 440, borderRadius: 20, background: '#0A0F1B', border: '1px solid rgba(255,255,255,0.07)', backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '74px 74px', overflow: 'hidden' }}>
      {PUNTOS.map((p, i) => {
        const a = ease(f, 18 + i * 9, 18 + i * 9 + 14);
        return <div key={i} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: 70, height: 70, marginLeft: -35, marginTop: -35, borderRadius: '50%', background: p.c, opacity: 0.55 * a, filter: 'blur(14px)', transform: `scale(${0.4 + 0.6 * a})` }} />;
      })}
      <div style={{ position: 'absolute', left: '48%', top: '52%', marginLeft: -16, marginTop: -40, fontSize: 40, opacity: ease(f, 60, 74) }}>📍</div>
    </div>
  </Tarjeta>
);

// ── 4. tablero: los números cuentan ──
const Dashboard: React.FC<{ f: number }> = ({ f }) => {
  const kpis = [{ l: 'Total reclamos', v: 245, s: '+12%' }, { l: 'Nuevos hoy', v: 8, s: '+5' }, { l: 'Esta semana', v: 34, s: '+8%' }, { l: 'Tiempo prom.', v: 3.2, s: '-0.5d', d: 'd' }];
  const p = ease(f, 14, 54);
  return (
    <Tarjeta f={f} titulo="Municipalidad de tu ciudad" sub="245 reclamos · 3,2 días de resolución promedio" icono="▦">
      <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, border: '1px solid #ef444488', color: '#ef4444', fontSize: 20, fontWeight: 700, marginBottom: 20, letterSpacing: 2 }}>● LIVE</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ padding: '22px 24px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 20, letterSpacing: 2, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>{k.l}</div>
            <div style={{ fontSize: 64, fontWeight: 700, marginTop: 6, letterSpacing: -1 }}>{k.d ? (k.v * p).toFixed(1) + k.d : Math.round(k.v * p)}</div>
            <div style={{ display: 'inline-block', marginTop: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.16)', color: VERDE, fontSize: 20, fontWeight: 700 }}>{k.s}</div>
          </div>
        ))}
      </div>
    </Tarjeta>
  );
};

const Placa: React.FC<{ plan: PlanTarjetas; dur: number }> = ({ plan, dur }) => {
  const f = useCurrentFrame();
  const a = ease(f, 0, 14);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: a }}>
      <Img src={plan.logoSrc} style={{ height: 150, transform: `scale(${0.9 + 0.1 * a})` }} />
      <div style={{ marginTop: 40, fontFamily: serifItalic, fontSize: 92, color: '#fff' }}>{plan.placa.linea1}</div>
      <div style={{ marginTop: 30, padding: '20px 44px', borderRadius: 999, background: ORO, color: '#1a1206', fontFamily: sans, fontWeight: 800, fontSize: 34, boxShadow: `0 20px 60px ${ORO}55`, opacity: ease(f, 10, 24) }}>{plan.placa.linea2}</div>
      {dur > 0 ? null : null}
    </AbsoluteFill>
  );
};

export const MunifyTarjetas: React.FC<TarjetasProps> = ({ plan }) => {
  const { fps } = useVideoConfig();
  const esc = useMemo(() => {
    let c = 0;
    return plan.escenas.map((e) => { const from = c; const dur = Math.round(e.durSec * fps); c += dur; return { ...e, from, dur }; });
  }, [plan, fps]);
  const finEscenas = esc.length ? esc[esc.length - 1].from + esc[esc.length - 1].dur : 0;
  const placaDur = Math.round(plan.placa.durSec * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: '#060B16' }}>
      <Fondo />
      <Sequence from={0} durationInFrames={finEscenas} name="marco">
        <Progreso escenas={esc} />
        <Logo src={plan.logoSrc} />
      </Sequence>
      {esc.map((e, i) => (
        <Sequence key={i} from={e.from} durationInFrames={e.dur} name={`${i + 1} ${e.tipo}`}>
          <EscenaTarjeta e={e} />
        </Sequence>
      ))}
      <Sequence from={finEscenas} durationInFrames={placaDur} name="placa">
        <Placa plan={plan} dur={placaDur} />
      </Sequence>
      <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center', fontFamily: sans, fontSize: 24, color: 'rgba(255,255,255,0.45)', letterSpacing: 2 }}>munify.com.ar</div>
      {plan.voz ? <Sequence from={Math.round((plan.voz.desde || 0) * fps)}><Audio src={plan.voz.src} /></Sequence> : null}
      {plan.musica ? <Audio src={plan.musica.src} volume={plan.musica.gain} /> : null}
    </AbsoluteFill>
  );
};

const EscenaTarjeta: React.FC<{ e: EscenaTarjeta & { dur: number } }> = ({ e }) => {
  const f = useCurrentFrame();
  const salida = 1 - lin(f, e.dur - 8, e.dur);
  if (e.tipo === 'titulo') {
    return <AbsoluteFill style={{ opacity: salida }}><Titulo f={f} chip={e.chip} titulo={e.titulo} resaltar={e.resaltar} sub={e.sub} top={760} size={108} /></AbsoluteFill>;
  }
  return (
    <AbsoluteFill style={{ opacity: salida }}>
      {e.tipo === 'semaforo' ? <Semaforo f={f} dur={e.dur} /> : e.tipo === 'tramite' ? <Tramite f={f} dur={e.dur} /> : e.tipo === 'mapa' ? <Mapa f={f} /> : <Dashboard f={f} />}
      <Titulo f={f} chip={e.chip} titulo={e.titulo} resaltar={e.resaltar} sub={e.sub} top={1290} size={72} />
    </AbsoluteFill>
  );
};
