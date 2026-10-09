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
7. **Bajar**: hover sobre el tile → icono *Más* (tres puntos, arriba a la derecha del tile) → *Descargar* →
   *720p (Tamaño original)*. Chrome deja el archivo en `Descargas` como `<uuid>.tmp` ya completo (ffprobe lo
   lee, 8 s) y recién después lo renombra; **si se cierra la ventana antes, lo borra**. La rutina copia el
   `.tmp` apenas ffprobe devuelva 8 s, sin esperar el renombre. (Con Playwright + CDP se puede fijar la carpeta
   de descarga con `Browser.setDownloadBehavior` y evitar el `.tmp`.)
8. **Media Studio**: subir el clip a `/api/projects/<id>/assets`, transcribir (`/api/transcribir`), y armar el
   montaje con el montajista (voz de ElevenLabs para las escenas mudas, inserto de pantalla, placa). Todo eso ya
   está en `scratchpad/salidas/montar-flow.py` de la sesión; va al producto como `server/flowDriver.mjs`.

## Lo que sale del pack y lo que NO

- Del pack van: `promptImagen` por personaje y `prompt` por escena. **La escena `cta` no se genera**: la placa
  la pone el montaje. Un prompt que mencione "logo.png" hace que Veo dibuje literalmente "logo.png".
- Los prompts tienen que decir **quién** hace la acción ("the same woman, alone, no other people"): "raises the
  phone" sin sujeto dio una pareja caminando. Eso se corrige en el molde `flowpack`, no en la rutina.
- **x1, no x2**: con el personaje como ingrediente las dos variantes salen casi iguales y cuesta doble.

## Costos (Flow, plan del dueño: Pro)

Veo 3.1 Fast 8 s = 20 puntos por generación; Pro = 1.000 puntos/mes → ~50 clips. Una pieza de 4 escenas con
una repetición cada una ≈ 160 puntos. La rutina muestra el costo estimado antes de disparar.
