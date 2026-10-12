// Perilla de volumen de la cabecera de una pista (2026-10-11): se arrastra hacia arriba/abajo, la rueda del mouse la
// mueve de a 5%, doble click vuelve a 100%. El arco muestra el valor; el número aparece en el tooltip.
import { useRef } from 'react';

export interface EditorKnobProps {
  value: number;            // 0..max
  max?: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  label: string;            // para el tooltip y la accesibilidad ("Volumen de Música")
}

const SIZE = 22, R = 8, C = SIZE / 2;
const A0 = -135, A1 = 135;   // recorrido de la perilla, en grados

function punto(deg: number, r = R) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)];
}
function arco(desde: number, hasta: number) {
  const [x0, y0] = punto(desde), [x1, y1] = punto(hasta);
  return `M ${x0} ${y0} A ${R} ${R} 0 ${hasta - desde > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

export default function EditorKnob({ value, max = 1, disabled, onChange, label }: EditorKnobProps) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(max, v)) * 100) / 100;
  const ang = A0 + (A1 - A0) * (value / max);
  const [px, py] = punto(ang, R - 3);

  const onMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault(); e.stopPropagation();
    drag.current = { y: e.clientY, v: value };
    const onMove = (ev: MouseEvent) => { if (drag.current) onChange(clamp(drag.current.v + ((drag.current.y - ev.clientY) / 120) * max)); };
    const onUp = () => { drag.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <svg
      className={disabled ? 'ed-knob ed-knob--off' : 'ed-knob'}
      width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="slider" aria-label={label} aria-valuemin={0} aria-valuemax={Math.round(max * 100)} aria-valuenow={Math.round(value * 100)}
      onMouseDown={onMouseDown}
      onDoubleClick={(e) => { e.stopPropagation(); if (!disabled) onChange(1); }}
      onWheel={(e) => { if (!disabled) onChange(clamp(value + (e.deltaY < 0 ? 0.05 : -0.05))); }}
      onClick={(e) => e.stopPropagation()}
    >
      <title>{`${label}: ${Math.round(value * 100)}% (arrastrá, rueda, doble click = 100%)`}</title>
      <path d={arco(A0, A1)} className="ed-knob-track" />
      {value > 0 && <path d={arco(A0, Math.max(A0 + 1, ang))} className="ed-knob-val" />}
      <circle cx={C} cy={C} r={R - 2.5} className="ed-knob-cap" />
      <line x1={C} y1={C} x2={px} y2={py} className="ed-knob-dot" />
    </svg>
  );
}
