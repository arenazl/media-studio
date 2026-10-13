// Abre Flow en el Chrome de Lucas, solo (2026-10-13, Lucas: "armá una rutina que te autodispare el navegador, con mi
// autorización"). Se usa el perfil de Chrome que ya tiene su sesión de Google (por los créditos de Flow) y la extensión
// Puente Flow: no se toca ninguna clave, la sesión vive en el perfil. Si Chrome ya está abierto, sólo agrega la pestaña.
// Config en server/chrome-flow.json: { exe, perfil }. Hay un respiro entre aperturas para no abrir pestañas en cadena.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CONFIG = path.resolve('server/chrome-flow.json');
const RESPIRO_MS = 90000;
let ultima = 0;

export function configChrome() {
  try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); } catch { return null; }
}

// devuelve qué hizo (para el log del trabajo); nunca tira
export function abrirFlow(url = 'https://flow.google.com/', { forzar = false } = {}) {
  const cfg = configChrome();
  if (!cfg?.exe || !cfg?.perfil) return { abierto: false, motivo: 'falta server/chrome-flow.json (exe y perfil)' };
  if (!fs.existsSync(cfg.exe)) return { abierto: false, motivo: `no existe ${cfg.exe}` };
  if (!forzar && Date.now() - ultima < RESPIRO_MS) return { abierto: false, motivo: `ya se abrió hace ${Math.round((Date.now() - ultima) / 1000)} s; espero` };
  try {
    const p = spawn(cfg.exe, [`--profile-directory=${cfg.perfil}`, url], { detached: true, stdio: 'ignore' });
    p.unref();
    ultima = Date.now();
    return { abierto: true, motivo: `Chrome (${cfg.perfil}) abierto en ${url}` };
  } catch (e) { return { abierto: false, motivo: e instanceof Error ? e.message : String(e) }; }
}
