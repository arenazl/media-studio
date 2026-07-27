// WO-K3 — las piezas del MEDIA KIT, VISIBLES en los pasos intermedios (pedido explícito del dueño:
// nada de sorpresas al final). Tres piezas chicas y reusables:
//   · KitTira      → tira horizontal de solo lectura ("estas son las piezas con las que se arma el video")
//   · KitThumb     → una captura chica clickeable (la usa cada escena del storyboard)
//   · KitLightbox  → la captura en grande, sobre un fondo oscuro
// Sin kit (pantallas vacías) NINGUNA de las tres se monta: los pasos se ven exactamente como hoy.
import { useEffect, useState } from 'react';
import { Images, X } from 'lucide-react';
import type { PantallaKit } from '../lib/mediaKit';
import './kitCapturas.css';

export function KitThumb({ pantalla, onClick, size = 'sm' }: { pantalla: PantallaKit; onClick?: () => void; size?: 'sm' | 'md' }) {
  const title = [pantalla.nombre, pantalla.queDemuestra].filter(Boolean).join(' — ');
  return (
    <button type="button" className={`kit-thumb kit-thumb--${size}`} onClick={onClick} title={title} disabled={!onClick}>
      <img src={pantalla.url} alt={pantalla.nombre} loading="lazy" />
    </button>
  );
}

// La captura en grande. Cierra con Escape o clickeando el fondo.
export function KitLightbox({ pantalla, onClose }: { pantalla: PantallaKit; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="kit-lb" onClick={onClose}>
      <div className="kit-lb-box" onClick={(e) => e.stopPropagation()}>
        <div className="kit-lb-h">
          <span className="kit-lb-title">{pantalla.nombre}</span>
          <button type="button" className="kit-lb-x" onClick={onClose} title="Cerrar"><X size={16} /></button>
        </div>
        <img src={pantalla.url} alt={pantalla.nombre} />
        <div className="kit-lb-meta">
          {pantalla.queDemuestra && <p><span>Qué demuestra</span> {pantalla.queDemuestra}</p>}
          {pantalla.zonaClave && <p><span>Zona clave</span> {pantalla.zonaClave}</p>}
          {pantalla.microAnimacion && <p><span>Micro-animación</span> {pantalla.microAnimacion}</p>}
          {!!pantalla.datosVisibles?.length && <p><span>Datos visibles</span> {pantalla.datosVisibles.join(' · ')}</p>}
        </div>
      </div>
    </div>
  );
}

// Tira de SOLO LECTURA para Concepto y Guion: no cambia nada del comercial, solo muestra con qué
// material se va a armar el video (clickear amplía). Maneja su propio lightbox — el paso que la usa
// no tiene que cablear estado.
export function KitTira({ pantallas }: { pantallas?: PantallaKit[] }) {
  const [zoom, setZoom] = useState<PantallaKit | null>(null);
  if (!pantallas?.length) return null;
  return (
    <section className="kit-tira">
      <header className="kit-tira-h">
        <Images size={13} />
        <span>Material del media kit — {pantallas.length} {pantallas.length === 1 ? 'captura real' : 'capturas reales'} de la app</span>
      </header>
      <div className="kit-tira-row">
        {pantallas.map((p) => (
          <figure key={p.archivo} className="kit-tira-item">
            <KitThumb pantalla={p} onClick={() => setZoom(p)} />
            <figcaption>{p.nombre}</figcaption>
          </figure>
        ))}
      </div>
      {zoom && <KitLightbox pantalla={zoom} onClose={() => setZoom(null)} />}
    </section>
  );
}
