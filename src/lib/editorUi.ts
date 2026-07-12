// Estado de UI del EDITOR MULTIPISTA (Fase 4, docs/rediseno/HANDOFF.md §9): anchos/colapso de los
// 3 paneles arrastrables + la posición del playhead por proyecto. Es presentación PURA — nunca datos
// del proyecto (eso vive en Comercial/MontajePlan) — por eso vive en SU PROPIO localStorage, separado
// de ms.settings.* (settings.ts). Mismo patrón tolerante a la falta de localStorage que settings.ts.
export interface EditorPanelsUi {
  binW: number;
  inspW: number;
  tlH: number;
  binOpen: boolean;
  inspOpen: boolean;
  tlOpen: boolean;
}

// Límites de arrastre — docs/rediseno/HANDOFF.md §9 (mismos valores que el prototipo: edBinW/edInspW/edTlH).
export const BIN_W_MIN = 190;
export const BIN_W_MAX = 420;
export const INSP_W_MIN = 220;
export const INSP_W_MAX = 440;
export const TL_H_MIN = 120;
export const TL_H_MAX = 420;

const DEFAULT_PANELS: EditorPanelsUi = { binW: 240, inspW: 288, tlH: 224, binOpen: true, inspOpen: true, tlOpen: true };

const LS_PANELS = 'ms.editor.panels.v1';
const LS_PLAYHEAD = 'ms.editor.playhead.v1';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

// normaliza cualquier entrada (localStorage corrupto, parcial) a un shape válido y dentro de rango.
function sanitize(p: Partial<EditorPanelsUi> | undefined): EditorPanelsUi {
  const src = p || {};
  return {
    binW: clamp(Number.isFinite(src.binW) ? (src.binW as number) : DEFAULT_PANELS.binW, BIN_W_MIN, BIN_W_MAX),
    inspW: clamp(Number.isFinite(src.inspW) ? (src.inspW as number) : DEFAULT_PANELS.inspW, INSP_W_MIN, INSP_W_MAX),
    tlH: clamp(Number.isFinite(src.tlH) ? (src.tlH as number) : DEFAULT_PANELS.tlH, TL_H_MIN, TL_H_MAX),
    binOpen: src.binOpen !== false,
    inspOpen: src.inspOpen !== false,
    tlOpen: src.tlOpen !== false,
  };
}

export function getEditorPanels(): EditorPanelsUi {
  try {
    const raw = localStorage.getItem(LS_PANELS);
    if (raw) return sanitize(JSON.parse(raw) as Partial<EditorPanelsUi>);
  } catch { /* noop */ }
  return { ...DEFAULT_PANELS };
}

// merge inmutable + persiste; devuelve el estado ya saneado (para setState directo en el componente).
export function setEditorPanels(patch: Partial<EditorPanelsUi>): EditorPanelsUi {
  const next = sanitize({ ...getEditorPanels(), ...patch });
  try { localStorage.setItem(LS_PANELS, JSON.stringify(next)); } catch { /* noop */ }
  return next;
}

// ── Playhead por proyecto ─────────────────────────────────────────────────────
// mapa { [projectId]: segundos } — cada pieza retoma la cabeza donde la dejaste, sin pisar la de otras.
function loadPlayheadMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_PLAYHEAD);
    if (raw) return JSON.parse(raw) as Record<string, number>;
  } catch { /* noop */ }
  return {};
}

export function getPlayhead(projectId: string | undefined): number {
  if (!projectId) return 0;
  const v = loadPlayheadMap()[projectId];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
}

export function setPlayhead(projectId: string | undefined, sec: number): void {
  if (!projectId) return;
  try {
    const m = loadPlayheadMap();
    m[projectId] = Math.max(0, sec);
    localStorage.setItem(LS_PLAYHEAD, JSON.stringify(m));
  } catch { /* noop */ }
}
