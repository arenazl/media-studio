// Ajustes GLOBALES en el rail (engranaje al pie, sobre el avatar). Hoy: selector de modelo de IA —
// disponible SIEMPRE (Home, wizard, pipeline), para elegir el modelo ANTES de la primera generación
// (strategy corre en el wizard de campaña, antes de entrar al pipeline). Reusa la lógica pura de
// settings.ts (getAiModel/setAiModel + pub/sub) — el mismo estado que el engranaje del Pipeline.
import { useEffect, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { Settings, Check } from 'lucide-react';
import { getAiModel, setAiModel, subscribeAiModel, type AiModelSetting, getTheme, setTheme, subscribeTheme, type ThemeSetting } from './lib/settings';
import './RailSettings.css';

const AI_MODEL_OPTIONS: { value: AiModelSetting; label: string; hint: string }[] = [
  { value: 'economico', label: 'Económico', hint: 'Sonnet en todo: la pieza en unos 2 minutos' },
  { value: 'intermedio', label: 'Intermedio', hint: 'recomendado: Opus sólo en idea y guion' },
  { value: 'performante', label: 'Performante', hint: 'Opus también en cast, storyboard y QA' },
];

export default function RailSettings() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // el modelo vive en localStorage (settings.ts); useSyncExternalStore lo mantiene en vivo con el
  // engranaje del Pipeline (ambos comparten el mismo pub/sub → cambiar en uno repinta el otro).
  const aiModel = useSyncExternalStore(subscribeAiModel, getAiModel, () => 'intermedio' as AiModelSetting);
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'dark' as ThemeSetting);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (v: AiModelSetting) => { setAiModel(v); setOpen(false); };
  const pickTheme = (v: ThemeSetting) => { setTheme(v); setOpen(false); };

  return (
    <div className="rs" ref={ref}>
      <button className={open ? 'rs-gear rs-gear--on' : 'rs-gear'} title="Ajustes · Modelo de IA" onClick={() => setOpen((o) => !o)}>
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

          <div className="rs-menu-lbl" style={{ marginTop: 12, borderTop: '1px solid var(--rd-border)', paddingTop: 10 }}>Tema</div>
          <div style={{ display: 'flex', gap: 6, padding: '4px 8px' }}>
            <button
              className={theme === 'dark' ? 'rs-theme-btn rs-theme-btn--on' : 'rs-theme-btn'}
              onClick={() => pickTheme('dark')}
            >
              Oscuro
            </button>
            <button
              className={theme === 'light' ? 'rs-theme-btn rs-theme-btn--on' : 'rs-theme-btn'}
              onClick={() => pickTheme('light')}
            >
              Claro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
