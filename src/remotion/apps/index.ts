// REGISTRO DE TARJETAS POR APP (lo regenera el motor cuando escribe las tarjetas de una app: server/tarjetasPlantilla.mjs).
// No editar a mano: cada app vive en src/remotion/apps/<id>/Tarjetas.tsx (índice generado) con sus tarjetas y su catalogo.json.
import type React from 'react';
import { Tarjetas as T_barrioscrm } from './barrioscrm/Tarjetas';
import { Tarjetas as T_hablah } from './hablah/Tarjetas';
import { Tarjetas as T_repareya } from './repareya/Tarjetas';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TARJETAS_APPS: Record<string, React.FC<{ plan: any }>> = { 'barrioscrm': T_barrioscrm, 'hablah': T_hablah, 'repareya': T_repareya };
