// COPIA DEL CATÁLOGO v2 (APP_GUIDE/components/v2/tema) — NO editar acá: se cura en el
// catálogo y después baja a la app (LEY 0 del kit). Ver su README.md.
/**
 * TEMA v3 — el store. Guarda la elección del usuario, la persiste y escribe
 * los tokens en :root. No importa React (el hook vive en `useTema.ts`), así
 * que una app sin React lo usa igual.
 *
 * SE GUARDAN CUATRO COSAS, no una: el modo, el fondo claro elegido, el fondo
 * oscuro elegido y el acento. Por eso la luna puede ir y volver sin que el
 * usuario pierda el cálido que había elegido en claro ni el frío del oscuro —
 * un solo "fondo activo" obligaría a re-elegir en cada salto.
 *
 * TOLERANTE A LA FALTA DE localStorage Y DE document: en una ventana privada,
 * en un test de Node o en SSR no explota, simplemente no persiste. Es el mismo
 * patrón de `settings.ts` de media-studio y del ThemeContext de SalesBot.
 */
import {
  DEFAULTS, derivar, getAcento, getFondo,
  type Acento, type Defaults, type Fondo, type Modo, type Tokens,
  aplicarTokens, FONDOS, ACENTOS,
} from './temaPresets'

export interface TemaEstado {
  modo: Modo
  /** Id del fondo claro elegido (se conserva aunque esté en modo oscuro). */
  fondoClaro: string
  /** Id del fondo oscuro elegido. */
  fondoOscuro: string
  /** Id del acento. Transversal: vale para los dos modos. */
  acento: string
}

export interface TemaStore {
  /** Snapshot ESTABLE (misma referencia mientras no cambie nada): es lo que
   *  `useSyncExternalStore` necesita para no repintar en loop. */
  getEstado(): TemaEstado
  subscribe(fn: () => void): () => void
  setModo(m: Modo): void
  /** La luna / el sol: salta al otro modo conservando el acento. */
  alternarModo(): void
  /** Elegir un fondo TAMBIÉN cambia el modo (un fondo pertenece a un modo). */
  setFondo(id: string): void
  setAcento(id: string): void
  fondoActual(): Fondo
  acentoActual(): Acento
  tokens(): Tokens
  /** Re-escribe los tokens en :root. El store ya lo hace solo en cada cambio;
   *  esto es para el arranque de la app (import del módulo o primer effect). */
  aplicar(): void
}

export interface TemaOpciones {
  /** Prefijo de las claves de localStorage. Una por app para que dos apps en
   *  el mismo navegador (localhost!) no se pisen la preferencia. */
  prefijo?: string
  /** Pisa el arranque del catálogo (p. ej. una app de marca verde). */
  defaults?: Partial<Defaults>
  /** Si true, además sincroniza `<meta name="theme-color">` con la superficie
   *  del tema — la barra del sistema en Android y la zona de la hora en iOS.
   *  Default true: una PWA sin esto queda con una franja de otro color. */
  metaThemeColor?: boolean
}

function leer(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function guardar(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* privado o bloqueado: no importa */ }
}

function modoDelSistema(): Modo {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function crearTemaStore(opciones: TemaOpciones = {}): TemaStore {
  const prefijo = opciones.prefijo || 'tema'
  const defaults: Defaults = { ...DEFAULTS, ...opciones.defaults }
  const conMeta = opciones.metaThemeColor !== false

  const K = {
    modo: `${prefijo}.modo`,
    claro: `${prefijo}.fondoClaro`,
    oscuro: `${prefijo}.fondoOscuro`,
    acento: `${prefijo}.acento`,
  }

  const modoGuardado = leer(K.modo)
  let estado: TemaEstado = {
    modo: modoGuardado === 'light' || modoGuardado === 'dark'
      ? modoGuardado
      : (defaults.modo === 'sistema' || !defaults.modo ? modoDelSistema() : defaults.modo),
    fondoClaro: leer(K.claro) || defaults.claro,
    fondoOscuro: leer(K.oscuro) || defaults.oscuro,
    acento: leer(K.acento) || defaults.acento,
  }

  const oyentes = new Set<() => void>()

  const fondoActual = () => getFondo(estado.modo === 'light' ? estado.fondoClaro : estado.fondoOscuro, estado.modo, defaults)
  const acentoActual = () => getAcento(estado.acento, fondoActual().acentoRecomendado)
  const tokens = () => derivar(fondoActual(), acentoActual())

  function aplicar(): void {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    // `data-theme` queda igual que antes para el CSS que ya discrimina por
    // atributo (`html[data-theme="light"] { ... }`). Se escribe SIEMPRE con
    // valor, también en oscuro: un CSS que selecciona `[data-theme="dark"]`
    // no puede depender de la ausencia del atributo.
    root.setAttribute('data-theme', estado.modo)
    // `color-scheme` es lo que pinta los scrollbars y los controles nativos
    // (select, date, checkbox) del lado del navegador. Sin esto, en tema claro
    // quedan los widgets oscuros del sistema sobre fondo blanco.
    root.style.colorScheme = estado.modo
    const t = tokens()
    aplicarTokens(t, root)
    if (conMeta) {
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.surface)
    }
  }

  function commit(parcial: Partial<TemaEstado>): void {
    const siguiente = { ...estado, ...parcial }
    if (siguiente.modo === estado.modo
      && siguiente.fondoClaro === estado.fondoClaro
      && siguiente.fondoOscuro === estado.fondoOscuro
      && siguiente.acento === estado.acento) return
    estado = siguiente
    guardar(K.modo, estado.modo)
    guardar(K.claro, estado.fondoClaro)
    guardar(K.oscuro, estado.fondoOscuro)
    guardar(K.acento, estado.acento)
    aplicar()
    for (const fn of oyentes) fn()
  }

  return {
    getEstado: () => estado,
    subscribe(fn) {
      oyentes.add(fn)
      return () => { oyentes.delete(fn) }
    },
    setModo: (m) => commit({ modo: m }),
    alternarModo: () => commit({ modo: estado.modo === 'light' ? 'dark' : 'light' }),
    setFondo(id) {
      const f = FONDOS.find((x) => x.id === id)
      if (!f) return
      commit(f.modo === 'light' ? { fondoClaro: id, modo: 'light' } : { fondoOscuro: id, modo: 'dark' })
    },
    setAcento(id) {
      if (ACENTOS.some((a) => a.id === id)) commit({ acento: id })
    },
    fondoActual,
    acentoActual,
    tokens,
    aplicar,
  }
}
