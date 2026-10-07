# 06 — Observabilidad y performance

## No optimizar a ciegas

Crear un registro por ejecución.

### Tabla sugerida: `generation_runs`

```text
id
project_id
piece_id
function_id
prompt_version
schema_version
provider
model
generation_key
started_at
finished_at
duration_ms
input_chars
output_chars
input_tokens_est
output_tokens_est
cost_usd
retry_count
status
error_type
validation_errors_json
```

## Métricas mínimas por pantalla

Mostrar en dev mode:
- modelo;
- tiempo;
- retries;
- prompt version;
- cache hit;
- input size;
- output size.

## Budgets iniciales

Objetivos después de la limpieza:

| Etapa | Target |
|---|---:|
| Strategy | <= 25 s |
| Concept | <= 25 s |
| Script | <= 20 s |
| Cast | <= 15 s |
| Storyboard | <= 20 s |
| FlowPack compilado | <= 2 s |
| Publish | <= 10 s |
| QA creativo | <= 15 s |

No convertir estos números en timeouts duros al inicio. Son SLOs para medir.

## Context budget

Registrar por prompt:
- tamaño de facts;
- concepto;
- guion;
- cast;
- storyboard;
- reglas.

Si un bloque supera 40% del prompt y no es imprescindible, revisar.

## Cache

Cachear por `generationKey`.

Casos:
- volver a entrar a pantalla: hit;
- refresh: hit;
- mismo input: hit;
- cambio de tono: miss sólo donde aplica;
- cambio de concepto: invalida downstream;
- cambio de caption: no invalida producción.

## Concurrencia

Evitar que múltiples autodisparos compitan.

Backend:
- lock por `projectId + pieceId + functionId + generationKey`;
- si hay una ejecución igual en curso, suscribirse/reutilizar;
- cancelar/ignorar respuesta de una generación vieja si cambió el input.

## CLI Claude

Ya se eliminó el enorme contexto accidental de Claude Code mediante clean mode.

Mantener:
- `--setting-sources ""`;
- tools vacías para texto puro;
- system prompt mínimo.

Para tareas con archivos/imágenes, usar el camino necesario, pero medirlo aparte.

## Render animado

Métricas:
- GPU renderer;
- ms/frame;
- frames rendered;
- frames skipped/resumed;
- retries por blank frame;
- duración render;
- duración mux;
- tamaño MP4.

Nunca acelerar usando workers paralelos si contradice las reglas del skill.
