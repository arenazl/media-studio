# Baseline y avance de la reingeniería

> Lo escribe la Fase 0 y lo actualiza cada fase al cerrar. Regla del doc de reingeniería (§08,
> Fase 0): "no comparar luego contra memoria". Acá están los números.

## Baseline — 2026-10-07, 15:10 ART

**Pieza:** Munify, reel "Gancho & Problema", técnica filmado, 20 s. Corrida completa por la API
(`POST /api/run-function`) con el script `baseline.mjs`, un molde atrás del otro, cada uno
alimentado con la salida del anterior. Outputs guardados en `baseline-2026-10-07/*.json`.

**Condiciones:** CLI en modo `clean` (sin settings, sin tools, sin MCP: 198 tokens de contexto
base), modelo el que marca el catálogo del front, sin otra generación en paralelo.

| Molde | Modelo | Tiempo | Salida | Costo |
|---|---|---:|---:|---:|
| concept | sonnet | 18,7 s | 2.339 chars | USD 0,019 |
| script | opus | 11,3 s | 999 chars | USD 0,054 |
| cast | opus | 20,4 s | 2.483 chars | USD 0,071 |
| storyboard | opus | 26,1 s | 2.289 chars | USD 0,083 |
| flowpack | opus | 47,0 s | 8.941 chars | USD 0,167 |
| publish | haiku | 9,4 s | 797 chars | USD 0,042 |
| qa | sonnet | 35,2 s | 2.599 chars | USD 0,106 |
| **Total** | | **168 s** | | **USD 0,54** |

**Lectura:**

- El tiempo sigue al tamaño de la salida: flowpack escribe 9K chars y tarda 47 s; script escribe
  1K y tarda 11 s. Opus no es lento por ser Opus en estos tamaños.
- La pieza entera, de concepto a QA, son menos de 3 minutos de IA. Las esperas de "bastante más
  de un minuto por pantalla" que reportó el dueño antes de hoy tenían otras causas ya corregidas
  o identificadas: 49K tokens de contexto por llamada (CLAUDE.md global + 60 tools de conectores),
  tres moldes disparándose a la vez al entrar a una pantalla, y una corrida colgada contra el
  API con la cuenta al 82% del límite semanal.
- flowpack es el candidato obvio a compilador determinístico (Fase 5): el 28% del tiempo total
  para traducir un storyboard a inglés con reglas fijas.
- qa tarda 35 s porque recibe el comercial entero como JSON. La Fase 7 (lint sin IA + QA
  creativo acotado) debería bajarlo a la mitad.

Comparar contra los budgets del doc de reingeniería (§06): concept ≤ 25 s (cumple), script
≤ 20 s (cumple), cast ≤ 15 s (no: 20 s), storyboard ≤ 20 s (no: 26 s), flowpack ≤ 2 s
compilado (no: 47 s con IA), publish ≤ 10 s (cumple), qa ≤ 15 s (no: 35 s).

## Fase 1 — Bugs de datos P0 — HECHA 2026-10-07

Tal cual el doc §02 y §08. Sin desvíos.

| Bug | Fix | Dónde |
|---|---|---|
| P0.2 `ctx().guion` sólo entendía el guion legacy | Helper canónico `scriptNarrations()` / `scriptToText()`; lo importan `ctx()`, `pieceGuionText()` (back) y PasoPublicar, Pipeline, kitToProject (front). Se fueron tres aplanadores duplicados | `server/scriptToText.mjs` (+ `.d.mts` para TS) |
| P0.2 `publish` y `qa` caían al brief | Ahora leen el guion en cualquiera de los dos shapes. Nota honesta: PasoPublicar ya aplanaba a array antes de mandar, así que en la UI el bug era latente; en el back era real | `server/functions.mjs` |
| P0.3 `cast` metía el brief entero en la regla de locación | El rubro viene del KB (`project.type` = `business.industry`, que ahora viaja en el contexto); sin rubro, el nombre. El brief nunca más dentro de una oración | `server/functions.mjs`, `src/pasos/pasoKit.tsx` |
| P0.4 `VEO_RULES` pedía "misma descripción física EXACTA" y flowpack prohibía repetirla | Una sola política: la identidad la fija la imagen de referencia; nombre + "Argentine" + descripción corta; nunca el `fisicoEn` largo | `server/functions.mjs` (`VEO_RULES`) |

**Tests nuevos:** `src/lib/p0-datos.test.ts`, 12 tests: el helper con legacy, blocks, vacío, bloque
sin narración y caracteres especiales; publish y qa leyendo el guion y no el brief; cast con rubro
y sin rubro; flowpack y videoprompt sin la contradicción.

**Suite:** 448 pasan, 1 falla preexistente (`moldeMediaKit.test.ts` › storyboard.parse ›
archivoCaptura; viene del WIP sin commitear de antes de hoy, no de esta fase). `tsc` limpio,
eslint sin errores.

**Pendiente de la Fase 1 que el doc pide y queda para la Fase 2:** `industry` explícito en
`ProjectFacts` (hoy se usa `project.type`, que es el mismo dato del KB).

## Fases siguientes

| Fase | Estado |
|---|---|
| 2. ProjectFacts | HECHA 2026-10-07 (ver abajo) |
| 3. Prompt Engine V2 | MECÁNICA HECHA 2026-10-07 (ver abajo); la curación del texto creativo de cada prompt queda con el dueño |
| 4. Model routing | HECHA 2026-10-07 (ver abajo) |
| 5. FlowPack compilador | HECHA 2026-10-07 (ver abajo) |
| 6. Idempotencia y caché | HECHA 2026-10-07 (ver abajo) |
| 7. QA determinístico | HECHA 2026-10-07 (ver abajo) |
| 8. Motor animado | pendiente, en la otra cuenta |
| 9. Observabilidad | HECHA 2026-10-07 en el back (ver abajo); el panel de diagnóstico en la UI queda pendiente |

## Fase 4 — Model routing — HECHA 2026-10-07

Decisión del dueño: tres presets por dificultad del molde en vez de un modelo para todo.

**Medición que la sustenta** (guion de la misma pieza, tres corridas cada uno, con el log de
modelo real y tiempo de API):

| Modelo | Tiempo | Calidad |
|---|---:|---|
| Opus (claude-opus-5) | 10,8 s | el más gracioso |
| Sonnet (claude-sonnet-5) | 9,5 s | correcto, más genérico |
| Haiku (claude-haiku-4-5) | 32 a 88 s de API real | peor; en cast violó la regla de locación |

Y de la corrida Sonnet-en-todo contra el baseline con Opus: cast 9,8 s contra 20,4 s, storyboard
12,4 s contra 26,1 s, flowpack 52 s contra 47 s (el tamaño de salida manda), pieza entera 143 s
contra 168 s.

**Implementación:**

| Dónde | Qué |
|---|---|
| `src/lib/functionCatalog.ts` | `model` → `taskClass` (`creativo` / `estructurado` / `transformacion`), tabla `PRESETS`, `modelForPreset()` |
| `src/lib/settings.ts` | el ajuste es el preset (`economico` / `intermedio` / `performante`, default intermedio), clave nueva de localStorage: el "haiku" forzado viejo no se hereda |
| `src/Pipeline.tsx`, `src/RailSettings.tsx` | el engranaje ofrece los tres presets |
| `server/index.mjs` | política por defecto del back = intermedio por clase (P0.5); log con modelo real, tiempo de API y avisos de límite de cuenta |

| Clase | Moldes | Económico | Intermedio | Performante |
|---|---|---|---|---|
| creativo | strategy, concept, script | sonnet | opus | opus |
| estructurado | cast, storyboard, qa | sonnet | sonnet | opus |
| transformacion | flowpack, publish, briefToKb, videoprompt | sonnet | sonnet | sonnet |

Haiku queda fuera de los presets. Tests: `settings.test.ts` y `functionCatalog.test.ts` reescritos
(454 pasan; la falla preexistente del storyboard sigue siendo la única).

## Fase 2 — ProjectFacts — HECHA 2026-10-07

Tal cual el doc §02 P0.1 y §08. El brief ya no se corta.

| Qué | Dónde |
|---|---|
| Módulo canónico de hechos: `factsFromKb()` (KB 1.2), `factsFromBrief()` (parsea de vuelta el markdown de `kbToBrief`, encabezados fijos; un brief libre va entero a `description`), `buildProjectFacts()` (KB guardado > brief), `factsText(facts, secciones)` (texto por secciones, SIN tope) | `server/projectFacts.mjs` (+ `.d.mts`) |
| El proyecto guarda el KB crudo (`project.kb`) al nacer de un KB (Integraciones, pegar texto, inspector) y lo manda al back en cada molde | `src/lib/knowledgeBase.ts`, `src/lib/projects.ts`, `KbImport/KbFromText/KbInspector.tsx`, `src/pasos/pasoKit.tsx` |
| Moldes: `strategy` recibe la ficha entera; `concept` la ficha entera; `script` negocio + mensajes + qué ofrece + oferta + no decir; `ctx().brief` (fallback de publish/qa) = negocio + mensajes + oferta. Se fue el `.slice(0, 2500)` | `server/functions.mjs` |

**Probado con el brief real de Munify (8.068 chars):** la ficha parsea 5 mensajes clave, 4
ofertas, 8 diferenciadores, 5 objeciones, la oferta y 8 "no decir", incluidos los del final del
brief que antes no llegaban nunca (ej. "no prometer integraciones SIPAF/RAFAM sin confirmar").

**Tests:** `src/lib/projectFacts.test.ts` (12): KB → facts, ida y vuelta por el markdown, brief
libre, prioridad KB > brief, secciones, y la Fixture 1 del doc (brief > 8.000 chars con un hecho
al final que llega a `concept` y `strategy`). Suite: 466 pasan.

**Efecto colateral medido y corregido a medias:** con más hechos en el prompt el guion pasó de
9,5 s a 25-30 s con Sonnet. La causa NO es el tamaño de entrada: es el **pensamiento extendido**
del modelo, que el CLI trae prendido por defecto y crece con el contexto (ver hallazgo abajo).

## Hallazgo — el pensamiento extendido es la mayor parte del tiempo (2026-10-07)

El log del back ahora muestra tokens de entrada, de salida y de pensamiento. Mismo concepto
animado de Munify con Sonnet, directo contra el CLI:

| | Pensamiento | Tiempo de API | Salida |
|---|---:|---:|---|
| Default del CLI | 4.367 tokens | 50 s | 3 conceptos |
| `MAX_THINKING_TOKENS=0` | 0 | 17 s | los mismos 3 conceptos |

Implementado en `server/index.mjs`: tope de pensamiento por clase de tarea (`THINKING_POR_CLASE`:
creativo 2.000, estructurado 0, transformación 0), override por llamada con `body.thinking`, y el
tope en el log. Con el tope en 2.000, el guion: Sonnet piensa 1.670 tokens (29 s), Opus piensa 512
(17,7 s). **Pendiente de decidir con el dueño:** si lo creativo también va a 0 (más rápido) o si
el pensamiento mejora la idea lo suficiente para pagar los segundos. Se mide con dos corridas
del mismo concepto, no con opinión.

## Fase 5 — Pack Flow compilado — HECHA 2026-10-07

Tal cual el doc §4.6: `compileFlowPack()` determinístico + IA sólo para el hueco creativo. La
pantalla Pack Flow no cambia (mismo shape `{ estilo, personajes[], escenas[] }`).

| Qué | Dónde |
|---|---|
| Compilador: estilo global por aspecto, un retrato por personaje (`promptImagen`), un prompt por escena (`promptEscena`) con la MISMA estructura que pedía el prompt viejo: estilo + locación resumida + personaje corto ("Nombre, an Argentine …", nunca el `fisicoEn` largo) + plano + diálogo literal en rioplatense + entrega vocal por rol + regla de logo (cierre centrado en el CTA, zona libre en el resto) + sin texto en pantalla. B-roll: sin diálogo, toma continua, pantalla no legible. Las reglas de Veo viven en `VEO_REGLAS_EN`, un solo lugar | `server/flowCompiler.mjs` |
| Lo único que se le pide al modelo: traducir al inglés la `accion` de cada escena (una línea por escena, `n\| texto`), con pensamiento 0. Si la respuesta no sirve, el pack sale igual con la acción en español y `huecos: [n…]` marcados en el resultado y en el log: nunca falla en silencio | `server/functions.mjs` (molde `flowpack`), `server/index.mjs` (molde compilado sin prompt = sin IA) |
| La regeneración de UNA escena ("otra idea visual") sigue siendo IA, como antes | `server/functions.mjs` |

**Medido con el storyboard y el cast reales de Munify (5 escenas, 2 personajes):**

| | Antes (IA escribe el pack) | Ahora (compilado + traducción) |
|---|---:|---:|
| Tiempo | 47 s (Opus) / 52 s (Sonnet) | **11 s** |
| Costo | USD 0,167 / 0,120 | **USD 0,016** |
| Prompt | 9.649 chars | 759 chars |
| Salida del modelo | 8.978 chars de pack | 478 chars de traducción |

**Tests:** `src/lib/flowCompiler.test.ts` (19 golden: talking head, b-roll de pantalla, personaje
mujer, CTA con logo, rol desde el storyboard, locación resumida, sin traducciones, sin cast,
prompt de traducción, parse tolerante, build/parse del molde, regen por IA) + los dos tests de
formato del pack adaptados al compilado. Suite: 485 pasan.

**Pendiente de pulido (anotado, no bloquea):** la primera corrida mostró cortes a mitad de frase
en la locación y en el personaje corto, "Argentine Argentine" en el retrato y un punto doble.
Corregido en el compilador en la misma sesión (corte en la última coma, limpieza del prefijo
"Argentine", plano del storyboard sólo si no repite la regla fija).

## Fase 7 — QA determinístico — HECHA 2026-10-07

Tal cual el doc §4.8: dos capas. **A)** `lintCommercial()` sin IA, en milisegundos. **B)** el
juicio creativo de Sonnet (el molde `qa` de siempre). Los issues técnicos van primero en la lista
con el prefijo `[técnico]`, y si hay un error alto el veredicto no puede quedar en "LISTO PARA
PRODUCIR". La pantalla de Montaje no cambia (mismo `QaResult`, con `lint` agregado).

| Chequeo | Código | Severidad |
|---|---|---|
| Faltan roles / gag después del cta / no arranca con hook | `guion.rol-faltante`, `guion.gag-despues-del-cta`, `guion.no-arranca-con-hook` | alta / alta / media |
| Bloques suman lejos de la duración (±25%) | `guion.duracion` | media |
| Más de 3,2 palabras por segundo (no se puede decir) / menos de 1,2 (aire) | `guion.muy-rapido` / `guion.muy-lento` | alta / baja |
| El CTA dice la marca escrita en vez de la fonética | `guion.marca-sin-fonetica` | media |
| Dice una frase corta de la lista "no decir" del KB | `guion.no-decir` | alta |
| Escenas: rol inválido, personaje que no está en el cast, talking head < 8 s, diálogo largo | `storyboard.*` | alta / alta / alta / media |
| Animado: pantalla que no está en el kit, escena sin captura | `storyboard.pantalla-inexistente`, `storyboard.sin-captura` | media |
| Pack: pega el fisicoEn largo, sin "Argentine", escenas desparejas, acciones sin traducir | `pack.*` | alta / media / alta / baja |

`src/lib/lintCommercial.test.ts`: 13 tests (pieza sana, cada regla, severidades). PasoMontaje
ahora manda técnica, duración y kit al QA para que el lint tenga con qué trabajar. Suite: 498 pasan.

## Fase 3 — Prompt Engine V2, la parte mecánica — HECHA 2026-10-07

Del doc §03 se implementó lo que es ingeniería y no redacción. El texto creativo de cada prompt
(concept ya está curado) se cura de a uno con el dueño, como pidió.

| Regla del doc | Qué se hizo | Dónde |
|---|---|---|
| 2. Versionar los prompts | `PROMPT_VERSIONS` por molde; `buildFunctionPrompt` devuelve `promptVersion`, va al log y a la respuesta de `/api/run-function` | `server/prompting.mjs`, `server/functions.mjs`, `server/index.mjs` |
| 5. La duración gobierna el texto | `maxNarrationWords(seg)` = 2,7 palabras por segundo; `presupuestoGuion(dur)` reparte hook 15% / desarrollo 45% / gag 20% / cta 20% y el prompt del guion lo dice EN NÚMEROS ("hook: 3s, hasta 8 palabras · … Total: 20s y hasta 54 palabras"). El storyboard filmado acota el diálogo (8s = 21 palabras) y el total (máximo 125% de la pieza) | `server/prompting.mjs`, molde `script` y `storyboard` |
| 4. Largos explícitos | `accion` hasta 14 palabras y `continuidad` hasta 8 en el storyboard (cast y concept ya los tenían) | molde `storyboard` |
| P0.7 Validación por capas | `validarResultado(functionId, result, body)`: concept (3, ganchos distintos, idea 40-60, sin tiempos ni planos), script (roles, orden, palabras/seg, suma), storyboard (rol, ids del cast, palabras/seg, total), cast (largos), publish (caption, hook ≤ 6, hashtags) | `server/prompting.mjs` |
| 7. Reintento inteligente | Si la validación falla: UN reintento de reparación (mismo modelo, pensamiento 0, errores concretos + JSON anterior). Se queda con el mejor de los dos. El resultado viaja con `validacion: { ok, errores, reparado }`; nunca se oculta un problema | `server/index.mjs` (run-function) |
| 9. Structured output | El CLI no lo expone; queda el parser + validación (confirmado con el dueño) | — |

**Pendiente de esta fase:** mostrar `validacion` en la UI (hoy el front guarda `result` y descarta
la meta), y la curación del texto de strategy, script, cast y storyboard con el dueño.

`src/lib/prompting.test.ts`: 12 tests. Suite: 510 pasan.

## Fase 6 — Idempotencia y caché — HECHA 2026-10-07

Tal cual el doc P0.6 y §06 "Concurrencia / Cache", con el matiz acordado: Concepto no auto-dispara
si la técnica no viene fija por el formato.

| Qué | Cómo | Dónde |
|---|---|---|
| `generationKey` | sha256(molde + versión del prompt + modelo + proveedor + el prompt entero). El prompt ya contiene todo el input normalizado | `server/prompting.mjs` |
| Dedupe en vuelo | Un mapa clave → promesa en el back: dos pedidos iguales al mismo tiempo (doble disparo, re-render) comparten UNA llamada a la IA y reciben la misma respuesta (`cache: 'en-vuelo'`). Probado: dos guiones iguales lanzados a la vez → una sola corrida de 22 s, los dos clientes contestados | `server/index.mjs` |
| Caché de resultados válidos | La última corrida con la misma clave, `status = ok` y validación limpia, guardada en `generation_runs`. Se sirve SOLO cuando el front manda `cache: true`, y el front lo manda sólo en el auto-disparo o al volver a una pantalla (sin `provider`). Un "Re-Plan" apretado a mano nunca lee caché: el dueño quiere algo nuevo. Regenerar tampoco. Probado: el mismo pack con `cache: true` vuelve en milisegundos sin llamar a la IA | `server/db.mjs` (`findCachedRun`), `server/index.mjs`, `src/pasos/pasoKit.tsx` |
| Cambio de concepto invalida downstream | Automático: el concepto va dentro del prompt del guion, así que cambia la clave | — |

**Pendiente:** los estados `idle / queued / running / valid / stale` en el front (hoy sigue
`busy` por paso) y cancelar la respuesta vieja si cambió el input mientras corría.

## Fase 9 — Observabilidad — HECHA en el back 2026-10-07

| Qué | Dónde |
|---|---|
| Tabla `generation_runs` con las columnas del doc §06: proyecto, pieza, molde, versión del prompt, proveedor, modelo pedido y REAL, clave, tiempos (total y de API), chars y tokens de entrada/salida/pensamiento, costo, reintentos, estado (`ok` / `cache` / `compilado` / `error`), errores de validación, y el resultado (sólo si validó limpio: es la caché) | `server/db.mjs` |
| Cada llamada a `/api/run-function` deja su fila, incluidas las reparaciones (`retry_count`), los hits de caché y los moldes compilados sin IA | `server/index.mjs` |
| `GET /api/generation-runs?limit=50&functionId=script` para leer las corridas | `server/index.mjs` |
| El log de consola por llamada: tiempo, API, modelo real, tokens, pensamiento, costo, avisos de límite de cuenta | `server/index.mjs` |

**Pendiente:** el panel "dev diagnostics" en la UI (modelo, tiempo, reintentos, versión, caché) y la
comparación automática contra el baseline. Los datos ya están; falta pintarlos.

## Verificación de cierre en la UI — 2026-10-07

Pieza Munify animada, pantalla Concepto, botón "Generar 3 propuestas · Animado", en el navegador:

- Prompt `concept/2.0` de 14.146 chars (ficha entera + pantallas), Opus, 24 s, pensamiento 0.
- La validación encontró "concepto 3: la idea trae tiempos o planos" → reparación en 13,4 s → 0 problemas.
- La línea bajo el botón dice "opus-5 · 37 s · reparado al segundo intento"; tres tarjetas en pantalla.
- Bug encontrado y corregido en la misma prueba: `findCachedRun` daba un falso acierto porque
  en este Node `node:sqlite` devuelve una fila con todo `null` cuando no hay match (el repo ya tenía
  `rowOrNull` para eso). Sin el fix, el auto-disparo devolvía un resultado vacío "de caché".

Checklist de cierre: `npm run build` OK, `tsc` limpio, eslint limpio en lo tocado (los 10 hooks
condicionales de `src/App.tsx` son del WIP previo), suite 511/512 (la falla es la decisión
pendiente del dueño sobre la captura "en ronda").
