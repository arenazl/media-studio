// GENERADO POR EL MOTOR (server/tarjetasPlantilla.mjs): no editar a mano. La marca sale del kit de barrioscrm y cada
// tarjeta la escribe el agente mirando la captura de su pantalla (tarjetas/<id>.tsx). El procedimiento: ../_base/Marco.tsx.
import React from 'react';
import { loadFont as fuenteTitulo } from '@remotion/google-fonts/Sora';
import { loadFont as fuenteTexto } from '@remotion/google-fonts/Inter';
import { Marco, type Marca, type PlanTarjetasApp, type TarjetaProps } from '../_base/Marco';
import { Mockup as T_lo_primero_que_ve_el_administrador } from './tarjetas/lo-primero-que-ve-el-administrador';
import { Mockup as T_la_mora_tiene_nombre_y_lote } from './tarjetas/la-mora-tiene-nombre-y-lote';
import { Mockup as T_en_que_se_le_va_la_plata_al_barrio } from './tarjetas/en-que-se-le-va-la-plata-al-barrio';
import { Mockup as T_lo_que_se_construye_y_quien_lo_paga } from './tarjetas/lo-que-se-construye-y-quien-lo-paga';
import { Mockup as T_la_expensa_del_mes_lote_por_lote } from './tarjetas/la-expensa-del-mes-lote-por-lote';
import { Mockup as T_el_barrio_pintado_por_su_mora } from './tarjetas/el-barrio-pintado-por-su-mora';
import { Mockup as T_la_ronda_del_portero_desde_el_telefono } from './tarjetas/la-ronda-del-portero-desde-el-telefono';
import { Mockup as T_lo_que_ve_el_vecino_al_entrar } from './tarjetas/lo-que-ve-el-vecino-al-entrar';
import { Mockup as T_la_cuenta_del_vecino_periodo_por_periodo } from './tarjetas/la-cuenta-del-vecino-periodo-por-periodo';

const { fontFamily: titulo } = fuenteTitulo('normal', { weights: ["400","500","600","700","800"], subsets: ["latin-ext","latin"] });
const { fontFamily: texto } = fuenteTexto('normal', { weights: ["400","500","600","700","800"], subsets: ["latin-ext","latin"] });
export const marca: Marca = { ...{"acento":"#00B37E","acentoOscuro":"#008F65","secundario":"#59CEAB","fondo":"#0A1E18","fondoProfundo":"#0B110F","superficie":"#162924","superficie2":"#23352F","borde":"#31423D","texto":"#FAFBFA","texto2":"#B2B5B4","texto3":"#838685","exito":"#00B37E","alerta":"#F59E0B","error":"#E5484D","info":"#3B82F6","lema":"Del lote que se vende, a la expensa que se cobra.","dominio":"urbanify.com.ar"}, fuenteTitulo: titulo, fuenteTexto: texto };
const TARJETAS: Record<string, React.FC<TarjetaProps>> = { 'lo-primero-que-ve-el-administrador': T_lo_primero_que_ve_el_administrador, 'la-mora-tiene-nombre-y-lote': T_la_mora_tiene_nombre_y_lote, 'en-que-se-le-va-la-plata-al-barrio': T_en_que_se_le_va_la_plata_al_barrio, 'lo-que-se-construye-y-quien-lo-paga': T_lo_que_se_construye_y_quien_lo_paga, 'la-expensa-del-mes-lote-por-lote': T_la_expensa_del_mes_lote_por_lote, 'el-barrio-pintado-por-su-mora': T_el_barrio_pintado_por_su_mora, 'la-ronda-del-portero-desde-el-telefono': T_la_ronda_del_portero_desde_el_telefono, 'lo-que-ve-el-vecino-al-entrar': T_lo_que_ve_el_vecino_al_entrar, 'la-cuenta-del-vecino-periodo-por-periodo': T_la_cuenta_del_vecino_periodo_por_periodo };
export const Tarjetas: React.FC<{ plan: PlanTarjetasApp }> = ({ plan }) => <Marco plan={plan} marca={marca} tarjetas={TARJETAS} />;
