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

### PATRÓN EXACTO del prompt de escena — REUSAR `VEO_RULES`, no reinventar

**La calibración de idioma/cadencia/talking head YA está en el código:** `VEO_RULES` en
`server/functions.mjs` (battle-tested con los videos de `shorts-nature/output/` — los `A_*` son talking
heads que funcionaron, los `B_*` b-roll). Dice textual: *"speaks directly to camera in **Argentine
Rioplatense Spanish (voseo)**, fluently and naturally, only once and without repeating any words"*,
*"van en INGLÉS salvo el diálogo, que va en español rioplatense"*, talking head 8s / plano medio /
push-in sutil / sin silencio de relleno. **El molde nuevo CONSERVA `VEO_RULES` tal cual** — solo cambia
la ESTRUCTURA (personajes = imagen de referencia + escenas por nombre). NO ir a buscar el prompting
afuera ni reescribirlo: ya está probado. El prompt real del dueño (abajo) confirma exactamente ese patrón.

**Estructura del prompt de escena (coincide con VEO_RULES + el prompt real del dueño):**

- **El prompt entero va en INGLÉS** (dirección de cámara, escena, entrega vocal) — es lo que Veo entiende.
- **El diálogo va LITERAL en español rioplatense**, entre comillas, embebido en el prompt inglés.
- **El acento se dispara nombrando la nacionalidad del personaje:** `"a relatable young Argentine woman
  in her late 20s…"` / `"an Argentine man…"`. SIN esto, la voz sale en inglés (dato verificado).
- **El personaje se describe CORTO** (edad + pelo + ropa casual + "Argentine"), NO el `fisicoEn` largo —
  la imagen de referencia ya fija la cara.
- **La cadencia/energía de la voz se dirige en inglés:** cómo arranca y evoluciona la entrega
  ("delivery begins calm and clear, then becomes euphoric and high-energy… voice rising enthusiastically").

**Ejemplo real (transcribir esta ESTRUCTURA en el molde, con los datos de cada escena):**
```
Professional cinematic vertical video, high production quality. A single continuous take in a bright,
modern municipal office with desks, computers, and plants. A relatable young Argentine woman in her late
20s with long loose hair and casual clothes is centered. The camera performs a smooth, steady dolly-out
from a medium shot (waist up) to a wide full-body shot. She speaks clearly: 'El vecino reporta, el
municipio asigna y resuelve. ¡Todos ven el estado en tiempo real!' Her delivery begins calm and clear,
then becomes euphoric and high-energy for the final sentence, her voice rising enthusiastically as her
face lights up. She then stays quiet, smiling at the camera.
```

Mapeo al molde: `[estilo/formato] + [locación de la escena] + [personaje CORTO + Argentine] + [cámara] +
"She/He speaks clearly: '<diálogo español rioplatense de la escena>'" + [dirección de entrega vocal en
inglés según el rol: hook enérgico, cta eufórico, etc.] + [cierre]`. Todo en inglés salvo el diálogo.

- **promptImagen del personaje:** retrato de **una persona argentina** (rasgos/vestuario del rubro local).
- El molde viejo ya tenía calibración rioplatense; al reescribir, NO perderla — este patrón la reemplaza y mejora.

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
