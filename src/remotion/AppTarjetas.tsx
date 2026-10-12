// Tarjetas de cualquier app (2026-10-10): la composición "AppTarjetas" despacha al componente que el agente de mockups
// escribió para la app del plan (src/remotion/apps/<id>/Tarjetas.tsx, registrado en apps/index.ts).
import { AbsoluteFill } from 'remotion';
import { TARJETAS_APPS } from './apps';

export interface EscenaTarjetaApp { tipo: string; durSec: number; chip?: string; titulo: string; resaltar?: string; sub?: string }
export interface PlanTarjetasApp {
  app: string; width: number; height: number; fps: number;
  escenas: EscenaTarjetaApp[];
  placa: { linea1: string; linea2: string; durSec: number };
  logoSrc: string;
}
export type AppTarjetasProps = { plan: PlanTarjetasApp };

export const AppTarjetas: React.FC<AppTarjetasProps> = ({ plan }) => {
  const C = TARJETAS_APPS[plan.app];
  if (!C) return <AbsoluteFill style={{ backgroundColor: '#111', color: '#fff', justifyContent: 'center', alignItems: 'center', fontSize: 40 }}>Sin tarjetas para {plan.app}</AbsoluteFill>;
  return <C plan={plan} />;
};
