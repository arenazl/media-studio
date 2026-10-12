# Anexo: los pedidos exactos de la orquestación de "Nadie te contesta"

Lo que recibió el modelo en cada paso, tal cual (de la base). Primero la versión de la madrugada del 11/10, después la vuelta 7.

## Madrugada · Paso 1 · Estrategia

*Molde strategy/2.1 · modelo claude-opus-5 · 49 s · 05:42 (hora argentina)*

```
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

## Madrugada · Paso 2 · Concepto

*Molde concept/3.1 · modelo claude-opus-5 · 33 s · 05:43 (hora argentina)*

```
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

## Madrugada · Paso 3 · Guion

*Molde script/2.1 · modelo claude-opus-5 · 29 s · 05:44 (hora argentina)*

```
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

## Madrugada · Paso 4 · Personajes

*Molde cast/2.0 · modelo claude-sonnet-5 · 11 s · 05:44 (hora argentina)*

```
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

## Madrugada · Paso 5 · Storyboard

*Molde storyboard/2.1 · modelo claude-sonnet-5 · 27 s · 05:45 (hora argentina)*

```
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

## Vuelta 7 · Paso 3 · Guion

*Molde script/3.5 · modelo claude-opus-5 · 37 s · 14:49 (hora argentina)*

```
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

## Vuelta 7 · Paso 4 · Personajes

*Molde cast/2.2 · modelo claude-opus-5 · 20 s · 14:49 (hora argentina)*

```
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

## Vuelta 7 · Paso 5 · Storyboard

*Molde storyboard/3.6 · modelo claude-opus-5 · 24 s · 14:50 (hora argentina)*

```
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

