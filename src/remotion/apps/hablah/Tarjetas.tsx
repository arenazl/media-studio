// GENERADO POR EL MOTOR (server/tarjetasPlantilla.mjs): no editar a mano. La marca sale del kit de hablah y cada
// tarjeta la escribe el agente mirando la captura de su pantalla (tarjetas/<id>.tsx). El procedimiento: ../_base/Marco.tsx.
import React from 'react';
import { loadFont as fuenteTitulo } from '@remotion/google-fonts/Sora';
import { loadFont as fuenteTexto } from '@remotion/google-fonts/Inter';
import { Marco, type Marca, type PlanTarjetasApp, type TarjetaProps } from '../_base/Marco';
import { Mockup as T_clase_de_chicos_en_vivo } from './tarjetas/clase-de-chicos-en-vivo';
import { Mockup as T_inicio_de_chicos_la_aventura_de_hoy } from './tarjetas/inicio-de-chicos-la-aventura-de-hoy';
import { Mockup as T_clase_de_adultos_en_vivo } from './tarjetas/clase-de-adultos-en-vivo';
import { Mockup as T_devolucion_despues_de_la_charla } from './tarjetas/devolucion-despues-de-la-charla';
import { Mockup as T_elegir_de_que_hablar } from './tarjetas/elegir-de-que-hablar';
import { Mockup as T_historial_cuanto_hablaste } from './tarjetas/historial-cuanto-hablaste';
import { Mockup as T_mapa_de_progreso } from './tarjetas/mapa-de-progreso';

const { fontFamily: titulo } = fuenteTitulo('normal', { weights: ["400","500","600","700","800"], subsets: ["latin-ext","latin"] });
const { fontFamily: texto } = fuenteTexto('normal', { weights: ["400","500","600","700","800"], subsets: ["latin-ext","latin"] });
export const marca: Marca = { ...{"acento":"#00B37E","acentoOscuro":"#008F63","secundario":"#FFB800","fondo":"#041510","fondoProfundo":"#040706","superficie":"#11211C","superficie2":"#1D2C28","borde":"#2C3A36","texto":"#E8ECEA","texto2":"#A4A7A6","texto3":"#767A78","exito":"#22C55E","alerta":"#F59E0B","error":"#E5484D","info":"#3B82F6","lema":"Hablás. Aprendés. sin exámenes.","dominio":"hablah.com.ar"}, fuenteTitulo: titulo, fuenteTexto: texto };
const TARJETAS: Record<string, React.FC<TarjetaProps>> = { 'clase-de-chicos-en-vivo': T_clase_de_chicos_en_vivo, 'inicio-de-chicos-la-aventura-de-hoy': T_inicio_de_chicos_la_aventura_de_hoy, 'clase-de-adultos-en-vivo': T_clase_de_adultos_en_vivo, 'devolucion-despues-de-la-charla': T_devolucion_despues_de_la_charla, 'elegir-de-que-hablar': T_elegir_de_que_hablar, 'historial-cuanto-hablaste': T_historial_cuanto_hablaste, 'mapa-de-progreso': T_mapa_de_progreso };
export const Tarjetas: React.FC<{ plan: PlanTarjetasApp }> = ({ plan }) => <Marco plan={plan} marca={marca} tarjetas={TARJETAS} />;
