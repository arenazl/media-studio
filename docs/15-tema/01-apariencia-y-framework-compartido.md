# La apariencia de media-studio (framework de tema compartido)

**Para el dueño, en criollo:** media-studio ahora tiene lo mismo que SalesBot y
Munify: la lunita y el sol, tres fondos claros, tres oscuros, y un color de
acento que pinta todo lo que se toca. Y no está escrito acá: está en el kit
compartido, así que si mañana sumamos un acento, lo sumamos una vez y aparece
en las tres apps. Se cambia desde el engranaje del rail (abajo a la izquierda),
en "Apariencia".

*Fecha: 2026-10-07.*

---

## Qué se usa y de dónde viene

| Pieza | Dónde vive |
|---|---|
| El framework (original) | `d:\Code\APP_GUIDE\components\v2\tema\` — su README explica el sistema |
| La bitácora del kit | `d:\Code\base-compartida\framework\README.md`, entrada 2026-10-07 |
| La copia en esta app | `src/tema/` — **copia verbatim, no se edita acá** |
| Lo único propio de la app | `src/tema/store.ts` (clave de persistencia y arranque) |
| El puente de tokens | `src/styles/tema-puente.css` |

El sistema son tres ejes: **modo** (claro/oscuro), **fondo** (seis: tres por
modo, en la matriz neutro / cálido / frío) y **acento** (ocho, transversal a
los seis fondos). De cada fondo se declara un solo color; superficies, bordes,
textos y sombras se derivan.

**Arranque de media-studio:** Tabaco (oscuro cálido) + Marfil (claro cálido) +
acento verde. Es la apariencia que la app ya tenía, así que al usuario no le
cambia nada hasta que elija.

## Cómo llega el tema a las 40 hojas de estilo

El framework escribe en el `<html>` los tokens derivados (`--bg-1`, `--surface`,
`--fg-1`, `--brand-500`, `--on-brand`, …). `src/styles/tema-puente.css` es **lo
único** que traduce esos nombres a los de la app:

- los del rediseño (`--rd-bg-app`, `--rd-ink`, …), que usa la UI vigente;
- los del sistema legacy navy/gold (`--ink`, `--txt`, `--bd`, …), vivos en
  VoiceStudio, SourcePanel y ScriptText.

Así las 40 hojas siguen el tema **sin tocar ninguna**. El rework de tokens
sigue pendiente y es otra cosa: el puente no lo reemplaza, lo hace innecesario
para que el tema funcione.

## Qué pinta el acento y qué NO

**El acento pinta lo interactivo y la marca:** botones primarios, píldoras
activas, el logo del rail, el playhead, el progreso. En media-studio eso era
"el verde", así que `--rd-green` ahora apunta al acento.

**No se derivan del acento** (y por eso siguen fijos):

| Token | Significado |
|---|---|
| `--rd-gold` | momentos de IA / "elegido, generado" |
| `--rd-blue` | estado "editado" / info |
| `--rd-danger` | error |
| `--pw-ok` | el "aprobado" del pipeline |

La razón es concreta: si el usuario elige acento **vino**, un error tiene que
seguir distinguiéndose de un botón, y un paso aprobado no puede verse igual que
un paso con problema.

## Las dos trampas que ya se pagaron

1. **`html[data-theme="light"]` le gana al puente por especificidad.** El
   bloque de tema claro de `rediseno.css` declaraba los fondos del modo claro:
   mientras estuvo ahí, el tema quedaba clavado en el crema de siempre eligiera
   el usuario Nieve, Marfil o Hielo. Ese bloque quedó sólo con los semánticos.

2. **La tinta sobre el acento no puede ser un hex.** Había `color: #04170f`
   sobre fondo verde en 16 lugares; con acento violeta eso es texto negro sobre
   violeta. Ahora va `var(--rd-on-accent)` → `--on-brand`, que el framework
   calcula por luminancia perceptual (umbral 0.59; el porqué está comentado en
   `temaPresets.ts`).

## Verificación (2026-10-07)

- `npm run build` ✅ · `npx vitest run src/tema/tema.test.ts` ✅ 30 tests
- Smoke visual propio con Playwright sobre `localhost:5180`, cuatro
  combinaciones (Tabaco+verde, Marino+violeta, Marfil+terracota,
  Hielo+turquesa): los tokens que llegan al `<html>` son los derivados, el
  `data-theme` acompaña, y la pantalla legacy (Audio) deja de estar anclada al
  navy fijo.

## Si hay que cambiar algo del tema

**Primero el catálogo**, después baja a la app (LEY 0 del kit). Editar
`src/tema/` directo deja la app desalineada del resto de la familia y el cambio
se pierde en la próxima bajada. Props nuevas, siempre opcionales, y entrada en
la bitácora de `base-compartida/framework/README.md`.
