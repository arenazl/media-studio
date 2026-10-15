# Resultado de la prueba siguiente del plan de ChatGPT (2026-10-15)

**Para el dueño:** se corrió la escena exigente que pidió ChatGPT, con habla de 5 a 7 segundos, manos y gestos: la
presentadora de Munify dice "Ahora podés hacer tu reclamo desde el celular, y te avisamos apenas lo resolvemos". Omni y
Lite la dijeron completa y sin errores, y los dos mantienen su cara. Lite habla más tiempo, gesticula más y se ve más
nítido; Omni es más tranquilo y más blando. Con un clip por motor esto todavía es un indicio, no una conclusión. Con tu
aprobación, se pasó el clip de Omni a 720p con la mejora de Flow: quedó casi tan nítido como Lite, conserva el audio,
es el mismo clip y no apareció ningún aviso de costo.

Plan seguido: `docs/REVISION-CHATGPT-PROBADOR-FLOW-2026-10-15.md`, sección "Próxima prueba mínima".
Archivos: `docs/probador-flow/2026-10-15/prueba-b/` (los dos MP4, una tira de un cuadro por segundo de cada uno,
`corridas-b.json` con el registro completo y `ciega/` para la evaluación a ciegas).

## A. Upscale de Omni 360p a 720p — ejecutado con aprobación del dueño (03:01 ART)

- Dónde está: menú "Más opciones" del clip → "Descargar" → "720p Resolución mejorada" (junto a "270p GIF animado" y
  "360p Tamaño original"). Relevado con `menuDeTile` (`extension-flow-lab/content.js`), sin elegir ninguna opción.
- El ítem no muestra precio. La ayuda de Google dice que en planes Pro y Ultra cuesta 0 créditos, y la cuenta es Pro.
  Como la cuenta no lo confirmaba en pantalla, se pidió aprobación al dueño, que la dio ("dale").
- Al elegirlo **no apareció ningún aviso de costo ni confirmación**. Flow mostró "Mejorando la resolución del vídeo.
  Este proceso puede tardar varios minutos…" y bajó solo el archivo unos 35 s después.
- Clip mejorado: `prueba-b/omni-flash-1.1-360p-mejorado-720p-flow.mp4`. Original conservado:
  `prueba-b/omni-flash-1.1-360p.mp4`.

| Dato | Omni original | Omni mejorado por Flow | Lite (referencia) |
|---|---|---|---|
| Resolución | 360x640 | 720x1280 | 720x1280 |
| Video | 541 kb/s | 1518 kb/s | 1184 kb/s |
| Audio | sí | sí (se conserva) | sí |
| Duración | 8,0 s | 8,0 s | 8,0 s |

- **Es el mismo render, no uno nuevo — VERIFICADA:** similitud estructural (SSIM) entre el original agrandado y el
  mejorado: 0,973 en todo el clip. Misma pose cuadro por cuadro.
- **Nitidez — INDICIO (N=1, mirado en un recorte de la cara):** el mejorado define mucho mejor ojos, cejas y aros que el
  original (`prueba-b/cara-omni360-omni720mejorado-lite.png`). Lite sigue teniendo más detalle fino (pestañas, piel).
  No se vieron artefactos nuevos en el recorte; falta mirarlo en movimiento.
- **Costo — NO VERIFICADA:** sin aviso de costo y sin acceso al saldo. Lo publicado por Google es 0 créditos para Pro.

## B. Escena con habla sostenida: Omni 360p contra Lite

Condiciones iguales en las dos corridas: mismo prompt, proyecto de Flow "Munify", Ingredients con @Presentadora, voz
"erinome" ya asignada al personaje, 8 s, 9:16, x1, modo de un solo intento.

Prompt exacto: *Plano medio de Presentadora, con saco blanco, frente a un edificio municipal con la bandera argentina.
Habla a cámara con naturalidad durante toda la toma, acompaña la explicación con las manos y sonríe al final. Dice:
"Ahora podés hacer tu reclamo desde el celular, y te avisamos apenas lo resolvemos." Expresiones y microgestos
realistas, labios sincronizados con la voz. Sin subtítulos ni texto en pantalla.*

## C. Evaluación por clip

No es ciega: la hizo el mismo agente que corrió las pruebas y sabe qué clip es cuál. Para una evaluación ciega real
quedó `prueba-b/ciega/`: `clip-1.mp4` y `clip-2.mp4`, los dos a 720x1280 para que el tamaño no delate el motor, y la
clave aparte. Los niveles de confianza son míos.

| Criterio | Omni 1.1 Flash 360p | Veo 3.1 Lite 720p | Confianza |
|---|---|---|---|
| (i) Transcripción | Exacta, sin agregados ni omisiones | Exacta, sin agregados ni omisiones | Alta (ElevenLabs Scribe, por palabra) |
| (ii) Inicio del diálogo | 1,08 s; termina 6,36 s (5,3 s de habla) | 0,52 s; termina 6,92 s (6,4 s de habla) | Alta |
| (iii) Labios | La boca se mueve mientras habla en los cuadros muestreados | Ídem, con más apertura y articulación visible | Baja: se miró una tira de 1 cuadro por segundo, no el movimiento |
| (iv) Naturalidad cara, manos y cuerpo | Gestos suaves; manos bajas y con poco recorrido; expresión contenida | Cejas y boca más expresivas; manos más activas y a la vista; sonrisa al final como pedía el prompt | Media |
| (v) Identidad | Coincide con la referencia (pelo, rasgos, saco, lugar) | Coincide con la referencia | Alta |
| (vi) Artefactos | Imagen blanda por la resolución; sin defectos visibles en la tira | Sin defectos visibles en la tira; las manos no se pueden juzgar con detalle a ese tamaño | Media |

## D. Registro por corrida

Completo en `prueba-b/corridas-b.json`: fecha y hora, job, clip remoto, archivo, prompt exacto, modelo pedido y
confirmado, resolución, pastilla de ajustes, duración, salidas, modo de referencia, voz, tiempos, fallas y
transcripción con tiempos por palabra.

| Dato | Omni 1.1 Flash 360p | Veo 3.1 Lite 720p |
|---|---|---|
| Inicio (ART) | 02:53:59 | 02:55:13 |
| Job | flow-1792043639022 | flow-1792043713056 |
| Confirmado por Flow | Omni 1.1 Flash · 360p · 8 s · x1 | Veo 3.1 - Lite · 720p · 8 s · x1 |
| Generación (disparo a clip listo) | 44 s | 53 s |
| Trabajo completo con bajada | 72 s | 80 s |
| Archivo | 360x640, 541 kb/s | 720x1280, 1184 kb/s |
| Fallas | ninguna | ninguna |
| Créditos | no publicado | 10, valor publicado |
| Saldo antes y después | no disponible | no disponible |

El saldo no está disponible porque Flow no lo muestra en ningún texto que la extensión pueda leer. Para medir el costo
real hace falta que el dueño indique dónde lo ve.

## Lectura

- **Indicio:** con voz asignada y la misma configuración, Omni y Lite cumplen el diálogo igual de bien. Esto corrige la
  ronda anterior, donde Omni había corrido sin voz y Lite empezó a hablar recién a los 5 s.
- **Indicio:** Lite actúa más (manos, cejas) y se ve más nítido. Omni es más sobrio y más blando.
- **Indicio:** el upscale de Flow lleva a Omni a la misma resolución que Lite, conserva el audio y acerca mucho la
  nitidez, sin rehacer el clip. Si de verdad es gratis en Pro, "Omni + mejora a 720p" pasa a ser candidato para el
  final, no sólo para borradores.
- **Pendiente para decidir:** más muestras de las dos, la evaluación ciega hecha por el dueño o por ChatGPT, y medir el
  saldo para confirmar el costo real de Omni y del upscale.
