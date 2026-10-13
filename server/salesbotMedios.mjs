// Integración con SalesBot (2026-10-12, Lucas: "habilitale la integración a SalesBot"). Contrato v1 en
// base-compartida/salesbot/PEDIDO-A-MEDIA-STUDIO-medios-para-las-personalidades-2026-10-12.md, sección 6.
// Media Studio corre en la PC de Lucas, así que es el que llama: cada 25 s consulta los pedidos pendientes de SalesBot.
// - Todas las personalidades tienen imágenes y Media Studio no filtra ni juzga los pedidos (Lucas, 2026-10-12:
//   "solamente tenés que generar; todo lo demás corre por cuenta mía"): les suma lo profesional y los manda a Flow.
//   Cada personalidad tiene su cara: la fija la primera foto que Lucas le pide y queda en server/salesbot-personajes.json
//   (`personajeDe`, de index.mjs).
// - Los pedidos libres los escribe Lucas en el panel (origen "panel").
// La clave (MEDIA_STUDIO_KEY, Secret Manager de salesbot-prod) se lee con gcloud al arrancar y queda sólo en memoria.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://salesbot-api-agutddcp5q-uk.a.run.app/api/medios';
const CADA_MS = 25000;
const PERSONAJES = path.resolve('server/salesbot-personajes.json');

// lo que hace el personaje en cada situación (genérico: el personaje pone su cara, su ropa y su lugar)
export const ACCION_POR_SITUACION = {
  saludo: 'looks into the camera with a warm, natural smile and raises a hand in a friendly hello',
  buenos_dias: 'in soft morning light, holding a mate, looks at the camera and smiles as if saying good morning',
  selfie: 'holds the phone at arm\'s length in a front-camera selfie framing, relaxed and smiling, small natural movements',
  trabajando: 'is busy with a task at work, then glances at the camera with a quick, friendly smile',
  obra: 'stands in front of a public works site in progress and points at it with quiet pride',
  cena: 'sits at a dinner table under warm lamp light and raises a glass slightly toward the camera',
  despedida: 'smiles at the camera and waves goodbye',
};
// lo mismo en castellano, para la descripción que guarda SalesBot (el bot elige el medio por lo que se ve)
const SITUACION_ES = {
  saludo: 'saluda a cámara con una sonrisa y levanta la mano',
  buenos_dias: 'da los buenos días con un mate, con luz de mañana',
  selfie: 'se saca una selfie con el celular, relajado y sonriendo',
  trabajando: 'está trabajando y mira a cámara con una sonrisa',
  obra: 'muestra con orgullo una obra pública en marcha',
  cena: 'en una cena, levanta un poco la copa hacia la cámara',
  despedida: 'sonríe a cámara y saluda despidiéndose',
};
export const descripcionDeSituacion = (situacion, nombre) => ({
  descripcion: `${nombre} ${SITUACION_ES[situacion] || 'mira a cámara con una sonrisa'}.`,
  etiquetas: [String(situacion || '').replace(/_/g, ' '), String(nombre || '').toLowerCase()].filter(Boolean),
});
export const accionDeSituacion = (situacion, nombre) => `${nombre} ${ACCION_POR_SITUACION[situacion] || 'looks into the camera with a warm, natural smile'}.`;

// un pedido libre hecho desde la app (sin pasar por WhatsApp): lo arma iniciarSalesbotMedios cuando arranca
let libreLocal = null;
export const pedidoLibreLocal = (contexto, kind, extra = {}) => (libreLocal ? libreLocal(contexto, kind, extra) : Promise.reject(new Error('la integración con SalesBot no está activa')));

const estado = { activo: false, conectado: false, ultimaConsulta: null, ultimoError: '', atendidos: 0, rechazados: 0, enCurso: null };
export const estadoSalesbot = () => ({ ...estado, conCara: Object.keys(leerPermitidos().personajes || {}) });


// nombre de carpeta para Cloudinary: minúsculas, sin acentos, guiones
const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');

// La primera foto que muestra a una personalidad fija su cara (Lucas, 2026-10-12). Se guarda qué medio de SalesBot fue:
// si Lucas regenera ESA foto, la personalidad pierde la cara y la próxima foto le hace una nueva; si regenera otra, la
// cara se mantiene.
function guardarMedioCara(slugPersonalidad, medioId) {
  const todo = leerPermitidos();
  const p = todo.personajes?.[slugPersonalidad];
  if (!p || p.medioCara || medioId == null) return;
  p.medioCara = medioId;
  fs.writeFileSync(PERSONAJES, JSON.stringify(todo, null, 2) + '\n');
}
function olvidarCara(slugPersonalidad) {
  const todo = leerPermitidos();
  const p = todo.personajes?.[slugPersonalidad];
  if (!p) return;
  todo.personajes[slugPersonalidad] = { categoria: p.categoria, caraNro: (p.caraNro || 1) + 1 };
  fs.writeFileSync(PERSONAJES, JSON.stringify(todo, null, 2) + '\n');
}

function leerPermitidos() {
  try { return JSON.parse(fs.readFileSync(PERSONAJES, 'utf8')); } catch { return { personajes: {}, proyectos: {} }; }
}

function leerClave() {
  return new Promise((resolve) => {
    const p = spawn('gcloud', ['secrets', 'versions', 'access', 'latest', '--secret=MEDIA_STUDIO_KEY', '--project=salesbot-prod'], { shell: true });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.on('close', () => resolve(out.replace(/[\r\n]/g, '').trim()));
    p.on('error', () => resolve(''));
  });
}

export function iniciarSalesbotMedios({ fabricar, fabricarLibre, personajeDe, ocupado = () => false, flowListo = () => true, log = (m) => console.log('[media-studio] salesbot:', m) } = {}) {
  if (process.env.SALESBOT_MEDIOS === '0') { log('integración apagada (SALESBOT_MEDIOS=0)'); return; }
  let clave = '';
  const api = async (ruta, opciones = {}) => {
    const r = await fetch(`${BASE}${ruta}`, { ...opciones, headers: { 'Content-Type': 'application/json', 'X-Media-Key': clave, ...(opciones.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${ruta}: ${r.status} ${d.error || ''}`.trim());
    return d;
  };
  // sube un archivo a SalesBot (multipart a su Cloudinary) y devuelve {url, kind, formato, ancho, alto, duracion_s}.
  // `carpeta` ({proyecto, producto, nombre}) ordena el archivo en salesbot/<proyecto>/<producto>/<nombre>-<sufijo>
  const subir = async (buffer, nombre, tipo, carpeta = {}) => {
    const fd = new FormData();
    fd.append('file', new Blob([buffer], { type: tipo }), nombre);
    for (const campo of ['proyecto', 'producto', 'nombre']) { const v = slug(carpeta[campo]); if (v) fd.append(campo, v); }
    const r = await fetch(`${BASE}/subir`, { method: 'POST', headers: { 'X-Media-Key': clave }, body: fd });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.url) throw new Error(`no se pudo subir el archivo a SalesBot: ${r.status} ${d.error || ''}`.trim());
    return d;
  };
  const tomar = (id) => api(`/pedidos/${id}/tomar`, { method: 'POST' });
  const contestar = (id, cuerpo) => api(`/pedidos/${id}/resultado`, { method: 'POST', body: JSON.stringify(cuerpo) });
  const rechazar = async (pedido, motivo) => { await tomar(pedido.id); await contestar(pedido.id, { error: motivo }); estado.rechazados += 1; log(`pedido ${pedido.id}: ${motivo}`); };
  // fabrica y contesta; `hacer` devuelve el archivo o {error} con el motivo
  const sinFlowAvisado = new Set();
  const fabricarYContestar = async (pedido, etiqueta, hacer) => {
    // Flow hace una cosa por vez en la pestaña de Lucas: si está ocupado (una pieza de la app), el pedido espera
    if (ocupado()) { log(`pedido ${pedido.id}: Flow está ocupado; lo tomo en la próxima vuelta`); return; }
    // sin una pestaña de Flow abierta el pedido NO se toma: queda pendiente hasta que Lucas la abra (2026-10-13: el
    // pedido 28 esperó 10 minutos tomado y se cerró con error justo antes de que se abriera la pestaña)
    if (!flowListo()) { if (!sinFlowAvisado.has(pedido.id)) { sinFlowAvisado.add(pedido.id); log(`pedido ${pedido.id}: no hay una pestaña de Flow abierta; queda pendiente`); } return; }
    await tomar(pedido.id);
    estado.enCurso = pedido.id;
    try {
      // regenerar la foto que fijó la cara: la personalidad pierde esa cara y esta foto le hace una nueva
      const ya = pedido.personalidad ? leerPermitidos().personajes?.[pedido.personalidad] : null;
      if (pedido.regenerar_medio != null && ya?.medioCara != null && String(ya.medioCara) === String(pedido.regenerar_medio)) {
        olvidarCara(pedido.personalidad);
        log(`pedido ${pedido.id}: regenera la foto que fijó la cara de "${pedido.personalidad}"; le hago una cara nueva`);
      }
      const archivo = await hacer();
      // _muestraLaCara es nuestro (si la foto muestra a la personalidad): no viaja a SalesBot
      const { _muestraLaCara, ...paraSalesbot } = archivo;
      const r = await contestar(pedido.id, archivo.error ? { error: archivo.error } : { archivo: paraSalesbot });
      if (!archivo.error && _muestraLaCara && pedido.personalidad) guardarMedioCara(pedido.personalidad, r?.medio_id);
      if (archivo.error) estado.rechazados += 1; else estado.atendidos += 1;
      log(`${etiqueta} ${pedido.id}: ${archivo.error ? `no se hace (${archivo.error})` : `entregado (${archivo.url})`}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await contestar(pedido.id, { error: `Media Studio no pudo fabricarlo: ${msg}` }).catch(() => {});
      log(`${etiqueta} ${pedido.id}: no salió (${msg})`);
    } finally { estado.enCurso = null; }
  };
  const atender = async (pedido) => {
    // pedido libre (2026-10-12, Lucas usa el bot como intermediario): lo escribe Lucas en el panel de SalesBot (origen
    // "panel"), con o sin personalidad; el texto manda y, si hay personalidad, puede aparecer con su cara. Los pedidos
    // del bot (personalidad + situación) siguen por el camino de abajo.
    const desdeElPanel = /^(panel|lucas)/i.test(String(pedido.origen || ''));
    const libre = String(pedido.contexto || '').trim() && (pedido.personalidad || pedido.proyecto === 'libre' || pedido.proyecto === 'munify');
    if (libre && !pedido.personalidad && !desdeElPanel) return rechazar(pedido, 'Los pedidos libres son sólo de Lucas, desde el panel.');
    if (libre && desdeElPanel) {
      if (!fabricarLibre) return;
      return fabricarYContestar(pedido, 'pedido libre', async () => fabricarLibre({ pedido, personaje: pedido.personalidad ? await personajeDe(pedido) : null, log, subir }));
    }
    // la personalidad pide en la charla una foto suya que no tiene (SalesBot, 2026-10-12: "fue a andar a caballo y le
    // piden la foto"): el mismo motor que los libres, siempre con ella en la foto y con su cara. Sin cara todavía, se
    // contesta con el motivo: la primera foto la genera Lucas desde el panel. La foto va sola a esa charla.
    if (libre && pedido.personalidad) {
      if (!fabricarLibre) return;
      return fabricarYContestar(pedido, 'pedido del bot', async () => {
        const personaje = await personajeDe(pedido);
        if (personaje.sinCara) return { error: `${personaje.nombre} todavía no tiene cara: la primera foto se la genera Lucas desde el panel.` };
        return fabricarLibre({ pedido, personaje: { ...personaje, esElla: true }, log, subir });
      });
    }
    if (!pedido.personalidad) return rechazar(pedido, `Media Studio necesita la personalidad para saber a quién mostrar ("${pedido.proyecto || 'sin proyecto'}").`);
    if (!fabricar) { log(`pedido ${pedido.id}: todavía no hay cómo fabricarlo; queda pendiente`); return; }
    return fabricarYContestar(pedido, 'pedido', async () => fabricar({ pedido, personaje: await personajeDe(pedido), log, subir }));
  };
  const vuelta = async () => {
    try {
      if (!clave) clave = await leerClave();
      if (!clave) throw new Error('no pude leer MEDIA_STUDIO_KEY con gcloud (¿sesión de gcloud vencida?)');
      const { pedidos = [] } = await api('/pedidos?estado=pendiente');
      estado.conectado = true; estado.ultimaConsulta = Date.now(); estado.ultimoError = '';
      // de a uno: Flow genera una cosa por vez en la pestaña de Lucas
      for (const p of pedidos) { if (estado.enCurso) break; await atender(p).catch((e) => { estado.ultimoError = e.message; log(`pedido ${p.id}: ${e.message}`); }); }
    } catch (e) {
      estado.conectado = false; estado.ultimoError = e instanceof Error ? e.message : String(e);
      if (/401/.test(estado.ultimoError)) clave = '';   // la clave pudo rotar: se vuelve a leer en la próxima vuelta
    } finally {
      setTimeout(vuelta, CADA_MS);
    }
  };
  estado.activo = true;
  // un pedido desde la app; con personalidad, el medio queda en su banco de SalesBot (POST /api/medios) y, si la muestra
  // por primera vez, le fija la cara
  libreLocal = async (contexto, kind, extra = {}) => {
    if (!clave) clave = await leerClave();
    const pedido = { id: `local-${Date.now().toString(36)}`, contexto, kind: kind || 'video', proyecto: extra.proyecto || (extra.personalidad ? null : 'libre'), personalidad: extra.personalidad || null, nombre_agente: extra.nombre_agente, categoria: extra.categoria };
    const personaje = pedido.personalidad ? await personajeDe(pedido) : null;
    const archivo = await fabricarLibre({ pedido, personaje, log, subir });
    if (archivo.error || !pedido.personalidad) return archivo;
    const { _muestraLaCara, ...medio } = archivo;
    const r = await api('', { method: 'POST', body: JSON.stringify({ ...medio, kind: /^(jpe?g|png|webp)$/i.test(String(medio.formato || '')) ? 'imagen' : 'video', personalidad: pedido.personalidad, proyecto: pedido.proyecto, situacion: 'libre' }) });
    if (_muestraLaCara) guardarMedioCara(pedido.personalidad, r?.id);
    return { ...medio, medio_id: r?.id };
  };
  log(`integración activa: consulta los pedidos de SalesBot cada ${CADA_MS / 1000} s`);
  setTimeout(vuelta, 3000);
}
