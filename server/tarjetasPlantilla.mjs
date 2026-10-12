// TARJETAS CON PLANTILLA (2026-10-11): el método que pidió Lucas para los mockups animados de cualquier app.
// - El PROCEDIMIENTO es fijo y es código: src/remotion/apps/_base/Marco.tsx (resolución, animación, marco, piezas, medidas).
// - El BRANDING sale del kit sin IA: colores, fuentes, logo, lema y dominio entran a la plantilla (marcaDesdeKit).
// - El AGENTE escribe una tarjeta por pantalla MIRANDO su captura y sus estados (con Read), con la descripción de la
//   animación del kit y la vara de Munify a la vista. Una llamada por pantalla, varias en paralelo, pedido corto.
// Lucas: "le tenías que dejar las capturas más la descripción de la acción, la referencia de Munify y el procedimiento,
// para que sólo le cambie el branding y los forms" · "con eso pasamos de 30 minutos a 3".
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { renderCuadro } from './renderRemotion.mjs';

const S = (v) => (typeof v === 'string' ? v.trim() : '');
const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);
const ident = (id) => `T_${String(id).replace(/[^a-zA-Z0-9]/g, '_')}`;

export const dirApp = (root, appId) => path.join(root, 'src', 'remotion', 'apps', appId);
export function catalogoEscrito(root, appId) {
  const f = path.join(dirApp(root, appId), 'catalogo.json');
  if (!fs.existsSync(f) || !fs.existsSync(path.join(dirApp(root, appId), 'Tarjetas.tsx'))) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
}

// El registro que lee la composición AppTarjetas: una línea por app que ya tiene tarjetas escritas.
export function regenerarRegistro(root) {
  const base = path.join(root, 'src', 'remotion', 'apps');
  const apps = fs.existsSync(base) ? fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(path.join(base, d.name, 'Tarjetas.tsx'))).map((d) => d.name).sort() : [];
  const L = [
    '// REGISTRO DE TARJETAS POR APP (lo regenera el motor cuando escribe las tarjetas de una app: server/tarjetasPlantilla.mjs).',
    '// No editar a mano: cada app vive en src/remotion/apps/<id>/Tarjetas.tsx (índice generado) con sus tarjetas y su catalogo.json.',
    "import type React from 'react';",
    ...apps.map((a) => `import { Tarjetas as ${ident(a)} } from './${a}/Tarjetas';`),
    '',
    '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
    `export const TARJETAS_APPS: Record<string, React.FC<{ plan: any }>> = {${apps.map((a) => ` '${a}': ${ident(a)}`).join(',')}${apps.length ? ' ' : ''}};`,
    '',
  ];
  fs.writeFileSync(path.join(base, 'index.ts'), L.join('\n'), 'utf8');
  return apps;
}

// ── el progreso, para que el dueño vea qué pantalla se está haciendo (GET /api/mockups-app/progreso) ──
const PROGRESO = new Map();
export const progresoDe = (appId) => PROGRESO.get(appId) || null;
function avance(appId, cambios) {
  const p = PROGRESO.get(appId) || { appId, fase: '', total: 0, hechas: 0, tarjetas: [], inicio: Date.now() };
  Object.assign(p, cambios, { actualizado: Date.now() });
  PROGRESO.set(appId, p);
  return p;
}
function avanceTarjeta(appId, id, estado, detalle = '') {
  const p = PROGRESO.get(appId); if (!p) return;
  const t = p.tarjetas.find((x) => x.id === id); if (t) Object.assign(t, { estado, detalle });
  p.hechas = p.tarjetas.filter((x) => x.estado === 'lista' || x.estado === 'falló').length;
  p.actualizado = Date.now();
}

const PLANTILLA = ['src', 'remotion', 'apps', '_base', 'Marco.tsx'];
const EJEMPLO = ['src', 'remotion', 'apps', '_base', 'ejemplo-munify-tesoreria.tsx'];
const VARA_PNG = ['docs', '16-montaje-flow', 'estandar-mockups', 'munify-ocho-referencias.png'];
const SISTEMA = 'Sos motion designer y desarrollador de React con Remotion. Antes de escribir, mirás con la herramienta Read las imágenes que te indican. Devolvés exactamente los bloques de código que te piden, sin explicaciones.';

// ── la marca, desde el kit (sin IA) ──
const hex6 = (c) => { const m = S(c).match(/^#([0-9a-f]{6})$/i); return m ? `#${m[1].toUpperCase()}` : ''; };
const canales = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mezcla = (a, b, t) => { const x = canales(a), y = canales(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase(); };
const luz = (c) => { const [r, g, b] = canales(c).map((v) => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const familia = (t) => S(t).split(',')[0].trim();

export function marcaDesdeKit(kit) {
  const c = kit.marca?.colores || {};
  const acento = hex6(c.acento) || hex6(c.primario) || '#4F7CFF';
  // las tarjetas van de noche: el tono más oscuro de la marca, o el acento llevado casi a negro
  const oscuros = [c.bandasProfundo, c.bandas, c.fondoOscuro, c.oscuro, c.texto].map(hex6).filter((x) => x && luz(x) < 0.2);
  const fondoProfundo = oscuros[0] ? mezcla(oscuros[0], '#000000', 0.15) : mezcla(acento, '#000000', 0.9);
  const fondo = oscuros[1] || mezcla(fondoProfundo, acento, 0.08);
  const claro = [c.fondo, c.superficie].map(hex6).find((x) => x && luz(x) > 0.85) || '#F5F5F5';
  const dominio = S(kit.marca?.dominio) || S(kit.cta?.url).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return {
    colores: {
      acento, acentoOscuro: hex6(c.primarioOscuro) || mezcla(acento, '#000000', 0.2),
      fondo, fondoProfundo, superficie: mezcla(fondo, '#FFFFFF', 0.05), superficie2: mezcla(fondo, '#FFFFFF', 0.1), borde: mezcla(fondo, '#FFFFFF', 0.16),
      texto: claro, texto2: mezcla(claro, fondoProfundo, 0.3), texto3: mezcla(claro, fondoProfundo, 0.5),
      exito: hex6(c.exito) || '#22C55E', alerta: hex6(c.alerta) || '#F59E0B', error: hex6(c.error) || '#EF4444', info: hex6(c.info) || '#3B82F6',
      lema: S(kit.marca?.claim), dominio,
    },
    familiaTitulo: familia(kit.marca?.tipografias?.titulos) || 'Inter',
    familiaTexto: familia(kit.marca?.tipografias?.texto) || familia(kit.marca?.tipografias?.titulos) || 'Inter',
    logo: S(kit.marca?.logo?.paraFondoOscuroRaster) || S(kit.marca?.logo?.paraFondoOscuro) || S(kit.marca?.logo?.principal),
  };
}

// la fuente de Google como módulo de Remotion, con sus pesos y alfabetos reales (si no existe, Inter)
function fuente(root, nombre) {
  const req = createRequire(path.join(root, 'package.json'));
  for (const mod of [nombre.replace(/\s+/g, ''), 'Inter']) {
    try {
      const info = req(`@remotion/google-fonts/${mod}`).getInfo();
      const pesos = Object.keys(info.fonts?.normal || {}).filter((p) => ['400', '500', '600', '700', '800'].includes(p));
      const alfabetos = Object.keys(Object.values(info.fonts?.normal || {})[0] || {}).filter((a) => ['latin', 'latin-ext'].includes(a));
      return { mod, pesos, alfabetos };
    } catch { /* sigue con Inter */ }
  }
  return { mod: 'Inter', pesos: ['400', '700'], alfabetos: ['latin'] };
}

const slug = (t) => S(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'pantalla';

// el índice de la app: GENERADO por el motor (marca + fuentes + una tarjeta por pantalla), sin IA
function escribirIndice(root, appId, kit, ids) {
  const mk = marcaDesdeKit(kit);
  const ft = fuente(root, mk.familiaTitulo), fx = fuente(root, mk.familiaTexto);
  const L = [];
  L.push(`// GENERADO POR EL MOTOR (server/tarjetasPlantilla.mjs): no editar a mano. La marca sale del kit de ${appId} y cada`);
  L.push('// tarjeta la escribe el agente mirando la captura de su pantalla (tarjetas/<id>.tsx). El procedimiento: ../_base/Marco.tsx.');
  L.push("import React from 'react';");
  L.push(`import { loadFont as fuenteTitulo } from '@remotion/google-fonts/${ft.mod}';`);
  if (fx.mod !== ft.mod) L.push(`import { loadFont as fuenteTexto } from '@remotion/google-fonts/${fx.mod}';`);
  L.push("import { Marco, type Marca, type PlanTarjetasApp, type TarjetaProps } from '../_base/Marco';");
  ids.forEach((id) => L.push(`import { Mockup as ${ident(id)} } from './tarjetas/${id}';`));
  L.push('');
  L.push(`const { fontFamily: titulo } = fuenteTitulo('normal', { weights: ${JSON.stringify(ft.pesos)}, subsets: ${JSON.stringify(ft.alfabetos)} });`);
  L.push(fx.mod !== ft.mod
    ? `const { fontFamily: texto } = fuenteTexto('normal', { weights: ${JSON.stringify(fx.pesos)}, subsets: ${JSON.stringify(fx.alfabetos)} });`
    : 'const texto = titulo;');
  L.push(`export const marca: Marca = { ...${JSON.stringify(mk.colores)}, fuenteTitulo: titulo, fuenteTexto: texto };`);
  L.push(`const TARJETAS: Record<string, React.FC<TarjetaProps>> = { ${ids.map((id) => `'${id}': ${ident(id)}`).join(', ')} };`);
  L.push('export const Tarjetas: React.FC<{ plan: PlanTarjetasApp }> = ({ plan }) => <Marco plan={plan} marca={marca} tarjetas={TARJETAS} />;');
  fs.writeFileSync(path.join(dirApp(root, appId), 'Tarjetas.tsx'), L.join('\n') + '\n', 'utf8');
  return mk;
}

// ── el pedido de UNA tarjeta ──
export function pedidoTarjeta({ kit, kitDir, root, p, plantilla, ejemplo }) {
  const est = arr(p.estados).filter((e) => S(e?.archivo));
  const ruta = (r) => path.join(kitDir, r).replace(/\\/g, '/');
  const L = [];
  L.push(`Escribí UNA tarjeta animada de ${S(kit.marca?.nombreExacto) || S(kit.app)}: la pantalla "${S(p.nombre)}".`);
  L.push('');
  L.push('1. MIRÁ PRIMERO, con Read:');
  L.push(`- La pantalla real: ${ruta(p.archivo)}`);
  if (est.length) {
    L.push('- Sus estados, en orden. Son los fotogramas clave: la tarjeta pasa de uno al siguiente.');
    est.forEach((e, i) => L.push(`  ${i + 1}) ${ruta(e.archivo)}${S(e.queCambia) ? ` · ${S(e.queCambia)}` : ''}`));
    L.push('  Los datos de la tarjeta (nombres, montos, estados) salen de los ESTADOS, no de la captura principal: puede ser otro caso de la demostración.');
  }
  L.push(`- La vara: ${path.join(root, ...VARA_PNG).replace(/\\/g, '/')} (los ocho mockups animados de Munify). Así de grandes, así de simples, así de vivos.`);
  L.push('');
  L.push('2. LO QUE CUENTA ESTA PANTALLA');
  if (S(p.queDemuestra)) L.push(`- Qué demuestra: ${S(p.queDemuestra)}`);
  if (S(p.microAnimacion)) L.push(`- Cómo se mueve: ${S(p.microAnimacion)}`);
  if (S(p.zonaClave)) L.push(`- Dónde mirar: ${S(p.zonaClave)}`);
  if (arr(p.datosVisibles).length) L.push(`- Datos visibles: ${arr(p.datosVisibles).join(' · ')}`);
  if (S(p.notaEstados)) L.push(`- Nota de la app: ${S(p.notaEstados)}`);
  if (arr(kit.pendientesConocidos).length) L.push(`- Textos que la app tiene pero NO se muestran: ${arr(kit.pendientesConocidos).map((x) => (typeof x === 'string' ? x : S(x.texto || x.que))).join(' · ')}`);
  L.push('');
  L.push('3. EL PROCEDIMIENTO (fijo: no lo cambies)');
  L.push('La plantilla ya resuelve la resolución, el fondo, el logo con el lema, el título debajo de la tarjeta, los colores y fuentes de la marca y las medidas. Vos elegís qué piezas van adentro de la tarjeta, con qué datos de la captura y en qué momento entra cada una.');
  L.push('- Una sola <Tarjeta> con el ícono, el título de la pantalla tal cual la captura y una bajada corta. Adentro, hasta cuatro piezas: Fila, Pastilla, Boton, Aviso, Barra, Numero. Toque para el dedo que aprieta.');
  L.push('- Tienen que ENTRAR: debajo del encabezado quedan unos 740 px de alto. Una Fila mide unos 120, una Fila con detalle 150, un Boton 104, un Aviso 120, un Numero 130, una Barra 16, y entre pieza y pieza van 22. Si no entran todas a la vez, una reemplaza a otra en el tiempo (la que sale se va antes de que entre la nueva). La bajada del encabezado es un renglón corto.');
  L.push('- El método: momento(dur, q), entra, ease, cuenta, pulso, pesos. Los momentos se reparten entre el 10% y el 90% de dur; algo chico sigue vivo hasta el final.');
  L.push('- Los colores salen de m (m.acento, m.exito, m.alerta, m.error, m.texto2...). Nunca escribas un color ni un tamaño de letra a mano: las piezas ya los traen.');
  L.push('- Cada texto está tal cual en la captura o en sus estados. Nada inventado.');
  L.push('- Nada se monta: un Aviso ocupa su lugar en la columna o reemplaza a otra pieza.');
  L.push('');
  L.push('LA PLANTILLA (src/remotion/apps/_base/Marco.tsx):');
  L.push('```tsx', plantilla, '```');
  L.push('EL EJEMPLO: Tesorería de Munify hecha con la plantilla.');
  L.push('```tsx', ejemplo, '```');
  L.push('');
  L.push('4. DEVOLVÉ');
  L.push("- Un bloque ```tsx con el archivo de la tarjeta: imports desde '../../_base/Marco' y `export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => ...` (se llama Mockup; Tarjeta es la pieza de la plantilla que lo envuelve).");
  L.push('- Un bloque ```json: {"chip": "una palabra", "titulo": "de 3 a 6 palabras, el beneficio y no el nombre de la pantalla", "resaltar": "la parte del título que va resaltada", "sub": "una línea que lo explica", "durSec": 6}');
  return L.join('\n');
}

// la tarjeta sólo puede importar react, remotion y la plantilla: cualquier import relativo es la plantilla, con su ruta
// verdadera (el agente a veces la adivina mal: '../Marco', '../PlantillaTarjetas'); eso lo arregla el motor, no la IA
const conRutaBuena = (tsx) => String(tsx).replace(/from\s+(['"])\.{1,2}\/[^'"]*\1/g, "from '../../_base/Marco'");
const bloque = (txt, lang) => (String(txt || '').match(new RegExp('```(?:' + lang + ')\\s*([\\s\\S]*?)```', 'i')) || [])[1];
const json = (txt) => { try { return JSON.parse(bloque(txt, 'json') || 'null'); } catch { return null; } };

// en paralelo, de a `n`
async function enTandas(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

function erroresPorArchivo(root, appId) {
  const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsc', '--noEmit', '-p', '.'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32', timeout: 240000 });
  const pref = `src/remotion/apps/${appId}/`;
  const por = {};
  for (const l of String(r.stdout || '').split('\n').map((x) => x.replace(/\\/g, '/'))) {
    const i = l.indexOf(pref); if (i < 0) continue;
    const m = l.slice(i + pref.length).match(/^tarjetas\/([^.(]+)\.tsx/);
    const k = m ? m[1] : '_indice';
    (por[k] = por[k] || []).push(l.slice(i).slice(0, 300));
  }
  return por;
}

/** Escribe las tarjetas de una app con la plantilla: una llamada por pantalla, en paralelo. soloIds: rehacer sólo esas. */
export async function escribirTarjetasPlantilla({ appId, kitDir, root, runAI, log = () => {}, model = 'opus', soloIds = null, paralelo = 3, logoUrl = '' }) {
  const t0 = Date.now();
  const kit = JSON.parse(fs.readFileSync(path.join(kitDir, 'media-kit.json'), 'utf8'));
  const dir = dirApp(root, appId), dirT = path.join(dir, 'tarjetas');
  fs.mkdirSync(dirT, { recursive: true });
  const plantilla = fs.readFileSync(path.join(root, ...PLANTILLA), 'utf8');
  const ejemplo = fs.readFileSync(path.join(root, ...EJEMPLO), 'utf8');
  const usados = new Set();
  const pantallas = arr(kit.pantallas).map((p) => { let id = slug(p.nombre); while (usados.has(id)) id += '-2'; usados.add(id); return { p, id }; });
  const aHacer = pantallas.filter((x) => !soloIds || soloIds.includes(x.id));
  const previo = (() => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'catalogo.json'), 'utf8')); } catch { return null; } })();
  const meta = Object.fromEntries(arr(previo?.tarjetas).map((t) => [t.id, t]));
  let costo = 0;
  log(`tarjetas: ${aHacer.length} pantalla(s) de ${appId}, de a ${paralelo}, modelo ${model}, mirando las capturas`);
  avance(appId, { fase: 'escribiendo', total: aHacer.length, hechas: 0, inicio: t0, tarjetas: aHacer.map(({ p, id }) => ({ id, nombre: S(p.nombre), estado: 'en cola', detalle: '' })) });
  await enTandas(aHacer, paralelo, async ({ p, id }) => {
    const t1 = Date.now();
    avanceTarjeta(appId, id, 'mirando', `mirando la captura y ${arr(p.estados).length} estado(s)`);
    try {
      const r = await runAI({ prompt: pedidoTarjeta({ kit, kitDir, root, p, plantilla, ejemplo }), model, functionId: 'tarjetaPantalla', cwd: kitDir, tools: 'Read', system: SISTEMA, thinking: 4000 });
      costo += r.cost || 0;
      fs.writeFileSync(path.join(dirT, `${id}.respuesta.txt`), String(r.text || ''), 'utf8');
      const tsx = bloque(r.text, 'tsx|typescript|ts');
      if (!tsx || !/export const Mockup\b/.test(tsx)) throw new Error('no devolvió el archivo de la tarjeta');
      fs.writeFileSync(path.join(dirT, `${id}.tsx`), conRutaBuena(tsx).trim() + '\n', 'utf8');
      const j = json(r.text) || {};
      meta[id] = { id, pantalla: S(p.archivo), nombre: S(p.nombre), patron: S(p.patronDelEstandar), microAnimacion: S(p.microAnimacion), chip: S(j.chip), titulo: S(j.titulo) || S(p.nombre), resaltar: S(j.resaltar), sub: S(j.sub), durSec: Number(j.durSec) || 6 };
      log(`tarjetas: "${id}" escrita en ${Math.round((Date.now() - t1) / 1000)} s (miró ${r.tools?.length || 0} archivo(s))`);
      avanceTarjeta(appId, id, 'lista', `${Math.round((Date.now() - t1) / 1000)} s`);
    } catch (e) { log(`tarjetas: "${id}" falló: ${(e instanceof Error ? e.message : String(e)).slice(0, 200)}`); avanceTarjeta(appId, id, 'falló', (e instanceof Error ? e.message : String(e)).slice(0, 120)); }
  });
  // el índice con las que existen, en el orden del kit
  const listas = () => pantallas.map((x) => x.id).filter((id) => fs.existsSync(path.join(dirT, `${id}.tsx`)) && meta[id]);
  let ids = listas();
  const mk = escribirIndice(root, appId, kit, ids);
  const catalogo = () => ({ logo: mk.logo, dominio: mk.colores.dominio, metodo: 'plantilla', tarjetas: ids.map((id) => meta[id]) });
  fs.writeFileSync(path.join(dir, 'catalogo.json'), JSON.stringify(catalogo(), null, 2) + '\n', 'utf8');
  regenerarRegistro(root);
  // la prueba: tipos por archivo; la tarjeta que no compila se corrige UNA vez sola; si sigue rota, queda afuera
  avance(appId, { fase: 'probando que compilen y dibujen' });
  let errores = erroresPorArchivo(root, appId);
  const rotas = Object.keys(errores).filter((k) => k !== '_indice' && ids.includes(k));
  if (rotas.length) {
    log(`tarjetas: ${rotas.length} no compilan (${rotas.join(', ')}); se corrige cada una por su lado`);
    await enTandas(rotas, paralelo, async (id) => {
      const codigo = fs.readFileSync(path.join(dirT, `${id}.tsx`), 'utf8');
      const r = await runAI({ prompt: `Tu tarjeta no compila:\n${errores[id].join('\n')}\nCorregí sólo eso. Devolvé el archivo completo en un bloque \`\`\`tsx.\nLA PLANTILLA:\n\`\`\`tsx\n${plantilla}\n\`\`\`\nTU ARCHIVO:\n\`\`\`tsx\n${codigo}\n\`\`\``, model, functionId: 'tarjetaPantalla', cwd: kitDir, system: SISTEMA }).catch(() => ({ text: '' }));
      costo += r.cost || 0;
      const tsx = bloque(r.text, 'tsx|typescript|ts');
      if (tsx && /export const Mockup\b/.test(tsx)) fs.writeFileSync(path.join(dirT, `${id}.tsx`), conRutaBuena(tsx).trim() + '\n', 'utf8');
    });
    errores = erroresPorArchivo(root, appId);
    const siguen = Object.keys(errores).filter((k) => k !== '_indice' && ids.includes(k));
    if (siguen.length) {
      log(`tarjetas: quedan afuera porque no compilan: ${siguen.join(', ')}`);
      ids = ids.filter((id) => !siguen.includes(id));
      escribirIndice(root, appId, kit, ids);
      fs.writeFileSync(path.join(dir, 'catalogo.json'), JSON.stringify(catalogo(), null, 2) + '\n', 'utf8');
      regenerarRegistro(root);
    }
  }
  // un cuadro de cada una, para ver que dibujan
  const problemas = [];
  for (const id of ids) {
    const t = meta[id];
    const plan = { app: appId, width: 1080, height: 1920, fps: 30, logoSrc: logoUrl, escenas: [{ tipo: id, durSec: t.durSec, chip: t.chip, titulo: t.titulo, resaltar: t.resaltar, sub: t.sub }], placa: { linea1: '', linea2: '', durSec: 0 } };
    try { await renderCuadro({ id: 'AppTarjetas', inputProps: { plan }, frame: Math.round(t.durSec * 30 * 0.6), root, log: () => {} }); }
    catch (e) { problemas.push(`la tarjeta "${id}" rompe al dibujar: ${(e instanceof Error ? e.message : String(e)).slice(0, 300)}`); }
  }
  if (errores._indice) problemas.push(...errores._indice);
  const segundos = Math.round((Date.now() - t0) / 1000);
  avance(appId, { fase: 'listo', listas: ids.length, segundos });
  log(`tarjetas: listas ${ids.length} de ${pantallas.length} en ${segundos} s${problemas.length ? ` · ${problemas.length} problema(s)` : ''}`);
  return { appId, archivo: path.join(dir, 'Tarjetas.tsx'), catalogo: catalogo(), errores: problemas, cuadros: [], movimiento: [], segundos, costo };
}
