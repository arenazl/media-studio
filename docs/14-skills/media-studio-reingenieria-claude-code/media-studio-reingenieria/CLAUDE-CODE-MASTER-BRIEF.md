# MASTER BRIEF PARA CLAUDE CODE — MEDIA STUDIO

## Tu misión

Vas a mejorar el repositorio Media Studio existente.

**No rediseñes el producto.**
El dueño considera correcta y valiosa la arquitectura actual, su organización por pantallas y su pipeline.

Tu trabajo es hacer que el sistema existente **funcione bien por dentro**.

## Antes de hacer cambios

Lee en este orden:

1. `00-START-HERE.md`
2. `01-ARQUITECTURA-QUE-NO-SE-TOCA.md`
3. `02-DIAGNOSTICO-Y-BUGS-P0.md`
4. `03-PROMPT-ENGINE-V2.md`
5. `04-ESPECIFICACION-POR-ETAPA.md`
6. `05-INTEGRACION-SKILL-ANIMACIONES.md`
7. `06-OBSERVABILIDAD-Y-PERFORMANCE.md`
8. `07-TESTS-Y-CRITERIOS-DE-ACEPTACION.md`
9. `08-ORDEN-DE-IMPLEMENTACION.md`

También lee los documentos fuente:
- radiografía actual del pipeline;
- `SKILL.md` original de animaciones.

## Reglas

### 1. No hagas un rewrite

Cambios incrementales, testeables y reversibles.

### 2. No cambies la navegación ni elimines etapas

Concepto, Guion, Cast, Storyboard, Pack Flow y Publicar siguen existiendo.

Puedes cambiar la implementación interna de una etapa.

### 3. Primero corregí datos, después prompts

Un prompt perfecto con input incorrecto sigue fallando.

Prioridad:
- guion shape;
- brief truncado;
- industry;
- contradicciones Veo.

### 4. Cada etapa tiene contrato

Input selector → prompt/compiler → output schema → semantic lint → persist.

### 5. No inventes facts

Toda afirmación de negocio debe venir del Knowledge Base / ProjectFacts.

### 6. No uses modelos caros sin demostrar necesidad

Sonnet debe resolver la mayoría de las tareas.
Opus es excepción.

### 7. Preservá auto-generación sólo si queda idempotente

No hace falta quitar el comportamiento actual.
Sí evitar duplicados, carreras y regeneraciones inútiles.

### 8. Pack Flow sigue siendo una etapa visible

Pero internamente debe tender a compilación determinística de reglas + datos.

### 9. Para animaciones, generalizá el SKILL

Conservá su ingeniería:
- Three.js;
- GPU;
- setT puro;
- timeline;
- stills;
- checks;
- chunks;
- ffmpeg.

Eliminá su historia específica developer/Claude.

### 10. No renderices una animación completa sin still approval

Primero contact sheet.

## Forma de trabajar

Para cada fase:

1. describe qué encontraste en código;
2. muestra archivos afectados;
3. implementa tests;
4. implementa el cambio;
5. ejecuta tests;
6. registra before/after si corresponde;
7. resume riesgos;
8. recién continúa.

Si la radiografía y el repo difieren, manda el repo actual, pero documenta la diferencia.

## Primera tarea concreta

Empezá por Fase 0 + Fase 1:

- crea baseline;
- encuentra `ctx()`;
- encuentra `pieceGuionText()` / equivalentes;
- unifica `scriptToText()`;
- arregla `publish`;
- arregla `qa`;
- arregla `cast`/industry;
- limpia contradicción `VEO_RULES`;
- agrega tests.

NO avances al motor animado antes de que estos tests estén verdes.
