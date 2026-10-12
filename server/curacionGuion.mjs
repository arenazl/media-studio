// Curación externa del guion (2026-10-10, Lucas: "un botón de exportar que le mande a ChatGPT el concepto, el producto,
// la estrategia, la estructura y el guion, y en la misma pantalla importar la curación: usamos nuestra orquestación como
// generador y ChatGPT como curador"). Exportar arma un texto plano autosuficiente para pegar en ChatGPT; importar lee su
// respuesta (un bloque JSON con la forma de nuestro guion), la normaliza y la valida con el mismo validador del molde.
// No llama a ningún modelo. La curación aplicada queda registrada como una corrida del guion (proveedor "chatgpt"), así la
// radiografía muestra qué recibió y qué devolvió.
import { buildProjectFacts, factsText } from './projectFacts.mjs';
import { presupuestoTexto, validarResultado, rolCanonico } from './prompting.mjs';

const S = (v) => (typeof v === 'string' ? v.trim() : '');
const arr = (v) => (Array.isArray(v) ? v.filter((x) => x !== undefined && x !== null && x !== '') : []);
const ENFOQUE = { caso: 'Un caso de principio a fin (problema y solución)', producto: 'Producto a la vista (demo)', 'dos-lados': 'Los dos lados', 'antes-despues': 'Antes y después', testimonio: 'Voz de una persona (testimonio dramatizado)', institucional: 'Marca y visión', humor: 'Situación con humor' };
const TRATAMIENTO = { natural: 'Cotidiano', sobrio: 'Sobrio', calido: 'Cálido', aspiracional: 'Inspirador', humor: 'Con humor' };
const ROL = { hook: 'hook (el gancho: los primeros segundos, para que no pasen de largo)', desarrollo: 'desarrollo (lo que pasa y por qué importa)', giro: 'giro (opcional: el momento en que el producto cambia la situación)', cta: 'cta (el cierre con el llamado a la acción)' };

const PASO = { strategy: 'Negocio (estrategia)', concept: 'Concepto', script: 'Guion', cast: 'Personajes', storyboard: 'Storyboard', flowpack: 'Pack de Flow' };

const ORIGEN = { kit: 'sale del kit', anterior: 'sale de un paso anterior', creativo: 'invención creativa', imaginado: 'lo imaginó' };

// La radiografía en texto: por paso, cada frase que escribió el modelo con su origen y sus alertas, y qué hizo con el kit.
function radiografiaEnTexto(radio) {
  const L = [];
  for (const p of radio?.pasos || []) {
    if (!p.frases?.length) continue;
    const c = p.corrida || {};
    L.push('');
    L.push(`--- ${p.label}${c.modelo ? ` · modelo ${c.modelo}` : ''}${c.version ? ` · molde ${c.version}` : ''} ---`);
    L.push(`Lo que decidió el modelo en este paso: ${p.decideLaIA}`);
    L.push(`De dónde salen sus frases: del kit ${p.origen.kit}%, de un paso anterior ${p.origen.anterior}%, invención creativa ${p.origen.creativo}%, lo imaginó ${p.origen.imaginado}%.`);
    if (p.editadoAMano) L.push('Ojo: el dueño retocó a mano el concepto elegido después de generarlo.');
    for (const f of p.frases) L.push(`- [${ORIGEN[f.origen] || f.origen}${f.hecho ? ` ← ${f.hecho.etiqueta}` : ''}] ${f.campo}${f.n ? ` ${f.n}` : ''}: "${f.texto}"${f.alertas?.length ? `  ALERTA: ${f.alertas.join('; ')}` : ''}`);
    const por = (e) => (p.hechos || []).filter((h) => h.estado === e).map((h) => h.etiqueta);
    L.push(`Hechos del kit que usó: ${por('usado').join(', ') || 'ninguno'}.`);
    L.push(`Le llegaron y no los usó: ${por('ignorado').join(', ') || 'ninguno'}.`);
    if (por('no-llego').length) L.push(`No le llegaron (el prompt no los traía): ${por('no-llego').join(', ')}.`);
    if (p.descartadas?.length) L.push(`Las otras ideas que propuso y no se eligieron: ${p.descartadas.map((d) => `"${d.titulo}": ${d.idea}`).join(' | ')}`);
  }
  return L;
}

export function exportarGuion({ project = {}, comercial = {}, durationSec = 20, formato = '', corridas = [], radio = null }) {
  const f = buildProjectFacts(project);
  const marca = S(project.name) || f.name;
  const fonetica = S(project.brandKit?.phonetic) || S(project.kb?.brand?.phonetic) || '';
  const cta = S(project.kb?.cta?.primary) || S(project.cta?.principal) || '';
  const c = comercial.concepto || {};
  const blocks = arr(comercial.guion?.blocks);
  const L = [];
  L.push('QUÉ ES ESTO');
  L.push(`Sos guionista publicitario senior y escribís en español rioplatense, con voseo. Te paso el guion de un reel de ${durationSec} segundos para ${marca}, escrito por otra IA a partir de la ficha del producto y de un concepto ya elegido. Ni el dueño ni el sistema son expertos en publicidad: necesitamos tu ojo. Te mando todo el camino: la ficha del producto, lo que decidió cada paso, el guion resultante, una radiografía automática de qué usó cada paso del producto, qué ignoró y qué imaginó, y en el anexo los prompts exactos con el modelo que los corrió. Tu trabajo tiene tres partes. Primero, el diagnóstico: qué salió mal y por qué, señalando dónde los prompts se contradicen, qué dato importante se perdió en el camino y qué se inventó. Segundo, el guion curado: más natural, con más gracia y mejor ritmo, sin cambiar los hechos del producto ni inventar nada. Tercero, los prompts curados, sobre todo la parte que depende del enfoque y del tratamiento elegidos, y las descripciones que se le mandan a Flow (para que el video salga como el guion pide), así la próxima vez sale bien de primera. Devolvés las tres cosas con el formato del final.`);
  L.push('');
  L.push('FICHA DEL NEGOCIO (los hechos: no se cambian ni se agregan)');
  L.push(factsText(f));
  L.push('');
  L.push('BRIEF DE ESTA PIEZA');
  if (S(comercial.angulo)) L.push(`- Ángulo: ${S(comercial.angulo)}`);
  if (S(comercial.creativeBrief)) L.push(`- Brief creativo: ${S(comercial.creativeBrief)}`);
  if (S(comercial.primaryMessage)) L.push(`- Mensaje principal: ${S(comercial.primaryMessage)}`);
  arr(comercial.supportingFacts).forEach((x) => L.push(`- Dato que lo sostiene: ${S(x)}`));
  L.push(`- Formato: ${formato || 'reel vertical 9:16'}, ${durationSec} segundos, para Instagram y TikTok. Tipo: ${comercial.tipo === 'animado' ? 'animado (pantallas de la app)' : 'filmado con personas'}.`);
  if (comercial.enfoque) L.push(`- Cómo se cuenta: ${ENFOQUE[comercial.enfoque] || comercial.enfoque}`);
  if (comercial.tratamiento) L.push(`- Cómo se siente: ${TRATAMIENTO[comercial.tratamiento] || comercial.tratamiento}`);
  L.push('');
  L.push('CONCEPTO ELEGIDO');
  if (S(c.topico)) L.push(`- Título: ${S(c.topico)}`);
  if (S(c.idea)) L.push(`- La idea: ${S(c.idea)}`);
  if (S(c.tono)) L.push(`- Tono actoral: ${S(c.tono)}`);
  if (S(c.estetica)) L.push(`- Dirección visual: ${S(c.estetica)}`);
  if (S(c.porQueFunciona)) L.push(`- Por qué funciona: ${S(c.porQueFunciona)}`);
  L.push('');
  L.push('ESTRUCTURA');
  L.push('Cada bloque tiene un rol, lo que se DICE (la voz) y lo que se VE (la imagen), con su duración en segundos. Los roles, en este orden:');
  for (const r of ['hook', 'desarrollo', 'giro', 'cta']) L.push(`- ${ROL[r]}`);
  L.push(`Presupuesto de palabras habladas (se lee en voz alta): ${presupuestoTexto(durationSec)}`);
  L.push('');
  L.push('GUION A CURAR');
  blocks.forEach((b, i) => {
    L.push(`${i + 1}. [${rolCanonico(b.role)} · ${Number(b.durSec) || '?'} s]`);
    L.push(`   Dice: "${S(b.narration)}"`);
    if (S(b.visual)) L.push(`   Se ve: ${S(b.visual)}`);
  });
  if (S(comercial.guion?.music?.mood)) L.push(`Música: ${S(comercial.guion.music.mood)}`);
  const pack = comercial.packFlow;
  if (pack && (arr(pack.personajes).length || arr(pack.escenas).length)) {
    L.push('');
    L.push('FLOW: LO QUE SE LE MANDA A GOOGLE FLOW (VEO), TAL CUAL');
    L.push('Esto es lo que genera el video: cada personaje es una imagen de referencia y cada escena es un clip de 8 segundos que el montaje recorta. La escena del cta no se filma: el cierre es una placa con la marca que arma el motor.');
    if (S(pack.estilo)) L.push(`Estilo global: ${S(pack.estilo)}`);
    for (const p of arr(pack.personajes)) L.push(`- Personaje "${S(p.nombre)}" (imagen de referencia): ${S(p.promptImagen)}`);
    for (const e of arr(pack.escenas)) L.push(`- Escena ${e.escenaN} [${S(e.rol)}]: ${S(e.prompt)}`);
  }
  const rx = radiografiaEnTexto(radio);
  if (rx.length) {
    L.push('');
    L.push('RADIOGRAFÍA DEL CAMINO (lectura automática por coincidencia de palabras: es un indicador, no un juez)');
    L.push(...rx);
  }
  L.push('');
  L.push('REGLAS');
  L.push('- No inventes datos, cifras, precios, testimonios, nombres de clientes ni promesas absolutas ("garantizado", "100% seguro").');
  if (f.doNotSay.length) L.push(`- No decir: ${f.doNotSay.join('; ')}.`);
  L.push('- Podés cambiar palabras, orden, ritmo y gracia; no podés cambiar lo que el producto hace.');
  L.push('- Respetá el presupuesto de palabras de cada bloque y que la suma de duraciones dé los segundos de la pieza.');
  if (fonetica && fonetica.toLowerCase() !== marca.toLowerCase()) L.push(`- En lo que se DICE, la marca va escrita como se pronuncia: "${fonetica}" (nunca "${marca}"). En lo que se VE puede ir escrita normal.`);
  L.push('- En lo que se VE, nunca pongas a alguien mirando una pantalla para mostrar la app: las pantallas reales se muestran aparte, con un mockup. Describí personas, lugares y reacciones.');
  if (cta) L.push(`- El cta cierra con el llamado del kit, dicho natural: "${cta}".`);
  L.push('');
  L.push('DEVOLVÉ, en este orden');
  L.push('1. El diagnóstico, en una lista corta: qué salió mal en el camino y por qué, citando la parte del prompt o de la radiografía que lo explica (contradicciones entre capas, datos que se perdieron, cosas inventadas, el enfoque mal aplicado). Después, en dos líneas, qué cambiaste en el guion.');
  L.push('2. El guion completo en un solo bloque de código JSON, exactamente con esta forma y sin comentarios:');
  L.push('```json');
  L.push(JSON.stringify({ blocks: [{ role: 'hook', narration: 'lo que se dice', visual: 'lo que se ve', durSec: 3 }, { role: 'desarrollo', narration: '…', visual: '…', durSec: 9 }, { role: 'giro', narration: '…', visual: '…', durSec: 6 }, { role: 'cta', narration: '…', visual: '…', durSec: 4 }], music: { mood: 'el clima musical en pocas palabras' } }));
  L.push('```');
  const enf = ENFOQUE[comercial.enfoque] || comercial.enfoque || 'el elegido', tra = TRATAMIENTO[comercial.tratamiento] || comercial.tratamiento || 'el elegido';
  L.push(`3. Una sección que empiece con la línea exacta "CURACIÓN DE PROMPTS", con: qué parte de los prompts del anexo explica las debilidades del guion original; el texto corregido, listo para reemplazar, de la parte que depende del enfoque "${enf}" y del tratamiento "${tra}"; los cambios que harías a las reglas fijas de los prompts; y, escena por escena, la descripción para Flow corregida si la de arriba no va a dar el video que el guion pide (continuidad de personajes, nada de pantallas filmadas, acción que entre en 8 segundos). Texto plano, sin JSON.`);
  const camino = corridas.filter((r) => PASO[r.function_id] && S(r.prompt_text));
  if (camino.length) {
    L.push('');
    L.push('ANEXO: CÓMO SE LLEGÓ HASTA ACÁ');
    L.push(`Los prompts exactos que recibió el modelo en cada paso, en orden. El enfoque elegido fue "${enf}" y el tratamiento "${tra}": esa parte del prompt cambia con la elección; el resto es fijo del molde o son datos del producto.`);
    for (const r of camino) {
      L.push('');
      L.push(`=== PASO: ${PASO[r.function_id]} · modelo ${S(r.model_real) || S(r.model) || 'desconocido'} · molde ${S(r.prompt_version)} ===`);
      L.push(S(r.prompt_text));
      L.push(`=== FIN DEL PROMPT DE ${PASO[r.function_id].toUpperCase()} ===`);
    }
  }
  return L.join('\n');
}

// Lee la respuesta de ChatGPT: el resumen (lo de antes del JSON) y el guion (el primer bloque JSON con "blocks").
export function importarGuion(texto, { project = {}, comercial = {}, durationSec = 20 } = {}) {
  const t = String(texto || '');
  const candidatos = [];
  for (const m of t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) candidatos.push(m[1]);
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) candidatos.push(t.slice(a, b + 1));
  let guion = null;
  for (const c of candidatos) {
    try { const o = JSON.parse(c.trim()); if (Array.isArray(o?.blocks) && o.blocks.length) { guion = o; break; } } catch { /* sigue con el próximo */ }
  }
  if (!guion) return { guion: null, errores: ['No encontré el guion en la respuesta: tiene que venir un bloque JSON con "blocks". Pegá la respuesta entera de ChatGPT.'], resumen: '' };
  // script/3.x: `quien` (quién lo dice en cámara, o "placa") viaja; sin él el storyboard vuelve a adivinar el hablante
  const blocks = guion.blocks.map((x) => ({ role: rolCanonico(S(x.role) || 'desarrollo'), ...(S(x.quien) ? { quien: S(x.quien) } : {}), narration: S(x.narration), visual: S(x.visual), ...(Number(x.durSec) ? { durSec: Number(x.durSec) } : {}) }));
  const limpio = { blocks, ...(S(guion.music?.mood) ? { music: { mood: S(guion.music.mood) } } : comercial.guion?.music ? { music: comercial.guion.music } : {}) };
  const body = { functionId: 'script', context: { project: { name: project.name, phonetic: project.brandKit?.phonetic || project.kb?.brand?.phonetic || project.name }, piece: { durationSec, tipo: comercial.tipo } } };
  const errores = validarResultado('script', limpio, body);
  const ini = t.search(/```|\{/);
  const resumen = S(ini > 0 ? t.slice(0, ini) : '').slice(0, 1200);
  const k = t.search(/CURACI[ÓO]N DE PROMPTS/i);
  const curacionPrompts = k >= 0 ? S(t.slice(k)) : '';
  return { guion: limpio, errores, resumen, curacionPrompts };
}
