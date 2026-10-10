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
const slug = (s) => (String(s || '').trim().split(/\s+/)[0] || 'Personaje').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '').slice(0, 24) || 'Personaje';

export function iniciarJob({ projectId, reelId, pack, escenasStoryboard, flowProjectUrl, soloDescargar = false, guardarClip, agregarToma, guardarFlowUrl }) {
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
    }
    await pedir(job, 'cerrarAgente').catch(() => {});

    const nombres = {};
    for (const p of pack.personajes || []) {
      const nombre = slug(p.nombre || p.id);
      nombres[p.id] = nombre;
      setPaso(`personaje ${nombre}`);
      const { existe } = await pedir(job, 'personajeExiste', { nombre }, 60000);
      if (existe) { log(`personaje ${nombre}: ya existía`); continue; }
      await pedir(job, 'crearPersonaje', { nombre, prompt: p.promptImagen }, 300000);
      log(`personaje ${nombre}: creado`);
    }
    await pedir(job, 'irAContenido');
    await pedir(job, 'apagarAgente').catch(() => {});
    setPaso('ajustes de video');
    const aj = await pedir(job, 'ajustes', {}, 60000);
    log(`ajustes: ${String(aj.pastilla || '').replace(/\s+/g, ' ')}${aj.res720 === false || aj.dur8 === false ? ' · OJO: no veo 720p / 8 s en la pastilla, revisalo en Flow' : ''}`);

    const sb = Object.fromEntries((escenasStoryboard || []).map((e) => [e.n, e]));
    const escenas = (pack.escenas || []).filter((e) => e.rol !== 'cta');
    for (const esc of escenas) {
      const porSb = (sb[esc.escenaN]?.personajes || []).map((pid) => nombres[pid]).filter(Boolean);
      const porTexto = Object.values(nombres).filter((n) => new RegExp(`\\b${n}\\b`, 'i').test(esc.prompt || ''));
      const quienes = [...new Set([...porSb, ...porTexto])];
      const reg = { escenaN: esc.escenaN, estado: 'generando', fileRef: null };
      job.escenas.push(reg);
      setPaso(`escena ${esc.escenaN} (${escenas.indexOf(esc) + 1} de ${escenas.length})${quienes.length ? ` con @${quienes.join(' @')}` : ''}`);
      if (job.soloDescargar) {
        log(`escena ${esc.escenaN}: bajo el clip que ya está en Flow (sin volver a generar)`);
      } else {
        const g = await pedir(job, 'generar', { prompt: esc.prompt, personajes: quienes }, 120000);
        if (!g.disparado) log(`escena ${esc.escenaN}: no vi el tile nuevo, sigo igual`);
        const e = await pedir(job, 'esperarGeneracion', { maxSeg: 300 }, 330000);
        log(`escena ${esc.escenaN}: generada en ${e.seg} s`);
      }
      const desde = Date.now() - 5000;
      const dl = await pedir(job, 'descargarUltimo', {}, 60000);
      log(`escena ${esc.escenaN}: descarga pedida a Chrome (${dl.calidad || 'calidad por defecto'})`);
      // la espera la hace el background de la extensión mirando las descargas de Chrome (el nombre lo pone Flow, puede ser .tmp)
      const info = await pedir(job, 'esperarDescarga', { desde, maxSeg: 180 }, 200000);
      log(`escena ${esc.escenaN}: bajada a ${info.filename}`);
      const buffer = fs.readFileSync(info.filename);
      const toma = await guardarClip(buffer, `esc${esc.escenaN}-${path.basename(info.filename, path.extname(info.filename))}.mp4`);
      await agregarToma(esc.escenaN, toma);
      reg.estado = 'importada'; reg.fileRef = toma.fileRef;
      log(`escena ${esc.escenaN}: en el Rodaje (${toma.fileRef})`);
    }
    job.estado = 'listo'; job.fin = Date.now();
    setPaso('clips importados en el Rodaje');
  })().catch((e) => {
    job.estado = 'error'; job.error = e instanceof Error ? e.message : String(e); job.fin = Date.now();
    log(`ERROR: ${job.error}`);
  });
  return resumen(job);
}
