// Ajustes GLOBALES en el rail (engranaje al pie, sobre el avatar). Dos cosas:
//
//   1. El modelo de IA — disponible SIEMPRE (Home, wizard, pipeline), para elegirlo ANTES de la
//      primera generación (strategy corre en el wizard de campaña, antes de entrar al pipeline).
//      Reusa la lógica pura de settings.ts (getAiModel/setAiModel + pub/sub) — el mismo estado que
//      el engranaje del Pipeline.
//   2. La APARIENCIA — la luna y el sol del framework compartido (kit v3), más los seis fondos y
//      los ocho acentos en su versión compacta. No es un claro/oscuro propio de media-studio: es
//      el mismo control que tienen SalesBot y Munify, consumido de src/tema/.
import { useEffect, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { Settings, Check } from 'lucide-react';
import { getAiModel, setAiModel, subscribeAiModel, type AiModelSetting } from './lib/settings';
import { API_BASE } from './config';
import { ToggleTema } from './tema/ToggleTema';
import { PanelApariencia } from './tema/PanelApariencia';
import { tema } from './tema/store';
import './RailSettings.css';

const AI_MODEL_OPTIONS: { value: AiModelSetting; label: string; hint: string }[] = [
  { value: 'economico', label: 'Económico', hint: 'Sonnet en todo: la pieza en unos 2 minutos' },
  { value: 'intermedio', label: 'Intermedio', hint: 'recomendado: Opus sólo en idea y guion' },
  { value: 'performante', label: 'Performante', hint: 'Opus también en cast, storyboard y QA' },
];

// 3. La CALIDAD DE FLOW (Lucas, 2026-10-14: "3 presets de calidad / gasto de créditos"): vale para todo lo que se genera
//    en Flow, los comerciales y los pedidos de SalesBot. Vive en el backend (los pedidos de SalesBot no pasan por acá).
type CalidadFlow = { elegido: string; presets: { id: string; nombre: string; detalle: string }[]; fotoComoImagen: boolean };

function useCalidadFlow(abierto: boolean) {
  const [calidad, setCalidad] = useState<CalidadFlow | null>(null);
  useEffect(() => {
    if (!abierto) return;
    fetch(`${API_BASE}/api/flow/calidad`).then((r) => r.json()).then(setCalidad).catch(() => setCalidad(null));
  }, [abierto]);
  const elegir = async (id: string) => {
    const r = await fetch(`${API_BASE}/api/flow/calidad`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preset: id }) });
    if (r.ok) setCalidad((c) => (c ? { ...c, elegido: id } : c));
  };
  return { calidad, elegir };
}

export default function RailSettings() {
  const [open, setOpen] = useState(false);
  const { calidad, elegir } = useCalidadFlow(open);
  // La apariencia se despliega dentro del mismo popover y arranca PLEGADA: el engranaje se abre
  // casi siempre para cambiar el modelo, y seis fondos más ocho acentos tapaban esa decisión.
  const [verApariencia, setVerApariencia] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // el modelo vive en localStorage (settings.ts); useSyncExternalStore lo mantiene en vivo con el
  // engranaje del Pipeline (ambos comparten el mismo pub/sub → cambiar en uno repinta el otro).
  const aiModel = useSyncExternalStore(subscribeAiModel, getAiModel, () => 'intermedio' as AiModelSetting);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (v: AiModelSetting) => { setAiModel(v); setOpen(false); };

  return (
    <div className="rs" ref={ref}>
      <button className={open ? 'rs-gear rs-gear--on' : 'rs-gear'} title="Ajustes · Modelo de IA y apariencia" onClick={() => setOpen((o) => !o)}>
        <Settings size={19} />
        <span className="rs-gear-label">Ajustes</span>
      </button>
      {open && (
        <div className="rs-menu">
          <div className="rs-menu-lbl">Modelo de IA</div>
          {AI_MODEL_OPTIONS.map((o) => (
            <button key={o.value} className={aiModel === o.value ? 'rs-menu-item rs-menu-item--on' : 'rs-menu-item'} onClick={() => pick(o.value)}>
              <span className="rs-menu-item-txt">
                <span className="rs-menu-item-name">{o.label}</span>
                <span className="rs-menu-item-hint">{o.hint}</span>
              </span>
              {aiModel === o.value && <Check size={14} />}
            </button>
          ))}

          <div className="rs-sep" />

          <div className="rs-menu-lbl">Calidad de Flow · gasto de créditos</div>
          {calidad ? calidad.presets.map((o) => (
            <button key={o.id} className={calidad.elegido === o.id ? 'rs-menu-item rs-menu-item--on' : 'rs-menu-item'} onClick={() => void elegir(o.id)}>
              <span className="rs-menu-item-txt">
                <span className="rs-menu-item-name">{o.nombre}</span>
                <span className="rs-menu-item-hint">{o.detalle}</span>
              </span>
              {calidad.elegido === o.id && <Check size={14} />}
            </button>
          )) : <div className="rs-menu-item-hint rs-nota">No pude leer los presets: ¿está prendido el backend?</div>}
          {calidad && !calidad.fotoComoImagen && (
            <div className="rs-menu-item-hint rs-nota">Para que las fotos salgan como imagen, recargá una vez la extensión Puente Flow en Chrome.</div>
          )}

          <div className="rs-sep" />

          <div className="rs-tema-head">
            <span className="rs-menu-lbl rs-menu-lbl--inline">Apariencia</span>
            <ToggleTema store={tema} />
          </div>
          <button
            type="button"
            className="rs-tema-mas"
            onClick={() => setVerApariencia((v) => !v)}
            aria-expanded={verApariencia}
          >
            {verApariencia ? 'Ocultar fondos y acentos' : 'Fondos y acentos'}
          </button>
          {verApariencia && <PanelApariencia store={tema} compacto className="rs-tema-panel" />}
        </div>
      )}
    </div>
  );
}
