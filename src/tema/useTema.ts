// COPIA DEL CATÁLOGO v2 (APP_GUIDE/components/v2/tema) — NO editar acá: se cura en el
// catálogo y después baja a la app (LEY 0 del kit). Ver su README.md.
/**
 * TEMA v3 — el hook de React. Lee el store con `useSyncExternalStore`, así que
 * CUALQUIER componente que lo use se repinta cuando el tema cambia, sin
 * Provider y sin envolver el árbol.
 *
 * POR QUÉ SIN CONTEXT: el store vive en localStorage y es único por app. Con
 * Context, dos subárboles distintos (el popover del rail y el panel de
 * ajustes, por ejemplo) necesitan que el Provider los contenga a los dos — y
 * el día que uno queda afuera, cambiar el tema no lo repinta hasta un F5.
 * Suscribirse directo al store elimina esa clase de bug. Una app que YA tiene
 * su ThemeContext (SalesBot) puede seguir con él y usar sólo `temaPresets`.
 */
import { useSyncExternalStore } from 'react'
import type { Acento, Fondo, Modo, Tokens } from './temaPresets'
import type { TemaEstado, TemaStore } from './temaStore'

export interface TemaVivo {
  modo: Modo
  /** El fondo activo RESUELTO (no el id guardado). */
  fondo: Fondo
  /** El acento activo resuelto (ya cayó al recomendado si no había elección). */
  acento: Acento
  /** Ids guardados: los necesita el selector para marcar qué está elegido en
   *  el modo que NO está activo. */
  fondoClaro: string
  fondoOscuro: string
  /** La paleta derivada, para previsualizar sin tocar :root. */
  tokens: Tokens
  setModo: (m: Modo) => void
  alternarModo: () => void
  setFondo: (id: string) => void
  setAcento: (id: string) => void
}

export function useTema(store: TemaStore): TemaVivo {
  const estado: TemaEstado = useSyncExternalStore(store.subscribe, store.getEstado, store.getEstado)
  return {
    modo: estado.modo,
    fondo: store.fondoActual(),
    acento: store.acentoActual(),
    fondoClaro: estado.fondoClaro,
    fondoOscuro: estado.fondoOscuro,
    tokens: store.tokens(),
    setModo: store.setModo,
    alternarModo: store.alternarModo,
    setFondo: store.setFondo,
    setAcento: store.setAcento,
  }
}
