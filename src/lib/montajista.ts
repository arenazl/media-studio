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

export interface InsumosMontajista {
  palabrasPorToma: Record<string, PalabraTiempo[] | undefined>;   // fileRef → palabras del clip crudo
  pantallas?: PantallaKit[];
  cta?: { principal?: string; url?: string };
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
export function ubicarInsertos(scenes: MontajeScene[], palabras: Record<string, PalabraTiempo[] | undefined>, pantallas: PantallaKit[]): InsertoPantalla[][] {
  const usadas = new Set<string>();
  let total = 0;
  return scenes.map((s, i) => {
    const words = palabras[s.src] || [];
    const esUltima = i === scenes.length - 1;
    if (i === 0 || esUltima || s.rol === 'cta' || s.rol === 'gag' || s.rol === 'giro' || !words.length || !pantallas.length) return [];
    const candidatas = pantallas
      .filter((p) => !usadas.has(p.archivo))
      .map((p) => ({ p, ...coincidencia(words, tokensDePantalla(p)), asignada: !!s.archivoCaptura && s.archivoCaptura === p.archivo }))
      .filter((c) => c.asignada || c.puntos > 0)
      .sort((a, b) => Number(b.asignada) - Number(a.asignada) || b.puntos - a.puntos || (a.ancla?.start ?? 0) - (b.ancla?.start ?? 0));
    const out: InsertoPantalla[] = [];
    const habla = { desde: words[0].start, hasta: words[words.length - 1].end };
    for (const c of candidatas) {
      if (total >= MAX_INSERTOS || out.length >= 2) break;
      const anclaSec = c.ancla ? c.ancla.start - 0.1 : habla.desde + (habla.hasta - habla.desde) * 0.45;
      const atSec = Math.max(s.in + 0.6, anclaSec);
      let durSec = Math.min(INSERTO_DUR, s.out - 0.25 - atSec);
      if (durSec < INSERTO_MIN) continue;
      // convivencia con el inserto ya puesto: tiene que quedar cara entre los dos; si no entra, el que
      // está primero se acorta hasta donde se pueda, y si ni así alcanza, este no se pone.
      const previo = out[0];
      if (previo) {
        const [primero, segundo] = previo.atSec <= atSec ? [previo, { atSec, durSec }] : [{ atSec, durSec }, previo];
        const hueco = segundo.atSec - (primero.atSec + primero.durSec);
        if (hueco < INSERTO_SEPARACION) {
          const recortado = segundo.atSec - INSERTO_SEPARACION - primero.atSec;
          if (recortado < INSERTO_MIN) continue;
          if (primero === previo) previo.durSec = recortado; else durSec = recortado;
        }
      }
      out.push({ atSec, durSec, src: c.p.url || c.p.archivo, nombre: c.p.nombre });
      usadas.add(c.p.archivo); total += 1;
    }
    return out.sort((a, b) => a.atSec - b.atSec);
  });
}

export function afinarMontaje(plan: MontajePlan, insumos: InsumosMontajista): MontajePlan {
  const { palabrasPorToma, pantallas = [], cta, logoUrl, estilo, marca } = insumos;
  const conWords = plan.scenes.map((s) => {
    const words = palabrasPorToma[s.src] || s.words;
    return { ...s, words: words ? corregirMarca(words, marca) : undefined };
  });
  const recortadas = conWords.map((s, i) => recortar(s, s.words || [], i === conWords.length - 1));
  const insertos = ubicarInsertos(recortadas, Object.fromEntries(recortadas.map((s) => [s.src, s.words])), pantallas);
  const scenes: MontajeScene[] = recortadas.map((s, i) => ({
    ...s,
    transition: 'cut',
    ...escalas(i, s, recortadas),
    inserts: insertos[i].length ? insertos[i] : undefined,
  }));
  const host = hostnameDe(cta?.url);
  const principal = (cta?.principal || '').trim();
  const endCard = principal || host
    ? { linea1: principal || `Conocé ${host}`, linea2: host && !normalizar(principal).includes(normalizar(host)) ? host : undefined, durSec: PLACA_DUR, logoSrc: logoUrl }
    : undefined;
  return {
    ...plan,
    scenes,
    motor: 'remotion',
    endCard,
    logo: logoUrl ? { src: logoUrl } : plan.logo,
    estilo: estilo || plan.estilo,
  };
}
