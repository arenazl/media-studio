// Integración con SalesBot (2026-10-12, Lucas: "habilitale la integración a SalesBot"). Contrato v1 en
// base-compartida/salesbot/PEDIDO-A-MEDIA-STUDIO-medios-para-las-personalidades-2026-10-12.md, sección 6.
// Media Studio corre en la PC de Lucas, así que es el que llama: cada 25 s consulta los pedidos pendientes de SalesBot.
// - Un pedido de un personaje que está en la lista de ficticios acordados (server/salesbot-personajes.json) se fabrica
//   (función `fabricar`, que da la URL pública del archivo) y se contesta con el resultado.
// - Un pedido de cualquier otro personaje se contesta con {error} y el motivo: no se fabrican medios de personas reales
//   ni de las personalidades de levante/sexting (lo que acordó Lucas).
// La clave (MEDIA_STUDIO_KEY, Secret Manager de salesbot-prod) se lee con gcloud al arrancar y queda sólo en memoria.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://salesbot-api-agutddcp5q-uk.a.run.app/api/medios';
const CADA_MS = 25000;
const PERSONAJES = path.resolve('server/salesbot-personajes.json');

const estado = { activo: false, conectado: false, ultimaConsulta: null, ultimoError: '', atendidos: 0, rechazados: 0, enCurso: null };
export const estadoSalesbot = () => ({ ...estado, permitidos: Object.keys(leerPermitidos().personajes || {}) });

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

export function iniciarSalesbotMedios({ fabricar, log = (m) => console.log('[media-studio] salesbot:', m) } = {}) {
  if (process.env.SALESBOT_MEDIOS === '0') { log('integración apagada (SALESBOT_MEDIOS=0)'); return; }
  let clave = '';
  const api = async (ruta, opciones = {}) => {
    const r = await fetch(`${BASE}${ruta}`, { ...opciones, headers: { 'Content-Type': 'application/json', 'X-Media-Key': clave, ...(opciones.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${ruta}: ${r.status} ${d.error || ''}`.trim());
    return d;
  };
  const atender = async (pedido) => {
    const permitidos = leerPermitidos();
    const personaje = pedido.personalidad ? permitidos.personajes?.[pedido.personalidad] : null;
    const proyecto = !pedido.personalidad && pedido.proyecto ? permitidos.proyectos?.[pedido.proyecto] : null;
    if (!personaje && !proyecto) {
      await api(`/pedidos/${pedido.id}/tomar`, { method: 'POST' });
      const quien = pedido.personalidad || pedido.proyecto || '(sin personaje)';
      await api(`/pedidos/${pedido.id}/resultado`, { method: 'POST', body: JSON.stringify({ error: `Media Studio sólo fabrica medios de personajes ficticios acordados con Lucas; "${quien}" no está en su lista. No se hacen fotos ni videos de personas reales ni de levante/sexting.` }) });
      estado.rechazados += 1;
      log(`pedido ${pedido.id} (${quien} · ${pedido.situacion}): no está en la lista de ficticios; contestado con el motivo`);
      return;
    }
    if (!fabricar) { log(`pedido ${pedido.id}: el personaje está permitido pero todavía no hay cómo subir el archivo; queda pendiente`); return; }
    await api(`/pedidos/${pedido.id}/tomar`, { method: 'POST' });
    estado.enCurso = pedido.id;
    try {
      const archivo = await fabricar({ pedido, personaje, proyecto, log });
      await api(`/pedidos/${pedido.id}/resultado`, { method: 'POST', body: JSON.stringify({ archivo }) });
      estado.atendidos += 1;
      log(`pedido ${pedido.id}: entregado (${archivo.url})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await api(`/pedidos/${pedido.id}/resultado`, { method: 'POST', body: JSON.stringify({ error: `Media Studio no pudo fabricarlo: ${msg}` }) }).catch(() => {});
      log(`pedido ${pedido.id}: no salió (${msg})`);
    } finally { estado.enCurso = null; }
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
  log(`integración activa: consulta los pedidos de SalesBot cada ${CADA_MS / 1000} s`);
  setTimeout(vuelta, 3000);
}
