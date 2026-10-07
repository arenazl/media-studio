---

<!-- FILE: 00-START-HERE.md -->

# Media Studio — Reingeniería funcional sin rediseñar el producto

## Objetivo

Este paquete es una guía de implementación para Claude Code sobre el repositorio actual de **Media Studio**.

La consigna principal es:

> **NO rediseñar la arquitectura, el flujo ni el pipeline de producto.**
> La organización actual Concepto → Guion → Cast → Storyboard → Pack Flow → Publicar es válida.
> El trabajo consiste en hacer que cada pieza interna sea rápida, consistente, verificable y de buena calidad.

El sistema ya tiene una separación útil por etapas, persistencia por proyecto/pieza, Media Kit, salida a Flow/Veo, TTS, ffmpeg y un camino animado. El problema actual es de **ejecución interna**, no de concepto de producto.

## Fuentes de verdad de este trabajo

1. `01-radiografia-como-se-genera-cada-etapa.md`
   - describe el estado real al 2026-10-07;
   - contiene los prompts actuales;
   - documenta modelos, inputs, parseo, latencias y bugs conocidos.

2. `SKILL.md`
   - define un pipeline probado para render de reels 3D/animados:
     Three.js + Chrome headless + render frame-by-frame + ElevenLabs + ffmpeg + QA.
   - su mecánica es reutilizable, pero su narrativa específica "developer ↔ Claude" debe generalizarse.

## Resultado esperado

Al terminar esta reingeniería:

- el usuario mantiene las mismas pantallas y el mismo flujo;
- cada generación recibe sólo el contexto que necesita;
- los outputs tienen contratos estables;
- no se pierde información del brief;
- una etapa no se rompe porque cambió el shape de otra;
- los prompts no se contradicen;
- las regeneraciones son locales;
- los errores se detectan antes de persistir;
- cada llamada queda medida;
- las animaciones tienen previsualización por stills antes del render completo;
- Flow/Veo y el motor animado conviven dentro del pipeline actual.

## Regla de trabajo para Claude Code

Antes de modificar código:

1. localizar la implementación real;
2. confirmar que coincide con la radiografía;
3. crear o actualizar tests;
4. hacer el cambio mínimo;
5. medir;
6. recién después pasar al siguiente tornillo.

No hacer un "big bang rewrite".


---

<!-- FILE: 01-ARQUITECTURA-QUE-NO-SE-TOCA.md -->

# 01 — Arquitectura que NO se toca

## Invariantes de producto

Conservar:

```text
Proyecto / Campaña
    ↓
Concepto
    ↓
Guion
    ↓
Cast
    ↓
Storyboard
    ↓
Pack Flow / Producción
    ↓
Publicar / QA
```

Para piezas animadas, conservar el mismo recorrido conceptual. El motor de render puede cambiar por debajo.

## Invariantes técnicos

Mantener el patrón existente:

```text
PasoX.tsx
  → runMolde(...)
  → POST /api/run-function
  → buildFunctionPrompt(...)
  → runAI(...)
  → parseFunctionResult(...)
  → persistencia del proyecto/pieza
```

No es obligatorio mantener cada función con el mismo contenido, pero sí mantener la interfaz del producto mientras se migra internamente.

## Qué sí puede cambiar por debajo

- construcción de contexto;
- selección de modelo;
- versionado de prompts;
- validación;
- retries;
- caching;
- parseo;
- normalización del KB;
- compilación de Flow;
- QA determinístico;
- instrumentación;
- implementación del render animado;
- estado interno de generación.

## Principio rector

Las pantallas son **etapas de trabajo del usuario**.

No asumir que cada pantalla tiene que equivaler a "una llamada grande a IA". Una pantalla puede:
- llamar IA;
- ejecutar código determinístico;
- combinar ambas cosas;
- reutilizar una salida cacheada.

El UX se conserva aunque cambie el motor.


---

<!-- FILE: 02-DIAGNOSTICO-Y-BUGS-P0.md -->

# 02 — Diagnóstico confirmado y bugs P0

## P0.1 — El brief se corta a 2.500 caracteres

Estado actual:
- `ctx()` corta `project.brief` con `.slice(0, 2500)`;
- `concept` también usa un brief recortado;
- un brief real de Munify supera ampliamente ese tamaño.

### Consecuencia
El sistema decide conceptos y estrategia con una fracción arbitraria de los hechos.

### Fix
No reemplazar el corte por otro número arbitrario.

Crear una representación normalizada:

```ts
type ProjectFacts = {
  name: string;
  description?: string;
  audiences?: Array<{label:string; pain?:string; language?:string}>;
  offerings?: string[];
  differentiators?: string[];
  proofPoints?: string[];
  objections?: string[];
  pricing?: unknown;
  cta?: { text?: string; url?: string };
  screens?: ScreenFact[];
  doNotSay?: string[];
  brand?: unknown;
};
```

Fuente:
1. KB 1.2 si existe;
2. si sólo hay brief, normalizarlo una vez;
3. conservar también `rawBrief` para consulta excepcional.

Cada molde debe pedir un subconjunto de `ProjectFacts`, no el comienzo truncado del texto.

---

## P0.2 — `ctx().guion` no entiende el shape actual

Estado actual:
- el código viejo espera array de strings;
- el guion actual es `{ blocks: [...] }`;
- `publish` y ciertos caminos de `qa` caen al brief.

### Consecuencia
Se genera copy sin haber leído el guion que se está publicando.

### Fix
Crear UN helper canónico:

```ts
function scriptToText(guion: unknown): string
```

Debe aceptar:
- formato legacy;
- `{blocks:[...]}`;
- futuro shape versionado.

Todo el repo debe importar ese helper. Eliminar flatteners duplicados.

Tests obligatorios:
- array legacy;
- blocks nuevo;
- vacío;
- bloque con narration faltante;
- caracteres especiales.

---

## P0.3 — `cast` usa `x.industry` inexistente

Estado actual:
- `x.industry` no existe en `ctx()`;
- cae a `x.brief`;
- termina metiendo el brief completo dentro de una regla de locación.

### Fix
Agregar `industry`/`businessContext` explícito a `ProjectFacts`, derivado del KB.
Nunca interpolar un brief entero dentro de una oración.

Contrato sugerido:

```ts
businessContext: {
  industry?: string;
  physicalEnvironment?: string[];
  userTypes?: string[];
}
```

---

## P0.4 — Contradicción dentro de las reglas de Veo

Existen simultáneamente estas ideas:
- no repetir `fisicoEn`, porque la imagen de referencia fija identidad;
- mantener la misma descripción física exacta.

### Fix
Elegir una sola política para el flujo actual:

**Flujo con Character/Entity image:**
- identidad = imagen de referencia;
- prompt de escena = nombre + nacionalidad + descripción corta necesaria;
- NO copiar `fisicoEn` largo.

Eliminar del prompt final cualquier regla legacy incompatible.

Crear un test de texto:
- `flowpack` compilado no debe contener instrucciones contradictorias conocidas.

---

## P0.5 — El modelo queda decidido en la práctica por el frontend

Hoy el router del backend rara vez decide porque el catálogo ya manda `model`.

### Fix
Conservar el setting de UI, pero separar:

```ts
userModelOverride?: "opus"|"sonnet"|"haiku"
taskClass: "creative"|"structured"|"transform"|"critic"
```

Política backend por defecto:
- creative: Sonnet;
- structured: Sonnet;
- transform: Haiku/Sonnet;
- critic: Sonnet;
- Opus: override/premium/retry por calidad.

El frontend no debería hardcodear una dependencia estructural con un modelo concreto.

---

## P0.6 — Autodisparo debe ser idempotente

No se pide eliminar el autodisparo.

Sí se pide impedir:
- dobles generaciones;
- llamadas por re-render de React;
- regeneración si el input semántico no cambió;
- resultados viejos pisando resultados nuevos.

Implementar `generationKey`:

```text
sha256(
  functionId
  + promptVersion
  + normalizedInput
  + options
)
```

Estados:
- idle
- queued
- running
- valid
- stale
- error

Si existe un resultado `valid` para la misma key, reutilizarlo.

---

## P0.7 — Parseo demasiado permisivo

`extractJson` rescata objetos balanceados, lo cual está bien como tolerancia, pero la validación posterior es mínima.

### Fix
Cada función debe tener:
1. schema;
2. validator;
3. normalizer;
4. semantic lint.

Ejemplo:
- JSON válido no significa storyboard válido;
- `durSec` puede ser absurdo;
- ids de personajes pueden no existir;
- screen puede no existir;
- roles pueden faltar.

No persistir como válido hasta pasar las cuatro capas.


---

<!-- FILE: 03-PROMPT-ENGINE-V2.md -->

# 03 — Prompt Engine V2

## Objetivo

Mejorar calidad y latencia sin cambiar las pantallas.

## Regla 1 — Prompt pequeño, datos estructurados

Formato estándar:

```text
SYSTEM
TASK
INPUT JSON
CONSTRAINTS
OUTPUT SCHEMA
```

Evitar:
- repetir el brief bruto;
- repetir reglas universales en cada prompt;
- meter blobs JSON que la etapa no usa;
- explicar el producto dos veces;
- reglas contradictorias heredadas.

## System prompt común

Propuesta base:

```text
Sos parte de un estudio de producción audiovisual.
Cumplís exactamente la tarea pedida.
Usás únicamente los hechos provistos en INPUT.
No inventás cifras, funciones, integraciones, clientes, premios ni resultados.
Respetás el schema de salida.
No agregás markdown ni comentarios fuera del formato solicitado.
```

Las reglas específicas de tono o idioma van en la tarea, no en el system universal.

## Regla 2 — Versionar todos los prompts

Cada request debe registrar:

```ts
{
  functionId: "concept",
  promptVersion: "concept/2.0",
  schemaVersion: "concept-result/1.0"
}
```

Nunca cambiar silenciosamente un prompt productivo sin incrementar versión.

## Regla 3 — Input por función

Crear selectores explícitos:

```ts
buildStrategyInput(project)
buildConceptInput(project, piece, options)
buildScriptInput(...)
buildCastInput(...)
buildStoryboardInput(...)
buildFlowInput(...)
buildPublishInput(...)
buildQaInput(...)
```

No usar un `ctx()` gigante que intenta servir para todo.

## Regla 4 — Longitudes explícitas

Todo campo de salida textual debe tener límites.

Ejemplos:
- concepto.idea: 40–60 palabras;
- script.narration: max palabras calculado por duración;
- cast.fisicoEn: 25–45 palabras;
- cast.descripcionEn: 25–50 palabras;
- storyboard.accion: <= 14 palabras;
- storyboard.continuidad: <= 8 palabras;
- flow scene prompt: límite recomendado 90–140 palabras si sigue siendo IA;
- publish.caption: 2–4 líneas.

## Regla 5 — La duración debe gobernar el texto

Helper determinístico:

```ts
maxNarrationWords(durationSec, wps = 2.7)
```

El prompt no debe decir sólo "sé breve": debe decir el máximo calculado.

Validar post-respuesta.

## Regla 6 — Regeneración con contexto mínimo

Regenerar un elemento no vuelve a mandar todo.

Ejemplo:
`script item` recibe:
- negocio resumido;
- concepto;
- rol del bloque;
- bloque actual;
- restricciones;
- duración objetivo.

No necesita brandKit completo ni storyboard.

## Regla 7 — Retry inteligente

Retry automático sólo cuando:
- JSON inválido;
- schema inválido;
- falta campo obligatorio;
- semantic lint reparable.

Primer retry:
- mismo modelo;
- prompt de reparación corto;
- incluir errores concretos;
- no volver a pedir creatividad completa.

Segundo retry:
- subir modelo sólo si corresponde.

## Regla 8 — No usar Opus como martillo universal

Default sugerido:
- strategy: Sonnet;
- concept: Sonnet;
- script: Sonnet;
- cast: Sonnet;
- storyboard: Sonnet;
- flowpack: compilador + Sonnet sólo para huecos creativos;
- publish: Haiku;
- qa creativo: Sonnet;
- videoprompt: Sonnet;
- briefToKb: Sonnet.

Opus:
- botón de calidad máxima;
- fallback ante score bajo;
- tareas excepcionales.

## Regla 9 — Respuestas estructuradas

Si el proveedor soporta JSON Schema/structured output, usarlo.
Si no, mantener el parser actual como fallback.

## Regla 10 — Telemetría por llamada

Guardar:
- functionId;
- promptVersion;
- provider;
- model;
- input chars/tokens estimados;
- output chars/tokens;
- start/end;
- durationMs;
- parseMs;
- retryCount;
- validationErrors;
- generationKey;
- cost si está disponible.


---

<!-- FILE: 04-ESPECIFICACION-POR-ETAPA.md -->

# 04 — Especificación por etapa

## 4.1 Strategy

### Responsabilidad
Transformar conocimiento del negocio en un set de piezas con ángulos distintos.

### No debe
- redactar guiones;
- inventar claims;
- obligar a que todas las piezas repitan exactamente todo el negocio.

### Input
```json
{
  "business": {},
  "audiences": [],
  "offerings": [],
  "differentiators": [],
  "objections": [],
  "campaignProfile": "campaña",
  "format": {}
}
```

### Output
Mantener `positioning`, `audiences`, `pieces`.

Agregar opcional:
```json
{
  "messageScope": "brand-global|problem|demo|benefit|proof|objection|conversion"
}
```

### Acceptance
- piezas realmente distintas;
- angle <= 4 palabras;
- no claims no soportados;
- no duplicados semánticos.

---

## 4.2 Concept

### Responsabilidad
Dar 3 direcciones creativas para elegir.

### Mantener
La versión curada actual va en la dirección correcta:
- diferencia concepto de guion;
- fuerza tres tipos de gancho;
- limita longitudes;
- distingue filmado/animado.

### Ajustes
- Input desde `ProjectFacts`, no brief truncado.
- Para animado, no imponer todavía implementación de Three.js.
- Respetar `messageScope` de Strategy.
- No exigir "todo el negocio" si la pieza fue planeada con foco específico.

### Semantic lint
- 3 conceptos;
- ganchos distintos;
- idea dentro del rango;
- no contiene timestamps/shot list;
- no contiene claims fuera de facts.

---

## 4.3 Script

### Responsabilidad
Convertir concepto elegido en cuatro bloques narrativos.

Mantener roles:
```text
hook → desarrollo → gag → cta
```

### Input mínimo
- facts relevantes;
- concepto;
- angle;
- messageScope;
- técnica;
- media moments/screens relevantes;
- duración;
- tono;
- CTA validado.

### Output
```json
{
  "blocks": [
    {
      "role": "hook",
      "narration": "",
      "visual": "",
      "durSec": 0
    }
  ],
  "music": {"mood": ""}
}
```

### Reglas
- suma de duraciones cercana al target;
- word budget calculado;
- CTA sólo usa CTA permitido;
- animado: visual describe UI/motion o escena animada; no filmación accidental;
- filmado: puede describir actuación/locación.

### Validation
- exactamente los roles esperados;
- gag antes de cta;
- word count;
- no bloque vacío;
- no facts inventados.

---

## 4.4 Cast

### Responsabilidad
Definir identidad visual reutilizable para piezas filmadas o animaciones con personajes.

### Input
- businessContext estructurado;
- concepto;
- scriptToText();
- técnica.

### Salida
Mantener shape actual mientras sea posible.

### Límites
- `fisicoEn`: 25–45 palabras;
- `fisicoEs`: <= 18 palabras;
- `descripcionEn`: 25–50 palabras;
- `personalidad`: 1–3 palabras.

### Regla de locación
Derivar del `businessContext.physicalEnvironment`, no del brief crudo.

### Animaciones
Si la animación no necesita personajes, Cast debe permitir:
```json
{"personajes":[],"lugar":{...}}
```
sin obligar a inventarlos.

---

## 4.5 Storyboard

### Responsabilidad
Convertir el guion a escenas producibles.

### Filmado
Mantener:
- roles;
- continuidad;
- ids de cast;
- dialogue;
- plano;
- ángulo;
- duración.

### Animado
Mantener:
- `screen`;
- `accion`;
- `durSec`;
- continuidad;
- asignación determinística de captura real.

Ampliar con campos opcionales compatibles con el motor nuevo:
```json
{
  "animationMode": "ui|3d|hybrid",
  "focus": "screen|character|prop",
  "motion": "push-in|pan|orbit|static|custom"
}
```

No es obligatorio exponerlos todos en la UI.

### Validation
- suma de duraciones;
- screen existe o `[demo]`;
- personaje existe;
- dialogue/voiceover consistente;
- no scene con duración imposible;
- continuidad referencial válida.

---

## 4.6 Flow Pack

### La pantalla se mantiene

No eliminar `Pack Flow`.

### Cambio interno
Dividir en:

1. `compileFlowPack()` determinístico;
2. `enrichFlowPrompt()` opcional sólo si falta creatividad visual.

### Compilador
Entradas:
- storyboard;
- cast;
- brand;
- phonetic;
- canonical Veo rules.

Salida idéntica o compatible con la UI actual:
```json
{
  "estilo": "",
  "personajes": [],
  "escenas": []
}
```

### Regla
Las reglas técnicas de Veo viven en UN módulo versionado.
No copiarlas dentro de múltiples prompts.

---

## 4.7 Publish

### Fix prioritario
Debe leer `scriptToText(guion)`.

### Modelo
Haiku por defecto.

### Input
- red;
- script;
- CTA permitido;
- messageScope;
- nombre.

No necesita storyboard/cast/brandKit completos.

---

## 4.8 QA

Separar dos capas.

### A. `lintCommercial()` — sin IA
Checks:
- roles;
- duración;
- orden;
- words/sec;
- CTA;
- screen ids;
- cast ids;
- marca fonética;
- claims permitidos;
- escena talking-head compatible con duración;
- contradicciones de pack;
- assets faltantes.

### B. `creativeQA()` — Sonnet
Evalúa:
- gancho;
- claridad;
- ritmo;
- coherencia;
- originalidad;
- fuerza del cierre.

La nota creativa nunca reemplaza errores técnicos.

---

## 4.9 VideoPrompt

Mantener como herramienta suelta.

Cambiar:
- importar `VEO_RULES` canónicas;
- no duplicarlas;
- soporte de `promptVersion`;
- validar longitud.

---

## 4.10 briefToKb

Es la puerta a la calidad del resto.

### Reglas
- no inventar;
- conservar datos textuales;
- capturar industry/environment cuando esté explícito;
- generar `ProjectFacts` determinístico desde el KB.

Agregar tests con:
- brief corto;
- brief de 8K+ chars;
- pricing ausente;
- varias offerings;
- pantallas;
- do_not_say.


---

<!-- FILE: 05-INTEGRACION-SKILL-ANIMACIONES.md -->

# 05 — Integración del SKILL de animaciones

## Principio

El `SKILL.md` recibido contiene dos cosas mezcladas:

1. **motor/mecánica excelente y reutilizable**;
2. una narrativa específica "developer ↔ Claude" que NO pertenece a Media Studio.

La integración debe reutilizar la mecánica y generalizar el contenido.

## Qué se conserva

Conservar como principios del motor:

- video vertical 1080x1920;
- 30 fps;
- render frame-by-frame;
- Three.js;
- Chrome/Edge headless;
- WebGL GPU real;
- abortar ante SwiftShader/software rendering;
- un solo browser;
- prioridad baja;
- no workers paralelos;
- `window.setT(t)` puro y determinístico;
- timeline como fuente única de timing;
- ElevenLabs con cache;
- word alignment;
- subtítulos;
- shots/cámara;
- grounding;
- penetration checks;
- motion lint;
- stills/contact sheet antes del full render;
- render resumible por chunks;
- ffmpeg + ffprobe;
- verificación de loudness y video final.

## Qué se elimina/generaliza

Eliminar del skill productivo:
- developer obligatorio;
- Claude character obligatorio;
- humor de programadores;
- diálogo ping-pong obligatorio;
- "open with Claude";
- identidad visual de Claude;
- obligación de dos personajes.

Sustituir por entrada del storyboard.

## Nuevo nombre sugerido

```yaml
name: media-studio-animation-renderer
description: Render a Media Studio animated reel from a validated storyboard, brand assets, screen captures and narration using Three.js, ElevenLabs, headless Chrome and ffmpeg.
```

## Contrato de entrada

Crear `animation-job.json`:

```json
{
  "jobVersion": "1.0",
  "projectId": "",
  "pieceId": "",
  "format": {"width":1080,"height":1920,"fps":30},
  "durationSec": 25,
  "brand": {},
  "voice": {
    "voiceId": "",
    "phoneticBrand": ""
  },
  "cast": [],
  "screens": [],
  "script": {"blocks":[]},
  "storyboard": {"escenas":[]},
  "assets": {
    "logo": "",
    "screenshots": []
  }
}
```

El skill NO vuelve a decidir:
- estrategia;
- concepto;
- mensaje;
- CTA;
- claims;
- texto aprobado.

## Flujo adaptado

```text
animation-job.json
   ↓
requirements + GPU probe
   ↓
audio/voices
   ↓
timeline
   ↓
scene construction
   ↓
stills
   ↓
automated QA
   ↓
contact sheet
   ↓
APPROVAL STATE
   ↓
full render in chunks
   ↓
mix
   ↓
mux
   ↓
ffprobe + final contact sheet
   ↓
MP4
```

## Integración con la UI

En el paso de producción animada:

Estados sugeridos:
```text
preparing
audio
timeline
scene
stills
needs_approval
rendering
mixing
verifying
done
error
```

Mostrar:
- progreso real;
- contact sheet;
- botón "Aprobar render";
- "Regenerar escena N";
- "Cambiar estilo";
- errores claros.

## Stills obligatorios

No permitir `full render` sin:
- frame 1;
- principio/final de cada shot;
- beats de movimiento relevantes;
- frame previo al cierre.

La aprobación puede persistirse:
```json
{
  "stillsVersion": "...",
  "approvedAt": "...",
  "approvedBy": "user"
}
```

Si cambia storyboard/timeline/scene config, invalidar aprobación.

## `setT(t)` como contrato no negociable

`window.setT(t)`:
- no `performance.now`;
- no `requestAnimationFrame`;
- no random sin seed;
- no physics acumulativa;
- no dependencia del frame anterior.

Esto hace posible:
- resume;
- stills baratos;
- regeneración parcial;
- QA frame-by-frame.

## Job workspace

Usar carpeta por pieza:

```text
server/storage/<project>/<piece>/animation/
    input/
        animation-job.json
        assets/
    work/
        film.html
        scene.js
        timeline.mjs
        ...
    vo/
    stills/
    frames/
    output/
```

No ensuciar la raíz del repo.

## Reutilización de templates

Extraer partes estables del skill a templates versionados:
- `film.html`;
- `cdp.mjs`;
- `render.mjs`;
- `check.mjs`;
- postprocessing;
- subtitle layout;
- audio utilities.

Claude sólo genera/configura lo específico del reel.

## QA obligatorio antes del render

Automatizar:
- teleports;
- acceleration spikes;
- jitter;
- grounding;
- penetration;
- duplicated key times;
- NaN;
- camera intersections;
- subtitle bounds;
- clipping;
- stale stems.

Bloquear render si hay errores severos.

## Relación con el render actual

No eliminar `mockupReel.mjs`.

Ofrecer dos motores debajo de la misma pieza animada:
- `mockup`: rápido;
- `full-animation`: skill adaptada.

El pipeline del usuario no cambia.


---

<!-- FILE: 06-OBSERVABILIDAD-Y-PERFORMANCE.md -->

# 06 — Observabilidad y performance

## No optimizar a ciegas

Crear un registro por ejecución.

### Tabla sugerida: `generation_runs`

```text
id
project_id
piece_id
function_id
prompt_version
schema_version
provider
model
generation_key
started_at
finished_at
duration_ms
input_chars
output_chars
input_tokens_est
output_tokens_est
cost_usd
retry_count
status
error_type
validation_errors_json
```

## Métricas mínimas por pantalla

Mostrar en dev mode:
- modelo;
- tiempo;
- retries;
- prompt version;
- cache hit;
- input size;
- output size.

## Budgets iniciales

Objetivos después de la limpieza:

| Etapa | Target |
|---|---:|
| Strategy | <= 25 s |
| Concept | <= 25 s |
| Script | <= 20 s |
| Cast | <= 15 s |
| Storyboard | <= 20 s |
| FlowPack compilado | <= 2 s |
| Publish | <= 10 s |
| QA creativo | <= 15 s |

No convertir estos números en timeouts duros al inicio. Son SLOs para medir.

## Context budget

Registrar por prompt:
- tamaño de facts;
- concepto;
- guion;
- cast;
- storyboard;
- reglas.

Si un bloque supera 40% del prompt y no es imprescindible, revisar.

## Cache

Cachear por `generationKey`.

Casos:
- volver a entrar a pantalla: hit;
- refresh: hit;
- mismo input: hit;
- cambio de tono: miss sólo donde aplica;
- cambio de concepto: invalida downstream;
- cambio de caption: no invalida producción.

## Concurrencia

Evitar que múltiples autodisparos compitan.

Backend:
- lock por `projectId + pieceId + functionId + generationKey`;
- si hay una ejecución igual en curso, suscribirse/reutilizar;
- cancelar/ignorar respuesta de una generación vieja si cambió el input.

## CLI Claude

Ya se eliminó el enorme contexto accidental de Claude Code mediante clean mode.

Mantener:
- `--setting-sources ""`;
- tools vacías para texto puro;
- system prompt mínimo.

Para tareas con archivos/imágenes, usar el camino necesario, pero medirlo aparte.

## Render animado

Métricas:
- GPU renderer;
- ms/frame;
- frames rendered;
- frames skipped/resumed;
- retries por blank frame;
- duración render;
- duración mux;
- tamaño MP4.

Nunca acelerar usando workers paralelos si contradice las reglas del skill.


---

<!-- FILE: 07-TESTS-Y-CRITERIOS-DE-ACEPTACION.md -->

# 07 — Tests y criterios de aceptación

## Estrategia

Tres niveles:

1. unit tests;
2. contract/golden tests;
3. end-to-end de una pieza real.

---

## A. Unit tests

### Contexto
- ProjectFacts desde KB;
- scriptToText legacy;
- scriptToText blocks;
- screen matcher;
- CTA extraction;
- claim validator.

### Prompt builders
Snapshot por versión:
- concept;
- script;
- cast;
- storyboard;
- publish;
- qa.

El snapshot no debe incluir:
- brief truncado por accidente;
- campos ajenos;
- reglas contradictorias.

### Parsers
- JSON limpio;
- markdown wrapper;
- texto antes/después;
- JSON roto reparable;
- schema inválido;
- arrays vacíos.

### Flow compiler
Golden outputs por:
- talking head;
- b-roll;
- CTA;
- escena sin actor;
- screen;
- personaje por imagen.

---

## B. Golden fixtures

Crear `/server/tests/fixtures/media-studio/`.

### Fixture 1 — Brief largo
- > 8.000 caracteres;
- facts importantes tanto al principio como al final.

Acceptance:
- los facts del final llegan a Concept y Strategy a través del KB/ProjectFacts.

### Fixture 2 — Guion nuevo
```json
{"blocks":[...]}
```
Acceptance:
- publish y qa leen el guion;
- jamás caen silenciosamente al brief.

### Fixture 3 — Animado con Media Kit
- screens reales;
- moments;
- CTA.

Acceptance:
- storyboard usa labels reales;
- screenshot assignment correcto;
- animation-job contiene assets reales.

### Fixture 4 — Filmado con cast
Acceptance:
- storyboard referencia sólo ids existentes;
- FlowPack no repite `fisicoEn` largo si se usa image entity.

### Fixture 5 — Regeneración
Regenerar escena 3.

Acceptance:
- no cambia escena 1/2/4;
- no vuelve a generar cast;
- generation key distinta sólo para ese item.

---

## C. E2E real

Usar una pieza conocida, por ejemplo Munify.

Flujo:
1. project;
2. strategy;
3. concept;
4. choose;
5. script;
6. cast/skip según técnica;
7. storyboard;
8. pack/render;
9. publish;
10. QA.

Guardar:
- output;
- tiempo;
- tokens/costo;
- screenshots;
- errores.

Comparar contra baseline actual.

---

## Acceptance global

### Calidad funcional
- 0 pérdidas silenciosas de campos;
- 0 fallback silencioso brief↔guion;
- 0 contradicciones canónicas en Veo;
- 0 ids rotos;
- 0 screen refs inexistentes salvo `[demo]`;
- outputs parseables >= 99% con un retry.

### Performance
- reducir mediana de latencia de etapas estructuradas;
- FlowPack determinístico prácticamente inmediato;
- reducir uso de Opus;
- cache hits al renavegar.

### UX
- no cambia el orden del pipeline;
- no cambia el concepto de las pantallas;
- regeneración granular;
- errores visibles y accionables;
- animación muestra stills antes de render.

### Render animado
Antes de `done`:
- GPU check;
- QA motion clean;
- contact sheet aprobada;
- ffprobe correcto;
- audio/video sincronizados;
- frame 1 no negro;
- output versionado.


---

<!-- FILE: 08-ORDEN-DE-IMPLEMENTACION.md -->

# 08 — Orden de implementación

## Fase 0 — Baseline

Antes de tocar:
- ejecutar una pieza completa;
- registrar tiempos manualmente;
- guardar outputs;
- guardar prompts efectivos;
- registrar modelo/costo.

No comparar luego contra memoria.

---

## Fase 1 — Bugs de datos (P0)

1. `scriptToText()` canónico.
2. arreglar publish.
3. arreglar QA.
4. eliminar `x.industry` fantasma.
5. eliminar reglas Veo contradictorias.
6. tests.

No optimizar prompts antes de asegurar que reciben los datos correctos.

---

## Fase 2 — ProjectFacts

1. KB → ProjectFacts.
2. mantener `rawBrief`.
3. selectors por molde.
4. retirar `.slice(0,2500)` de decisiones creativas.
5. golden test con brief largo.

---

## Fase 3 — Prompt Engine

1. versionado;
2. prompt builders por función;
3. límites explícitos;
4. schemas;
5. semantic lint;
6. repair retry.

Mantener las pantallas intactas.

---

## Fase 4 — Model routing

1. taskClass;
2. defaults backend;
3. conservar override del usuario;
4. mover Script/Cast/Storyboard a Sonnet;
5. medir;
6. Opus sólo si demuestra mejora material.

---

## Fase 5 — FlowPack

1. extraer `VEO_RULES` a módulo único;
2. crear compiler;
3. conservar shape y UI;
4. IA opcional para enriquecer, no para ensamblar reglas;
5. golden tests.

---

## Fase 6 — Idempotencia y cache

1. generationKey;
2. dedupe;
3. stale state;
4. cancel/ignore old responses;
5. cache hit al navegar.

No es necesario quitar el comportamiento automático si queda controlado.

---

## Fase 7 — QA determinístico

1. `lintCommercial`;
2. integrar con QA existente;
3. separar issues técnicos de juicio creativo.

---

## Fase 8 — Animation renderer

1. copiar SKILL como referencia, no ejecutarlo bruto;
2. crear versión generalizada;
3. `animation-job.json`;
4. workspace por pieza;
5. templates;
6. GPU probe;
7. voice/timeline;
8. scene;
9. stills;
10. contact sheet;
11. approval;
12. chunk render;
13. mux;
14. verify.

Primera prueba: una pieza real de Munify.

---

## Fase 9 — Observabilidad

Puede comenzar antes, pero no debe faltar al terminar:
- generation_runs;
- dev diagnostics;
- render metrics;
- baseline comparison.

---

## Definition of Done

No cerrar la reingeniería por "se ve mejor".

Cerrar cuando:
- los tests pasan;
- los bugs P0 están cubiertos;
- E2E real funciona;
- latencias están medidas;
- modelos están justificados;
- render animado tiene QA + approval;
- el usuario puede recorrer el pipeline normal sin enterarse de la reingeniería interna.


---

<!-- FILE: CLAUDE-CODE-MASTER-BRIEF.md -->

# MASTER BRIEF PARA CLAUDE CODE — MEDIA STUDIO

## Tu misión

Vas a mejorar el repositorio Media Studio existente.

**No rediseñes el producto.**
El dueño considera correcta y valiosa la arquitectura actual, su organización por pantallas y su pipeline.

Tu trabajo es hacer que el sistema existente **funcione bien por dentro**.

## Antes de hacer cambios

Lee en este orden:

1. `00-START-HERE.md`
2. `01-ARQUITECTURA-QUE-NO-SE-TOCA.md`
3. `02-DIAGNOSTICO-Y-BUGS-P0.md`
4. `03-PROMPT-ENGINE-V2.md`
5. `04-ESPECIFICACION-POR-ETAPA.md`
6. `05-INTEGRACION-SKILL-ANIMACIONES.md`
7. `06-OBSERVABILIDAD-Y-PERFORMANCE.md`
8. `07-TESTS-Y-CRITERIOS-DE-ACEPTACION.md`
9. `08-ORDEN-DE-IMPLEMENTACION.md`

También lee los documentos fuente:
- radiografía actual del pipeline;
- `SKILL.md` original de animaciones.

## Reglas

### 1. No hagas un rewrite

Cambios incrementales, testeables y reversibles.

### 2. No cambies la navegación ni elimines etapas

Concepto, Guion, Cast, Storyboard, Pack Flow y Publicar siguen existiendo.

Puedes cambiar la implementación interna de una etapa.

### 3. Primero corregí datos, después prompts

Un prompt perfecto con input incorrecto sigue fallando.

Prioridad:
- guion shape;
- brief truncado;
- industry;
- contradicciones Veo.

### 4. Cada etapa tiene contrato

Input selector → prompt/compiler → output schema → semantic lint → persist.

### 5. No inventes facts

Toda afirmación de negocio debe venir del Knowledge Base / ProjectFacts.

### 6. No uses modelos caros sin demostrar necesidad

Sonnet debe resolver la mayoría de las tareas.
Opus es excepción.

### 7. Preservá auto-generación sólo si queda idempotente

No hace falta quitar el comportamiento actual.
Sí evitar duplicados, carreras y regeneraciones inútiles.

### 8. Pack Flow sigue siendo una etapa visible

Pero internamente debe tender a compilación determinística de reglas + datos.

### 9. Para animaciones, generalizá el SKILL

Conservá su ingeniería:
- Three.js;
- GPU;
- setT puro;
- timeline;
- stills;
- checks;
- chunks;
- ffmpeg.

Eliminá su historia específica developer/Claude.

### 10. No renderices una animación completa sin still approval

Primero contact sheet.

## Forma de trabajar

Para cada fase:

1. describe qué encontraste en código;
2. muestra archivos afectados;
3. implementa tests;
4. implementa el cambio;
5. ejecuta tests;
6. registra before/after si corresponde;
7. resume riesgos;
8. recién continúa.

Si la radiografía y el repo difieren, manda el repo actual, pero documenta la diferencia.

## Primera tarea concreta

Empezá por Fase 0 + Fase 1:

- crea baseline;
- encuentra `ctx()`;
- encuentra `pieceGuionText()` / equivalentes;
- unifica `scriptToText()`;
- arregla `publish`;
- arregla `qa`;
- arregla `cast`/industry;
- limpia contradicción `VEO_RULES`;
- agrega tests.

NO avances al motor animado antes de que estos tests estén verdes.
