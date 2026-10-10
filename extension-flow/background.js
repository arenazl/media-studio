// Puente Flow · background v3 (service worker). Es el que habla con Media Studio: cada 2,5 s le pide el próximo paso
// de la rutina y se lo manda por mensaje a UNA pestaña de flow.google.com (la del proyecto del job). Antes lo hacía
// el content script con un temporizador, y Chrome frena los temporizadores de una pestaña que no está a la vista:
// la rutina se dormía apenas el dueño cambiaba de pestaña. Acá el reloj corre en el worker, que no se frena.
// También cronometra las esperas que le pide el content script, y avisa cada descarga terminada (ruta final en
// disco) para que el servidor importe el clip al Rodaje.
const API = 'http://localhost:5301';
const FLOW = ['https://flow.google.com/*', 'https://labs.google/*'];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
let bucleActivo = false;
let jobActual = null;
let tabDelJob = null;

async function post(ruta, body) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`${API}${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) return true;
    } catch { /* servidor apagado o reiniciando */ }
    await dormir(1000);
  }
  return false;
}
async function tabsFlow() { try { return await chrome.tabs.query({ url: FLOW }); } catch { return []; } }

// una sola pestaña por job: la del proyecto si está, si no la activa, si no la última usada
async function elegirTab(paso) {
  const tabs = await tabsFlow();
  if (!tabs.length) return null;
  if (paso.jobId === jobActual && tabDelJob != null && tabs.some((t) => t.id === tabDelJob)) return tabDelJob;
  const url = paso.proyectoUrl;
  const t = (url && tabs.find((x) => (x.url || '').startsWith(url)))
    || tabs.find((x) => x.active)
    || [...tabs].sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
  jobActual = paso.jobId; tabDelJob = t.id;
  try { await chrome.tabs.update(t.id, { autoDiscardable: false }); } catch { /* sin permiso: sigue igual */ }
  return t.id;
}

function esperarCarga(tabId, ms = 60000) {
  return new Promise((resolve) => {
    const onUpd = (id, info) => { if (id === tabId && info.status === 'complete') fin(true); };
    const t = setTimeout(() => fin(false), ms);
    const fin = (ok) => { chrome.tabs.onUpdated.removeListener(onUpd); clearTimeout(t); resolve(ok); };
    chrome.tabs.onUpdated.addListener(onUpd);
  });
}

// manda el paso a la pestaña; si el content script todavía no está (pestaña cargando), reintenta un rato
async function enviarAPestana(tabId, paso) {
  const t0 = Date.now();
  let inyectado = false;
  for (;;) {
    try {
      const r = await chrome.tabs.sendMessage(tabId, { tipo: 'paso', paso });
      return r || { ok: false, error: 'la pestaña no devolvió resultado' };
    } catch (e) {
      const msg = String((e && e.message) || e);
      if (/Receiving end does not exist|Could not establish connection/i.test(msg) && Date.now() - t0 < 25000) {
        // la pestaña estaba abierta desde antes de instalar o recargar la extensión: se inyecta el content script a mano
        if (!inyectado) { inyectado = true; try { await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }); } catch { /* cargando: se reintenta */ } }
        await dormir(1000); continue;
      }
      if (/message port closed|back\/forward cache|keeping the extension port/i.test(msg)) {
        // la pestaña navegó en el medio del paso: se espera que cargue y se avisa
        await esperarCarga(tabId, 30000);
        await dormir(1500);
        const tab = await chrome.tabs.get(tabId).catch(() => null);
        return { ok: true, data: { recargada: true, url: tab ? tab.url : null } };
      }
      return { ok: false, error: msg };
    }
  }
}

// la descarga la hace Chrome: se busca la más nueva desde que se pidió y se espera a que termine (el nombre lo pone Flow,
// a veces <uuid>.tmp, así que no se filtra por extensión)
async function esperarDescargaChrome({ desde, maxSeg } = {}) {
  const t0 = Number(desde) || Date.now() - 10000;
  const limite = Date.now() + (Number(maxSeg) || 180) * 1000;
  let ultimo = null;
  while (Date.now() < limite) {
    const items = await chrome.downloads.search({ orderBy: ['-startTime'], limit: 5 });
    ultimo = items.find((i) => new Date(i.startTime).getTime() >= t0) || null;
    if (ultimo && ultimo.state === 'complete') return { ok: true, data: { filename: ultimo.filename, bytes: ultimo.fileSize, url: ultimo.finalUrl || ultimo.url, referrer: ultimo.referrer } };
    if (ultimo && ultimo.state === 'interrupted') return { ok: false, error: `Chrome interrumpió la descarga (${ultimo.error || 'sin detalle'}): ${ultimo.filename}` };
    await dormir(1500);
  }
  return { ok: false, error: ultimo ? `la descarga quedó en estado ${ultimo.state} (${ultimo.filename})` : 'Chrome no empezó ninguna descarga' };
}

async function ejecutar(paso) {
  // el service worker no se duerme mientras dura el paso (hay pasos de minutos: esperar la generación), y Media Studio
  // sigue viendo el latido aunque el bucle esté ocupado con este paso
  const vivo = setInterval(() => {
    chrome.runtime.getPlatformInfo().catch(() => {});
    post('/api/flow/puente/latido', { origen: 'background', version: chrome.runtime.getManifest().version, paso: paso.accion });
  }, 10000);
  let out;
  try {
    const tabId = await elegirTab(paso);
    if (tabId == null) out = { ok: false, error: 'no hay ninguna pestaña de flow.google.com abierta en Chrome' };
    else if (paso.accion === 'ir') {
      // la navegación la hace el worker: el content script muere con la página y no podría contestar
      const tab = await chrome.tabs.get(tabId);
      if ((tab.url || '') !== paso.args.url) { await chrome.tabs.update(tabId, { url: paso.args.url }); await esperarCarga(tabId); await dormir(1500); }
      const t2 = await chrome.tabs.get(tabId);
      out = { ok: true, data: { url: t2.url } };
    } else if (paso.accion === 'esperarDescarga') out = await esperarDescargaChrome(paso.args || {});
    else out = await enviarAPestana(tabId, paso);
  } catch (e) {
    out = { ok: false, error: String((e && e.message) || e) };
  } finally {
    clearInterval(vivo);
  }
  await post('/api/flow/puente/resultado', { jobId: paso.jobId, pasoId: paso.id, ...out });
}

async function bucle() {
  if (bucleActivo) return;
  bucleActivo = true;
  try {
    for (;;) {
      let paso = null;
      try {
        const tabs = await tabsFlow();
        const r = await fetch(`${API}/api/flow/puente/comando?origen=background&pestanas=${tabs.length}&v=${chrome.runtime.getManifest().version}`);
        if (r.ok) paso = (await r.json()).paso;
      } catch { /* Media Studio apagado: se sigue probando */ }
      if (paso) await ejecutar(paso);
      await chrome.runtime.getPlatformInfo().catch(() => {});
      await dormir(paso ? 200 : 2500);
    }
  } finally {
    bucleActivo = false;
  }
}

// esperas cronometradas para el content script (los temporizadores de una pestaña oculta se frenan; los del worker no)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.tipo === 'espera') { setTimeout(() => sendResponse({ ok: true }), Math.max(0, Math.min(60000, msg.ms | 0))); return true; }
  return false;
});

// cada descarga terminada desde Flow se avisa con su ruta final en disco
chrome.downloads.onChanged.addListener(async (delta) => {
  if (!delta.state || delta.state.current !== 'complete') return;
  try {
    const [item] = await chrome.downloads.search({ id: delta.id });
    if (!item) return;
    const deFlow = /flow\.google\.com|labs\.google|googleusercontent/.test(item.referrer || '') || /flow|veo/i.test(item.url || '');
    if (!deFlow && !/\.mp4$/i.test(item.filename || '')) return;
    await post('/api/flow/puente/descarga', { id: item.id, filename: item.filename, bytes: item.fileSize, referrer: item.referrer, url: item.finalUrl || item.url });
  } catch (e) {
    console.warn('[puente-flow] no pude avisar la descarga', e);
  }
});

// el bucle arranca con el worker y la alarma lo levanta si Chrome lo durmió
chrome.alarms.create('puente', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((a) => { if (a.name === 'puente') bucle(); });
chrome.runtime.onInstalled.addListener(() => bucle());
chrome.runtime.onStartup.addListener(() => bucle());
bucle();
