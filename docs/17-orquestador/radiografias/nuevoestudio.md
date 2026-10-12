Media Studio — Análisis y curación de calidad creativa
Caso de referencia: RepareHoy — reel «¿A cuántos escribiste?»  
Objetivo: mejorar guiones, storyboards y prompts para Flow sin rediseñar la orquestación audiovisual.  
Base del análisis: ficha comercial, concepto, guion, radiografía y prompts de las etapas `strategy/2.1`, `concept/3.1`, `script/3.6`, `cast/2.2`, `storyboard/3.7` y `flowpack/3.1` compartidos en la conversación.
---
1. Qué queremos resolver realmente
La arquitectura general de Media Studio ya funciona. Los mockups animados de las aplicaciones salen bien; representan fragmentos reales de la interfaz y son una fortaleza del sistema. El problema que queremos atacar no es el montaje ni la animación de pantallas, sino la calidad narrativa de los crudos:
Guion: ideas, conversaciones y escenas que tengan interés humano y valor publicitario.
Storyboard: acciones y situaciones que aporten a la historia, no movimientos decorativos.
Prompts de video para Flow/Veo: dirección de actores y continuidad dramática, además de los detalles técnicos.
Mockups: mantenerlos como están, salvo detectar inconsistencias con el caso narrativo; no rediseñar su motor.
Un clip puede ser visualmente cinematográfico y, al mismo tiempo, dramáticamente pobre. El sistema puede especificar la luz, la cámara, la ropa y el encuadre con precisión, pero si la escena consiste en «Qué difícil es encontrar un buen ferretero» / «Sí, qué lástima no tener una solución», no funciona como publicidad: los personajes hablan como una ficha de ventas.
> **Principio rector: la calidad narrativa precede a la calidad cinematográfica.** La fotografía embellece una escena; no puede reemplazar una intención humana, una interacción creíble o una idea publicitaria.
Alcance acordado
Sí: cambios mínimos en instrucciones de Concepto, Guion, Storyboard y Flow; autocrítica creativa dentro de las llamadas existentes; mejores diálogos, situaciones, acciones y dirección actoral.
No: rediseñar la arquitectura, cambiar los contratos JSON, agregar etapas o agentes por defecto, rehacer el montaje, tocar el motor de mockups, ni escribir una fórmula rígida que convierta todas las campañas en el mismo sketch.
---
2. Diagnóstico del ejemplo RepareHoy
2.1. Qué se quería contar
Marca: RepareHoy, marketplace de oficios para el hogar en el AMBA.
Ángulo comercial de esta pieza: «Presupuestos que llegan solos».
Mensaje: el cliente cuenta el problema en sus palabras y recibe hasta tres presupuestos de profesionales verificados de su zona; no tiene que perseguirlos uno por uno.
Momento demostrable: la tira real de la app «Te esperan tus proveedores» con presupuestos recibidos.
Concepto elegido: «¿A cuántos escribiste?». Martín muestra el resultado, Silvia pregunta a cuántos profesionales contactó, él responde que a ninguno y un flashback revela cómo publicó el problema de una puerta que no cierra.
Enfoque: un caso de principio a fin.
Tratamiento: cotidiano, con personas verosímiles y diálogos espontáneos.
Formato: reel híbrido de 26 segundos para redes, con personajes filmados y mockups reales en el material audiovisual.
El concepto tiene una observación humana útil: quien necesita un arreglo normalmente termina buscando y escribiendo a varios profesionales. La sorpresa no es una función técnica; es que Martín no tuvo que hacer eso.
2.2. Problemas detectados y sus causas
A. El guion contradice el mecanismo del concepto
La ficha del enfoque habilita comenzar por la consecuencia y revelar la causa después. Sin embargo, el prompt de Guion impone:
> «Primero lo que le pasa a quien necesita, después lo que hace [...] al final lo que gana».
También obliga a que el hook comience por el problema. Así, una regla genérica desplaza la inversión temporal elegida en Concepto.
Corrección: el orden del concepto debe prevalecer sobre las convenciones de cronología del molde, siempre que respete los hechos del producto y se entienda la historia.
B. El gancho se debilita
El original comienza:
> Martín: «La puerta no cierra. Mirá quién me está esperando».
La frase no es particularmente clara ni interesante: «quién me está esperando» no anticipa con precisión el beneficio. La mejor idea del concepto —«¿A cuántos escribiste?»— aparece más tarde.
Corrección: dar prioridad al estímulo más interesante para el espectador; puede ser una pregunta, un contraste, una consecuencia, un problema o una revelación. No convertir esta recomendación en una obligación universal de abrir con preguntas.
C. Las personas explican la publicidad en lugar de conversar
En los prompts ya aparecen reglas que prohíben la explicación comercial, pero algunas son demasiado tajantes:
> «Una persona de verdad no dice el beneficio del producto en voz alta».
Eso puede impedir una reacción enteramente creíble: «A ninguno. Me llegaron los presupuestos». La prohibición indiscriminada del beneficio también hace que la escena deba comunicarlo mediante gestos forzados.
Corrección: prohibir el lenguaje de folleto, no el significado comercial. Las personas pueden contar lo que les pasó, siempre que suene a su forma de hablar.
D. Movimiento no equivale a acción narrativa
El storyboard recurre a gestos como apoyar la mano en el picaporte, girar el teléfono o mantener el hombro contra la puerta. Son acciones realizables, pero algunas ocurren sólo para que el personaje «haga algo» mientras pronuncia la línea.
Corrección: antes de describir el plano, preguntar qué está intentando hacer la persona y qué cambia en esos segundos. No todos los planos necesitan actividad constante. Una pregunta, una espera o una reacción pueden sostener una escena.
E. Dirección fotográfica excesiva frente a dirección actoral insuficiente
Los prompts para Flow especifican luz, plano, textura, lente implícita, sonidos, vestuario y gestos. Eso es útil para consistencia, pero no reemplaza el motivo emocional o interpersonal de la frase.
Corrección: dar a Flow primero el contexto de la situación, la intención del personaje y su interlocutor; después las acciones visibles y la puesta en cámara. Conservar las restricciones técnicas necesarias.
F. Una simulación pasa a parecer una promesa factual
El guion original dice:
> Martín: «A ninguno. Y entró otro mientras hablamos».
La animación del mockup sí muestra la incorporación de un segundo presupuesto. Pero eso no prueba que llegue de inmediato ni durante una conversación. El producto acepta hasta tres presupuestos, pero no garantiza tres ni un tiempo determinado.
Corrección: distinguir una escena dramatizada de un resultado garantizado. El diálogo puede decir «Mirá, ya tengo presupuestos» sin prometer inmediatez.
G. Incoherencia entre el caso y el mockup verificado
El concepto trata sobre una puerta que no cierra, pero el flujo real «Contar el problema» del media kit utiliza como ejemplo «Humedad y filtraciones». Si se reproduce íntegro, se ve un problema distinto del que plantea la historia.
Corrección: usar una porción neutra y verdadera del mockup, o producir una nueva captura real correspondiente al mismo caso. No alterar ni inventar textos de UI con generación de video.
H. Reglas incompatibles entre etapas
Concepto: permite flashback. Guion: exige orden causal lineal.
Guion: trabaja con 26 segundos. Storyboard: acepta una pieza de 22 a 33 segundos y vuelve a distribuir duraciones.
Guion: quiere naturalidad. Algunas restricciones convierten cada intervención en una reacción mecánica y evitan mencionar claramente el resultado.
Storyboard: separa insertos de pantallas reales. Flow: recibe acciones que piden girar un teléfono cuyo contenido no puede mostrar.
CTA verificado: «Entrá a reparehoy.com.ar y contá qué hay que arreglar». Otra regla del guion: exige una placa sin la dirección pronunciada y con un máximo alternativo de palabras.
Casting: una instrucción de lugar propio para cada personaje entra en conflicto con escenas de ambos compartiendo el palier.
Corrección: una jerarquía clara y pocos contratos estables; no agregar nuevas instrucciones que compitan con las existentes.
I. La radiografía de palabras no debe confundirse con verificación factual
Que la radiografía marque «lo imaginó» significa que no logró rastrear literalmente un dato, no que el modelo lo haya inventado. La enumeración de los once oficios, por ejemplo, ya estaba en la ficha. Hay que validar la correspondencia semántica, además de la textual.
---
3. El criterio creativo que falta
La regla más valiosa no es «cada escena debe tener un giro», «cada personaje debe tener un conflicto» ni «siempre poner un chiste». Eso reemplazaría una fórmula mala por otra igualmente rígida.
El sistema necesita un criterio de autodescarte: que el modelo detecte y reescriba intervenciones genéricas antes de producir el JSON final.
Preguntas internas que conviene hacer a Claude
¿Esto parece una conversación entre personas, o una ficha comercial repartida entre actores?
¿Qué quiere cada personaje en ese momento? ¿Por qué dice esa frase ahora?
¿La siguiente intervención responde realmente a la anterior o parece una pregunta preparada para mostrar el producto?
¿La acción tiene una consecuencia narrativa o es sólo un movimiento para llenar plano?
¿Qué queda interesante de la escena si quitamos la iluminación, cámara y vestuario?
¿Se ve o se comprende una capacidad real del negocio sin inventar resultados?
¿La idea seleccionada conserva su mecanismo narrativo y el tratamiento elegido?
¿Existe una versión más natural, memorable y breve de este intercambio?
No es necesario mostrar estas respuestas ni crear otro agente. El modelo puede comparar internamente alternativas y producir solamente su mejor versión.
---
4. Tres parches quirúrgicos para los prompts existentes
Estos son los cambios de mayor prioridad. Son generalizables a cualquier marca y cualquier tratamiento; están pensados para insertarse en los templates reales, no para reconstruir toda la aplicación.
PATCH 1 — `script/3.6`: calidad dramática y naturalidad
```text
CALIDAD DRAMÁTICA Y NATURALIDAD

Antes de escribir el diálogo, identificá internamente qué quiere cada personaje en ese momento, qué acaba de suceder y qué provoca su siguiente reacción.

Los personajes no son portavoces del negocio. Son personas viviendo una situación concreta.

REGLAS
- Ningún personaje debe pronunciar una frase que parezca extraída de la ficha comercial.
- El diálogo debe responder a algo que ocurre o que otro personaje acaba de decir.
- Permití interrupciones, preguntas genuinas, respuestas breves, pequeños malentendidos y reacciones inesperadas cuando resulten naturales.
- No fuerces a los personajes a explicar el problema y la solución verbalmente. El espectador puede comprender una parte por lo que ve.
- Una frase breve puede ser mejor que una explicación completa.
- El humor puede surgir de una observación cotidiana, sin necesidad de construir un chiste.
- No obligues a todos los personajes a hablar ni a realizar acciones continuamente.
- Respetá el tono y el mecanismo del concepto elegido.

CONTROL OBLIGATORIO
Leé cada intervención como si fuera una conversación real entre esas personas, sin cámaras presentes.

Si suena a publicidad, reformulala.

Si una línea no revela carácter, no provoca una reacción, no aporta información necesaria ni hace avanzar la situación, eliminala.

Evaluá internamente al menos dos formulaciones distintas de las intervenciones principales y conservá la más natural. No muestres alternativas en el JSON final.
```
Para qué sirve: evita parlamentos genéricos sin imponer humor, conflicto o una estructura única.
PATCH 2 — `storyboard/3.7`: dirección narrativa de escenas
```text
DIRECCIÓN NARRATIVA DE ESCENAS

Antes de definir plano, iluminación o movimiento, identificá el propósito dramático de cada escena.

Cada escena debe tener:
- Una situación reconocible.
- Una intención humana concreta.
- Una acción o interacción que tenga sentido dentro de esa situación.
- Un pequeño cambio, descubrimiento o reacción, cuando la escena lo requiera.

No agregues gestos sólo para evitar que el personaje esté quieto.

Una conversación puede ser visualmente interesante sin que los personajes estén abriendo puertas, levantando objetos o caminando permanentemente.

El entorno y los objetos deben apoyar la situación narrativa, no competir con ella.

CONTROL OBLIGATORIO
Antes de aprobar cada escena filmada, preguntate:

«Si elimino la descripción de cámara, iluminación y vestuario, ¿todavía queda una situación humana interesante?»

Si no, la escena necesita una acción, un conflicto o una interacción mejor. No más detalles cinematográficos.
```
Para qué sirve: corrige el «mover cosas mientras habla» y obliga a que la puesta en escena tenga una función narrativa.
PATCH 3 — generación de prompts Flow: dirección actoral
```text
DIRECCIÓN ACTORAL

La prioridad de un prompt audiovisual debe ser:
1. Qué está sucediendo entre los personajes.
2. Qué quiere conseguir o expresar cada personaje.
3. Cómo reacciona naturalmente ante la situación.
4. Qué acción física concreta acompaña esa situación.
5. Cómo se filma: cámara, luz, ambiente y estilo.

Mantené todas las restricciones técnicas necesarias para continuidad, identidad visual, duración, diálogos exactos y pantallas verificadas.

No conviertas la actuación en una secuencia mecánica de microgestos.

Evitá instrucciones excesivamente coreografiadas como mover la cabeza, levantar una ceja, girar el teléfono, sonreír y volver a mirar, salvo que sean indispensables para la historia.

Describí la intención actoral y la relación entre los personajes para que el generador tenga libertad de producir una interpretación natural.

CONTROL OBLIGATORIO
Un clip de ocho segundos debe contener un momento humano reconocible y realizable.

La fotografía puede embellecer ese momento, pero nunca reemplazarlo.
```
Para qué sirve: conservar el nivel técnico de Flow y sumar el contexto dramático que hoy falta.
---
5. Ejemplo práctico: diálogo original vs. diálogo más humano
El guion original
> **Martín:** «La puerta no cierra. Mirá quién me está esperando».  
> **Silvia:** «¿Y a cuántos tuviste que escribirles para eso?».  
> **Martín:** «A ninguno. Y entró otro mientras hablamos».
Problemas: el inicio confunde, los personajes parecen cumplir turnos expositivos y la última frase agrega un plazo implícito no demostrado.
Alternativa de prueba de naturalidad (no un guion definitivo)
> **Silvia:** «¿Llamaste a medio barrio para conseguir esos presupuestos?».  
> **Martín:** «No llamé a nadie».  
> **Silvia:** «Dale, ¿cómo que a nadie?».  
> **Martín:** «Puse lo de la puerta acá. Mirá».
Por qué mejora: Silvia supone algo razonable, Martín rompe esa expectativa y Silvia pide explicación porque de verdad le interesa. La interfaz real puede ilustrar lo que él hizo; no tiene que narrar las funciones de la plataforma.
Advertencia: esto es una demostración del criterio, no una plantilla que deba replicarse. Otras marcas o enfoques pueden requerir relato visual, emoción, testimonio, silencio, conflicto, humor, una sola persona o ninguna.
---
6. Guion alternativo curado de 26 segundos (ejemplo desarrollado durante el análisis)
Este es el ejemplo completo que se propuso antes de afinar el alcance. No significa que debamos modificar el montaje: se incluye como demostración de cómo un mejor mecanismo narrativo puede ordenar los crudos.
```json
{
  "blocks": [
    {
      "role": "hook",
      "narration": "¿A cuántos les escribiste?",
      "visual": "En el palier, Silvia se detiene con la bolsa del mercado al ver a Martín junto a la puerta trabada de su departamento.",
      "durSec": 4
    },
    {
      "role": "desarrollo",
      "narration": "Dale, cerrá de una vez.",
      "visual": "La tarde anterior: Martín intenta cerrar la misma puerta; la hoja roza el marco y vuelve a trabarse.",
      "durSec": 5
    },
    {
      "role": "desarrollo",
      "narration": "",
      "visual": "Montaje con el mockup de la captura real «Contar el problema», mostrando la publicación sin datos del ejemplo de humedad; Martín deja el teléfono y sigue con su tarde.",
      "durSec": 6
    },
    {
      "role": "giro",
      "narration": "A ninguno. Mirá, ya tengo presupuestos.",
      "visual": "Vuelta al palier: Martín responde a Silvia, y el montaje inserta el mockup real «Te esperan tus proveedores» con las propuestas recibidas.",
      "durSec": 6
    },
    {
      "role": "cta",
      "narration": "Entrá a reparehoy.com.ar y contá qué hay que arreglar.",
      "visual": "Placa RepareHoy con reparehoy.com.ar, «Oficios para el hogar en el AMBA» y «Hasta tres presupuestos de profesionales verificados de tu zona».",
      "durSec": 5
    }
  ],
  "music": {
    "mood": "Cálida, cotidiana, ligera"
  }
}
```
Total: 26 segundos.  
Precaución: el mockup real de «Contar el problema» utiliza humedad. No mostrar esa información como si fuera el caso de la puerta.
---
7. Ajustes secundarios detectados (no son la prioridad actual)
Durante la primera revisión surgieron otras mejoras. Conviene registrarlas, pero no mezclarlas con el trabajo quirúrgico solicitado.
Estrategia (`strategy/2.1`)
Comprobar que los `supportingFacts` se correspondan semánticamente con hechos verificables del brief.
No tratar como inventada una reformulación sólo porque cambie las palabras.
Distinguir el mensaje de la pieza del conjunto total de funciones del negocio.
No plantear como «recorrido de pantalla» una pieza filmada si los insertos de interfaz ya tienen una vía de producción separada.
Concepto (`concept/3.1`)
Conservar el mecanismo narrativo elegido (inversión temporal, contraste, revelación, observación, etc.) en etapas posteriores.
Diferenciar tres conceptos por mecanismo creativo real, no sólo por protagonista o locación.
Rechazar conceptos que podrían servir igual para cualquier otra marca.
No obligar a inventar chistes ni a evitar el humor cuando una observación humana lo justifica.
Guion (`script/3.6`)
No imponer cronología cuando el concepto elegido permite flashback.
Permitir que un personaje comunique un beneficio real con sus propias palabras.
Mantener el mensaje comercial en una sola pieza sin enumerar la plataforma.
Distinguir «hasta tres presupuestos» de «tres presupuestos garantizados».
Conservar el CTA aprobado sin contradicciones con el formato de la placa.
Casting (`cast/2.2`)
Permitir locaciones compartidas si el concepto lo necesita.
Evitar decoraciones, acciones o biografías inventadas que no mejoren la escena.
Conservar continuidad de apariencia y ropa entre clips.
Storyboard (`storyboard/3.7`)
La duración final del storyboard debe coincidir con el guion aprobado; no recalcularla libremente.
No confundir los ocho segundos de generación de Flow con los segundos usados en la edición.
Mantener material de app verificado separado de las escenas generadas.
No pedir gestos, movimientos ni cambios de plano sólo para cumplir una lista de requisitos.
Flow (`flowpack/3.1`)
Conservar identidad de personajes, tono, diálogo literal y duración realizable.
No recrear textos ni UI real con el generador de video.
Especificar primero la relación humana y la intención actoral; después encuadre, luz y ambiente.
No inventar resultados comerciales o tiempos a partir de una animación.
Orden de prioridades: primero mejorar las tres piezas creativas de los crudos (Guion, Storyboard y Flow). Sólo intervenir reglas transversales si bloquean directamente esas mejoras.
---
8. Prompt maestro para Claude Code — auditar e implementar los ajustes
Este es el texto principal para enviar al Claude que tiene acceso al repositorio. Le da el objetivo y el criterio creativo, pero no le impone nuestros tres parches palabra por palabra. Claude debe inspeccionar los templates reales, decidir la intervención mínima e implementarla.
```text
Quiero que hagas una revisión quirúrgica de la calidad creativa de nuestro pipeline audiovisual.

EL PROBLEMA

La arquitectura funciona, los mockups animados de las aplicaciones salen muy bien y la generación técnica de los clips está razonablemente resuelta.

Pero los guiones, las situaciones entre personajes y, como consecuencia, los prompts finales para Flow tienen una debilidad importante: parecen publicidades escritas por una IA.

Los personajes dicen frases artificiales, explican problemas que nadie explicaría así en la vida real, tienen interacciones previsibles y realizan acciones decorativas que no aportan nada a la historia.

Estamos produciendo escenas cinematográficamente detalladas, pero dramáticamente pobres.

TU MISIÓN

Quiero que revises los prompts y templates reales del repositorio, especialmente las etapas de Concepto, Guion, Storyboard y generación de prompts para Flow.

Identificá qué instrucciones actuales provocan o permiten esos resultados mediocres.

Corregí lo necesario para que el sistema produzca escenas y diálogos con calidad de publicidad profesional, manteniendo su capacidad de generar piezas para cualquier negocio, enfoque y tratamiento.

No te estoy pidiendo que agregues literalmente una lista de reglas que te voy a dictar. Quiero que vos, como director creativo y especialista en prompting, determines cuáles son las mejores intervenciones.

PRINCIPIO CENTRAL

La calidad narrativa precede a la calidad cinematográfica.

Una escena debe tener valor dramático antes de que se decidan su iluminación, cámara, vestuario y composición.

Un plano hermoso no salva una situación aburrida ni un diálogo artificial.

CRITERIOS DE CALIDAD

- Los personajes deben hablar como personas reales, no como representantes comerciales.
- Cada intervención debe tener una razón humana para existir.
- Las conversaciones tienen que reaccionar a lo que sucede, no funcionar como preguntas preparadas para explicar el producto.
- Buscá situaciones con observación humana, personalidad, tensión, contraste, sorpresa o humor cuando el concepto lo justifique.
- No confundas naturalidad con aburrimiento.
- No conviertas todas las piezas en sketches ni fuerces humor.
- No impongas siempre la misma estructura narrativa.
- El beneficio comercial debe entenderse sin transformar a los personajes en vendedores.
- Las acciones físicas deben aportar a la situación, no decorar el plano.
- El enfoque y el tratamiento elegidos deben modificar realmente la narrativa.
- La originalidad nunca debe depender de inventar características o resultados del producto.

MUY IMPORTANTE: AUTOCRÍTICA CREATIVA

Investigá cómo incorporar a las etapas creativas una revisión interna antes de emitir el resultado definitivo.

Quiero que el modelo pueda detectar sus propias frases genéricas, escenas débiles, diálogos explicativos y situaciones previsibles, y reformularlos antes de devolver el JSON.

Que evalúe alternativas y elija la más potente, pero sin generar obligatoriamente nuevas llamadas a modelos, nuevos agentes o etapas adicionales.

Priorizá mejorar la calidad de las llamadas existentes.

RESTRICCIONES

No rediseñes la arquitectura.

No toques los mockups ni el sistema de animación de las aplicaciones.

No cambies los contratos JSON ni rompas los parsers.

No elimines las restricciones técnicas necesarias para Flow, la continuidad de personajes o la fidelidad al producto.

No sobrecargues los prompts con decenas de prohibiciones redundantes.

No construyas un algoritmo que obligue a todas las publicidades a seguir la misma fórmula.

QUÉ QUIERO QUE HAGAS

1. Inspeccioná los templates reales y encontrá las instrucciones que empobrecen la creatividad o se contradicen.
2. Definí una estrategia mínima y generalizable para elevar la calidad narrativa.
3. Implementá los cambios directamente en los prompts correspondientes.
4. Verificá que los contratos y el funcionamiento existente sigan intactos.
5. Explicame brevemente qué cambiaste, por qué y qué mejora concreta esperás.

Como prueba, utilizá el concepto existente de RepareHoy, «¿A cuántos escribiste?», para comparar el resultado anterior con el que debería producir el nuevo criterio.

El objetivo no es generar más instrucciones. Es conseguir mejores ideas, mejores conversaciones y mejores escenas con las instrucciones justas.

No te limites a recomendar cambios: implementalos en el repositorio.
```
Qué debería devolver Claude
Un informe breve con: archivos/templates realmente modificados, las reglas que se contradijeron o resultaron perjudiciales, el cambio mínimo implementado, una comparación antes/después sobre RepareHoy y la validación de que los contratos no cambiaron.
No necesita convertir la mejora en una nueva arquitectura ni en una gran colección de instrucciones negativas.
---
9. Apéndice: los prompts Flow de ejemplo que surgieron en la primera revisión
Son ejemplos ilustrativos, no la intervención principal. Se incluyen para conservar el análisis completo y para mostrar cómo se vería una dirección actoral más útil.
Estilo global
```text
Photorealistic cinematic vertical 9:16 video, authentic Buenos Aires residential building, warm natural afternoon light, realistic human expressions, subtle handheld camera movement. Consistent character identity using supplied reference images. Natural Argentine Rioplatense Spanish when dialogue is provided. Understated everyday acting, no exaggerated reactions, no artificial commercial smiles, no CGI-perfect surfaces. No readable device screens, no generated app interfaces, no subtitles, no captions, no on-screen text, no logos. All dialogue begins within the first second of the clip and is spoken exactly once. Maintain natural ambient sounds.
```
Silvia pregunta
```text
Use Silvia's supplied character reference: an Argentine woman in her early 50s, shoulder-length greying brown hair, fair skin with natural age lines, light cardigan, simple blouse, carrying a cloth market bag.

She is standing in the entrance hallway of a modest Buenos Aires apartment building, next to the door of Martín's apartment. Checkered floor tiles, old wooden apartment door, warm daylight.

Silvia has just noticed Martín standing off-camera beside his troublesome door. She stops walking, holding her market bag, and asks him a question with genuine curiosity.

She speaks to Martín, not to the camera, starting immediately in natural Argentine Rioplatense Spanish, exactly: "¿A cuántos les escribiste?"

She remains looking toward him, interested in his answer. Medium shot, natural subtle handheld feel. No phone screen or interface visible. No other dialogue.
```
Martín pelea con la puerta (flashback)
```text
Use Martín's supplied character reference: Argentine man in his late 30s, short dark brown hair, light olive skin, average build, slightly tired eyes, natural unshaven appearance, plain grey t-shirt and dark jeans.

Previous afternoon, in the same Buenos Aires apartment building. Martín is at the wooden entrance door of his own apartment, not the building's communal entrance. The door sticks against its frame and does not close properly.

The clip begins with Martín already attempting to close the door. He gently pushes it with his shoulder, but the door remains stuck.

He speaks naturally to himself, with familiar everyday frustration, exactly: "Dale, cerrá de una vez."

He stops pushing and looks at the stubborn door for a moment. Medium shot, visible door frame, natural sound of wood scraping. One physical action, no phone, no other dialogue.
```
Martín sigue con su tarde
```text
Use the same Martín reference, identical grey t-shirt, dark jeans, hairstyle and facial appearance as the previous clip.

Inside his modest Buenos Aires apartment, during the same previous afternoon. Warm natural light, a small wooden table near the entrance.

Martín calmly puts his smartphone face down on the table and walks away toward the interior of his apartment, continuing with his normal afternoon.

The action is simple and unhurried. He is not waiting anxiously for a response or checking notifications. No dialogue. The phone screen remains invisible to the camera. Medium-wide shot, everyday domestic ambience, no additional actions.
```
Martín responde
```text
Use Martín's supplied reference with the exact same facial appearance, grey t-shirt and dark jeans as before.

Back in the present, in the same apartment building hallway, next to his still-sticking apartment door. Silvia stands just outside the frame, facing him.

Martín is relaxed, holding his smartphone naturally in one hand. The back of the phone faces the camera; the display is never visible.

He looks toward Silvia and answers with understated satisfaction, starting immediately, in natural Argentine Rioplatense Spanish, exactly: "A ninguno. Mirá, ya tengo presupuestos."

His reaction is modest and genuine, not triumphant or theatrical. Medium close-up with the troublesome wooden door visible in the background. No extra dialogue, no readable screens, no interface generated.
```
Nota sobre los mockups
Los insertos «Contar el problema» y «Te esperan tus proveedores» se producen a partir de capturas reales de la app. No son escenas para Flow. No corresponde pedirle al generador de video que invente UI, textos, cantidades o resultados.
La primera captura disponible contiene un ejemplo de humedad; el caso del guion es una puerta. Esa diferencia debe corregirse con material real o evitando mostrar el fragmento incompatible.
---
10. Qué no debería pasar con este cambio
El remedio sería contraproducente si:
Cada publicidad terminara como un sketch de dos personas conversando.
Todo diálogo debiera tener pregunta, respuesta y chiste.
Toda escena debiera mostrar un gesto, una herramienta o un objeto moviéndose.
Se redujera la naturalidad a frases cortas y aburridas.
Se añadieran tantos controles que el modelo dejara de proponer ideas.
La autocrítica obligara a nuevas llamadas costosas cuando bastaría con corregir una respuesta dentro del mismo paso.
La revisión creativa alterara los hechos del negocio o rompiera el JSON que consume la aplicación.
El objetivo es criterio creativo, no automatizar una receta de humor o narrativa.
---
11. Criterios de aceptación de la mejora
Una implementación puede considerarse satisfactoria si:
Los prompts permiten detectar y reformular frases del tipo «Qué difícil es conseguir X» / «Por suerte hay una solución» sin requerir una blacklist infinita.
El guion conserva el mensaje comercial y el mecanismo del concepto elegido.
Las conversaciones reaccionan a hechos del relato y muestran intención humana.
Las acciones del storyboard son necesarias o plausibles, no coreografía decorativa.
Los prompts para Flow priorizan situación e interpretación sin perder continuidad y precisión técnica.
Los mockups y sus datos verificados permanecen intactos.
No se cambiaron los contratos JSON ni se rediseñó la orquestación.
La prueba con RepareHoy muestra una mejora perceptible en naturalidad, claridad y fuerza del spot.
Conclusión
No hay que rehacer Media Studio. Lo importante es elevar el nivel de las decisiones creativas que producen sus crudos: que Claude se comporte como un guionista y director creativo capaz de reconocer una mala escena, descartarla y proponer una mejor antes de convertirla en storyboard y video.
La intervención ideal es pequeña, generalizable, compatible con las etapas actuales y concentrada en Guion → Storyboard → Flow. El prompt maestro de la sección 8 permite que Claude Code inspeccione el repositorio, elija dónde corregir y haga esos cambios con criterio, sin que nosotros le impongamos una solución técnica ciega.