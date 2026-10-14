// Integración con SalesBot (2026-10-12, Lucas: "habilitale la integración a SalesBot"). Contrato v1 en
// base-compartida/salesbot/PEDIDO-A-MEDIA-STUDIO-medios-para-las-personalidades-2026-10-12.md, sección 6.
// Media Studio corre en la PC de Lucas, así que es el que llama: cada 25 s consulta los pedidos pendientes de SalesBot.
// - Todas las personalidades tienen imágenes y Media Studio no filtra ni juzga los pedidos (Lucas, 2026-10-12:
//   "solamente tenés que generar; todo lo demás corre por cuenta mía"): les suma lo profesional y los manda a Flow.
//   Cada personalidad tiene su cara: la fija la primera foto que la muestra, la pida quien la pida (Lucas en el panel o
//   la personalidad en una charla), y queda en server/salesbot-personajes.json (`personajeDe`, de index.mjs).
// - Media Studio no frena ningún pedido (Lucas, 2026-10-14: "tu rol no es poner freno de nada, tu rol es generar; si
//   alguien va a frenar algo, va a ser la herramienta que está atrás").
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
// volver a hacer un pedido de SalesBot que quedó con error
let rehacerLocal = null;
export const rehacerPedido = (id) => (rehacerLocal ? rehacerLocal(id) : Promise.reject(new Error('la integración con SalesBot no está activa')));

const estado = { activo: false, conectado: false, ultimaConsulta: null, ultimoError: '', atendidos: 0, rechazados: 0, enCurso: null };
export const estadoSalesbot = () => ({ ...estado, conCara: Object.keys(leerPermitidos().personajes || {}), cupo: cupoDeHoy() });


// nombre de carpeta para Cloudinary: minúsculas, sin acentos, guiones
const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');

// La primera foto que muestra a una personalidad fija su cara, la pida quien la pida. Se guarda qué medio de SalesBot fue:
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

// TOPE POR DÍA (Lucas, 2026-10-14: "¿cuál es el límite que le dejaste a cada bot por día? Yo diría 5 por ahora").
// Cuenta las fotos y videos ENTREGADOS que pidió cada bot desde una charla, por día de Argentina. Lo que pide Lucas
// desde el panel no cuenta. Se guarda en disco para que un reinicio no lo ponga en cero.
export const TOPE_POR_DIA = 5;
const CUPO = path.resolve('server/storage/salesbot-cupo.json');
const hoyART = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
const esDelBot = (pedido) => !!pedido.personalidad && !/^(panel|lucas)/i.test(String(pedido.origen || ''));
function leerCupo() {
  try { const c = JSON.parse(fs.readFileSync(CUPO, 'utf8')); if (c.dia === hoyART()) return c; } catch { /* sin cupo todavía */ }
  return { dia: hoyART(), porBot: {} };
}
const usadosHoy = (slugPersonalidad) => leerCupo().porBot[slugPersonalidad] || 0;
function sumarHoy(slugPersonalidad) {
  const c = leerCupo();
  c.porBot[slugPersonalidad] = (c.porBot[slugPersonalidad] || 0) + 1;
  fs.mkdirSync(path.dirname(CUPO), { recursive: true });
  fs.writeFileSync(CUPO, JSON.stringify(c, null, 1) + '\n');
}
export const cupoDeHoy = () => ({ tope: TOPE_POR_DIA, ...leerCupo() });

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
  // fabrica y contesta; `hacer` devuelve el archivo o {error} con el motivo
  const sinFlowAvisado = new Set();
  const fabricarYContestar = async (pedido, etiqueta, hacer) => {
    // Flow hace una cosa por vez en la pestaña de Lucas: si está ocupado (una pieza de la app), el pedido espera
    // (2026-10-14: un pedido rehecho a mano y uno de la consulta arrancaron a la vez en la misma pestaña: el "en curso"
    // se marca antes de cualquier espera y lo miran los dos caminos)
    if (estado.enCurso || ocupado()) { log(`pedido ${pedido.id}: Flow está ocupado; lo tomo en la próxima vuelta`); return; }
    // sin una pestaña de Flow abierta el pedido NO se toma: queda pendiente hasta que Lucas la abra (2026-10-13: el
    // pedido 28 esperó 10 minutos tomado y se cerró con error justo antes de que se abriera la pestaña)
    if (!flowListo()) { if (!sinFlowAvisado.has(pedido.id)) { sinFlowAvisado.add(pedido.id); log(`pedido ${pedido.id}: no hay una pestaña de Flow abierta; queda pendiente`); } return; }
    estado.enCurso = pedido.id;
    try { await tomar(pedido.id); } catch (e) { estado.enCurso = null; throw e; }
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
      if (!archivo.error && esDelBot(pedido)) sumarHoy(pedido.personalidad);
      if (archivo.error) estado.rechazados += 1; else estado.atendidos += 1;
      log(`${etiqueta} ${pedido.id}: ${archivo.error ? `no salió (${archivo.error})` : `entregado (${archivo.url})`}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await contestar(pedido.id, { error: `Media Studio no pudo fabricarlo: ${msg}` }).catch(() => {});
      log(`${etiqueta} ${pedido.id}: no salió (${msg})`);
    } finally { estado.enCurso = null; }
  };
  // Cómo se hace cada pedido. TODOS se hacen: da igual quién pide (Lucas en el panel, la personalidad en una charla), de
  // qué proyecto es y si la personalidad ya tiene cara. Acá no se rechaza nada: si algo no sale, es porque Flow no lo dio.
  const comoSeHace = (pedido) => {
    const texto = String(pedido.contexto || '').trim();
    const desdeElPanel = /^(panel|lucas)/i.test(String(pedido.origen || ''));
    // con texto, el texto manda. Si lo pidió la personalidad en una charla (SalesBot, 2026-10-12: "fue a andar a caballo
    // y le piden la foto"), la foto es de ella y va sola a esa charla; si todavía no tiene cara, esta foto se la fija
    if (texto) {
      const deElla = !!pedido.personalidad && !desdeElPanel;
      return { etiqueta: deElla ? 'pedido del bot' : 'pedido libre', motor: fabricarLibre, hacer: async () => {
        const personaje = pedido.personalidad ? await personajeDe(pedido) : null;
        return fabricarLibre({ pedido, personaje: personaje && deElla ? { ...personaje, esElla: true } : personaje, log, subir });
      } };
    }
    // sin texto: la personalidad en una situación (saludo, selfie...)
    if (pedido.personalidad) return { etiqueta: 'pedido', motor: fabricar, hacer: async () => fabricar({ pedido, personaje: await personajeDe(pedido), log, subir }) };
    // sin texto y sin personalidad: la situación sola, con quien ponga Flow
    return { etiqueta: 'pedido libre', motor: fabricarLibre, hacer: async () => fabricarLibre({ pedido: { ...pedido, contexto: descripcionDeSituacion(pedido.situacion, 'Una persona').descripcion }, personaje: null, log, subir }) };
  };
  const atender = async (pedido) => {
    const { etiqueta, motor, hacer } = comoSeHace(pedido);
    if (!motor) { log(`pedido ${pedido.id}: todavía no hay cómo fabricarlo; queda pendiente`); return; }
    // el tope del día que dictó Lucas para los pedidos que hace el bot desde una charla (2026-10-14: "5 por ahora")
    if (esDelBot(pedido) && usadosHoy(pedido.personalidad) >= TOPE_POR_DIA) {
      await tomar(pedido.id).catch(() => {});
      await contestar(pedido.id, { error: `${pedido.personalidad} ya mandó sus ${TOPE_POR_DIA} fotos de hoy (tope por día que puso Lucas)` }).catch(() => {});
      estado.rechazados += 1;
      log(`pedido ${pedido.id}: ${pedido.personalidad} llegó al tope de ${TOPE_POR_DIA} por día; no se genera`);
      return;
    }
    return fabricarYContestar(pedido, etiqueta, hacer);
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
  // volver a hacer un pedido que quedó con error: se fabrica igual que si llegara de nuevo. Si SalesBot ya no recibe el
  // resultado en ese pedido, el medio queda en el banco de la personalidad.
  rehacerLocal = async (id) => {
    // se marca "en curso" antes de cualquier espera, así la consulta normal no arranca otro pedido en la misma pestaña
    if (estado.enCurso || ocupado()) throw new Error('Flow está ocupado con otro pedido');
    estado.enCurso = `rehacer-${id}`;
    try {
      if (!clave) clave = await leerClave();
      // el pedido puede estar con error, otra vez pendiente (SalesBot lo reabrió) o tomado (se cortó a la mitad)
      let pedido = null;
      for (const e of ['error', 'pendiente', 'en_curso']) { pedido = ((await api(`/pedidos?estado=${e}`)).pedidos || []).find((p) => String(p.id) === String(id)) || null; if (pedido) break; }
      if (!pedido) throw new Error(`no encontré el pedido ${id} entre los que quedaron con error, pendientes o tomados`);
      await tomar(pedido.id).catch(() => {});   // pendiente: se toma para que la consulta normal no lo haga dos veces
      const { etiqueta, motor, hacer } = comoSeHace(pedido);
      if (!motor) throw new Error('todavía no hay cómo fabricarlo');
      const archivo = await hacer();
      if (archivo.error) { log(`${etiqueta} ${pedido.id}: rehecho, no salió (${archivo.error})`); return archivo; }
      const { _muestraLaCara, ...medio } = archivo;
      let medioId = null, entregadoEn = 'el pedido';
      try { medioId = (await contestar(pedido.id, { archivo: medio }))?.medio_id ?? null; }
      catch (e) {
        if (!pedido.personalidad) throw e;
        const r = await api('', { method: 'POST', body: JSON.stringify({ ...medio, kind: /^(jpe?g|png|webp)$/i.test(String(medio.formato || '')) ? 'imagen' : 'video', personalidad: pedido.personalidad, proyecto: pedido.proyecto, situacion: pedido.situacion || 'libre' }) });
        medioId = r?.id ?? null; entregadoEn = 'el banco de la personalidad';
      }
      if (_muestraLaCara && pedido.personalidad) guardarMedioCara(pedido.personalidad, medioId);
      if (esDelBot(pedido)) sumarHoy(pedido.personalidad);
      estado.atendidos += 1;
      log(`${etiqueta} ${pedido.id}: rehecho y entregado en ${entregadoEn} (${medio.url})`);
      return { ...medio, medio_id: medioId, entregadoEn };
    } finally { estado.enCurso = null; }
  };
  log(`integración activa: consulta los pedidos de SalesBot cada ${CADA_MS / 1000} s`);
  setTimeout(vuelta, 3000);
}
