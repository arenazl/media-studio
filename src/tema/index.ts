// COPIA DEL CATÁLOGO v2 (APP_GUIDE/components/v2/tema) — NO editar acá: se cura en el
// catálogo y después baja a la app (LEY 0 del kit). Ver su README.md.
/**
 * TEMA v3 — punto de entrada único del framework de apariencia.
 *
 *   import { crearTemaStore, ToggleTema, PanelApariencia } from './tema'
 *
 * Una app sin React importa `./tema/temaPresets` y `./tema/temaStore` directo:
 * este index arrastra los dos componentes, que sí piden React y lucide-react.
 */
export * from './temaPresets'
export * from './temaStore'
export * from './useTema'
export { ToggleTema, type ToggleTemaProps } from './ToggleTema'
export { PanelApariencia, type PanelAparienciaProps } from './PanelApariencia'
