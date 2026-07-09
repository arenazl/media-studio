# Fase 1 — Cimientos: tipos `Comercial` + moldes nuevos (concept / cast / storyboard / flowpack)

> **Prerrequisito:** leer [`01-vision-y-pipeline.md`](./01-vision-y-pipeline.md) completo.
> **Shippable:** al terminar, los 4 moldes nuevos se prueban por `POST /api/run-function` (curl)
> sin tocar la UI. Nada del front se rompe (los moldes viejos siguen).
> **Modelo sugerido para ejecutarla:** Sonnet/Opus. Todo es backend puro + tipos + tests.

## Objetivo

Crear la columna vertebral de datos (`Comercial` y sus piezas) y los 4 moldes generativos nuevos,
resolviendo los 3 defectos estructurales que la auditoría encontró en el pipeline actual:

1. **Los moldes son islas** — el output tipado de uno no alimenta al siguiente (`ctx()` aplana
   `piece.guion` con `join(' · ')` y pierde la estructura). → Los moldes nuevos se pasan los
   artefactos COMPLETOS (JSON), no strings aplanados.
2. **Anti-consistencia by design** — `veoSequencePrompt` (functions.mjs:78) ordena "Generá una
   VARIANTE… (otra persona…)" al regenerar. → La política se INVIERTE: con hoja de personaje, se
   varía la idea visual, JAMÁS el personaje.
3. **No hay artefactos de consistencia** — la regla "misma descripción física EXACTA" (VEO_RULES:43)
   vive como texto suelto y muere en cada regeneración. → El `CharacterSheet` es un asset persistente
   que se inyecta VERBATIM en cada prompt.

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/lib/comercial.ts` | **NUEVO** — tipos + helpers puros |
| `src/lib/comercial.test.ts` | **NUEVO** — tests de helpers |
| `server/functions.mjs` | EXTENDER — 4 runners nuevos en `RUNNERS` + firma `parseFunctionResult(id, text, body)`; NO tocar los moldes existentes |
| `server/index.mjs` | TOCAR 1 LÍNEA — pasar `body` a `parseFunctionResult` en `/api/run-function` (~:838) |
| `src/lib/functionCatalog.ts` | EXTENDER — 4 entradas nuevas en `FUNCTION_CATALOG` |
| `src/lib/functionCatalog.test.ts` | EXTENDER — integridad de las entradas nuevas |
| `src/lib/projects.ts` | EXTENDER — `ProjectReel` gana `comercial?: Comercial` (o campos sueltos, ver §Datos) |

## Datos (`src/lib/comercial.ts`)

Copiar los shapes de la visión §5 (`Comercial`, `Concepto`, `GuionBloque`, `GuionEstructurado`,
`CharacterSheet`, `Cast`, `Escena`, `PackFlow`, `Toma`, `PublishPack`) como interfaces TS exportadas.
**El shape del montaje (`MontajePlan`) NO se implementa en esta fase** — lo define la fase 4;
`Comercial.montaje` queda tipado laxo (`unknown`) o se omite hasta entonces. Decisiones fijas:

- `PasoId = 'negocio'|'concepto'|'guion'|'cast'|'storyboard'|'pack'|'render'|'rodaje'|'montaje'|'publicar'`.
  Los pasos VISIBLES dependen del tipo: `filmado` → con cast/pack/rodaje, sin render (9 pasos);
  `animado` → con render, SIN cast/pack/rodaje (7 pasos — el animado recrea pantallas, no castea
  personas). El stepper de la Fase 2 filtra por `comercial.tipo`.
- `Comercial` se persiste DENTRO de `ProjectReel` (un reel = un comercial; los 3 approaches del
  proyecto ya son 3 reels). Agregar a `ProjectReel`: `comercial?: Comercial`. Mantener los campos
  legacy (`guion`, `slides`, `videoPrompts`) — la migración es aditiva, `normReel` no se toca.
- Helpers puros a implementar + testear:
  - `nuevoComercial(titulo, tipo)` → Comercial con todos los estados `pendiente`.
  - `avanzarEstado(c, paso, estado)` → copia inmutable con el estado actualizado.
  - `pasoHabilitado(c, paso)` → boolean (un paso se habilita cuando el ANTERIOR VISIBLE de su tipo
    está ≥ `generado`; `negocio` siempre habilitado). **Testear con AMBOS tipos** — en particular:
    `montaje` se habilita en filmado cuando `rodaje` ≥ generado, y en animado cuando `render` ≥
    generado (el animado SÍ pasa por montaje: voz + música sobre el render — ver fase 5).
  - `pasosVisibles(tipo)` → `PasoId[]` (filmado: sin `render`; animado: sin `cast`/`pack`/`rodaje`).
  - `escenasAPrompts(storyboard, cast)` → validación de referencia cruzada (cada
    `Escena.personajes[]` existe en `cast.personajes`) — **helper de UI** (lo usa PasoStoryboard en
    fase 2). OJO: `server/functions.mjs` NO puede importar TS del front — la validación del molde
    flowpack se implementa como helper propio EN `functions.mjs` (duplicación consciente, anotarla).

## Moldes nuevos (`server/functions.mjs`)

Contrato: `RUNNERS[id] = { build({context, options, regenerate}) → {prompt, mode?}, parse(text, body?) → objeto }`.
**EXTENSIÓN NECESARIA del contrato** (hoy `parseFunctionResult(functionId, text)` NO recibe el
context — functions.mjs:267-271, index.mjs:838): cambiar a `parseFunctionResult(functionId, text, body)`
y pasar el `body` completo (`{context, options, regenerate}`) en `index.mjs`. Los moldes legacy
ignoran el 3er parámetro (retrocompatible); `flowpack` LO NECESITA para la garantía de consistencia
(ver su parse). Usar `extractJson` (functions.mjs:9-28 — el balanceado; NO el naive de index.mjs).
Los moldes reciben los artefactos previos por `context.piece` SIN aplanar — leer
`context.piece.<artefacto>` directo en el `build` (`ctx()` queda para los legacy).

### 1. `concept` (nivel **piece** — se corre UNA VEZ POR COMERCIAL)

- **build** recibe: `context.project` (name, phonetic, brief — el brief ya trae value_story y
  key_messages vía `kbToBrief`) + **`context.piece.angulo` y `context.piece.creativeBrief`** (lo
  que `strategy` definió para ESE comercial — sin esto, los 3 comerciales recibirían conceptos
  casi idénticos porque el input sería el mismo), `options.perfil`.
- **Prompt (esencia):** "Sos director creativo. Del brief, proponé 2-3 CONCEPTOS de comercial de
  ~20-30s para redes **que desarrollen ESTE approach: {angulo} — {creativeBrief}**. Cada concepto:
  la IDEA (una situación/gancho concreto, puede ser humor, problema-solución, día-en-la-vida),
  TONO, ESTÉTICA (dirección visual: luz, paleta, estilo de fotografía — coherente con la marca),
  REFERENCIA (a qué tipo de anuncio conocido se parece), POR QUÉ FUNCIONA (1 frase). ENFOQUE GLOBAL
  obligatorio: cada concepto cuenta TODA la propuesta, jamás un solo módulo. Rioplatense, sin
  emojis, no inventes datos."
- **Salida:** `{ conceptos: [{ id, idea, tono, estetica, referencia, porQueFunciona }] }` (2-3 ítems).
- **parse:** throw si `!Array.isArray(o.conceptos) || !o.conceptos.length`.

### 2. `cast` (nivel piece)

- **build** recibe: `context.piece.concepto` (el elegido), `context.piece.guion` (estructurado, ver
  molde script adaptado en Fase 2 — mientras tanto acepta el legacy `string[]`), `context.project`.
- **Prompt (esencia):** "Sos casting director + location scout de un comercial. Del concepto y el
  guion, definí los PERSONAJES (1-2, los que el guion necesita) y la LOCACIÓN. Por personaje:
  `fisicoEn` = descripción física EXACTA en inglés para pegar VERBATIM en prompts de video
  (edad, pelo con corte y color, rasgos, tono de piel, contextura, vestuario completo con colores)
  — seguí estas reglas de casting: [inyectar las 2 líneas de casting de VEO_RULES: striking,
  conventionally beautiful, late 20s-early 30s, polished, vestida según el rubro]. `fisicoEs` =
  resumen en español para la UI. La locación: `descripcionEn` igual de exacta (ambiente, mobiliario,
  luz, hora del día). La MISMA descripción se va a usar en TODOS los clips: sé específico, nada de
  'a woman' genérica."
- **Salida:** `{ personajes: [CharacterSheet], lugar: { nombre, descripcionEn, luz } }`.
- **parse:** throw si `!o.personajes?.length || !o.personajes[0].fisicoEn || !o.lugar?.descripcionEn`.

### 3. `storyboard` (nivel piece)

- **build** recibe: `context.piece.guion` (estructurado o legacy), `context.piece.cast` (solo
  filmado), `context.piece.durationSec`, **`context.piece.tipo`**, `context.project` (incl.
  `screens` — la metadata de pantallas del KB, para el animado).
- **Si `tipo === 'animado'`**, el prompt cambia: NO planos/personajes/talking-heads — cada escena
  es una PANTALLA del producto: `{ n, rol, durSec (3-5s), screen (label de la pantalla del KB),
  accion: 'título corto ≤8 palabras que vende ese momento', dialogo: '' , continuidad: 'palabra a
  RESALTAR del título' }` (se reusa el shape `Escena`; `plano/angulo/personajes` vacíos). Es el
  guion visual del reel animado (estilo `public/bocetos`).
- **Prompt (esencia):** "Sos director de un comercial 9:16. Convertí el guion en un STORYBOARD de
  escenas numeradas. Por escena: rol (hook|desarrollo|gag|cta), durSec (talking head = 8 MÍNIMO,
  jamás menos — es lo que tarda una frase entera; b-roll 4-8), plano (medium shot waist-up para
  talking heads — NUNCA wide lejano), angulo, personajes (ids del cast — USÁ SIEMPRE los mismos),
  accion, dialogo (rioplatense, frase ENTERA de ~24-30 palabras si es talking head, que COMENTA el
  producto; marca SIEMPRE fonética: {phonetic}), continuidad (qué debe matchear con la escena
  anterior: ropa, luz, posición). La suma de durSec ≈ {durationSec}s, puede pasarse antes que
  recortar un talking head. El gag/remate va ANTES del CTA."
- **Salida:** `{ escenas: [Escena] }`.
- **parse:** throw si `!o.escenas?.length`; validar que cada `rol` sea válido y que los talking
  heads (escenas con `dialogo`) tengan `durSec >= 8` (corregir a 8 si vino menos, no throw).

### 4. `flowpack` (nivel piece)

- **build** recibe: `context.piece.storyboard`, `context.piece.cast`, `context.project` (phonetic,
  brand), `regenerate?: { escenaN }` (rehacer el prompt de UNA escena).
- **Prompt (esencia):** "Sos el prompt-writer de Google Flow (Veo 3). Armá el PACK de generación:
  (1) MASTER: un bloque de estilo global en inglés que consolida: [VEO_RULES de realismo — inyectar
  las reglas battle-tested: photorealistic not over-rendered, natural light, clean and well-lit] +
  los personajes VERBATIM (`fisicoEn` tal cual, sin resumir) + la locación VERBATIM (`descripcionEn`).
  (2) Por ESCENA del storyboard: un prompt AUTOCONTENIDO en inglés = master + la escena (plano,
  ángulo, acción, diálogo en español rioplatense entre comillas con la marca fonética, duración).
  Talking heads: medium shot waist-up, camera holds steady or subtle slow push-in, NUNCA pull
  back/zoom out, la persona habla TODO el clip (sin silencio de relleno). B-roll: no spoken
  dialogue, ambient sound only, one single continuous take. Pantallas de app: screen not clearly
  legible. Sin texto en pantalla (el overlay va en edición). REGLA DE CONSISTENCIA: en CADA prompt
  el personaje y la locación van con la MISMA descripción exacta — nunca la resumas ni la varíes."
- **regenerate:** rehacé SOLO el prompt de la escena N — variá la idea visual/el encuadre dentro de
  las reglas, **JAMÁS el personaje ni la locación** (van verbatim). [Esto invierte la política del
  veo viejo — es EL fix de consistencia.]
- **Salida:** `{ master, clips: [{ escenaN, prompt, estado: 'pendiente' }] }` (estado lo inyecta
  `parse`, la IA no lo devuelve). Regen: `{ clip: { escenaN, prompt } }`.
- **parse(text, body):** usa el contrato extendido (recibe el `body` con `context.piece.storyboard`
  y `context.piece.cast` — sin esto la garantía es inimplementable). Throw si
  `!o.master || !o.clips?.length`. **Garantía mecánica de consistencia** (helper local en
  `functions.mjs`): para cada clip, buscar su `Escena` por `escenaN`:
  - si `escena.personajes.length > 0` → el prompt DEBE contener el `fisicoEn` (verbatim) de cada
    personaje de la escena;
  - si la escena NO tiene personajes (b-roll / pantalla) → el prompt DEBE contener la
    `descripcionEn` de la locación verbatim (misma garantía, aplicable al caso sin cast).
  Si falla → throw con mensaje claro ("la IA resumió la hoja de personaje en el clip N") para
  reintentar.

## Catálogo (`src/lib/functionCatalog.ts`)

4 entradas nuevas (íconos lucide, sin emojis): `concept` (project, Lightbulb), `cast` (piece,
Users), `storyboard` (piece, Clapperboard), `flowpack` (piece, PackageOpen). `description` corta en
rioplatense. **Nota:** el campo `model` del catálogo hoy es decorativo (runClaude no pasa `--model`)
— dejarlo informativo, NO intentar arreglarlo en esta fase.

## Qué NO hacer en esta fase

- NO tocar los moldes existentes (`strategy/script/mockup/veo/publish/qa`) — siguen andando para la
  UI actual. Su adaptación/absorción es de fases posteriores.
- NO tocar la UI (GuidedPanel/FunctionRunner) — fase 2.
- NO tocar `ctx()` de forma que cambie el comportamiento de los moldes legacy.

## Verificación (criterio de aceptación)

1. `npx tsc --noEmit` + `npx eslint src/ --ext .ts,.tsx` + `npm test` — verdes (tests nuevos incluidos).
2. `node --check server/functions.mjs` — OK.
3. Prueba REAL por API (backend local levantado, Claude headless):
   ```bash
   # concept
   curl -s -X POST localhost:5301/api/run-function -H "Content-Type: application/json" \
     -d '{"functionId":"concept","context":{"project":{"name":"Munify","phonetic":"Munifái","brief":"<brief real del KB>"}},"options":{"perfil":"campaña"}}'
   # → conceptos[2-3] con idea/tono/estetica/referencia/porQueFunciona
   ```
   Encadenar a mano: concept → cast (con el concepto elegido) → storyboard → flowpack, y verificar:
   - `flowpack.master` contiene el `fisicoEn` del cast VERBATIM.
   - CADA `clips[i].prompt` contiene el `fisicoEn` VERBATIM (el parse ya lo garantiza).
   - Talking heads con `durSec >= 8` y diálogo de ~24-30 palabras con la marca fonética.
4. Documentar en el PR/commit los 4 outputs reales de la cadena (pegarlos como evidencia).
