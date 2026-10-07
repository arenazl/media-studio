# 01 — Arquitectura que NO se toca

## Invariantes de producto

Conservar:

```text
Proyecto / Campaña
    ↓
Concepto
    ↓
Guion
    ↓
Cast
    ↓
Storyboard
    ↓
Pack Flow / Producción
    ↓
Publicar / QA
```

Para piezas animadas, conservar el mismo recorrido conceptual. El motor de render puede cambiar por debajo.

## Invariantes técnicos

Mantener el patrón existente:

```text
PasoX.tsx
  → runMolde(...)
  → POST /api/run-function
  → buildFunctionPrompt(...)
  → runAI(...)
  → parseFunctionResult(...)
  → persistencia del proyecto/pieza
```

No es obligatorio mantener cada función con el mismo contenido, pero sí mantener la interfaz del producto mientras se migra internamente.

## Qué sí puede cambiar por debajo

- construcción de contexto;
- selección de modelo;
- versionado de prompts;
- validación;
- retries;
- caching;
- parseo;
- normalización del KB;
- compilación de Flow;
- QA determinístico;
- instrumentación;
- implementación del render animado;
- estado interno de generación.

## Principio rector

Las pantallas son **etapas de trabajo del usuario**.

No asumir que cada pantalla tiene que equivaler a "una llamada grande a IA". Una pantalla puede:
- llamar IA;
- ejecutar código determinístico;
- combinar ambas cosas;
- reutilizar una salida cacheada.

El UX se conserva aunque cambie el motor.
