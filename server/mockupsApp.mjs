// Mockups de la app (paso de la orquestación, 2026-10-10). La filosofía que fijó Lucas: en una pieza híbrida se
// generan TODOS los crudos filmados (Flow) y, aparte, TODOS los mockups de la app; el montaje decide después qué
// entra. Los mockups no los dibuja ninguna IA en el momento: son tarjetas escritas como código con el estándar de
// calidad (docs/16-montaje-flow/estandar-mockups/), parametrizadas con datos de la app y la marca. Acá se renderizan
// como clips cortos (sin audio) y quedan en la pieza para usarlos como toma de cualquier escena.
import { renderTarjetas, renderTarjetasApp } from './renderRemotion.mjs';
import { catalogoEscrito } from './tarjetasPlantilla.mjs';
import { readMediaKit } from './mediaKit.mjs';

// Catálogo por app: qué tarjetas existen en el motor y con qué textos salen por defecto. Hoy sólo Munify (las cuatro
// de src/remotion/munify/Tarjetas.tsx). Una app nueva entra cuando un agente le escribe sus tarjetas con el estándar.
const CATALOGO = {
  munify: {
    logoSrc: 'https://app.munify.com.ar/brand/Munify.svg',
    tarjetas: [
      { id: 'semaforo', nombre: 'Seguimiento del reclamo', patron: 'estado que cambia', chip: 'Seguimiento', titulo: 'Lo seguís como un envío', resaltar: 'como un envío', sub: 'Recibido, en curso, resuelto. El vecino ve cada paso.', durSec: 6 },
      { id: 'tramite', nombre: 'Trámite por etapas', patron: 'avanza por pasos', chip: 'Trámites', titulo: 'Trámites sin pisar el municipio', resaltar: 'sin pisar', sub: 'Identidad validada con RENAPER, desde el celular.', durSec: 6.5 },
      { id: 'mapa', nombre: 'Mapa de calor de reclamos', patron: 'mapa con puntos', chip: 'Mapa de calor', titulo: 'Dónde están los problemas', resaltar: 'los problemas', sub: 'La concentración de reclamos, barrio por barrio.', durSec: 4.5 },
      { id: 'dashboard', nombre: 'Tablero del municipio', patron: 'números que suben', chip: 'Tablero', titulo: 'Todo el municipio en una pantalla', resaltar: 'una pantalla', sub: 'Reclamos, trámites y pagos, al día.', durSec: 5 },
    ],
  },
};

const clave = (project) => {
  const nombre = String(project?.brandKit?.name || project?.name || project?.id || '').toLowerCase();
  if (/munify/.test(nombre) || /^munify/.test(String(project?.id || '').toLowerCase())) return 'munify';
  return null;
};

// Munify tiene sus tarjetas escritas a mano; cualquier otra app con media kit usa las que le escribió el agente de
// mockups (src/remotion/apps/<id>/), si ya existen.
export function catalogoDeApp(project, { port = 5301, root = process.cwd() } = {}) {
  const k = clave(project);
  if (k) return { app: k, composicion: 'MunifyTarjetas', ...CATALOGO[k] };
  const id = String(project?.kb?.media_kit_id || project?.mediaKitId || '').trim();
  if (!id) return null;
  const cat = catalogoEscrito(root, id);
  if (!cat) return null;
  const kit = readMediaKit(id) || {};
  // el logo sale del kit (el que la app declaró para fondo oscuro), no del catálogo: el agente puede inventar un nombre
  const logo = kit.marca?.logo?.paraFondoOscuroRaster || kit.marca?.logo?.paraFondoOscuro || cat.logo || kit.marca?.logo?.principal || '';
  return { app: id, composicion: 'AppTarjetas', escritoPorAgente: true, logoSrc: logo ? `http://localhost:${port}/api/media-kit/${encodeURIComponent(id)}/file/${String(logo).replace(/^\/+/, '')}` : '', tarjetas: cat.tarjetas };
}

// Renderiza las tarjetas de la app de una pieza y devuelve la lista para guardar en `comercial.mockups`.
// `guardar(buffer, nombre)` → { fileRef, durSec } (lo provee index.mjs con saveAsset); `log` recibe el avance.
export async function generarMockupsApp({ project, marca, port, guardar, log = () => {}, soloIds }) {
  const cat = catalogoDeApp(project, { port });
  if (!cat) throw new Error('esta app todavía no tiene tarjetas en el motor: corré el agente de mockups (POST /api/mockups-app/escribir) con su media kit');
  const logoSrc = cat.escritoPorAgente ? (cat.logoSrc || marca?.logoUrl) : (marca?.logoUrl || cat.logoSrc);
  const tarjetas = cat.tarjetas.filter((t) => !soloIds || soloIds.includes(t.id));
  const salida = [];
  for (const t of tarjetas) {
    const t0 = Date.now();
    const plan = {
      app: cat.app, width: 1080, height: 1920, fps: 30, logoSrc,
      escenas: [{ tipo: t.id, durSec: t.durSec, chip: t.chip, titulo: t.titulo, resaltar: t.resaltar, sub: t.sub }],
      placa: { linea1: '', linea2: '', durSec: 0 },   // sin placa: la placa es de la pieza, no de la tarjeta
    };
    const { buffer, durationSec } = await (cat.composicion === 'AppTarjetas' ? renderTarjetasApp : renderTarjetas)(plan, { port, log });
    const { fileRef, durSec } = await guardar(buffer, `mockup-${cat.app}-${t.id}-${Date.now()}.mp4`);
    salida.push({ id: `mk-${t.id}`, tarjeta: t.id, nombre: t.nombre, patron: t.patron, chip: t.chip, titulo: t.titulo, fileRef, durSec: durSec || durationSec, generadoEn: Date.now() });
    log(`mockup ${t.nombre}: ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  return salida;
}
