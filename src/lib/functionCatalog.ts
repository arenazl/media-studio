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
  choices?: { value: string; label: string }[];
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
const c = (value: string, label = value) => ({ value, label });

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
          c('awareness', 'Awareness'),
          c('demo', 'Demo de producto'),
          c('conversion', 'Conversión'),
          c('campaña', 'Campaña completa'),
          c('solo-mockups', 'Solo mockups'),
        ],
      },
    ],
  },

  // ── NIVEL PIEZA ──────────────────────────────────────────────────────────────
  {
    id: 'script',
    label: 'Guion',
    icon: 'FileText',
    level: 'piece',
    description: 'Escribe el guion por bloques (hook → dolor → solución → prueba → CTA).',
    taskClass: 'creativo',
    options: [
      {
        id: 'tono', label: 'Tono', type: 'choice', default: 'cercano',
        choices: [c('cercano', 'Cercano'), c('serio', 'Serio'), c('urgente', 'Urgente'), c('divertido', 'Divertido')],
      },
      {
        id: 'duracion', label: 'Duración', type: 'choice', default: '20', unit: 's',
        choices: [c('15'), c('20'), c('25')],
      },
      {
        id: 'estructura', label: 'Ángulo', type: 'choice', default: 'dolor-solucion',
        choices: [
          c('dolor-solucion', 'Dolor → solución'),
          c('dato', 'Dato / autoridad'),
          c('fomo', 'FOMO / oferta'),
          c('como-funciona', 'Cómo funciona'),
        ],
      },
    ],
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
    description: 'Propone 2-3 conceptos de comercial para el ángulo de esta pieza (idea, tono, estética).',
    taskClass: 'creativo',
    options: [
      {
        id: 'perfil', label: 'Perfil', type: 'choice', default: 'campaña',
        choices: [c('campaña', 'Campaña completa'), c('awareness', 'Awareness'), c('demo', 'Demo de producto'), c('conversion', 'Conversión')],
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
