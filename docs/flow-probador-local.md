# Probador Flow — laboratorio local aislado

Objetivo: correr una sola escena de 8 s con el mismo prompt y, cuando se necesiten caras consistentes, con el mismo personaje ya creado en un proyecto de Flow. Comparar Omni Flash 1.1 (360p), Veo 3.1 Lite, Fast y, sólo sin referencias, Quality. No toca presets, campañas ni SalesBot.

## Seguridad
- Cada video requiere un click de confirmación.
- Verificar modelo, resolución, duración, x1 y referencias ANTES de generar. Si algún control no existe, frenar: nunca usar el modelo activo como fallback silencioso.
- Sólo UN intento de generación. Si no se sabe si Flow recibió el click, NO repetirlo; inspeccionar Flow manualmente.
- Recuperar/descargar el video generado sí se puede reintentar sin gastar otro video.
- Quality no admite Ingredients/References, según Google; no usar en el circuito de mismos personajes.
- No generar ni instalar ninguna extensión en master, desplegar o consumir créditos durante el desarrollo.

## Extensión de Chrome
Usar la carpeta independiente extension-flow-lab. Por ahora, desactivar la extensión Puente Flow original mientras se pruebe: comparten la cola de la API local y dos extensiones activas podrían consumir comandos cruzados.

Chrome MV3 permite chrome.runtime.reload() para volver a cargar archivos YA instalados. La extensión puede consultar una huella de archivos locales del backend y recargarse cuando se actualicen, siempre que no haya un trabajo activo. Esto evita recargar manualmente en chrome://extensions pero NO hace git pull, NO instala código remoto ni evita tener que actualizar los archivos en disco.

## Fuentes oficiales
https://support.google.com/flow/answer/16352836?hl=es-419
https://support.google.com/flow/answer/16526234?hl=es-419

La documentación oficial publica tablas inconsistentes de costos de Omni según variante/página. Tomar como operativo el costo visible en el panel de la cuenta antes de generar. Lite 10 créditos / Fast 20 para no Ultra, Quality 100; Nano Banana 2 Lite aparece como modelo de imagen sin cargo. Las imágenes de Characters requieren verificar qué modo/modelo está seleccionando realmente esa UI.

## Uso
Checkout de branch feature/flow-probador-local, correr Media Studio localmente y cargar extension-flow-lab como extensión descomprimida. Desactivar la antigua antes de la prueba. Ir a Probador Flow, leer ajustes gratis, confirmar 1 solo clip y evaluarlo.
