// Radiografía de una pieza (2026-10-10, Lucas: "una vez que llegamos al final del storyboard, que me des la radiografía
// de qué pasó: de qué se alimentó, qué agarró más, qué agarró menos, qué ignoró, qué imaginó"). Determinística: no llama
// al modelo. Para cada paso (Concepto, Guion, Personajes, Storyboard) cruza lo que ENTRÓ (el prompt, partido en capas) con
// lo que SALIÓ (lo que quedó en la pieza) y con los hechos del kit:
//   - cada frase de la salida: sale del kit, sale de un paso anterior, o la imaginó el modelo;
//   - cada hecho del kit: lo usó, le llegó y no lo usó, o nunca le llegó (eso no es culpa del modelo: es nuestro);
//   - alertas: números que no están en el kit, el producto dicho sin respaldo, pantallas en escenas filmadas, el NO DECIR.
// Las coincidencias son por raíces de palabras (como la orquestación): es un indicador para mirar, no un juez.
import { partirEnCapas, capasDe } from './orquestador.mjs';
import { buildProjectFacts } from './projectFacts.mjs';

const S = (v) => (typeof v === 'string' ? v.trim() : '');
const arr = (v) => (Array.isArray(v) ? v.filter((x) => x !== undefined && x !== null && x !== '') : []);
const norm = (s) => S(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ$%]+/g, ' ').trim();
const VACIAS = new Set(['para', 'como', 'cuando', 'desde', 'hasta', 'entre', 'sobre', 'tiene', 'esta', 'este', 'esto', 'esas', 'esos', 'todo', 'toda', 'cada', 'solo', 'sola', 'pero', 'porque', 'donde', 'tus', 'sus', 'que', 'los', 'las', 'del', 'con', 'por', 'una', 'uno', 'unos', 'unas', 'mismo', 'misma', 'otro', 'otra', 'with', 'from', 'that', 'this', 'into', 'their', 'and', 'the']);
const raices = (s) => [...new Set(norm(s).split(' ').filter((w) => w.length >= 4 && !VACIAS.has(w)).map((w) => w.slice(0, 5)))];
const cubre = (a, conjunto) => { const ra = raices(a); if (!ra.length) return 0; return ra.filter((r) => conjunto.has(r)).length / ra.length; };
const conjunto = (texto) => new Set(raices(texto));

// Campos donde inventar es el trabajo: no se juzgan contra el kit ni levantan alerta de números
const CREATIVOS = new Set(['el tono', 'la estética', 'el gancho', 'cómo se ve', 'vestuario', 'dónde pasa']);

export const PASOS = [
  { id: 'strategy', label: 'Negocio (estrategia)', decide: 'Cuántas piezas tiene la campaña y, para cada una, el ángulo, el brief creativo, el mensaje principal y los datos que lo sostienen.' },
  { id: 'concept', label: 'Concepto', decide: 'La idea del comercial: la historia, el gancho, el tono y la estética. Propone tres y vos elegís una.' },
  { id: 'script', label: 'Guion', decide: 'Qué se dice y qué se ve en cada bloque, y cuánto dura cada uno.' },
  { id: 'cast', label: 'Personajes', decide: 'Quiénes aparecen, cómo se ven, cómo se visten y dónde pasa.' },
  { id: 'storyboard', label: 'Storyboard', decide: 'Cuántas escenas, qué plano, qué acción y qué diálogo en cada una, y si el producto se filma o se muestra.' },
];

// ── los hechos del kit, con su grupo ─────────────────────────────────────────────────────────────────────────────────
export function hechosDelKit(project = {}) {
  const f = buildProjectFacts(project);
  const kb = project.kb || {};
  const L = [];
  const add = (grupo, etiqueta, texto) => { const t = S(texto); if (t) L.push({ id: `h${L.length + 1}`, grupo, etiqueta, texto: t }); };
  if (f.thesis) {
    add('tesis', 'El fuerte', f.thesis.strong); add('tesis', 'Se entiende como', f.thesis.comparison); add('tesis', 'El enemigo', f.thesis.enemy);
    add('tesis', 'El momento mágico', f.thesis.magicMoment); add('tesis', 'A quién primero', f.thesis.sellFirst);
  }
  add('negocio', 'Qué es', f.tagline || f.description);
  add('negocio', 'La propuesta', f.valueStory);
  f.keyMessages.forEach((m, i) => add('mensaje', `Mensaje ${i + 1}`, m));
  f.differentiators.forEach((d, i) => add('diferencial', `Diferencial ${i + 1}`, d));
  f.objections.forEach((o, i) => add('dolor', `Dolor ${i + 1}`, o.objection));
  for (const [aud, ds] of Object.entries(f.painsByAudience || {})) ds.forEach((d, i) => add('dolor', `Dolor del ${aud} ${i + 1}`, d));
  f.offerings.forEach((o) => add('oferta', o.name || 'Qué ofrece', `${o.name} ${o.description}`));
  if (f.pricing.summary) add('oferta', 'Precio u oferta', f.pricing.summary);
  f.pricing.promotions.forEach((pr, i) => add('oferta', `Promoción ${i + 1}`, pr));
  f.objections.filter((o) => o.response).forEach((o, i) => add('respuesta', `Respuesta a una objeción ${i + 1}`, o.response));
  arr(f.screens.length ? f.screens : project.screens).forEach((s) => add('pantalla', S(s.label) || S(s.nombre) || 'Pantalla', `${S(s.label) || S(s.nombre)} ${S(s.headline) || S(s.queDemuestra)}`));
  arr(kb.moments || project.momentos).forEach((m) => add('momento', `Remate: ${S(m.nombre)}`, m.remate));
  add('cta', 'CTA', kb.cta?.primary || project.cta?.principal || '');
  return { hechos: L, noDecir: f.doNotSay, marca: [S(project.name), S(project.brandKit?.phonetic), S(kb.brand?.phonetic)].filter(Boolean) };
}

// ── la salida de cada paso, en frases ────────────────────────────────────────────────────────────────────────────────
export function salidaDe(paso, com = {}) {
  const U = [];
  const add = (campo, texto, extra = {}) => { const t = S(texto); if (t) U.push({ campo, texto: t, ...extra }); };
  if (paso === 'strategy') {
    add('el ángulo', com.angulo); add('el brief creativo', com.creativeBrief); add('el mensaje principal', com.primaryMessage);
    arr(com.supportingFacts).forEach((f, i) => add('dato que lo sostiene', f, { n: i + 1 }));
  } else if (paso === 'concept') {
    const c = com.concepto || {};
    add('la idea', c.idea); add('el tono', c.tono); add('la estética', c.estetica); add('por qué funciona', c.porQueFunciona); add('el tema', c.topico); add('el gancho', c.tipoGancho);
  } else if (paso === 'script') {
    arr(com.guion?.blocks).forEach((b, i) => { add('dice', b.narration, { n: i + 1, rol: b.role }); add('se ve', b.visual, { n: i + 1, rol: b.role }); });
  } else if (paso === 'cast') {
    arr(com.cast?.personajes).forEach((p, i) => { add('quién es', `${S(p.nombre)}: ${S(p.rol)}`, { n: i + 1 }); add('cómo se ve', p.fisicoEs || p.fisicoEn, { n: i + 1 }); add('vestuario', p.vestuario, { n: i + 1 }); });
    if (com.cast?.lugar) add('dónde pasa', `${S(com.cast.lugar.nombre)}. ${S(com.cast.lugar.descripcionEs || com.cast.lugar.descripcionEn)}`);
  } else if (paso === 'storyboard') {
    arr(Array.isArray(com.storyboard) ? com.storyboard : com.storyboard?.escenas).forEach((e, i) => { add('acción', e.accion, { n: e.n || i + 1, rol: e.rol, dur: e.durSec }); add('diálogo', e.dialogo, { n: e.n || i + 1, rol: e.rol }); });
  }
  return U;
}

// El cuerpo con que el front pide cada molde (espejo de src/lib/orquestador.ts:piezaYOpciones), para rearmar el prompt
// de corridas viejas que no lo guardaron.
function cuerpoDe(paso, project, com) {
  const formato = project.formato;
  const mk = project.pantallasKit?.length || project.momentos?.length ? { pantallas: project.pantallasKit || [], momentos: project.momentos || [], cta: project.cta } : undefined;
  const el = { enfoque: com.enfoque, tratamiento: com.tratamiento, intensidadHumor: com.intensidadHumor, recursoHumorId: com.recursoHumorId };
  const dur = com.durationSec || 20, tipo = com.tipo || 'filmado';
  if (paso === 'strategy') return { functionId: 'strategy', context: { project: { name: project.name, phonetic: project.brandKit?.phonetic || project.name, brief: project.brief || '', screens: project.screens || [], ...(formato ? { formato } : {}) } }, options: { perfil: 'campaña' } };
  const piece = {
    concept: { angulo: com.angulo || com.titulo || '', creativeBrief: com.creativeBrief || '', messageScope: com.messageScope, primaryMessage: com.primaryMessage, durationSec: 20, tipo, ...el, cierreMarca: com.cierreMarca || '', ...(mk ? { mediaKit: mk } : {}) },
    script: { concepto: com.concepto, durationSec: dur, tipo, messageScope: com.messageScope, primaryMessage: com.primaryMessage, supportingFacts: com.supportingFacts, enfoque: el.enfoque, tratamiento: el.tratamiento, ...(mk ? { mediaKit: mk } : {}) },
    cast: { concepto: com.concepto, guion: com.guion, enfoque: el.enfoque, tratamiento: el.tratamiento },
    storyboard: { guion: com.guion, cast: com.cast, tipo, durationSec: dur, enfoque: el.enfoque, tratamiento: el.tratamiento, ...(mk ? { mediaKit: mk } : {}) },
  }[paso];
  const options = { concept: { perfil: 'campaña', ...el }, script: { tono: 'cercano' } }[paso] || {};
  return { functionId: paso, context: { project: { name: project.name, phonetic: project.brandKit?.phonetic || project.name, brief: project.brief || '', kb: project.kb, type: project.type || '', screens: project.screens || [], brand: project.brandKit, ...(formato ? { formato } : {}) }, piece: { ...piece, ...(formato ? { formato } : {}) } }, options };
}

// ── la radiografía ───────────────────────────────────────────────────────────────────────────────────────────────────
export function radiografia({ project, comercial, runs = [], piezaPlan = null }) {
  const { hechos, noDecir, marca } = hechosDelKit(project);
  const raicesMarca = new Set(marca.flatMap((m) => raices(m)));
  const sinMarca = (t) => raices(t).filter((r) => !raicesMarca.has(r)).join(' ');
  const textoKit = hechos.map((h) => h.texto).join(' ') + ' ' + S(project.brief);
  const numerosKit = new Set((textoKit.match(/\d[\d.,]*/g) || []).map((n) => n.replace(/[.,]/g, '')));
  const marcaRe = marca.length ? new RegExp(`\\b(${marca.map((m) => norm(m).replace(/[^a-z0-9ñ ]/g, '')).filter(Boolean).join('|')})\\b`) : null;
  const pantallaRe = /\b(pantalla|monitor|celular|telefono|computadora|notebook|tablet|app|aplicacion|sistema|interfaz|screen|phone|laptop)\b/;
  const tipo = comercial.tipo || 'filmado';
  let anterior = '';
  const pasos = [];
  const usoGlobal = new Map(hechos.map((h) => [h.id, { usado: [], llego: [] }]));

  for (const P of PASOS) {
    const corridas = runs.filter((r) => r.function_id === P.id);
    const ultima = corridas[corridas.length - 1] || null;
    let salida = salidaDe(P.id, comercial);
    // si la pieza todavía no guardó el resultado (el Concepto antes de elegir, por ejemplo), se lee lo que devolvió la corrida
    if (!salida.length && ultima?.result_json) {
      try {
        const r = JSON.parse(ultima.result_json);
        if (P.id === 'concept') salida = arr(r?.conceptos || r?.options || r).flatMap((o, i) => salidaDe('concept', { concepto: o }).map((u) => ({ ...u, campo: `opción ${i + 1} · ${u.campo}` })));
        else salida = salidaDe(P.id, { guion: r, cast: r, storyboard: r?.escenas || r?.scenes || r });
      } catch { /* resultado ilegible: queda vacío */ }
    }
    if (!salida.length && !ultima) continue;
    let prompt = S(ultima?.prompt_text), reconstruido = false;
    if (!prompt) { try { prompt = capasDe(cuerpoDe(P.id, project, comercial)).prompt; reconstruido = true; } catch { prompt = ''; } }
    const capas = partirEnCapas(prompt);
    const enSalida = conjunto(salida.map((u) => u.texto).join(' '));
    const enPrompt = conjunto(prompt);
    const enAnterior = conjunto(anterior);
    const conjuntosHechos = hechos.map((h) => ({ h, c: conjunto(h.texto) }));

    // cada frase: de dónde sale
    const frases = salida.map((u) => {
      const base = sinMarca(u.texto);
      let mejor = null;
      for (const { h, c } of conjuntosHechos) { const s = cubre(base, c); if (!mejor || s > mejor.s) mejor = { h, s }; }
      const sAnt = anterior ? cubre(base, enAnterior) : 0;
      const creativo = CREATIVOS.has(u.campo.replace(/^opción \d+ · /, ''));
      // en lo creativo (tono, estética, físico...) una coincidencia floja con el kit es casualidad: se exige más
      const umbralKit = creativo ? 0.6 : 0.3;
      const origen = mejor && mejor.s >= umbralKit && mejor.s >= sAnt ? 'kit' : sAnt >= 0.4 ? 'anterior' : creativo ? 'creativo' : 'imaginado';
      const alertas = [];
      const nums = creativo ? [] : (u.texto.match(/\d[\d.,]*/g) || []).map((n) => n.replace(/[.,]/g, '')).filter((n) => n.length >= 2 && !numerosKit.has(n));
      if (nums.length) alertas.push(`número que no está en el kit: ${nums.join(', ')}`);
      if (origen === 'imaginado' && marcaRe && marcaRe.test(norm(u.texto))) alertas.push('habla del producto sin un dato del kit que lo respalde');
      if (P.id === 'storyboard' && u.campo === 'acción' && tipo !== 'animado' && pantallaRe.test(norm(u.texto))) alertas.push('muestra una pantalla en una escena filmada: Flow la inventa');
      for (const nd of noDecir) { const r = raices(nd); if (r.length >= 2 && cubre(nd, conjunto(u.texto)) >= 0.6) alertas.push(`roza el NO DECIR: "${nd}"`); }
      return { ...u, origen, hecho: origen === 'kit' ? { id: mejor.h.id, etiqueta: mejor.h.etiqueta, grupo: mejor.h.grupo } : null, parecido: Math.round((origen === 'kit' ? mejor.s : sAnt) * 100), alertas };
    });

    // cada hecho del kit: lo usó / le llegó y no lo usó / no le llegó
    const hechosPaso = conjuntosHechos.map(({ h }) => {
      const llego = cubre(h.texto, enPrompt) >= 0.7;
      const usado = cubre(h.texto, enSalida) >= 0.35 || frases.some((f) => f.hecho?.id === h.id);
      if (usado) usoGlobal.get(h.id).usado.push(P.id);
      if (llego) usoGlobal.get(h.id).llego.push(P.id);
      return { id: h.id, grupo: h.grupo, etiqueta: h.etiqueta, estado: usado ? 'usado' : llego ? 'ignorado' : 'no-llego' };
    });

    // cada capa del prompt: cuánto de lo que dice aparece en la salida
    const capasOut = capas.map((c) => ({ n: c.n, titulo: c.titulo, naturaleza: c.naturaleza, origen: c.origen, palabras: c.palabras, texto: c.texto, enSalida: Math.round(cubre(c.texto, enSalida) * 100) }));
    const cuenta = (o) => frases.filter((f) => f.origen === o).length;
    const total = frases.length || 1;
    const opciones = (() => { try { const r = JSON.parse(corridas.filter((x) => x.result_json).slice(-1)[0]?.result_json || 'null'); return Array.isArray(r?.conceptos) ? r.conceptos : Array.isArray(r?.options) ? r.options : Array.isArray(r) ? r : []; } catch { return []; } })();
    let decisiones = {};
    try { decisiones = JSON.parse(ultima?.decisiones_json || '{}'); } catch { decisiones = {}; }
    pasos.push({
      id: P.id, label: P.label, decideLaIA: P.decide,
      corrida: ultima ? { version: ultima.prompt_version, modelo: ultima.model_real || ultima.model, segundos: Math.round((ultima.duration_ms || 0) / 100) / 10, costo: ultima.cost_usd || 0, cuando: ultima.finished_at, estado: ultima.status, veces: corridas.length, porHorario: !!ultima.huerfana } : null,
      editadoAMano: P.id === 'concept' && !!comercial.concepto?.editadoAMano,
      decisiones, promptReconstruido: reconstruido, palabrasPrompt: prompt.split(/\s+/).filter(Boolean).length,
      palabrasPorNaturaleza: ['estatico', 'preset', 'dinamico'].reduce((o, n) => ({ ...o, [n]: capas.filter((c) => c.naturaleza === n).reduce((s, c) => s + c.palabras, 0) }), {}),
      capas: capasOut, frases, hechos: hechosPaso,
      origen: { kit: Math.round(cuenta('kit') / total * 100), anterior: Math.round(cuenta('anterior') / total * 100), creativo: Math.round(cuenta('creativo') / total * 100), imaginado: Math.round(cuenta('imaginado') / total * 100) },
      alertas: frases.reduce((n, f) => n + f.alertas.length, 0),
      descartadas: P.id === 'concept' ? opciones.filter((o) => S(o.idea) !== S(comercial.concepto?.idea)).map((o) => ({ titulo: S(o.topico || o.titulo), idea: S(o.idea) })) : [],
    });
    anterior += ' ' + salida.map((u) => u.texto).join(' ');
  }

  // contra el plan de campaña: lo que la regla le asignó a cada momento, ¿está en el guion y el storyboard?
  let plan = null;
  if (piezaPlan) {
    const final = conjunto([...salidaDe('script', comercial), ...salidaDe('storyboard', comercial)].map((u) => u.texto).join(' '));
    plan = {
      n: piezaPlan.n, objetivo: piezaPlan.objetivo.label, audiencia: piezaPlan.audiencia.label, angulo: piezaPlan.angulo.label, tono: piezaPlan.tono.label,
      eligioIgual: { angulo: (piezaPlan.pipeline?.enfoque || '') === (comercial.enfoque || ''), tono: (piezaPlan.pipeline?.tratamiento || '') === (comercial.tratamiento || '') },
      momentos: piezaPlan.momentos.map((m) => {
        const datoEsta = m.dato ? cubre(sinMarca(m.dato), final) >= 0.35 : null;
        const pantallaEsta = m.pantalla ? cubre(m.pantalla.label, final) >= 0.5 : null;
        return { label: m.label, material: m.materialLabel, dato: m.dato, pantalla: m.pantalla?.label || '', datoEsta, pantallaEsta };
      }),
    };
  }
  const global = hechos.map((h) => { const g = usoGlobal.get(h.id); return { ...h, usadoEn: g.usado, llegoA: g.llego, estado: g.usado.length ? 'usado' : g.llego.length ? 'ignorado' : 'no-llego' }; });
  return {
    proyecto: { id: project.id, nombre: project.name }, pieza: { id: comercial.id, titulo: comercial.titulo || comercial.angulo, tipo, formatoId: comercial.formatoId || '', enfoque: comercial.enfoque || '', tratamiento: comercial.tratamiento || '' },
    pasos, hechos: global, noDecir, plan,
    resumen: {
      hechos: { total: global.length, usados: global.filter((h) => h.estado === 'usado').length, ignorados: global.filter((h) => h.estado === 'ignorado').length, noLlegaron: global.filter((h) => h.estado === 'no-llego').length },
      alertas: pasos.reduce((n, p) => n + p.alertas, 0),
      costo: Math.round(pasos.reduce((s, p) => s + (p.corrida?.costo || 0), 0) * 1000) / 1000,
    },
  };
}
