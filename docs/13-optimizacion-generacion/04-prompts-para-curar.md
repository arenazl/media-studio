# Prompts para curar (estado real al 2026-10-07)

> Para el dueño. Cada bloque es el pedido EXACTO que hoy le llega al modelo para la pieza
> "Gancho & Problema" de Munify, con los datos reales adentro. Lo que está entre llaves dobles
> `{{así}}` es DATO (cambia por pieza): no se cura. Todo lo demás es TEXTO FIJO del molde y es lo que
> se corrige. El estándar está en `D:\Code\base-compartida\25-ESTANDAR-DE-PROMPTS.md`: preámbulo
> común + ficha semántica + largos en números + "no asumir" + nada de ejemplos de estilo (los copia).
>
> Cómo devolverlo: editá el texto fijo directo en este archivo (o en una copia) y decime "está".
> Yo lo paso al código con su versión nueva y lo pruebo con la misma pieza, antes y después.
>
> Concepto NO está acá: ya se curó hoy (`concept/2.0`, en la radiografía §2.2).

## Orden sugerido

1. **Guion** (`script/1.2`): es el que más se nota en el video y el que el lint más marca.
2. **Storyboard filmado** y **animado** (`storyboard/1.1`).
3. **Cast** (`cast/1.1`).
4. **Estrategia** (`strategy/1.1`): corre una vez por proyecto, es la que menos urge.

---

## Guion (script/1.2)

**Largo real del pedido para Munify:** 1678 caracteres (sin contar lo marcado como dato).

```text
Actuás como promo-director. Escribí el guion de un comercial de 20s para un reel 9:16, tono cercano (ángulo: "Gancho & Problema").
CONCEPTO ELEGIDO (respetalo, es la dirección creativa del comercial): {{CONCEPTO ELEGIDO (JSON)}}
ENFOQUE GLOBAL (clave): contá TODA la propuesta del negocio en ESTE video — no un solo módulo/producto. Enganchá explicando el funcionamiento, CONECTÁ los puntos fuertes en un hilo, reforzá con la prueba y cerrá con el CTA.
Estructura NARRATIVA por bloques con estos roles EXACTOS: hook (primeros 2s, roba la atención, sin logo ni "somos X") -> desarrollo (cómo funciona / la propuesta en vivo) -> gag (el REMATE: el momento más fuerte — humor si el concepto es humorístico, si no la prueba/beneficio contundente) -> cta (llamado a la acción claro). El gag va SIEMPRE ANTES del cta.
PRESUPUESTO (se cumple en palabras, contá): hook: 3s, hasta 8 palabras · desarrollo: 9s, hasta 24 palabras · gag: 4s, hasta 10 palabras · cta: 4s, hasta 10 palabras. Total: 20s y hasta 54 palabras habladas. La voz dice 2,7 palabras por segundo: un bloque con más palabras que su tope NO entra en el video. El durSec de cada bloque es el de este reparto (ajustalo a lo sumo 1 segundo).
Devolvé SOLO JSON: { "blocks": [{ "role": "hook|desarrollo|gag|cta", "narration": "lo que se DICE (voz - súper breve)", "visual": "lo que se VE en pantalla (1 frase)", "durSec": <segundos> }], "music": { "mood": "el mood de la música en 2-3 palabras" } }
NEGOCIO: Munify
BRIEF (los hechos que importan para el guion):
{{FICHA DEL NEGOCIO: negocio + mensajes + qué ofrece + oferta + no decir}}
No inventes precios/cifras/integraciones como reales. Es GLOBAL: cuenta TODO el negocio.
```

**Qué le cambiarías:**

- 

---

## Storyboard FILMADO (storyboard/1.1)

**Largo real del pedido para Munify:** 1210 caracteres (sin contar lo marcado como dato).

```text
Sos director de un comercial FILMADO 9:16. Convertí el guion en un STORYBOARD de escenas numeradas.
Por escena: n, rol (hook|desarrollo|gag|cta), durSec (talking head = 8 MÍNIMO, jamás menos; b-roll 4-8), plano (medium shot waist-up para talking heads — NUNCA wide lejano), angulo (eye-level, etc.), personajes (ids del CAST — USÁ SIEMPRE los mismos), accion (descripción CORTA, máximo 1 oración), dialogo (rioplatense; un talking head de 8s lleva como máximo 21 palabras y uno de 10s 27: nunca más de 2,7 palabras por segundo; marca fonética: Munifai), continuidad (qué debe matchear con la escena anterior, MUY corto, ej: "misma ropa, misma luz").
La suma de durSec ≈ 20s y como máximo 25s (un talking head nunca baja de 8s: si no entra, sacá una escena, no acortes el talking head). El gag/remate va ANTES del CTA. "accion" de hasta 14 palabras, "continuidad" de hasta 8.
Devolvé SOLO JSON: { "escenas": [{ "n": 1, "rol": "hook", "durSec": 8, "plano": "medium shot waist-up", "angulo": "eye-level", "personajes": ["p1"], "accion": "...", "dialogo": "...", "continuidad": "..." }] }
Reglas: sin emojis, no inventes datos/precios como reales.
NEGOCIO: Munify
CAST: {{CAST (JSON)}}
GUION: {{GUION por bloques}}
```

**Qué le cambiarías:**

- 

---

## Storyboard ANIMADO (storyboard/1.1)

**Largo real del pedido para Munify:** 883 caracteres (sin contar lo marcado como dato).

```text
Sos director de un reel ANIMADO 9:16 (se recrean las PANTALLAS del producto, sin personas). Convertí el guion en un STORYBOARD de escenas numeradas, una por PANTALLA.
Por escena: n (número), rol (hook|desarrollo|gag|cta), durSec (3-5s), screen (label de la pantalla del KB), accion (un título corto de <=8 palabras que vende ese momento), dialogo "" (vacío), continuidad (la palabra a RESALTAR del título). Dejá plano/angulo vacíos y personajes [].
La suma de durSec ≈ 20s.
Devolvé SOLO JSON: { "escenas": [{ "n": 1, "rol": "hook", "durSec": 4, "screen": "...", "plano": "", "angulo": "", "personajes": [], "accion": "título corto", "dialogo": "", "continuidad": "palabra a resaltar" }] }
Reglas: español rioplatense, sin emojis, no inventes datos. Marca fonética (nunca el nombre escrito): Munifai.
NEGOCIO: Munify
PANTALLAS DEL KB: {{PANTALLAS DEL KB}}
GUION: {{GUION por bloques}}
```

**Qué le cambiarías:**

- 

---

## Cast (cast/1.1)

**Largo real del pedido para Munify:** 1659 caracteres (sin contar lo marcado como dato).

```text
Sos casting director + location scout de un comercial 9:16. Del CONCEPTO, el GUION y el NEGOCIO, definí los PERSONAJES (1-2) y la LOCACIÓN ideal para el comercial.

REGLA DE LOCACIÓN AGERA E HIPER-RELEVANTE (DURA): La locación DEBE ser el entorno físico real donde transcurre la propuesta del negocio (GovTech / gestion municipal (gobiernos locales)). Extraé la locación natural del rubro (ej. si es eventos/fiestas -> salón, quinta, barra o pista iluminada; si es GovTech -> oficina municipal o calle; si es salud -> centro médico; si es fintech -> oficina/comercio real). Queda PROHIBIDO usar livings residenciales genéricos salvo que el negocio sea de productos para el hogar.

Por personaje:
- "fisicoEn" = descripción física EXACTA en INGLÉS para prompts de video (edad, pelo, tono de piel, vestuario propio y natural del rubro del negocio, estilo auténtico y carismático). Sé ESPECÍFICO y fotorrealista.
- "fisicoEs" = resumen MUY BREVE en español para la UI (1 línea). Sumá "nombre", "rol" (su papel en el comercial), "vestuario" (corto), "personalidad" (1-2 palabras).
La LOCACIÓN: "descripcionEn" en inglés (entorno real del rubro, mobiliario del negocio, iluminación contextual y profesional), más "nombre" y "luz" (corto).
Devolvé SOLO JSON: { "personajes": [{ "id": "p1", "nombre": "...", "rol": "...", "fisicoEn": "...", "fisicoEs": "...", "vestuario": "...", "personalidad": "..." }], "lugar": { "nombre": "...", "descripcionEn": "...", "luz": "..." } }
Reglas: sin emojis, no inventes datos. El diálogo es rioplatense, pero fisicoEn/descripcionEn van en INGLÉS.
NEGOCIO: Munify
CONCEPTO: {{CONCEPTO ELEGIDO (JSON)}}
GUION: {{GUION por bloques}}
```

**Qué le cambiarías:**

- 

---

## Estrategia (strategy/1.1)

**Largo real del pedido para Munify:** 1850 caracteres (sin contar lo marcado como dato).

```text
Actuás como social-marketing-strategist. Del BRIEF, armá la estrategia de campaña de video para redes (Instagram/Facebook).

CAMPAÑA COMPLETA: Generá exactamente entre 6 y 7 piezas (reels) cubriendo el embudo de marketing completo:
1. Reel 1 (Awareness / Gancho): El dolor principal y la solución con alto gancho inicial.
2. Reel 2 (Demo de Producto): Recorrido dinámico por la app y sus funciones clave.
3. Reel 3 (Beneficios & Valor): El impacto real y los beneficios cotidianos para el usuario.
4. Reel 4 (Prueba Social / Confianza): Reseñas, verificación, garantía y tranquilidad.
5. Reel 5 (Conversión Directa): Llamado a la acción directo con oferta/beneficio concreto.
6. Reel 6 (Solo Mockups Animados): Showcase visual de pantallas UI en movimiento.
7. Reel 7 (Cierre / Retargeting): Explicación directa superando la objeción principal.

ENFOQUE GLOBAL: Cada pieza cuenta TODA la propuesta de valor del negocio en UN solo video con un ÁNGULO/approach DISTINTO.
Generá 6 a 7 piezas, todas GLOBALES, con sus respectivos ángulos.

Devolvé SOLO JSON (sin texto ni markdown alrededor):
{
  "positioning": "1-2 frases: qué es, para quién y por qué es distinto",
  "audiences": [{ "label": "segmento", "pain": "su dolor concreto", "language": "palabras que usa ese segmento" }],
  "pieces": [{ "id": "v1", "objective": "awareness|consideracion|conversion", "angle": "el approach de ESTA versión (MÁXIMO 3-4 PALABRAS, ej: 'Problema-Solución' o 'Demo en vivo')", "format": "reel 9:16", "durationSec": 20, "creativeBrief": "qué cuenta (TODA la propuesta, global) y con qué tono/approach, detallado en 2-3 frases" }]
}
Reglas: español rioplatense, sin emojis, NO inventes datos/precios/cifras como reales. IMPORTANTE: El campo 'angle' debe ser un título muy corto (máximo 3-4 palabras).
NEGOCIO: Munify
BRIEF (los hechos):
{{FICHA DEL NEGOCIO completa}}
```

**Qué le cambiarías:**

- 

---

## Los datos, para referencia (lo que va dentro de las llaves dobles)

**CONCEPTO ELEGIDO:** El trámite eterno · POV · Un vecino entra al municipio con un número de turno en la mano y una planta en la otra, como si fuera a quedarse a vivir ahí. Corte: saca el celular, reclama el bache con foto y GPS, valida su identidad con RENAPER, y recibe la notificación de resuelto antes de que lo llamen por altavoz. Se va con la planta todavía en la mano.

**GUION por bloques:**

[hook] Traje una planta. Por el turno, digo. Capaz florece antes. (visual: POV en sala de espera fluorescente: número de turno en una mano, una planta en la otra) · [desarrollo] Saco el celu: foto del bache, GPS, y se deriva solo a la dependencia. El trámite lo valido con mi cara, RENAPER, sin moverme. (visual: Pantalla del celular nítida y cálida: reclamo con foto, mapa, validación biométrica y tasa pagada) · [gag] Resuelto, con foto antes y después. Adentro ya está todo ordenado, sin Excel. Todavía no me llamaron por altavoz. (visual: Notificación de resuelto; el altavoz sigue en el número anterior y la planta sigue en la mano) · [cta] Munify. Un solo login para gobernar y atender al vecino. Implementado en una o dos semanas. (visual: Logo Munify sobre el asiento vacío de la sala de espera)

**FICHA DEL NEGOCIO completa** (así la ve estrategia y concepto; el guion recibe negocio + mensajes + qué ofrece + oferta + no decir):

```text
NEGOCIO: Munify — La app que conecta al vecino con su municipio en tiempo real: reclama, tramita y paga desde el celular, con validacion biometrica oficial.
RUBRO: GovTech / gestion municipal (gobiernos locales)
PÚBLICO: Intendentes, jefes de gabinete, secretarios de gobierno y directores de modernizacion de municipios y comunas de Argentina, desde comunas de 3.000 habitantes hasta ciudades de 200.000. Exclusivo gobiernos locales argentinos.
QUÉ ES: El vecino reclama un bache, inicia un tramite o paga una tasa desde el celular. El municipio recibe el pedido, lo deriva a la dependencia correcta, lo resuelve y notifica al vecino en tiempo real, con foto, GPS y firma digital cuando hace falta. Puertas adentro, el mismo sistema ordena la plata del municipio (ordenes de pago, tesoreria y sueldos) y reemplaza el Excel. Un unico sistema con login unico para gobernar y para atender al vecino.
LA PROPUESTA COMPLETA (cada video cuenta esto, no un módulo): Munify pone en una sola app la relacion entre el vecino y su municipio: el vecino reclama, tramita o paga una tasa desde el celular, con validacion biometrica oficial via RENAPER; el municipio recibe el pedido, lo deriva a la dependencia correcta, lo resuelve con foto antes/despues y notifica al vecino en cada paso, mientras ve en vivo la temperatura de la ciudad. Puertas adentro, el mismo sistema ordena la plata del municipio (ordenes de pago, tesoreria y sueldos) y reemplaza el Excel. Un solo login para gobernar y para atender al vecino.
MENSAJES CLAVE (van en cada pieza):
- El vinculo vecino-municipio en tiempo real, desde el celular y sin demoras
- Tramites con validacion biometrica oficial via RENAPER, sin pisar el municipio
- Los reclamos se derivan solos a la dependencia y se resuelven con foto antes y despues
- La plata del municipio ordenada: ordenes de pago, tesoreria y sueldos en un solo sistema, sin Excel
- Todo integrado con un login unico; se implementa en 1 a 2 semanas, no en 6 meses
QUÉ OFRECE:
- Reclamos vecinales: El vecino reporta problemas (bache, alumbrado, residuos, animales sueltos, ruidos) desde la app con foto y GPS. La IA lo deriva a la dependencia correcta, el supervisor lo asigna a una cuadrilla, se resuelve con foto antes/despues y el vecino recibe notificacion en cada paso con numero de seguimiento. (Clasificacion automatica del reclamo por IA; Foto y geolocalizacion GPS automatica; Asignacion a cuadrilla y fotos antes/despues; Dashboard en vivo y mapa con hotspots; Notificacion al vecino en cada paso y modo offline para cuadrillas)
- Tramites municipales online: El vecino inicia tramites desde el celular (habilitacion comercial, libre deuda, certificado de domicilio, licencia de conducir, monotributo municipal, bromatologia, permiso de obra), sube la documentacion, paga online y firma digital cuando corresponde, sin pisar el municipio hasta la entrega. (Validacion biometrica oficial via RENAPER (DNI + selfie con prueba de vida, menos de 30s); Configuracion por tramite (documentacion, validaciones, area que aprueba, pago); Pago online y firma digital; Mostrador asistido para vecinos sin app (el operador carga y valida la biometria); Pre-validacion de documentacion con IA)
- Turnos y agenda presencial: El vecino saca turno para gestiones que requieren presencia (mesa de entradas, licencias, bromatologia) eligiendo dependencia, dia y horario disponible. El municipio configura cupos, horarios y feriados; cada dependencia ve su agenda diaria. (Reserva de turno por dependencia, dia y horario libre; Configuracion de cupos, horarios y feriados por agenda; Agenda diaria por dependencia para el personal; Reserva tambien por bot de WhatsApp)
- Gestion Financiera (Contaduria + Tesoreria + Sueldos): Reemplaza el Excel del municipio. Contaduria maneja el circuito formal de Ordenes de Pago con trazabilidad para el Tribunal de Cuentas; Tesoreria registra los movimientos reales y saldos de cada caja; Sueldos liquida al personal con monto editable y premios variables. Los tres sub-modulos comparten la misma base de datos. (Orden de Pago con numero correlativo, PDF de factura adjunto y circuito pendiente -> autorizada -> pagada; Al pagar una OP genera el movimiento en Tesoreria automaticamente, sin doble carga; Cajas y fondos (FOFINDE, FODEMEP, coparticipacion, tesoro propio) con saldo en vivo; Conciliacion bancaria: importar extracto y matchear contra movimientos de caja; Sueldos con monto base editable por mes y premios variables desde catalogo)
POR QUÉ ES DISTINTO:
- Integral: un solo sistema con login unico para reclamos, tramites, turnos y gestion financiera; la competencia los vende por separado.
- App gratis para el vecino (Play Store, App Store, PWA y bot de WhatsApp); si el vecino tuviera que pagar, la adopcion seria cero.
- Validacion biometrica oficial via RENAPER: le da validez gubernamental al tramite, no es solo un formulario en internet.
- Multi-tenant real: los datos de cada municipio estan totalmente aislados, con sus colores, logo y dependencias.
- Multiplataforma de verdad: panel web, PWA, app nativa iOS/Android, bot de WhatsApp y modo offline para cuadrillas.
- Implementacion en 1 a 2 semanas, no en 6 meses; importa los datos existentes y convive con sistemas legacy via API.
- IA integrada sin costo extra: clasifica reclamos, detecta duplicados, sugiere asignacion y categoriza gastos.
- Argentino, en pesos argentinos; la competencia internacional cobra en dolares.
DOLORES Y OBJECIONES (en palabras del cliente):
- "Ya tenemos un sistema." → Munify se integra via API y no obliga a tirar nada de lo que ya tienen. Lo distinto: app gratis para el vecino, validacion RENAPER y los modulos integrados en uno solo.
- "Es caro / no tenemos presupuesto." → Por eso ofrecemos 3 meses gratis sin tarjeta de credito. El municipio prueba con datos reales y recien decide cuando ve los resultados.
- "Mi gente no es tecnologica." → La capacitacion esta incluida y la hacemos por videollamada con cada equipo. La curva es de un dia. Esta pensado para que lo use un empleado municipal sin saber de informatica.
- "El vecino aca no usa el celular." → Para eso esta el Mostrador asistido: el operador de la municipalidad carga el tramite del vecino y le hace la validacion biometrica con el celular. El vecino no necesita tener la app instalada.
- "Mis datos estan seguros?" → Si. Cumplimos la Ley 25.326 de Proteccion de Datos Personales. Cada municipio tiene sus datos aislados, cifrados, en cloud, con backups diarios. La data es del municipio y la pueden exportar cuando quieran.
OFERTA / CTA:
- La app es gratis para el vecino. El municipio paga por habitante, en pesos argentinos, sin permanencia. El precio exacto lo confirma un asesor del equipo segun el tamano del municipio.
- Combo 3 modulos (Reclamos + Tramites + Gestion Financiera): 3 meses gratis sin compromiso ni tarjeta de credito, precio combinado menor a la suma de los modulos sueltos, capacitacion incluida e implementacion en 1 a 2 semanas.
NO DECIR:
- No inventar precios ni dar montos cerrados; el precio exacto lo cierra un asesor humano segun el tamano del municipio.
- No afirmar que somos un sistema contable completo ni que emitimos facturacion electronica AFIP; convivimos con SIPAF/RAFAM y sistemas provinciales via API, no los reemplazamos.
- No presentar Sueldos como un sistema de RRHH completo: liquida base + premios, no calcula aportes/retenciones ni controla asistencia ni legajos.
- No presentarlo como un GIS profesional (catastro, planos urbanisticos) ni como un CRM generico; es exclusivo para gobiernos locales argentinos.
- No prometer integraciones especificas (SIPAF, RAFAM, etc.) sin confirmar; el equipo tecnico valida el caso puntual.
- No comparar directamente con competidores por nombre.
- Si un dato del municipio viene vacio, no inventarlo: decir que no lo tiene.
- No usar emojis ni jerga de marketing (revolucionario, increible, potencia, boostea).
```
