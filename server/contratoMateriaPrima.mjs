// CONTRATO DE MATERIA PRIMA con ChatGPT (2026-10-11, Lucas: "un contrato con un JSON y que haga el trabajo duro
// ChatGPT: vos me mandás un JSON de input donde le decís qué tiene que hacer, yo le digo que me arme los JSON de salida con
// todo lo que necesitás — la idea, los personajes, el guion, el storyboard — y los importamos; vos hacés los prompts de
// Flow, las animaciones y el montaje"). ChatGPT tiene el criterio artístico; Media Studio hace lo mecánico.
//
// armarPedido: el JSON que se le pega a ChatGPT, con los HECHOS reales del proyecto (ficha, kit, CTA), las piezas de la
// campaña, el material que existe (Flow, las pantallas de la app, la placa) y las reglas de oficio que salieron de las
// vueltas con los jueces del 2026-10-11. leerRespuesta: lo que devuelve ChatGPT → el concepto, el guion, el cast y el
// storyboard de cada pieza, con la misma normalización y los mismos validadores que los moldes. No llama a ningún modelo.
import { buildProjectFacts, factsText } from './projectFacts.mjs';
import { validarResultado, rolCanonico } from './prompting.mjs';

export const CONTRATO_VERSION = 'media-studio/materia-prima/1.2';   // 1.2 (2026-10-12): el criterio del estudio curado; las pantallas, como recorrido (sin el caso de la demo)
// 1.1: ninguna frase explica la publicidad; el profesional trabajando
const S = (v) => (typeof v === 'string' ? v.trim() : '');
const arr = (v) => (Array.isArray(v) ? v : []);

// Las reglas de oficio, en el idioma en que las va a leer ChatGPT. Son las que hicieron subir la materia prima de 5 a 7,5
// con tres jueces externos (ChatGPT, Gemini y Qwen) el 2026-10-11; cada una nació de un error visto en una pieza real.
export const REGLAS_DE_OFICIO = {
  produccion: [
    'Las escenas con personas las genera Google Flow (Veo 3): clips de 8 segundos con sonido directo. La persona dice su frase con su propia voz (sincronía de labios). La identidad de cada personaje la fija una imagen de referencia.',
    'NO HAY LOCUTOR NI VOZ EN OFF: cada palabra la dice en cámara un personaje de la historia. El único texto que no se dice es el de la placa final.',
    'Las pantallas de la app NO se filman: son mockups animados reales que ya existen (lista en "material_disponible.pantallas_de_la_app"), sin sonido. Se usan por su nombre exacto. Ninguna otra pantalla de la app existe.',
    'La placa final (logo, una línea de texto y la web) la dibuja el montaje. No se filma.',
    'Flow no escribe texto legible: nada de carteles, subtítulos ni pantallas con texto generadas por IA.',
  ],
  // 1.2 (2026-10-12): el mismo criterio que los moldes del motor — el estudio curado (calidad dramática, dirección
  // narrativa y actoral) y lo técnico de Flow. Se fueron las reglas de las vueltas del 11/10, que contradecían la curación.
  de_donde_sale: [
    'La historia (la situación, quiénes son, qué les pasa, dónde y en qué orden se cuenta) sale de la pieza: su mensaje, su ángulo, su enfoque y su tratamiento.',
    'Lo que el negocio hace y promete sale de "marca.ficha".',
    'Las pantallas de la app son la referencia del recorrido del producto: qué pantallas existen y qué hace la persona en cada una. Entran como insertos del montaje.',
  ],
  guion: [
    'El orden en que se cuenta lo decide la idea de la pieza: si empieza por la consecuencia o vuelve atrás, se respeta, siempre que respete los hechos del producto y se entienda la historia.',
    'El gancho: el estímulo más interesante para el espectador; puede ser una pregunta, un contraste, una consecuencia, un problema o una revelación.',
    'Antes de escribir el diálogo, identificá qué quiere cada personaje en ese momento, qué acaba de suceder y qué provoca su siguiente reacción. Los personajes no son portavoces del negocio: son personas viviendo una situación concreta.',
    'El diálogo responde a algo que ocurre o que otro personaje acaba de decir. Permití interrupciones, preguntas genuinas, respuestas breves y reacciones inesperadas cuando resulten naturales. Una frase breve puede ser mejor que una explicación completa.',
    'Se prohíbe el lenguaje de folleto, no el significado comercial: una persona puede contar lo que le pasó, siempre que suene a su forma de hablar.',
    'Una escena dramatizada no es un resultado garantizado: no digas cantidades ni tiempos que la ficha no garantiza ("hasta tres" no es "tres"; que lleguen no es que lleguen ya).',
    'Leé cada intervención como si fuera una conversación real entre esas personas, sin cámaras presentes. Si suena a publicidad, reformulala; si no revela carácter, no provoca una reacción ni hace avanzar la situación, sacala.',
    'El cierre lo muestra la placa: el llamado a la acción verificado, tal cual.',
    'La marca se DICE con su pronunciación ("como_se_dice") y se ESCRIBE con su nombre en la placa.',
  ],
  personajes: [
    'Las personas, su edad, su ropa y su lugar salen de la historia. Si la idea los junta en un mismo lugar, es el mismo lugar para todos.',
    'Evitá decoraciones, acciones o biografías inventadas que no mejoren la escena. La ropa se mantiene igual en todas las tomas.',
  ],
  storyboard: [
    'Antes de definir plano, luz o movimiento, identificá el propósito dramático de cada escena: una situación reconocible, una intención humana concreta, una acción o interacción con sentido, y un pequeño cambio o reacción cuando la escena lo requiera.',
    'No agregues gestos sólo para que la persona no esté quieta: una conversación puede ser interesante sin que nadie abra puertas ni levante objetos. Si quitás cámara, luz y vestuario, tiene que quedar una situación humana interesante.',
    'La acción para el generador de video ("accionEn") va en este orden: qué está sucediendo entre los personajes, qué quiere cada uno, cómo reacciona, qué acción física la acompaña y, al final, cómo se filma. Sin secuencias de microgestos (mover la cabeza, levantar una ceja, girar el teléfono).',
    'Técnico: nada de acciones finas de manos en plano cercano mientras alguien habla (el video generado deforma los dedos); la persona empieza a hablar en el primer segundo; si alguien le muestra el teléfono a otro, la pantalla mira al otro y nunca a cámara (lo que muestra lo cuenta el inserto).',
    'Un bloque del guion sin voz que muestra a una persona haciendo algo es una escena filmada sin frase, no un inserto.',
    'Las pantallas de la app pueden entrar ENCIMA de la escena filmada que las nombra, mientras la voz sigue ("sobreEscena").',
    'La duración de cada escena es la del bloque del guion que cuenta; la suma da la duración de la pieza.',
  ],
};

// la forma EXACTA de la salida: es lo que lee el importador (leerRespuesta)
const SALIDA_ESPERADA = {
  contrato: CONTRATO_VERSION,
  piezas: [{
    id: 'el id de la pieza tal cual viene en "campana.piezas[].id"',
    concepto: {
      idea: 'la historia en 2 o 3 oraciones: quién, qué le pasa, qué cambia con la marca',
      porQueFunciona: '1 oración',
      tono: 'máximo 10 palabras',
      estetica: 'máximo 20 palabras',
    },
    personajes: [{
      id: 'p1, p2…',
      nombre: 'nombre de pila',
      quien: 'cómo lo nombra el guion en "quien"',
      rol: 'su función en la historia',
      fisicoEs: 'máximo 18 palabras, en español',
      fisicoEn: '25 a 45 palabras en INGLÉS: edad, pelo, piel, rasgos, presencia (sólo lo visible)',
      vestuario: 'máximo 10 palabras, en español',
      vestuarioEn: 'la misma ropa en INGLÉS, máximo 12 palabras',
      lugarEn: '20 a 40 palabras en INGLÉS: SU lugar, concreto, con 2 o 3 objetos que cuentan su situación, su detalle propio y la luz',
      personalidad: '1 a 3 palabras',
    }],
    lugar: { nombre: 'la locación general', descripcionEn: '25 a 50 palabras en INGLÉS', luz: 'máximo 8 palabras' },
    guion: {
      blocks: [{
        role: 'hook | desarrollo | giro | cta (en ese orden; desarrollo puede repetirse)',
        quien: 'quién lo dice en cámara (el "quien" de un personaje); "placa" en el cta; "" si el bloque no tiene voz',
        narration: 'lo que se DICE, tal cual (en el cta: el texto de la placa, máximo 8 palabras, sin la web)',
        visual: 'una frase con lo que se VE',
        durSec: 'número de segundos',
      }],
      music: { mood: '2 o 3 palabras' },
    },
    storyboard: [{
      n: 'número consecutivo desde 1',
      rol: 'hook | desarrollo | giro | cta',
      personajes: '["p1"] si hay alguien en cuadro; [] en una pantalla o en la placa',
      dialogo: 'la frase del guion que dice ESA persona en ESA escena, tal cual; "" si nadie habla',
      accion: 'en español, máximo 25 palabras: qué hace, con qué objeto, qué cambia',
      accionEn: 'en INGLÉS, 35 a 70 palabras, para el generador de video: quién (su nombre), dónde (su lugar), qué hace en los 8 segundos EN ORDEN, hacia dónde dice la frase, el gesto y el sonido del lugar. Sin la frase (va aparte), sin términos de cámara ni lentes, sin texto en pantalla. Pronombres con el género correcto.',
      plano: 'close-up | medium close-up | medium shot | over-the-shoulder | low angle | high angle | handheld follow | wide shot',
      pantalla: 'el nombre EXACTO de una pantalla de la app si la escena es una pantalla; "" si es filmada',
      sobreEscena: 'en una pantalla: el n de la escena filmada sobre cuya frase entra (la voz sigue); omitilo si va sola',
      durSec: 'número de segundos: la del bloque del guion que cuenta (si un bloque se reparte entre una escena filmada y una pantalla, se reparte)',
    }],
    placa: { linea1: 'la línea de la placa (igual al narration del cta)', linea2: 'la web' },
  }],
};

// las piezas de la campaña tal como las tiene el proyecto (ángulo, mensaje, enfoque…)
export function piezasDelProyecto(project = {}) {
  return arr(project.reels).filter((r) => r?.comercial).map((r) => {
    const c = r.comercial;
    return {
      id: r.id,
      titulo: S(c.titulo) || S(c.angulo) || r.id,
      angulo: S(c.angulo),
      brief_creativo: S(c.creativeBrief),
      mensaje_principal: S(c.primaryMessage),
      hechos_que_la_sostienen: arr(c.supportingFacts).map(S).filter(Boolean),
      enfoque: S(c.enfoque),
      tratamiento: S(c.tratamiento),
      formato: S(c.formatoId) === 'reel-hibrido-9-16' ? 'reel híbrido 9:16 (personas filmadas + pantallas de la app)' : S(c.formatoId) === 'reel-animado-9-16' ? 'reel animado 9:16 (sólo pantallas)' : 'reel filmado 9:16',
      duracion_seg: Number(r.durationSec) || 20,
      ...(c.concepto?.idea ? { idea_anterior_solo_referencia: `${S(c.concepto.idea)} (es la idea que salió antes; mejorala o reemplazala si no cumple las reglas de oficio)` } : {}),
    };
  });
}

export function armarPedido({ project = {}, piezas } = {}) {
  const f = buildProjectFacts(project);
  const marca = S(project.name) || f.name;
  // 2026-10-12: sin la animación de cada captura, que traía el caso de la demo ("se elige 'Humedad y filtraciones'…")
  const pantallas = arr(project.pantallasKit).map((p) => ({ nombre: S(p.nombre), que_muestra: S(p.queDemuestra) }));
  const ps = piezas && piezas.length ? piezas : piezasDelProyecto(project);
  return {
    contrato: CONTRATO_VERSION,
    para: 'ChatGPT',
    tu_rol: 'Sos director creativo y guionista de publicidad con veinte años haciendo comerciales cortos para redes en Argentina. Escribís en español rioplatense, con voseo.',
    tu_tarea: `Escribí la MATERIA PRIMA de las ${ps.length} piezas de la campaña de ${marca} que están en "campana.piezas": para cada una, la idea, los personajes, el guion y el storyboard. Con esto Media Studio arma los pedidos a Google Flow, las pantallas animadas y el montaje: lo que no esté acá no existe. Cada pieza es UNA idea y cuenta su ángulo; las piezas no se repiten entre sí (ni el gancho, ni los personajes, ni la situación). Usá sólo los hechos de "marca"; si un dato no está, no lo inventes. Antes de responder, revisá cada pieza contra "reglas_de_oficio" como lo haría un director exigente, y corregí lo que no pase.`,
    como_responder: 'Respondé SOLO con un bloque JSON con la forma de "salida_esperada" (un objeto por pieza dentro de "piezas", en el mismo orden). Sin texto antes ni después. Los textos de "salida_esperada" describen qué va en cada campo: reemplazalos por el contenido.',
    marca: {
      nombre: marca,
      como_se_dice: S(project.brandKit?.phonetic) || S(project.kb?.brand?.phonetic) || marca,
      web: S(project.cta?.url),
      llamado_a_la_accion_verificado: S(project.cta?.principal),
      ficha: factsText(f),
    },
    campana: { piezas: ps },
    material_disponible: {
      video_con_personas: 'Google Flow (Veo 3): clips de 8 s, 9:16, con sonido directo y sincronía de labios. Los personajes se fijan con una imagen de referencia.',
      pantallas_de_la_app: pantallas.length ? pantallas : 'No hay pantallas de la app: ninguna escena muestra la app.',
      que_son_las_pantallas: 'La referencia del recorrido de la app: qué pantallas existen y qué hace la persona en cada una. Entran como insertos del montaje.',
      placa_final: 'La dibuja el montaje: logo, una línea de texto y la web.',
      no_hay: ['locutor ni voz en off', 'pantallas de la app filmadas', 'texto en pantalla generado por la IA de video'],
    },
    reglas_de_oficio: REGLAS_DE_OFICIO,
    salida_esperada: SALIDA_ESPERADA,
  };
}

// ── IMPORTAR ──────────────────────────────────────────────────────────────────────────────────────────
function jsonDeRespuesta(texto) {
  const t = String(texto || '');
  const candidatos = [];
  for (const m of t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) candidatos.push(m[1]);
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) candidatos.push(t.slice(a, b + 1));
  const a2 = t.indexOf('['), b2 = t.lastIndexOf(']');
  if (a2 >= 0 && b2 > a2) candidatos.push(t.slice(a2, b2 + 1));
  for (const c of candidatos) { try { return JSON.parse(c.trim()); } catch { /* el próximo */ } }
  return null;
}

// Una pieza de la respuesta → los artefactos de la pieza en el shape de Media Studio, normalizados y validados.
// `normalizar` y `asignarCapturas` vienen de functions.mjs (los mismos del molde storyboard) para no tener dos reglas.
export function piezaAComercial(p = {}, { project = {}, durationSec = 20, tipo = 'filmado', normalizar = (x) => x, asignarCapturas = (x) => x } = {}) {
  const errores = [];
  const concepto = p.concepto ? {
    id: 'chatgpt', topico: S(p.titulo) || S(p.concepto.titulo) || '', idea: S(p.concepto.idea), tono: S(p.concepto.tono),
    estetica: S(p.concepto.estetica), porQueFunciona: S(p.concepto.porQueFunciona), referencia: 'curado por ChatGPT (contrato de materia prima)',
  } : undefined;
  const personajes = arr(p.personajes).map((x, i) => ({
    id: S(x.id) || `p${i + 1}`, nombre: S(x.nombre), quien: S(x.quien), rol: S(x.rol), fisicoEs: S(x.fisicoEs), fisicoEn: S(x.fisicoEn),
    vestuario: S(x.vestuario), vestuarioEn: S(x.vestuarioEn), lugarEn: S(x.lugarEn), personalidad: S(x.personalidad),
  }));
  const lugar = p.lugar ? { nombre: S(p.lugar.nombre), descripcionEn: S(p.lugar.descripcionEn), luz: S(p.lugar.luz) } : (personajes[0]?.lugarEn ? { nombre: 'locación', descripcionEn: personajes[0].lugarEn, luz: '' } : undefined);
  const cast = personajes.length ? { personajes, lugar } : undefined;
  const blocks = arr(p.guion?.blocks).map((b) => ({
    role: rolCanonico(S(b.role) || 'desarrollo'), quien: S(b.quien), narration: S(b.narration), visual: S(b.visual),
    ...(Number(b.durSec) ? { durSec: Number(b.durSec) } : {}),
  }));
  const guion = blocks.length ? { blocks, ...(S(p.guion?.music?.mood) ? { music: { mood: S(p.guion.music.mood) } } : {}) } : undefined;
  let escenas = arr(p.storyboard).map((e, i) => ({
    n: Number(e.n) || i + 1, rol: rolCanonico(S(e.rol) || 'desarrollo'), durSec: Number(e.durSec) || 4,
    plano: S(e.plano), angulo: '', personajes: arr(e.personajes).map(S).filter(Boolean),
    accion: S(e.accion), accionEn: S(e.accionEn), dialogo: S(e.dialogo), continuidad: S(e.continuidad), pantalla: S(e.pantalla),
    ...(Number(e.sobreEscena) ? { sobreEscena: Number(e.sobreEscena) } : {}),
  }));
  if (escenas.length && tipo === 'filmado') escenas = normalizar(escenas);
  escenas = asignarCapturas(escenas);
  const piece = { durationSec, tipo, cast };
  const ctxProject = { name: project.name, phonetic: project.brandKit?.phonetic || project.kb?.brand?.phonetic || project.name };
  if (!concepto?.idea) errores.push('falta la idea del concepto');
  if (guion) errores.push(...validarResultado('script', guion, { context: { project: ctxProject, piece } }).map((e) => `guion: ${e}`));
  else errores.push('falta el guion');
  if (cast) errores.push(...validarResultado('cast', cast, {}).map((e) => `personajes: ${e}`));
  else errores.push('faltan los personajes');
  if (escenas.length) errores.push(...validarResultado('storyboard', { escenas }, { context: { piece } }).map((e) => `storyboard: ${e}`));
  else errores.push('falta el storyboard');
  // una escena sin persona, sin pantalla y que no es el cierre: Flow la filmaría como imagen de apoyo. Si describe un gráfico,
  // un texto o porcentajes, no existe (Flow no escribe texto y no hay esa pantalla en el kit)
  for (const e of escenas) {
    if ((e.personajes || []).length || e.pantalla || e.rol === 'cta') continue;
    const t = `${e.accion} ${e.accionEn}`;
    if (/gr[aá]fic|superpuest|overlay|texto|porcentaj|%|cartel|infograf|n[uú]mero/i.test(t)) errores.push(`storyboard: la escena ${e.n} pide un gráfico o texto que no existe (Flow no escribe texto y no es una pantalla del kit); cambiala por una pantalla de la lista o por una toma con persona`);
  }
  // pantallas que no existen en el kit: no se inventan
  const nombres = new Set(arr(project.pantallasKit).map((x) => S(x.nombre).toLowerCase()));
  for (const e of escenas) if (e.pantalla && nombres.size && !nombres.has(e.pantalla.toLowerCase())) errores.push(`storyboard: la escena ${e.n} pide la pantalla "${e.pantalla}", que no existe en el kit`);
  return { concepto, guion, cast, storyboard: escenas.length ? escenas : undefined, placa: p.placa ? { linea1: S(p.placa.linea1), linea2: S(p.placa.linea2) } : undefined, errores };
}

export function leerRespuesta(texto, { project = {}, normalizar, asignarCapturas } = {}) {
  const o = jsonDeRespuesta(texto);
  if (!o) return { piezas: [], errores: ['No encontré un JSON en la respuesta. Pegá la respuesta entera de ChatGPT.'] };
  const lista = Array.isArray(o) ? o : Array.isArray(o.piezas) ? o.piezas : [o];
  const reels = arr(project.reels);
  const piezas = lista.map((p, i) => {
    const reel = reels.find((r) => r.id === S(p.id)) || reels[i];
    const durationSec = Number(reel?.durationSec) || 20;
    const tipo = reel?.comercial?.tipo === 'animado' ? 'animado' : 'filmado';
    return { id: reel?.id || S(p.id) || `pieza-${i + 1}`, titulo: S(reel?.comercial?.titulo) || S(p.titulo), ...piezaAComercial(p, { project, durationSec, tipo, normalizar, asignarCapturas: (es) => asignarCapturas ? asignarCapturas(es, { project }, { mediaKit: { pantallas: arr(project.pantallasKit) } }) : es }) };
  });
  return { piezas, errores: [], version: S(o.contrato) || '' };
}
