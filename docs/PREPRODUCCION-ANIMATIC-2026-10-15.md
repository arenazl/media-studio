# Media Studio — selección creativa y preproducción

Rama: `feature/preproduccion-animatic-20261015` (no se mergeó a master).

## Qué quedó implementado

1. **Wizard sin cinco opciones repetidas:** genera el plan de piezas desde el brief. Cada pieza conserva su ángulo y mensaje objetivo.
2. **Concepto como agencia:** botón explícito que propone tres anuncios reales desde el negocio y media kit. No obliga a elegir entre las siete etiquetas de enfoque y cinco de tratamiento. El modelo asigna internamente ambas variables a cada propuesta para que guion/cast/storyboard/montajista las sigan usando. Se conserva el molde v3 antiguo para compatibilidad.
3. **Orden nuevo (híbrido/filmado):** Negocio → Concepto → Guion → Cast → Storyboard → Mockups → Preproducción → Pack Flow → Montaje → Publicar. Animado: Storyboard → Preproducción → Render → Montaje.
4. **Preproducción reproducible:** un animatic en Remotion con las escenas del storyboard, la descripción de la acción, capturas reales y/o mockups existentes, tiempos por escena y diálogos. Si la escena filmada no tiene captura, aparece una tarjeta de storyboard claramente identificada como boceto: no se inventa una imagen fotorrealista.
5. **Comparación real de las tres propuestas:** se conserva el storyboard de la elegida. Las alternativas se pueden preparar **a demanda** mediante 2 (animado) o 3 (filmado) corridas de IA para guion/cast/storyboard, sin tocar la opción actual. Sólo después de verlas se elige la de producción.
6. **Voces provisionales opcionales:** botón explícito ElevenLabs; asignación de voice ID por personaje, texto pasado sin transformación, audio guardado por escena/texto/voz. No se llama automáticamente al TTS; si falla a mitad, quedan guardados los audios anteriores. Se utiliza la API existente `/api/voz/generar`.
7. **Barrera de costos:** Pack Flow queda bloqueado hasta aprobación de Preproducción; la automatización de clips exige además una confirmación explícita de consumo de créditos. Ningún paso de esta función inicia Flow.

## Deliberadamente fuera de alcance

- **No se tocó SalesBot** ni su integración Gemini/ElevenLabs. Cuando se consolide el motor de voz curado, reemplazar sólo el adaptador `generarLocutor` invocado desde `PasoPreproduccion`; las frases, opciones y edición de voces no requieren cambios.
- El animatic no representa actuación, movimiento humano, lip sync ni el resultado final de Veo.
- No se modifica master, no se exportan MP4s, no se gastan créditos de Flow.

## Guía de prueba manual sin consumo de créditos externos

- Abrir proyecto importado desde Media Kit: comprobar que **Negocio** conserva el brief y que Concepto ofrece pedir tres propuestas.
- Generar las tres propuestas (usa IA; no es Flow). Verificar que ninguna invente pantallas o cambie el producto a una sola función.
- Elegir una, aprobar, generar guion/cast/storyboard y pasar por Mockups. Si falta el Media Kit, confirmar que se puede continuar a preproducción.
- Reproducir el prototipo en silencio: verificar orden, frases, capturas, tiempos y placa de cierre.
- Preparar opcionalmente otra propuesta bajo demanda; reproducir y volver entre ambas; comprobar persistencia tras recargar.
- Generar voces **sólo si se quiere gastar en ElevenLabs**. Cambiar voice ID invalida el audio antiguo; misma frase y voz no regeneran.
- Aprobar una alternativa: comprobar que se conservan los artefactos previos como variante y el Pack Flow toma el storyboard realmente seleccionado.
- Antes de aprobar, comprobar que Pack Flow no se habilita. Luego comprobar que la automatización solicita confirmación antes de Flow. Cancelar.
- Crear proyecto anterior sin `propuestas` y verificar que la idea elegida sigue siendo navegable como variante única.

## Limitación de validación

Los cambios se publicaron como código de la rama. No se ejecutaron los tests/build locales en este entorno remoto; deben correr `npm test` y `npx tsc --noEmit` (o `npm run build`) antes del merge.
