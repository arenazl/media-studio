// COPIA DEL CATÁLOGO v2 (APP_GUIDE/components/v2/tema) — NO editar acá: se cura en el
// catálogo y después baja a la app (LEY 0 del kit). Ver su README.md.
/**
 * TEMA v3 — el sistema de apariencia COMPARTIDO de la familia de apps.
 * Catálogo: d:\Code\APP_GUIDE\components\v2\tema\ · Guía: base-compartida/framework/
 *
 * Nació el 2026-10-07 destilando lo que ya corría en Munify (`sugerenciasMun`,
 * la referencia viva) y en SalesBot, para que no haya una tercera versión
 * escrita a mano por app. LEY 0 del kit: la app CONSUME de acá.
 *
 * TRES EJES, y nada más:
 *
 *   1. MODO — claro u oscuro. Es lo que alterna la LUNA / el SOL.
 *   2. FONDO — seis, TRES POR MODO (neutro, cálido, frío). De cada uno se
 *      declara UN solo color base; superficies, bordes y textos se DERIVAN.
 *   3. ACENTO — paleta CERRADA de ocho, TRANSVERSAL: el mismo acento vale
 *      sobre cualquiera de los seis fondos y pinta todo lo interactivo.
 *
 * Se guardan DOS preferencias de fondo (el claro y el oscuro elegidos): la
 * luna salta de uno al otro y el acento se CONSERVA.
 *
 * POR QUÉ UN SOLO COLOR DECLARADO POR FONDO: antes cada combinación
 * fondo×acento nacía como preset nuevo, y la colección se desbordó a 40
 * paletas con duplicados. Separando los ejes, 6 fondos × 8 acentos = 48
 * apariencias con 14 valores declarados.
 *
 * ESTE ARCHIVO NO IMPORTA REACT: es lógica pura (deriva colores y los escribe
 * como variables CSS). Sirve igual en un test de Node que en el navegador.
 */

export type Modo = 'light' | 'dark'
export type Temperatura = 'neutro' | 'calido' | 'frio'

/** Un fondo: lo único declarado a mano es `base` + `modo`. */
export interface Fondo {
  id: string
  nombre: string
  modo: Modo
  /** Su columna en la matriz del selector. Dos fondos nunca comparten
   *  (modo, temperatura): si comparten, uno de los dos sobra. */
  temperatura: Temperatura
  /** Color base. TODO el resto de las superficies sale de acá. */
  base: string
  /** Acento que se aplica al elegir este fondo MIENTRAS el usuario no haya
   *  elegido uno propio (si eligió, su elección manda). */
  acentoRecomendado: string
}

/** Un acento del catálogo transversal. */
export interface Acento {
  id: string
  nombre: string
  color: string
}

// ============================================================
// EJE 1 — FONDOS: una MATRIZ, no una lista
//
//                 neutro      cálido      frío
//     oscuro      Grafito     Tabaco      Marino
//     claro       Nieve       Marfil      Hielo
//
// Cada casillero se puede nombrar y ninguno se solapa con el de al lado, que
// era el problema real (el dueño, 2026-08-13: "gris, negro y azul los veo muy
// similares" — tres neutros oscuros compitiendo entre sí).
//
// NO HAY NEGRO PURO (#0a0a0a): sobre negro las tarjetas no se despegan y la
// sombra directamente no existe; el neutro oscuro arranca un paso adentro.
// NO HAY BLANCO PURO: sin blanco roto hay que ponerle borde a todo.
// ============================================================

export const FONDOS: Fondo[] = [
  // ---- OSCUROS ----
  { id: 'grafito', nombre: 'Grafito', modo: 'dark', temperatura: 'neutro', base: '#1b2027', acentoRecomendado: 'azul' },
  { id: 'tabaco', nombre: 'Tabaco', modo: 'dark', temperatura: 'calido', base: '#241f1b', acentoRecomendado: 'terracota' },
  { id: 'marino', nombre: 'Marino', modo: 'dark', temperatura: 'frio', base: '#18202f', acentoRecomendado: 'azul' },
  // ---- CLAROS ----
  { id: 'nieve', nombre: 'Nieve', modo: 'light', temperatura: 'neutro', base: '#fafaf9', acentoRecomendado: 'azul' },
  { id: 'marfil', nombre: 'Marfil', modo: 'light', temperatura: 'calido', base: '#f7f4ee', acentoRecomendado: 'terracota' },
  { id: 'hielo', nombre: 'Hielo', modo: 'light', temperatura: 'frio', base: '#f3f6fa', acentoRecomendado: 'turquesa' },
]

// ============================================================
// EJE 2 — ACENTOS: paleta CERRADA de ocho
//
// Ocho, no un selector libre de color: cada acento tiene que funcionar sobre
// fondo oscuro Y sobre fondo claro. Con color libre alguien elige un amarillo
// con el que la píldora activa deja de leerse. Estos ocho están probados
// contra las dos superficies.
// ============================================================

export const ACENTOS: Acento[] = [
  { id: 'azul', nombre: 'Azul', color: '#4b87f5' },
  { id: 'verde', nombre: 'Verde', color: '#2fb37e' },
  { id: 'terracota', nombre: 'Terracota', color: '#d96a3f' },
  { id: 'vino', nombre: 'Vino', color: '#b4515e' },
  { id: 'violeta', nombre: 'Violeta', color: '#7c6ce0' },
  { id: 'turquesa', nombre: 'Turquesa', color: '#0fa3b1' },
  { id: 'dorado', nombre: 'Dorado', color: '#c79a2b' },
  { id: 'gris', nombre: 'Gris', color: '#6b7480' },
]

/** IDs viejos → nuevos. Hay usuarios con la preferencia anterior guardada en
 *  localStorage: sin esta tabla abrirían la app con el default y pensarían que
 *  se les borró lo que habían elegido. */
export const ALIAS_FONDOS: Record<string, string> = {
  niebla: 'nieve', carbon: 'grafito', midnight: 'marino',
  blanco: 'nieve', gris: 'grafito', negro: 'grafito', azul: 'marino', ambar: 'marfil',
}

export const ALIAS_ACENTOS: Record<string, string> = {
  esmeralda: 'verde', olivo: 'verde', celeste: 'azul', indigo: 'violeta',
  rosa: 'vino', rojo: 'vino', naranja: 'terracota', ambar: 'dorado',
  blanco: 'gris', negro: 'gris', neutro: 'gris',
}

// ---------------------------------------------------------------- color utils

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

export function darken(hex: string, percent: number): string {
  const amt = Math.round(2.55 * percent)
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r - amt, g - amt, b - amt)
}

export function lighten(hex: string, percent: number): string {
  const amt = Math.round(2.55 * percent)
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r + amt, g + amt, b + amt)
}

export function mix(hex1: string, hex2: string, ratio: number): string {
  const a = hexToRgb(hex1), b = hexToRgb(hex2)
  return rgbToHex(
    a[0] * (1 - ratio) + b[0] * ratio,
    a[1] * (1 - ratio) + b[1] * ratio,
    a[2] * (1 - ratio) + b[2] * ratio,
  )
}

export function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/** Luminancia PERCEPTUAL (coeficientes YIQ), 0 oscuro → 1 claro. */
export function luminancia(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255
}

const TINTA_OSCURA = '#1e293b'
const TINTA_CLARA = '#ffffff'

/**
 * Texto sobre una superficie de color (el acento). REGLA ÚNICA del kit:
 * acento oscuro → tinta clara, acento claro → tinta oscura.
 *
 * El umbral es 0.59 y NO es arbitrario — es la TERCERA vara, las dos
 * anteriores fallaron en un color cada una:
 *   1. luminancia > 0.5: el azul (#4a90e2, 0.52) y el verde (#22c55e, 0.53)
 *      daban "claros" → botón azul con texto azul (bug de QA).
 *   2. WCAG contraste(blanco) >= 3: salvaba al azul (3.7:1) pero dejaba al
 *      verde en 2.1:1 → botón verde con tinta oscura. La norma es matemática,
 *      no perceptual: sobre verdes medios "gana" el negro aunque el ojo pida
 *      blanco.
 *   3. AHORA: luminancia perceptual con el corte donde lo pone el ojo, 0.59,
 *      entre el verde pleno (0.53 → blanca) y la lima (0.63 → oscura).
 */
export function tintaSobre(fondo: string): string {
  return luminancia(fondo) > 0.59 ? TINTA_OSCURA : TINTA_CLARA
}

// ---------------------------------------------------------------- derivación

/**
 * Los tokens que el tema EMITE. Los nombres son los que ya corren en Munify y
 * en SalesBot — no se renombran: cada app mapea SUS propios nombres a estos
 * (ver README del framework), nunca al revés.
 */
export interface Tokens {
  /** Fondos: bg1 es la base, bg2/bg3 se alejan un escalón (rail, chips, hover). */
  bg1: string; bg2: string; bg3: string
  /** Superficie elevada: cards, inputs, popovers. */
  surface: string
  border1: string; border2: string; border3: string
  /** Textos, de más a menos contraste. fg5 es el apagado del apagado. */
  fg1: string; fg2: string; fg3: string; fg4: string; fg5: string
  /** El acento y su familia. */
  brand500: string; brand600: string; brand50: string; onBrand: string
  /** Sombras por modo: en claro tiran a tinta suave, en oscuro a negro pleno. */
  shadowCard: string; shadowFloat: string; shadowPop: string
}

export interface Defaults {
  /** Fondo claro de arranque. */
  claro: string
  /** Fondo oscuro de arranque. */
  oscuro: string
  /** Acento de arranque. */
  acento: string
  /** Modo de arranque. 'sistema' respeta `prefers-color-scheme`. */
  modo?: Modo | 'sistema'
}

/**
 * El arranque del catálogo. Cada app pisa lo que quiera al crear su store —
 * pero una app que no elige NO tiene que verse distinta de otra que tampoco:
 * sin un default único, "no elegir" se volvía una decisión estética por
 * omisión y dos demos seguidas se veían distintas sin que nadie tocara nada.
 */
export const DEFAULTS: Defaults = { claro: 'nieve', oscuro: 'marino', acento: 'azul', modo: 'sistema' }

/** Fondo por id, TOLERANTE: un id desconocido (o de otro modo) cae al default
 *  del modo pedido. El alias se aplica acá, el único punto por el que pasa la
 *  resolución de una preferencia guardada. */
export function getFondo(id: string | null | undefined, modo: Modo, defaults: Defaults = DEFAULTS): Fondo {
  const resuelto = (id && ALIAS_FONDOS[id]) || id
  return FONDOS.find((f) => f.id === resuelto && f.modo === modo)
    || FONDOS.find((f) => f.id === (modo === 'light' ? defaults.claro : defaults.oscuro))
    || FONDOS.find((f) => f.modo === modo)!
}

/** Acento por id, con `fallback` (normalmente el recomendado del fondo). */
export function getAcento(id: string | null | undefined, fallback: string): Acento {
  const resuelto = (id && ALIAS_ACENTOS[id]) || id
  return ACENTOS.find((a) => a.id === resuelto)
    || ACENTOS.find((a) => a.id === fallback)
    || ACENTOS[0]
}

/**
 * Deriva la paleta entera de un fondo + un acento. Es la matemática de Munify,
 * sin cambios: el segundo tono es el base con un escalón de luminosidad, y los
 * textos se eligen por contraste.
 */
export function derivar(fondo: Fondo, acento: Acento): Tokens {
  // Un fondo MUY claro (blanco roto, crema) baja un escalón para que las cards
  // resalten, y la card se queda con el color original. El escalón sale del
  // PROPIO base: con un gris azulado fijo, Marfil (cálido) terminaba frío.
  const casiBlanco = luminancia(fondo.base) > 0.92
  const bg = casiBlanco ? darken(fondo.base, 6) : fondo.base
  const claro = luminancia(bg) > 0.5
  const paso = (p: number) => (claro ? darken(bg, p) : lighten(bg, p))
  const tinta = claro ? TINTA_OSCURA : TINTA_CLARA
  const sombra = claro ? '#0d1412' : '#ffffff'
  const neg = claro ? '13, 20, 18' : '0, 0, 0'
  const s = (px: string, op: number) => `${px} rgba(${neg}, ${op})`
  return {
    bg1: bg,
    bg2: paso(3),
    bg3: paso(6),
    surface: casiBlanco ? fondo.base : (claro ? lighten(bg, 4) : lighten(bg, 5)),
    border1: alpha(sombra, 0.08),
    border2: alpha(sombra, 0.12),
    border3: alpha(sombra, 0.18),
    fg1: tinta,
    fg2: claro ? '#2f3a35' : '#e6ebe8',
    fg3: claro ? '#475569' : '#94a3b8',
    fg4: claro ? '#7c8791' : '#6f7a85',
    fg5: claro ? '#a3acb4' : '#555f69',
    brand500: acento.color,
    brand600: darken(acento.color, 12),
    brand50: alpha(acento.color, claro ? 0.12 : 0.18),
    onBrand: tintaSobre(acento.color),
    shadowCard: `${s('0 1px 2px', claro ? 0.04 : 0.3)}, ${s('0 2px 6px', claro ? 0.04 : 0.24)}`,
    shadowFloat: `${s('0 6px 20px', claro ? 0.1 : 0.42)}, ${s('0 2px 6px', claro ? 0.06 : 0.28)}`,
    shadowPop: `${s('0 12px 32px', claro ? 0.18 : 0.55)}, ${s('0 4px 8px', claro ? 0.08 : 0.34)}`,
  }
}

// ---------------------------------------------------------------- aplicación

/** Nombres de las variables CSS que el tema escribe en :root. Exportado para
 *  que `limpiarTokens` y los tests no repitan la lista. */
export const VARS: Record<keyof Tokens, string> = {
  bg1: '--bg-1', bg2: '--bg-2', bg3: '--bg-3', surface: '--surface',
  border1: '--border-1', border2: '--border-2', border3: '--border-3',
  fg1: '--fg-1', fg2: '--fg-2', fg3: '--fg-3', fg4: '--fg-4', fg5: '--fg-5',
  brand500: '--brand-500', brand600: '--brand-600', brand50: '--brand-50', onBrand: '--on-brand',
  shadowCard: '--shadow-card', shadowFloat: '--shadow-float', shadowPop: '--shadow-pop',
}

/** Alias que además se escriben, porque hay apps que leen el acento con estos
 *  nombres. Mapean al MISMO valor: no son tokens nuevos. */
const ALIAS_VARS: [keyof Tokens, string][] = [
  ['brand500', '--color-primary'],
  ['brand600', '--color-primary-hover'],
]

/** Escribe los tokens como variables CSS en :root (pisan a las del CSS de la
 *  app). Idempotente y barata: sólo `setProperty`. */
export function aplicarTokens(t: Tokens, root?: HTMLElement): void {
  const el = root || (typeof document !== 'undefined' ? document.documentElement : null)
  if (!el) return
  for (const k of Object.keys(VARS) as (keyof Tokens)[]) el.style.setProperty(VARS[k], t[k])
  for (const [k, v] of ALIAS_VARS) el.style.setProperty(v, t[k])
}

/** Vuelve a lo que diga el CSS de la app (sin personalización). */
export function limpiarTokens(root?: HTMLElement): void {
  const el = root || (typeof document !== 'undefined' ? document.documentElement : null)
  if (!el) return
  for (const k of Object.keys(VARS) as (keyof Tokens)[]) el.style.removeProperty(VARS[k])
  for (const [, v] of ALIAS_VARS) el.style.removeProperty(v)
}
