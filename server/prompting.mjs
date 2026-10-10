// Prompt Engine V2 — la parte mecánica (reingeniería 2026-10-07, Fase 3 / doc §03).
// Acá viven: (1) las VERSIONES de cada prompt (Regla 2: nunca cambiar un prompt productivo sin
// subir la versión; viaja en cada resultado y en el log); (2) el presupuesto de palabras por
// duración (Regla 5: "la duración gobierna el texto", en números y no en adjetivos); (3) la
// VALIDACIÓN por molde después del parseo (P0.7: JSON válido no es resultado válido) y (4) el prompt
// de REPARACIÓN corto (Regla 7: primer reintento = mismo modelo, errores concretos, sin pedir la
// creatividad de nuevo). El texto creativo de cada prompt se cura aparte con el dueño.

export const PROMPT_VERSIONS = {
  strategy: 'strategy/2.0',       // 2.0: curado 2026-10-07 (la campaña cubre la propuesta; cada pieza UNA cosa)
  concept: 'concept/3.0',         // 3.0: enfoque y tratamiento publicitario; humor opcional
  script: 'script/3.0',           // 3.0: gag = giro/prueba; respeta enfoque sin humor obligatorio
  cast: 'cast/2.0',               // 2.0: curado 2026-10-07 (sin ejemplos copiables; largos en números; 2º personaje sólo con función)
  storyboard: 'storyboard/3.0',   // 3.0: giro en vez de remate cómico forzado
  flowpack: 'flowpack/2.0-compilado',
  publish: 'publish/1.1',         // 1.1: lee el guion canónico
  qa: 'qa/1.1',                   // 1.1: lint técnico + juicio creativo
  videoprompt: 'videoprompt/1.0',
  briefToKb: 'briefToKb/1.0',
  mockupsTexto: 'mockupsTexto/1.0', // 1.0: el dueño describe el reel con sus palabras → escenas de mockups sobre el kit (2026-10-09)
};

// ── Presupuesto de palabras ────────────────────────────────────────────────────────────────
export const WPS = 2.7;                       // palabras por segundo que un TTS dice cómodo
export const WPS_MAX = 3.2;                   // más que esto no se puede decir
export const maxNarrationWords = (durationSec, wps = WPS) => Math.max(3, Math.floor((Number(durationSec) || 0) * wps));

// Reparto por rol para un guion de `durationSec`: hook corto, desarrollo largo, gag y cta cortos.
export const REPARTO_ROLES = { hook: 0.15, desarrollo: 0.45, gag: 0.2, cta: 0.2 };
export function presupuestoGuion(durationSec, wps = WPS) {
  const d = Number(durationSec) || 20;
  const out = {};
  for (const [rol, frac] of Object.entries(REPARTO_ROLES)) {
    const seg = Math.max(2, Math.round(d * frac));
    out[rol] = { seg, palabras: maxNarrationWords(seg, wps) };
  }
  // el total es la SUMA de los topes por rol (el dueño marcó que 8+24+10+10 = 52, no el 54 de 20×2,7)
  return { total: d, totalPalabras: Object.values(out).reduce((a, v) => a + v.palabras, 0), roles: out };
}
// Texto para el prompt: "hook: 3s, hasta 8 palabras · desarrollo: 9s, hasta 24 palabras · …"
// Versión en lista (prompt curado 2026-10-07): "- hook: 3s, máximo 8 palabras" por rol + total.
export function presupuestoLista(durationSec) {
  const p = presupuestoGuion(durationSec);
  return `${Object.entries(p.roles).map(([r, v]) => `- ${r}: ${v.seg}s, máximo ${v.palabras} palabras`).join('\n')}\nTotal: ${p.total}s, máximo ${p.totalPalabras} palabras. Referencia de ritmo: hasta 2,7 palabras por segundo.`;
}
export function presupuestoTexto(durationSec) {
  const p = presupuestoGuion(durationSec);
  return `${Object.entries(p.roles).map(([r, v]) => `${r}: ${v.seg}s, hasta ${v.palabras} palabras`).join(' · ')}. Total: ${p.total}s y hasta ${p.totalPalabras} palabras habladas.`;
}

const palabras = (t) => String(t ?? '').trim().split(/\s+/).filter(Boolean).length;
export const contarPalabras = palabras;

// Definición ÚNICA de talking head (revisión post-push 2026-10-07): hay diálogo Y hay personajes en
// cámara. Un b-roll con voz en off tiene diálogo pero personajes []. La usan el parser del storyboard,
// el normalizador de duraciones, el validador y el lint: antes cada capa tenía la suya.
export const esTalkingHead = (e) => !!(String(e?.dialogo || '').trim() && Array.isArray(e?.personajes) && e.personajes.length > 0);
// ── Validación por molde (después del parseo). Devuelve [] si está bien. ─────────────────
const ROLES = ['hook', 'desarrollo', 'gag', 'cta'];
export const VALIDADORES = {
  concept(o) {
    const E = [];
    const cs = Array.isArray(o?.conceptos) ? o.conceptos : [];
    if (cs.length !== 3) E.push(`tienen que ser 3 conceptos (vinieron ${cs.length})`);
    const titulos = cs.map((c) => String(c.topico || '').trim().toLowerCase());
    if (new Set(titulos).size !== titulos.length) E.push('los conceptos tienen títulos repetidos; deben proponer premisas distintas');
    cs.forEach((c, i) => {
      const w = palabras(c.idea);
      if (w < 40 || w > 60) E.push(`concepto ${i + 1}: la idea tiene ${w} palabras (va de 40 a 60)`);
      if (!String(c.topico || '').trim()) E.push(`concepto ${i + 1}: falta el tópico`);
      if (/\b\d+\s?s\b|\bsegundos?\b|\bplano\b/i.test(String(c.idea))) E.push(`concepto ${i + 1}: la idea trae tiempos o planos (eso es del storyboard)`);
    });
    return E;
  },
  script(o, body) {
    const E = [];
    if (o?.item) return E;   // regen de un bloque: se valida suelto abajo
    const blocks = Array.isArray(o?.blocks) ? o.blocks : [];
    const roles = blocks.map((b) => b.role);
    for (const r of ROLES) if (!roles.includes(r)) E.push(`falta el bloque "${r}"`);
    if (roles.indexOf('gag') > roles.indexOf('cta') && roles.includes('cta')) E.push('el gag tiene que ir antes del cta');
    const dur = Number(body?.options?.duracion) || Number(body?.context?.piece?.durationSec) || 0;
    for (const b of blocks) {
      const w = palabras(b.narration), d = Number(b.durSec) || 0;
      if (!w && b.role !== 'gag') E.push(`el bloque "${b.role}" no tiene narración`);
      if (w && d && w / d > WPS_MAX) E.push(`el bloque "${b.role}" tiene ${w} palabras en ${d}s: como máximo ${maxNarrationWords(d)} palabras`);
    }
    const suma = blocks.reduce((a, b) => a + (Number(b.durSec) || 0), 0);
    if (dur && suma && Math.abs(suma - dur) > dur * 0.25) E.push(`los bloques suman ${suma}s y la pieza es de ${dur}s`);
    // la marca se DICE con la fonética (TTS); el nombre escrito dentro de la narración sale mal pronunciado
    const nombre = String(body?.context?.project?.name || '').trim(), fon = String(body?.context?.project?.phonetic || '').trim();
    if (nombre && fon && fon.toLowerCase() !== nombre.toLowerCase()) {
      const re = new RegExp(`\\b${nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      for (const b of blocks) if (re.test(String(b.narration || ''))) E.push(`el bloque "${b.role}" dice "${nombre}" escrito; en la narración la marca va con su fonética "${fon}"`);
    }
    return E;
  },
  storyboard(o, body) {
    const E = [];
    const es = Array.isArray(o?.escenas) ? o.escenas : [];
    const piece = body?.context?.piece || {};
    const tipo = piece.tipo || 'filmado';
    const ids = new Set((piece.cast?.personajes || []).map((p) => p.id));
    const dur = Number(piece.durationSec) || 0;
    es.forEach((e) => {
      if (!ROLES.includes(e.rol)) E.push(`escena ${e.n}: rol "${e.rol}" inválido`);
      for (const pid of e.personajes || []) if (ids.size && !ids.has(pid)) E.push(`escena ${e.n}: el personaje "${pid}" no está en el cast`);
      const d = Number(e.durSec) || 0, w = palabras(e.dialogo);
      if (tipo === 'filmado' && w && d && w / d > WPS_MAX) E.push(`escena ${e.n}: ${w} palabras en ${d}s, como máximo ${maxNarrationWords(d)}`);
    });
    const suma = es.reduce((a, e) => a + (Number(e.durSec) || 0), 0);
    // Dueño, 2026-10-07: la duración la decide la cantidad de talking heads (8s cada uno). Tope = lo mayor
    // entre el 125% de la pieza y 8s por talking head + 4s por b-roll (+ el 25%).
    const ths = es.filter(esTalkingHead);
    const th = ths.length;
    const maxTh = dur && dur <= 24 ? 2 : 3;
    if (tipo === 'filmado' && th > maxTh) E.push(`hay ${th} talking heads para una pieza de ${dur}s: como máximo ${maxTh}; convertí el resto en b-roll con voz en off (personajes [])`);
    for (const e of ths) {
      const d = Number(e.durSec) || 0, w = palabras(e.dialogo);
      if (tipo === 'filmado' && d >= 8 && w < Math.round((maxNarrationWords(8) - 4) * 0.7)) E.push(`escena ${e.n}: un talking head de ${d}s con ${w} palabras es aire; juntá bloques del guion hasta ${maxNarrationWords(8) - 4} a ${maxNarrationWords(8)} palabras`);
    }
    if (tipo === 'filmado') for (const e of es) {
      const w = palabras(e.dialogo), d = Number(e.durSec) || 0;
      const broll = !(e.personajes || []).length;
      if (broll && w && d > Math.max(4, Math.ceil(w / WPS) + 1)) E.push(`escena ${e.n}: b-roll con voz en off de ${w} palabras dura ${d}s; a 2,7 palabras por segundo son ${Math.max(4, Math.ceil(w / WPS))}s`);
    }
    // tope real: 125% de la pieza, o 24-30s si hay dos talking heads (regla del dueño, 2026-10-07)
    const tope = th >= 2 ? Math.max(Math.round(dur * 1.25), 30) : Math.round(dur * 1.25);
    if (dur && suma && suma > tope) E.push(`las escenas suman ${suma}s para una pieza de ${dur}s con ${th} talking head(s): como máximo ${tope}s`);
    return E;
  },
  cast(o) {
    const E = [];
    for (const p of o?.personajes || []) {
      const w = palabras(p.fisicoEn);
      if (w < 15 || w > 70) E.push(`personaje ${p.id || p.nombre}: fisicoEn tiene ${w} palabras (va de 25 a 45)`);
      if (palabras(p.fisicoEs) > 25) E.push(`personaje ${p.id || p.nombre}: fisicoEs es largo (máximo 18 palabras)`);
    }
    if (o?.lugar && palabras(o.lugar.descripcionEn) > 80) E.push('la locación es larga (máximo 50 palabras)');
    return E;
  },
  publish(o) {
    const E = [];
    if (!String(o?.caption || '').trim()) E.push('falta el caption');
    if (palabras(o?.hookOnScreen) > 8) E.push('hookOnScreen tiene más de 6 palabras');
    if (Array.isArray(o?.hashtags) && o.hashtags.some((h) => /\s/.test(String(h)))) E.push('hay hashtags con espacios');
    return E;
  },
};
export function validarResultado(functionId, result, body) {
  const v = VALIDADORES[functionId];
  if (!v) return [];
  try { return v(result, body) || []; } catch (e) { return [`validador roto: ${e.message}`]; }
}

// ── Clave de generación (Fase 6, P0.6) ───────────────────────────────────────────────────
// sha256(molde + versión del prompt + modelo + proveedor + el PROMPT entero). El prompt ya contiene
// todo el input normalizado (ficha, concepto, guion, opciones), así que dos pedidos con la misma
// clave son el mismo pedido: se comparten en vuelo y se sirven de caché cuando el front lo permite.
import { createHash } from 'node:crypto';
export function generationKey({ functionId, promptVersion, model, provider, prompt }) {
  return createHash('sha256').update([functionId || '', promptVersion || '', model || '', provider || 'claude', String(prompt || '')].join('\u0001')).digest('hex');
}

// ── Reparación (Regla 7): corto, con los errores concretos, sobre el JSON anterior ─────────
export function promptReparacion(functionId, resultadoAnterior, errores) {
  return `Tu respuesta anterior para "${functionId}" tiene estos problemas concretos:\n${errores.map((e) => `- ${e}`).join('\n')}\nCorregí SOLO eso, manteniendo todo lo demás igual (misma idea, mismo tono, mismos campos). Devolvé el JSON completo corregido, sin texto ni markdown alrededor.\nJSON ANTERIOR:\n${JSON.stringify(resultadoAnterior)}`;
}
