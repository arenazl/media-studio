// Kit compartido de las pantallas de PASO del pipeline (Fase 2): el runner de moldes contra el
// backend + el shell visual común (título + Generar/Regenerar + Aprobar y seguir) + helpers.
import { useSyncExternalStore, type ReactNode } from 'react';
import { Loader2, Wand2, RefreshCw, ArrowRight, type LucideIcon } from 'lucide-react';
import { API_BASE } from '../config';
import type { Project } from '../lib/projects';
import type { Comercial } from '../lib/comercial';
import { effectiveModel, subscribeAiModel } from '../lib/settings';

export const errMsg = (e: unknown): string => (e instanceof Error ? e.message : 'error');

// Props comunes a las pantallas de paso. `setComercial` crea el comercial si no existe (apply).
export interface PasoProps {
  project: Project;
  reelId: string;                    // el reel/comercial activo (lo usa el render del montaje)
  comercial: Comercial | undefined;
  setComercial: (updater: (c: Comercial) => Comercial) => void;
  goNext: () => void;
}

// Corre UN molde del catálogo (Claude headless) con el context armado desde project + piece.
// `piece` lleva los artefactos previos SIN aplanar (concepto/guion/cast/storyboard) — los moldes
// del rework los leen directo de context.piece.<artefacto>.
export async function runMolde(
  functionId: string,
  project: Project,
  piece: Record<string, unknown>,
  options: Record<string, unknown> = {},
  regenerate?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const bk = project.brandKit as { phonetic?: string } | undefined;
  const body = {
    functionId,
    context: {
      project: {
        name: project.name,
        phonetic: bk?.phonetic || project.name,
        brief: project.brief || '',
        screens: project.screens || [],
        brand: project.brandKit,
      },
      piece,
    },
    options,
    model: effectiveModel(functionId),
    ...(regenerate ? { regenerate } : {}),
  };
  const r = await fetch(`${API_BASE}/api/run-function`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'no se pudo generar');
  return d.result as Record<string, unknown>;
}

// se suscribe al ajuste de modelo (settings.ts) para que el hint se repinte EN VIVO al cambiarlo
// desde el popover de la Topbar, sin esperar un F5 (árboles de componentes distintos → sin esto
// quedaba stale: localStorage cambiaba pero nada disparaba un re-render acá).
function useEffectiveModel(functionId: string | undefined) {
  return useSyncExternalStore(subscribeAiModel, () => (functionId ? effectiveModel(functionId) : undefined));
}

export function PasoShell({
  titulo, sub, hasContent, busy, onGenerate, generarLabel, error, children, onApprove, canApprove, approveLabel, functionId, estado,
}: {
  titulo: string; sub: string; hasContent: boolean; busy: boolean; onGenerate: () => void;
  generarLabel?: string; error?: string; children: ReactNode;
  onApprove?: () => void; canApprove?: boolean; approveLabel?: string;
  functionId?: string;   // id del molde (functionCatalog) — pinta el hint "IA: <modelo efectivo>" bajo el botón
  estado?: string;       // línea de estado/contexto del PIE (derivada del estado real vía estadoDelPaso)
}) {
  const modelHint = useEffectiveModel(functionId);
  const hayPie = !!(estado || onApprove);
  return (
    <div className="paso">
      <div className="paso-head">
        <div className="paso-head-txt">
          <h2 className="paso-title">{titulo}</h2>
          <p className="paso-sub">{sub}</p>
        </div>
        <div className="paso-head-actions">
          <button className={hasContent && !busy ? 'paso-regen' : 'paso-gen'} onClick={onGenerate} disabled={busy}>
            {busy ? <Loader2 size={15} className="paso-spin" /> : hasContent ? <RefreshCw size={15} /> : <Wand2 size={15} />}
            {busy ? 'Generando…' : generarLabel || (hasContent ? 'Regenerar' : 'Generar con IA')}
          </button>
          {modelHint && <span className="paso-model-hint">IA: {modelHint}</span>}
        </div>
      </div>
      {error && <div className="paso-error">{error}</div>}
      <div className="paso-body">{children}</div>
      {hayPie && (
        <div className={`paso-foot${estado ? ' paso-foot--split' : ''}`}>
          {estado && <span className="paso-estado">{estado}</span>}
          {onApprove && (
            <button className="paso-approve" disabled={!canApprove} onClick={onApprove}>
              {approveLabel || 'Aprobar y seguir'} <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Empty state diseñado (icono lucide grande + una línea de qué es el paso). El CTA vive en el header.
// `--full` = ocupa el cuerpo del panel y centra vertical (no una caja perdida en un océano).
export function PasoEmpty({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="paso-empty paso-empty--full">
      <Icon size={34} strokeWidth={1.5} className="paso-empty-ico" />
      <span>{children}</span>
    </div>
  );
}

// input inline autoguardable (textarea que crece); dispara onChange en cada tecla (el Pipeline debouncea el save).
export function InlineEdit({ value, onChange, rows = 2, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <textarea
      className="paso-inline"
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
