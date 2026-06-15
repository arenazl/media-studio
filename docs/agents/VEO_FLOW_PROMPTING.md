# Veo / Google Flow — Guía de prompting para reels verticales

> Todo lo aprendido generando reels 9:16 con **Google Flow (modelo Veo 3)** para
> apps municipales (Munify). Pensado para que **otra persona lo tome como premisa**
> y solo le agregue la particularidad de su escena. Validado el 2026-06-13/14.

---

## 0. Lo más importante en 1 minuto

- **Realismo > perfección.** El error #1 es que sale "demasiado perfecto" (cara de
  CGI/comercial). Se corrige con: **cámara a distancia media** (no close-up),
  **gente común y no modelos**, y descriptores `not over-rendered, not CGI-perfect`.
- **El movimiento de cámara hay que forzarlo.** Veo ancla el plano fijo para el
  lip-sync; un "zoom out" suelto lo ignora.
- **El formato 9:16 lo manda el selector de Flow, NO el texto del prompt.**
- **La duración la fija el selector / la edición, NO el texto.** Los clips salen de
  largo fijo (4 u 8s); el "3-4 seconds" del prompt es solo guía de ritmo.

---

## 1. Principios (las palancas que funcionan)

### 1.1 Realismo — que no se note la IA
La clave que más movió la aguja: **distancia media** entre cámara y sujeto. En
close-up se ven los detalles "perfectos" de la IA (piel plástica, simetría) y
canta a render. A distancia media + gente común, parece video real.

| Para esto | Poné esto en el prompt |
|---|---|
| Que no parezca CGI | `realistic, not over-rendered, not CGI-perfect` |
| Que no sea cara de modelo | `an ordinary, real-looking person, natural and relatable, not a model` |
| Que no esté pegada a la cara | `medium shot at a steady medium distance`, `from the waist up, not a close-up` |
| Calidad de producción | `professional cinematic, clean, sharp, well-lit, smooth steady camera, high production quality` |

> Probamos también el look "celular/UGC" (`handheld, grainy, lower quality`) → se
> **descartó**. El estándar es **gente común + toma profesional** (real pero prolijo).

### 1.2 Movimiento de cámara — el dolly-out
Veo en talking heads tiende a dejar el plano **fijo**. Para que se mueva de verdad:
1. **Liderar** con el movimiento: empezar el prompt con `Continuous dolly-out shot.`
2. **Definir encuadre inicial ≠ final**: `begins as a medium shot ... ending as a wide full-body shot`. Definir los dos extremos lo obliga a moverse.
3. **Verificar el resultado** con una tira de frames equiespaciados (ver §3), NO con 3 frames sueltos (engañan).

### 1.3 Diálogo hablado (cuando la persona habla)
- **Idioma:** `speaks in Argentine Rioplatense Spanish` + voseo (`tenés`, `esperás`).
- **Marca fonética:** escribir la marca **como suena**, nunca en inglés. Ej: `Munifái`, jamás `Munify` (lo leería con acento inglés).
- **Decir una sola vez:** `only once and without repeating any words`. Si no, Veo
  **repite** para "rellenar" los 8s (nos pasó: "tu municipio tu municipio").
- **Cerrar con punto, no con `...`** antes del remate: `...municipio. ¡¿Qué esperás?!`
  (los `...` hacen que arrastre y repita).
- **Rellenar el sobrante:** `after speaking, stays quiet smiling until the end`
  (evita que repita en los segundos que sobran).

### 1.4 Énfasis y euforia (el gancho)
La fórmula del remate que funcionó: **contraste calma → euforia**, con **voz y cara
sincronizadas**.
- Exclamación en el diálogo: `¡[REMATE]!`
- `delivers the first part calmly and confidently, pauses for a beat, then exclaims "¡[REMATE]!" with euphoric, excited, high-energy delivery — voice rising while the face lights up in perfect sync`.
- La **pausa actuada** se marca con `...` en el diálogo + `pauses for a beat`.

### 1.5 B-roll (sin presentador)
- **Que NO hablen:** `No spoken dialogue, no talking; ambient sound only`. Si no,
  Veo mete diálogo en inglés y el lip-sync queda raro.
- **Toma única:** `One single continuous take, same background, no cut`. Veo a veces
  **cambia el fondo a la mitad** con dolly-outs largos; esto lo evita.
- Mostrar el **producto en el mundo real** (gente, dispositivos, contexto), no
  postales genéricas. La pantalla de la app NO se muestra (Veo inventa UI falsa):
  `screen not clearly legible`.

---

## 2. Settings de Flow (lo que el prompt NO controla)

| Cosa | Cómo se controla | Nota |
|---|---|---|
| Formato 9:16 | **Selector de aspect ratio de Flow** | El texto "vertical 9:16" NO basta; si el selector está en 16:9, sale horizontal |
| Modelo | Selector | Usar **Veo 3** |
| Duración | Selector (4/8s) + recorte en edición | El texto "3-4 seconds" es solo guía de ritmo |
| Misma cara entre clips | Descripción física idéntica + misma sesión, o **referencia de imagen** | Para clavarla 100%, subir un frame como personaje |
| Logo | Adjuntar la imagen como ingrediente + pedirlo en el prompt | `Use the attached logo as a small clean overlay in a top corner` |

---

## 3. Cómo verificar un clip (sin abrir el video)

```bash
# Specs
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of csv=p=0 video.mp4

# Tira de 5 frames equiespaciados para ver si la cámara se MUEVE (zoom/dolly)
ffmpeg -i video.mp4 -vf "select='not(mod(n\,48))',scale=220:-1,tile=5x1" -frames:v 1 strip.jpg
```
Mirá la tira: si el sujeto **cambia de tamaño** a lo largo, hay dolly-out; si queda
igual, la cámara no se movió (aunque el prompt lo pidiera).

---

## 4. Templates (tomá uno y completá los `[CORCHETES]`)

### Template A — Presentador a cámara (persona hablando, distancia media)
```
Professional cinematic vertical 9:16 video, clean and well-lit, smooth steady camera, high production quality, realistic, not over-rendered and not CGI-perfect. One single continuous take, same background the whole time, no cut. An ordinary real-looking [Argentine man/woman in their __s], natural and relatable, not a model, with [pelo/vestuario], [LOCACIÓN]. The camera performs a smooth dolly-out that starts at a medium shot from the waist up — not a close-up — and steadily pulls back to a wide full-body shot revealing [LO QUE SE REVELA]. He/She speaks in Argentine Rioplatense Spanish, only once and without repeating any words: "[FRASE CALMA]. ¡[REMATE]!" He/She delivers the first part calmly and confidently, pauses for a beat, then exclaims "¡[REMATE]!" with euphoric, excited, high-energy delivery — voice rising while the face lights up in perfect sync. After speaking, stays quiet smiling until the end. Natural lip-sync, no on-screen text. [Use the attached logo as a small clean overlay in a top corner / no logos].
```

### Template B — Recorrido / b-roll de un lugar (oficina, calle, municipio)
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. [ESCENA: gente común no modelos, qué hacen y dónde — ej: empleados trabajando en una oficina municipal moderna], natural [luz]. Camera steady or a slow gentle pan. No spoken dialogue, no talking, ambient [office/street] sound only. Very short 3–4 second clip, one brief moment, minimal camera motion. [Use the attached logo as a small clean overlay in a top corner / no logos].
```

### Template C — B-roll de escena del día a día (el problema o el resultado)
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. [SITUACIÓN cotidiana: ej. un bache, una cola larga, una luz rota — o el resultado resuelto], an ordinary real-looking [persona] reacting with [emoción], [luz/momento del día]. No spoken dialogue, ambient sound only. Very short 3–4 second clip, one brief moment, minimal motion. [Use the attached logo as a small clean overlay in a top corner / no logos].
```

### Template D — Testimonial de vecino (persona común, frase corta)
```
Professional cinematic vertical 9:16 video, clean, well-lit, smooth steady camera, realistic, not CGI-perfect. Medium shot at a steady medium distance. An ordinary real-looking [persona], not a model, [contexto: en su barrio / en su casa]. He/She speaks to camera in Argentine Rioplatense Spanish, only once and without repeating any words: "[FRASE corta, natural, de beneficio]." Delivered calmly and with genuine emotion, [emoción]. After speaking, stays quiet with a warm smile until the end. Natural lip-sync, no on-screen text. [Use the attached logo as a small clean overlay in a top corner / no logos].
```

---

## 5. Ejemplo real validado (Template A)

`[LOCACIÓN]` = `standing at the entrance of an Argentine town hall with columns and an Argentine flag`
`[FRASE CALMA]` = `Munifái es la forma más inteligente de gestionar tu municipio`
`[REMATE]` = `¿qué esperás?`

Resultado: presentadora común a distancia media, dolly-out que abre revelando el
municipio, remate eufórico voz+cara. Fue el take ganador.

---

## 6. Checklist antes de generar

- [ ] Selector de Flow en **9:16** y modelo **Veo 3**.
- [ ] ¿Habla? → `Rioplatense`, marca fonética, `only once / no repeat`, punto antes del remate.
- [ ] ¿B-roll? → `No spoken dialogue, ambient only` + `single continuous take, no cut`.
- [ ] **Distancia media**, no close-up. `not over-rendered, not CGI-perfect`. `not a model`.
- [ ] ¿Logo? → adjuntar imagen + pedirlo como overlay en esquina.
- [ ] Generar → **verificar con la tira de frames** (§3) antes de dar por bueno.
