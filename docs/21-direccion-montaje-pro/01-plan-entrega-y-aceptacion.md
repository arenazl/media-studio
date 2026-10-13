# Dirección de montaje profesional — experimento v1 (13/10/2026)

## Alcance y criterio
Esta rama parte del commit `31c6183` de `master` del 13/10/2026. Es un experimento de **primera edición dirigida**, no un sustituto de una montajista humana ni un sistema que invente material. **No fusionar ni deployar sin pruebas locales.**

La fuente de verdad sigue siendo `MontajePlan`. Remotion reproduce/renderiza ese mismo plan. La IA no recibe acceso a archivos del sistema, no genera nuevas escenas y no decide metadatos arbitrarios: sólo devuelve sugerencias de un catálogo cerrado y el cliente ejecuta/verifica.

## Etapa 1. Calidad del audio y motor ejecutable
- `src/lib/montajePlan.ts` admite `music.automation`: puntos absolutos en segundos con multiplicadores 0..1 y rampas. Un plan antiguo sin puntos equivale a 100% de ganancia previa.
- `src/lib/direccionMontaje.ts` interpreta los puntos y valida siete operaciones (`pausa_musical`, `bajar_musica`, `subir_musica`, `corte_seco`, `fundido`, `zoom_sutil`, `sin_zoom`), ancladas a `escenaN` existente y `src` real; informa lo que descartó.
- `src/remotion/derivar.ts`: ducking con rampas en vez de salto instantáneo; los `silences` por escena **ahora silencian la música** en preview y export, sin cortar ni diálogos ni efectos. Los puntos musicales también actúan en ambos.
- `locutorCierre.ts` y `armarMontaje.ts`: en un cierre con clip de presentadora no crear/montar otra voz automáticamente. La voz lip-sync del video sigue existiendo.
- `efectosSonido.ts`: no meter whooshes de cambio de material en piezas sobrias, testimoniales o institucionales.
- `montajeFromTracks.ts` conserva la automatización musical al guardar desde multipista; `musicaGenerada.ts` al reemplazar la canción.

**Límite**: la normalización final de -14 LUFS ya existente NO normaliza voces de actores individualmente; sin medir audio real no se afirma que la inteligibilidad esté resuelta. La versión v1 automatiza **música**, no ganancia de cada palabra o frase del diálogo.

## Etapa 2. Director de montaje IA opt-in, con herramientas reales
- `src/data/patronesMontaje.json`: biblioteca de patrones por estructura/registro narrativo; no obliga efectos ni tiempos, es agnóstica al rubro.
- `server/patronesMontaje.mjs`: consulta solo patrones pertinentes.
- `server/functions.mjs`: nuevo runner `montageDirection`, que recibe enfoque, tratamiento, propósito, concepto, guion, datos de escenas **ya disponibles**, extractos de su transcripción y presencia de música. Emite `{diagnostico, decisiones[]}` con 0–7 operaciones enumeradas.
- `server/prompting.mjs`: versión `montageDirection/1.0`, validador estricto y reparación estándar del backend.
- `src/pasos/PasoMontaje.tsx`: botón **Proponer montaje con IA**. No se autoejecuta ni reemplaza la versión sin consentimiento. Muestra decisiones aplicadas/descartadas, ofrece **Deshacer dirección IA** sin regenerar música y permite quitar cada punto de automatización de la pista musical.
- El resultado se persiste en `comercial.montaje.plan`; el registro explicativo se guarda en `montaje.direccionIA`. Al reaplicar otra variante manual se borra el registro IA. El editor multipista continúa siendo el ajuste final.

**Límites**: todavía no hay J-cut/L-cut por clip ni análisis automático de golpes musicales, timbre, respiración, microexpresiones o espectrogramas; eso requiere soporte en el plan, además de referencias verificables. La IA no es capaz de comprobar que una toma tiene una reacción que el storyboard no especificó. Es mejor cero decisiones a una operación inventada.

## Etapa 3. Simplificación del proceso comercial
- En `ProjectWizard` se elige solamente el **objetivo** de campaña. En `PasoConcepto` se eligen la **forma del relato** y el **tratamiento emocional** para cada pieza, con explicaciones visibles. Los IDs del proyecto existente permanecen iguales (awareness, demo, conversion, campaña, enfoques y tratamientos).
- `functionCatalog.ts` quita de Guion opciones de tono, duración y ángulo que el paso `PasoGuion` no consumía; el tono se lee de la pieza y la duración del formato/reel.
- `server/functions.mjs`, `script/3.10`: el guion puede sugerir una reacción o un respiro **como intención visual**, sin meter keyframes ni instrucciones de montaje en el diálogo.
- `PasoConcepto`: al regenerar o cambiar dirección, confirma antes de invalidar guion, material vinculado, renders y montaje de esa pieza. No reutiliza en silencio un comercial escrito para otro enfoque. Los archivos crudos externos no se eliminan del servidor, pero se desasocian de la pieza: aviso explícito.

## Para ejecutar las pruebas en la PC de desarrollo
En la raíz de Media Studio, con sus dependencias instaladas:

```bash
npm ci
npx tsc --noEmit
npm test
npm run build
```

Pruebas nuevas: `src/lib/direccionMontaje.test.ts`, `src/remotion/derivarDireccion.test.ts`. Prueba modificada: `src/lib/montajePlan.test.ts` (silencio por humor sólo cuando se pidió). Deben pasar junto con las existentes.

### Pruebas audiovisuales de aceptación (hacer sobre una copia de una pieza)
1. **Institucional sobrio, cierre logo**: el montaje automático no introduce pausa cómica ni whooshes entre cada mockup. Pedir propuesta IA; verificar que el resultado son decisiones sobre escenas reales, o ninguna.
2. **Comedia con escena de reacción**: IA propone opcionalmente `pausa_musical`; en Player y MP4 se interrumpe la música durante la pausa, pero NO se pierde diálogo. Quitar un punto musical y escuchar la diferencia. Deshacer IA restaura el plan anterior sin costos de generación.
3. **Demo con mockups**: ninguna herramienta puede insertar una captura ficticia; el material real sigue intacto y las transiciones son discretas. Cambiar de variante y verificar que la IA deja de figurar.
4. **Diálogos entre actores**: la música cae gradualmente bajo las voces; revisar manualmente saltos de nivel entre actores y ajustar su pista en el editor.
5. **Cierre presentadora**: con clip de Flow que ya tiene voz, NO agregar locutor encima. Cierre logo: sí generar/usar locución si esa modalidad la pide.
6. **Guion/campaña**: comprobar que el Wizard ya no pide enfoque/tono por duplicado; en Concepto aparecen explicaciones; modificar una decisión con material posterior debe pedir confirmación y no dejar un storyboard viejo como válido.
7. **Persistencia**: guardar desde multipista un montaje que tenga automatización, salir y volver, renderizar y comparar la escucha. La exportación usa el mismo `derivarRender` del Player.

## Tareas explícitamente pendientes si el piloto convence
- Automatización gráfica arrastrable en la **pista Música** del multipista (esta v1 muestra y permite quitar puntos en Montaje).
- Nivelación inteligente de diálogos por clip (medición de voz/SNR y compresión por toma antes de la mezcla).
- J/L cuts y edición de ambiente sonoro mediante nueva semántica del plan y no simulando timestamps.
- Validación visual del resultado (no hay render/reproducción reales en el entorno de este PR).
