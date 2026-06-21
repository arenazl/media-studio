# Playbook de videos con Flow / Veo — Munify (FUENTE ÚNICA)

> **Para qué:** tener en UN solo lugar todo lo aprendido generando reels verticales
> 9:16 con **Google Flow (modelo Veo 3)**, para poder **generar varios videos** sin
> volver a redescubrir la vuelta cada vez. Consolida lo que estaba disperso en:
> `docs/agents/VEO_FLOW_PROMPTING.md`, `docs/VARIANTES_NARRACION_REELS.md`, el
> generador `src/VideoPromptBuilder.tsx` y el `CONTEXT.md` de reels de Munify.
>
> **Reparto de roles:** yo (Claude) entrego **prompts + settings**; el video lo
> generás vos en **Flow** (tu cuenta PRO) y la **edición/montaje** la hacés vos.

---

## 0. Lo esencial en 1 minuto

- **Realismo > perfección.** El error #1 es que sale "demasiado perfecto" (cara de
  CGI/comercial). Se corrige con **distancia media** (no close-up), **gente común,
  no modelos**, y `not over-rendered, not CGI-perfect`.
- **El movimiento de cámara hay que forzarlo.** Veo ancla el plano fijo para el
  lip-sync; un "zoom out" suelto lo ignora. Hay que liderar con el movimiento y
  definir encuadre **inicial ≠ final**.
- **El 9:16 lo manda el selector de aspect ratio de Flow, NO el texto.** Si el
  selector está en 16:9, sale horizontal aunque el prompt diga "vertical 9:16".
- **La duración la fija el selector (4/8s) + la edición, NO el texto.** El "3-4
  seconds" del prompt es solo guía de ritmo.
- **Marca fonética SIEMPRE `Munifái`**, jamás `Munify` (Veo la leería en inglés).
- **Verificá con la tira de frames** (§7), nunca con 3 frames sueltos.

---

## 1. Diccionario de prompting (el vocabulario que funciona)

### 1.1 Realismo — que no se note la IA
La palanca que más movió la aguja: **distancia media** entre cámara y sujeto. En
close-up se ven los detalles "perfectos" de la IA (piel plástica, simetría) y canta
a render. A distancia media + gente común, parece video real.

| Para esto | Poné esto en el prompt |
|---|---|
| Que no parezca CGI | `realistic, not over-rendered, not CGI-perfect` |
| Que no sea cara de modelo | `an ordinary, real-looking person, natural and relatable, not a model` |
| Que no esté pegada a la cara | `medium shot at a steady medium distance`, `from the waist up, not a close-up` |
| Calidad de producción | `professional cinematic, clean, sharp, well-lit, smooth steady camera, high production quality` |

> El look "celular/UGC" (`handheld, grainy, lower quality`) se **probó y descartó**
> para el estándar principal. El estándar es **gente común + toma profesional** (real
> pero prolijo). El UGC queda como variante puntual (ver §1.3).

### 1.2 Cámara — fragmentos exactos (los del builder, ya battle-tested)
Para que la cámara se mueva **de verdad**: liderar con el movimiento y, en dolly,
definir encuadre inicial ≠ final (`begins as a medium shot ... ending as a wide
full-body shot`).

| Movimiento | Fragmento en inglés |
|---|---|
| Plano fijo | `static locked-off shot on a tripod, stabilized, no camera shake` |
| Dolly-out | `slow continuous dolly-out, smooth and stabilized, no shake` |
| Gimbal | `smooth gimbal tracking shot, slow and stabilized` |
| Drone | `smooth cinematic aerial drone shot, slow descent` |
| Handheld | `handheld smartphone shot, casual and naturally shaky like a real phone video` |

### 1.3 Look — cine vs UGC (fragmentos exactos)
| Look | Fragmento en inglés |
|---|---|
| **Cinematográfico** (default) | `Professional cinematic vertical video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic` |
| **Real / UGC** (variante) | `shot on a smartphone, vertical, candid everyday moment, natural available light, slightly imperfect with a faint touch of grain and mild compression, a bit less crisp like an everyday phone video, authentic and unpolished UGC look — not cinematic, not studio, not too polished` |

### 1.4 Diálogo hablado (cuando la persona habla)
- **Idioma:** `speaks in Argentine Rioplatense Spanish` + voseo (`tenés`, `esperás`).
- **Marca fonética:** `Munifái`, jamás `Munify`.
- **Decir una sola vez:** `only once and without repeating any words`. Si no, Veo
  **repite** para rellenar los 8s (nos pasó: "tu municipio tu municipio").
- **Cerrar con punto, no con `...`** antes del remate: `...municipio. ¡¿Qué esperás?!`
  (los `...` hacen que arrastre y repita).
- **Rellenar el sobrante:** `after speaking, stays quiet smiling until the end`.

### 1.5 Euforia — el gancho (contraste calma → euforia)
La fórmula del remate que funcionó: **voz y cara sincronizadas**.
- Exclamación en el diálogo: `¡[REMATE]!`
- `delivers the first part calmly and confidently, pauses for a beat, then exclaims
  "¡[REMATE]!" with euphoric, excited, high-energy delivery — voice rising while the
  face lights up in perfect sync`.
- La **pausa actuada** se marca con `...` en el diálogo + `pauses for a beat`.

### 1.6 B-roll (sin presentador)
- **Que NO hablen:** `No spoken dialogue, no talking; ambient sound only`. Si no,
  Veo mete diálogo en inglés y el lip-sync queda raro.
- **Toma única:** `One single continuous take, same background, no cut`. Veo a veces
  **cambia el fondo a la mitad** con dolly-outs largos; esto lo evita.
- **Pantalla de la app NO legible:** `screen not clearly legible` (Veo inventa UI
  falsa si se ve la pantalla).

---

## 2. Lo que el prompt NO controla (settings de Flow)

| Cosa | Cómo se controla | Nota |
|---|---|---|
| Formato 9:16 | **Selector de aspect ratio de Flow** | El texto "vertical 9:16" NO basta |
| Modelo | Selector | Usar **Veo 3** |
| Duración | Selector (4/8s) + recorte en edición | El texto "3-4 seconds" es solo guía de ritmo |
| Misma cara entre clips | Descripción física idéntica + misma sesión, o **referencia de imagen** (image-to-video) | Para clavarla 100%, subir un frame como personaje |
| Logo | Adjuntar la imagen como ingrediente + pedirlo en el prompt | `Use the attached logo as a small clean overlay in a top corner` |

**Settings base recomendados:** Veo 3 · 9:16 · 8s · "Texto a video" (o
"Imagen a video" si querés fijar persona/encuadre con una referencia).

---

## 3. Template GANADOR — presentador a cámara (validado 2026-06-13/14)

Talking head 9:16: una persona común mira a cámara, dice una frase de venta calma y
**remata con euforia** (voz + cara). Fue el take ganador (chica en la puerta del
municipio).

**Prompt patrón** (reemplazá los `[CORCHETES]`):
```
Professional cinematic vertical 9:16 video, clean and well-lit, smooth steady camera, high production quality, realistic, not over-rendered and not CGI-perfect. One single continuous take, same background the whole time, no cut. An ordinary real-looking [Argentine man/woman in their __s], natural and relatable, not a model, with [pelo/vestuario], [LOCACIÓN]. The camera performs a smooth dolly-out that starts at a medium shot from the waist up — not a close-up — and steadily pulls back to a wide full-body shot revealing [LO QUE SE REVELA]. He/She speaks in Argentine Rioplatense Spanish, only once and without repeating any words: "[FRASE CALMA]. ¡[REMATE]!" He/She delivers the first part calmly and confidently, pauses for a beat, then exclaims "¡[REMATE]!" with euphoric, excited, high-energy delivery — voice rising while the face lights up in perfect sync. After speaking, stays quiet smiling until the end. Natural lip-sync, no on-screen text. [Use the attached logo as a small clean overlay in a top corner / no logos].
```

**Ejemplo validado:**
- `[LOCACIÓN]` = `standing at the entrance of an Argentine town hall with columns and an Argentine flag`
- `[FRASE CALMA]` = `Munifái es la forma más inteligente de gestionar tu municipio`
- `[REMATE]` = `¿qué esperás?`

**Las 5 palancas de por qué funciona:** (1) dolly-out real con encuadre inicial ≠
final; (2) pausa actuada (`...` + `pauses for a beat`); (3) euforia = voz + cara
juntas; (4) marca fonética `Munifái`; (5) rioplatense con voseo.

---

## 4. Catálogo de prompts listos (copiar y pegar)

> Todos cierran con `Use the attached logo as a small clean overlay in a top corner;
> no other on-screen text.` — sacalo si no vas a adjuntar el logo.

### 4.1 Problemas / vía pública (el "dolor" — abre el reel)

**Bache en la calle**
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. An ordinary real-looking Argentine man, not a model, stands next to a large pothole on a residential neighborhood street, looking at it with mild frustration as a car carefully swerves around it, daytime natural light. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.
```

**Luz de alumbrado rota (noche)**
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. A broken street light flickering and going dark over a quiet Argentine neighborhood street at night, an ordinary real-looking resident looking up at it, moody darkness with faint ambient light. No spoken dialogue, ambient night sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.
```

**Basura acumulada**
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. An overflowing public trash container on an Argentine street corner with bags piled around it, an ordinary real-looking passerby walking by with a look of disgust, daytime natural light. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.
```

**Vereda rota / peligrosa**
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. A broken, uneven and cracked sidewalk on a neighborhood street, an ordinary real-looking elderly person walking carefully over it, soft natural daylight. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.
```

**Pérdida de agua / caño roto**
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. Water gushing from a broken pipe in the middle of an Argentine street forming a large puddle, a couple of ordinary real-looking neighbors looking at it with concern, daytime natural light. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.
```

**Semáforo que no funciona**
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. A dead, non-working traffic light at a busy Argentine street corner with slightly confused traffic, daytime natural light, ordinary cars and people. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.
```

**Plaza / espacio público descuidado**
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. A neglected neighborhood square with rusty broken playground equipment and overgrown grass, an ordinary real-looking mother with a small child looking disappointed, soft natural daylight. No spoken dialogue, ambient sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.
```

### 4.2 Burocracia / trámites (el "antes")

**Cola larga para trámites**
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. A long line of ordinary everyday Argentine people, not models, waiting bored in the hallway of a municipal office, fluorescent light, a slow tired atmosphere. No spoken dialogue, ambient indoor sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.
```

**Vecino agobiado por papeles**
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. An ordinary tired Argentine resident, not a model, at a municipal counter holding a thick stack of paper forms, looking overwhelmed by bureaucracy, indoor fluorescent light. No spoken dialogue, ambient indoor sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.
```

### 4.3 La solución / producto en el mundo real (el "después")

**Empleada con tablet en mostrador (digitalización)**
```
Professional cinematic vertical video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. An ordinary real-looking Argentine municipal employee, not a model, helping a neighbor at a service counter inside a public office, using a tablet (iPad) to assist him instead of paper forms — she shows the tablet screen and he taps and signs on it, fully digital, no paper anywhere, friendly and calm, natural indoor daylight, tablet screen content not clearly legible. Camera steady. No spoken dialogue, no talking, ambient office sound only. Vertical 9:16, 3-4 seconds. Use the attached logo image, shown as a small clean overlay in a top corner of the frame; no other on-screen text.
```

**Vecino saca foto del bache (usa la app)**
```
Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium over-the-shoulder shot at a steady medium distance. An ordinary real-looking Argentine resident photographs a pothole with their smartphone on a residential street, phone screen not clearly legible, daytime natural light. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.
```

**Cuadrilla resolviendo**
```
Municipal workers in orange high-visibility vests repairing a street and a streetlight in an Argentine neighborhood, mid-morning, a small utility truck nearby. Handheld documentary style, natural light, sense of action and progress. Photorealistic, vertical 9:16, no spoken dialogue, ambient street sound only, 3-4 seconds, no text.
```

**Oficina / gestión (intendente)**
```
Slow dolly through a modern municipal office: employees at desks working on computers showing dashboards and maps, warm ambient light, plants, clean architecture. Calm, professional, productive mood. Cinematic, shallow depth of field, vertical 9:16, photorealistic, no spoken dialogue, ambient office sound only, no text.
```

**Atención por WhatsApp (IA)**
```
Close-up of a smiling middle-aged Argentine man looking at his smartphone at a kitchen table with a mate gourd nearby, reading a message, soft morning light through a window. Warm, relatable, documentary realism. Vertical 9:16, photorealistic, no spoken dialogue, ambient home sound only, no text.
```

**Trámite online / identidad**
```
Close-up of hands using a smartphone to complete an online form, a generic national ID card (no readable text) resting on a wooden desk, clean modern setting, soft daylight. Crisp, trustworthy mood. Vertical 9:16, photorealistic, no spoken dialogue, ambient sound only, no text.
```

**Tesorería / orden**
```
Top-down shot of an organized desk: a laptop showing a clean financial dashboard (screen not clearly legible), a cup of coffee, neatly stacked folders, a calculator, soft natural light. Calm, orderly, professional, slow rotation. Vertical 9:16, photorealistic, no spoken dialogue, ambient sound only, no text.
```

### 4.4 Establecedores y cierre (abren / cierran el reel)

**Establecedor del pueblo (apertura)**
```
Aerial drone shot slowly descending over a small Argentine town at golden hour — low brick houses, a central plaza with palm trees, a church, quiet streets. Warm late-afternoon light, long shadows, smooth cinematic drone movement. Photorealistic, vertical 9:16, no spoken dialogue, ambient sound only, no text, no logos.
```

**Cierre esperanzador (CTA)**
```
Wide cinematic shot of an Argentine town at dusk, streetlights turning on, a calm plaza with a few people walking, warm blue-hour sky. Hopeful, "a city that works" mood, slow push-in. Vertical 9:16, photorealistic, no spoken dialogue, ambient sound only, no text, no logos.
```

---

## 5. Builder dinámico — armar un prompt nuevo campo a campo

Cuando ninguna plantilla pega, el generador de la app (`src/VideoPromptBuilder.tsx`)
arma el prompt con esta estructura. Replicala a mano si no estás en la app:

```
[LOOK: cine o UGC, §1.3].
[Si una sola toma:] One single continuous take — the background and location stay exactly the same the whole time, no scene change, no cut, no background switch.
[SUJETO: quién/qué] [ESCENA/ACCIÓN: qué hace y dónde].
The camera: [MOVIMIENTO, §1.2].
[EXTRAS opcionales].
Photorealistic, vertical 9:16, [DURACIÓN] seconds, no on-screen text, no captions, no logos.
```

**Presets de escena que ya trae el builder** (sujeto · escena · cámara · look):
- **Pueblo (establecedor):** — · pueblo argentino, plaza con palmeras, golden hour · drone · cine
- **Vecino filma el bache:** joven argentino · filma el bache con el celular y gira el teléfono hacia sí · handheld · ugc
- **Cuadrilla resolviendo:** trabajadores con chalecos naranjas · reparan un poste, mañana, camioneta cerca · gimbal · ugc
- **Oficina / gestión:** empleados municipales · trabajan en compus con dashboards y mapas · dolly · cine
- **WhatsApp / celular:** señor sonriendo · mira el celular en la cocina con un mate · tripod · ugc
- **Cierre al atardecer:** — · pueblo al anochecer, luces encendiéndose, blue hour · drone · cine

---

## 6. Narración (voz en off) — los 50 textos ya escritos

Si el reel lleva **voz en off** (en vez de presentador a cámara), los textos están
calibrados por duración en **`docs/VARIANTES_NARRACION_REELS.md`**: 5 reels × (5
variantes de ~5s + 5 de ~12s) = **50 textos**. Calibre: ~2.7 pal/seg → **5s ≈ 13-15
palabras**, **12s ≈ 32-36 palabras**.

- En **voz en off (TTS)**: sanitizar `Munify`→`Munifái`, `24/7`→`veinticuatro siete`,
  números clave deletreados.
- En **presentador a cámara (Veo)**: la línea va como **diálogo natural**, sin
  sanitizar para TTS (pero igual con la marca fonética `Munifái`).

---

## 7. Verificar el clip (sin abrir el video)

```bash
# Specs (formato/duración reales)
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of csv=p=0 video.mp4

# Tira de 5 frames equiespaciados: ¿la cámara se MUEVE (zoom/dolly)?
ffmpeg -i video.mp4 -vf "select='not(mod(n\,48))',scale=220:-1,tile=5x1" -frames:v 1 strip.jpg
```
Si el sujeto **cambia de tamaño** a lo largo de la tira, hay dolly-out; si queda
igual, la cámara no se movió (aunque el prompt lo pidiera). **Nunca** juzgues el
movimiento con 3 frames sueltos: engañan.

---

## 8. Checklist antes de generar

- [ ] Selector de Flow en **9:16** y modelo **Veo 3**.
- [ ] ¿Habla? → `Rioplatense` + voseo, marca `Munifái`, `only once / no repeat`,
      punto antes del remate, euforia voz+cara.
- [ ] ¿B-roll? → `No spoken dialogue, ambient only` + `single continuous take, no cut`
      + `screen not clearly legible` si se ve una pantalla.
- [ ] **Distancia media**, no close-up. `not over-rendered, not CGI-perfect`. `not a model`.
- [ ] ¿Logo? → adjuntar imagen + pedirlo como overlay en esquina.
- [ ] Generar → **verificar con la tira de frames** (§7) antes de dar por bueno.
- [ ] ¿No clava? → **reroll 2-4 intentos**, o image-to-video con referencia para
      fijar persona/encuadre.

---

## 9. Índice de fuentes (de dónde sale cada cosa)

| Tema | Fuente original |
|---|---|
| Técnica de prompting (principios, settings, verificación) | `docs/agents/VEO_FLOW_PROMPTING.md` |
| Generador en la app (templates + builder) | `src/VideoPromptBuilder.tsx` |
| 50 textos de narración | `docs/VARIANTES_NARRACION_REELS.md` |
| Template ganador + prompts b-roll Munify + pipeline de reels | `sugerenciasMun/docs/reels/CONTEXT.md` (§5, §5-bis) |
| Fórmula ganadora + gotchas (memoria) | memoria `reels-veo-prompts-flow` |

> **Mantener vivo:** cuando aparezca un prompt o un truco nuevo que funcione, se
> agrega acá Y, si toca, en la fuente original. Este doc es el atajo de consulta.
</content>
</invoke>
