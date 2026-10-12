// El MONTAJISTA: reglas de edición simples y determinísticas sobre el MontajePlan (sin IA, sin ffmpeg).
// Toma el plan que arma `storyboardToMontaje` y lo afina con las palabras transcriptas de cada clip:
//   1. recorta el aire muerto de cada clip (antes de la primera palabra, después de la última);
//   2. decide los acercamientos digitales (escala apenas distinta en cada corte, lento en el remate);
//   3. ubica insertos con pantallas REALES del kit cuando la voz nombra lo que esa pantalla muestra;
//   4. arma la placa final con la llamada a la acción del kit.
// "Lo previsible no se pide en vivo": estas decisiones no cambian de una corrida a otra.
import type { InsertoPantalla, MontajePlan, MontajeScene, PalabraTiempo } from './montajePlan';
import type { PantallaKit } from './mediaKit';

export const AIRE_ANTES = 0.35;          // segundos que se dejan antes de la primera palabra
export const AIRE_DESPUES = 0.45;        // después de la última palabra (corte al clip siguiente)
export const AIRE_FINAL = 0.8;           // después de la última palabra del último clip (antes de la placa)
export const INSERTO_DUR = 2.6;          // duración objetivo de un inserto de pantalla
export const INSERTO_MIN = 1.4;          // por debajo de esto el inserto no se pone
export const INSERTO_SEPARACION = 1.2;   // segundos de cara entre dos insertos de la misma escena
export const MAX_INSERTOS = 3;           // por pieza
export const PLACA_DUR = 3.2;
// Híbrido (Lucas, 2026-10-11: "un montaje coherente que incluya todo lo disponible"): los mockups que la voz no nombra
// entran igual, más cortos y con menos cara entre uno y otro, sin tope por pieza.
export const INSERTO_DUR_HIBRIDO = 2.2;
export const INSERTO_SEPARACION_HIBRIDO = 0.8;

export interface InsumosMontajista {
  palabrasPorToma: Record<string, PalabraTiempo[] | undefined>;   // fileRef → palabras del clip crudo
  pantallas?: PantallaKit[];
  mockups?: MockupInserto[];                                      // los mockups animados de la pieza (paso Mockups): reemplazan a la captura
  hibrido?: boolean;                                              // formato híbrido: se usan todos los mockups (escenas sin clip + insertos)
  cta?: { principal?: string; url?: string };
  ctaGuion?: string;                                               // lo que dice el bloque cta del guion (respaldo de la placa)
  logoUrl?: string;
  estilo?: MontajePlan['estilo'];
  marca?: { exacto?: string; fonetica?: string };                 // para escribir la marca como corresponde en los subtítulos
}

// La transcripción escribe la marca como la oye ("Sin Vuelta Ya", "SinVueltas"). Si una ventana de palabras
// suena como la fonética de la marca, se reemplaza por el nombre exacto, conservando el tiempo total y la
// puntuación final. Las palabras absorbidas quedan con texto vacío (la derivación las ignora).
const sinEspacios = (s: string) => normalizar(s).replace(/\s+/g, '');
function distancia(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return dp[a.length][b.length];
}
export function corregirMarca(words: PalabraTiempo[], marca?: { exacto?: string; fonetica?: string }): PalabraTiempo[] {
  const exacto = (marca?.exacto || '').trim();
  const fonetica = (marca?.fonetica || exacto).trim();
  if (!exacto || sinEspacios(fonetica).length < 4) return words;
  const fonW = fonetica.split(/\s+/), exW = exacto.split(/\s+/);
  // primero la marca completa; después, si tiene tres o más palabras, la marca sin su última palabra
  // ("Usá Sin Vueltas" se escribe "sin vueltas", no se le agrega el "¡YA!" que no dijo)
  const objetivos = [{ fon: sinEspacios(fonetica), exacto }];
  if (fonW.length >= 3 && exW.length === fonW.length) {
    const fp = sinEspacios(fonW.slice(0, -1).join(' '));
    if (fp.length >= 6) objetivos.push({ fon: fp, exacto: exW.slice(0, -1).join(' ') });
  }
  const out = words.map((w) => ({ ...w }));
  const maxVentana = fonW.length + 1;
  for (let i = 0; i < out.length; i++) {
    let hecho = false;
    for (const obj of objetivos) {
      const tolerancia = obj.fon.length >= 10 ? 2 : 1;
      for (let n = Math.min(maxVentana, out.length - i); n >= 1 && !hecho; n--) {
        const ventana = out.slice(i, i + n);
        if (ventana.some((w) => !w.text)) continue;
        const junto = sinEspacios(ventana.map((w) => w.text).join(''));
        // la ventana tiene que empezar y terminar como la marca: evita que la tolerancia se trague un "a" o un "y" vecinos
        if (!junto || junto[0] !== obj.fon[0] || junto[junto.length - 1] !== obj.fon[obj.fon.length - 1]) continue;
        if (Math.abs(junto.length - obj.fon.length) > tolerancia || distancia(junto, obj.fon) > tolerancia) continue;
        const cola = /[.,!?;:]$/.exec(ventana[n - 1].text)?.[0] ?? '';
        out[i] = { text: obj.exacto + (/[!?.]$/.test(obj.exacto) ? '' : cola), start: ventana[0].start, end: ventana[n - 1].end };
        for (let k = 1; k < n; k++) out[i + k] = { ...out[i + k], text: '' };
        i += n - 1;
        hecho = true;
      }
      if (hecho) break;
    }
  }
  return out.filter((w) => w.text);
}

export const normalizar = (s: string) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ');

const STOP = new Set(['para', 'como', 'este', 'esta', 'esto', 'desde', 'hasta', 'entre', 'sobre', 'todo', 'toda', 'todos', 'cada', 'tiene', 'tienen', 'donde', 'cuando', 'pero', 'porque', 'mas', 'menos', 'ahora', 'ante', 'bajo', 'con', 'sin', 'que', 'una', 'uno', 'unos', 'unas', 'del', 'las', 'los', 'por', 'sus', 'mis', 'tus']);

// raíz comparable de una palabra: sin acentos, sin plural simple, mínimo 4 letras.
export function raiz(palabra: string): string | null {
  const w = normalizar(palabra).trim().replace(/\s+/g, '');
  if (w.length < 4 || STOP.has(w)) return null;
  const base = w.length > 5 && /(es|s)$/.test(w) ? w.replace(/es$|s$/, '') : w;
  return base.slice(0, 6);
}

// Sólo nombre y zona clave: `queDemuestra` es un párrafo de marketing y `datosVisibles` es demasiado granular;
// con ellos, en la prueba real "Cumple kids" pegó con "si no cumplen" y metió el asistente de eventos en la garantía.
export function tokensDePantalla(p: PantallaKit): Set<string> {
  const texto = [p.nombre, p.zonaClave].filter(Boolean).join(' ');
  const out = new Set<string>();
  for (const w of normalizar(texto).split(/\s+/)) { const r = raiz(w); if (r) out.add(r); }
  return out;
}

// La pantalla entra al PRINCIPIO de la frase que la nombra, no en la palabra exacta: desde la palabra que pega
// se camina hacia atrás mientras no haya pausa ni fin de oración, como mucho MAX_ATRAS palabras.
export const MAX_ATRAS = 4;
export const PAUSA_FRASE = 0.5;
export function inicioDeFrase(words: PalabraTiempo[], idx: number): PalabraTiempo {
  let i = idx;
  while (i > 0 && idx - i < MAX_ATRAS) {
    const prev = words[i - 1];
    if (words[i].start - prev.end > PAUSA_FRASE || /[.!?,;:]$/.test(prev.text)) break;
    i -= 1;
  }
  return words[i];
}

// cuántas palabras de la escena "pegan" con la pantalla, y dónde arranca la frase de la PRIMERA que pega.
function coincidencia(words: PalabraTiempo[], tokens: Set<string>): { puntos: number; ancla?: PalabraTiempo } {
  let puntos = 0; let ancla: PalabraTiempo | undefined;
  words.forEach((w, i) => {
    const r = raiz(w.text);
    if (r && tokens.has(r)) { puntos += 1; if (!ancla) ancla = inicioDeFrase(words, i); }
  });
  return { puntos, ancla };
}

export function hostnameDe(url?: string): string | undefined {
  if (!url) return undefined;
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || undefined; }
}

// Pager de subtítulos: frases por fin de oración o pausa larga; una frase larga se parte en páginas de
// hasta MAX_CHARS (dos líneas), prefiriendo la coma y si no el límite de palabra más cercano al medio.
export const MAX_CHARS_PAGINA = 48;
export const PAUSA_PAGINA = 0.8;
const largo = (ws: PalabraTiempo[]) => ws.reduce((n, x) => n + x.text.length + 1, 0) - 1;

export function partirFrase(ws: PalabraTiempo[]): PalabraTiempo[][] {
  if (largo(ws) <= MAX_CHARS_PAGINA || ws.length < 2) return [ws];
  let corte = -1;
  ws.forEach((w, i) => { if (/,$/.test(w.text) && i < ws.length - 1 && largo(ws.slice(0, i + 1)) <= MAX_CHARS_PAGINA) corte = i; });
  if (corte < 0) {
    const medio = largo(ws) / 2; let mejor = Infinity;
    for (let i = 0; i < ws.length - 1; i++) { const d = Math.abs(largo(ws.slice(0, i + 1)) - medio); if (d < mejor) { mejor = d; corte = i; } }
  }
  return [...partirFrase(ws.slice(0, corte + 1)), ...partirFrase(ws.slice(corte + 1))];
}

export function frasesDe(ws: PalabraTiempo[]): PalabraTiempo[][] {
  const frases: PalabraTiempo[][] = [];
  let cur: PalabraTiempo[] | null = null;
  for (const w of ws) {
    const last = cur?.[cur.length - 1];
    if (!cur || !last || w.start - last.end > PAUSA_PAGINA || /[.!?]$/.test(last.text)) { cur = []; frases.push(cur); }
    cur.push(w);
  }
  return frases;
}

function recortar(s: MontajeScene, words: PalabraTiempo[], esUltima: boolean): MontajeScene {
  if (!words.length) return s;
  const first = words[0], last = words[words.length - 1];
  const inn = Math.max(0, first.start - AIRE_ANTES);
  const out = Math.min(s.out, last.end + (esUltima ? AIRE_FINAL : AIRE_DESPUES));
  return out - inn > 0.5 ? { ...s, in: inn, out } : s;
}

function escalas(i: number, s: MontajeScene, scenes: MontajeScene[]): Pick<MontajeScene, 'punchFrom' | 'punchTo'> {
  const esRemate = s.rol === 'gag' || s.rol === 'giro' || (i < scenes.length - 1 && scenes[i + 1].rol === 'cta' && scenes.length > 2 && s.rol !== 'hook');
  if (esRemate) return { punchFrom: 1.0, punchTo: 1.12 };
  if (s.rol === 'cta') return { punchFrom: 1.04, punchTo: 1.04 };
  if (i === 0) return { punchFrom: 1.0, punchTo: 1.03 };
  return i % 2 === 1 ? { punchFrom: 1.06, punchTo: 1.06 } : { punchFrom: 1.0, punchTo: 1.0 };
}

// Insertos de pantalla real: en escenas con voz, anclados al principio de la frase que nombra lo que la
// pantalla muestra. Nunca en el gancho (la cara vende), en el remate (el chiste cae en la cara) ni en el
// cierre. Prioridad: la captura que el storyboard ya asignó a la escena.
// el mockup animado de una pantalla, si la pieza lo tiene (mismo nombre que la pantalla del kit)
export interface MockupInserto { nombre: string; fileRef: string; durSec: number }
const normNombre = (t: string) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function mockupDe(p: PantallaKit, mockups: MockupInserto[]): MockupInserto | undefined {
  const n = normNombre(p.nombre);
  return mockups.find((m) => normNombre(m.nombre) === n) || mockups.find((m) => n.startsWith(normNombre(m.nombre)) || normNombre(m.nombre).startsWith(n));
}

// opciones: `excluir` = fileRefs de mockups que ya son la toma de alguna escena (no se repiten como inserto);
// `hibrido` = sin tope por pieza, más cortos, y los mockups que la voz no nombra rellenan los huecos de cara.
export interface OpcionesInsertos { excluir?: Set<string>; hibrido?: boolean }

export function ubicarInsertos(scenes: MontajeScene[], palabras: Record<string, PalabraTiempo[] | undefined>, pantallas: PantallaKit[], mockups: MockupInserto[] = [], opts: OpcionesInsertos = {}): InsertoPantalla[][] {
  const excluir = opts.excluir || new Set<string>();
  const hibrido = !!opts.hibrido;
  const tope = hibrido ? Infinity : MAX_INSERTOS;
  const separacion = hibrido ? INSERTO_SEPARACION_HIBRIDO : INSERTO_SEPARACION;
  const usadas = new Set<string>();
  const usadosMk = new Set<string>(excluir);
  let total = 0;
  // un mockup que ya es la toma de una escena no vuelve como inserto (antes "Bandeja de solicitudes" salía dos veces)
  const libre = (p: PantallaKit) => !usadas.has(p.archivo) && !usadosMk.has(mockupDe(p, mockups)?.fileRef || '');
  const elegible = (s: MontajeScene, i: number) => {
    const words = palabras[s.src] || [];
    return !(i === 0 || i === scenes.length - 1 || s.rol === 'cta' || s.rol === 'gag' || s.rol === 'giro' || !words.length || excluir.has(s.src));
  };
  const porEscena = scenes.map((s, i) => {
    const words = palabras[s.src] || [];
    if (!elegible(s, i) || !pantallas.length) return [] as InsertoPantalla[];
    const candidatas = pantallas
      .filter(libre)
      .map((p) => ({ p, ...coincidencia(words, tokensDePantalla(p)), asignada: !!s.archivoCaptura && s.archivoCaptura === p.archivo }))
      .filter((c) => c.asignada || c.puntos > 0)
      .sort((a, b) => Number(b.asignada) - Number(a.asignada) || b.puntos - a.puntos || (a.ancla?.start ?? 0) - (b.ancla?.start ?? 0));
    const out: InsertoPantalla[] = [];
    const habla = { desde: words[0].start, hasta: words[words.length - 1].end };
    for (const c of candidatas) {
      if (total >= tope || out.length >= 2) break;
      const anclaSec = c.ancla ? c.ancla.start - 0.1 : habla.desde + (habla.hasta - habla.desde) * 0.45;
      const atSec = Math.max(s.in + 0.6, anclaSec);
      // con mockup animado, el inserto dura lo que necesita para contar su acción (hasta 60% del mockup), si la escena da
      const mk = mockupDe(c.p, mockups);
      const objetivo = hibrido ? INSERTO_DUR_HIBRIDO : mk ? Math.max(INSERTO_DUR, mk.durSec * 0.6) : INSERTO_DUR;
      let durSec = Math.min(objetivo, s.out - 0.25 - atSec);
      if (durSec < INSERTO_MIN) continue;
      // convivencia con el inserto ya puesto: tiene que quedar cara entre los dos; si no entra, el que
      // está primero se acorta hasta donde se pueda, y si ni así alcanza, este no se pone.
      const previo = out[0];
      if (previo) {
        const [primero, segundo] = previo.atSec <= atSec ? [previo, { atSec, durSec }] : [{ atSec, durSec }, previo];
        const hueco = segundo.atSec - (primero.atSec + primero.durSec);
        if (hueco < separacion) {
          const recortado = segundo.atSec - separacion - primero.atSec;
          if (recortado < INSERTO_MIN) continue;
          if (primero === previo) previo.durSec = recortado; else durSec = recortado;
        }
      }
      out.push(mk ? { atSec, durSec, src: mk.fileRef, nombre: c.p.nombre, video: true } : { atSec, durSec, src: c.p.url || c.p.archivo, nombre: c.p.nombre });
      usadas.add(c.p.archivo); if (mk) usadosMk.add(mk.fileRef); total += 1;
    }
    return out.sort((a, b) => a.atSec - b.atSec);
  });
  if (!hibrido) return porEscena;

  // RELLENO (híbrido): los mockups que la voz no nombró entran en el orden del kit (que es el recorrido de la app), en
  // los huecos de cara de las escenas filmadas, al principio de una frase. Lo que no entra queda en la biblioteca.
  const restantes = mockups.filter((m) => !usadosMk.has(m.fileRef));
  scenes.forEach((s, i) => {
    if (!restantes.length || !elegible(s, i)) return;
    const words = palabras[s.src] || [];
    const frases = frasesDe(words).map((f) => f[0].start - 0.1);
    const lista = porEscena[i];
    const fin = s.out - 0.25;
    let cursor = s.in + 0.6;
    while (restantes.length) {
      // entra al principio de una frase si hay una cerca; si la próxima queda lejos, no se desperdicia el hueco
      const frase = frases.find((t) => t >= cursor);
      const at = frase != null && frase - cursor <= 1.2 ? frase : cursor;
      const choca = lista.find((x) => at < x.atSec + x.durSec + separacion && at + INSERTO_MIN > x.atSec - separacion);
      if (choca) { cursor = choca.atSec + choca.durSec + separacion; continue; }
      const siguiente = lista.filter((x) => x.atSec > at).sort((a, b) => a.atSec - b.atSec)[0];
      const durSec = Math.min(INSERTO_DUR_HIBRIDO, (siguiente ? siguiente.atSec - separacion : fin) - at);
      if (durSec < INSERTO_MIN) { if (!siguiente) break; cursor = siguiente.atSec + siguiente.durSec + separacion; continue; }
      const mk = restantes.shift()!;
      lista.push({ atSec: at, durSec, src: mk.fileRef, nombre: mk.nombre, video: true });
      usadosMk.add(mk.fileRef);
      cursor = at + durSec + separacion;
    }
    lista.sort((a, b) => a.atSec - b.atSec);
  });
  return porEscena;
}

// La misma frase no se dice dos veces (RepareHoy, 2026-10-11: dos clips de Flow decían "y el pedido me llega a la
// bandeja", cada uno en su escena). Si dos tomas filmadas dicen casi lo mismo, se queda la que coincide con el diálogo de
// SU escena en el storyboard (a igual coincidencia, la primera) y la otra sale del armado con un aviso.
const raicesDe = (texto: string) => new Set(normalizar(texto).split(/\s+/).map(raiz).filter((r): r is string => !!r));
function parecido(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let comun = 0; for (const x of a) if (b.has(x)) comun += 1;
  return comun / (a.size + b.size - comun);
}
export const UMBRAL_REPETIDA = 0.7;
export function quitarFrasesRepetidas(scenes: MontajeScene[]): { scenes: MontajeScene[]; avisos: string[] } {
  const dicho = scenes.map((s) => raicesDe((s.words || []).map((w) => w.text).join(' ')));
  const fuera = new Set<number>();
  const avisos: string[] = [];
  for (let i = 0; i < scenes.length; i++) for (let j = i + 1; j < scenes.length; j++) {
    if (fuera.has(i) || fuera.has(j) || dicho[i].size < 4 || dicho[j].size < 4) continue;
    if (parecido(dicho[i], dicho[j]) < UMBRAL_REPETIDA) continue;
    const ajuste = (k: number) => parecido(dicho[k], raicesDe(scenes[k].dialogo || ''));
    const sale = ajuste(j) > ajuste(i) ? i : j;
    const queda = sale === i ? j : i;
    fuera.add(sale);
    const frase = (scenes[sale].words || []).map((w) => w.text).join(' ');
    avisos.push(`La escena ${scenes[sale].escenaN} quedó afuera: su clip dice lo mismo que la escena ${scenes[queda].escenaN} ("${frase.slice(0, 70)}"). Conviene regenerarla en Flow.`);
  }
  return { scenes: scenes.filter((_, k) => !fuera.has(k)), avisos };
}

// Escenas sin clip en un híbrido: las cubre un mockup que todavía no se usó. Primero el que pide el storyboard (la
// captura asignada), después el que nombra el diálogo, y si ninguno pega, el siguiente en el orden del kit.
export function cubrirConMockups(scenes: MontajeScene[], mockups: MockupInserto[], pantallas: PantallaKit[] = []): MontajeScene[] {
  const usados = new Set(scenes.map((s) => s.src).filter(Boolean));
  return scenes.map((s) => {
    if (s.src || s.placa) return s;
    const libres = mockups.filter((m) => !usados.has(m.fileRef));
    if (!libres.length) return s;
    const pantallaDe = (m: MockupInserto) => pantallas.find((p) => normNombre(p.nombre) === normNombre(m.nombre));
    const pedido = s.archivoCaptura ? libres.find((m) => pantallaDe(m)?.archivo === s.archivoCaptura) : undefined;
    const texto = [s.dialogo, s.screen].filter(Boolean).join(' ');
    const words = normalizar(texto).split(/\s+/).map((w, k) => ({ text: w, start: k, end: k + 0.5 }));
    const tokens = (m: MockupInserto) => { const p = pantallaDe(m); return p ? tokensDePantalla(p) : tokensDePantalla({ archivo: m.fileRef, url: '', nombre: m.nombre }); };
    const porTexto = libres.map((m) => ({ m, puntos: coincidencia(words, tokens(m)).puntos })).filter((x) => x.puntos > 0).sort((a, b) => b.puntos - a.puntos)[0]?.m;
    const mk = pedido || porTexto || libres[0];
    usados.add(mk.fileRef);
    const dur = s.out - s.in > 0 ? Math.min(mk.durSec, s.out - s.in) : mk.durSec;
    return { ...s, src: mk.fileRef, in: 0, out: dur, audio: 'mute' as const, screen: mk.nombre };
  });
}

export function afinarMontaje(plan: MontajePlan, insumos: InsumosMontajista): MontajePlan {
  const { palabrasPorToma, pantallas = [], mockups = [], cta, logoUrl, estilo, marca, hibrido } = insumos;
  // la escena cta sin clip ES la placa final, que la dibuja el motor: no se monta como escena. Antes quedaba en la
  // secuencia como un hueco negro de su duración y la placa venía después (el cierre salía dos veces).
  const sinPlaca = plan.scenes.filter((s) => !(!s.src && (s.placa || s.rol === 'cta')));
  const cubiertas = hibrido ? cubrirConMockups(sinPlaca, mockups, pantallas) : sinPlaca;
  const refsMockup = new Set(mockups.map((m) => m.fileRef));
  const esMockup = (s: MontajeScene) => refsMockup.has(s.src);
  const conWords = cubiertas.map((s) => {
    // un mockup no tiene voz: sin palabras y en silencio (si quedaba en 'keep' por el diálogo del storyboard, la
    // música se agachaba sobre una pantalla muda)
    if (esMockup(s)) return { ...s, words: undefined, audio: 'mute' as const };
    const words = palabrasPorToma[s.src] || s.words;
    return { ...s, words: words ? corregirMarca(words, marca) : undefined };
  });
  const { scenes: sinRepetir, avisos } = quitarFrasesRepetidas(conWords);
  const recortadas = sinRepetir.map((s, i) => recortar(s, s.words || [], i === sinRepetir.length - 1));
  const usadosComoEscena = new Set(recortadas.filter(esMockup).map((s) => s.src));
  const insertos = ubicarInsertos(recortadas, Object.fromEntries(recortadas.map((s) => [s.src, s.words])), pantallas, mockups, { excluir: usadosComoEscena, hibrido });
  if (hibrido) {
    const usados = new Set([...usadosComoEscena, ...insertos.flat().map((x) => x.src)]);
    const afuera = mockups.filter((m) => !usados.has(m.fileRef)).map((m) => m.nombre);
    if (afuera.length) avisos.push(`${afuera.length} mockups no entraron sin tapar la cara de la persona: ${afuera.join(', ')}. Están en la biblioteca del editor para sumarlos a mano.`);
  }
  // transiciones: corte seco entre tomas filmadas (es un relato a cámara); disolvencia cuando cambia el material
  // (de la persona a la pantalla de la app y de vuelta). La placa entra con su propio fundido.
  const scenes: MontajeScene[] = recortadas.map((s, i) => ({
    ...s,
    transition: i < recortadas.length - 1 && esMockup(s) !== esMockup(recortadas[i + 1]) ? 'crossfade' : 'cut',
    ...(esMockup(s) ? { punchFrom: 1, punchTo: 1 } : escalas(i, s, recortadas)),
    inserts: insertos[i].length ? insertos[i] : undefined,
  }));
  // La placa de cierre SIEMPRE existe: es la escena cta de la pieza, y la dibuja el motor (Veo no escribe texto ni logos).
  // Fuentes, en orden: el CTA del proyecto → el bloque cta del guion → la marca. Dura lo que el storyboard le dio a la cta.
  // (Lucas, 2026-10-10: "no es 'si querés hago el final de la película'": sin placa no hay comercial.)
  const host = hostnameDe(cta?.url);
  const principal = (cta?.principal || '').trim();
  const ctaGuion = (insumos.ctaGuion || '').trim();
  const nombreMarca = (marca?.exacto || '').trim();
  const linea1 = principal || ctaGuion || (nombreMarca ? `Conocé ${nombreMarca}` : host ? `Conocé ${host}` : 'Conocé más');
  const escenaCta = plan.scenes.find((s) => s.rol === 'cta');
  const durCta = escenaCta ? escenaCta.out - escenaCta.in : 0;
  const endCard = {
    linea1,
    linea2: host && !normalizar(linea1).includes(normalizar(host)) ? host : undefined,
    durSec: durCta > 0 ? Math.max(2, Math.min(6, durCta)) : PLACA_DUR,
    logoSrc: logoUrl,
  };
  return {
    ...plan,
    scenes,
    motor: 'remotion',
    endCard,
    logo: logoUrl ? { src: logoUrl } : plan.logo,
    estilo: estilo || plan.estilo,
    avisos: avisos.length ? avisos : undefined,
  };
}
