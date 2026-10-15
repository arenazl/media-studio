# Revisión independiente — Probador Flow (para Claude)
Fecha: 2026-10-15
Branch: `feature/flow-probador-local`
Responsable de la revisión: ChatGPT
Estado: observaciones para evaluar; NO cambios de implementación.

## Encargo
Revisar el probador de Media Studio y el experimento informado de tres motores (Omni Flash 1.1 360p, Veo 3.1 Lite 720p, Veo 3.1 Fast 720p), con el MISMO prompt/personaje de la presentadora de Munify. La frase informada fue «Qué bueno verte de nuevo», 8 segundos, 9:16, x1. Quality no fue probado.

Este archivo contiene críticas y propuestas para que Claude las contraste con las evidencias locales reales (logs, archivos, interfaz Flow). No asumir que todo el informe ya quedó verificado por GitHub: los videos y algunos datos operativos pueden estar solo en almacenamiento local.

## Lo acertado
- Pantalla independiente, branch aparte y extensión LAB separada del puente estable.
- Mismo prompt, duración prevista y personaje de Flow para comparar a igualdad aproximada de condiciones.
- Validación previa del modelo/resolución/salida y modo de un intento para limitar consumos involuntarios.
- Descarga y vista de resultados lado a lado; guardar modelo solicitado/real y prompt en UI ayuda a comparar.
- Distinguir generación de imagen/cast (Nano Banana) de generación de video (Veo/Omni) continúa siendo esencial para costos.

## Hallazgos que NO se deben sobregeneralizar
1. **N=1 por motor:** no concluir «Lite tiene la misma calidad que Fast» con una sola escena. Decir «en esta muestra no se observó diferencia de nitidez»; expresión, sincronía y fidelidad requieren más muestras.
2. **Omni cumplió el texto mejor en esta muestra** (según informe): frase completa al segundo ~2; Lite comenzó al segundo ~5; Fast agregó «¡Qué bueno!». La fidelidad al diálogo y el tiempo hasta primera palabra importan más que la resolución para el objetivo de videos realistas.
3. **51 s / 58 s / 49 s** son tiempos de corrida observados, no evidencia de latencia típica; informar dispersión tras más de una muestra.
4. **360p vs 720p:** la mayor nitidez de Veo es esperable, pero el reescalado no recupera actuación ni labios; comparar el mismo clip Omni antes/después del upscale por separado.
5. **Costos:** Lite 10 y Fast 20 créditos figuran como valores reportados; para Omni 360p NO fijar como hecho 4–7 ni un número exacto sin leer el precio de la cuenta / saldo antes y después. Separar costo estimado, publicado, observado y reembolsado. «Fallos reembolsados» requiere transacción o saldo como evidencia, no solo notificación visual.

## Voz y comparabilidad
Según el informe hubo cuatro fallas «no se pudo generar el audio» con Lite/Fast y luego éxito tras configurar voz en la presentadora; Omni funcionó antes. Esto es correlación observada, **no** demostración de que TODAS las referencias/personajes necesiten voz en Veo. Verificar en Flow si la asignación es realmente requisito, condición del modo Ingredients, incidencia del prompt, o cambio temporal del servicio. Documentar la configuración exacta de la voz y si se heredó a los tres modelos.

## Riesgos técnicos para revisar en código
- `src/ProbadorFlow.tsx`: historial persistido en `localStorage`; registra hasta 12 resultados, pero no constituye auditoría reproducible con fecha/horas del servidor, intentos, hashes de prompt, saldo, costo consumido, voz/config y métricas de calidad. Los MP4 están en almacenamiento local; confirmar URLs y persistencia tras reiniciar backend y borrar localStorage.
- `server/flowPuente.mjs`: `unIntento` protege de reintentos automáticos, pero si la respuesta de generar es incierta puede existir clip remoto no importado. La recuperación debe priorizar consulta/verificación del último tile de Flow **sin pulsar generar de nuevo**.
- `extension-flow-lab/content.js`: comprobar comportamiento real de selectores estrictos de tipo/modelo/duración/resolución/x1 y modo de referencias con todos los motores. Leer el precio mostrado en Flow antes de pulsar; no confiar solo en etiquetas fijas en UI.
- `extension-flow-lab/background.js`: revisar auto-recarga y coexistencia de extensiones; pueden consumir la misma cola. Verificar que la extensión LAB se identifique sin ambigüedad y que no recargue durante trabajo activo.
- `server/index.mjs`: validar que endpoint de probador sea *solo local*, bloquee trabajos concurrentes, no contamine comerciales/presets y que el archivo descargado corresponda realmente al job actual. Confirmar que no hay reintento silencioso al producirse una falla incierta.
- Probar con tests de sintaxis/build/lint reales y un smoke test que NO genere videos; revisión del código no sustituye ejecución.

## Próxima prueba mínima (control de créditos)
A. Primero intentar **solo upscale del mismo Omni 360p a 720p**, si la cuenta Flow confirma explícitamente costo 0 antes de aceptar. Conservar archivo original y escalado; comparar nitidez/artefactos sin confundirlo con nuevo render.
B. Luego, si todavía hace falta elegir arquitectura, solo una escena adicional que exija habla sostenida (5–7 s), expresiones, manos y microgestos, mismo personaje y misma voz/config. Comparar inicialmente Omni vs Lite, evitando Fast salvo necesidad justificada.
C. Evaluación ciega por clip: (i) transcripción exacta con agregados/omisiones; (ii) segundo de inicio del diálogo; (iii) labios; (iv) naturalidad facial/manos/cuerpo; (v) consistencia de identidad; (vi) artefactos de imagen; y anotar nivel de confianza, no solo «me gusta/no me gusta».
D. Registrar por corrida: fecha, job ID, clip remoto, fichero local, prompt exacto, modelo pedido/confirmado, resolución, duration/salidas, modo de referencia, voz, tiempo, resultado, saldo antes/después, créditos, fallos y posibles reembolsos.

## Criterio de elección
No imponer un solo motor a todo Media Studio. Considerar política **por tipo de escena**: borradores Omni; final Omni solo si habla/gestos/sincronía y upscale resultan suficientemente buenos; Lite como opción de cierre por costo/calidad; Fast únicamente si en un caso concreto ofrece una mejora comprobada. No declarar que Quality «pierde la cara» con certeza absoluta sin matizar: no admitir cierta modalidad de referencias no equivale a pérdida garantizada en todo escenario, y no fue probado.

## Pedido concreto a Claude
1. Contrastar estos hallazgos con MP4, logs, UI y fuente real de la rama. Marcar cada afirmación **verificada / indicio / no verificada / descartada**.
2. Identificar bugs graves o afirmaciones inexactas y proponer correcciones acotadas; separar hallazgos de cambios sugeridos.
3. Dejar resultados en documentación del mismo branch, con referencias a rutas/líneas y evidencia objetiva.
4. **No generar clips, no gastar créditos, no deployar y no modificar main** sin aprobación explícita del usuario. El upscale de costo cero requiere validación previa de costo y consentimiento antes de ejecutarlo.
