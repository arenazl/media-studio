// GENERADO POR EL MOTOR (server/tarjetasPlantilla.mjs): no editar a mano. La marca sale del kit de repareya y cada
// tarjeta la escribe el agente mirando la captura de su pantalla (tarjetas/<id>.tsx). El procedimiento: ../_base/Marco.tsx.
import React from 'react';
import { loadFont as fuenteTitulo } from '@remotion/google-fonts/SairaCondensed';
import { loadFont as fuenteTexto } from '@remotion/google-fonts/Saira';
import { Marco, type Marca, type PlanTarjetasApp, type TarjetaProps } from '../_base/Marco';
import { Mockup as T_contar_el_problema } from './tarjetas/contar-el-problema';
import { Mockup as T_te_esperan_tus_proveedores } from './tarjetas/te-esperan-tus-proveedores';
import { Mockup as T_la_conversacion_con_el_plan_de_pagos_ade } from './tarjetas/la-conversacion-con-el-plan-de-pagos-ade';
import { Mockup as T_pagar_la_sena } from './tarjetas/pagar-la-sena';
import { Mockup as T_bandeja_de_solicitudes } from './tarjetas/bandeja-de-solicitudes';
import { Mockup as T_armar_el_plan_de_pagos } from './tarjetas/armar-el-plan-de-pagos';
import { Mockup as T_el_panel_del_proveedor } from './tarjetas/el-panel-del-proveedor';
import { Mockup as T_la_reputacion_hecha_de_trabajos_reales } from './tarjetas/la-reputacion-hecha-de-trabajos-reales';
import { Mockup as T_mis_solicitudes_con_el_progreso_de_cada_ } from './tarjetas/mis-solicitudes-con-el-progreso-de-cada-';

const { fontFamily: titulo } = fuenteTitulo('normal', { weights: ["400","500","600","700","800"], subsets: ["latin-ext","latin"] });
const { fontFamily: texto } = fuenteTexto('normal', { weights: ["400","500","600","700","800"], subsets: ["latin-ext","latin"] });
export const marca: Marca = { ...{"acento":"#EE5A0E","acentoOscuro":"#C9450A","secundario":"#F49462","fondo":"#2B1E17","fondoProfundo":"#1A120E","superficie":"#362923","superficie2":"#40352E","borde":"#4D423C","texto":"#FBF6EF","texto2":"#B8B2AC","texto3":"#8B847F","exito":"#0F9D63","alerta":"#F59E0B","error":"#E5484D","info":"#2563EB","lema":"Contá el problema. Elegí entre 3 presupuestos de profesionales verificados.","dominio":"reparehoy.com.ar"}, fuenteTitulo: titulo, fuenteTexto: texto };
const TARJETAS: Record<string, React.FC<TarjetaProps>> = { 'contar-el-problema': T_contar_el_problema, 'te-esperan-tus-proveedores': T_te_esperan_tus_proveedores, 'la-conversacion-con-el-plan-de-pagos-ade': T_la_conversacion_con_el_plan_de_pagos_ade, 'pagar-la-sena': T_pagar_la_sena, 'bandeja-de-solicitudes': T_bandeja_de_solicitudes, 'armar-el-plan-de-pagos': T_armar_el_plan_de_pagos, 'el-panel-del-proveedor': T_el_panel_del_proveedor, 'la-reputacion-hecha-de-trabajos-reales': T_la_reputacion_hecha_de_trabajos_reales, 'mis-solicitudes-con-el-progreso-de-cada-': T_mis_solicitudes_con_el_progreso_de_cada_ };
export const Tarjetas: React.FC<{ plan: PlanTarjetasApp }> = ({ plan }) => <Marco plan={plan} marca={marca} tarjetas={TARJETAS} />;
