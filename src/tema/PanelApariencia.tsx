// COPIA DEL CATÁLOGO v2 (APP_GUIDE/components/v2/tema) — NO editar acá: se cura en el
// catálogo y después baja a la app (LEY 0 del kit). Ver su README.md.
/**
 * TEMA v3 — EL PANEL DE APARIENCIA. Las tres preguntas del sistema, en orden:
 * modo, fondo y acento. Más una vista previa que muestra EXACTAMENTE la
 * combinación elegida (no una aproximación: pinta con los tokens derivados).
 *
 * LOS FONDOS SE MUESTRAN EN DOS GRILLAS (claros y oscuros) y NO filtradas por
 * el modo activo: elegir un fondo del otro modo cambia el modo, que es lo que
 * la persona quiere cuando toca un color oscuro estando en claro. Y los dos
 * grupos siguen a la vista porque la luna alterna entre LO ELEGIDO EN CADA
 * UNO — si sólo se viera el del modo activo, no habría forma de saber a dónde
 * te lleva la luna.
 *
 * LOS OCHO ACENTOS SE OFRECEN SOBRE CUALQUIER FONDO. Hubo una vuelta en la que
 * cada fondo filtraba "sus" acentos; se revirtió a pedido del dueño: en un
 * tenant dejaba un solo acento visible y no había forma de cambiarlo.
 *
 * `compacto` lo deja entrar en un popover de ~230px (el engranaje de un rail):
 * mismas tres preguntas, swatches chicos y sin vista previa.
 */
import { Check, Moon, Sun } from 'lucide-react'
import { ACENTOS, FONDOS, derivar, getAcento } from './temaPresets'
import { useTema } from './useTema'
import type { TemaStore } from './temaStore'
import './tema.css'

export interface PanelAparienciaProps {
  store: TemaStore
  /** Versión chica, para un popover. Oculta la vista previa por default. */
  compacto?: boolean
  conVistaPrevia?: boolean
  /** Texto de ayuda bajo el modo. `null` lo saca. */
  ayudaModo?: string | null
  className?: string
}

const AYUDA_MODO = 'La luna alterna entre el fondo claro y el oscuro que elijas acá. El acento se conserva.'

export function PanelApariencia({
  store, compacto = false, conVistaPrevia = !compacto, ayudaModo = AYUDA_MODO, className,
}: PanelAparienciaProps) {
  const { modo, fondo, acento, fondoClaro, fondoOscuro, setModo, setFondo, setAcento } = useTema(store)
  const prev = derivar(fondo, acento)
  const iconoModo = compacto ? 14 : 18

  const Swatch = ({ id }: { id: string }) => {
    const f = FONDOS.find((x) => x.id === id)!
    const elegido = f.modo === 'light' ? fondoClaro === id : fondoOscuro === id
    return (
      <button
        type="button"
        className={elegido ? 'tema-swatch tema-swatch--on' : 'tema-swatch'}
        onClick={() => setFondo(id)}
        aria-pressed={elegido}
        title={f.nombre}
      >
        <span className="tema-swatch-color" style={{ background: f.base }} />
        <span className="tema-swatch-nombre">{f.nombre}</span>
        {!compacto && (
          <span className="tema-swatch-temp">
            {f.temperatura === 'calido' ? 'cálido' : f.temperatura === 'frio' ? 'frío' : 'neutro'}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={`tema-panel${compacto ? ' tema-panel--compacto' : ''}${className ? ` ${className}` : ''}`}>
      <section className="tema-sec">
        <h3 className="tema-sec-tit">Modo</h3>
        <div className="tema-modo">
          <button
            type="button"
            className={modo === 'light' ? 'tema-modo-op tema-modo-op--on' : 'tema-modo-op'}
            onClick={() => setModo('light')}
            aria-pressed={modo === 'light'}
          >
            <Sun size={iconoModo} />Claro
          </button>
          <button
            type="button"
            className={modo === 'dark' ? 'tema-modo-op tema-modo-op--on' : 'tema-modo-op'}
            onClick={() => setModo('dark')}
            aria-pressed={modo === 'dark'}
          >
            <Moon size={iconoModo} />Oscuro
          </button>
        </div>
        {ayudaModo && !compacto && <p className="tema-ayuda">{ayudaModo}</p>}
      </section>

      <section className="tema-sec">
        <h3 className="tema-sec-tit">Fondo claro</h3>
        <div className="tema-grid-3">
          {FONDOS.filter((f) => f.modo === 'light').map((f) => <Swatch key={f.id} id={f.id} />)}
        </div>
      </section>

      <section className="tema-sec">
        <h3 className="tema-sec-tit">Fondo oscuro</h3>
        <div className="tema-grid-3">
          {FONDOS.filter((f) => f.modo === 'dark').map((f) => <Swatch key={f.id} id={f.id} />)}
        </div>
      </section>

      <section className="tema-sec">
        <h3 className="tema-sec-tit">Acento</h3>
        <div className="tema-grid-4">
          {ACENTOS.map((a) => {
            const elegido = acento.id === a.id
            return (
              <button
                key={a.id}
                type="button"
                className={elegido ? 'tema-acento tema-acento--on' : 'tema-acento'}
                onClick={() => setAcento(a.id)}
                aria-label={a.nombre}
                aria-pressed={elegido}
                title={a.nombre}
                style={elegido ? { borderColor: a.color } : undefined}
              >
                <span className="tema-acento-bola" style={{ background: a.color }}>
                  {elegido && (
                    <Check
                      size={compacto ? 12 : 16}
                      strokeWidth={3}
                      style={{ color: derivar(fondo, getAcento(a.id, a.id)).onBrand }}
                    />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {conVistaPrevia && (
        <section className="tema-sec">
          <h3 className="tema-sec-tit">Así se ve</h3>
          <div className="tema-prev" style={{ background: prev.bg1, borderColor: prev.border2 }}>
            <div className="tema-prev-fila" style={{ background: prev.surface }}>
              <span className="tema-prev-avatar" style={{ background: prev.brand500, color: prev.onBrand }}>A</span>
              <span className="tema-prev-txt">
                <span className="tema-prev-t1" style={{ color: prev.fg1 }}>Un título de lista</span>
                <span className="tema-prev-t2" style={{ color: prev.fg3 }}>y la línea de abajo, más apagada</span>
              </span>
              <span className="tema-prev-cta" style={{ background: prev.brand500, color: prev.onBrand }}>Acción</span>
            </div>
            <div className="tema-prev-chips">
              <span className="tema-prev-chip" style={{ background: prev.bg2, color: prev.fg2 }}>{fondo.nombre}</span>
              <span className="tema-prev-chip" style={{ background: prev.brand50, color: prev.brand600, fontWeight: 600 }}>{acento.nombre}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
