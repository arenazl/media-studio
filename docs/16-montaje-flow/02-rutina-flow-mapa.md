# Mapa para la rutina automática Media Studio → Flow (relevado a mano el 2026-10-09)

**Para el dueño.** Esto es lo que hice con el mouse en tu Chrome, paso por paso, para generar un clip en Flow
desde el pack de Media Studio, bajarlo y montarlo. Es el mapa de la rutina que va a hacer todo sola. Lo que
está acá funcionó una vez de punta a punta (la escena 1 nueva del reel de Munify salió así).

## Lo que la rutina tiene que hacer, en orden

1. **Abrir Flow en el Chrome del dueño con su sesión**, no en un navegador limpio: Google bloquea el login
   automatizado. Hoy lo hice con la extensión de Claude en Chrome, que abre su propia ventana (molesto: el
   dueño la cerró creyendo que sobraba). La rutina definitiva va con Playwright **conectado por CDP a un
   Chrome ya abierto** (`chrome.exe --remote-debugging-port=9222` con el perfil del dueño), sin ventanas nuevas.
2. **Entrar al proyecto** (`flow.google.com/project/<id>`; el id queda guardado en el comercial).
3. **Personajes** (una vez por proyecto): menú izquierdo *Caracteres* → *Nuevo personaje* → pegar el
   `promptImagen` del pack → flecha → esperar la imagen → lapicito del título → nombre en UNA palabra (`vecina`,
   `operario`) → *Listo*. La voz es opcional (el idioma del diálogo lo manda el prompt de la escena).
4. **Caja de prompt** (en *Todo el contenido multimedia*): la pastilla *Agente* tiene que estar APAGADA (gris).
   La pastilla derecha muestra los ajustes: tocarla y dejar **Vídeo · 9:16 · 720p · 8 s · x1 · Veo 3.1 (Fast)**.
   Los ajustes quedan pegajosos entre generaciones, pero conviene leerlos de la pastilla antes de cada disparo.
5. **Por escena**: click en la caja → escribir `@` → se abre el buscador de recursos → click en el personaje
   (`vecina`, tipo *Personaje*) → *Añadir a petición* → queda la fichita → escribir ` ` + el prompt de la escena
   (sin el `@Nombre` en texto: el texto plano NO engancha el personaje; eso nos costó dos generaciones) → flecha
   (→) abajo a la derecha. **Si el primer click en la flecha no dispara, el segundo sí**: el campo pierde el
   foco al terminar de tipear; verificar que apareció un tile gris nuevo arriba a la izquierda de la grilla.
6. **Esperar** ~60 s (Fast). El tile pasa de gris con % a la imagen del clip.
7. **Bajar**: click derecho sobre el tile (o hover → *Más*) → *Descargar* **abre un submenú**: *270p GIF
   animado* · *720p Tamaño original* · *1080p / 4K Resolución mejorada* (estas dos gastan créditos). Se elige
   **Tamaño original**. Chrome deja el archivo terminado en la carpeta de descargas del dueño (en su máquina
   es el **Escritorio**, no `Descargas`) con el nombre del clip (`Crew_repairing_pothole_..._20261010001258.mp4`,
   5,6 MB / 8 s); en `Descargas` puede quedar un `<uuid>.tmp` que también es el mp4 completo. La rutina no
   adivina nada de eso: le pregunta a Chrome (`chrome.downloads.search`) cuál fue la descarga que empezó después
   del pedido y espera a que diga `complete`.
8. **Media Studio**: subir el clip a `/api/projects/<id>/assets`, transcribir (`/api/transcribir`), y armar el
   montaje con el montajista (voz de ElevenLabs para las escenas mudas, inserto de pantalla, placa). El clip
   bajado entra al Rodaje de la escena como toma; el montaje se arma después desde el paso Montaje.

## Lo que sale del pack y lo que NO

- Del pack van: `promptImagen` por personaje y `prompt` por escena. **La escena `cta` no se genera**: la placa
  la pone el montaje. Un prompt que mencione "logo.png" hace que Veo dibuje literalmente "logo.png".
- Los prompts tienen que decir **quién** hace la acción ("the same woman, alone, no other people"): "raises the
  phone" sin sujeto dio una pareja caminando. Eso se corrige en el molde `flowpack`, no en la rutina.
- **x1, no x2**: con el personaje como ingrediente las dos variantes salen casi iguales y cuesta doble.

## Costos (Flow, plan del dueño: Pro)

Veo 3.1 Fast 8 s = 20 puntos por generación; Pro = 1.000 puntos/mes → ~50 clips. Una pieza de 4 escenas con
una repetición cada una ≈ 160 puntos. La rutina muestra el costo estimado antes de disparar.

## Cómo lo ejecuta Media Studio: el puente (extensión de Chrome) — 2026-10-10

**Para el dueño:** Flow no tiene API y la rutina tiene que correr con TU sesión de Google. Una extensión chiquita
en tu Chrome ("Media Studio · Puente Flow", carpeta `extension-flow/`) le pregunta a Media Studio qué paso toca,
lo ejecuta en tu pestaña de Flow y le devuelve el resultado. Vos apretás *Automatizar creación en Flow* en el
paso Pack; la pestaña de Flow tiene que estar abierta, no hace falta que esté a la vista.

**Por qué una extensión y no Playwright:** Chrome 154 bloquea la depuración remota sobre el perfil normal, y las
cookies no se pueden copiar (archivo bloqueado, cifrado atado a la app). Un perfil aparte obliga a entrar a Google
de nuevo y Lucas no quiso otra ventana. La extensión corre adentro de la sesión real, sin login ni robot.

**Piezas:**
- `server/flowPuente.mjs`: el orden de la rutina (igual que arriba) como cola de pasos chicos; cada paso tiene
  timeout; el job se sigue por `GET /api/flow/jobs/<id>`; `soloDescargar: true` baja el clip que ya está en Flow
  sin volver a generar (para retomar una corrida que se cortó después de generar, sin gastar créditos).
- `extension-flow/background.js` (service worker): cada 2,5 s pide `GET /api/flow/puente/comando`, elige UNA
  pestaña de Flow (la del proyecto del job, si no la activa, si no la última usada), le manda el paso por mensaje
  y devuelve el resultado por `POST /api/flow/puente/resultado`. Hace él mismo la navegación (`ir`) y la espera
  de descarga (`esperarDescarga`, con `chrome.downloads.search`), y cronometra las esperas del content script.
- `extension-flow/content.js`: las acciones sobre la página (`estado`, `nuevoProyecto`, `personajeExiste`,
  `crearPersonaje`, `irAContenido`, `apagarAgente`, `ajustes`, `generar`, `esperarGeneracion`, `descargarUltimo`)
  con los selectores reales de Flow. Se inyecta solo si la pestaña estaba abierta desde antes de recargar la
  extensión (`chrome.scripting`), y no se registra dos veces.

**Trampas pagadas (todas de la noche del 2026-10-09):**
- **El reloj no puede vivir en la pestaña.** Chrome frena los temporizadores de una pestaña que no está a la
  vista (1 por segundo; 1 por minuto después de 5 min oculta). La v2, con `setInterval` en el content script,
  "no respondía ajustes en 60 s" apenas Lucas cambiaba de pestaña. Ahora el reloj corre en el service worker
  (que no se frena) y hasta las esperas de 400 ms se piden por mensaje al background.
- **Una sola pestaña por job.** Con dos pestañas de Flow (la del dueño + una de inspección), cualquiera tomaba el
  paso y la oculta se dormía con él. El background elige la pestaña y la mantiene; además marca la pestaña como
  no descartable para que el ahorro de memoria de Chrome no la mate en medio de la espera.
- **Ajustes:** las pastillas son `button[role=radio]` con `aria-checked` (no `aria-pressed`); el modelo es un
  menú (`aria-label="Seleccionar familia de modelos"`: Omni 1.1 Flash, Veo 3.1 Lite/Fast/Quality); resolución y
  duración NO están en ese panel (quedan pegajosas; se verifican leyendo la pastilla "Vídeo · 720p · 8 s"). Un
  `Escape` sintético no cierra el panel; se cierra tocando de nuevo el disparador.
- **Descargar es un submenú** (ver paso 7); la v0.3.0 clickeaba el primer nivel y esperaba 3 minutos una
  descarga que nunca empezó. Y el aviso `downloads.onChanged` filtrado por `.mp4` perdía el `<uuid>.tmp`.
- **Un content script viejo sigue vivo después de recargar la extensión** (huérfano, sin `chrome.runtime`,
  pero con `fetch`): el servidor sólo entrega pasos a `origen=background` y sólo cuenta el latido de la
  versión 0.3.0 en adelante. Tras cambiar `content.js` o `background.js` hay que **recargar la extensión** en
  `chrome://extensions`; la pestaña de Flow no hace falta tocarla.

**Verificado en vivo (job `flow-1791601476942`, 2026-10-10 00:04 ART):** estado → personajes existentes →
ajustes (2 s) → escena 3 generada en 128 s. La descarga falló por el submenú; corregida en v0.3.1 y probada a
mano (clip en el Escritorio, aviso recibido por el backend). Queda la corrida completa con v0.3.1.
