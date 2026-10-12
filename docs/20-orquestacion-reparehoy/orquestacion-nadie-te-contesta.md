# La orquestación de "Nadie te contesta", paso a paso

**Qué es esto:** cómo la pieza pasa de la ficha del negocio a los pedidos a Flow, paso por paso, y cómo cambió eso entre la versión de la madrugada del 11/10 (la que se filmó, corrida de 5:42 a 6:39) y la de la tarde (después de siete vueltas). Sale de las corridas que quedaron registradas en la base: lo que recibió y lo que devolvió cada paso, tal cual. Los pedidos exactos que recibió el modelo en cada paso están en el anexo (`orquestacion-nadie-te-contesta-pedidos.md`).

## La cadena

**Estrategia → Concepto → Guion → Personajes → Storyboard → Pedidos a Flow.** Cada paso recibe lo que devolvió el anterior. Del guion en adelante es donde se trabajó a la tarde; la estrategia y el concepto son los mismos en las dos versiones.

## Paso 1 · Estrategia (lo que define la pieza)

*Molde strategy/2.1 · modelo claude-opus-5 · 49 s · 05:42 (hora argentina)*

- **Posicionamiento de la marca:** RepareHoy es el marketplace de oficios del AMBA donde contás el problema en tus palabras y recibís hasta tres presupuestos de profesionales verificados de tu zona, con el chat, el plan de pagos y la seña retenida dentro de la misma app. No es una agenda de contactos: es el tercero que ordena la plata y deja registro de lo acordado hasta que el trabajo está hecho.
- **Esta pieza:** "Nadie te contesta" — Dejá de perseguir a alguien que te conteste: contá el problema una vez y los presupuestos llegan a tu pantalla.
- **Mensaje principal (en la pieza):** Dejá de perseguir a alguien que te conteste: contá el problema una vez y los presupuestos llegan a tu pantalla.
- **Hechos que la sostienen:** Pedís presupuesto por WhatsApp y la mayoría no contesta · El cliente cuenta el problema en sus palabras y recibe hasta tres presupuestos de profesionales verificados de su zona · El cliente no persigue a nadie: publica el problema y le llegan los presupuestos · La tira 'Te esperan tus proveedores' en la pantalla de inicio, con los trabajos que esperan algo suyo ordenados por urgencia

## Paso 2 · Concepto (la idea elegida)

*Molde concept/3.1 · modelo claude-opus-5 · 33 s · 05:43 (hora argentina) · propuso varias ideas y se eligió una*

- **Enfoque:** dos-lados · **Tratamiento:** aspiracional
- **Idea:** Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.
- **Tono:** Directo, profesional, orgulloso sin grandilocuencia; charla real · **Estética:** Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo
- **Por qué funciona:** Dos voces explican el mismo alivio y la interfaz lo confirma al instante.

---

## Versión de la madrugada del 11/10 (la que se filmó)

### Paso 3 · Guion

*Molde script/2.1 · modelo claude-opus-5 · 29 s · 05:44 (hora argentina)*

- **hook**, 4 s: "Mandaba mensajes a cinco plomeros. No contestaba ninguno."  
  Se ve: Retrato a cámara de la vecina en su casa, luz suave de ventana
- **desarrollo**, 12 s: "Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez, en mis palabras. Y el pedido me llega a la bandeja, con mi zona y mi oficio."  
  Se ve: Alternancia entre la electricista en obra y la pantalla Contar el problema avanzando hasta la Bandeja de solicitudes
- **giro**, 5 s: "Abrí la app y ya tenía los presupuestos. No perseguí a nadie."  
  Se ve: La tira Te esperan tus proveedores apareciendo en la pantalla de inicio de la vecina
- **cta**, 5 s: "Entrá a reparé hoy punto com punto ar y contá qué hay que arreglar."  
  Se ve: Las dos, cada una en su lugar, con el logo y la URL reparehoy.com.ar sobre fondo limpio

### Paso 4 · Personajes

*Molde cast/2.0 · modelo claude-sonnet-5 · 11 s · 05:44 (hora argentina)*

- **Vecina** — Destinataria del servicio: cuenta su necesidad y muestra en su pantalla los presupuestos que recibe. Mujer de unos 35 años, pelo castaño oscuro a los hombros, expresión cálida y cercana Ropa: Ropa de entrecasa prolija, sweater claro.
- **Electricista** — Profesional que recibe el pedido en su bandeja según zona y oficio, y cuenta su experiencia. Mujer de unos 32 años, pelo oscuro atado, expresión segura y profesional Ropa: Camisa de trabajo, chaleco con bolsillos.
- Locación general: Two connected real-life settings: a cozy home interior near a window with soft natural light for the testimonial, and a mid-renovation space with exposed wiring, tools and unfinished walls where the electrician works, both clean and realistic without staging.

### Paso 5 · Storyboard

*Molde storyboard/2.1 · modelo claude-sonnet-5 · 27 s · 05:45 (hora argentina)*

1. **hook, 4 s** — medium shot waist-up · sin personas. Vecina mira el celular con gesto de resignación, luz de ventana  
   Dice: "Mandaba mensajes a cinco plomeros. No contestaba ninguno."  
   *(el normalizador le sacó la persona (frase corta → "voz en off"); el modelo había puesto 8 s)*
2. **desarrollo, 8 s** — medium shot waist-up · en cuadro: Vecina. Vecina sigue hablando, cambia de gesto a esperanza  
   Dice: "Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez."
3. **desarrollo, 4 s** — PANTALLA DE LA APP "Contar el problema". Barra de pasos avanza: problema, superficie, zona, resumen final  
   Dice: "En mis palabras."  
   *(el modelo había puesto 5 s)*
4. **desarrollo, 8 s** — medium shot · en cuadro: Electricista. Electricista revisa su teléfono en la obra, gesto atento  
   Dice: "Y el pedido me llega a la bandeja, con mi zona y mi oficio."
5. **desarrollo, 6 s** — PANTALLA DE LA APP "Bandeja de solicitudes". Pedido nuevo entra como pendiente en la bandeja del proveedor  
   Dice: "Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez, en mis palabras."  
   *(la dividió el normalizador; el modelo había puesto 3 s)*
6. **giro, 5 s** — PANTALLA DE LA APP "Presupuestos recibidos". Vecina sonríe mirando el celular con alivio, mensaje de presupuestos recibidos en pantalla  
   Dice: "Abrí la app y ya tenía los presupuestos. No perseguí a nadie."  
   *(el normalizador le sacó la persona (frase corta → "voz en off"); el modelo había puesto 4 s)*
7. **cta, 6 s** — wide shot · sin personas. Logo y URL sobre fondo limpio, voz en off invita a entrar a la app  
   Dice: "Entrá a reparé hoy punto com punto ar y contá qué hay que arreglar."  
   *(el normalizador le sacó la persona (frase corta → "voz en off"); el modelo había puesto 2 s)*

### Paso 6 · Pedidos a Flow (se compilan sin IA)

*Molde flowpack/2.0-compilado · modelo claude-sonnet-5 · 6 s · 05:46 (hora argentina)*

**Escena 1** (hook):

> Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Location: Two connected real-life settings: a cozy home interior near a window with soft natural light for the testimonial. Neighbor looks at her phone with a gesture of resignation, window light. No spoken dialogue, ambient sound only. One single continuous take, same background, no cut. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text.

**Escena 2** (desarrollo):

> Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Location: Two connected real-life settings: a cozy home interior near a window with soft natural light for the testimonial. Vecina, an Argentine Woman around 35 years old, light olive skin, dark brown shoulder-length hair, natural everyday makeup, warm approachable expression. Medium shot, waist-up framing, the person fills a good portion of the frame with strong, dominant presence. The camera holds steady or does a very subtle slow push-in while speaking. Action: Neighbor keeps talking, shifts her expression to hope. She speaks directly to camera in Argentine Rioplatense Spanish (voseo), fluently and naturally, only once and without repeating any words: 'Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez.' Warm and assured delivery, explaining with confidence. The person keeps talking for the whole clip, warm, confident and charming tone, realistic expressive face. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text.

**Escena 4** (desarrollo):

> Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Location: Two connected real-life settings: a cozy home interior near a window with soft natural light for the testimonial. Electricista, an Argentine Woman around 32 years old, tan skin, dark hair tied back in a practical ponytail, confident calm expression. Medium shot, waist-up framing, the person fills a good portion of the frame with strong, dominant presence. The camera holds steady or does a very subtle slow push-in while speaking. Action: Electrician checks his phone at the job site, attentive gesture. She speaks directly to camera in Argentine Rioplatense Spanish (voseo), fluently and naturally, only once and without repeating any words: 'Y el pedido me llega a la bandeja, con mi zona y mi oficio.' Warm and assured delivery, explaining with confidence. The person keeps talking for the whole clip, warm, confident and charming tone, realistic expressive face. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text.

### Lo que devolvió Flow (transcripción real de cada clip)

- **Clip de la escena 1:** "Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa. Una vez"
- **Clip de la escena 2:** "Y el pedido me llega a la bandeja con mi zona y mi oficio."
- **Clip de la escena 4:** "Y el pedido me llega a la bandeja con mi zona y mi oficio"

Los clips llegaron cruzados (la escena 1 trae la frase de la 2; la 2 y la 4, la misma frase): Flow estaba en dos variantes por pedido y el puente bajaba una por escena contando mal. Arreglado en el servidor (falta recargar la extensión).

---

## Versión final de la tarde (vuelta 7)

Misma estrategia y mismo concepto. Cambian los moldes de guion, personajes y storyboard, y el compilador de Flow.

### Paso 3 · Guion

*Molde script/3.5 · modelo claude-opus-5 · 37 s · 14:49 (hora argentina)*

- **hook** (dice: la vecina), 4 s: "Tres electricistas, ninguno contesta. Y la térmica sigue saltando."  
  Se ve: La vecina sostiene el celular con el chat sin respuesta mientras vuelve a levantar la térmica del tablero del pasillo.
- **desarrollo**, 5 s: *(sin voz)*  
  Se ve: Sus manos tipean en la mesa de la cocina y la pantalla Contar el problema avanza los cuatro pasos hasta el aviso de solicitud publicada.
- **desarrollo** (dice: la electricista), 7 s: "Me entró el corte de Villa Urquiza. Le paso el precio hoy."  
  Se ve: La electricista baja la pinza amperométrica y abre la Bandeja de solicitudes, donde el pedido pendiente pasa a cotizado.
- **giro** (dice: la vecina), 5 s: "Abro y ya tengo los presupuestos. No perseguí a nadie."  
  Se ve: La vecina con el mate en la mano ve aparecer la tira Te esperan tus proveedores en su pantalla de inicio.
- **cta** (dice: placa), 5 s: "RepareHoy: contá qué hay que arreglar."  
  Se ve: Placa final limpia con la marca sobre fondo claro y la dirección web.

### Paso 4 · Personajes

*Molde cast/2.2 · modelo claude-opus-5 · 20 s · 14:49 (hora argentina)*

- **Mariela** — La vecina: muestra el problema eléctrico sin resolver y el alivio de recibir presupuestos sin perseguir a nadie. Mujer de 42, pelo castaño ondulado atado, piel oliva, pecas suaves, mirada cansada y cálida. Ropa: Buzo gris de algodón, remera blanca abajo.  
  Su lugar: Her own ground-floor apartment in Villa Urquiza: tiled kitchen with a formica table, mate gourd and thermos, and the hallway breaker panel she keeps resetting. A hand-painted ceramic tile from Mar del Plata hangs by the door. Grey afternoon light through a patio window.
- **Vanina** — La electricista: recibe el pedido con zona y oficio en su bandeja y cotiza el mismo día. Mujer de 35, pelo negro recogido, piel morena, cejas marcadas, manos de trabajo, mirada segura. Ropa: Camisa de trabajo azul arremangada, pantalón cargo.  
  Su lugar: Her work van's open side door parked on a plane-tree street in Villa Urquiza: cable spools, an amperometric clamp meter hanging from a hook, and a labelled drawer of breakers. A small crocheted taxi-charm from her grandmother dangles by the handle. Clear morning light.
- Locación general: A quiet Buenos Aires residential street with plane trees and low brick-and-tile houses. An open work van with cable spools and tools faces a building's hallway breaker panel and tiled kitchen doorway. Mate, phones and a clamp meter in frame. Soft daylight, clean practical finish.

### Paso 5 · Storyboard

*Molde storyboard/3.6 · modelo claude-opus-5 · 24 s · 14:50 (hora argentina)*

1. **hook, 5 s** — medium shot · en cuadro: Mariela. Mariela, con el celular en una mano y el chat sin respuesta, estira el brazo y levanta la térmica del tablero del pasillo; vuelve a saltar.  
   Dice: "Tres electricistas, ninguno contesta. Y la térmica sigue saltando."  
   *(el modelo había puesto 8 s)*
2. **desarrollo, 3 s** — PANTALLA DE LA APP "Contar el problema". La solicitud avanza los cuatro pasos: tipo de problema, datos, zona y descripción, y el resumen; al publicar aparece el aviso de solicitud publicada.
3. **desarrollo, 6 s** — handheld follow · en cuadro: Vanina. Vanina apoya la pinza amperométrica en el cajón de la camioneta, se gira hacia su ayudante fuera de cuadro y avisa que cotiza hoy.  
   Dice: "Me entró el corte de Villa Urquiza. Le paso el precio hoy."  
   *(el modelo había puesto 8 s)*
4. **desarrollo, 3 s** — PANTALLA DE LA APP "Bandeja de solicitudes". En la bandeja entra arriba el pedido nuevo como pendiente de cotizar y, al cotizarlo, pasa a la pastilla COTIZADO con su monto.
5. **giro, 5 s** — close-up · en cuadro: Mariela. Mariela, sentada con el mate en la mano, baja la vista al celular apoyado en la mesa, ve los presupuestos y pasa del cansancio al alivio.  
   Dice: "Abro y ya tengo los presupuestos. No perseguí a nadie."  
   *(el modelo había puesto 8 s)*
6. **giro, 3 s** — PANTALLA DE LA APP "Te esperan tus proveedores". En la home aparece la tira TE ESPERAN TUS PROVEEDORES con la primera tarjeta y se enciende el aviso rojo; llega la segunda y se suma al lado.
7. **cta, 3 s** — medium shot · sin personas. Placa final sobre fondo claro: RepareHoy. Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar

### Paso 6 · Pedidos a Flow (se compilan sin IA)

*Molde flowpack/3.1-compilado · modelo claude-sonnet-5 · 6 s · 14:50 (hora argentina)*

**Escena 1** (hook):

> Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Mariela, an Argentine woman around 42, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles on cheeks, wearing Grey cotton sweatshirt over a plain white tee. Mariela stands in her building's dim hallway in front of the open breaker panel, her phone already in her left hand showing a chat of sent messages with no replies. She glances down at it, speaks straight to camera with tired frankness, then reaches up with her right hand and pushes the breaker lever back up. It snaps down again on its own. She lowers her arm and looks at the panel, annoyed. Faint hum of the building, a distant street. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Tres electricistas, ninguno contesta. Y la térmica sigue saltando.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never recreate the brand app interface. A generic messaging chat may be visible on the phone (sent bubbles with no replies) but its text is never legible. No on-screen text. No subtitles, no captions.

**Escena 3** (desarrollo):

> Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vanina, an Argentine woman around 35, black hair in a tight low bun, medium brown skin, strong eyebrows, wearing Rolled-up blue work shirt and dark cargo trousers. Vanina stands at the open side door of her work van on the plane-tree street, the amperometric clamp meter already in her right hand. She lays it into the labelled breaker drawer, turns her shoulders toward someone off camera to her left and speaks to them with calm pride, tilting her head toward the street as if pointing out the job's neighbourhood. She closes the drawer with her knee. Morning birds, a car passing. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Me entró el corte de Villa Urquiza. Le paso el precio hoy.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Handheld camera following the movement, natural handheld feel, shallow depth of field. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

**Escena 5** (giro):

> Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Mariela, an Argentine woman around 42, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles on cheeks, wearing Grey cotton sweatshirt over a plain white tee. Mariela sits at the formica kitchen table with the mate gourd in her right hand, her phone lying flat on the table beside the thermos. She looks down at the screen as new quotes appear, her face shifting from tired to relieved, then lifts her eyes to camera and speaks with a small satisfied shrug before sipping the mate. Grey patio light, a kettle ticking. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Abro y ya tengo los presupuestos. No perseguí a nadie.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Close-up on the face and hands, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.

---

## Cómo fue cambiando, vuelta por vuelta

Cada vuelta corre los moldes reales sobre una copia de la pieza (no toca el proyecto), y el plan se juzga como comercial. La original de la madrugada sacó **4** como pieza (ChatGPT) y **5** como materia prima.

### Vuelta 1 · 14:27 (hora argentina) · ChatGPT 6 · Gemini 5 · Qwen 4

- **Qué cambió en las reglas:** Sin locutor: cada frase con quién la dice en cámara. Cada personaje con su lugar. Escena = situación, no cara; planos variados; la acción en inglés la escribe el storyboard. El compilador pone el contenido primero. El normalizador deja de convertir frases cortas en "voz en off" y los insertos de pantalla dejan de recibir frases que nadie dice.
- **Moldes:** script/3.0, cast/2.1, storyboard/3.0
- **Frases que salieron:** "Se me quemó el tablero y mandé mensajes a ciegas." (la vecina de Villa Urquiza) · "Yo antes esperaba que alguien me recomendara. Ahora el pedido me llega con la zona y el oficio." (la electricista de Villa Urquiza) · "Conté qué pasaba, en mis palabras. No perseguí a nadie." (la vecina de Villa Urquiza) · "Abrí el teléfono y los presupuestos ya estaban ahí." (la vecina de Villa Urquiza) · "Entrá a Repare Hoy punto com punto ar y contá qué hay que arreglar." (la vecina de Villa Urquiza)
- **Storyboard:** 7 escenas, 42 s

### Vuelta 2 · 14:31 (hora argentina) · ChatGPT 6,5

- **Qué cambió en las reglas:** Orden causal (le pasa, lo pide, le llega al otro, le contestan). Gancho con el dolor. Habla real, sin vocabulario de la app. Hasta 4 frases. El cierre en la placa. Nada que la marca no produzca. Una acción por escena. La ropa viaja en cada pedido.
- **Moldes:** script/3.1, cast/2.1, storyboard/3.1
- **Frases que salieron:** "Mandé cinco mensajes por el enchufe quemado. Nadie contestó." (la vecina) · "Esta vez conté lo que pasaba una sola vez." (la vecina) · "Me llegó un trabajo eléctrico a diez cuadras. Coticé." (la electricista) · "No perseguí a nadie. Los presupuestos ya estaban ahí." (la vecina)
- **Storyboard:** 8 escenas, 33 s

### Vuelta 3 · 14:34 (hora argentina) · ChatGPT 6,5

- **Qué cambió en las reglas:** El gancho empieza por el golpe, en presente. Un solo público: el otro lado le sirve a ese público. Un detalle propio por personaje. Frases de hasta 11 palabras. Pantallas de 2 a 3 s. Habla desde el primer segundo. A cámara, como mucho dos escenas. Objeto del problema reconocible. Profesional cuidadoso.
- **Moldes:** script/3.2, cast/2.1, storyboard/3.2
- **Frases que salieron:** "Cinco mensajes mandé. No me contestó nadie." (vecina de Villa Urquiza) · "Esta vez conté lo que pasaba, con mis palabras." (vecina de Villa Urquiza) · "Me llegó tu pedido solo. Te cotizé el mismo día." (electricista) · "Abrí el celu y ya tenía tres presupuestos esperándome." (vecina de Villa Urquiza)
- **Storyboard:** 7 escenas, 28 s

### Vuelta 4 · 14:38 (hora argentina) · ChatGPT 6 · materia prima 7

- **Qué cambió en las reglas:** "Hasta N" no es "N". Si dice "vos", va a cámara. Ortografía. Ropa en inglés. El país en los objetos. Lo que dice el gancho se ve (el chat sin respuesta). Nada de manos finas en primer plano. Una pantalla por frase.
- **Moldes:** script/3.3, cast/2.2, storyboard/3.3
- **Frases que salieron:** "Nadie me contesta. Le escribí a tres electricistas." (la vecina) · "Esta vez lo conté una sola vez, con mis palabras." (la vecina) · "A mí me llega el pedido de acá, de Villa Urquiza. Le paso el precio y listo." (la electricista) · "Abrí la app y los presupuestos ya estaban ahí. No perseguí a nadie." (la vecina)
- **Storyboard:** 8 escenas, 34 s

### Vuelta 5 · 14:43 (hora argentina) · materia prima 7

- **Qué cambió en las reglas:** El otro lado habla de ESE pedido. Tres frases hasta 26 s. Cada escena muestra el momento en que pasa, no a alguien contándolo.
- **Moldes:** script/3.4, cast/2.2, storyboard/3.4
- **Frases que salieron:** "Nadie me contesta. Tres días con la térmica saltando." (vecina de Villa Urquiza) · "Me senté a escribir qué me pasaba y lo publiqué ahí mismo." (vecina de Villa Urquiza) · "Me llegó el pedido: térmica que salta, acá en Villa Urquiza. Le pasé el precio ese día." (electricista de Villa Urquiza) · "No perseguí a nadie. Los presupuestos llegaron a mi pantalla." (vecina de Villa Urquiza)
- **Storyboard:** 8 escenas, 35 s

### Vuelta 6 · 14:46 (hora argentina) · ChatGPT 6,5 · materia prima 7,5

- **Qué cambió en las reglas:** Frases en presente, dichas en el momento. La placa con la marca escrita (no la pronunciación). El giro es la reacción al resultado.
- **Moldes:** script/3.5, cast/2.2, storyboard/3.5
- **Frases que salieron:** "Nadie me contesta. Mandé seis mensajes por la térmica." (vecina de Villa Urquiza) · "Me entra uno de Villa Urquiza, la térmica. Le paso el precio hoy." (electricista) · "Entraron solos los presupuestos. No llamé a nadie más." (vecina de Villa Urquiza)
- **Storyboard:** 6 escenas, 25 s

### Vuelta 7 · 14:49 (hora argentina) · ChatGPT 7 · materia prima 7 · Gemini 5,5 · Qwen 6

- **Qué cambió en las reglas:** Física de la escena (un objeto en un solo lugar), emoción simple, la frase después de lo que la provoca, el plano por encima del hombro no para frases con emoción.
- **Moldes:** script/3.5, cast/2.2, storyboard/3.6
- **Frases que salieron:** "Tres electricistas, ninguno contesta. Y la térmica sigue saltando." (la vecina) · "Me entró el corte de Villa Urquiza. Le paso el precio hoy." (la electricista) · "Abro y ya tengo los presupuestos. No perseguí a nadie." (la vecina)
- **Storyboard:** 7 escenas, 28 s

---

## Lo que queda pendiente en la orquestación

- **Modelo de Personajes y Storyboard:** en la configuración por defecto de la app corren con el modelo chico (Sonnet), sin pensar: así se escribió la de la madrugada. Las vueltas de la tarde forzaron Opus. Cambiarlo es configuración: **decisión tuya**.
- **"Lo mecánico va en una toma aparte, sin frase"** entró después de la vuelta 7: por eso la escena 1 de la final todavía mezcla la frase con la térmica que salta.
- **"Ninguna frase explica la publicidad"** también entró después: por eso el "No perseguí a nadie" del giro.
- La palabra "logo" en los pedidos a Flow hacía que Veo dibujara uno (el "CR" de los clips): ya se sacó.

