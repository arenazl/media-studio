# 02 — Diagnóstico confirmado y bugs P0

## P0.1 — El brief se corta a 2.500 caracteres

Estado actual:
- `ctx()` corta `project.brief` con `.slice(0, 2500)`;
- `concept` también usa un brief recortado;
- un brief real de Munify supera ampliamente ese tamaño.

### Consecuencia
El sistema decide conceptos y estrategia con una fracción arbitraria de los hechos.

### Fix
No reemplazar el corte por otro número arbitrario.

Crear una representación normalizada:

```ts
type ProjectFacts = {
  name: string;
  description?: string;
  audiences?: Array<{label:string; pain?:string; language?:string}>;
  offerings?: string[];
  differentiators?: string[];
  proofPoints?: string[];
  objections?: string[];
  pricing?: unknown;
  cta?: { text?: string; url?: string };
  screens?: ScreenFact[];
  doNotSay?: string[];
  brand?: unknown;
};
```

Fuente:
1. KB 1.2 si existe;
2. si sólo hay brief, normalizarlo una vez;
3. conservar también `rawBrief` para consulta excepcional.

Cada molde debe pedir un subconjunto de `ProjectFacts`, no el comienzo truncado del texto.

---

## P0.2 — `ctx().guion` no entiende el shape actual

Estado actual:
- el código viejo espera array de strings;
- el guion actual es `{ blocks: [...] }`;
- `publish` y ciertos caminos de `qa` caen al brief.

### Consecuencia
Se genera copy sin haber leído el guion que se está publicando.

### Fix
Crear UN helper canónico:

```ts
function scriptToText(guion: unknown): string
```

Debe aceptar:
- formato legacy;
- `{blocks:[...]}`;
- futuro shape versionado.

Todo el repo debe importar ese helper. Eliminar flatteners duplicados.

Tests obligatorios:
- array legacy;
- blocks nuevo;
- vacío;
- bloque con narration faltante;
- caracteres especiales.

---

## P0.3 — `cast` usa `x.industry` inexistente

Estado actual:
- `x.industry` no existe en `ctx()`;
- cae a `x.brief`;
- termina metiendo el brief completo dentro de una regla de locación.

### Fix
Agregar `industry`/`businessContext` explícito a `ProjectFacts`, derivado del KB.
Nunca interpolar un brief entero dentro de una oración.

Contrato sugerido:

```ts
businessContext: {
  industry?: string;
  physicalEnvironment?: string[];
  userTypes?: string[];
}
```

---

## P0.4 — Contradicción dentro de las reglas de Veo

Existen simultáneamente estas ideas:
- no repetir `fisicoEn`, porque la imagen de referencia fija identidad;
- mantener la misma descripción física exacta.

### Fix
Elegir una sola política para el flujo actual:

**Flujo con Character/Entity image:**
- identidad = imagen de referencia;
- prompt de escena = nombre + nacionalidad + descripción corta necesaria;
- NO copiar `fisicoEn` largo.

Eliminar del prompt final cualquier regla legacy incompatible.

Crear un test de texto:
- `flowpack` compilado no debe contener instrucciones contradictorias conocidas.

---

## P0.5 — El modelo queda decidido en la práctica por el frontend

Hoy el router del backend rara vez decide porque el catálogo ya manda `model`.

### Fix
Conservar el setting de UI, pero separar:

```ts
userModelOverride?: "opus"|"sonnet"|"haiku"
taskClass: "creative"|"structured"|"transform"|"critic"
```

Política backend por defecto:
- creative: Sonnet;
- structured: Sonnet;
- transform: Haiku/Sonnet;
- critic: Sonnet;
- Opus: override/premium/retry por calidad.

El frontend no debería hardcodear una dependencia estructural con un modelo concreto.

---

## P0.6 — Autodisparo debe ser idempotente

No se pide eliminar el autodisparo.

Sí se pide impedir:
- dobles generaciones;
- llamadas por re-render de React;
- regeneración si el input semántico no cambió;
- resultados viejos pisando resultados nuevos.

Implementar `generationKey`:

```text
sha256(
  functionId
  + promptVersion
  + normalizedInput
  + options
)
```

Estados:
- idle
- queued
- running
- valid
- stale
- error

Si existe un resultado `valid` para la misma key, reutilizarlo.

---

## P0.7 — Parseo demasiado permisivo

`extractJson` rescata objetos balanceados, lo cual está bien como tolerancia, pero la validación posterior es mínima.

### Fix
Cada función debe tener:
1. schema;
2. validator;
3. normalizer;
4. semantic lint.

Ejemplo:
- JSON válido no significa storyboard válido;
- `durSec` puede ser absurdo;
- ids de personajes pueden no existir;
- screen puede no existir;
- roles pueden faltar.

No persistir como válido hasta pasar las cuatro capas.
