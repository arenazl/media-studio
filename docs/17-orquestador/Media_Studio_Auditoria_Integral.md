# Media Studio — Auditoría integral del pipeline audiovisual

**Caso analizado:** RepareHoy  
**Formato:** Reel híbrido, vertical 9:16, 26 segundos  
**Enfoque:** Un caso de principio a fin (`caso`)  
**Tratamiento:** Cálido (`calido`)  
**Documento fuente:** `Pasted text(20261011-010914).txt`, con la ficha comercial, estrategia, conceptos, guion, storyboard, descripciones para Flow, radiografía automática y prompts por etapa.

> **Alcance:** esta auditoría evalúa los artefactos y prompts documentados en el material suministrado. No representa una revisión del código fuente completo de Media Studio ni de los videos efectivamente renderizados. Las puntuaciones son juicios editoriales orientativos, no resultados de pruebas con espectadores.

---

## 1. Diagnóstico general

**Media Studio tiene una arquitectura de producción bien planteada, pero todavía confunde cumplir las instrucciones de cada etapa con producir un buen comercial.**

El sistema mantiene una idea desde estrategia hasta storyboard, utiliza información verificable del negocio y distingue decisiones creativas de técnicas. El problema aparece cuando cada etapa transforma la salida anterior sin comprobar si la pieza sigue siendo atractiva, comprensible y realizable mediante el motor de video.

En el ejemplo de RepareHoy, el resultado es conceptualmente defendible, pero presenta tres debilidades:

- **Creativa:** la historia es cálida, pero no explota del todo la tensión ni el diferencial comercial de la marca.
- **Narrativa:** el concepto promete una cosa, el guion enfatiza otra y el storyboard termina funcionando como una demostración de interfaces.
- **Técnica:** los prompts de Flow no representan fielmente todas las acciones, voces y transiciones que necesita el montaje.

### Evaluación por etapa

| Etapa | Evaluación | Comentario |
|---|---:|---|
| Estrategia | 8/10 | Buen foco comercial, pero incorpora pruebas secundarias innecesarias. |
| Concepto creativo | 7/10 | Humaniza el beneficio; desplaza parcialmente el ángulo original. |
| Guion | 5/10 | Demasiado explicativo y con un resultado que el relato no demuestra. |
| Casting y locación | 7/10 | Coherentes, aunque las referencias contienen instrucciones contradictorias. |
| Storyboard | 4/10 | Pierde separación entre actuación, narración e interfaces reales. |
| Prompts para Flow | 3/10 | Faltan precisión temporal, continuidad audiovisual y acciones ejecutables. |

**Recomendación principal:** no empezar cambiando de modelo de IA. Primero corregir cómo se pasan las decisiones entre etapas, qué puede modificar cada etapa y cómo se valida el resultado.

---

## 2. Dónde se rompe el proceso

### 2.1. Estrategia → Concepto: se pierde el centro de la campaña

La estrategia establece un ángulo concreto:

> Tres presupuestos, cero persecución.

El concepto elegido, **«A quién le abro»**, desarrolla otra preocupación: la confianza en la persona que va a entrar a casa.

No es una mala idea; puede ser un excelente comercial. Pero introduce un desplazamiento:

| Estrategia original | Concepto elegido |
|---|---|
| Dejar de perseguir profesionales | Elegir a alguien de confianza |
| El diferencial es recibir opciones | El diferencial es la reputación |
| Momento decisivo: llegan presupuestos | Momento decisivo: Alicia decide |

Ambas ideas pertenecen a RepareHoy, pero corresponden a motivaciones diferentes y podrían justificar spots distintos.

**Qué cambiaría:** obligar al generador de conceptos a demostrar el mensaje principal elegido *antes* de incorporar beneficios secundarios. La confianza puede fortalecer esta historia, pero no desplazar la llegada de presupuestos.

También quitaría del brief de esta pieza la comisión del 10% que paga el proveedor. Es un hecho real, pero no aporta a la historia dirigida al cliente. Está documentado correctamente, pero estratégicamente sobra.

### 2.2. Concepto → Guion: los personajes hablan como marketing

El concepto propone una mujer mayor que mantiene el control de la decisión, acompañada por su nieta. Sin embargo, el guion le hace decir:

> Mi nieta se sentó al lado y escribimos qué pasa, con mis palabras.

La expresión **«con mis palabras»** viene de la descripción funcional del producto. No suena espontánea en boca de Alicia.

Lo mismo ocurre con:

> Cada reseña es un trabajo terminado.

Es una explicación institucional de la reputación de RepareHoy. Es cierta, pero no es necesariamente la forma en que una persona hablaría.

La solución **no es agregar chistes**. Es escribir desde la psicología del personaje y demostrar la funcionalidad de manera visual.

Además, aparecen dos afirmaciones problemáticas:

1. **«A la tarde ya me esperaban tres presupuestos».** Sugiere un plazo no garantizado y convierte el máximo de tres en una cantidad aparentemente asegurada. El producto permite recibir *hasta* tres.
2. **Living «ya ventilado» en el cierre.** Puede sugerir que el aire ya fue reparado, aunque la pieza solo mostró que Alicia comparó presupuestos.

El cierre debería mostrar la tranquilidad de poder elegir, no insinuar que el trabajo ya terminó.

### 2.3. Guion → Storyboard: la estructura rígida se vuelve contraproducente

El guion impone una estructura temporal:

```text
hook 4s → desarrollo 12s → giro 5s → CTA 5s
```

El storyboard, a su vez, trabaja con restricciones de planos y bloques hablados que no encajan necesariamente con esos tiempos: por ejemplo, clips de actuación de ocho segundos cuando el hook tiene solo cuatro.

**Problema:** se confunde la **duración del clip generado** con la **duración útil en edición**. Una toma generada de ocho segundos puede ocupar cuatro o cinco segundos del comercial.

El storyboard necesita pensar en montaje, ritmo, intervenciones y continuidad; no forzar la duración final a los segmentos disponibles del generador.

### 2.4. Storyboard → Flow: el problema más grave

El sistema declara que las interfaces son capturas reales, con microanimaciones definidas. Sin embargo, las descripciones enviadas a Flow incluyen acciones como:

> the 'Te esperan tus proveedores' strip adds quotes 1, 2, 3.

Eso le pide al generador visual que represente una interfaz y su comportamiento, pese a que el material existe y debería reutilizarse directamente.

Problemas específicos:

1. **Diálogo incompleto:** la escena 2 incluye solo una parte de la locución de desarrollo; otras escenas indican ausencia de diálogo. Podría resolverse en montaje, pero esa dependencia no queda especificada.
2. **Instrucciones incompatibles:** Alicia y Mía deben estar mirando una pantalla y Alicia debe hablar directamente a cámara, simultáneamente.
3. **Referencias inconsistentes:** la ficha visual de Alicia pide postura sentada y también retrato de pie. La de Mía describe una interacción con la abuela dentro de un retrato individual.
4. **Interfaz vs. prohibición de textos:** se piden animaciones textuales y al mismo tiempo «No on-screen text».
5. **CTA desperdiciado:** el storyboard describe una escena final con las dos protagonistas, pero el motor informa que el CTA es una placa de marca y no se filma.

**Qué cambiaría:** usar Flow para actuaciones y ambiente. Renderizar las capturas, contadores, reseñas, rótulos, logo y CTA de manera determinista en composición.

### 2.5. La radiografía automática necesita análisis semántico

La radiografía atribuye porcentajes al kit, a pasos anteriores, a invención creativa y a contenido imaginado por coincidencia de palabras. Es un indicador útil, pero no una auditoría factual.

Por ejemplo, el concepto aparece como 0% derivado de un paso anterior aunque recibe explícitamente el ángulo y mensaje principal de la estrategia.

Reemplazaría esos porcentajes como veredicto por un clasificador semántico con estas categorías:

| Categoría | Interpretación |
|---|---|
| Hecho verificado | Está respaldado expresamente por la ficha. |
| Dramatización permitida | Personaje o situación ficticia que no se presenta como realidad documentada. |
| Inferencia no verificada | Plazo, resultado, cantidad o condición no respaldada. |
| Contradicción | Afirmación incompatible con la ficha o con una decisión de otra etapa. |

**Ejemplo:** inventar a Alicia es una dramatización permitida; afirmar que siempre recibirá tres presupuestos esa misma tarde es una inferencia no respaldada.

**Diagnóstico de fondo:** cada IA cumple razonablemente su tarea local, pero falta alguien —o una etapa— que responda por la calidad y consistencia del comercial completo.

---

## 3. Guion curado: propuesta para RepareHoy

Mantendría a Alicia y a su nieta, pero daría a Alicia la iniciativa. Acortaría las explicaciones para que las capturas reales muestren las funcionalidades.

No agregaría un chiste explícito. **«Yo no le abro a cualquiera»** da personalidad y una leve gracia observacional sin romper el tono cálido.

### 3.1. Guion narrativo

**00:00–00:04 — HOOK (4 s)**

- **Dice Alicia:** «El aire no enfría. Yo no le abro a cualquiera».
- **Se ve:** Alicia prueba el control remoto, sin éxito. Mira hacia la puerta.

**00:04–00:16 — DESARROLLO (12 s)**

- **Dice Alicia:** «Mi nieta me mostró RepareHoy. Conté lo del aire y listo. Después me llegaron presupuestos de profesionales verificados de la zona. Hasta tres, sin perseguir a nadie».
- **Se ve:** Mía acerca el teléfono. Alicia hace el pedido. Se incorporan insertos de las pantallas reales de publicación y presupuestos.

**00:16–00:21 — GIRO (5 s)**

- **Dice Alicia:** «Miré las reseñas de trabajos terminados. Y elegí yo».
- **Se ve:** inserto real de reputación. Alicia señala su elección y cruza una mirada cómplice con Mía.

**00:21–00:26 — CTA (5 s)**

- **Dice locución:** «Entrá a reparé hoy punto com punto ar. Contá qué hay que arreglar».
- **Se ve:** placa gráfica de RepareHoy con `reparehoy.com.ar`. No insinuar que el aire ya fue reparado.

> **Nota de producción:** la cantidad de palabras orienta, pero no garantiza el tiempo real. Antes del render final hay que medir duración con audio, pausas y respiración. En la pista hablada usar la marca fonética; en pantalla usar la marca y URL oficiales.

### 3.2. JSON listo para sustituir el guion

```json
{
  "blocks": [
    {
      "role": "hook",
      "narration": "El aire no enfría. Yo no le abro a cualquiera.",
      "visual": "Alicia prueba el control remoto del aire, suspira por el calor y mira hacia la puerta de su living.",
      "durSec": 4
    },
    {
      "role": "desarrollo",
      "narration": "Mi nieta me mostró reparé hoy. Conté lo del aire y listo. Después me llegaron presupuestos de profesionales verificados de la zona. Hasta tres, sin perseguir a nadie.",
      "visual": "Mía acompaña a Alicia mientras ella usa el teléfono. Insertos separados de las pantallas reales 'Contar el problema' y 'Te esperan tus proveedores', con sus microanimaciones verificadas.",
      "durSec": 12
    },
    {
      "role": "giro",
      "narration": "Miré las reseñas de trabajos terminados. Y elegí yo.",
      "visual": "Inserto real de 'La reputación, hecha de trabajos reales'. Alicia selecciona una opción por decisión propia y comparte una sonrisa cómplice con su nieta.",
      "durSec": 5
    },
    {
      "role": "cta",
      "narration": "Entrá a reparé hoy punto com punto ar. Contá qué hay que arreglar.",
      "visual": "Placa gráfica de RepareHoy con la URL reparehoy.com.ar y el llamado a contar qué hay que arreglar.",
      "durSec": 5
    }
  ],
  "music": {
    "mood": "acústico cálido discreto"
  }
}
```

---

## 4. CURACIÓN DE PROMPTS

Estos reemplazos apuntan a elevar la calidad del sistema, no solamente a salvar el caso RepareHoy.

### 4.1. Enfoque `caso`: «Un caso de principio a fin»

La definición original es buena conceptualmente, pero el campo `recorrido` se parece demasiado a una plantilla obligatoria de cinco pasos. La corrección siguiente mantiene la dirección narrativa sin fijar escenas ni orden.

**Texto propuesto para reemplazo:**

```text
ENFOQUE: UN CASO DE PRINCIPIO A FIN [caso]

PROPÓSITO
Demostrar un beneficio real del producto mediante una situación
humana específica. El espectador debe identificar el problema,
comprender qué cambia gracias a la marca y reconocer una
consecuencia verificable.

REGLA CREATIVA CENTRAL
Una historia no es una enumeración de funcionalidades.
Elegí una necesidad humana, una acción importante y
una transformación perceptible.

ESTRUCTURA NARRATIVA
La historia puede utilizar:
- Una situación concreta que ya está ocurriendo.
- Una decisión o acción sencilla de la persona.
- Una intervención verificable del producto.
- Una consecuencia humana o práctica.
- Una firma de marca.

Estos componentes son recursos narrativos, NO escenas obligatorias.
No exijas introducción, nudo y desenlace separados.
Se puede comenzar por la consecuencia y revelar la causa después.

ESCALA
En piezas de hasta 30 segundos:
- Un único conflicto principal.
- Un beneficio dominante.
- Como máximo dos capacidades del producto si se complementan.
- Un cambio reconocible antes del cierre.

PERSONAJES
La persona afectada debe conservar su iniciativa.
Puede recibir ayuda, pero nunca perder su autonomía sólo
para que otro personaje explique el producto.

VERACIDAD
El resultado puede ser un avance, una decisión o una
situación mejor informada. No tiene que ser el problema
completamente resuelto.

No inventes plazos, éxitos comerciales, resultados finales,
clientes reales ni testimonios documentados.

PANTALLAS
Las interfaces verificadas se incorporan como material de
montaje. No pedir al generador de video que recree sus textos,
botones, cifras ni animaciones.

CRITERIO DE APROBACIÓN
Si eliminamos el logo, la historia debe seguir teniendo
sentido humano.
Si eliminamos el producto, debe perder su solución específica.
Si el beneficio elegido no aparece, el concepto no está listo.
```

La condición final evita comerciales donde podría sustituirse el logo por cualquier marca.

### 4.2. Tratamiento `calido`: «Cálido»

La descripción original —«Cercanía y vínculo humano. Emoción que nace de la situación, no de frases inspiracionales»— está orientada correctamente, pero es demasiado abierta.

**Texto propuesto para reemplazo:**

```text
TRATAMIENTO: CÁLIDO [calido]

OBJETIVO
Transmitir cercanía, humanidad y confianza sin sentimentalismo.

ESCRITURA
- Español rioplatense conversado.
- Frases que una persona realmente diría.
- Preferir observaciones concretas antes que conceptos abstractos.
- Permitir pequeños rasgos de personalidad y humor cotidiano.
- Evitar explicaciones técnicas en boca de personajes.
- No convertir a los protagonistas en vendedores del producto.

ACTUACIÓN
- Gestos contenidos y espontáneos.
- Miradas, silencios y reacciones breves.
- Complicidad entre personajes cuando corresponda.
- Evitar sonrisas constantes, emoción forzada y sobreactuación.
- Mantener la autonomía de los personajes mayores.

REALIZACIÓN
- Cámara a escala humana.
- Luz natural o motivada por el ambiente.
- Espacios con detalles cotidianos, no decorados genéricos.
- Música discreta que acompañe, no que imponga la emoción.

HUMOR
Puede surgir de una frase, una mirada o una situación reconocible.
No exigir chiste, remate cómico ni estructura de sketch.

CONTROL
Preguntate:
¿La emoción nace del acontecimiento o estamos fabricándola
con música, frases o actuación?
¿El personaje parece una persona o un portavoz de marketing?
¿La marca interviene en el momento correcto?
```

### 4.3. Reglas fijas: Estrategia (`strategy/2.0`)

**Agregar:**

```text
JERARQUÍA DE LA PIEZA

Cada pieza debe tener:
1. Un mensaje principal.
2. Una necesidad concreta.
3. Una prueba o capacidad directamente vinculada al mensaje.
4. Un beneficio observable.
5. Un CTA consistente.

Los supportingFacts no son una lista de todo lo verdadero.
Incluí sólo hechos necesarios para demostrar el mensaje.

No incorpores datos comerciales secundarios sólo porque
estén disponibles en el brief.

Distinguí siempre "hasta N" de "N garantizados".
No conviertas capacidades posibles en resultados asegurados.

La campaña puede cubrir múltiples beneficios.
La pieza individual no debe intentar cubrirlos todos.
```

### 4.4. Reglas fijas: Concepto (`concept/3.0`)

**Agregar:**

```text
FIDELIDAD AL ÁNGULO

La tensión humana puede enriquecer la idea, pero no sustituir
el mensaje principal seleccionado por la estrategia.

Para cada concepto, verificá internamente:
- ¿Qué demuestra exactamente?
- ¿Qué acción real del producto interviene?
- ¿Qué verá el espectador como prueba?
- ¿Qué lo diferencia de los otros conceptos?
- ¿Se podría filmar con los recursos disponibles?

Generá tres ideas realmente distintas.

Diversificá por mecanismo narrativo:
- contraste,
- observación cotidiana,
- demostración,
- vínculo humano,
- inversión de expectativa,
- tensión y alivio,
según resulte apropiado.

No fuerces diversidad cambiando solamente personajes,
profesiones o escenarios.

Si un concepto explica mejor otro mensaje de la marca
que el ángulo actual, descartalo o reformulalo.
```

**Pregunta adicional de QA:** «¿Este concepto sigue siendo el mejor vehículo para el ángulo comercial asignado?»

Ese control habría detectado que **«A quién le abro»** pertenece más naturalmente a la campaña de confianza.

### 4.5. Reglas fijas: Guion (`script/2.0`)

**Agregar/reemplazar las reglas creativas pertinentes:**

```text
PRINCIPIO DE GUION PUBLICITARIO

Escribí para ser escuchado, no para ser leído.

El guion debe convertir las funciones del producto en
acciones y consecuencias comprensibles.

No hagas que un personaje explique especificaciones,
categorías, pantallas o atributos de marketing si puede
demostrarlos visualmente.

DIÁLOGOS
- Usar expresiones naturales según personaje y situación.
- Evitar repeticiones de la ficha comercial.
- No convertir cada frase en un claim.
- Priorizar un pensamiento claro por intervención.
- Evitar narraciones que repitan exactamente lo visible.

RELACIÓN AUDIO / IMAGEN
La imagen puede demostrar una funcionalidad mientras
la voz expresa la consecuencia humana.

No describir acciones sobre pantallas como si tuvieran
que ser generadas por un modelo de video.

TIEMPO
Los bloques indican tiempo de montaje, no duración
obligatoria de los clips de generación.

Calcular duración estimada del texto hablado.
Reservar margen para pausas, respiración y transición.
No ajustar el guion solamente al máximo teórico de
palabras por segundo.

RESULTADO
No mostrar una consecuencia posterior que la historia
no haya justificado.

CTA
Usar la marca fonética sólo en la pista hablada.
En overlays, títulos, mockups y URL utilizar la
representación gráfica oficial.
```

**Ajuste adicional:** permitir que el guion proponga duraciones dentro del total de 26 segundos, en vez de imponer siempre 4+12+5+5. Mantener el esquema de roles JSON si lo requiere el parser, pero validar la suma con código.

---

## 5. Corrección del envío a Google Flow / Veo

Este apartado propone un **cambio de arquitectura**, no solo prompts más lindos.

El motor dispone de capturas verificadas, nombres de pantallas y microanimaciones. No tiene sentido pedirle a Veo que las reconstruya.

### 5.1. División por fuente visual

| Componente | Fuente recomendada |
|---|---|
| Alicia y Mía | Video generado con referencias consistentes |
| Living y ventilador | Video generado |
| Pantallas de RepareHoy | Capturas reales + motion graphics |
| Contadores y reseñas | Animación a partir de interfaz real |
| Logo, URL y CTA | Composición gráfica determinista |
| Voz y música | Pistas independientes de audio |

Esto reduce variabilidad, errores de interfaz y generaciones fallidas.

### 5.2. Montaje propuesto de 26 segundos

| Tiempo | Duración | Fuente | Acción |
|---|---:|---|---|
| 00:00–00:04 | 4 s | Veo | Alicia y el aire sin enfriar |
| 00:04–00:09 | 5 s | Veo | Interacción con Mía |
| 00:09–00:12 | 3 s | UI real | Contar el problema |
| 00:12–00:16 | 4 s | UI real | Te esperan tus proveedores |
| 00:16–00:21 | 5 s | Veo + UI real | Alicia elige e inserto de reseñas |
| 00:21–00:26 | 5 s | Gráfica | Placa de marca y CTA |

La voz de Alicia se graba o genera aparte, sincronizada con los bloques narrativos. No exigir lip-sync a Veo en estas tomas.

### 5.3. Prompts corregidos para Flow

**Condición previa:** crear y reutilizar referencias consistentes de Alicia, Mía y el living. No regenerar de cero sus características en cada escena.

#### Escena 1 — Alicia y el calor

```text
Photorealistic cinematic live-action, vertical 9:16.

Use the supplied character reference of Alicia and the
supplied living-room reference. Preserve exact identity,
hairstyle, clothing, furniture layout and afternoon lighting.

Alicia, an Argentine woman in her early seventies,
is seated in her modest Buenos Aires living room.
It is a hot afternoon. A standing fan rotates nearby.

She points an air-conditioning remote toward the unit,
waits briefly, realizes nothing has changed, then glances
toward the closed entrance door with a thoughtful expression.

Medium close-up, eye-level camera, natural performance,
subtle observational warmth. One continuous shot.

No dialogue, no lip movement intended as speech.
No readable screens, no captions, no generated text,
no logo, no transitions.
```

#### Escena 2 — Dos generaciones, una decisión

```text
Photorealistic cinematic live-action, vertical 9:16.

Same Alicia, same apartment, same clothing and same
afternoon lighting as the previous shot.

Mía, her granddaughter, sits beside her.
Use Mía's supplied character reference with consistent
face, hairstyle and wardrobe.

Mía gently shows Alicia something on a smartphone.
Alicia takes control of the phone and starts entering
information herself.

Show an authentic, relaxed interaction with small smiles.
Alicia is independent, attentive and confident.
Mía is supportive, never instructive or condescending.

Medium two-shot with a very subtle camera movement.
Phone screen facing away from camera.

No dialogue or lip-sync.
Do not recreate any application interface.
No readable text, no overlays, no captions.
```

#### Escena 3 — Alicia elige

```text
Photorealistic cinematic live-action, vertical 9:16.

Same Alicia and Mía in the same living room.
Maintain identical clothing, lighting and character identity.

Alicia studies her smartphone with a thoughtful expression.
She makes a deliberate choice by tapping once.
Her shoulders relax slightly.

She glances toward Mía, who responds with a small,
genuine smile. Alicia gives a subtle satisfied nod.

The emotional result is confidence in her decision,
not a completed repair.

Medium close-up on Alicia, natural acting, restrained warmth.
One clear action, no abrupt changes in shot composition.

No spoken dialogue, no lip-sync.
Do not show or generate readable phone interfaces.
No logos, captions, synthetic UI or on-screen text.
```

Los prompts generan tomas fuente que el editor puede recortar al tiempo útil. El clip técnico no define la duración del plano final.

### 5.4. Regla nueva para el compilador de Flow

> **Nunca enviar una descripción de interfaz real como acción principal de una escena generativa.** Transformar esas acciones en instrucciones para el compositor y reservar Veo para contenido que necesita generación visual.

El compilador debe conservar y resolver:

- Identidad y referencias de personajes.
- Locación y continuidad de luz/vestuario.
- Encuadre y acción principal realizable.
- Duración de clip técnico y rango útil de montaje.
- Separación entre voz, video y gráficos.
- Fuente del material: generación, captura verificada o composición.

La mera traducción al inglés de descripciones narrativas no alcanza como dirección de producción.

---

## 6. Mejoras de arquitectura

### 6.1. Pipeline propuesto

```text
1. BUSINESS KIT
   Hechos, restricciones, evidencia y material visual verificado
       ↓
2. ESTRATEGIA
   Objetivo, público, ángulo, mensaje y prueba
       ↓
3. CONCEPTO
   Tres ideas con mecanismos narrativos diferentes
       ↓
4. CONTROL EDITORIAL [NUEVO]
   Fidelidad al ángulo y potencia de la idea seleccionada
       ↓
5. GUION
   Diálogos, locución, imagen y tiempos narrativos
       ↓
6. PLAN AUDIOVISUAL [NUEVO]
   Qué se genera, qué viene del media kit y qué se compone
       ↓
7. CASTING + STORYBOARD
   Referencias, acciones, continuidad y montaje
       ↓
8. COMPILACIÓN FLOW
   Prompts específicos y técnicamente realizables
       ↓
9. COMPOSICIÓN
   Clips, pantallas reales, voz, música, subtítulos, marca
       ↓
10. QA FINAL [REFORZADO]
    Veracidad, continuidad, timing y calidad de la pieza
```

### 6.2. Contrato de datos entre etapas

La idea es conservar un contrato estructurado único de decisiones y enviar a cada etapa únicamente los campos pertinentes.

**Ejemplo ilustrativo:**

```json
{
  "primaryMessage": "Contás el problema una vez y recibís hasta tres presupuestos",
  "dramaticTension": "No saber a quién confiarle la entrada a casa",
  "primaryProof": ["Contar el problema", "Te esperan tus proveedores"],
  "secondaryProof": ["La reputación, hecha de trabajos reales"],
  "fictionalCase": true,
  "mustNotImply": [
    "tres presupuestos garantizados",
    "tiempo de respuesta garantizado",
    "reparación completada"
  ],
  "visualAssets": [
    {
      "name": "Contar el problema",
      "source": "verified-ui",
      "renderWith": "motion-compositor"
    },
    {
      "name": "Alicia en su living",
      "source": "generated-video",
      "renderWith": "veo"
    }
  ]
}
```

**Ventaja:** se reducen las reinterpretaciones, los hechos inventados y la repetición de contexto en prompts muy largos.

### 6.3. Control editorial entre concepto y guion

Validar antes del casting y de la generación de video:

- ¿El concepto demuestra el mensaje principal de estrategia?
- ¿El beneficio está ligado a una funcionalidad real?
- ¿La tensión humana aporta o reemplaza el ángulo comercial?
- ¿Tiene una prueba visual reconocible?
- ¿Es producible con materiales y motores disponibles?
- ¿Incluye afirmaciones que el producto no garantiza?

No necesariamente requiere generar un concepto nuevo: primero puede pedirse una reformulación focalizada.

### 6.4. QA determinista y QA semántico

**Validaciones desde código:**

- La suma de `durSec` coincide con el total.
- Los identificadores de personajes, locaciones y pantallas existen.
- Ninguna captura se envía como escena generativa.
- Los límites de duración y palabras se comprueban.
- El CTA es válido y está presente.
- Una placa final no se transforma en escena de Veo.
- Las referencias se conservan en escenas consecutivas.
- Hay correspondencia entre pistas de narración y bloques de edición.

**Validaciones con IA:**

- Naturalidad de la locución.
- Fidelidad al ángulo comercial.
- Claridad de la propuesta de valor.
- Credibilidad de personajes y acciones.
- Capacidad de captar atención y sostener el interés.
- Incoherencias semánticas con los hechos del negocio.

**Principio:** la IA evalúa lo semántico y creativo; el código verifica estructuras y dependencias.

---

## 7. Enfoques y tratamientos: qué conservar

La distinción entre **enfoque** y **tratamiento** es uno de los aciertos del diseño.

- **Enfoque:** cómo se construye la idea y el mecanismo narrativo.
- **Tratamiento:** cómo se expresa (registro, actuación, tono, imagen, música).

El mismo caso puede contarse de manera cálida, sobria o humorística. El mismo tratamiento puede aplicarse a una demostración, contraste, historia personal o inversión de expectativa.

La combinación **no debe determinar automáticamente** el formato de guion.

Ejemplos de lo que evitaría:

- «Un caso de principio a fin» **no implica** necesariamente protagonista hablando a cámara ni relato en primera persona.
- «Cálido» **no implica** abuelas, familias, abrazos y música acústica.
- «Humorístico» **no implica** forzar un gag ni una estructura de sketch.
- Un recurso narrativo elegido **no debe** borrar el mensaje comercial ya aprobado.

**Recomendación:** conservar el sistema de enfoques y tratamientos, pero tratarlos como instrucciones semánticas y no como moldes de escenas obligatorias.

**Límite de la evaluación:** el material permite estudiar en detalle `caso` + `calido`, no aprobar o descartar todas las otras fichas del catálogo sin revisar sus definiciones completas.

---

## 8. Recomendaciones creativas para las primeras piezas

De las tres ideas documentadas, cada una podría servir a un ángulo distinto de la campaña:

### «El balde del martes» — candidata para adquisición

La priorizaría como primera pieza de demostración de la oferta. Presenta un problema físico muy visible (una pérdida), un comportamiento reconocible (escribirle a múltiples profesionales) y un beneficio sencillo (dejar de perseguir presupuestos).

### «A quién le abro» — confianza

La dejaría como pieza dedicada a reputación y confianza. Tiene potencial emocional y una buena oportunidad para demostrar las reseñas vinculadas a trabajos terminados, sin competir con el mensaje de presupuestos.

### «El que esperaba respuesta» — contraste

Tiene potencial como pieza visual de comparación: chats que nadie responde frente a presupuestos que llegan a la app. Es una forma directa de representar el cambio de rol del cliente.

---

## 9. Hoja de ruta de implementación

| Prioridad | Cambio | Impacto esperado |
|---|---|---|
| P0 | Separar clips Flow de interfaces reales | Evita escenas imposibles o inexactas. |
| P0 | Resolver voces, tiempos y montaje | Evita pérdida de diálogo y ritmo. |
| P0 | Controlar fidelidad estrategia → concepto | Asegura claridad comercial. |
| P1 | Curar prompts de enfoque y tratamiento | Mejora naturalidad y coherencia. |
| P1 | Incorporar contratos de datos entre etapas | Reduce pérdida de decisiones y duplicaciones. |
| P1 | Incorporar evaluador semántico de afirmaciones | Detecta supuestos no verificados. |
| P2 | Optimizar contexto y tokens por etapa | Reduce costo y redundancia. |
| P2 | Experimentar con variantes creativas | Permite aprender de comparaciones. |

### Piloto de validación

Antes de producir una campaña completa:

1. Elegir un reel de 26 segundos y fijar ángulo y mensaje.
2. Pasarlo por los controles editorial y factual.
3. Producir material de personajes por separado de las interfaces.
4. Componer el reel con una pista de voz independiente.
5. Revisar la pieza renderizada: continuidad, actuación, ritmo, subtítulos, interfaz, música y CTA.
6. Traducir los fallos observados a reglas del pipeline, en vez de corregir solamente ese video.

---

## 10. Conclusión

Media Studio **produce documentos de producción correctamente con más facilidad de la que produce buenas decisiones publicitarias**.

El salto de calidad no va a venir principalmente de un prompt más largo ni de pedirle a un modelo que sea «más creativo». Va a venir de separar tres responsabilidades:

1. **Dirección creativa:** proteger el mensaje comercial y elegir una idea que lo demuestre.
2. **Dirección audiovisual:** decidir qué imagen y sonido hacen falta, con qué continuidad y qué fuente visual.
3. **Compilación técnica:** convertir esas decisiones en instrucciones realizables por Flow, el compositor y el motor de audio.

Estas responsabilidades pueden resolverse mediante combinación de modelos, reglas de negocio y validaciones. No es obligatorio asignar un modelo distinto a cada una.

**Recomendación final:** corregir primero la separación entre video generado e interfaz real, después el control de fidelidad del concepto y la gestión temporal de voz y montaje. Producir un único reel piloto y evaluar el resultado terminado. El éxito del sistema debe medirse por la calidad del anuncio, no solamente por la calidad textual de sus prompts.
