# 03 — Prompt Engine V2

## Objetivo

Mejorar calidad y latencia sin cambiar las pantallas.

## Regla 1 — Prompt pequeño, datos estructurados

Formato estándar:

```text
SYSTEM
TASK
INPUT JSON
CONSTRAINTS
OUTPUT SCHEMA
```

Evitar:
- repetir el brief bruto;
- repetir reglas universales en cada prompt;
- meter blobs JSON que la etapa no usa;
- explicar el producto dos veces;
- reglas contradictorias heredadas.

## System prompt común

Propuesta base:

```text
Sos parte de un estudio de producción audiovisual.
Cumplís exactamente la tarea pedida.
Usás únicamente los hechos provistos en INPUT.
No inventás cifras, funciones, integraciones, clientes, premios ni resultados.
Respetás el schema de salida.
No agregás markdown ni comentarios fuera del formato solicitado.
```

Las reglas específicas de tono o idioma van en la tarea, no en el system universal.

## Regla 2 — Versionar todos los prompts

Cada request debe registrar:

```ts
{
  functionId: "concept",
  promptVersion: "concept/2.0",
  schemaVersion: "concept-result/1.0"
}
```

Nunca cambiar silenciosamente un prompt productivo sin incrementar versión.

## Regla 3 — Input por función

Crear selectores explícitos:

```ts
buildStrategyInput(project)
buildConceptInput(project, piece, options)
buildScriptInput(...)
buildCastInput(...)
buildStoryboardInput(...)
buildFlowInput(...)
buildPublishInput(...)
buildQaInput(...)
```

No usar un `ctx()` gigante que intenta servir para todo.

## Regla 4 — Longitudes explícitas

Todo campo de salida textual debe tener límites.

Ejemplos:
- concepto.idea: 40–60 palabras;
- script.narration: max palabras calculado por duración;
- cast.fisicoEn: 25–45 palabras;
- cast.descripcionEn: 25–50 palabras;
- storyboard.accion: <= 14 palabras;
- storyboard.continuidad: <= 8 palabras;
- flow scene prompt: límite recomendado 90–140 palabras si sigue siendo IA;
- publish.caption: 2–4 líneas.

## Regla 5 — La duración debe gobernar el texto

Helper determinístico:

```ts
maxNarrationWords(durationSec, wps = 2.7)
```

El prompt no debe decir sólo "sé breve": debe decir el máximo calculado.

Validar post-respuesta.

## Regla 6 — Regeneración con contexto mínimo

Regenerar un elemento no vuelve a mandar todo.

Ejemplo:
`script item` recibe:
- negocio resumido;
- concepto;
- rol del bloque;
- bloque actual;
- restricciones;
- duración objetivo.

No necesita brandKit completo ni storyboard.

## Regla 7 — Retry inteligente

Retry automático sólo cuando:
- JSON inválido;
- schema inválido;
- falta campo obligatorio;
- semantic lint reparable.

Primer retry:
- mismo modelo;
- prompt de reparación corto;
- incluir errores concretos;
- no volver a pedir creatividad completa.

Segundo retry:
- subir modelo sólo si corresponde.

## Regla 8 — No usar Opus como martillo universal

Default sugerido:
- strategy: Sonnet;
- concept: Sonnet;
- script: Sonnet;
- cast: Sonnet;
- storyboard: Sonnet;
- flowpack: compilador + Sonnet sólo para huecos creativos;
- publish: Haiku;
- qa creativo: Sonnet;
- videoprompt: Sonnet;
- briefToKb: Sonnet.

Opus:
- botón de calidad máxima;
- fallback ante score bajo;
- tareas excepcionales.

## Regla 9 — Respuestas estructuradas

Si el proveedor soporta JSON Schema/structured output, usarlo.
Si no, mantener el parser actual como fallback.

## Regla 10 — Telemetría por llamada

Guardar:
- functionId;
- promptVersion;
- provider;
- model;
- input chars/tokens estimados;
- output chars/tokens;
- start/end;
- durationMs;
- parseMs;
- retryCount;
- validationErrors;
- generationKey;
- cost si está disponible.
