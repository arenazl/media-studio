// MEDIA KIT — el "input perfecto" que cada app deja en SU repo (`media-kit/` versionada) para que
// Media Studio genere el spot con material REAL: capturas de la app, marca completa y momentos.
// Contrato fuente: D:\Code\base-compartida\16-MEDIA-KIT-DIAGNOSTICO.md.
//
// Este módulo es el ESPEJO tipado del contrato + los conversores kit → proyecto. Todo opcional a
// propósito: un kit puede venir incompleto (la app lo regenera de a poco) y se degrada con gracia —
// nunca se inventa un dato que el kit no traiga (regla dura 11).
//
// El backend lo descubre y lo sirve (server/mediaKit.mjs + 3 endpoints); el front SIEMPRE referencia
// las imágenes por `kitFileUrl` (nunca file://).
import { API_BASE } from '../config';
import type { BrandKit } from './brandKit';

// ── El contrato (media-kit.json) ──────────────────────────────────────────────
export interface MediaKitNegocio {
  queEs?: string;
  queVende?: string;
  aQuien?: string[];
  zona?: string;
  diferenciales?: string[];
  numerosReales?: { dato: string; fuente?: string }[];
  dolorDelCliente?: string[];
  queNoDecir?: string[];
  audienciaPrioritaria?: string;
  sugerencias?: string[];        // OPINIÓN de la app — se guarda SEPARADA de los hechos
}
export interface MediaKitCta { principal?: string; url?: string; secundario?: string }
export interface MediaKitPruebaSocial { tipo?: string; texto?: string; quien?: string }
export interface MediaKitMarca {
  nombreExacto?: string;
  fonetica?: string;
  logo?: { principal?: string; paraFondoOscuro?: string; isotipo?: string };
  colores?: { primario?: string; acento?: string; fondo?: string; texto?: string; exito?: string; alerta?: string; modoNativo?: string };
  tipografias?: { titulos?: string; texto?: string; fallback?: string };
  estiloUI?: { bordes?: string; sombras?: string; botones?: string; densidad?: string; rasgoDistintivo?: string };
  tono?: string;
  claim?: string;
}
export interface MediaKitPantalla {
  archivo: string;               // relativo a media-kit/ (ej. "screens/01-home.png")
  viewport?: string;
  nombre?: string;
  ruta?: string;
  queDemuestra?: string;
  zonaClave?: string;            // dónde hacer zoom/resaltar (lo usa el render v1.5)
  datosVisibles?: string[];
  microAnimacion?: string;
  pendiente?: string;            // el agente no pudo reproducir ese estado (lo declara, no lo simula)
}
export interface MediaKitMomento {
  nombre?: string;
  historia?: string;
  pantallas?: string[];          // relpaths de `pantallas[].archivo`
  remate?: string;
}
export interface MediaKit {
  id: string;
  app?: string;
  generado?: string;
  ambiente?: string;
  negocio?: MediaKitNegocio;
  cta?: MediaKitCta;
  pruebaSocial?: MediaKitPruebaSocial[];
  assetsExtra?: string[];
  marca?: MediaKitMarca;
  pantallas?: MediaKitPantalla[];
  momentos?: MediaKitMomento[];
}

// Lo que devuelve GET /api/media-kit (resumen por kit descubierto).
export interface MediaKitResumen {
  id: string;
  app: string;
  generado: string;
  ambiente?: string;
  carpeta: string;
  pantallas: number;
  momentos: number;
  valido: boolean;
  faltantes: string[];
  sinRegistro?: boolean;         // el kit existe pero su id no está en el registro KSP (llegó antes)
  error?: string;
}

// ── Lo que se ESTAMPA en el Project (WO-K2) ───────────────────────────────────
// La marca COMPLETA del kit. NO reemplaza a `brandKit` (shape intocable: {name,color,logoUrl,
// phonetic,logoPos}) — convive con él como campo nuevo y opcional.
export interface MarcaKit extends MediaKitMarca {
  logoUrl?: string;              // logo principal ya resuelto a URL del endpoint
  logoOscuroUrl?: string;
  isotipoUrl?: string;
}
// Una pantalla del kit, lista para la UI y para el render.
export interface PantallaKit {
  archivo: string;               // relpath DENTRO del kit — es lo que persiste `Escena.archivoCaptura`
  url: string;                   // URL al endpoint del server — lo que pinta la UI (nunca file://)
  nombre: string;
  queDemuestra?: string;
  zonaClave?: string;
  microAnimacion?: string;
  datosVisibles?: string[];
  viewport?: string;
  ruta?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// URL servible de un archivo del kit. Cada segmento se encodea por separado (la "/" del relpath es
// estructura de ruta, no un carácter a escapar).
export function kitFileUrl(kitId: string, relpath: string): string {
  const rel = String(relpath || '').replace(/\\/g, '/').split('/').filter(Boolean).map(encodeURIComponent).join('/');
  return `${API_BASE}/api/media-kit/${encodeURIComponent(kitId)}/file/${rel}`;
}

// Validación mínima (forward-compatible: ignora lo que no conoce).
export function isValidMediaKit(x: unknown): x is MediaKit {
  const k = x as MediaKit;
  return !!k && typeof k === 'object' && typeof k.id === 'string' && !!k.id;
}

// El nombre del negocio según el kit: el nombre EXACTO de la marca manda (con mayúsculas/signos),
// después el `app`, y recién ahí el id.
export function kitNombre(kit: MediaKit): string {
  return kit.marca?.nombreExacto || kit.app || kit.id;
}

// El kit → el brief markdown de HECHOS (mismo formato que el brief del KSP, así los moldes no
// distinguen de dónde vino). Las `sugerencias` van en una sección APARTE, marcada como opinión de
// la app: son la única parte del kit que no es un hecho verificable.
export function mediaKitToBrief(kit: MediaKit): string {
  const n = kit.negocio || {};
  const L: string[] = [];
  L.push(`# ${kitNombre(kit)} — brief (desde el media kit de la app)`);
  if (kit.marca?.claim) L.push(`> ${kit.marca.claim}`);
  L.push('');
  L.push('## El negocio');
  if (n.queEs) L.push(n.queEs);
  if (n.queVende) { L.push(''); L.push(`- Qué vende: ${n.queVende}`); }
  if (n.aQuien?.length) L.push(`- Público: ${n.aQuien.join(' · ')}`);
  if (n.zona) L.push(`- Zona: ${n.zona}`);
  if (n.audienciaPrioritaria) L.push(`- Audiencia prioritaria: ${n.audienciaPrioritaria}`);
  if (n.diferenciales?.length) {
    L.push('');
    L.push('## Por qué (diferenciales)');
    for (const d of n.diferenciales) L.push(`- ${d}`);
  }
  if (n.dolorDelCliente?.length) {
    L.push('');
    L.push('## Dolores del cliente (de acá sale el hook)');
    for (const d of n.dolorDelCliente) L.push(`- ${d}`);
  }
  if (n.numerosReales?.length) {
    L.push('');
    L.push('## Números REALES (citables tal cual — no redondear ni inventar otros)');
    for (const x of n.numerosReales) L.push(`- ${x.dato}${x.fuente ? ` (fuente: ${x.fuente})` : ''}`);
  }
  if (kit.pruebaSocial?.length) {
    L.push('');
    L.push('## Prueba social real');
    for (const p of kit.pruebaSocial) L.push(`- ${[p.tipo, p.texto, p.quien && `— ${p.quien}`].filter(Boolean).join(': ')}`);
  }
  if (kit.cta?.principal || kit.cta?.url) {
    L.push('');
    L.push('## CTA');
    if (kit.cta.principal) L.push(`- ${kit.cta.principal}`);
    if (kit.cta.url) L.push(`- URL: ${kit.cta.url}`);
    if (kit.cta.secundario) L.push(`- Secundario: ${kit.cta.secundario}`);
  }
  if (n.queNoDecir?.length) {
    L.push('');
    L.push('## A evitar (queNoDecir)');
    for (const d of n.queNoDecir) L.push(`- ${d}`);
  }
  if (n.sugerencias?.length) {
    L.push('');
    L.push('## Sugerencias de la app (OPINIÓN, no hechos — tomar o dejar)');
    for (const s of n.sugerencias) L.push(`- ${s}`);
  }
  return L.join('\n');
}

// La marca del kit → la ficha COMPLETA (colores, tipografías, estiloUI) con los logos ya resueltos.
export function mediaKitToMarcaKit(kit: MediaKit): MarcaKit | undefined {
  const m = kit.marca;
  if (!m) return undefined;
  const url = (rel?: string) => (rel ? kitFileUrl(kit.id, rel) : undefined);
  return {
    ...m,
    logoUrl: url(m.logo?.principal),
    logoOscuroUrl: url(m.logo?.paraFondoOscuro),
    isotipoUrl: url(m.logo?.isotipo),
  };
}

// La marca del kit → el BrandKit de siempre. SHAPE INTOCABLE ({name,color,logoUrl,phonetic,logoPos}):
// todo lo que el pipeline ya consume sigue funcionando igual, con o sin kit.
export function mediaKitToBrandKit(kit: MediaKit): BrandKit | undefined {
  const m = kit.marca;
  if (!m) return undefined;
  return {
    name: m.nombreExacto || kitNombre(kit),
    color: m.colores?.acento || m.colores?.primario,
    logoUrl: m.logo?.principal ? kitFileUrl(kit.id, m.logo.principal) : undefined,
    phonetic: m.fonetica,
    logoPos: 'tr',
  };
}

// Las pantallas del kit → las del proyecto (relpath + URL + la metadata que anima el mockup).
export function mediaKitToPantallas(kit: MediaKit): PantallaKit[] {
  return (kit.pantallas || [])
    .filter((p) => p && typeof p.archivo === 'string' && p.archivo.trim())
    .map((p) => ({
      archivo: p.archivo,
      url: kitFileUrl(kit.id, p.archivo),
      nombre: p.nombre || p.archivo.split('/').pop() || p.archivo,
      queDemuestra: p.queDemuestra,
      zonaClave: p.zonaClave,
      microAnimacion: p.microAnimacion,
      datosVisibles: p.datosVisibles,
      viewport: p.viewport,
      ruta: p.ruta,
    }));
}

// Normaliza un label para matchear PANTALLA ↔ ESCENA (mayúsculas, acentos, guiones, extensión).
// OJO: el molde `storyboard` (server/functions.mjs) hace el MISMO match en su parse — el server no
// puede importar este TS, así que duplica la garantía. Si tocás esto, tocá allá (mismo patrón que
// comercial.escenasAPrompts ↔ functions.mjs).
export function normLabel(s: string): string {
  return String(s || '')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// La captura que le corresponde a una escena: primero el `archivoCaptura` explícito (lo asigna el
// molde o el usuario), y si no hay, un match por el label de la pantalla (`screen`).
export function pantallaDeEscena(
  pantallas: PantallaKit[] | undefined,
  escena: { archivoCaptura?: string; screen?: string },
): PantallaKit | undefined {
  const ps = pantallas || [];
  if (escena.archivoCaptura) {
    const exacta = ps.find((p) => p.archivo === escena.archivoCaptura);
    if (exacta) return exacta;
  }
  const label = normLabel(escena.screen || '');
  if (!label) return undefined;
  return ps.find((p) => normLabel(p.nombre) === label)
    || ps.find((p) => normLabel(p.nombre).includes(label) || label.includes(normLabel(p.nombre)));
}

// El kit completo → todo lo que se estampa al crear el proyecto. Lo consume el Wizard (WO-K2).
export interface MediaKitProjectInput {
  name: string;
  type: string;
  brief: string;
  brandKit?: BrandKit;
  marcaKit?: MarcaKit;
  mediaKitId: string;
  cta?: MediaKitCta;
  momentos?: MediaKitMomento[];
  pantallasKit: PantallaKit[];
}
export function mediaKitToProjectInput(kit: MediaKit): MediaKitProjectInput {
  return {
    name: kitNombre(kit),
    type: kit.negocio?.zona || '',
    brief: mediaKitToBrief(kit),
    brandKit: mediaKitToBrandKit(kit),
    marcaKit: mediaKitToMarcaKit(kit),
    mediaKitId: kit.id,
    cta: kit.cta,
    momentos: kit.momentos,
    pantallasKit: mediaKitToPantallas(kit),
  };
}

// Lo que viaja al backend como `piece.mediaKit` para los moldes (WO-K4): SOLO lo que el prompt usa
// (pantallas reales + momentos + CTA), sin URLs ni ruido — el prompt paga por token.
export interface MediaKitParaMolde {
  pantallas: { nombre: string; archivo: string; queDemuestra?: string; microAnimacion?: string; zonaClave?: string }[];
  momentos?: MediaKitMomento[];
  cta?: MediaKitCta;
}
export function mediaKitParaMolde(
  pantallasKit: PantallaKit[] | undefined,
  momentos?: MediaKitMomento[],
  cta?: MediaKitCta,
): MediaKitParaMolde | undefined {
  const pantallas = (pantallasKit || []).map((p) => ({
    nombre: p.nombre, archivo: p.archivo, queDemuestra: p.queDemuestra,
    microAnimacion: p.microAnimacion, zonaClave: p.zonaClave,
  }));
  if (!pantallas.length && !momentos?.length) return undefined;
  return { pantallas, momentos, cta };
}
