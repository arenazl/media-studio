// lintCommercial — el QA TÉCNICO sin IA (reingeniería 2026-10-07, Fase 7 / doc §4.8 A).
// Son los chequeos que una persona haría con una regla y una lista: roles y orden, duración,
// palabras por segundo, ids de cast, pantallas del kit, marca fonética, "no decir", talking heads
// cortos, pack que pega el fisicoEn, capturas faltantes. Corre en milisegundos, siempre, antes del
// juicio creativo (Sonnet). Un error técnico NUNCA lo tapa una buena nota creativa.
//
// Entrada: la pieza como la tiene el front (concepto, guion, cast, storyboard, packFlow, tipo,
// durationSec, phonetic, mediaKit/screens) + la ficha de hechos opcional (doNotSay).
// Salida: { ok, errores, avisos, issues[] } con issues en el MISMO shape que el QA creativo
// ({ severity: 'alta'|'media'|'baja', note }) más `code` para testear sin depender del texto.

import { scriptNarrations } from './scriptToText.mjs';
import { esTalkingHead } from './prompting.mjs';

export const LINT_VERSION = 'lint/1.0';
const ROLES = ['hook', 'desarrollo', 'gag', 'cta'];
const WPS_MAX = 3.2;     // palabras por segundo que un TTS dice sin atropellar (~2.7 es cómodo)
const WPS_MIN = 1.2;     // menos que esto es un bloque con aire de más
const TALKING_HEAD_MIN = 8;

const S = (v) => String(v ?? '').trim();
const palabras = (t) => S(t).split(/\s+/).filter(Boolean).length;
const norm = (t) => S(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function lintCommercial(piece = {}, { facts } = {}) {
  const issues = [];
  const add = (severity, code, note) => issues.push({ severity, code, note });
  const tipo = piece.tipo || 'filmado';
  const dur = Number(piece.durationSec) || 0;
  const blocks = Array.isArray(piece.guion?.blocks) ? piece.guion.blocks : [];
  const escenas = Array.isArray(piece.storyboard) ? piece.storyboard : [];
  const cast = piece.cast || null;
  const pack = piece.packFlow || null;
  const phonetic = S(piece.phonetic);
  const nombre = S(piece.name);

  // ── GUION ──
  if (blocks.length) {
    const roles = blocks.map((b) => S(b.role));
    for (const r of ROLES) if (!roles.includes(r)) add('alta', 'guion.rol-faltante', `Al guion le falta el bloque "${r}".`);
    const iGag = roles.indexOf('gag'), iCta = roles.indexOf('cta');
    if (iGag >= 0 && iCta >= 0 && iGag > iCta) add('alta', 'guion.gag-despues-del-cta', 'El remate (gag) tiene que ir ANTES del llamado a la acción.');
    if (roles[0] && roles[0] !== 'hook') add('media', 'guion.no-arranca-con-hook', `El guion arranca con "${roles[0]}" en vez del hook.`);
    const suma = blocks.reduce((a, b) => a + (Number(b.durSec) || 0), 0);
    if (dur && suma && Math.abs(suma - dur) > dur * 0.25) add('media', 'guion.duracion', `Los bloques suman ${suma}s y la pieza es de ${dur}s (más del 25% de diferencia).`);
    for (const b of blocks) {
      const w = palabras(b.narration), d = Number(b.durSec) || 0;
      if (!w && b.role !== 'gag') add('media', 'guion.bloque-vacio', `El bloque "${b.role}" no tiene narración.`);
      if (w && d && w / d > WPS_MAX) add('alta', 'guion.muy-rapido', `El bloque "${b.role}" tiene ${w} palabras en ${d}s (${(w / d).toFixed(1)} por segundo): no se puede decir.`);
      if (w && d >= 4 && w / d < WPS_MIN) add('baja', 'guion.muy-lento', `El bloque "${b.role}" tiene ${w} palabras en ${d}s: queda mucho aire.`);
    }
    const cta = blocks.find((b) => b.role === 'cta');
    if (cta && nombre && phonetic && norm(phonetic) !== norm(nombre) && norm(cta.narration).includes(norm(nombre)) && !norm(cta.narration).includes(norm(phonetic))) {
      add('media', 'guion.marca-sin-fonetica', `El CTA dice "${nombre}" escrito; para la voz va la marca fonética "${phonetic}".`);
    }
    const doNotSay = Array.isArray(facts?.doNotSay) ? facts.doNotSay : [];
    const todo = norm(scriptNarrations(piece.guion).join(' '));
    for (const frase of doNotSay) {
      // sólo frases cortas y literales (una palabra o dos): las reglas largas son criterios, no strings
      const f = norm(frase);
      if (f && f.split(' ').length <= 3 && todo.includes(f)) add('alta', 'guion.no-decir', `El guion dice "${frase}", que el negocio pidió no decir.`);
    }
  }

  // ── STORYBOARD ──
  if (escenas.length) {
    const ids = new Set((cast?.personajes || []).map((p) => p.id));
    const sumaE = escenas.reduce((a, e) => a + (Number(e.durSec) || 0), 0);
    const ths = escenas.filter(esTalkingHead);
    const th = ths.length;
    const topeE = th >= 2 ? Math.max(Math.round(dur * 1.35), 30) : Math.round(dur * 1.35);
    if (dur && sumaE && (sumaE > topeE || sumaE < dur * 0.65)) add('media', 'storyboard.duracion', `Las escenas suman ${sumaE}s y la pieza es de ${dur}s (${th} talking head(s) de 8s: tope ${topeE}s).`);
    if (tipo === 'filmado' && dur && th > (dur <= 24 ? 2 : 3)) add('alta', 'storyboard.demasiados-talking-heads', `${th} talking heads para ${dur}s: como máximo ${dur <= 24 ? 2 : 3}; el resto va como b-roll con voz en off.`);
    for (const e of ths) if (tipo === 'filmado' && (Number(e.durSec) || 0) >= 8 && palabras(e.dialogo) < 12) add('media', 'storyboard.talking-head-vacio', `La escena ${e.n} es un talking head de ${e.durSec}s con ${palabras(e.dialogo)} palabras: queda aire.`);
    for (const e of escenas) { const w = palabras(e.dialogo), d = Number(e.durSec) || 0; if (tipo === 'filmado' && w && !(e.personajes || []).length && d > Math.max(4, Math.ceil(w / 2.7) + 1)) add('media', 'storyboard.broll-largo', `La escena ${e.n} es b-roll con ${w} palabras de voz en off y dura ${d}s: le sobran ${d - Math.max(4, Math.ceil(w / 2.7))}s.`); }
    const rolesE = escenas.map((e) => S(e.rol));
    const iGag = rolesE.lastIndexOf('gag'), iCta = rolesE.indexOf('cta');
    if (iGag >= 0 && iCta >= 0 && iGag > iCta) add('alta', 'storyboard.gag-despues-del-cta', 'En el storyboard el remate va después del CTA.');
    const pantallas = new Set([
      ...(Array.isArray(piece.mediaKit?.pantallas) ? piece.mediaKit.pantallas.map((p) => norm(p.nombre)) : []),
      ...(Array.isArray(piece.screens) ? piece.screens.map((s) => norm(typeof s === 'string' ? s : s.label)) : []),
    ].filter(Boolean));
    for (const e of escenas) {
      if (!ROLES.includes(S(e.rol))) add('alta', 'storyboard.rol-invalido', `La escena ${e.n} tiene el rol "${e.rol}".`);
      for (const pid of e.personajes || []) if (cast && !ids.has(pid)) add('alta', 'storyboard.personaje-inexistente', `La escena ${e.n} usa el personaje "${pid}" que no está en el cast.`);
      const d = Number(e.durSec) || 0;
      if (tipo === 'filmado' && S(e.dialogo) && (e.personajes || []).length && d && d < TALKING_HEAD_MIN) add('alta', 'storyboard.talking-head-corto', `La escena ${e.n} es un talking head de ${d}s: Flow necesita ${TALKING_HEAD_MIN}s mínimo.`);
      if (tipo === 'filmado' && S(e.dialogo) && palabras(e.dialogo) / (d || 1) > WPS_MAX) add('media', 'storyboard.dialogo-largo', `La escena ${e.n} tiene ${palabras(e.dialogo)} palabras en ${d}s.`);
      if (tipo === 'animado') {
        const sc = norm(e.screen);
        if (pantallas.size && sc && !/\[demo\]/.test(S(e.screen)) && !pantallas.has(sc) && ![...pantallas].some((p) => p.includes(sc) || sc.includes(p))) {
          add('media', 'storyboard.pantalla-inexistente', `La escena ${e.n} pide la pantalla "${e.screen}" y no está en el kit.`);
        }
        if (pantallas.size && !S(e.archivoCaptura)) add('media', 'storyboard.sin-captura', `La escena ${e.n} no tiene captura asignada.`);
      }
      if (nombre && phonetic && norm(phonetic) !== norm(nombre) && norm(e.dialogo).includes(norm(nombre)) && !norm(e.dialogo).includes(norm(phonetic))) {
        add('baja', 'storyboard.marca-sin-fonetica', `La escena ${e.n} dice "${nombre}" escrito en el diálogo; para la voz va "${phonetic}".`);
      }
    }
  }

  // Diálogo repetido entre escenas (misma frase en dos escenas = la pieza se estira y la voz se repite)
  if (escenas.length > 1) {
    const vistos = new Map();
    for (const e of escenas) {
      const t = norm(e.dialogo);
      if (t && t.split(' ').length >= 4) {
        if (vistos.has(t)) add('media', 'storyboard.dialogo-repetido', `La escena ${e.n} repite el diálogo de la escena ${vistos.get(t)}.`);
        else vistos.set(t, e.n);
      }
    }
  }
  // Diálogo inventado: en filmado el texto hablado tiene que salir del guion (regla del storyboard 2.0).
  if (escenas.length && blocks.length && tipo === 'filmado') {
    const guionWords = new Set(norm(scriptNarrations(piece.guion).join(' ')).split(/[^a-z0-9ñ]+/).filter((x) => x.length > 3));
    for (const e of escenas) {
      const ws = norm(e.dialogo).split(/[^a-z0-9ñ]+/).filter((x) => x.length > 3);
      if (ws.length >= 6) {
        const fuera = ws.filter((x) => !guionWords.has(x)).length;
        if (fuera / ws.length > 0.5) add('media', 'storyboard.dialogo-inventado', `La escena ${e.n} dice cosas que no están en el guion (${fuera} de ${ws.length} palabras nuevas).`);
      }
    }
  }

  // ── PACK FLOW ──
  if (pack && Array.isArray(pack.escenas)) {
    const largos = (cast?.personajes || []).map((p) => S(p.fisicoEn)).filter((t) => palabras(t) >= 12);
    for (const e of pack.escenas) {
      for (const f of largos) if (S(e.prompt).includes(f)) add('alta', 'pack.fisico-largo', `La escena ${e.escenaN} del pack pega la descripción física entera de un personaje: Flow devuelve imagen fija.`);
      if (!/Argentine/.test(S(e.prompt)) && (escenas.find((s) => Number(s.n) === Number(e.escenaN))?.personajes || []).length) add('media', 'pack.sin-argentine', `La escena ${e.escenaN} del pack no nombra "Argentine": la voz puede salir en inglés.`);
    }
    if (Array.isArray(pack.huecos) && pack.huecos.length) add('baja', 'pack.accion-sin-traducir', `Escenas con la acción sin traducir: ${pack.huecos.join(', ')}.`);
    const n = escenas.length;
    if (n && pack.escenas.length !== n) add('alta', 'pack.escenas-desparejas', `El pack tiene ${pack.escenas.length} escenas y el storyboard ${n}.`);
  }

  const errores = issues.filter((i) => i.severity === 'alta').length;
  return { version: LINT_VERSION, ok: errores === 0, errores, avisos: issues.length - errores, issues };
}
