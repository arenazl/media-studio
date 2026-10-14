// Lo que se le pasa a ChatGPT desde cada pantalla (Lucas, 2026-10-13: "hay un mar de botones de ChatGPT, importar,
// exportar, por todos lados; debería haber un botoncito chiquito por función, para que ChatGPT analice esa pantalla, y
// después uno completo al final"). Cada paso arma SU pedido: el contexto de la pieza, lo que salió en esa pantalla tal
// cual, y la pregunta para ese paso. El completo junta todos. Es markdown plano para pegar o subir (norma 36). No llama a
// ningún modelo: sólo arma el texto.
import type { Comercial } from './comercial';
import type { Project } from './projects';
import type { MontajeState } from './montajePlan';

export type PasoChatGPT = 'concepto' | 'guion' | 'cast' | 'storyboard' | 'pack' | 'montaje';

const S = (v: unknown): string => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));
const OBJETIVO: Record<string, string> = { awareness: 'Dar a conocer la marca', demo: 'Mostrar cómo funciona', conversion: 'Conseguir consultas', 'campaña': 'Campaña completa', 'solo-mockups': 'Sólo pantallas animadas' };
const ENFOQUE: Record<string, string> = { caso: 'Un caso de principio a fin', producto: 'Producto a la vista', 'dos-lados': 'Los dos lados', 'antes-despues': 'Antes y después', testimonio: 'Voz de una persona', institucional: 'Marca y visión', humor: 'Situación con humor' };
const CLIMA: Record<string, string> = { natural: 'Cotidiano', sobrio: 'Sobrio', calido: 'Cálido', aspiracional: 'Aspiracional', humor: 'Con humor' };

function contexto(project: Project, c: Comercial): string {
  // el brief del KB trae sus propios títulos (# …): se bajan a negrita para no desordenar las secciones del pedido
  const brief = S(project.brief).slice(0, 1200).replace(/^#{1,6}\s*(.+)$/gm, '**$1**');
  return [
    '## Contexto',
    '',
    'Media Studio fabrica comerciales verticales (9:16, 20 a 40 s) con una cadena de IA: Estrategia → Concepto → Guion → Personajes → Storyboard → Pedidos a Google Flow (Veo 3), que filma cada escena → Montaje (con un director de montaje IA que propone pocas decisiones de edición). Las pantallas de la app son mockups animados reales (no las genera Flow) y el cierre lo arma el motor (logo, voz y frase).',
    '',
    `- **Marca:** ${S(project.name)}${S(project.type) ? ` · rubro: ${S(project.type)}` : ''}`,
    `- **Pieza:** ${S(c.titulo)}`,
    `- **Elección del usuario:** objetivo «${OBJETIVO[S(c.perfilCampana)] || S(c.perfilCampana) || 'Campaña completa'}» · tipo de historia «${ENFOQUE[S(c.enfoque)] || S(c.enfoque) || 'Un caso de principio a fin'}» · clima «${CLIMA[S(c.tratamiento)] || S(c.tratamiento) || 'Cotidiano'}»`,
    ...(S(c.primaryMessage) ? [`- **Mensaje principal:** ${S(c.primaryMessage)}`] : []),
    ...(brief ? ['', '**Lo que sabemos del negocio (resumen):**', '', brief] : []),
  ].join('\n');
}

function secConcepto(c: Comercial): string {
  const L = ['## Concepto'];
  const props = (c as { conceptosPropuestos?: Record<string, unknown>[] }).conceptosPropuestos || [];
  const elegida = c.concepto as unknown as Record<string, unknown> | undefined;
  const lista = props.length ? props : elegida ? [elegida] : [];
  if (!lista.length) return `${L[0]}\n\n(todavía no hay concepto)`;
  lista.forEach((x, i) => {
    const esElegida = elegida && (x.id === elegida.id || (!props.length && i === 0));
    L.push('', `**${esElegida ? 'ELEGIDA' : `Propuesta ${i + 1}`}: ${S(x.topico || x.titulo)}**`);
    for (const [k, v] of Object.entries(x)) if (!['id', 'topico', 'titulo', 'editadoAMano'].includes(k) && v && typeof v !== 'object') L.push(`- ${k}: ${S(v)}`);
  });
  return L.join('\n');
}
function secGuion(c: Comercial): string {
  const blocks = c.guion?.blocks || [];
  if (!blocks.length) return '## Guion\n\n(todavía no hay guion)';
  const L = ['## Guion'];
  for (const b of blocks as unknown as Record<string, unknown>[]) L.push(`- **[${S(b.role)}]** ${S(b.narration) || '(sin texto)'}${b.visual ? ` — _visual:_ ${S(b.visual)}` : ''}${b.accion ? ` — _acción:_ ${S(b.accion)}` : ''}`);
  const m = c.guion?.music as unknown;
  if (m) L.push(`- Música pedida: ${typeof m === 'object' ? Object.entries(m as Record<string, unknown>).map(([a, b]) => `${a}: ${S(b)}`).join(' · ') : S(m)}`);
  return L.join('\n');
}
function secCast(c: Comercial): string {
  const ps = (c.cast?.personajes || []) as unknown as Record<string, unknown>[];
  if (!ps.length) return '## Personajes\n\n(todavía no hay personajes)';
  const L = ['## Personajes'];
  for (const p of ps) L.push(`- **${S(p.nombre)}** (${S(p.rol)}): ${S(p.fisicoEn || p.fisico)}${p.vestuarioEn ? ` · ropa: ${S(p.vestuarioEn)}` : ''}`);
  const lugar = c.cast?.lugar as unknown as Record<string, unknown> | undefined;
  if (lugar) L.push(`- Lugar: ${S(lugar.descripcionEn || lugar.descripcion)}`);
  return L.join('\n');
}
function secStoryboard(c: Comercial): string {
  const es = (c.storyboard || []) as unknown as Record<string, unknown>[];
  if (!es.length) return '## Storyboard\n\n(todavía no hay storyboard)';
  const L = ['## Storyboard'];
  for (const e of es) L.push(`- **Escena ${S(e.n)}** (${S(e.rol)}, ${S(e.durSec)} s, ${S(e.plano) || 'plano s/d'})${Array.isArray(e.personajes) && e.personajes.length ? ` · en cuadro: ${e.personajes.join(', ')}` : ''}${e.pantalla ? ` · pantalla de la app: «${S(e.pantalla)}»` : ''}\n  - Dice: ${S(e.dialogo) || '—'}\n  - Acción: ${S(e.accion)}${e.accionEn ? `\n  - Acción (para el generador): ${S(e.accionEn)}` : ''}`);
  return L.join('\n');
}
function secPack(c: Comercial): string {
  const pk = c.packFlow as unknown as { personajes?: Record<string, unknown>[]; escenas?: Record<string, unknown>[] } | undefined;
  if (!pk?.escenas?.length) return '## Pedidos a Google Flow\n\n(todavía no están armados)';
  const L = ['## Pedidos a Google Flow (Veo 3), tal cual se mandan'];
  for (const p of pk.personajes || []) L.push(`- **Retrato de ${S(p.nombre)}:** ${S(p.promptImagen)}`);
  for (const e of pk.escenas) L.push(`- **Escena ${S(e.escenaN)}** (${S(e.rol)}):`, '', `  > ${S(e.prompt)}`, '');
  return L.join('\n');
}
function secMontaje(c: Comercial): string {
  const m = c.montaje as MontajeState | undefined;
  if (!m?.plan) return '## Montaje\n\n(todavía no está armado)';
  const p = m.plan;
  const L = ['## Montaje (el plan que se renderiza)'];
  for (const s of p.scenes) L.push(`- Escena ${s.escenaN} (${S(s.rol)}): ${(s.out - s.in).toFixed(1)} s · transición ${S(s.transition) || 'corte'}${s.effect ? ` · efecto ${S(s.effect)}` : ''}${s.punchFrom != null && s.punchTo != null && (s.punchFrom !== 1 || s.punchTo !== 1) ? ` · acercamiento ${s.punchFrom}→${s.punchTo}` : ''}${s.inserts?.length ? ` · ${s.inserts.length} pantalla(s) de la app encima` : ''}${s.dialogo ? ` · dice: «${S(s.dialogo)}»` : ''}`);
  if (p.music) L.push(`- Música: ${p.music.generada ? `compuesta a medida (${S(p.music.mood)})` : 'de catálogo'} · nivel ${p.music.gain}${p.music.duck ? ' · baja cuando hablan' : ''}`);
  if (p.sfx?.length) L.push(`- Efectos de sonido: ${p.sfx.map((x) => `${S(x.nombre) || 'efecto'} a los ${x.at} s`).join(' · ')}`);
  if (p.endCard) L.push(`- Cierre: ${S(p.endCard.tipo) || 'placa'} · «${S(p.endCard.linea1)}»${p.voice ? ' · con voz de locutor' : ''}`);
  const dir = (m as unknown as { direccion?: { diagnostico?: string; aplicadas?: unknown[] } }).direccion;
  if (dir?.diagnostico) L.push(`- Director de montaje IA: ${S(dir.diagnostico)}`);
  if (p.avisos?.length) L.push(`- Lo que decidió el armado: ${p.avisos.map(S).join(' · ')}`);
  return L.join('\n');
}

const PREGUNTA: Record<PasoChatGPT, string> = {
  concepto: 'Mirá las propuestas de concepto. ¿Cada una es una idea publicitaria (no una descripción del producto) y responde al objetivo, al tipo de historia y al clima elegidos? ¿Cuál elegirías y por qué? ¿Qué le cambiarías a la elegida para que el gancho funcione en el primer segundo?',
  guion: 'Mirá el guion. ¿Desarrolla bien el concepto? ¿El gancho funciona en el primer segundo? ¿Los diálogos suenan a gente real (rioplatense) y caben en su duración? ¿El cierre de marca es claro? Señalá cada frase que sobre o que no se entienda, con una alternativa.',
  cast: 'Mirá los personajes. ¿Son los que la historia necesita y nada más? ¿Encajan con la audiencia de la marca? ¿Las descripciones sirven para que un generador de video (Veo 3) los haga creíbles y siempre iguales?',
  storyboard: 'Mirá el storyboard. ¿Cada escena es filmable, con una acción concreta y un plano que sirve? ¿Es coherente con el guion (nada que el guion no diga, nada que el guion diga y falte)? ¿El ritmo da para un reel vertical? Señalá las escenas a corregir y cómo.',
  pack: 'Mirá los pedidos a Google Flow (Veo 3). ¿Son buenos prompts? ¿Describen persona, acción, lugar, cámara y luz sin contradicciones? ¿Piden algo que Veo hace mal (texto en pantalla, interfaces legibles, demasiadas acciones en 8 s)? ¿Mantienen a los personajes coherentes entre escenas? Reescribí los que estén mal.',
  montaje: 'Mirá el montaje. ¿El orden, el ritmo, las transiciones, la música y el cierre sirven para esta pieza y este clima? ¿Las pantallas de la app tapan a la persona cuando habla? Proponé pocos cambios concretos (escena por escena) que más mejoren el resultado.',
};
const MATERIAL: Record<PasoChatGPT, (c: Comercial) => string[]> = {
  concepto: (c) => [secConcepto(c)],
  guion: (c) => [secConcepto(c), secGuion(c)],
  cast: (c) => [secGuion(c), secCast(c)],
  storyboard: (c) => [secGuion(c), secCast(c), secStoryboard(c)],
  pack: (c) => [secStoryboard(c), secPack(c)],
  montaje: (c) => [secGuion(c), secStoryboard(c), secMontaje(c)],
};
const NOMBRE: Record<PasoChatGPT, string> = { concepto: 'Concepto', guion: 'Guion', cast: 'Personajes', storyboard: 'Storyboard', pack: 'Pedidos a Flow', montaje: 'Montaje' };

// el pedido de UNA pantalla: contexto, lo que salió ahí (y lo anterior que hace falta para entenderlo) y su pregunta
export function pedidoPaso(project: Project, c: Comercial, paso: PasoChatGPT): string {
  return [`# Analizá el paso «${NOMBRE[paso]}» de un comercial de Media Studio`, '', '> Para ChatGPT. Pegar o subir tal cual.', '', contexto(project, c), '', '## Qué te pedimos', '', PREGUNTA[paso], '', 'Respondé en markdown: primero lo que está bien y no hay que tocar, después los problemas (del más grave al menos grave) con cómo arreglarlos.', '', ...MATERIAL[paso](c).flatMap((x) => [x, ''])].join('\n');
}

// el pedido de la PIEZA COMPLETA: todos los pasos y la evaluación de punta a punta
export function pedidoCompleto(project: Project, c: Comercial): string {
  return [
    `# Analizá un comercial completo de Media Studio: «${S(c.titulo)}»`, '', '> Para ChatGPT. Pegar o subir tal cual.', '', contexto(project, c), '',
    '## Qué te pedimos', '',
    'Evaluá la pieza de punta a punta como un director creativo y un montajista publicitario exigentes. Para cada paso (concepto, guion, personajes, storyboard, pedidos a Flow, montaje): un puntaje de 1 a 10 y los problemas más graves con cómo arreglarlos. Al final: ¿la pieza responde al objetivo, al tipo de historia y al clima elegidos?, los 3 cambios que más la mejorarían, y en qué paso de la cadena nace cada problema (eso apunta al motor, no a esta pieza).',
    '',
    secConcepto(c), '', secGuion(c), '', secCast(c), '', secStoryboard(c), '', secPack(c), '', secMontaje(c), '',
  ].join('\n');
}
