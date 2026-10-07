# Plan de ejecución de la reingeniería (costo por fase y qué se hace en qué cuenta)

> 2026-10-07. Plan de ejecución sobre `D:\Code\media-studio\docs\14-skills\MEDIA-STUDIO-REINGENIERIA-COMPLETA.md`
> (la reingeniería funcional, 9 documentos fusionados, fases 0 a 9) y
> `D:\Code\media-studio\docs\14-skills\SKILL.md` (el motor de render cuadro a cuadro).
> La radiografía del estado actual está en `01-radiografia-como-se-genera-cada-etapa.md`.

## Para el dueño

El documento de reingeniería está bien pensado y el orden es el correcto: arreglar los datos que
llegan a los prompts antes de tocar los prompts, convertir Pack Flow en un compilador sin IA, y
recién al final el motor animado. Lo que falta en ese doc es el costo y quién lo hace. Eso es
este plan. En corto: **las fases 0 a 7 y 9 son código normal, se hacen en esta cuenta en cuatro o
cinco sesiones de laburo, y arranco ya con la 0 y la 1. La fase 8 (motor animado) es la única cara
en tokens y conviene correrla en la otra cuenta: esta está al 82% del límite semanal.**

## Dónde difiero del documento (tres puntos, para que decidas)

1. **Auto-disparo.** El doc (P0.6) dice conservarlo pero idempotente. Vos hoy pediste que Concepto
   NO dispare solo: primero se elige la técnica. Lo que dijiste en esta sesión le gana al doc:
   Concepto queda manual; los demás pasos siguen automáticos y se les agrega la idempotencia.
2. **Telemetría.** El doc pide una tabla `generation_runs` en SQLite. Hoy ya hay una línea de log
   por llamada con tiempo, tamaño y costo. Propongo la tabla recién en la fase 9, cuando haya
   datos que comparar, y no antes: es infraestructura que todavía no responde ninguna pregunta.
3. **Structured output (regla 9).** El CLI headless no expone JSON Schema. Se queda el parser
   actual más las cuatro capas de validación del doc. No hay nada que implementar ahí.

## Costo por fase

| Fase (del doc §08) | Qué es | Tiempo | Tokens | Cuenta | Bloqueo |
|---|---|---|---|---|---|
| 0. Baseline | Correr una pieza entera de Munify por la API con el log de tiempos y guardar outputs, prompts efectivos, modelo y costo | 20 min + 5 min de corridas | bajos (4 corridas de Opus) | esta | ninguno |
| 1. Bugs de datos P0 | `scriptToText()` canónico, `publish` y `qa` leyendo el guion, `cast` sin el brief dentro de un paréntesis, `VEO_RULES` sin la contradicción, tests | 1 a 1,5 h | bajos | esta | ninguno |
| 2. ProjectFacts | KB → hechos estructurados; cada molde pide su subconjunto; se retira el corte a 2.500 caracteres | 2 a 3 h | medios | esta | toca cómo se arma el contexto: propongo el shape, espero "dale" |
| 3. Prompt Engine V2 | Versionado, builders por molde, largos en números, schema + validator + normalizer + lint por molde, retry de reparación | 3 a 5 h | medios | esta | son los prompts: se curan de a uno con vos (ya empezó con `concept`) |
| 4. Model routing | `taskClass` en el back, Sonnet por defecto, Opus como override | 30 min | bajos | esta | ninguno |
| 5. FlowPack compilador | `VEO_RULES` en un módulo único, `compileFlowPack()` determinístico, IA sólo para huecos; golden tests | 2 a 3 h | medios | esta | ninguno; es la ganancia de latencia más grande (90 s → 2 s) |
| 6. Idempotencia y caché | `generationKey`, estados, dedupe, cancelar respuestas viejas, hit al renavegar | 2 a 3 h | medios | esta | ninguno |
| 7. QA determinístico | `lintCommercial()` sin IA + `creativeQA()` con Sonnet | 1 a 2 h | bajos | esta | ninguno |
| 8. Motor animado | SKILL generalizado (`media-studio-animation-renderer`), `animation-job.json`, workspace por pieza, templates, stills + aprobación, render por chunks, mux, verificación | 1 a 2 días + pruebas | ALTOS (una corrida de la skill: 300K a 800K tokens, estimado; cada prueba es otra corrida) | **la otra** | fase 1 verde (lo dice el doc); GPU real |
| 9. Observabilidad | `generation_runs`, diagnóstico en dev mode, métricas de render, comparación contra baseline | 1 a 2 h | bajos | esta | fase 0 hecha |

**Total fases 0-7 y 9:** 13 a 20 horas de código, cuatro o cinco sesiones. Tokens medios.
**Fase 8:** aparte, en la otra cuenta, y sólo después de una prueba a mano de la skill con una
pieza real (ver §6.7 de la radiografía).

## Qué se puede hacer AHORA, en esta cuenta

- **Fase 0 y 1 completas.** Son bugs confirmados en el código y una corrida de medición. Arrancan
  en esta misma sesión.
- **Fase 4** también: es una tabla y un switch.
- **Fases 2, 3, 5, 6, 7:** siguientes sesiones, de a una, cada una cerrada con tests verdes y
  tiempos medidos contra el baseline.

## Lo que NO conviene hacer en esta cuenta

- Cualquier corrida de la skill de animación (fase 8 y la prueba a mano previa). Cada una arma una
  escena three.js entera, voces y un render de minutos; la skill misma pide "un video por chat".

## Cómo se retoma desde otra cuenta

1. Leer `14-skills/MEDIA-STUDIO-REINGENIERIA-COMPLETA.md` en el orden que marca su Master Brief.
2. Leer `13-optimizacion-generacion/01-radiografia-...md` (estado real) y este plan.
3. Mirar qué fases están cerradas en `03-baseline-y-avance.md` (lo escribe la fase 0 y lo
   actualiza cada fase al cerrar, con tiempos antes/después).
4. Para la fase 8, la prueba a mano: carpeta vacía fuera del repo, el SKILL generalizado, un
   `animation-job.json` con una pieza real de Munify (guion y storyboard salen de
   `GET http://localhost:5301/api/projects?full=1`, proyecto `munify-wmv2`; capturas en
   `D:\Code\media-studio\server\storage\`), y pedir la hoja de stills antes del render.

## Fase 8, diseño acordado con el dueño (2026-10-07, después de la prueba a mano)

**Lo que se probó:** la skill `dev-claude-reel` corre en esta máquina (RTX 4060, WebGL por hardware,
0,14 s por cuadro); con Sonnet, una vuelta y sin dirección de arte sale "Minecraft"
(`D:\Codeeel-prueba\dummy-10s.mp4`); con el formato nativo de la skill, Opus y rondas sale
"Toy Story" (`D:\Codeeel-prueba\dummy-serio-10s.mp4`, hecho por un tercero con el mismo motor).
La diferencia está en la escena (geometría suave, luz con intención, bokeh con luces atrás, cámara
cerca, atmósfera), no en el motor.

**Decisión: kit de escena fijo + composición por video.** Igual que el kit v3 de componentes: la
app consume del catálogo, no inventa.

- **Fijo, versionado y con golden tests de stills (código en el repo):** rig de personaje suave
  parametrizable (piel, pelo, ropa, anteojos, edad; boca que sigue la voz), rigs de luz por
  ambiente (día oficina, noche calle, interior cálido, pantalla que ilumina, con las luces de fondo
  que alimentan el bokeh), sets base parametrizables (sala de espera, mostrador, auto, escritorio,
  calle), el **objeto-producto** (celular/monitor 3D con la captura real como textura, emisivo), y
  lo que la skill ya trae y no se toca (driver, post-proceso, timeline, subtítulos, chequeos,
  render por tramos, mezcla).
- **Por video, sólo datos (ficha de arte) y composición:** ambiente, paleta, rig + vestimenta,
  set, objeto-producto, y el mapeo del storyboard de Media Studio a encuadres del kit (primer
  plano al 60% del alto, dos personajes, inserto del celular). El agente (Opus, 2 a 3 rondas de
  stills) compone: elige, ubica, ajusta tiempos, mira, corrige. No escribe geometría ni luz.
- **Agnóstico por datos:** rubro → set y ambiente; capturas del kit → texturas del objeto-producto;
  marca → colores y logo en carteles; cast → vestimenta del rig. Mismo kit para cualquier KB.
- **Orquestación:** Media Studio piensa (estrategia, concepto, guion, cast, storyboard, lint) y
  entrega `animation-job.json`; la skill generalizada devuelve stills para aprobar y luego el mp4.
  Dos motores bajo la misma pieza animada: mockup rápido (hoy) y película (kit).
- **Dónde vive el estándar:** el kit en el repo con tests; el procedimiento en `base-compartida`
  con su puntero, para cualquier app.

**Por qué no on the fly:** cada vez el modelo decide desde cero qué es una cara y qué es una luz,
gasta 50 minutos y ~10 USD en eso y sale variable. Con el kit la calidad se cura una vez (con
rondas) y queda; el tiempo baja a composición más render. "Lo previsible no se pide en vivo."
