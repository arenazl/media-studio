// COPIA DEL CATÁLOGO v2 (APP_GUIDE/components/v2/tema) — NO editar acá: se cura en el
// catálogo y después baja a la app (LEY 0 del kit). Ver su README.md.
/**
 * TEMA v3 — LA LUNA Y EL SOL. El control de un toque que alterna claro/oscuro.
 *
 * Dos formas, misma lógica:
 *   - 'pildora' (default): los dos íconos a la vista, el activo en superficie.
 *     Es la forma preferida porque se ve en qué modo estás SIN tener que
 *     interpretar el ícono (un solo ícono siempre deja la duda de si muestra
 *     el modo actual o el que te va a dejar).
 *   - 'boton': un solo ícono, para cuando no hay lugar (una topbar apretada).
 *     Muestra el ícono del modo AL QUE TE LLEVA, y lo dice en el title.
 */
import { Moon, Sun } from 'lucide-react'
import { useTema } from './useTema'
import type { TemaStore } from './temaStore'
import './tema.css'

export interface ToggleTemaProps {
  store: TemaStore
  variante?: 'pildora' | 'boton'
  /** Tamaño del ícono en px. El alto del control se acomoda solo. */
  tamano?: number
  className?: string
}

export function ToggleTema({ store, variante = 'pildora', tamano = 14, className }: ToggleTemaProps) {
  const { modo, setModo, alternarModo } = useTema(store)

  if (variante === 'boton') {
    const vaA = modo === 'light' ? 'oscuro' : 'claro'
    return (
      <button
        type="button"
        className={`tema-toggle-btn${className ? ` ${className}` : ''}`}
        onClick={alternarModo}
        title={`Cambiar a tema ${vaA}`}
        aria-label={`Cambiar a tema ${vaA}`}
      >
        {modo === 'light' ? <Moon size={tamano} /> : <Sun size={tamano} />}
      </button>
    )
  }

  return (
    <div role="group" aria-label="Tema" className={`tema-toggle${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className={modo === 'light' ? 'tema-toggle-op tema-toggle-op--on' : 'tema-toggle-op'}
        onClick={() => setModo('light')}
        title="Tema claro"
        aria-label="Tema claro"
        aria-pressed={modo === 'light'}
      >
        <Sun size={tamano} />
      </button>
      <button
        type="button"
        className={modo === 'dark' ? 'tema-toggle-op tema-toggle-op--on' : 'tema-toggle-op'}
        onClick={() => setModo('dark')}
        title="Tema oscuro"
        aria-label="Tema oscuro"
        aria-pressed={modo === 'dark'}
      >
        <Moon size={tamano} />
      </button>
    </div>
  )
}
