// LOS TRES PRESETS DE CALIDAD Y GASTO DE CRÉDITOS DE FLOW (Lucas, 2026-10-14: "quiero que tengamos 3 presets de calidad /
// gasto de créditos"). El elegido vale para todo lo que se genera en Flow: los comerciales y los pedidos de SalesBot.
// Lo que más gasta es la foto: hasta hoy cada foto era un video entero de Veo del que se sacaba un cuadro. Con "imagen", la
// foto se pide a Flow como imagen y no se genera ningún video.
// Los modelos son expresiones que se buscan en el desplegable de Flow, en orden de preferencia: se usa la primera que
// exista en la cuenta. Si ninguna existe, queda el modelo que Flow tenga puesto.
import fs from 'node:fs';
import path from 'node:path';

const VEO_RAPIDO = 'Veo 3\\.1.*(Fast|R[aá]pido)';
export const PRESETS = {
  ahorro: {
    nombre: 'Ahorro',
    detalle: 'Las fotos salen como imagen, sin generar un video. Los videos, con Veo rápido a 720p y en baja prioridad si tu cuenta la tiene.',
    foto: 'imagen',
    imagen: { modelos: [] },
    video: { modelos: ['Lower Priority|Baja prioridad|Prioridad baja', VEO_RAPIDO], resolucion: '720p', duracion: '8 s', salidas: 'x1' },
  },
  normal: {
    nombre: 'Normal',
    detalle: 'Como hasta hoy: la foto es un cuadro de un video de Veo rápido a 720p, y los videos salen igual.',
    foto: 'video',
    imagen: { modelos: [] },
    video: { modelos: [VEO_RAPIDO], resolucion: '720p', duracion: '8 s', salidas: 'x1' },
  },
  calidad: {
    nombre: 'Calidad',
    detalle: 'Las fotos salen como imagen. Los videos, con Veo de calidad a 1080p: gasta bastante más por video.',
    foto: 'imagen',
    imagen: { modelos: [] },
    video: { modelos: ['Veo 3\\.1(?!.*(Fast|R[aá]pido|Lower|Baja|Prioridad))'], resolucion: '1080p', duracion: '8 s', salidas: 'x1' },
  },
};
const PREDETERMINADO = 'normal';
const ARCHIVO = path.resolve('server/storage/flow-calidad.json');

export function presetElegido() {
  try { const id = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')).preset; if (PRESETS[id]) return id; } catch { /* sin elegir todavía */ }
  return PREDETERMINADO;
}
export function elegirPreset(id) {
  if (!PRESETS[id]) throw new Error(`no existe el preset "${id}"`);
  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  fs.writeFileSync(ARCHIVO, JSON.stringify({ preset: id, desde: new Date().toISOString() }, null, 1) + '\n');
  return id;
}
export const presetActual = () => { const id = presetElegido(); return { id, ...PRESETS[id] }; };
export const listaPresets = () => Object.entries(PRESETS).map(([id, p]) => ({ id, nombre: p.nombre, detalle: p.detalle }));

/** Lo que se le pide al panel de ajustes de Flow para generar en `modo` ('video' | 'imagen') con este preset. */
export function ajustesFlow(preset, modo = 'video') {
  if (modo === 'imagen') return { tipo: 'imagen', modelos: preset.imagen?.modelos || [], salidas: 'x1' };
  return { tipo: 'video', ...preset.video };
}

// la foto como imagen necesita la extensión 0.5.0 o más nueva (antes sólo sabía pedir video)
const numeros = (v) => String(v || '0').split('.').map((x) => Number(x) || 0);
export function extensionAlMenos(version, minimo) {
  const a = numeros(version), b = numeros(minimo);
  for (let i = 0; i < Math.max(a.length, b.length); i++) { if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0); }
  return true;
}
export const EXTENSION_CON_IMAGEN = '0.5.0';
