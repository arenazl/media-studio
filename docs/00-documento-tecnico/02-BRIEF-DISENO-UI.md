# Media Studio — Brief de diseño de UI (para la app de diseño / Claude Design)

> **Requerimiento + contexto completo del producto para el rediseño de la experiencia de Media Studio.**
> El detalle técnico (arquitectura, KSP, motor, tipos, endpoints) vive en el documento hermano
> **`01-media-studio-flujo-completo.md`** — leerlo primero; este brief es el *qué diseñar* y el *por qué*.
> El diseño visual lo hace una app/skill de diseño de aplicaciones. **Este doc es el requerimiento; no
> implementar la UI sin el diseño aprobado.**
>
> **Fecha:** 2026-07-11 · **App:** `d:\Code\media-studio` (React+Vite+TS, corre local).

---

## 1. Qué es (y el norte)

**Hoy:** Media Studio es un **generador de comerciales/reels verticales 9:16**, *storyboard-driven*, que se
alimenta del conocimiento de **otras aplicaciones** (no de un formulario). Toma lo que una app sabe de sí
misma (negocio, marca, pantallas) y produce el pipeline entero de un comercial, hasta el mp4 final.

**El norte (objetivo real):** una **plataforma agnóstica de generación de contenido multimedia**, sin
límite de formato — reels (9:16), **spots para Meta Ads** (feed 1:1/4:5, stories 9:16), **animaciones**,
spots para YouTube/TV (16:9), display, etc. Hoy la única salida de fábrica es el reel; **el diseño tiene
que servir a hoy pero estar pensado para el norte** (el reel es UN formato, no EL producto).

## 2. Cómo funciona (contexto mínimo para diseñar bien)

- **Ingesta (no se tipea nada):** la info entra por el **KSP** — se importa de otra app su *knowledge
  base* (negocio + **branding completo**: paleta de 5 colores, variantes de logo, fonts, fonética, tono +
  pantallas como metadata). El usuario elige una app y arranca; el negocio ya viene lleno.
- **Motor (pipeline de pasos):** `negocio → concepto → guion → cast → storyboard → pack → rodaje →
  montaje → publicar`, con bifurcación **filmado** (video real, vía Google Flow) vs **animado** (motion
  graphics de las pantallas).
- **Integración externa (Google Flow):** en el paso **pack**, la app produce los *prompts*; el usuario va
  a **Google Flow**, genera los videos (personajes por imagen + escenas), los baja y los **reimporta** en
  el paso **rodaje**. Flow es la "cámara"; la app es el guion y la edición.
- **Salida:** el **montaje** arma el mp4 final (voz en off en español, música con ducking, silencios, logo
  quemado, export 9:16).

## 3. El problema (por qué se diseña ahora)

**Ya hubo un rework visual** (tema "consola de estudio", tokens `--st-*`, stepper, timeline NLE) — se ve
pro. **Lo que falla no es la piel, es que la EXPERIENCIA DEL FLUJO no se entiende.** Detectado usándola:

- **No se entiende qué se pega en Flow y qué vuelve a la app.** El usuario preguntó, textual: *"no está
  claro qué pego en Personaje"*, *"¿cómo adjunto el video?"*, *"¿no usamos personajes?"*.
- **La relación entre pasos es invisible.** El **Cast** define personajes, el **Storyboard** los reparte
  en escenas, el **Pack Flow** genera sus imágenes — pero nada en la UI muestra esa cadena. El usuario
  creyó que del Cast se iba directo a Flow.
- **Carteles heredados del flujo viejo mentían** (el Cast decía "se pega verbatim en cada prompt" cuando
  ya no es así). Síntoma de que la UI no comunica el modelo mental correcto.
- **No hay un "mapa" del recorrido:** qué pasos son *adentro de la app*, cuál te manda *a Flow*, y qué
  *vuelve*. Todo se ve como una fila plana de 9 pasos iguales.
- **El branding completo que llega del KB no se explota:** el proyecto no se "viste" con la identidad de
  la app (hoy se usa solo color de acento + logo).
- **El diseño está cableado a "reel":** no contempla el norte multi-formato.

## 4. Objetivo del diseño

Que **cualquiera entienda el recorrido de un vistazo**: de dónde sale la info, qué hace cada paso, **qué
va a Flow, qué vuelve**, y cómo se termina — y que el shell esté pensado para **múltiples formatos**, no
solo reels. La estética (dark, "consola de estudio") ya está resuelta y se mantiene; **esto es sobre
CLARIDAD DE FLUJO e información, no sobre repintar**.

---

## 5. Requisitos de UI / UX (obligatorios)

### 5.1 El mapa del flujo en 3 fases (lo más importante)
Agrupar los pasos en **tres fases visualmente distintas**, para que se entienda dónde está uno y cuándo se
sale a Flow:
- **PREPARAR (en la app):** negocio → concepto → guion → cast → storyboard. *"Armás el guion y los
  personajes."*
- **GENERAR (fuera, en Google Flow):** pack → [Google Flow] . Marcar claramente que **acá se sale a una
  herramienta externa**: la app te da los prompts, vos generás los videos en Flow.
- **TERMINAR (en la app):** rodaje → montaje → publicar. *"Traés los videos y armás el comercial final."*

El stepper actual (fila plana de 9) debe comunicar estas fases (agrupación, separadores, un hito "vas a
Flow" entre GENERAR y TERMINAR).

### 5.2 Claridad de "qué es interno / qué se copia / qué vuelve"
En cada paso tiene que ser obvio el tipo de artefacto:
- **Ficha interna** (no se toca ni se pega): ej. el **Cast** — es la descripción del personaje que la app
  usa para generar su imagen. Marcarlo como *interno*, no como algo copiable a Flow.
- **Para copiar a Flow:** ej. el **Pack Flow** — los prompts de personaje (imagen) y de escena. Botón
  copiar destacado, con estado por ítem (**pendiente → copiado → importado**).
- **Para importar de Flow:** ej. el **Rodaje** — dropzones por escena ("Importar clip"), con preview y
  aviso de duración.
Un lenguaje visual consistente (iconos/colores/badges) que distinga estos tres tipos en TODOS los pasos.

### 5.3 Mostrar la cadena entre pasos
Hacer visible que **Cast → Storyboard → Pack Flow** es una cadena: el mismo personaje (avatar/color)
debería reconocerse en el Cast (ficha), en el Storyboard (repartido por escena) y en el Pack Flow (su
imagen). El usuario tiene que *ver* que el personaje "viaja" por los pasos.

### 5.4 El copiloto contextual (mantener y elevar)
Ya existe un panel **Copiloto** por paso ("qué hizo la IA" + "qué tenés que hacer" + progreso). Es clave
para la claridad — el diseño debe integrarlo como parte del layout (no un agregado), especialmente en el
paso Pack Flow (el más confuso).

### 5.5 El arranque desde una Integración (KSP)
La entrada "Nuevo proyecto desde una Integración" merece una pantalla propia bien diseñada: mostrar **las
apps disponibles**, y al elegir una, **qué se va a traer** (negocio + marca + pantallas) antes de crear el
proyecto. Hoy es un botón secundario; es EL punto de entrada del producto.

### 5.6 Identidad de marca por proyecto
Cada proyecto debería "vestirse" con la **identidad de la app** que representa: usar la **paleta completa**
del KB (primary/accent/secondary/ink/surface), el logo y las fonts — no solo un color de acento. El
proyecto de Munify debería *sentirse* Munify.

### 5.7 El shell pensado para multi-formato (el norte)
Diseñar el marco para que el **formato de salida** sea un concepto de primer nivel (elegible al crear la
pieza): reel 9:16, spot Meta (1:1/4:5), stories, animación, YouTube 16:9. Hoy no hace falta implementarlos
todos, pero **el diseño no debe asumir "siempre un reel vertical"** — debe dejar el lugar para el selector
de formato y para aspectos distintos.

---

## 6. Restricciones técnicas (para que el diseño sea implementable)

- **Stack:** React + Vite + TypeScript. Tema **"consola de estudio"** ya existente con tokens CSS `--st-*`
  (`src/styles/studio.css`) — **reusar y extender, no reemplazar**.
- **Estructura:** cada paso es un componente `src/pasos/Paso*.tsx` montado en un shell (`PasoShell`); el
  wizard es `src/Pipeline.tsx` (controlled) con el Copiloto como panel hermano.
- **Datos:** el pipeline se apoya en `src/lib/comercial.ts` (tipos `Comercial`/`PackFlow`/etc.) — el
  diseño no puede pedir campos que no existen sin marcarlos como propuesta.
- **Local-first:** la app corre local y anda sin backend (localStorage + dual-write). No asumir tiempo
  real ni servicios externos en la UX.

## 7. Reglas duras (no negociables)

- **Sin emojis.** Solo iconos SVG modernos (Lucide, ya en uso).
- **Español rioplatense** en toda la UI (voseo).
- **Dark theme "consola de estudio"** — mantener la dirección visual actual; esto es claridad de flujo, no
  un repintado.
- **Viewport PWA estándar:** sin zoom en inputs, sin scroll horizontal, safe-area de iPhone respetada
  (ver `base-compartida/11-FIX-VIEWPORT-PWA.md`).
- **No inventar datos** en mockups: usar el ejemplo real de Munify (o placeholders marcados `[DEMO]`).
- **No romper el pipeline de datos** (`comercial.ts`) ni la ingesta KSP — el rediseño es de experiencia y
  presentación.

---

## 8. Entregable esperado de la app de diseño

1. **Dirección de experiencia del flujo:** cómo se comunican las 3 fases y el hito "vas a Flow".
2. **Sistema de artefactos:** el lenguaje visual para *interno / copiar / importar* aplicado a los pasos.
3. **Mockups** de: home + integración (KSP), un paso de PREPARAR (ej. Cast/Storyboard con la cadena de
   personajes), el **Pack Flow** (el más crítico), Rodaje y Montaje.
4. **Propuesta del selector de formato** (norte multi-formato) — aunque hoy solo se implemente el reel.
5. Todo sobre el tema `--st-*` existente (extendido si hace falta), listo para que el implementador lo
   traduzca a los `Paso*.tsx`.

---

## 9. Feedback externo (Gemini / Google) — arquitectura y su impacto en el diseño

Gemini (modelo de Google, "dueño" de Flow/Veo) analizó el documento técnico, validó la arquitectura y
marcó los cuellos de botella. Texto crudo preservado en **`03-feedback-gemini.md`**. Lo que Claude Design
debe tener en cuenta:

**9.1 El paso "Rodaje" es hoy MANUAL (copiar prompts + bajar mp4 a mano) — el cuello de botella.**
Correcto como MVP (no hay API pública barata de Veo todavía), pero el norte es conectarse a una API de
generación de video (Luma Dream Machine, Runway Gen-3, Vertex AI/Veo cuando abra) para que **Rodaje sea un
webhook, no una tarea humana**.
→ **Impacto en el diseño:** diseñar el paso Rodaje para soportar **dos modos sin rehacerlo**: (a) *manual*
(hoy: importar el mp4 por escena) y (b) *automático futuro* (la app dispara la generación por API y
muestra estado **"generando… → listo"** por escena, sin intervención). El bin de cada escena necesita un
estado de *generación en curso* además de *pendiente/importado*.

**9.2 Playwright/Chromium (motion graphics) es frágil si las pantallas del KSP cambian de estructura.**
A futuro: **Remotion** (React para video) compila con el stack. → Es decisión de *backend*; **no cambia la
UX** del reel animado. Nota informativa: el diseño del reel animado no debe atarse al motor de render.

**9.3 El enfoque image-first del storyboard está VALIDADO como nivel profesional.**
Los modelos de video sufren "amnesia temporal": si les pasás el físico por texto en cada escena, generan
una persona distinta cada vez. La **imagen de referencia** (Nano Banana) asegura la consistencia del
casting. → **Confirma y refuerza §5.3:** el diseño debe hacer **protagonista** la imagen de referencia del
personaje en el Pack Flow — es el ancla de continuidad, no un detalle.

**9.4 División de trabajo confirmada: Google = generación cruda · Media Studio = orquestación + ensamblado.**
El **montaje en la app es el corazón del valor**: sincroniza el audio de ElevenLabs (tono rioplatense, que
la voz de Google suele pifiar a neutro/mexicano), aplica el **ducking preciso** de la música y **quema el
logo** del BrandKit programáticamente — control de milisegundos que da FFmpeg y que las herramientas
externas no. → **Impacto en el diseño:** el paso **Montaje** debe **destacar ese control como el
diferencial** (voz rioplatense, ducking, logo de marca), no presentarse como un "Exportar" genérico. Es
donde la app demuestra que es una agencia de publicidad, no un botón.

**9.5 Pregunta abierta del norte (multi-formato): cómo manejar la geometría (aspect ratio).**
**Decisión de producto:** pedir el aspect ratio correcto **desde el prompt del `flowpack`** (Veo genera
*nativo* en el formato elegido) — **no** refactorización geométrica posterior (recortar un 9:16 a 16:9
pierde encuadre y calidad). El reencuadre por FFmpeg (relleno/blur o crop) queda como **plan B** para
reutilizar material ya generado. → **Impacto en el diseño:** el **selector de formato (§5.7) se elige AL
PRINCIPIO** — tiñe el concepto, el guion y los prompts. El diseño debe comunicar que el formato es una
**decisión temprana** que atraviesa todo el pipeline, no un ajuste de export al final.
