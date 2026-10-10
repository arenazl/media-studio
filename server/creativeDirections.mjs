// Una sola fuente compartida con React (src/data/creativeDirections.json).
// El backend lee la ficha seleccionada; no hay historias ni escenas hardcodeadas.
import { readFileSync } from 'node:fs';

const DATA = JSON.parse(readFileSync(new URL('../src/data/creativeDirections.json', import.meta.url), 'utf8'));
const byId = (items, id, fallback) => items.find((x) => x.id === id) || items.find((x) => x.id === fallback);

export function creativeDirectionPrompt({ enfoque = 'caso', tratamiento = 'sobrio', tipo = 'filmado' } = {}) {
  const approach = byId(DATA.enfoques, enfoque, 'caso');
  // El enfoque 'humor' es comedia por definición; en otros enfoques el humor es optativo.
  const style = byId(DATA.tratamientos, approach.id === 'humor' ? 'humor' : tratamiento, 'sobrio');
  const ficha = approach.ficha;
  const humo = style.id === 'humor'
    ? '\nHERRAMIENTAS DE COMEDIA (elegí sólo 1 o 2, NO las enumeres en la respuesta):\n' + DATA.recursosHumor.map((r) => '- ' + r.nombre + ': ' + r.mecanismo + ' EVITÁ: ' + r.fallo).join('\n') + '\nAntes de responder, descartá internamente premisas que sólo resulten raras, que humillen, que no tengan giro o que oculten el valor del producto. El humor se prueba por situación y remate, no por poner la etiqueta HUMOR.'
    : '\nNO INCLUIR COMEDIA por defecto: ningún remate gracioso, ironía o parodia es obligatorio. Buscá un cierre publicitario con sentido.';
  return `DIRECCIÓN CREATIVA ELEGIDA (manda sobre ejemplos genéricos del resto del prompt):
ENFOQUE: ${approach.label}
IDEA CENTRAL: ${ficha.ideaCentral}
PERSONAS/ROLES POSIBLES (no son obligatorios): ${ficha.quienesAparecen.join(' · ')}
ARCO NARRATIVO (guía semántica, NO lista de escenas para copiar): ${ficha.recorrido.join(' → ')}
USO DE PANTALLAS: ${ficha.pantallasDelProducto}
TONO BASE: ${ficha.tono}
NO ASUMIR EN ESTE ENFOQUE: ${ficha.noAsumir.join(' · ')}
CIERRE DE MARCA: ${ficha.cierre}
TRATAMIENTO: ${style.label}. ${style.descripcion} ${style.indicaciones} EVITAR: ${style.evitar}
TÉCNICA: ${tipo === 'animado' ? 'animación de producto sin personajes filmados ni presentadora a cámara' : 'filmado con personas si el concepto las necesita'}.
La libertad de la IA está en inventar situaciones y relatos diferentes DENTRO de esta dirección, usando únicamente hechos del negocio.${humo}`;
}
