// MOCKUPS "PowerPoint avanzado": del storyboard animado (una escena por pantalla, con título corto, palabra a
// resaltar y captura real) al PlanMockup que dibuja la composición `src/remotion/Mockups.tsx`. Puro y testeable.
// Lo que no está en los datos no se inventa: sin captura que coincida, la escena es de título; sin cifra en el
// texto, no hay número que cuente.
import type { Comercial, Escena } from './comercial';
import type { PantallaKit } from './mediaKit';
import type { EscenaMockup, EstiloMarca, PlanMockup } from './montajePlan';
import { hostnameDe, normalizar, raiz } from './montajista';

export const ESTILO_OSCURO: EstiloMarca = { primario: '#7C3AED', acento: '#F59E0B', fondo: '#0B0A14', texto: '#F6F3FF' };
export const PLACA_MOCKUP_DUR = 3.2;
export const ESCENA_MIN = 2.5;

export interface InsumosMockups {
  pantallas: PantallaKit[];
  marca: { nombre: string; logoUrl?: string; url?: string; colores?: { primario?: string; acento?: string } };
  cta?: { principal?: string; url?: string };
  dims?: { width: number; height: number; fps: number };
  medidas?: Record<string, number>;         // medido en el front: alto/ancho de cada captura (más de 1 = celular → marco de teléfono)
  logoCuadrado?: boolean;                   // medido en el front: logo casi cuadrado = isotipo → se escribe el nombre al lado
}

export const SUB_MAX = 110;   // la narración se muestra como línea secundaria si es corta (el reel se mira sin sonido)

// cifra "visible" en un texto: 1.229 · 4.280.000 · 87% · 12 cuotas. "4 pasos" no cuenta (no vale animarlo).
export function numeroDe(texto: string): string | undefined {
  const m = /(?<![\w.,])(\d{1,3}(?:\.\d{3})+|\d+)(\s?%)?(?![\w.])/.exec(texto || '');
  if (!m) return undefined;
  const n = Number(m[1].replace(/\./g, ''));
  if (!m[2] && n < 10) return undefined;
  return m[1] + (m[2] ? '%' : '');
}

function tokens(texto: string): Set<string> {
  const out = new Set<string>();
  for (const w of normalizar(texto).split(/\s+/)) { const r = raiz(w); if (r) out.add(r); }
  return out;
}

// la captura de una escena: la asignada por el storyboard; si no, la pantalla cuyo nombre más se parece a
// `screen` (+ el título). El storyboard decide si la escena ES de pantalla (trae `screen`); el kit decide cuál.
// Sin `screen` ni captura asignada, la escena es de título: no se adivina una pantalla por una palabra suelta.
export function elegirCaptura(e: Escena, pantallas: PantallaKit[]): PantallaKit | undefined {
  if (!pantallas.length) return undefined;
  if (e.archivoCaptura) {
    const p = pantallas.find((x) => x.archivo === e.archivoCaptura);
    if (p) return p;
  }
  if (!e.screen) return undefined;
  const pedido = tokens(`${e.screen} ${e.accion || ''}`);
  if (!pedido.size) return undefined;
  let mejor: { p: PantallaKit; puntos: number } | undefined;
  for (const p of pantallas) {
    const enNombre = tokens(p.nombre);
    const enZona = tokens(p.zonaClave || '');
    let puntos = 0;
    for (const r of pedido) { if (enNombre.has(r)) puntos += 3; else if (enZona.has(r)) puntos += 1; }   // el nombre pesa más que la zona
    if (normalizar(p.nombre).trim() === normalizar(e.screen).trim()) puntos += 10;
    if (puntos > 0 && (!mejor || puntos > mejor.puntos)) mejor = { p, puntos };
  }
  return mejor?.p;
}

// partes del título para pintar el resaltado: [antes, resaltado, después]; sin coincidencia, todo "antes".
export function partesResaltadas(titulo: string, resaltar?: string): [string, string, string] {
  const r = (resaltar || '').trim();
  if (!r) return [titulo, '', ''];
  const i = titulo.toLowerCase().indexOf(r.toLowerCase());
  if (i < 0) return [titulo, '', ''];
  return [titulo.slice(0, i), titulo.slice(i, i + r.length), titulo.slice(i + r.length)];
}

export function armarMockups(comercial: Comercial, insumos: InsumosMockups): PlanMockup {
  const { pantallas, marca, cta, dims, medidas = {}, logoCuadrado = false } = insumos;
  const escenas: EscenaMockup[] = (comercial.storyboard || []).map((e) => {
    const captura = e.rol === 'cta' ? undefined : elegirCaptura(e, pantallas);
    const titulo = (e.accion || e.dialogo || '').trim();
    const resaltar = e.continuidad && titulo.toLowerCase().includes(e.continuidad.toLowerCase()) ? e.continuidad : undefined;
    const dialogo = (e.dialogo || '').trim();
    const sub = dialogo && dialogo !== titulo && dialogo.length <= SUB_MAX ? dialogo : undefined;
    const base: EscenaMockup = { n: e.n, tipo: captura ? 'pantalla' : 'titulo', durSec: Math.max(ESCENA_MIN, e.durSec || 4), titulo, resaltar, sub };
    if (captura) {
      const src = captura.url || captura.archivo;
      const proporcion = medidas[src];
      const alto = proporcion ? proporcion > 1 : /mobile|movil|móvil|celular|phone/i.test(captura.viewport || '');
      return { ...base, badge: captura.nombre, captura: { src, nombre: captura.nombre, alto, proporcion } };
    }
    return { ...base, badge: e.screen || undefined, numero: numeroDe(e.accion || '') || numeroDe(e.dialogo || '') };
  });
  const host = hostnameDe(cta?.url || marca.url);
  const principal = (cta?.principal || '').trim();
  const placa = principal || host
    ? { linea1: principal || `Conocé ${host}`, linea2: host && !normalizar(principal).includes(normalizar(host)) ? host : undefined, durSec: PLACA_MOCKUP_DUR, logoSrc: marca.logoUrl }
    : undefined;
  return {
    width: dims?.width || 1080, height: dims?.height || 1920, fps: dims?.fps || 30,
    escenas, placa,
    marca: {
      nombre: marca.nombre, logoSrc: marca.logoUrl, mostrarNombre: !marca.logoUrl || logoCuadrado, sitio: host,
      estilo: { ...ESTILO_OSCURO, primario: marca.colores?.primario || ESTILO_OSCURO.primario, acento: marca.colores?.acento || ESTILO_OSCURO.acento },
    },
  };
}
