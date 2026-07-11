# Adaptar el Pack Flow al flujo NUEVO de Google Flow (imagen-first)

> **Para quién:** Opus implementador. Autosuficiente. **Fable especifica; Opus implementa.**
> **Origen (2026-07-11):** Lucas mostró que Google Flow cambió a un modelo con **Personajes** y
> **Escenas** como entidades. El "master" monolítico de texto le generó 4 imágenes estáticas (Flow lo
> tomó como prompt de imagen). El Pack Flow actual (master + clips de texto con el `fisicoEn` repetido)
> es del flujo VIEJO.

## El flujo nuevo de Flow (investigado, verificado con la UI del dueño)

- **Consistencia por IMAGEN, no por texto.** Se crea un **Personaje** y se le genera una **imagen de
  referencia** (con Nano Banana / Gemini Image, hasta 3 refs). Flow reusa esa imagen en cada escena y
  mantiene cara/cuerpo/estética. La descripción de texto del personaje es OPCIONAL (guía al agente).
  Fuente: Veo 3.1 "Ingredients to Video" (blog.google/…/veo-updates-flow), cloud.google Veo 3.1 guide.
- **Escenas:** se anima desde los personajes + un prompt de qué pasa. Cada escena = un clip.
- **Consecuencia:** repetir el `fisicoEn` verbatim en cada prompt (nuestra garantía manual) ya no hace
  falta — más aún, mezclar personajes+estilo+acción en UN prompt hace que Flow devuelva una imagen
  estática (lo que le pasó a Lucas).

## Qué cambia (SOLO el Pack Flow — no tocar el resto del pipeline)

El molde `flowpack` deja de producir `{ master, clips[] }` y pasa a producir **3 piezas separadas**:

```
{
  estilo:     string            // estilo global (photorealistic, 9:16, luz, "not CGI-perfect"). SIN personajes ni acción.
  personajes: [{ id, nombre, promptImagen }]   // 1 por personaje del cast
  escenas:    [{ escenaN, rol, prompt, estado }] // 1 por escena del storyboard
}
```

- **`personajes[].promptImagen`** = un prompt para GENERAR LA IMAGEN de referencia del personaje en la
  sección "Personaje" de Flow (Nano Banana): retrato **cuerpo entero**, del `fisicoEn` + vestuario del
  cast, en 9:16, fondo neutro o contextual del rubro, fotorrealista. Es una FOTO del personaje, no una escena.
- **`escenas[].prompt`** = qué pasa en la escena (acción, encuadre, diálogo) **referenciando a los
  personajes por NOMBRE** (ej. "El Intendente entra y pregunta…"), + el estilo/locación — **sin** pegar
  el `fisicoEn` (Flow ya lo tiene por la imagen). El diálogo rioplatense con marca fonética se mantiene.
- **Retirar `verificarConsistenciaFlowpack`** (la garantía que exigía el `fisicoEn` verbatim en cada
  clip): ya no aplica al flujo nuevo. Quitarla del `parse` y del prompt del molde. (El helper puede
  borrarse si queda sin uso — grep antes.)
- **Regen por escena** se conserva (variar la idea visual de una escena sin tocar personajes).

## WOs

| WO | Alcance | Toca |
|----|---------|------|
| **F1** | Molde `flowpack` (server): build genera `{estilo, personajes, escenas}` + parse nuevo + sacar la garantía verbatim | `server/functions.mjs` |
| **F2** | Shape `PackFlow` nuevo (estilo/personajes/escenas) + PasoPack: sección "Personajes" (prompt de imagen + copiar, para Nano Banana) y sección "Escenas" (prompt + copiar + regen + estado) | `src/lib/comercial.ts`, `src/pasos/PasoPack.tsx`, css |
| **F3** | Copiloto: reescribir la guía del paso Pack al flujo nuevo (1) creá cada personaje y generá su imagen con el prompt de acá · 2) creá una escena por clip y animá con su prompt, llamando al personaje por nombre · 3) bajá los videos e importá en Rodaje). Leyenda de estados. | `src/lib/copiloto.ts`, `PasoPack` |

## Detalle del molde (para no adivinar)

- Input (igual que hoy): `context.piece.storyboard` (escenas) + `context.piece.cast` (personajes con
  `fisicoEn`/`vestuario`/`nombre` + `lugar.descripcionEn`).
- `estilo`: consolidá el bloque de realismo global (lo que hoy es el arranque del master) SIN personajes.
- `personajes`: por cada `cast.personajes[]`, un `promptImagen` = "Full-body portrait, 9:16,
  photorealistic, not CGI-perfect. <fisicoEn>. <vestuario>. Neutral/contextual background del rubro."
- `escenas`: por cada `storyboard[]`, un `prompt` = acción + encuadre + diálogo (con fonética) +
  referencia a personajes por nombre + la locación (`lugar.descripcionEn` resumida). Sin `fisicoEn`.
- Para las escenas SIN personajes (b-roll/pantalla), el prompt lleva la locación, como hoy.

### REGLA DURA — idioma de la voz (dato verificado por el dueño, 2026-07-11)

**Por default Veo/Flow genera la voz en INGLÉS.** Lucas lo resolvía poniendo "persona argentina" en el
prompt y salía bien. Entonces:
- **Todo prompt de ESCENA con diálogo debe indicar EXPLÍCITO que el personaje habla en español
  rioplatense / con acento argentino** — ej. `"speaking in Rioplatense (Argentine) Spanish, natural
  Buenos Aires accent"` junto al diálogo. Sin esto, la voz sale en inglés.
- El **diálogo en sí va en español rioplatense** con la marca fonética (como hoy). El resto del prompt
  (dirección técnica) puede ir en inglés (es lo que Veo entiende mejor), pero la línea de idioma de la
  voz es obligatoria.
- En el **promptImagen del personaje**, reforzar que es **una persona argentina** (rasgos/vestuario del
  rubro local) — ayuda a la coherencia con la voz.
- Esto ya estaba en el molde viejo (calibración rioplatense); al reescribir, NO perderlo — reforzarlo.

## Migración de datos

El `PackFlow` viejo (`master`+`clips`) del proyecto `munify-ejemplo` queda incompatible. NO migrar a
mano: si `packFlow` no tiene el shape nuevo, PasoPack muestra "regenerá el pack para el flujo nuevo de
Flow" y el botón Generar/Regenerar produce el shape nuevo. (Aditivo: no rompe reels sin packFlow.)

## Gates (5 reglas de contingencia + los de siempre)

- tsc 0 · eslint 0 · `npx vitest run --pool=vmThreads` verde (ajustar/agregar tests del molde y de
  `estadoDelPaso`/copiloto si cambian; NO romper los existentes) · stylelint 0 · build salida completa
  sin warnings nuevos.
- Prueba funcional real (backend vivo): regenerar el pack de `munify-ejemplo` → el resultado tiene
  `personajes` (2, con promptImagen de imagen) y `escenas` (4, sin fisicoEn embebido). Verificar que el
  prompt de personaje es un RETRATO y el de escena es una ACCIÓN.
- Gate visual: capturar el PasoPack nuevo (secciones Personajes + Escenas + copiloto guía) en el panel
  (docs/12-flow-nuevo/capturas/), mirar que no haya retazos ni master monolítico viejo.
- Cierre: reporte `docs/reportes/06-flow-nuevo.html` (+PDF).
