# Feedback de Gemini (Google) sobre el documento técnico — crudo

> Fuente: Gemini (modelo de Google, "dueño" de Flow/Veo) analizó `01-media-studio-flujo-completo.md`.
> Preservado tal cual para trazabilidad. Destilado + impacto en el diseño: `02-BRIEF-DISENO-UI.md` §9.
> Fecha: 2026-07-11.

---

## Lo que deberías mirar de cerca (los cuellos de botella)

**El paso manual ("Rodaje"):** Hoy dependés de copiar y pegar prompts en Google Flow/Veo 3.1 y descargar
los MP4 a mano. Esto rompe la automatización. Está perfecto como MVP porque no hay una API pública y
barata de Veo todavía, pero tu arquitectura ya está pidiendo a gritos conectarse a una API de generación
de video (como Luma Dream Machine, Runway Gen-3, o la API de Vertex AI de Google cuando se abra del todo
para Veo) para que el paso rodaje sea un webhook, no una tarea humana.

**Playwright para Motion Graphics:** Es una solución muy ingeniosa para recrear pantallas (mockup-reel),
pero Chromium puede ser pesado y propenso a romperse si las pantallas en el KSP cambian su estructura. A
futuro, podrías evaluar generar animaciones con herramientas nativas de código como Remotion (React para
video), que se compilaría perfecto con tu stack.

## 3. El Storyboard y el enfoque "Image-First"

Tu adaptación al modelo de Flow separando estilo, personaje (con prompt de imagen) y escena es la forma
correcta de hacerlo hoy.

Los modelos de video generativo sufren de amnesia temporal. Si le pasás el texto del físico del personaje
en cada escena, te va a generar una persona distinta cada vez. Al forzar la consistencia mediante una
imagen de referencia generada en el paso anterior (Nano Banana), estás asegurando la continuidad del
casting. La calidad del storyboard estructurado así es de nivel profesional.

## 4. ¿Qué hacer en Google vs. qué hacer en Media Studio?

Mencionás la duda de si vale la pena hacer el montaje en tu app o usar directamente "Google Apps" (que
asumo te referís a la suite de creación impulsada por Veo).

**En Google (Veo 3.1):** Solo dejá la generación cruda de los clips. Que Google sea tu "director de
fotografía" y tus "actores". Le pasás los prompts de imagen y acción, y te devuelve el B-Roll o el
talking-head.

**En Media Studio (Tu backend + FFmpeg):** Mantené la orquestación y el ensamblado. ¿Por qué? Porque vos
necesitás sincronizar el audio de ElevenLabs (que tiene el tono rioplatense perfecto, cosa que la IA de
Google suele pifiar y hacer sonar neutro/mexicano), aplicar el ducking preciso de la música, y quemar el
logo de la marca (BrandKit) de forma programática. Herramientas automatizadas externas no te van a dar el
control de milisegundos que te da FFmpeg ni te van a respetar el protocolo KSP.

El documento refleja una ingeniería muy sólida pensada para escalar a distintos formatos. Estás
construyendo un motor de agencia de publicidad en código.

## Pregunta abierta (el norte, multi-formato)

Viendo que tu objetivo a futuro ("el norte") es abstraer el formato para sacar spots 16:9, reels 9:16 o
piezas de display de forma agnóstica, ¿tenés pensado cómo vas a manejar la refactorización geométrica de
los videos generados en Veo (por ejemplo, si te da un 9:16 pero el formato elegido era 16:9), o la idea es
pedirle a la IA de video la relación de aspecto correcta desde el prompt inicial del flowpack?

> **Respuesta de producto (ver `02-BRIEF-DISENO-UI.md` §9.5):** pedir el aspect ratio correcto DESDE el
> prompt del flowpack (Veo genera nativo en el formato elegido). El reencuadre por FFmpeg queda como plan B
> para reutilizar material ya generado. El selector de formato es una decisión TEMPRANA que tiñe todo el
> pipeline, no un ajuste de export al final.
