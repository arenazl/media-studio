// Segundo proyecto DEMO "FitPass" — DATA, no core. Rubro distinto a Munify (app fitness
// B2C) para mostrar que el producto es AGNÓSTICO: mismo camino (brief + capturas + marca +
// reels con guion), otro negocio. Todo es de EJEMPLO — nada acá es un cliente real.
import type { Project, ProjectReel } from '../lib/projects';

const LIME = '#7CCF3F';
const INK = '#0E1A12';

// dataURL de un SVG (capturas mock + logo). Sin emojis: formas + texto.
const svgUrl = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// mock de una pantalla de app 9:16 (header de marca + lista + CTA). Demo, sin datos reales.
function screen(title: string, rows: string[], cta: string): string {
  const list = rows.map((r, i) => `
    <g transform="translate(40,${236 + i * 132})">
      <rect width="520" height="108" rx="20" fill="#ffffff" stroke="#E6EFE0"/>
      <rect x="22" y="22" width="64" height="64" rx="14" fill="${LIME}" opacity="0.28"/>
      <text x="108" y="50" font-family="Inter,Arial" font-size="28" font-weight="700" fill="#22302A">${r}</text>
      <rect x="108" y="66" width="${150 + i * 22}" height="12" rx="6" fill="#9AA8A0"/>
    </g>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1067" viewBox="0 0 600 1067">
    <rect width="600" height="1067" fill="#F4F8F1"/>
    <rect width="600" height="176" fill="${INK}"/>
    <text x="40" y="104" font-family="Inter,Arial" font-size="42" font-weight="800" fill="#ffffff">${title}</text>
    <circle cx="542" cy="88" r="28" fill="${LIME}"/>
    ${list}
    <rect x="40" y="952" width="520" height="80" rx="40" fill="${LIME}"/>
    <text x="300" y="1003" text-anchor="middle" font-family="Inter,Arial" font-size="32" font-weight="800" fill="${INK}">${cta}</text>
  </svg>`;
  return svgUrl(svg);
}

// logo de marca (rayo) — overlay del preview (Fase 6).
const LOGO = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" rx="38" fill="${INK}"/>
  <path d="M86 30 L58 86 L78 86 L70 130 L104 70 L82 70 Z" fill="${LIME}"/>
</svg>`);

const REELS: Array<{ id: string; nombre: string; guion: string[] }> = [
  {
    id: 'dolor', nombre: 'El gym de siempre',
    guion: [
      '¿Cuántas veces fuiste al gimnasio este mes?',
      'Pagás la cuota completa y entrenás cuatro días.',
      'Con FitPass entrenás donde quieras, el día que quieras.',
      'Una sola membresía, cientos de lugares.',
      'Probá tu primera semana gratis.',
    ],
  },
  {
    id: 'variedad', nombre: 'Cambiá todos los días',
    guion: [
      'Hoy funcional, mañana yoga, el finde natación.',
      'Tu cuerpo se aburre de hacer siempre lo mismo.',
      'Con una membresía entrás a todas las actividades.',
      'Elegís, reservás y entrás con el QR.',
      'Descargá FitPass y empezá hoy.',
    ],
  },
  {
    id: 'flexible', nombre: 'Sin permanencia',
    guion: [
      'Te mudás, viajás, cambiás de barrio.',
      'Tu gimnasio no debería atarte a un solo lugar.',
      'FitPass funciona en toda la ciudad, sin permanencia.',
      'Pausás cuando querés y volvés cuando querés.',
      'Primera semana gratis, sin tarjeta.',
    ],
  },
  {
    id: 'gratis', nombre: 'Empezá gratis',
    guion: [
      'Entrenar no tiene que ser un problema.',
      'Una app, cientos de sedes, cero excusas.',
      'Reservás en dos toques y entrás con el celular.',
      'Tu primera semana es gratis.',
      'Descargá FitPass ahora.',
    ],
  },
  {
    id: 'app', nombre: 'Así de fácil',
    guion: [
      'Abrís la app y ves todas las clases cerca tuyo.',
      'Elegís el horario que te queda bien.',
      'Reservás y te llega el recordatorio.',
      'Llegás, mostrás el QR y entrás.',
      'Probalo gratis esta semana.',
    ],
  },
];

const BRIEF = `# FitPass — brief (PROYECTO DE EJEMPLO)
> Datos de demostración. Nada acá es un cliente ni un dato real.

## 1. El negocio
- Qué: una sola membresía para entrenar en cientos de gimnasios y estudios (musculación, yoga, boxeo, pilates, natación).
- Rubro: app fitness (B2C). Dónde: CABA + GBA, vía app.

## 2. Producto
- Elegís la actividad, reservás y hacés check-in con QR. Membresía mensual, sin permanencia.

## 3. Público
- 25-40, trabajan, buscan variedad y flexibilidad. Hablan informal.

## 4. Dolor
- Pagás un gym y vas pocas veces; querés probar otras disciplinas sin sumar otra cuota. Atado a un solo lugar y horario.

## 5. Por qué FitPass
- Una membresía, cientos de lugares, sin permanencia. (Cifras reales: las pone el cliente; acá omitidas a propósito.)

## 6. Acción (CTA)
- Primera semana gratis · descargá la app.

## 7. Marca
- Tono cercano y enérgico. Color lima. Español rioplatense.

## 9. Preset
- Mezcla: reels 9:16 (awareness/conversión) + demo de la app con mockups.`;

export function fitpassReels(): ProjectReel[] {
  return REELS.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    guion: r.guion,
    frases: r.guion.length,
    slidesRef: null,
    voiceConfig: null,
  }));
}

export function fitpassProject(): Project {
  const t = Date.now();
  return {
    id: 'fitpass', name: 'FitPass', type: 'App fitness (B2C)',
    preloaded: true, contentType: 'combinado',
    brief: BRIEF,
    screenshots: [
      screen('Actividades', ['Funcional', 'Yoga', 'Boxeo', 'Natación'], 'Reservar'),
      screen('Tu clase', ['Hoy 19:00 hs', 'Estudio Palermo', 'Lugares: 6'], 'Confirmar'),
      screen('Check-in', ['Mostrá tu QR', 'Racha: 5 días'], 'Entrar'),
    ],
    brandKit: { name: 'FitPass', phonetic: 'Fitpás', color: LIME, logoUrl: LOGO, logoPos: 'tr' },
    reels: fitpassReels(),
    created_at: t, updated_at: t,
  };
}
