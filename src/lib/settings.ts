// Ajustes del usuario. localStorage-first, lógica PURA y tolerante a la falta de localStorage
// (SSR/tests sin mock no rompen — mismo patrón que kits.ts).
// El ajuste de IA es un PRESET (dueño, 2026-10-07: "económico, intermedio o performante"), no un
// modelo: cada molde tiene una CLASE de dificultad en el catálogo y el preset la traduce a modelo
// (functionCatalog.PRESETS). Reemplaza al 'auto/opus/sonnet/haiku' viejo (clave de localStorage
// nueva: el valor viejo no se lee, así nadie queda con "haiku" forzado sin saberlo).
import { modelForPreset, PRESET_DEFAULT, type ModelTier, type AiPreset } from './functionCatalog';

export type AiModelSetting = AiPreset;

const LS_KEY = 'ms.settings.aiPreset';
const VALID: readonly AiModelSetting[] = ['economico', 'intermedio', 'performante'];

export function getAiModel(): AiModelSetting {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw && (VALID as readonly string[]).includes(raw)) return raw as AiModelSetting;
  } catch { /* noop */ }
  return PRESET_DEFAULT;
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

// Modelo EFECTIVO para una función del catálogo: preset elegido × clase del molde
// (pasoKit.runMolde, ProjectWizard, KbFromText, VideosTab y el hint de la UI comparten esta única
// resolución — nunca duplicar la tabla).
export function effectiveModel(functionId: string): ModelTier | undefined {
  return modelForPreset(getAiModel(), functionId);
}

// ── Copiloto del pipeline: abierto/cerrado (persistente) ─────────────────────
// El panel de guía del pipeline arranca ABIERTO; el usuario lo puede plegar y su preferencia
// persiste (mismo patrón localStorage-first y tolerante a su ausencia que getAiModel). Es sólo
// estado de PRESENTACIÓN — no toca datos del comercial.
const LS_COPILOT = 'ms.settings.copilotOpen';

export function getCopilotOpen(): boolean {
  try {
    const raw = localStorage.getItem(LS_COPILOT);
    if (raw === '0') return false;
    if (raw === '1') return true;
  } catch { /* noop */ }
  return true;   // default: abierto (llena el vacío y guía desde el arranque)
}

export function setCopilotOpen(open: boolean): void {
  try { localStorage.setItem(LS_COPILOT, open ? '1' : '0'); } catch { /* noop */ }
}

// ── Tema ────────────────────────────────────────────────────────────────────
// YA NO VIVE ACÁ. El tema (modo claro/oscuro + los seis fondos + los ocho
// acentos) lo maneja el framework compartido del kit v3: `src/tema/store.ts`,
// que tiene su propia persistencia (`ms.tema.*`) y escribe los tokens en el
// <html>. Lo que había acá era un claro/oscuro suelto con la clave
// `ms.settings.theme`: se fue entero para que no haya DOS cosas escribiendo
// `data-theme` y peleándose por quién pinta la app.
