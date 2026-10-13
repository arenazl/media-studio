// Catálogo editorial agnóstico a la marca. El backend lo consulta como *referencia*, no como receta.
import { readFileSync } from 'node:fs';
const catalogo = JSON.parse(readFileSync(new URL('../src/data/patronesMontaje.json', import.meta.url), 'utf8'));
export function patronesDeMontaje(enfoque = '', tratamiento = '') {
  return catalogo.patrones.filter((p) =>
    p.enfoques.includes(enfoque) || p.tratamientos.includes(tratamiento)
  ).map(({ id, nombre, narrativa, priorizar, evitar }) => ({ id, nombre, narrativa, priorizar, evitar }));
}
