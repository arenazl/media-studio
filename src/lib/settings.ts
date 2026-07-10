// Ajustes del usuario (M2 — selección de modelo de IA). localStorage-first, lógica PURA y
// tolerante a la falta de localStorage (SSR/tests sin mock no rompen — mismo patrón que kits.ts).
// 'auto' = cada función corre con SU tier del catálogo (functionCatalog.ts, ya con el comentario
// "overrideable desde settings" — acá se resuelve); forzado = TODAS las funciones usan ese modelo
// (ej. "estoy corto de créditos → todo Sonnet").
import { getFunction, type ModelTier } from './functionCatalog';

export type AiModelSetting = 'auto' | ModelTier;

const LS_KEY = 'ms.settings.aiModel';
const VALID: readonly AiModelSetting[] = ['auto', 'opus', 'sonnet', 'haiku'];

export function getAiModel(): AiModelSetting {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw && (VALID as readonly string[]).includes(raw)) return raw as AiModelSetting;
  } catch { /* noop */ }
  return 'auto';
}

// pub/sub mínimo: el ajuste vive en localStorage (sin React state central), pero el hint de
// PasoShell y el popover de la Topbar son árboles de componentes DISTINTOS — sin esto, cambiar
// el modelo en el engranaje no repinta el hint hasta un F5 (el `storage` event nativo del
// browser NO dispara en la misma pestaña que hizo el setItem). setAiModel() notifica; los
// suscriptores (useEffectiveModel, abajo) recalculan con useSyncExternalStore.
type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribeAiModel(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function setAiModel(v: AiModelSetting): void {
  try { localStorage.setItem(LS_KEY, v); } catch { /* noop */ }
  for (const fn of listeners) fn();
}

// Modelo EFECTIVO para una función del catálogo según el ajuste global: en 'auto' devuelve el
// tier sugerido por la función; forzado, siempre ese tier (pasoKit.runMolde, ProjectWizard y el
// hint de la UI comparten esta única resolución — nunca duplicar el ternario).
export function effectiveModel(functionId: string): ModelTier | undefined {
  const setting = getAiModel();
  return setting === 'auto' ? getFunction(functionId)?.model : setting;
}
