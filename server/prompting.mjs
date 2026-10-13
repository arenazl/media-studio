// Prompt Engine V2 — la parte mecánica (reingeniería 2026-10-07, Fase 3 / doc §03).
// Acá viven: (1) las VERSIONES de cada prompt (Regla 2: nunca cambiar un prompt productivo sin
// subir la versión; viaja en cada resultado y en el log); (2) el presupuesto de palabras por
// duración (Regla 5: "la duración gobierna el texto", en números y no en adjetivos); (3) la
// VALIDACIÓN por molde después del parseo (P0.7: JSON válido no es resultado válido) y (4) el prompt
// de REPARACIÓN corto (Regla 7: primer reintento = mismo modelo, errores concretos, sin pedir la
// creatividad de nuevo). El texto creativo de cada prompt se cura aparte con el dueño.

import { validateConceptResponseV3 } from './media-studio-concept-v3.mjs';

export const PROMPT_VERSIONS = {
  montageDirection: 'montageDirection/1.0', // IA propone operaciones del motor, no edita el material
  strategy: 'strategy/2.1',       // 2.1: curación 02 (2026-10-11): jerarquía de la pieza, "hasta N" no es "N"
  // strategy/2.0:       // 2.0: curado 2026-10-07 (la campaña cubre la propuesta; cada pieza UNA cosa)
  concept: 'concept/3.3',         // 3.3: (2026-10-12, Lucas) barrios y características de la ficha y el kit son de ejemplo: no se replican
  // concept/3.2:         // 3.2: (2026-10-12) dice de dónde sale la idea; el kit entra como recorrido de pantallas, sin el caso de la demo
  // concept/3.1:         // 3.1: curación 02 (2026-10-11): fidelidad al ángulo; ficha curada del enfoque caso
  // concept/3.0:         // 3.0: curación externa 2026-10-10 (ENFOQUE + TRATAMIENTO elegidos por el dueño; humor sólo a pedido; spots de marca, no sketches)
  script: 'script/3.9',           // 3.9: (2026-10-12, Lucas) barrios y características de la ficha y el kit son de ejemplo
  // script/3.8:           // 3.8: (2026-10-12) dice de dónde sale la historia; el kit entra como recorrido de pantallas
  // script/3.7:           // 3.7: (2026-10-12) se van las reglas narrativas del 11/10; entra el estudio curado (calidad dramática, el concepto manda el orden, folleto no, beneficio sí)
  // script/3.6:           // 3.6: (2026-10-11) ninguna frase explica la publicidad
  // script/3.5:           // 3.5: (2026-10-11, vuelta 6) frases en presente, dichas en el momento; la placa con la marca escrita
  // script/3.4:           // 3.4: (2026-10-11, vuelta 5) el otro lado habla de ESE pedido pensando en quien pide; 3 frases hasta 26 s
  // script/3.3:           // 3.3: (2026-10-11, vuelta 4) un público; "hasta N" no es N; "vos" = a cámara; ortografía
  // script/3.2:           // 3.2: (2026-10-11, vuelta 3) el gancho empieza por el golpe
  // script/3.1:           // 3.1: (2026-10-11, vuelta 2) orden causal, gancho con el dolor, habla real, hasta 4 frases, cta en placa
  // script/3.0:           // 3.0: (2026-10-11) filmado sin locutor: cada bloque dice "quien" lo dice en cámara; hook concreto; una toma por bloque
  // script/2.1:           // 2.1: curación 02 (2026-10-11): escribir para ser escuchado; durSec de referencia
  // script/2.0:           // 2.0: curado 2026-10-07 (el concepto manda; presupuesto en lista; NO ASUMIR)
  cast: 'cast/2.5',               // 2.5: (2026-10-12, Lucas) barrios y características de la ficha y el kit son de ejemplo
  // cast/2.4:               // 2.4: (2026-10-12) dice de dónde salen las personas y el lugar
  // cast/2.3:               // 2.3: (2026-10-12) lugar compartido si el concepto lo pide; sin biografías ni decorados inventados
  // cast/2.2:               // 2.2: (2026-10-11, vuelta 4) vestuarioEn, un detalle propio, el país en los objetos
  // cast/2.1:               // 2.1: (2026-10-11) cada personaje con SU lugar (lugarEn) y el nombre con que lo nombra el guion
  // cast/2.0:               // 2.0: curado 2026-10-07 (sin ejemplos copiables; largos en números; 2º personaje sólo con función)
  storyboard: 'storyboard/3.10',  // 3.10: (2026-10-12, Lucas) barrios y características de la ficha y el kit son de ejemplo
  // storyboard/3.9:   // 3.9: (2026-10-12) dice de dónde sale cada cosa; el kit entra como recorrido de pantallas
  // storyboard/3.8:   // 3.8: (2026-10-12) se van las reglas narrativas del 11/10; entra el estudio curado (dirección narrativa y actoral); la duración es la del guion
  // storyboard/3.7:   // 3.7: (2026-10-11) el profesional haciendo su oficio, no mirando un teléfono
  // storyboard/3.6:   // 3.6: (2026-10-11, vuelta 7) física de la escena, emoción simple, la frase después de lo que la provoca
  // storyboard/3.5:   // 3.5: (2026-10-11, vuelta 6) el giro es la reacción al resultado
  // storyboard/3.4:   // 3.4: (2026-10-11, vuelta 5) cada escena muestra el momento en que pasa, no a alguien contándolo
  // storyboard/3.3:   // 3.3: (2026-10-11, vuelta 4) el gancho se ve, sin manos finas, una pantalla por frase, "vos" a cámara
  // storyboard/3.2:   // 3.2: (2026-10-11, vuelta 3) habla desde el primer segundo, a cámara como mucho 2, objeto reconocible
  // storyboard/3.1:   // 3.1: (2026-10-11, vuelta 2) una acción por escena, orden causal, cta = placa, frase + 1s
  // storyboard/3.0:   // 3.0: (2026-10-11) cada escena filmada es una situación (acción + objeto + cambio), sin locutor, planos variados, accionEn
  // storyboard/2.1:   // 2.1: curación 02 (2026-10-11): nunca se filma una pantalla; insertos con la captura del kit
  // storyboard/2.0:   // 2.0: curado 2026-10-07 (puesta en escena, no reescritura; animado por momento, [demo])
  flowpack: 'flowpack/3.2-compilado',   // 3.2 (2026-10-12): sin "pantalla poco legible" (chocaba con "la pantalla nunca a cámara") ni el chat visible del gancho
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
// 2026-10-10: el cuarto bloque deja de llamarse "gag". Es el GIRO (el momento en que se ve el beneficio); con
// tratamiento humor funciona como remate, sin humor es la prueba visible. Las piezas viejas con rol 'gag' se leen igual.
export const REPARTO_ROLES = { hook: 0.15, desarrollo: 0.45, giro: 0.2, cta: 0.2 };
export const rolCanonico = (r) => (r === 'gag' ? 'giro' : r);
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
const ROLES = ['hook', 'desarrollo', 'giro', 'cta'];
const OPCIONALES = new Set(['giro']);   // un comercial sin giro es válido: no se fuerza un remate
export const VALIDADORES = {
  montageDirection(o, body) {
    const E = [];
    if (!o || typeof o.diagnostico !== 'string') E.push('falta diagnostico');
    if (!Array.isArray(o?.decisiones) || o.decisiones.length > 7) E.push('se requieren de 0 a 7 decisiones');
    const permitidos = new Set(['pausa_musical','bajar_musica','subir_musica','corte_seco','fundido','zoom_sutil','sin_zoom']);
    const escenas = new Map((body?.context?.piece?.scenes || []).filter((s) => s.src).map((s) => [Number(s.escenaN), s]));
    const vistos = new Set(), porEscena = new Map();
    let musicales = 0;
    for (const [i, d] of (Array.isArray(o?.decisiones) ? o.decisiones : []).entries()) {
      if (!escenas.has(Number(d?.escenaN))) E.push('decisión ' + i + ': escena sin clip');
      if (!permitidos.has(d?.recurso)) E.push('decisión ' + i + ': recurso no ejecutable');
      if (typeof d?.motivo !== 'string' || !d.motivo.trim() || d.motivo.split(/\s+/).length > 18) E.push('decisión ' + i + ': motivo vacío o largo');
      if (d?.recurso === 'pausa_musical' && (Number(d.durSec) < 0.2 || Number(d.durSec) > 0.8)) E.push('decisión ' + i + ': pausa entre 0.2 y 0.8s');
      if (['pausa_musical','bajar_musica','subir_musica'].includes(d?.recurso)) {
        musicales++;
        if (!body?.context?.piece?.hayMusica) E.push('decisión ' + i + ': no hay música');
      }
      const k = d?.escenaN + ':' + d?.recurso;
      if (vistos.has(k)) E.push('decisión repetida ' + k);
      vistos.add(k);
      porEscena.set(d?.escenaN, (porEscena.get(d?.escenaN) || 0) + 1);
    }
    if (musicales > 3) E.push('demasiadas decisiones musicales (máximo 3)');
    if ([...porEscena.values()].some((n) => n > 2)) E.push('máximo 2 decisiones por escena');
    return E;
  },
  concept(o) {
    // concept/3.0: el validador vino con la curación (estructura, ids, largos por campo, mayúsculas en tipoGancho,
    // sin segundos ni planos en la idea). La veracidad y la diversidad real las mira el dueño.
    const r = validateConceptResponseV3(o);
    return r.ok ? [] : r.errors;
  },
  script(o, body) {
    const E = [];
    if (o?.item) return E;   // regen de un bloque: se valida suelto abajo
    const blocks = Array.isArray(o?.blocks) ? o.blocks : [];
    const roles = blocks.map((b) => rolCanonico(b.role));
    for (const r of ROLES) if (!OPCIONALES.has(r) && !roles.includes(r)) E.push(`falta el bloque "${r}"`);
    if (roles.indexOf('giro') > roles.indexOf('cta') && roles.includes('cta')) E.push('el giro tiene que ir antes del cta');
    const dur = Number(body?.options?.duracion) || Number(body?.context?.piece?.durationSec) || 0;
    for (const b of blocks) {
      const w = palabras(b.narration), d = Number(b.durSec) || 0;
      // en el filmado (script/3.x) un bloque puede no tener voz: la imagen y la pantalla lo cuentan. Sí hace falta voz en el hook.
      // 2026-10-12: en el filmado cualquier bloque puede ser sólo imagen, también el gancho (estudio curado: el gancho es el estímulo más interesante, no siempre una frase)
      const filmadoSinVoz = (body?.context?.piece?.tipo || 'filmado') !== 'animado';
      if (!w && !OPCIONALES.has(rolCanonico(b.role)) && !filmadoSinVoz) E.push(`el bloque "${b.role}" no tiene narración`);
      if (w && d && w / d > WPS_MAX) E.push(`el bloque "${b.role}" tiene ${w} palabras en ${d}s: como máximo ${maxNarrationWords(d)} palabras`);
    }
    const suma = blocks.reduce((a, b) => a + (Number(b.durSec) || 0), 0);
    if (dur && suma && Math.abs(suma - dur) > dur * 0.25) E.push(`los bloques suman ${suma}s y la pieza es de ${dur}s`);
    // script/3.0: en una pieza filmada no hay locutor: toda frase tiene quien la diga en cámara, y cada bloque es UNA toma
    if ((body?.context?.piece?.tipo || 'filmado') !== 'animado') {
      for (const b of blocks) {
        const w = palabras(b.narration);
        const quien = String(b.quien || '').trim().toLowerCase();
        if (w && !quien) E.push(`el bloque "${b.role}" no dice quién lo dice en cámara ("quien")`);
      }
    }
    // la marca se DICE con la fonética (TTS); el nombre escrito dentro de la narración sale mal pronunciado
    const nombre = String(body?.context?.project?.name || '').trim(), fon = String(body?.context?.project?.phonetic || '').trim();
    if (nombre && fon && fon.toLowerCase() !== nombre.toLowerCase()) {
      const re = new RegExp(`\\b${nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      // la placa del cierre es TEXTO en pantalla: ahí la marca va escrita, no con la fonética
      for (const b of blocks) if (String(b.quien || '').trim().toLowerCase() !== 'placa' && re.test(String(b.narration || ''))) E.push(`el bloque "${b.role}" dice "${nombre}" escrito; en la narración la marca va con su fonética "${fon}"`);
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
    if (tipo === 'filmado') {
      // storyboard/3.0 (2026-10-11): sin locutor. Toda frase la dice en cámara la persona de su escena; los insertos de
      // pantalla no hablan; dos escenas filmadas seguidas no repiten plano; cada escena filmada trae su acción en inglés.
      // Reemplaza las reglas del 2026-10-07 ("talking head = 8s con 18-21 palabras, máximo 2, el resto voz en off"): esa
      // voz en off nadie la grababa en el filmado/híbrido y las escenas llegaban mudas y sin la persona a Flow.
      for (const e of es) {
        const w = palabras(e.dialogo);
        const filmada = !String(e.pantalla || '').trim();
        if (w && !(e.personajes || []).length) E.push(`escena ${e.n}: tiene frase pero nadie en cuadro que la diga; poné en "personajes" a quien la dice`);
        if (!filmada && w) E.push(`escena ${e.n}: un inserto de pantalla no tiene frase`);
        if (filmada && (e.personajes || []).length && !String(e.accionEn || '').trim()) E.push(`escena ${e.n}: falta "accionEn" (la acción en inglés para el generador)`);
      }
      const tope = Math.round(dur * 1.25);
      if (dur && suma && suma > tope) E.push(`las escenas suman ${suma}s para una pieza de ${dur}s: como máximo ${tope}s`);
    }
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
    for (const p of o?.personajes || []) if (!String(p.lugarEn || '').trim()) E.push(`personaje ${p.id || p.nombre}: falta lugarEn (dónde lo vemos)`);
    for (const p of o?.personajes || []) if (!String(p.vestuarioEn || '').trim()) E.push(`personaje ${p.id || p.nombre}: falta vestuarioEn (la ropa en inglés)`);
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
