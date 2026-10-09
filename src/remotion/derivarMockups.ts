// Del PlanMockup (segundos, por escena) al plan de render en cuadros. Única derivación: la usan el Player y el
// servidor, adentro de la composición `Mockups`.
import type { EscenaMockup, PlanMockup } from '../lib/montajePlan';
import { resolverSrc } from './derivar';

export interface EscenaMockupRender extends EscenaMockup { from: number; dur: number }
export interface PlanMockupRender {
  fps: number; width: number; height: number; totalFrames: number;
  escenas: EscenaMockupRender[];
  placa?: { from: number; dur: number; linea1: string; linea2?: string; logoSrc?: string };
  marca: PlanMockup['marca'];
}

const PLACA_SOLAPE = 6;

// cifra que cuenta desde cero, con el formato del texto original (puntos de miles, porcentaje)
export function formatearCifra(objetivo: string, p: number): string {
  const pct = /%$/.test(objetivo);
  const n = Number(objetivo.replace(/%$/, '').replace(/\./g, ''));
  const v = Math.round(n * p);
  const conPuntos = objetivo.includes('.') ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : String(v);
  return conPuntos + (pct ? '%' : '');
}

export function derivarMockups(plan: PlanMockup, base = ''): PlanMockupRender {
  const fps = plan.fps || 30;
  const F = (s: number) => Math.round(s * fps);
  let cursor = 0;
  const escenas: EscenaMockupRender[] = plan.escenas.map((e) => {
    const dur = Math.max(1, F(e.durSec));
    const out: EscenaMockupRender = { ...e, from: cursor, dur, captura: e.captura ? { ...e.captura, src: resolverSrc(base, e.captura.src) } : undefined };
    cursor += dur;
    return out;
  });
  const placa = plan.placa
    ? { from: Math.max(0, cursor - PLACA_SOLAPE), dur: PLACA_SOLAPE + F(plan.placa.durSec), linea1: plan.placa.linea1, linea2: plan.placa.linea2, logoSrc: plan.placa.logoSrc ? resolverSrc(base, plan.placa.logoSrc) : undefined }
    : undefined;
  return {
    fps, width: plan.width, height: plan.height,
    totalFrames: Math.max(1, placa ? placa.from + placa.dur : cursor),
    escenas, placa,
    marca: { ...plan.marca, logoSrc: plan.marca.logoSrc ? resolverSrc(base, plan.marca.logoSrc) : undefined },
  };
}
