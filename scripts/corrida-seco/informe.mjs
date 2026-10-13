// El markdown de un caso de la corrida en seco: lo que salió de cada paso, tal cual, para leerlo (Lucas o ChatGPT).
// No evalúa nada.
const S = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));
export const NOMBRES = {
  objetivo: { awareness: 'Dar a conocer la marca', demo: 'Mostrar cómo funciona', conversion: 'Conseguir consultas', 'campaña': 'Campaña completa', 'solo-mockups': 'Sólo pantallas animadas' },
  enfoque: { caso: 'Un caso de principio a fin', producto: 'Producto a la vista', 'dos-lados': 'Los dos lados', 'antes-despues': 'Antes y después', testimonio: 'Voz de una persona', institucional: 'Marca y visión', humor: 'Situación con humor' },
  tratamiento: { natural: 'Cotidiano', sobrio: 'Sobrio', calido: 'Cálido', aspiracional: 'Aspiracional', humor: 'Con humor' },
};
export const eleccionEnPalabras = (k) => `${NOMBRES.objetivo[k.objetivo] || k.objetivo} · ${NOMBRES.enfoque[k.enfoque] || k.enfoque} · ${NOMBRES.tratamiento[k.tratamiento] || k.tratamiento}`;

export function casoMd(j) {
  const c = j.comercial, k = j.caso, L = [];
  L.push(`## Caso ${k.n} · ${j.app.nombre}`);
  L.push(`**Elección del usuario:** objetivo «${NOMBRES.objetivo[k.objetivo] || k.objetivo}» · tipo de historia «${NOMBRES.enfoque[k.enfoque] || k.enfoque}» · clima «${NOMBRES.tratamiento[k.tratamiento] || k.tratamiento}». Formato: ${S(j.formatoId) || 'reel vertical 9:16 híbrido'}.`);
  L.push(`**Rubro:** ${S(j.app.rubro) || '—'}`);
  L.push('', '### 1. Estrategia (la pieza que propuso)');
  const p = j.estrategia?.pieza || {};
  L.push(`- Ángulo: ${S(p.angle)}`, `- Mensaje principal: ${S(p.primaryMessage)}`, `- Brief creativo: ${S(p.creativeBrief)}`);
  if (Array.isArray(p.supportingFacts) && p.supportingFacts.length) L.push(`- Datos que lo sostienen: ${p.supportingFacts.map(S).join(' · ')}`);
  L.push('', '### 2. Concepto (propuso varias; el caso toma la primera)');
  (j.conceptosPropuestos || []).forEach((x, i) => {
    L.push(`**${i === 0 ? 'ELEGIDA' : `Alternativa ${i + 1}`}: ${S(x.titulo || x.title || x.nombre || x.topico)}**`);
    for (const [kk, vv] of Object.entries(x)) if (!['titulo', 'title', 'nombre', 'topico', 'id'].includes(kk) && vv && typeof vv !== 'object') L.push(`- ${kk}: ${S(vv)}`);
  });
  L.push('', '### 3. Guion');
  for (const b of c.guion?.blocks || []) L.push(`- **[${b.role}]** ${S(b.narration) || '(sin texto)'}${b.accion ? ` — _acción:_ ${S(b.accion)}` : ''}${b.visual ? ` — _visual:_ ${S(b.visual)}` : ''}`);
  if (c.guion?.music) L.push(`- Música pedida: ${typeof c.guion.music === 'object' ? Object.entries(c.guion.music).map(([a, b]) => `${a}: ${S(b)}`).join(' · ') : S(c.guion.music)}`);
  L.push('', '### 4. Personajes');
  for (const pe of c.cast?.personajes || []) L.push(`- **${S(pe.nombre)}** (${S(pe.rol)}): ${S(pe.fisicoEn || pe.fisico)} ${pe.vestuarioEn ? `· ropa: ${S(pe.vestuarioEn)}` : ''}`);
  if (c.cast?.lugar) L.push(`- Lugar: ${S(c.cast.lugar.descripcionEn || c.cast.lugar.descripcion)}`);
  L.push('', '### 5. Storyboard');
  for (const e of c.storyboard || []) L.push(`- **Escena ${e.n}** (${S(e.rol)}, ${S(e.durSec)} s, ${S(e.plano) || 'plano s/d'})${(e.personajes || []).length ? ` · en cuadro: ${(e.personajes || []).join(', ')}` : ''}${e.pantalla ? ` · pantalla de la app: «${S(e.pantalla)}»` : ''}\n  - Dice: ${S(e.dialogo) || '—'}\n  - Acción: ${S(e.accion)}${e.accionEn ? `\n  - Acción (para el generador): ${S(e.accionEn)}` : ''}`);
  L.push('', '### 6. Pedidos a Google Flow (Veo 3), tal cual se mandan');
  for (const pe of c.packFlow?.personajes || []) L.push(`- **Retrato de ${S(pe.nombre)}:** ${S(pe.promptImagen)}`);
  for (const e of c.packFlow?.escenas || []) L.push(`- **Escena ${e.escenaN}** (${S(e.rol)}):\n\n  > ${S(e.prompt)}\n`);
  L.push('', '### 7. Director de montaje (IA) — sobre las escenas del storyboard');
  const m = j.montaje || {};
  L.push(`- Diagnóstico: ${S(m.diagnostico)}`);
  for (const d of m.decisiones || []) L.push(`- Decisión: **${S(d.recurso)}** en la escena ${S(d.escenaN)} (${S(d.cuando)}${d.durSec ? `, ${d.durSec} s` : ''}) — ${S(d.motivo)}`);
  if (!(m.decisiones || []).length) L.push('- (sin decisiones)');
  return L.join('\n');
}
