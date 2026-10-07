# 04 — Especificación por etapa

## 4.1 Strategy

### Responsabilidad
Transformar conocimiento del negocio en un set de piezas con ángulos distintos.

### No debe
- redactar guiones;
- inventar claims;
- obligar a que todas las piezas repitan exactamente todo el negocio.

### Input
```json
{
  "business": {},
  "audiences": [],
  "offerings": [],
  "differentiators": [],
  "objections": [],
  "campaignProfile": "campaña",
  "format": {}
}
```

### Output
Mantener `positioning`, `audiences`, `pieces`.

Agregar opcional:
```json
{
  "messageScope": "brand-global|problem|demo|benefit|proof|objection|conversion"
}
```

### Acceptance
- piezas realmente distintas;
- angle <= 4 palabras;
- no claims no soportados;
- no duplicados semánticos.

---

## 4.2 Concept

### Responsabilidad
Dar 3 direcciones creativas para elegir.

### Mantener
La versión curada actual va en la dirección correcta:
- diferencia concepto de guion;
- fuerza tres tipos de gancho;
- limita longitudes;
- distingue filmado/animado.

### Ajustes
- Input desde `ProjectFacts`, no brief truncado.
- Para animado, no imponer todavía implementación de Three.js.
- Respetar `messageScope` de Strategy.
- No exigir "todo el negocio" si la pieza fue planeada con foco específico.

### Semantic lint
- 3 conceptos;
- ganchos distintos;
- idea dentro del rango;
- no contiene timestamps/shot list;
- no contiene claims fuera de facts.

---

## 4.3 Script

### Responsabilidad
Convertir concepto elegido en cuatro bloques narrativos.

Mantener roles:
```text
hook → desarrollo → gag → cta
```

### Input mínimo
- facts relevantes;
- concepto;
- angle;
- messageScope;
- técnica;
- media moments/screens relevantes;
- duración;
- tono;
- CTA validado.

### Output
```json
{
  "blocks": [
    {
      "role": "hook",
      "narration": "",
      "visual": "",
      "durSec": 0
    }
  ],
  "music": {"mood": ""}
}
```

### Reglas
- suma de duraciones cercana al target;
- word budget calculado;
- CTA sólo usa CTA permitido;
- animado: visual describe UI/motion o escena animada; no filmación accidental;
- filmado: puede describir actuación/locación.

### Validation
- exactamente los roles esperados;
- gag antes de cta;
- word count;
- no bloque vacío;
- no facts inventados.

---

## 4.4 Cast

### Responsabilidad
Definir identidad visual reutilizable para piezas filmadas o animaciones con personajes.

### Input
- businessContext estructurado;
- concepto;
- scriptToText();
- técnica.

### Salida
Mantener shape actual mientras sea posible.

### Límites
- `fisicoEn`: 25–45 palabras;
- `fisicoEs`: <= 18 palabras;
- `descripcionEn`: 25–50 palabras;
- `personalidad`: 1–3 palabras.

### Regla de locación
Derivar del `businessContext.physicalEnvironment`, no del brief crudo.

### Animaciones
Si la animación no necesita personajes, Cast debe permitir:
```json
{"personajes":[],"lugar":{...}}
```
sin obligar a inventarlos.

---

## 4.5 Storyboard

### Responsabilidad
Convertir el guion a escenas producibles.

### Filmado
Mantener:
- roles;
- continuidad;
- ids de cast;
- dialogue;
- plano;
- ángulo;
- duración.

### Animado
Mantener:
- `screen`;
- `accion`;
- `durSec`;
- continuidad;
- asignación determinística de captura real.

Ampliar con campos opcionales compatibles con el motor nuevo:
```json
{
  "animationMode": "ui|3d|hybrid",
  "focus": "screen|character|prop",
  "motion": "push-in|pan|orbit|static|custom"
}
```

No es obligatorio exponerlos todos en la UI.

### Validation
- suma de duraciones;
- screen existe o `[demo]`;
- personaje existe;
- dialogue/voiceover consistente;
- no scene con duración imposible;
- continuidad referencial válida.

---

## 4.6 Flow Pack

### La pantalla se mantiene

No eliminar `Pack Flow`.

### Cambio interno
Dividir en:

1. `compileFlowPack()` determinístico;
2. `enrichFlowPrompt()` opcional sólo si falta creatividad visual.

### Compilador
Entradas:
- storyboard;
- cast;
- brand;
- phonetic;
- canonical Veo rules.

Salida idéntica o compatible con la UI actual:
```json
{
  "estilo": "",
  "personajes": [],
  "escenas": []
}
```

### Regla
Las reglas técnicas de Veo viven en UN módulo versionado.
No copiarlas dentro de múltiples prompts.

---

## 4.7 Publish

### Fix prioritario
Debe leer `scriptToText(guion)`.

### Modelo
Haiku por defecto.

### Input
- red;
- script;
- CTA permitido;
- messageScope;
- nombre.

No necesita storyboard/cast/brandKit completos.

---

## 4.8 QA

Separar dos capas.

### A. `lintCommercial()` — sin IA
Checks:
- roles;
- duración;
- orden;
- words/sec;
- CTA;
- screen ids;
- cast ids;
- marca fonética;
- claims permitidos;
- escena talking-head compatible con duración;
- contradicciones de pack;
- assets faltantes.

### B. `creativeQA()` — Sonnet
Evalúa:
- gancho;
- claridad;
- ritmo;
- coherencia;
- originalidad;
- fuerza del cierre.

La nota creativa nunca reemplaza errores técnicos.

---

## 4.9 VideoPrompt

Mantener como herramienta suelta.

Cambiar:
- importar `VEO_RULES` canónicas;
- no duplicarlas;
- soporte de `promptVersion`;
- validar longitud.

---

## 4.10 briefToKb

Es la puerta a la calidad del resto.

### Reglas
- no inventar;
- conservar datos textuales;
- capturar industry/environment cuando esté explícito;
- generar `ProjectFacts` determinístico desde el KB.

Agregar tests con:
- brief corto;
- brief de 8K+ chars;
- pricing ausente;
- varias offerings;
- pantallas;
- do_not_say.
