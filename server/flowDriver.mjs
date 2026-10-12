// Rutina AUTOMÁTICA Media Studio → Google Flow (2026-10-09). Hace con Playwright lo que Lucas hacía con el mouse:
// abre un Chrome propio con perfil persistente (la sesión de Google queda guardada después del primer login),
// entra al proyecto de Flow (o crea uno), crea los personajes del pack, pone los ajustes (Vídeo · Ingredientes ·
// 9:16 · 720p · 8 s · x1 · Veo 3.1 Fast), genera un clip por escena con el personaje enganchado por @, espera,
// baja el clip en 720p y lo deja en el Rodaje del comercial. Todo lo que hace lo escribe en el log del job.
// Mapa de la interfaz relevado a mano: docs/16-montaje-flow/02-rutina-flow-mapa.md.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PERFIL = process.env.FLOW_CHROME_PROFILE || path.resolve('.flow-chrome');
const DESCARGAS = process.env.FLOW_DESCARGAS || path.resolve('renders/flow-auto');
const FLOW = 'https://flow.google.com';

const jobs = new Map();
let contextoVivo = null;

export function listarJobs() { return [...jobs.values()].map(resumen); }
export function verJob(id) { const j = jobs.get(id); return j ? resumen(j) : null; }
function resumen(j) { return { id: j.id, estado: j.estado, paso: j.paso, log: j.log.slice(-60), escenas: j.escenas, error: j.error, flowProjectUrl: j.flowProjectUrl, inicio: j.inicio, fin: j.fin }; }

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// nombre de personaje en Flow: la PRIMERA palabra, sin acentos (se lo llama con @ y tiene que ser una sola palabra)
const slug = (s) => (String(s || '').trim().split(/\s+/)[0] || 'Personaje').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '').slice(0, 24) || 'Personaje';

// Siembra el perfil propio con la sesión de Google del Chrome del dueño (misma cuenta de Windows: las cookies se
// descifran igual). Así la rutina no pide login ni la primera vez. Se copia sólo lo que hace a la sesión.
function sembrarPerfil(log) {
  const ya = path.join(PERFIL, 'Default', 'Network', 'Cookies');
  if (fs.existsSync(ya)) return;
  const base = path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');
  if (!fs.existsSync(path.join(base, 'Local State'))) { log('no encontré el Chrome del dueño para copiar la sesión; va a pedir login'); return; }
  let perfil = 'Default';
  try { perfil = JSON.parse(fs.readFileSync(path.join(base, 'Local State'), 'utf8'))?.profile?.last_used || 'Default'; } catch { /* Default */ }
  const archivos = ['Local State', `${perfil}/Preferences`, `${perfil}/Secure Preferences`, `${perfil}/Network/Cookies`, `${perfil}/Cookies`, `${perfil}/Login Data`, `${perfil}/Web Data`, `${perfil}/Local Storage`];
  let copiados = 0;
  for (const rel of archivos) {
    const src = path.join(base, rel);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(PERFIL, rel.replace(`${perfil}/`, 'Default/'));
    try { fs.cpSync(src, dst, { recursive: true, force: true }); copiados += 1; } catch (e) { log(`no se pudo copiar ${rel}: ${e.message}`); }
  }
  log(`sesión de Google copiada del perfil "${perfil}" (${copiados} archivos)`);
}

async function abrirChrome(log) {
  if (contextoVivo && !contextoVivo.__cerrado) return contextoVivo;
  fs.mkdirSync(PERFIL, { recursive: true });
  fs.mkdirSync(DESCARGAS, { recursive: true });
  sembrarPerfil(log);
  log(`abriendo Chrome (perfil ${PERFIL})`);
  const ctx = await chromium.launchPersistentContext(PERFIL, {
    channel: 'chrome', headless: false, viewport: { width: 1360, height: 900 }, acceptDownloads: true,
    args: ['--disable-blink-features=AutomationControlled', '--lang=es-AR', '--window-size=1360,900'],
    ignoreDefaultArgs: ['--enable-automation'],
  });
  ctx.on('close', () => { contextoVivo = null; });
  contextoVivo = ctx;
  return ctx;
}

async function esperarLogin(page, log) {
  // Con sesión, flow.google.com muestra la galería de proyectos ("Nuevo proyecto"). Sin sesión, pide cuenta de Google.
  for (let i = 0; i < 120; i++) {
    if (await page.getByText(/Nuevo proyecto|New project/i).first().isVisible().catch(() => false)) return true;
    if (i === 0) log('esperando que entres a Google en la ventana de Chrome (una sola vez)');
    await espera(5000);
  }
  throw new Error('no se completó el login de Google en 10 minutos');
}

async function abrirProyecto(page, job, log) {
  if (job.flowProjectUrl) {
    await page.goto(job.flowProjectUrl, { waitUntil: 'domcontentloaded' });
    await page.getByText(/Caracteres|Characters/).first().waitFor({ timeout: 60000 });
    log(`proyecto de Flow abierto: ${job.flowProjectUrl}`);
    return;
  }
  await page.goto(FLOW, { waitUntil: 'domcontentloaded' });
  await esperarLogin(page, log);
  await page.getByText(/Nuevo proyecto|New project/i).first().click();
  await page.waitForURL(/\/project\//, { timeout: 60000 });
  await page.getByText(/Caracteres|Characters/).first().waitFor({ timeout: 60000 });
  job.flowProjectUrl = page.url();
  log(`proyecto de Flow creado: ${job.flowProjectUrl}`);
  await cerrarAgente(page, log);
}

async function cerrarAgente(page, log) {
  // El panel del Agente ("¿Qué quieres crear?" a la derecha) se cierra con su X; si no está, no pasa nada.
  const x = page.locator('button[aria-label*="errar"], button[aria-label*="lose"]').first();
  if (await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); log('panel del agente cerrado'); }
}

async function irATodoElContenido(page) {
  const item = page.getByText(/Todo el contenido|All media/).first();
  if (await item.isVisible().catch(() => false)) { await item.click(); await espera(800); }
}

// ── personajes ──────────────────────────────────────────────────────────────────────────────────
async function personajesExistentes(page) {
  await page.getByText(/^Caracteres$|^Characters$/).first().click();
  await espera(1500);
  const nombres = await page.locator('main, [role="main"], body').first().innerText().catch(() => '');
  return nombres;
}

async function crearPersonaje(page, nombre, promptImagen, log) {
  await page.getByText(/^Caracteres$|^Characters$/).first().click();
  await espera(1200);
  const existente = await page.getByText(new RegExp(`^${nombre}$`, 'i')).first().isVisible().catch(() => false);
  if (existente) { log(`personaje ${nombre}: ya existía`); return; }
  const nuevo = page.getByText(/Nuevo personaje|New character/i).first();
  if (await nuevo.isVisible().catch(() => false)) await nuevo.click();
  const caja = page.getByPlaceholder(/Describe tu personaje|Describe your character/i).first();
  await caja.waitFor({ timeout: 30000 });
  await caja.click();
  await caja.fill(promptImagen);
  await espera(300);
  // la flecha de enviar es el último botón del mismo contenedor de la caja
  const contenedor = caja.locator('xpath=ancestor::*[.//button][1]');
  await contenedor.locator('button').last().click();
  log(`personaje ${nombre}: generando la imagen`);
  // termina cuando aparece el título editable "Personaje sin nombre" y desaparece el porcentaje
  const titulo = page.getByText(/Personaje sin nombre|Untitled character/i).first();
  await titulo.waitFor({ timeout: 180000 });
  for (let i = 0; i < 90; i++) {
    const t = await page.locator('body').innerText().catch(() => '');
    if (!/\b\d{1,2}\s?%/.test(t)) break;
    await espera(2000);
  }
  await espera(1500);
  // nombre: el lápiz al lado del título
  await titulo.click();
  const lapiz = titulo.locator('xpath=following-sibling::*[1]');
  if (await lapiz.isVisible().catch(() => false)) await lapiz.click().catch(() => {});
  const editable = page.locator('input:visible, [contenteditable="true"]:visible').first();
  await editable.waitFor({ timeout: 10000 });
  await editable.fill('');
  await editable.type(nombre, { delay: 30 });
  await page.keyboard.press('Enter');
  await espera(600);
  const listo = page.getByRole('button', { name: /^Listo$|^Done$/ }).first();
  if (await listo.isVisible().catch(() => false)) await listo.click();
  await espera(1200);
  log(`personaje ${nombre}: creado`);
}

// ── ajustes de la caja de prompt ─────────────────────────────────────────────────────────────────
async function cajaPrompt(page) {
  const caja = page.getByPlaceholder(/Qué quieres crear|What do you want to create/i).first();
  await caja.waitFor({ timeout: 30000 });
  return caja;
}

async function apagarAgente(page, log) {
  const pill = page.getByText(/^Agente$|^Agent$/).first();
  if (!(await pill.isVisible().catch(() => false))) return;
  const claro = await pill.evaluate((el) => {
    const b = el.closest('button') || el;
    const c = getComputedStyle(b).backgroundColor.match(/\d+/g)?.map(Number) || [0, 0, 0];
    return (c[0] + c[1] + c[2]) / 3 > 140;
  }).catch(() => false);
  if (claro) { await pill.click(); log('agente apagado'); await espera(600); }
}

async function ponerAjustes(page, log) {
  const caja = await cajaPrompt(page);
  const cont = caja.locator('xpath=ancestor::*[.//button][1]');
  const pastilla = cont.getByText(/V[ií]deo|Imagen|Image|Video/).first();
  await pastilla.click();
  await espera(600);
  const clic = async (re) => { const b = page.getByText(re).first(); if (await b.isVisible().catch(() => false)) { await b.click(); await espera(250); } };
  await clic(/^V[ií]deo$|^Video$/);
  await clic(/^Ingredientes$|^Ingredients$/);
  await clic(/^9:16$/);
  // modelo: el desplegable; elegir Veo 3.1 Fast si está, si no Veo 3.1
  const combo = page.locator('[role="combobox"], button:has-text("Omni"), button:has-text("Veo")').first();
  if (await combo.isVisible().catch(() => false)) {
    await combo.click(); await espera(500);
    const fast = page.getByText(/Veo 3\.1.*Fast/i).first();
    const veo = page.getByText(/Veo 3\.1/i).first();
    if (await fast.isVisible().catch(() => false)) await fast.click();
    else if (await veo.isVisible().catch(() => false)) await veo.click();
    await espera(300);
  }
  await clic(/^720p$/);
  await clic(/^8 s$|^8s$/);
  await clic(/^x1$/);
  await page.keyboard.press('Escape');
  await espera(400);
  const resumenPill = await pastilla.innerText().catch(() => '?');
  log(`ajustes: ${resumenPill.replace(/\s+/g, ' ')}`);
}

// ── una escena ──────────────────────────────────────────────────────────────────────────────────
async function tilesCount(page) { return page.locator('video, [style*="background-image"]').count().catch(() => 0); }

async function generarEscena(page, esc, personajes, log) {
  const caja = await cajaPrompt(page);
  await caja.click();
  await page.keyboard.press('Control+A'); await page.keyboard.press('Delete');
  for (const nombre of personajes) {
    await page.keyboard.type('@', { delay: 40 });
    const buscador = page.getByPlaceholder(/Buscar recursos|Search/i).first();
    await buscador.waitFor({ timeout: 15000 });
    const item = page.getByText(new RegExp(`^${nombre}$`, 'i')).first();
    await item.waitFor({ timeout: 15000 });
    await item.click();
    const agregar = page.getByText(/Añadir a petición|Add to prompt/i).first();
    await agregar.waitFor({ timeout: 15000 });
    await agregar.click();
    await espera(500);
    log(`escena ${esc.escenaN}: personaje @${nombre} enganchado`);
  }
  await page.keyboard.type(' ' + esc.prompt, { delay: 2 });
  await espera(500);
  const antes = await page.locator('body').innerText().catch(() => '');
  const cont = caja.locator('xpath=ancestor::*[.//button][1]');
  const flecha = cont.locator('button').last();
  await flecha.click();
  await espera(2500);
  let despues = await page.locator('body').innerText().catch(() => '');
  if (!/\b\d{1,2}\s?%/.test(despues) && (await caja.inputValue().catch(() => '')).length > 0) {
    log(`escena ${esc.escenaN}: la flecha no disparó, segundo intento`);
    await flecha.click();
    await espera(2500);
  }
  log(`escena ${esc.escenaN}: generando`);
  for (let i = 0; i < 150; i++) {
    const t = await page.locator('body').innerText().catch(() => '');
    if (i > 2 && !/\b\d{1,2}\s?%/.test(t)) break;
    await espera(2000);
  }
  await espera(1500);
  log(`escena ${esc.escenaN}: lista`);
  void antes; void despues;
}

async function bajarUltimoClip(page, destino, log) {
  // el clip más nuevo es el primer tile de la grilla: hover → Más → Descargar → 720p
  const tile = page.locator('main img, main video').first();
  await tile.hover();
  await espera(500);
  const mas = page.getByRole('button', { name: /^Más$|^More$/ }).first();
  if (await mas.isVisible().catch(() => false)) await mas.click();
  else { const box = await tile.boundingBox(); await page.mouse.click(box.x + box.width - 14, box.y + 16); }
  await page.getByText(/^Descargar$|^Download$/).first().click();
  await espera(500);
  const [descarga] = await Promise.all([
    page.waitForEvent('download', { timeout: 120000 }),
    page.getByText(/^720p/).first().click(),
  ]);
  await descarga.saveAs(destino);
  log(`clip bajado: ${path.basename(destino)}`);
}

// ── el job entero ───────────────────────────────────────────────────────────────────────────────
export function iniciarJob({ projectId, reelId, pack, escenasStoryboard, flowProjectUrl, guardarClip, agregarToma }) {
  const id = `flow-${Date.now()}`;
  const job = { id, projectId, reelId, estado: 'iniciando', paso: '', log: [], escenas: [], error: null, flowProjectUrl: flowProjectUrl || null, inicio: Date.now(), fin: null };
  jobs.set(id, job);
  const log = (m) => { const l = `${new Date().toTimeString().slice(0, 8)} ${m}`; job.log.push(l); console.log('[media-studio] flow:', m); };
  const setPaso = (p) => { job.paso = p; log(p); };

  (async () => {
    const ctx = await abrirChrome(log);
    const page = ctx.pages()[0] || (await ctx.newPage());
    job.estado = 'corriendo';
    setPaso('abriendo Flow');
    await page.goto(FLOW, { waitUntil: 'domcontentloaded' });
    await esperarLogin(page, log);
    await abrirProyecto(page, job, log);

    // personajes del pack (nombre de una palabra, sin acentos)
    const nombres = {};
    for (const p of pack.personajes || []) {
      const nombre = slug(p.nombre || p.id);
      nombres[p.id] = nombre;
      setPaso(`personaje ${nombre}`);
      await crearPersonaje(page, nombre, p.promptImagen, log);
    }
    await irATodoElContenido(page);
    await cerrarAgente(page, log);
    await apagarAgente(page, log);
    setPaso('ajustes de video');
    await ponerAjustes(page, log);

    // escenas (la de cierre no se genera: la placa la pone el montaje)
    const sb = Object.fromEntries((escenasStoryboard || []).map((e) => [e.n, e]));
    const escenas = (pack.escenas || []).filter((e) => e.rol !== 'cta');
    for (const esc of escenas) {
      // personajes de la escena: los del storyboard + los que el prompt nombra (el storyboard suele dejar [] en los b-roll)
      const porStoryboard = (sb[esc.escenaN]?.personajes || []).map((pid) => nombres[pid]).filter(Boolean);
      const porTexto = Object.values(nombres).filter((n) => new RegExp(`\b${n}\b`, 'i').test(esc.prompt || ''));
      const quienes = [...new Set([...porStoryboard, ...porTexto])];
      const reg = { escenaN: esc.escenaN, estado: 'generando', fileRef: null };
      job.escenas.push(reg);
      setPaso(`escena ${esc.escenaN} de ${escenas.length}`);
      await generarEscena(page, esc, quienes, log);
      const destino = path.join(DESCARGAS, `${projectId}-esc${esc.escenaN}-${Date.now()}.mp4`);
      await bajarUltimoClip(page, destino, log);
      const buffer = fs.readFileSync(destino);
      const toma = await guardarClip(buffer, path.basename(destino));
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
