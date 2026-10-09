# Montaje v2: el montajista y el motor Remotion (2026-10-09)

**Para el dueño.** Lucas abandonó la animación con personajes y pidió dos cosas: que los clips de Flow salgan
con un montaje simple pero bien hecho, y una línea de mockups "tipo PowerPoint avanzado". Este doc es la primera
etapa: la línea Flow. El paso Montaje ahora arma solo un montaje sobrio (recortes, cortes en frase, pantallas
reales cuando la voz las nombra, subtítulos palabra por palabra, placa final) y lo muestra en una vista previa
que es EXACTAMENTE lo que se renderiza. La comparación antes/después está en
`https://looklogic.com.ar/docs/mediastudio/montaje-flow-antes-despues/`.

## Qué cambió

| Pieza | Antes | Ahora |
|---|---|---|
| Decisiones de montaje | `storyboardToMontaje`: una escena por toma, sin recortes | lo mismo + `afinarMontaje` (`src/lib/montajista.ts`): reglas puras y testeadas |
| Palabras y tiempos | no había | `POST /api/transcribir {fileRef}` (ElevenLabs Scribe, caché `<clip>.words.json`) |
| Vista previa | `<video>` del clip activo con textos encima (no era el compositor) | `@remotion/player` corriendo la composición real (`src/remotion/PlayerMontaje.tsx`) |
| Render | cadena ffmpeg (`server/renderComercial.mjs`, se mantiene para planes viejos) | `server/renderRemotion.mjs` cuando `plan.motor === 'remotion'`; loudnorm -14 LUFS + limitador |
| Botón de render | se había perdido en la reingeniería (`408108c`) | "Renderizar mp4" de vuelta en el pie del paso |

## Cómo fluye

1. **Armar el montaje** (PasoMontaje): `storyboardToMontaje` → transcribe cada toma (paralelo, con caché) →
   `afinarMontaje(plan, { palabrasPorToma, pantallas, cta, logoUrl, marca, estilo })` → `plan.motor = 'remotion'`.
2. **Vista previa**: `derivarRender(plan, base)` (`src/remotion/derivar.ts`) pasa el plan semántico (segundos, por
   escena) a cuadros absolutos. Es la ÚNICA derivación: la usan el Player y el render, adentro de la composición.
3. **Render**: el servidor empaqueta `src/remotion/index.ts` con `@remotion/bundler` (se reempaqueta solo si cambió
   `src/remotion` o `src/lib`), renderiza con `@remotion/renderer` (h264, crf 18) y normaliza el audio con ffmpeg.
   985 cuadros tardaron 44 s en la 4060, más 24 s de bundle la primera vez.

## Las reglas del montajista (todas en `montajista.ts`, con sus tests)

- **Aire**: `in = primera palabra - 0,35 s`, `out = última palabra + 0,45 s` (0,8 s en el último clip).
- **Cortes secos** entre clips; escala apenas distinta en cada corte (1,00 / 1,06), acercamiento lento 1,00→1,12 en
  el remate (`gag`) o en la escena previa al cierre; cierre fijo en 1,04.
- **Insertos de pantalla real**: nunca en el gancho, el remate ni el cierre. La pantalla se elige por coincidencia
  de raíces entre las palabras de la escena y `nombre + zonaClave` de la pantalla (la captura que el storyboard
  asignó tiene prioridad). Entra al principio de la frase que la nombra (hasta 4 palabras atrás, frenando en
  pausas y puntuación), dura 2,6 s, mínimo 1,4 s, con 1,2 s de cara entre dos insertos; máximo 2 por escena y 3
  por pieza. `queDemuestra` y `datosVisibles` NO cuentan: en la prueba real "Cumple kids" pegó con "si no cumplen".
- **Subtítulos**: páginas por escena (nunca cruzan un corte), frases por punto o pausa mayor a 0,8 s, hasta 48
  caracteres (dos líneas), partidas por la coma o por el medio. La marca se escribe con su nombre exacto cuando la
  transcripción la oyó distinto ("Sin Vuelta Ya" → "sin vueltas ¡YA!"), sin agregar lo que no dijo.
- **Placa final**: `cta.principal` del kit; el dominio sólo si no está ya en el texto. Música con ducking bajo el
  diálogo (35 % del nivel) y subida en la placa.

## Verificado

- 566 tests de vitest (565 pasan; el que falla, `moldeMediaKit.test.ts`, ya fallaba en `408108c` y no es de esto).
- `tsc` limpio; eslint limpio en los archivos nuevos (los 10 errores de `App.tsx` son los hooks condicionales de antes).
- `npm run build` ok (el Player va en un chunk aparte de 353 KB, cargado sólo en el paso Montaje).
- E2E real con Playwright sobre la interfaz (`localhost:5180`): proyecto de prueba `sinvueltas-montaje-v2 [DEMO]`
  con los cuatro clips de Flow de Sin Vueltas → Armar (8 s) → vista previa → Renderizar → mp4 de 32,9 s a -14,2 LUFS.

## Etapa 2 (misma fecha): la línea animada, mockups "PowerPoint avanzado" sobre el mismo motor

**Para el dueño.** El paso Render ya no graba una página con Playwright: arma un plan de mockups desde el
storyboard animado, lo muestra EXACTO en el Player y lo renderiza con Remotion. Pieza de prueba de Munify
(siete escenas, cinco con pantallas reales) publicada en
`https://looklogic.com.ar/docs/mediastudio/mockups-munify/`, al lado del boceto del intendente.

| Pieza | Qué hace |
|---|---|
| `src/lib/mockups.ts` | `armarMockups(comercial, insumos)`: storyboard animado → `PlanMockup`. El storyboard decide si una escena es de pantalla (`screen`/`archivoCaptura`) o de título; el kit decide qué captura (nombre pesa más que zona clave). Narración corta como `sub`. Cifra que cuenta sólo si viene en el texto (`numeroDe`). Placa desde el CTA. Tests en `mockups.test.ts`. |
| `src/remotion/Mockups.tsx` + `derivarMockups.ts` | La composición: fondo con degradé y grano del color de marca, barra de progreso, logo (+ nombre si es isotipo), escena `titulo` (serif, resaltado subrayado, contador) o `pantalla` (marco navegador con altura según la proporción real, o teléfono si la captura es alta; zoom lento; chip; título; sub), placa final. El cuadro 1 ya es la portada (la primera escena no tiene entrada animada). |
| `src/remotion/PlayerMockups.tsx` + `PasoRender.tsx` | Vista previa exacta; mide las imágenes en el front (`useProporciones`) para marco y para saber si el logo es isotipo; "Renderizar el reel" → `POST /api/render-mockups`; guarda `renderRef` + `renderDurSec`. |
| `server/renderRemotion.mjs` | `renderComposicion` genérico; `renderMockups` (sin normalizar audio: no tiene) y `renderRemotion` (Comercial). |
| PasoMontaje (animado) | El plan va con `motor: 'remotion'`: el video de mockups es un clip mudo + música con ducking + voz si la hay; sin placa ni logo porque el video ya los trae. En `exportar`, con motor remotion el plan es la fuente de verdad (antes inyectaba el logo de la marca y salía duplicado). |

`server/mockupReel.mjs` y `/api/mockup-reel` quedan en el repo sin uso desde el front (compatibilidad).
Verificado con Playwright sobre la interfaz: Render (29 s para 816 cuadros) → Montaje → mp4 de 27,2 s a -14,0 LUFS.

## Etapa 3 (misma fecha): "describilo con tus palabras" antes de renderizar

**Para el dueño.** Lucas pidió describir el reel entero con sus palabras (dictado o escrito) y que de ahí salgan
las escenas con las pantallas del kit, ver la vista previa y recién después renderizar. Quedó como una caja arriba
del paso Render: "Describí el reel con tus palabras" → "Armar las escenas".

| Pieza | Qué hace |
|---|---|
| Molde `mockupsTexto` (`server/functions.mjs`, versión `mockupsTexto/1.0`) | Prompt según el estándar 25 de la compartida: preámbulo, las capturas reales del kit con su nombre exacto, por escena largos en números (título 2 a 6 palabras, narración 6 a 14), NO ASUMIR (pantallas que no están en el kit → escena de título; nada de cifras ni funciones no dichas), el CTA verificado para el cierre. Entrada: `options.descripcion` + `piece.mediaKit`. |
| `escenasMockupDesdeTexto` (parse) | Valida y normaliza sin inventar: roles, duración 3 a 5 s, `screen` sólo si coincide con una captura del kit (sin reparto por turno como hace `asignarCapturas`), `continuidad` sólo si está dentro del título, narración sin URLs y vacía en el cierre, máximo 8 escenas, la última siempre `cta`. |
| `PasoRender.tsx` | Caja de texto (persistida en `comercial.descripcionReel`), botón "Armar las escenas" → `runMolde('mockupsTexto', …)` → reemplaza `comercial.storyboard` → el plan de mockups y la vista previa se rearman solos. Catálogo: `functionCatalog.ts` (`taskClass: 'estructurado'`). |

Verificado sobre la interfaz: una descripción de 5 oraciones (título, dashboard, reclamos, tesorería, demo) → 5
escenas, 3 con pantalla real correctamente elegidas, en 11 s con Sonnet (USD 0,03) → render de 22 s.

## Pendiente / siguiente etapa

- **Voz en la línea animada**: generar la locución desde el storyboard y sincronizar el texto palabra por palabra
  (como en Flow). Hoy va música + narración como texto.
- Capturas de celular en los kits (el marco de teléfono está hecho y testeado, pero sin ejercitar en Munify).
- El multipista (`ReelEditor`) sigue con su vista previa vieja: cambiarla por el mismo Player.
- El espacio bajo el título en las escenas de pantalla quedó libre a propósito: decidir con Lucas si va un dato
  destacado o un marco más grande.
- Warning de consola del Player en dev ("Function components cannot be given refs", `AbsoluteFillInner`): viene de
  Remotion con React 18 en modo desarrollo, no afecta el render.
- La palabra "Conquit" en el clip de la solución es lo que dice el actor; el guion de esa pieza no está en la base.
