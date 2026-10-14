// Puente Flow (lado servidor): la orquestación de la rutina Media Studio → Flow cuando la ejecuta la EXTENSIÓN de
// Chrome del dueño (extension-flow/). El servidor decide el orden; la pestaña de Flow ejecuta cada paso chico y
// devuelve el resultado. La descarga la hace Chrome a la carpeta de Descargas del dueño; el background de la
// extensión avisa la ruta final y acá se importa al Rodaje.
import fs from 'node:fs';
import path from 'node:path';
import { abrirFlow } from './abrirFlow.mjs';
import { presetActual, ajustesFlow } from './calidadFlow.mjs';

const jobs = new Map();
const cola = [];                 // pasos pendientes para la pestaña
const esperando = new Map();     // pasoId → { resolve, reject }
let ultimoLatido = 0;
const ARRANQUE = Date.now();     // para no abrir Chrome apenas arranca el backend: la extensión tarda unos segundos en avisar
let ultimoConPestana = 0;        // la última vez que la extensión vio una pestaña de Flow
let pestanasFlow = 1;            // cuántas pestañas de Flow ve la extensión (la v3 lo manda en cada consulta)
let versionExtension = null;     // versión de la extensión que está consultando (para saber si el dueño ya recargó)
let seq = 0;

export function latido() { ultimoLatido = Date.now(); }
export function extensionViva() { return Date.now() - ultimoLatido < 20000; }
export function verJob(id) { const j = jobs.get(id); return j ? resumen(j) : null; }
export function listarJobs() { return [...jobs.values()].map(resumen); }
function resumen(j) { return { id: j.id, estado: j.estado, paso: j.paso, log: j.log.slice(-80), escenas: j.escenas, fallas: j.fallas || [], error: j.error, flowProjectUrl: j.flowProjectUrl, inicio: j.inicio, fin: j.fin, extension: extensionViva(), pestanas: pestanasFlow }; }

// la pestaña pide el próximo paso
// ¿hace falta abrir Flow? Sólo si pasó la gracia del arranque (45 s) y, con la extensión viva, lleva 30 s sin ver una
// pestaña; o si la extensión no avisa hace más de 60 s (Chrome cerrado). Antes se abría en cada reinicio (2026-10-13)
export function faltaFlow() {
  const t = Date.now();
  if (t - ARRANQUE < 45000) return false;
  if (extensionViva()) return pestanasFlow === 0 && t - ultimoConPestana > 30000;
  return t - ultimoLatido > 60000;
}
export function estadoPuente() { return { extension: extensionViva(), pestanas: pestanasFlow, version: versionExtension }; }
export function proximoComando({ pestanas, origen, version } = {}) {
  if (origen !== 'background') return null;   // un content script viejo (v2) que quedó huérfano en la pestaña no recibe pasos
  latido();
  if (version) versionExtension = String(version);
  if (Number.isFinite(pestanas)) pestanasFlow = pestanas;
  if (pestanasFlow > 0) ultimoConPestana = Date.now();
  if (pestanasFlow === 0) return null;   // la extensión está, pero no hay pestaña de Flow donde ejecutar: el paso espera
  const paso = cola.shift();
  return paso || null;
}
// la pestaña devuelve el resultado
export function resultado({ pasoId, ok, data, error }) {
  const w = esperando.get(pasoId);
  if (!w) return false;
  esperando.delete(pasoId);
  ok ? w.resolve(data) : w.reject(new Error(error || 'la pestaña devolvió error'));
  return true;
}
// el background avisa una descarga terminada (informativo: la espera real la hace el paso "esperarDescarga")
export function descargaLista(info) {
  console.log('[media-studio] puente-flow: Chrome terminó una descarga:', info.filename);
}

// La pestaña de Flow quedó dormida o sin el script de la extensión (2026-10-14: dos pedidos de SalesBot murieron con
// "Receiving end does not exist"). El paso no llegó a ejecutarse, así que no gastó nada: la extensión recarga la pestaña
// (eso lo hace sin necesitar la página) y el paso se pide de nuevo, una sola vez.
const SIN_CONEXION = /Receiving end does not exist|Could not establish connection/i;
async function pedir(job, accion, args = {}, timeoutMs = 120000) {
  // con la pestaña traída al frente para todo el trabajo, se devuelve recién al final (ver iniciarJob)
  if (accion === 'devolverPestana' && job.alFrente && !args.final) return { omitida: true };
  try { return await pedirUnaVez(job, accion, args, timeoutMs); }
  catch (e) {
    if (!SIN_CONEXION.test(e.message) || accion === 'recargar') throw e;
    const aviso = `la pestaña de Flow no contestaba ("${accion}"); la recargo y sigo`;
    if (Array.isArray(job.log)) job.log.push(`${new Date().toTimeString().slice(0, 8)} ${aviso}`);
    console.log('[media-studio] puente-flow:', aviso);
    await pedirUnaVez(job, 'recargar', {}, 90000);
    return pedirUnaVez(job, accion, args, timeoutMs);
  }
}
function pedirUnaVez(job, accion, args = {}, timeoutMs = 120000) {
  const id = `p${++seq}`;
  const paso = { id, jobId: job.id, accion, args, proyectoUrl: job.flowProjectUrl || null };
  cola.push(paso);
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => { esperando.delete(id); const i = cola.indexOf(paso); if (i >= 0) cola.splice(i, 1); reject(new Error(`la pestaña de Flow no respondió "${accion}" en ${timeoutMs / 1000} s (¿sigue abierta la pestaña de flow.google.com? Si Chrome la durmió, hacé click en ella)`)); }, timeoutMs);
    esperando.set(id, { resolve: (d) => { clearTimeout(t); resolve(d); }, reject: (e) => { clearTimeout(t); reject(e); } });
  });
}
// Reintento para errores transitorios de la interfaz (la página todavía cargando: "no encontré el ítem", "no apareció X en N s").
// Sólo se reintenta cuando el error es de ese tipo, nunca después de un paso que pudo haber generado algo (gasta créditos).
const TRANSITORIO = /no encontré el ítem|no apareció /i;
async function pedirConReintentos(job, accion, args, timeoutMs, intentos = 3, pausaMs = 5000, log = () => {}) {
  let ultimo;
  for (let i = 1; i <= intentos; i++) {
    try { return await pedir(job, accion, args, timeoutMs); }
    catch (e) {
      ultimo = e;
      if (!TRANSITORIO.test(e.message) || i === intentos) throw e;
      log(`${accion}: ${e.message} · la página seguía cargando, reintento ${i} de ${intentos - 1} en ${pausaMs / 1000} s`);
      await new Promise((r) => setTimeout(r, pausaMs));
    }
  }
  throw ultimo;
}
// se suma al retrato rehecho cuando Flow lo tomó por una persona famosa (2026-10-12)
const CARA_COMUN = 'An ordinary, everyday face that does not resemble any celebrity, actor or public figure: natural asymmetry, plain features, real-life imperfections.';
const slug = (s) => (String(s || '').trim().split(/\s+/)[0] || 'Personaje').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '').slice(0, 24) || 'Personaje';

// La extensión se recarga sola cuando Media Studio actualiza sus archivos (2026-10-14; desde la 0.5.0)
export async function recargarExtension() {
  return consultar(null, [{ accion: 'recargarExtension', timeoutMs: 30000 }]);
}

// Una CONSULTA a la pestaña de Flow, sin generar nada (2026-10-13: ver qué personajes tiene el proyecto de la modelo de
// Munify). Corre como un trabajo más, así nadie más usa la pestaña mientras tanto. pasos = [{ accion, args, timeoutMs }]
export async function consultar(flowProjectUrl, pasos) {
  const id = `consulta-${Date.now()}`;
  const job = { id, estado: 'corriendo', paso: 'consulta', log: [], escenas: [], fallas: [], error: null, flowProjectUrl, inicio: Date.now(), fin: null };
  jobs.set(id, job);
  const salida = [];
  if (faltaFlow()) abrirFlow(flowProjectUrl || 'https://flow.google.com/');
  try {
    for (const p of pasos) salida.push({ accion: p.accion, data: await pedir(job, p.accion, p.args || {}, p.timeoutMs || 90000).catch((e) => ({ error: e.message })) });
    return salida;
  } finally { job.estado = 'listo'; job.fin = Date.now(); }
}

// modo 'imagen' (2026-10-14): la foto se pide a Flow como imagen y no se genera un video (preset Ahorro o Calidad)
export function iniciarJob({ projectId, reelId, pack, escenasStoryboard, flowProjectUrl, soloDescargar = false, retomar = true, escenasConCrudo = [], guardarClip, agregarToma, guardarFlowUrl, generarMockups, verificarClip, modo = 'video' }) {
  const id = `flow-${Date.now()}`;
  // soloDescargar: el clip ya está generado en Flow (una corrida anterior se cortó después de generar); se baja sin volver a gastar créditos
  const job = { id, projectId, reelId, estado: 'iniciando', paso: '', log: [], escenas: [], fallas: [], error: null, flowProjectUrl: flowProjectUrl || null, soloDescargar: !!soloDescargar, retomar: retomar !== false, modo: modo === 'imagen' ? 'imagen' : 'video', inicio: Date.now(), fin: null };
  jobs.set(id, job);
  const log = (m) => { job.log.push(`${new Date().toTimeString().slice(0, 8)} ${m}`); console.log('[media-studio] puente-flow:', m); };
  const setPaso = (p) => { job.paso = p; log(p); };

  (async () => {
    job.estado = 'corriendo';
    // sin extensión o sin pestaña de Flow: se abre Chrome solo con el perfil de Lucas (abrirFlow.mjs, 2026-10-13)
    if (faltaFlow()) {
      const r = abrirFlow(job.flowProjectUrl || 'https://flow.google.com/');
      setPaso(r.abierto ? `abro Flow solo: ${r.motivo}` : `no pude abrir Flow solo (${r.motivo}); abrí flow.google.com en tu Chrome`);
    }
    // primer contacto: dónde está la pestaña
    const est = await pedir(job, 'estado', {}, 600000);
    log(`pestaña de Flow: ${est.url}`);
    // Flow no abre sus menús en una pestaña que no está a la vista (2026-10-14: con la ventana atrás o minimizada, los
    // pedidos morían con "no encontré el ítem del menú"). Se trae al frente para todo el trabajo y al final se devuelve.
    if (est.visible === false) { await pedir(job, 'traerAlFrente', {}, 20000).catch(() => {}); job.alFrente = true; log('traigo la pestaña de Flow al frente: escondida, Flow no abre sus menús'); }
    // Flow manda a /404?reason=project un proyecto que ya no existe (borrado o de otra cuenta). Le pasó al de SalesBot el
    // 2026-10-13/14: las ventanas que se abrían solas quedaban en ese error y los pedidos morían sin decir por qué.
    const proyectoMuerto = (u) => /flow\.google\.com\/404\b/.test(String(u || ''));
    if (job.flowProjectUrl) {
      let muerto = false;
      if (!est.url.startsWith(job.flowProjectUrl)) {
        setPaso('abriendo el proyecto de Flow');
        // la navegación la hace el background de la extensión (la página se recarga); después se confirma por "estado"
        await pedir(job, 'ir', { url: job.flowProjectUrl }, 90000).catch((e) => log(`ir: ${e.message}`));
        let ok = false;
        for (let i = 0; i < 12 && !ok && !muerto; i++) {
          const e2 = await pedir(job, 'estado', {}, 30000).catch(() => null);
          muerto = !!e2 && proyectoMuerto(e2.url);
          ok = !!e2 && e2.url.startsWith(job.flowProjectUrl);
          if (!ok && !muerto) await new Promise((r) => setTimeout(r, 2000));
        }
        if (!ok && !muerto) throw new Error('la pestaña no llegó al proyecto de Flow');
      }
      // Flow puede cargar la dirección del proyecto y recién después mandar al 404: se mira de nuevo un momento más tarde
      if (!muerto) {
        await new Promise((r) => setTimeout(r, 3000));
        const e3 = await pedir(job, 'estado', {}, 30000).catch(() => null);
        muerto = !!e3 && proyectoMuerto(e3.url);
      }
      if (muerto) { log(`el proyecto de Flow ya no existe (${job.flowProjectUrl}); creo uno nuevo`); job.flowProjectUrl = null; est.url = 'https://flow.google.com/404'; }
      else log('proyecto de Flow abierto');
    }
    if (!job.flowProjectUrl) {
      // sin proyecto de Flow asociado: se crea uno nuevo desde la portada (no se mezcla con el que el dueño tenga abierto)
      setPaso('creando un proyecto nuevo en Flow');
      if (!/^https:\/\/flow\.google\.com\/?(\?.*)?$/.test(est.url)) await pedir(job, 'ir', { url: 'https://flow.google.com/' }, 90000).catch((e) => log(`ir: ${e.message}`));
      let r = await pedir(job, 'nuevoProyecto', {}, 120000);
      for (let i = 0; i < 10 && !/\/project\//.test(r.url || ''); i++) {
        await new Promise((res) => setTimeout(res, 2000));
        r = await pedir(job, 'estado', {}, 30000).catch(() => ({ url: '' }));
      }
      if (!/\/project\//.test(r.url || '')) throw new Error('Flow no abrió el proyecto nuevo');
      job.flowProjectUrl = r.url.split('?')[0]; log(`proyecto creado: ${job.flowProjectUrl}`);
      if (guardarFlowUrl) await guardarFlowUrl(job.flowProjectUrl).catch(() => {});
      await new Promise((res) => setTimeout(res, 5000));   // el proyecto recién creado termina de armar su menú (Caracteres, Escenas)
    }
    await pedir(job, 'cerrarAgente').catch(() => {});

    // crea UN personaje en Flow: editor con el prompt → click real en la flecha → esperar → volver y ponerle el nombre
    const crearEnFlow = async (nombre, promptImagen, tPer = Date.now()) => {
      const prep = await pedirConReintentos(job, 'prepararPersonaje', { prompt: promptImagen }, 60000, 3, 5000, log);
      // prueba real 12/10: el primer clic no disparaba en ningún personaje (el editor todavía estaba tomando el texto)
      await new Promise((r) => setTimeout(r, 2500));
      await pedir(job, 'clickReal', { x: prep.x, y: prep.y }, 30000);
      let esp = await pedir(job, 'esperarPersonaje', { maxSeg: 240 }, 270000);
      if (!esp.arranco) {
        log(`personaje ${nombre}: el click no disparó la generación, pruebo una vez más`);
        const prep2 = await pedirConReintentos(job, 'prepararPersonaje', { prompt: promptImagen }, 60000, 3, 5000, log);
        await pedir(job, 'clickReal', { x: prep2.x, y: prep2.y }, 30000);
        esp = await pedir(job, 'esperarPersonaje', { maxSeg: 240 }, 270000);
        if (!esp.arranco) throw new Error('la flecha no respondió al click real');
      }
      log(`personaje ${nombre}: imagen generada en ${esp.seg} s`);
      await pedir(job, 'ir', { url: job.flowProjectUrl }, 90000).catch((e) => log(`ir: ${e.message}`));
      const ren = await pedirConReintentos(job, 'renombrarUltimoPersonaje', { nombre }, 60000, 3, 4000, log);
      if (!ren.ok) log(`personaje ${nombre}: generado pero sin nombre (en la grilla: ${(ren.tiles || []).join(' | ')}); ponéselo a mano en Flow`);
      log(`personaje ${nombre}: ${ren.ok ? 'creado y nombrado' : 'creado'} en ${Math.round((Date.now() - tPer) / 1000)} s`);
    };
    const nombres = {};
    const recreados = new Set();   // personajes cuyo retrato se rehizo porque Flow lo tomó por una persona famosa
    for (const p of pack.personajes || []) {
      const nombre = slug(p.nombre || p.id);
      nombres[p.id] = nombre;
      setPaso(`personaje ${nombre}`);
      const tPer = Date.now();
      const { existe, nombres: enGrilla } = await pedirConReintentos(job, 'personajeExiste', { nombre }, 60000, 4, 5000, log);
      if (existe) { log(`personaje ${nombre}: ya existía`); continue; }
      // la modelo de Lucas (server/presentadora.json) no se reemplaza por una inventada: si no está en su proyecto, se avisa
      if (p.noCrear) throw new Error(`no encontré a "${nombre}" en el proyecto de Flow de la presentadora (en la grilla: ${(enGrilla || []).join(' | ') || 'nadie'}); revisá el nombre en server/presentadora.json`);
      // 1) editor abierto con el prompt escrito → 2) click REAL en la flecha (el programado no dispara) → 3) esperar →
      // 4) volver a la grilla y ponerle el nombre desde "Cambiar nombre" (el título del editor no acepta tipeo programado)
      // 2026-10-12: un personaje que no se pudo crear no corta la rutina; sus escenas salen sin @ (el prompt lo describe)
      try {
        await crearEnFlow(nombre, p.promptImagen, tPer);
      } catch (e) {
        if (/no respondió/.test(e.message)) throw e;   // la pestaña de Flow no contesta: no tiene sentido seguir
        delete nombres[p.id];
        job.fallas.push(`personaje ${nombre}: ${e.message}`);
        log(`personaje ${nombre}: no se pudo crear (${e.message}); sus escenas van sin @ y el prompt lo describe`);
        await pedir(job, 'ir', { url: job.flowProjectUrl }, 90000).catch(() => {});
      }
    }
    // crear personajes trae la pestaña de Flow al frente (Flow ignora el click si no está a la vista); se devuelve la anterior
    await pedir(job, 'devolverPestana', {}, 20000).catch(() => {});
    await pedirConReintentos(job, 'irAContenido', {}, 120000, 3, 4000, log);
    await pedir(job, 'apagarAgente').catch(() => {});
    // los ajustes salen del preset de calidad que eligió Lucas (Ajustes del rail; server/calidadFlow.mjs)
    const preset = presetActual();
    const pedidoAjustes = ajustesFlow(preset, job.modo);
    setPaso(`ajustes de ${job.modo === 'imagen' ? 'imagen' : 'video'} · preset ${preset.nombre}`);
    const aj = await pedirConReintentos(job, 'ajustes', pedidoAjustes, 60000, 3, 4000, log);
    const resolucionMal = job.modo === 'video' && aj.resolucion && pedidoAjustes.resolucion && aj.resolucion !== pedidoAjustes.resolucion;
    log(`ajustes: ${String(aj.pastilla || '').replace(/\s+/g, ' ')}${aj.modelo ? ` · modelo ${aj.modelo}` : ''}${resolucionMal ? ` · OJO: pedí ${pedidoAjustes.resolucion} y Flow quedó en ${aj.resolucion}` : ''}${job.modo === 'video' && aj.dur8 === false ? ' · OJO: no veo 8 s en la pastilla, revisalo en Flow' : ''}`);
    // 2026-10-11 (RepareHoy "Nadie te contesta"): con Flow en x2 cada pedido deja DOS clips en la grilla y el reparto de uno
    // por escena se corría: la escena 1 recibió el clip de la 2, y la 2 y la 4 el de la 4 (lo mostró la transcripción). La
    // extensión pide x1 pero no avisa si no encuentra el botón; acá se lee la pastilla y, además, se mide cada pedido.
    const salidasPastilla = Number((/\bx\s?([1-4])\b/i.exec(String(aj.pastilla || '')) || [])[1]) || 0;
    if (salidasPastilla > 1) log(`OJO: Flow está generando ${salidasPastilla} variantes por pedido (x${salidasPastilla}); se baja una por escena, la más nueva de cada grupo`);

    const sb = Object.fromEntries((escenasStoryboard || []).map((e) => [e.n, e]));
    // 2026-10-12: retomar por escena — las que ya tienen su crudo de Flow en la pieza no se vuelven a generar ni a bajar
    const conCrudo = new Set((escenasConCrudo || []).map(Number));
    const todas = (pack.escenas || []).filter((e) => e.rol !== 'cta');
    const escenas = todas.filter((e) => !conCrudo.has(Number(e.escenaN)));
    if (conCrudo.size) log(`retomo: ${todas.length - escenas.length} escena(s) ya tienen su crudo en la pieza; quedan ${escenas.length}`);
    if (!escenas.length) { job.estado = 'listo'; job.fin = Date.now(); setPaso('todas las escenas ya tenían su crudo de Flow'); return; }
    // retomar sin crudos: si el proyecto de Flow ya tiene clips (una corrida anterior se cortó después de generar), esas
    // primeras escenas ya están generadas y no se vuelven a pagar (los personajes son imágenes: no cuentan como clip)
    // retomar=false: el proyecto de Flow es compartido entre pedidos (SalesBot) y sus clips son de otros pedidos; contarlos
    // como hechos entregó los perros de un pedido anterior como la taza del siguiente (2026-10-12)
    const previos = conCrudo.size || !job.retomar ? 0 : ((await pedir(job, 'urlsDeClips', {}, 60000).catch(() => ({ total: 0 }))).total || 0);
    const yaHechas = job.soloDescargar ? escenas.length : Math.min(Math.floor(previos / (salidasPastilla || 1)), escenas.length);
    if (yaHechas) log(`retomo: Flow ya tiene ${previos} clip(s); ${yaHechas} escena(s) no se vuelven a generar`);
    // UNA escena con sus reintentos (2026-10-12, Lucas: "la automatización tiene que manejar errores y reintentos").
    // Antes de tocar la flecha ("[antes de enviar]": no se gastó nada): hasta 3 intentos, el 2º con la pestaña recargada y
    // el 3º sin las menciones @ (el prompt describe a la persona). Después de enviar: si el clip queda con error o clavado,
    // se refresca; si sigue mal, se vuelve a generar una sola vez (eso sí gasta un clip más).
    const generarEscena = async (esc, quienes, reg) => {
      // el video más nuevo de la grilla justo antes de pedir: al terminar, el de esta escena tiene que ser OTRO
      const anotarPrevio = async () => { reg.previo = (await pedir(job, 'urlDelMasNuevo', { tipo: job.modo }, 60000).catch(() => ({ url: '' }))).url || ''; };
      let g = null;
      for (let intento = 1; intento <= 3 && !g; intento++) {
        const personajes = intento === 3 ? [] : quienes;
        await anotarPrevio();
        try { g = await pedir(job, 'generar', { prompt: esc.prompt, personajes }, 120000); }
        catch (e) {
          if (!/antes de enviar|no apareció|no encontré/i.test(e.message) || intento === 3) throw e;
          log(`escena ${esc.escenaN}: ${e.message} · reintento ${intento} de 2${intento === 2 ? ' (el último va sin las menciones @)' : ''}`);
          await pedir(job, 'limpiar', {}, 30000).catch(() => {});
          // una mención @ que no se completa no se arregla esperando: en la prueba real del 12/10 salió recién recargando
          if (intento === 1 && !/mencionar/i.test(e.message)) await new Promise((r) => setTimeout(r, 3000));
          else { await pedir(job, 'recargar', {}, 90000).catch(() => {}); await pedir(job, 'apagarAgente').catch(() => {}); }
        }
      }
      // la posición del clip en la grilla contada desde el más viejo: con ella se baja el clip justo aunque otra escena falle
      if (Number.isFinite(g.antes)) reg.pos = g.antes;
      if (Number.isFinite(g.antes) && g.tiles > g.antes) {
        reg.salidas = g.tiles - g.antes;
        if (reg.salidas > 1) log(`escena ${esc.escenaN}: Flow dejó ${reg.salidas} clips para este pedido; se baja uno`);
      }
      if (!g.disparado && g.enviar) {
        log(`escena ${esc.escenaN}: el click programado no disparó, hago un click real`);
        await pedir(job, 'clickReal', g.enviar, 30000).catch((e) => log(`clickReal: ${e.message}`));
        await new Promise((r) => setTimeout(r, 2500));
        await pedir(job, 'devolverPestana', {}, 20000).catch(() => {});
      } else if (!g.disparado) log(`escena ${esc.escenaN}: no vi el tile nuevo, sigo igual`);
      let e = await pedir(job, 'esperarGeneracion', { maxSeg: 300 }, 330000);
      // refrescar sólo para un clip trabado o cargando: un rechazo de Flow se maneja abajo (al refrescar, el clip rechazado
      // desaparece y la rutina lo tomaba por terminado: prueba real del 12/10)
      if (!e.conError && (!e.terminado || e.atascado)) {
        log(`escena ${esc.escenaN}: el clip quedó ${e.conError ? 'con error' : e.atascado ? `clavado en ${e.pct ?? '?'}%` : 'cargando'} a los ${e.seg} s${e.texto ? ` (Flow dice: "${e.texto}")` : ''} · refresco la pestaña de Flow`);
        await pedir(job, 'recargar', {}, 90000);
        await pedir(job, 'apagarAgente').catch(() => {});
        await pedirConReintentos(job, 'irAContenido', {}, 120000, 3, 4000, log).catch(() => {});
        e = await pedir(job, 'esperarGeneracion', { maxSeg: 240 }, 260000);
      }
      // se vuelve a generar SÓLO si Flow muestra error (gasta un clip más). Si sigue cargando, se deja: se baja al final si terminó.
      // Flow rechazó el clip (los rechazos son reembolsados). Según lo que dice (prueba real del 12/10):
      // - "personas famosas": el retrato de referencia del protagonista se parece a alguien conocido → se rehace ese
      //   retrato con otra cara (nombre nuevo) y se usa en esta escena y en las que siguen;
      // - "no se pudo generar el audio": se reintenta tal cual;
      // - otro motivo: una vez igual y la última sin las referencias @ (el prompt describe a la persona).
      let refs = [...quienes];
      for (let intento = 1; intento <= 3 && e.conError; intento++) {
        const texto = String(e.texto || '');
        let que = 'la vuelvo a pedir';
        if (/famos|famous|celebrit/i.test(texto) && refs.length) {
          const protagonista = refs[0];
          const pid = Object.keys(nombres).find((k) => nombres[k] === protagonista);
          const p = (pack.personajes || []).find((x) => x.id === pid);
          if (p && !recreados.has(pid)) {
            recreados.add(pid);
            const nuevo = `${protagonista}${recreados.size + 1}`;
            log(`escena ${esc.escenaN}: Flow dice que el retrato de ${protagonista} se parece a una persona famosa · lo rehago con otra cara como ${nuevo}`);
            try {
              const { existe } = await pedirConReintentos(job, 'personajeExiste', { nombre: nuevo }, 60000, 4, 5000, log);
              if (!existe) await crearEnFlow(nuevo, `${p.promptImagen} ${CARA_COMUN}`);
              nombres[pid] = nuevo;
              refs = refs.map((n) => (n === protagonista ? nuevo : n));
              que = `con el retrato nuevo de ${nuevo}`;
            } catch (err) {
              log(`escena ${esc.escenaN}: no pude rehacer el retrato (${err instanceof Error ? err.message : err}); va sin referencias`);
              refs = []; que = 'sin las referencias @';
            }
            await pedir(job, 'devolverPestana', {}, 20000).catch(() => {});
            await pedir(job, 'ir', { url: job.flowProjectUrl }, 90000).catch(() => {});
            await pedirConReintentos(job, 'irAContenido', {}, 120000, 3, 4000, log).catch(() => {});
            await pedir(job, 'apagarAgente').catch(() => {});
          } else { refs = []; que = 'sin las referencias @'; }
        } else if (/audio/i.test(texto)) que = 'otra vez (Flow no pudo generar el audio)';
        else if (intento >= 2 && refs.length) { refs = []; que = 'sin las referencias @'; }
        log(`escena ${esc.escenaN}: Flow rechazó el clip${texto ? ` ("${texto.slice(0, 140)}")` : ''} · ${que}`);
        await pedir(job, 'limpiar', {}, 30000).catch(() => {});
        await anotarPrevio();
        const g2 = await pedir(job, 'generar', { prompt: esc.prompt, personajes: refs }, 120000)
          .catch(() => pedir(job, 'generar', { prompt: esc.prompt, personajes: [] }, 120000));
        if (Number.isFinite(g2.antes)) reg.pos = g2.antes;
        if (Number.isFinite(g2.antes) && g2.tiles > g2.antes) reg.salidas = g2.tiles - g2.antes;
        e = await pedir(job, 'esperarGeneracion', { maxSeg: 300 }, 330000);
        if (!e.conError && refs.length < quienes.length) { reg.aviso = 'salió sin todas las referencias de personaje: revisá que se parezca'; log(`escena ${esc.escenaN}: salió sin todas las referencias @; revisá que la persona se parezca`); }
      }
      if (e.conError) throw new Error(`Flow rechazó el clip después de los reintentos${e.texto ? ` (Flow dice: "${String(e.texto).slice(0, 160)}")` : ''}`);
      if (!e.terminado) { log(`escena ${esc.escenaN}: sigue terminándose en Flow; la bajo al final si ya está`); return; }
      // el video de ESTA escena es el más nuevo de la grilla ahora: se guarda para bajarlo al final sin depender de posiciones.
      // Primero la pestaña tiene que estar en la grilla del proyecto (después de recargar quedó en otra y se tomó un ejemplo)
      const est = await pedir(job, 'estado', {}, 30000).catch(() => null);
      if (!est || !String(est.url || '').startsWith(job.flowProjectUrl)) {
        await pedir(job, 'ir', { url: job.flowProjectUrl }, 90000).catch(() => {});
        await pedirConReintentos(job, 'irAContenido', {}, 120000, 3, 4000, log).catch(() => {});
      }
      const u = await pedir(job, 'urlDelMasNuevo', { tipo: job.modo }, 60000).catch(() => ({ url: '' }));
      const yaUsada = job.escenas.some((x) => x !== reg && x.url && x.url === u.url);
      // si el más nuevo es el mismo que había antes de pedir, el clip de esta escena no apareció: no se toma ninguno
      if (u.url && reg.previo && u.url === reg.previo) throw new Error('Flow no dejó un clip nuevo para esta escena (el más nuevo de la grilla es el de antes)');
      if (u.url && !yaUsada) reg.url = u.url;
      else log(`escena ${esc.escenaN}: no pude tomar su video al terminar; al final lo busco por posición`);
    };
    // 1) GENERAR todas, una atrás de otra (Lucas, 2026-10-11: "primero generá todo y después hacé la descarga")
    for (const [i, esc] of escenas.entries()) {
      const porSb = (sb[esc.escenaN]?.personajes || []).map((pid) => nombres[pid]).filter(Boolean);
      const porTexto = Object.values(nombres).filter((n) => new RegExp(`\\b${n}\\b`, 'i').test(esc.prompt || ''));
      const quienes = [...new Set([...porSb, ...porTexto])];
      const reg = { escenaN: esc.escenaN, estado: i < yaHechas ? 'ya estaba en Flow' : 'generando', fileRef: null, salidas: salidasPastilla || 1 };
      job.escenas.push(reg);
      if (i < yaHechas) { log(`escena ${esc.escenaN}: ya estaba en Flow, no la vuelvo a generar`); continue; }
      setPaso(`escena ${esc.escenaN} (${i + 1} de ${escenas.length})${quienes.length ? ` con @${quienes.join(' @')}` : ''}`);
      const tEsc = Date.now();
      try {
        await generarEscena(esc, quienes, reg);
        log(`escena ${esc.escenaN}: generada en ${Math.round((Date.now() - tEsc) / 1000)} s (desde el disparo hasta el clip listo)`);
        reg.estado = 'generada';
      } catch (e) {
        if (/no respondió/.test(e.message)) throw e;   // la pestaña de Flow no contesta: no tiene sentido seguir
        reg.estado = 'falló'; reg.motivo = e.message;
        job.fallas.push(`escena ${esc.escenaN}: ${e.message}`);
        log(`escena ${esc.escenaN}: NO SALIÓ después de los reintentos (${e.message}); sigo con la próxima`);
        await pedir(job, 'limpiar', {}, 30000).catch(() => {});
      }
    }
    // 2) BAJAR todas, directo por la URL del archivo de cada clip: sin menú de clic derecho, así anda con la pestaña de
    // Flow al fondo o con la ventana movida (2026-10-11: el menú no apareció y se cortó la rutina entera)
    setPaso(`bajando ${escenas.length} clip(s) de Flow`);
    await pedir(job, 'recargar', {}, 90000).catch((e) => log(`recargar: ${e.message}`));
    await pedir(job, 'apagarAgente').catch(() => {});
    await pedirConReintentos(job, 'irAContenido', {}, 120000, 3, 4000, log);
    let clips = job.modo === 'imagen' ? { urls: [], todos: [] } : await pedir(job, 'urlsDeClips', {}, 90000);
    // la grilla va del más nuevo al más viejo y las escenas se generaron en orden; cada escena ocupa `salidas` lugares
    // seguidos (x1 = uno, x2 = dos). Se cuenta desde la última generada y se toma el primero de cada grupo.
    // una escena que falló no dejó clip: no ocupa lugar en la grilla y no se baja
    const salio = (i) => job.escenas[i] && job.escenas[i].estado !== 'falló';
    const indices = [];
    for (let i = escenas.length - 1, pos = 0; i >= 0; i--) { if (!salio(i)) { indices[i] = -1; continue; } indices[i] = pos; pos += job.escenas[i]?.salidas || 1; }
    const faltan = (c) => indices.filter((k) => k >= 0 && !(c.urls || [])[k]).length;
    if (job.modo === 'video' && faltan(clips)) {
      // Flow no armó el video de algún clip con la pestaña al fondo: se trae al frente un momento y se reintenta
      log(`a ${faltan(clips)} clip(s) Flow no les cargó el video con la pestaña al fondo; la traigo al frente un momento`);
      await pedir(job, 'traerAlFrente', {}, 20000).catch(() => {});
      clips = await pedir(job, 'urlsDeClips', {}, 90000);
      await pedir(job, 'devolverPestana', {}, 20000).catch(() => {});
    }
    // por la posición que tuvo cada clip cuando se pidió (contada desde el más viejo); sin ella, el reparto relativo de antes
    const porPosicion = (i) => {
      const r = job.escenas[i];
      if (!Array.isArray(clips.todos) || !Number.isFinite(r?.pos)) return undefined;
      const k = clips.todos.length - 1 - r.pos;
      return k >= 0 ? (clips.todos[k] || '') : '';
    };
    // en un proyecto compartido entre pedidos (retomar=false, SalesBot) NO se adivina por posición: si al terminar no se
    // pudo identificar el video nuevo, la escena falla. Una foto equivocada va directo a una charla (2026-10-13)
    const enOrden = escenas.map((_, i) => { if (!salio(i)) return null; if (job.escenas[i]?.url) return job.escenas[i].url; if (!job.retomar || job.modo === 'imagen') return ''; const p = porPosicion(i); return p !== undefined ? p : (clips.urls || [])[indices[i]]; });
    for (const [i, esc] of escenas.entries()) {
      const reg = job.escenas[i];
      if (!salio(i)) continue;
      if (!enOrden[i]) {
        reg.estado = 'falló'; reg.motivo = 'Flow no dio el video del clip (¿sigue generándose o quedó con error?)';
        job.fallas.push(`escena ${esc.escenaN}: ${reg.motivo}`);
        log(`escena ${esc.escenaN}: no encontré su video en Flow; la salteo`);
        continue;
      }
      setPaso(`bajando la escena ${esc.escenaN} (${i + 1} de ${escenas.length})`);
      const ext = job.modo === 'imagen' ? 'png' : 'mp4';
      const info = await pedir(job, 'descargarUrl', { url: enOrden[i], nombre: `esc${esc.escenaN}-${job.id}.${ext}` }, 200000);
      log(`escena ${esc.escenaN}: bajada a ${info.filename}`);
      const buffer = fs.readFileSync(info.filename);
      const toma = await guardarClip(buffer, `esc${esc.escenaN}-${path.basename(info.filename, path.extname(info.filename))}.${ext}`);
      // la red (2026-10-12): el clip tiene que decir la frase de su escena. Si no la dice, no entra a la pieza (un clip ajeno
      // o una frase inventada por Flow) y queda para volver a generar.
      const dialogo = String(sb[esc.escenaN]?.dialogo || esc.dialogo || '').trim();   // esc.dialogo: la presentadora del cierre
      if (verificarClip && dialogo && job.modo === 'video') {
        const v = await verificarClip(toma.fileRef, dialogo).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
        if (v.error) log(`escena ${esc.escenaN}: no pude verificar la frase (${v.error}); entra igual, revisala`);
        else if (v.parecido < 0.4) {
          reg.estado = 'falló'; reg.motivo = `el clip no dice la frase de la escena (dice: "${v.dice || '(nada)'}")`;
          job.fallas.push(`escena ${esc.escenaN}: ${reg.motivo}`);
          log(`escena ${esc.escenaN}: ${reg.motivo}; no entra a la pieza`);
          continue;
        } else if (v.parecido < 0.75) { reg.aviso = `dice "${v.dice}"`; log(`escena ${esc.escenaN}: la frase sale parecida pero no igual (dice: "${v.dice}"); revisala`); }
        else log(`escena ${esc.escenaN}: verificada, dice su frase`);
      }
      await agregarToma(esc.escenaN, toma);
      reg.estado = 'importada'; reg.fileRef = toma.fileRef;
      log(`escena ${esc.escenaN}: en Pack Flow, Los crudos de Flow (${toma.fileRef})`);
    }
    // híbrido: además de los crudos filmados, los mockups de la app (tarjetas del motor) quedan en la pieza como tomas
    // disponibles; el montaje decide qué entra. Si la app no tiene tarjetas todavía, se avisa y no corta el job.
    if (generarMockups) {
      setPaso('mockups de la app (tarjetas del motor)');
      try { const mk = await generarMockups(log); log(`mockups de la app: ${mk.length} renderizado(s)`); }
      catch (e) { log(`mockups de la app: ${e instanceof Error ? e.message : e}`); }
    }
    if (job.alFrente) await pedir(job, 'devolverPestana', { final: true }, 20000).catch(() => {});
    job.estado = 'listo'; job.fin = Date.now();
    const bajadas = job.escenas.filter((x) => x.estado === 'importada').length;
    setPaso(job.fallas.length
      ? `${bajadas} de ${escenas.length} escena(s) bajadas en ${Math.round((job.fin - job.inicio) / 1000)} s · no salieron: ${job.fallas.join(' · ')} · volvé a tocar "Automatizar": retoma sólo lo que falta`
      : `clips de Flow bajados · ${escenas.length} escena(s) en ${Math.round((job.fin - job.inicio) / 1000)} s en total`);
  })().catch((e) => {
    job.estado = 'error'; job.error = e instanceof Error ? e.message : String(e); job.fin = Date.now();
    log(`ERROR: ${job.error}`);
    if (job.alFrente) pedir(job, 'devolverPestana', { final: true }, 20000).catch(() => {});
  });
  return resumen(job);
}
