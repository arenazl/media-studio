# Evaluar 10 corridas en seco del pipeline creativo de Media Studio (2026-10-13 2032)

> Para ChatGPT. Subir o pegar tal cual.

## 1. Contexto

Media Studio fabrica comerciales verticales (9:16, 20 a 40 s) para apps propias y de clientes. El usuario elige tres cosas al empezar: el **objetivo** de la campaña, el **tipo de historia** y el **clima**. Desde ahí, una cadena de moldes de IA (Claude) arma la pieza: Estrategia → Concepto (propone 3) → Guion → Personajes → Storyboard → Pedidos a Google Flow (Veo 3), que filma cada escena → Director de montaje, que propone pocas decisiones de edición sobre el material real (pausas o bajadas de música, cortes, disolvencias, mostrar la cara, sin efecto). Las pantallas de la app las ponen mockups animados reales (no los genera Flow) y el cierre lo hace el motor (logo, voz y frase).

Esta es una **corrida en seco**: se generó todo menos los videos y los mockups. El director de montaje trabajó sobre las escenas del storyboard (su diálogo hizo de transcripción), no sobre tomas filmadas.

## 2. Qué te pedimos

Evaluá los casos como un director creativo y un montajista publicitario exigentes. Para **cada caso**:

1. **Fidelidad a la elección**: ¿la pieza responde al objetivo, al tipo de historia y al clima elegidos? ¿Se nota la diferencia entre casos con elecciones distintas, o todos se parecen?
2. **Concepto y guion**: ¿hay una idea publicitaria (no una descripción del producto)? ¿El gancho funciona en el primer segundo? ¿Los diálogos suenan a gente real (rioplatense) y caben en su duración? ¿El cierre de marca es claro?
3. **Storyboard**: ¿cada escena es filmable, con una acción concreta y un plano que sirve? ¿Es coherente con el guion? ¿El ritmo da para un reel?
4. **Pedidos a Flow**: ¿son buenos prompts para Veo 3? ¿Describen persona, acción, lugar, cámara y luz sin contradicciones? ¿Piden algo que Veo hace mal (texto en pantalla, interfaces legibles, demasiadas acciones en 8 s)? ¿Mantienen a los personajes coherentes entre escenas?
5. **Director de montaje**: ¿las decisiones tienen sentido para esa pieza y ese clima, o son genéricas? ¿Pocas y justificadas?
6. **Puntaje de 1 a 10** en cada uno de los cinco puntos, y **los 3 problemas más graves** del caso con una frase de cómo arreglarlos.

Al final:

- **Tabla resumen**: caso → puntajes → problema principal.
- **Patrones**: los problemas que se repiten en varios casos. Esos apuntan al motor (los moldes) y no a una pieza suelta. Para cada patrón, decí en qué paso de la cadena nace y qué cambiarías en ese paso, en criterio y no en reglas sueltas.
- **Lo que está bien** y no hay que tocar.

Formato de salida: markdown, una sección por caso, después la tabla y los patrones.

## 3. Datos de la corrida

- Modelos: estrategia, concepto, guion y director de montaje con Claude Opus; personajes, storyboard y pedidos a Flow con Claude Sonnet.
- Tiempo promedio por paso: strategy 46 s · concept 49 s · script 34 s · cast 13 s · storyboard 23 s · flowpack 6 s · montageDirection 16 s.
- Los casos (app · objetivo · tipo de historia · clima):
  - Caso 1: Munify · Dar a conocer la marca · Marca y visión · Sobrio
  - Caso 2: Munify · Mostrar cómo funciona · Producto a la vista · Cotidiano
  - Caso 3: Munify · Conseguir consultas · Antes y después · Cálido
  - Caso 4: RepareHoy · Campaña completa · Un caso de principio a fin · Cotidiano
  - Caso 5: RepareHoy · Dar a conocer la marca · Situación con humor · Con humor
  - Caso 6: RepareHoy · Mostrar cómo funciona · Los dos lados · Cálido
  - Caso 7: sin vueltas ¡YA! · Dar a conocer la marca · Voz de una persona · Cálido
  - Caso 8: sin vueltas ¡YA! · Mostrar cómo funciona · Un caso de principio a fin · Aspiracional
  - Caso 9: Munify · Conseguir consultas · Producto a la vista · Sobrio
  - Caso 10: RepareHoy · Campaña completa · Antes y después · Con humor

---

## Caso 1 · Munify
**Elección del usuario:** objetivo «Dar a conocer la marca» · tipo de historia «Marca y visión» · clima «Sobrio». Formato: reel-hibrido-9-16.
**Rubro:** GovTech / gestion municipal (gobiernos locales)

### 1. Estrategia (la pieza que propuso)
- Ángulo: Reclamo sin respuesta
- Mensaje principal: El vecino no se enoja por el bache: se enoja porque nadie le avisa qué pasó con su reclamo.
- Brief creativo: Esta pieza abre con el dolor cotidiano del municipio: el reclamo que entra por mil canales informales y muere sin respuesta, mientras el vecino asume que no hicieron nada. El mensaje principal es que el silencio es el verdadero problema, y lo prueba mostrando el circuito de Munify: reclamo con foto y GPS, derivación automática por IA a la dependencia, resolución con foto antes y después y notificación al vecino en cada paso. Cierra presentando a Munify como la app que conecta al vecino con su municipio en tiempo real e invita a hablar con un asesor del equipo.
- Datos que lo sostienen: El vecino reporta problemas (bache, alumbrado, residuos, animales sueltos, ruidos) desde la app con foto y geolocalización GPS automática · La IA clasifica el reclamo y lo deriva a la dependencia correcta; el supervisor lo asigna a una cuadrilla · Se resuelve con foto antes y después, y el vecino recibe notificación en cada paso con número de seguimiento

### 2. Concepto (propuso varias; el caso toma la primera)
**ELEGIDA: El reclamo que rebota**
- tipoGancho: CONTRASTE DE CANALES
- idea: Un mismo pedido vecinal repetido en todos lados menos donde sirve: un mensaje al conocido que trabaja adentro, un comentario suelto en la calle, un llamado sin respuesta. Nada vuelve. Después, ese pedido entra una sola vez con foto y ubicación, llega al área que corresponde, se resuelve y el vecino recibe aviso. El silencio era el problema.
- tono: Sereno, directo, sin reproche; voz adulta que explica
- estetica: Vereda de pueblo y oficina municipal, luz natural, paleta sobria, encuadres limpios, pocos elementos, sin estridencia gráfica
- referencia: Spot institucional de servicio público, antes y después
- porQueFunciona: Muestra el desorden real del reclamo informal y lo ordena con una capacidad concreta de la marca.
**Alternativa 2: Dos verdades distintas**
- tipoGancho: DOBLE PERSPECTIVA
- idea: Una cuadrilla municipal termina un arreglo temprano y se va. A la tarde, la vecina de enfrente sigue convencida de que nadie fue nunca. Dos verdades que no se cruzan. Munify las une: el pedido queda registrado con ubicación, se deriva solo al área, se cierra con foto antes y después, y el vecino se entera.
- tono: Humano, respetuoso con el trabajo municipal, nada paternalista
- estetica: Dos líneas visuales paralelas, mañana de trabajo y tarde de barrio, colores reales, textura documental contenida
- referencia: Narrativa de dos puntos de vista que convergen
- porQueFunciona: Reivindica al municipio y ubica el valor donde está: avisar. Ideal para quien decide la compra.
**Alternativa 3: Recorrido de un pedido**
- tipoGancho: DEMOSTRACIÓN DIRECTA
- idea: Seguimos un solo pedido vecinal puertas adentro del municipio: entra desde un celular con foto y ubicación, la clasificación automática lo manda al área correcta, un supervisor lo asigna, la cuadrilla lo cierra con foto antes y después. En cada paso sale un aviso al vecino. Gestionar a la vista, también es gobernar.
- tono: Expositivo, preciso, con autoridad tranquila y voz institucional
- estetica: Interiores municipales reales, pasillos y escritorios, luz pareja, tipografía sobria para marcar cada etapa del circuito
- referencia: Pieza explicativa de proceso para decisor institucional
- porQueFunciona: Hace visible el circuito completo y convierte una promesa abstracta en trazabilidad comprobable para el municipio.

### 3. Guion
- **[hook]** No me molesta el bache. Me molesta el silencio. — _visual:_ Un hombre parado al borde de un pozo en la vereda, celular en la mano con la pantalla apagada.
- **[desarrollo]** Se lo dije a un conocido que trabaja adentro. Lo comenté en la esquina. Llamé dos veces. Y seguí sin saber si alguien lo había anotado. — _visual:_ Mensaje visto sin respuesta, charla corta con un vecino en la esquina, y un mostrador municipal donde el teléfono suena sin que nadie lo levante.
- **[giro]** Lo mandé una sola vez. Y esta vez me fueron avisando. — _visual:_ El reclamo con foto y ubicación entra en la pantalla de la dependencia, una cuadrilla trabajando en ese mismo pozo, y después el aviso con número de seguimiento llegando al celular del vecino junto a la foto del antes y el después.
- **[cta]** Munify. 3 meses gratis, sin compromiso ni tarjeta de crédito. — _visual:_ Placa final sobria con el logotipo Munify sobre fondo plano.
- Música pedida: mood: sobria, serena, institucional

### 4. Personajes
- **Vecino** (Protagonista que vive el reclamo sin respuesta y después la resolución): Man in his mid-forties, short dark hair greying at the temples, medium olive skin tone, calm tired expression, average build, plain weathered face suggesting a working routine, unremarkable everyday appearance · ropa: Plain buttoned shirt, work trousers, simple worn shoes
- Lugar: A modest town sidewalk with a visible pothole, bordered by simple houses, transitioning to a municipal office counter with a landline phone and a basic computer screen, plain walls, functional furniture, no decoration, natural daylight throughout

### 5. Storyboard
- **Escena 1** (hook, 4 s, medium close-up) · en cuadro: p1
  - Dice: No me molesta el bache. Me molesta el silencio.
  - Acción: El vecino mira el pozo y dice que lo que molesta es el silencio
  - Acción (para el generador): The man stands at the edge of the pothole, speaking directly to camera as if addressing someone from the neighborhood who finally listens. He wants to name the real problem, not the pothole itself but the lack of response. His expression is calm but firm, tired of being ignored. He holds his phone loosely at his side, screen off, not looking at it. He stays still, grounded on the cracked sidewalk, soft overcast daylight around him, modest houses faintly visible behind.
- **Escena 2** (desarrollo, 4 s, medium shot) · en cuadro: p1
  - Dice: Se lo dije a un conocido que trabaja adentro.
  - Acción: Cuenta que se lo dijo a un conocido que trabaja adentro
  - Acción (para el generador): The man speaks to camera with the tone of someone recounting a familiar frustration, almost resigned. He wants to explain that he tried the informal way first, through a personal contact inside the municipality, expecting that to be enough. His face shows mild disappointment as he recalls it not working. He stands on the same sidewalk near the pothole, body relaxed but voice steady, soft daylight unchanged from the previous moment.
- **Escena 3** (desarrollo, 2.5 s, wide shot) · en cuadro: p1
  - Dice: Lo comenté en la esquina.
  - Acción: Comenta el problema con un vecino en la esquina
  - Acción (para el generador): The man talks briefly with a neighbor at the corner, gesturing toward the direction of the pothole while explaining the situation. He wants a witness, someone else to acknowledge the problem exists, not expecting a real solution from the conversation. His tone is casual, almost like venting. The neighbor listens and nods without much reaction. The exchange happens quickly on the quiet residential street, modest houses and a lamp post in the background, natural daylight.
- **Escena 4** (desarrollo, 2 s, over-the-shoulder) · en cuadro: p1
  - Dice: Llamé dos veces.
  - Acción: Llama dos veces desde el mostrador municipal sin respuesta
  - Acción (para el generador): The man stands at a municipal office counter, a landline phone ringing unanswered beside a basic computer screen. He wants someone to pick up and confirm his complaint was registered, but no one appears. His patience visibly thins as he waits, arms resting on the counter, eyes fixed on the silent phone. The space is plain, functional furniture, no decoration, steady daylight coming through a window.
- **Escena 5** (desarrollo, 4 s, close-up) · en cuadro: p1
  - Dice: Y seguí sin saber si alguien lo había anotado.
  - Acción: Dice que siguió sin saber si alguien lo había anotado
  - Acción (para el generador): The man looks directly at camera, voice low and tired, summarizing the frustration of not knowing if his complaint ever reached anyone. He wants to express the core problem: uncertainty, not bureaucracy. His expression is still calm, but there's a quiet weight behind it. He remains at the same municipal counter, landline and computer screen visible but out of focus behind him, same steady daylight as before.
- **Escena 6** (giro, 1.5 s, close-up) · pantalla de la app: «Reclamo con foto y ubicación»
  - Dice: —
  - Acción: El reclamo con foto y ubicación entra en la pantalla municipal
- **Escena 7** (giro, 1.5 s, wide shot)
  - Dice: —
  - Acción: Una cuadrilla trabaja en el mismo pozo de la vereda
  - Acción (para el generador): A municipal work crew is seen repairing the same pothole from the beginning of the story, tools in motion, focused on the task. The moment is quiet but purposeful, no dialogue, just visible proof that the report led to real action. The street and houses match the earlier establishing scene, same overcast daylight, same pothole location now being fixed.
- **Escena 8** (giro, 1.5 s, close-up) · pantalla de la app: «Aviso de seguimiento con número»
  - Dice: —
  - Acción: Llega el aviso de seguimiento al celular del vecino
- **Escena 9** (giro, 1.5 s, close-up) · pantalla de la app: «Foto antes y después»
  - Dice: —
  - Acción: Se ve la foto del antes y el después del pozo
- **Escena 10** (giro, 5 s, medium close-up) · en cuadro: p1
  - Dice: Lo mandé una sola vez. Y esta vez me fueron avisando.
  - Acción: Dice que lo mandó una sola vez y le fueron avisando
  - Acción (para el generador): The man looks at his phone and then up, a small sense of relief in his expression, speaking as if sharing good news with someone close. He wants to acknowledge that this time was different: he reported once and was kept informed throughout. His posture relaxes slightly compared to the earlier scenes. He stands on the same sidewalk near the now-repaired pothole, soft daylight, calm and composed.
- **Escena 11** (cta, 1.5 s, plano s/d)
  - Dice: —
  - Acción: Placa final: Munifai. 3 meses gratis, sin compromiso ni tarjeta de crédito.

### 6. Pedidos a Google Flow (Veo 3), tal cual se mandan
- **Retrato de Vecino:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Man in his mid-forties, short dark hair greying at the temples, medium olive skin tone, calm tired expression, average build, plain weathered face suggesting a working routine, unremarkable everyday appearance, standing and looking at the camera, natural pose, neutral background with a hint of a modest town sidewalk with a visible pothole, bordered by simple houses. A still photo, no action, no dialogue.
- **Retrato de Presentadora:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine a friendly, confident woman presenter in her early thirties, natural makeup, warm smile, neat hair, an ordinary everyday face, standing and looking at the camera, natural pose, neutral background. A still photo, no action, no dialogue.
- **Escena 1** (hook):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vecino, an Argentine man in his mid-forties, short dark hair greying at the temples, medium olive skin tone, calm tired expression, wearing Plain buttoned shirt, work trousers, simple worn shoes. The man stands at the edge of the pothole, speaking directly to camera as if addressing someone from the neighborhood who finally listens. He wants to name the real problem, not the pothole itself but the lack of response. His expression is calm but firm, tired of being ignored. He holds his phone loosely at his side, screen off, not looking at it. He stays still, grounded on the cracked sidewalk, soft overcast daylight around him, modest houses faintly visible behind. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'No me molesta el bache. Me molesta el silencio.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 2** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vecino, an Argentine man in his mid-forties, short dark hair greying at the temples, medium olive skin tone, calm tired expression, wearing Plain buttoned shirt, work trousers, simple worn shoes. The man speaks to camera with the tone of someone recounting a familiar frustration, almost resigned. He wants to explain that he tried the informal way first, through a personal contact inside the municipality, expecting that to be enough. His face shows mild disappointment as he recalls it not working. He stands on the same sidewalk near the pothole, body relaxed but voice steady, soft daylight unchanged from the previous moment. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Se lo dije a un conocido que trabaja adentro.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 3** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vecino, an Argentine man in his mid-forties, short dark hair greying at the temples, medium olive skin tone, calm tired expression, wearing Plain buttoned shirt, work trousers, simple worn shoes. The man talks briefly with a neighbor at the corner, gesturing toward the direction of the pothole while explaining the situation. He wants a witness, someone else to acknowledge the problem exists, not expecting a real solution from the conversation. His tone is casual, almost like venting. The neighbor listens and nods without much reaction. The exchange happens quickly on the quiet residential street, modest houses and a lamp post in the background, natural daylight. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Lo comenté en la esquina.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Wide shot that shows the whole place, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 4** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vecino, an Argentine man in his mid-forties, short dark hair greying at the temples, medium olive skin tone, calm tired expression, wearing Plain buttoned shirt, work trousers, simple worn shoes. The man stands at a municipal office counter, a landline phone ringing unanswered beside a basic computer screen. He wants someone to pick up and confirm his complaint was registered, but no one appears. His patience visibly thins as he waits, arms resting on the counter, eyes fixed on the silent phone. The space is plain, functional furniture, no decoration, steady daylight coming through a window. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Llamé dos veces.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Over-the-shoulder shot, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 5** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vecino, an Argentine man in his mid-forties, short dark hair greying at the temples, medium olive skin tone, calm tired expression, wearing Plain buttoned shirt, work trousers, simple worn shoes. The man looks directly at camera, voice low and tired, summarizing the frustration of not knowing if his complaint ever reached anyone. He wants to express the core problem: uncertainty, not bureaucracy. His expression is still calm, but there's a quiet weight behind it. He remains at the same municipal counter, landline and computer screen visible but out of focus behind him, same steady daylight as before. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Y seguí sin saber si alguien lo había anotado.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Close-up on the face and hands, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 7** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Location: A modest town sidewalk with a visible pothole, bordered by simple houses, transitioning to a municipal office counter with a landline phone and a basic computer screen, plain walls, functional furniture, no decoration, natural daylight throughout. A municipal work crew is seen repairing the same pothole from the beginning of the story, tools in motion, focused on the task. The moment is quiet but purposeful, no dialogue, just visible proof that the report led to real action. The street and houses match the earlier establishing scene, same overcast daylight, same pothole location now being fixed. No spoken dialogue, ambient sound only. One single continuous take, same background, no cut. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 10** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vecino, an Argentine man in his mid-forties, short dark hair greying at the temples, medium olive skin tone, calm tired expression, wearing Plain buttoned shirt, work trousers, simple worn shoes. The man looks at his phone and then up, a small sense of relief in his expression, speaking as if sharing good news with someone close. He wants to acknowledge that this time was different: he reported once and was kept informed throughout. His posture relaxes slightly compared to the earlier scenes. He stands on the same sidewalk near the now-repaired pothole, soft daylight, calm and composed. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Lo mandé una sola vez. Y esta vez me fueron avisando.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 90** (cierre):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Presentadora, a friendly, confident woman presenter, stands in a bright, clean, modern space with soft light and a softly blurred background. She looks straight into the camera, smiles and starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Munify. Munify. 3 meses gratis, sin compromiso ni tarjeta de crédito.' Warm, close and confident, like a presenter closing a commercial. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, eye level, static camera with a very subtle slow push-in. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.


### 7. Director de montaje (IA) — sobre las escenas del storyboard
- Diagnóstico: Spot institucional de reclamo sin respuesta: la fuerza está en la acumulación de intentos fallidos (escenas 2 a 5) y en el alivio del aviso que sí llega; sólo necesita marcar el vacío antes del giro y suavizar la entrada al tramo resolutivo.
- Decisión: **music_dip** en la escena 5 (final, 0.8 s) — La frase 'sin saber si alguien lo había anotado' termina en incertidumbre; bajar la música deja el final de esa línea en el aire antes del giro.
- Decisión: **dissolve** en la escena 6 (antes, 0.6 s) — Pasaje del tramo de intentos fallidos al reclamo que sí entra al sistema: el corte seco marcaría quiebre, el dissolve lo lee como continuidad del mismo pedido.
- Decisión: **music_lift** en la escena 8 (inicio, 0.7 s) — Tramo del giro sin diálogo donde se ve el trabajo sobre el mismo pozo; la música puede sostener la evidencia visual sin pisar ninguna voz.
- Decisión: **cut** en la escena 10 (antes) — La voz vuelve con 'Lo mandé una sola vez'; el corte seco devuelve al vecino al centro sin dilatar el remate.

---

## Caso 2 · Munify
**Elección del usuario:** objetivo «Mostrar cómo funciona» · tipo de historia «Producto a la vista» · clima «Cotidiano». Formato: reel-hibrido-9-16.
**Rubro:** GovTech / gestion municipal (gobiernos locales)

### 1. Estrategia (la pieza que propuso)
- Ángulo: Del bache resuelto
- Mensaje principal: En Munify, el reclamo del vecino entra desde el celular con foto y GPS, se deriva solo a la dependencia correcta y se cierra con foto antes y después, notificando al vecino en cada paso.
- Brief creativo: Esta pieza recorre en pantalla un solo caso de punta a punta: el vecino saca la foto del bache en la app y el reclamo aparece clasificado, asignado a la cuadrilla y cerrado con el antes y después, mientras el municipio lo ve en el mapa en vivo. El mensaje principal es que el circuito del reclamo deja de depender de llamados y papeles porque el sistema lo deriva y lo documenta solo. Prueba la parte de la propuesta que conecta al vecino con su municipio en tiempo real, y aclara que ese módulo vive dentro del mismo sistema con login único de Munify.
- Datos que lo sostienen: El vecino reporta problemas (bache, alumbrado, residuos, animales sueltos, ruidos) desde la app con foto y geolocalización GPS automática · La IA clasifica el reclamo y lo deriva a la dependencia correcta; el supervisor lo asigna a una cuadrilla · Se resuelve con fotos antes/después y el vecino recibe notificación en cada paso con número de seguimiento · Dashboard en vivo y mapa con hotspots; modo offline para cuadrillas

### 2. Concepto (propuso varias; el caso toma la primera)
**ELEGIDA: Un bache resuelto**
- tipoGancho: DEMOSTRACIÓN DIRECTA
- idea: Una vecina esquiva un bache camino al trabajo, lo fotografía desde la app y sigue. En el municipio el reclamo aparece clasificado y ubicado; el supervisor lo asigna a una cuadrilla que lo cierra con foto del antes y el después. A la tarde ella pasa por la esquina reparada y recibe el aviso.
- tono: Claro, activo, cotidiano; voces naturales, sin solemnidad
- estetica: Luz natural de barrio y oficina municipal real, cámara en mano serena, paleta sobria, pantallas del sistema sugeridas sin textos inventados.
- referencia: Demo de producto contada como caso real
- porQueFunciona: Un solo caso cerrado prueba el circuito completo y deja ver el beneficio sin explicarlo.
**Alternativa 2: Dos pantallas, mismo reclamo**
- tipoGancho: DOBLE PERSPECTIVA
- idea: Dos realidades en paralelo: un vecino reporta alumbrado roto frente a su casa y, en la secretaría, una directora de modernización ve ese pedido entrar al mapa de la ciudad junto a los demás. Deriva, se resuelve, se documenta. Ella entra con el mismo login con que mira la agenda y la plata del municipio.
- tono: Sereno, informativo, confiado; diálogo breve y concreto
- estetica: Pantalla partida vertical entre calle nocturna y oficina iluminada; textura documental, grises institucionales, interfaces aludidas de forma conceptual.
- referencia: Spot institucional de doble punto de vista
- porQueFunciona: Muestra a la vez el alivio del vecino y el control del municipio, hablándole al decisor.
**Alternativa 3: La cuadrilla documenta**
- tipoGancho: OBSERVACIÓN COTIDIANA
- idea: Camioneta, pala y un celular. El capataz abre el trabajo que le llegó asignado, saca la foto previa, el equipo tapa el pozo y saca la de después, todo desde la calle y sin señal. Nadie anota nada en papel ni llama a la oficina: el reclamo se cierra solo y el vecino se entera.
- tono: Terrenal, respetuoso con el oficio, sin épica
- estetica: Mañana de calle de tierra y asfalto, polvo, chalecos reflectivos, manos y celular en primer plano, registro documental sin estilizar.
- referencia: Pieza documental de trabajo en campo
- porQueFunciona: Valida el circuito desde quien ejecuta: la prueba es el antes y después hecho en obra.

### 3. Guion
- **[hook]** Otra vez. Este pozo ya es parte del barrio. — _visual:_ Marcela esquiva un bache camino al trabajo, se detiene en el cordón y encuadra el pozo con el celular antes de seguir.
- **[desarrollo]** Mirá, llegó con la foto y la esquina marcada. Vialidad. — _visual:_ Oficina municipal con luz de ventana; Darío gira el monitor hacia su compañera y señala el reclamo ubicado en el mapa.
- **[desarrollo]** Tengo una cuadrilla a dos cuadras. Se lo paso. — _visual:_ Nadia asigna el reclamo desde su puesto mientras levanta el handy sin dejar de mirar la pantalla.
- **[desarrollo]** (sin texto) — _visual:_ La cuadrilla alisa el parche y uno de los operarios saca la foto del asfalto terminado desde el celular de trabajo.
- **[giro]** Mirá vos. Lo arreglaron. Y me avisaron a mí. — _visual:_ Marcela cruza la esquina reparada a la tarde, frena al ver el asfalto nuevo y lee el aviso en el celular con las fotos del antes y el después.
- **[cta]** Munify: 3 meses gratis, sin compromiso ni tarjeta de crédito. — _visual:_ Placa final sobre fondo sobrio con el logotipo de Munify.
- Música pedida: mood: cálido cotidiano, sobrio

### 4. Personajes
- **Marcela** (Vecina que reporta el bache y recibe el cierre del reclamo): Woman in her mid-30s, shoulder-length dark brown hair tied back loosely, light-olive skin tone, warm brown eyes, natural everyday makeup, average build, walks with brisk purposeful energy typical of a morning commute · ropa: Light jacket, crossbody bag, casual urban sneakers
- **Darío** (Empleado municipal que recibe y ubica el reclamo en el sistema): Man in his early 40s, short dark hair with light gray at the temples, medium skin tone, clean-shaven, calm attentive expression, seated posture typical of office work · ropa: Light plain collared shirt, no tie
- **Nadia** (Supervisora que asigna el reclamo a la cuadrilla): Woman in her late 30s, black hair pulled into a low ponytail, medium-brown skin tone, focused expression, seated at a desk with confident efficient posture · ropa: Institutional polo shirt, handheld radio in hand
- Lugar: Two connected real settings: a modest municipal office with desks, computer monitors, and window daylight, and a residential street corner with a repaired patch of asphalt, parked cars, and plain building facades, both lit with natural daytime light

### 5. Storyboard
- **Escena 1** (hook, 5 s, handheld follow) · en cuadro: p1
  - Dice: Otra vez. Este pozo ya es parte del barrio.
  - Acción: Marcela esquiva el pozo y lo fotografía antes de seguir
  - Acción (para el generador): Marcela is annoyed and resigned at finding the same pothole on her way to work, as if greeting an old problem. She speaks to herself, almost to the street itself, with weary familiarity. She steps around the pothole, pauses at the curb, raises her phone to frame the damaged asphalt, then lowers it and keeps walking. The residential street corner, morning natural light, parked cars and modest building facades behind her.
- **Escena 2** (desarrollo, 5 s, over-the-shoulder) · en cuadro: p2
  - Dice: Mirá, llegó con la foto y la esquina marcada. Vialidad.
  - Acción: Darío gira el monitor y le muestra el reclamo ubicado
  - Acción (para el generador): Darío wants to show his coworker that the claim just came in complete and ready to act on, with calm professional satisfaction. He speaks directly to her, turning the monitor so she can see the map with the located claim, pointing toward the screen without looking away from her. The municipal office has window daylight, an orderly but modest public setting, another coworker nearby.
- **Escena 3** (desarrollo, 5 s, medium shot) · en cuadro: p3
  - Dice: Tengo una cuadrilla a dos cuadras. Se lo paso.
  - Acción: Nadia asigna el reclamo y levanta el handy sin despegar la vista
  - Acción (para el generador): Nadia wants to resolve the claim fast, speaking to Darío with quick efficient confidence as she acts on it in real time. She keeps her eyes on her screen while she reaches for the handheld radio, lifting it toward her mouth without breaking focus on the assignment she is making. Same municipal office, window daylight, desk with computer screen showing the assigned claim.
- **Escena 4** (desarrollo, 2 s, wide shot)
  - Dice: —
  - Acción: La cuadrilla termina el parche y fotografía el asfalto
  - Acción (para el generador): A worker from the municipal crew feels quiet satisfaction at finishing the job properly, working alongside a teammate who smooths the last bit of fresh asphalt. Without speaking, one of them steps back, raises a work phone and photographs the finished patch as proof of the completed repair. The same residential street corner, daytime natural light, parked cars and plain building facades in the background.
- **Escena 5** (giro, 5 s, medium close-up) · en cuadro: p1
  - Dice: Mirá vos. Lo arreglaron. Y me avisaron a mí.
  - Acción: Marcela ve el asfalto nuevo y lee el aviso en su celular
  - Acción (para el generador): Marcela feels genuine surprise and quiet satisfaction at seeing the pothole gone, speaking to herself with a tone of pleasant disbelief. She stops walking as she notices the new asphalt, then looks down at her phone and reads the notification with the before and after photos, her expression softening into a small smile. The same residential street corner, now repaired, afternoon natural light.
- **Escena 6** (cta, 3.5 s, plano s/d)
  - Dice: —
  - Acción: Munify: 3 meses gratis, sin compromiso ni tarjeta de crédito

### 6. Pedidos a Google Flow (Veo 3), tal cual se mandan
- **Retrato de Marcela:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman in her mid-30s, shoulder-length dark brown hair tied back loosely, light-olive skin tone, warm brown eyes, natural everyday makeup, average build, walks with brisk purposeful energy typical of a morning commute, standing and looking at the camera, natural pose, neutral background with a hint of two connected real settings: a modest municipal office with desks, computer monitors. A still photo, no action, no dialogue.
- **Retrato de Darío:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Man in his early 40s, short dark hair with light gray at the temples, medium skin tone, clean-shaven, calm attentive expression, seated posture typical of office work, standing and looking at the camera, natural pose, neutral background with a hint of two connected real settings: a modest municipal office with desks, computer monitors. A still photo, no action, no dialogue.
- **Retrato de Nadia:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman in her late 30s, black hair pulled into a low ponytail, medium-brown skin tone, focused expression, seated at a desk with confident efficient posture, standing and looking at the camera, natural pose, neutral background with a hint of two connected real settings: a modest municipal office with desks, computer monitors. A still photo, no action, no dialogue.
- **Retrato de Presentadora:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine a friendly, confident woman presenter in her early thirties, natural makeup, warm smile, neat hair, an ordinary everyday face, standing and looking at the camera, natural pose, neutral background. A still photo, no action, no dialogue.
- **Escena 1** (hook):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marcela, an Argentine woman in her mid-30s, shoulder-length dark brown hair tied back loosely, light-olive skin tone, warm brown eyes, wearing Light jacket, crossbody bag, casual urban sneakers. Marcela is annoyed and resigned at finding the same pothole on her way to work, as if greeting an old problem. She speaks to herself, almost to the street itself, with weary familiarity. She steps around the pothole, pauses at the curb, raises her phone to frame the damaged asphalt, then lowers it and keeps walking. The residential street corner, morning natural light, parked cars and modest building facades behind her. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Otra vez. Este pozo ya es parte del barrio.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Handheld camera following the movement, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 2** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Darío, an Argentine man in his early 40s, short dark hair with light gray at the temples, medium skin tone, clean-shaven, wearing Light plain collared shirt, no tie. Darío wants to show his coworker that the claim just came in complete and ready to act on, with calm professional satisfaction. He speaks directly to her, turning the monitor so she can see the map with the located claim, pointing toward the screen without looking away from her. The municipal office has window daylight, an orderly but modest public setting, another coworker nearby. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Mirá, llegó con la foto y la esquina marcada. Vialidad.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Over-the-shoulder shot, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 3** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Nadia, an Argentine woman in her late 30s, black hair pulled into a low ponytail, medium-brown skin tone, focused expression, wearing Institutional polo shirt, handheld radio in hand. Nadia wants to resolve the claim fast, speaking to Darío with quick efficient confidence as she acts on it in real time. She keeps her eyes on her screen while she reaches for the handheld radio, lifting it toward her mouth without breaking focus on the assignment she is making. Same municipal office, window daylight, desk with computer screen showing the assigned claim. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Tengo una cuadrilla a dos cuadras. Se lo paso.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 4** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Location: Two connected real settings: a modest municipal office with desks, computer monitors, and window daylight, and a residential street corner with a repaired patch of asphalt, parked cars, and plain building facades, both lit with natural daytime light. A worker from the municipal crew feels quiet satisfaction at finishing the job properly, working alongside a teammate who smooths the last bit of fresh asphalt. Without speaking, one of them steps back, raises a work phone and photographs the finished patch as proof of the completed repair. The same residential street corner, daytime natural light, parked cars and plain building facades in the background. No spoken dialogue, ambient sound only. One single continuous take, same background, no cut. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 5** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marcela, an Argentine woman in her mid-30s, shoulder-length dark brown hair tied back loosely, light-olive skin tone, warm brown eyes, wearing Light jacket, crossbody bag, casual urban sneakers. Marcela feels genuine surprise and quiet satisfaction at seeing the pothole gone, speaking to herself with a tone of pleasant disbelief. She stops walking as she notices the new asphalt, then looks down at her phone and reads the notification with the before and after photos, her expression softening into a small smile. The same residential street corner, now repaired, afternoon natural light. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Mirá vos. Lo arreglaron. Y me avisaron a mí.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 90** (cierre):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Presentadora, a friendly, confident woman presenter, stands in a bright, clean, modern space with soft light and a softly blurred background. She looks straight into the camera, smiles and starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Munify. Munify: 3 meses gratis, sin compromiso ni tarjeta de crédito.' Warm, close and confident, like a presenter closing a commercial. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, eye level, static camera with a very subtle slow push-in. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.


### 7. Director de montaje (IA) — sobre las escenas del storyboard
- Diagnóstico: Es una demo contada como caso real: el valor está en que se entienda el circuito completo (foto y GPS, derivación a Vialidad, asignación a cuadrilla, cierre con antes y después), así que el montaje debe sostener la inteligibilidad y marcar sólo dos momentos: el trabajo sin diálogo y la reacción de Marcela.
- Decisión: **music_dip** en la escena 2 (inicio, 0.5 s) — Darío gira el monitor y nombra los datos clave ('la foto y la esquina marcada. Vialidad'); bajar la música deja clara la primera explicación del circuito.
- Decisión: **cut** en la escena 3 (antes) — El pase de oficina a puesto de supervisión es un cambio de responsable en el mismo trámite; corte seco para que se lea como continuidad de proceso y no como elipsis.
- Decisión: **music_lift** en la escena 4 (inicio, 0.8 s) — Es la única escena sin diálogo: la cuadrilla alisando el parche y la foto del asfalto terminado sostienen el momento visualmente y la música puede empujar sin tapar voz.
- Decisión: **music_drop** en la escena 5 (inicio, 0.6 s) — Marcela frena al ver el asfalto nuevo antes de hablar; el vacío breve apoya esa reacción genuina y hace que 'Y me avisaron a mí' caiga limpio.
- Decisión: **cut** en la escena 5 (final) — La placa de Munify debe entrar con corte seco después de que ella lee el aviso, para que el cierre de marca sea neto y no se diluya en un fundido.

---

## Caso 3 · Munify
**Elección del usuario:** objetivo «Conseguir consultas» · tipo de historia «Antes y después» · clima «Cálido». Formato: reel-hibrido-9-16.
**Rubro:** GovTech / gestion municipal (gobiernos locales)

### 1. Estrategia (la pieza que propuso)
- Ángulo: Tres meses gratis
- Mensaje principal: El municipio puede probar Munify tres meses gratis, con datos reales y sin tarjeta de crédito, y decidir después.
- Brief creativo: Esta pieza ataca la objeción de presupuesto desde la oferta: antes de firmar nada, el municipio usa el combo de Reclamos, Trámites y Gestión Financiera tres meses gratis con sus propios datos. Deja claro qué es Munify —un solo sistema donde el vecino reclama, tramita y paga desde el celular mientras el municipio ordena su gestión adentro— y prueba que probarlo no exige presupuesto ni permanencia. Cierra invitando a hablar con un asesor del equipo para activar los 3 meses y conocer el precio por habitante según el tamaño del municipio.
- Datos que lo sostienen: Combo 3 módulos (Reclamos + Trámites + Gestión Financiera): 3 meses gratis sin compromiso ni tarjeta de crédito · Precio combinado menor a la suma de los módulos sueltos; el municipio paga por habitante, en pesos argentinos, sin permanencia · La app es gratis para el vecino (Play Store, App Store, PWA y bot de WhatsApp) · El precio exacto lo confirma un asesor del equipo según el tamaño del municipio

### 2. Concepto (propuso varias; el caso toma la primera)
**ELEGIDA: Mismo escritorio, dos semanas**
- tipoGancho: CONTRASTE VISUAL
- idea: En una oficina municipal llena de carpetas, un secretario intenta averiguar en qué quedó un reclamo y nadie sabe decirle. Semanas después, el mismo escritorio: el pedido llegó a la dependencia correcta, se resolvió con foto y el vecino quedó avisado. Lo probaron tres meses gratis, con datos propios, antes de decidir nada.
- tono: Conversado, sobrio, sin reproche; alivio contenido al final
- estetica: Oficina real de pueblo, luz de ventana, madera gastada, pilas de papel que se vacían; paleta cálida y cámara a la altura de la persona
- referencia: Spot institucional de contraste en una sola locación
- porQueFunciona: El mismo lugar antes y después prueba el cambio sin inventar cifras ni promesas.
**Alternativa 2: Dos lados del mostrador**
- tipoGancho: DOBLE PERSPECTIVA
- idea: Una vecina recuerda lo que era reclamar: llamar, volver, preguntar en la esquina. Del otro lado del mostrador, la empleada que recibía el papel y no tenía cómo avisarle. Después, el mismo pedido viaja desde el celular al panel y la respuesta vuelve sola. El municipio lo usó tres meses gratis antes de pagar nada.
- tono: Humano, cercano, con complicidad entre dos mujeres comunes
- estetica: Vereda de barrio y mostrador municipal en luz natural; encuadres simples, detalles cotidianos, música discreta que no subraya la emoción
- referencia: Pieza de servicio público contada en dos voces
- porQueFunciona: Muestra el beneficio para vecino y municipio a la vez, y vuelve tangible la prueba gratuita.
**Alternativa 3: No hay presupuesto**
- tipoGancho: INVERSIÓN DE EXPECTATIVA
- idea: Una directora de modernización corta la reunión: este año no hay presupuesto. En lugar de insistir, le proponen cargar los datos del municipio y usar reclamos, trámites y gestión financiera tres meses, sin tarjeta ni permanencia. Terminado el período, ella compara cómo trabajaban antes y cómo ahora, y recién entonces pide hablar del precio.
- tono: Directo, respetuoso, escepticismo que afloja de a poco
- estetica: Sala de reuniones chica con ventanal, mate, carpetas; luz de tarde, cámara quieta, paleta cálida y nada de decorado corporativo
- referencia: Spot B2B de objeción resuelta en una escena
- porQueFunciona: Ataca la objeción de presupuesto de frente y deja clara la invitación a consultar.

### 3. Guion
- **[hook]** ¿Alguien sabe en qué quedó el reclamo de Nélida? — _visual:_ Escritorio de madera tapado de carpetas; Ramiro con el teléfono apoyado en el hombro, esperando que alguien le conteste.
- **[desarrollo]** Estaba en esa carpeta. O en la de arriba. — _visual:_ Silvana levanta una pila de papeles, mira abajo y vuelve a apoyarla en el mismo lugar.
- **[desarrollo]** Lo pusimos a prueba tres meses, con nuestros reclamos, sin poner un peso. — _visual:_ Mismo escritorio semanas después, con luz de ventana, una sola carpeta y espacio libre donde antes había pilas.
- **[giro]** Nélida ya sabe. Le llegó la foto al celular. — _visual:_ En la pantalla, el reclamo cerrado con las fotos de antes y después; Ramiro se recuesta en la silla y suelta el aire.
- **[cta]** Munify: 3 meses gratis, sin compromiso ni tarjeta de crédito. — _visual:_ Placa final sobre fondo cálido con el logo de Munify.
- Música pedida: mood: cálido, contenido

### 4. Personajes
- **Ramiro** (Secretario municipal que busca el estado de un reclamo): Man in his late 40s, short graying hair, olive skin tone, tired eyes, light stubble, medium build, sitting posture suited to desk work, calm but worn expression typical of long office days. · ropa: Light-colored shirt, sleeves rolled up, worn dress pants
- **Silvana** (Empleada administrativa que busca el papel del reclamo): Woman in her early 40s, dark hair tied back loosely, olive skin tone, practical appearance, minimal makeup, slightly tired but attentive expression, comfortable administrative office attire. · ropa: Simple blouse, thin cardigan, comfortable trousers
- Lugar: A modest small-town municipal office with a worn wooden desk by a window, stacks of paper folders, an old computer monitor, warm afternoon light filtering through glass, walls with faded municipal notices, a lived-in bureaucratic atmosphere.

### 5. Storyboard
- **Escena 1** (hook, 5.5 s, medium shot) · en cuadro: p1
  - Dice: ¿Alguien sabe en qué quedó el reclamo de Nélida?
  - Acción: Ramiro pregunta por teléfono qué pasó con un reclamo
  - Acción (para el generador): Ramiro is on a work call, phone wedged between his ear and shoulder so his hands stay free, waiting for someone on the other end to answer him. He asks about the status of a resident's complaint with the tired patience of someone who has made this same call before. He sits at his desk surrounded by stacked paper folders, eyes scanning the mess in front of him as he waits, warm afternoon light from the window falling across the worn wood surface of the municipal office.
- **Escena 2** (desarrollo, 5.5 s, medium close-up) · en cuadro: p2
  - Dice: Estaba en esa carpeta. O en la de arriba.
  - Acción: Silvana levanta una pila de carpetas y la vuelve a dejar
  - Acción (para el generador): Silvana is trying to locate one specific paper among many, speaking to Ramiro off to the side as she searches. She lifts a stack of folders near the desk, glances underneath without real confidence of finding anything, and sets the pile back down in the same spot, resigned to not knowing exactly where it is. Her tone is practical rather than frustrated, like someone used to this kind of search. She stands beside the same wooden desk by the window, warm light falling over the stacked folders in the municipal office.
- **Escena 3** (desarrollo, 5.5 s, wide shot) · en cuadro: p1
  - Dice: Lo pusimos a prueba tres meses, con nuestros reclamos, sin poner un peso.
  - Acción: Ramiro habla desde el mismo escritorio, ahora despejado
  - Acción (para el generador): Ramiro is explaining to someone off-camera that they tried the system for three months using their own complaints, without paying anything, speaking with the calm confidence of someone reporting a result rather than selling something. He sits at the same wooden desk, but weeks later, the surface now mostly clear, only a single folder remaining where piles used to sit. The warm window light is the same as before, giving a quiet sense of the same place with less clutter and less weight.
- **Escena 4** (giro, 5.5 s, medium shot) · en cuadro: p2
  - Dice: Nélida ya sabe. Le llegó la foto al celular.
  - Acción: Silvana cuenta que Nélida ya recibió la foto
  - Acción (para el generador): Silvana is telling Ramiro that Nélida already knows the outcome, that the photo reached her phone, with the quiet satisfaction of someone confirming that something finally worked. She speaks directly to him, standing near the same desk, holding her own phone loosely at her side rather than showing it to camera. Her expression is calm, almost relieved, the kind of small win that doesn't need to be celebrated loudly. Same warm window light, same municipal office.
- **Escena 5** (giro, 1.5 s, close-up) · en cuadro: p1
  - Dice: —
  - Acción: Ramiro se recuesta en la silla y suelta el aire
  - Acción (para el generador): Ramiro reacts to what Silvana just told him, leaning back in his chair and letting out a breath, the physical release of someone who no longer has to chase down an answer. There's no one else to perform for here, it's just his own quiet relief settling in for a second. He stays seated at the same desk, same warm window light, the folder beside him a small reminder of how little is left to sort through now.
- **Escena 6** (cta, 3.5 s, plano s/d)
  - Dice: —
  - Acción: Munify: 3 meses gratis, sin compromiso ni tarjeta de crédito

### 6. Pedidos a Google Flow (Veo 3), tal cual se mandan
- **Retrato de Ramiro:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Man in his late 40s, short graying hair, olive skin tone, tired eyes, light stubble, medium build, sitting posture suited to desk work, calm but worn expression typical of long office days, standing and looking at the camera, natural pose, neutral background with a hint of a modest small-town municipal office with a worn wooden desk by a window. A still photo, no action, no dialogue.
- **Retrato de Silvana:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman in her early 40s, dark hair tied back loosely, olive skin tone, practical appearance, minimal makeup, slightly tired but attentive expression, comfortable administrative office attire, standing and looking at the camera, natural pose, neutral background with a hint of a modest small-town municipal office with a worn wooden desk by a window. A still photo, no action, no dialogue.
- **Retrato de Presentadora:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine a friendly, confident woman presenter in her early thirties, natural makeup, warm smile, neat hair, an ordinary everyday face, standing and looking at the camera, natural pose, neutral background. A still photo, no action, no dialogue.
- **Escena 1** (hook):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Ramiro, an Argentine man in his late 40s, short graying hair, olive skin tone, tired eyes, light stubble, medium build, wearing Light-colored shirt, sleeves rolled up, worn dress pants. Ramiro is on a work call, phone wedged between his ear and shoulder so his hands stay free, waiting for someone on the other end to answer him. He asks about the status of a resident's complaint with the tired patience of someone who has made this same call before. He sits at his desk surrounded by stacked paper folders, eyes scanning the mess in front of him as he waits, warm afternoon light from the window falling across the worn wood surface of the municipal office. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: '¿Alguien sabe en qué quedó el reclamo de Nélida?' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 2** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Silvana, an Argentine woman in her early 40s, dark hair tied back loosely, olive skin tone, practical appearance, minimal makeup, wearing Simple blouse, thin cardigan, comfortable trousers. Silvana is trying to locate one specific paper among many, speaking to Ramiro off to the side as she searches. She lifts a stack of folders near the desk, glances underneath without real confidence of finding anything, and sets the pile back down in the same spot, resigned to not knowing exactly where it is. Her tone is practical rather than frustrated, like someone used to this kind of search. She stands beside the same wooden desk by the window, warm light falling over the stacked folders in the municipal office. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Estaba en esa carpeta. O en la de arriba.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 3** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Ramiro, an Argentine man in his late 40s, short graying hair, olive skin tone, tired eyes, light stubble, medium build, wearing Light-colored shirt, sleeves rolled up, worn dress pants. Ramiro is explaining to someone off-camera that they tried the system for three months using their own complaints, without paying anything, speaking with the calm confidence of someone reporting a result rather than selling something. He sits at the same wooden desk, but weeks later, the surface now mostly clear, only a single folder remaining where piles used to sit. The warm window light is the same as before, giving a quiet sense of the same place with less clutter and less weight. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Lo pusimos a prueba tres meses, con nuestros reclamos, sin poner un peso.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Wide shot that shows the whole place, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 4** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Silvana, an Argentine woman in her early 40s, dark hair tied back loosely, olive skin tone, practical appearance, minimal makeup, wearing Simple blouse, thin cardigan, comfortable trousers. Silvana is telling Ramiro that Nélida already knows the outcome, that the photo reached her phone, with the quiet satisfaction of someone confirming that something finally worked. She speaks directly to him, standing near the same desk, holding her own phone loosely at her side rather than showing it to camera. Her expression is calm, almost relieved, the kind of small win that doesn't need to be celebrated loudly. Same warm window light, same municipal office. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Nélida ya sabe. Le llegó la foto al celular.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 5** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Ramiro, an Argentine man in his late 40s, short graying hair, olive skin tone, tired eyes, light stubble, medium build, wearing Light-colored shirt, sleeves rolled up, worn dress pants. Ramiro reacts to what Silvana just told him, leaning back in his chair and letting out a breath, the physical release of someone who no longer has to chase down an answer. There's no one else to perform for here, it's just his own quiet relief settling in for a second. He stays seated at the same desk, same warm window light, the folder beside him a small reminder of how little is left to sort through now. No dialogue: ambient sound only. Close-up on the face and hands, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 90** (cierre):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Presentadora, a friendly, confident woman presenter, stands in a bright, clean, modern space with soft light and a softly blurred background. She looks straight into the camera, smiles and starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Munify. Munify: 3 meses gratis, sin compromiso ni tarjeta de crédito.' Warm, close and confident, like a presenter closing a commercial. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, eye level, static camera with a very subtle slow push-in. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.


### 7. Director de montaje (IA) — sobre las escenas del storyboard
- Diagnóstico: Un spot institucional de una sola locación donde todo el peso está en el salto temporal del mismo escritorio: el montaje sólo tiene que hacer legible ese cambio y dejar respirar la reacción final.
- Decisión: **dissolve** en la escena 3 (antes, 0.7 s) — El corte entre escena 2 y 3 es el mismo escritorio en dos momentos distintos: la disolvencia hace perceptible el paso de semanas y el vaciado de las pilas de papel sin recurrir a placas ni trucos.
- Decisión: **music_dip** en la escena 4 (inicio, 0.6 s) — La frase 'Nélida ya sabe' es el remate de la historia y se dice en voz baja; bajar la música deja la línea limpia y sostiene el alivio contenido.
- Decisión: **music_lift** en la escena 5 (inicio, 0.8 s) — La escena 5 no tiene diálogo y cierra sobre la placa con el logo: el realce da un final claro a la marca sin tapar nada.

---

## Caso 4 · RepareHoy
**Elección del usuario:** objetivo «Campaña completa» · tipo de historia «Un caso de principio a fin» · clima «Cotidiano». Formato: reel-hibrido-9-16.
**Rubro:** AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Los textos no nombran ningún barrio.

### 1. Estrategia (la pieza que propuso)
- Ángulo: Dejar de perseguir
- Mensaje principal: Arreglar algo en tu casa no tendría que ser perseguir a alguien por WhatsApp: en RepareHoy publicás el problema y los presupuestos te llegan solos.
- Brief creativo: Esta pieza instala un solo dolor: la rutina de mandar mensajes y esperar que alguien conteste. Cierra presentando RepareHoy como el lugar donde se invierte ese flujo, el problema se publica una vez y los presupuestos llegan solos. Prueba la parte de la propuesta que dice que el cliente no corre atrás de nadie.
- Datos que lo sostienen: Contra qué compite: el WhatsApp y la confianza a ciegas, el plomero que no contesta, la seña por transferencia a un alias, el presupuesto que cambia cuando ya empezó · El cliente cuenta el problema en sus palabras y recibe hasta tres presupuestos de profesionales verificados de su zona · El cliente no persigue a nadie: publica el problema y le llegan los presupuestos · Marketplace de oficios para el hogar en el AMBA

### 2. Concepto (propuso varias; el caso toma la primera)
**ELEGIDA: Tres días esperando**
- tipoGancho: CONTRASTE COTIDIANO
- idea: Una mujer convive tres días con una canilla que pierde y una lista de mensajes sin responder; cada vez que suena el teléfono no es nadie. Cansada, cuenta el problema en la app una sola vez y deja de mirar la pantalla. Cuando vuelve, la espera cambió de lado: los presupuestos llegaron solos.
- tono: Resignación que se afloja; nada de euforia, alivio contenido
- estetica: Departamento real, luz de ventana, baño chico; insertos de las pantallas Contar el problema y Te esperan tus proveedores
- referencia: Spot de servicio con relato observacional en primera persona
- porQueFunciona: Muestra el antes y el después del mismo gesto: dejar de escribir y recibir presupuestos.
**Alternativa 2: La hija interviene**
- tipoGancho: VÍNCULO HUMANO
- idea: Un padre y su hija comparten mesa: él repite el mismo mensaje a tres contactos por una persiana trabada y ninguno contesta. La hija no lo reta, le pasa el teléfono con el pedido ya publicado. Él vuelve a comer y el aviso que entra después no lo escribió él: son presupuestos para comparar.
- tono: Diálogo breve, cariño sin bajada de línea, naturalidad familiar
- estetica: Cocina de casa de familia, sobremesa, celulares sobre la mesa; inserto de Te esperan tus proveedores en la pantalla del padre
- referencia: Publicidad de escena familiar con descubrimiento compartido
- porQueFunciona: El cambio lo valida otra persona: se entiende sin explicar y el padre conserva la decisión.
**Alternativa 3: Dos pantallas comparadas**
- tipoGancho: DEMOSTRACIÓN DIRECTA
- idea: Un hombre sentado al borde de la bañera muestra a cámara su propia prueba: la conversación donde pidió presupuesto cuatro veces sin respuesta, y al lado el pedido que cargó una sola vez contando qué le pasa. No llama a nadie más; espera, y los presupuestos aparecen sin que él insista.
- tono: Directo, conversado, como quien explica algo a un amigo
- estetica: Baño con humedad visible, luz cruda de artefacto, encuadre frontal cercano; pantallas del flujo del cliente como insertos del montaje
- referencia: Demostración a cámara con prueba en pantalla
- porQueFunciona: La comparación es la prueba: un pedido publicado reemplaza cuatro mensajes sin respuesta.

### 3. Guion
- **[hook]** Tres días con un balde abajo de la pileta. — _visual:_ Baño chico con luz de ventana: Valeria mira caer la gota en el balde, sin apurarse.
- **[desarrollo]** Escribí a cuatro. Dos me dejaron en visto, uno me dijo que pasaba el martes. Hoy es jueves. Al final lo conté una sola vez, en la app. — _visual:_ Chats sin respuesta en la cocina mientras suena un teléfono que no es nadie; inserto de la pantalla Contar el problema.
- **[giro]** Me olvidé del teléfono. Cuando lo miré, los presupuestos ya estaban ahí. — _visual:_ El teléfono boca abajo sobre la mesa, ella volviendo del lavadero; inserto de la pantalla Te esperan tus proveedores y la cara de Valeria aflojándose.
- **[cta]** Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar — _visual:_ Placa final de RepareHoy con la dirección web.
- Música pedida: mood: intimidad contenida

### 4. Personajes
- **Valeria** (Protagonista: convive con el problema, cuenta el caso una vez y vive el cambio): Woman around 35 years old, shoulder-length dark brown hair tied back loosely, light olive skin tone, tired but calm expression, natural everyday appearance without makeup emphasis, average build, relaxed posture of someone at home after a long day · ropa: simple grey t-shirt, comfortable grey loungewear pants
- Lugar: A modest, lived-in apartment: a small bathroom with a dripping faucet over a plastic bucket, worn tiles, and a narrow window with soft daylight; adjoining kitchen with a simple table where a phone lies face down, everyday clutter, warm natural light filtering through curtains

### 5. Storyboard
- **Escena 1** (hook, 4 s, medium close-up) · en cuadro: p1
  - Dice: Tres días con un balde abajo de la pileta.
  - Acción: Valeria mira caer la gota en el balde, resignada
  - Acción (para el generador): Valeria sits on the edge of the bathtub staring at the dripping faucet, worn down by three days of the same problem repeating itself; she is not frustrated anymore, just tired, almost resigned to the routine of watching water fall into the bucket. She speaks to herself, as if finally putting it into words out loud. Small home bathroom with narrow window, soft natural daylight, worn tile walls, plastic bucket under the sink.
- **Escena 2** (desarrollo, 6.5 s, medium shot) · en cuadro: p1
  - Dice: Escribí a cuatro. Dos me dejaron en visto, uno me dijo que pasaba el martes.
  - Acción: Valeria revisa el teléfono en la cocina, sin respuestas
  - Acción (para el generador): Valeria stands in her kitchen looking at her phone, going through old conversations in her head rather than typing; she speaks to herself with quiet frustration about the four people she contacted who never followed through. Her tone is matter-of-fact, not angry, just done with waiting. Warm late-afternoon light through the kitchen window, everyday clutter on the table, no one else in frame.
- **Escena 3** (desarrollo, 5.5 s, close-up) · en cuadro: p1
  - Dice: Hoy es jueves. Al final lo conté una sola vez, en la app.
  - Acción: Valeria termina la idea, cansada de insistir
  - Acción (para el generador): Valeria remains in the same kitchen spot, finishing her thought with a small exhale, closing the subject of the four failed attempts before mentioning what actually worked. She speaks plainly, to herself, as someone stating a fact rather than complaining. Same warm afternoon light, same kitchen table with the phone nearby, continuous moment from the previous beat.
- **Escena 4** (desarrollo, 1.5 s, plano s/d) · pantalla de la app: «Contar el problema»
  - Dice: —
  - Acción: Inserto: pantalla Contar el problema de la app
- **Escena 5** (giro, 2.5 s, wide shot) · en cuadro: p1
  - Dice: Me olvidé del teléfono.
  - Acción: Valeria vuelve del lavadero, el teléfono quedó en la mesa
  - Acción (para el generador): Valeria walks back into the kitchen from doing something else around the house, having completely forgotten about her phone resting face down on the table; she is not expecting anything, just going about her day. She speaks almost surprised at herself for forgetting. Same lived-in kitchen, warm natural light through curtains, phone visible face down on the table as she approaches.
- **Escena 6** (giro, 3.5 s, close-up) · en cuadro: p1
  - Dice: Cuando lo miré, los presupuestos ya estaban ahí.
  - Acción: Valeria afloja la expresión al ver el teléfono
  - Acción (para el generador): Valeria picks up the phone and her face softens with quiet relief as she sees something unexpected waiting for her; she speaks to herself, finishing the thought with calm surprise rather than excitement. Same kitchen table, warm afternoon light, phone now face up in her hand, continuous from the previous moment.
- **Escena 7** (giro, 1.5 s, plano s/d) · pantalla de la app: «Te esperan tus proveedores»
  - Dice: —
  - Acción: Inserto: pantalla Te esperan tus proveedores de la app
- **Escena 8** (cta, 1.5 s, plano s/d)
  - Dice: —
  - Acción: Placa final: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar

### 6. Pedidos a Google Flow (Veo 3), tal cual se mandan
- **Retrato de Valeria:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 35 years old, shoulder-length dark brown hair tied back loosely, light olive skin tone, tired but calm expression, natural everyday appearance without makeup emphasis, average build, relaxed posture of someone at home after a long day, standing and looking at the camera, natural pose, neutral background with a hint of a modest, lived-in apartment: a small bathroom with a dripping faucet over a plastic. A still photo, no action, no dialogue.
- **Retrato de Presentadora:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine a friendly, confident woman presenter in her early thirties, natural makeup, warm smile, neat hair, an ordinary everyday face, standing and looking at the camera, natural pose, neutral background. A still photo, no action, no dialogue.
- **Escena 1** (hook):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Valeria, an Argentine woman around 35 years old, shoulder-length dark brown hair tied back loosely, light olive skin tone, wearing simple grey t-shirt, comfortable grey loungewear pants. Valeria sits on the edge of the bathtub staring at the dripping faucet, worn down by three days of the same problem repeating itself; she is not frustrated anymore, just tired, almost resigned to the routine of watching water fall into the bucket. She speaks to herself, as if finally putting it into words out loud. Small home bathroom with narrow window, soft natural daylight, worn tile walls, plastic bucket under the sink. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Tres días con un balde abajo de la pileta.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 2** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Valeria, an Argentine woman around 35 years old, shoulder-length dark brown hair tied back loosely, light olive skin tone, wearing simple grey t-shirt, comfortable grey loungewear pants. Valeria stands in her kitchen looking at her phone, going through old conversations in her head rather than typing; she speaks to herself with quiet frustration about the four people she contacted who never followed through. Her tone is matter-of-fact, not angry, just done with waiting. Warm late-afternoon light through the kitchen window, everyday clutter on the table, no one else in frame. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Escribí a cuatro. Dos me dejaron en visto, uno me dijo que pasaba el martes.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 3** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Valeria, an Argentine woman around 35 years old, shoulder-length dark brown hair tied back loosely, light olive skin tone, wearing simple grey t-shirt, comfortable grey loungewear pants. Valeria remains in the same kitchen spot, finishing her thought with a small exhale, closing the subject of the four failed attempts before mentioning what actually worked. She speaks plainly, to herself, as someone stating a fact rather than complaining. Same warm afternoon light, same kitchen table with the phone nearby, continuous moment from the previous beat. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Hoy es jueves. Al final lo conté una sola vez, en la app.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Close-up on the face and hands, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 5** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Valeria, an Argentine woman around 35 years old, shoulder-length dark brown hair tied back loosely, light olive skin tone, wearing simple grey t-shirt, comfortable grey loungewear pants. Valeria walks back into the kitchen from doing something else around the house, having completely forgotten about her phone resting face down on the table; she is not expecting anything, just going about her day. She speaks almost surprised at herself for forgetting. Same lived-in kitchen, warm natural light through curtains, phone visible face down on the table as she approaches. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Me olvidé del teléfono.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Wide shot that shows the whole place, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 6** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Valeria, an Argentine woman around 35 years old, shoulder-length dark brown hair tied back loosely, light olive skin tone, wearing simple grey t-shirt, comfortable grey loungewear pants. Valeria picks up the phone and her face softens with quiet relief as she sees something unexpected waiting for her; she speaks to herself, finishing the thought with calm surprise rather than excitement. Same kitchen table, warm afternoon light, phone now face up in her hand, continuous from the previous moment. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Cuando lo miré, los presupuestos ya estaban ahí.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Close-up on the face and hands, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 90** (cierre):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Presentadora, a friendly, confident woman presenter, stands in a bright, clean, modern space with soft light and a softly blurred background. She looks straight into the camera, smiles and starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'RepareHoy. Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar' Warm, close and confident, like a presenter closing a commercial. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, eye level, static camera with a very subtle slow push-in. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.


### 7. Director de montaje (IA) — sobre las escenas del storyboard
- Diagnóstico: Un relato de espera contada en voz baja: el spot vive del contraste entre los tres días de silencio y el momento en que la espera cambia de lado, así que el montaje sólo tiene que marcar ese pasaje y no decorar el resto.
- Decisión: **music_dip** en la escena 3 (inicio, 0.5 s) — La frase 'Hoy es jueves' es el remate del abandono y está dicha sin énfasis; bajar la música deja que el dato caiga solo.
- Decisión: **cut** en la escena 5 (antes) — El pasaje del teléfono que no suena al giro tiene que ser seco: un fundido ahí suavizaría justo el cambio de estado que el spot necesita que se note.
- Decisión: **music_drop** en la escena 6 (inicio, 0.6 s) — 'Cuando lo miré, los presupuestos ya estaban ahí' es la revelación de la pieza; el vacío de música sostiene la frase sin tocar la voz.
- Decisión: **music_lift** en la escena 7 (inicio, 0.8 s) — Escena sin diálogo con la cara de Valeria aflojándose: es el único lugar donde la música puede cargar el alivio sin competir con nadie.

---

## Caso 5 · RepareHoy
**Elección del usuario:** objetivo «Dar a conocer la marca» · tipo de historia «Situación con humor» · clima «Con humor». Formato: reel-hibrido-9-16.
**Rubro:** AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Los textos no nombran ningún barrio.

### 1. Estrategia (la pieza que propuso)
- Ángulo: Dejá de perseguir
- Mensaje principal: En RepareHoy no corrés atrás de nadie: contás el problema en tus palabras y los presupuestos te llegan solos.
- Brief creativo: Esta pieza arranca por el dolor más reconocible del AMBA: el mensaje sin respuesta y la espera atrás de alguien que venga a arreglar. El mensaje principal es la inversión de ese flujo: en RepareHoy publicás el problema como te sale y los presupuestos llegan a vos, hasta tres, de profesionales verificados de tu zona. Prueba sólo la parte de la propuesta que sostiene ese giro: la publicación del problema, los presupuestos que llegan solos y la pantalla de inicio ordenada por urgencia. Cierra con el CTA 'Contá tu problema en RepareHoy'.
- Datos que lo sostienen: El cliente cuenta el problema en sus palabras y recibe hasta tres presupuestos de profesionales verificados de su zona · El cliente no persigue a nadie: publica el problema y le llegan los presupuestos · La pantalla de inicio muestra qué trabajos esperan algo suyo, ordenados por urgencia, con la tira 'Te esperan tus proveedores' · Se entiende como un Mercado Libre de oficios: publicás lo que te pasa y te llegan los presupuestos

### 2. Concepto (propuso varias; el caso toma la primera)
**ELEGIDA: Los tres mensajes**
- tipoGancho: REPETICIÓN CON VARIACIÓN
- idea: Una mujer manda el mismo mensaje educado a tres contactos de su agenda: hola, ¿arreglás filtraciones? Dos quedan en visto, el tercero nunca aparece. Entonces abre RepareHoy, cuenta el problema en sus palabras y deja el teléfono dado vuelta. Cuando lo mira, los presupuestos llegaron solos. Cierra invitando a contar el problema.
- tono: Resignación tranquila que se vuelve alivio, sin subrayar nada
- estetica: Cocina real de departamento, luz de tarde, pantallas de la app como insertos sobrios, encuadre vertical cercano
- referencia: Spot de app con demostración de pantallas reales
- porQueFunciona: La espera repetida vuelve evidente la inversión del flujo: dejás de escribir y te llegan presupuestos.
**Alternativa 2: Explicarlo sin saber**
- tipoGancho: HUMOR OBSERVACIONAL SECO
- idea: Un hombre serio intenta nombrar lo que le pasa en casa: gotea, no, chorrea, hace como un glup. Su hija le tira términos técnicos que él no piensa usar. En RepareHoy escribe exactamente eso, con una foto, sin saber qué oficio necesita, y le llegan presupuestos de profesionales verificados de su zona. Cierra con el pedido publicado.
- tono: Seco, naturalista, sin chiste explicado ni sobreactuación
- estetica: Baño y pasillo de casa común, luz pareja, textura documental, inserto limpio de la pantalla de pedido
- referencia: Viñeta doméstica con demostración de producto
- porQueFunciona: Quita la barrera de entrada: contar el problema como te sale ya alcanza para recibir presupuestos.
**Alternativa 3: La silla que sobra**
- tipoGancho: INVERSIÓN DE EXPECTATIVA
- idea: Una pareja arma el operativo de siempre para esperar al que vendrá: silla contra la puerta, mate listo, el día entero reservado. Mientras uno se acomoda, en RepareHoy el pedido ya publicado devuelve presupuestos y la pantalla de inicio ordena por urgencia qué espera algo suyo. La silla queda sobrando, y el cierre invita a contar el problema.
- tono: Complicidad doméstica, ironía leve, remate mudo
- estetica: Palier y living de casa del AMBA, luz natural de mañana, composición simétrica, pantalla de la app en primer plano
- referencia: Comedia de observación con cierre de producto
- porQueFunciona: Vuelve física la espera inútil y muestra la prueba: presupuestos que llegan y trabajos ordenados por urgencia.

### 3. Guion
- **[hook]** Hola, ¿cómo andás? ¿Vos arreglabas filtraciones? — _visual:_ Vale escribe en el teléfono, apoyada en la mesada; arriba de ella, la mancha de humedad en el techo de la cocina.
- **[desarrollo]** Al segundo lo mismo. Al tercero igual. Dos en visto, y el otro debe estar en otra dimensión. Listo, lo cuento acá y dejo de insistir. — _visual:_ Copia y pega el mismo mensaje en dos chats más; después, inserto de la pantalla Contar el problema mientras describe la filtración con sus palabras, y deja el teléfono dado vuelta sobre la mesa.
- **[giro]** ¿Y estos de dónde salieron? No llamé a nadie. — _visual:_ Da vuelta el teléfono: inserto de la tira Te esperan tus proveedores con presupuestos esperándola; ella levanta las cejas y mira la mancha del techo.
- **[cta]** Entrá a reparehoy.com.ar y contá qué hay que arreglar — _visual:_ Placa final con el logo de RepareHoy y la URL reparehoy.com.ar sobre fondo limpio.
- Música pedida: mood: cotidiana, cálida, liviana

### 4. Personajes
- **Vale** (Protagonista: vive la espera de los mensajes y descubre la app): Woman in her early thirties, shoulder-length brown wavy hair, light olive skin tone, tired but calm expression, casual home appearance, no makeup, natural everyday look, average build, relaxed posture while holding a phone · ropa: Loose basic t-shirt, comfortable home pants
- Lugar: A lived-in apartment kitchen with a countertop, basic appliances, and a wooden table nearby; a visible water damage stain spreads across the ceiling. Late afternoon light filters warmly through a window, creating a calm, slightly worn domestic atmosphere.

### 5. Storyboard
- **Escena 1** (hook, 3 s, medium shot) · en cuadro: p1
  - Dice: Hola, ¿cómo andás? ¿Vos arreglabas filtraciones?
  - Acción: Vale escribe apoyada en la mesada, la mancha arriba
  - Acción (para el generador): Vale is typing a message to someone she hopes can help her, her tone hopeful but already a little tired of repeating herself. She leans against the kitchen countertop, phone in both hands at chest height, glancing up briefly at the damp stain spreading across the ceiling above her before looking back down. Warm late afternoon light fills the kitchen.
- **Escena 2** (desarrollo, 3.5 s, medium close-up) · en cuadro: p1
  - Dice: Al segundo lo mismo. Al tercero igual.
  - Acción: Vale repite el mensaje, resignada, sin despegar vista del teléfono
  - Acción (para el generador): Vale is talking to herself more than to anyone else, venting the small absurdity of having to repeat the exact same explanation to strangers who never answer. She keeps her eyes mostly on the phone screen, her expression flat and a bit defeated, shoulders slightly sunken, still leaning against the countertop in the same kitchen, the ceiling stain visible behind her.
- **Escena 3** (desarrollo, 5 s, close-up) · en cuadro: p1
  - Dice: Dos en visto, y el otro debe estar en otra dimensión.
  - Acción: Vale mira el teléfono y resopla con media sonrisa cansada
  - Acción (para el generador): Vale is addressing herself, almost amused by her own bad luck, dryly commenting on how two people left her on read and a third one seems to have vanished completely. She lifts her eyes from the phone for a moment with a tired half-smile, then looks back down at the screen, standing in the same spot in the kitchen with the stain still visible above her.
- **Escena 4** (desarrollo, 3.5 s, medium shot) · en cuadro: p1
  - Dice: Listo, lo cuento acá y dejo de insistir.
  - Acción: Vale decide parar, se endereza con determinación nueva
  - Acción (para el generador): Vale is making a small decision for herself, done chasing people who do not answer, resolving to try something different instead of giving up. She straightens up from leaning on the countertop, holding the phone with a renewed sense of purpose rather than frustration, still in the same kitchen under the same warm afternoon light.
- **Escena 5** (desarrollo, 1.5 s, plano s/d) · pantalla de la app: «Contar el problema»
  - Dice: —
  - Acción: Pantalla muestra el relato del problema en pasos simples
- **Escena 6** (desarrollo, 1.5 s, medium shot) · en cuadro: p1
  - Dice: —
  - Acción: Vale deja el teléfono boca abajo sobre la mesa
  - Acción (para el generador): Vale is letting go, physically and mentally, placing the matter aside after finally telling her problem her own way. She sets the phone face down on the wooden table with a calm, almost relieved gesture, no longer anxious, standing in the same kitchen with the ceiling stain still visible behind her.
- **Escena 7** (giro, 4 s, medium close-up) · en cuadro: p1
  - Dice: ¿Y estos de dónde salieron? No llamé a nadie.
  - Acción: Vale da vuelta el teléfono y se sorprende
  - Acción (para el generador): Vale is reacting with genuine surprise to something unexpected on her phone, wondering out loud to herself about these people she never contacted. She flips the phone over on the table and looks down at the screen, her eyebrows rising in disbelief, standing in the same kitchen, the damp stain still visible above her on the ceiling.
- **Escena 8** (giro, 1.5 s, plano s/d) · pantalla de la app: «Te esperan tus proveedores»
  - Dice: —
  - Acción: Pantalla muestra presupuestos de proveedores ya esperando
- **Escena 9** (giro, 1.5 s, close-up) · en cuadro: p1
  - Dice: —
  - Acción: Vale levanta la vista hacia la mancha del techo, aliviada
  - Acción (para el generador): Vale is realizing, in a quiet beat of relief, that the problem she has been carrying might finally be getting solved without her chasing anyone. She looks up from the phone toward the ceiling stain above her, her expression softening into something between surprise and relief, still standing in the same kitchen under the warm afternoon light.
- **Escena 10** (cta, 1.5 s, plano s/d)
  - Dice: —
  - Acción: Placa final: logo de RepareHoy, Entrá a reparehoy.com.ar y contá qué hay que arreglar, reparehoy.com.ar

### 6. Pedidos a Google Flow (Veo 3), tal cual se mandan
- **Retrato de Vale:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman in her early thirties, shoulder-length brown wavy hair, light olive skin tone, tired but calm expression, casual home appearance, no makeup, natural everyday look, average build, relaxed posture while holding a phone, standing and looking at the camera, natural pose, neutral background with a hint of a lived-in apartment kitchen with a countertop, basic appliances. A still photo, no action, no dialogue.
- **Retrato de Presentadora:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine a friendly, confident woman presenter in her early thirties, natural makeup, warm smile, neat hair, an ordinary everyday face, standing and looking at the camera, natural pose, neutral background. A still photo, no action, no dialogue.
- **Escena 1** (hook):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, shoulder-length brown wavy hair, light olive skin tone, tired but calm expression, wearing Loose basic t-shirt, comfortable home pants. Vale is typing a message to someone she hopes can help her, her tone hopeful but already a little tired of repeating herself. She leans against the kitchen countertop, phone in both hands at chest height, glancing up briefly at the damp stain spreading across the ceiling above her before looking back down. Warm late afternoon light fills the kitchen. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Hola, ¿cómo andás? ¿Vos arreglabas filtraciones?' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 2** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, shoulder-length brown wavy hair, light olive skin tone, tired but calm expression, wearing Loose basic t-shirt, comfortable home pants. Vale is talking to herself more than to anyone else, venting the small absurdity of having to repeat the exact same explanation to strangers who never answer. She keeps her eyes mostly on the phone screen, her expression flat and a bit defeated, shoulders slightly sunken, still leaning against the countertop in the same kitchen, the ceiling stain visible behind her. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Al segundo lo mismo. Al tercero igual.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 3** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, shoulder-length brown wavy hair, light olive skin tone, tired but calm expression, wearing Loose basic t-shirt, comfortable home pants. Vale is addressing herself, almost amused by her own bad luck, dryly commenting on how two people left her on read and a third one seems to have vanished completely. She lifts her eyes from the phone for a moment with a tired half-smile, then looks back down at the screen, standing in the same spot in the kitchen with the stain still visible above her. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Dos en visto, y el otro debe estar en otra dimensión.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Close-up on the face and hands, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 4** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, shoulder-length brown wavy hair, light olive skin tone, tired but calm expression, wearing Loose basic t-shirt, comfortable home pants. Vale is making a small decision for herself, done chasing people who do not answer, resolving to try something different instead of giving up. She straightens up from leaning on the countertop, holding the phone with a renewed sense of purpose rather than frustration, still in the same kitchen under the same warm afternoon light. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Listo, lo cuento acá y dejo de insistir.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 6** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, shoulder-length brown wavy hair, light olive skin tone, tired but calm expression, wearing Loose basic t-shirt, comfortable home pants. Vale is letting go, physically and mentally, placing the matter aside after finally telling her problem her own way. She sets the phone face down on the wooden table with a calm, almost relieved gesture, no longer anxious, standing in the same kitchen with the ceiling stain still visible behind her. No dialogue: ambient sound only. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 7** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, shoulder-length brown wavy hair, light olive skin tone, tired but calm expression, wearing Loose basic t-shirt, comfortable home pants. Vale is reacting with genuine surprise to something unexpected on her phone, wondering out loud to herself about these people she never contacted. She flips the phone over on the table and looks down at the screen, her eyebrows rising in disbelief, standing in the same kitchen, the damp stain still visible above her on the ceiling. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: '¿Y estos de dónde salieron? No llamé a nadie.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 9** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, shoulder-length brown wavy hair, light olive skin tone, tired but calm expression, wearing Loose basic t-shirt, comfortable home pants. Vale is realizing, in a quiet beat of relief, that the problem she has been carrying might finally be getting solved without her chasing anyone. She looks up from the phone toward the ceiling stain above her, her expression softening into something between surprise and relief, still standing in the same kitchen under the warm afternoon light. No dialogue: ambient sound only. Close-up on the face and hands, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 90** (cierre):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Presentadora, a friendly, confident woman presenter, stands in a bright, clean, modern space with soft light and a softly blurred background. She looks straight into the camera, smiles and starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'RepareHoy. Entrá a reparehoy.com.ar y contá qué hay que arreglar' Warm, close and confident, like a presenter closing a commercial. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, eye level, static camera with a very subtle slow push-in. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.


### 7. Director de montaje (IA) — sobre las escenas del storyboard
- Diagnóstico: El spot ya tiene su gracia en la repetición resignada de los tres mensajes, así que el montaje sólo debe cuidar el remate verbal y aislar el instante en que los presupuestos aparecen sin que ella haya llamado a nadie.
- Decisión: **cut** en la escena 3 (final) — El remate es la frase 'debe estar en otra dimensión'; corte seco al terminar la palabra para que el chiste no se cuelgue ni se explique con aire.
- Decisión: **music_lift** en la escena 6 (inicio, 0.6 s) — Escena sin diálogo: el gesto de dejar el teléfono dado vuelta sobre la mesa es el único momento muerto a propósito y la música puede sostener la espera sin tapar nada.
- Decisión: **music_drop** en la escena 7 (antes, 0.7 s) — Da vuelta el teléfono y ve presupuestos que no pidió; el vacío previo a '¿Y estos de dónde salieron?' deja la revelación desnuda y la voz entra sola.

---

## Caso 6 · RepareHoy
**Elección del usuario:** objetivo «Mostrar cómo funciona» · tipo de historia «Los dos lados» · clima «Cálido». Formato: reel-hibrido-9-16.
**Rubro:** AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Los textos no nombran ningún barrio.

### 1. Estrategia (la pieza que propuso)
- Ángulo: Dejá de perseguir
- Mensaje principal: En RepareHoy contás el problema de tu casa en tus palabras y los presupuestos te llegan solos, sin perseguir a nadie.
- Brief creativo: Pieza de apertura de campaña que recorre la interfaz del lado cliente: publicar el problema con sus propias palabras y volver a la app para encontrar la tira de 'Te esperan tus proveedores' con los presupuestos ya adentro y los trabajos ordenados por urgencia. El mensaje es la inversión del esfuerzo: en vez de salir a buscar y repetir el problema diez veces, el cliente publica una vez y le llegan hasta tres presupuestos de profesionales verificados de su zona. Prueba la parte de la propuesta que resuelve el 'nadie me contesta', y cierra invitando a publicar el primer trabajo.
- Datos que lo sostienen: El cliente cuenta el problema en sus palabras y recibe hasta tres presupuestos de profesionales verificados de su zona · El cliente no persigue a nadie: publica el problema y le llegan los presupuestos · La pantalla de inicio muestra 'Te esperan tus proveedores' y qué trabajos esperan algo suyo, ordenados por urgencia · Marketplace de oficios para el hogar en el AMBA, con once oficios: plomería, electricidad, cerrajería, gas, aire acondicionado, pintura, carpintería, albañilería, herrería, techos y humedad, y materiales

### 2. Concepto (propuso varias; el caso toma la primera)
**ELEGIDA: Contarlo una sola vez**
- tipoGancho: CONTRASTE DE ESFUERZO
- idea: Vuelve del trabajo y la mancha de humedad creció. En vez de arrancar la ronda de mensajes que nunca contestan, cuenta qué pasa una sola vez. A la noche abre la app: la esperan sus proveedores, con presupuestos adentro. Del otro lado, uno de ellos vio ese pedido llegar a su bandeja. Cierra con la invitación a publicar.
- tono: Conversado, bajo, sin euforia; alivio contenido de día largo
- estetica: Departamento real de noche, luz de cocina y velador, pantalla del celular como única fuente de información nueva
- referencia: Spot de app con insertos de interfaz real
- porQueFunciona: Muestra la inversión del esfuerzo: un pedido en vez de diez llamados, con prueba en pantalla.
**Alternativa 2: Qué oficio necesito**
- tipoGancho: SITUACIÓN COTIDIANA
- idea: Pareja frente a una mancha que gotea en el lavadero: discuten si eso es plomero, techista o humedad y se quedan trabados ahí. Terminan contándolo como lo dirían en voz alta, sin elegir oficio. Al rato tienen presupuestos esperando. Del otro lado, un techista recibe ese pedido en su bandeja, de su zona. Nadie persiguió a nadie.
- tono: Diálogo cruzado, natural, con duda honesta y complicidad
- estetica: Lavadero con bacha, balde y pared marcada; luz de día entrando por ventana chica; nada decorado
- referencia: Escena doméstica breve con cierre de marca
- porQueFunciona: Resuelve una traba real: contarlo en tus palabras alcanza, aunque no sepas a quién llamar.
**Alternativa 3: Un pedido, dos manos**
- tipoGancho: DEMOSTRACIÓN ESPEJADA
- idea: Una jubilada no logra cerrar la puerta de entrada y lo cuenta en la app con sus palabras. Un cerrajero ve ese pedido ordenado en su bandeja. Ella sigue en qué paso va su solicitud sin llamar a nadie; él sabe a quién le cotiza. El mismo pedido, dos manos, nadie insistiendo, y una invitación a contar el tuyo.
- tono: Respetuoso, parejo entre los dos, sin explicaciones técnicas
- estetica: Palier y taller de barrio, luz natural motivada; dos espacios distintos unidos por la misma información en pantalla
- referencia: Spot de doble perspectiva con interfaz como nexo
- porQueFunciona: Hace visible el sistema desde los dos lados: claridad para ella, orden para él.

### 3. Guion
- **[hook]** La última vez que me pasó mandé diez mensajes. — _visual:_ Sol llega de noche, todavía con la campera puesta, y se queda mirando la mancha del techo del pasillo, más grande que a la mañana.
- **[desarrollo]** Esta vez lo conté una sola vez: que la mancha creció y no sé de dónde viene. — _visual:_ Sentada en la mesa de la cocina, escribe en la pantalla Contar el problema con sus propias palabras y agrega una foto del techo.
- **[desarrollo]** Mirá, esta me queda a diez cuadras. — _visual:_ Rubén, en su taller, levanta la vista del celular con la Bandeja de solicitudes abierta y el pedido nuevo arriba, con el servicio y el cliente.
- **[giro]** Che… ni un llamado hice y ya están los presupuestos. — _visual:_ Sol, luz de velador, abre la app y aparece Te esperan tus proveedores con los presupuestos ordenados por urgencia; afloja los hombros y se queda mirando la pantalla.
- **[cta]** Entrá a reparehoy.com.ar y contá qué hay que arreglar — _visual:_ Placa final con el logo de RepareHoy y la dirección reparehoy.com.ar.
- Música pedida: mood: cálida y contenida

### 4. Personajes
- **Sol** (Vecina que necesita una reparación y usa la app para contar el problema una sola vez): Woman in her early thirties, shoulder-length dark brown hair, olive skin tone, tired but calm expression after a workday, no makeup touch-ups visible, average build, natural posture of someone just arriving home · ropa: Light jacket still on, simple t-shirt underneath, comfortable pants
- **Rubén** (Gasista u operario que recibe el pedido en su bandeja de solicitudes): Man in his late forties, short greying hair, light olive skin, weathered hands, sturdy build, relaxed posture typical of someone used to manual work, no exaggerated expressions · ropa: Work t-shirt, worn work apron or workshop jacket
- Lugar: Two connected spaces shown in parallel: a modest apartment at night with a hallway showing a water-damaged ceiling stain, and a small kitchen table under warm lamp light; intercut with a cluttered home workshop lit by a single bulb, tools resting on a workbench

### 5. Storyboard
- **Escena 1** (hook, 4 s, medium close-up) · en cuadro: p1
  - Dice: —
  - Acción: Sol llega de noche y mira la mancha del techo
  - Acción (para el generador): Sol has just walked in from work, still wearing her jacket, and stops in the hallway when she notices the ceiling stain has grown since the morning. She speaks to herself, tired and a little resigned, remembering how exhausting it was last time. Her body stays still, her eyes fixed upward, the weight of the day still on her shoulders. Hallway of her apartment at night, warm light bleeding in from another room, the stain visible on the ceiling above her.
- **Escena 2** (desarrollo, 4 s, medium shot) · en cuadro: p1
  - Dice: —
  - Acción: Sol se sienta en la cocina y empieza a contar el problema
  - Acción (para el generador): Sol sits down at her kitchen table, jacket still on, and starts talking about what happened, explaining to herself more than to anyone else that this time she only had to say it once. There's quiet relief in her voice, contrasted with the tiredness from before. She settles into the chair, phone resting on the table in front of her. Kitchen table lit by a warm overhead lamp, the rest of the apartment dim around her.
- **Escena 3** (desarrollo, 3 s, high angle) · pantalla de la app: «Contar el problema»
  - Dice: —
  - Acción: Insert: pantalla Contar el problema con foto del techo
- **Escena 4** (desarrollo, 4 s, medium close-up) · en cuadro: p2
  - Dice: —
  - Acción: Rubén levanta la vista del celular en su taller
  - Acción (para el generador): Rubén is in his workshop at night when a new request catches his attention on his phone. He talks to himself, almost surprised, noting out loud that this particular job is close to where he lives, ten blocks away. There's calm satisfaction in his tone, the practical mind of someone sizing up a job he can take. He looks up briefly from the phone, settling into the idea. Small home workshop lit by a single overhead bulb, tools resting on the workbench behind him.
- **Escena 5** (desarrollo, 2 s, high angle) · pantalla de la app: «Bandeja de solicitudes»
  - Dice: —
  - Acción: Insert: pantalla Bandeja de solicitudes con el pedido nuevo
- **Escena 6** (giro, 2 s, close-up) · en cuadro: p1
  - Dice: —
  - Acción: Sol afloja los hombros al ver los presupuestos
  - Acción (para el generador): Sol is in her bedroom at night, the bedside lamp the only light, when she opens her phone and reacts with quiet disbelief at how fast the quotes arrived without her having to call anyone. She speaks half to herself, with a small release of tension in her voice, surprised by how little effort it took this time. Her shoulders drop slightly as she relaxes, still holding the phone, looking at it for a moment longer than usual. Bedroom lit only by the warm glow of the bedside lamp.
- **Escena 7** (giro, 2 s, over-the-shoulder) · pantalla de la app: «Te esperan tus proveedores»
  - Dice: —
  - Acción: Insert: pantalla Te esperan tus proveedores con presupuestos ordenados
- **Escena 8** (cta, 5 s, wide shot)
  - Dice: —
  - Acción: Placa final: logo de RepareHoy y reparehoy.com.ar, texto: Entrá a reparehoy.com.ar y contá qué hay que arreglar

### 6. Pedidos a Google Flow (Veo 3), tal cual se mandan
- **Retrato de Sol:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman in her early thirties, shoulder-length dark brown hair, olive skin tone, tired but calm expression after a workday, no makeup touch-ups visible, average build, natural posture of someone just arriving home, standing and looking at the camera, natural pose, neutral background with a hint of two connected spaces shown in parallel: a modest apartment at night with a hallway. A still photo, no action, no dialogue.
- **Retrato de Rubén:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Man in his late forties, short greying hair, light olive skin, weathered hands, sturdy build, relaxed posture typical of someone used to manual work, no exaggerated expressions, standing and looking at the camera, natural pose, neutral background with a hint of two connected spaces shown in parallel: a modest apartment at night with a hallway. A still photo, no action, no dialogue.
- **Retrato de Presentadora:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine a friendly, confident woman presenter in her early thirties, natural makeup, warm smile, neat hair, an ordinary everyday face, standing and looking at the camera, natural pose, neutral background. A still photo, no action, no dialogue.
- **Escena 1** (hook):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Sol, an Argentine woman in her early thirties, shoulder-length dark brown hair, olive skin tone, wearing Light jacket still on, simple t-shirt underneath, comfortable pants. Sol has just walked in from work, still wearing her jacket, and stops in the hallway when she notices the ceiling stain has grown since the morning. She speaks to herself, tired and a little resigned, remembering how exhausting it was last time. Her body stays still, her eyes fixed upward, the weight of the day still on her shoulders. Hallway of her apartment at night, warm light bleeding in from another room, the stain visible on the ceiling above her. No dialogue: ambient sound only. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 2** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Sol, an Argentine woman in her early thirties, shoulder-length dark brown hair, olive skin tone, wearing Light jacket still on, simple t-shirt underneath, comfortable pants. Sol sits down at her kitchen table, jacket still on, and starts talking about what happened, explaining to herself more than to anyone else that this time she only had to say it once. There's quiet relief in her voice, contrasted with the tiredness from before. She settles into the chair, phone resting on the table in front of her. Kitchen table lit by a warm overhead lamp, the rest of the apartment dim around her. No dialogue: ambient sound only. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 4** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Rubén, an Argentine man in his late forties, short greying hair, light olive skin, weathered hands, sturdy build, wearing Work t-shirt, worn work apron or workshop jacket. Rubén is in his workshop at night when a new request catches his attention on his phone. He talks to himself, almost surprised, noting out loud that this particular job is close to where he lives, ten blocks away. There's calm satisfaction in his tone, the practical mind of someone sizing up a job he can take. He looks up briefly from the phone, settling into the idea. Small home workshop lit by a single overhead bulb, tools resting on the workbench behind him. No dialogue: ambient sound only. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 6** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Sol, an Argentine woman in her early thirties, shoulder-length dark brown hair, olive skin tone, wearing Light jacket still on, simple t-shirt underneath, comfortable pants. Sol is in her bedroom at night, the bedside lamp the only light, when she opens her phone and reacts with quiet disbelief at how fast the quotes arrived without her having to call anyone. She speaks half to herself, with a small release of tension in her voice, surprised by how little effort it took this time. Her shoulders drop slightly as she relaxes, still holding the phone, looking at it for a moment longer than usual. Bedroom lit only by the warm glow of the bedside lamp. No dialogue: ambient sound only. Close-up on the face and hands, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 90** (cierre):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Presentadora, a friendly, confident woman presenter, stands in a bright, clean, modern space with soft light and a softly blurred background. She looks straight into the camera, smiles and starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'RepareHoy. Entrá a reparehoy.com.ar y contá qué hay que arreglar' Warm, close and confident, like a presenter closing a commercial. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, eye level, static camera with a very subtle slow push-in. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.


### 7. Director de montaje (IA) — sobre las escenas del storyboard
- Diagnóstico: Spot cálido de dos lados donde el valor está en el contraste entre el esfuerzo viejo (diez mensajes) y el nuevo (contarlo una vez), así que el montaje tiene que proteger el salto de Sol a Rubén y el alivio final, sin decorar el resto.
- Decisión: **music_dip** en la escena 1 (final, 0.6 s) — Sol se queda mirando la mancha más grande que a la mañana: bajar la música deja respirar el cansancio antes de arrancar el relato.
- Decisión: **cut** en la escena 3 (antes) — El pase de la cocina de Sol al taller de Rubén es el cambio de perspectiva; corte seco para que el contraste se note en vez de fundirse.
- Decisión: **music_lift** en la escena 5 (inicio, 0.8 s) — Tramo del lado del proveedor con el pedido ya en la bandeja y sin voz encima: la música puede sostener que del otro lado algo se puso en movimiento.
- Decisión: **music_drop** en la escena 6 (inicio, 0.5 s) — Es el momento en que aparecen los presupuestos sin que ella haya hecho un llamado; el vacío breve marca la revelación sin tapar la línea de Sol.
- Decisión: **dissolve** en la escena 7 (antes, 0.5 s) — Sol afloja los hombros frente a la pantalla: una transición suave acompaña el alivio contenido en vez de cortarlo.

---

## Caso 7 · sin vueltas ¡YA!
**Elección del usuario:** objetivo «Dar a conocer la marca» · tipo de historia «Voz de una persona» · clima «Cálido». Formato: reel-hibrido-9-16.
**Rubro:** Marketplace de servicios para eventos

### 1. Estrategia (la pieza que propuso)
- Ángulo: Dejá de perseguir proveedores
- Mensaje principal: Organizar un evento no debería ser perseguir proveedores uno por uno: en sin vueltas ¡YA! publicás tu pedido y los proveedores de tu zona te cotizan.
- Brief creativo: Esta pieza arranca desde el dolor concreto de quien organiza un evento y vive pidiendo presupuestos de a uno, sin respuesta. El mensaje principal es que se puede dar vuelta el proceso: publicás tu pedido con fecha y cantidad de invitados y las cotizaciones llegan a vos. Prueba la parte de la propuesta de publicar pedido y recibir cotizaciones de proveedores de tu zona dentro del AMBA, dejando claro que sin vueltas ¡YA! es el marketplace donde todo eso pasa.
- Datos que lo sostienen: Publicás qué necesitás (categoría, zona, fecha, invitados) en un paso y los proveedores de tu zona te cotizan · Comparás cotizaciones y elegís, sin perseguir a nadie · Cobertura en todo el AMBA: CABA y Gran Buenos Aires

### 2. Concepto (propuso varias; el caso toma la primera)
**ELEGIDA: Dejar de perseguir**
- tipoGancho: INVERSIÓN DE EXPECTATIVA
- idea: Una mamá que organiza los quince de su hija cuenta, sentada en la cocina, los días que pasó escribiéndole a proveedores que nunca le contestaron. Decide dar vuelta el camino: publica su pedido con la fecha y la cantidad de invitados, y las cotizaciones empiezan a llegarle a ella. Cierra diciendo que ahora elige, no corre atrás de nadie. Dramatización.
- tono: Confidencial, conversado, sin queja; alivio contenido al final
- estetica: Cocina real de casa de barrio, luz de ventana al atardecer, celular en mano, anotaciones en la heladera, cámara a la altura de los ojos
- referencia: Testimonio dramatizado de marca, registro doméstico
- porQueFunciona: Nombra el dolor exacto y muestra la inversión del proceso como alivio concreto, no como promesa.
**Alternativa 2: La libreta**
- tipoGancho: VÍNCULO HUMANO
- idea: Un hermano narra el sábado en que se juntaron a organizar el aniversario de sus padres. Él traía una libreta con llamados sin devolver; su hermana propuso publicar el pedido una sola vez y esperar. Esa tarde terminan comparando cotizaciones de proveedores de su zona en la misma mesa, discutiendo cuál les gusta más. Dramatización.
- tono: Cómplice, relajado, con pequeñas chicanas entre hermanos
- estetica: Mesa de comedor con mate, papeles y celular; luz de tarde; dos presencias, gestos cortos, nada decorado
- referencia: Escena familiar con voz en primera persona
- porQueFunciona: Convierte la espera frustrante en una decisión compartida: comparar y elegir juntos, con respaldo cercano.
**Alternativa 3: No sabía qué pedir**
- tipoGancho: DEMOSTRACIÓN DIRECTA
- idea: Quien organiza la despedida de egresados de un curso habla a cámara en el salón todavía vacío: no sabía qué necesitaba ni a quién llamar primero. Cuenta que en lugar de buscar proveedor por proveedor publicó un pedido con la fecha y los invitados, y ahora compara lo que le cotizaron antes de decidir. Dramatización.
- tono: Directo, práctico, de alguien que explica lo que hizo
- estetica: Salón o patio escolar sin gente, luz natural dura y honesta, protagonista de pie, celular a mano, encuadre frontal simple
- referencia: Pieza a cámara de persona común, estilo documental
- porQueFunciona: Resuelve la objeción de no saber qué necesita y muestra el pedido publicado como acción concreta.

### 3. Guion
- **[hook]** Catorce mensajes mandé. Me contestaron dos. — _visual:_ Sandra sentada a la mesa de la cocina, celular apoyado boca abajo, luz de ventana al atardecer.
- **[desarrollo]** Los quince de mi hija, y yo ahí, persiguiendo gente por teléfono. Un día dije basta: puse la fecha, cuántos somos, y lo publiqué. — _visual:_ Heladera con papelitos y una fecha anotada en marcador; ella acomoda uno que se cae mientras habla.
- **[giro]** Ahora me llegan presupuestos a mí. Y elijo yo. — _visual:_ El celular en su mano con la lista de cotizaciones recibidas; ella levanta la vista y suelta el aire.
- **[cta]** Publicá tu pedido y te cotizan proveedores de tu zona. sin vueltas ¡YA! — _visual:_ Placa final con el logo de sin vueltas ¡YA! y la leyenda Dramatización en letra chica.
- Música pedida: mood: cálido íntimo

### 4. Personajes
- **Sandra** (Narradora protagonista, mamá organizando los quince de su hija): Woman in her mid-40s, shoulder-length dark brown hair with a few gray strands, olive skin tone, tired but warm eyes, soft under-eye circles, natural makeup-free face, relaxed home posture, average build · ropa: Plain home t-shirt, open cardigan, no makeup, casual house clothes
- Lugar: A lived-in home kitchen with a wooden table, a refrigerator covered in handwritten notes and a date circled in marker, a kettle or everyday objects on the counter, warm domestic clutter, nothing staged or decorative.

### 5. Storyboard
- **Escena 1** (hook, 5.5 s, medium close-up) · en cuadro: p1
  - Dice: Catorce mensajes mandé. Me contestaron dos.
  - Acción: Sandra habla a cámara, el celular boca abajo en la mesa
  - Acción (para el generador): Sandra sits at her kitchen table speaking directly to camera, as if confiding in a friend about something that genuinely frustrated her. She wants to be understood, not pitied. Her phone rests face down on the table beside her. She glances briefly at the phone with quiet exhaustion before returning her eyes to camera, in her lived-in home kitchen with warm late afternoon window light.
- **Escena 2** (desarrollo, 5.5 s, medium shot) · en cuadro: p1
  - Dice: Los quince de mi hija, y yo ahí, persiguiendo gente por teléfono.
  - Acción: Sandra habla parada frente a la heladera con papelitos
  - Acción (para el generador): Sandra stands near her refrigerator covered in handwritten notes and a circled date, talking to camera about the frustration of chasing people down for her daughter's quinceañera. She wants to explain the moment she decided to stop begging and take control herself. Her tone is resolved, not angry. She reaches out and straightens a note that had slipped, a small automatic gesture while she keeps talking, in her home kitchen under warm natural light.
- **Escena 3** (desarrollo, 5.5 s, close-up) · en cuadro: p1
  - Dice: Un día dije basta: puse la fecha, cuántos somos, y lo publiqué.
  - Acción: Sandra habla a cámara con determinación, cerca de la heladera
  - Acción (para el generador): Sandra remains near the refrigerator, now looking straight at camera with a firm, decided expression, as if finally explaining the turning point to someone who asked how she solved it. She wants to convey that she took matters into her own hands. Her posture is calmer than before, shoulders relaxed, in her home kitchen with the same warm afternoon light coming through the window.
- **Escena 4** (giro, 5.5 s, medium close-up) · en cuadro: p1
  - Dice: Ahora me llegan presupuestos a mí. Y elijo yo.
  - Acción: Sandra mira el celular, levanta la vista y suelta el aire
  - Acción (para el generador): Sandra sits back at the kitchen table holding her phone, looking at it with visible relief, as if seeing something that finally eased her shoulders. She wants to share that quiet sense of relief with whoever is listening. She lifts her eyes from the phone toward camera and exhales softly, a natural release of tension, in her kitchen with the late afternoon light warm across her face.
- **Escena 5** (cta, 3.5 s, plano s/d)
  - Dice: —
  - Acción: Placa final: Publicá tu pedido y te cotizan proveedores de tu zona. sin vueltas ¡YA! Dramatización (letra chica)

### 6. Pedidos a Google Flow (Veo 3), tal cual se mandan
- **Retrato de Sandra:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman in her mid-40s, shoulder-length dark brown hair with a few gray strands, olive skin tone, tired but warm eyes, soft under-eye circles, natural makeup-free face, relaxed home posture, average build, standing and looking at the camera, natural pose, neutral background with a hint of a lived-in home kitchen with a wooden table, a refrigerator covered in handwritten notes. A still photo, no action, no dialogue.
- **Retrato de Presentadora:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine a friendly, confident woman presenter in her early thirties, natural makeup, warm smile, neat hair, an ordinary everyday face, standing and looking at the camera, natural pose, neutral background. A still photo, no action, no dialogue.
- **Escena 1** (hook):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Sandra, an Argentine woman in her mid-40s, shoulder-length dark brown hair with a few gray strands, olive skin tone, wearing Plain home t-shirt, open cardigan, no makeup, casual house clothes. Sandra sits at her kitchen table speaking directly to camera, as if confiding in a friend about something that genuinely frustrated her. She wants to be understood, not pitied. Her phone rests face down on the table beside her. She glances briefly at the phone with quiet exhaustion before returning her eyes to camera, in her lived-in home kitchen with warm late afternoon window light. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Catorce mensajes mandé. Me contestaron dos.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 2** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Sandra, an Argentine woman in her mid-40s, shoulder-length dark brown hair with a few gray strands, olive skin tone, wearing Plain home t-shirt, open cardigan, no makeup, casual house clothes. Sandra stands near her refrigerator covered in handwritten notes and a circled date, talking to camera about the frustration of chasing people down for her daughter's quinceañera. She wants to explain the moment she decided to stop begging and take control herself. Her tone is resolved, not angry. She reaches out and straightens a note that had slipped, a small automatic gesture while she keeps talking, in her home kitchen under warm natural light. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Los quince de mi hija, y yo ahí, persiguiendo gente por teléfono.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 3** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Sandra, an Argentine woman in her mid-40s, shoulder-length dark brown hair with a few gray strands, olive skin tone, wearing Plain home t-shirt, open cardigan, no makeup, casual house clothes. Sandra remains near the refrigerator, now looking straight at camera with a firm, decided expression, as if finally explaining the turning point to someone who asked how she solved it. She wants to convey that she took matters into her own hands. Her posture is calmer than before, shoulders relaxed, in her home kitchen with the same warm afternoon light coming through the window. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Un día dije basta: puse la fecha, cuántos somos, y lo publiqué.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Close-up on the face and hands, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 4** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Sandra, an Argentine woman in her mid-40s, shoulder-length dark brown hair with a few gray strands, olive skin tone, wearing Plain home t-shirt, open cardigan, no makeup, casual house clothes. Sandra sits back at the kitchen table holding her phone, looking at it with visible relief, as if seeing something that finally eased her shoulders. She wants to share that quiet sense of relief with whoever is listening. She lifts her eyes from the phone toward camera and exhales softly, a natural release of tension, in her kitchen with the late afternoon light warm across her face. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Ahora me llegan presupuestos a mí. Y elijo yo.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 90** (cierre):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Presentadora, a friendly, confident woman presenter, stands in a bright, clean, modern space with soft light and a softly blurred background. She looks straight into the camera, smiles and starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'sin vueltas ¡YA!. Publicá tu pedido y te cotizan proveedores de tu zona. sin vueltas ¡YA!' Warm, close and confident, like a presenter closing a commercial. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, eye level, static camera with a very subtle slow push-in. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.


### 7. Director de montaje (IA) — sobre las escenas del storyboard
- Diagnóstico: Cuatro planos de una misma mujer en su cocina sostenidos por la palabra: el montaje tiene que respirar con ella y marcar un solo punto de inversión, el momento en que los presupuestos empiezan a llegarle.
- Decisión: **music_dip** en la escena 1 (final, 0.5 s) — El remate 'Me contestaron dos' queda seco; bajar la música deja que el número se escuche solo, sin apoyo emotivo.
- Decisión: **dissolve** en la escena 3 (antes, 0.6 s) — Pasa del cansancio ('persiguiendo gente por teléfono') a la decisión ('un día dije basta'); el corte suave marca el cambio de capítulo interno sin frenar el relato.
- Decisión: **music_drop** en la escena 4 (inicio, 0.4 s) — 'Ahora me llegan presupuestos a mí' es la inversión del proceso; el vacío breve la deja aterrizar como hecho, no como promesa.
- Decisión: **music_lift** en la escena 4 (final, 0.8 s) — Después de 'elijo yo' ella levanta la vista y suelta el aire sin hablar; ahí la música puede crecer y entregar la placa de marca con un final claro.

---

## Caso 8 · sin vueltas ¡YA!
**Elección del usuario:** objetivo «Mostrar cómo funciona» · tipo de historia «Un caso de principio a fin» · clima «Aspiracional». Formato: reel-hibrido-9-16.
**Rubro:** Marketplace de servicios para eventos

### 1. Estrategia (la pieza que propuso)
- Ángulo: Comparar antes de elegir
- Mensaje principal: En sin vueltas ¡YA! entrás por categoría y comparás proveedores verificados con sus fotos y reseñas antes de pedir cotización.
- Brief creativo: Recorrido de pantalla por el buscador del marketplace: elegir categoría, abrir dos fichas de proveedor, mirar fotos y reseñas y pedir cotización sin compromiso. El mensaje único es que acá podés comparar con información a la vista antes de decidir, no elegir a ciegas. Prueba la parte de la propuesta referida al catálogo de proveedores verificados y la cotización dentro de la plataforma.
- Datos que lo sostienen: 11 categorías: música y DJ, catering, fotografía, animación, decoración, transporte, lunch & bar, estilismo, salones y locaciones, bienestar, shows y entretenimiento · Fichas de proveedor con fotos y reseñas para comparar antes de elegir · Cotización sin compromiso · Proveedores verificados

### 2. Concepto (propuso varias; el caso toma la primera)
**ELEGIDA: Papelito versus pantalla**
- tipoGancho: CONTRASTE VISUAL
- idea: Un hombre organiza el festejo de fin de año de su oficina con tres nombres de catering anotados en un papel y cero información de cada uno. Deja el papel de lado, entra por categoría en sin vueltas ¡YA!, abre dos fichas de proveedores verificados, mira fotos de trabajos y reseñas, y pide cotización a los dos sin compromiso.
- tono: Sobrio, resuelto, cercano, sin euforia ni promesas grandes
- estetica: Oficina chica con luz natural de tarde, paleta cálida y limpia, pantalla del celular como protagonista del momento de decisión.
- referencia: Spot de contraste antes y después, con demo de pantalla
- porQueFunciona: Muestra la diferencia entre elegir a ciegas y comparar con fotos y reseñas a la vista.
**Alternativa 2: Dos candidatos, una mesa**
- tipoGancho: DOBLE PERSPECTIVA
- idea: Madre e hija arman los quince y cada una defiende un DJ distinto. En vez de discutir, apoyan el celular en la mesa de la cocina y comparan las dos fichas lado a lado: fotos de fiestas, reseñas de otros clientes, zona de cobertura. Terminan pidiendo cotización a los dos, sin compromiso, y deciden con datos.
- tono: Cómplice, conversado, afectuoso, sin solemnidad ni discusión forzada
- estetica: Cocina de departamento al atardecer, luz tibia, dos caras iluminadas por la pantalla, encuadres íntimos y ordenados.
- referencia: Pieza de decisión compartida con apoyo de pantalla
- porQueFunciona: Convierte la comparación en un acto humano: dos opiniones se resuelven mirando la misma información.
**Alternativa 3: Primera vez organizando**
- tipoGancho: DEMOSTRACIÓN DIRECTA
- idea: Una mujer que nunca organizó nada grande cuenta a cámara que su hermano le pidió ayuda con el casamiento. Mientras habla, recorre el buscador: elige la categoría que necesita, abre dos fichas de proveedores verificados, se detiene en las fotos y en lo que escribieron otros clientes, y pide cotización sin compromiso antes de comprometerse con nadie.
- tono: Directo, didáctico, seguro, hablado como a una amiga
- estetica: Living luminoso y despojado, fondo neutro, pantalla intercalada como material de apoyo, paleta clara y profesional.
- referencia: Demostración a cámara con recorrido de producto
- porQueFunciona: Explica el paso a paso de comparar y cotizar mostrándolo, con una voz creíble y sin tecnicismos.

### 3. Guion
- **[hook]** Tengo tres nombres y ni una foto. — _visual:_ Un papel con tres nombres anotados a mano, sin ningún otro dato, sobre un escritorio de oficina con luz de tarde.
- **[desarrollo]** ¿Y cuál de los tres es bueno? — _visual:_ Lucía se asoma por encima del monitor y mira el papel; Diego se queda callado un segundo y toma el celular.
- **[desarrollo]** Acá por lo menos veo los trabajos y lo que dijeron los clientes. — _visual:_ Diego apoya el papel a un costado; captura de pantalla real de la app con la categoría catering y fichas de proveedor con fotos y reseñas.
- **[giro]** Les pedí cotización a dos. Ya no elijo a ciegas. — _visual:_ Pantalla de la app con el pedido de cotización enviado a dos proveedores; el papel queda olvidado al borde del escritorio.
- **[cta]** sin vueltas ¡YA! Compará proveedores verificados y pedí tu cotización sin compromiso. — _visual:_ Placa final con el logo sin vueltas ¡YA! sobre fondo cálido y limpio.
- Música pedida: mood: cálida y resuelta

### 4. Personajes
- **Diego** (Organizador del festejo que decide comparar proveedores): Man in his late 30s, short dark brown hair, light-tan skin, clean-shaven, average build, seated at an office desk, relaxed but focused posture, business-casual look suited to a small office · ropa: Light blue button-down shirt, sleeves rolled up, no tie
- **Lucía** (Compañera de oficina que cuestiona la falta de información): Woman in her mid-30s, shoulder-length dark hair, light-tan skin, natural light makeup, average build, seated at an adjacent desk, casual office posture leaning slightly to glance over a monitor · ropa: Simple white blouse, no flashy accessories
- Lugar: Small office space with two adjacent desks, modest furniture, a window letting in warm late-afternoon natural light, a handwritten paper note and a smartphone on the desk, clean and unremarkable workspace without branding or clutter

### 5. Storyboard
- **Escena 1** (hook, 4.5 s, close-up) · en cuadro: p1
  - Dice: Tengo tres nombres y ni una foto.
  - Acción: Diego mira el papel con tres nombres anotados
  - Acción (para el generador): Diego is frustrated at how little he has to go on, speaking to himself more than to anyone else, almost thinking out loud as he stares down at the handwritten note. He wants to convey that three names without any context are useless for making a real decision. He glances at the paper on his desk, sitting at his small office desk in the warm late-afternoon light.
- **Escena 2** (desarrollo, 4.5 s, over-the-shoulder) · en cuadro: p2
  - Dice: ¿Y cuál de los tres es bueno?
  - Acción: Lucía se asoma por el monitor y pregunta
  - Acción (para el generador): Lucía is genuinely curious and a bit skeptical, challenging Diego's casual approach to such an important decision. She wants him to notice the obvious gap in his plan, speaking directly to him across the desks. She leans slightly over her monitor to look toward him and the note, staying at her desk in the small office beside Diego's.
- **Escena 3** (desarrollo, 1.5 s, medium close-up) · en cuadro: p1
  - Dice: —
  - Acción: Diego se queda callado y toma el celular
  - Acción (para el generador): Diego has no good answer to Lucía's question and feels the weight of not knowing, pausing for a moment before deciding to do something about it instead of guessing. He is not speaking to anyone, just reacting internally to the problem she pointed out. He stays quiet for a beat, then reaches for his phone on the desk, still seated in the same small office.
- **Escena 4** (desarrollo, 5.5 s, medium shot) · en cuadro: p1
  - Dice: Acá por lo menos veo los trabajos y lo que dijeron los clientes.
  - Acción: Diego habla mientras aparta el papel
  - Acción (para el generador): Diego feels relieved and more confident now, explaining to Lucía what he found as a direct answer to her doubt. He wants to show her that he finally has real information instead of just names on paper. He speaks to her while setting the handwritten note aside on his desk, in the same small office with the warm afternoon light.
- **Escena 5** (desarrollo, 1.5 s, close-up) · pantalla de la app: «categoría catering con fichas de proveedor, fotos y reseñas»
  - Dice: —
  - Acción: Se ve la categoría catering con fichas y reseñas
- **Escena 6** (giro, 4.5 s, medium close-up) · en cuadro: p1
  - Dice: Les pedí cotización a dos. Ya no elijo a ciegas.
  - Acción: Diego habla con el papel olvidado al costado
  - Acción (para el generador): Diego feels in control for the first time, telling Lucía with quiet satisfaction that he has already acted instead of guessing. He wants her to see that he moved past the uncertainty from before. He speaks to her from his desk while the handwritten note sits forgotten at the edge of the table, same small office, same afternoon light.
- **Escena 7** (giro, 1.5 s, close-up) · pantalla de la app: «pedido de cotización enviado a dos proveedores»
  - Dice: —
  - Acción: Se ve el pedido de cotización enviado a dos proveedores
- **Escena 8** (cta, 3 s, wide shot)
  - Dice: —
  - Acción: Placa final: sin vueltas ¡YA! Compará proveedores verificados y pedí tu cotización sin compromiso.

### 6. Pedidos a Google Flow (Veo 3), tal cual se mandan
- **Retrato de Diego:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Man in his late 30s, short dark brown hair, light-tan skin, clean-shaven, average build, seated at an office desk, relaxed but focused posture, business-casual look suited to a small office, standing and looking at the camera, natural pose, neutral background with a hint of small office space with two adjacent desks, modest furniture. A still photo, no action, no dialogue.
- **Retrato de Lucía:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman in her mid-30s, shoulder-length dark hair, light-tan skin, natural light makeup, average build, seated at an adjacent desk, casual office posture leaning slightly to glance over a monitor, standing and looking at the camera, natural pose, neutral background with a hint of small office space with two adjacent desks, modest furniture. A still photo, no action, no dialogue.
- **Retrato de Presentadora:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine a friendly, confident woman presenter in her early thirties, natural makeup, warm smile, neat hair, an ordinary everyday face, standing and looking at the camera, natural pose, neutral background. A still photo, no action, no dialogue.
- **Escena 1** (hook):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Diego, an Argentine man in his late 30s, short dark brown hair, light-tan skin, clean-shaven, average build, wearing Light blue button-down shirt, sleeves rolled up, no tie. Diego is frustrated at how little he has to go on, speaking to himself more than to anyone else, almost thinking out loud as he stares down at the handwritten note. He wants to convey that three names without any context are useless for making a real decision. He glances at the paper on his desk, sitting at his small office desk in the warm late-afternoon light. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Tengo tres nombres y ni una foto.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Close-up on the face and hands, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 2** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Lucía, an Argentine woman in her mid-30s, shoulder-length dark hair, light-tan skin, natural light makeup, average build, wearing Simple white blouse, no flashy accessories. Lucía is genuinely curious and a bit skeptical, challenging Diego's casual approach to such an important decision. She wants him to notice the obvious gap in his plan, speaking directly to him across the desks. She leans slightly over her monitor to look toward him and the note, staying at her desk in the small office beside Diego's. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: '¿Y cuál de los tres es bueno?' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Over-the-shoulder shot, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 3** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Diego, an Argentine man in his late 30s, short dark brown hair, light-tan skin, clean-shaven, average build, wearing Light blue button-down shirt, sleeves rolled up, no tie. Diego has no good answer to Lucía's question and feels the weight of not knowing, pausing for a moment before deciding to do something about it instead of guessing. He is not speaking to anyone, just reacting internally to the problem she pointed out. He stays quiet for a beat, then reaches for his phone on the desk, still seated in the same small office. No dialogue: ambient sound only. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 4** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Diego, an Argentine man in his late 30s, short dark brown hair, light-tan skin, clean-shaven, average build, wearing Light blue button-down shirt, sleeves rolled up, no tie. Diego feels relieved and more confident now, explaining to Lucía what he found as a direct answer to her doubt. He wants to show her that he finally has real information instead of just names on paper. He speaks to her while setting the handwritten note aside on his desk, in the same small office with the warm afternoon light. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Acá por lo menos veo los trabajos y lo que dijeron los clientes.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 6** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Diego, an Argentine man in his late 30s, short dark brown hair, light-tan skin, clean-shaven, average build, wearing Light blue button-down shirt, sleeves rolled up, no tie. Diego feels in control for the first time, telling Lucía with quiet satisfaction that he has already acted instead of guessing. He wants her to see that he moved past the uncertainty from before. He speaks to her from his desk while the handwritten note sits forgotten at the edge of the table, same small office, same afternoon light. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Les pedí cotización a dos. Ya no elijo a ciegas.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 90** (cierre):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Presentadora, a friendly, confident woman presenter, stands in a bright, clean, modern space with soft light and a softly blurred background. She looks straight into the camera, smiles and starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'sin vueltas ¡YA!. sin vueltas ¡YA! Compará proveedores verificados y pedí tu cotización sin compromiso.' Warm, close and confident, like a presenter closing a commercial. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, eye level, static camera with a very subtle slow push-in. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.


### 7. Director de montaje (IA) — sobre las escenas del storyboard
- Diagnóstico: Un caso sobrio donde el contraste papel-pantalla ya está en el material, así que el montaje sólo tiene que marcar el momento en que Diego deja de adivinar y pasa a comparar.
- Decisión: **music_dip** en la escena 2 (final, 0.6 s) — Después de la pregunta de Lucía, Diego se queda callado un segundo antes de tomar el celular; bajar la música deja respirar ese silencio incómodo sin tapar ninguna voz.
- Decisión: **cut** en la escena 4 (antes) — El pasaje del papel apoyado a un costado a la pantalla con la categoría catering es el contraste central: conviene seco, sin transición que lo suavice.
- Decisión: **music_lift** en la escena 5 (inicio, 0.8 s) — Plano sin diálogo de las fichas con fotos y reseñas: la música sostiene el valor estético del momento de comparación sin competir con nadie.
- Decisión: **dissolve** en la escena 7 (antes, 0.8 s) — Último plano sin voz, con el papel olvidado al borde del escritorio; la transición suave cierra el caso y entrega la pieza a la placa de logo.

---

## Caso 9 · Munify
**Elección del usuario:** objetivo «Conseguir consultas» · tipo de historia «Producto a la vista» · clima «Sobrio». Formato: reel-hibrido-9-16.
**Rubro:** GovTech / gestion municipal (gobiernos locales)

### 1. Estrategia (la pieza que propuso)
- Ángulo: Tres meses gratis
- Mensaje principal: El municipio puede poner a andar Munify —reclamos, trámites y gestión financiera— durante 3 meses gratis, sin compromiso ni tarjeta de crédito, y recién después decidir.
- Brief creativo: Esta pieza cuenta una sola cosa: la oferta. Munify es el sistema que conecta al vecino con su municipio —reclamar, tramitar y pagar desde el celular— y que puertas adentro ordena la plata, y se puede probar tres meses gratis sin tarjeta y sin permanencia. Prueba el ángulo con el combo de los tres módulos, la capacitación incluida y el hecho de que para el vecino la app no cuesta nada; cierra invitando a hablar con un asesor del equipo para confirmar el precio según el tamaño del municipio.
- Datos que lo sostienen: Combo 3 módulos (Reclamos + Trámites + Gestión Financiera): 3 meses gratis sin compromiso ni tarjeta de crédito · Precio combinado menor a la suma de los módulos sueltos, capacitación incluida e implementación en 1 a 2 semanas · El municipio paga por habitante, en pesos argentinos, sin permanencia; el precio exacto lo confirma un asesor según el tamaño del municipio · La app es gratis para el vecino (Play Store, App Store, PWA y bot de WhatsApp)

### 2. Concepto (propuso varias; el caso toma la primera)
**ELEGIDA: Reclamo punta a punta**
- tipoGancho: DEMOSTRACIÓN DIRECTA
- idea: Un director de modernización apoya el celular en el escritorio y muestra paso a paso un reclamo cargado esa mañana: entra con foto, se deriva a la dependencia, la cuadrilla lo cierra con la foto final y el vecino queda avisado. Cierra aclarando que todo eso lo están probando dentro de los tres meses gratis.
- tono: Didáctico y tranquilo, de quien muestra lo que usa
- estetica: Oficina municipal real, luz natural de ventana, paleta neutra, encuadres fijos y limpios, celular y pantalla como protagonistas.
- referencia: Demostración de producto institucional a cámara
- porQueFunciona: Muestra el circuito completo funcionando y vuelve la prueba gratis una decisión sin riesgo.
**Alternativa 2: Trámite sin mostrador**
- tipoGancho: DOBLE PERSPECTIVA
- idea: Una vecina resuelve desde su cocina un trámite que antes la obligaba a pedir el día: valida su identidad con DNI y selfie, adjunta la documentación y paga. En la oficina, el mismo pedido llega listo para aprobar. Una voz aclara que para ella la app es gratis y que el municipio lo prueba tres meses sin tarjeta.
- tono: Claro, cercano, sin énfasis; afirmaciones breves
- estetica: Dos ambientes alternados, cocina cálida y oficina sobria, misma luz suave, texturas cotidianas, sin gráficos ni efectos.
- referencia: Pieza de servicio público con dos escenarios
- porQueFunciona: Une beneficio del vecino y del municipio, y presenta la prueba gratis como paso natural.
**Alternativa 3: La plata ordenada**
- tipoGancho: OBJECIÓN RESUELTA
- idea: En contaduría, la responsable repasa una orden de pago que viaja de pendiente a autorizada y, al pagarse, aparece sola en el movimiento de tesorería, sin volver a cargarla en planillas. El intendente pregunta cuánto cuesta probarlo: tres meses gratis, sin tarjeta, capacitación incluida, y el precio lo confirma un asesor.
- tono: Sobrio, administrativo, respetuoso del oficio
- estetica: Interior de oficina con papeles y carpetas, luz fría controlada, cámara quieta, planos cortos de manos y pantalla.
- referencia: Aviso de software de gestión para organismos
- porQueFunciona: Ataca la objeción de presupuesto mostrando trabajo interno resuelto antes de pagar nada.

### 3. Guion
- **[hook]** Este reclamo entró hoy, ocho y diez. Mirá. — _visual:_ Marcelo apoya el celular inclinado contra el monitor y gira la silla hacia cámara; detrás, oficina municipal con luz de ventana.
- **[desarrollo]** Lo tomó la dependencia que corresponde, sin que nadie lo mueva a mano. A las once la cuadrilla subió la foto del cierre. El vecino ya lo sabía. — _visual:_ Marcelo desliza el dedo por el seguimiento del reclamo en el celular y se detiene en la foto final; en el fondo, un escritorio despejado.
- **[giro]** Y todavía estamos en los tres meses de prueba. — _visual:_ Marcelo deja el celular sobre el escritorio, se recuesta en la silla y encoge los hombros con una media sonrisa.
- **[cta]** Munify. Combo 3 módulos: 3 meses gratis, sin compromiso ni tarjeta de crédito. — _visual:_ Placa final sobre fondo neutro con el logo de Munify.
- Música pedida: mood: calma institucional sobria

### 4. Personajes
- **Marcelo** (Director de modernización que demuestra el circuito del reclamo): Man in his late 40s, short greying hair, light olive skin tone, calm face with faint smile lines, medium build, seated posture with relaxed shoulders, professional but approachable demeanor · ropa: Light blue buttoned shirt, no jacket, long sleeves rolled down
- Lugar: A real municipal office space with a desk, a monitor, and a window providing natural light, neutral-toned walls, uncluttered surfaces, a lived-in but orderly administrative atmosphere typical of a local government back office

### 5. Storyboard
- **Escena 1** (hook, 5.5 s, medium shot) · en cuadro: p1
  - Dice: Este reclamo entró hoy, ocho y diez. Mirá.
  - Acción: Marcelo apoya el celular contra el monitor y gira hacia cámara
  - Acción (para el generador): Marcelo is settling into his desk, wanting to share something that just happened with whoever he is talking to, speaking directly to camera as if addressing a colleague. He leans the phone against the monitor at an angle so it stays upright, then turns his chair toward camera with calm confidence, ready to explain. He is seated at his municipal office desk, soft natural window light falling across the desk and the tidy workspace behind him.
- **Escena 2** (desarrollo, 5.5 s, medium close-up) · en cuadro: p1
  - Dice: Lo tomó la dependencia que corresponde, sin que nadie lo mueva a mano.
  - Acción: Marcelo explica cómo se asignó el reclamo sin intervención manual
  - Acción (para el generador): Marcelo wants to make clear to camera that the process ran on its own, without anyone having to push it forward, speaking with quiet pride and precision rather than excitement. He keeps a steady, attentive posture, glancing briefly at the phone beside him on the desk as a reference point without picking it up. He remains seated at his municipal office desk, the same soft window light and tidy background behind him.
- **Escena 3** (desarrollo, 6.5 s, over-the-shoulder) · en cuadro: p1
  - Dice: A las once la cuadrilla subió la foto del cierre. El vecino ya lo sabía.
  - Acción: Marcelo mira el celular y señala el avance con la mirada
  - Acción (para el generador): Marcelo is tracking the progress of the claim with genuine satisfaction, wanting to show the viewer that the work moved forward on its own timeline. He looks down toward the phone resting against the monitor, following the information with his eyes without touching or typing on it, then looks back up to continue speaking to camera. He stays seated at the same municipal office desk, the window light unchanged, the desk calm and uncluttered behind him.
- **Escena 4** (giro, 5.5 s, medium shot) · en cuadro: p1
  - Dice: Y todavía estamos en los tres meses de prueba.
  - Acción: Marcelo se recuesta, encoge los hombros con media sonrisa
  - Acción (para el generador): Marcelo wants to land the real point of the story with a relaxed, almost understated confidence, speaking to camera as if sharing a small secret that matters more than it sounds. He sets the phone down flat on the desk, leans back into his chair, and gives a light shrug with a half smile, letting the fact speak for itself. He remains at his municipal office desk, the same natural window light and tidy background behind him.
- **Escena 5** (cta, 3.5 s, plano s/d)
  - Dice: —
  - Acción: Placa: Munify. Combo 3 módulos: 3 meses gratis, sin compromiso ni tarjeta de crédito.

### 6. Pedidos a Google Flow (Veo 3), tal cual se mandan
- **Retrato de Marcelo:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Man in his late 40s, short greying hair, light olive skin tone, calm face with faint smile lines, medium build, seated posture with relaxed shoulders, professional but approachable demeanor, standing and looking at the camera, natural pose, neutral background with a hint of a real municipal office space with a desk, a monitor. A still photo, no action, no dialogue.
- **Retrato de Presentadora:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine a friendly, confident woman presenter in her early thirties, natural makeup, warm smile, neat hair, an ordinary everyday face, standing and looking at the camera, natural pose, neutral background. A still photo, no action, no dialogue.
- **Escena 1** (hook):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marcelo, an Argentine man in his late 40s, short greying hair, light olive skin tone, calm face with faint smile lines, wearing Light blue buttoned shirt, no jacket, long sleeves rolled down. Marcelo is settling into his desk, wanting to share something that just happened with whoever he is talking to, speaking directly to camera as if addressing a colleague. He leans the phone against the monitor at an angle so it stays upright, then turns his chair toward camera with calm confidence, ready to explain. He is seated at his municipal office desk, soft natural window light falling across the desk and the tidy workspace behind him. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Este reclamo entró hoy, ocho y diez. Mirá.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 2** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marcelo, an Argentine man in his late 40s, short greying hair, light olive skin tone, calm face with faint smile lines, wearing Light blue buttoned shirt, no jacket, long sleeves rolled down. Marcelo wants to make clear to camera that the process ran on its own, without anyone having to push it forward, speaking with quiet pride and precision rather than excitement. He keeps a steady, attentive posture, glancing briefly at the phone beside him on the desk as a reference point without picking it up. He remains seated at his municipal office desk, the same soft window light and tidy background behind him. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Lo tomó la dependencia que corresponde, sin que nadie lo mueva a mano.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 3** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marcelo, an Argentine man in his late 40s, short greying hair, light olive skin tone, calm face with faint smile lines, wearing Light blue buttoned shirt, no jacket, long sleeves rolled down. Marcelo is tracking the progress of the claim with genuine satisfaction, wanting to show the viewer that the work moved forward on its own timeline. He looks down toward the phone resting against the monitor, following the information with his eyes without touching or typing on it, then looks back up to continue speaking to camera. He stays seated at the same municipal office desk, the window light unchanged, the desk calm and uncluttered behind him. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'A las once la cuadrilla subió la foto del cierre. El vecino ya lo sabía.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Over-the-shoulder shot, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 4** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marcelo, an Argentine man in his late 40s, short greying hair, light olive skin tone, calm face with faint smile lines, wearing Light blue buttoned shirt, no jacket, long sleeves rolled down. Marcelo wants to land the real point of the story with a relaxed, almost understated confidence, speaking to camera as if sharing a small secret that matters more than it sounds. He sets the phone down flat on the desk, leans back into his chair, and gives a light shrug with a half smile, letting the fact speak for itself. He remains at his municipal office desk, the same natural window light and tidy background behind him. He starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Y todavía estamos en los tres meses de prueba.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 90** (cierre):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Presentadora, a friendly, confident woman presenter, stands in a bright, clean, modern space with soft light and a softly blurred background. She looks straight into the camera, smiles and starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Munify. Munify. Combo 3 módulos: 3 meses gratis, sin compromiso ni tarjeta de crédito.' Warm, close and confident, like a presenter closing a commercial. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, eye level, static camera with a very subtle slow push-in. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.


### 7. Director de montaje (IA) — sobre las escenas del storyboard
- Diagnóstico: Es una demo a cámara de un circuito real: lo que hay que proteger es la claridad de la operación en el celular y el remate tranquilo de los tres meses, no agregar energía que el material no tiene.
- Decisión: **cut** en la escena 2 (antes) — Marcelo pasa de mostrar el reclamo a explicar la derivación: corte seco para que el seguimiento en pantalla se lea como un paso que sigue al anterior, sin suavizar con transición.
- Decisión: **music_dip** en la escena 3 (final, 0.6 s) — Cuando se detiene en la foto del cierre y dice 'el vecino ya lo sabía', bajar la música deja esa evidencia como dato, sin subrayado.
- Decisión: **music_dip** en la escena 4 (inicio, 0.5 s) — Apoya el gesto real de dejar el celular y recostarse en la silla antes de decir que todavía están en la prueba.
- Decisión: **dissolve** en la escena 4 (final, 0.8 s) — El encogimiento de hombros con media sonrisa cierra el relato; una disolvencia hacia la placa de logo da el final institucional limpio sin corte abrupto.

---

## Caso 10 · RepareHoy
**Elección del usuario:** objetivo «Campaña completa» · tipo de historia «Antes y después» · clima «Con humor». Formato: reel-hibrido-9-16.
**Rubro:** AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Los textos no nombran ningún barrio.

### 1. Estrategia (la pieza que propuso)
- Ángulo: Confianza a ciegas
- Mensaje principal: Arreglar algo en tu casa hoy significa transferir una seña a un alias y confiar a ciegas: RepareHoy se mete en el medio para que eso no dependa de la suerte.
- Brief creativo: Pieza de entrada: instala el problema real del cliente del AMBA, que no es la falta de plomeros sino la falta de reglas cuando aparece la plata. Cierra presentando a RepareHoy como el tercero que arbitra, con la seña retenida como prueba concreta de ese rol. No explica el flujo completo de la app: sólo deja clavada la idea de que existe otra forma de arreglar tu casa.
- Datos que lo sostienen: Contra qué compite: el WhatsApp y la confianza a ciegas, el plomero que no contesta, la seña por transferencia a un alias, el presupuesto que cambia cuando ya empezó y lo hablado que quedó en audios · RepareHoy hace de juez entre el que necesita arreglar algo en su casa y el que sabe hacerlo · La seña queda retenida por la plataforma y se le libera al proveedor recién cuando el trabajo está terminado · Marketplace de oficios para el hogar en el AMBA: Ciudad de Buenos Aires y Gran Buenos Aires

### 2. Concepto (propuso varias; el caso toma la primera)
**ELEGIDA: El alias dictado**
- tipoGancho: SERIEDAD ANTE LO MÍNIMO
- idea: Una mujer con una pérdida en el baño anota al teléfono, con solemnidad de escribano, un alias que le dictan letra por letra y repite dos veces para confirmarlo. Transfiere la seña sin saber a quién. Después cuenta el problema en RepareHoy, elige un presupuesto y paga la seña: queda retenida hasta que el trabajo esté hecho.
- tono: Seco, contenido, sin chiste subrayado; ironía en el gesto
- estetica: Baño y cocina reales de departamento, luz de ventana, celular en mano, insertos limpios de las pantallas de la app
- referencia: Spot comparativo de servicio, registro documental cotidiano
- porQueFunciona: El ritual del alias es reconocible y hace evidente que la seña retenida cambia todo.
**Alternativa 2: Mandame la seña**
- tipoGancho: REPETICIÓN CON VARIACIÓN
- idea: Un hombre escucha tres veces la misma frase: mandame la seña y mañana arranco. Las dos primeras, en la vereda y en un audio, terminan con él mirando la mancha de humedad intacta. La tercera llega dentro del chat de RepareHoy: paga sólo la seña y queda retenida hasta que el trabajo termine.
- tono: Ágil, resignado al principio, aliviado y práctico al final
- estetica: Pared manchada como ancla visual, vereda y living de barrio, paleta sobria, pantallas de la app como insertos verticales
- referencia: Publicidad de contraste por patrón repetido
- porQueFunciona: La frase repetida instala el riesgo; el cambio en la tercera vuelta demuestra el arbitraje.
**Alternativa 3: Transferir a ciegas**
- tipoGancho: LITERALIDAD VISUAL
- idea: Frente al homebanking, un hombre cierra los ojos y respira antes de confirmar la transferencia de una seña, como quien se mete al agua helada. Su pareja lo mira sin decir nada. Más tarde ya no hace falta ese gesto: cuenta el problema en la app, paga ahí la seña y la plataforma la retiene hasta terminar el trabajo.
- tono: Observacional, cómplice entre los dos, humor en el silencio
- estetica: Mesa de comedor de noche, luz cálida y pantalla de celular iluminando caras; insertos de la app sobrios
- referencia: Comparativo doméstico de marca de servicios
- porQueFunciona: Vuelve visible la confianza a ciegas y presenta la seña retenida como el alivio concreto.

### 3. Guion
- **[hook]** Pará. ¿El alias es con K o con C? — _visual:_ Baño de departamento, balde bajo el caño que gotea; Vale con el teléfono al hombro anota letra por letra en el dorso de un ticket.
- **[desarrollo]** Te lo repito: martillo, punto, azul, veintiuno. Martillo, punto, azul, veintiuno. ¿Y el nombre del titular quién es? — _visual:_ Vale lee el papel como un escribano mientras confirma la transferencia en el home banking, y se queda mirando un nombre que no reconoce.
- **[desarrollo]** (sin texto) — _visual:_ Cocina con luz de ventana: Vale escribe lo que le pasa en Contar el problema e insertos de Te esperan tus proveedores con los presupuestos que llegaron solos.
- **[giro]** Pagué, pero la plata queda ahí hasta que lo arregle. — _visual:_ Inserto de Pagar la seña con la seña retenida, y Vale usando el papelito del alias para secar la gota del borde del balde.
- **[cta]** Entrá a reparehoy.com.ar y contá qué hay que arreglar — _visual:_ Placa final sobre fondo limpio con el logo de RepareHoy y la URL.
- Música pedida: mood: cotidiano, seco, irónico

### 4. Personajes
- **Vale** (Protagonista que vive el contraste entre pagar a ciegas y pagar con seña retenida): Woman in her early thirties, medium-length dark hair tied back loosely, light olive skin, tired but focused expression, no makeup emphasis, average build, natural at-home posture, phone wedged between shoulder and ear · ropa: Plain grey t-shirt, casual house pants, no shoes
- Lugar: A modest real apartment: a small bathroom with a dripping pipe over a plastic bucket, worn tile, and a narrow window; adjoining kitchen with a table, natural window light, everyday clutter, no staging, documentary domestic feel

### 5. Storyboard
- **Escena 1** (hook, 3 s, medium close-up) · en cuadro: p1
  - Dice: —
  - Acción: Vale anota el alias letra por letra con el teléfono al hombro
  - Acción (para el generador): Vale is on the phone with a plumber, trying to get a bank alias right before paying blindly, frustrated and unsure she's writing it down correctly. She talks to the person on the phone, not to camera, double-checking the spelling. She presses the phone against her shoulder with her head tilted and scribbles on the back of a ticket, standing in her small bathroom with a dripping pipe and a plastic bucket behind her, worn tile, narrow window light.
- **Escena 2** (desarrollo, 3 s, over-the-shoulder) · en cuadro: p1
  - Dice: —
  - Acción: Vale repite el alias en voz alta mientras confirma la transferencia
  - Acción (para el generador): Vale is repeating a string of random words out loud to make sure she heard the alias correctly, concentrating hard so she doesn't make a mistake with the money. She speaks toward the phone wedged on her shoulder, treating the moment with the seriousness of a notary reading a document. She holds the ticket like a script and glances toward her phone screen in the bathroom, bucket and dripping pipe still behind her.
- **Escena 3** (desarrollo, 3 s, close-up) · en cuadro: p1
  - Dice: —
  - Acción: Vale se queda mirando un nombre que no reconoce
  - Acción (para el generador): Vale finishes confirming the transfer and asks who the account holder actually is, then freezes for a second, unsettled by seeing an unfamiliar name on her screen. She reacts with quiet doubt, not panic, the kind of small hesitation that comes from sending money to a stranger without any real guarantee. She stands still in the bathroom, still holding the ticket, the dripping pipe and bucket visible behind her.
- **Escena 4** (desarrollo, 1.5 s, medium shot) · en cuadro: p1
  - Dice: —
  - Acción: Vale escribe en la cocina lo que le pasa en el baño
  - Acción (para el generador): Vale sits at her kitchen table in natural window daylight, writing down what's happening in her bathroom in her own words, calm and relieved to just describe the problem instead of chasing anyone. She focuses on her phone resting on the table, her expression settling after the earlier tension. The kitchen is modest and lived-in, with everyday clutter and soft midday light.
- **Escena 5** (desarrollo, 1.5 s, close-up) · pantalla de la app: «Contar el problema»
  - Dice: —
  - Acción: Se ve la pantalla donde cuenta el problema en cuatro pasos
- **Escena 6** (desarrollo, 1.5 s, close-up) · pantalla de la app: «Te esperan tus proveedores»
  - Dice: —
  - Acción: Se ve la pantalla con los presupuestos que llegaron solos
- **Escena 7** (giro, 1.5 s, close-up) · pantalla de la app: «Pagar la seña»
  - Dice: —
  - Acción: Se ve la pantalla con la seña pagada y retenida
- **Escena 8** (giro, 6.5 s, medium close-up) · en cuadro: p1
  - Dice: Pagué, pero la plata queda ahí hasta que lo arregle.
  - Acción: Vale usa el papelito del alias para secar la gota del balde
  - Acción (para el generador): Vale explains to herself, almost to camera, that she already paid but the money stays held until the job is actually finished, with a tone of relief rather than complaint. She takes the same ticket she used earlier to write the alias and casually wipes a drop from the edge of the bucket, as if the paper finally found a better use. She's back in the bathroom, the pipe still dripping behind her.
- **Escena 9** (cta, 4 s, wide shot)
  - Dice: —
  - Acción: Placa final con logo de RepareHoy y la URL: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar

### 6. Pedidos a Google Flow (Veo 3), tal cual se mandan
- **Retrato de Vale:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman in her early thirties, medium-length dark hair tied back loosely, light olive skin, tired but focused expression, no makeup emphasis, average build, natural at-home posture, phone wedged between shoulder and ear, standing and looking at the camera, natural pose, neutral background with a hint of a modest real apartment: a small bathroom with a dripping pipe over a plastic. A still photo, no action, no dialogue.
- **Retrato de Presentadora:** Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine a friendly, confident woman presenter in her early thirties, natural makeup, warm smile, neat hair, an ordinary everyday face, standing and looking at the camera, natural pose, neutral background. A still photo, no action, no dialogue.
- **Escena 1** (hook):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, medium-length dark hair tied back loosely, light olive skin, tired but focused expression, wearing Plain grey t-shirt, casual house pants, no shoes. Vale is on the phone with a plumber, trying to get a bank alias right before paying blindly, frustrated and unsure she's writing it down correctly. She talks to the person on the phone, not to camera, double-checking the spelling. She presses the phone against her shoulder with her head tilted and scribbles on the back of a ticket, standing in her small bathroom with a dripping pipe and a plastic bucket behind her, worn tile, narrow window light. No dialogue: ambient sound only. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 2** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, medium-length dark hair tied back loosely, light olive skin, tired but focused expression, wearing Plain grey t-shirt, casual house pants, no shoes. Vale is repeating a string of random words out loud to make sure she heard the alias correctly, concentrating hard so she doesn't make a mistake with the money. She speaks toward the phone wedged on her shoulder, treating the moment with the seriousness of a notary reading a document. She holds the ticket like a script and glances toward her phone screen in the bathroom, bucket and dripping pipe still behind her. No dialogue: ambient sound only. Over-the-shoulder shot, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 3** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, medium-length dark hair tied back loosely, light olive skin, tired but focused expression, wearing Plain grey t-shirt, casual house pants, no shoes. Vale finishes confirming the transfer and asks who the account holder actually is, then freezes for a second, unsettled by seeing an unfamiliar name on her screen. She reacts with quiet doubt, not panic, the kind of small hesitation that comes from sending money to a stranger without any real guarantee. She stands still in the bathroom, still holding the ticket, the dripping pipe and bucket visible behind her. No dialogue: ambient sound only. Close-up on the face and hands, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 4** (desarrollo):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, medium-length dark hair tied back loosely, light olive skin, tired but focused expression, wearing Plain grey t-shirt, casual house pants, no shoes. Vale sits at her kitchen table in natural window daylight, writing down what's happening in her bathroom in her own words, calm and relieved to just describe the problem instead of chasing anyone. She focuses on her phone resting on the table, her expression settling after the earlier tension. The kitchen is modest and lived-in, with everyday clutter and soft midday light. No dialogue: ambient sound only. Medium shot, waist up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 8** (giro):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vale, an Argentine woman in her early thirties, medium-length dark hair tied back loosely, light olive skin, tired but focused expression, wearing Plain grey t-shirt, casual house pants, no shoes. Vale explains to herself, almost to camera, that she already paid but the money stays held until the job is actually finished, with a tone of relief rather than complaint. She takes the same ticket she used earlier to write the alias and casually wipes a drop from the edge of the bucket, as if the paper finally found a better use. She's back in the bathroom, the pipe still dripping behind her. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Pagué, pero la plata queda ahí hasta que lo arregle.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

- **Escena 90** (cierre):

  > Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Presentadora, a friendly, confident woman presenter, stands in a bright, clean, modern space with soft light and a softly blurred background. She looks straight into the camera, smiles and starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'RepareHoy. Entrá a reparehoy.com.ar y contá qué hay que arreglar' Warm, close and confident, like a presenter closing a commercial. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, eye level, static camera with a very subtle slow push-in. Leave some empty headroom at the top of the frame; nothing drawn or written there. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.


### 7. Director de montaje (IA) — sobre las escenas del storyboard
- Diagnóstico: El spot vive de un contraste simple: el ritual solemne del alias dictado contra la seña que queda retenida, así que el montaje sólo tiene que marcar el cambio de estado y dejar respirar la única línea hablada.
- Decisión: **cut** en la escena 4 (antes) — Es el pasaje del baño con el balde y el papel del alias a la app: corte seco, sin transición, para que la diferencia entre los dos estados se note de golpe y no se suavice.
- Decisión: **music_lift** en la escena 4 (inicio, 0.6 s) — Primera escena sin voz ni diálogo: los presupuestos que aparecen en pantalla necesitan un empuje musical breve para leerse como el momento en que algo empieza a funcionar.
- Decisión: **music_drop** en la escena 8 (antes, 0.5 s) — Antes de la única frase del spot, 'Pagué, pero la plata queda ahí hasta que lo arregle': el vacío sonoro la deja sola y sostiene el tono seco, sin subrayar el chiste.
- Decisión: **music_dip** en la escena 8 (final, 0.5 s) — Al terminar la frase, bajar la música un instante para que el remate asiente antes de entrar a la placa con logo y URL.
