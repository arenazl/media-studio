# Cómo se genera cada etapa del pipeline (radiografía para optimizar)

> Estado al 2026-10-07. Es la foto de lo que hay HOY, textual, para que el dueño devuelva una
> versión optimizada. Nada de acá es una propuesta: es lo que corre. Lo que ya se cambió en la
> sesión del 2026-10-07 está marcado con **[CURADO 07/10]**.

## Para el dueño

Cada pantalla del pipeline (Concepto, Guion, Cast, Storyboard, Pack Flow, Publicar) le pide un
texto a la IA con un "molde": un prompt armado en el backend con los datos del proyecto. La IA no
corre por API: el backend lanza el programa `claude` de tu máquina en modo headless, una vez por
pedido, y espera la respuesta entera. El tiempo de cada pantalla es, casi todo, el tiempo que el
modelo tarda en ESCRIBIR la respuesta: cuanto más largo el JSON que se le pide y más grande el
modelo, más tarda. Acá está, molde por molde: qué recibe, qué modelo usa, el prompt palabra por
palabra, y qué se le pide que devuelva. Al final, las palancas que yo veo, los bugs que encontré
leyendo, y **la funcionalidad nueva que quiero sumar (§6): la skill de reels animados renderizados
cuadro a cuadro, para TODO lo que sea animado (el SKILL.md está en `docs/14-skills/`).** Este doc se
lleva entero a otro agente.

---

## 1. La infraestructura: qué pasa cuando apretás "Generar"

```
Pantalla (PasoX.tsx)
  └─ runMolde(functionId, project, piece, options)        src/pasos/pasoKit.tsx
       └─ POST /api/run-function  { functionId, context:{project, piece}, options, model, provider? }
            └─ buildFunctionPrompt(body)                   server/functions.mjs  (arma el texto)
            └─ runAI({ prompt, model, functionId })        server/index.mjs      (elige proveedor)
                 └─ runClaude(prompt, { model, clean })    spawn de claude.exe headless
                      └─ stdout stream-json → evento "result" → texto
            └─ parseFunctionResult(functionId, texto, body)  (extrae el JSON y lo valida)
       └─ setComercial(...)  (el resultado se guarda en el proyecto, SQLite vía /api/projects)
```

### 1.1 El lanzamiento de Claude (headless)

Archivo: `server/index.mjs`, función `runClaude`.

| Qué | Valor |
|---|---|
| Binario | `C:\Users\look\.local\bin\claude.exe` (resuelto al arrancar; evita el shim roto de Volta) |
| Modo | `-p` (print, una sola vuelta) con `--output-format stream-json --verbose` |
| Prompt | entra por **stdin** entero |
| Modelo | `--model <opus|sonnet|haiku>` sólo si viene en la whitelist; si no, el default del CLI |
| Timeout | 900 s (15 minutos) y después mata el proceso |
| Cwd | la raíz del repo `media-studio` |
| Resultado | se toma el campo `result` del evento `type:"result"`; se anota `total_cost_usd` |
| Sin `result` | error "respuesta vacía" |

**[CURADO 07/10] Modo `clean` para los moldes de texto.** Antes, cada llamada arrancaba con el
system prompt completo de Claude Code: tu `CLAUDE.md` global, la memoria del proyecto, el listado
de 40 agentes, las skills y las definiciones de herramientas. Medido con un prompt trivial:

| Variante | Tokens de contexto antes de leer el prompt | Costo de ese contexto |
|---|---|---|
| Como estaba (`--allowedTools Read --permission-mode bypassPermissions`) | 49.271 | USD 0,49 por llamada |
| `--setting-sources ""` | 41.176 | USD 0,25 |
| `--setting-sources "" --system-prompt <propio>` | 32.380 | USD 0,20 |
| **`--setting-sources "" --tools "" --system-prompt <propio>` (lo que corre ahora)** | **211** | **USD 0,001** |

Ese contexto no era sólo plata: le decía al redactor cómo hablarte a vos, cuándo preguntar antes
de actuar y qué formato usar. Ahora los moldes de texto corren con este system prompt y nada más:

```
Sos un redactor creativo que trabaja para un estudio de video de marketing. Hacés exactamente lo
que te pide el pedido, en el formato que te pide, sin comentarios, sin preguntas y sin markdown.
No inventás datos que no estén en el pedido.
```

Las llamadas con imagen (clasificar un video) siguen por el camino viejo porque necesitan la tool
`Read`.

### 1.2 Cómo se elige el modelo (tres capas, gana la de arriba)

1. **El engranaje de la app** (`ms.settings.aiModel` en localStorage): `auto` | `opus` | `sonnet` |
   `haiku`. Si está forzado, TODOS los moldes usan ese. Hoy está en `auto`.
2. **El catálogo del front** (`src/lib/functionCatalog.ts`, campo `model` de cada molde). Con el
   engranaje en `auto`, manda esto. Es lo que viaja en `body.model`.
3. **El enrutador del back** (`runAI`): sólo decide si el front NO mandó modelo. Dice "creativa
   (concept/strategy) → sonnet, el resto → opus". En la práctica nunca decide, porque el front
   siempre manda.

Proveedor: `claude` en local, `gemini` en prod (`LLM_PROVIDER` o botón "Re-Plan Gemini"). Gemini
usa `gemini-1.5-pro` para la fase creativa y `gemini-2.0-flash` para el resto, por REST, sin el
CLI. Este doc cubre el camino Claude, que es el que usás.

### 1.3 Tabla: molde, modelo, quién lo dispara y con qué insumo

| Molde | Modelo (catálogo) | Pantalla | ¿Se dispara solo al entrar? | Condición del auto-disparo | Devuelve |
|---|---|---|---|---|---|
| `strategy` | opus | Wizard de proyecto / Campaña | no (botón) | - | positioning + audiences + 3 a 7 piezas |
| `concept` | **sonnet [CURADO 07/10]** (era opus) | Concepto | **sí** | paso habilitado + hay brief o ángulo o creativeBrief, y no hay opciones | 3 conceptos |
| `script` | opus | Guion | **sí** | paso habilitado + hay concepto elegido, y no hay guion | 4 bloques + music |
| `cast` | opus | Cast | **sí** | paso habilitado + guion con bloques, y no hay cast | 1-2 personajes + lugar |
| `storyboard` | opus | Storyboard | **sí** | paso habilitado + guion con bloques, y no hay storyboard | N escenas |
| `flowpack` | opus | Pack Flow | **sí** | paso habilitado + storyboard, y no hay pack | estilo + personajes + N prompts |
| `publish` | haiku | Publicar | no (botón) | - | caption, hashtags, hookOnScreen, cta |
| `qa` | sonnet | Publicar / QA | no (botón) | - | score /50 + issues |
| `videoprompt` | sonnet | Videos (prompt suelto) | no | - | texto plano |
| `briefToKb` | sonnet | KB desde texto | no | - | KB 1.2 |

Cada paso tiene un `hasAutoFired` que evita el doble disparo dentro de la misma visita a la
pantalla. **No evita** que al navegar Concepto → Guion → Cast se disparen tres moldes seguidos
(cada entrada a una pantalla con insumo y sin resultado llama a la IA).

### 1.4 Qué es el `context` que recibe cada molde

Lo arma `runMolde` en `src/pasos/pasoKit.tsx`:

```
context.project = { name, phonetic, brief, screens[], brand (brandKit), formato? }
context.piece   = { ...lo que cada pantalla decida, formato? }
options         = las opciones del catálogo (perfil, tono, duracion, red, foco...)
regenerate      = { index, blocks } | { escenaN } | true   (sólo al regenerar)
```

Y el helper `ctx()` del back lo aplana a campos comunes. **Ojo con dos cosas:**

- **`brief` se corta a 2.500 caracteres** (`(project.brief || '').slice(0, 2500)`), en `ctx()` y en
  `concept`. El brief de Munify tiene 8.068. Todos los moldes ven menos de un tercio del brief.
- **`ctx().guion` sólo entiende el guion viejo** (un array de strings). El guion actual es
  `{ blocks: [...] }`, así que `x.guion` queda vacío. Los moldes que usan `x.guion || x.brief`
  (`publish`, y `qa` cuando no es holístico) **reciben el brief en lugar del guion** sin avisar.
  Los moldes del rework usan `pieceGuionText()`, que sí entiende los dos formatos.

### 1.5 Qué se le mete al prompt desde el Media Kit (`mediaKitText`)

Si la pieza trae `mediaKit` (pantallas, momentos, cta del kit v1.2), se agrega este bloque a
`concept`, `script` y `storyboard`:

```
CAPTURAS REALES DE LA APP (es lo que se VE en el video — no hay que imaginarlas). Para referirte a una pantalla usá su NOMBRE EXACTO de esta lista:
- <nombre>: <queDemuestra> — micro-animación: <microAnimacion>
MOMENTOS (mini-flujos que YA cuentan una historia con principio y fin — la unidad narrativa del video):
- <nombre>: <historia> — remate: <remate> [<pantalla> → <pantalla>]
CTA VERIFICADO POR LA APP (usalo tal cual en el cierre): <principal> · <url>
```

Sin kit, el bloque es vacío y el prompt queda igual que antes del kit.

### 1.6 El parseo de la respuesta

`extractJson(texto)`: busca el primer `{`, prueba parsear hasta el último `}`, y si falla recorre
contando llaves para quedarse con el primer objeto balanceado. Después cada molde valida lo mínimo
(que haya `conceptos`, `blocks`, `escenas`...). Si la IA manda texto antes o después del JSON, se
tolera. Si manda markdown adentro de los strings, pasa tal cual a la UI.

---

## 2. Los moldes, uno por uno (prompt textual)

Convención: `${...}` es lo que se interpola. Los bloques condicionales se marcan con
`[si X]`. Todo lo demás va literal.

### 2.1 `strategy` (opus) — del brief a las piezas de la campaña

**Recibe:** `x.name`, `x.brief` (2.500 chars), `options.perfil`
(`campaña|awareness|demo|conversion|solo-mockups`), formato del proyecto si hay.

**Bloque por perfil** (`perfilInstruccion`), por ejemplo para `campaña`:

```
CAMPAÑA COMPLETA: Generá exactamente entre 6 y 7 piezas (reels) cubriendo el embudo de marketing completo:
1. Reel 1 (Awareness / Gancho): El dolor principal y la solución con alto gancho inicial.
2. Reel 2 (Demo de Producto): Recorrido dinámico por la app y sus funciones clave.
3. Reel 3 (Beneficios & Valor): El impacto real y los beneficios cotidianos para el usuario.
4. Reel 4 (Prueba Social / Confianza): Reseñas, verificación, garantía y tranquilidad.
5. Reel 5 (Conversión Directa): Llamado a la acción directo con oferta/beneficio concreto.
6. Reel 6 (Solo Mockups Animados): Showcase visual de pantallas UI en movimiento.
7. Reel 7 (Cierre / Retargeting): Explicación directa superando la objeción principal.
```

Los otros perfiles son una línea cada uno ("AWARENESS: Generá 3 piezas enfocadas en llamar la
atención, empatizar con el dolor del cliente y generar curiosidad inicial.", etc.).

**Prompt:**

```
Actuás como social-marketing-strategist. Del BRIEF, armá la estrategia de campaña de video para redes (Instagram/Facebook).

${perfilInstruccion}

ENFOQUE GLOBAL: Cada pieza cuenta TODA la propuesta de valor del negocio en UN solo video con un ÁNGULO/approach DISTINTO.
Generá ${cuantas} piezas, todas GLOBALES, con sus respectivos ángulos.

Devolvé SOLO JSON (sin texto ni markdown alrededor):
{
  "positioning": "1-2 frases: qué es, para quién y por qué es distinto",
  "audiences": [{ "label": "segmento", "pain": "su dolor concreto", "language": "palabras que usa ese segmento" }],
  "pieces": [{ "id": "v1", "objective": "awareness|consideracion|conversion", "angle": "el approach de ESTA versión (MÁXIMO 3-4 PALABRAS, ej: 'Problema-Solución' o 'Demo en vivo')", "format": "${fmtEjemplo}", "durationSec": ${durEjemplo}, "creativeBrief": "qué cuenta (TODA la propuesta, global) y con qué tono/approach, detallado en 2-3 frases" }]
}
Reglas: español rioplatense, sin emojis, NO inventes datos/precios/cifras como reales. IMPORTANTE: El campo 'angle' debe ser un título muy corto (máximo 3-4 palabras).
NEGOCIO: ${x.name}
BRIEF (los hechos): ${x.brief}
```

**Parse:** exige `pieces[]` no vacío.

### 2.2 `concept` (sonnet) — tres ideas para elegir **[CURADO 07/10]**

**Recibe:** `project.name`, `project.brief` (2.500 chars), `piece.angulo`, `piece.creativeBrief`,
`piece.tipo` (`filmado|animado`), `piece.mediaKit`, `options.perfil`.

**Bloque técnica** (sólo si `tipo === 'animado'`):

```
TÉCNICA — VIDEO ANIMADO (regla DURA, no la rompas): la pieza se produce como motion graphics sobre las PANTALLAS/UI REALES del producto. NO hay actores, ni personas a cámara, ni locaciones, ni nada filmado: JAMÁS propongas una escena grabada con gente (nada de "una mujer en su cocina"). Cada IDEA tiene que funcionar mostrando la interfaz EN MOVIMIENTO (recorrido entre pantallas, elementos que entran, datos que se completan, zoom/paneo sobre la UI, texto en pantalla, voz en off). La ESTÉTICA describe la DIRECCIÓN DE MOTION/UI (ritmo, tipo de transiciones, tipografía, paleta, cómo se encuadran las pantallas), NO fotografía, luz de set ni casting. La REFERENCIA es a un video de producto/app animado, no a un comercial filmado.
PANTALLAS DEL PRODUCTO: ${screensText(project) || '(sin pantallas en el KB: proponé pantallas recreadas y marcalas [demo])'}
```

**Prompt (el nuevo, el que corre ahora):**

```
QUÉ ES ESTO
Sos director creativo de reels verticales de 20 a 30 segundos. Tenés que proponer TRES CONCEPTOS de comercial para que el dueño del negocio elija uno. Un concepto es UNA idea contada en pocas líneas, no un guion: las escenas, los planos y los tiempos se escriben en otro paso, después. Si escribís un guion acá, el trabajo no sirve.

FICHA DEL NEGOCIO (lo único que es verdad; no está acá = no existe)
NEGOCIO: ${name}
OBJETIVO DEL VIDEO (perfil "${perfil}"): ${perfilTxt}
BRIEF:
${brief || '(sin brief: proponé sobre el nombre y marcá cada supuesto con [supuesto])'}
[si hay ángulo] ÁNGULO DE ESTA PIEZA (la estrategia ya lo decidió, respetalo): ${angulo}
[si hay creativeBrief] DIRECCIÓN CREATIVA DE ESTA PIEZA: ${creativeBrief}
${bloqueTecnica}${bloqueKit}
NO ASUMIR
- Funciones, cifras, clientes, premios o resultados que no estén en el brief.
- Que el negocio ya es conocido: el espectador lo ve por primera vez.
- Que el problema es dramático: el brief dice cuánto duele, no vos.

QUÉ TIENE QUE TENER CADA CONCEPTO
- UNA sola idea, vista desde una situación concreta de la persona que sufre el problema o usa el producto.
- El negocio entero adentro: al terminar queda claro qué resuelve ${name} de punta a punta, no un solo módulo.
- Un remate antes del llamado a la acción: humor, ironía o un contraste fuerte entre el antes y el después.
- Los tres conceptos tienen que ser DISTINTOS en tipo de gancho; tres variantes de la misma idea no sirven.

LO QUE NO VA
- Presentador sonriendo a cámara, locución institucional, "somos líderes", "la solución integral", "transformá tu negocio".
- Escenas con segundos, planos o montajes: eso es del storyboard.
- Chistes que humillan al cliente o a su gente: la gracia está en el problema, no en la persona.

LARGOS (se cumplen en palabras, contá)
- topico: 2 a 4 palabras. Título pegadizo que resume la idea.
- tipoGancho: 2 a 4 palabras en mayúsculas. Ejemplos de tipos: HUMOR, POV, ANTES Y DESPUÉS, PARODIA, PROBLEMA EXTREMO, CÁMARA OCULTA.
- idea: 40 a 60 palabras. Tres partes seguidas: qué se ve en los primeros 2 segundos, el giro, el remate. Sin tiempos ni planos.
- tono: hasta 12 palabras. Cómo actúan y cómo hablan.
- estetica: hasta 25 palabras. [filmado: Encuadre, luz, paleta y ritmo.] [animado: Ritmo, transiciones, tipografía, paleta y cómo se encuadran las pantallas.]
- referencia: hasta 12 palabras. Un FORMATO conocido al que se parece (tipo de sketch, formato viral de redes). Nada de premios ni comerciales que no sepas con certeza que existen.
- porQueFunciona: una oración, hasta 20 palabras: por qué esta idea hace que el espectador quiera probarlo.

Español rioplatense natural, sin clichés publicitarios.
Devolvé SOLO este JSON, sin texto antes ni después, sin markdown:
{
  "conceptos": [
    { "id": "c1", "topico": "", "tipoGancho": "", "idea": "", "tono": "", "estetica": "", "referencia": "", "porQueFunciona": "" },
    { "id": "c2", ... }, { "id": "c3", ... }
  ]
}
```

`perfilTxt` por perfil: campaña = "contar TODA la propuesta del negocio en un video: qué resuelve,
cómo y por qué conviene"; awareness = "que el que nunca oyó hablar del negocio entienda en 20
segundos qué problema resuelve"; demo = "mostrar el producto funcionando: el espectador tiene que
VER cómo se usa"; conversion = "empujar a una acción concreta (probar, pedir una demo, entrar al
sitio) con una razón clara".

**Parse:** exige `conceptos[]` no vacío.

**Resultado con Munify (ángulo "Gancho & Problema", filmado, Sonnet):** tres conceptos de 57 a
60 palabras de idea, tres ganchos distintos (POV, ANTES Y DESPUÉS, PARODIA), referencias como
"sketch de trámite eterno tipo oficina". Tiempo: 22 s.

### 2.3 `script` (opus) — el guion por bloques

**Recibe:** `x.name`, `x.brief` (2.500), `x.angulo`, `piece.concepto` (el elegido, como JSON
entero), `piece.tipo`, `piece.mediaKit`, `piece.formato`, `options.tono` (default "cercano"),
`options.duracion` (default `x.durationSec`, que sale del formato o 18).

**Bloque técnica** (sólo animado):

```
TÉCNICA — VIDEO ANIMADO (regla DURA): no hay actores, ni personas a cámara, ni locaciones. Lo que se VE son las PANTALLAS/UI REALES del producto EN MOVIMIENTO (recorrido entre pantallas, elementos que entran, datos que se completan, zoom/paneo sobre la interfaz, texto en pantalla) y la narración va en OFF. El campo "visual" de cada bloque describe la PANTALLA y su movimiento — JAMÁS una persona, un plano de cámara ni una locación.
```

**Prompt (guion entero, `mode: 'set'`):**

```
Actuás como promo-director. Escribí el guion de un comercial de ${dur}s para ${piezaDesc}, tono ${tono}[si hay ángulo: (ángulo: "${x.angulo}")].
[si regenerate] IMPORTANTE: Generá una propuesta NARRATIVA completamente NUEVA y variante distinta a la anterior.
[si hay concepto] CONCEPTO ELEGIDO (respetalo, es la dirección creativa del comercial): ${JSON del concepto}
${bloqueTecnica}${bloqueKit}ENFOQUE GLOBAL (clave): contá TODA la propuesta del negocio en ESTE video — no un solo módulo/producto. Enganchá explicando el funcionamiento, CONECTÁ los puntos fuertes en un hilo, reforzá con la prueba y cerrá con el CTA.
Estructura NARRATIVA por bloques con estos roles EXACTOS: hook (primeros 2s, roba la atención, sin logo ni "somos X") -> desarrollo (cómo funciona / la propuesta en vivo) -> gag (el REMATE: el momento más fuerte — humor si el concepto es humorístico, si no la prueba/beneficio contundente) -> cta (llamado a la acción claro). El gag va SIEMPRE ANTES del cta.
Narración calibrada para TTS a ~2.7 palabras/seg (que entre en ${dur}s); estimá el durSec de cada bloque.
IMPORTANTE: SÉ MUY CONCISO. Los bloques de narración deben ser cortos y al pie (máximo 1-2 oraciones por bloque).
Devolvé SOLO JSON: { "blocks": [{ "role": "hook|desarrollo|gag|cta", "narration": "lo que se DICE (voz - súper breve)", "visual": "lo que se VE en pantalla (1 frase)", "durSec": <segundos> }], "music": { "mood": "el mood de la música en 2-3 palabras" } }
NEGOCIO: ${x.name}
BRIEF: ${x.brief}
No inventes precios/cifras/integraciones como reales. Es GLOBAL: cuenta TODO el negocio.
```

`piezaDesc` = "una pieza 9:16 para Instagram / TikTok" si hay formato, si no "un reel 9:16".

**Prompt (un solo bloque, `mode: 'item'`, al regenerar un bloque):**

```
Actuás como promo-director. Rehacé SOLO ESTE bloque del guion (tono ${tono}), con una propuesta DISTINTA y mejor. Mantené su rol.
Devolvé SOLO el JSON del bloque: { "role": "${rol actual}", "narration": "lo que se DICE (voz - SÚPER CORTO, máximo 1-2 oraciones)", "visual": "lo que se VE (breve, 1 línea)", "durSec": <segundos estimados a ~2.7 palabras/seg> }
NEGOCIO: ${x.name} · BLOQUE ACTUAL (hacelo distinto): ${JSON del bloque}
Rioplatense, sin emojis, no inventes datos. Sé estricto con la brevedad.
```

**Parse:** `blocks[]` no vacío (o `{item}` si es un bloque suelto).

### 2.4 `cast` (opus) — personajes y locación

**Recibe:** `name`, `piece.concepto` (JSON), `piece.guion` (aplanado por rol), `piece.formato`,
`x.industry` (no existe en `ctx()`: siempre cae a `x.brief`, 2.500 chars) para `rubroNegocio`.

**Prompt:**

```
Sos casting director + location scout de un comercial ${asp}. Del CONCEPTO, el GUION y el NEGOCIO, definí los PERSONAJES (1-2) y la LOCACIÓN ideal para el comercial.
[si regenerate] IMPORTANTE: Proponé una alternativa TOTALMENTE DISTINTA de personaje/género/locación a las anteriores.
REGLA DE LOCACIÓN AGERA E HIPER-RELEVANTE (DURA): La locación DEBE ser el entorno físico real donde transcurre la propuesta del negocio (${rubroNegocio}). Extraé la locación natural del rubro (ej. si es eventos/fiestas -> salón, quinta, barra o pista iluminada; si es GovTech -> oficina municipal o calle; si es salud -> centro médico; si es fintech -> oficina/comercio real). Queda PROHIBIDO usar livings residenciales genéricos salvo que el negocio sea de productos para el hogar.

Por personaje:
- "fisicoEn" = descripción física EXACTA en INGLÉS para prompts de video (edad, pelo, tono de piel, vestuario propio y natural del rubro del negocio, estilo auténtico y carismático). Sé ESPECÍFICO y fotorrealista.
- "fisicoEs" = resumen MUY BREVE en español para la UI (1 línea). Sumá "nombre", "rol" (su papel en el comercial), "vestuario" (corto), "personalidad" (1-2 palabras).
La LOCACIÓN: "descripcionEn" en inglés (entorno real del rubro, mobiliario del negocio, iluminación contextual y profesional), más "nombre" y "luz" (corto).
Devolvé SOLO JSON: { "personajes": [{ "id": "p1", "nombre": "...", "rol": "...", "fisicoEn": "...", "fisicoEs": "...", "vestuario": "...", "personalidad": "..." }], "lugar": { "nombre": "...", "descripcionEn": "...", "luz": "..." } }
Reglas: sin emojis, no inventes datos. El diálogo es rioplatense, pero fisicoEn/descripcionEn van en INGLÉS.
NEGOCIO: ${name}
CONCEPTO: ${concepto JSON | '(sin concepto elegido: inferilo del guion)'}
GUION: ${guion | '(usá el brief del negocio)'}
```

Nota: `rubroNegocio` mete el BRIEF ENTERO (2.500 chars) adentro de un paréntesis en la primera
regla. Es el pedazo más pesado del prompt y va en el lugar menos legible.

**Parse:** exige `personajes[0].fisicoEn` y `lugar.descripcionEn`.

### 2.5 `storyboard` (opus) — escenas numeradas; dos prompts según técnica

**Recibe:** `name`, `phonetic`, `piece.tipo`, `piece.durationSec` (default 20), `piece.guion`,
`piece.cast` (JSON), `piece.formato`, `piece.mediaKit`, `project.screens`.

**Prompt FILMADO:**

```
Sos director de un comercial FILMADO ${asp}. Convertí el guion en un STORYBOARD de escenas numeradas.
${bloqueKit}Por escena: n, rol (hook|desarrollo|gag|cta), durSec (talking head = 8 MÍNIMO, jamás menos; b-roll 4-8), plano (medium shot waist-up para talking heads — NUNCA wide lejano), angulo (eye-level, etc.), personajes (ids del CAST — USÁ SIEMPRE los mismos), accion (descripción CORTA, máximo 1 oración), dialogo (rioplatense, frase de ~24-30 palabras si es talking head; marca fonética: ${phonetic}), continuidad (qué debe matchear con la escena anterior, MUY corto, ej: "misma ropa, misma luz").
La suma de durSec ≈ ${durationSec}s (puede pasarse antes que recortar un talking head). El gag/remate va ANTES del CTA. Sé conciso.
Devolvé SOLO JSON: { "escenas": [{ "n": 1, "rol": "hook", "durSec": 8, "plano": "medium shot waist-up", "angulo": "eye-level", "personajes": ["p1"], "accion": "...", "dialogo": "...", "continuidad": "..." }] }
Reglas: sin emojis, no inventes datos/precios como reales.
NEGOCIO: ${name}
CAST: ${cast JSON | '(sin cast todavía: usá ids p1/p2 y descripciones genéricas)'}
GUION: ${guion | '(usá el brief del negocio)'}
```

**Prompt ANIMADO:**

```
Sos director de un reel ANIMADO ${asp} (se recrean las PANTALLAS del producto, sin personas). Convertí el guion en un STORYBOARD de escenas numeradas, una por PANTALLA.
${bloqueKit}Por escena: n (número), rol (hook|desarrollo|gag|cta), durSec (3-5s), screen (label de la pantalla del KB), accion (un título corto de <=8 palabras que vende ese momento), dialogo "" (vacío), continuidad (la palabra a RESALTAR del título). Dejá plano/angulo vacíos y personajes [].
La suma de durSec ≈ ${durationSec}s.
Devolvé SOLO JSON: { "escenas": [{ "n": 1, "rol": "hook", "durSec": 4, "screen": "...", "plano": "", "angulo": "", "personajes": [], "accion": "título corto", "dialogo": "", "continuidad": "palabra a resaltar" }] }
Reglas: español rioplatense, sin emojis, no inventes datos. Marca fonética (nunca el nombre escrito): ${phonetic}.
NEGOCIO: ${name}
PANTALLAS DEL KB: ${screensText(project) | '(sin pantallas: proponé pantallas recreadas y marcalas [demo])'}
GUION: ${guion | '(usá el brief del negocio)'}
```

**Parse (hace trabajo de verdad):** valida roles; si una escena tiene diálogo y dura menos de 8 s
la sube a 8; **propaga la narración del guion a las escenas mudas** del mismo rol
(determinístico, sin IA); y le asigna a cada escena la **captura real** del kit matcheando el
`screen` con el nombre de la pantalla.

### 2.6 `flowpack` (opus) — los prompts para Google Flow

**Recibe:** `name`, `phonetic`, `project.brand` (JSON entero del brandKit), `piece.storyboard`
(JSON entero), `piece.cast` (JSON entero), `piece.formato`. Es el prompt más largo del sistema:
incluye `VEO_RULES` (abajo) más el storyboard y el cast completos.

**Prompt (pack entero):**

```
Sos el prompt-writer de Google Flow (Veo 3.1) en su FLUJO NUEVO: los personajes se crean como ENTIDAD con una IMAGEN de referencia (Nano Banana / Gemini Image) y las escenas se animan llamando al personaje por su NOMBRE. La consistencia la fija la IMAGEN — NO se repite la descripción física en cada prompt (mezclar personaje+estilo+acción en un solo prompt hace que Flow devuelva una imagen estática).
Armá el PACK de un comercial ${asp} desde el STORYBOARD y el CAST, en TRES piezas separadas:

(1) "estilo": UN bloque MUY corto en INGLÉS con el estilo global (máximo 1-2 oraciones) — "photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic, not over-rendered and not CGI-perfect". SOLO estética/formato: SIN personajes y SIN acción.

(2) "personajes": por CADA personaje del CAST, un objeto { id, nombre, promptImagen }. Copiá el "id" y el "nombre" del cast. El "promptImagen" es el prompt para GENERAR LA IMAGEN de referencia en la sección Personaje de Flow: un RETRATO de CUERPO ENTERO (full-body portrait) 9:16, fotorrealista, de UNA persona argentina, construido del "fisicoEn" + "vestuario" del cast, con fondo neutro o contextual del rubro. Es una FOTO fija del personaje mirando a cámara — NO una escena, SIN diálogo, SIN acción. Empezá SIEMPRE con "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine ...".

(3) "escenas": por CADA escena del STORYBOARD, un objeto { escenaN, prompt }. El "prompt" es lo que se ANIMA en Flow. TODO el prompt va en INGLÉS salvo el diálogo. Estructura EXACTA (mapeá los datos de la escena):
   [estilo/formato] + [locación de la escena, del "descripcionEn" RESUMIDO] + [el personaje CORTO por su NOMBRE + nacionalidad "Argentine" — ej. "Ana, a relatable young Argentine woman in her late 20s with long loose hair and casual clothes" — SIN el fisicoEn largo, la imagen ya fija la cara] + [cámara/plano de la escena] + She/He speaks clearly: '<el diálogo de la escena en español rioplatense, con la marca fonética ${phonetic}>' + [dirección de ENTREGA vocal en inglés según el rol: hook = enérgico que engancha, cta = eufórico de cierre, resto = cálido y seguro] + [cierre].
   Referí a los personajes por su NOMBRE (NUNCA pegues el fisicoEn: es lo que rompía Flow). Nombrar "Argentine" en la descripción corta es OBLIGATORIO — sin eso la voz sale en inglés.
   Escenas SIN personajes (b-roll/pantalla): el prompt lleva la locación, "No spoken dialogue, ambient sound only", "one single continuous take, same background, no cut"; si se ve una pantalla de app: "screen not clearly legible". Sin diálogo. Sin texto en pantalla (el overlay va en edición).

${VEO_RULES}

Devolvé SOLO JSON: { "estilo": "...", "personajes": [{ "id": "p1", "nombre": "...", "promptImagen": "..." }], "escenas": [{ "escenaN": 1, "prompt": "..." }] }
STORYBOARD: ${JSON del storyboard}
CAST: ${JSON del cast | '(sin cast: b-roll/pantallas — usá la locación)'}
NEGOCIO: ${name}[ · MARCA: ${JSON del brandKit}]
```

**Prompt (una escena, al regenerar):**

```
Sos el prompt-writer de Google Flow (Veo 3.1, flujo nuevo con Personajes por imagen). Rehacé SOLO el prompt de la ESCENA ${n} de un comercial ${asp}, con OTRA idea visual/encuadre.
En el flujo nuevo los personajes YA tienen su IMAGEN de referencia: referílos por su NOMBRE del cast + nacionalidad "Argentine" (ej. "Ana, an Argentine woman in her late 20s") — CORTO, NUNCA pegues el fisicoEn largo. El diálogo va LITERAL en español rioplatense entre comillas; el resto del prompt en INGLÉS.
${VEO_RULES}
CAST (para tomar nombres de personajes y la locación — NO copies el fisicoEn en el prompt): ${JSON del cast}
ESCENA A REHACER: ${JSON de la escena}
MARCA FONÉTICA: ${phonetic}
Devolvé SOLO JSON: { "escena": { "escenaN": ${n}, "prompt": "el prompt en inglés, con el diálogo en español rioplatense entre comillas y la marca fonética" } }
```

**`VEO_RULES` (va literal en flowpack y videoprompt):**

```
REGLAS DE CADA prompt (battle-tested; van en INGLES salvo el dialogo, que va en español rioplatense):
- Realismo que NO cante a IA: "photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive face, not over-rendered and not CGI-perfect".
- POSICIONAMIENTO DE LOGO Y MARCA:
  * En la escena de CIERRE/CTA: "The uploaded brand logo 'logo.png' from assets is displayed clearly and prominently centered in the upper third of the 9:16 vertical frame".
  * En talking heads y b-rolls: "Keep the top center area of the frame uncluttered for top-centered brand logo overlay".
- Persona ATRACTIVA, de belleza convencional/hegemonica pero creible (no cara de IA): "a striking, conventionally beautiful and charismatic [Argentine ...] in her late 20s to early 30s, polished and camera-ready, with long sleek hair, defined attractive features and a confident, magnetic presence". Vestida y ambientada SEGUN el rubro del negocio (ej. blazer en una oficina), nunca fuera de contexto.
- TALKING HEAD (hook y cierre = los "videos iniciales") — reglas DURAS:
  * Plano MEDIO, de la cintura para arriba, camara a distancia conversacional (~2m): "medium shot, waist-up framing, she fills a good portion of the frame with strong, dominant presence". NUNCA wide full-body desde lejos, NUNCA la persona chica en el cuadro.
  * Entorno real del negocio en soft-focus de fondo (ej. oficina moderna y luminosa con escritorios y colegas), adaptado al rubro.
  * Camara QUIETA o con un push-IN MUY sutil: "the camera holds steady or does a very subtle slow push-in as she speaks". PROHIBIDO alejar: nada de "zoom out / pull back / dolly back" (achica al sujeto y mata la presencia).
  * EXPRESIVIDAD de venta: "warm, confident and charming tone, realistic expressive face".
  * Dialogo LARGO que COMENTA el producto y LLENA el clip (NO un gancho suelto): el talking head dura 8s (MINIMO 8s, el maximo de Flow), asi que decí una frase ENTERA de ~24-30 palabras que engancha Y explica el beneficio concreto del producto, fluida: "speaks directly to camera in Argentine Rioplatense Spanish (voseo), fluently and naturally, only once and without repeating any words: '<frase larga que engancha y comenta el producto, con una pausa actuada en el ...>'". Marca fonetica SIEMPRE la fonetica que te paso (nunca el nombre escrito).
  * SIN silencio de relleno: la persona habla durante TODO el clip. PROHIBIDO "stays quiet until the end".
  * La MISMA persona en hook y cierre: misma descripcion fisica EXACTA (edad, pelo, ropa, color).
- B-roll: "No spoken dialogue, ambient sound only" y "one single continuous take, same background, no cut". Si se ve una pantalla de app: "screen not clearly legible".
- Sin texto en pantalla dentro del prompt (el overlay se agrega en edicion).
```

Nota: `VEO_RULES` dice "la MISMA persona en hook y cierre: misma descripción física EXACTA" y el
prompt de flowpack dice "NUNCA pegues el fisicoEn". Son dos instrucciones del playbook viejo y del
flujo nuevo conviviendo en el mismo pedido.

**Parse:** exige `estilo`, `personajes[]`, `escenas[]`; el `rol` de cada escena lo toma del
storyboard (no de la IA) y arranca en estado `pendiente`.

### 2.7 `publish` (haiku) — el copy del posteo

**Recibe:** `x.name`, `x.guion` (ver bug: hoy llega vacío y cae al brief), `options.red`.

```
Actuás como social-platform-specialist. Dame el paquete de PUBLICACIÓN para ${red}. ${specs por red}
Devolvé SOLO JSON: { "hookOnScreen": "texto en pantalla los primeros 2s, <=6 palabras", "caption": "el copy del posteo, 2-4 líneas", "hashtags": ["#sin-espacios", "..."], "cta": "el llamado a la acción" }
Sin emojis, rioplatense, sin jerga de marketing vacía (revolucionario, increíble). No inventes datos.
NEGOCIO: ${x.name}
GUION: ${x.guion || x.brief}
```

`specs` por red, por ejemplo Instagram: "Instagram Reels: caption con gancho en la 1ª línea, 3-6
hashtags relevantes."; YouTube: "YouTube Shorts: título corto y buscable al principio, descripción
de 1-2 líneas con la idea principal, 3-5 hashtags."; TV: "Spot de TV: sin hashtags — un copy corto
de acompañamiento para el posteo de la marca."

### 2.8 `qa` (sonnet) — la nota del comercial

**Recibe:** todo el comercial si lo hay (`piece.concepto`, `guion`, `cast`, `storyboard`,
`packFlow`), si no `x.guion || x.brief`; `options.foco` (`todo|hook|claridad|cta`).

```
Actuás como promo-critic. Evaluá ${'el COMERCIAL entero' | 'la pieza'} con tu rúbrica de 10 ejes (gancho, claridad, una idea, CTA, formato, marca, duración, ritmo, prueba, originalidad), 0-5 cada uno = total /50. NO lo juzgues por un solo aspecto: puntuá los 10 y sumá.[si holístico: Para el comercial entero, pesá MUY fuerte estos criterios profesionales DENTRO de los ejes: CONTINUIDAD (flujo nuevo de Flow: la consistencia del actor la fija la IMAGEN de referencia del personaje; los prompts de escena lo llaman por NOMBRE + "Argentine", NO repiten el fisicoEn; entre escenas cierra ropa/luz/lugar), ARCO (hook ≤2s de gancho, gag/remate ANTES del CTA, cuenta TODA la propuesta — regla GLOBAL, jamás un solo módulo), TÉCNICA (talking heads ≥8s, diálogos de ~24-30 palabras, marca fonética en TODO lo hablado).] Mirá ${foco}.
Devolvé SOLO JSON: { "score": <0-50>, "verdict": "LISTO PARA PRODUCIR|AJUSTAR|REHACER", "issues": [{ "severity": "alta|media|baja", "note": "el problema + el fix concreto" }] }
LISTO PARA PRODUCIR si score >= 38. Español rioplatense, sin emojis.
OBJETIVO: ${x.objetivo || '(inferilo)'} · NEGOCIO: ${x.name}
COMERCIAL COMPLETO A EVALUAR:
CONCEPTO: ${JSON} / GUION: ${texto} / CAST: ${JSON} / STORYBOARD: ${JSON} / PACK ESTILO: ${estilo}
```

### 2.9 `videoprompt` (sonnet) — un prompt de Flow suelto

```
Sos el prompt-writer de Google Flow (Veo 3.1). Escribí UN prompt final, listo para pegar en Flow, para el video que describe el usuario. TODO el prompt va en INGLÉS salvo el diálogo (si hay), que va en español rioplatense entre comillas.
${guía talking-head | b-roll}
${VEO_RULES}
DESCRIPCIÓN DEL USUARIO: ${options.brief}
Devolvé SOLO el prompt (texto plano, sin JSON, sin markdown, sin comillas envolventes, sin explicaciones).
```

### 2.10 `briefToKb` (sonnet) — texto libre al KB 1.2

```
Sos un curador de datos. Convertí el siguiente texto libre sobre un negocio al shape EXACTO de un Knowledge Base (KSP). NO inventes nada que el texto no diga: si un campo no está en el texto, omitilo (no lo rellenes con algo plausible).

Devolvé SOLO JSON con este shape:
{ "contract_version": "1.2", "business": {...}, "key_messages": [...], "offerings": [...], "differentiators": [...], "objections": [...], "faq": [...], "pricing": {...}, "do_not_say": [...], "brand": {...}, "screens": [...] }
Reglas: "business.name" y "business.description" son OBLIGATORIOS (si el texto no da un nombre claro, usá el nombre del producto/servicio que sí mencione). "offerings" es un array (puede tener 1 solo ítem) — SIEMPRE presente aunque sea corto. Los demás campos: solo si el texto los menciona; si no, omitilos del JSON (no pongas array vacío ni string vacío). Sin emojis, español rioplatense donde el texto ya venga en español.
TEXTO DEL USUARIO:
${brief}
```

(El shape completo con todos los campos está en `server/functions.mjs`, molde `briefToKb`.)

---

## 3. Dónde se va el tiempo (lo que sé y lo que no)

Lo único medido con reloj en esta sesión: el CLI con un prompt trivial responde en 5 a 7 s
(arranque del proceso más la ida y vuelta), y `concept` con Sonnet y el prompt nuevo tardó 22 s.
No medí Guion, Cast, Storyboard ni Pack Flow con Opus; el dueño reporta que tardan "bastante más
de un minuto" cada uno.

Lo que sí se puede decir leyendo:

- **El tiempo es proporcional al JSON de salida y al modelo.** Opus escribe más lento que Sonnet,
  y `storyboard` y `flowpack` piden los JSON más largos del sistema (un prompt en inglés de 80 a
  120 palabras por escena, por 5 a 7 escenas, más personajes).
- **Se encadenan solos.** Entrar a una pantalla con insumo y sin resultado dispara su molde. Un
  recorrido Concepto → Guion → Cast → Storyboard → Pack son cinco llamadas, cuatro con Opus.
- **El contexto inútil ya no está** (los 49K tokens por llamada). Eso achica el costo y un poco la
  latencia de arranque, pero no toca el tiempo de escritura.
- **`cast` y `flowpack` mandan JSON enteros** (concepto, cast, storyboard, brandKit) adentro del
  prompt. Es más entrada que leer, no más salida; afecta poco el tiempo, bastante la calidad.

---

## 4. Palancas que veo (para que el dueño decida)

1. **Modelo por molde.** Hoy: 5 moldes en Opus. Candidatos a Sonnet sin perder nada: `script`
   (4 bloques cortos), `cast` (JSON chico), `storyboard` (es mecánico: convierte un guion en
   escenas con reglas duras). `flowpack` es el único donde Opus puede valer la pena, y aún así es
   traducción al inglés con reglas, no creatividad.
2. **Largos en números en todos los moldes.** Sólo `concept` los tiene. `script` dice "súper
   breve" y "máximo 1-2 oraciones" (eso está bien), `cast` dice "sé ESPECÍFICO" sin tope,
   `storyboard` dice "sé conciso" sin tope en `accion`, `flowpack` no acota el prompt por escena.
3. **El brief entra cortado a 2.500 caracteres** y los moldes de abajo (cast, storyboard, flowpack)
   ni lo reciben: trabajan sobre el concepto y el guion. Decisión: ¿subir el tope, o resumir el
   brief una vez al crear el proyecto (ficha semántica) y que los moldes lean la ficha?
4. **No disparar en cadena sin querer.** Opción: que el auto-disparo exista sólo en Concepto y el
   resto espere el botón; o un botón "generar todo hasta Pack" explícito que lo haga de corrido
   mientras el dueño hace otra cosa.
5. **Precomputar lo previsible** (estándar de prompts, §"lo previsible no se pide en vivo"):
   `publish` y `qa` no cambian si no cambió el guion; se pueden generar junto con el guion y
   guardar, en vez de esperar al apretar el botón.
6. **Un preámbulo común + ficha por molde** en vez de diez prompts que repiten "rioplatense, sin
   emojis, no inventes datos" cada uno a su manera.

## 5. Bugs encontrados leyendo (no tocados, se anotan)

- **`publish` y `qa` no ven el guion.** `ctx().guion` sólo aplana el formato viejo (array); con el
  guion estructurado queda vacío y el prompt manda el brief en su lugar. El caption se escribe sin
  haber leído el guion.
- **`cast` mete el brief entero dentro de un paréntesis** en la regla de locación (`${rubroNegocio}`
  cae siempre a `x.brief` porque `x.industry` no existe en `ctx()`).
- **`VEO_RULES` contradice a `flowpack`** sobre repetir la descripción física del personaje
  (ver nota en 2.6). El estándar de prompts dice exactamente esto: cuando sale mal, antes de
  agregar una regla, leer el prompt entero buscando la instrucción vieja que quedó.
- **El Guion se dispara solo apenas hay concepto elegido**, aunque el dueño esté todavía en la
  pantalla de Concepto comparando. Hoy es "por diseño" del WIP de auto-generar; vale revisarlo.

---

## 6. Funcionalidad a sumar: la skill de reels renderizados cuadro a cuadro

> Pedido del dueño, 2026-10-07: *"esto quiero usar para todo lo que es animado"*. El archivo está en
> el repo: `D:\Code\media-studio\docs\14-skills\SKILL.md` (374 líneas, leído entero). Esta sección
> es el brief para implementarlo, acá o en otro agente.

### 6.1 Qué es, de verdad

La skill se llama **`dev-claude-reel`**. Su descripción textual: *"Build a short vertical (9:16)
cinematic 3D reel of a conversation between a developer and a 'Claude' character. Covers the full
pipeline - script, ElevenLabs voices, a three.js scene rendered frame by frame in headless
Chrome, shots, mix, mp4 - plus QA rules for buggy or weird movement. Characters, set and look are
yours to design."*

O sea: **no es un motor genérico de reels animados.** Es una receta completa para UN tipo de
pieza: dos personajes 3D low-poly (un dev y un "Claude") que tienen una conversación corta y
graciosa, con dos voces, subtítulos y cámara que corta en las líneas. Lo que la hace valiosa para
Media Studio es que **toda la mecánica es genérica** (render, timeline, cámara, voz, mezcla,
verificación) y el contenido (personajes, set, guion) lo deja a decisión del que la usa.

**Salida:** mp4 1080x1920, 30 fps, H.264 + AAC, 15 a 45 segundos. Nada de Veo ni Flow: el video
se construye en la máquina, cuadro por cuadro.

**Orden de trabajo que impone (no se saltea):** brief → guion → voces → timeline → escena →
stills → chequeo de movimiento → música/mezcla → render completo → mux → verificación → entrega.

### 6.2 La mecánica (lo que se reutiliza tal cual)

| Pieza | Qué hace | Regla clave |
|---|---|---|
| `cdp.mjs` | Driver de Chrome headless por DevTools Protocol, sin dependencias | Un solo navegador, en GPU, prioridad baja; si WebGL cae a software (SwiftShader) **aborta y avisa** |
| `film.html` + `scene.js` | La escena three.js | **`window.setT(t)` es función pura del tiempo**: sin relojes, sin estado acumulado, sin random. Cualquier cuadro se renderiza en cualquier orden |
| Post-proceso | Render lineal HDR → profundidad de campo → bloom → tone mapping ACES → viñeta y grano | Es lo que hace que parezca cine y no "demo WebGL" |
| `timeline.mjs` | Única fuente de verdad: cues (una línea hablada por fila), gaps de ritmo, marcas, lista de planos | La importan Node y el navegador; si cambia, se regenera todo |
| `gen-audio.mjs` | ElevenLabs `text-to-speech/{voice}/with-timestamps`, modelo `eleven_v3` con tags de actuación `[deadpan]`, `[excited]` | Una toma = una línea corta; 2 o 3 tomas de las líneas clave; todo cacheado en disco; la key nunca se imprime |
| `words.mjs` / `build-film.mjs` | Tiempos por palabra desde el alignment; buses por hablante, envolventes de voz (para la boca), subtítulos en chunks de hasta 2 líneas | Subtítulos desde el cuadro 1; la franja de subtítulos es zona prohibida para caras |
| Planos (§7) | Cámaras relativas a **anclas** (cabezas, manos, props), push-in lento, smootherstep, vida de mano apenas visible | Cortar en las líneas, nunca a mitad de palabra; cada corte con una razón |
| Reglas de movimiento (§8.1) | Easing en todo, actuación minimalista, nada de temblor, personajes siempre apoyados en el piso, clearances medidos con Box3 | Son las reglas que evitan que se vea "bugueado" |
| `check.mjs` | Chequeos automáticos antes del render: teleports, picos, jitter, flotación, penetraciones, lint de tablas y subtítulos, clicks de audio | Se corre hasta que quede en cero |
| Stills (§8.3) | Hoja de contactos con cuadro 1, primer y último segundo de cada plano, cada beat | **Nunca render completo sin aprobar los stills** |
| Mezcla (§10) | Cadena de voz por hablante, room tone, música opcional como cama, `loudnorm` a -14 LUFS, true peak -1.5 | Niveles medidos, no a ojo |
| `render.mjs` | Stills o full, por chunks de 400 a 600 cuadros, resumible, guardia de cuadro en blanco | 0,15 a 0,3 s por cuadro: un reel de 40 s son 4 a 6 minutos |
| Mux y verificación (§12) | ffmpeg a mp4, ffprobe, cuadro 1 no negro, loudness, hoja de contactos del mp4 final | Entrega con informe corto y honesto; no publica |

**Requisitos contra esta máquina:**

| Requisito | Acá |
|---|---|
| Node 22+, sin paquetes salvo `three@0.170` | sí (22.5.1) |
| Chrome o Edge | sí |
| ffmpeg + ffprobe en PATH | sí (ya los usa el render actual) |
| GPU real (WebGL por GPU, no software) | el dueño confirma; la skill lo prueba sola al arrancar |
| `ELEVENLABS_API_KEY` | ya está en `.env`, es la del TTS actual. Plan gratis: ~10.000 créditos/mes, 1 crédito por carácter; sin licencia comercial |
| Claude Code (trabajo largo, un video por chat) | sí |

### 6.3 Qué hay que adaptar para usarla en Media Studio

La skill dice explícitamente que el contenido es del que la usa: *"It deliberately does not tell
you what the characters look like, what the room looks like, or what the story is."* Pero tres
partes están escritas para el reel dev/Claude y hay que redefinirlas para una pieza de app:

1. **Qué se ve.** La skill arma dos personajes de primitivas con articulaciones. Para una pieza
   animada de Munify lo que tiene que verse son **las pantallas reales del Media Kit**: como
   texturas en un celular/monitor 3D dentro del set low-poly, con el mismo post-proceso (DOF,
   bloom, grano). La skill ya contempla "inserts" de pantalla y la regla de que el brillo de una
   pantalla no lave la cara. Decisión del dueño: ¿pantallas solas en un set, o un personaje (el
   vecino, el empleado) que las usa?
2. **Quién habla.** La skill está pensada para DOS voces en ping-pong. El camino animado de Media
   Studio tiene UNA narración en off (el guion por bloques). Dos opciones: narración única (más
   simple, es lo que ya existe) o convertir el guion en diálogo vecino↔municipio (más vivo, es lo
   que la skill sabe hacer mejor). Decisión del dueño.
3. **El guion.** La §9 de la skill ("Writing the script") es específica de la charla dev/Claude
   (arrancar nombrando a Claude, chistes de programador). **No se usa.** El guion viene del molde
   `script` de Media Studio, que ya respeta hook → desarrollo → gag → cta. Lo que sí se toma de
   la §9: líneas de 8 palabras promedio, 60 a 120 palabras habladas para 25 a 45 s, el beat
   sostenido antes del remate, y terminar en corte seco sin despedida.

Lo que NO hay que tocar: toda la §3 a §8 y §10 a §12 (driver, contrato de página, post-proceso,
timeline, planos, reglas de movimiento, chequeos, mezcla, render, verificación).

### 6.4 Dónde encaja en el pipeline (propuesta)

```
Concepto (animado) → Guion → Storyboard animado → [NUEVO] Render con la skill → Montaje → Publicar
                                                      │
                                                      ├─ entrada: guion por bloques (narración + durSec) + escenas
                                                      │   (screen, accion, continuidad) + capturas reales del kit +
                                                      │   brandKit (colores, logo, fonética) + voz ElevenLabs elegida
                                                      ├─ corre: Claude Code headless con el SKILL.md, en una carpeta
                                                      │   de trabajo por pieza (server/storage/<proyecto>/<reel>/skill/)
                                                      ├─ control: la skill produce guion + hoja de contactos de stills;
                                                      │   la UI los muestra y el dueño aprueba ANTES del render largo
                                                      ├─ progreso: etapas REALES en el loader de película (voces,
                                                      │   stills, chequeos, render por chunks, mux)
                                                      └─ salida: mp4 9:16 en server/storage, mismo lugar que mockupReel
```

El storyboard animado de Media Studio ya trae por escena `screen` (la captura real), `accion`,
`dialogo` (la narración propagada) y `durSec`. **Eso es el `timeline.mjs` de la skill, ya
resuelto**: cada escena es un cue, cada `screen` es un ancla de cámara, cada `durSec` un plano.

### 6.5 Decisiones del dueño antes de implementar

1. **¿Reemplaza o convive?** Propuesta: el paso Render animado ofrece dos motores, "Mockup 3D"
   (el actual, 30 segundos) y "Película (skill)" (5 a 15 minutos, mejor). Por defecto la skill.
2. **Pantallas solas o con personaje** (ver 6.3 punto 1).
3. **Narración única o diálogo** (ver 6.3 punto 2).
4. **Dónde corre.** En local, como todo Media Studio (la app no se deploya). La skill exige un
   solo navegador, prioridad baja y chunks de menos de 8 minutos: el back lo lanza como proceso
   aparte y la UI muestra el progreso real.

### 6.6 Lo que ya existe y se reutiliza

- `server/mockupReel.mjs` y `server/renderComercial.mjs`: ensamblado ffmpeg, narración TTS por
  bloque, escritura en `server/storage`. La skill entra en el mismo lugar.
- Media Kit v1.2: capturas reales con nombre, momentos y CTA verificado. Es el material que la
  skill necesita para no inventar pantallas.
- Storyboard animado con narración propagada y captura asignada por escena (§2.5).
- ElevenLabs cableado (voces en español, key en `.env`). Ojo: la skill usa `eleven_v3` con tags
  de actuación; si la cuenta no lo tiene, cae a `eleven_multilingual_v2` sin tags y lo dice.

### 6.7 Primer paso (antes de integrar nada)

Prueba manual tal cual la describe el autor: carpeta vacía, el `SKILL.md`, y el pedido
*"Read SKILL.md, then make me a 25-second reel about [una pieza real de Munify, con su guion]"*.
Pedirle el guion y la hoja de stills antes del render. Ver qué sale con pantallas reales como
props. Recién con eso visto se escribe el conector en el back y la aprobación de stills en la UI.
