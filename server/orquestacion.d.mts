// Tipos de server/orquestacion.mjs para el front TypeScript y los tests (el plan es un objeto rico: se tipa suelto).
/* eslint-disable @typescript-eslint/no-explicit-any */
export const REGLAS: any;
export function leerKit(kb?: unknown): any;
export function armarPieza(kb: unknown, opciones?: { objetivo?: string; audiencia?: string; angulo?: string; tono?: string; formatoId?: string; usados?: Set<string>; doloresUsados?: Set<string>; indice?: number }, reglas?: unknown): any;
export function planDeCampana(kb: unknown, opciones?: { formatoId?: string }, reglas?: unknown): any;
