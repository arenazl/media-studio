// Puente Flow (lado servidor): la orquestación de la rutina Media Studio → Flow cuando la ejecuta la EXTENSIÓN de
// Chrome del dueño (extension-flow/). El servidor decide el orden; la pestaña de Flow ejecuta cada paso chico y
// devuelve el resultado. La descarga la hace Chrome a la carpeta de Descargas del dueño; el background de la
// extensión avisa la ruta final y acá se importa al Rodaje.
import fs from 'node:fs';
import path from 'node:path';

const jobs = new Map();
const cola = [];                 // pasos pendientes para la pestaña
const esperando = new Map();     // pasoId → { resolve, reject }
let ultimoLatido = 0;
let pestanasFlow = 1;            // cuántas pestañas de Flow ve la extensión (la v3 lo manda en cada consulta)
let versionExtension = null;     // versión de la extensión que está consultando (para saber si el dueño ya recargó)
let seq = 0;

export function latido() { ultimoLatido = Date.now(); }
export function extensionViva() { return Date.now() - ultimoLatido < 20000; }
export function verJob(id) { const j = jobs.get(id); return j ? resumen(j) : null; }
export function listarJobs() { return [...jobs.values()].map(resumen); }
function resumen(j) { return { id: j.id, estado: j.estado, paso: j.paso, log: j.log.slice(-80), escenas: j.escenas, error: j.error, flowProjectUrl: j.flowProjectUrl, inicio: j.inicio, fin: j.fin, extension: extensionViva(), pestanas: pestanasFlow }; }

// la pestaña pide el próximo paso
export function estadoPuente() { return { extension: extensionViva(), pestanas: pestanasFlow, version: versionExtension }; }
export function proximoComando({ pestanas, origen, version } = {}) {
  if (origen !== 'background') return null;   // un content script viejo (v2) que quedó huérfano en la pestaña no recibe pasos
  latido();
  if (version) versionExtension = String(version);
  if (Number.isFinite(pestanas)) pestanasFlow = pestanas;
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

function pedir(job, accion, args = {}, timeoutMs = 120000) {
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
const slug = (s) => (String(s || '').trim().split(/\s+/)[0] || 'Personaje').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '').slice(0, 24) || 'Personaje';

export function iniciarJob({ projectId, reelId, pack, escenasStoryboard, flowProjectUrl, soloDescargar = false, guardarClip, agregarToma, guardarFlowUrl, generarMockups }) {
  const id = `flow-${Date.now()}`;
  // soloDescargar: el clip ya está generado en Flow (una corrida anterior se cortó después de generar); se baja sin volver a gastar créditos
  const job = { id, projectId, reelId, estado: 'iniciando', paso: '', log: [], escenas: [], error: null, flowProjectUrl: flowProjectUrl || null, soloDescargar: !!soloDescargar, inicio: Date.now(), fin: null };
  jobs.set(id, job);
  const log = (m) => { job.log.push(`${new Date().toTimeString().slice(0, 8)} ${m}`); console.log('[media-studio] puente-flow:', m); };
  const setPaso = (p) => { job.paso = p; log(p); };

  (async () => {
    job.estado = 'corriendo';
    if (!extensionViva()) setPaso('esperando la extensión Puente Flow en tu Chrome');
    else if (pestanasFlow === 0) setPaso('abrí flow.google.com en una pestaña de tu Chrome (no hace falta que quede a la vista)');
    // primer contacto: dónde está la pestaña
    const est = await pedir(job, 'estado', {}, 600000);
    log(`pestaña de Flow: ${est.url}`);
    if (job.flowProjectUrl) {
      if (!est.url.startsWith(job.flowProjectUrl)) {
        setPaso('abriendo el proyecto de Flow');
        // la navegación la hace el background de la extensión (la página se recarga); después se confirma por "estado"
        await pedir(job, 'ir', { url: job.flowProjectUrl }, 90000).catch((e) => log(`ir: ${e.message}`));
        let ok = false;
        for (let i = 0; i < 12 && !ok; i++) {
          const e2 = await pedir(job, 'estado', {}, 30000).catch(() => null);
          ok = !!e2 && e2.url.startsWith(job.flowProjectUrl);
          if (!ok) await new Promise((r) => setTimeout(r, 2000));
        }
        if (!ok) throw new Error('la pestaña no llegó al proyecto de Flow');
        log('proyecto de Flow abierto');
      }
    } else {
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

    const nombres = {};
    for (const p of pack.personajes || []) {
      const nombre = slug(p.nombre || p.id);
      nombres[p.id] = nombre;
      setPaso(`personaje ${nombre}`);
      const tPer = Date.now();
      const { existe } = await pedirConReintentos(job, 'personajeExiste', { nombre }, 60000, 4, 5000, log);
      if (existe) { log(`personaje ${nombre}: ya existía`); continue; }
      // 1) editor abierto con el prompt escrito → 2) click REAL en la flecha (el programado no dispara) → 3) esperar →
      // 4) volver a la grilla y ponerle el nombre desde "Cambiar nombre" (el título del editor no acepta tipeo programado)
      const prep = await pedirConReintentos(job, 'prepararPersonaje', { prompt: p.promptImagen }, 60000, 3, 5000, log);
      await pedir(job, 'clickReal', { x: prep.x, y: prep.y }, 30000);
      let esp = await pedir(job, 'esperarPersonaje', { maxSeg: 240 }, 270000);
      if (!esp.arranco) {
        log(`personaje ${nombre}: el click no disparó la generación, pruebo una vez más`);
        const prep2 = await pedir(job, 'prepararPersonaje', { prompt: p.promptImagen }, 60000);
        await pedir(job, 'clickReal', { x: prep2.x, y: prep2.y }, 30000);
        esp = await pedir(job, 'esperarPersonaje', { maxSeg: 240 }, 270000);
        if (!esp.arranco) throw new Error(`Flow no empezó a generar el personaje ${nombre} (la flecha no respondió al click real)`);
      }
      log(`personaje ${nombre}: imagen generada en ${esp.seg} s`);
      await pedir(job, 'ir', { url: job.flowProjectUrl }, 90000).catch((e) => log(`ir: ${e.message}`));
      const ren = await pedirConReintentos(job, 'renombrarUltimoPersonaje', { nombre }, 60000, 3, 4000, log);
      if (!ren.ok) log(`personaje ${nombre}: generado pero sin nombre (en la grilla: ${(ren.tiles || []).join(' | ')}); ponéselo a mano en Flow`);
      log(`personaje ${nombre}: ${ren.ok ? 'creado y nombrado' : 'creado'} en ${Math.round((Date.now() - tPer) / 1000)} s`);
    }
    // crear personajes trae la pestaña de Flow al frente (Flow ignora el click si no está a la vista); se devuelve la anterior
    await pedir(job, 'devolverPestana', {}, 20000).catch(() => {});
    await pedirConReintentos(job, 'irAContenido', {}, 120000, 3, 4000, log);
    await pedir(job, 'apagarAgente').catch(() => {});
    setPaso('ajustes de video');
    const aj = await pedir(job, 'ajustes', {}, 60000);
    log(`ajustes: ${String(aj.pastilla || '').replace(/\s+/g, ' ')}${aj.res720 === false || aj.dur8 === false ? ' · OJO: no veo 720p / 8 s en la pastilla, revisalo en Flow' : ''}`);
    // 2026-10-11 (RepareHoy "Nadie te contesta"): con Flow en x2 cada pedido deja DOS clips en la grilla y el reparto de uno
    // por escena se corría: la escena 1 recibió el clip de la 2, y la 2 y la 4 el de la 4 (lo mostró la transcripción). La
    // extensión pide x1 pero no avisa si no encuentra el botón; acá se lee la pastilla y, además, se mide cada pedido.
    const salidasPastilla = Number((/\bx\s?([1-4])\b/i.exec(String(aj.pastilla || '')) || [])[1]) || 0;
    if (salidasPastilla > 1) log(`OJO: Flow está generando ${salidasPastilla} variantes por pedido (x${salidasPastilla}); se baja una por escena, la más nueva de cada grupo`);

    const sb = Object.fromEntries((escenasStoryboard || []).map((e) => [e.n, e]));
    const escenas = (pack.escenas || []).filter((e) => e.rol !== 'cta');
    // retomar: si el proyecto de Flow ya tiene clips (una corrida anterior se cortó), esas primeras escenas ya están
    // generadas y no se vuelven a pagar (los personajes son imágenes: no cuentan como clip)
    const previos = (await pedir(job, 'urlsDeClips', {}, 60000).catch(() => ({ total: 0 }))).total || 0;
    const yaHechas = job.soloDescargar ? escenas.length : Math.min(Math.floor(previos / (salidasPastilla || 1)), escenas.length);
    if (yaHechas) log(`retomo: Flow ya tiene ${previos} clip(s); ${yaHechas} escena(s) no se vuelven a generar`);
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
      const g = await pedir(job, 'generar', { prompt: esc.prompt, personajes: quienes }, 120000);
      // cuántos clips dejó ESTE pedido en la grilla (la extensión ≥0.4.2 manda cuántos había antes)
      if (Number.isFinite(g.antes) && g.tiles > g.antes) {
        reg.salidas = g.tiles - g.antes;
        if (reg.salidas > 1) log(`escena ${esc.escenaN}: Flow dejó ${reg.salidas} clips para este pedido; se baja uno`);
      }
      if (!g.disparado && g.enviar) {
        log(`escena ${esc.escenaN}: el click programado no disparó, hago un click real`);
        await pedir(job, 'clickReal', g.enviar, 30000).catch((e) => log(`clickReal: ${e.message}`));
        await new Promise((r) => setTimeout(r, 2500));
        await pedir(job, 'devolverPestana', {}, 20000).catch(() => {});
      }
      else if (!g.disparado) log(`escena ${esc.escenaN}: no vi el tile nuevo, sigo igual`);
      let e = await pedir(job, 'esperarGeneracion', { maxSeg: 300 }, 330000);
      if (!e.terminado || e.conError || e.atascado) {
        // el clip quedó "cargando" o con error: refrescar la pestaña lo muestra bien (lo vio Lucas); una sola vez
        log(`escena ${esc.escenaN}: el clip quedó ${e.conError ? 'con error' : e.atascado ? `clavado en ${e.pct ?? '?'}%` : 'cargando'} a los ${e.seg} s · refresco la pestaña de Flow`);
        await pedir(job, 'recargar', {}, 90000);
        await pedir(job, 'apagarAgente').catch(() => {});
        e = await pedir(job, 'esperarGeneracion', { maxSeg: 180 }, 200000);
        if (!e.terminado || e.conError) throw new Error(`la escena ${esc.escenaN} quedó ${e.conError ? 'con error' : 'cargando'} en Flow después de refrescar; miralo en Flow y volvé a disparar (las bajadas ya hechas quedaron en el Rodaje)`);
      }
      log(`escena ${esc.escenaN}: generada en ${Math.round((Date.now() - tEsc) / 1000)} s (desde el disparo hasta el clip listo)`);
      reg.estado = 'generada';
    }
    // 2) BAJAR todas, directo por la URL del archivo de cada clip: sin menú de clic derecho, así anda con la pestaña de
    // Flow al fondo o con la ventana movida (2026-10-11: el menú no apareció y se cortó la rutina entera)
    setPaso(`bajando ${escenas.length} clip(s) de Flow`);
    await pedir(job, 'recargar', {}, 90000).catch((e) => log(`recargar: ${e.message}`));
    await pedir(job, 'apagarAgente').catch(() => {});
    await pedirConReintentos(job, 'irAContenido', {}, 120000, 3, 4000, log);
    let clips = await pedir(job, 'urlsDeClips', {}, 90000);
    // la grilla va del más nuevo al más viejo y las escenas se generaron en orden; cada escena ocupa `salidas` lugares
    // seguidos (x1 = uno, x2 = dos). Se cuenta desde la última generada y se toma el primero de cada grupo.
    const indices = [];
    for (let i = escenas.length - 1, pos = 0; i >= 0; i--) { indices[i] = pos; pos += job.escenas[i]?.salidas || 1; }
    const faltan = (c) => indices.filter((k) => !(c.urls || [])[k]).length;
    if (faltan(clips)) {
      // Flow no armó el video de algún clip con la pestaña al fondo: se trae al frente un momento y se reintenta
      log(`a ${faltan(clips)} clip(s) Flow no les cargó el video con la pestaña al fondo; la traigo al frente un momento`);
      await pedir(job, 'traerAlFrente', {}, 20000).catch(() => {});
      clips = await pedir(job, 'urlsDeClips', {}, 90000);
      await pedir(job, 'devolverPestana', {}, 20000).catch(() => {});
    }
    const enOrden = indices.map((k) => (clips.urls || [])[k]);
    if (faltan(clips)) throw new Error(`en Flow veo ${clips.total || 0} clip(s) y a ${faltan(clips)} no les pude sacar el video: mirá el proyecto de Flow y volvé a tocar "Automatizar" (retoma sin volver a generar lo que ya está)`);
    for (const [i, esc] of escenas.entries()) {
      const reg = job.escenas[i];
      setPaso(`bajando la escena ${esc.escenaN} (${i + 1} de ${escenas.length})`);
      const info = await pedir(job, 'descargarUrl', { url: enOrden[i], nombre: `esc${esc.escenaN}-${job.id}.mp4` }, 200000);
      log(`escena ${esc.escenaN}: bajada a ${info.filename}`);
      const buffer = fs.readFileSync(info.filename);
      const toma = await guardarClip(buffer, `esc${esc.escenaN}-${path.basename(info.filename, path.extname(info.filename))}.mp4`);
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
    job.estado = 'listo'; job.fin = Date.now();
    setPaso(`clips de Flow bajados · ${escenas.length} escena(s) en ${Math.round((job.fin - job.inicio) / 1000)} s en total`);
  })().catch((e) => {
    job.estado = 'error'; job.error = e instanceof Error ? e.message : String(e); job.fin = Date.now();
    log(`ERROR: ${job.error}`);
  });
  return resumen(job);
}
