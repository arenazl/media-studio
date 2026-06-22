# Contrato del KIT — la salida del orquestador que consume el editor

> El **kit** es el objeto que produce `promo-producer` (panel de skills) y que el **editor
> de media-studio** carga para componer y renderizar. Es el contrato entre el "cerebro de
> marketing" y la "fábrica de video". Agnóstico de rubro.

## Esquema (TypeScript)

```typescript
interface Kit {
  project: string;                 // nombre del proyecto
  briefRef: string;                // ruta/id del brief de hechos
  profile: 'awareness' | 'demo' | 'conversion' | 'campaign' | 'mockups-only';
  positioning: string;             // la promesa central, 1 frase (del estratega)
  audiences: Audience[];           // segmentos objetivo
  pieces: Piece[];                 // las piezas de la campaña
  createdAt?: number;
}

interface Audience { label: string; pain: string; language: string }

interface Piece {
  id: string;
  objective: 'awareness' | 'consideration' | 'conversion';
  angle: string;                   // el ángulo elegido (del estratega)
  format: 'reel-9x16' | 'video-16x9';
  platforms: string[];             // ['instagram-reels', 'tiktok', ...]
  durationSec: number;             // 15-25 típico
  script: Script;                  // de promo-director
  slides?: Slide[];                // de mockup-designer (si el formato usa mockups)
  videoPrompts?: VeoPrompt[];      // de veo-flow-prompter (si usa b-roll/talking head)
  narration: Narration;            // voz: TTS o locutor real (conecta con la pestaña Audio)
  publish: Publish;                // de social-platform-specialist
  qa?: Qa;                         // de promo-critic
}

// --- Guion (promo-director) ---
interface Script { blocks: Block[]; music: MusicCue }
interface Block {
  role: 'hook' | 'dolor' | 'solucion' | 'prueba' | 'cta';
  tStart: number; tEnd: number;    // segundos dentro de la pieza
  narration: string;               // la línea de voz, calibrada por duración
  visual: string;                  // qué se ve en el plano
}
interface MusicCue { mood: 'energica' | 'inspiradora' | 'calida' | 'cinematografica'; trackId?: string }

// --- Mockups (mockup-designer) — alineado con el spec por slide ---
interface Slide {
  capture: string;                 // archivo de la carpeta de capturas
  framing: string;                 // zona a mostrar (9:16)
  device: 'phone' | 'none';
  highlight: string;               // el UN elemento dominante
  motion: 'zoom-in' | 'pan' | 'counter' | 'item-in';
  cover?: string[];                // datos sensibles a tapar
  copy?: string;                   // título corto en pantalla (<= 5 palabras)
}

// --- Video IA (veo-flow-prompter) ---
interface VeoPrompt {
  template: 'A' | 'B' | 'C';       // talking head / b-roll lugar / b-roll dia-a-dia
  prompt: string;                  // listo para copiar a Flow
  settings: { model: 'veo-3'; aspect: '9:16'; seconds: 4 | 8 };
  brandPhonetic?: string;          // marca como suena (ej. "Munifái")
}

// --- Narración (conecta con la pestaña Audio / VoiceConfig del editor) ---
interface Narration {
  mode: 'tts' | 'real';            // sintética o locutor real
  text: string;                    // el guion de voz completo
  // mode 'tts':
  voiceId?: string;
  voiceConfig?: { stability: number; similarity: number; style: number; speed: number; model: string };
  // mode 'real': el locutor grabó; el editor usa estos segmentos en vez de generar TTS
  segments?: AudioSegment[];
}
interface AudioSegment {
  id: string;
  label: string;                   // "Hook", "CTA", "Frase 2"...
  startSec: number; endSec: number;// recorte dentro del audio real
  phraseIndex?: number;            // a qué bloque/frase del guion va
}

// --- Publicación (social-platform-specialist) ---
interface Publish {
  hookOnScreen: string;            // <= 6 palabras, primeras palabras
  caption: string;
  hashtags: string[];
  cta: string;
  bestTime?: string;               // orientativo
}

// --- QA (promo-critic) ---
interface Qa {
  score: number;                   // 0-50
  verdict: 'LISTO PARA PRODUCIR' | 'AJUSTAR' | 'REHACER';
  issues: { severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; note: string }[];
}
```

## Notas de integración con el editor
- `narration.mode === 'real'` + `segments` → el editor (pestaña Audio) ya recortó el audio
  del locutor; cada `AudioSegment` se mapea a un clip de voz con `offset = startSec` y
  `dur = endSec - startSec` (el motor `montageAudio.ts` ya soporta `offset`).
- `slides` → capa Animaciones/Mockups del editor.
- `videoPrompts` → se generan en Flow afuera; los clips resultantes entran por la capa Video.
- `script.blocks[].tStart/tEnd` → marcan el ritmo del timeline (planos 2-4s).
