// Arma el PEDIDO para que ChatGPT evalúe una corrida en seco ya hecha (norma 36 de base-compartida: markdown plano con
// contexto, qué buscamos y el material tal cual). El test no evalúa: esto es aparte y se sube a ChatGPT a mano.
// Uso: node scripts/corrida-seco/pedido-chatgpt.mjs <carpeta-de-la-corrida>
//      → <carpeta>/pedido-chatgpt.md y una copia en base-compartida/mediastudio/curaciones/pedidos/
import fs from 'node:fs';
import path from 'node:path';
import { casoMd, eleccionEnPalabras } from './informe.mjs';

const CARPETA = path.resolve(process.argv[2] || '');
if (!fs.existsSync(CARPETA)) { console.error('Pasame la carpeta de la corrida (docs/22-corridas-en-seco/<fecha_hora>)'); process.exit(1); }
const casos = fs.readdirSync(CARPETA).filter((f) => /^caso-\d+\.json$/.test(f)).sort().map((f) => JSON.parse(fs.readFileSync(path.join(CARPETA, f), 'utf8')));
let tiempos = '';
try {
  const t = JSON.parse(fs.readFileSync(path.join(CARPETA, 'tiempos.json'), 'utf8'));
  const porPaso = {};
  for (const f of t.tiempos) (porPaso[f.paso] ||= []).push(f.seg);
  tiempos = Object.entries(porPaso).map(([k, v]) => `${k} ${Math.round(v.reduce((a, b) => a + b, 0) / v.length)} s`).join(' · ');
} catch { /* sin tiempos */ }
const fecha = path.basename(CARPETA).replace('_', ' ');

const pedido = `# Evaluar ${casos.length} corridas en seco del pipeline creativo de Media Studio (${fecha})

> Para ChatGPT. Subir o pegar tal cual.

## 1. Contexto

Media Studio fabrica comerciales verticales (9:16, 20 a 40 s) para apps propias y de clientes. El usuario elige tres cosas al empezar: el **objetivo** de la campaña, el **tipo de historia** y el **clima**. Desde ahí, una cadena de moldes de IA (Claude) arma la pieza: Estrategia → Concepto (propone 3) → Guion → Personajes → Storyboard → Pedidos a Google Flow (Veo 3), que filma cada escena → Director de montaje, que propone pocas decisiones de edición sobre el material real (pausas o bajadas de música, cortes, disolvencias, mostrar la cara, sin efecto). Las pantallas de la app las ponen mockups animados reales (no los genera Flow) y el cierre lo hace el motor (logo, voz y frase).

Esta es una **corrida en seco**: se generó todo menos los videos y los mockups. El director de montaje trabajó sobre las escenas del storyboard (su diálogo hizo de transcripción), no sobre tomas filmadas.

## 2. Qué te pedimos

Evaluá los casos como un director creativo y un montajista publicitario exigentes. Para **cada caso**:

1. **Fidelidad a la elección**: ¿la pieza responde al objetivo, al tipo de historia y al clima elegidos? ¿Se nota la diferencia entre casos con elecciones distintas, o todos se parecen?
2. **Concepto y guion**: ¿hay una idea publicitaria (no una descripción del producto)? ¿El gancho funciona en el primer segundo? ¿Los diálogos suenan a gente real (rioplatense) y caben en su duración? ¿El cierre de marca es claro?
3. **Storyboard**: ¿cada escena es filmable, con una acción concreta y un plano que sirve? ¿Es coherente con el guion? ¿El ritmo da para un reel?
4. **Pedidos a Flow**: ¿son buenos prompts para Veo 3? ¿Describen persona, acción, lugar, cámara y luz sin contradicciones? ¿Piden algo que Veo hace mal (texto en pantalla, interfaces legibles, demasiadas acciones en 8 s)? ¿Mantienen a los personajes coherentes entre escenas?
5. **Director de montaje**: ¿las decisiones tienen sentido para esa pieza y ese clima, o son genéricas? ¿Pocas y justificadas?
6. **Puntaje de 1 a 10** en cada uno de los cinco puntos, y **los 3 problemas más graves** del caso con una frase de cómo arreglarlos.

Al final:

- **Tabla resumen**: caso → puntajes → problema principal.
- **Patrones**: los problemas que se repiten en varios casos. Esos apuntan al motor (los moldes) y no a una pieza suelta. Para cada patrón, decí en qué paso de la cadena nace y qué cambiarías en ese paso, en criterio y no en reglas sueltas.
- **Lo que está bien** y no hay que tocar.

Formato de salida: markdown, una sección por caso, después la tabla y los patrones.

## 3. Datos de la corrida

- Modelos: estrategia, concepto, guion y director de montaje con Claude Opus; personajes, storyboard y pedidos a Flow con Claude Sonnet.
- Tiempo promedio por paso: ${tiempos || 's/d'}.
- Los casos (app · objetivo · tipo de historia · clima):
${casos.map((j) => `  - Caso ${j.caso.n}: ${j.app.nombre} · ${eleccionEnPalabras(j.caso)}`).join('\n')}

---

${casos.map(casoMd).join('\n\n---\n\n')}
`;
const destino = path.join(CARPETA, 'pedido-chatgpt.md');
fs.writeFileSync(destino, pedido);
const compartida = 'D:/Code/base-compartida/mediastudio/curaciones/pedidos';
if (fs.existsSync(compartida)) fs.writeFileSync(path.join(compartida, `05-evaluar-corrida-en-seco-${path.basename(CARPETA)}.md`), pedido);
console.log(`${casos.length} casos · ${destino} (${Math.round(pedido.length / 1000)} mil caracteres)`);
