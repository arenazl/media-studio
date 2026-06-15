// Guión tokenizado: se pinta palabra por palabra a medida que avanza el audio
// (karaoke) y muestra los markers de rango (énfasis/tono) como subrayado de color.
// Read-only: editar es el modo textarea aparte. Los índices de palabra vienen del
// MISMO tokenizador que la onda (renderTokens), así la palabra activa coincide.
import { renderTokens, type PlacedMarker } from './CadenceWave';
import './ScriptText.css';

export default function ScriptText({ text, activeRange, markers = [] }: {
  text: string;
  activeRange?: { ws: number; we: number } | null;   // palabra que suena ahora (karaoke)
  markers?: PlacedMarker[];
}) {
  const toks = renderTokens(text);
  const ranges = markers.filter((m) => m.end > m.start);

  return (
    <div className="st-root">
      {toks.map((t, i) => {
        if (!t.word) return <span key={i}>{t.raw}</span>;
        const active = !!activeRange && t.ws < activeRange.we && t.we > activeRange.ws;
        const mk = ranges.find((m) => t.ws < m.end && t.we > m.start);
        const cls = `st-w${active ? ' st-w--on' : ''}${mk ? ' st-w--mk' : ''}`;
        return (
          <span key={i} className={cls} style={mk ? ({ ['--mk']: mk.color } as React.CSSProperties) : undefined}>
            {t.raw}
          </span>
        );
      })}
    </div>
  );
}
