// Abre Flow en el Chrome de Lucas, solo (2026-10-13, Lucas: "armá una rutina que te autodispare el navegador, con mi
// autorización"). Se usa el perfil de Chrome que ya tiene su sesión de Google (por los créditos de Flow) y la extensión
// Puente Flow: no se toca ninguna clave, la sesión vive en el perfil. Si Chrome ya está abierto, sólo agrega la pestaña.
// Config en server/chrome-flow.json: { exe, perfil }.
// 2026-10-13, Lucas: "¿me explicás por qué estás abriendo 14 ventanas de Flow?": se abría en cada reinicio del backend
// y cada 90 s mientras la extensión no viera la pestaña. Ahora el respiro es de 5 minutos y queda EN DISCO (sobrevive
// reinicios), hay un tope de 3 aperturas por hora, y quien llama decide con faltaFlow() (flowPuente.mjs), que espera a
// que la extensión avise antes de dar por cerrado Chrome.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CONFIG = path.resolve('server/chrome-flow.json');
const ESTADO = path.resolve('server/storage/abrir-flow.json');   // { ultima, aperturas: [ts] }
const RESPIRO_MS = 5 * 60000;
const TOPE_POR_HORA = 3;

export function configChrome() {
  try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); } catch { return null; }
}
const leerEstado = () => { try { return JSON.parse(fs.readFileSync(ESTADO, 'utf8')); } catch { return { ultima: 0, aperturas: [] }; } };

// devuelve qué hizo (para el log del trabajo); nunca tira
export function abrirFlow(url = 'https://flow.google.com/', { forzar = false } = {}) {
  const cfg = configChrome();
  if (!cfg?.exe || !cfg?.perfil) return { abierto: false, motivo: 'falta server/chrome-flow.json (exe y perfil)' };
  if (!fs.existsSync(cfg.exe)) return { abierto: false, motivo: `no existe ${cfg.exe}` };
  const est = leerEstado();
  const ahora = Date.now();
  const recientes = (est.aperturas || []).filter((t) => ahora - t < 3600000);
  if (!forzar && ahora - (est.ultima || 0) < RESPIRO_MS) return { abierto: false, motivo: `ya se abrió hace ${Math.round((ahora - est.ultima) / 60000)} min; espero` };
  if (!forzar && recientes.length >= TOPE_POR_HORA) return { abierto: false, motivo: `ya abrí Flow ${TOPE_POR_HORA} veces en la última hora; no abro más (revisá Chrome)` };
  try {
    const p = spawn(cfg.exe, [`--profile-directory=${cfg.perfil}`, url], { detached: true, stdio: 'ignore' });
    p.unref();
    fs.mkdirSync(path.dirname(ESTADO), { recursive: true });
    fs.writeFileSync(ESTADO, JSON.stringify({ ultima: ahora, aperturas: [...recientes, ahora] }));
    return { abierto: true, motivo: `Chrome (${cfg.perfil}) abierto en ${url}` };
  } catch (e) { return { abierto: false, motivo: e instanceof Error ? e.message : String(e) }; }
}
