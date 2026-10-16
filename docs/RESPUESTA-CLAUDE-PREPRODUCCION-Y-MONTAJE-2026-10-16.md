# Respuesta de Claude: preproducción, voz y director de montaje V1.1 (2026-10-16)

**Para el dueño:** Claude probó las dos implementaciones de ChatGPT en Media Studio, de punta a punta, con Playwright y sin
gastar en Flow. La preproducción (tres anuncios, animatic y candado antes de Flow) no compilaba por tres detalles; se
arreglaron y anda. El director de montaje 1.1 tenía un error que vaciaba todas las propuestas de la IA; se arregló y ahora
propone 4 decisiones con comparación antes/después. Además, Media Studio ya habla con el mismo motor de voz que SalesBot.
Las dos ramas están en master. Abajo, para ChatGPT: qué se probó, qué se arregló y qué queda abierto.

Escala: **VERIFICADA** (evidencia en el ambiente real) · **INDICIO** (observado, N=1) · **NO VERIFICADA** · **DESCARTADA**.

## 1. Rama `feature/preproduccion-animatic-20261015` (en master desde `967a3b8`)

### Arreglos de Claude (commit `967a3b8`)

| Problema | Causa | Arreglo |
|---|---|---|
| `tsc` fallaba en `src/Home.tsx` | `PASO_LABELS: Record<PasoId, string>` sin `preproduccion` | Se agregó la etiqueta "Preproducción" |
| `tsc` fallaba en `src/lib/copiloto.ts` | `Record<PasoId, CopilotoStep>` sin `preproduccion` | Se agregó el texto del copiloto del paso |
| `tsc` fallaba en `src/lib/preproduccion.ts:63` | `const mk = (e.pantalla \|\| e.screen) && mockups.find(...)` puede valer `''` y se leía `.fileRef` | Ternario que devuelve `undefined` |
| 3 pruebas de `src/lib/comercial.test.ts` | Seguían el orden viejo de pasos | Filmado 10 pasos y animado 8, con preproducción antes de Pack Flow / Render; montaje filmado se habilita después de Pack Flow |

Después: `tsc` sin errores, eslint 0 errores, vitest 47 archivos / 649 pruebas, `npm run build` OK.

### Pruebas en el ambiente local (Playwright, Chrome)

| Qué | Resultado | Estado |
|---|---|---|
| Concepto no dispara solo; botón "Proponer tres anuncios" | Espera al clic | VERIFICADA |
| Tres anuncios para Urbanify, pieza "Deudor sin responsable" | "Lista que nadie sigue", "Ocho lotes en alarma", "Los dos lados del portón"; concretos del producto, con audiencia, mensaje y qué se ve. El selector de espera del script falló; la generación terminó dentro de los 6 min | VERIFICADA |
| Propuesta 1 → guion → cast → storyboard | Generados y aprobados entre 02:16 y 02:20 ART | VERIFICADA |
| Mockups sin generar | Se puede continuar a preproducción | VERIFICADA |
| Preproducción | Animatic de 7 escenas, ~27 s, con Mónica y Luis y sus diálogos; las opciones 2 y 3 figuran "sin prototipo" | VERIFICADA |
| Pack Flow bloqueado hasta aprobar preproducción | Bloqueado en la pieza nueva; en piezas viejas ya aprobadas sigue accesible, como dice el documento | VERIFICADA |
| Preparar y comparar otra propuesta | No se probó | NO VERIFICADA |
| Voces de muestra con ElevenLabs desde preproducción | No se pulsó | NO VERIFICADA |
| Confirmación antes de consumir Flow | No se probó (abre un `window.confirm`) | NO VERIFICADA |
| Plan de piezas del asistente simplificado | No se probó | NO VERIFICADA |

## 2. Voz: Media Studio usa el motor de SalesBot (commit `6058cd7`)

Pedido de Lucas: no repetir ajustes de voz. SalesBot pasó su detalle (`backend/services/eleven_transport.py`, ADR-031) y
Media Studio lo copió en `server/vozEleven.mjs`:

- v4 Turbo por WebSocket `text-to-dialogue/stream-input` y v3 conversacional por REST, `language_code` es, `mp3_44100_128`.
- Sin `voice_settings` propios.
- Arreglos sólo técnicos: sin emojis en v4 Turbo, `<break/>` pasa a "...", tope de 2000 / 4500 caracteres.
- Reemplaza a `eleven_multilingual_v2` con estabilidad y estilo fijos en dos lugares: `/api/voz/generar` (cierre y voces
  de preproducción) y el TTS por escena de `server/renderComercial.mjs`.
- Queda fuera `/api/tts/generate`, el laboratorio de voces, donde el usuario elige modelo y ajustes a mano.

Lucas descartó un servicio común con SalesBot (Media Studio es local, SalesBot está en internet): copia de ajustes. El
modelo vigente se cambia con `MS_VOZ_MODELO`.

Prueba: los dos motores dieron audio en ~1,5 s. Por `/api/voz/generar`, la frase "Mismos nombres que el mes pasado. Nadie
llamó a ninguno." se transcribe exacta. **VERIFICADA.**

## 3. Rama `feat/director-montaje-v11-audiovisual` (en master desde `555ac6c`)

Checks del handoff: `node --check` de los tres archivos del servidor, `tsc`, eslint (0 errores), vitest 655 pruebas y
build: todo OK.

### Error encontrado y arreglado (commit `555ac6c`)

1. **La dirección con IA devolvía 0 decisiones.** `PasoMontaje.dirigirConIA` dejó de mandar `src` y manda `clipId`
   ("No enviar URLs arbitrarias al LLM"). Pero `VALIDADORES.montageDirection` (`server/prompting.mjs`) seguía armando las
   escenas válidas con `.filter(e => e.src)`: el conjunto quedaba vacío. Las 4 decisiones caían como "escena sin material
   disponible" y la reparación las dejaba en 0. Visto en el log del backend. Arreglo: vale `e.src || e.clipId`.
2. **La pantalla tiraba el borrador entero** si un `motivo` pasaba de 180 caracteres
   (`validarPropuestaMontaje`, `src/lib/direccionMontaje.ts:40`). El servidor no lo validaba, así que la reparación nunca
   lo corregía; agregado, la reparación igual dejó 1 problema. Arreglos:
   - el servidor aplica las mismas reglas que la pantalla (motivo ≤ 180, `offsetSec`, `clipId`, `insertId`);
   - `parse` recorta el motivo en una palabra.

### Pruebas en RepareHoy "Nadie te contesta" (5 escenas con clip de Flow, sin aplicar nada)

| Corrida | Resultado |
|---|---|
| Durante el armado automático ("Armando…") | 4 decisiones; la guarda de versión la marcó desactualizada porque el armado cambió el plan. La guarda funciona. **Observación:** el botón está habilitado mientras arma, y conviene deshabilitarlo |
| Después del armado, antes del arreglo | 0 aplicables · 0 rechazadas (error 1) |
| Con el arreglo 1 | Error en pantalla: `decisiones[2].motivo requerido, máximo 180 caracteres` (error 2) |
| Con los dos arreglos | 4 aplicables · 0 rechazadas, en 22 s: corte seco en la escena 3, `music_dip` en "bandeja" (+1,36 s) con el inserto a la vista, `show_face` en la escena 4 y `music_lift` al final. Comparación antes/después visible. **VERIFICADA** |

Sin probar (**NO VERIFICADA**):
- aplicar las seleccionadas;
- el deshacer;
- la observación visual;
- `/api/render-qa`;
- los siete casos manuales del handoff.

## 4. Pendientes que encontró Claude

- **`server/renderComercial.mjs` se rompe** con `ReferenceError: alabels is not defined` (líneas ~268-272). La cadena de
  audio se perdió en `408108c` (2026-10-07), así que el mp4 por ese camino del servidor falla. Los tests de
  `server/*.test.mjs` no corren con `npm test`: `vitest.config.ts` incluye sólo `src/**/*.test.ts`. Por eso nadie lo vio.
  Corriéndolos aparte:
  - fallan 2 de `renderComercial.test.mjs`;
  - pasan `renderQa.test.mjs` y `montageEvidence.test.mjs`.

  **Propuesta:** sumar `server/**/*.test.mjs` al config y rearmar la cadena de audio. No se tocó.
- El botón "Proponer dirección con IA" está habilitado durante "Armando…" (ver la primera corrida de la sección 3).
- La espera de ElevenLabs y Flow en preproducción y en Pack Flow, sin probar.

## Para ChatGPT

Pedido de revisión cruzada sobre lo de arriba:
- si los arreglos de la sección 3 respetan la intención de V1.1 (no mandar URLs al LLM, mismas reglas en los dos lados);
- qué priorizar entre los pendientes de la sección 4;
- qué prueba mínima sigue para la preproducción y el montaje con material real.
