// CONTRATO DE MATERIA PRIMA con ChatGPT (2026-10-11, Lucas: "un contrato con un JSON: vos me das el input, ChatGPT me
// devuelve los JSON con la idea, los personajes, el guion y el storyboard, y los importamos"). Copiar el pedido (lo arma el
// servidor con los hechos reales del proyecto), pegar la respuesta, ver qué trajo cada pieza y aplicarla. Lo que había en
// cada pieza queda de respaldo en el reel (`respaldoContrato`), así se puede volver atrás.
import { useState } from 'react';
import { Copy, Check, ClipboardPaste, Loader2, X, AlertTriangle, Sparkles } from 'lucide-react';
import { API_BASE } from './config';
import type { Project } from './lib/projects';
import type { Comercial, Escena } from './lib/comercial';
type ChangeFn = (updater: (p: Project) => Project, mode?: 'debounced' | 'flush') => void;

interface PiezaLeida {
  id: string;
  titulo?: string;
  concepto?: Comercial['concepto'];
  guion?: Comercial['guion'];
  cast?: Comercial['cast'];
  storyboard?: Escena[];
  errores: string[];
}

export default function ContratoChatGPT({ project, onChange, onClose }: { project: Project; onChange: ChangeFn; onClose: () => void }) {
  const [pedido, setPedido] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [piezas, setPiezas] = useState<PiezaLeida[] | null>(null);
  const [busy, setBusy] = useState<'' | 'pedido' | 'leer' | 'aplicar'>('');
  const [error, setError] = useState('');
  const [aplicado, setAplicado] = useState('');

  const post = async (accion: string, body: Record<string, unknown>) => {
    const r = await fetch(`${API_BASE}/api/contrato/${accion}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: project.id, ...body }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'falló el pedido al servidor');
    return d;
  };

  const copiarPedido = async () => {
    setBusy('pedido'); setError('');
    try {
      const d = await post('pedido', {});
      setPedido(d.texto);
      try { await navigator.clipboard.writeText(d.texto); setCopiado(true); } catch { setCopiado(false); }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(''); }
  };

  const leer = async () => {
    setBusy('leer'); setError(''); setPiezas(null); setAplicado('');
    try {
      const d = await post('leer', { texto: respuesta });
      if (d.errores?.length) throw new Error(d.errores[0]);
      setPiezas(d.piezas || []);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(''); }
  };

  const aplicar = async () => {
    if (!piezas?.length) return;
    setBusy('aplicar'); setError('');
    const fecha = Date.now();
    const ids = new Set(piezas.map((p) => p.id));
    onChange((cur) => ({
      ...cur,
      reels: cur.reels.map((r) => {
        const p = piezas.find((x) => x.id === r.id);
        if (!p || !r.comercial) return r;
        const c = r.comercial;
        // la materia prima nueva reemplaza concepto, guion, personajes y storyboard; lo que se había construido encima
        // (pack de Flow, clips filmados, montaje) era de la historia anterior y queda pendiente. Los mockups de la app no
        // dependen de la historia: se quedan.
        const next: Comercial = {
          ...c,
          ...(p.concepto ? { concepto: p.concepto } : {}),
          ...(p.guion ? { guion: p.guion } : {}),
          ...(p.cast ? { cast: p.cast } : {}),
          ...(p.storyboard ? { storyboard: p.storyboard } : {}),
          guionCurado: { fecha, fuente: 'ChatGPT (contrato de materia prima)' },
          packFlow: undefined,
          rodaje: (c.rodaje || []).filter((t) => t.origen === 'mockup'),
          montaje: undefined,
          estados: { ...c.estados, concepto: 'generado', guion: 'generado', cast: 'generado', storyboard: 'generado', pack: 'pendiente', rodaje: c.estados.rodaje === 'pendiente' ? 'pendiente' : 'generado', montaje: 'pendiente' },
        };
        return { ...r, comercial: next, respaldoContrato: { fecha, comercial: c } };
      }),
    }), 'flush');
    try {
      const d = await post('aplicado', { pedido, texto: respuesta, piezas: [...ids] });
      setAplicado(`Listo: ${piezas.length} pieza(s) cargadas.${d.archivo ? ' La respuesta quedó guardada en la carpeta de curaciones.' : ''} Siguiente paso en cada pieza: Pack Flow.`);
    } catch { setAplicado(`Listo: ${piezas.length} pieza(s) cargadas.`); } finally { setBusy(''); }
  };

  return (
    <div className="cgpt-veil" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cgpt" role="dialog" aria-label="Importar de ChatGPT">
        <div className="cgpt-head">
          <span><Sparkles size={15} /> Materia prima con ChatGPT</span>
          <button className="cgpt-x" onClick={onClose} title="Cerrar"><X size={16} /></button>
        </div>
        <p className="cgpt-sub">ChatGPT escribe la idea, los personajes, el guion y el storyboard de las piezas; Media Studio los importa y arma los pedidos a Flow, las pantallas y el montaje.</p>

        <div className="cgpt-paso">
          <b>1. Copiá el pedido</b>
          <button className="paso-gen" onClick={() => void copiarPedido()} disabled={!!busy}>
            {busy === 'pedido' ? <Loader2 size={14} className="paso-spin" /> : copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado: pegalo en ChatGPT' : 'Copiar el pedido'}
          </button>
          {pedido && !copiado && <textarea className="cgpt-txt" readOnly value={pedido} rows={4} onFocus={(e) => e.currentTarget.select()} />}
        </div>

        <div className="cgpt-paso">
          <b>2. Pegá la respuesta de ChatGPT</b>
          <textarea className="cgpt-txt" value={respuesta} onChange={(e) => { setRespuesta(e.target.value); setPiezas(null); }} rows={6} placeholder="Pegá acá la respuesta entera (el bloque JSON con las piezas)" />
          <button className="rodaje-var" onClick={() => void leer()} disabled={!!busy || !respuesta.trim()}>
            {busy === 'leer' ? <Loader2 size={13} className="paso-spin" /> : <ClipboardPaste size={13} />} Leer la respuesta
          </button>
        </div>

        {piezas && (
          <div className="cgpt-paso">
            <b>3. Lo que trajo</b>
            {piezas.map((p) => (
              <div key={p.id} className="cgpt-pieza">
                <div className="cgpt-pieza-t">{p.titulo || p.id}</div>
                <div className="cgpt-pieza-m">
                  {p.guion?.blocks?.length || 0} bloques de guion · {p.cast?.personajes?.length || 0} personajes · {p.storyboard?.length || 0} escenas
                  {p.storyboard?.length ? ` · ${p.storyboard.reduce((n, e) => n + (Number(e.durSec) || 0), 0)} s` : ''}
                </div>
                {p.concepto?.idea && <div className="cgpt-pieza-idea">{p.concepto.idea}</div>}
                {p.errores.length > 0 && (
                  <details className="cgpt-avisos">
                    <summary><AlertTriangle size={12} /> {p.errores.length} aviso(s) del validador</summary>
                    <ul>{p.errores.map((e, i) => <li key={i}>{e}</li>)}</ul>
                  </details>
                )}
              </div>
            ))}
            <button className="paso-approve" onClick={() => void aplicar()} disabled={!!busy || !!aplicado}>
              {busy === 'aplicar' ? <Loader2 size={14} className="paso-spin" /> : <Check size={14} />} Aplicar a {piezas.length === 1 ? 'la pieza' : `las ${piezas.length} piezas`}
            </button>
            <div className="cgpt-nota">Reemplaza concepto, guion, personajes y storyboard; el pack de Flow, los clips filmados y el montaje quedan para rehacer. Lo anterior queda de respaldo.</div>
          </div>
        )}

        {error && <div className="paso-error">{error}</div>}
        {aplicado && <div className="cgpt-ok">{aplicado}</div>}
      </div>
    </div>
  );
}
