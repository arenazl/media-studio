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

## Pendiente / siguiente etapa

- **Mockups "PowerPoint avanzado"** sobre el mismo motor: escenas `titulo` (serif + número que cuenta), `pantalla`
  (captura en marco con zoom al dato), `placa`; referencia de nivel: `public/bocetos/intendente.mp4`, más moderno.
  Reemplaza `server/mockupReel.mjs` (grabación en vivo con Playwright) en la línea animada.
- El multipista (`ReelEditor`) sigue con su vista previa vieja: cambiarla por el mismo Player.
- Warning de consola del Player en dev ("Function components cannot be given refs", `AbsoluteFillInner`): viene de
  Remotion con React 18 en modo desarrollo, no afecta el render.
- La palabra "Conquit" en el clip de la solución es lo que dice el actor; el guion de esa pieza no está en la base.
