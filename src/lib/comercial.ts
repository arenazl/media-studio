// Columna vertebral de datos del rework: el `Comercial` y sus piezas atraviesan el PIPELINE de
// producción (negocio → concepto → guion → cast → storyboard → pack/render → rodaje → montaje →
// publicar). Acá viven los TIPOS + helpers PUROS (sin IA, sin red) — testeables directo.
//
// Origen: docs/07-rework/01-vision-y-pipeline.md §5 y 02-fase-1-datos-y-moldes.md §Datos.
// El shape del MONTAJE (`MontajePlan`) lo define la Fase 4; acá `Comercial.montaje` queda laxo.

// ── Pasos del pipeline ────────────────────────────────────────────────────────
export type PasoId =
  | 'negocio' | 'concepto' | 'guion' | 'cast' | 'storyboard'
  | 'pack' | 'render' | 'rodaje' | 'montaje' | 'publicar';

export type EstadoPaso = 'pendiente' | 'generado' | 'editado' | 'aprobado';
export type TipoComercial = 'filmado' | 'animado';
export type RolBloque = 'hook' | 'desarrollo' | 'gag' | 'cta';

// ── Artefactos por paso ───────────────────────────────────────────────────────
export interface Concepto {
  id: string;
  idea: string;              // una situación/gancho concreto
  tono: string;
  estetica: string;          // dirección visual (luz, paleta, estilo de foto)
  referencia: string;        // a qué tipo de anuncio conocido se parece
  porQueFunciona: string;
}

export interface GuionBloque {
  role: RolBloque;
  narration: string;         // lo que se DICE (voz)
  visual: string;            // lo que se VE
  durSec?: number;
}

export interface GuionEstructurado {
  blocks: GuionBloque[];
  music?: { mood: string };
}

export interface CharacterSheet {
  id: string;
  nombre: string;
  rol: string;
  fisicoEn: string;   // descripción física EXACTA en inglés — se pega VERBATIM en cada prompt (clave de consistencia)
  fisicoEs: string;   // resumen en español, para la UI
  vestuario: string;
  personalidad: string;
}

export interface Cast {
  personajes: CharacterSheet[];
  lugar: { nombre: string; descripcionEn: string; luz: string };
}

export interface Escena {
  n: number;
  rol: RolBloque;
  durSec: number;                    // talking head: 8s MÍNIMO (regla dura)
  plano: string;                     // medium shot waist-up / etc. (vacío en animado)
  angulo: string;                    // eye-level / etc. (vacío en animado)
  personajes: string[];              // ids del cast (vacío en animado)
  accion: string;                    // filmado: acción · animado: título corto que vende el momento
  dialogo: string;                   // rioplatense; marca SIEMPRE fonética (vacío en animado)
  continuidad: string;               // filmado: qué matchea con la escena vecina · animado: palabra a RESALTAR
  screen?: string;                   // animado: label de la pantalla del KB
}

// Flujo NUEVO de Google Flow (imagen-first): el personaje es una ENTIDAD con una IMAGEN de referencia
// (Nano Banana); su `promptImagen` genera esa foto. La consistencia la fija la imagen, no el texto.
export interface PersonajeFlow {
  id: string;
  nombre: string;
  promptImagen: string;              // retrato full-body 9:16 para generar la imagen de referencia en Flow
}

// Una escena a animar en Flow: su prompt referencia a los personajes por NOMBRE (sin fisicoEn).
export interface EscenaFlow {
  escenaN: number;
  rol: string;                       // hook|desarrollo|gag|cta (heredado del storyboard)
  prompt: string;                    // acción + cámara + diálogo rioplatense + personaje corto "Argentine"
  estado: 'pendiente' | 'copiado' | 'importado';
  tomaId?: string;
}

export interface PackFlow {
  estilo: string;                    // bloque de estilo global (sin personajes ni acción)
  personajes: PersonajeFlow[];       // 1 por personaje del cast → su imagen de referencia
  escenas: EscenaFlow[];             // 1 por escena del storyboard → un clip a animar
}

// fileRef = el public_id RELATIVO que devuelve saveAsset (ej. "proj-x/173..-clip.mp4") — NUNCA la URL
// absoluta: el render lo mapea directo a STORAGE_DIR/<rel>; el front lo sirve por /api/storage/<rel>.
export interface Toma {
  id: string;
  escenaN: number;
  fileRef: string;
  durSec: number;
  promptUsado?: string;   // WO-6b/D8: snapshot del prompt de Flow que originó este clip (histórico real)
}

export interface PublishPack {
  hookOnScreen: string;
  caption: string;
  hashtags: string[];
  cta: string;
}

// Resultado del QA holístico del comercial (molde `qa`, foco 'todo') — persistido para no reevaluar al volver al paso.
export interface QaResult {
  score: number;
  verdict: string;
  issues?: { severity: string; note: string }[];
}

// La entidad central: cada versión/approach del proyecto es un `Comercial` que recorre el pipeline.
export interface Comercial {
  id: string;
  titulo: string;                    // "problema-solución: el caos vs el orden"
  tipo: TipoComercial;               // bifurcación del paso 6 (filmado → Flow · animado → render)
  formatoId?: string;                // WO-1: formato de salida (aspecto/plataforma/técnica) — id de FORMATOS_DEF (formato.ts). Ausente = proyectos viejos (default 9:16 filmado).
  angulo?: string;                   // C7: ángulo estratégico (de `strategy`) — proxy de diferenciación que alimenta el concepto
  creativeBrief?: string;            // C7: brief creativo por pieza (de `strategy`)
  estados: Record<PasoId, EstadoPaso>;
  concepto?: Concepto;               // paso 2
  guion?: GuionEstructurado;         // paso 3
  cast?: Cast;                       // paso 4 (solo filmado)
  storyboard?: Escena[];             // paso 5
  packFlow?: PackFlow;               // paso 6a (solo filmado)
  renderRef?: string;                // paso 6b (solo animado): el mp4 renderizado del storyboard
  rodaje?: Toma[];                   // paso 7 (solo filmado; refs a server/storage)
  montaje?: unknown;                 // paso 8 — MontajePlan lo define la Fase 4 (tipado laxo hasta entonces)
  qa?: QaResult;                     // paso 8 — QA holístico persistido (C9: antes vivía en useState y se perdía)
  publicacion?: PublishPack;         // paso 9
}

// ── Orden canónico + visibilidad por tipo ─────────────────────────────────────
// Un único orden fuente; cada tipo esconde los pasos que no le aplican.
const PASOS_ORDEN: PasoId[] = [
  'negocio', 'concepto', 'guion', 'cast', 'storyboard', 'pack', 'render', 'rodaje', 'montaje', 'publicar',
];

// filmado: sin `render` (9 pasos). animado: sin `cast`/`pack`/`rodaje` (7 pasos — recrea pantallas, no castea personas).
const PASOS_EXCLUIDOS: Record<TipoComercial, PasoId[]> = {
  filmado: ['render'],
  animado: ['cast', 'pack', 'rodaje'],
};

const RANK: Record<EstadoPaso, number> = { pendiente: 0, generado: 1, editado: 2, aprobado: 3 };

// ── Helpers puros ─────────────────────────────────────────────────────────────

// slug para el id (misma idea que projects.ts, sin dependencias).
const slug = (s: string): string =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Los pasos VISIBLES para un tipo, en orden.
export function pasosVisibles(tipo: TipoComercial): PasoId[] {
  const fuera = new Set(PASOS_EXCLUIDOS[tipo]);
  return PASOS_ORDEN.filter((p) => !fuera.has(p));
}

// Crea un comercial nuevo con TODOS los estados en 'pendiente'.
export function nuevoComercial(titulo: string, tipo: TipoComercial): Comercial {
  const estados = Object.fromEntries(PASOS_ORDEN.map((p) => [p, 'pendiente'])) as Record<PasoId, EstadoPaso>;
  return {
    id: `com-${slug(titulo) || 'comercial'}-${Date.now().toString(36).slice(-4)}`,
    titulo: titulo.trim() || 'Comercial sin título',
    tipo,
    estados,
  };
}

// Copia INMUTABLE con el estado de un paso actualizado.
export function avanzarEstado(c: Comercial, paso: PasoId, estado: EstadoPaso): Comercial {
  return { ...c, estados: { ...c.estados, [paso]: estado } };
}

// Un paso se habilita cuando el ANTERIOR VISIBLE de su tipo está ≥ 'generado'. El primer paso
// visible ('negocio') siempre habilitado. Un paso no visible para el tipo → false.
export function pasoHabilitado(c: Comercial, paso: PasoId): boolean {
  const visibles = pasosVisibles(c.tipo);
  const idx = visibles.indexOf(paso);
  if (idx === -1) return false;
  if (idx === 0) return true;                       // 'negocio' siempre
  const anterior = visibles[idx - 1];
  return RANK[c.estados[anterior]] >= RANK.generado;
}

// Validación de referencia cruzada storyboard↔cast: cada `Escena.personajes[]` debe existir en el
// cast. Helper de UI (lo usa PasoStoryboard en Fase 2). OJO: el molde `flowpack` (server) NO puede
// importar este TS — duplica su propia garantía en functions.mjs (anotado allá).
export interface RefFaltante { escenaN: number; personajeId: string }
export function escenasAPrompts(
  storyboard: Escena[] | undefined,
  cast: Cast | undefined,
): { ok: boolean; faltantes: RefFaltante[] } {
  const ids = new Set((cast?.personajes ?? []).map((p) => p.id));
  const faltantes: RefFaltante[] = [];
  for (const e of storyboard ?? []) {
    for (const pid of e.personajes ?? []) {
      if (!ids.has(pid)) faltantes.push({ escenaN: e.n, personajeId: pid });
    }
  }
  return { ok: faltantes.length === 0, faltantes };
}

// Progreso del Pack Flow: escenas copiadas (o importadas) e importadas sobre el total. Tolerante con
// el shape VIEJO ({master, clips}) persistido: sin `escenas` → todo en cero (PasoPack pide regenerar).
export function packProgress(pack: PackFlow | undefined): { total: number; copiados: number; importados: number } {
  const escenas = pack?.escenas ?? [];
  return {
    total: escenas.length,
    copiados: escenas.filter((e) => e.estado !== 'pendiente').length,
    importados: escenas.filter((e) => e.estado === 'importado').length,
  };
}
