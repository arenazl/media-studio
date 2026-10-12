# Orquestación de "Nadie te contesta" (RepareHoy): las 7 vueltas, paso por paso

Generado el 11/10/2026 23:01 (hora argentina) desde la base de corridas de Media Studio. Horas en hora argentina (UTC-3).

## Para quien analiza este archivo

**Media Studio** es una aplicación que arma comerciales cortos para redes (reel vertical 9:16, unos 26 segundos). Esta pieza es **híbrida**: las escenas con personas se filman con IA de video (Google Flow / Veo) y se intercalan con pantallas animadas de la aplicación que se publicita.

La aplicación que se publicita es **RepareHoy**: una persona cuenta qué hay que arreglar en su casa, el pedido les llega a los profesionales de la zona y del oficio, y ellos mandan presupuesto.

La orquestación es una cadena de seis pasos. Cada paso le manda un pedido (prompt) a un modelo de lenguaje y lo que devuelve alimenta al siguiente:

1. **Estrategia**: qué cuenta esta pieza dentro de la campaña.
2. **Concepto**: la idea para contarlo (enfoque y tratamiento).
3. **Guion**: lo que se dice y lo que se ve, bloque por bloque, y quién dice cada frase.
4. **Personajes**: quién aparece, cómo es, qué tiene puesto y dónde está.
5. **Storyboard**: las escenas, qué se filma, qué pantalla de la app entra y cuánto dura cada una.
6. **Pedidos a Flow**: el texto que se le manda a Google Flow para filmar cada escena con personas. Se arma por código; el modelo sólo traduce al inglés.

**Vuelta 0** es la corrida original (11/10 de madrugada). Con ella se filmó la versión que salió mal: personas hablando a cámara, explicando la app, y Flow devolvió eso. Las **vueltas 1 a 7** rehacen los pasos 3 a 6 sobre la misma estrategia y el mismo concepto. En cada vuelta se cambiaron las reglas de los moldes (los prompts) según lo que marcó un juez externo. La vuelta 7 es la versión que quedó cargada en la aplicación para filmar.

**Lo que se te pide:**

1. ¿La materia prima final (vuelta 7: guion, personajes, storyboard y pedidos a Flow) alcanza para filmar un comercial bueno? Respondé sí o no, con el porqué.
2. ¿Qué sigue fallando, paso por paso? Citá el texto exacto.
3. ¿Qué cambiarías en los pedidos (prompts)? Que sea concreto: qué frase sacar, cuál agregar y en qué paso.
4. De la vuelta 0 a la 7, ¿qué mejoró de verdad y qué sólo cambió de forma?

## La pieza

- **Enfoque**: dos-lados · **tratamiento**: aspiracional
- **Mensaje principal**: Dejá de perseguir a alguien que te conteste: contá el problema una vez y los presupuestos llegan a tu pantalla.
  - Pedís presupuesto por WhatsApp y la mayoría no contesta
  - El cliente cuenta el problema en sus palabras y recibe hasta tres presupuestos de profesionales verificados de su zona
  - El cliente no persigue a nadie: publica el problema y le llegan los presupuestos
  - La tira 'Te esperan tus proveedores' en la pantalla de inicio, con los trabajos que esperan algo suyo ordenados por urgencia
- **Idea del concepto**: Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.
- **Tono**: Directo, profesional, orgulloso sin grandilocuencia; charla real

## Las vueltas de un vistazo

| Vuelta | Hora | Moldes (guion · personajes · storyboard) | Qué cambió en las reglas | Notas de los jueces |
|---|---|---|---|---|
| 0 | 11/10 05:44 | script/2.1 · cast/2.0 · storyboard/2.1 | Corrida original. | Juez de la pieza (ChatGPT): VEREDICTO: FLOJO — 4/10; Juez de la materia prima (ChatGPT): Nota de la materia prima: 5/10 |
| 1 | 11/10 14:27 | script/3.0 · cast/2.1 · storyboard/3.0 | Sin locutor: cada frase con quién la dice en cámara. Cada personaje con su lugar. Escena = situación, no cara; planos variados. El pedido a Flow pone el contenido primero. Se va la regla vieja que convertía frases cortas en "voz en off". | Juez de la pieza (ChatGPT): VEREDICTO: TIENE POTENCIAL — 6/10; Gemini 5/10 · Qwen 4/10 |
| 2 | 11/10 14:31 | script/3.1 · cast/2.1 · storyboard/3.1 | Orden por causa (le pasa, lo pide, le llega al otro, le contestan). Gancho con el dolor. Habla real, sin palabras de la app. Hasta 4 frases. El cierre va en la placa. Una acción por escena. | Juez de la pieza (ChatGPT): VEREDICTO: TIENE POTENCIAL — 6,5/10 |
| 3 | 11/10 14:34 | script/3.2 · cast/2.1 · storyboard/3.2 | El gancho empieza por el golpe, en presente. Un solo público. Un detalle propio por personaje. Frases cortas. Habla desde el primer segundo. A cámara, como mucho dos escenas. | Juez de la pieza (ChatGPT): Veredicto: TIENE POTENCIAL — 6,5/10 |
| 4 | 11/10 14:38 | script/3.3 · cast/2.2 · storyboard/3.3 | "Hasta 3" no es "3". Si dice "vos", va a cámara. Lo que dice el gancho se ve (el chat sin respuesta). Nada de manos finas en primer plano. La ropa en cada pedido. | Juez de la pieza (ChatGPT): VEREDICTO: TIENE POTENCIAL — 6/10; Juez de la materia prima (ChatGPT): NOTA: 7/10 |
| 5 | 11/10 14:43 | script/3.4 · cast/2.2 · storyboard/3.4 | El otro lado habla de ESE pedido. Tres frases hasta 26 s. Cada escena muestra el momento en que pasa, no a alguien contándolo. | Juez de la pieza (ChatGPT): VEREDICTO: TIENE POTENCIAL — 6/10; Juez de la materia prima (ChatGPT): NOTA: 7/10 |
| 6 | 11/10 14:46 | script/3.5 · cast/2.2 · storyboard/3.5 | Frases en presente, dichas en el momento. La placa con la marca escrita. El giro es la reacción al resultado. | Juez de la pieza (ChatGPT): VEREDICTO: TIENE POTENCIAL — 6,5/10; Juez de la materia prima (ChatGPT): Nota de la materia prima: 7,5/10 |
| 7 | 11/10 14:49 | script/3.5 · cast/2.2 · storyboard/3.6 | Física de la escena (cada objeto en un solo lugar). Emoción simple. La frase después de lo que la provoca. | Juez de la pieza (ChatGPT): VEREDICTO: 7/10 — Tiene potencial, pero está demasiado explicado y poco vendido.; Juez de la materia prima (ChatGPT): Nota: 7/10; Gemini 5,5/10 · Qwen 6/10 |

Notas: el juez de la pieza (ChatGPT) mira el comercial como lo vería alguien en el teléfono; el de la materia prima mira si los personajes, el guion y el storyboard sirven para filmar. Gemini y Qwen se consultaron en las vueltas 1 y 7 como segunda opinión.

---

## Vuelta 0: corrida original (11/10, madrugada)

### Paso 1 · Estrategia

*Molde `strategy/2.1` · modelo opus-5 · 49 s · terminó 11/10 05:42 (hora argentina)*

**Pedido enviado al modelo (completo):**

```text
Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: diseñá la ESTRATEGIA de campaña. No escribas guiones, escenas ni casting. Usá únicamente los hechos del BRIEF; si un dato no está, no lo inventes.

Actuás como social-marketing-strategist. Armá una campaña de video para Instagram/Facebook.

AWARENESS: Generá 3 piezas enfocadas en llamar la atención, empatizar con el dolor del cliente y generar curiosidad inicial.

REGLA DE CAMPAÑA:
La CAMPAÑA completa debe cubrir la propuesta de valor de RepareHoy.
Cada PIEZA, en cambio, tiene UN mensaje principal y UN ángulo claro, y usa sólo los elementos de la propuesta que necesita para demostrarlo (pueden ser varias funciones si sirven a una misma idea). No vuelvas a enumerar toda la plataforma en cada reel.
Excepción explícita: una pieza con messageScope "brand-global" (institucional / overview) SÍ cuenta el sistema integral.
Aunque tenga foco propio, cada pieza debe dejar claro qué es RepareHoy y cómo ese ángulo se conecta con su propuesta.

DIVERSIDAD:
- Los ángulos deben ser semánticamente distintos.
- No cambies sólo el título manteniendo la misma idea.
- Repartí problemas, beneficios, demostración, prueba, objeciones y conversión entre las piezas.

CAMPOS:
- positioning: 1-2 frases.
- audiences: sólo segmentos respaldados por el BRIEF; pain y language concretos.
- angle: 2 a 4 palabras.
- messageScope: uno de brand-global | problem | demo | benefit | proof | objection | conversion.
- primaryMessage: UNA frase: el mensaje principal de esta pieza.
- supportingFacts: 1 a 4 hechos del BRIEF (textuales o resumidos) que esta pieza usa para demostrar su mensaje. Nada que no esté en el BRIEF.
- creativeBrief: 2 a 3 frases. Define qué cuenta ESTA pieza, cuál es su mensaje principal y qué parte de la propuesta prueba.
- durationSec: 26.
- format: "9:16 para Instagram / TikTok".

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

NO ASUMIR:
- clientes, reseñas, garantías, cifras, precios o resultados que el BRIEF no confirme;
- una prueba social si no existe evidencia en el BRIEF;
- beneficios genéricos de marketing que no estén respaldados por el producto.

Devolvé SOLO JSON:
{
  "positioning": "",
  "audiences": [{ "label": "", "pain": "", "language": "" }],
  "pieces": [{ "id": "v1", "objective": "awareness|consideracion|conversion", "angle": "", "messageScope": "problem", "primaryMessage": "", "supportingFacts": [""], "format": "9:16 para Instagram / TikTok", "durationSec": 26, "creativeBrief": "" }]
}

NEGOCIO: RepareHoy
BRIEF (única fuente de hechos):
NEGOCIO: RepareHoy — Contá el problema. Elegí entre 3 presupuestos de profesionales verificados.
PÚBLICO: quien tiene algo que arreglar o hacer en su casa, dueño o inquilino, en Ciudad de Buenos Aires y Gran Buenos Aires · profesionales de oficio y pequeñas empresas de servicios que quieren recibir pedidos de su zona sin salir a buscarlos
QUÉ ES: Marketplace de oficios para el hogar en el AMBA. El cliente cuenta el problema en sus palabras, recibe hasta tres presupuestos de profesionales verificados de su zona, habla con el que elige por un chat dentro de la app y paga la seña desde ahí. - Qué vende: Intermediación entre quien necesita arreglar o hacer algo en su casa y profesionales de once oficios: plomería, electricidad, cerrajería, gas, aire acondicionado, pintura, carpintería, albañilería, herrería, techos y humedad, y materiales. La plataforma cobra una comisión del 10% sobre el monto del trabajo; la paga el proveedor. - Zona: AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Barrio de ejemplo para los textos: Villa Urquiza. - Audiencia prioritaria: Primero el cliente que tiene algo que arreglar en su casa; después el proveedor. En ese orden, y con una historia para cada uno. - La seña queda retenida por la plataforma y se le libera al proveedor recién cuando el trabajo está terminado: sin disputa abierta, a los 7 días de finalizado. - El plan de pagos lo acuerdan las partes, no la plataforma: el proveedor propone (todo al final, mitad y mitad, o contra avance por etapas), el cliente acepta o contrapropone, y queda sellado cuando los dos firman. - La plataforma pone un solo límite: cuánto se puede pedir por adelantado, y sale del historial del proveedor. Hasta 20% del total sin trabajos previos, 40% con cinco finalizados, 60% con veinte. - Cada propuesta de pago queda dentro del hilo de la conversación, en el momento en que ocurrió. La negociación completa es el registro si después hay una disputa. - Las reseñas salen únicamente de trabajos finalizados dentro de la app. No se pueden cargar a mano, ni desde el panel de administración. - El cliente no persigue a nadie: publica el problema, le llegan los presupuestos, y su pantalla de inicio le muestra qué trabajos esperan algo suyo, ordenados por urgencia. - Los pagos hechos por fuera de la app se pueden declarar y la otra parte los confirma. Queda registro aunque la plata no haya pasado por el sistema, y al proveedor le suma historial. - Hay un fondo de reparo opcional: un porcentaje que queda retenido unos días después de terminado el trabajo. - Pedís presupuesto por WhatsApp y la mayoría no contesta. El que contesta pide una seña por transferencia a un alias, sin ningún respaldo. - No hay forma de saber si el que viene es de confianza, ni qué dijeron otros clientes de él. - Adelantar plata sin garantía: si el trabajo queda mal o nunca empieza, no hay a quién reclamarle. - El 'te lo cotizo cuando lo vea' y la fecha que se corre: no hay referencia de precio ni compromiso escrito. - Cuando hay un problema a mitad de obra, lo hablado quedó en audios de WhatsApp que nadie vuelve a encontrar. - Entrá a reparehoy.com.ar y contá qué hay que arreglar - URL: https://reparehoy.com.ar - Secundario: Para proveedores: publicá tu oficio gratis en reparehoy.com.ar/registro - El momento en que llegan los presupuestos sin haber perseguido a nadie: la tira 'Te esperan tus proveedores' con el punto que late. - La negociación del plan de pagos ADENTRO del chat y el sello con las dos firmas. Es lo que ningún WhatsApp te da. - El tope de adelanto que sube con el historial (20, 40, 60%): para el proveedor es un incentivo y para el cliente una protección, en el mismo número. Mostrarlo como escalera, nunca como número suelto. - La seña retenida y liberada al terminar, dicha en una línea: 'La seña queda protegida hasta que el trabajo esté hecho'. - Para el proveedor: la bandeja donde el pedido aparece ya cotizable, con la zona y el oficio que él eligió.
LA TESIS (lo que la app declara de sí misma; manda sobre los hechos de abajo):
- El fuerte: RepareHoy hace de juez entre el que necesita arreglar algo en su casa y el que sabe hacerlo: la seña queda retenida hasta que el trabajo está hecho, el plan de pagos lo acuerdan los dos en el chat y queda como registro, y la reputación sale sólo de trabajos terminados adentro.
- Se entiende como: Un Mercado Libre de oficios con pago protegido: publicás lo que te pasa y te llegan los presupuestos, no perseguís a nadie.
- Contra qué: El WhatsApp y la confianza a ciegas: el plomero que no contesta, la seña por transferencia a un alias, el presupuesto que cambia cuando ya empezó, y lo hablado que quedó en audios.
- El momento mágico: Para el cliente, cuando abre la app y la tira dice 'Te esperan tus proveedores' con presupuestos que llegaron solos. Para el proveedor, cuando arma el plan de pagos a su manera y la app le dice hasta dónde puede pedir de adelanto porque ya se lo ganó.
- A quién le hablamos primero: Al cliente con algo roto en casa, porque es quien tiene el dolor hoy y quien trae la plata; sin pedidos no hay proveedor que se quede. El proveedor viene después, con su propia pieza: la bandeja, el plan, los números.
NO DECIR:
- precios concretos de servicios: son de demostración y cambian
- cantidades de proveedores, trabajos o reseñas como si fueran tracción real
- promesas absolutas: '100% seguro', 'garantizado', 'sin riesgo'
- que el pago al proveedor es automático: hoy la liberación genera una orden y la transferencia la hace tesorería a mano
- Mobbex, 'split de pagos' o 'sin triangulación fiscal': la pasarela activa es MercadoPago y no hay split; esos textos que aparecen en algún banner son heredados y están marcados para sacar
- que la plataforma garantiza el trabajo: lo que garantiza es que la seña no se libera hasta que esté hecho
- 'matriculados' para todos los oficios: la app verifica identidad y CUIT, no matrícula. La matrícula existe para gas y electricidad; en el resto, decir 'verificados'
```

**Lo que devolvió:**

```json
{
 "positioning": "RepareHoy es el marketplace de oficios del AMBA donde contás el problema en tus palabras y recibís hasta tres presupuestos de profesionales verificados de tu zona, con el chat, el plan de pagos y la seña retenida dentro de la misma app. No es una agenda de contactos: es el tercero que ordena la plata y deja registro de lo acordado hasta que el trabajo está hecho.",
 "audiences": [
  {
   "label": "Dueño o inquilino con algo roto en casa (CABA y Gran Buenos Aires)",
   "pain": "Pide presupuesto por WhatsApp y la mayoría no contesta; el que contesta pide seña por transferencia a un alias sin ningún respaldo y no hay forma de saber si es de confianza ni qué dijeron otros clientes de él.",
   "language": "Habla de 'se me pinchó un caño', 'tengo humedad en la pared', 'el plomero me dejó de contestar', 'me pidió la mitad por adelantado a un alias', 'me dijo te lo cotizo cuando lo vea y la fecha se corrió'."
  },
  {
   "label": "Profesional de oficio o pequeña empresa de servicios del AMBA",
   "pain": "Pierde tiempo saliendo a buscar trabajo y no tiene cómo mostrar antecedentes ni cómo pedir un adelanto razonable sin que el cliente desconfíe.",
   "language": "Habla de 'laburo de zona', 'pasame la dirección y lo veo', 'necesito un adelanto para los materiales', 'tengo que cobrar lo que trabajé'."
  }
 ],
 "pieces": [
  {
   "id": "v1",
   "objective": "awareness",
   "angle": "Nadie te contesta",
   "messageScope": "problem",
   "primaryMessage": "Dejá de perseguir a alguien que te conteste: contá el problema una vez y los presupuestos llegan a tu pantalla.",
   "supportingFacts": [
    "Pedís presupuesto por WhatsApp y la mayoría no contesta",
    "El cliente cuenta el problema en sus palabras y recibe hasta tres presupuestos de profesionales verificados de su zona",
    "El cliente no persigue a nadie: publica el problema y le llegan los presupuestos",
    "La tira 'Te esperan tus proveedores' en la pantalla de inicio, con los trabajos que esperan algo suyo ordenados por urgencia"
   ],
   "format": "9:16 para Instagram / TikTok",
   "durationSec": 26,
   "creativeBrief": "Esta pieza se queda en un solo dolor: la cadena de mensajes sin respuesta cuando tenés algo roto en casa, y el vuelco a la escena contraria, donde el pedido publicado una sola vez trae hasta tres presupuestos de profesionales verificados de la zona. El mensaje principal es que el que busca deja de buscar; la prueba es la pantalla con la tira 'Te esperan tus proveedores' ordenada por urgencia. No explica el pago ni la reputación: sólo deja claro que RepareHoy es donde contás el problema y te llegan los presupuestos, y cierra invitando a entrar a reparehoy.com.ar."
  },
  {
   "id": "v2",
   "objective": "awareness",
   "angle": "La seña al alias",
   "messageScope": "objection",
   "primaryMessage": "La seña no se la mandás a un alias: queda retenida en la plataforma hasta que el trabajo esté hecho.",
   "supportingFacts": [
    "El que contesta pide una seña por transferencia a un alias, sin ningún respaldo",
    "La seña queda retenida por la plataforma y se le libera al proveedor recién cuando el trabajo está terminado: sin disputa abierta, a los 7 días de finalizado",
    "La plataforma pone un solo límite: cuánto se puede pedir por adelantado, y sale del historial del proveedor: hasta 20% del total sin trabajos previos, 40% con cinco finalizados, 60% con veinte"
   ],
   "format": "9:16 para Instagram / TikTok",
   "durationSec": 26,
   "creativeBrief": "Pieza centrada en la objeción que frena todo: adelantar plata a alguien que no conocés. Cuenta que en RepareHoy la seña se paga dentro de la app y queda retenida hasta que el trabajo está terminado, y que el máximo que se puede pedir por adelantado no lo decide el proveedor sino su historial, mostrado como escalera de 20 a 40 a 60 por ciento. No promete que el trabajo salga bien ni habla de garantías: lo que prueba es que el dinero no cambia de manos antes de tiempo."
  },
  {
   "id": "v3",
   "objective": "awareness",
   "angle": "Juez entre las partes",
   "messageScope": "brand-global",
   "primaryMessage": "RepareHoy es el marketplace de oficios del AMBA que hace de juez entre quien necesita arreglar algo y quien sabe hacerlo.",
   "supportingFacts": [
    "Marketplace de oficios para el hogar en el AMBA, con once oficios: plomería, electricidad, cerrajería, gas, aire acondicionado, pintura, carpintería, albañilería, herrería, techos y humedad, y materiales",
    "El cliente habla con el profesional que elige por un chat dentro de la app y paga la seña desde ahí; cada propuesta de pago queda dentro del hilo de la conversación, en el momento en que ocurrió",
    "El plan de pagos lo acuerdan las partes: el proveedor propone, el cliente acepta o contrapropone, y queda sellado cuando los dos firman",
    "Las reseñas salen únicamente de trabajos finalizados dentro de la app: no se pueden cargar a mano ni desde el panel de administración"
   ],
   "format": "9:16 para Instagram / TikTok",
   "durationSec": 26,
   "creativeBrief": "Única pieza institucional de la tanda: presenta qué es RepareHoy de punta a punta, para alguien que nunca lo escuchó. Contrapone los audios de WhatsApp que nadie vuelve a encontrar con un sistema donde el pedido, los presupuestos de profesionales verificados, el chat, el plan de pagos firmado por las dos partes y las reseñas de trabajos terminados viven en el mismo lugar. El beneficio observable es que todo lo hablado queda escrito y fechado; el cierre lleva a reparehoy.com.ar a contar qué hay que arreglar."
  }
 ]
}
```

### Paso 2 · Concepto

*Molde `concept/3.1` · modelo opus-5 · 33 s · terminó 11/10 05:43 (hora argentina)*

**Pedido enviado al modelo (completo):**

```text
ROL
Sos la dupla director/a creativo/a + estratega de una agencia de publicidad. Diseñás spots de marca verticales 9:16, de aproximadamente 20 a 30 segundos. Tu tarea es proponer EXACTAMENTE TRES CONCEPTOS DISTINTOS para que el dueño elija uno. No escribas guiones ni listas de escenas: el concepto es la idea publicitaria que después desarrollarán Guion, Cast, Storyboard y Rodaje.

OBJETIVO COMERCIAL
Marca: RepareHoy
Perfil: campaña
Meta de esta pieza: Desarrollar el mensaje principal fijado por la estrategia; usar varias funciones sólo si demuestran la misma idea. Debe quedar claro qué es el producto.
Tipo de producción: filmado
Instrucciones del proyecto / Estrategia:
ÁNGULO DE ESTA PIEZA (la estrategia ya lo decidió, respetalo): Nadie te contesta
DIRECCIÓN CREATIVA DE ESTA PIEZA: Esta pieza se queda en un solo dolor: la cadena de mensajes sin respuesta cuando tenés algo roto en casa, y el vuelco a la escena contraria, donde el pedido publicado una sola vez trae hasta tres presupuestos de profesionales verificados de la zona. El mensaje principal es que el que busca deja de buscar; la prueba es la pantalla con la tira 'Te esperan tus proveedores' ordenada por urgencia. No explica el pago ni la reputación: sólo deja claro que RepareHoy es donde contás el problema y te llegan los presupuestos, y cierra invitando a entrar a reparehoy.com.ar.
MENSAJE PRINCIPAL DE ESTA PIEZA (la estrategia lo fijó; los tres conceptos lo demuestran de formas distintas): Dejá de perseguir a alguien que te conteste: contá el problema una vez y los presupuestos llegan a tu pantalla.

FICHA REAL DEL NEGOCIO — ÚNICA FUENTE DE VERDAD FACTUAL
NEGOCIO: RepareHoy — Contá el problema. Elegí entre 3 presupuestos de profesionales verificados.
RUBRO: AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Barrio de ejemplo para los textos: Villa Urquiza.
PÚBLICO: quien tiene algo que arreglar o hacer en su casa, dueño o inquilino, en Ciudad de Buenos Aires y Gran Buenos Aires · profesionales de oficio y pequeñas empresas de servicios que quieren recibir pedidos de su zona sin salir a buscarlos
QUÉ ES: Marketplace de oficios para el hogar en el AMBA. El cliente cuenta el problema en sus palabras, recibe hasta tres presupuestos de profesionales verificados de su zona, habla con el que elige por un chat dentro de la app y paga la seña desde ahí. - Qué vende: Intermediación entre quien necesita arreglar o hacer algo en su casa y profesionales de once oficios: plomería, electricidad, cerrajería, gas, aire acondicionado, pintura, carpintería, albañilería, herrería, techos y humedad, y materiales. La plataforma cobra una comisión del 10% sobre el monto del trabajo; la paga el proveedor. - Zona: AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Barrio de ejemplo para los textos: Villa Urquiza. - Audiencia prioritaria: Primero el cliente que tiene algo que arreglar en su casa; después el proveedor. En ese orden, y con una historia para cada uno. - La seña queda retenida por la plataforma y se le libera al proveedor recién cuando el trabajo está terminado: sin disputa abierta, a los 7 días de finalizado. - El plan de pagos lo acuerdan las partes, no la plataforma: el proveedor propone (todo al final, mitad y mitad, o contra avance por etapas), el cliente acepta o contrapropone, y queda sellado cuando los dos firman. - La plataforma pone un solo límite: cuánto se puede pedir por adelantado, y sale del historial del proveedor. Hasta 20% del total sin trabajos previos, 40% con cinco finalizados, 60% con veinte. - Cada propuesta de pago queda dentro del hilo de la conversación, en el momento en que ocurrió. La negociación completa es el registro si después hay una disputa. - Las reseñas salen únicamente de trabajos finalizados dentro de la app. No se pueden cargar a mano, ni desde el panel de administración. - El cliente no persigue a nadie: publica el problema, le llegan los presupuestos, y su pantalla de inicio le muestra qué trabajos esperan algo suyo, ordenados por urgencia. - Los pagos hechos por fuera de la app se pueden declarar y la otra parte los confirma. Queda registro aunque la plata no haya pasado por el sistema, y al proveedor le suma historial. - Hay un fondo de reparo opcional: un porcentaje que queda retenido unos días después de terminado el trabajo. - Pedís presupuesto por WhatsApp y la mayoría no contesta. El que contesta pide una seña por transferencia a un alias, sin ningún respaldo. - No hay forma de saber si el que viene es de confianza, ni qué dijeron otros clientes de él. - Adelantar plata sin garantía: si el trabajo queda mal o nunca empieza, no hay a quién reclamarle. - El 'te lo cotizo cuando lo vea' y la fecha que se corre: no hay referencia de precio ni compromiso escrito. - Cuando hay un problema a mitad de obra, lo hablado quedó en audios de WhatsApp que nadie vuelve a encontrar. - Entrá a reparehoy.com.ar y contá qué hay que arreglar - URL: https://reparehoy.com.ar - Secundario: Para proveedores: publicá tu oficio gratis en reparehoy.com.ar/registro - El momento en que llegan los presupuestos sin haber perseguido a nadie: la tira 'Te esperan tus proveedores' con el punto que late. - La negociación del plan de pagos ADENTRO del chat y el sello con las dos firmas. Es lo que ningún WhatsApp te da. - El tope de adelanto que sube con el historial (20, 40, 60%): para el proveedor es un incentivo y para el cliente una protección, en el mismo número. Mostrarlo como escalera, nunca como número suelto. - La seña retenida y liberada al terminar, dicha en una línea: 'La seña queda protegida hasta que el trabajo esté hecho'. - Para el proveedor: la bandeja donde el pedido aparece ya cotizable, con la zona y el oficio que él eligió.
LA TESIS (lo que la app declara de sí misma; manda sobre los hechos de abajo):
- El fuerte: RepareHoy hace de juez entre el que necesita arreglar algo en su casa y el que sabe hacerlo: la seña queda retenida hasta que el trabajo está hecho, el plan de pagos lo acuerdan los dos en el chat y queda como registro, y la reputación sale sólo de trabajos terminados adentro.
- Se entiende como: Un Mercado Libre de oficios con pago protegido: publicás lo que te pasa y te llegan los presupuestos, no perseguís a nadie.
- Contra qué: El WhatsApp y la confianza a ciegas: el plomero que no contesta, la seña por transferencia a un alias, el presupuesto que cambia cuando ya empezó, y lo hablado que quedó en audios.
- El momento mágico: Para el cliente, cuando abre la app y la tira dice 'Te esperan tus proveedores' con presupuestos que llegaron solos. Para el proveedor, cuando arma el plan de pagos a su manera y la app le dice hasta dónde puede pedir de adelanto porque ya se lo ganó.
- A quién le hablamos primero: Al cliente con algo roto en casa, porque es quien tiene el dolor hoy y quien trae la plata; sin pedidos no hay proveedor que se quede. El proveedor viene después, con su propia pieza: la bandeja, el plan, los números.
NO DECIR:
- precios concretos de servicios: son de demostración y cambian
- cantidades de proveedores, trabajos o reseñas como si fueran tracción real
- promesas absolutas: '100% seguro', 'garantizado', 'sin riesgo'
- que el pago al proveedor es automático: hoy la liberación genera una orden y la transferencia la hace tesorería a mano
- Mobbex, 'split de pagos' o 'sin triangulación fiscal': la pasarela activa es MercadoPago y no hay split; esos textos que aparecen en algún banner son heredados y están marcados para sacar
- que la plataforma garantiza el trabajo: lo que garantiza es que la seña no se libera hasta que esté hecho
- 'matriculados' para todos los oficios: la app verifica identidad y CUIT, no matrícula. La matrícula existe para gas y electricidad; en el resto, decir 'verificados'

MEDIA KIT / CAPTURAS REALES VERIFICADAS
CAPTURAS REALES DE LA APP (es lo que se VE en el video — no hay que imaginarlas). Para referirte a una pantalla usá su NOMBRE EXACTO de esta lista:
- Contar el problema: pedir un arreglo es contar qué pasa, en tus palabras, en cuatro pasos cortos; sin saber qué oficio necesitás — micro-animación: la barra de pasos avanza: se elige 'Humedad y filtraciones' (paso 1), se cargan superficie y presupuesto (paso 2), la zona y la descripción se tipean (paso 3) y el resumen '¿Todo bien?' junta todo antes de 'Crear solicitud', que pasa a 'Publicando…'. Al terminar aparece el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.'
- Te esperan tus proveedores: los presupuestos llegan solos y la app te dice qué está esperando algo tuyo, ordenado por urgencia — micro-animación: la home del cliente arranca sin la tira; llega el primer presupuesto y aparece 'TE ESPERAN TUS PROVEEDORES' con una tarjeta y el aviso rojo de la barra se enciende; llega el segundo y se suma al lado
- La conversación con el plan de pagos adentro: se negocia cómo se paga en el mismo chat, y la propuesta queda en el hilo en el momento en que ocurrió — micro-animación: los mensajes entran de a uno; en el hilo aparece la tarjeta 'Propuesta de pago 1' con los tres montos y arriba el acceso 'Plan de pagos enviado'; cuando el cliente firma, la tarjeta y el acceso pasan a 'Plan de pagos acordado' con el ícono verde
- Pagar la seña: se paga sólo la seña por MercadoPago y queda retenida por la plataforma hasta que el trabajo está terminado — micro-animación: en el checkout el botón dice 'Pagar $124.000' y la cajita 'Seña protegida' explica la retención; al volver de MercadoPago aparece el aviso '¡Pago recibido! Estamos confirmando tu reserva.'; con la seña confirmada, el botón del trabajo pasa a 'Marcar evento como finalizado'; terminado, a 'Dejar reseña al proveedor'
- Bandeja de solicitudes: al proveedor los pedidos le llegan ya ordenados por estado, con el cliente, el servicio y el monto; no sale a buscarlos — micro-animación: entra arriba el pedido nuevo de un cliente como pendiente ('1 pendientes de cotizar') y, cuando el proveedor cotiza, pasa a la pastilla COTIZADO con su monto
- Armar el plan de pagos: el proveedor elige cómo cobrar (todo al final, mitades, o contra avance por etapas) y la plataforma sólo le marca hasta dónde puede pedir de adelanto según su historial — micro-animación: el proveedor prueba 'Mitad y mitad' y aparece el aviso rojo 'El primer pago es el 50% del total y el máximo para vos es 40%'; pasa a 'Contra avance' con tres etapas y la línea se vuelve verde: 'Primer pago 20%. Podés pedir hasta 40%.'; aprieta 'Mandar propuesta'
- El panel del proveedor: el proveedor ve su mes en números: solicitudes, confirmadas, ingresos comprometidos, conversión, rating y reseñas — micro-animación: los números del mes cambian con el trabajo nuevo: Solicitudes 12 → 14, Confirmadas 9 → 10, Ingresos est. $9.496.000 → $10.116.000; la conversión baja de 75% a 71% porque entró un segundo pedido que todavía no se aceptó
- La reputación, hecha de trabajos reales: la reputación del proveedor sale sólo de trabajos terminados en la app: cada reseña tiene nombre, contratación verificada y estrellas, y hay de cuatro además de cinco — micro-animación: entra arriba la reseña nueva de un trabajo terminado, con cinco estrellas y la etiqueta 'Contratación Verificada'
- Mis solicitudes, con el progreso de cada trabajo: cada trabajo muestra en qué paso está (Pedido, Presupuesto, Seña, Terminado) y qué le falta, sin tener que preguntarle a nadie — micro-animación: la barra del trabajo avanza tramo por tramo (Pedido, Presupuesto, Seña, Terminado) y el rótulo nombra lo que falta: 'Esperando presupuesto', 'Esperando tu respuesta', 'Trabajo agendado', 'Terminado'
MOMENTOS (mini-flujos que YA cuentan una historia con principio y fin — la unidad narrativa del video):
- Cliente: del problema al trabajo pagado y protegido: cuento qué pasa en mi casa → me llegan los presupuestos sin perseguir a nadie → negocio cómo pagar en el chat y queda firmado → pago sólo la seña, que queda retenida → sigo el progreso hasta que está terminado — remate: La seña queda protegida hasta que el trabajo esté hecho. [screens/01-cliente-contar-el-problema.png → screens/02-cliente-te-esperan-tus-proveedores.png → screens/03-cliente-conversacion-con-plan-de-pagos.png → screens/04-cliente-pagar-la-sena.png → screens/09-cliente-mis-solicitudes-linea-de-tiempo.png]
- Proveedor: el trabajo que llega, el cobro que se acuerda: el pedido me llega a la bandeja, de mi zona y mi oficio → cotizo y armo el plan de pagos como me conviene, con un tope que sube con mi historial → el cliente paga la seña y queda confirmado → veo mi mes en números → mi reputación la hacen los trabajos que terminé — remate: Tu historial te deja pedir más adelanto. Y la reputación no se compra: se termina trabajo por trabajo. [screens/05-proveedor-bandeja-de-solicitudes.png → screens/06-proveedor-armar-plan-de-pagos.png → screens/04-cliente-pagar-la-sena.png → screens/07-proveedor-panel.png → screens/08-proveedor-reputacion-y-resenas.png]
CTA VERIFICADO POR LA APP (usalo tal cual en el cierre): Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar





DECISIONES CREATIVAS ELEGIDAS POR EL DUEÑO
ENFOQUE (la estructura del relato): Los dos lados [dos-lados]
FICHA COMPLETA DEL ENFOQUE:
{
  "ideaCentral": "La misma necesidad conecta dos perspectivas que se benefician de un sistema compartido: quien inicia o necesita algo y quien lo gestiona o atiende.",
  "quienesAparecen": [
    "persona solicitante o destinataria",
    "operador, supervisor o equipo",
    "representante de marca, opcional"
  ],
  "recorrido": [
    "una necesidad común",
    "perspectiva A: qué necesita saber o hacer",
    "perspectiva B: qué necesita organizar o resolver",
    "punto de conexión mediante el producto",
    "resultado coherente para ambos"
  ],
  "pantallasDelProducto": "Usar únicamente interfaces reales para representar la conexión; evitar pantallas imaginarias de interoperabilidad.",
  "tono": "Humano, colaborativo, equilibrado entre las dos perspectivas.",
  "noAsumir": [
    "que el equipo municipal es negligente",
    "que la solución garantiza respuesta inmediata",
    "que ambas partes ven exactamente la misma información"
  ],
  "cierre": "Un beneficio compartido: claridad para la persona y orden para la organización.",
  "variablesDeDiferenciacion": [
    "pareja de roles",
    "punto de contacto",
    "tipo de solicitud",
    "perspectiva dominante",
    "beneficio común"
  ]
}
TRATAMIENTO (el registro del spot): Aspiracional [aspiracional]
Visión de mejora, claridad y profesionalismo con pruebas visuales concretas, sin promesas grandiosas.
CIERRE DE MARCA: si no hay claim aprobado, proponé una firma simple sin hacerla pasar por eslogan oficial.
IMPORTANTE: El campo "recorrido" del enfoque es una guía semántica de opciones, NO una lista obligatoria de escenas ni un orden fijo. Conservá libertad narrativa.

HUMOR NO SOLICITADO
No fuerces chistes, ironía, parodia, personajes ridículos ni giros cómicos. Podés usar sorpresa, tensión humana o contraste si ayudan a entender el producto.


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

REGLAS DE PUBLICIDAD Y VERACIDAD
1. Toda historia debe conectar una NECESIDAD específica, una capacidad VERIFICABLE del negocio y un BENEFICIO entendible para la audiencia. Debe construir marca, no sólo entretenimiento.
2. Diferenciá las tres propuestas por situación, personaje, función o beneficio, y tensión dramática/creativa. Si hay humor, además diferenciá el mecanismo cómico. No entregues la misma idea con otro título.
3. Nunca inventes funciones, flujos, automatizaciones, integraciones, métricas, tiempos, premios, clientes, testimonios, cargos reales, avales, municipios clientes, ni resultados garantizados.
4. Un personaje de ficción puede vivir una situación simulada. NO lo presentes como testimonio comprobado. Si se menciona una localidad, no impliques que ya contrató el producto salvo prueba explícita en la ficha.
5. Si hay media kit, las pantallas descritas deben existir en él. Sin kit, mantené la referencia al producto conceptual y no atribuyas diseño, botones, notificaciones literales ni textos de UI.
6. La propuesta debe ser filmable o producible en 20 a 30 segundos. Evitá demasiados personajes, locaciones o subtramas; sin indicar segundos, planos, cortes, movimientos de cámara o desglose de escenas en "idea".
7. Presentador/a a cámara, narración, firma con logo, explicación, demostración y CTA SON recursos válidos cuando corresponden. No los prohíbas por prejuicio de formato.
8. Nunca hagas al municipio, sus trabajadores, vecinos o compradores objeto de burla, ni presupongas negligencia. La situación debe ser verosímil, especialmente en contextos públicos.
9. Español rioplatense natural, concreto, sin solemnidad vacía y sin clichés como «solución integral», «somos líderes», «transformá la gestión».

CONTROL DE CALIDAD INTERNO ANTES DE RESPONDER
Para cada propuesta: ¿es un spot de esta marca y no un contenido genérico?, ¿qué beneficio se entiende?, ¿cuál es la prueba o acción real?, ¿cumple enfoque y tratamiento?, ¿se puede producir?, ¿hay alguna afirmación inventada? Descartá las que fallen. ¿Este concepto sigue siendo el mejor vehículo para el ángulo comercial asignado? Si hay humor: ¿la observación es humana?, ¿el quiebre es claro?, ¿se entiende sin explicar el chiste?, ¿la marca es necesaria para la historia?

CAMPOS Y LONGITUDES — CONTÁ LAS PALABRAS
- topico: de 2 a 4 palabras; título concreto.
- tipoGancho: de 2 a 4 palabras MAYÚSCULAS. Es el RECURSO NARRATIVO (por ejemplo «SITUACIÓN COTIDIANA», «DOBLE PERSPECTIVA», «DEMOSTRACIÓN DIRECTA», «HUMOR OBSERVACIONAL», «CONTRASTE VISUAL»). No se obliga a usar chistes ni ganchos distintos a costa del enfoque.
- idea: de 40 a 60 palabras. Planteá situación, desarrollo del beneficio y cierre conceptual en un párrafo. No agregues tiempos, planos, montaje ni lista de tomas.
- tono: hasta 12 palabras; forma de hablar y actuar.
- estetica: hasta 25 palabras; clima y lenguaje visual, NO storyboard.
- referencia: hasta 12 palabras; formato publicitario general, no campañas concretas ni referencias inventadas.
- porQueFunciona: hasta 20 palabras; por qué esta idea comunica el beneficio e invita a avanzar.

FORMATO DE SALIDA
Devolvé ÚNICAMENTE un objeto JSON válido. Conservá las claves existentes para no romper el parser:
{
  "conceptos": [
    { "id": "c1", "topico": "", "tipoGancho": "", "idea": "", "tono": "", "estetica": "", "referencia": "", "porQueFunciona": "" },
    { "id": "c2", "topico": "", "tipoGancho": "", "idea": "", "tono": "", "estetica": "", "referencia": "", "porQueFunciona": "" },
    { "id": "c3", "topico": "", "tipoGancho": "", "idea": "", "tono": "", "estetica": "", "referencia": "", "porQueFunciona": "" }
  ]
}
```

**Lo que devolvió:**

```json
{
 "conceptos": [
  {
   "id": "c1",
   "topico": "Los dos que esperan",
   "tipoGancho": "DOBLE PERSPECTIVA",
   "idea": "Una inquilina de Villa Urquiza manda mensajes por una mancha de humedad y nadie contesta. En paralelo, un pintor de la zona mira el teléfono esperando trabajo. Los dos esperan lo mismo y no se encuentran. Ella cuenta el problema en RepareHoy, a él le entra el pedido, y la tira de presupuestos cierra el círculo.",
   "tono": "Humano, paciente, sin reproches; voz cercana que une dos esperas",
   "estetica": "Luz natural de departamento y de taller, paleta cálida sobria, pantallas reales filmadas limpias, montaje tranquilo y ordenado",
   "referencia": "Spot de marketplace con dos historias paralelas que convergen",
   "porQueFunciona": "La espera compartida vuelve obvio el valor de conectar: ella deja de buscar, él recibe."
  },
  {
   "id": "c2",
   "topico": "Una sola vez",
   "tipoGancho": "CONTRASTE VISUAL",
   "idea": "Un dueño de casa repite la misma descripción del caño que pierde a cinco contactos distintos, cada vez más corta y resignada. Después la escribe una sola vez en RepareHoy y la publica. La escena se invierte: ya no escribe, sólo mira cómo aparece la tira de proveedores que lo esperan, ordenada por urgencia, y elige. Contar una vez alcanza.",
   "tono": "Seco al principio, aliviado al final; narración mínima",
   "estetica": "Interior real de cocina, encuadres cerrados sobre manos y pantalla, grises que viran a luz clara cuando llegan los presupuestos",
   "referencia": "Antes y después de producto, con prueba de interfaz",
   "porQueFunciona": "El mismo gesto repetido y después anulado demuestra el beneficio sin explicarlo."
  },
  {
   "id": "c3",
   "topico": "El pedido que llega",
   "tipoGancho": "DEMOSTRACIÓN DIRECTA",
   "idea": "Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.",
   "tono": "Directo, profesional, orgulloso sin grandilocuencia; charla real",
   "estetica": "Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo",
   "referencia": "Testimonial ficcional de dos voces con demo de producto",
   "porQueFunciona": "Dos voces explican el mismo alivio y la interfaz lo confirma al instante."
  }
 ]
}
```

### Paso 3 · Guion

*Molde `script/2.1` · modelo opus-5 · 29 s · terminó 11/10 05:44 (hora argentina)*

**Pedido enviado al modelo (completo):**

```text
Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: escribí el GUION. No adelantes casting, planos ni decisiones técnicas del storyboard. Usá únicamente los hechos provistos; si un dato no está, no lo inventes.

Actuás como promo-director. Convertí el CONCEPTO ELEGIDO en un comercial de 26s para una pieza 9:16 para Instagram / TikTok, tono cercano.
CONCEPTO ELEGIDO (es la dirección creativa; no lo reemplaces por otra idea): {"id":"c3","topico":"El pedido que llega","tipoGancho":"DEMOSTRACIÓN DIRECTA","idea":"Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.","tono":"Directo, profesional, orgulloso sin grandilocuencia; charla real","estetica":"Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo","referencia":"Testimonial ficcional de dos voces con demo de producto","porQueFunciona":"Dos voces explican el mismo alivio y la interfaz lo confirma al instante."}
ENFOQUE Y TRATAMIENTO ELEGIDOS POR EL DUEÑO (vienen del concepto; respetalos)
ENFOQUE: Los dos lados [dos-lados]
{
  "ideaCentral": "La misma necesidad conecta dos perspectivas que se benefician de un sistema compartido: quien inicia o necesita algo y quien lo gestiona o atiende.",
  "quienesAparecen": [
    "persona solicitante o destinataria",
    "operador, supervisor o equipo",
    "representante de marca, opcional"
  ],
  "recorrido": [
    "una necesidad común",
    "perspectiva A: qué necesita saber o hacer",
    "perspectiva B: qué necesita organizar o resolver",
    "punto de conexión mediante el producto",
    "resultado coherente para ambos"
  ],
  "pantallasDelProducto": "Usar únicamente interfaces reales para representar la conexión; evitar pantallas imaginarias de interoperabilidad.",
  "tono": "Humano, colaborativo, equilibrado entre las dos perspectivas.",
  "noAsumir": [
    "que el equipo municipal es negligente",
    "que la solución garantiza respuesta inmediata",
    "que ambas partes ven exactamente la misma información"
  ],
  "cierre": "Un beneficio compartido: claridad para la persona y orden para la organización.",
  "variablesDeDiferenciacion": [
    "pareja de roles",
    "punto de contacto",
    "tipo de solicitud",
    "perspectiva dominante",
    "beneficio común"
  ]
}
TRATAMIENTO: Aspiracional [aspiracional]. Visión de mejora, claridad y profesionalismo con pruebas visuales concretas, sin promesas grandiosas.
Conservá el beneficio, el registro y, si lo hubo, el mecanismo cómico del concepto elegido; no inventes funciones.
CAPTURAS REALES DE LA APP (es lo que se VE en el video — no hay que imaginarlas). Para referirte a una pantalla usá su NOMBRE EXACTO de esta lista:
- Contar el problema: pedir un arreglo es contar qué pasa, en tus palabras, en cuatro pasos cortos; sin saber qué oficio necesitás — micro-animación: la barra de pasos avanza: se elige 'Humedad y filtraciones' (paso 1), se cargan superficie y presupuesto (paso 2), la zona y la descripción se tipean (paso 3) y el resumen '¿Todo bien?' junta todo antes de 'Crear solicitud', que pasa a 'Publicando…'. Al terminar aparece el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.'
- Te esperan tus proveedores: los presupuestos llegan solos y la app te dice qué está esperando algo tuyo, ordenado por urgencia — micro-animación: la home del cliente arranca sin la tira; llega el primer presupuesto y aparece 'TE ESPERAN TUS PROVEEDORES' con una tarjeta y el aviso rojo de la barra se enciende; llega el segundo y se suma al lado
- La conversación con el plan de pagos adentro: se negocia cómo se paga en el mismo chat, y la propuesta queda en el hilo en el momento en que ocurrió — micro-animación: los mensajes entran de a uno; en el hilo aparece la tarjeta 'Propuesta de pago 1' con los tres montos y arriba el acceso 'Plan de pagos enviado'; cuando el cliente firma, la tarjeta y el acceso pasan a 'Plan de pagos acordado' con el ícono verde
- Pagar la seña: se paga sólo la seña por MercadoPago y queda retenida por la plataforma hasta que el trabajo está terminado — micro-animación: en el checkout el botón dice 'Pagar $124.000' y la cajita 'Seña protegida' explica la retención; al volver de MercadoPago aparece el aviso '¡Pago recibido! Estamos confirmando tu reserva.'; con la seña confirmada, el botón del trabajo pasa a 'Marcar evento como finalizado'; terminado, a 'Dejar reseña al proveedor'
- Bandeja de solicitudes: al proveedor los pedidos le llegan ya ordenados por estado, con el cliente, el servicio y el monto; no sale a buscarlos — micro-animación: entra arriba el pedido nuevo de un cliente como pendiente ('1 pendientes de cotizar') y, cuando el proveedor cotiza, pasa a la pastilla COTIZADO con su monto
- Armar el plan de pagos: el proveedor elige cómo cobrar (todo al final, mitades, o contra avance por etapas) y la plataforma sólo le marca hasta dónde puede pedir de adelanto según su historial — micro-animación: el proveedor prueba 'Mitad y mitad' y aparece el aviso rojo 'El primer pago es el 50% del total y el máximo para vos es 40%'; pasa a 'Contra avance' con tres etapas y la línea se vuelve verde: 'Primer pago 20%. Podés pedir hasta 40%.'; aprieta 'Mandar propuesta'
- El panel del proveedor: el proveedor ve su mes en números: solicitudes, confirmadas, ingresos comprometidos, conversión, rating y reseñas — micro-animación: los números del mes cambian con el trabajo nuevo: Solicitudes 12 → 14, Confirmadas 9 → 10, Ingresos est. $9.496.000 → $10.116.000; la conversión baja de 75% a 71% porque entró un segundo pedido que todavía no se aceptó
- La reputación, hecha de trabajos reales: la reputación del proveedor sale sólo de trabajos terminados en la app: cada reseña tiene nombre, contratación verificada y estrellas, y hay de cuatro además de cinco — micro-animación: entra arriba la reseña nueva de un trabajo terminado, con cinco estrellas y la etiqueta 'Contratación Verificada'
- Mis solicitudes, con el progreso de cada trabajo: cada trabajo muestra en qué paso está (Pedido, Presupuesto, Seña, Terminado) y qué le falta, sin tener que preguntarle a nadie — micro-animación: la barra del trabajo avanza tramo por tramo (Pedido, Presupuesto, Seña, Terminado) y el rótulo nombra lo que falta: 'Esperando presupuesto', 'Esperando tu respuesta', 'Trabajo agendado', 'Terminado'
MOMENTOS (mini-flujos que YA cuentan una historia con principio y fin — la unidad narrativa del video):
- Cliente: del problema al trabajo pagado y protegido: cuento qué pasa en mi casa → me llegan los presupuestos sin perseguir a nadie → negocio cómo pagar en el chat y queda firmado → pago sólo la seña, que queda retenida → sigo el progreso hasta que está terminado — remate: La seña queda protegida hasta que el trabajo esté hecho. [screens/01-cliente-contar-el-problema.png → screens/02-cliente-te-esperan-tus-proveedores.png → screens/03-cliente-conversacion-con-plan-de-pagos.png → screens/04-cliente-pagar-la-sena.png → screens/09-cliente-mis-solicitudes-linea-de-tiempo.png]
- Proveedor: el trabajo que llega, el cobro que se acuerda: el pedido me llega a la bandeja, de mi zona y mi oficio → cotizo y armo el plan de pagos como me conviene, con un tope que sube con mi historial → el cliente paga la seña y queda confirmado → veo mi mes en números → mi reputación la hacen los trabajos que terminé — remate: Tu historial te deja pedir más adelanto. Y la reputación no se compra: se termina trabajo por trabajo. [screens/05-proveedor-bandeja-de-solicitudes.png → screens/06-proveedor-armar-plan-de-pagos.png → screens/04-cliente-pagar-la-sena.png → screens/07-proveedor-panel.png → screens/08-proveedor-reputacion-y-resenas.png]
CTA VERIFICADO POR LA APP (usalo tal cual en el cierre): Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar

FOCO DE ESTA PIEZA (lo definió la estrategia; es lo que se cuenta):
- alcance: problem
- mensaje principal: Dejá de perseguir a alguien que te conteste: contá el problema una vez y los presupuestos llegan a tu pantalla.
- hechos que lo sostienen: Pedís presupuesto por WhatsApp y la mayoría no contesta · El cliente cuenta el problema en sus palabras y recibe hasta tres presupuestos de profesionales verificados de su zona · El cliente no persigue a nadie: publica el problema y le llegan los presupuestos · La tira 'Te esperan tus proveedores' en la pantalla de inicio, con los trabajos que esperan algo suyo ordenados por urgencia
OBJETIVO NARRATIVO:
- Mantené UNA idea central de principio a fin.
- El espectador debe entender qué resuelve RepareHoy y por qué importa, pero el video NO tiene que enumerar toda la plataforma.
- Elegí del BRIEF sólo los hechos y beneficios que sostienen este concepto (pueden ser varias funciones si sirven a una misma idea). No intentes meter todos los módulos ni todos los mensajes clave.
- El GIRO es el momento en que el beneficio se ve; nace de la misma situación del concepto y va antes del CTA. Es un remate gracioso SÓLO si el tratamiento elegido es humor: sin humor pedido, nada de chistes, ironía ni parodia.

ESTRUCTURA EXACTA:
hook -> desarrollo -> giro -> cta

PRESUPUESTO HABLADO (contá palabras):
- hook: 4s, máximo 10 palabras
- desarrollo: 12s, máximo 32 palabras
- giro: 5s, máximo 13 palabras
- cta: 5s, máximo 13 palabras
Total: 26s, máximo 68 palabras. Referencia de ritmo: hasta 2,7 palabras por segundo.
Esos durSec son una referencia: podés redistribuirlos entre bloques siempre que la suma final sea 26s.

CADA BLOQUE:
- narration: sólo lo que se DICE. No describas actuación ni cámara.
- visual: una sola frase breve con lo que se VE; tiene que apoyar esa narración, no repetirla.
- durSec: duración del bloque.

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

NO ASUMIR:
- datos, cifras, precios, integraciones, clientes o resultados que no estén en el BRIEF;
- funciones que no estén mencionadas;
- un CTA distinto del disponible en el BRIEF.

Devolvé SOLO JSON:
{ "blocks": [{ "role": "hook|desarrollo|giro|cta", "narration": "", "visual": "", "durSec": <segundos> }], "music": { "mood": "2-3 palabras" } }

NEGOCIO: RepareHoy
BRIEF (única fuente de hechos):
NEGOCIO: RepareHoy — Contá el problema. Elegí entre 3 presupuestos de profesionales verificados.
RUBRO: AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Barrio de ejemplo para los textos: Villa Urquiza.
PÚBLICO: quien tiene algo que arreglar o hacer en su casa, dueño o inquilino, en Ciudad de Buenos Aires y Gran Buenos Aires · profesionales de oficio y pequeñas empresas de servicios que quieren recibir pedidos de su zona sin salir a buscarlos
QUÉ ES: Marketplace de oficios para el hogar en el AMBA. El cliente cuenta el problema en sus palabras, recibe hasta tres presupuestos de profesionales verificados de su zona, habla con el que elige por un chat dentro de la app y paga la seña desde ahí. - Qué vende: Intermediación entre quien necesita arreglar o hacer algo en su casa y profesionales de once oficios: plomería, electricidad, cerrajería, gas, aire acondicionado, pintura, carpintería, albañilería, herrería, techos y humedad, y materiales. La plataforma cobra una comisión del 10% sobre el monto del trabajo; la paga el proveedor. - Zona: AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Barrio de ejemplo para los textos: Villa Urquiza. - Audiencia prioritaria: Primero el cliente que tiene algo que arreglar en su casa; después el proveedor. En ese orden, y con una historia para cada uno. - La seña queda retenida por la plataforma y se le libera al proveedor recién cuando el trabajo está terminado: sin disputa abierta, a los 7 días de finalizado. - El plan de pagos lo acuerdan las partes, no la plataforma: el proveedor propone (todo al final, mitad y mitad, o contra avance por etapas), el cliente acepta o contrapropone, y queda sellado cuando los dos firman. - La plataforma pone un solo límite: cuánto se puede pedir por adelantado, y sale del historial del proveedor. Hasta 20% del total sin trabajos previos, 40% con cinco finalizados, 60% con veinte. - Cada propuesta de pago queda dentro del hilo de la conversación, en el momento en que ocurrió. La negociación completa es el registro si después hay una disputa. - Las reseñas salen únicamente de trabajos finalizados dentro de la app. No se pueden cargar a mano, ni desde el panel de administración. - El cliente no persigue a nadie: publica el problema, le llegan los presupuestos, y su pantalla de inicio le muestra qué trabajos esperan algo suyo, ordenados por urgencia. - Los pagos hechos por fuera de la app se pueden declarar y la otra parte los confirma. Queda registro aunque la plata no haya pasado por el sistema, y al proveedor le suma historial. - Hay un fondo de reparo opcional: un porcentaje que queda retenido unos días después de terminado el trabajo. - Pedís presupuesto por WhatsApp y la mayoría no contesta. El que contesta pide una seña por transferencia a un alias, sin ningún respaldo. - No hay forma de saber si el que viene es de confianza, ni qué dijeron otros clientes de él. - Adelantar plata sin garantía: si el trabajo queda mal o nunca empieza, no hay a quién reclamarle. - El 'te lo cotizo cuando lo vea' y la fecha que se corre: no hay referencia de precio ni compromiso escrito. - Cuando hay un problema a mitad de obra, lo hablado quedó en audios de WhatsApp que nadie vuelve a encontrar. - Entrá a reparehoy.com.ar y contá qué hay que arreglar - URL: https://reparehoy.com.ar - Secundario: Para proveedores: publicá tu oficio gratis en reparehoy.com.ar/registro - El momento en que llegan los presupuestos sin haber perseguido a nadie: la tira 'Te esperan tus proveedores' con el punto que late. - La negociación del plan de pagos ADENTRO del chat y el sello con las dos firmas. Es lo que ningún WhatsApp te da. - El tope de adelanto que sube con el historial (20, 40, 60%): para el proveedor es un incentivo y para el cliente una protección, en el mismo número. Mostrarlo como escalera, nunca como número suelto. - La seña retenida y liberada al terminar, dicha en una línea: 'La seña queda protegida hasta que el trabajo esté hecho'. - Para el proveedor: la bandeja donde el pedido aparece ya cotizable, con la zona y el oficio que él eligió.
LA TESIS (lo que la app declara de sí misma; manda sobre los hechos de abajo):
- El fuerte: RepareHoy hace de juez entre el que necesita arreglar algo en su casa y el que sabe hacerlo: la seña queda retenida hasta que el trabajo está hecho, el plan de pagos lo acuerdan los dos en el chat y queda como registro, y la reputación sale sólo de trabajos terminados adentro.
- Se entiende como: Un Mercado Libre de oficios con pago protegido: publicás lo que te pasa y te llegan los presupuestos, no perseguís a nadie.
- Contra qué: El WhatsApp y la confianza a ciegas: el plomero que no contesta, la seña por transferencia a un alias, el presupuesto que cambia cuando ya empezó, y lo hablado que quedó en audios.
- El momento mágico: Para el cliente, cuando abre la app y la tira dice 'Te esperan tus proveedores' con presupuestos que llegaron solos. Para el proveedor, cuando arma el plan de pagos a su manera y la app le dice hasta dónde puede pedir de adelanto porque ya se lo ganó.
- A quién le hablamos primero: Al cliente con algo roto en casa, porque es quien tiene el dolor hoy y quien trae la plata; sin pedidos no hay proveedor que se quede. El proveedor viene después, con su propia pieza: la bandeja, el plan, los números.
NO DECIR:
- precios concretos de servicios: son de demostración y cambian
- cantidades de proveedores, trabajos o reseñas como si fueran tracción real
- promesas absolutas: '100% seguro', 'garantizado', 'sin riesgo'
- que el pago al proveedor es automático: hoy la liberación genera una orden y la transferencia la hace tesorería a mano
- Mobbex, 'split de pagos' o 'sin triangulación fiscal': la pasarela activa es MercadoPago y no hay split; esos textos que aparecen en algún banner son heredados y están marcados para sacar
- que la plataforma garantiza el trabajo: lo que garantiza es que la seña no se libera hasta que esté hecho
- 'matriculados' para todos los oficios: la app verifica identidad y CUIT, no matrícula. La matrícula existe para gas y electricidad; en el resto, decir 'verificados'
```

**Lo que devolvió:**

```json
{
 "blocks": [
  {
   "role": "hook",
   "narration": "Mandaba mensajes a cinco plomeros. No contestaba ninguno.",
   "visual": "Retrato a cámara de la vecina en su casa, luz suave de ventana",
   "durSec": 4
  },
  {
   "role": "desarrollo",
   "narration": "Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez, en mis palabras. Y el pedido me llega a la bandeja, con mi zona y mi oficio.",
   "visual": "Alternancia entre la electricista en obra y la pantalla Contar el problema avanzando hasta la Bandeja de solicitudes",
   "durSec": 12
  },
  {
   "role": "giro",
   "narration": "Abrí la app y ya tenía los presupuestos. No perseguí a nadie.",
   "visual": "La tira Te esperan tus proveedores apareciendo en la pantalla de inicio de la vecina",
   "durSec": 5
  },
  {
   "role": "cta",
   "narration": "Entrá a reparé hoy punto com punto ar y contá qué hay que arreglar.",
   "visual": "Las dos, cada una en su lugar, con el logo y la URL reparehoy.com.ar sobre fondo limpio",
   "durSec": 5
  }
 ],
 "music": {
  "mood": "cálida, confiada"
 }
}
```

### Paso 4 · Personajes

*Molde `cast/2.0` · modelo sonnet-5 · 11 s · terminó 11/10 05:44 (hora argentina)*

**Pedido enviado al modelo (completo):**

```text
Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: definí el CAST y la LOCACIÓN necesarios para producir el concepto y el guion. No agregues personajes decorativos ni reescribas la historia.

Sos casting director + location scout de un comercial 9:16.

CRITERIO:
- Usá 1 personaje si alcanza; usá 2 sólo si el guion necesita dos roles reales.
- Cada personaje debe tener una función narrativa identificable.
- La locación debe ser el entorno físico natural del negocio y de la acción del guion. Evitá locaciones genéricas que podrían pertenecer a cualquier rubro.

POR PERSONAJE:
- id: p1, p2.
- nombre: breve.
- rol: función en el comercial.
- fisicoEn: 25 a 45 palabras en INGLÉS. Descripción visual consistente para generación de imagen/video: edad aproximada, pelo, tono de piel, rasgos, vestuario y presencia. Sólo características visibles.
- fisicoEs: máximo 18 palabras en español para la UI.
- vestuario: máximo 10 palabras.
- personalidad: 1 a 3 palabras.

LOCACIÓN:
- nombre: corto y específico.
- descripcionEn: 25 a 50 palabras en INGLÉS. Espacio, mobiliario relevante, atmósfera y luz coherentes con el negocio y el guion.
- luz: máximo 8 palabras.

NO ASUMIR:
- profesiones, jerarquías o rasgos que el concepto no necesite;
- objetos, tecnología o instalaciones que impliquen funciones no mencionadas;
- cambios de personaje para distintas escenas: la identidad definida acá debe poder mantenerse en todo el comercial.

Devolvé SOLO JSON:
{ "personajes": [{ "id": "p1", "nombre": "...", "rol": "...", "fisicoEn": "...", "fisicoEs": "...", "vestuario": "...", "personalidad": "..." }], "lugar": { "nombre": "...", "descripcionEn": "...", "luz": "..." } }

ENFOQUE Y TRATAMIENTO ELEGIDOS POR EL DUEÑO (vienen del concepto; respetalos)
ENFOQUE: Los dos lados [dos-lados]
{
  "ideaCentral": "La misma necesidad conecta dos perspectivas que se benefician de un sistema compartido: quien inicia o necesita algo y quien lo gestiona o atiende.",
  "quienesAparecen": [
    "persona solicitante o destinataria",
    "operador, supervisor o equipo",
    "representante de marca, opcional"
  ],
  "recorrido": [
    "una necesidad común",
    "perspectiva A: qué necesita saber o hacer",
    "perspectiva B: qué necesita organizar o resolver",
    "punto de conexión mediante el producto",
    "resultado coherente para ambos"
  ],
  "pantallasDelProducto": "Usar únicamente interfaces reales para representar la conexión; evitar pantallas imaginarias de interoperabilidad.",
  "tono": "Humano, colaborativo, equilibrado entre las dos perspectivas.",
  "noAsumir": [
    "que el equipo municipal es negligente",
    "que la solución garantiza respuesta inmediata",
    "que ambas partes ven exactamente la misma información"
  ],
  "cierre": "Un beneficio compartido: claridad para la persona y orden para la organización.",
  "variablesDeDiferenciacion": [
    "pareja de roles",
    "punto de contacto",
    "tipo de solicitud",
    "perspectiva dominante",
    "beneficio común"
  ]
}
TRATAMIENTO: Aspiracional [aspiracional]. Visión de mejora, claridad y profesionalismo con pruebas visuales concretas, sin promesas grandiosas.
Elegí sólo los personajes y roles que la historia elegida necesita: "quienesAparecen" es una lista de opciones, no un reparto obligatorio.
NEGOCIO: RepareHoy
RUBRO: AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Barrio de ejemplo para los textos: Villa Urquiza.
CONCEPTO: {"id":"c3","topico":"El pedido que llega","tipoGancho":"DEMOSTRACIÓN DIRECTA","idea":"Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.","tono":"Directo, profesional, orgulloso sin grandilocuencia; charla real","estetica":"Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo","referencia":"Testimonial ficcional de dos voces con demo de producto","porQueFunciona":"Dos voces explican el mismo alivio y la interfaz lo confirma al instante."}
GUION: [hook] Mandaba mensajes a cinco plomeros. No contestaba ninguno. (visual: Retrato a cámara de la vecina en su casa, luz suave de ventana) · [desarrollo] Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez, en mis palabras. Y el pedido me llega a la bandeja, con mi zona y mi oficio. (visual: Alternancia entre la electricista en obra y la pantalla Contar el problema avanzando hasta la Bandeja de solicitudes) · [giro] Abrí la app y ya tenía los presupuestos. No perseguí a nadie. (visual: La tira Te esperan tus proveedores apareciendo en la pantalla de inicio de la vecina) · [cta] Entrá a reparé hoy punto com punto ar y contá qué hay que arreglar. (visual: Las dos, cada una en su lugar, con el logo y la URL reparehoy.com.ar sobre fondo limpio)
```

**Lo que devolvió:**

```json
{
 "personajes": [
  {
   "id": "p1",
   "nombre": "Vecina",
   "rol": "Destinataria del servicio: cuenta su necesidad y muestra en su pantalla los presupuestos que recibe",
   "fisicoEn": "Woman around 35 years old, light olive skin, dark brown shoulder-length hair, natural everyday makeup, warm approachable expression, medium build, relaxed posture, sitting near a window in her home",
   "fisicoEs": "Mujer de unos 35 años, pelo castaño oscuro a los hombros, expresión cálida y cercana",
   "vestuario": "Ropa de entrecasa prolija, sweater claro",
   "personalidad": "Cercana, honesta"
  },
  {
   "id": "p2",
   "nombre": "Electricista",
   "rol": "Profesional que recibe el pedido en su bandeja según zona y oficio, y cuenta su experiencia",
   "fisicoEn": "Woman around 32 years old, tan skin, dark hair tied back in a practical ponytail, confident calm expression, athletic build, wearing visible work attire, standing in a construction or renovation setting",
   "fisicoEs": "Mujer de unos 32 años, pelo oscuro atado, expresión segura y profesional",
   "vestuario": "Camisa de trabajo, chaleco con bolsillos",
   "personalidad": "Segura, orgullosa"
  }
 ],
 "lugar": {
  "nombre": "Casa en reforma y hogar de Villa Urquiza",
  "descripcionEn": "Two connected real-life settings: a cozy home interior near a window with soft natural light for the testimonial, and a mid-renovation space with exposed wiring, tools and unfinished walls where the electrician works, both clean and realistic without staging.",
  "luz": "Luz natural suave, ambiente cotidiano real"
 }
}
```

### Paso 5 · Storyboard

*Molde `storyboard/2.1` · modelo sonnet-5 · 27 s · terminó 11/10 05:45 (hora argentina)*

**Pedido enviado al modelo (completo):**

```text
Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: convertí el GUION en un STORYBOARD FILMADO producible. No reescribas el concepto ni agregues mensajes comerciales nuevos. Usá únicamente el CAST y el GUION provistos.

Sos director de un comercial FILMADO 9:16.
CAPTURAS REALES DE LA APP (es lo que se VE en el video — no hay que imaginarlas). Para referirte a una pantalla usá su NOMBRE EXACTO de esta lista:
- Contar el problema: pedir un arreglo es contar qué pasa, en tus palabras, en cuatro pasos cortos; sin saber qué oficio necesitás — micro-animación: la barra de pasos avanza: se elige 'Humedad y filtraciones' (paso 1), se cargan superficie y presupuesto (paso 2), la zona y la descripción se tipean (paso 3) y el resumen '¿Todo bien?' junta todo antes de 'Crear solicitud', que pasa a 'Publicando…'. Al terminar aparece el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.'
- Te esperan tus proveedores: los presupuestos llegan solos y la app te dice qué está esperando algo tuyo, ordenado por urgencia — micro-animación: la home del cliente arranca sin la tira; llega el primer presupuesto y aparece 'TE ESPERAN TUS PROVEEDORES' con una tarjeta y el aviso rojo de la barra se enciende; llega el segundo y se suma al lado
- La conversación con el plan de pagos adentro: se negocia cómo se paga en el mismo chat, y la propuesta queda en el hilo en el momento en que ocurrió — micro-animación: los mensajes entran de a uno; en el hilo aparece la tarjeta 'Propuesta de pago 1' con los tres montos y arriba el acceso 'Plan de pagos enviado'; cuando el cliente firma, la tarjeta y el acceso pasan a 'Plan de pagos acordado' con el ícono verde
- Pagar la seña: se paga sólo la seña por MercadoPago y queda retenida por la plataforma hasta que el trabajo está terminado — micro-animación: en el checkout el botón dice 'Pagar $124.000' y la cajita 'Seña protegida' explica la retención; al volver de MercadoPago aparece el aviso '¡Pago recibido! Estamos confirmando tu reserva.'; con la seña confirmada, el botón del trabajo pasa a 'Marcar evento como finalizado'; terminado, a 'Dejar reseña al proveedor'
- Bandeja de solicitudes: al proveedor los pedidos le llegan ya ordenados por estado, con el cliente, el servicio y el monto; no sale a buscarlos — micro-animación: entra arriba el pedido nuevo de un cliente como pendiente ('1 pendientes de cotizar') y, cuando el proveedor cotiza, pasa a la pastilla COTIZADO con su monto
- Armar el plan de pagos: el proveedor elige cómo cobrar (todo al final, mitades, o contra avance por etapas) y la plataforma sólo le marca hasta dónde puede pedir de adelanto según su historial — micro-animación: el proveedor prueba 'Mitad y mitad' y aparece el aviso rojo 'El primer pago es el 50% del total y el máximo para vos es 40%'; pasa a 'Contra avance' con tres etapas y la línea se vuelve verde: 'Primer pago 20%. Podés pedir hasta 40%.'; aprieta 'Mandar propuesta'
- El panel del proveedor: el proveedor ve su mes en números: solicitudes, confirmadas, ingresos comprometidos, conversión, rating y reseñas — micro-animación: los números del mes cambian con el trabajo nuevo: Solicitudes 12 → 14, Confirmadas 9 → 10, Ingresos est. $9.496.000 → $10.116.000; la conversión baja de 75% a 71% porque entró un segundo pedido que todavía no se aceptó
- La reputación, hecha de trabajos reales: la reputación del proveedor sale sólo de trabajos terminados en la app: cada reseña tiene nombre, contratación verificada y estrellas, y hay de cuatro además de cinco — micro-animación: entra arriba la reseña nueva de un trabajo terminado, con cinco estrellas y la etiqueta 'Contratación Verificada'
- Mis solicitudes, con el progreso de cada trabajo: cada trabajo muestra en qué paso está (Pedido, Presupuesto, Seña, Terminado) y qué le falta, sin tener que preguntarle a nadie — micro-animación: la barra del trabajo avanza tramo por tramo (Pedido, Presupuesto, Seña, Terminado) y el rótulo nombra lo que falta: 'Esperando presupuesto', 'Esperando tu respuesta', 'Trabajo agendado', 'Terminado'
MOMENTOS (mini-flujos que YA cuentan una historia con principio y fin — la unidad narrativa del video):
- Cliente: del problema al trabajo pagado y protegido: cuento qué pasa en mi casa → me llegan los presupuestos sin perseguir a nadie → negocio cómo pagar en el chat y queda firmado → pago sólo la seña, que queda retenida → sigo el progreso hasta que está terminado — remate: La seña queda protegida hasta que el trabajo esté hecho. [screens/01-cliente-contar-el-problema.png → screens/02-cliente-te-esperan-tus-proveedores.png → screens/03-cliente-conversacion-con-plan-de-pagos.png → screens/04-cliente-pagar-la-sena.png → screens/09-cliente-mis-solicitudes-linea-de-tiempo.png]
- Proveedor: el trabajo que llega, el cobro que se acuerda: el pedido me llega a la bandeja, de mi zona y mi oficio → cotizo y armo el plan de pagos como me conviene, con un tope que sube con mi historial → el cliente paga la seña y queda confirmado → veo mi mes en números → mi reputación la hacen los trabajos que terminé — remate: Tu historial te deja pedir más adelanto. Y la reputación no se compra: se termina trabajo por trabajo. [screens/05-proveedor-bandeja-de-solicitudes.png → screens/06-proveedor-armar-plan-de-pagos.png → screens/04-cliente-pagar-la-sena.png → screens/07-proveedor-panel.png → screens/08-proveedor-reputacion-y-resenas.png]
CTA VERIFICADO POR LA APP (usalo tal cual en el cierre): Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar

PRINCIPIO:
Cada escena tiene una función visual concreta. No agregues escenas por variedad. Si dos escenas cuentan lo mismo, dejá una sola.

PANTALLAS (regla dura): nunca se filma una pantalla. Si un momento del guion tiene que mostrar la app, esa escena es un INSERTO: poné en "pantalla" el nombre EXACTO de una de las capturas de arriba, "personajes": [] y en "accion" qué se ve en esa pantalla; la arma el motor con el mockup real, no Flow. En las escenas filmadas, un teléfono o una computadora nunca muestran la interfaz: se ve la persona, su gesto y lo que le pasa.

POR ESCENA:
- n: consecutivo desde 1.
- rol: hook|desarrollo|giro|cta (giro = el momento en que se ve el beneficio; remate gracioso sólo con tratamiento humor).
- durSec: talking head mínimo 8s; b-roll entre 4 y 8s. Un b-roll CON voz en off dura lo que dura su texto a 2,7 palabras por segundo (10 palabras = 4s), nunca más; sin voz, 4 a 6s.
- plano: para talking head, medium shot waist-up; evitá sujetos lejanos.
- angulo: breve.
- personajes: sólo ids existentes en CAST; [] si no aparece nadie.
- accion: máximo 14 palabras; describe una sola acción visible.
- dialogo: "" si nadie habla a cámara. Si hay talking head, usá texto del GUION sin inventar claims y respetá máximo 2,7 palabras por segundo (8s = 21 palabras).
- continuidad: máximo 8 palabras; sólo lo que debe mantenerse respecto de la escena anterior.
- pantalla: "" en las escenas filmadas; el nombre EXACTO de la captura en un inserto de pantalla.

DURACIÓN Y TALKING HEADS (regla dura, medible):
- Un talking head dura 8s y necesita 17 a 21 palabras de diálogo: JUNTÁ bloques consecutivos del guion en un mismo talking head (por ejemplo hook + desarrollo) en vez de hacer un talking head por bloque. Un talking head con menos de 12 palabras es aire y no sirve.
- Pieza de hasta 24s: como máximo TRES talking heads. Lo demás va como b-roll de 4 a 8s con la voz en off (dialogo con el texto del guion y personajes []).
- Con UN solo talking head la pieza queda en 26s (máximo 33s); con dos, pasa a 24 a 30s: no comprimas, extendé.
El giro (el momento en que se ve el beneficio; remate gracioso sólo con tratamiento humor) ocurre antes del CTA.

CONTINUIDAD:
Usá siempre los mismos ids para el mismo personaje. No cambies ropa, edad, lugar o luz sin que el GUION lo justifique.

NO ASUMIR:
- personajes fuera del CAST;
- funciones, precios o resultados no presentes en el GUION;
- locaciones o acciones que contradigan el concepto.

Devolvé SOLO JSON:
{ "escenas": [{ "n": 1, "rol": "hook", "durSec": 8, "plano": "medium shot waist-up", "angulo": "eye-level", "personajes": ["p1"], "accion": "...", "dialogo": "...", "continuidad": "...", "pantalla": "" }] }

NEGOCIO: RepareHoy
MARCA FONÉTICA para cualquier diálogo: reparé hoy
ENFOQUE Y TRATAMIENTO ELEGIDOS POR EL DUEÑO (vienen del concepto; respetalos)
ENFOQUE: Los dos lados [dos-lados]
{
  "ideaCentral": "La misma necesidad conecta dos perspectivas que se benefician de un sistema compartido: quien inicia o necesita algo y quien lo gestiona o atiende.",
  "quienesAparecen": [
    "persona solicitante o destinataria",
    "operador, supervisor o equipo",
    "representante de marca, opcional"
  ],
  "recorrido": [
    "una necesidad común",
    "perspectiva A: qué necesita saber o hacer",
    "perspectiva B: qué necesita organizar o resolver",
    "punto de conexión mediante el producto",
    "resultado coherente para ambos"
  ],
  "pantallasDelProducto": "Usar únicamente interfaces reales para representar la conexión; evitar pantallas imaginarias de interoperabilidad.",
  "tono": "Humano, colaborativo, equilibrado entre las dos perspectivas.",
  "noAsumir": [
    "que el equipo municipal es negligente",
    "que la solución garantiza respuesta inmediata",
    "que ambas partes ven exactamente la misma información"
  ],
  "cierre": "Un beneficio compartido: claridad para la persona y orden para la organización.",
  "variablesDeDiferenciacion": [
    "pareja de roles",
    "punto de contacto",
    "tipo de solicitud",
    "perspectiva dominante",
    "beneficio común"
  ]
}
TRATAMIENTO: Aspiracional [aspiracional]. Visión de mejora, claridad y profesionalismo con pruebas visuales concretas, sin promesas grandiosas.
Recién acá la historia se traduce a escenas y se comprueba que entra en 20 a 30 segundos. El "recorrido" de la ficha es un banco de posibilidades, nunca una orden de escenas ni un orden fijo.
CAST: {"personajes":[{"id":"p1","nombre":"Vecina","rol":"Destinataria del servicio: cuenta su necesidad y muestra en su pantalla los presupuestos que recibe","fisicoEn":"Woman around 35 years old, light olive skin, dark brown shoulder-length hair, natural everyday makeup, warm approachable expression, medium build, relaxed posture, sitting near a window in her home","fisicoEs":"Mujer de unos 35 años, pelo castaño oscuro a los hombros, expresión cálida y cercana","vestuario":"Ropa de entrecasa prolija, sweater claro","personalidad":"Cercana, honesta"},{"id":"p2","nombre":"Electricista","rol":"Profesional que recibe el pedido en su bandeja según zona y oficio, y cuenta su experiencia","fisicoEn":"Woman around 32 years old, tan skin, dark hair tied back in a practical ponytail, confident calm expression, athletic build, wearing visible work attire, standing in a construction or renovation setting","fisicoEs":"Mujer de unos 32 años, pelo oscuro atado, expresión segura y profesional","vestuario":"Camisa de trabajo, chaleco con bolsillos","personalidad":"Segura, orgullosa"}],"lugar":{"nombre":"Casa en reforma y hogar de Villa Urquiza","descripcionEn":"Two connected real-life settings: a cozy home interior near a window with soft natural light for the testimonial, and a mid-renovation space with exposed wiring, tools and unfinished walls where the electrician works, both clean and realistic without staging.","luz":"Luz natural suave, ambiente cotidiano real"}}
GUION: [hook] Mandaba mensajes a cinco plomeros. No contestaba ninguno. (visual: Retrato a cámara de la vecina en su casa, luz suave de ventana) · [desarrollo] Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez, en mis palabras. Y el pedido me llega a la bandeja, con mi zona y mi oficio. (visual: Alternancia entre la electricista en obra y la pantalla Contar el problema avanzando hasta la Bandeja de solicitudes) · [giro] Abrí la app y ya tenía los presupuestos. No perseguí a nadie. (visual: La tira Te esperan tus proveedores apareciendo en la pantalla de inicio de la vecina) · [cta] Entrá a reparé hoy punto com punto ar y contá qué hay que arreglar. (visual: Las dos, cada una en su lugar, con el logo y la URL reparehoy.com.ar sobre fondo limpio)
```

**Lo que devolvió:**

```json
[
 {
  "n": 1,
  "rol": "hook",
  "durSec": 4,
  "plano": "medium shot waist-up",
  "angulo": "eye-level",
  "personajes": [],
  "accion": "Vecina mira el celular con gesto de resignación, luz de ventana",
  "dialogo": "Mandaba mensajes a cinco plomeros. No contestaba ninguno.",
  "continuidad": "",
  "pantalla": "",
  "personajesModelo": [
   "p1"
  ],
  "talkingHeadConvertido": true,
  "durSecModelo": 8
 },
 {
  "n": 2,
  "rol": "desarrollo",
  "durSec": 8,
  "plano": "medium shot waist-up",
  "angulo": "eye-level",
  "personajes": [
   "p1"
  ],
  "accion": "Vecina sigue hablando, cambia de gesto a esperanza",
  "dialogo": "Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez.",
  "continuidad": "misma ventana, misma luz",
  "pantalla": ""
 },
 {
  "n": 3,
  "rol": "desarrollo",
  "durSec": 4,
  "plano": "",
  "angulo": "",
  "personajes": [],
  "accion": "Barra de pasos avanza: problema, superficie, zona, resumen final",
  "dialogo": "En mis palabras.",
  "continuidad": "",
  "pantalla": "Contar el problema",
  "durSecModelo": 5,
  "archivoCaptura": "screens/01-cliente-contar-el-problema.png"
 },
 {
  "n": 4,
  "rol": "desarrollo",
  "durSec": 8,
  "plano": "medium shot",
  "angulo": "eye-level",
  "personajes": [
   "p2"
  ],
  "accion": "Electricista revisa su teléfono en la obra, gesto atento",
  "dialogo": "Y el pedido me llega a la bandeja, con mi zona y mi oficio.",
  "continuidad": "obra con cables expuestos",
  "pantalla": ""
 },
 {
  "n": 5,
  "rol": "desarrollo",
  "durSec": 6,
  "plano": "",
  "angulo": "",
  "personajes": [],
  "accion": "Pedido nuevo entra como pendiente en la bandeja del proveedor",
  "dialogo": "Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez, en mis palabras.",
  "continuidad": "",
  "pantalla": "Bandeja de solicitudes",
  "dividido": 1,
  "durSecModelo": 3,
  "nModelo": 5,
  "archivoCaptura": "screens/05-proveedor-bandeja-de-solicitudes.png"
 },
 {
  "n": 6,
  "rol": "giro",
  "durSec": 5,
  "plano": "",
  "angulo": "",
  "personajes": [],
  "accion": "Vecina sonríe mirando el celular con alivio, mensaje de presupuestos recibidos en pantalla",
  "dialogo": "Abrí la app y ya tenía los presupuestos. No perseguí a nadie.",
  "continuidad": "misma ventana, misma luz",
  "pantalla": "Presupuestos recibidos",
  "nModelo": 7,
  "talkingHeadConvertido": true,
  "personajesModelo": [
   "p1"
  ],
  "durSecModelo": 4
 },
 {
  "n": 7,
  "rol": "cta",
  "durSec": 6,
  "plano": "wide shot",
  "angulo": "eye-level",
  "personajes": [],
  "accion": "Logo y URL sobre fondo limpio, voz en off invita a entrar a la app",
  "dialogo": "Entrá a reparé hoy punto com punto ar y contá qué hay que arreglar.",
  "continuidad": "",
  "pantalla": "",
  "talkingHeadConvertido": true,
  "personajesModelo": [
   "p1",
   "p2"
  ],
  "durSecModelo": 2,
  "nModelo": 8
 }
]
```

### Paso 6 · Pedidos a Flow

*Molde `flowpack/2.0-compilado` · modelo sonnet-5 · 6 s · terminó 11/10 05:46 (hora argentina)*

**Pedido enviado al modelo (completo):**

```text
Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.
1| Vecina mira el celular con gesto de resignación, luz de ventana
2| Vecina sigue hablando, cambia de gesto a esperanza
3| Barra de pasos avanza: problema, superficie, zona, resumen final
4| Electricista revisa su teléfono en la obra, gesto atento
5| Pedido nuevo entra como pendiente en la bandeja del proveedor
6| Vecina sonríe mirando el celular con alivio, mensaje de presupuestos recibidos en pantalla
7| Logo y URL sobre fondo limpio, voz en off invita a entrar a la app
```

**Lo que devolvió:**

```json
{
 "estilo": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect.",
 "personajes": [
  {
   "id": "p1",
   "nombre": "Vecina",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 35 years old, light olive skin, dark brown shoulder-length hair, natural everyday makeup, warm approachable expression, medium build, relaxed posture, sitting near a window in her home, standing and looking at the camera, natural pose, neutral background with a hint of two connected real-life settings: a cozy home interior near a window with soft natural. A still photo, no action, no dialogue."
  },
  {
   "id": "p2",
   "nombre": "Electricista",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 32 years old, tan skin, dark hair tied back in a practical ponytail, confident calm expression, athletic build, wearing visible work attire, standing in a construction or renovation setting, standing and looking at the camera, natural pose, neutral background with a hint of two connected real-life settings: a cozy home interior near a window with soft natural. A still photo, no action, no dialogue."
  }
 ],
 "escenas": [
  {
   "escenaN": 1,
   "rol": "hook",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Location: Two connected real-life settings: a cozy home interior near a window with soft natural light for the testimonial. Neighbor looks at her phone with a gesture of resignation, window light. No spoken dialogue, ambient sound only. One single continuous take, same background, no cut. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text.",
   "estado": "pendiente"
  },
  {
   "escenaN": 2,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Location: Two connected real-life settings: a cozy home interior near a window with soft natural light for the testimonial. Vecina, an Argentine Woman around 35 years old, light olive skin, dark brown shoulder-length hair, natural everyday makeup, warm approachable expression. Medium shot, waist-up framing, the person fills a good portion of the frame with strong, dominant presence. The camera holds steady or does a very subtle slow push-in while speaking. Action: Neighbor keeps talking, shifts her expression to hope. She speaks directly to camera in Argentine Rioplatense Spanish (voseo), fluently and naturally, only once and without repeating any words: 'Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez.' Warm and assured delivery, explaining with confidence. The person keeps talking for the whole clip, warm, confident and charming tone, realistic expressive face. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text.",
   "estado": "pendiente"
  },
  {
   "escenaN": 4,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Location: Two connected real-life settings: a cozy home interior near a window with soft natural light for the testimonial. Electricista, an Argentine Woman around 32 years old, tan skin, dark hair tied back in a practical ponytail, confident calm expression. Medium shot, waist-up framing, the person fills a good portion of the frame with strong, dominant presence. The camera holds steady or does a very subtle slow push-in while speaking. Action: Electrician checks his phone at the job site, attentive gesture. She speaks directly to camera in Argentine Rioplatense Spanish (voseo), fluently and naturally, only once and without repeating any words: 'Y el pedido me llega a la bandeja, con mi zona y mi oficio.' Warm and assured delivery, explaining with confidence. The person keeps talking for the whole clip, warm, confident and charming tone, realistic expressive face. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text.",
   "estado": "pendiente"
  }
 ],
 "huecos": [],
 "version": "flowpack/2.0-compilado"
}
```

### Lo que filmó Flow con la vuelta 0 (transcripción de lo que dicen los clips)

- Escena 1 (11/10 06:33): "Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa. Una vez"
- Escena 2 (11/10 06:33): "Y el pedido me llega a la bandeja con mi zona y mi oficio."
- Escena 4 (11/10 06:33): "Y el pedido me llega a la bandeja con mi zona y mi oficio"

---

## Vuelta 1

**Qué cambió en las reglas:** Sin locutor: cada frase con quién la dice en cámara. Cada personaje con su lugar. Escena = situación, no cara; planos variados. El pedido a Flow pone el contenido primero. Se va la regla vieja que convertía frases cortas en "voz en off".

- Juez de la pieza (ChatGPT): VEREDICTO: TIENE POTENCIAL — 6/10
- Gemini 5/10 · Qwen 4/10

Estrategia y concepto: los mismos de la vuelta 0.

### Paso 3 · Guion

*Molde `script/3.0` · modelo opus-5 · 42 s · terminó 11/10 14:27 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 0** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 0
+++ vuelta 1
@@ -63,4 +63,13 @@
 
-ESTRUCTURA EXACTA:
-hook -> desarrollo -> giro -> cta
+ESTRUCTURA (en este orden):
+hook -> desarrollo (de 1 a 3 bloques) -> giro -> cta
+- hook: en la primera frase, una situación cotidiana y concreta del problema que el espectador reconoce como suya (un objeto, un momento), dicha por quien la vive. Nada de quejas genéricas ni preguntas retóricas.
+- giro: el momento en que el beneficio se VE en la vida de la persona (qué cambió para ella), no una descripción de la app.
+
+QUIÉN DICE CADA COSA (regla dura: en esta pieza NO hay locutor ni voz en off)
+- Cada palabra la dice EN CÁMARA una persona de la historia. "quien" = esa persona, nombrada como la nombra el concepto (por ejemplo, el oficio o el vínculo), siempre con el mismo nombre en toda la pieza.
+- Una sola persona por bloque. Si hablan dos, son dos bloques.
+- Lo que dice tiene que ser verosímil en SU boca: cada uno cuenta lo que le pasó a él, con sus palabras.
+- Si la historia tiene dos lados, lo que uno necesita es exactamente lo que el otro hace (mismo oficio, mismo problema): si no, el pedido de uno nunca le llega al otro.
+- Un bloque puede no tener voz (narration "") si la imagen cuenta sola ese momento; entonces "quien" es "".
 
@@ -77,2 +86,5 @@
 - visual: una sola frase breve con lo que se VE; tiene que apoyar esa narración, no repetirla.
+- visual: qué está HACIENDO quien habla en ese momento, en su lugar, con un objeto concreto (por ejemplo, lo que tiene en la mano o lo que se rompió). Prohibido "mira a cámara", "retrato" o "habla a cámara" como única acción: eso no cuenta nada.
+- quien: la persona que lo dice en cámara ("" si el bloque no tiene voz).
+- Cada bloque es UNA toma: como máximo 18 palabras habladas.
 - durSec: duración del bloque.
@@ -128,3 +140,3 @@
 Devolvé SOLO JSON:
-{ "blocks": [{ "role": "hook|desarrollo|giro|cta", "narration": "", "visual": "", "durSec": <segundos> }], "music": { "mood": "2-3 palabras" } }
+{ "blocks": [{ "role": "hook|desarrollo|giro|cta", "quien": "", "narration": "", "visual": "", "durSec": <segundos> }], "music": { "mood": "2-3 palabras" } }
```

**Lo que devolvió:**

```json
{
 "blocks": [
  {
   "role": "hook",
   "quien": "la vecina de Villa Urquiza",
   "narration": "Se me quemó el tablero y mandé mensajes a ciegas.",
   "visual": "En la cocina a oscuras, la vecina sostiene el celular como linterna y vuelve a subir la llave térmica, que salta otra vez.",
   "durSec": 4
  },
  {
   "role": "desarrollo",
   "quien": "la electricista de Villa Urquiza",
   "narration": "Yo antes esperaba que alguien me recomendara. Ahora el pedido me llega con la zona y el oficio.",
   "visual": "La electricista apoya la pinza sobre un tablero abierto en obra y en su teléfono el pedido entra como pendiente de cotizar en Bandeja de solicitudes.",
   "durSec": 7
  },
  {
   "role": "desarrollo",
   "quien": "la vecina de Villa Urquiza",
   "narration": "Conté qué pasaba, en mis palabras. No perseguí a nadie.",
   "visual": "Sentada en el piso del pasillo, con el tablero abierto detrás, la vecina tipea la zona y la descripción en Contar el problema.",
   "durSec": 5
  },
  {
   "role": "giro",
   "quien": "la vecina de Villa Urquiza",
   "narration": "Abrí el teléfono y los presupuestos ya estaban ahí.",
   "visual": "Apoya el mate en la mesada y en su pantalla de inicio se enciende la tira Te esperan tus proveedores con las tarjetas de presupuesto.",
   "durSec": 5
  },
  {
   "role": "cta",
   "quien": "la vecina de Villa Urquiza",
   "narration": "Entrá a Repare Hoy punto com punto ar y contá qué hay que arreglar.",
   "visual": "La vecina guarda la linterna en el cajón y deja el celular sobre la mesada con reparehoy.com.ar en pantalla.",
   "durSec": 5
  }
 ],
 "music": {
  "mood": "cálido, cercano, luminoso"
 }
}
```

### Paso 4 · Personajes

*Molde `cast/2.1` · modelo opus-5 · 18 s · terminó 11/10 14:27 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 0** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 0
+++ vuelta 1
@@ -17,4 +17,6 @@
 - personalidad: 1 a 3 palabras.
+- lugarEn: 20 a 40 palabras en INGLÉS. DÓNDE vemos a ESTA persona en el comercial: un lugar suyo, concreto y creíble (no "a home" ni "an office"), con 2 o 3 objetos que cuentan su situación y la luz. Si el guion la muestra con un problema, el problema se ve en el lugar (lo roto, lo que gotea, lo que no anda). Cada personaje tiene SU lugar: nunca el de otro.
+- quien: el nombre con el que el GUION la nombra en "dice:" (para unir cada frase con su persona).
 
-LOCACIÓN:
+LOCACIÓN (la general, para el retrato de referencia):
 - nombre: corto y específico.
@@ -26,6 +28,7 @@
 - objetos, tecnología o instalaciones que impliquen funciones no mencionadas;
-- cambios de personaje para distintas escenas: la identidad definida acá debe poder mantenerse en todo el comercial.
+- cambios de personaje para distintas escenas: la identidad definida acá debe poder mantenerse en todo el comercial;
+- un oficio distinto del que el guion necesita: si alguien pide un electricista, quien responde es electricista.
 
 Devolvé SOLO JSON:
-{ "personajes": [{ "id": "p1", "nombre": "...", "rol": "...", "fisicoEn": "...", "fisicoEs": "...", "vestuario": "...", "personalidad": "..." }], "lugar": { "nombre": "...", "descripcionEn": "...", "luz": "..." } }
+{ "personajes": [{ "id": "p1", "nombre": "...", "rol": "...", "fisicoEn": "...", "fisicoEs": "...", "vestuario": "...", "personalidad": "...", "lugarEn": "...", "quien": "..." }], "lugar": { "nombre": "...", "descripcionEn": "...", "luz": "..." } }
 
@@ -68,2 +71,2 @@
 CONCEPTO: {"id":"c3","topico":"El pedido que llega","tipoGancho":"DEMOSTRACIÓN DIRECTA","idea":"Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.","tono":"Directo, profesional, orgulloso sin grandilocuencia; charla real","estetica":"Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo","referencia":"Testimonial ficcional de dos voces con demo de producto","porQueFunciona":"Dos voces explican el mismo alivio y la interfaz lo confirma al instante."}
-GUION: [hook] Mandaba mensajes a cinco plomeros. No contestaba ninguno. (visual: Retrato a cámara de la vecina en su casa, luz suave de ventana) · [desarrollo] Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez, en mis palabras. Y el pedido me llega a la bandeja, con mi zona y mi oficio. (visual: Alternancia entre la electricista en obra y la pantalla Contar el problema avanzando hasta la Bandeja de solicitudes) · [giro] Abrí la app y ya tenía los presupuestos. No perseguí a nadie. (visual: La tira Te esperan tus proveedores apareciendo en la pantalla de inicio de la vecina) · [cta] Entrá a reparé hoy punto com punto ar y contá qué hay que arreglar. (visual: Las dos, cada una en su lugar, con el logo y la URL reparehoy.com.ar sobre fondo limpio)
+GUION: [hook · dice: la vecina de Villa Urquiza] Se me quemó el tablero y mandé mensajes a ciegas. (visual: En la cocina a oscuras, la vecina sostiene el celular como linterna y vuelve a subir la llave térmica, que salta otra vez.) · [desarrollo · dice: la electricista de Villa Urquiza] Yo antes esperaba que alguien me recomendara. Ahora el pedido me llega con la zona y el oficio. (visual: La electricista apoya la pinza sobre un tablero abierto en obra y en su teléfono el pedido entra como pendiente de cotizar en Bandeja de solicitudes.) · [desarrollo · dice: la vecina de Villa Urquiza] Conté qué pasaba, en mis palabras. No perseguí a nadie. (visual: Sentada en el piso del pasillo, con el tablero abierto detrás, la vecina tipea la zona y la descripción en Contar el problema.) · [giro · dice: la vecina de Villa Urquiza] Abrí el teléfono y los presupuestos ya estaban ahí. (visual: Apoya el mate en la mesada y en su pantalla de inicio se enciende la tira Te esperan tus proveedores con las tarjetas de presupuesto.) · [cta · dice: la vecina de Villa Urquiza] Entrá a Repare Hoy punto com punto ar y contá qué hay que arreglar. (visual: La vecina guarda la linterna en el cajón y deja el celular sobre la mesada con reparehoy.com.ar en pantalla.)
```

**Lo que devolvió:**

```json
{
 "personajes": [
  {
   "id": "p1",
   "nombre": "Vanina",
   "rol": "La vecina de Villa Urquiza que publica el pedido: la voz de quien necesita el arreglo y abre y cierra el comercial",
   "fisicoEn": "Woman around 38, olive skin, dark wavy hair pulled back in a loose bun, thick eyebrows, small expressive eyes, light smile lines. Wears a mustard knit sweater over a plain tee, jeans, no jewelry. Grounded, tired but warm presence.",
   "fisicoEs": "Mujer de unos 38, piel oliva, pelo oscuro ondulado recogido, gesto cansado y cálido",
   "vestuario": "Sweater mostaza, remera lisa, jeans",
   "personalidad": "Práctica, franca",
   "lugarEn": "Her own narrow apartment kitchen with the lights dead: open electrical panel on the hallway wall behind her, tripped breaker switch, cold tiled counter with a mate gourd and a small flashlight. Only light comes from her phone screen and dim window dusk.",
   "quien": "la vecina de Villa Urquiza"
  },
  {
   "id": "p2",
   "nombre": "Carla",
   "rol": "La electricista de Villa Urquiza que recibe el pedido: la voz del oficio que antes dependía de recomendaciones",
   "fisicoEn": "Woman around 45, tanned skin, straight dark hair in a low ponytail, strong jawline, calm steady gaze, short clean nails. Wears a navy work shirt with rolled sleeves, insulated pliers in chest pocket, work trousers. Confident, unhurried professional presence.",
   "fisicoEs": "Mujer de unos 45, piel morena, pelo oscuro atado, camisa de trabajo azul, segura",
   "vestuario": "Camisa de trabajo azul, pantalón de obra",
   "personalidad": "Segura, serena",
   "lugarEn": "A half-finished renovation site mid-job: open circuit panel on a bare brick wall with labelled wires exposed, her pliers resting on the panel edge, coiled cable and a dusty stepladder beside her. Hard daylight from an unglazed window.",
   "quien": "la electricista de Villa Urquiza"
  }
 ],
 "lugar": {
  "nombre": "Departamento sin luz y obra de tablero en Villa Urquiza",
  "descripcionEn": "Two paired working spaces in a Buenos Aires neighbourhood: a modest apartment kitchen and hallway with a tripped electrical panel, tiled counter and mate gourd in near darkness; and a renovation site with exposed brick, an open labelled circuit panel, cables and a stepladder in flat daylight.",
  "luz": "Penumbra de celular y luz natural dura"
 }
}
```

### Paso 5 · Storyboard

*Molde `storyboard/3.0` · modelo opus-5 · 47 s · terminó 11/10 14:28 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 0** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 0
+++ vuelta 1
@@ -23,2 +23,14 @@
 
+CADA ESCENA FILMADA ES UNA SITUACIÓN, NO UNA CARA (regla central)
+Una persona mirando a cámara no cuenta nada: tres escenas así son tres veces la misma toma. Cada escena filmada muestra a
+la persona HACIENDO algo en su lugar, con un objeto concreto, y algo cambia en esos segundos (de la bronca al alivio, de
+esperar a recibir). La frase se dice mientras pasa eso: a veces a cámara, como un testimonio; a veces a alguien fuera de
+cuadro, por teléfono o para sí misma. Que se entienda la historia aunque no tenga sonido.
+
+QUIÉN HABLA
+- En esta pieza no hay locutor ni voz en off: cada frase del GUION la dice EN CÁMARA la persona que figura en "dice:".
+- Una escena filmada por cada bloque con voz. "dialogo" = la frase de ese bloque, TAL CUAL; "personajes" = el id de quien
+  la dice (el personaje del CAST cuyo "quien" coincide).
+- Ninguna frase se repite en dos escenas. Ninguna escena tiene una frase que diga otra persona.
+
 POR ESCENA:
@@ -26,16 +38,26 @@
 - rol: hook|desarrollo|giro|cta (giro = el momento en que se ve el beneficio; remate gracioso sólo con tratamiento humor).
-- durSec: talking head mínimo 8s; b-roll entre 4 y 8s. Un b-roll CON voz en off dura lo que dura su texto a 2,7 palabras por segundo (10 palabras = 4s), nunca más; sin voz, 4 a 6s.
-- plano: para talking head, medium shot waist-up; evitá sujetos lejanos.
+- personajes: el id de quien está en cuadro ([] en un inserto de pantalla).
+- dialogo: la frase del guion que dice esa persona; "" si en esa escena nadie habla.
+- accion: en español, máximo 25 palabras: qué hace la persona, con qué objeto, y qué cambia (es lo que lee el dueño).
+- accionEn: en INGLÉS, de 35 a 70 palabras, para el generador de video: quién (su nombre del CAST), dónde (su "lugarEn"
+  del CAST, con lo que se ve), qué hace en los 8 segundos EN ORDEN (antes, mientras dice la frase y después), hacia
+  dónde dice la frase (a cámara, a alguien fuera de cuadro, al teléfono), el gesto y el sonido del lugar. Pronombres con el
+  género correcto del personaje. Sin la frase (va aparte), sin marcas de cámara ni lentes, sin texto en pantalla.
+- plano: close-up | medium close-up | medium shot | over-the-shoulder | low angle | high angle | handheld follow |
+  wide shot. Nunca el mismo plano en dos escenas filmadas seguidas.
 - angulo: breve.
-- personajes: sólo ids existentes en CAST; [] si no aparece nadie.
-- accion: máximo 14 palabras; describe una sola acción visible.
-- dialogo: "" si nadie habla a cámara. Si hay talking head, usá texto del GUION sin inventar claims y respetá máximo 2,7 palabras por segundo (8s = 21 palabras).
-- continuidad: máximo 8 palabras; sólo lo que debe mantenerse respecto de la escena anterior.
+- continuidad: máximo 8 palabras; sólo lo que debe mantenerse respecto de la escena anterior de la MISMA persona.
 - pantalla: "" en las escenas filmadas; el nombre EXACTO de la captura en un inserto de pantalla.
+- durSec: escena filmada con frase = lo que tarda la frase a 2,7 palabras por segundo + 2 (de 4 a 8); escena filmada
+  sin frase, de 3 a 5; inserto de pantalla, de 3 a 4.
 
-DURACIÓN Y TALKING HEADS (regla dura, medible):
-- Un talking head dura 8s y necesita 17 a 21 palabras de diálogo: JUNTÁ bloques consecutivos del guion en un mismo talking head (por ejemplo hook + desarrollo) en vez de hacer un talking head por bloque. Un talking head con menos de 12 palabras es aire y no sirve.
-- Pieza de hasta 24s: como máximo TRES talking heads. Lo demás va como b-roll de 4 a 8s con la voz en off (dialogo con el texto del guion y personajes []).
-- Con UN solo talking head la pieza queda en 26s (máximo 33s); con dos, pasa a 24 a 30s: no comprimas, extendé.
+INSERTOS DE PANTALLA
+- Sólo los que prueban lo que se acaba de decir, inmediatamente después de esa frase. Como máximo 3 en la pieza.
+- No tienen diálogo: suena la música.
+
+DURACIÓN
+La suma de durSec queda entre 22 y 33 segundos. Si sobra, se acortan las escenas sin frase o se saca un inserto; nunca se juntan frases de dos personas.
 El giro (el momento en que se ve el beneficio; remate gracioso sólo con tratamiento humor) ocurre antes del CTA.
+El CTA puede ser una frase de un personaje o una escena sin frase: el cierre con la marca y la dirección lo dibuja el
+montaje, no se filma.
 
@@ -50,3 +72,3 @@
 Devolvé SOLO JSON:
-{ "escenas": [{ "n": 1, "rol": "hook", "durSec": 8, "plano": "medium shot waist-up", "angulo": "eye-level", "personajes": ["p1"], "accion": "...", "dialogo": "...", "continuidad": "...", "pantalla": "" }] }
+{ "escenas": [{ "n": 1, "rol": "hook", "durSec": 5, "plano": "...", "angulo": "...", "personajes": ["p1"], "accion": "...", "accionEn": "...", "dialogo": "...", "continuidad": "...", "pantalla": "" }] }
 
@@ -88,3 +110,3 @@
 Recién acá la historia se traduce a escenas y se comprueba que entra en 20 a 30 segundos. El "recorrido" de la ficha es un banco de posibilidades, nunca una orden de escenas ni un orden fijo.
-CAST: {"personajes":[{"id":"p1","nombre":"Vecina","rol":"Destinataria del servicio: cuenta su necesidad y muestra en su pantalla los presupuestos que recibe","fisicoEn":"Woman around 35 years old, light olive skin, dark brown shoulder-length hair, natural everyday makeup, warm approachable expression, medium build, relaxed posture, sitting near a window in her home","fisicoEs":"Mujer de unos 35 años, pelo castaño oscuro a los hombros, expresión cálida y cercana","vestuario":"Ropa de entrecasa prolija, sweater claro","personalidad":"Cercana, honesta"},{"id":"p2","nombre":"Electricista","rol":"Profesional que recibe el pedido en su bandeja según zona y oficio, y cuenta su experiencia","fisicoEn":"Woman around 32 years old, tan skin, dark hair tied back in a practical ponytail, confident calm expression, athletic build, wearing visible work attire, standing in a construction or renovation setting","fisicoEs":"Mujer de unos 32 años, pelo oscuro atado, expresión segura y profesional","vestuario":"Camisa de trabajo, chaleco con bolsillos","personalidad":"Segura, orgullosa"}],"lugar":{"nombre":"Casa en reforma y hogar de Villa Urquiza","descripcionEn":"Two connected real-life settings: a cozy home interior near a window with soft natural light for the testimonial, and a mid-renovation space with exposed wiring, tools and unfinished walls where the electrician works, both clean and realistic without staging.","luz":"Luz natural suave, ambiente cotidiano real"}}
-GUION: [hook] Mandaba mensajes a cinco plomeros. No contestaba ninguno. (visual: Retrato a cámara de la vecina en su casa, luz suave de ventana) · [desarrollo] Yo esperaba que alguien me recomendara. Ahora cuento qué me pasa, una vez, en mis palabras. Y el pedido me llega a la bandeja, con mi zona y mi oficio. (visual: Alternancia entre la electricista en obra y la pantalla Contar el problema avanzando hasta la Bandeja de solicitudes) · [giro] Abrí la app y ya tenía los presupuestos. No perseguí a nadie. (visual: La tira Te esperan tus proveedores apareciendo en la pantalla de inicio de la vecina) · [cta] Entrá a reparé hoy punto com punto ar y contá qué hay que arreglar. (visual: Las dos, cada una en su lugar, con el logo y la URL reparehoy.com.ar sobre fondo limpio)
+CAST: {"personajes":[{"id":"p1","nombre":"Vanina","rol":"La vecina de Villa Urquiza que publica el pedido: la voz de quien necesita el arreglo y abre y cierra el comercial","fisicoEn":"Woman around 38, olive skin, dark wavy hair pulled back in a loose bun, thick eyebrows, small expressive eyes, light smile lines. Wears a mustard knit sweater over a plain tee, jeans, no jewelry. Grounded, tired but warm presence.","fisicoEs":"Mujer de unos 38, piel oliva, pelo oscuro ondulado recogido, gesto cansado y cálido","vestuario":"Sweater mostaza, remera lisa, jeans","personalidad":"Práctica, franca","lugarEn":"Her own narrow apartment kitchen with the lights dead: open electrical panel on the hallway wall behind her, tripped breaker switch, cold tiled counter with a mate gourd and a small flashlight. Only light comes from her phone screen and dim window dusk.","quien":"la vecina de Villa Urquiza"},{"id":"p2","nombre":"Carla","rol":"La electricista de Villa Urquiza que recibe el pedido: la voz del oficio que antes dependía de recomendaciones","fisicoEn":"Woman around 45, tanned skin, straight dark hair in a low ponytail, strong jawline, calm steady gaze, short clean nails. Wears a navy work shirt with rolled sleeves, insulated pliers in chest pocket, work trousers. Confident, unhurried professional presence.","fisicoEs":"Mujer de unos 45, piel morena, pelo oscuro atado, camisa de trabajo azul, segura","vestuario":"Camisa de trabajo azul, pantalón de obra","personalidad":"Segura, serena","lugarEn":"A half-finished renovation site mid-job: open circuit panel on a bare brick wall with labelled wires exposed, her pliers resting on the panel edge, coiled cable and a dusty stepladder beside her. Hard daylight from an unglazed window.","quien":"la electricista de Villa Urquiza"}],"lugar":{"nombre":"Departamento sin luz y obra de tablero en Villa Urquiza","descripcionEn":"Two paired working spaces in a Buenos Aires neighbourhood: a modest apartment kitchen and hallway with a tripped electrical panel, tiled counter and mate gourd in near darkness; and a renovation site with exposed brick, an open labelled circuit panel, cables and a stepladder in flat daylight.","luz":"Penumbra de celular y luz natural dura"}}
+GUION: [hook · dice: la vecina de Villa Urquiza] Se me quemó el tablero y mandé mensajes a ciegas. (visual: En la cocina a oscuras, la vecina sostiene el celular como linterna y vuelve a subir la llave térmica, que salta otra vez.) · [desarrollo · dice: la electricista de Villa Urquiza] Yo antes esperaba que alguien me recomendara. Ahora el pedido me llega con la zona y el oficio. (visual: La electricista apoya la pinza sobre un tablero abierto en obra y en su teléfono el pedido entra como pendiente de cotizar en Bandeja de solicitudes.) · [desarrollo · dice: la vecina de Villa Urquiza] Conté qué pasaba, en mis palabras. No perseguí a nadie. (visual: Sentada en el piso del pasillo, con el tablero abierto detrás, la vecina tipea la zona y la descripción en Contar el problema.) · [giro · dice: la vecina de Villa Urquiza] Abrí el teléfono y los presupuestos ya estaban ahí. (visual: Apoya el mate en la mesada y en su pantalla de inicio se enciende la tira Te esperan tus proveedores con las tarjetas de presupuesto.) · [cta · dice: la vecina de Villa Urquiza] Entrá a Repare Hoy punto com punto ar y contá qué hay que arreglar. (visual: La vecina guarda la linterna en el cajón y deja el celular sobre la mesada con reparehoy.com.ar en pantalla.)
```

**Lo que devolvió:**

```json
[
 {
  "n": 1,
  "rol": "hook",
  "durSec": 6,
  "plano": "medium close-up",
  "angulo": "Levemente lateral, a la altura del hombro",
  "personajes": [
   "p1"
  ],
  "accion": "Vanina sostiene el celular como linterna y sube la llave térmica; la llave salta otra vez y ella resopla.",
  "accionEn": "In her dark narrow apartment hallway, Vanina holds her phone up as a flashlight with one hand and pushes the tripped breaker switch back up with the other. The switch snaps down again with a dry click. She lowers the phone, breathes out, and speaks her line toward the camera with blunt tiredness, then glances back at the dead panel. Only phone glow and dim window dusk; faint street noise.",
  "dialogo": "Se me quemó el tablero y mandé mensajes a ciegas.",
  "continuidad": "",
  "pantalla": "",
  "durSecModelo": 8
 },
 {
  "n": 2,
  "rol": "desarrollo",
  "durSec": 8,
  "plano": "medium shot",
  "angulo": "Frontal, cámara a la altura del pecho",
  "personajes": [
   "p2"
  ],
  "accion": "Carla apoya la pinza sobre el tablero abierto en obra, se gira y cuenta cómo le llegan ahora los pedidos.",
  "accionEn": "At the half-finished renovation site, Carla sets her insulated pliers down on the edge of the open circuit panel and wipes dust off her palms on her work trousers. She turns from the labelled wires toward the camera and delivers her line calmly, unhurried, then nods once and reaches back toward a coiled cable. Hard daylight from the unglazed window; distant hammering and a radio.",
  "dialogo": "Yo antes esperaba que alguien me recomendara. Ahora el pedido me llega con la zona y el oficio.",
  "continuidad": "",
  "pantalla": ""
 },
 {
  "n": 3,
  "rol": "desarrollo",
  "durSec": 4,
  "plano": "",
  "angulo": "",
  "personajes": [],
  "accion": "El pedido nuevo entra arriba de la lista como pendiente de cotizar y, al cotizar, pasa a la pastilla con su monto.",
  "accionEn": "",
  "dialogo": "",
  "continuidad": "",
  "pantalla": "Bandeja de solicitudes",
  "archivoCaptura": "screens/05-proveedor-bandeja-de-solicitudes.png"
 },
 {
  "n": 4,
  "rol": "desarrollo",
  "durSec": 6,
  "plano": "high angle",
  "angulo": "Picado suave desde el pasillo",
  "personajes": [
   "p1"
  ],
  "accion": "Sentada en el piso del pasillo con el tablero abierto detrás, Vanina tipea con los pulgares y se le afloja el gesto.",
  "accionEn": "Vanina sits on the hallway floor of her apartment, back against the wall, the open electrical panel above and behind her, the small flashlight standing upright beside her knee. She types with both thumbs on her phone, pausing to think. She looks up at the camera and says her line plainly, with relief that she did not have to chase anyone, then goes back to typing. Dusk light, quiet building hum.",
  "dialogo": "Conté qué pasaba, en mis palabras. No perseguí a nadie.",
  "continuidad": "Mismo sweater mostaza, pelo recogido, penumbra",
  "pantalla": "",
  "durSecModelo": 8
 },
 {
  "n": 5,
  "rol": "giro",
  "durSec": 6,
  "plano": "close-up",
  "angulo": "Frontal cerrado sobre la cara",
  "personajes": [
   "p1"
  ],
  "accion": "Vanina apoya el mate en la mesada, mira la pantalla y se le ilumina la cara al ver los presupuestos.",
  "accionEn": "In her tiled kitchen, Vanina sets the mate gourd down on the cold counter and picks up her phone. She looks at the screen, her eyebrows lift and a small smile breaks through the tiredness. She turns to the camera and says her line, then looks back down at the phone, scrolling slowly. Phone light on her face in the dim kitchen; faint fridge hum.",
  "dialogo": "Abrí el teléfono y los presupuestos ya estaban ahí.",
  "continuidad": "Mismo sweater mostaza, mismo peinado y penumbra",
  "pantalla": "",
  "durSecModelo": 8
 },
 {
  "n": 6,
  "rol": "giro",
  "durSec": 4,
  "plano": "",
  "angulo": "",
  "personajes": [],
  "accion": "Llega el primer presupuesto y se enciende la tira de proveedores que esperan; después se suma el segundo al lado.",
  "accionEn": "",
  "dialogo": "",
  "continuidad": "",
  "pantalla": "Te esperan tus proveedores",
  "archivoCaptura": "screens/02-cliente-te-esperan-tus-proveedores.png"
 },
 {
  "n": 7,
  "rol": "cta",
  "durSec": 8,
  "plano": "medium shot",
  "angulo": "Frontal desde la mesada",
  "personajes": [
   "p1"
  ],
  "accion": "Vanina guarda la linterna en el cajón, deja el celular sobre la mesada y habla a cámara; la cocina ya tiene luz.",
  "accionEn": "Vanina drops the small flashlight into a kitchen drawer and pushes it shut with her hip, then places her phone face up on the tiled counter next to the mate gourd. She straightens, looks directly at the camera and says her line like a recommendation to a neighbour, then shrugs lightly and reaches for the mate. Kitchen light is on now; quiet domestic ambience.",
  "dialogo": "Entrá a Repare Hoy punto com punto ar y contá qué hay que arreglar.",
  "continuidad": "Mismo sweater mostaza y peinado; ahora con luz",
  "pantalla": ""
 }
]
```

### Paso 6 · Pedidos a Flow

*Molde `flowpack/2.0-compilado` · modelo sonnet-5 · 5 s · terminó 11/10 14:28 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 0** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 0
+++ vuelta 1
@@ -1,8 +1,3 @@
-Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.
-1| Vecina mira el celular con gesto de resignación, luz de ventana
-2| Vecina sigue hablando, cambia de gesto a esperanza
-3| Barra de pasos avanza: problema, superficie, zona, resumen final
-4| Electricista revisa su teléfono en la obra, gesto atento
-5| Pedido nuevo entra como pendiente en la bandeja del proveedor
-6| Vecina sonríe mirando el celular con alivio, mensaje de presupuestos recibidos en pantalla
-7| Logo y URL sobre fondo limpio, voz en off invita a entrar a la app
+Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Respetá el género de quien está en cuadro (lo dice el paréntesis, que no se traduce ni se copia). Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.
+3| El pedido nuevo entra arriba de la lista como pendiente de cotizar y, al cotizar, pasa a la pastilla con su monto.
+6| Llega el primer presupuesto y se enciende la tira de proveedores que esperan; después se suma el segundo al lado.
```

**Lo que devolvió:**

```json
{
 "estilo": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect.",
 "personajes": [
  {
   "id": "p1",
   "nombre": "Vanina",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 38, olive skin, dark wavy hair pulled back in a loose bun, thick eyebrows, small expressive eyes, light smile lines. Wears a mustard knit sweater over a plain tee, jeans, no jewelry. Grounded, tired but warm presence, standing and looking at the camera, natural pose, neutral background with a hint of two paired working spaces in a buenos aires neighbourhood: a modest apartment kitchen. A still photo, no action, no dialogue."
  },
  {
   "id": "p2",
   "nombre": "Carla",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 45, tanned skin, straight dark hair in a low ponytail, strong jawline, calm steady gaze, short clean nails. Wears a navy work shirt with rolled sleeves, insulated pliers in chest pocket, work trousers. Confident, unhurried professional presence, standing and looking at the camera, natural pose, neutral background with a hint of two paired working spaces in a buenos aires neighbourhood: a modest apartment kitchen. A still photo, no action, no dialogue."
  }
 ],
 "escenas": [
  {
   "escenaN": 1,
   "rol": "hook",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vanina, an Argentine Woman around 38, olive skin, dark wavy hair pulled back in a loose bun, thick eyebrows, in Her own narrow apartment kitchen with the lights dead: open electrical panel on the hallway wall behind her, tripped breaker switch, cold tiled counter with a mate gourd and a small flashlight. Only light comes from her phone screen and dim window dusk. In her dark narrow apartment hallway, Vanina holds her phone up as a flashlight with one hand and pushes the tripped breaker switch back up with the other. The switch snaps down again with a dry click. She lowers the phone, breathes out, and speaks her line toward the camera with blunt tiredness, then glances back at the dead panel. Only phone glow and dim window dusk; faint street noise. She says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Se me quemó el tablero y mandé mensajes a ciegas.' Energetic, hooking delivery that grabs attention from the first word. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, Levemente lateral, a la altura del hombro, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 2,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Carla, an Argentine Woman around 45, tanned skin, straight dark hair in a low ponytail, strong jawline, calm steady gaze, in A half-finished renovation site mid-job: open circuit panel on a bare brick wall with labelled wires exposed, her pliers resting on the panel edge, coiled cable and a dusty stepladder beside her. Hard daylight from an unglazed window. At the half-finished renovation site, Carla sets her insulated pliers down on the edge of the open circuit panel and wipes dust off her palms on her work trousers. She turns from the labelled wires toward the camera and delivers her line calmly, unhurried, then nods once and reaches back toward a coiled cable. Hard daylight from the unglazed window; distant hammering and a radio. She says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Yo antes esperaba que alguien me recomendara. Ahora el pedido me llega con la zona y el oficio.' Warm and assured delivery, explaining with confidence. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, Frontal, cámara a la altura del pecho, natural handheld feel, shallow depth of field. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 4,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vanina, an Argentine Woman around 38, olive skin, dark wavy hair pulled back in a loose bun, thick eyebrows, in Her own narrow apartment kitchen with the lights dead: open electrical panel on the hallway wall behind her, tripped breaker switch, cold tiled counter with a mate gourd and a small flashlight. Only light comes from her phone screen and dim window dusk. Vanina sits on the hallway floor of her apartment, back against the wall, the open electrical panel above and behind her, the small flashlight standing upright beside her knee. She types with both thumbs on her phone, pausing to think. She looks up at the camera and says her line plainly, with relief that she did not have to chase anyone, then goes back to typing. Dusk light, quiet building hum. She says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Conté qué pasaba, en mis palabras. No perseguí a nadie.' Warm and assured delivery, explaining with confidence. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. High-angle shot, Picado suave desde el pasillo, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 5,
   "rol": "giro",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vanina, an Argentine Woman around 38, olive skin, dark wavy hair pulled back in a loose bun, thick eyebrows, in Her own narrow apartment kitchen with the lights dead: open electrical panel on the hallway wall behind her, tripped breaker switch, cold tiled counter with a mate gourd and a small flashlight. Only light comes from her phone screen and dim window dusk. In her tiled kitchen, Vanina sets the mate gourd down on the cold counter and picks up her phone. She looks at the screen, her eyebrows lift and a small smile breaks through the tiredness. She turns to the camera and says her line, then looks back down at the phone, scrolling slowly. Phone light on her face in the dim kitchen; faint fridge hum. She says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Abrí el teléfono y los presupuestos ya estaban ahí.' Clear, assured delivery: this is the moment the benefit becomes visible. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Close-up on the face and hands, Frontal cerrado sobre la cara, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 7,
   "rol": "cta",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vanina, an Argentine Woman around 38, olive skin, dark wavy hair pulled back in a loose bun, thick eyebrows, in Her own narrow apartment kitchen with the lights dead: open electrical panel on the hallway wall behind her, tripped breaker switch, cold tiled counter with a mate gourd and a small flashlight. Only light comes from her phone screen and dim window dusk. Vanina drops the small flashlight into a kitchen drawer and pushes it shut with her hip, then places her phone face up on the tiled counter next to the mate gourd. She straightens, looks directly at the camera and says her line like a recommendation to a neighbour, then shrugs lightly and reaches for the mate. Kitchen light is on now; quiet domestic ambience. She says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Entrá a Repare Hoy punto com punto ar y contá qué hay que arreglar.' Euphoric, inviting closing delivery. Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, Frontal desde la mesada, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  }
 ],
 "huecos": [],
 "version": "flowpack/3.0-compilado"
}
```

---

## Vuelta 2

**Qué cambió en las reglas:** Orden por causa (le pasa, lo pide, le llega al otro, le contestan). Gancho con el dolor. Habla real, sin palabras de la app. Hasta 4 frases. El cierre va en la placa. Una acción por escena.

- Juez de la pieza (ChatGPT): VEREDICTO: TIENE POTENCIAL — 6,5/10

Estrategia y concepto: los mismos de la vuelta 0.

### Paso 3 · Guion

*Molde `script/3.1` · modelo opus-5 · 27 s · terminó 11/10 14:31 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 1** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 1
+++ vuelta 2
@@ -65,7 +65,12 @@
 hook -> desarrollo (de 1 a 3 bloques) -> giro -> cta
-- hook: en la primera frase, una situación cotidiana y concreta del problema que el espectador reconoce como suya (un objeto, un momento), dicha por quien la vive. Nada de quejas genéricas ni preguntas retóricas.
+- hook: en la primera frase, la situación concreta (un objeto, un momento) Y el problema que resuelve la marca, dicho por quien lo vive. La situación sola no alcanza: tiene que oírse el dolor que la marca saca.
 - giro: el momento en que el beneficio se VE en la vida de la persona (qué cambió para ella), no una descripción de la app.
+- cta: lo dice la PLACA final del montaje (texto en pantalla con la marca y la dirección; no se filma): "quien" = "placa" y "narration" = el texto de la placa, como máximo 8 palabras, sin la dirección web (la placa la agrega).
+- ORDEN: sigue la causa. Primero lo que le pasa a quien necesita, después lo que hace, después quién lo recibe y responde, al final lo que gana. Nada aparece antes de lo que lo provoca.
+- MENOS GENTE EXPLICANDO, MÁS COSAS PASANDO: como mucho 4 frases habladas en 26s, de 4 a 12 palabras cada una. Lo demás lo cuentan la imagen y las pantallas de la app.
+- Cada persona habla como en la vida real: nada de vocabulario de la app ni de la ficha comercial (nombres de pantallas, "solicitud", "plataforma", "zona y oficio"). Lo dice como se lo contaría a un vecino.
+- No muestres un resultado que la marca no produce: si la app consigue presupuestos, no se ve el arreglo terminado ni el problema resuelto.
 
 QUIÉN DICE CADA COSA (regla dura: en esta pieza NO hay locutor ni voz en off)
-- Cada palabra la dice EN CÁMARA una persona de la historia. "quien" = esa persona, nombrada como la nombra el concepto (por ejemplo, el oficio o el vínculo), siempre con el mismo nombre en toda la pieza.
+- Cada palabra la dice EN CÁMARA una persona de la historia. "quien" = esa persona, nombrada como la nombra el concepto (por ejemplo, el oficio o el vínculo), siempre con el mismo nombre en toda la pieza. La única excepción es el cierre: "quien" = "placa".
 - Una sola persona por bloque. Si hablan dos, son dos bloques.
```

**Lo que devolvió:**

```json
{
 "blocks": [
  {
   "role": "hook",
   "quien": "la vecina",
   "narration": "Mandé cinco mensajes por el enchufe quemado. Nadie contestó.",
   "visual": "En la cocina de su casa en Villa Urquiza, sostiene la tapa tiznada del enchufe en una mano y el teléfono con la conversación sin respuesta en la otra.",
   "durSec": 4
  },
  {
   "role": "desarrollo",
   "quien": "la vecina",
   "narration": "Esta vez conté lo que pasaba una sola vez.",
   "visual": "Sentada a la mesa, escribe en el celular mientras en pantalla avanza Contar el problema paso por paso hasta el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.'",
   "durSec": 5
  },
  {
   "role": "desarrollo",
   "quien": "la electricista",
   "narration": "Me llegó un trabajo eléctrico a diez cuadras. Coticé.",
   "visual": "En la obra, con la pinza en la mano, apoya el celular en el tablero y en Bandeja de solicitudes el pedido pendiente pasa a la pastilla COTIZADO con su monto.",
   "durSec": 7
  },
  {
   "role": "giro",
   "quien": "la vecina",
   "narration": "No perseguí a nadie. Los presupuestos ya estaban ahí.",
   "visual": "Deja la pava en la hornalla y mira el teléfono: en la home se enciende la tira 'TE ESPERAN TUS PROVEEDORES' y se suman las tarjetas una al lado de la otra.",
   "durSec": 5
  },
  {
   "role": "cta",
   "quien": "placa",
   "narration": "Contá qué hay que arreglar.",
   "visual": "Placa final limpia con la marca RepareHoy y la dirección web.",
   "durSec": 5
  }
 ],
 "music": {
  "mood": "cálida, cercana, luminosa"
 }
}
```

### Paso 4 · Personajes

*Molde `cast/2.1` · modelo opus-5 · 18 s · terminó 11/10 14:31 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 1** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 1
+++ vuelta 2
@@ -71,2 +71,2 @@
 CONCEPTO: {"id":"c3","topico":"El pedido que llega","tipoGancho":"DEMOSTRACIÓN DIRECTA","idea":"Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.","tono":"Directo, profesional, orgulloso sin grandilocuencia; charla real","estetica":"Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo","referencia":"Testimonial ficcional de dos voces con demo de producto","porQueFunciona":"Dos voces explican el mismo alivio y la interfaz lo confirma al instante."}
-GUION: [hook · dice: la vecina de Villa Urquiza] Se me quemó el tablero y mandé mensajes a ciegas. (visual: En la cocina a oscuras, la vecina sostiene el celular como linterna y vuelve a subir la llave térmica, que salta otra vez.) · [desarrollo · dice: la electricista de Villa Urquiza] Yo antes esperaba que alguien me recomendara. Ahora el pedido me llega con la zona y el oficio. (visual: La electricista apoya la pinza sobre un tablero abierto en obra y en su teléfono el pedido entra como pendiente de cotizar en Bandeja de solicitudes.) · [desarrollo · dice: la vecina de Villa Urquiza] Conté qué pasaba, en mis palabras. No perseguí a nadie. (visual: Sentada en el piso del pasillo, con el tablero abierto detrás, la vecina tipea la zona y la descripción en Contar el problema.) · [giro · dice: la vecina de Villa Urquiza] Abrí el teléfono y los presupuestos ya estaban ahí. (visual: Apoya el mate en la mesada y en su pantalla de inicio se enciende la tira Te esperan tus proveedores con las tarjetas de presupuesto.) · [cta · dice: la vecina de Villa Urquiza] Entrá a Repare Hoy punto com punto ar y contá qué hay que arreglar. (visual: La vecina guarda la linterna en el cajón y deja el celular sobre la mesada con reparehoy.com.ar en pantalla.)
+GUION: [hook · dice: la vecina] Mandé cinco mensajes por el enchufe quemado. Nadie contestó. (visual: En la cocina de su casa en Villa Urquiza, sostiene la tapa tiznada del enchufe en una mano y el teléfono con la conversación sin respuesta en la otra.) · [desarrollo · dice: la vecina] Esta vez conté lo que pasaba una sola vez. (visual: Sentada a la mesa, escribe en el celular mientras en pantalla avanza Contar el problema paso por paso hasta el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.') · [desarrollo · dice: la electricista] Me llegó un trabajo eléctrico a diez cuadras. Coticé. (visual: En la obra, con la pinza en la mano, apoya el celular en el tablero y en Bandeja de solicitudes el pedido pendiente pasa a la pastilla COTIZADO con su monto.) · [giro · dice: la vecina] No perseguí a nadie. Los presupuestos ya estaban ahí. (visual: Deja la pava en la hornalla y mira el teléfono: en la home se enciende la tira 'TE ESPERAN TUS PROVEEDORES' y se suman las tarjetas una al lado de la otra.) · [cta · dice: placa] Contá qué hay que arreglar. (visual: Placa final limpia con la marca RepareHoy y la dirección web.)
```

**Lo que devolvió:**

```json
{
 "personajes": [
  {
   "id": "p1",
   "nombre": "Marcela",
   "rol": "La vecina: pide el arreglo del enchufe quemado y recibe los presupuestos",
   "fisicoEn": "Woman around 45, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles, tired but friendly eyes, no makeup. Wears a faded navy t-shirt and grey cardigan, small hoop earrings. Calm, everyday presence.",
   "fisicoEs": "Mujer de 45, pelo oscuro ondulado atado, piel oliva, mirada cansada y amable",
   "vestuario": "Remera azul gastada y cárdigan gris",
   "personalidad": "Práctica, cansada",
   "lugarEn": "Her own small kitchen in Villa Urquiza: scorched wall outlet with blackened cover plate loose on the tiled counter, a kettle on the stove, folded dish towel. Afternoon light through a side window.",
   "quien": "la vecina"
  },
  {
   "id": "p2",
   "nombre": "Vanesa",
   "rol": "La electricista: recibe el pedido por zona y oficio, y cotiza",
   "fisicoEn": "Woman around 38, light brown skin, straight black hair in a low ponytail, strong eyebrows, direct steady gaze, minimal makeup. Wears a navy work shirt with rolled sleeves, tool belt, scuffed boots. Confident, capable presence.",
   "fisicoEs": "Mujer de 38, pelo negro atado, piel trigueña, mirada firme, ropa de trabajo",
   "vestuario": "Camisa de trabajo azul, cinturón portaherramientas",
   "personalidad": "Segura, concreta",
   "lugarEn": "A half-finished renovation site in the same neighbourhood: open electrical panel with exposed cables, pliers and stripped wire ends on a plank, drop sheet and dust. Hard daylight through an unglazed window frame.",
   "quien": "la electricista"
  }
 ],
 "lugar": {
  "nombre": "Casa y obra en Villa Urquiza",
  "descripcionEn": "Two real working spaces in the same Buenos Aires neighbourhood: a modest home kitchen with tiled walls, wooden table, kettle and a burnt wall outlet; and a residential renovation site with an open electrical panel, cables, tools and plaster dust. Soft natural daylight.",
  "luz": "Luz natural suave, día, sin flash"
 }
}
```

### Paso 5 · Storyboard

*Molde `storyboard/3.1` · modelo opus-5 · 26 s · terminó 11/10 14:32 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 1** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 1
+++ vuelta 2
@@ -35,2 +35,8 @@
 
+UNA ACCIÓN POR ESCENA
+- Cada escena filmada tiene UNA acción principal, con a lo sumo un gesto antes o después. Cinco acciones en cinco segundos
+  salen apuradas y falsas.
+- Lo que hace la persona tiene que ser creíble en su oficio y en su casa (nadie toca cables pelados mientras habla a cámara).
+- Las escenas van en el orden del guion (el guion ya sigue la causa: le pasa, lo pide, le llega al otro, le contestan).
+
 POR ESCENA:
@@ -50,4 +56,4 @@
 - pantalla: "" en las escenas filmadas; el nombre EXACTO de la captura en un inserto de pantalla.
-- durSec: escena filmada con frase = lo que tarda la frase a 2,7 palabras por segundo + 2 (de 4 a 8); escena filmada
-  sin frase, de 3 a 5; inserto de pantalla, de 3 a 4.
+- durSec: escena filmada con frase = lo que tarda la frase a 2,7 palabras por segundo + 1 (de 3 a 7); escena filmada
+  sin frase, de 3 a 5; inserto de pantalla, de 3 a 4; el cta, 3.
 
@@ -60,4 +66,4 @@
 El giro (el momento en que se ve el beneficio; remate gracioso sólo con tratamiento humor) ocurre antes del CTA.
-El CTA puede ser una frase de un personaje o una escena sin frase: el cierre con la marca y la dirección lo dibuja el
-montaje, no se filma.
+El CTA es la PLACA del montaje: una escena con rol "cta", sin personajes, sin frase y sin pantalla, de 3 segundos, con
+el texto de la placa en "accion". No se filma.
 
@@ -110,3 +116,3 @@
 Recién acá la historia se traduce a escenas y se comprueba que entra en 20 a 30 segundos. El "recorrido" de la ficha es un banco de posibilidades, nunca una orden de escenas ni un orden fijo.
-CAST: {"personajes":[{"id":"p1","nombre":"Vanina","rol":"La vecina de Villa Urquiza que publica el pedido: la voz de quien necesita el arreglo y abre y cierra el comercial","fisicoEn":"Woman around 38, olive skin, dark wavy hair pulled back in a loose bun, thick eyebrows, small expressive eyes, light smile lines. Wears a mustard knit sweater over a plain tee, jeans, no jewelry. Grounded, tired but warm presence.","fisicoEs":"Mujer de unos 38, piel oliva, pelo oscuro ondulado recogido, gesto cansado y cálido","vestuario":"Sweater mostaza, remera lisa, jeans","personalidad":"Práctica, franca","lugarEn":"Her own narrow apartment kitchen with the lights dead: open electrical panel on the hallway wall behind her, tripped breaker switch, cold tiled counter with a mate gourd and a small flashlight. Only light comes from her phone screen and dim window dusk.","quien":"la vecina de Villa Urquiza"},{"id":"p2","nombre":"Carla","rol":"La electricista de Villa Urquiza que recibe el pedido: la voz del oficio que antes dependía de recomendaciones","fisicoEn":"Woman around 45, tanned skin, straight dark hair in a low ponytail, strong jawline, calm steady gaze, short clean nails. Wears a navy work shirt with rolled sleeves, insulated pliers in chest pocket, work trousers. Confident, unhurried professional presence.","fisicoEs":"Mujer de unos 45, piel morena, pelo oscuro atado, camisa de trabajo azul, segura","vestuario":"Camisa de trabajo azul, pantalón de obra","personalidad":"Segura, serena","lugarEn":"A half-finished renovation site mid-job: open circuit panel on a bare brick wall with labelled wires exposed, her pliers resting on the panel edge, coiled cable and a dusty stepladder beside her. Hard daylight from an unglazed window.","quien":"la electricista de Villa Urquiza"}],"lugar":{"nombre":"Departamento sin luz y obra de tablero en Villa Urquiza","descripcionEn":"Two paired working spaces in a Buenos Aires neighbourhood: a modest apartment kitchen and hallway with a tripped electrical panel, tiled counter and mate gourd in near darkness; and a renovation site with exposed brick, an open labelled circuit panel, cables and a stepladder in flat daylight.","luz":"Penumbra de celular y luz natural dura"}}
-GUION: [hook · dice: la vecina de Villa Urquiza] Se me quemó el tablero y mandé mensajes a ciegas. (visual: En la cocina a oscuras, la vecina sostiene el celular como linterna y vuelve a subir la llave térmica, que salta otra vez.) · [desarrollo · dice: la electricista de Villa Urquiza] Yo antes esperaba que alguien me recomendara. Ahora el pedido me llega con la zona y el oficio. (visual: La electricista apoya la pinza sobre un tablero abierto en obra y en su teléfono el pedido entra como pendiente de cotizar en Bandeja de solicitudes.) · [desarrollo · dice: la vecina de Villa Urquiza] Conté qué pasaba, en mis palabras. No perseguí a nadie. (visual: Sentada en el piso del pasillo, con el tablero abierto detrás, la vecina tipea la zona y la descripción en Contar el problema.) · [giro · dice: la vecina de Villa Urquiza] Abrí el teléfono y los presupuestos ya estaban ahí. (visual: Apoya el mate en la mesada y en su pantalla de inicio se enciende la tira Te esperan tus proveedores con las tarjetas de presupuesto.) · [cta · dice: la vecina de Villa Urquiza] Entrá a Repare Hoy punto com punto ar y contá qué hay que arreglar. (visual: La vecina guarda la linterna en el cajón y deja el celular sobre la mesada con reparehoy.com.ar en pantalla.)
+CAST: {"personajes":[{"id":"p1","nombre":"Marcela","rol":"La vecina: pide el arreglo del enchufe quemado y recibe los presupuestos","fisicoEn":"Woman around 45, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles, tired but friendly eyes, no makeup. Wears a faded navy t-shirt and grey cardigan, small hoop earrings. Calm, everyday presence.","fisicoEs":"Mujer de 45, pelo oscuro ondulado atado, piel oliva, mirada cansada y amable","vestuario":"Remera azul gastada y cárdigan gris","personalidad":"Práctica, cansada","lugarEn":"Her own small kitchen in Villa Urquiza: scorched wall outlet with blackened cover plate loose on the tiled counter, a kettle on the stove, folded dish towel. Afternoon light through a side window.","quien":"la vecina"},{"id":"p2","nombre":"Vanesa","rol":"La electricista: recibe el pedido por zona y oficio, y cotiza","fisicoEn":"Woman around 38, light brown skin, straight black hair in a low ponytail, strong eyebrows, direct steady gaze, minimal makeup. Wears a navy work shirt with rolled sleeves, tool belt, scuffed boots. Confident, capable presence.","fisicoEs":"Mujer de 38, pelo negro atado, piel trigueña, mirada firme, ropa de trabajo","vestuario":"Camisa de trabajo azul, cinturón portaherramientas","personalidad":"Segura, concreta","lugarEn":"A half-finished renovation site in the same neighbourhood: open electrical panel with exposed cables, pliers and stripped wire ends on a plank, drop sheet and dust. Hard daylight through an unglazed window frame.","quien":"la electricista"}],"lugar":{"nombre":"Casa y obra en Villa Urquiza","descripcionEn":"Two real working spaces in the same Buenos Aires neighbourhood: a modest home kitchen with tiled walls, wooden table, kettle and a burnt wall outlet; and a residential renovation site with an open electrical panel, cables, tools and plaster dust. Soft natural daylight.","luz":"Luz natural suave, día, sin flash"}}
+GUION: [hook · dice: la vecina] Mandé cinco mensajes por el enchufe quemado. Nadie contestó. (visual: En la cocina de su casa en Villa Urquiza, sostiene la tapa tiznada del enchufe en una mano y el teléfono con la conversación sin respuesta en la otra.) · [desarrollo · dice: la vecina] Esta vez conté lo que pasaba una sola vez. (visual: Sentada a la mesa, escribe en el celular mientras en pantalla avanza Contar el problema paso por paso hasta el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.') · [desarrollo · dice: la electricista] Me llegó un trabajo eléctrico a diez cuadras. Coticé. (visual: En la obra, con la pinza en la mano, apoya el celular en el tablero y en Bandeja de solicitudes el pedido pendiente pasa a la pastilla COTIZADO con su monto.) · [giro · dice: la vecina] No perseguí a nadie. Los presupuestos ya estaban ahí. (visual: Deja la pava en la hornalla y mira el teléfono: en la home se enciende la tira 'TE ESPERAN TUS PROVEEDORES' y se suman las tarjetas una al lado de la otra.) · [cta · dice: placa] Contá qué hay que arreglar. (visual: Placa final limpia con la marca RepareHoy y la dirección web.)
```

**Lo que devolvió:**

```json
{
 "escenas": [
  {
   "n": 1,
   "rol": "hook",
   "durSec": 5,
   "plano": "medium close-up",
   "angulo": "Levemente lateral, a la altura de los ojos",
   "personajes": [
    "p1"
   ],
   "accion": "Marcela apoya la tapa tiznada del enchufe en la mesada y gira el teléfono hacia cámara, resignada, y suelta un suspiro.",
   "accionEn": "Marcela stands in her small tiled kitchen in Villa Urquiza, the blackened outlet cover plate in one hand and her phone in the other. She sets the scorched plate down on the counter beside the kettle, turns her tired face to camera and speaks the line while lifting the phone slightly, then lets her arm drop and exhales through her nose. Faint street noise and the hum of the fridge.",
   "dialogo": "Mandé cinco mensajes por el enchufe quemado. Nadie contestó.",
   "continuidad": "",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 2,
   "rol": "desarrollo",
   "durSec": 5,
   "plano": "medium shot",
   "angulo": "Frontal desde el otro lado de la mesa",
   "personajes": [
    "p1"
   ],
   "accion": "Sentada a la mesa de la cocina, Marcela escribe en el celular con los dos pulgares y al terminar levanta la vista más tranquila.",
   "accionEn": "Marcela sits at the wooden kitchen table, the burnt outlet plate and a folded dish towel in front of her. She types steadily on her phone with both thumbs, keeps her eyes down for a beat, then raises her head toward the camera and says the line, shoulders settling as she finishes and sets the phone flat on the table. Afternoon light from the side window, kettle ticking on the stove.",
   "dialogo": "Esta vez conté lo que pasaba una sola vez.",
   "continuidad": "Misma cocina, remera azul y cárdigan gris",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 3,
   "rol": "desarrollo",
   "durSec": 4,
   "plano": "over-the-shoulder",
   "angulo": "Desde atrás del hombro, hacia el tablero abierto",
   "personajes": [],
   "accion": "En Contar el problema avanzan los cuatro pasos hasta el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.'",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": "Contar el problema",
   "archivoCaptura": "screens/01-cliente-contar-el-problema.png"
  },
  {
   "n": 4,
   "rol": "desarrollo",
   "durSec": 5,
   "plano": "low angle",
   "angulo": "Contrapicado suave desde el nivel del tablero",
   "personajes": [
    "p2"
   ],
   "accion": "Vanesa deja la pinza sobre el tablón, apoya el celular en el borde del tablero y asiente conforme antes de volver al cable.",
   "accionEn": "Vanesa stands at the open electrical panel of the half-finished renovation site, pliers in her hand and stripped wire ends on a plank beside her. She lays the pliers down on the plank, props her phone against the edge of the panel, looks at the camera and says the line with a short confident nod, then picks the wire back up. Plaster dust in the hard daylight, distant hammering.",
   "dialogo": "Me llegó un trabajo eléctrico a diez cuadras. Coticé.",
   "continuidad": "",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 5,
   "rol": "desarrollo",
   "durSec": 3,
   "plano": "close-up",
   "angulo": "Frontal cerrado sobre la pantalla",
   "personajes": [],
   "accion": "En Bandeja de solicitudes el pedido pendiente de cotizar pasa a la pastilla COTIZADO con su monto.",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": "Bandeja de solicitudes",
   "archivoCaptura": "screens/05-proveedor-bandeja-de-solicitudes.png"
  },
  {
   "n": 6,
   "rol": "giro",
   "durSec": 5,
   "plano": "handheld follow",
   "angulo": "Acompañando el movimiento a la altura del pecho",
   "personajes": [
    "p1"
   ],
   "accion": "Marcela deja la pava en la hornalla, levanta el teléfono y la cara se le relaja al ver los presupuestos que ya llegaron.",
   "accionEn": "Marcela lifts the kettle onto the stove burner in her kitchen and lets go of the handle. She picks up her phone from the counter, glances at it, and her tired expression softens into a small relieved smile. She turns toward the camera and says the line, then looks back down at the screen and lets her shoulders drop. Gas burner clicking, soft afternoon light on the tiles.",
   "dialogo": "No perseguí a nadie. Los presupuestos ya estaban ahí.",
   "continuidad": "Misma cocina, mismo vestuario, misma luz de tarde",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 7,
   "rol": "giro",
   "durSec": 3,
   "plano": "close-up",
   "angulo": "Frontal cerrado",
   "personajes": [],
   "accion": "En la home se enciende la tira 'TE ESPERAN TUS PROVEEDORES' y se suma una segunda tarjeta al lado de la primera.",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": "Te esperan tus proveedores",
   "archivoCaptura": "screens/02-cliente-te-esperan-tus-proveedores.png"
  },
  {
   "n": 8,
   "rol": "cta",
   "durSec": 3,
   "plano": "wide shot",
   "angulo": "Frontal",
   "personajes": [],
   "accion": "Placa final: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": ""
  }
 ]
}
```

### Paso 6 · Pedidos a Flow

*Molde `flowpack/3.1-compilado` · modelo sonnet-5 · 6 s · terminó 11/10 14:32 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 1** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 1
+++ vuelta 2
@@ -1,3 +1,5 @@
 Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Respetá el género de quien está en cuadro (lo dice el paréntesis, que no se traduce ni se copia). Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.
-3| El pedido nuevo entra arriba de la lista como pendiente de cotizar y, al cotizar, pasa a la pastilla con su monto.
-6| Llega el primer presupuesto y se enciende la tira de proveedores que esperan; después se suma el segundo al lado.
+3| En Contar el problema avanzan los cuatro pasos hasta el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.'
+5| En Bandeja de solicitudes el pedido pendiente de cotizar pasa a la pastilla COTIZADO con su monto.
+7| En la home se enciende la tira 'TE ESPERAN TUS PROVEEDORES' y se suma una segunda tarjeta al lado de la primera.
+8| Placa final: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
```

**Lo que devolvió:**

```json
{
 "estilo": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect.",
 "personajes": [
  {
   "id": "p1",
   "nombre": "Marcela",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 45, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles, tired but friendly eyes, no makeup. Wears a faded navy t-shirt and grey cardigan, small hoop earrings. Calm, everyday presence, standing and looking at the camera, natural pose, neutral background with a hint of two real working spaces in the same buenos aires neighbourhood: a modest home kitchen. A still photo, no action, no dialogue."
  },
  {
   "id": "p2",
   "nombre": "Vanesa",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 38, light brown skin, straight black hair in a low ponytail, strong eyebrows, direct steady gaze, minimal makeup. Wears a navy work shirt with rolled sleeves, tool belt, scuffed boots. Confident, capable presence, standing and looking at the camera, natural pose, neutral background with a hint of two real working spaces in the same buenos aires neighbourhood: a modest home kitchen. A still photo, no action, no dialogue."
  }
 ],
 "escenas": [
  {
   "escenaN": 1,
   "rol": "hook",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marcela, an Argentine woman around 45, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles. Marcela stands in her small tiled kitchen in Villa Urquiza, the blackened outlet cover plate in one hand and her phone in the other. She sets the scorched plate down on the counter beside the kettle, turns her tired face to camera and speaks the line while lifting the phone slightly, then lets her arm drop and exhales through her nose. Faint street noise and the hum of the fridge. She says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Mandé cinco mensajes por el enchufe quemado. Nadie contestó.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 2,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marcela, an Argentine woman around 45, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles. Marcela sits at the wooden kitchen table, the burnt outlet plate and a folded dish towel in front of her. She types steadily on her phone with both thumbs, keeps her eyes down for a beat, then raises her head toward the camera and says the line, shoulders settling as she finishes and sets the phone flat on the table. Afternoon light from the side window, kettle ticking on the stove. She says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Esta vez conté lo que pasaba una sola vez.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 4,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vanesa, an Argentine woman around 38, light brown skin, straight black hair in a low ponytail, strong eyebrows, direct steady gaze. Vanesa stands at the open electrical panel of the half-finished renovation site, pliers in her hand and stripped wire ends on a plank beside her. She lays the pliers down on the plank, props her phone against the edge of the panel, looks at the camera and says the line with a short confident nod, then picks the wire back up. Plaster dust in the hard daylight, distant hammering. She says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Me llegó un trabajo eléctrico a diez cuadras. Coticé.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Low-angle shot, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 6,
   "rol": "giro",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marcela, an Argentine woman around 45, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles. Marcela lifts the kettle onto the stove burner in her kitchen and lets go of the handle. She picks up her phone from the counter, glances at it, and her tired expression softens into a small relieved smile. She turns toward the camera and says the line, then looks back down at the screen and lets her shoulders drop. Gas burner clicking, soft afternoon light on the tiles. She says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'No perseguí a nadie. Los presupuestos ya estaban ahí.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Handheld camera following the movement, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  }
 ],
 "huecos": [],
 "version": "flowpack/3.0-compilado"
}
```

---

## Vuelta 3

**Qué cambió en las reglas:** El gancho empieza por el golpe, en presente. Un solo público. Un detalle propio por personaje. Frases cortas. Habla desde el primer segundo. A cámara, como mucho dos escenas.

- Juez de la pieza (ChatGPT): Veredicto: TIENE POTENCIAL — 6,5/10

Estrategia y concepto: los mismos de la vuelta 0.

### Paso 3 · Guion

*Molde `script/3.2` · modelo opus-5 · 25 s · terminó 11/10 14:34 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 2** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 2
+++ vuelta 3
@@ -65,3 +65,3 @@
 hook -> desarrollo (de 1 a 3 bloques) -> giro -> cta
-- hook: en la primera frase, la situación concreta (un objeto, un momento) Y el problema que resuelve la marca, dicho por quien lo vive. La situación sola no alcanza: tiene que oírse el dolor que la marca saca.
+- hook: la situación concreta (un objeto, un momento) Y el problema que resuelve la marca, dicho por quien lo vive. Empieza por el golpe: las primeras 2 o 3 palabras son lo que duele (lo que el espectador ya vivió), y después el detalle que lo ubica. Con la bronca del momento, en presente o recién pasado. La situación sola no alcanza.
 - giro: el momento en que el beneficio se VE en la vida de la persona (qué cambió para ella), no una descripción de la app.
@@ -69,3 +69,3 @@
 - ORDEN: sigue la causa. Primero lo que le pasa a quien necesita, después lo que hace, después quién lo recibe y responde, al final lo que gana. Nada aparece antes de lo que lo provoca.
-- MENOS GENTE EXPLICANDO, MÁS COSAS PASANDO: como mucho 4 frases habladas en 26s, de 4 a 12 palabras cada una. Lo demás lo cuentan la imagen y las pantallas de la app.
+- MENOS GENTE EXPLICANDO, MÁS COSAS PASANDO: como mucho 4 frases habladas en 26s, de 4 a 11 palabras cada una, secas y orales (frases largas salen con la boca de goma en el video generado). Lo demás lo cuentan la imagen y las pantallas de la app.
 - Cada persona habla como en la vida real: nada de vocabulario de la app ni de la ficha comercial (nombres de pantallas, "solicitud", "plataforma", "zona y oficio"). Lo dice como se lo contaría a un vecino.
@@ -78,2 +78,3 @@
 - Si la historia tiene dos lados, lo que uno necesita es exactamente lo que el otro hace (mismo oficio, mismo problema): si no, el pedido de uno nunca le llega al otro.
+- El comercial le habla a UN público: el del cierre. Si aparece el otro lado, lo que dice le sirve a ESE público (qué gana el que pide), no cuenta su propio negocio: el espectador que necesita el arreglo no quiere escuchar cómo consigue clientes el profesional.
 - Un bloque puede no tener voz (narration "") si la imagen cuenta sola ese momento; entonces "quien" es "".
```

**Lo que devolvió:**

```json
{
 "blocks": [
  {
   "role": "hook",
   "quien": "vecina de Villa Urquiza",
   "narration": "Cinco mensajes mandé. No me contestó nadie.",
   "visual": "La vecina abre el tablero del pasillo con la térmica baja, el celular en la otra mano y la pantalla llena de mensajes sin respuesta.",
   "durSec": 4
  },
  {
   "role": "desarrollo",
   "quien": "vecina de Villa Urquiza",
   "narration": "Esta vez conté lo que pasaba, con mis palabras.",
   "visual": "Sentada en la mesa de la cocina, tipea la descripción del problema en la pantalla Contar el problema y toca Crear solicitud.",
   "durSec": 5
  },
  {
   "role": "desarrollo",
   "quien": "electricista",
   "narration": "Me llegó tu pedido solo. Te cotizé el mismo día.",
   "visual": "La electricista deja el destornillador sobre la caja de herramientas en la obra y mira en su celular la Bandeja de solicitudes con el pedido pendiente de cotizar.",
   "durSec": 7
  },
  {
   "role": "giro",
   "quien": "vecina de Villa Urquiza",
   "narration": "Abrí el celu y ya tenía tres presupuestos esperándome.",
   "visual": "La vecina apoya el mate y ve en la pantalla de inicio la tira Te esperan tus proveedores con las tarjetas que se suman.",
   "durSec": 5
  },
  {
   "role": "cta",
   "quien": "placa",
   "narration": "Contá qué hay que arreglar",
   "visual": "Placa final con la marca sobre fondo limpio y la dirección web.",
   "durSec": 5
  }
 ],
 "music": {
  "mood": "cercana y luminosa"
 }
}
```

### Paso 4 · Personajes

*Molde `cast/2.1` · modelo opus-5 · 17 s · terminó 11/10 14:35 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 2** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 2
+++ vuelta 3
@@ -17,3 +17,3 @@
 - personalidad: 1 a 3 palabras.
-- lugarEn: 20 a 40 palabras en INGLÉS. DÓNDE vemos a ESTA persona en el comercial: un lugar suyo, concreto y creíble (no "a home" ni "an office"), con 2 o 3 objetos que cuentan su situación y la luz. Si el guion la muestra con un problema, el problema se ve en el lugar (lo roto, lo que gotea, lo que no anda). Cada personaje tiene SU lugar: nunca el de otro.
+- lugarEn: 20 a 40 palabras en INGLÉS. DÓNDE vemos a ESTA persona en el comercial: un lugar suyo, concreto y creíble (no "a home" ni "an office"), con 2 o 3 objetos que cuentan su situación y la luz. Si el guion la muestra con un problema, el problema se ve en el lugar (lo roto, lo que gotea, lo que no anda). Sumá UN detalle propio de su vida que la haga real y no un estereotipo (algo que tiene a la vista y que nadie más tendría). Cada personaje tiene SU lugar: nunca el de otro.
 - quien: el nombre con el que el GUION la nombra en "dice:" (para unir cada frase con su persona).
@@ -71,2 +71,2 @@
 CONCEPTO: {"id":"c3","topico":"El pedido que llega","tipoGancho":"DEMOSTRACIÓN DIRECTA","idea":"Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.","tono":"Directo, profesional, orgulloso sin grandilocuencia; charla real","estetica":"Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo","referencia":"Testimonial ficcional de dos voces con demo de producto","porQueFunciona":"Dos voces explican el mismo alivio y la interfaz lo confirma al instante."}
-GUION: [hook · dice: la vecina] Mandé cinco mensajes por el enchufe quemado. Nadie contestó. (visual: En la cocina de su casa en Villa Urquiza, sostiene la tapa tiznada del enchufe en una mano y el teléfono con la conversación sin respuesta en la otra.) · [desarrollo · dice: la vecina] Esta vez conté lo que pasaba una sola vez. (visual: Sentada a la mesa, escribe en el celular mientras en pantalla avanza Contar el problema paso por paso hasta el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.') · [desarrollo · dice: la electricista] Me llegó un trabajo eléctrico a diez cuadras. Coticé. (visual: En la obra, con la pinza en la mano, apoya el celular en el tablero y en Bandeja de solicitudes el pedido pendiente pasa a la pastilla COTIZADO con su monto.) · [giro · dice: la vecina] No perseguí a nadie. Los presupuestos ya estaban ahí. (visual: Deja la pava en la hornalla y mira el teléfono: en la home se enciende la tira 'TE ESPERAN TUS PROVEEDORES' y se suman las tarjetas una al lado de la otra.) · [cta · dice: placa] Contá qué hay que arreglar. (visual: Placa final limpia con la marca RepareHoy y la dirección web.)
+GUION: [hook · dice: vecina de Villa Urquiza] Cinco mensajes mandé. No me contestó nadie. (visual: La vecina abre el tablero del pasillo con la térmica baja, el celular en la otra mano y la pantalla llena de mensajes sin respuesta.) · [desarrollo · dice: vecina de Villa Urquiza] Esta vez conté lo que pasaba, con mis palabras. (visual: Sentada en la mesa de la cocina, tipea la descripción del problema en la pantalla Contar el problema y toca Crear solicitud.) · [desarrollo · dice: electricista] Me llegó tu pedido solo. Te cotizé el mismo día. (visual: La electricista deja el destornillador sobre la caja de herramientas en la obra y mira en su celular la Bandeja de solicitudes con el pedido pendiente de cotizar.) · [giro · dice: vecina de Villa Urquiza] Abrí el celu y ya tenía tres presupuestos esperándome. (visual: La vecina apoya el mate y ve en la pantalla de inicio la tira Te esperan tus proveedores con las tarjetas que se suman.) · [cta · dice: placa] Contá qué hay que arreglar (visual: Placa final con la marca sobre fondo limpio y la dirección web.)
```

**Lo que devolvió:**

```json
{
 "personajes": [
  {
   "id": "p1",
   "nombre": "Marina",
   "rol": "Vecina de Villa Urquiza que publica la solicitud y recibe los presupuestos",
   "fisicoEn": "Woman around 38, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles across nose, tired warm eyes, no makeup. Wears a loose mustard knit sweater over a grey tee, jeans, small gold stud earrings. Grounded, everyday presence.",
   "fisicoEs": "Mujer de unos 38, pelo castaño ondulado atado, piel oliva, pecas, mirada cálida y cansada.",
   "vestuario": "Sweater mostaza tejido, remera gris, jeans",
   "personalidad": "Práctica, franca",
   "lugarEn": "Her own ground-floor apartment in Villa Urquiza: a narrow hallway electrical panel with one tripped breaker and taped wires, then the kitchen table with a mate gourd, a half-done crossword book and a cooled cup. Afternoon light through a patio window.",
   "quien": "vecina de Villa Urquiza"
  },
  {
   "id": "p2",
   "nombre": "Carla",
   "rol": "Electricista matriculada que recibe el pedido en su bandeja y cotiza el mismo día",
   "fisicoEn": "Woman around 44, black hair in a low practical bun, tan skin, strong eyebrows, small scar on left hand, confident steady gaze. Wears a navy work shirt with rolled sleeves, tool belt, scuffed boots. Sturdy, capable, unhurried presence.",
   "fisicoEs": "Mujer de unos 44, pelo negro recogido, piel trigueña, mirada segura, manos de trabajo.",
   "vestuario": "Camisa de trabajo azul, cinturón portaherramientas",
   "personalidad": "Segura, concreta",
   "lugarEn": "A half-finished apartment renovation she is wiring: exposed conduit on bare brick, an open toolbox with a screwdriver set down on it, a coiled cable roll, and a thermos with a hand-painted enamel mug beside it. Hard daylight from an unglazed window.",
   "quien": "electricista"
  }
 ],
 "lugar": {
  "nombre": "Pasillo y cocina de un PH en Villa Urquiza",
  "descripcionEn": "A narrow ground-floor Buenos Aires apartment: hallway with an open electrical panel and taped wiring, opening onto a small kitchen with a tiled counter, wooden table, mate gourd and a patio door. Lived-in, tidy, warm afternoon light.",
  "luz": "Luz de tarde suave por el patio"
 }
}
```

### Paso 5 · Storyboard

*Molde `storyboard/3.2` · modelo opus-5 · 29 s · terminó 11/10 14:35 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 2** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 2
+++ vuelta 3
@@ -38,3 +38,11 @@
   salen apuradas y falsas.
-- Lo que hace la persona tiene que ser creíble en su oficio y en su casa (nadie toca cables pelados mientras habla a cámara).
+- La persona empieza a hablar en el PRIMER segundo, mientras hace la acción: nunca se espera a que termine un gesto para
+  hablar, ni hay suspiros o pausas antes de la frase.
+- A cámara, como mucho DOS escenas en toda la pieza (la del gancho puede ser una). En las demás la persona habla mientras
+  hace lo suyo: con alguien fuera de cuadro, al teléfono, para sí misma, o reacciona a lo que ve. Así no parece un desfile
+  de testimonios.
+- El objeto del problema se reconoce en UN segundo: descríbilo como es en Argentina (un tomacorriente con la tapa tiznada,
+  una térmica, una canilla que gotea), visible desde el primer cuadro.
+- Lo que hace la persona tiene que ser creíble en su oficio y en su casa: un profesional se ve cuidadoso (nadie toca cables
+  pelados mientras habla, ni apoya el teléfono sobre un tablero abierto).
 - Las escenas van en el orden del guion (el guion ya sigue la causa: le pasa, lo pide, le llega al otro, le contestan).
@@ -51,2 +59,3 @@
   género correcto del personaje. Sin la frase (va aparte), sin marcas de cámara ni lentes, sin texto en pantalla.
+  Escribí la acción para que la frase arranque en el primer segundo (por ejemplo: "already talking as she...").
 - plano: close-up | medium close-up | medium shot | over-the-shoulder | low angle | high angle | handheld follow |
@@ -57,3 +66,3 @@
 - durSec: escena filmada con frase = lo que tarda la frase a 2,7 palabras por segundo + 1 (de 3 a 7); escena filmada
-  sin frase, de 3 a 5; inserto de pantalla, de 3 a 4; el cta, 3.
+  sin frase, de 2 a 4; inserto de pantalla, de 2 a 3 (una pantalla muda de 4 segundos parece que se tildó); el cta, 3.
 
@@ -116,3 +125,3 @@
 Recién acá la historia se traduce a escenas y se comprueba que entra en 20 a 30 segundos. El "recorrido" de la ficha es un banco de posibilidades, nunca una orden de escenas ni un orden fijo.
-CAST: {"personajes":[{"id":"p1","nombre":"Marcela","rol":"La vecina: pide el arreglo del enchufe quemado y recibe los presupuestos","fisicoEn":"Woman around 45, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles, tired but friendly eyes, no makeup. Wears a faded navy t-shirt and grey cardigan, small hoop earrings. Calm, everyday presence.","fisicoEs":"Mujer de 45, pelo oscuro ondulado atado, piel oliva, mirada cansada y amable","vestuario":"Remera azul gastada y cárdigan gris","personalidad":"Práctica, cansada","lugarEn":"Her own small kitchen in Villa Urquiza: scorched wall outlet with blackened cover plate loose on the tiled counter, a kettle on the stove, folded dish towel. Afternoon light through a side window.","quien":"la vecina"},{"id":"p2","nombre":"Vanesa","rol":"La electricista: recibe el pedido por zona y oficio, y cotiza","fisicoEn":"Woman around 38, light brown skin, straight black hair in a low ponytail, strong eyebrows, direct steady gaze, minimal makeup. Wears a navy work shirt with rolled sleeves, tool belt, scuffed boots. Confident, capable presence.","fisicoEs":"Mujer de 38, pelo negro atado, piel trigueña, mirada firme, ropa de trabajo","vestuario":"Camisa de trabajo azul, cinturón portaherramientas","personalidad":"Segura, concreta","lugarEn":"A half-finished renovation site in the same neighbourhood: open electrical panel with exposed cables, pliers and stripped wire ends on a plank, drop sheet and dust. Hard daylight through an unglazed window frame.","quien":"la electricista"}],"lugar":{"nombre":"Casa y obra en Villa Urquiza","descripcionEn":"Two real working spaces in the same Buenos Aires neighbourhood: a modest home kitchen with tiled walls, wooden table, kettle and a burnt wall outlet; and a residential renovation site with an open electrical panel, cables, tools and plaster dust. Soft natural daylight.","luz":"Luz natural suave, día, sin flash"}}
-GUION: [hook · dice: la vecina] Mandé cinco mensajes por el enchufe quemado. Nadie contestó. (visual: En la cocina de su casa en Villa Urquiza, sostiene la tapa tiznada del enchufe en una mano y el teléfono con la conversación sin respuesta en la otra.) · [desarrollo · dice: la vecina] Esta vez conté lo que pasaba una sola vez. (visual: Sentada a la mesa, escribe en el celular mientras en pantalla avanza Contar el problema paso por paso hasta el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.') · [desarrollo · dice: la electricista] Me llegó un trabajo eléctrico a diez cuadras. Coticé. (visual: En la obra, con la pinza en la mano, apoya el celular en el tablero y en Bandeja de solicitudes el pedido pendiente pasa a la pastilla COTIZADO con su monto.) · [giro · dice: la vecina] No perseguí a nadie. Los presupuestos ya estaban ahí. (visual: Deja la pava en la hornalla y mira el teléfono: en la home se enciende la tira 'TE ESPERAN TUS PROVEEDORES' y se suman las tarjetas una al lado de la otra.) · [cta · dice: placa] Contá qué hay que arreglar. (visual: Placa final limpia con la marca RepareHoy y la dirección web.)
+CAST: {"personajes":[{"id":"p1","nombre":"Marina","rol":"Vecina de Villa Urquiza que publica la solicitud y recibe los presupuestos","fisicoEn":"Woman around 38, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles across nose, tired warm eyes, no makeup. Wears a loose mustard knit sweater over a grey tee, jeans, small gold stud earrings. Grounded, everyday presence.","fisicoEs":"Mujer de unos 38, pelo castaño ondulado atado, piel oliva, pecas, mirada cálida y cansada.","vestuario":"Sweater mostaza tejido, remera gris, jeans","personalidad":"Práctica, franca","lugarEn":"Her own ground-floor apartment in Villa Urquiza: a narrow hallway electrical panel with one tripped breaker and taped wires, then the kitchen table with a mate gourd, a half-done crossword book and a cooled cup. Afternoon light through a patio window.","quien":"vecina de Villa Urquiza"},{"id":"p2","nombre":"Carla","rol":"Electricista matriculada que recibe el pedido en su bandeja y cotiza el mismo día","fisicoEn":"Woman around 44, black hair in a low practical bun, tan skin, strong eyebrows, small scar on left hand, confident steady gaze. Wears a navy work shirt with rolled sleeves, tool belt, scuffed boots. Sturdy, capable, unhurried presence.","fisicoEs":"Mujer de unos 44, pelo negro recogido, piel trigueña, mirada segura, manos de trabajo.","vestuario":"Camisa de trabajo azul, cinturón portaherramientas","personalidad":"Segura, concreta","lugarEn":"A half-finished apartment renovation she is wiring: exposed conduit on bare brick, an open toolbox with a screwdriver set down on it, a coiled cable roll, and a thermos with a hand-painted enamel mug beside it. Hard daylight from an unglazed window.","quien":"electricista"}],"lugar":{"nombre":"Pasillo y cocina de un PH en Villa Urquiza","descripcionEn":"A narrow ground-floor Buenos Aires apartment: hallway with an open electrical panel and taped wiring, opening onto a small kitchen with a tiled counter, wooden table, mate gourd and a patio door. Lived-in, tidy, warm afternoon light.","luz":"Luz de tarde suave por el patio"}}
+GUION: [hook · dice: vecina de Villa Urquiza] Cinco mensajes mandé. No me contestó nadie. (visual: La vecina abre el tablero del pasillo con la térmica baja, el celular en la otra mano y la pantalla llena de mensajes sin respuesta.) · [desarrollo · dice: vecina de Villa Urquiza] Esta vez conté lo que pasaba, con mis palabras. (visual: Sentada en la mesa de la cocina, tipea la descripción del problema en la pantalla Contar el problema y toca Crear solicitud.) · [desarrollo · dice: electricista] Me llegó tu pedido solo. Te cotizé el mismo día. (visual: La electricista deja el destornillador sobre la caja de herramientas en la obra y mira en su celular la Bandeja de solicitudes con el pedido pendiente de cotizar.) · [giro · dice: vecina de Villa Urquiza] Abrí el celu y ya tenía tres presupuestos esperándome. (visual: La vecina apoya el mate y ve en la pantalla de inicio la tira Te esperan tus proveedores con las tarjetas que se suman.) · [cta · dice: placa] Contá qué hay que arreglar (visual: Placa final con la marca sobre fondo limpio y la dirección web.)
```

**Lo que devolvió:**

```json
{
 "escenas": [
  {
   "n": 1,
   "rol": "hook",
   "durSec": 4,
   "plano": "medium shot",
   "angulo": "Frontal a la altura del pecho, el tablero abierto a un costado",
   "personajes": [
    "p1"
   ],
   "accion": "Marina abre la tapa del tablero del pasillo, ve la térmica baja y suelta la frase con el celular colgando en la otra mano.",
   "accionEn": "Marina stands in the narrow hallway of her Villa Urquiza ground-floor apartment, already talking as she pulls open the hinged cover of the electrical panel with one hand, the other holding her phone face-down against her thigh. The tripped breaker and taped wires are plainly visible. She tips her head toward the panel, exhales through her nose and lets her shoulders drop. Faint patio traffic hum.",
   "dialogo": "Cinco mensajes mandé. No me contestó nadie.",
   "continuidad": "",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 2,
   "rol": "desarrollo",
   "durSec": 5,
   "plano": "over-the-shoulder",
   "angulo": "Desde atrás del hombro, la mesa de la cocina en diagonal",
   "personajes": [
    "p1"
   ],
   "accion": "Marina, sentada a la mesa con el mate y el crucigrama, tipea con los dos pulgares y habla para sí misma, más tranquila.",
   "accionEn": "Marina sits at her kitchen table in the same mustard sweater, the mate gourd and a half-done crossword book beside a cooled cup. She is already talking as she settles her elbows on the wood and types steadily with both thumbs, speaking down to the table for herself rather than to anyone. Her jaw loosens, she nods once and keeps typing. Soft afternoon light from the patio door, a distant fridge hum.",
   "dialogo": "Esta vez conté lo que pasaba, con mis palabras.",
   "continuidad": "Mismo sweater mostaza, pelo atado, luz de tarde",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 3,
   "rol": "desarrollo",
   "durSec": 3,
   "plano": "medium close-up",
   "angulo": "Levemente lateral, el tablero del pasillo al fondo",
   "personajes": [],
   "accion": "Se ve la carga del pedido: se elige el rubro, se tipea la zona y la descripción, y el resumen confirma antes de publicar.",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": "Contar el problema",
   "archivoCaptura": "screens/01-cliente-contar-el-problema.png"
  },
  {
   "n": 4,
   "rol": "desarrollo",
   "durSec": 5,
   "plano": "medium shot",
   "angulo": "Frontal bajo, la pared de ladrillo con caño a la vista detrás",
   "personajes": [
    "p2"
   ],
   "accion": "Carla apoya el destornillador en la caja de herramientas de la obra y le cuenta a alguien fuera de cuadro que el pedido le llegó solo.",
   "accionEn": "Carla stands in the half-finished apartment she is wiring, exposed conduit on bare brick behind her. She is already talking as she sets a screwdriver down into the open toolbox at her hip, wipes her palm on her navy work shirt and turns her head toward someone off-camera to her right, tilting her chin as she explains. She raises her eyebrows once, confident, then reaches for the thermos. Hard daylight, radio faint, a drill somewhere down the hall.",
   "dialogo": "Me llegó tu pedido solo. Te cotizé el mismo día.",
   "continuidad": "",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 5,
   "rol": "giro",
   "durSec": 5,
   "plano": "close-up",
   "angulo": "Frontal cerrado sobre el rostro, la cocina desenfocada atrás",
   "personajes": [
    "p1"
   ],
   "accion": "Marina apoya el mate en la mesa, levanta la mirada del celular y la cara le cambia de la espera al alivio mientras habla a cámara.",
   "accionEn": "Marina is at the same kitchen table, already talking as she lowers the mate gourd onto the wood with a small knock and lifts her eyes from her phone straight to camera. Her eyebrows go up, a short breath of relief escapes her, and a half-smile settles in as she taps the screen twice with her thumb and leans back against the chair. Warm afternoon light across her face, the patio door open, birds outside.",
   "dialogo": "Abrí el celu y ya tenía tres presupuestos esperándome.",
   "continuidad": "Misma mesa, sweater mostaza, mate presente",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 6,
   "rol": "giro",
   "durSec": 3,
   "plano": "medium shot",
   "angulo": "Frontal, encuadre limpio",
   "personajes": [],
   "accion": "La home arranca sin la tira, llega el primer presupuesto y aparece Te esperan tus proveedores; entra el segundo al lado.",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": "Te esperan tus proveedores",
   "archivoCaptura": "screens/02-cliente-te-esperan-tus-proveedores.png"
  },
  {
   "n": 7,
   "rol": "cta",
   "durSec": 3,
   "plano": "medium shot",
   "angulo": "Placa fija",
   "personajes": [],
   "accion": "Placa final: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": ""
  }
 ]
}
```

### Paso 6 · Pedidos a Flow

*Molde `flowpack/3.1-compilado` · modelo sonnet-5 · 6 s · terminó 11/10 14:35 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 2** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 2
+++ vuelta 3
@@ -1,5 +1,4 @@
 Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Respetá el género de quien está en cuadro (lo dice el paréntesis, que no se traduce ni se copia). Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.
-3| En Contar el problema avanzan los cuatro pasos hasta el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.'
-5| En Bandeja de solicitudes el pedido pendiente de cotizar pasa a la pastilla COTIZADO con su monto.
-7| En la home se enciende la tira 'TE ESPERAN TUS PROVEEDORES' y se suma una segunda tarjeta al lado de la primera.
-8| Placa final: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
+3| Se ve la carga del pedido: se elige el rubro, se tipea la zona y la descripción, y el resumen confirma antes de publicar.
+6| La home arranca sin la tira, llega el primer presupuesto y aparece Te esperan tus proveedores; entra el segundo al lado.
+7| Placa final: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
```

**Lo que devolvió:**

```json
{
 "estilo": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect.",
 "personajes": [
  {
   "id": "p1",
   "nombre": "Marina",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 38, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles across nose, tired warm eyes, no makeup. Wears a loose mustard knit sweater over a grey tee, jeans, small gold stud earrings. Grounded, everyday presence, standing and looking at the camera, natural pose, neutral background with a hint of a narrow ground-floor buenos aires apartment: hallway with an open electrical panel and taped. A still photo, no action, no dialogue."
  },
  {
   "id": "p2",
   "nombre": "Carla",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 44, black hair in a low practical bun, tan skin, strong eyebrows, small scar on left hand, confident steady gaze. Wears a navy work shirt with rolled sleeves, tool belt, scuffed boots. Sturdy, capable, unhurried presence, standing and looking at the camera, natural pose, neutral background with a hint of a narrow ground-floor buenos aires apartment: hallway with an open electrical panel and taped. A still photo, no action, no dialogue."
  }
 ],
 "escenas": [
  {
   "escenaN": 1,
   "rol": "hook",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marina, an Argentine woman around 38, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles across nose. Marina stands in the narrow hallway of her Villa Urquiza ground-floor apartment, already talking as she pulls open the hinged cover of the electrical panel with one hand, the other holding her phone face-down against her thigh. The tripped breaker and taped wires are plainly visible. She tips her head toward the panel, exhales through her nose and lets her shoulders drop. Faint patio traffic hum. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Cinco mensajes mandé. No me contestó nadie.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 2,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marina, an Argentine woman around 38, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles across nose. Marina sits at her kitchen table in the same mustard sweater, the mate gourd and a half-done crossword book beside a cooled cup. She is already talking as she settles her elbows on the wood and types steadily with both thumbs, speaking down to the table for herself rather than to anyone. Her jaw loosens, she nods once and keeps typing. Soft afternoon light from the patio door, a distant fridge hum. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Esta vez conté lo que pasaba, con mis palabras.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Over-the-shoulder shot, natural handheld feel, shallow depth of field. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 4,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Carla, an Argentine woman around 44, black hair in a low practical bun, tan skin, strong eyebrows. Carla stands in the half-finished apartment she is wiring, exposed conduit on bare brick behind her. She is already talking as she sets a screwdriver down into the open toolbox at her hip, wipes her palm on her navy work shirt and turns her head toward someone off-camera to her right, tilting her chin as she explains. She raises her eyebrows once, confident, then reaches for the thermos. Hard daylight, radio faint, a drill somewhere down the hall. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Me llegó tu pedido solo. Te cotizé el mismo día.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 5,
   "rol": "giro",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Marina, an Argentine woman around 38, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles across nose. Marina is at the same kitchen table, already talking as she lowers the mate gourd onto the wood with a small knock and lifts her eyes from her phone straight to camera. Her eyebrows go up, a short breath of relief escapes her, and a half-smile settles in as she taps the screen twice with her thumb and leans back against the chair. Warm afternoon light across her face, the patio door open, birds outside. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Abrí el celu y ya tenía tres presupuestos esperándome.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Close-up on the face and hands, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  }
 ],
 "huecos": [],
 "version": "flowpack/3.0-compilado"
}
```

---

## Vuelta 4

**Qué cambió en las reglas:** "Hasta 3" no es "3". Si dice "vos", va a cámara. Lo que dice el gancho se ve (el chat sin respuesta). Nada de manos finas en primer plano. La ropa en cada pedido.

- Juez de la pieza (ChatGPT): VEREDICTO: TIENE POTENCIAL — 6/10
- Juez de la materia prima (ChatGPT): NOTA: 7/10

Estrategia y concepto: los mismos de la vuelta 0.

### Paso 3 · Guion

*Molde `script/3.3` · modelo opus-5 · 42 s · terminó 11/10 14:38 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 3** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 3
+++ vuelta 4
@@ -72,2 +72,5 @@
 - No muestres un resultado que la marca no produce: si la app consigue presupuestos, no se ve el arreglo terminado ni el problema resuelto.
+- "Hasta N" no es "N": no digas una cantidad que la marca no garantiza ni que la pantalla no va a mostrar.
+- Si una frase le habla a alguien ("vos", "tu pedido"), es al espectador: esa persona lo dice mirando a cámara. Una persona nunca le habla de "vos" a otra que no está en la escena.
+- Ortografía y tildes correctas (se leen en los subtítulos).
```

**Lo que devolvió:**

```json
{
 "blocks": [
  {
   "role": "hook",
   "quien": "la vecina",
   "narration": "Nadie me contesta. Le escribí a tres electricistas.",
   "visual": "En la cocina a media luz, aprieta la térmica saltada con una mano y en la otra sostiene el chat sin respuesta.",
   "durSec": 4
  },
  {
   "role": "desarrollo",
   "quien": "la vecina",
   "narration": "Esta vez lo conté una sola vez, con mis palabras.",
   "visual": "Apoyada en la mesada, tipea en el celular mientras 'Contar el problema' avanza paso a paso hasta 'Crear solicitud'.",
   "durSec": 5
  },
  {
   "role": "desarrollo",
   "quien": "la electricista",
   "narration": "A mí me llega el pedido de acá, de Villa Urquiza. Le paso el precio y listo.",
   "visual": "En la obra, deja la pinza sobre el tablero abierto y abre 'Bandeja de solicitudes', donde entra el pedido nuevo y pasa a COTIZADO.",
   "durSec": 7
  },
  {
   "role": "giro",
   "quien": "la vecina",
   "narration": "Abrí la app y los presupuestos ya estaban ahí. No perseguí a nadie.",
   "visual": "Sentada en el sillón con el mate en la mano, la tira 'TE ESPERAN TUS PROVEEDORES' se enciende con dos tarjetas.",
   "durSec": 5
  },
  {
   "role": "cta",
   "quien": "placa",
   "narration": "Reparé hoy. Contá qué hay que arreglar.",
   "visual": "Placa final con la marca sobre fondo limpio y la dirección web.",
   "durSec": 5
  }
 ],
 "music": {
  "mood": "cálido, confiado"
 }
}
```

### Paso 4 · Personajes

*Molde `cast/2.2` · modelo opus-5 · 21 s · terminó 11/10 14:38 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 3** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 3
+++ vuelta 4
@@ -16,4 +16,5 @@
 - vestuario: máximo 10 palabras.
+- vestuarioEn: la misma ropa en INGLÉS, máximo 12 palabras (viaja en cada pedido al generador para que no cambie entre tomas).
 - personalidad: 1 a 3 palabras.
-- lugarEn: 20 a 40 palabras en INGLÉS. DÓNDE vemos a ESTA persona en el comercial: un lugar suyo, concreto y creíble (no "a home" ni "an office"), con 2 o 3 objetos que cuentan su situación y la luz. Si el guion la muestra con un problema, el problema se ve en el lugar (lo roto, lo que gotea, lo que no anda). Sumá UN detalle propio de su vida que la haga real y no un estereotipo (algo que tiene a la vista y que nadie más tendría). Cada personaje tiene SU lugar: nunca el de otro.
+- lugarEn: 20 a 40 palabras en INGLÉS. DÓNDE vemos a ESTA persona en el comercial: un lugar suyo, concreto y creíble (no "a home" ni "an office"), con 2 o 3 objetos que cuentan su situación y la luz. Si el guion la muestra con un problema, el problema se ve en el lugar (lo roto, lo que gotea, lo que no anda). Sumá UN detalle propio de su vida que la haga real y no un estereotipo (algo que tiene a la vista y que nadie más tendría). Que se reconozca el país y la ciudad del negocio por los materiales y objetos (no por carteles). Cada personaje tiene SU lugar: nunca el de otro.
 - quien: el nombre con el que el GUION la nombra en "dice:" (para unir cada frase con su persona).
@@ -32,3 +33,3 @@
 Devolvé SOLO JSON:
-{ "personajes": [{ "id": "p1", "nombre": "...", "rol": "...", "fisicoEn": "...", "fisicoEs": "...", "vestuario": "...", "personalidad": "...", "lugarEn": "...", "quien": "..." }], "lugar": { "nombre": "...", "descripcionEn": "...", "luz": "..." } }
+{ "personajes": [{ "id": "p1", "nombre": "...", "rol": "...", "fisicoEn": "...", "fisicoEs": "...", "vestuario": "...", "vestuarioEn": "...", "personalidad": "...", "lugarEn": "...", "quien": "..." }], "lugar": { "nombre": "...", "descripcionEn": "...", "luz": "..." } }
 
@@ -71,2 +72,2 @@
 CONCEPTO: {"id":"c3","topico":"El pedido que llega","tipoGancho":"DEMOSTRACIÓN DIRECTA","idea":"Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.","tono":"Directo, profesional, orgulloso sin grandilocuencia; charla real","estetica":"Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo","referencia":"Testimonial ficcional de dos voces con demo de producto","porQueFunciona":"Dos voces explican el mismo alivio y la interfaz lo confirma al instante."}
-GUION: [hook · dice: vecina de Villa Urquiza] Cinco mensajes mandé. No me contestó nadie. (visual: La vecina abre el tablero del pasillo con la térmica baja, el celular en la otra mano y la pantalla llena de mensajes sin respuesta.) · [desarrollo · dice: vecina de Villa Urquiza] Esta vez conté lo que pasaba, con mis palabras. (visual: Sentada en la mesa de la cocina, tipea la descripción del problema en la pantalla Contar el problema y toca Crear solicitud.) · [desarrollo · dice: electricista] Me llegó tu pedido solo. Te cotizé el mismo día. (visual: La electricista deja el destornillador sobre la caja de herramientas en la obra y mira en su celular la Bandeja de solicitudes con el pedido pendiente de cotizar.) · [giro · dice: vecina de Villa Urquiza] Abrí el celu y ya tenía tres presupuestos esperándome. (visual: La vecina apoya el mate y ve en la pantalla de inicio la tira Te esperan tus proveedores con las tarjetas que se suman.) · [cta · dice: placa] Contá qué hay que arreglar (visual: Placa final con la marca sobre fondo limpio y la dirección web.)
+GUION: [hook · dice: la vecina] Nadie me contesta. Le escribí a tres electricistas. (visual: En la cocina a media luz, aprieta la térmica saltada con una mano y en la otra sostiene el chat sin respuesta.) · [desarrollo · dice: la vecina] Esta vez lo conté una sola vez, con mis palabras. (visual: Apoyada en la mesada, tipea en el celular mientras 'Contar el problema' avanza paso a paso hasta 'Crear solicitud'.) · [desarrollo · dice: la electricista] A mí me llega el pedido de acá, de Villa Urquiza. Le paso el precio y listo. (visual: En la obra, deja la pinza sobre el tablero abierto y abre 'Bandeja de solicitudes', donde entra el pedido nuevo y pasa a COTIZADO.) · [giro · dice: la vecina] Abrí la app y los presupuestos ya estaban ahí. No perseguí a nadie. (visual: Sentada en el sillón con el mate en la mano, la tira 'TE ESPERAN TUS PROVEEDORES' se enciende con dos tarjetas.) · [cta · dice: placa] Reparé hoy. Contá qué hay que arreglar. (visual: Placa final con la marca sobre fondo limpio y la dirección web.)
```

**Lo que devolvió:**

```json
{
 "personajes": [
  {
   "id": "p1",
   "nombre": "Vanina",
   "rol": "Vecina de Villa Urquiza que necesita resolver una falla eléctrica en su casa y cuenta cómo pasó de mandar mensajes a ciegas a recibir presupuestos.",
   "fisicoEn": "Woman around 38, olive skin, dark brown wavy hair tied in a loose low bun, strong eyebrows, small mole on left cheek, no makeup, tired but warm expression, relaxed posture, holds phone close to chest.",
   "fisicoEs": "Mujer de unos 38, piel oliva, pelo castaño ondulado atado, cejas marcadas, gesto cansado y cálido.",
   "vestuario": "Buzo gris de algodón, remera blanca, jean oscuro",
   "vestuarioEn": "Grey cotton sweatshirt, white tee, dark jeans, no accessories",
   "personalidad": "Práctica, franca",
   "lugarEn": "Her narrow Buenos Aires apartment kitchen: tripped breaker panel open above the fridge, melted plug on an extension cord, half-finished mate on the tiled counter, and a shelf of hand-labeled jars of homemade pickles. Dim overhead light, grey window glow.",
   "quien": "la vecina"
  },
  {
   "id": "p2",
   "nombre": "Carla",
   "rol": "Electricista matriculada del barrio que recibe el pedido en su bandeja y cotiza sin tener que esperar una recomendación.",
   "fisicoEn": "Woman around 44, fair skin with freckles, short straight black hair with grey strands, square jaw, calloused hands, reading glasses pushed up on her head, confident upright stance, sleeves rolled to the elbow.",
   "fisicoEs": "Mujer de unos 44, piel clara con pecas, pelo negro corto con canas, manos trabajadas, postura segura.",
   "vestuario": "Camisa de trabajo azul, pantalón cargo, cinto portaherramientas",
   "vestuarioEn": "Blue work shirt, cargo trousers, leather tool belt, work boots",
   "personalidad": "Segura, resolutiva",
   "lugarEn": "A half-built ground-floor unit she's wiring: open breaker panel with labeled wires, conduit and pliers on a sawhorse, bare brick and cement bag on the floor, plus her thermos and a worn chess magazine. Warm daylight from an unglazed window.",
   "quien": "la electricista"
  }
 ],
 "lugar": {
  "nombre": "Villa Urquiza: cocina de departamento y obra en planta baja",
  "descripcionEn": "Two real Buenos Aires spaces: a tight apartment kitchen with tiled counter, open breaker panel and tube lighting; and an unfinished ground-floor unit with exposed brick, conduit runs, sawhorses and a wired panel. Soft, clean, documentary atmosphere.",
  "luz": "Luz suave de ventana, sombras bajas, acabado limpio"
 }
}
```

### Paso 5 · Storyboard

*Molde `storyboard/3.3` · modelo opus-5 · 48 s · terminó 11/10 14:39 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 3** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 3
+++ vuelta 4
@@ -45,2 +45,7 @@
   una térmica, una canilla que gotea), visible desde el primer cuadro.
+- Lo que el gancho DICE se tiene que VER: si dice que nadie le contesta, se ve el teléfono con sus mensajes enviados sin
+  respuesta (un chat cualquiera, no la app de la marca, sin texto legible).
+- Nada de acciones finas de manos en plano cercano mientras habla (tipear con los pulgares, enchufar, atornillar): el video
+  generado deforma los dedos. Que la acción sea del cuerpo (abrir, apoyar, levantar, girarse).
+- Si la frase le habla al espectador ("vos", "tu pedido"), esa escena es a cámara.
 - Lo que hace la persona tiene que ser creíble en su oficio y en su casa: un profesional se ve cuidadoso (nadie toca cables
@@ -69,3 +74,4 @@
 INSERTOS DE PANTALLA
-- Sólo los que prueban lo que se acaba de decir, inmediatamente después de esa frase. Como máximo 3 en la pieza.
+- Cada frase que nombra algo que hace la app lleva SU pantalla inmediatamente después (lo que cuenta quien pide, lo que le
+  llega a quien responde, lo que recibe al final). Sólo pantallas que prueban una frase. Como máximo 3 en la pieza.
 - No tienen diálogo: suena la música.
@@ -125,3 +131,3 @@
 Recién acá la historia se traduce a escenas y se comprueba que entra en 20 a 30 segundos. El "recorrido" de la ficha es un banco de posibilidades, nunca una orden de escenas ni un orden fijo.
-CAST: {"personajes":[{"id":"p1","nombre":"Marina","rol":"Vecina de Villa Urquiza que publica la solicitud y recibe los presupuestos","fisicoEn":"Woman around 38, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles across nose, tired warm eyes, no makeup. Wears a loose mustard knit sweater over a grey tee, jeans, small gold stud earrings. Grounded, everyday presence.","fisicoEs":"Mujer de unos 38, pelo castaño ondulado atado, piel oliva, pecas, mirada cálida y cansada.","vestuario":"Sweater mostaza tejido, remera gris, jeans","personalidad":"Práctica, franca","lugarEn":"Her own ground-floor apartment in Villa Urquiza: a narrow hallway electrical panel with one tripped breaker and taped wires, then the kitchen table with a mate gourd, a half-done crossword book and a cooled cup. Afternoon light through a patio window.","quien":"vecina de Villa Urquiza"},{"id":"p2","nombre":"Carla","rol":"Electricista matriculada que recibe el pedido en su bandeja y cotiza el mismo día","fisicoEn":"Woman around 44, black hair in a low practical bun, tan skin, strong eyebrows, small scar on left hand, confident steady gaze. Wears a navy work shirt with rolled sleeves, tool belt, scuffed boots. Sturdy, capable, unhurried presence.","fisicoEs":"Mujer de unos 44, pelo negro recogido, piel trigueña, mirada segura, manos de trabajo.","vestuario":"Camisa de trabajo azul, cinturón portaherramientas","personalidad":"Segura, concreta","lugarEn":"A half-finished apartment renovation she is wiring: exposed conduit on bare brick, an open toolbox with a screwdriver set down on it, a coiled cable roll, and a thermos with a hand-painted enamel mug beside it. Hard daylight from an unglazed window.","quien":"electricista"}],"lugar":{"nombre":"Pasillo y cocina de un PH en Villa Urquiza","descripcionEn":"A narrow ground-floor Buenos Aires apartment: hallway with an open electrical panel and taped wiring, opening onto a small kitchen with a tiled counter, wooden table, mate gourd and a patio door. Lived-in, tidy, warm afternoon light.","luz":"Luz de tarde suave por el patio"}}
-GUION: [hook · dice: vecina de Villa Urquiza] Cinco mensajes mandé. No me contestó nadie. (visual: La vecina abre el tablero del pasillo con la térmica baja, el celular en la otra mano y la pantalla llena de mensajes sin respuesta.) · [desarrollo · dice: vecina de Villa Urquiza] Esta vez conté lo que pasaba, con mis palabras. (visual: Sentada en la mesa de la cocina, tipea la descripción del problema en la pantalla Contar el problema y toca Crear solicitud.) · [desarrollo · dice: electricista] Me llegó tu pedido solo. Te cotizé el mismo día. (visual: La electricista deja el destornillador sobre la caja de herramientas en la obra y mira en su celular la Bandeja de solicitudes con el pedido pendiente de cotizar.) · [giro · dice: vecina de Villa Urquiza] Abrí el celu y ya tenía tres presupuestos esperándome. (visual: La vecina apoya el mate y ve en la pantalla de inicio la tira Te esperan tus proveedores con las tarjetas que se suman.) · [cta · dice: placa] Contá qué hay que arreglar (visual: Placa final con la marca sobre fondo limpio y la dirección web.)
+CAST: {"personajes":[{"id":"p1","nombre":"Vanina","rol":"Vecina de Villa Urquiza que necesita resolver una falla eléctrica en su casa y cuenta cómo pasó de mandar mensajes a ciegas a recibir presupuestos.","fisicoEn":"Woman around 38, olive skin, dark brown wavy hair tied in a loose low bun, strong eyebrows, small mole on left cheek, no makeup, tired but warm expression, relaxed posture, holds phone close to chest.","fisicoEs":"Mujer de unos 38, piel oliva, pelo castaño ondulado atado, cejas marcadas, gesto cansado y cálido.","vestuario":"Buzo gris de algodón, remera blanca, jean oscuro","vestuarioEn":"Grey cotton sweatshirt, white tee, dark jeans, no accessories","personalidad":"Práctica, franca","lugarEn":"Her narrow Buenos Aires apartment kitchen: tripped breaker panel open above the fridge, melted plug on an extension cord, half-finished mate on the tiled counter, and a shelf of hand-labeled jars of homemade pickles. Dim overhead light, grey window glow.","quien":"la vecina"},{"id":"p2","nombre":"Carla","rol":"Electricista matriculada del barrio que recibe el pedido en su bandeja y cotiza sin tener que esperar una recomendación.","fisicoEn":"Woman around 44, fair skin with freckles, short straight black hair with grey strands, square jaw, calloused hands, reading glasses pushed up on her head, confident upright stance, sleeves rolled to the elbow.","fisicoEs":"Mujer de unos 44, piel clara con pecas, pelo negro corto con canas, manos trabajadas, postura segura.","vestuario":"Camisa de trabajo azul, pantalón cargo, cinto portaherramientas","vestuarioEn":"Blue work shirt, cargo trousers, leather tool belt, work boots","personalidad":"Segura, resolutiva","lugarEn":"A half-built ground-floor unit she's wiring: open breaker panel with labeled wires, conduit and pliers on a sawhorse, bare brick and cement bag on the floor, plus her thermos and a worn chess magazine. Warm daylight from an unglazed window.","quien":"la electricista"}],"lugar":{"nombre":"Villa Urquiza: cocina de departamento y obra en planta baja","descripcionEn":"Two real Buenos Aires spaces: a tight apartment kitchen with tiled counter, open breaker panel and tube lighting; and an unfinished ground-floor unit with exposed brick, conduit runs, sawhorses and a wired panel. Soft, clean, documentary atmosphere.","luz":"Luz suave de ventana, sombras bajas, acabado limpio"}}
+GUION: [hook · dice: la vecina] Nadie me contesta. Le escribí a tres electricistas. (visual: En la cocina a media luz, aprieta la térmica saltada con una mano y en la otra sostiene el chat sin respuesta.) · [desarrollo · dice: la vecina] Esta vez lo conté una sola vez, con mis palabras. (visual: Apoyada en la mesada, tipea en el celular mientras 'Contar el problema' avanza paso a paso hasta 'Crear solicitud'.) · [desarrollo · dice: la electricista] A mí me llega el pedido de acá, de Villa Urquiza. Le paso el precio y listo. (visual: En la obra, deja la pinza sobre el tablero abierto y abre 'Bandeja de solicitudes', donde entra el pedido nuevo y pasa a COTIZADO.) · [giro · dice: la vecina] Abrí la app y los presupuestos ya estaban ahí. No perseguí a nadie. (visual: Sentada en el sillón con el mate en la mano, la tira 'TE ESPERAN TUS PROVEEDORES' se enciende con dos tarjetas.) · [cta · dice: placa] Reparé hoy. Contá qué hay que arreglar. (visual: Placa final con la marca sobre fondo limpio y la dirección web.)
```

**Lo que devolvió:**

```json
[
 {
  "n": 1,
  "rol": "hook",
  "durSec": 4,
  "plano": "medium close-up",
  "angulo": "Levemente lateral, a la altura del hombro",
  "personajes": [
   "p1"
  ],
  "accion": "Vanina sube la térmica saltada del tablero y gira el celular hacia cámara: su chat quedó sin respuesta. Pasa del fastidio a la resignación.",
  "accionEn": "Vanina stands in her dim narrow kitchen beneath the open breaker panel above the fridge, already talking to camera as she reaches up and flips the tripped breaker back with one hand. The light does not come on. She lowers her arm, turns her phone screen briefly toward camera showing a plain chat of sent messages with no replies, then lets her hand drop with a tired shrug. Faint street noise and a humming fridge.",
  "dialogo": "Nadie me contesta. Le escribí a tres electricistas.",
  "continuidad": "",
  "pantalla": "",
  "durSecModelo": 8
 },
 {
  "n": 2,
  "rol": "desarrollo",
  "durSec": 5,
  "plano": "medium shot",
  "angulo": "Frontal bajo, desde la mesada",
  "personajes": [
   "p1"
  ],
  "accion": "Apoyada en la mesada junto al mate, Vanina habla sola mientras apoya el celular y se endereza: la bronca se le afloja.",
  "accionEn": "Vanina leans her forearms on the tiled kitchen counter beside her half-finished mate and the shelf of labeled pickle jars, already speaking half to herself as she sets her phone face up on the counter. She straightens her back, glances once up at the melted plug on the extension cord, and her jaw unclenches into something calmer. Grey window light, a neighbour's radio faint through the wall.",
  "dialogo": "Esta vez lo conté una sola vez, con mis palabras.",
  "continuidad": "Mismo buzo gris, pelo atado, cocina a media luz",
  "pantalla": "",
  "durSecModelo": 8
 },
 {
  "n": 3,
  "rol": "desarrollo",
  "durSec": 3,
  "plano": "",
  "angulo": "",
  "personajes": [],
  "accion": "Se ven los cuatro pasos de 'Contar el problema' avanzando hasta el resumen y 'Crear solicitud', que pasa a 'Publicando…'.",
  "accionEn": "",
  "dialogo": "",
  "continuidad": "",
  "pantalla": "Contar el problema",
  "archivoCaptura": "screens/01-cliente-contar-el-problema.png"
 },
 {
  "n": 4,
  "rol": "desarrollo",
  "durSec": 7,
  "plano": "over-the-shoulder",
  "angulo": "Desde atrás del hombro, hacia el tablero de obra",
  "personajes": [
   "p2"
  ],
  "accion": "En la obra, Carla deja la pinza en el caballete y se gira hacia un compañero fuera de cuadro, segura: el trabajo le llegó solo.",
  "accionEn": "Carla stands in the half-built ground-floor unit facing the labeled breaker panel, already talking over her shoulder to a workmate off camera as she sets her pliers down on the sawhorse next to her thermos and worn chess magazine. She wipes a hand on her cargo trousers, turns her upper body toward the off-camera person and nods once with easy confidence. Warm daylight from the unglazed window, distant drill and street traffic.",
  "dialogo": "A mí me llega el pedido de acá, de Villa Urquiza. Le paso el precio y listo.",
  "continuidad": "",
  "pantalla": "",
  "durSecModelo": 8
 },
 {
  "n": 5,
  "rol": "desarrollo",
  "durSec": 3,
  "plano": "",
  "angulo": "",
  "personajes": [],
  "accion": "Entra arriba el pedido nuevo como pendiente de cotizar y, al cotizar, pasa a la pastilla COTIZADO con su monto.",
  "accionEn": "",
  "dialogo": "",
  "continuidad": "",
  "pantalla": "Bandeja de solicitudes",
  "archivoCaptura": "screens/05-proveedor-bandeja-de-solicitudes.png"
 },
 {
  "n": 6,
  "rol": "giro",
  "durSec": 6,
  "plano": "medium close-up",
  "angulo": "Frontal, a la altura de los ojos, sentada",
  "personajes": [
   "p1"
  ],
  "accion": "Sentada con el mate en la mano, Vanina mira el celular, levanta la vista a cámara y se le suelta la cara: ya estaban ahí.",
  "accionEn": "Vanina sits on her living-room sofa holding the mate in one hand, already speaking as she tilts her phone up in the other and reads it. Her eyebrows lift, she breathes out and raises her eyes to camera with a small relieved smile, then rests the mate on her knee. Same grey sweatshirt and low bun, soft window light, muffled city hum.",
  "dialogo": "Abrí la app y los presupuestos ya estaban ahí. No perseguí a nadie.",
  "continuidad": "Mismo buzo gris, pelo atado, mismo día",
  "pantalla": "",
  "durSecModelo": 8
 },
 {
  "n": 7,
  "rol": "giro",
  "durSec": 3,
  "plano": "",
  "angulo": "",
  "personajes": [],
  "accion": "La home arranca sin la tira, llega el primer presupuesto y aparece 'TE ESPERAN TUS PROVEEDORES'; llega el segundo y se suma al lado.",
  "accionEn": "",
  "dialogo": "",
  "continuidad": "",
  "pantalla": "Te esperan tus proveedores",
  "archivoCaptura": "screens/02-cliente-te-esperan-tus-proveedores.png"
 },
 {
  "n": 8,
  "rol": "cta",
  "durSec": 3,
  "plano": "",
  "angulo": "",
  "personajes": [],
  "accion": "Placa final sobre fondo limpio: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar",
  "accionEn": "",
  "dialogo": "",
  "continuidad": "",
  "pantalla": ""
 }
]
```

### Paso 6 · Pedidos a Flow

*Molde `flowpack/3.1-compilado` · modelo sonnet-5 · 6 s · terminó 11/10 14:39 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 3** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 3
+++ vuelta 4
@@ -1,4 +1,5 @@
 Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Respetá el género de quien está en cuadro (lo dice el paréntesis, que no se traduce ni se copia). Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.
-3| Se ve la carga del pedido: se elige el rubro, se tipea la zona y la descripción, y el resumen confirma antes de publicar.
-6| La home arranca sin la tira, llega el primer presupuesto y aparece Te esperan tus proveedores; entra el segundo al lado.
-7| Placa final: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
+3| Se ven los cuatro pasos de 'Contar el problema' avanzando hasta el resumen y 'Crear solicitud', que pasa a 'Publicando…'.
+5| Entra arriba el pedido nuevo como pendiente de cotizar y, al cotizar, pasa a la pastilla COTIZADO con su monto.
+7| La home arranca sin la tira, llega el primer presupuesto y aparece 'TE ESPERAN TUS PROVEEDORES'; llega el segundo y se suma al lado.
+8| Placa final sobre fondo limpio: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
```

**Lo que devolvió:**

```json
{
 "estilo": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect.",
 "personajes": [
  {
   "id": "p1",
   "nombre": "Vanina",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 38, olive skin, dark brown wavy hair tied in a loose low bun, strong eyebrows, small mole on left cheek, no makeup, tired but warm expression, relaxed posture, holds phone close to chest, standing and looking at the camera, natural pose, neutral background with a hint of two real buenos aires spaces: a tight apartment kitchen with tiled counter. A still photo, no action, no dialogue."
  },
  {
   "id": "p2",
   "nombre": "Carla",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 44, fair skin with freckles, short straight black hair with grey strands, square jaw, calloused hands, reading glasses pushed up on her head, confident upright stance, sleeves rolled to the elbow, standing and looking at the camera, natural pose, neutral background with a hint of two real buenos aires spaces: a tight apartment kitchen with tiled counter. A still photo, no action, no dialogue."
  }
 ],
 "escenas": [
  {
   "escenaN": 1,
   "rol": "hook",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vanina, an Argentine woman around 38, olive skin, dark brown wavy hair tied in a loose low bun, strong eyebrows, wearing Grey cotton sweatshirt, white tee, dark jeans, no accessories. Vanina stands in her dim narrow kitchen beneath the open breaker panel above the fridge, already talking to camera as she reaches up and flips the tripped breaker back with one hand. The light does not come on. She lowers her arm, turns her phone screen briefly toward camera showing a plain chat of sent messages with no replies, then lets her hand drop with a tired shrug. Faint street noise and a humming fridge. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Nadie me contesta. Le escribí a tres electricistas.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never recreate the brand app interface. A generic messaging chat may be visible on the phone (sent bubbles with no replies) but its text is never legible. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 2,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vanina, an Argentine woman around 38, olive skin, dark brown wavy hair tied in a loose low bun, strong eyebrows, wearing Grey cotton sweatshirt, white tee, dark jeans, no accessories. Vanina leans her forearms on the tiled kitchen counter beside her half-finished mate and the shelf of labeled pickle jars, already speaking half to herself as she sets her phone face up on the counter. She straightens her back, glances once up at the melted plug on the extension cord, and her jaw unclenches into something calmer. Grey window light, a neighbour's radio faint through the wall. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Esta vez lo conté una sola vez, con mis palabras.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 4,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Carla, an Argentine woman around 44, fair skin with freckles, short straight black hair with grey strands, square jaw, calloused hands, wearing Blue work shirt, cargo trousers, leather tool belt, work boots. Carla stands in the half-built ground-floor unit facing the labeled breaker panel, already talking over her shoulder to a workmate off camera as she sets her pliers down on the sawhorse next to her thermos and worn chess magazine. She wipes a hand on her cargo trousers, turns her upper body toward the off-camera person and nods once with easy confidence. Warm daylight from the unglazed window, distant drill and street traffic. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'A mí me llega el pedido de acá, de Villa Urquiza. Le paso el precio y listo.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Over-the-shoulder shot, natural handheld feel, shallow depth of field. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 6,
   "rol": "giro",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vanina, an Argentine woman around 38, olive skin, dark brown wavy hair tied in a loose low bun, strong eyebrows, wearing Grey cotton sweatshirt, white tee, dark jeans, no accessories. Vanina sits on her living-room sofa holding the mate in one hand, already speaking as she tilts her phone up in the other and reads it. Her eyebrows lift, she breathes out and raises her eyes to camera with a small relieved smile, then rests the mate on her knee. Same grey sweatshirt and low bun, soft window light, muffled city hum. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Abrí la app y los presupuestos ya estaban ahí. No perseguí a nadie.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  }
 ],
 "huecos": [],
 "version": "flowpack/3.0-compilado"
}
```

---

## Vuelta 5

**Qué cambió en las reglas:** El otro lado habla de ESE pedido. Tres frases hasta 26 s. Cada escena muestra el momento en que pasa, no a alguien contándolo.

- Juez de la pieza (ChatGPT): VEREDICTO: TIENE POTENCIAL — 6/10
- Juez de la materia prima (ChatGPT): NOTA: 7/10

Estrategia y concepto: los mismos de la vuelta 0.

### Paso 3 · Guion

*Molde `script/3.4` · modelo opus-5 · 45 s · terminó 11/10 14:43 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 4** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 4
+++ vuelta 5
@@ -69,3 +69,3 @@
 - ORDEN: sigue la causa. Primero lo que le pasa a quien necesita, después lo que hace, después quién lo recibe y responde, al final lo que gana. Nada aparece antes de lo que lo provoca.
-- MENOS GENTE EXPLICANDO, MÁS COSAS PASANDO: como mucho 4 frases habladas en 26s, de 4 a 11 palabras cada una, secas y orales (frases largas salen con la boca de goma en el video generado). Lo demás lo cuentan la imagen y las pantallas de la app.
+- MENOS GENTE EXPLICANDO, MÁS COSAS PASANDO: como mucho 3 frases habladas en 26s, de 4 a 11 palabras cada una, secas y orales (frases largas salen con la boca de goma en el video generado). Lo demás lo cuentan la imagen y las pantallas de la app.
 - Cada persona habla como en la vida real: nada de vocabulario de la app ni de la ficha comercial (nombres de pantallas, "solicitud", "plataforma", "zona y oficio"). Lo dice como se lo contaría a un vecino.
@@ -81,3 +81,3 @@
 - Si la historia tiene dos lados, lo que uno necesita es exactamente lo que el otro hace (mismo oficio, mismo problema): si no, el pedido de uno nunca le llega al otro.
-- El comercial le habla a UN público: el del cierre. Si aparece el otro lado, lo que dice le sirve a ESE público (qué gana el que pide), no cuenta su propio negocio: el espectador que necesita el arreglo no quiere escuchar cómo consigue clientes el profesional.
+- El comercial le habla a UN público: el del cierre. Si aparece el otro lado, su frase es sobre ESE pedido (el de la persona de la historia: su barrio, su problema), para que se entienda que es el mismo pedido de punta a punta, y dice lo que hace con él pensando en quien pide (lo ve, le pasa el precio en el día). Nunca cuenta cómo consigue clientes ni cómo usa la app: el espectador que necesita el arreglo no quiere escuchar el negocio del profesional.
 - Un bloque puede no tener voz (narration "") si la imagen cuenta sola ese momento; entonces "quien" es "".
```

**Lo que devolvió:**

```json
{
 "blocks": [
  {
   "role": "hook",
   "quien": "vecina de Villa Urquiza",
   "narration": "Nadie me contesta. Tres días con la térmica saltando.",
   "visual": "En el lavadero sube la térmica del tablero y vuelve a caer; en la otra mano, el chat sin respuestas.",
   "durSec": 4
  },
  {
   "role": "desarrollo",
   "quien": "vecina de Villa Urquiza",
   "narration": "Me senté a escribir qué me pasaba y lo publiqué ahí mismo.",
   "visual": "Sentada en el pasillo, escribe en el celular qué le pasa y la pantalla Contar el problema avanza hasta '¡Solicitud publicada!'.",
   "durSec": 5
  },
  {
   "role": "desarrollo",
   "quien": "electricista de Villa Urquiza",
   "narration": "Me llegó el pedido: térmica que salta, acá en Villa Urquiza. Le pasé el precio ese día.",
   "visual": "En la obra, con la pinza amperométrica al cuello, abre Bandeja de solicitudes y el pedido nuevo pasa a COTIZADO.",
   "durSec": 7
  },
  {
   "role": "giro",
   "quien": "vecina de Villa Urquiza",
   "narration": "No perseguí a nadie. Los presupuestos llegaron a mi pantalla.",
   "visual": "Deja la pava en la cocina y en su inicio se enciende 'TE ESPERAN TUS PROVEEDORES' con dos tarjetas.",
   "durSec": 5
  },
  {
   "role": "cta",
   "quien": "placa",
   "narration": "Reparé hoy: contá qué hay que arreglar.",
   "visual": "Placa final limpia con la marca y la dirección web.",
   "durSec": 5
  }
 ],
 "music": {
  "mood": "cálido y confiado"
 }
}
```

### Paso 4 · Personajes

*Molde `cast/2.2` · modelo opus-5 · 20 s · terminó 11/10 14:43 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 4** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 4
+++ vuelta 5
@@ -72,2 +72,2 @@
 CONCEPTO: {"id":"c3","topico":"El pedido que llega","tipoGancho":"DEMOSTRACIÓN DIRECTA","idea":"Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.","tono":"Directo, profesional, orgulloso sin grandilocuencia; charla real","estetica":"Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo","referencia":"Testimonial ficcional de dos voces con demo de producto","porQueFunciona":"Dos voces explican el mismo alivio y la interfaz lo confirma al instante."}
-GUION: [hook · dice: la vecina] Nadie me contesta. Le escribí a tres electricistas. (visual: En la cocina a media luz, aprieta la térmica saltada con una mano y en la otra sostiene el chat sin respuesta.) · [desarrollo · dice: la vecina] Esta vez lo conté una sola vez, con mis palabras. (visual: Apoyada en la mesada, tipea en el celular mientras 'Contar el problema' avanza paso a paso hasta 'Crear solicitud'.) · [desarrollo · dice: la electricista] A mí me llega el pedido de acá, de Villa Urquiza. Le paso el precio y listo. (visual: En la obra, deja la pinza sobre el tablero abierto y abre 'Bandeja de solicitudes', donde entra el pedido nuevo y pasa a COTIZADO.) · [giro · dice: la vecina] Abrí la app y los presupuestos ya estaban ahí. No perseguí a nadie. (visual: Sentada en el sillón con el mate en la mano, la tira 'TE ESPERAN TUS PROVEEDORES' se enciende con dos tarjetas.) · [cta · dice: placa] Reparé hoy. Contá qué hay que arreglar. (visual: Placa final con la marca sobre fondo limpio y la dirección web.)
+GUION: [hook · dice: vecina de Villa Urquiza] Nadie me contesta. Tres días con la térmica saltando. (visual: En el lavadero sube la térmica del tablero y vuelve a caer; en la otra mano, el chat sin respuestas.) · [desarrollo · dice: vecina de Villa Urquiza] Me senté a escribir qué me pasaba y lo publiqué ahí mismo. (visual: Sentada en el pasillo, escribe en el celular qué le pasa y la pantalla Contar el problema avanza hasta '¡Solicitud publicada!'.) · [desarrollo · dice: electricista de Villa Urquiza] Me llegó el pedido: térmica que salta, acá en Villa Urquiza. Le pasé el precio ese día. (visual: En la obra, con la pinza amperométrica al cuello, abre Bandeja de solicitudes y el pedido nuevo pasa a COTIZADO.) · [giro · dice: vecina de Villa Urquiza] No perseguí a nadie. Los presupuestos llegaron a mi pantalla. (visual: Deja la pava en la cocina y en su inicio se enciende 'TE ESPERAN TUS PROVEEDORES' con dos tarjetas.) · [cta · dice: placa] Reparé hoy: contá qué hay que arreglar. (visual: Placa final limpia con la marca y la dirección web.)
```

**Lo que devolvió:**

```json
{
 "personajes": [
  {
   "id": "p1",
   "nombre": "Mariela",
   "rol": "Vecina de Villa Urquiza que publica la solicitud: la perspectiva de quien necesita el arreglo y recibe los presupuestos.",
   "fisicoEn": "Woman around 44, warm olive skin, dark brown wavy hair tied back with loose strands, thick eyebrows, small mole on left cheek, tired but friendly eyes; wears a mustard knit cardigan over a grey tee, no makeup, calm everyday presence.",
   "fisicoEs": "Mujer de 44, piel olivácea, pelo ondulado oscuro atado, lunar en mejilla, mirada cansada y amable.",
   "vestuario": "Cárdigan mostaza, remera gris, jean, pantuflas de casa",
   "vestuarioEn": "Mustard knit cardigan, grey tee, jeans, house slippers",
   "personalidad": "Práctica, franca",
   "lugarEn": "Her narrow back laundry room in a Villa Urquiza ground-floor house: open breaker panel with one switch flipped down, grey cement sink, clothes drying on a line, a shelf with a worn mate gourd and her collection of hand-painted thimbles. Grey daylight through a frosted window.",
   "quien": "vecina de Villa Urquiza"
  },
  {
   "id": "p2",
   "nombre": "Carina",
   "rol": "Electricista matriculada de Villa Urquiza: la perspectiva de quien recibe el pedido con zona y oficio y cotiza el mismo día.",
   "fisicoEn": "Woman around 36, light brown skin, black hair in a low ponytail, strong jaw, faint scar on right forearm, short clean nails, steady confident gaze; wears navy work shirt with sleeves rolled, amperometric clamp hanging on her neck, grounded practical presence.",
   "fisicoEs": "Mujer de 36, piel morena clara, pelo negro atado, mirada firme, pinza amperométrica al cuello.",
   "vestuario": "Camisa de trabajo azul, pantalón cargo, botines",
   "vestuarioEn": "Navy work shirt, cargo trousers, safety boots",
   "personalidad": "Resuelta, orgullosa",
   "lugarEn": "A half-finished apartment job in Villa Urquiza: bare brick wall with conduit boxes, exposed cable ends taped off, her open toolbag with insulated pliers and a voltage tester on a hollow-brick stack, plus a small enamel cup of cold coffee. Dusty afternoon light from an unglazed window.",
   "quien": "electricista de Villa Urquiza"
  }
 ],
 "lugar": {
  "nombre": "Casa de PH y obra en Villa Urquiza",
  "descripcionEn": "Two linked Buenos Aires interiors: a ground-floor PH with tiled passage, laundry breaker panel and small kitchen with a kettle; and a nearby renovation flat with bare brick, conduit boxes and stacked bricks. Soft daylight, cement and tile textures, clean and lived-in.",
  "luz": "Luz natural suave, interiores, media tarde"
 }
}
```

### Paso 5 · Storyboard

*Molde `storyboard/3.4` · modelo opus-5 · 48 s · terminó 11/10 14:44 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 4** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 4
+++ vuelta 5
@@ -36,2 +36,4 @@
 UNA ACCIÓN POR ESCENA
+- Cada escena muestra el MOMENTO en que pasa lo que dice la frase, en presente (le vibra el teléfono y lee el pedido; abre
+  la app y aparecen los presupuestos), nunca a alguien contándole a otro, después, que eso pasó.
 - Cada escena filmada tiene UNA acción principal, con a lo sumo un gesto antes o después. Cinco acciones en cinco segundos
@@ -131,3 +133,3 @@
 Recién acá la historia se traduce a escenas y se comprueba que entra en 20 a 30 segundos. El "recorrido" de la ficha es un banco de posibilidades, nunca una orden de escenas ni un orden fijo.
-CAST: {"personajes":[{"id":"p1","nombre":"Vanina","rol":"Vecina de Villa Urquiza que necesita resolver una falla eléctrica en su casa y cuenta cómo pasó de mandar mensajes a ciegas a recibir presupuestos.","fisicoEn":"Woman around 38, olive skin, dark brown wavy hair tied in a loose low bun, strong eyebrows, small mole on left cheek, no makeup, tired but warm expression, relaxed posture, holds phone close to chest.","fisicoEs":"Mujer de unos 38, piel oliva, pelo castaño ondulado atado, cejas marcadas, gesto cansado y cálido.","vestuario":"Buzo gris de algodón, remera blanca, jean oscuro","vestuarioEn":"Grey cotton sweatshirt, white tee, dark jeans, no accessories","personalidad":"Práctica, franca","lugarEn":"Her narrow Buenos Aires apartment kitchen: tripped breaker panel open above the fridge, melted plug on an extension cord, half-finished mate on the tiled counter, and a shelf of hand-labeled jars of homemade pickles. Dim overhead light, grey window glow.","quien":"la vecina"},{"id":"p2","nombre":"Carla","rol":"Electricista matriculada del barrio que recibe el pedido en su bandeja y cotiza sin tener que esperar una recomendación.","fisicoEn":"Woman around 44, fair skin with freckles, short straight black hair with grey strands, square jaw, calloused hands, reading glasses pushed up on her head, confident upright stance, sleeves rolled to the elbow.","fisicoEs":"Mujer de unos 44, piel clara con pecas, pelo negro corto con canas, manos trabajadas, postura segura.","vestuario":"Camisa de trabajo azul, pantalón cargo, cinto portaherramientas","vestuarioEn":"Blue work shirt, cargo trousers, leather tool belt, work boots","personalidad":"Segura, resolutiva","lugarEn":"A half-built ground-floor unit she's wiring: open breaker panel with labeled wires, conduit and pliers on a sawhorse, bare brick and cement bag on the floor, plus her thermos and a worn chess magazine. Warm daylight from an unglazed window.","quien":"la electricista"}],"lugar":{"nombre":"Villa Urquiza: cocina de departamento y obra en planta baja","descripcionEn":"Two real Buenos Aires spaces: a tight apartment kitchen with tiled counter, open breaker panel and tube lighting; and an unfinished ground-floor unit with exposed brick, conduit runs, sawhorses and a wired panel. Soft, clean, documentary atmosphere.","luz":"Luz suave de ventana, sombras bajas, acabado limpio"}}
-GUION: [hook · dice: la vecina] Nadie me contesta. Le escribí a tres electricistas. (visual: En la cocina a media luz, aprieta la térmica saltada con una mano y en la otra sostiene el chat sin respuesta.) · [desarrollo · dice: la vecina] Esta vez lo conté una sola vez, con mis palabras. (visual: Apoyada en la mesada, tipea en el celular mientras 'Contar el problema' avanza paso a paso hasta 'Crear solicitud'.) · [desarrollo · dice: la electricista] A mí me llega el pedido de acá, de Villa Urquiza. Le paso el precio y listo. (visual: En la obra, deja la pinza sobre el tablero abierto y abre 'Bandeja de solicitudes', donde entra el pedido nuevo y pasa a COTIZADO.) · [giro · dice: la vecina] Abrí la app y los presupuestos ya estaban ahí. No perseguí a nadie. (visual: Sentada en el sillón con el mate en la mano, la tira 'TE ESPERAN TUS PROVEEDORES' se enciende con dos tarjetas.) · [cta · dice: placa] Reparé hoy. Contá qué hay que arreglar. (visual: Placa final con la marca sobre fondo limpio y la dirección web.)
+CAST: {"personajes":[{"id":"p1","nombre":"Mariela","rol":"Vecina de Villa Urquiza que publica la solicitud: la perspectiva de quien necesita el arreglo y recibe los presupuestos.","fisicoEn":"Woman around 44, warm olive skin, dark brown wavy hair tied back with loose strands, thick eyebrows, small mole on left cheek, tired but friendly eyes; wears a mustard knit cardigan over a grey tee, no makeup, calm everyday presence.","fisicoEs":"Mujer de 44, piel olivácea, pelo ondulado oscuro atado, lunar en mejilla, mirada cansada y amable.","vestuario":"Cárdigan mostaza, remera gris, jean, pantuflas de casa","vestuarioEn":"Mustard knit cardigan, grey tee, jeans, house slippers","personalidad":"Práctica, franca","lugarEn":"Her narrow back laundry room in a Villa Urquiza ground-floor house: open breaker panel with one switch flipped down, grey cement sink, clothes drying on a line, a shelf with a worn mate gourd and her collection of hand-painted thimbles. Grey daylight through a frosted window.","quien":"vecina de Villa Urquiza"},{"id":"p2","nombre":"Carina","rol":"Electricista matriculada de Villa Urquiza: la perspectiva de quien recibe el pedido con zona y oficio y cotiza el mismo día.","fisicoEn":"Woman around 36, light brown skin, black hair in a low ponytail, strong jaw, faint scar on right forearm, short clean nails, steady confident gaze; wears navy work shirt with sleeves rolled, amperometric clamp hanging on her neck, grounded practical presence.","fisicoEs":"Mujer de 36, piel morena clara, pelo negro atado, mirada firme, pinza amperométrica al cuello.","vestuario":"Camisa de trabajo azul, pantalón cargo, botines","vestuarioEn":"Navy work shirt, cargo trousers, safety boots","personalidad":"Resuelta, orgullosa","lugarEn":"A half-finished apartment job in Villa Urquiza: bare brick wall with conduit boxes, exposed cable ends taped off, her open toolbag with insulated pliers and a voltage tester on a hollow-brick stack, plus a small enamel cup of cold coffee. Dusty afternoon light from an unglazed window.","quien":"electricista de Villa Urquiza"}],"lugar":{"nombre":"Casa de PH y obra en Villa Urquiza","descripcionEn":"Two linked Buenos Aires interiors: a ground-floor PH with tiled passage, laundry breaker panel and small kitchen with a kettle; and a nearby renovation flat with bare brick, conduit boxes and stacked bricks. Soft daylight, cement and tile textures, clean and lived-in.","luz":"Luz natural suave, interiores, media tarde"}}
+GUION: [hook · dice: vecina de Villa Urquiza] Nadie me contesta. Tres días con la térmica saltando. (visual: En el lavadero sube la térmica del tablero y vuelve a caer; en la otra mano, el chat sin respuestas.) · [desarrollo · dice: vecina de Villa Urquiza] Me senté a escribir qué me pasaba y lo publiqué ahí mismo. (visual: Sentada en el pasillo, escribe en el celular qué le pasa y la pantalla Contar el problema avanza hasta '¡Solicitud publicada!'.) · [desarrollo · dice: electricista de Villa Urquiza] Me llegó el pedido: térmica que salta, acá en Villa Urquiza. Le pasé el precio ese día. (visual: En la obra, con la pinza amperométrica al cuello, abre Bandeja de solicitudes y el pedido nuevo pasa a COTIZADO.) · [giro · dice: vecina de Villa Urquiza] No perseguí a nadie. Los presupuestos llegaron a mi pantalla. (visual: Deja la pava en la cocina y en su inicio se enciende 'TE ESPERAN TUS PROVEEDORES' con dos tarjetas.) · [cta · dice: placa] Reparé hoy: contá qué hay que arreglar. (visual: Placa final limpia con la marca y la dirección web.)
```

**Lo que devolvió:**

```json
[
 {
  "n": 1,
  "rol": "hook",
  "durSec": 5,
  "plano": "medium shot",
  "angulo": "Frontal a la altura del pecho, tablero visible a la izquierda",
  "personajes": [
   "p1"
  ],
  "accion": "Mariela sube la llave del tablero, vuelve a caer sola, y levanta el celular con un chat de mensajes sin respuesta.",
  "accionEn": "Mariela is already talking to camera as she reaches up and pushes the flipped breaker switch back up on the open panel in her narrow laundry room; the switch snaps down again by itself with a dry click. Without pausing she lifts her phone in the other hand toward the lens, a plain chat of sent messages with no replies, and shrugs, annoyed. Clothes drip on the line, distant street traffic.",
  "dialogo": "Nadie me contesta. Tres días con la térmica saltando.",
  "continuidad": "",
  "pantalla": "",
  "durSecModelo": 8
 },
 {
  "n": 2,
  "rol": "desarrollo",
  "durSec": 6,
  "plano": "medium close-up",
  "angulo": "Lateral, sentada en el escalón del pasillo",
  "personajes": [
   "p1"
  ],
  "accion": "Sentada en el pasillo con el celular apoyado en la rodilla, Mariela cuenta lo que le pasa y suelta los hombros al terminar.",
  "accionEn": "Mariela sits on the step of the tiled passage, phone resting on her knee, already speaking half to herself as she settles her back against the wall and tilts the phone up with her palm. She talks the way someone dictates a complaint, nodding once, then drops her shoulders with relief and sets the phone down on her thigh. Faint kettle noise from the kitchen.",
  "dialogo": "Me senté a escribir qué me pasaba y lo publiqué ahí mismo.",
  "continuidad": "Mismo cárdigan mostaza, pelo atado",
  "pantalla": "",
  "durSecModelo": 8
 },
 {
  "n": 3,
  "rol": "desarrollo",
  "durSec": 3,
  "plano": "medium shot",
  "angulo": "Inserto de interfaz",
  "personajes": [],
  "accion": "La barra de pasos avanza, se completa el resumen y aparece el aviso de solicitud publicada para los proveedores de la zona.",
  "accionEn": "",
  "dialogo": "",
  "continuidad": "",
  "pantalla": "Contar el problema",
  "archivoCaptura": "screens/01-cliente-contar-el-problema.png"
 },
 {
  "n": 4,
  "rol": "desarrollo",
  "durSec": 7,
  "plano": "over-the-shoulder",
  "angulo": "Desde atrás del hombro, pared de ladrillo al fondo",
  "personajes": [
   "p2"
  ],
  "accion": "Carina se endereza en la obra, se gira hacia su ayudante fuera de cuadro y apoya el celular sobre la pila de ladrillos.",
  "accionEn": "Carina is already talking as she straightens up from her open toolbag on the hollow-brick stack in the half-finished Villa Urquiza flat, amperometric clamp swinging on her neck. She turns her head toward someone off-camera to her right while her other hand sets the phone face-down on the bricks, then she picks up the insulated pliers and taps them against her palm, pleased. Dusty light, a radio playing far off.",
  "dialogo": "Me llegó el pedido: térmica que salta, acá en Villa Urquiza. Le pasé el precio ese día.",
  "continuidad": "",
  "pantalla": "",
  "durSecModelo": 8
 },
 {
  "n": 5,
  "rol": "desarrollo",
  "durSec": 3,
  "plano": "medium shot",
  "angulo": "Inserto de interfaz",
  "personajes": [],
  "accion": "Entra arriba el pedido nuevo como pendiente de cotizar y, al cotizarlo, pasa a la pastilla COTIZADO con su monto.",
  "accionEn": "",
  "dialogo": "",
  "continuidad": "",
  "pantalla": "Bandeja de solicitudes",
  "archivoCaptura": "screens/05-proveedor-bandeja-de-solicitudes.png"
 },
 {
  "n": 6,
  "rol": "giro",
  "durSec": 5,
  "plano": "close-up",
  "angulo": "Frontal cerrado, cocina detrás",
  "personajes": [
   "p1"
  ],
  "accion": "Mariela deja la pava en la hornalla de la cocina, se gira a cámara y pasa del fastidio al alivio.",
  "accionEn": "Mariela is already speaking to camera as she lowers the kettle onto the kitchen burner with both hands and lets go. She turns her face toward the lens, eyebrows lifting, the earlier irritation melting into a small satisfied smile, and leans her hip against the counter. Steam curls behind her, the kettle base ticks against the metal grid.",
  "dialogo": "No perseguí a nadie. Los presupuestos llegaron a mi pantalla.",
  "continuidad": "Mismo cárdigan mostaza, misma tarde",
  "pantalla": "",
  "durSecModelo": 8
 },
 {
  "n": 7,
  "rol": "giro",
  "durSec": 3,
  "plano": "medium shot",
  "angulo": "Inserto de interfaz",
  "personajes": [],
  "accion": "En el inicio aparece 'TE ESPERAN TUS PROVEEDORES' con una tarjeta y se suma la segunda al lado.",
  "accionEn": "",
  "dialogo": "",
  "continuidad": "",
  "pantalla": "Te esperan tus proveedores",
  "archivoCaptura": "screens/02-cliente-te-esperan-tus-proveedores.png"
 },
 {
  "n": 8,
  "rol": "cta",
  "durSec": 3,
  "plano": "wide shot",
  "angulo": "Placa final",
  "personajes": [],
  "accion": "Placa limpia con la marca: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar",
  "accionEn": "",
  "dialogo": "",
  "continuidad": "",
  "pantalla": ""
 }
]
```

### Paso 6 · Pedidos a Flow

*Molde `flowpack/3.1-compilado` · modelo sonnet-5 · 5 s · terminó 11/10 14:44 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 4** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 4
+++ vuelta 5
@@ -1,5 +1,5 @@
 Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Respetá el género de quien está en cuadro (lo dice el paréntesis, que no se traduce ni se copia). Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.
-3| Se ven los cuatro pasos de 'Contar el problema' avanzando hasta el resumen y 'Crear solicitud', que pasa a 'Publicando…'.
-5| Entra arriba el pedido nuevo como pendiente de cotizar y, al cotizar, pasa a la pastilla COTIZADO con su monto.
-7| La home arranca sin la tira, llega el primer presupuesto y aparece 'TE ESPERAN TUS PROVEEDORES'; llega el segundo y se suma al lado.
-8| Placa final sobre fondo limpio: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
+3| La barra de pasos avanza, se completa el resumen y aparece el aviso de solicitud publicada para los proveedores de la zona.
+5| Entra arriba el pedido nuevo como pendiente de cotizar y, al cotizarlo, pasa a la pastilla COTIZADO con su monto.
+7| En el inicio aparece 'TE ESPERAN TUS PROVEEDORES' con una tarjeta y se suma la segunda al lado.
+8| Placa limpia con la marca: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
```

**Lo que devolvió:**

```json
{
 "estilo": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect.",
 "personajes": [
  {
   "id": "p1",
   "nombre": "Mariela",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 44, warm olive skin, dark brown wavy hair tied back with loose strands, thick eyebrows, small mole on left cheek, tired but friendly eyes; wears a mustard knit cardigan over a grey tee, no makeup, calm everyday presence, standing and looking at the camera, natural pose, neutral background with a hint of two linked buenos aires interiors: a ground-floor ph with tiled passage. A still photo, no action, no dialogue."
  },
  {
   "id": "p2",
   "nombre": "Carina",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 36, light brown skin, black hair in a low ponytail, strong jaw, faint scar on right forearm, short clean nails, steady confident gaze; wears navy work shirt with sleeves rolled, amperometric clamp hanging on her neck, grounded practical presence, standing and looking at the camera, natural pose, neutral background with a hint of two linked buenos aires interiors: a ground-floor ph with tiled passage. A still photo, no action, no dialogue."
  }
 ],
 "escenas": [
  {
   "escenaN": 1,
   "rol": "hook",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Mariela, an Argentine woman around 44, warm olive skin, dark brown wavy hair tied back with loose strands, thick eyebrows, wearing Mustard knit cardigan, grey tee, jeans, house slippers. Mariela is already talking to camera as she reaches up and pushes the flipped breaker switch back up on the open panel in her narrow laundry room; the switch snaps down again by itself with a dry click. Without pausing she lifts her phone in the other hand toward the lens, a plain chat of sent messages with no replies, and shrugs, annoyed. Clothes drip on the line, distant street traffic. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Nadie me contesta. Tres días con la térmica saltando.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never recreate the brand app interface. A generic messaging chat may be visible on the phone (sent bubbles with no replies) but its text is never legible. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 2,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Mariela, an Argentine woman around 44, warm olive skin, dark brown wavy hair tied back with loose strands, thick eyebrows, wearing Mustard knit cardigan, grey tee, jeans, house slippers. Mariela sits on the step of the tiled passage, phone resting on her knee, already speaking half to herself as she settles her back against the wall and tilts the phone up with her palm. She talks the way someone dictates a complaint, nodding once, then drops her shoulders with relief and sets the phone down on her thigh. Faint kettle noise from the kitchen. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Me senté a escribir qué me pasaba y lo publiqué ahí mismo.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 4,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Carina, an Argentine woman around 36, light brown skin, black hair in a low ponytail, strong jaw, wearing Navy work shirt, cargo trousers, safety boots. Carina is already talking as she straightens up from her open toolbag on the hollow-brick stack in the half-finished Villa Urquiza flat, amperometric clamp swinging on her neck. She turns her head toward someone off-camera to her right while her other hand sets the phone face-down on the bricks, then she picks up the insulated pliers and taps them against her palm, pleased. Dusty light, a radio playing far off. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Me llegó el pedido: térmica que salta, acá en Villa Urquiza. Le pasé el precio ese día.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Over-the-shoulder shot, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 6,
   "rol": "giro",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Mariela, an Argentine woman around 44, warm olive skin, dark brown wavy hair tied back with loose strands, thick eyebrows, wearing Mustard knit cardigan, grey tee, jeans, house slippers. Mariela is already speaking to camera as she lowers the kettle onto the kitchen burner with both hands and lets go. She turns her face toward the lens, eyebrows lifting, the earlier irritation melting into a small satisfied smile, and leans her hip against the counter. Steam curls behind her, the kettle base ticks against the metal grid. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'No perseguí a nadie. Los presupuestos llegaron a mi pantalla.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Close-up on the face and hands, natural handheld feel, shallow depth of field. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  }
 ],
 "huecos": [],
 "version": "flowpack/3.0-compilado"
}
```

---

## Vuelta 6

**Qué cambió en las reglas:** Frases en presente, dichas en el momento. La placa con la marca escrita. El giro es la reacción al resultado.

- Juez de la pieza (ChatGPT): VEREDICTO: TIENE POTENCIAL — 6,5/10
- Juez de la materia prima (ChatGPT): Nota de la materia prima: 7,5/10

Estrategia y concepto: los mismos de la vuelta 0.

### Paso 3 · Guion

*Molde `script/3.5` · modelo opus-5 · 41 s · terminó 11/10 14:46 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 5** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 5
+++ vuelta 6
@@ -67,3 +67,3 @@
 - giro: el momento en que el beneficio se VE en la vida de la persona (qué cambió para ella), no una descripción de la app.
-- cta: lo dice la PLACA final del montaje (texto en pantalla con la marca y la dirección; no se filma): "quien" = "placa" y "narration" = el texto de la placa, como máximo 8 palabras, sin la dirección web (la placa la agrega).
+- cta: lo dice la PLACA final del montaje (texto en pantalla con la marca y la dirección; no se filma): "quien" = "placa" y "narration" = el texto de la placa, como máximo 8 palabras, con la marca ESCRITA como se escribe (no como se pronuncia) y sin la dirección web (la placa la agrega). Que retome la promesa de la pieza.
 - ORDEN: sigue la causa. Primero lo que le pasa a quien necesita, después lo que hace, después quién lo recibe y responde, al final lo que gana. Nada aparece antes de lo que lo provoca.
@@ -79,3 +79,6 @@
 - Una sola persona por bloque. Si hablan dos, son dos bloques.
-- Lo que dice tiene que ser verosímil en SU boca: cada uno cuenta lo que le pasó a él, con sus palabras.
+- Lo que dice tiene que ser verosímil en SU boca, con sus palabras.
+- Se dice EN EL MOMENTO en que pasa, en presente: lo que a alguien se le escapa mientras le pasa (una reacción, un
+  comentario a quien tiene al lado, lo que piensa en voz alta). Nunca un relato posterior en pasado ("me pasó tal cosa y
+  después hice tal otra"): un relato convierte la escena en una cara contando. Sólo el gancho puede ser a cámara.
 - Si la historia tiene dos lados, lo que uno necesita es exactamente lo que el otro hace (mismo oficio, mismo problema): si no, el pedido de uno nunca le llega al otro.
```

**Lo que devolvió:**

```json
{
 "blocks": [
  {
   "role": "hook",
   "quien": "vecina de Villa Urquiza",
   "narration": "Nadie me contesta. Mandé seis mensajes por la térmica.",
   "visual": "En el pasillo, con el tablero abierto y la linterna del celular prendida, baja la lista de chats sin respuesta.",
   "durSec": 4
  },
  {
   "role": "desarrollo",
   "quien": "",
   "narration": "",
   "visual": "Apoya el celular en la mesada y escribe lo que le pasa en la pantalla Contar el problema, hasta que la barra de pasos llega a Crear solicitud.",
   "durSec": 5
  },
  {
   "role": "desarrollo",
   "quien": "electricista",
   "narration": "Me entra uno de Villa Urquiza, la térmica. Le paso el precio hoy.",
   "visual": "En la obra, deja la pinza sobre el caballete y abre la Bandeja de solicitudes con el pedido nuevo arriba.",
   "durSec": 7
  },
  {
   "role": "giro",
   "quien": "vecina de Villa Urquiza",
   "narration": "Entraron solos los presupuestos. No llamé a nadie más.",
   "visual": "Con el mate en la mano abre la app y aparece la tira Te esperan tus proveedores con las tarjetas que llegaron.",
   "durSec": 5
  },
  {
   "role": "cta",
   "quien": "placa",
   "narration": "RepareHoy: contá el problema, llegan los presupuestos.",
   "visual": "Placa final sobre fondo limpio con la marca y la dirección web.",
   "durSec": 5
  }
 ],
 "music": {
  "mood": "cálido, cercano"
 }
}
```

### Paso 4 · Personajes

*Molde `cast/2.2` · modelo opus-5 · 18 s · terminó 11/10 14:46 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 5** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 5
+++ vuelta 6
@@ -72,2 +72,2 @@
 CONCEPTO: {"id":"c3","topico":"El pedido que llega","tipoGancho":"DEMOSTRACIÓN DIRECTA","idea":"Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.","tono":"Directo, profesional, orgulloso sin grandilocuencia; charla real","estetica":"Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo","referencia":"Testimonial ficcional de dos voces con demo de producto","porQueFunciona":"Dos voces explican el mismo alivio y la interfaz lo confirma al instante."}
-GUION: [hook · dice: vecina de Villa Urquiza] Nadie me contesta. Tres días con la térmica saltando. (visual: En el lavadero sube la térmica del tablero y vuelve a caer; en la otra mano, el chat sin respuestas.) · [desarrollo · dice: vecina de Villa Urquiza] Me senté a escribir qué me pasaba y lo publiqué ahí mismo. (visual: Sentada en el pasillo, escribe en el celular qué le pasa y la pantalla Contar el problema avanza hasta '¡Solicitud publicada!'.) · [desarrollo · dice: electricista de Villa Urquiza] Me llegó el pedido: térmica que salta, acá en Villa Urquiza. Le pasé el precio ese día. (visual: En la obra, con la pinza amperométrica al cuello, abre Bandeja de solicitudes y el pedido nuevo pasa a COTIZADO.) · [giro · dice: vecina de Villa Urquiza] No perseguí a nadie. Los presupuestos llegaron a mi pantalla. (visual: Deja la pava en la cocina y en su inicio se enciende 'TE ESPERAN TUS PROVEEDORES' con dos tarjetas.) · [cta · dice: placa] Reparé hoy: contá qué hay que arreglar. (visual: Placa final limpia con la marca y la dirección web.)
+GUION: [hook · dice: vecina de Villa Urquiza] Nadie me contesta. Mandé seis mensajes por la térmica. (visual: En el pasillo, con el tablero abierto y la linterna del celular prendida, baja la lista de chats sin respuesta.) · [desarrollo]  (visual: Apoya el celular en la mesada y escribe lo que le pasa en la pantalla Contar el problema, hasta que la barra de pasos llega a Crear solicitud.) · [desarrollo · dice: electricista] Me entra uno de Villa Urquiza, la térmica. Le paso el precio hoy. (visual: En la obra, deja la pinza sobre el caballete y abre la Bandeja de solicitudes con el pedido nuevo arriba.) · [giro · dice: vecina de Villa Urquiza] Entraron solos los presupuestos. No llamé a nadie más. (visual: Con el mate en la mano abre la app y aparece la tira Te esperan tus proveedores con las tarjetas que llegaron.) · [cta · dice: placa] RepareHoy: contá el problema, llegan los presupuestos. (visual: Placa final sobre fondo limpio con la marca y la dirección web.)
```

**Lo que devolvió:**

```json
{
 "personajes": [
  {
   "id": "p1",
   "nombre": "Mariela",
   "rol": "Vecina de Villa Urquiza que publica la solicitud: la perspectiva de quien necesita el arreglo y recibe los presupuestos",
   "fisicoEn": "Woman around 42, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles across her cheeks, tired but friendly brown eyes, no makeup, reading glasses pushed up on her head, calm everyday presence.",
   "fisicoEs": "Mujer de 42, piel oliva, pelo ondulado oscuro atado, pecas, mirada cansada y amable",
   "vestuario": "Buzo gris de algodón, jean, medias de lana",
   "vestuarioEn": "Grey cotton sweatshirt, blue jeans, thick wool socks",
   "personalidad": "Práctica, cansada",
   "lugarEn": "Her own narrow tiled hallway in a Buenos Aires casa chorizo: open electrical panel with blackened breaker, dead ceiling bulb, phone flashlight propped on a stack of folded laundry, half-finished crochet blanket on a wicker chair.",
   "quien": "vecina de Villa Urquiza"
  },
  {
   "id": "p2",
   "nombre": "Carolina",
   "rol": "Electricista matriculada que recibe la solicitud en su bandeja y manda el presupuesto: la perspectiva de quien organiza y resuelve",
   "fisicoEn": "Woman around 35, light brown skin, black hair pulled into a tight low bun, strong eyebrows, small scar on her left hand, direct confident gaze, lean build, proud relaxed posture.",
   "fisicoEs": "Mujer de 35, piel morena clara, pelo negro recogido, mirada segura, postura firme",
   "vestuario": "Camisa de trabajo azul, cinturón portaherramientas",
   "vestuarioEn": "Blue work shirt, tool belt, dusty dark work trousers",
   "personalidad": "Resuelta, orgullosa",
   "lugarEn": "A half-built room she is wiring: exposed brick wall, hanging cables and a wooden caballete with pliers and a voltage tester, afternoon light through unglazed window, her thermos and mate gourd on a paint bucket, union sticker on her tool case.",
   "quien": "electricista"
  }
 ],
 "lugar": {
  "nombre": "Casa chorizo de Villa Urquiza en obra",
  "descripcionEn": "A long narrow Buenos Aires casa chorizo: patterned calcareous floor tiles, open electrical panel on the hallway wall, a room under renovation with exposed brick, hanging cables, a wooden trestle holding pliers and tester, bags of cement by the door.",
  "luz": "Luz suave de tarde, sombras cálidas"
 }
}
```

### Paso 5 · Storyboard

*Molde `storyboard/3.5` · modelo opus-5 · 21 s · terminó 11/10 14:47 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 5** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 5
+++ vuelta 6
@@ -38,2 +38,4 @@
   la app y aparecen los presupuestos), nunca a alguien contándole a otro, después, que eso pasó.
+- En el giro, la escena ES la reacción al resultado (la sorpresa, el alivio en la cara al ver el teléfono), no una tarea
+  de la casa con la reacción de fondo.
 - Cada escena filmada tiene UNA acción principal, con a lo sumo un gesto antes o después. Cinco acciones en cinco segundos
@@ -133,3 +135,3 @@
 Recién acá la historia se traduce a escenas y se comprueba que entra en 20 a 30 segundos. El "recorrido" de la ficha es un banco de posibilidades, nunca una orden de escenas ni un orden fijo.
-CAST: {"personajes":[{"id":"p1","nombre":"Mariela","rol":"Vecina de Villa Urquiza que publica la solicitud: la perspectiva de quien necesita el arreglo y recibe los presupuestos.","fisicoEn":"Woman around 44, warm olive skin, dark brown wavy hair tied back with loose strands, thick eyebrows, small mole on left cheek, tired but friendly eyes; wears a mustard knit cardigan over a grey tee, no makeup, calm everyday presence.","fisicoEs":"Mujer de 44, piel olivácea, pelo ondulado oscuro atado, lunar en mejilla, mirada cansada y amable.","vestuario":"Cárdigan mostaza, remera gris, jean, pantuflas de casa","vestuarioEn":"Mustard knit cardigan, grey tee, jeans, house slippers","personalidad":"Práctica, franca","lugarEn":"Her narrow back laundry room in a Villa Urquiza ground-floor house: open breaker panel with one switch flipped down, grey cement sink, clothes drying on a line, a shelf with a worn mate gourd and her collection of hand-painted thimbles. Grey daylight through a frosted window.","quien":"vecina de Villa Urquiza"},{"id":"p2","nombre":"Carina","rol":"Electricista matriculada de Villa Urquiza: la perspectiva de quien recibe el pedido con zona y oficio y cotiza el mismo día.","fisicoEn":"Woman around 36, light brown skin, black hair in a low ponytail, strong jaw, faint scar on right forearm, short clean nails, steady confident gaze; wears navy work shirt with sleeves rolled, amperometric clamp hanging on her neck, grounded practical presence.","fisicoEs":"Mujer de 36, piel morena clara, pelo negro atado, mirada firme, pinza amperométrica al cuello.","vestuario":"Camisa de trabajo azul, pantalón cargo, botines","vestuarioEn":"Navy work shirt, cargo trousers, safety boots","personalidad":"Resuelta, orgullosa","lugarEn":"A half-finished apartment job in Villa Urquiza: bare brick wall with conduit boxes, exposed cable ends taped off, her open toolbag with insulated pliers and a voltage tester on a hollow-brick stack, plus a small enamel cup of cold coffee. Dusty afternoon light from an unglazed window.","quien":"electricista de Villa Urquiza"}],"lugar":{"nombre":"Casa de PH y obra en Villa Urquiza","descripcionEn":"Two linked Buenos Aires interiors: a ground-floor PH with tiled passage, laundry breaker panel and small kitchen with a kettle; and a nearby renovation flat with bare brick, conduit boxes and stacked bricks. Soft daylight, cement and tile textures, clean and lived-in.","luz":"Luz natural suave, interiores, media tarde"}}
-GUION: [hook · dice: vecina de Villa Urquiza] Nadie me contesta. Tres días con la térmica saltando. (visual: En el lavadero sube la térmica del tablero y vuelve a caer; en la otra mano, el chat sin respuestas.) · [desarrollo · dice: vecina de Villa Urquiza] Me senté a escribir qué me pasaba y lo publiqué ahí mismo. (visual: Sentada en el pasillo, escribe en el celular qué le pasa y la pantalla Contar el problema avanza hasta '¡Solicitud publicada!'.) · [desarrollo · dice: electricista de Villa Urquiza] Me llegó el pedido: térmica que salta, acá en Villa Urquiza. Le pasé el precio ese día. (visual: En la obra, con la pinza amperométrica al cuello, abre Bandeja de solicitudes y el pedido nuevo pasa a COTIZADO.) · [giro · dice: vecina de Villa Urquiza] No perseguí a nadie. Los presupuestos llegaron a mi pantalla. (visual: Deja la pava en la cocina y en su inicio se enciende 'TE ESPERAN TUS PROVEEDORES' con dos tarjetas.) · [cta · dice: placa] Reparé hoy: contá qué hay que arreglar. (visual: Placa final limpia con la marca y la dirección web.)
+CAST: {"personajes":[{"id":"p1","nombre":"Mariela","rol":"Vecina de Villa Urquiza que publica la solicitud: la perspectiva de quien necesita el arreglo y recibe los presupuestos","fisicoEn":"Woman around 42, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles across her cheeks, tired but friendly brown eyes, no makeup, reading glasses pushed up on her head, calm everyday presence.","fisicoEs":"Mujer de 42, piel oliva, pelo ondulado oscuro atado, pecas, mirada cansada y amable","vestuario":"Buzo gris de algodón, jean, medias de lana","vestuarioEn":"Grey cotton sweatshirt, blue jeans, thick wool socks","personalidad":"Práctica, cansada","lugarEn":"Her own narrow tiled hallway in a Buenos Aires casa chorizo: open electrical panel with blackened breaker, dead ceiling bulb, phone flashlight propped on a stack of folded laundry, half-finished crochet blanket on a wicker chair.","quien":"vecina de Villa Urquiza"},{"id":"p2","nombre":"Carolina","rol":"Electricista matriculada que recibe la solicitud en su bandeja y manda el presupuesto: la perspectiva de quien organiza y resuelve","fisicoEn":"Woman around 35, light brown skin, black hair pulled into a tight low bun, strong eyebrows, small scar on her left hand, direct confident gaze, lean build, proud relaxed posture.","fisicoEs":"Mujer de 35, piel morena clara, pelo negro recogido, mirada segura, postura firme","vestuario":"Camisa de trabajo azul, cinturón portaherramientas","vestuarioEn":"Blue work shirt, tool belt, dusty dark work trousers","personalidad":"Resuelta, orgullosa","lugarEn":"A half-built room she is wiring: exposed brick wall, hanging cables and a wooden caballete with pliers and a voltage tester, afternoon light through unglazed window, her thermos and mate gourd on a paint bucket, union sticker on her tool case.","quien":"electricista"}],"lugar":{"nombre":"Casa chorizo de Villa Urquiza en obra","descripcionEn":"A long narrow Buenos Aires casa chorizo: patterned calcareous floor tiles, open electrical panel on the hallway wall, a room under renovation with exposed brick, hanging cables, a wooden trestle holding pliers and tester, bags of cement by the door.","luz":"Luz suave de tarde, sombras cálidas"}}
+GUION: [hook · dice: vecina de Villa Urquiza] Nadie me contesta. Mandé seis mensajes por la térmica. (visual: En el pasillo, con el tablero abierto y la linterna del celular prendida, baja la lista de chats sin respuesta.) · [desarrollo]  (visual: Apoya el celular en la mesada y escribe lo que le pasa en la pantalla Contar el problema, hasta que la barra de pasos llega a Crear solicitud.) · [desarrollo · dice: electricista] Me entra uno de Villa Urquiza, la térmica. Le paso el precio hoy. (visual: En la obra, deja la pinza sobre el caballete y abre la Bandeja de solicitudes con el pedido nuevo arriba.) · [giro · dice: vecina de Villa Urquiza] Entraron solos los presupuestos. No llamé a nadie más. (visual: Con el mate en la mano abre la app y aparece la tira Te esperan tus proveedores con las tarjetas que llegaron.) · [cta · dice: placa] RepareHoy: contá el problema, llegan los presupuestos. (visual: Placa final sobre fondo limpio con la marca y la dirección web.)
```

**Lo que devolvió:**

```json
{
 "escenas": [
  {
   "n": 1,
   "rol": "hook",
   "durSec": 5,
   "plano": "medium close-up",
   "angulo": "Levemente lateral, a la altura del hombro",
   "personajes": [
    "p1"
   ],
   "accion": "En el pasillo, frente al tablero abierto con la térmica tiznada, Mariela baja la lista de chats sin respuesta y se gira a cámara, resignada.",
   "accionEn": "Mariela stands in her narrow tiled hallway beside the open electrical panel with its blackened breaker, her phone flashlight propped on folded laundry lighting her face from below. Already talking as she scrolls down a list of sent messages with no replies, she tilts the screen away, turns toward the camera and lifts her eyebrows in tired resignation. Dead ceiling bulb above her, faint street traffic outside.",
   "dialogo": "Nadie me contesta. Mandé seis mensajes por la térmica.",
   "continuidad": "",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 2,
   "rol": "desarrollo",
   "durSec": 3,
   "plano": "medium shot",
   "angulo": "Frontal a la pantalla",
   "personajes": [],
   "accion": "Se eligen el rubro, la zona y la descripción; la barra de pasos avanza hasta el resumen y queda en Crear solicitud.",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": "Contar el problema",
   "archivoCaptura": "screens/01-cliente-contar-el-problema.png"
  },
  {
   "n": 3,
   "rol": "desarrollo",
   "durSec": 6,
   "plano": "over-the-shoulder",
   "angulo": "Desde atrás del hombro, bajando al caballete",
   "personajes": [
    "p2"
   ],
   "accion": "Carolina deja la pinza sobre el caballete, levanta el celular y le habla a su ayudante fuera de cuadro; asiente al ver el pedido nuevo.",
   "accionEn": "Carolina works in the half-built room she is wiring, exposed brick behind her, cables hanging, afternoon light through the unglazed window. Already speaking to an assistant off camera, she sets her pliers down on the wooden caballete, picks up her phone from beside the thermos and mate gourd, glances at the screen and nods once, decided. Distant hammering and a radio in the background.",
   "dialogo": "Me entra uno de Villa Urquiza, la térmica. Le paso el precio hoy.",
   "continuidad": "",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 4,
   "rol": "giro",
   "durSec": 5,
   "plano": "medium close-up",
   "angulo": "Frontal, ligeramente bajo",
   "personajes": [
    "p1"
   ],
   "accion": "Con el mate en la mano, Mariela abre la app apoyada en la mesada del pasillo; se le afloja la cara al ver los presupuestos que entraron.",
   "accionEn": "Mariela leans against the hallway counter near the open panel, wool socks on the patterned tiles, mate gourd in one hand. Already talking for herself as she lifts her phone with the other hand and looks at it, she straightens up, lets out a small surprised laugh and shakes her head slowly, the tiredness leaving her face. The crochet blanket and wicker chair behind her, warm late afternoon light.",
   "dialogo": "Entraron solos los presupuestos. No llamé a nadie más.",
   "continuidad": "Mismo buzo gris, mismo pasillo y luz de tarde",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 5,
   "rol": "giro",
   "durSec": 3,
   "plano": "medium shot",
   "angulo": "Frontal a la pantalla",
   "personajes": [],
   "accion": "Llega el primer presupuesto y aparece la tira Te esperan tus proveedores; se suma la segunda tarjeta al lado.",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": "Te esperan tus proveedores",
   "archivoCaptura": "screens/02-cliente-te-esperan-tus-proveedores.png"
  },
  {
   "n": 6,
   "rol": "cta",
   "durSec": 3,
   "plano": "wide shot",
   "angulo": "Placa fija",
   "personajes": [],
   "accion": "Placa final sobre fondo limpio: RepareHoy. Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": ""
  }
 ]
}
```

### Paso 6 · Pedidos a Flow

*Molde `flowpack/3.1-compilado` · modelo sonnet-5 · 5 s · terminó 11/10 14:47 (hora argentina)*

**Qué cambió en el pedido respecto de la vuelta 5** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 5
+++ vuelta 6
@@ -1,5 +1,4 @@
 Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Respetá el género de quien está en cuadro (lo dice el paréntesis, que no se traduce ni se copia). Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.
-3| La barra de pasos avanza, se completa el resumen y aparece el aviso de solicitud publicada para los proveedores de la zona.
-5| Entra arriba el pedido nuevo como pendiente de cotizar y, al cotizarlo, pasa a la pastilla COTIZADO con su monto.
-7| En el inicio aparece 'TE ESPERAN TUS PROVEEDORES' con una tarjeta y se suma la segunda al lado.
-8| Placa limpia con la marca: Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
+2| Se eligen el rubro, la zona y la descripción; la barra de pasos avanza hasta el resumen y queda en Crear solicitud.
+5| Llega el primer presupuesto y aparece la tira Te esperan tus proveedores; se suma la segunda tarjeta al lado.
+6| Placa final sobre fondo limpio: RepareHoy. Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
```

**Lo que devolvió:**

```json
{
 "estilo": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect.",
 "personajes": [
  {
   "id": "p1",
   "nombre": "Mariela",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 42, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles across her cheeks, tired but friendly brown eyes, no makeup, reading glasses pushed up on her head, calm everyday presence, standing and looking at the camera, natural pose, neutral background with a hint of a long narrow buenos aires casa chorizo: patterned calcareous floor tiles. A still photo, no action, no dialogue."
  },
  {
   "id": "p2",
   "nombre": "Carolina",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine Woman around 35, light brown skin, black hair pulled into a tight low bun, strong eyebrows, small scar on her left hand, direct confident gaze, lean build, proud relaxed posture, standing and looking at the camera, natural pose, neutral background with a hint of a long narrow buenos aires casa chorizo: patterned calcareous floor tiles. A still photo, no action, no dialogue."
  }
 ],
 "escenas": [
  {
   "escenaN": 1,
   "rol": "hook",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Mariela, an Argentine woman around 42, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles across her cheeks, wearing Grey cotton sweatshirt, blue jeans, thick wool socks. Mariela stands in her narrow tiled hallway beside the open electrical panel with its blackened breaker, her phone flashlight propped on folded laundry lighting her face from below. Already talking as she scrolls down a list of sent messages with no replies, she tilts the screen away, turns toward the camera and lifts her eyebrows in tired resignation. Dead ceiling bulb above her, faint street traffic outside. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Nadie me contesta. Mandé seis mensajes por la térmica.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never recreate the brand app interface. A generic messaging chat may be visible on the phone (sent bubbles with no replies) but its text is never legible. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 3,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Carolina, an Argentine woman around 35, light brown skin, black hair pulled into a tight low bun, strong eyebrows, wearing Blue work shirt, tool belt, dusty dark work trousers. Carolina works in the half-built room she is wiring, exposed brick behind her, cables hanging, afternoon light through the unglazed window. Already speaking to an assistant off camera, she sets her pliers down on the wooden caballete, picks up her phone from beside the thermos and mate gourd, glances at the screen and nods once, decided. Distant hammering and a radio in the background. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Me entra uno de Villa Urquiza, la térmica. Le paso el precio hoy.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Over-the-shoulder shot, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 4,
   "rol": "giro",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Mariela, an Argentine woman around 42, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles across her cheeks, wearing Grey cotton sweatshirt, blue jeans, thick wool socks. Mariela leans against the hallway counter near the open panel, wool socks on the patterned tiles, mate gourd in one hand. Already talking for herself as she lifts her phone with the other hand and looks at it, she straightens up, lets out a small surprised laugh and shakes her head slowly, the tiredness leaving her face. The crochet blanket and wicker chair behind her, warm late afternoon light. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Entraron solos los presupuestos. No llamé a nadie más.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium close-up, chest up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  }
 ],
 "huecos": [],
 "version": "flowpack/3.0-compilado"
}
```

---

## Vuelta 7

**Qué cambió en las reglas:** Física de la escena (cada objeto en un solo lugar). Emoción simple. La frase después de lo que la provoca.

- Juez de la pieza (ChatGPT): VEREDICTO: 7/10 — Tiene potencial, pero está demasiado explicado y poco vendido.
- Juez de la materia prima (ChatGPT): Nota: 7/10
- Gemini 5,5/10 · Qwen 6/10

Estrategia y concepto: los mismos de la vuelta 0.

### Paso 3 · Guion

*Molde `script/3.5` · modelo opus-5 · 37 s · terminó 11/10 14:49 (hora argentina)*

**Pedido enviado al modelo (completo, versión final):**

```text
Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: escribí el GUION. No adelantes casting, planos ni decisiones técnicas del storyboard. Usá únicamente los hechos provistos; si un dato no está, no lo inventes.

Actuás como promo-director. Convertí el CONCEPTO ELEGIDO en un comercial de 26s para una pieza 9:16 para Instagram / TikTok, tono cercano.
CONCEPTO ELEGIDO (es la dirección creativa; no lo reemplaces por otra idea): {"id":"c3","topico":"El pedido que llega","tipoGancho":"DEMOSTRACIÓN DIRECTA","idea":"Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.","tono":"Directo, profesional, orgulloso sin grandilocuencia; charla real","estetica":"Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo","referencia":"Testimonial ficcional de dos voces con demo de producto","porQueFunciona":"Dos voces explican el mismo alivio y la interfaz lo confirma al instante."}
ENFOQUE Y TRATAMIENTO ELEGIDOS POR EL DUEÑO (vienen del concepto; respetalos)
ENFOQUE: Los dos lados [dos-lados]
{
  "ideaCentral": "La misma necesidad conecta dos perspectivas que se benefician de un sistema compartido: quien inicia o necesita algo y quien lo gestiona o atiende.",
  "quienesAparecen": [
    "persona solicitante o destinataria",
    "operador, supervisor o equipo",
    "representante de marca, opcional"
  ],
  "recorrido": [
    "una necesidad común",
    "perspectiva A: qué necesita saber o hacer",
    "perspectiva B: qué necesita organizar o resolver",
    "punto de conexión mediante el producto",
    "resultado coherente para ambos"
  ],
  "pantallasDelProducto": "Usar únicamente interfaces reales para representar la conexión; evitar pantallas imaginarias de interoperabilidad.",
  "tono": "Humano, colaborativo, equilibrado entre las dos perspectivas.",
  "noAsumir": [
    "que el equipo municipal es negligente",
    "que la solución garantiza respuesta inmediata",
    "que ambas partes ven exactamente la misma información"
  ],
  "cierre": "Un beneficio compartido: claridad para la persona y orden para la organización.",
  "variablesDeDiferenciacion": [
    "pareja de roles",
    "punto de contacto",
    "tipo de solicitud",
    "perspectiva dominante",
    "beneficio común"
  ]
}
TRATAMIENTO: Aspiracional [aspiracional]. Visión de mejora, claridad y profesionalismo con pruebas visuales concretas, sin promesas grandiosas.
Conservá el beneficio, el registro y, si lo hubo, el mecanismo cómico del concepto elegido; no inventes funciones.
CAPTURAS REALES DE LA APP (es lo que se VE en el video — no hay que imaginarlas). Para referirte a una pantalla usá su NOMBRE EXACTO de esta lista:
- Contar el problema: pedir un arreglo es contar qué pasa, en tus palabras, en cuatro pasos cortos; sin saber qué oficio necesitás — micro-animación: la barra de pasos avanza: se elige 'Humedad y filtraciones' (paso 1), se cargan superficie y presupuesto (paso 2), la zona y la descripción se tipean (paso 3) y el resumen '¿Todo bien?' junta todo antes de 'Crear solicitud', que pasa a 'Publicando…'. Al terminar aparece el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.'
- Te esperan tus proveedores: los presupuestos llegan solos y la app te dice qué está esperando algo tuyo, ordenado por urgencia — micro-animación: la home del cliente arranca sin la tira; llega el primer presupuesto y aparece 'TE ESPERAN TUS PROVEEDORES' con una tarjeta y el aviso rojo de la barra se enciende; llega el segundo y se suma al lado
- La conversación con el plan de pagos adentro: se negocia cómo se paga en el mismo chat, y la propuesta queda en el hilo en el momento en que ocurrió — micro-animación: los mensajes entran de a uno; en el hilo aparece la tarjeta 'Propuesta de pago 1' con los tres montos y arriba el acceso 'Plan de pagos enviado'; cuando el cliente firma, la tarjeta y el acceso pasan a 'Plan de pagos acordado' con el ícono verde
- Pagar la seña: se paga sólo la seña por MercadoPago y queda retenida por la plataforma hasta que el trabajo está terminado — micro-animación: en el checkout el botón dice 'Pagar $124.000' y la cajita 'Seña protegida' explica la retención; al volver de MercadoPago aparece el aviso '¡Pago recibido! Estamos confirmando tu reserva.'; con la seña confirmada, el botón del trabajo pasa a 'Marcar evento como finalizado'; terminado, a 'Dejar reseña al proveedor'
- Bandeja de solicitudes: al proveedor los pedidos le llegan ya ordenados por estado, con el cliente, el servicio y el monto; no sale a buscarlos — micro-animación: entra arriba el pedido nuevo de un cliente como pendiente ('1 pendientes de cotizar') y, cuando el proveedor cotiza, pasa a la pastilla COTIZADO con su monto
- Armar el plan de pagos: el proveedor elige cómo cobrar (todo al final, mitades, o contra avance por etapas) y la plataforma sólo le marca hasta dónde puede pedir de adelanto según su historial — micro-animación: el proveedor prueba 'Mitad y mitad' y aparece el aviso rojo 'El primer pago es el 50% del total y el máximo para vos es 40%'; pasa a 'Contra avance' con tres etapas y la línea se vuelve verde: 'Primer pago 20%. Podés pedir hasta 40%.'; aprieta 'Mandar propuesta'
- El panel del proveedor: el proveedor ve su mes en números: solicitudes, confirmadas, ingresos comprometidos, conversión, rating y reseñas — micro-animación: los números del mes cambian con el trabajo nuevo: Solicitudes 12 → 14, Confirmadas 9 → 10, Ingresos est. $9.496.000 → $10.116.000; la conversión baja de 75% a 71% porque entró un segundo pedido que todavía no se aceptó
- La reputación, hecha de trabajos reales: la reputación del proveedor sale sólo de trabajos terminados en la app: cada reseña tiene nombre, contratación verificada y estrellas, y hay de cuatro además de cinco — micro-animación: entra arriba la reseña nueva de un trabajo terminado, con cinco estrellas y la etiqueta 'Contratación Verificada'
- Mis solicitudes, con el progreso de cada trabajo: cada trabajo muestra en qué paso está (Pedido, Presupuesto, Seña, Terminado) y qué le falta, sin tener que preguntarle a nadie — micro-animación: la barra del trabajo avanza tramo por tramo (Pedido, Presupuesto, Seña, Terminado) y el rótulo nombra lo que falta: 'Esperando presupuesto', 'Esperando tu respuesta', 'Trabajo agendado', 'Terminado'
MOMENTOS (mini-flujos que YA cuentan una historia con principio y fin — la unidad narrativa del video):
- Cliente: del problema al trabajo pagado y protegido: cuento qué pasa en mi casa → me llegan los presupuestos sin perseguir a nadie → negocio cómo pagar en el chat y queda firmado → pago sólo la seña, que queda retenida → sigo el progreso hasta que está terminado — remate: La seña queda protegida hasta que el trabajo esté hecho. [screens/01-cliente-contar-el-problema.png → screens/02-cliente-te-esperan-tus-proveedores.png → screens/03-cliente-conversacion-con-plan-de-pagos.png → screens/04-cliente-pagar-la-sena.png → screens/09-cliente-mis-solicitudes-linea-de-tiempo.png]
- Proveedor: el trabajo que llega, el cobro que se acuerda: el pedido me llega a la bandeja, de mi zona y mi oficio → cotizo y armo el plan de pagos como me conviene, con un tope que sube con mi historial → el cliente paga la seña y queda confirmado → veo mi mes en números → mi reputación la hacen los trabajos que terminé — remate: Tu historial te deja pedir más adelanto. Y la reputación no se compra: se termina trabajo por trabajo. [screens/05-proveedor-bandeja-de-solicitudes.png → screens/06-proveedor-armar-plan-de-pagos.png → screens/04-cliente-pagar-la-sena.png → screens/07-proveedor-panel.png → screens/08-proveedor-reputacion-y-resenas.png]
CTA VERIFICADO POR LA APP (usalo tal cual en el cierre): Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar

FOCO DE ESTA PIEZA (lo definió la estrategia; es lo que se cuenta):
- alcance: problem
- mensaje principal: Dejá de perseguir a alguien que te conteste: contá el problema una vez y los presupuestos llegan a tu pantalla.
- hechos que lo sostienen: Pedís presupuesto por WhatsApp y la mayoría no contesta · El cliente cuenta el problema en sus palabras y recibe hasta tres presupuestos de profesionales verificados de su zona · El cliente no persigue a nadie: publica el problema y le llegan los presupuestos · La tira 'Te esperan tus proveedores' en la pantalla de inicio, con los trabajos que esperan algo suyo ordenados por urgencia
OBJETIVO NARRATIVO:
- Mantené UNA idea central de principio a fin.
- El espectador debe entender qué resuelve RepareHoy y por qué importa, pero el video NO tiene que enumerar toda la plataforma.
- Elegí del BRIEF sólo los hechos y beneficios que sostienen este concepto (pueden ser varias funciones si sirven a una misma idea). No intentes meter todos los módulos ni todos los mensajes clave.
- El GIRO es el momento en que el beneficio se ve; nace de la misma situación del concepto y va antes del CTA. Es un remate gracioso SÓLO si el tratamiento elegido es humor: sin humor pedido, nada de chistes, ironía ni parodia.

ESTRUCTURA (en este orden):
hook -> desarrollo (de 1 a 3 bloques) -> giro -> cta
- hook: la situación concreta (un objeto, un momento) Y el problema que resuelve la marca, dicho por quien lo vive. Empieza por el golpe: las primeras 2 o 3 palabras son lo que duele (lo que el espectador ya vivió), y después el detalle que lo ubica. Con la bronca del momento, en presente o recién pasado. La situación sola no alcanza.
- giro: el momento en que el beneficio se VE en la vida de la persona (qué cambió para ella), no una descripción de la app.
- cta: lo dice la PLACA final del montaje (texto en pantalla con la marca y la dirección; no se filma): "quien" = "placa" y "narration" = el texto de la placa, como máximo 8 palabras, con la marca ESCRITA como se escribe (no como se pronuncia) y sin la dirección web (la placa la agrega). Que retome la promesa de la pieza.
- ORDEN: sigue la causa. Primero lo que le pasa a quien necesita, después lo que hace, después quién lo recibe y responde, al final lo que gana. Nada aparece antes de lo que lo provoca.
- MENOS GENTE EXPLICANDO, MÁS COSAS PASANDO: como mucho 3 frases habladas en 26s, de 4 a 11 palabras cada una, secas y orales (frases largas salen con la boca de goma en el video generado). Lo demás lo cuentan la imagen y las pantallas de la app.
- Cada persona habla como en la vida real: nada de vocabulario de la app ni de la ficha comercial (nombres de pantallas, "solicitud", "plataforma", "zona y oficio"). Lo dice como se lo contaría a un vecino.
- No muestres un resultado que la marca no produce: si la app consigue presupuestos, no se ve el arreglo terminado ni el problema resuelto.
- "Hasta N" no es "N": no digas una cantidad que la marca no garantiza ni que la pantalla no va a mostrar.
- Si una frase le habla a alguien ("vos", "tu pedido"), es al espectador: esa persona lo dice mirando a cámara. Una persona nunca le habla de "vos" a otra que no está en la escena.
- Ortografía y tildes correctas (se leen en los subtítulos).

QUIÉN DICE CADA COSA (regla dura: en esta pieza NO hay locutor ni voz en off)
- Cada palabra la dice EN CÁMARA una persona de la historia. "quien" = esa persona, nombrada como la nombra el concepto (por ejemplo, el oficio o el vínculo), siempre con el mismo nombre en toda la pieza. La única excepción es el cierre: "quien" = "placa".
- Una sola persona por bloque. Si hablan dos, son dos bloques.
- Lo que dice tiene que ser verosímil en SU boca, con sus palabras.
- Se dice EN EL MOMENTO en que pasa, en presente: lo que a alguien se le escapa mientras le pasa (una reacción, un
  comentario a quien tiene al lado, lo que piensa en voz alta). Nunca un relato posterior en pasado ("me pasó tal cosa y
  después hice tal otra"): un relato convierte la escena en una cara contando. Sólo el gancho puede ser a cámara.
- Si la historia tiene dos lados, lo que uno necesita es exactamente lo que el otro hace (mismo oficio, mismo problema): si no, el pedido de uno nunca le llega al otro.
- El comercial le habla a UN público: el del cierre. Si aparece el otro lado, su frase es sobre ESE pedido (el de la persona de la historia: su barrio, su problema), para que se entienda que es el mismo pedido de punta a punta, y dice lo que hace con él pensando en quien pide (lo ve, le pasa el precio en el día). Nunca cuenta cómo consigue clientes ni cómo usa la app: el espectador que necesita el arreglo no quiere escuchar el negocio del profesional.
- Un bloque puede no tener voz (narration "") si la imagen cuenta sola ese momento; entonces "quien" es "".

PRESUPUESTO HABLADO (contá palabras):
- hook: 4s, máximo 10 palabras
- desarrollo: 12s, máximo 32 palabras
- giro: 5s, máximo 13 palabras
- cta: 5s, máximo 13 palabras
Total: 26s, máximo 68 palabras. Referencia de ritmo: hasta 2,7 palabras por segundo.
Esos durSec son una referencia: podés redistribuirlos entre bloques siempre que la suma final sea 26s.

CADA BLOQUE:
- narration: sólo lo que se DICE. No describas actuación ni cámara.
- visual: una sola frase breve con lo que se VE; tiene que apoyar esa narración, no repetirla.
- visual: qué está HACIENDO quien habla en ese momento, en su lugar, con un objeto concreto (por ejemplo, lo que tiene en la mano o lo que se rompió). Prohibido "mira a cámara", "retrato" o "habla a cámara" como única acción: eso no cuenta nada.
- quien: la persona que lo dice en cámara ("" si el bloque no tiene voz).
- Cada bloque es UNA toma: como máximo 18 palabras habladas.
- durSec: duración del bloque.

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

NO ASUMIR:
- datos, cifras, precios, integraciones, clientes o resultados que no estén en el BRIEF;
- funciones que no estén mencionadas;
- un CTA distinto del disponible en el BRIEF.

Devolvé SOLO JSON:
{ "blocks": [{ "role": "hook|desarrollo|giro|cta", "quien": "", "narration": "", "visual": "", "durSec": <segundos> }], "music": { "mood": "2-3 palabras" } }

NEGOCIO: RepareHoy
BRIEF (única fuente de hechos):
NEGOCIO: RepareHoy — Contá el problema. Elegí entre 3 presupuestos de profesionales verificados.
RUBRO: AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Barrio de ejemplo para los textos: Villa Urquiza.
PÚBLICO: quien tiene algo que arreglar o hacer en su casa, dueño o inquilino, en Ciudad de Buenos Aires y Gran Buenos Aires · profesionales de oficio y pequeñas empresas de servicios que quieren recibir pedidos de su zona sin salir a buscarlos
QUÉ ES: Marketplace de oficios para el hogar en el AMBA. El cliente cuenta el problema en sus palabras, recibe hasta tres presupuestos de profesionales verificados de su zona, habla con el que elige por un chat dentro de la app y paga la seña desde ahí. - Qué vende: Intermediación entre quien necesita arreglar o hacer algo en su casa y profesionales de once oficios: plomería, electricidad, cerrajería, gas, aire acondicionado, pintura, carpintería, albañilería, herrería, techos y humedad, y materiales. La plataforma cobra una comisión del 10% sobre el monto del trabajo; la paga el proveedor. - Zona: AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Barrio de ejemplo para los textos: Villa Urquiza. - Audiencia prioritaria: Primero el cliente que tiene algo que arreglar en su casa; después el proveedor. En ese orden, y con una historia para cada uno. - La seña queda retenida por la plataforma y se le libera al proveedor recién cuando el trabajo está terminado: sin disputa abierta, a los 7 días de finalizado. - El plan de pagos lo acuerdan las partes, no la plataforma: el proveedor propone (todo al final, mitad y mitad, o contra avance por etapas), el cliente acepta o contrapropone, y queda sellado cuando los dos firman. - La plataforma pone un solo límite: cuánto se puede pedir por adelantado, y sale del historial del proveedor. Hasta 20% del total sin trabajos previos, 40% con cinco finalizados, 60% con veinte. - Cada propuesta de pago queda dentro del hilo de la conversación, en el momento en que ocurrió. La negociación completa es el registro si después hay una disputa. - Las reseñas salen únicamente de trabajos finalizados dentro de la app. No se pueden cargar a mano, ni desde el panel de administración. - El cliente no persigue a nadie: publica el problema, le llegan los presupuestos, y su pantalla de inicio le muestra qué trabajos esperan algo suyo, ordenados por urgencia. - Los pagos hechos por fuera de la app se pueden declarar y la otra parte los confirma. Queda registro aunque la plata no haya pasado por el sistema, y al proveedor le suma historial. - Hay un fondo de reparo opcional: un porcentaje que queda retenido unos días después de terminado el trabajo. - Pedís presupuesto por WhatsApp y la mayoría no contesta. El que contesta pide una seña por transferencia a un alias, sin ningún respaldo. - No hay forma de saber si el que viene es de confianza, ni qué dijeron otros clientes de él. - Adelantar plata sin garantía: si el trabajo queda mal o nunca empieza, no hay a quién reclamarle. - El 'te lo cotizo cuando lo vea' y la fecha que se corre: no hay referencia de precio ni compromiso escrito. - Cuando hay un problema a mitad de obra, lo hablado quedó en audios de WhatsApp que nadie vuelve a encontrar. - Entrá a reparehoy.com.ar y contá qué hay que arreglar - URL: https://reparehoy.com.ar - Secundario: Para proveedores: publicá tu oficio gratis en reparehoy.com.ar/registro - El momento en que llegan los presupuestos sin haber perseguido a nadie: la tira 'Te esperan tus proveedores' con el punto que late. - La negociación del plan de pagos ADENTRO del chat y el sello con las dos firmas. Es lo que ningún WhatsApp te da. - El tope de adelanto que sube con el historial (20, 40, 60%): para el proveedor es un incentivo y para el cliente una protección, en el mismo número. Mostrarlo como escalera, nunca como número suelto. - La seña retenida y liberada al terminar, dicha en una línea: 'La seña queda protegida hasta que el trabajo esté hecho'. - Para el proveedor: la bandeja donde el pedido aparece ya cotizable, con la zona y el oficio que él eligió.
LA TESIS (lo que la app declara de sí misma; manda sobre los hechos de abajo):
- El fuerte: RepareHoy hace de juez entre el que necesita arreglar algo en su casa y el que sabe hacerlo: la seña queda retenida hasta que el trabajo está hecho, el plan de pagos lo acuerdan los dos en el chat y queda como registro, y la reputación sale sólo de trabajos terminados adentro.
- Se entiende como: Un Mercado Libre de oficios con pago protegido: publicás lo que te pasa y te llegan los presupuestos, no perseguís a nadie.
- Contra qué: El WhatsApp y la confianza a ciegas: el plomero que no contesta, la seña por transferencia a un alias, el presupuesto que cambia cuando ya empezó, y lo hablado que quedó en audios.
- El momento mágico: Para el cliente, cuando abre la app y la tira dice 'Te esperan tus proveedores' con presupuestos que llegaron solos. Para el proveedor, cuando arma el plan de pagos a su manera y la app le dice hasta dónde puede pedir de adelanto porque ya se lo ganó.
- A quién le hablamos primero: Al cliente con algo roto en casa, porque es quien tiene el dolor hoy y quien trae la plata; sin pedidos no hay proveedor que se quede. El proveedor viene después, con su propia pieza: la bandeja, el plan, los números.
NO DECIR:
- precios concretos de servicios: son de demostración y cambian
- cantidades de proveedores, trabajos o reseñas como si fueran tracción real
- promesas absolutas: '100% seguro', 'garantizado', 'sin riesgo'
- que el pago al proveedor es automático: hoy la liberación genera una orden y la transferencia la hace tesorería a mano
- Mobbex, 'split de pagos' o 'sin triangulación fiscal': la pasarela activa es MercadoPago y no hay split; esos textos que aparecen en algún banner son heredados y están marcados para sacar
- que la plataforma garantiza el trabajo: lo que garantiza es que la seña no se libera hasta que esté hecho
- 'matriculados' para todos los oficios: la app verifica identidad y CUIT, no matrícula. La matrícula existe para gas y electricidad; en el resto, decir 'verificados'
```

**Qué cambió en el pedido respecto de la vuelta 6** (diff: `-` se sacó, `+` se agregó):

*El pedido es idéntico al de la vuelta anterior.*

**Lo que devolvió:**

```json
{
 "blocks": [
  {
   "role": "hook",
   "quien": "la vecina",
   "narration": "Tres electricistas, ninguno contesta. Y la térmica sigue saltando.",
   "visual": "La vecina sostiene el celular con el chat sin respuesta mientras vuelve a levantar la térmica del tablero del pasillo.",
   "durSec": 4
  },
  {
   "role": "desarrollo",
   "quien": "",
   "narration": "",
   "visual": "Sus manos tipean en la mesa de la cocina y la pantalla Contar el problema avanza los cuatro pasos hasta el aviso de solicitud publicada.",
   "durSec": 5
  },
  {
   "role": "desarrollo",
   "quien": "la electricista",
   "narration": "Me entró el corte de Villa Urquiza. Le paso el precio hoy.",
   "visual": "La electricista baja la pinza amperométrica y abre la Bandeja de solicitudes, donde el pedido pendiente pasa a cotizado.",
   "durSec": 7
  },
  {
   "role": "giro",
   "quien": "la vecina",
   "narration": "Abro y ya tengo los presupuestos. No perseguí a nadie.",
   "visual": "La vecina con el mate en la mano ve aparecer la tira Te esperan tus proveedores en su pantalla de inicio.",
   "durSec": 5
  },
  {
   "role": "cta",
   "quien": "placa",
   "narration": "RepareHoy: contá qué hay que arreglar.",
   "visual": "Placa final limpia con la marca sobre fondo claro y la dirección web.",
   "durSec": 5
  }
 ],
 "music": {
  "mood": "cálida, sobria, luminosa"
 }
}
```

### Paso 4 · Personajes

*Molde `cast/2.2` · modelo opus-5 · 20 s · terminó 11/10 14:49 (hora argentina)*

**Pedido enviado al modelo (completo, versión final):**

```text
Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: definí el CAST y la LOCACIÓN necesarios para producir el concepto y el guion. No agregues personajes decorativos ni reescribas la historia.

Sos casting director + location scout de un comercial 9:16.

CRITERIO:
- Usá 1 personaje si alcanza; usá 2 sólo si el guion necesita dos roles reales.
- Cada personaje debe tener una función narrativa identificable.
- La locación debe ser el entorno físico natural del negocio y de la acción del guion. Evitá locaciones genéricas que podrían pertenecer a cualquier rubro.

POR PERSONAJE:
- id: p1, p2.
- nombre: breve.
- rol: función en el comercial.
- fisicoEn: 25 a 45 palabras en INGLÉS. Descripción visual consistente para generación de imagen/video: edad aproximada, pelo, tono de piel, rasgos, vestuario y presencia. Sólo características visibles.
- fisicoEs: máximo 18 palabras en español para la UI.
- vestuario: máximo 10 palabras.
- vestuarioEn: la misma ropa en INGLÉS, máximo 12 palabras (viaja en cada pedido al generador para que no cambie entre tomas).
- personalidad: 1 a 3 palabras.
- lugarEn: 20 a 40 palabras en INGLÉS. DÓNDE vemos a ESTA persona en el comercial: un lugar suyo, concreto y creíble (no "a home" ni "an office"), con 2 o 3 objetos que cuentan su situación y la luz. Si el guion la muestra con un problema, el problema se ve en el lugar (lo roto, lo que gotea, lo que no anda). Sumá UN detalle propio de su vida que la haga real y no un estereotipo (algo que tiene a la vista y que nadie más tendría). Que se reconozca el país y la ciudad del negocio por los materiales y objetos (no por carteles). Cada personaje tiene SU lugar: nunca el de otro.
- quien: el nombre con el que el GUION la nombra en "dice:" (para unir cada frase con su persona).

LOCACIÓN (la general, para el retrato de referencia):
- nombre: corto y específico.
- descripcionEn: 25 a 50 palabras en INGLÉS. Espacio, mobiliario relevante, atmósfera y luz coherentes con el negocio y el guion.
- luz: máximo 8 palabras.

NO ASUMIR:
- profesiones, jerarquías o rasgos que el concepto no necesite;
- objetos, tecnología o instalaciones que impliquen funciones no mencionadas;
- cambios de personaje para distintas escenas: la identidad definida acá debe poder mantenerse en todo el comercial;
- un oficio distinto del que el guion necesita: si alguien pide un electricista, quien responde es electricista.

Devolvé SOLO JSON:
{ "personajes": [{ "id": "p1", "nombre": "...", "rol": "...", "fisicoEn": "...", "fisicoEs": "...", "vestuario": "...", "vestuarioEn": "...", "personalidad": "...", "lugarEn": "...", "quien": "..." }], "lugar": { "nombre": "...", "descripcionEn": "...", "luz": "..." } }

ENFOQUE Y TRATAMIENTO ELEGIDOS POR EL DUEÑO (vienen del concepto; respetalos)
ENFOQUE: Los dos lados [dos-lados]
{
  "ideaCentral": "La misma necesidad conecta dos perspectivas que se benefician de un sistema compartido: quien inicia o necesita algo y quien lo gestiona o atiende.",
  "quienesAparecen": [
    "persona solicitante o destinataria",
    "operador, supervisor o equipo",
    "representante de marca, opcional"
  ],
  "recorrido": [
    "una necesidad común",
    "perspectiva A: qué necesita saber o hacer",
    "perspectiva B: qué necesita organizar o resolver",
    "punto de conexión mediante el producto",
    "resultado coherente para ambos"
  ],
  "pantallasDelProducto": "Usar únicamente interfaces reales para representar la conexión; evitar pantallas imaginarias de interoperabilidad.",
  "tono": "Humano, colaborativo, equilibrado entre las dos perspectivas.",
  "noAsumir": [
    "que el equipo municipal es negligente",
    "que la solución garantiza respuesta inmediata",
    "que ambas partes ven exactamente la misma información"
  ],
  "cierre": "Un beneficio compartido: claridad para la persona y orden para la organización.",
  "variablesDeDiferenciacion": [
    "pareja de roles",
    "punto de contacto",
    "tipo de solicitud",
    "perspectiva dominante",
    "beneficio común"
  ]
}
TRATAMIENTO: Aspiracional [aspiracional]. Visión de mejora, claridad y profesionalismo con pruebas visuales concretas, sin promesas grandiosas.
Elegí sólo los personajes y roles que la historia elegida necesita: "quienesAparecen" es una lista de opciones, no un reparto obligatorio.
NEGOCIO: RepareHoy
RUBRO: AMBA: Ciudad de Buenos Aires y Gran Buenos Aires. Barrio de ejemplo para los textos: Villa Urquiza.
CONCEPTO: {"id":"c3","topico":"El pedido que llega","tipoGancho":"DEMOSTRACIÓN DIRECTA","idea":"Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.","tono":"Directo, profesional, orgulloso sin grandilocuencia; charla real","estetica":"Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo","referencia":"Testimonial ficcional de dos voces con demo de producto","porQueFunciona":"Dos voces explican el mismo alivio y la interfaz lo confirma al instante."}
GUION: [hook · dice: la vecina] Tres electricistas, ninguno contesta. Y la térmica sigue saltando. (visual: La vecina sostiene el celular con el chat sin respuesta mientras vuelve a levantar la térmica del tablero del pasillo.) · [desarrollo]  (visual: Sus manos tipean en la mesa de la cocina y la pantalla Contar el problema avanza los cuatro pasos hasta el aviso de solicitud publicada.) · [desarrollo · dice: la electricista] Me entró el corte de Villa Urquiza. Le paso el precio hoy. (visual: La electricista baja la pinza amperométrica y abre la Bandeja de solicitudes, donde el pedido pendiente pasa a cotizado.) · [giro · dice: la vecina] Abro y ya tengo los presupuestos. No perseguí a nadie. (visual: La vecina con el mate en la mano ve aparecer la tira Te esperan tus proveedores en su pantalla de inicio.) · [cta · dice: placa] RepareHoy: contá qué hay que arreglar. (visual: Placa final limpia con la marca sobre fondo claro y la dirección web.)
```

**Qué cambió en el pedido respecto de la vuelta 6** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 6
+++ vuelta 7
@@ -72,2 +72,2 @@
 CONCEPTO: {"id":"c3","topico":"El pedido que llega","tipoGancho":"DEMOSTRACIÓN DIRECTA","idea":"Una electricista de Villa Urquiza cuenta a cámara que antes dependía de que alguien la recomendara, mientras una vecina admite que mandaba mensajes a ciegas. En RepareHoy, el pedido de ella aparece en la bandeja de la profesional con zona y oficio, y en la pantalla de la vecina aparecen los presupuestos. Nadie persiguió a nadie.","tono":"Directo, profesional, orgulloso sin grandilocuencia; charla real","estetica":"Retratos a cámara con fondo de obra y de casa, luz suave, pantallas reales como prueba, acabado limpio y prolijo","referencia":"Testimonial ficcional de dos voces con demo de producto","porQueFunciona":"Dos voces explican el mismo alivio y la interfaz lo confirma al instante."}
-GUION: [hook · dice: vecina de Villa Urquiza] Nadie me contesta. Mandé seis mensajes por la térmica. (visual: En el pasillo, con el tablero abierto y la linterna del celular prendida, baja la lista de chats sin respuesta.) · [desarrollo]  (visual: Apoya el celular en la mesada y escribe lo que le pasa en la pantalla Contar el problema, hasta que la barra de pasos llega a Crear solicitud.) · [desarrollo · dice: electricista] Me entra uno de Villa Urquiza, la térmica. Le paso el precio hoy. (visual: En la obra, deja la pinza sobre el caballete y abre la Bandeja de solicitudes con el pedido nuevo arriba.) · [giro · dice: vecina de Villa Urquiza] Entraron solos los presupuestos. No llamé a nadie más. (visual: Con el mate en la mano abre la app y aparece la tira Te esperan tus proveedores con las tarjetas que llegaron.) · [cta · dice: placa] RepareHoy: contá el problema, llegan los presupuestos. (visual: Placa final sobre fondo limpio con la marca y la dirección web.)
+GUION: [hook · dice: la vecina] Tres electricistas, ninguno contesta. Y la térmica sigue saltando. (visual: La vecina sostiene el celular con el chat sin respuesta mientras vuelve a levantar la térmica del tablero del pasillo.) · [desarrollo]  (visual: Sus manos tipean en la mesa de la cocina y la pantalla Contar el problema avanza los cuatro pasos hasta el aviso de solicitud publicada.) · [desarrollo · dice: la electricista] Me entró el corte de Villa Urquiza. Le paso el precio hoy. (visual: La electricista baja la pinza amperométrica y abre la Bandeja de solicitudes, donde el pedido pendiente pasa a cotizado.) · [giro · dice: la vecina] Abro y ya tengo los presupuestos. No perseguí a nadie. (visual: La vecina con el mate en la mano ve aparecer la tira Te esperan tus proveedores en su pantalla de inicio.) · [cta · dice: placa] RepareHoy: contá qué hay que arreglar. (visual: Placa final limpia con la marca sobre fondo claro y la dirección web.)
```

**Lo que devolvió:**

```json
{
 "personajes": [
  {
   "id": "p1",
   "nombre": "Mariela",
   "rol": "La vecina: muestra el problema eléctrico sin resolver y el alivio de recibir presupuestos sin perseguir a nadie",
   "fisicoEn": "Argentine woman around 42, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles on cheeks, tired but warm eyes, no makeup, reading glasses pushed up on her head, relaxed everyday posture.",
   "fisicoEs": "Mujer de 42, pelo castaño ondulado atado, piel oliva, pecas suaves, mirada cansada y cálida.",
   "vestuario": "Buzo gris de algodón, remera blanca abajo",
   "vestuarioEn": "Grey cotton sweatshirt over a plain white tee",
   "personalidad": "Práctica, franca",
   "lugarEn": "Her own ground-floor apartment in Villa Urquiza: tiled kitchen with a formica table, mate gourd and thermos, and the hallway breaker panel she keeps resetting. A hand-painted ceramic tile from Mar del Plata hangs by the door. Grey afternoon light through a patio window.",
   "quien": "la vecina"
  },
  {
   "id": "p2",
   "nombre": "Vanina",
   "rol": "La electricista: recibe el pedido con zona y oficio en su bandeja y cotiza el mismo día",
   "fisicoEn": "Argentine woman around 35, black hair in a tight low bun, medium brown skin, strong eyebrows, small scar on left hand, calm confident gaze, broad shoulders, work-worn hands, standing with steady weight.",
   "fisicoEs": "Mujer de 35, pelo negro recogido, piel morena, cejas marcadas, manos de trabajo, mirada segura.",
   "vestuario": "Camisa de trabajo azul arremangada, pantalón cargo",
   "vestuarioEn": "Rolled-up blue work shirt and dark cargo trousers",
   "personalidad": "Metódica, orgullosa",
   "lugarEn": "Her work van's open side door parked on a plane-tree street in Villa Urquiza: cable spools, an amperometric clamp meter hanging from a hook, and a labelled drawer of breakers. A small crocheted taxi-charm from her grandmother dangles by the handle. Clear morning light.",
   "quien": "la electricista"
  }
 ],
 "lugar": {
  "nombre": "Vereda y tablero en Villa Urquiza",
  "descripcionEn": "A quiet Buenos Aires residential street with plane trees and low brick-and-tile houses. An open work van with cable spools and tools faces a building's hallway breaker panel and tiled kitchen doorway. Mate, phones and a clamp meter in frame. Soft daylight, clean practical finish.",
  "luz": "Luz natural suave de mañana, sin dureza"
 }
}
```

### Paso 5 · Storyboard

*Molde `storyboard/3.6` · modelo opus-5 · 24 s · terminó 11/10 14:50 (hora argentina)*

**Pedido enviado al modelo (completo, versión final):**

```text
Trabajás dentro de un pipeline audiovisual. Hacé sólo esta etapa: convertí el GUION en un STORYBOARD FILMADO producible. No reescribas el concepto ni agregues mensajes comerciales nuevos. Usá únicamente el CAST y el GUION provistos.

Sos director de un comercial FILMADO 9:16.
CAPTURAS REALES DE LA APP (es lo que se VE en el video — no hay que imaginarlas). Para referirte a una pantalla usá su NOMBRE EXACTO de esta lista:
- Contar el problema: pedir un arreglo es contar qué pasa, en tus palabras, en cuatro pasos cortos; sin saber qué oficio necesitás — micro-animación: la barra de pasos avanza: se elige 'Humedad y filtraciones' (paso 1), se cargan superficie y presupuesto (paso 2), la zona y la descripción se tipean (paso 3) y el resumen '¿Todo bien?' junta todo antes de 'Crear solicitud', que pasa a 'Publicando…'. Al terminar aparece el aviso '¡Solicitud publicada! Los proveedores de tu zona la van a cotizar.'
- Te esperan tus proveedores: los presupuestos llegan solos y la app te dice qué está esperando algo tuyo, ordenado por urgencia — micro-animación: la home del cliente arranca sin la tira; llega el primer presupuesto y aparece 'TE ESPERAN TUS PROVEEDORES' con una tarjeta y el aviso rojo de la barra se enciende; llega el segundo y se suma al lado
- La conversación con el plan de pagos adentro: se negocia cómo se paga en el mismo chat, y la propuesta queda en el hilo en el momento en que ocurrió — micro-animación: los mensajes entran de a uno; en el hilo aparece la tarjeta 'Propuesta de pago 1' con los tres montos y arriba el acceso 'Plan de pagos enviado'; cuando el cliente firma, la tarjeta y el acceso pasan a 'Plan de pagos acordado' con el ícono verde
- Pagar la seña: se paga sólo la seña por MercadoPago y queda retenida por la plataforma hasta que el trabajo está terminado — micro-animación: en el checkout el botón dice 'Pagar $124.000' y la cajita 'Seña protegida' explica la retención; al volver de MercadoPago aparece el aviso '¡Pago recibido! Estamos confirmando tu reserva.'; con la seña confirmada, el botón del trabajo pasa a 'Marcar evento como finalizado'; terminado, a 'Dejar reseña al proveedor'
- Bandeja de solicitudes: al proveedor los pedidos le llegan ya ordenados por estado, con el cliente, el servicio y el monto; no sale a buscarlos — micro-animación: entra arriba el pedido nuevo de un cliente como pendiente ('1 pendientes de cotizar') y, cuando el proveedor cotiza, pasa a la pastilla COTIZADO con su monto
- Armar el plan de pagos: el proveedor elige cómo cobrar (todo al final, mitades, o contra avance por etapas) y la plataforma sólo le marca hasta dónde puede pedir de adelanto según su historial — micro-animación: el proveedor prueba 'Mitad y mitad' y aparece el aviso rojo 'El primer pago es el 50% del total y el máximo para vos es 40%'; pasa a 'Contra avance' con tres etapas y la línea se vuelve verde: 'Primer pago 20%. Podés pedir hasta 40%.'; aprieta 'Mandar propuesta'
- El panel del proveedor: el proveedor ve su mes en números: solicitudes, confirmadas, ingresos comprometidos, conversión, rating y reseñas — micro-animación: los números del mes cambian con el trabajo nuevo: Solicitudes 12 → 14, Confirmadas 9 → 10, Ingresos est. $9.496.000 → $10.116.000; la conversión baja de 75% a 71% porque entró un segundo pedido que todavía no se aceptó
- La reputación, hecha de trabajos reales: la reputación del proveedor sale sólo de trabajos terminados en la app: cada reseña tiene nombre, contratación verificada y estrellas, y hay de cuatro además de cinco — micro-animación: entra arriba la reseña nueva de un trabajo terminado, con cinco estrellas y la etiqueta 'Contratación Verificada'
- Mis solicitudes, con el progreso de cada trabajo: cada trabajo muestra en qué paso está (Pedido, Presupuesto, Seña, Terminado) y qué le falta, sin tener que preguntarle a nadie — micro-animación: la barra del trabajo avanza tramo por tramo (Pedido, Presupuesto, Seña, Terminado) y el rótulo nombra lo que falta: 'Esperando presupuesto', 'Esperando tu respuesta', 'Trabajo agendado', 'Terminado'
MOMENTOS (mini-flujos que YA cuentan una historia con principio y fin — la unidad narrativa del video):
- Cliente: del problema al trabajo pagado y protegido: cuento qué pasa en mi casa → me llegan los presupuestos sin perseguir a nadie → negocio cómo pagar en el chat y queda firmado → pago sólo la seña, que queda retenida → sigo el progreso hasta que está terminado — remate: La seña queda protegida hasta que el trabajo esté hecho. [screens/01-cliente-contar-el-problema.png → screens/02-cliente-te-esperan-tus-proveedores.png → screens/03-cliente-conversacion-con-plan-de-pagos.png → screens/04-cliente-pagar-la-sena.png → screens/09-cliente-mis-solicitudes-linea-de-tiempo.png]
- Proveedor: el trabajo que llega, el cobro que se acuerda: el pedido me llega a la bandeja, de mi zona y mi oficio → cotizo y armo el plan de pagos como me conviene, con un tope que sube con mi historial → el cliente paga la seña y queda confirmado → veo mi mes en números → mi reputación la hacen los trabajos que terminé — remate: Tu historial te deja pedir más adelanto. Y la reputación no se compra: se termina trabajo por trabajo. [screens/05-proveedor-bandeja-de-solicitudes.png → screens/06-proveedor-armar-plan-de-pagos.png → screens/04-cliente-pagar-la-sena.png → screens/07-proveedor-panel.png → screens/08-proveedor-reputacion-y-resenas.png]
CTA VERIFICADO POR LA APP (usalo tal cual en el cierre): Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar

PRINCIPIO:
Cada escena tiene una función visual concreta. No agregues escenas por variedad. Si dos escenas cuentan lo mismo, dejá una sola.

PANTALLAS (regla dura): nunca se filma una pantalla. Si un momento del guion tiene que mostrar la app, esa escena es un INSERTO: poné en "pantalla" el nombre EXACTO de una de las capturas de arriba, "personajes": [] y en "accion" qué se ve en esa pantalla; la arma el motor con el mockup real, no Flow. En las escenas filmadas, un teléfono o una computadora nunca muestran la interfaz: se ve la persona, su gesto y lo que le pasa.

CADA ESCENA FILMADA ES UNA SITUACIÓN, NO UNA CARA (regla central)
Una persona mirando a cámara no cuenta nada: tres escenas así son tres veces la misma toma. Cada escena filmada muestra a
la persona HACIENDO algo en su lugar, con un objeto concreto, y algo cambia en esos segundos (de la bronca al alivio, de
esperar a recibir). La frase se dice mientras pasa eso: a veces a cámara, como un testimonio; a veces a alguien fuera de
cuadro, por teléfono o para sí misma. Que se entienda la historia aunque no tenga sonido.

QUIÉN HABLA
- En esta pieza no hay locutor ni voz en off: cada frase del GUION la dice EN CÁMARA la persona que figura en "dice:".
- Una escena filmada por cada bloque con voz. "dialogo" = la frase de ese bloque, TAL CUAL; "personajes" = el id de quien
  la dice (el personaje del CAST cuyo "quien" coincide).
- Ninguna frase se repite en dos escenas. Ninguna escena tiene una frase que diga otra persona.

UNA ACCIÓN POR ESCENA
- Cada escena muestra el MOMENTO en que pasa lo que dice la frase, en presente (le vibra el teléfono y lee el pedido; abre
  la app y aparecen los presupuestos), nunca a alguien contándole a otro, después, que eso pasó.
- En el giro, la escena ES la reacción al resultado (la sorpresa, el alivio en la cara al ver el teléfono), no una tarea
  de la casa con la reacción de fondo.
- Cada escena filmada tiene UNA acción principal, con a lo sumo un gesto antes o después. Cinco acciones en cinco segundos
  salen apuradas y falsas.
- La persona empieza a hablar en el PRIMER segundo, mientras hace la acción: nunca se espera a que termine un gesto para
  hablar, ni hay suspiros o pausas antes de la frase.
- A cámara, como mucho DOS escenas en toda la pieza (la del gancho puede ser una). En las demás la persona habla mientras
  hace lo suyo: con alguien fuera de cuadro, al teléfono, para sí misma, o reacciona a lo que ve. Así no parece un desfile
  de testimonios.
- El objeto del problema se reconoce en UN segundo: descríbilo como es en Argentina (un tomacorriente con la tapa tiznada,
  una térmica, una canilla que gotea), visible desde el primer cuadro.
- Lo que el gancho DICE se tiene que VER: si dice que nadie le contesta, se ve el teléfono con sus mensajes enviados sin
  respuesta (un chat cualquiera, no la app de la marca, sin texto legible).
- Nada de acciones finas de manos en plano cercano mientras habla (tipear con los pulgares, enchufar, atornillar): el video
  generado deforma los dedos. Que la acción sea del cuerpo (abrir, apoyar, levantar, girarse).
- Si la frase le habla al espectador ("vos", "tu pedido"), esa escena es a cámara.
- Lo que hace la persona tiene que ser creíble en su oficio y en su casa: un profesional se ve cuidadoso (nadie toca cables
  pelados mientras habla, ni apoya el teléfono sobre un tablero abierto).
- Las escenas van en el orden del guion (el guion ya sigue la causa: le pasa, lo pide, le llega al otro, le contestan).

POR ESCENA:
- n: consecutivo desde 1.
- rol: hook|desarrollo|giro|cta (giro = el momento en que se ve el beneficio; remate gracioso sólo con tratamiento humor).
- personajes: el id de quien está en cuadro ([] en un inserto de pantalla).
- dialogo: la frase del guion que dice esa persona; "" si en esa escena nadie habla.
- accion: en español, máximo 25 palabras: qué hace la persona, con qué objeto, y qué cambia (es lo que lee el dueño).
- accionEn: en INGLÉS, de 35 a 70 palabras, para el generador de video: quién (su nombre del CAST), dónde (su "lugarEn"
  del CAST, con lo que se ve), qué hace en los 8 segundos EN ORDEN (antes, mientras dice la frase y después), hacia
  dónde dice la frase (a cámara, a alguien fuera de cuadro, al teléfono), el gesto y el sonido del lugar. Pronombres con el
  género correcto del personaje. Sin la frase (va aparte), sin marcas de cámara ni lentes, sin texto en pantalla.
  Escribí la acción para que la frase arranque en el primer segundo: la escena empieza con la situación YA en curso (el
  teléfono ya en la mano, la notificación ya leída), así lo que dice viene después de lo que lo provoca.
  Física de la escena: cada objeto está en un solo lugar y hace una sola cosa (el teléfono con el que lee no puede ser a la
  vez la linterna apoyada). La emoción, simple y en una palabra o dos (cansada, aliviada); nada de gestos dictados músculo
  por músculo (cejas, comisuras): salen actuados.
- plano: close-up | medium close-up | medium shot | over-the-shoulder | low angle | high angle | handheld follow |
  wide shot. Nunca el mismo plano en dos escenas filmadas seguidas. Si la frase depende de la cara (una reacción, una
  emoción), un plano que la muestre: el over-the-shoulder es para ver lo que la persona mira, no para su frase.
- angulo: breve.
- continuidad: máximo 8 palabras; sólo lo que debe mantenerse respecto de la escena anterior de la MISMA persona.
- pantalla: "" en las escenas filmadas; el nombre EXACTO de la captura en un inserto de pantalla.
- durSec: escena filmada con frase = lo que tarda la frase a 2,7 palabras por segundo + 1 (de 3 a 7); escena filmada
  sin frase, de 2 a 4; inserto de pantalla, de 2 a 3 (una pantalla muda de 4 segundos parece que se tildó); el cta, 3.

INSERTOS DE PANTALLA
- Cada frase que nombra algo que hace la app lleva SU pantalla inmediatamente después (lo que cuenta quien pide, lo que le
  llega a quien responde, lo que recibe al final). Sólo pantallas que prueban una frase. Como máximo 3 en la pieza.
- No tienen diálogo: suena la música.

DURACIÓN
La suma de durSec queda entre 22 y 33 segundos. Si sobra, se acortan las escenas sin frase o se saca un inserto; nunca se juntan frases de dos personas.
El giro (el momento en que se ve el beneficio; remate gracioso sólo con tratamiento humor) ocurre antes del CTA.
El CTA es la PLACA del montaje: una escena con rol "cta", sin personajes, sin frase y sin pantalla, de 3 segundos, con
el texto de la placa en "accion". No se filma.

CONTINUIDAD:
Usá siempre los mismos ids para el mismo personaje. No cambies ropa, edad, lugar o luz sin que el GUION lo justifique.

NO ASUMIR:
- personajes fuera del CAST;
- funciones, precios o resultados no presentes en el GUION;
- locaciones o acciones que contradigan el concepto.

Devolvé SOLO JSON:
{ "escenas": [{ "n": 1, "rol": "hook", "durSec": 5, "plano": "...", "angulo": "...", "personajes": ["p1"], "accion": "...", "accionEn": "...", "dialogo": "...", "continuidad": "...", "pantalla": "" }] }

NEGOCIO: RepareHoy
MARCA FONÉTICA para cualquier diálogo: reparé hoy
ENFOQUE Y TRATAMIENTO ELEGIDOS POR EL DUEÑO (vienen del concepto; respetalos)
ENFOQUE: Los dos lados [dos-lados]
{
  "ideaCentral": "La misma necesidad conecta dos perspectivas que se benefician de un sistema compartido: quien inicia o necesita algo y quien lo gestiona o atiende.",
  "quienesAparecen": [
    "persona solicitante o destinataria",
    "operador, supervisor o equipo",
    "representante de marca, opcional"
  ],
  "recorrido": [
    "una necesidad común",
    "perspectiva A: qué necesita saber o hacer",
    "perspectiva B: qué necesita organizar o resolver",
    "punto de conexión mediante el producto",
    "resultado coherente para ambos"
  ],
  "pantallasDelProducto": "Usar únicamente interfaces reales para representar la conexión; evitar pantallas imaginarias de interoperabilidad.",
  "tono": "Humano, colaborativo, equilibrado entre las dos perspectivas.",
  "noAsumir": [
    "que el equipo municipal es negligente",
    "que la solución garantiza respuesta inmediata",
    "que ambas partes ven exactamente la misma información"
  ],
  "cierre": "Un beneficio compartido: claridad para la persona y orden para la organización.",
  "variablesDeDiferenciacion": [
    "pareja de roles",
    "punto de contacto",
    "tipo de solicitud",
    "perspectiva dominante",
    "beneficio común"
  ]
}
TRATAMIENTO: Aspiracional [aspiracional]. Visión de mejora, claridad y profesionalismo con pruebas visuales concretas, sin promesas grandiosas.
Recién acá la historia se traduce a escenas y se comprueba que entra en 20 a 30 segundos. El "recorrido" de la ficha es un banco de posibilidades, nunca una orden de escenas ni un orden fijo.
CAST: {"personajes":[{"id":"p1","nombre":"Mariela","rol":"La vecina: muestra el problema eléctrico sin resolver y el alivio de recibir presupuestos sin perseguir a nadie","fisicoEn":"Argentine woman around 42, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles on cheeks, tired but warm eyes, no makeup, reading glasses pushed up on her head, relaxed everyday posture.","fisicoEs":"Mujer de 42, pelo castaño ondulado atado, piel oliva, pecas suaves, mirada cansada y cálida.","vestuario":"Buzo gris de algodón, remera blanca abajo","vestuarioEn":"Grey cotton sweatshirt over a plain white tee","personalidad":"Práctica, franca","lugarEn":"Her own ground-floor apartment in Villa Urquiza: tiled kitchen with a formica table, mate gourd and thermos, and the hallway breaker panel she keeps resetting. A hand-painted ceramic tile from Mar del Plata hangs by the door. Grey afternoon light through a patio window.","quien":"la vecina"},{"id":"p2","nombre":"Vanina","rol":"La electricista: recibe el pedido con zona y oficio en su bandeja y cotiza el mismo día","fisicoEn":"Argentine woman around 35, black hair in a tight low bun, medium brown skin, strong eyebrows, small scar on left hand, calm confident gaze, broad shoulders, work-worn hands, standing with steady weight.","fisicoEs":"Mujer de 35, pelo negro recogido, piel morena, cejas marcadas, manos de trabajo, mirada segura.","vestuario":"Camisa de trabajo azul arremangada, pantalón cargo","vestuarioEn":"Rolled-up blue work shirt and dark cargo trousers","personalidad":"Metódica, orgullosa","lugarEn":"Her work van's open side door parked on a plane-tree street in Villa Urquiza: cable spools, an amperometric clamp meter hanging from a hook, and a labelled drawer of breakers. A small crocheted taxi-charm from her grandmother dangles by the handle. Clear morning light.","quien":"la electricista"}],"lugar":{"nombre":"Vereda y tablero en Villa Urquiza","descripcionEn":"A quiet Buenos Aires residential street with plane trees and low brick-and-tile houses. An open work van with cable spools and tools faces a building's hallway breaker panel and tiled kitchen doorway. Mate, phones and a clamp meter in frame. Soft daylight, clean practical finish.","luz":"Luz natural suave de mañana, sin dureza"}}
GUION: [hook · dice: la vecina] Tres electricistas, ninguno contesta. Y la térmica sigue saltando. (visual: La vecina sostiene el celular con el chat sin respuesta mientras vuelve a levantar la térmica del tablero del pasillo.) · [desarrollo]  (visual: Sus manos tipean en la mesa de la cocina y la pantalla Contar el problema avanza los cuatro pasos hasta el aviso de solicitud publicada.) · [desarrollo · dice: la electricista] Me entró el corte de Villa Urquiza. Le paso el precio hoy. (visual: La electricista baja la pinza amperométrica y abre la Bandeja de solicitudes, donde el pedido pendiente pasa a cotizado.) · [giro · dice: la vecina] Abro y ya tengo los presupuestos. No perseguí a nadie. (visual: La vecina con el mate en la mano ve aparecer la tira Te esperan tus proveedores en su pantalla de inicio.) · [cta · dice: placa] RepareHoy: contá qué hay que arreglar. (visual: Placa final limpia con la marca sobre fondo claro y la dirección web.)
```

**Qué cambió en el pedido respecto de la vuelta 6** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 6
+++ vuelta 7
@@ -68,5 +68,10 @@
   género correcto del personaje. Sin la frase (va aparte), sin marcas de cámara ni lentes, sin texto en pantalla.
-  Escribí la acción para que la frase arranque en el primer segundo (por ejemplo: "already talking as she...").
+  Escribí la acción para que la frase arranque en el primer segundo: la escena empieza con la situación YA en curso (el
+  teléfono ya en la mano, la notificación ya leída), así lo que dice viene después de lo que lo provoca.
+  Física de la escena: cada objeto está en un solo lugar y hace una sola cosa (el teléfono con el que lee no puede ser a la
+  vez la linterna apoyada). La emoción, simple y en una palabra o dos (cansada, aliviada); nada de gestos dictados músculo
+  por músculo (cejas, comisuras): salen actuados.
 - plano: close-up | medium close-up | medium shot | over-the-shoulder | low angle | high angle | handheld follow |
-  wide shot. Nunca el mismo plano en dos escenas filmadas seguidas.
+  wide shot. Nunca el mismo plano en dos escenas filmadas seguidas. Si la frase depende de la cara (una reacción, una
+  emoción), un plano que la muestre: el over-the-shoulder es para ver lo que la persona mira, no para su frase.
 - angulo: breve.
@@ -135,3 +140,3 @@
 Recién acá la historia se traduce a escenas y se comprueba que entra en 20 a 30 segundos. El "recorrido" de la ficha es un banco de posibilidades, nunca una orden de escenas ni un orden fijo.
-CAST: {"personajes":[{"id":"p1","nombre":"Mariela","rol":"Vecina de Villa Urquiza que publica la solicitud: la perspectiva de quien necesita el arreglo y recibe los presupuestos","fisicoEn":"Woman around 42, warm olive skin, dark wavy shoulder-length hair tied back loosely, light freckles across her cheeks, tired but friendly brown eyes, no makeup, reading glasses pushed up on her head, calm everyday presence.","fisicoEs":"Mujer de 42, piel oliva, pelo ondulado oscuro atado, pecas, mirada cansada y amable","vestuario":"Buzo gris de algodón, jean, medias de lana","vestuarioEn":"Grey cotton sweatshirt, blue jeans, thick wool socks","personalidad":"Práctica, cansada","lugarEn":"Her own narrow tiled hallway in a Buenos Aires casa chorizo: open electrical panel with blackened breaker, dead ceiling bulb, phone flashlight propped on a stack of folded laundry, half-finished crochet blanket on a wicker chair.","quien":"vecina de Villa Urquiza"},{"id":"p2","nombre":"Carolina","rol":"Electricista matriculada que recibe la solicitud en su bandeja y manda el presupuesto: la perspectiva de quien organiza y resuelve","fisicoEn":"Woman around 35, light brown skin, black hair pulled into a tight low bun, strong eyebrows, small scar on her left hand, direct confident gaze, lean build, proud relaxed posture.","fisicoEs":"Mujer de 35, piel morena clara, pelo negro recogido, mirada segura, postura firme","vestuario":"Camisa de trabajo azul, cinturón portaherramientas","vestuarioEn":"Blue work shirt, tool belt, dusty dark work trousers","personalidad":"Resuelta, orgullosa","lugarEn":"A half-built room she is wiring: exposed brick wall, hanging cables and a wooden caballete with pliers and a voltage tester, afternoon light through unglazed window, her thermos and mate gourd on a paint bucket, union sticker on her tool case.","quien":"electricista"}],"lugar":{"nombre":"Casa chorizo de Villa Urquiza en obra","descripcionEn":"A long narrow Buenos Aires casa chorizo: patterned calcareous floor tiles, open electrical panel on the hallway wall, a room under renovation with exposed brick, hanging cables, a wooden trestle holding pliers and tester, bags of cement by the door.","luz":"Luz suave de tarde, sombras cálidas"}}
-GUION: [hook · dice: vecina de Villa Urquiza] Nadie me contesta. Mandé seis mensajes por la térmica. (visual: En el pasillo, con el tablero abierto y la linterna del celular prendida, baja la lista de chats sin respuesta.) · [desarrollo]  (visual: Apoya el celular en la mesada y escribe lo que le pasa en la pantalla Contar el problema, hasta que la barra de pasos llega a Crear solicitud.) · [desarrollo · dice: electricista] Me entra uno de Villa Urquiza, la térmica. Le paso el precio hoy. (visual: En la obra, deja la pinza sobre el caballete y abre la Bandeja de solicitudes con el pedido nuevo arriba.) · [giro · dice: vecina de Villa Urquiza] Entraron solos los presupuestos. No llamé a nadie más. (visual: Con el mate en la mano abre la app y aparece la tira Te esperan tus proveedores con las tarjetas que llegaron.) · [cta · dice: placa] RepareHoy: contá el problema, llegan los presupuestos. (visual: Placa final sobre fondo limpio con la marca y la dirección web.)
+CAST: {"personajes":[{"id":"p1","nombre":"Mariela","rol":"La vecina: muestra el problema eléctrico sin resolver y el alivio de recibir presupuestos sin perseguir a nadie","fisicoEn":"Argentine woman around 42, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles on cheeks, tired but warm eyes, no makeup, reading glasses pushed up on her head, relaxed everyday posture.","fisicoEs":"Mujer de 42, pelo castaño ondulado atado, piel oliva, pecas suaves, mirada cansada y cálida.","vestuario":"Buzo gris de algodón, remera blanca abajo","vestuarioEn":"Grey cotton sweatshirt over a plain white tee","personalidad":"Práctica, franca","lugarEn":"Her own ground-floor apartment in Villa Urquiza: tiled kitchen with a formica table, mate gourd and thermos, and the hallway breaker panel she keeps resetting. A hand-painted ceramic tile from Mar del Plata hangs by the door. Grey afternoon light through a patio window.","quien":"la vecina"},{"id":"p2","nombre":"Vanina","rol":"La electricista: recibe el pedido con zona y oficio en su bandeja y cotiza el mismo día","fisicoEn":"Argentine woman around 35, black hair in a tight low bun, medium brown skin, strong eyebrows, small scar on left hand, calm confident gaze, broad shoulders, work-worn hands, standing with steady weight.","fisicoEs":"Mujer de 35, pelo negro recogido, piel morena, cejas marcadas, manos de trabajo, mirada segura.","vestuario":"Camisa de trabajo azul arremangada, pantalón cargo","vestuarioEn":"Rolled-up blue work shirt and dark cargo trousers","personalidad":"Metódica, orgullosa","lugarEn":"Her work van's open side door parked on a plane-tree street in Villa Urquiza: cable spools, an amperometric clamp meter hanging from a hook, and a labelled drawer of breakers. A small crocheted taxi-charm from her grandmother dangles by the handle. Clear morning light.","quien":"la electricista"}],"lugar":{"nombre":"Vereda y tablero en Villa Urquiza","descripcionEn":"A quiet Buenos Aires residential street with plane trees and low brick-and-tile houses. An open work van with cable spools and tools faces a building's hallway breaker panel and tiled kitchen doorway. Mate, phones and a clamp meter in frame. Soft daylight, clean practical finish.","luz":"Luz natural suave de mañana, sin dureza"}}
+GUION: [hook · dice: la vecina] Tres electricistas, ninguno contesta. Y la térmica sigue saltando. (visual: La vecina sostiene el celular con el chat sin respuesta mientras vuelve a levantar la térmica del tablero del pasillo.) · [desarrollo]  (visual: Sus manos tipean en la mesa de la cocina y la pantalla Contar el problema avanza los cuatro pasos hasta el aviso de solicitud publicada.) · [desarrollo · dice: la electricista] Me entró el corte de Villa Urquiza. Le paso el precio hoy. (visual: La electricista baja la pinza amperométrica y abre la Bandeja de solicitudes, donde el pedido pendiente pasa a cotizado.) · [giro · dice: la vecina] Abro y ya tengo los presupuestos. No perseguí a nadie. (visual: La vecina con el mate en la mano ve aparecer la tira Te esperan tus proveedores en su pantalla de inicio.) · [cta · dice: placa] RepareHoy: contá qué hay que arreglar. (visual: Placa final limpia con la marca sobre fondo claro y la dirección web.)
```

**Lo que devolvió:**

```json
{
 "escenas": [
  {
   "n": 1,
   "rol": "hook",
   "durSec": 5,
   "plano": "medium shot",
   "angulo": "Frontal, levemente contrapicado desde el pasillo",
   "personajes": [
    "p1"
   ],
   "accion": "Mariela, con el celular en una mano y el chat sin respuesta, estira el brazo y levanta la térmica del tablero del pasillo; vuelve a saltar.",
   "accionEn": "Mariela stands in her building's dim hallway in front of the open breaker panel, her phone already in her left hand showing a chat of sent messages with no replies. She glances down at it, speaks straight to camera with tired frankness, then reaches up with her right hand and pushes the breaker lever back up. It snaps down again on its own. She lowers her arm and looks at the panel, annoyed. Faint hum of the building, a distant street.",
   "dialogo": "Tres electricistas, ninguno contesta. Y la térmica sigue saltando.",
   "continuidad": "",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 2,
   "rol": "desarrollo",
   "durSec": 3,
   "plano": "medium close-up",
   "angulo": "Inserto de pantalla",
   "personajes": [],
   "accion": "La solicitud avanza los cuatro pasos: tipo de problema, datos, zona y descripción, y el resumen; al publicar aparece el aviso de solicitud publicada.",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": "Contar el problema",
   "archivoCaptura": "screens/01-cliente-contar-el-problema.png"
  },
  {
   "n": 3,
   "rol": "desarrollo",
   "durSec": 6,
   "plano": "handheld follow",
   "angulo": "Lateral, siguiendo desde la puerta de la camioneta",
   "personajes": [
    "p2"
   ],
   "accion": "Vanina apoya la pinza amperométrica en el cajón de la camioneta, se gira hacia su ayudante fuera de cuadro y avisa que cotiza hoy.",
   "accionEn": "Vanina stands at the open side door of her work van on the plane-tree street, the amperometric clamp meter already in her right hand. She lays it into the labelled breaker drawer, turns her shoulders toward someone off camera to her left and speaks to them with calm pride, tilting her head toward the street as if pointing out the job's neighbourhood. She closes the drawer with her knee. Morning birds, a car passing.",
   "dialogo": "Me entró el corte de Villa Urquiza. Le paso el precio hoy.",
   "continuidad": "",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 4,
   "rol": "desarrollo",
   "durSec": 3,
   "plano": "medium shot",
   "angulo": "Inserto de pantalla",
   "personajes": [],
   "accion": "En la bandeja entra arriba el pedido nuevo como pendiente de cotizar y, al cotizarlo, pasa a la pastilla COTIZADO con su monto.",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": "Bandeja de solicitudes",
   "archivoCaptura": "screens/05-proveedor-bandeja-de-solicitudes.png"
  },
  {
   "n": 5,
   "rol": "giro",
   "durSec": 5,
   "plano": "close-up",
   "angulo": "Frontal a la altura de los ojos, mesa de cocina al fondo",
   "personajes": [
    "p1"
   ],
   "accion": "Mariela, sentada con el mate en la mano, baja la vista al celular apoyado en la mesa, ve los presupuestos y pasa del cansancio al alivio.",
   "accionEn": "Mariela sits at the formica kitchen table with the mate gourd in her right hand, her phone lying flat on the table beside the thermos. She looks down at the screen as new quotes appear, her face shifting from tired to relieved, then lifts her eyes to camera and speaks with a small satisfied shrug before sipping the mate. Grey patio light, a kettle ticking.",
   "dialogo": "Abro y ya tengo los presupuestos. No perseguí a nadie.",
   "continuidad": "Mismo buzo gris, pelo atado, anteojos en la cabeza",
   "pantalla": "",
   "durSecModelo": 8
  },
  {
   "n": 6,
   "rol": "giro",
   "durSec": 3,
   "plano": "medium close-up",
   "angulo": "Inserto de pantalla",
   "personajes": [],
   "accion": "En la home aparece la tira TE ESPERAN TUS PROVEEDORES con la primera tarjeta y se enciende el aviso rojo; llega la segunda y se suma al lado.",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": "Te esperan tus proveedores",
   "archivoCaptura": "screens/02-cliente-te-esperan-tus-proveedores.png"
  },
  {
   "n": 7,
   "rol": "cta",
   "durSec": 3,
   "plano": "medium shot",
   "angulo": "Placa fija",
   "personajes": [],
   "accion": "Placa final sobre fondo claro: RepareHoy. Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar",
   "accionEn": "",
   "dialogo": "",
   "continuidad": "",
   "pantalla": ""
  }
 ]
}
```

### Paso 6 · Pedidos a Flow

*Molde `flowpack/3.1-compilado` · modelo sonnet-5 · 6 s · terminó 11/10 14:50 (hora argentina)*

**Pedido enviado al modelo (completo, versión final):**

```text
Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Respetá el género de quien está en cuadro (lo dice el paréntesis, que no se traduce ni se copia). Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.
2| La solicitud avanza los cuatro pasos: tipo de problema, datos, zona y descripción, y el resumen; al publicar aparece el aviso de solicitud publicada.
4| En la bandeja entra arriba el pedido nuevo como pendiente de cotizar y, al cotizarlo, pasa a la pastilla COTIZADO con su monto.
6| En la home aparece la tira TE ESPERAN TUS PROVEEDORES con la primera tarjeta y se enciende el aviso rojo; llega la segunda y se suma al lado.
7| Placa final sobre fondo claro: RepareHoy. Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
```

**Qué cambió en el pedido respecto de la vuelta 6** (diff: `-` se sacó, `+` se agregó):

```diff
--- vuelta 6
+++ vuelta 7
@@ -1,4 +1,5 @@
 Traducí al inglés, para un prompt de video, estas descripciones de acción de cámara. Respetá el género de quien está en cuadro (lo dice el paréntesis, que no se traduce ni se copia). Devolvé EXACTAMENTE una línea por cada una, con el mismo número adelante y el separador "|", en el mismo orden, sin numerar de nuevo, sin comentarios ni markdown. Mantené los nombres propios y las marcas tal cual.
-2| Se eligen el rubro, la zona y la descripción; la barra de pasos avanza hasta el resumen y queda en Crear solicitud.
-5| Llega el primer presupuesto y aparece la tira Te esperan tus proveedores; se suma la segunda tarjeta al lado.
-6| Placa final sobre fondo limpio: RepareHoy. Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
+2| La solicitud avanza los cuatro pasos: tipo de problema, datos, zona y descripción, y el resumen; al publicar aparece el aviso de solicitud publicada.
+4| En la bandeja entra arriba el pedido nuevo como pendiente de cotizar y, al cotizarlo, pasa a la pastilla COTIZADO con su monto.
+6| En la home aparece la tira TE ESPERAN TUS PROVEEDORES con la primera tarjeta y se enciende el aviso rojo; llega la segunda y se suma al lado.
+7| Placa final sobre fondo claro: RepareHoy. Entrá a reparehoy.com.ar y contá qué hay que arreglar · https://reparehoy.com.ar
```

**Lo que devolvió:**

```json
{
 "estilo": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect.",
 "personajes": [
  {
   "id": "p1",
   "nombre": "Mariela",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine woman around 42, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles on cheeks, tired but warm eyes, no makeup, reading glasses pushed up on her head, relaxed everyday posture, standing and looking at the camera, natural pose, neutral background with a hint of a quiet buenos aires residential street with plane trees and low brick-and-tile houses. A still photo, no action, no dialogue."
  },
  {
   "id": "p2",
   "nombre": "Vanina",
   "promptImagen": "Full-body portrait, 9:16, photorealistic, not CGI-perfect, of an Argentine woman around 35, black hair in a tight low bun, medium brown skin, strong eyebrows, small scar on left hand, calm confident gaze, broad shoulders, work-worn hands, standing with steady weight, standing and looking at the camera, natural pose, neutral background with a hint of a quiet buenos aires residential street with plane trees and low brick-and-tile houses. A still photo, no action, no dialogue."
  }
 ],
 "escenas": [
  {
   "escenaN": 1,
   "rol": "hook",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Mariela, an Argentine woman around 42, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles on cheeks, wearing Grey cotton sweatshirt over a plain white tee. Mariela stands in her building's dim hallway in front of the open breaker panel, her phone already in her left hand showing a chat of sent messages with no replies. She glances down at it, speaks straight to camera with tired frankness, then reaches up with her right hand and pushes the breaker lever back up. It snaps down again on its own. She lowers her arm and looks at the panel, annoyed. Faint hum of the building, a distant street. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Tres electricistas, ninguno contesta. Y la térmica sigue saltando.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Medium shot, waist up, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never recreate the brand app interface. A generic messaging chat may be visible on the phone (sent bubbles with no replies) but its text is never legible. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 3,
   "rol": "desarrollo",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Vanina, an Argentine woman around 35, black hair in a tight low bun, medium brown skin, strong eyebrows, wearing Rolled-up blue work shirt and dark cargo trousers. Vanina stands at the open side door of her work van on the plane-tree street, the amperometric clamp meter already in her right hand. She lays it into the labelled breaker drawer, turns her shoulders toward someone off camera to her left and speaks to them with calm pride, tilting her head toward the street as if pointing out the job's neighbourhood. She closes the drawer with her knee. Morning birds, a car passing. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Me entró el corte de Villa Urquiza. Le paso el precio hoy.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Handheld camera following the movement, natural handheld feel, shallow depth of field. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  },
  {
   "escenaN": 5,
   "rol": "giro",
   "prompt": "Photorealistic, professional cinematic vertical 9:16, clean and well-lit, natural light, realistic expressive faces, not over-rendered and not CGI-perfect. Mariela, an Argentine woman around 42, shoulder-length dark brown wavy hair tied back loosely, olive skin, light freckles on cheeks, wearing Grey cotton sweatshirt over a plain white tee. Mariela sits at the formica kitchen table with the mate gourd in her right hand, her phone lying flat on the table beside the thermos. She looks down at the screen as new quotes appear, her face shifting from tired to relieved, then lifts her eyes to camera and speaks with a small satisfied shrug before sipping the mate. Grey patio light, a kettle ticking. She starts speaking within the first second and says, in Argentine Rioplatense Spanish (voseo), naturally and only once, exactly these words and nothing else: 'Abro y ya tengo los presupuestos. No perseguí a nadie.' Realistic, expressive face, nothing staged. After the line there are no more words: the scene ends on the gesture, in silence or with the ambient sound. Close-up on the face and hands, natural handheld feel, shallow depth of field. If an app screen is visible, the screen is not clearly legible. Keep the top center area of the frame uncluttered for top-centered brand logo overlay. Never show or recreate an app interface: any phone or computer screen faces away from the camera. No on-screen text. No subtitles, no captions.",
   "estado": "pendiente"
  }
 ],
 "huecos": [],
 "version": "flowpack/3.0-compilado"
}
```
