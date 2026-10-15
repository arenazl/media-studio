// CATÁLOGO de funciones del proceso guiado. Es la FUENTE de los botones/opciones de la UI:
// el front lee este catálogo y dibuja las acciones solo (no hay botones hardcodeados). Agregar
// una función = sumar una entrada acá. Cada función se ejecuta con UNA llamada de IA on-demand
// (Claude headless local), nunca el panel completo. El `model` es el tier sugerido por función
// (overrideable desde settings); el proveedor por ahora es siempre Claude.
//
// Niveles:
//   project → se ejecuta 1 vez para el proyecto (usa el brief + la marca).
//   piece   → se ejecuta por reel (usa el guion/contexto de esa pieza).

export type FunctionLevel = 'project' | 'piece';
export type ModelTier = 'opus' | 'sonnet' | 'haiku';

// Dificultad del molde (reingeniería 2026-10-07, P0.5 + presets del dueño). El front NO fija un
// modelo por molde: fija la CLASE de tarea, y el preset elegido en el engranaje decide el modelo.
//   creativo       = decide QUÉ se cuenta (strategy, concept, script): acá Opus se nota.
//   estructurado   = convierte con reglas (cast, storyboard, qa): Sonnet hace lo mismo en la mitad del tiempo.
//   transformacion = traduce/empaqueta (flowpack, publish, briefToKb, videoprompt): Sonnet.
// Medido con la pieza "Gancho & Problema" de Munify (docs/13-optimizacion-generacion/03-baseline-y-avance.md).
// Haiku 4.5 quedó afuera: medido fue de 4 a 8 veces MÁS LENTO que Sonnet en estos pedidos (32 a 88 s
// contra 9 s para el guion, tiempo de API real) y peor en calidad.
export type TaskClass = 'creativo' | 'estructurado' | 'transformacion';
export type AiPreset = 'economico' | 'intermedio' | 'performante';
export const PRESETS: Record<AiPreset, Record<TaskClass, ModelTier>> = {
  economico:   { creativo: 'sonnet', estructurado: 'sonnet', transformacion: 'sonnet' },
  intermedio:  { creativo: 'opus',   estructurado: 'sonnet', transformacion: 'sonnet' },
  performante: { creativo: 'opus',   estructurado: 'opus',   transformacion: 'sonnet' },
};
export const PRESET_DEFAULT: AiPreset = 'intermedio';

// un control que la UI dibuja para configurar la corrida (chips/select). Sin prompts a mano.
export interface FnOption {
  id: string;
  label: string;
  type: 'choice' | 'screens';          // choice = chips fijos · screens = las pantallas del proyecto (dinámico)
  choices?: { value: string; label: string; ayuda?: string }[];   // ayuda = qué quiere decir, en una línea (se ve en pantalla)
  default?: string;
  unit?: string;                       // ej. 's' para segundos
}

export interface StudioFunction {
  id: string;
  label: string;
  icon: string;                        // nombre de ícono lucide-react
  level: FunctionLevel;
  description: string;                 // qué hace, en una línea (se muestra en la UI)
  taskClass: TaskClass;                // dificultad del molde: el preset del engranaje la traduce a modelo
  options: FnOption[];                 // los controles del botón
}

// helper de chips
const c = (value: string, label = value, ayuda?: string) => ({ value, label, ...(ayuda ? { ayuda } : {}) });
// concept/3.0 (curación 2026-10-10): los ids y etiquetas son los de server/media-studio-enfoques-v3.json.
// La ayuda resume en una línea criolla la "ideaCentral" (enfoques) y la "instruccion" (tratamientos) de ese catálogo:
// Concepto la muestra en pantalla y arma con ella el resumen del comercial (2026-10-15, Lucas). En el resumen, "la app"
// se reemplaza por el nombre del proyecto.
const ENFOQUES = [
  c('caso', 'Un caso de principio a fin', 'Una persona con un problema real, y cómo la app se lo resuelve.'),
  c('producto', 'Producto a la vista', 'Se ve la app haciendo una tarea útil.'),
  c('dos-lados', 'Los dos lados', 'El que pide y el que atiende, unidos por la app.'),
  c('antes-despues', 'Antes y después', 'Cómo era antes y cómo es con la app.'),
  c('testimonio', 'Voz de una persona', 'Alguien lo cuenta en primera persona; se nota que es actuado, nunca un cliente inventado.'),
  c('institucional', 'Marca y visión', 'La promesa de la marca, sin un protagonista.'),
  c('humor', 'Situación con humor', 'Algo reconocible que da risa, y la app como respuesta.'),
];
const TRATAMIENTOS = [
  c('natural', 'Cotidiano', 'Gente creíble que habla natural.'),
  c('sobrio', 'Sobrio', 'Calma y confianza, sin drama.'),
  c('calido', 'Cálido', 'Cercano y humano, sin golpe bajo.'),
  c('aspiracional', 'Aspiracional', 'Cómo mejora, con pruebas y sin promesas grandes.'),
  c('humor', 'Con humor', 'Tiene chiste, sin que tape para qué sirve.'),
];

export const FUNCTION_CATALOG: StudioFunction[] = [
  // ── NIVEL PROYECTO ───────────────────────────────────────────────────────────
  {
    id: 'strategy',
    label: 'Estrategia',
    icon: 'Sparkles',
    level: 'project',
    description: 'Del brief saca público, ángulos y el plan de piezas de la campaña.',
    taskClass: 'creativo',
    options: [
      {
        id: 'perfil', label: 'Tipo de campaña', type: 'choice', default: 'campaña',
        choices: [
          c('awareness', 'Dar a conocer la marca · 1 spot'),
          c('demo', 'Mostrar cómo funciona · 1 spot'),
          c('conversion', 'Conseguir consultas · 1 spot'),
          c('campaña', 'Campaña completa · varias piezas'),
          c('solo-mockups', 'Solo pantallas animadas'),
        ],
      },
      // Cómo se cuenta y cómo se siente se decide POR PIEZA en Concepto, no para toda la campaña.
    ],
  },

  // ── NIVEL PIEZA ──────────────────────────────────────────────────────────────
  {
    id: 'montageDirection',
    label: 'Director de montaje',
    icon: 'Clapperboard',
    level: 'piece',
    description: 'Sugiere pausas de música, cortes y efectos según escenas reales del comercial; no inventa material.',
    taskClass: 'creativo',
    options: [],
  },
  {
    id: 'script',
    label: 'Guion',
    icon: 'FileText',
    level: 'piece',
    description: 'Desarrolla el concepto elegido en acciones, diálogos y cierre de marca; respeta el tratamiento.',
    taskClass: 'creativo',
    options: [], // los parámetros reales vienen del concepto, el formato y la pieza; no ofrecer controles fantasma

  },
  {
    id: 'publish',
    label: 'Publicación',
    icon: 'Megaphone',
    level: 'piece',
    description: 'Caption, hashtags, primeras palabras y CTA para la red elegida.',
    taskClass: 'transformacion',
    options: [
      {
        id: 'red', label: 'Red', type: 'choice', default: 'instagram',
        choices: [c('instagram', 'Instagram'), c('facebook', 'Facebook'), c('ambas', 'Ambas')],
      },
    ],
  },
  {
    id: 'qa',
    label: 'Crítica',
    icon: 'Gauge',
    level: 'piece',
    description: 'Le pone nota a la pieza (rúbrica) y marca qué ajustar.',
    taskClass: 'estructurado',
    options: [
      {
        id: 'foco', label: 'Foco', type: 'choice', default: 'todo',
        choices: [c('todo', 'Todo'), c('hook', 'El hook'), c('claridad', 'Claridad'), c('cta', 'El CTA')],
      },
    ],
  },

  // ── MOLDES DEL REWORK (pipeline storyboard-driven) ───────────────────────────
  // NOTA: `concept` es nivel PIECE (se corre 1 vez por comercial y lee el ángulo/brief de la pieza),
  // aunque el doc de fase 1 lo listó como 'project' — un molde project-level no tendría `piece`.
  {
    id: 'concept',
    label: 'Concepto',
    icon: 'Lightbulb',
    level: 'piece',
    description: 'Propone 3 conceptos de comercial para el ángulo de esta pieza, dentro del enfoque y el tratamiento elegidos.',
    taskClass: 'creativo',
    options: [
      // concept/3.0 (curación 2026-10-10): ids = server/media-studio-enfoques-v3.json. El enfoque organiza la historia;
      // el tratamiento decide el registro; la intensidad y el mecanismo sólo aparecen cuando hay humor.
      { id: 'enfoque', label: 'Tipo de historia', type: 'choice', default: 'caso', choices: ENFOQUES },
      { id: 'tratamiento', label: 'Clima del spot', type: 'choice', default: 'natural', choices: TRATAMIENTOS },
      { id: 'intensidadHumor', label: 'Intensidad del humor', type: 'choice', default: 'sutil', choices: [c('sutil', 'Sutil'), c('media', 'Media'), c('alta', 'Alta')] },
      {
        id: 'recursoHumorId', label: 'Mecanismo de humor', type: 'choice', default: 'auto',
        choices: [c('auto', 'Automático'), c('observacion', 'Observación cotidiana'), c('contraste', 'Contraste de escala'), c('inversion', 'Inversión de expectativas'), c('repeticion', 'Repetición'), c('malentendido', 'Malentendido'), c('literalidad', 'Literalidad'), c('deadpan', 'Deadpan'), c('callback', 'Callback'), c('cambio_perspectiva', 'Cambio de perspectiva')],
      },
    ],
  },
  {
    id: 'cast',
    label: 'Cast',
    icon: 'Users',
    level: 'piece',
    description: 'Define los personajes (descripción física exacta, reutilizable) y la locación.',
    taskClass: 'estructurado',
    options: [],
  },
  {
    id: 'storyboard',
    label: 'Storyboard',
    icon: 'Clapperboard',
    level: 'piece',
    description: 'Arma las escenas numeradas: plano, ángulo, duración, acción, diálogo y continuidad.',
    taskClass: 'estructurado',
    options: [],
  },
  {
    id: 'flowpack',
    label: 'Pack Flow',
    icon: 'PackageOpen',
    level: 'piece',
    description: 'Prompt maestro + un prompt por clip para Google Flow, con personajes consistentes.',
    taskClass: 'transformacion',
    options: [],
  },
  {
    // WO-6c/D9: molde standalone — un prompt de Flow suelto, fuera de un proyecto. Tier sonnet (llamada
    // corta). Sus options las arma la UI de Videos (brief + modo); no se elige desde el pipeline.
    id: 'videoprompt',
    label: 'Prompt de Flow',
    icon: 'Sparkles',
    level: 'piece',
    description: 'Genera un prompt de Google Flow (Veo) suelto — talking head o b-roll — listo para pegar.',
    taskClass: 'transformacion',
    options: [
      {
        id: 'modo', label: 'Tipo', type: 'choice', default: 'talking-head',
        choices: [c('talking-head', 'Talking head'), c('b-roll', 'B-roll')],
      },
    ],
  },
  {
    // Segunda fuente de entrada (KSP por texto) — cura un brief libre al shape del KnowledgeBase.
    // Standalone (Integrar), no se elige desde el pipeline; la UI arma options.brief.
    id: 'briefToKb',
    label: 'Negocio desde texto',
    icon: 'FileText',
    level: 'piece',
    description: 'Convierte un texto libre sobre el negocio al Knowledge Base que consume el pipeline.',
    taskClass: 'transformacion',
    options: [],
  },
  {
    // Línea animada (2026-10-09): el dueño describe el reel con sus palabras y salen las escenas de mockups
    // sobre las pantallas del kit. La UI del paso Render arma options.descripcion; no se elige desde el pipeline.
    id: 'mockupsTexto',
    label: 'Reel desde tu descripción',
    icon: 'MessageSquareText',
    level: 'piece',
    description: 'Convierte una descripción libre del reel en escenas de mockups sobre las pantallas reales del kit.',
    taskClass: 'estructurado',
    options: [],
  },
];

// helpers de lectura para la UI
export const projectFunctions = (): StudioFunction[] => FUNCTION_CATALOG.filter((f) => f.level === 'project');
export const pieceFunctions = (): StudioFunction[] => FUNCTION_CATALOG.filter((f) => f.level === 'piece');
export const getFunction = (id: string): StudioFunction | undefined => FUNCTION_CATALOG.find((f) => f.id === id);

// Modelo que corre un molde con un preset dado. ÚNICA resolución preset×clase → modelo (la usa
// settings.effectiveModel; el back tiene la misma tabla para cuando el front no manda modelo).
export function modelForPreset(preset: AiPreset, functionId: string): ModelTier | undefined {
  const fn = getFunction(functionId);
  return fn ? PRESETS[preset][fn.taskClass] : undefined;
}
