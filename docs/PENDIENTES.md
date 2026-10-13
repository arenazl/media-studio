# Pendientes de Media Studio

Una línea por pendiente, con el dato que lo justifica y dónde está el detalle (norma `base-compartida/28-ANOTALO-PARA-DESPUES.md`).

## Concepto 3.0 (curación del 2026-10-10)

- Correr la tabla de pruebas A–F del LEEME de la curación con el mismo brief de Munify (hoy sólo la A: caso + sobrio) y
  comparar contra concept/2.0. Detalle: `base-compartida/mediastudio/curaciones/01-concepto-con-enfoque/LEEME-integracion.md`.
- Fase opcional de evaluación sólo de las propuestas con humor (devolver alternativas sin tocar el resto). Mismo LEEME.
- "Mecanismo de humor" como opción avanzada plegada; hoy es un chip más, visible sólo con humor activo (`PasoConcepto.tsx`).
- `cierreMarca` ("Munify, para vos") todavía no se carga desde la interfaz: sale vacío salvo que la pieza lo traiga.
- El compilador de prompts de Veo (`server/flowCompiler.mjs`) le da al bloque "giro" una entrega neutra; con tratamiento
  humor debería pedir el remate. Falta pasarle el tratamiento al compilador (hoy no lo recibe).
- Los comerciales viejos siguen con el rol "gag" (se leen como giro y conservan el silencio de 0,8 s del montaje);
  una migración los renombraría, pero no hace falta mientras se regeneren.

## Calidad de código

- `src/App.tsx` tiene un `return <DemoReels />` antes de los hooks (desde antes de hoy): eslint marca 12 errores
  `rules-of-hooks` en ese archivo. Funciona porque el parámetro `demorec` no cambia en vivo, pero hay que mover ese
  atajo a `main.tsx` o a un componente envolvente para que el lint del checklist quede limpio.

## Trazabilidad de corridas (pedido de Lucas, 2026-10-10 02:50)

- Un JSON por comercial con la METADATA de la corrida, no el resultado: las decisiones (perfil, enfoque, tratamiento,
  intensidad y mecanismo de humor, ángulo, cierre de marca, tipo) y por paso el molde y su versión, modelo y proveedor
  reales, duración, costo, validación (ok / reparado / errores) y qué opción se eligió. Sirve para comparar dos
  orquestaciones del mismo brief. Hoy cada `run-function` ya devuelve `meta` (versión, modelo, costo) y `validacion`;
  falta juntarlo por comercial (`comercial.trazas[]`) y poder bajarlo. Se arranca después de la primera generación real
  con el pipeline nuevo.

## Puente Flow (extensión de Chrome, 2026-10-10)

- Corrida completa real desde el botón del Pack (proyecto de Flow nuevo + personajes creados desde cero + varias escenas):
  verificado hasta una escena de punta a punta. Detalle: `docs/16-montaje-flow/02-rutina-flow-mapa.md` §puente.
- La resolución y la duración de Flow no están en el panel de ajustes relevado: se verifican leyendo la pastilla; si el
  dueño las cambia a mano, la rutina avisa pero no las corrige.

## Orquestador: milla cero con RepareHoy (2026-10-10, `docs/17-orquestador/01-milla-cero-reparehoy/`)

- Reel Flow y Reel híbrido arman el MISMO prompt de Concepto (medido: 2.448 palabras iguales). El híbrido necesita su
  bloque de TÉCNICA (hoy sólo lo tiene el animado, 899 palabras) para que el Concepto sepa que mezcla filmadas y mockups.
- El tipo de campaña en Concepto va fijo en "campaña completa" (`piezaYOpciones` en `src/lib/orquestador.ts`): el
  usuario nunca elige el objetivo de la pieza. Afuera (Meta, Google) es la primera pregunta.
- El humor está en los dos ejes (enfoque y tratamiento): 11 de 35 combinaciones lo tocan; "humor + sobrio" se
  contradice y "humor + humor" se repite. Propuesta en la página: humor sólo como tono; ángulo y tono con nombres de la
  industria; una fila de orquestación por objetivo + audiencia. Espera el "dale" de Lucas antes de tocar catálogo o moldes.
- Falta la pregunta de audiencia (cliente / proveedor), que sale de `moments[].audiencia` del media kit y de
  "a quién le hablamos primero" de la tesis. "Dos lados" hoy la suplanta como si fuera un ángulo.
- Hecho ese día: la tesis del kit ahora entra en la ficha del servidor (`server/projectFacts.mjs`, bloque LA TESIS) para
  todos los moldes; antes, con KB, el brief del front se descartaba y la tesis no llegaba al modelo.

## Orquestación de campaña v1 (2026-10-10, `docs/17-orquestador/03-plan-de-campana/`)

- Hecho y sin cablear: la regla (`server/orquestacion-v1.json`), el código que la aplica (`server/orquestacion.mjs`,
  `POST /api/orquestacion/plan`, `GET /api/orquestacion/reglas`) y sus tests (`src/lib/orquestacion.test.ts`, 14).
  Nada de esto toca todavía la generación: Lucas pidió curar la orquestación antes de generar.
- Esperan la curación de Lucas las nueve decisiones de la pestaña "Para curar" (campaña 3+1, pieza del proveedor, tono por
  objetivo, Reel Flow sin Consideración, animado de 18 s, testimonio sólo a mano, etc.).
- Después de curar: cablear Concepto, Guion y Storyboard para que reciban la pieza del plan (el texto nuevo de esos prompts
  va a curación con ChatGPT, doc 36); Flow sólo con los momentos de personas; mockups por pantalla del plan; montaje en orden;
  la pantalla de Concepto muestra la pieza y deja pisar ángulo y tono. La Estrategia que tira siete ángulos queda reemplazada.
- Para RepareHoy (como veedor, por el canal y con OK de Lucas): el kit está sin tildes ni eñes ("sena", "Entra ... conta")
  y le faltan los dolores del proveedor.
- Para sin vueltas: el kit no tiene tesis, los momentos no dicen la audiencia y nombran cuatro pantallas que no existen.

## Radiografía de piezas (2026-10-10)

- Hecha: `server/radiografia.mjs` + `GET /api/radiografia/<proyecto>/<pieza>[?plan=N]` + `scripts/radiografia/armar.py`.
  Cada corrida guarda ahora su prompt (`generation_runs.prompt_text`); las anteriores se reconstruyen y la página lo avisa.
- Arreglado en el camino: los dolores del kit (`pains`, y `dolorDel<audiencia>`) no llegaban a la ficha del modelo cuando el
  proyecto trae KB; ahora sí, igual que la tesis.
- Próximo: la recorrida con RepareHoy (pieza 3 del plan) de Concepto a Storyboard, y su radiografía con `?plan=3`.
- Las coincidencias son por raíces de palabras: si una alerta es falsa, se calibra en `server/radiografia.mjs`.
- Consola de debug (`src/DebugDock.tsx`, botón "Debug" abajo en el Pipeline, `POST /api/radiografia`) y botón "Radiografía"
  en cada paso (página viva en `/radiografia/<proyecto>/<pieza>#<molde>`). Es herramienta de desarrollo: cuando el
  algoritmo esté curado, decidir si queda escondida detrás de una opción o se saca.
- El asistente de proyecto nuevo pregunta Tipo de campaña, Enfoque y Tratamiento: para Lucas es "un chino" (2026-10-10).
  Tiene que ser un wizard simple: una pregunta (el objetivo, con nombres de la industria) y el resto lo pre-llena el plan de
  campaña, pisable. Va con el cableado del plan. "Solo mockups" como tipo de campaña ya no tiene sentido (es un formato).
- Curación externa del guion con ChatGPT (2026-10-10): botones "Exportar para curar" e "Importar curación" en el paso
  Guion (`src/pasos/CuracionGuion.tsx`, `server/curacionGuion.mjs`, `POST /api/curacion/guion/{exportar,leer,aplicar}`).
  El paquete lleva ficha, brief, concepto, guion, la radiografía de cada paso y los prompts con su modelo; ChatGPT devuelve
  diagnóstico, guion en JSON y "CURACIÓN DE PROMPTS". Aplicar reemplaza el guion, deja Personajes y Storyboard pendientes,
  registra la corrida (proveedor chatgpt) y guarda la curación en `base-compartida/mediastudio/curaciones/NN-guion-*.md`.
  "Aplicar" no se probó de punta a punta para no ensuciar la carpeta compartida: lo prueba Lucas con la respuesta real.

## Agente de mockups (2026-10-10, lo acordado con Lucas: el motor escribe los mockups de cualquier app desde sus capturas)

- Hecho: `server/agenteMockups.mjs` + `POST /api/mockups-app/escribir {appId}` + botón "Escribir tarjetas con el agente" en
  Rodaje. El agente (Opus local) mira las capturas del media kit, usa de vara `src/remotion/munify/Tarjetas.tsx`, escribe
  `src/remotion/apps/<id>/Tarjetas.tsx` + `catalogo.json`, el motor lo registra (`apps/index.ts`), lo dibuja cuadro por
  cuadro y, si rompe, le devuelve el error; después un juez visual: mira sus cuadros contra los de Munify con una lista de
  chequeo y se corrige. Composición `AppTarjetas`; `catalogoDeApp` lo toma por `kb.media_kit_id`.
- RepareHoy: 9 tarjetas, sin errores, dos revisiones (unos 17 minutos y USD 2,8 en total). Cuadros para juzgar en
  looklogic.com.ar/docs/mediastudio/mockups-reparehoy/ y en `docs/16-montaje-flow/mockups-repareya/`.
- Juez (2026-10-11): mide el movimiento (tira de 4 cuadros por tarjeta, cambio medio en la zona de la tarjeta, umbral 0,6) y
  repite solo hasta 3 vueltas. RepareHoy: 3 de 9, 6 de 9, 9 de 9. Lucas pidió que se vea "cómo pasás de uno a otro".
- Estados reales: HECHO (2026-10-11). RepareHoy los capturó (25 capturas) y el agente reescribió las 9 tarjetas desde
  ellos: 6 de 9 se movían en la primera medición, 9 de 9 después de una corrección (17 minutos, USD 2,1).
  Las tarjetas escritas por el agente quedan en el repo como código: revisarlas antes de commitear.
- Juez por tarjeta (2026-10-11, Lucas: "¿cómo vas a correr todo de vuelta? Porque falla una"): el juez corrige en paralelo
  sólo las tarjetas que fallan (`bloqueDeTarjeta`) y re-mide sólo esas; la revisión del marco con todo en movimiento quedó
  apagada; un error de la prueba se repite una vez antes de llamar al agente; una tarjeta que rompe al dibujarse se corrige
  sola. Pedido puntual: `POST /api/mockups-app/escribir {appId, soloRevisar: true, corregir: [{id, motivo}]}`.
- PENDIENTE: corregir dos textos que no están en ninguna captura de RepareHoy, con el pedido puntual de arriba:
  `pagar-sena` dice "Pago acreditado" y "Seña pagada" (la app: "Pagar $124.000", "¡Pago recibido! Estamos confirmando tu
  reserva.", "Marcar evento como finalizado"); `linea-de-tiempo` dice "Seña pagada" (la app: etiqueta "CONFIRMADO", rótulo
  "Trabajo agendado"). No se corrió porque la red estaba lenta (2026-10-11 02:00) y los renders se colgaban.
- PROPUESTA, espera dale: fuentes locales para Remotion. Hoy cada render baja de Google las fuentes de TODAS las
  composiciones (también Inter de Munify); con la red lenta, todo render se cuelga (timeout de delayRender). El límite subió
  a 120 s, pero la cura es servir las fuentes desde el repo. El agente, ante ese timeout, pasó las fuentes a CSS: se volvió
  atrás (con CSS Remotion no espera la fuente y el cuadro sale con otra) y su pedido ahora prohíbe hacerlo.

## Curación 02 aplicada al motor (2026-10-11, `base-compartida/mediastudio/curaciones/02-auditoria-integral-reparehoy.md`)

- Lucas: "la curación tiene que ser a nivel del motor, para que el resultado lo tengamos nosotros". Aplicado tal cual:
  enfoque caso (`fichaTexto`), tratamiento cálido, strategy/2.1, concept/3.1, script/2.1, storyboard/2.1 (insertos de
  pantalla: `pantalla` con el nombre exacto de la captura, no van a Flow) y el compilador de Flow (sin interfaces).
  Rodaje engancha solo cada mockup en su escena inserto al generar los mockups. 592 tests en verde.
- Prueba con la pieza de RepareHoy (pieceId `prueba-motor-curacion-02`): conceptos fieles al ángulo, guion natural, a Flow
  van 3 escenas en vez de 5. Comparación en looklogic.com.ar/docs/mediastudio/motor-curado-reparehoy/.
- Queda: el storyboard sumó 35 s para una pieza de 26 (los insertos se cuentan aparte de la voz: el montaje tiene que
  superponerlos); "Llegaron tres presupuestos" todavía dice "tres" y no "hasta tres"; voces aparte sin lip-sync (decisión
  de Lucas); control editorial y QA semántico (§6.3 y §6.4 de la curación).


## Mockups: el método único (2026-10-11, pedido de Lucas: "no puede haber otro método, es este")
- El agente viejo (escribía las nueve tarjetas a ciegas en un archivo, con juez de movimiento y parches) se BORRÓ
  (`server/agenteMockups.mjs`). Nunca vio una imagen: el motor corría todas las IA sin herramientas.
- Hoy: `server/tarjetasPlantilla.mjs`. Procedimiento fijo en código (`src/remotion/apps/_base/Marco.tsx`: resolución,
  animación, marco, piezas y medidas; ejemplo del método: `_base/ejemplo-munify-tesoreria.tsx`); branding desde el kit
  sin IA (`marcaDesdeKit`); una llamada por pantalla, de a tres, con Read para ver la captura y sus estados, y la vara de
  Munify (`docs/16-montaje-flow/estandar-mockups/munify-ocho-referencias.png`). Prueba con RepareHoy: 9 de 9 en unos
  3 minutos y medio. Progreso real en Rodaje (`GET /api/mockups-app/progreso`).
- Queda: alguna tarjeta puede quedar justa de alto y cortar la última pieza en el último segundo (la juzga Lucas).

## Pasos del pipeline y multipista (2026-10-11, pedido de Lucas)
- HECHO: el Rodaje desapareció. Pack Flow muestra la automatización y debajo "Los crudos de Flow" (`src/pasos/CrudosFlow.tsx`);
  el paso 7 es Mockups (`src/pasos/PasoMockups.tsx`): un botón escribe los mockups (agente con progreso) y los pasa a video;
  después Montaje. El id interno del paso sigue siendo `rodaje` para no perder estados guardados.
- HECHO: la vuelta del multipista al montaje (`tracksToMontaje`) ya no pierde nada: antes borraba la placa final, el estilo
  de marca, el motor de render y, por escena, los acercamientos, los insertos de pantalla (mockups) y las palabras. Probado
  con el montaje real de sinvueltas-montaje-v2 (ida y vuelta sin pérdidas) y con un test nuevo.
- FALTA: que el multipista MUESTRE para el ajuste fino lo que hoy sólo conserva: los insertos de pantalla (una pista
  "Pantallas" con cada mockup sobre su escena), la placa final al final de la pista de video, el logo y los acercamientos.
- FALTA verificar: la descarga directa de clips del puente Flow (0.4.1) con una corrida real (las 3 escenas de
  "El presupuesto fantasma" ya están generadas en Flow; recargar la extensión y tocar Automatizar).
- HECHO (2026-10-13): DIRECTORIO DE CANCIONES, 24 temas (8 estilos × 3, 30 s) compuestos con ElevenLabs Music en
  `server/storage/canciones/` (`catalogo.json`, `GET /api/canciones`); el generador vive en el scratchpad de la sesión
  y se puede volver a correr para ampliar (nuevos estilos = más filas en ESTILOS). Lucas juzga el nivel con dos muestras.
- (2026-10-13, Lucas: "hasta te diría efectos especiales; primero canciones") EFECTOS ESPECIALES (SFX): hoy la pista
  SFX del multipista está vacía. Falta un directorio de efectos (whoosh, pop, click, campana, etc.) y que el armado los
  ponga en los cambios de material y en la placa.
- HECHO (2026-10-13): la modelo de Munify es el personaje "Presentadora" del proyecto de Flow `1c6046c1…`
  (`server/presentadora.json`); su escena de cierre se genera ahí, en un segundo trabajo después del pack principal.
  FALTA verificar con una corrida real (sale en la próxima generación de un pack).
