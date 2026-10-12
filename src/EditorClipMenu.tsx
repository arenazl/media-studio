// Menú del clic derecho sobre un clip de la timeline (2026-10-11, Lucas: "menú contextual con fade in, fade out y
// otras opciones"). Lo que ofrece depende de la pista: fades en lo que tiene imagen o sonido, el audio y la transición
// en las escenas, y partir / duplicar / eliminar en todo. Se cierra con Escape, con un click afuera o al hacer scroll.
import { useEffect, useRef } from 'react';
import { ArrowLeftToLine, Check, CopyPlus, Scissors, Trash2, Volume2, VolumeX } from 'lucide-react';
import type { EditorClip, EditorTrack, TransitionKind } from './lib/editorTracks';

export type AccionClip =
  | { tipo: 'fadeIn' } | { tipo: 'fadeOut' } | { tipo: 'sinFades' }
  | { tipo: 'audio' }
  | { tipo: 'transicion'; kind: TransitionKind }
  | { tipo: 'partir' } | { tipo: 'duplicar' } | { tipo: 'eliminar' } | { tipo: 'irInicio' };

export interface MenuClipState { x: number; y: number; clip: EditorClip; track: EditorTrack }

const TRANSICIONES: { kind: TransitionKind; label: string }[] = [
  { kind: 'cut', label: 'Corte' }, { kind: 'dissolve', label: 'Disolvencia' }, { kind: 'slide', label: 'Deslizar' },
];

export default function EditorClipMenu({ menu, puedePartir, onAccion, onClose }: {
  menu: MenuClipState;
  puedePartir: boolean;   // el cabezal cae adentro del clip (no pegado a un borde)
  onAccion: (a: AccionClip) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fuera = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    window.addEventListener('wheel', onClose, { passive: true });
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', tecla);
      window.removeEventListener('wheel', onClose); window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const { clip, track } = menu;
  const esPlaca = clip.id === 'placa-final' || clip.meta === 'placa';
  const esEscena = !esPlaca && (track.id === 'video' || !!clip.esEscena);
  const conFades = !esPlaca && ['video', 'pantallas', 'voz', 'musica'].includes(track.id);
  const conAudio = track.id === 'video' && !esPlaca && !!clip.fileRef;
  const hacer = (a: AccionClip) => { onAccion(a); onClose(); };
  // que el menú no se salga de la ventana
  const x = Math.min(menu.x, window.innerWidth - 220), y = Math.min(menu.y, window.innerHeight - 330);

  return (
    <div ref={ref} className="ed-cmenu" style={{ left: x, top: y }} role="menu" onContextMenu={(e) => e.preventDefault()}>
      <div className="ed-cmenu-head">{clip.label}</div>
      {conFades && (
        <>
          <button role="menuitemcheckbox" aria-checked={!!clip.fadeIn} onClick={() => hacer({ tipo: 'fadeIn' })}>
            <span className="ed-cmenu-ico">{clip.fadeIn ? <Check size={13} /> : <svg width="13" height="13" viewBox="0 0 13 13"><path d="M1 12 L12 1 L12 12 Z" fill="currentColor" opacity=".55" /></svg>}</span> Fade in
          </button>
          <button role="menuitemcheckbox" aria-checked={!!clip.fadeOut} onClick={() => hacer({ tipo: 'fadeOut' })}>
            <span className="ed-cmenu-ico">{clip.fadeOut ? <Check size={13} /> : <svg width="13" height="13" viewBox="0 0 13 13"><path d="M1 1 L12 12 L1 12 Z" fill="currentColor" opacity=".55" /></svg>}</span> Fade out
          </button>
          {(clip.fadeIn || clip.fadeOut) ? <button onClick={() => hacer({ tipo: 'sinFades' })}><span className="ed-cmenu-ico" /> Quitar fades</button> : null}
          <div className="ed-cmenu-sep" />
        </>
      )}
      {conAudio && (
        <button onClick={() => hacer({ tipo: 'audio' })}>
          <span className="ed-cmenu-ico">{clip.audio === 'mute' ? <Volume2 size={13} /> : <VolumeX size={13} />}</span>
          {clip.audio === 'mute' ? 'Activar el audio del clip' : 'Silenciar el audio del clip'}
        </button>
      )}
      {esEscena && clip.transitionAfter && (
        <div className="ed-cmenu-group">
          <span className="ed-cmenu-label">Transición a la siguiente</span>
          <div className="ed-cmenu-chips">
            {TRANSICIONES.map((t) => (
              <button key={t.kind} className={clip.transitionAfter === t.kind ? 'ed-cmenu-chip ed-cmenu-chip--on' : 'ed-cmenu-chip'} onClick={() => hacer({ tipo: 'transicion', kind: t.kind })}>{t.label}</button>
            ))}
          </div>
        </div>
      )}
      {(conAudio || (esEscena && clip.transitionAfter)) && <div className="ed-cmenu-sep" />}
      <button onClick={() => hacer({ tipo: 'irInicio' })}><span className="ed-cmenu-ico"><ArrowLeftToLine size={13} /></span> Ir al inicio del clip</button>
      <button disabled={!puedePartir} title={puedePartir ? undefined : 'Poné el cabezal adentro del clip'} onClick={() => hacer({ tipo: 'partir' })}><span className="ed-cmenu-ico"><Scissors size={13} /></span> Partir en el cabezal</button>
      <button onClick={() => hacer({ tipo: 'duplicar' })}><span className="ed-cmenu-ico"><CopyPlus size={13} /></span> Duplicar</button>
      <button className="ed-cmenu-danger" onClick={() => hacer({ tipo: 'eliminar' })}><span className="ed-cmenu-ico"><Trash2 size={13} /></span> Eliminar</button>
    </div>
  );
}
