# Respuesta de Claude a la revisión del Probador Flow (2026-10-15)

**Para el dueño:** ChatGPT tiene razón en casi todo: con un clip por motor no se puede afirmar que Lite valga lo mismo
que Fast, y lo de la voz es una pista fuerte, no una ley. Hay una aclaración que cambia la lectura: el clip de Omni se
hizo ANTES de asignarle la voz a la presentadora, y los de Lite y Fast DESPUÉS, así que no corrieron en igualdad de
condiciones. Los costos de Lite y Fast son los publicados por Google; el de Omni y los reembolsos no se pudieron medir,
porque el panel de Flow no muestra el saldo en ningún lugar que la extensión pueda leer. Los videos y los registros de
cada corrida quedaron en `docs/probador-flow/2026-10-15/`.

Branch: `feature/flow-probador-local` · Revisión respondida: `docs/REVISION-CHATGPT-PROBADOR-FLOW-2026-10-15.md`
Evidencia: `docs/probador-flow/2026-10-15/evidencia.json` (registro completo de cada corrida del backend, transcripción
con tiempos por palabra, datos técnicos de cada archivo) y los tres MP4.

Escala: **VERIFICADA** (hay evidencia objetiva en archivos o registros) · **INDICIO** (observado, N=1 o sin control) ·
**NO VERIFICADA** (no hay forma de comprobarlo hoy) · **DESCARTADA** (la evidencia la contradice).

## 0. Contexto que la revisión no tenía

- **Hubo una primera ronda inválida (01:27–01:39 ART).** El personaje "Presentadora" del proyecto de Flow `1c6046c1…`
  era la foto de un hombre (`docs/probador-flow/2026-10-15/personaje-viejo-equivocado.jpg`). Omni y Lite generaron
  mujeres distintas y Fast falló con error de audio. Esa ronda se descartó entera; sus registros no están en
  `evidencia.json` porque el backend se reinició antes de juntarlos.
- **La ronda válida (02:08–02:25 ART)** usó un proyecto nuevo, "Munify" (`af6d39f0…`), con el personaje "Presentadora"
  creado a partir de un cuadro del video real de la presentadora ("Woman speaking at town hall"), sin generar nada:
  Flow toma la foto subida como retrato (`referencia-personaje-presentadora.jpg`).
- Prompt idéntico en las tres corridas, con "Sin subtítulos ni texto en pantalla" (el de la primera ronda no lo tenía y
  Lite incrustó subtítulos con un error de tipeo).

## 1. Hallazgos de la revisión, uno por uno

| # | Afirmación | Estado | Evidencia |
|---|---|---|---|
| 1 | N=1 por motor: no concluir que Lite iguala a Fast | **VERIFICADA** (la crítica es correcta) | Un clip válido por motor. Lo que se puede decir: "en esta muestra no se vio diferencia de nitidez entre Lite y Fast" (`comparacion-referencia-omni-lite-fast.jpg`). Mi frase "Lite da la misma imagen que Fast" fue una sobregeneralización. |
| 2 | Omni cumplió mejor el texto en esta muestra | **VERIFICADA** para N=1 | Transcripción ElevenLabs Scribe por palabra: Omni dice la frase exacta entre 1,78 y 3,06 s; Lite la dice exacta entre 5,50 y 6,78 s (5 s callada); Fast dice "¡Qué bueno! ¡Qué bueno verte de nuevo!" entre 1,96 y 7,06 s (agrega un fragmento). `evidencia.json → videos[].transcripcion`. |
| 3 | 51 / 58 / 49 s son observaciones, no latencia típica | **VERIFICADA** | Una corrida válida por motor. Generación (del disparo al clip listo): Omni 51 s, Lite 58 s, Fast 49 s. Trabajo completo con bajada: 85 / 84 / 74 s. Sin dispersión medida. |
| 4 | Comparar el upscale de Omni aparte | **VERIFICADA** (de acuerdo) | No se hizo ningún upscale. Omni salió a 360x640, 523 kb/s; Lite 720x1280, 1114 kb/s; Fast 720x1280, 1082 kb/s. |
| 5a | Lite 10 y Fast 20 créditos | **INDICIO** | Valores publicados por Google para cuentas no Ultra (captura que pasó el dueño). La cuenta es Google AI Pro (el botón de cuenta de Flow muestra "PRO"). No se midió el saldo. |
| 5b | Costo de Omni 360p | **NO VERIFICADA** | La ayuda de Google sólo dice "la mitad que 720p". Los textos del panel no traen precios: las opciones del modelo se leen como "volume_up Omni 1.1 Flash", "volume_up Veo 3.1 - Lite" (`leerAjustes`, `extension-flow-lab/content.js:258`). Buscar "crédito" después de tocar "Información de la cuenta" no devolvió nada. |
| 5c | Fallas reembolsadas | **NO VERIFICADA** | Única evidencia: el texto que Flow muestra en el tile fallido ("Se te reembolsará el importe de esta generación"). Sin acceso al saldo no hay transacción que lo pruebe. |
| V | Veo necesita que el personaje tenga voz | **INDICIO** fuerte, no regla | 4 fallas "No se ha podido generar el audio" sin voz asignada: Lite 02:10 y 02:13, Fast 02:11 y 02:14. Voz "erinome" (Female, clear, mid pitch) asignada ~02:18 con "Añadir al personaje". Después: Lite 02:21 y Fast 02:23 sin fallas. En la primera ronda, con el personaje viejo (creado por texto, voz desconocida), Lite salió con audio y Fast falló igual. Falta separar voz, modo Ingredients, prompt y variación del servicio. |
| V2 | La voz se heredó a los tres modelos | **DESCARTADA** | Omni corrió a las 02:08, antes de asignar la voz. Lite y Fast corrieron después. **Las tres corridas no tuvieron la misma configuración.** Para comparar en serio hay que repetir Omni con la voz asignada. |
| Q | "Quality pierde la cara" | **DESCARTADA** como certeza | Lo único verificado es que la ayuda de Google lista Ingredients/References como no soportado en Quality. Quality no se probó. Corrijo: "no admite referencias según Google; sin probar". |

## 2. Riesgos técnicos señalados, contrastados con el código

| Riesgo | Estado | Evidencia y propuesta acotada |
|---|---|---|
| Historial sólo en `localStorage` | **Parcialmente resuelto** | Agregado `GET /api/flow/probador/resultados` con historial en `server/storage/probador-resultados.json` (`server/index.mjs:1908`) y la pantalla lo mezcla (`src/ProbadorFlow.tsx`). Falta: hoy se escribe al consultarse, no al terminar el trabajo (`probadorMeta`, `server/index.mjs:1903`); si el backend se reinicia antes de una consulta, la entrada se pierde. **Propuesta:** escribirla al terminar el trabajo y sumar hash del prompt, voz, saldo y costo. |
| Envío incierto en `unIntento` | **Resuelto** | Antes: si el click no se confirmaba en 2,5 s, el trabajo fallaba y el clip quedaba en Flow sin bajar (pasó con Lite en la primera ronda). Ahora espera la generación sin volver a pulsar y falla sólo si no aparece un tile nuevo (`server/flowPuente.mjs:325`). Ninguna de las 6 corridas de la segunda ronda reportó envío incierto. Reintentos automáticos de generar siguen bloqueados (`server/flowPuente.mjs:82`). |
| Selectores estrictos de la extensión | **Había 3 bugs, corregidos** | (a) `/\\bx\\s?1\\b/` y `/\\b8\\s?s\\b/` dentro de un literal de expresión regular nunca coinciden: todo pedido estricto fallaba (`extension-flow-lab/content.js:250-251`). (b) Con Veo no existe el botón de resolución ni el de duración en modo Ingredients; ahora lo confirma la pastilla de ajustes (`content.js:235`). (c) El botón de 360p se lee "360p info". Prueba sin generar: los ajustes estrictos devolvieron "Vídeo · 720p · 8 s crop_9_16 x1 · Veo 3.1 - Lite" y "Vídeo · 360p · 8 s crop_9_16 x1 · Omni 1.1 Flash". |
| Leer el precio antes de pulsar | **NO implementable hoy** | El panel no expone créditos en texto (ver 5b). Queda como pendiente de relevamiento con el dueño. |
| Auto-recarga y coexistencia de extensiones | **Indicio de riesgo** | La recarga respeta el trabajo activo: compara huella y no recarga si `ocupado` (`extension-flow-lab/background.js:293-298`). La coexistencia NO está impedida por código: las dos extensiones piden pasos a la misma cola con `origen=background`. El endpoint del probador exige ver la 0.6.0 (`server/index.mjs:1890`), pero un trabajo de SalesBot o de un comercial podría ejecutarse en la extensión de prueba. Durante las pruebas se pausaron los pedidos de SalesBot (`SALESBOT_MEDIOS=0`). **Propuesta:** que la extensión de prueba pida pasos con `origen=lab` y que la cola le entregue sólo trabajos del probador. |
| Endpoint del probador sólo local | **Indicio de riesgo** | `server.listen(PORT)` escucha en todas las interfaces (`server/index.mjs:2156`), así que el endpoint es alcanzable desde la red local si el firewall lo permite. **Propuesta:** escuchar en `127.0.0.1` (Media Studio es sólo local). |
| Concurrencia y contaminación | **VERIFICADA** sin problema | Rechaza con 409 si hay un trabajo activo (`server/index.mjs:1889`). Proyecto interno `probador-local`, sin tomas en comerciales (`agregarToma` vacío) ni cambio de presets (`server/index.mjs:1893-1897`). |
| Que el archivo sea del trabajo actual | **VERIFICADA** con mitigación | Se toma la URL del tile más nuevo al terminar y se compara con la anotada antes de pedir; si es la misma, falla ("Flow no dejó un clip nuevo"). |
| Pruebas reales | **VERIFICADA** | `npx tsc --noEmit` sin errores; `eslint` 0 errores en `src/ProbadorFlow.tsx` y `src/App.tsx`; `node --check` en server y extensión; `vitest` 46 archivos, 645 pruebas, todas pasan. |

## 3. Correcciones hechas en el branch (para revisar)

- `c76f573`: los tres bugs de los selectores estrictos e historial del probador en el servidor.
- `b234c2f`: proyecto de Flow "Munify" con la presentadora correcta (`server/presentadora.json`) y pasos nuevos de la
  extensión de prueba: `explorar`, `tocar`, `soltarArchivo` (pega una imagen en la caja: sube sin abrir el selector de
  Windows), `tilesDetalle`, `tipearReal` por el depurador (el título del proyecto sólo se guarda así) y
  `renombrarProyecto`.
- `161c1ef`: el probador no da por perdido un clip que Flow tarda en mostrar.

## 4. Próxima prueba mínima

De acuerdo con A–D. Agrego:

- **Antes de A (upscale):** no hay forma automática de leer el precio; el dueño tiene que confirmar en pantalla que el
  upscale dice 0 créditos antes de aceptar. Sin esa confirmación, no se ejecuta.
- **Antes de B:** repetir Omni con la voz "erinome" ya asignada, para que las tres corridas sean comparables.
- **Para D (saldo antes y después):** hace falta que el dueño indique dónde muestra Flow el saldo en su cuenta; la
  extensión no lo encontró.

## 5. Criterio de elección

De acuerdo con decidir por tipo de escena y no por motor único. Con la evidencia de hoy: borradores con Omni; para el
final, Lite como candidato por costo, sujeto a más muestras de habla sostenida; Fast sólo con mejora comprobada; Quality
sin probar.
