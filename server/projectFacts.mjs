// ProjectFacts — los HECHOS del negocio, estructurados (reingeniería 2026-10-07, P0.1 / Fase 2).
// Antes cada molde recibía `project.brief.slice(0, 2500)`: el brief de Munify tiene 8.068
// caracteres y los moldes decidían con un tercio de los hechos (los del final —tesorería,
// sueldos, objeciones— no llegaban nunca). Acá el brief NO se corta: se convierte en una ficha
// con secciones y cada molde pide las secciones que necesita (`factsText`).
//
// Fuente, en este orden: (1) el KB 1.2 si el proyecto lo guardó (`project.kb`); (2) el brief
// markdown que genera kbToBrief (src/lib/knowledgeBase.ts), que tiene encabezados FIJOS y se
// parsea de vuelta; (3) un brief libre: todo va a `description`. `rawBrief` se conserva para
// consulta excepcional y nunca se manda entero a un prompt.
// Lo importan el back (server/functions.mjs) y el front (tipos en projectFacts.d.mts).

const S = (v) => String(v ?? '').trim();
const arr = (v) => (Array.isArray(v) ? v.map(S).filter(Boolean) : []);

export function factsFromKb(kb) {
  const b = kb?.business || {};
  return {
    name: S(b.name) || 'el producto',
    tagline: S(b.tagline),
    description: S(b.description),
    valueStory: S(b.value_story),
    industry: S(b.industry),
    targetAudience: S(b.target_audience),
    keyMessages: arr(kb?.key_messages),
    offerings: (Array.isArray(kb?.offerings) ? kb.offerings : []).map((o) => ({ name: S(o?.name), description: S(o?.description), features: arr(o?.key_features) })).filter((o) => o.name || o.description),
    differentiators: arr(kb?.differentiators),
    objections: (Array.isArray(kb?.objections) ? kb.objections : []).map((o) => ({ objection: S(o?.objection), response: S(o?.response) })).filter((o) => o.objection),
    pricing: { summary: S(kb?.pricing?.summary), promotions: arr(kb?.pricing?.promotions) },
    doNotSay: arr(kb?.do_not_say),
    screens: Array.isArray(kb?.screens) ? kb.screens : [],
    source: 'kb',
  };
}

// Parsea el markdown de kbToBrief (encabezados fijos). Lo que no reconoce queda en description.
const H = {
  negocio: /^## El negocio/i,
  propuesta: /^### La propuesta completa/i,
  mensajes: /^## Mensajes clave/i,
  ofrece: /^## Qué ofrece/i,
  diferenciadores: /^## Por qué \(diferenciadores\)/i,
  objeciones: /^## Dolores y objeciones/i,
  oferta: /^## Oferta \/ CTA/i,
  evitar: /^## A evitar/i,
};
export function factsFromBrief(brief, name = '') {
  const f = {
    name: S(name) || 'el producto', tagline: '', description: '', valueStory: '', industry: '', targetAudience: '',
    keyMessages: [], offerings: [], differentiators: [], objections: [], pricing: { summary: '', promotions: [] }, doNotSay: [], screens: [],
    source: 'brief',
  };
  const text = S(brief);
  if (!text) return f;
  let sec = 'description';
  const libre = [];
  let reconocido = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (!t) continue;
    const m = /^# (.+?) — brief/.exec(t);
    if (m) { if (!S(name)) f.name = S(m[1]); reconocido = true; continue; }
    if (t.startsWith('> ') && !f.tagline && !reconocido) { f.tagline = t.slice(2).trim(); continue; }
    if (t.startsWith('> ') && !f.tagline && sec === 'description' && !f.description) { f.tagline = t.slice(2).trim(); continue; }
    const hit = Object.entries(H).find(([, re]) => re.test(t));
    if (hit) { sec = hit[0]; reconocido = true; continue; }
    if (t.startsWith('## ') || t.startsWith('### ')) { sec = 'otro'; continue; }
    // kbToBrief escribe "- Rubro:" y "- Público:" DESPUÉS de la propuesta completa, así que pueden
    // caer en cualquiera de las dos secciones del negocio.
    if ((sec === 'negocio' || sec === 'propuesta') && t.startsWith('- Rubro:')) { f.industry = t.slice(8).trim(); continue; }
    if ((sec === 'negocio' || sec === 'propuesta') && t.startsWith('- Público:')) { f.targetAudience = t.slice(10).trim(); continue; }
    switch (sec) {
      case 'negocio': f.description = f.description ? `${f.description} ${t}` : t; break;
      case 'propuesta': f.valueStory = f.valueStory ? `${f.valueStory} ${t}` : t; break;
      case 'mensajes': if (t.startsWith('- ')) f.keyMessages.push(t.slice(2).trim()); break;
      case 'ofrece': {
        if (/^- \*\*/.test(t)) {
          const mm = /^- \*\*(.+?)\*\*:?\s*(.*)$/.exec(t);
          f.offerings.push({ name: S(mm?.[1]), description: S(mm?.[2]), features: [] });
        } else if (t.startsWith('- ') && f.offerings.length) {
          f.offerings[f.offerings.length - 1].features.push(t.slice(2).trim());
        } else if (t.startsWith('- ')) {
          f.offerings.push({ name: '', description: t.slice(2).trim(), features: [] });
        }
        break;
      }
      case 'diferenciadores': if (t.startsWith('- ')) f.differentiators.push(t.slice(2).trim()); break;
      case 'objeciones': {
        const mm = /^- "?(.+?)"?\s*→\s*(.*)$/.exec(t);
        if (mm) f.objections.push({ objection: S(mm[1]), response: S(mm[2]) });
        else if (t.startsWith('- ')) f.objections.push({ objection: t.slice(2).trim(), response: '' });
        break;
      }
      case 'oferta': {
        if (t.startsWith('- ')) { if (!f.pricing.summary) f.pricing.summary = t.slice(2).trim(); else f.pricing.promotions.push(t.slice(2).trim()); }
        break;
      }
      case 'evitar': if (t.startsWith('- ')) f.doNotSay.push(t.slice(2).trim()); break;
      default: libre.push(t);
    }
  }
  if (!reconocido) { f.description = text; f.source = 'brief-libre'; }
  else if (libre.length) f.description = [f.description, ...libre].filter(Boolean).join(' ');
  return f;
}

// La ficha de un proyecto: KB guardado > brief markdown > brief libre. Conserva rawBrief aparte.
export function buildProjectFacts(project = {}) {
  const f = project.kb && project.kb.business ? factsFromKb(project.kb) : factsFromBrief(project.brief, project.name);
  if (!f.name || f.name === 'el producto') f.name = S(project.name) || f.name;
  if (!f.industry && project.type) f.industry = S(project.type);
  if (!f.screens.length && Array.isArray(project.screens)) f.screens = project.screens;
  f.rawBrief = S(project.brief);
  return f;
}

// Texto de la ficha para un prompt, por SECCIONES (cada molde pide las suyas). Sin tope de
// caracteres: la ficha ya es compacta porque son hechos, no prosa. Secciones:
// negocio · mensajes · ofrece · diferenciadores · objeciones · oferta · evitar
export const SECCIONES_TODAS = ['negocio', 'mensajes', 'ofrece', 'diferenciadores', 'objeciones', 'oferta', 'evitar'];
export function factsText(f, secciones = SECCIONES_TODAS) {
  const L = [];
  const want = new Set(secciones);
  if (want.has('negocio')) {
    L.push(`NEGOCIO: ${f.name}${f.tagline ? ` — ${f.tagline}` : ''}`);
    if (f.industry) L.push(`RUBRO: ${f.industry}`);
    if (f.targetAudience) L.push(`PÚBLICO: ${f.targetAudience}`);
    if (f.description) L.push(`QUÉ ES: ${f.description}`);
    if (f.valueStory) L.push(`LA PROPUESTA COMPLETA (cada video cuenta esto, no un módulo): ${f.valueStory}`);
  }
  if (want.has('mensajes') && f.keyMessages.length) L.push(`MENSAJES CLAVE (van en cada pieza):\n${f.keyMessages.map((m) => `- ${m}`).join('\n')}`);
  if (want.has('ofrece') && f.offerings.length) {
    L.push(`QUÉ OFRECE:\n${f.offerings.map((o) => `- ${o.name ? `${o.name}: ` : ''}${o.description}${o.features.length ? ` (${o.features.join('; ')})` : ''}`).join('\n')}`);
  }
  if (want.has('diferenciadores') && f.differentiators.length) L.push(`POR QUÉ ES DISTINTO:\n${f.differentiators.map((d) => `- ${d}`).join('\n')}`);
  if (want.has('objeciones') && f.objections.length) L.push(`DOLORES Y OBJECIONES (en palabras del cliente):\n${f.objections.map((o) => `- "${o.objection}"${o.response ? ` → ${o.response}` : ''}`).join('\n')}`);
  if (want.has('oferta') && (f.pricing.summary || f.pricing.promotions.length)) L.push(`OFERTA / CTA:\n${[f.pricing.summary, ...f.pricing.promotions].filter(Boolean).map((p) => `- ${p}`).join('\n')}`);
  if (want.has('evitar') && f.doNotSay.length) L.push(`NO DECIR:\n${f.doNotSay.map((d) => `- ${d}`).join('\n')}`);
  return L.join('\n');
}
