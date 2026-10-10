# Pendientes de Media Studio

Una línea por pendiente, con el dato que lo justifica y dónde está el detalle (norma `base-compartida/28-ANOTALO-PARA-DESPUES.md`).

## Concepto 3.0 (curación del 2026-10-10)

- Correr la tabla de pruebas A–F del LEEME de la curación con el mismo brief de Munify (hoy sólo la A: caso + sobrio) y
  comparar contra concept/2.0. Detalle: `base-compartida/mediastudio/curaciones/01-concepto-con-enfoque/LEEME-integracion.md`.
- Fase opcional de evaluación sólo de las propuestas con humor (devolver alternativas sin tocar el resto). Mismo LEEME.
- "Mecanismo de humor" como opción avanzada plegada; hoy es un chip más, visible sólo con humor activo (`PasoConcepto.tsx`).
- `cierreMarca` ("Munify, para vos") todavía no se carga desde la interfaz: sale vacío salvo que la pieza lo traiga.
- El compilador de prompts de Veo (`server/flowCompiler.mjs`) le da al bloque "giro" una entrega neutra; con tratamiento
  humor debería pedir el remate. Falta pasarle el tratamiento al compilador (hoy no lo recibe).
- Los comerciales viejos siguen con el rol "gag" (se leen como giro y conservan el silencio de 0,8 s del montaje);
  una migración los renombraría, pero no hace falta mientras se regeneren.

## Puente Flow (extensión de Chrome, 2026-10-10)

- Corrida completa real desde el botón del Pack (proyecto de Flow nuevo + personajes creados desde cero + varias escenas):
  verificado hasta una escena de punta a punta. Detalle: `docs/16-montaje-flow/02-rutina-flow-mapa.md` §puente.
- La resolución y la duración de Flow no están en el panel de ajustes relevado: se verifican leyendo la pastilla; si el
  dueño las cambia a mano, la rutina avisa pero no las corrige.
