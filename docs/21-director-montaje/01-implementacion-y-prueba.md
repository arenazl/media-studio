# Director de montaje publicitario — V1 (2026-10-13)

Implementación en **tres etapas** dentro de PR #2, sin cambiar los formatos que ya entrega Media Studio.

## 1. Sonido y operaciones realmente ejecutables

- `MontajePlan.musicCues` almacena intervenciones musicales en anclas `escenaN` y `cuando: antes/inicio/final` (nunca en coordenadas de píxel). Se mantienen coherentes si cambia la duración de una escena.
- `direccionMontaje.ts` convierte esas instrucciones en intervalos reales de audio; `derivar.ts` aplica una envolvente con rampas de 70 ms. También ejecuta los silencios `silences` legados, que antes no estaban incorporados al volumen de Remotion.
- El ducking deja de saltar abruptamente entre 100% y 35% del nivel musical. Usa transición de ~100 ms de entrada y ~180 ms de salida. La pista de voces **no** se silencia durante el music drop.
- Cuando el cierre es `presentadora`, el armado no genera ni superpone un locutor adicional. El video conserva su propio audio.
- El tratamiento sobrio/aspiracional y los enfoques institucional/testimonio no agregan whooshes automáticos. Los SFX manuales continúan disponibles.

**Límite conocido:** esto automatiza balance y pausas musicales, no ecualiza ni nivela por LUFS **cada actor individualmente**. La normalización final de `renderRemotion.mjs` a -14 LUFS sigue vigente.

## 2. Dirección IA + motor determinístico

- Catálogo **agnóstico de la marca**: `server/montaje-patrones.json` con patrones por tipo de historia y clima (comedia, demostración, testimonial, institucional, antes/después, etc.). Son heurísticas, nunca escenas obligatorias.
- Runner `montageDirection/1.0` recibe concepto, guion, enfoque, tratamiento, objetivo, categoría del negocio, cierre, lista de escenas *reales*, palabras transcritas, disponibilidad de música/SFX.
- Único contrato posible: `{ diagnostico, decisiones: [{recurso, escenaN, cuando, durSec, motivo}] }`, hasta ocho decisiones; el prompt pide 0 a 5. Los recursos son `music_drop`, `music_dip`, `music_lift`, `cut`, `dissolve`, `show_face`, `sfx_off`.
- Backend valida recursos, números de escena, orden y duraciones. El compilador front vuelve a validar y **rechaza** una decisión cuyo clip, música o SFX no existe. **No inventa** videos, locutores, interfaces ni recursos.
- `PasoMontaje`: botón **Proponer dirección con IA**, diagnóstico y lista de operaciones con motivo. Al aplicar, guarda el plan previo para **Deshacer dirección IA**. El plan resultante lo comparten Remotion, el editor y la exportación.
- Se pueden insertar pausas manuales, modificar **cuándo**, **intensidad** y **duración**, o borrarlas individualmente. Una automatización no se agrega hasta que el plan tiene música.
- Cambiar de variante cancela la etiqueta de dirección IA para evitar mostrar un diagnóstico obsoleto.
- El automático inicial no gasta tokens de IA: sólo ejecuta reglas básicas. La propuesta del director se solicita explícitamente.

**Decisión de producto:** la IA nunca manipula directamente bytes de media, fotogramas o pistas; decide intenciones dentro del contrato. El usuario decide si deja su propuesta o edita en el multipista.

## 3. Flujo comercial y guion coherentes

- En **Estrategia**, el objetivo comercial es la única elección: presentación de marca, demostración, consultas, campaña completa o sólo pantallas animadas. Mantiene los ids de backend `awareness`, `demo`, `conversion`, `campaña`, `solo-mockups`.
- `Comercial.perfilCampana` guarda esa decisión y `PasoConcepto` la transmite efectivamente al molde de Concepto. Antes se enviaba siempre `campaña`.
- El **tipo de historia** (`enfoque`) y el **clima** (`tratamiento`) se eligen por **pieza**, no una vez para toda la campaña. Se mantienen sus IDs compatibles con proyectos anteriores.
- Eliminado el selector de `perfil` duplicado dentro del catálogo de Concepto y los antiguos controles de `tono`, `duración`, `estructura` de Guion que la pantalla no usaba. La duración sigue viniendo del formato de salida/reel.
- Guion/regen ya transmiten el clima elegido en vez de `tono: cercano`. `script/3.10` pide **reacciones visuales observables**, pero delega pausas, cortes y música al Director de Montaje.

## Prueba de aceptación — desde el UI

1. Crear una campaña para un negocio cualquiera. Elegir **Dar a conocer la marca**. Comprobar que el Concepto recibe ese objetivo y que allí se puede seleccionar historia y clima por pieza.
2. Crear un spot **institucional + sobrio**. Generar las tomas, llegar a Montaje y comprobar que no se insertan whooshes automáticos ni silencios por existir una escena de rol `giro`/`gag`. Con música disponible, pulsar **Proponer dirección con IA**. Leer diagnóstico y motivos: si no hay decisiones justificadas, cero operaciones es correcto.
3. Crear un spot **humorístico** que tenga una reacción realmente filmada. Usar el mismo botón. Una pausa de música solamente es plausible si existe un anclaje real; modificar su duración o quitarla y reproducir de nuevo.
4. Cambiar cierre a **Presentadora**, regenerar el montaje y comprobar que no se superpone la voz de locutor sobre la de la actriz.
5. Ir al **multipista**, guardar una modificación y verificar que las decisiones musicales y el cierre se conservan en `MontajePlan`; volver, exportar MP4 y comparar el silencio musical y los cambios de volumen contra el Player.
6. Probar **Deshacer dirección IA**: recuperar exactamente el plan previo. Volver a generar una variante: la decisión anterior deja de figurar.
7. Ejecutar CI (Node 22): `node --check server/functions.mjs`, `npx tsc --noEmit`, `npm test`, `npm run build`. No implica prueba audiovisual/escucha de Flow.

## Archivos relevantes

`server/functions.mjs`, `server/prompting.mjs`, `server/montaje-patrones.json`, `server/index.mjs`, `src/lib/direccionMontaje.ts`, `src/lib/montajePlan.ts`, `src/remotion/derivar.ts`, `src/lib/armarMontaje.ts`, `src/lib/locutorCierre.ts`, `src/pasos/PasoMontaje.tsx`, `src/lib/comercial.ts`, `src/ProjectWizard.tsx`, `src/pasos/PasoConcepto.tsx`, `src/pasos/PasoGuion.tsx`, `src/lib/functionCatalog.ts`.

**No se cambia master y no se fusiona automáticamente.**
