# Media Studio — Reingeniería funcional sin rediseñar el producto

## Objetivo

Este paquete es una guía de implementación para Claude Code sobre el repositorio actual de **Media Studio**.

La consigna principal es:

> **NO rediseñar la arquitectura, el flujo ni el pipeline de producto.**
> La organización actual Concepto → Guion → Cast → Storyboard → Pack Flow → Publicar es válida.
> El trabajo consiste en hacer que cada pieza interna sea rápida, consistente, verificable y de buena calidad.

El sistema ya tiene una separación útil por etapas, persistencia por proyecto/pieza, Media Kit, salida a Flow/Veo, TTS, ffmpeg y un camino animado. El problema actual es de **ejecución interna**, no de concepto de producto.

## Fuentes de verdad de este trabajo

1. `01-radiografia-como-se-genera-cada-etapa.md`
   - describe el estado real al 2026-10-07;
   - contiene los prompts actuales;
   - documenta modelos, inputs, parseo, latencias y bugs conocidos.

2. `SKILL.md`
   - define un pipeline probado para render de reels 3D/animados:
     Three.js + Chrome headless + render frame-by-frame + ElevenLabs + ffmpeg + QA.
   - su mecánica es reutilizable, pero su narrativa específica "developer ↔ Claude" debe generalizarse.

## Resultado esperado

Al terminar esta reingeniería:

- el usuario mantiene las mismas pantallas y el mismo flujo;
- cada generación recibe sólo el contexto que necesita;
- los outputs tienen contratos estables;
- no se pierde información del brief;
- una etapa no se rompe porque cambió el shape de otra;
- los prompts no se contradicen;
- las regeneraciones son locales;
- los errores se detectan antes de persistir;
- cada llamada queda medida;
- las animaciones tienen previsualización por stills antes del render completo;
- Flow/Veo y el motor animado conviven dentro del pipeline actual.

## Regla de trabajo para Claude Code

Antes de modificar código:

1. localizar la implementación real;
2. confirmar que coincide con la radiografía;
3. crear o actualizar tests;
4. hacer el cambio mínimo;
5. medir;
6. recién después pasar al siguiente tornillo.

No hacer un "big bang rewrite".
