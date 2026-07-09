# Rework — Visión: de KB de negocio a comercial profesional

> **Para quién es este doc:** el modelo/agente que va a implementar el rework. Leelo ENTERO antes de
> tocar código. Las fases ejecutables están en los docs `02..06-fase-*.md` de esta carpeta — cada una
> es autosuficiente y shippable por separado, pero TODAS responden a esta visión.
>
> **Cómo ejecutar:** las fases van EN ORDEN (1→5), un commit por fase, con la verificación de la
> fase en verde antes de pasar a la siguiente (checklist obligatorio: `npx tsc --noEmit` +
> `npx eslint src/ --ext .ts,.tsx` + `npm test` + `npm run build` + la prueba manual de la fase).
> Regla del proyecto: proponer el plan de la fase y esperar el OK del usuario antes de editar.
> Este spec fue fundado en una auditoría de 4 agentes sobre el código real y pasó una verificación
> adversarial de 3 lentes (anclaje al código, ejecutabilidad, consistencia) el 2026-06-27 — las
> referencias archivo:línea eran exactas a esa fecha.
>
> **Origen:** decisión del usuario (2026-06-27, sesión de rework con Fable). Referencia del flujo:
> [`../06-video-referencia-stotyboard/flujo_produccion_ia.md`](../06-video-referencia-stotyboard/flujo_produccion_ia.md)
> (workflow "storyboard → AI commercial" hecho a mano con ChatGPT + Flow + DaVinci + Epidemic Sound).

---

## 1. El problema (por qué el rework)

La app hoy es **inusable**: está organizada por HERRAMIENTA (Negocio / Audio / Prompts / Videos /
Editor) y no por PROCESO. El usuario importa un KB, el wizard genera "cosas" (guiones, mockups,
prompts), y después cae en una sopa de tabs desconectadas donde:

- No se entiende **cuál es el próximo paso** ni cuánto falta para tener el comercial terminado.
- Las salidas son **fragmentos** (un guion por acá, prompts por allá) — nunca un comercial completo.
- No hay **consistencia**: cada prompt de video inventa una persona distinta, una locación distinta.
- No hay **puente** entre "generé los prompts" y "tengo el mp4 final con música".

## 2. El objetivo (qué produce la app)

**Entrada:** el KB de un negocio (contrato KSP 1.2 — `value_story`, `key_messages`, `offerings`,
`screens` metadata, `brand`).

**Salida 1 — el PACK FLOW:** un paquete profesional de prompts para Google Flow (Veo 3): prompt
maestro + prompt por clip, con personajes CONSISTENTES (hojas de personaje) y continuidad de
escenas (storyboard). No hay API de Flow: el usuario pega los prompts a mano y baja los clips.
*(Decisión explícita: el "modo agente" de Flow con assets visuales subidos — storyboard/personajes
como imágenes — queda FUERA de alcance v1; deuda anotada. v1 = prompts de texto.)*

**Salida 2 — el COMERCIAL:** el mp4 final 9:16 montado en NUESTRA app: clips ordenados según el
storyboard, música con ducking, voz en off, silencio estratégico antes del remate/CTA, transiciones.
Más el pack de publicación (caption/hashtags/CTA).

**Todo lo generativo corre con Claude headless LOCAL** (`/api/run-function` → `runAI`). La app corre
local (ver `docs/01-proposito/`).

## 3. El insight central: EL STORYBOARD ES LA COLUMNA VERTEBRAL

Del workflow de referencia, lo que hace la diferencia entre "clips de IA sueltos" y "un comercial":

1. **Hojas de personaje** — la MISMA descripción física exacta (edad, pelo, cara, ropa) se pega en
   TODOS los prompts → la persona es la misma en todos los clips.
2. **Storyboard** — escenas numeradas con plano/ángulo/duración/acción/diálogo ANTES de generar
   nada → cada clip sabe qué lugar ocupa en la narrativa.
3. **Prompt maestro** — estilo + personaje + locación consolidados una vez, cada clip solo agrega
   su escena → coherencia visual total.
4. **Post-producción con intención** — música elegida por ritmo, ducking bajo la voz, y **silencio
   estratégico** antes del gag/CTA (el detalle que hace que parezca un anuncio de verdad).

Todo en la app cuelga del storyboard: guion → escenas → prompts → clips → timeline.

## 4. El pipeline (la nueva UX — reemplaza las tabs)

La UI principal pasa a ser un **pipeline de producción** con pasos y estados. Cada paso tiene
estado: `pendiente → generado → editado → aprobado`. El usuario SIEMPRE sabe dónde está y qué falta.

```
 1. NEGOCIO      importar el KB (existe: KbInspector) → datos del negocio a la vista
 2. CONCEPTO     Claude propone 2-3 conceptos de campaña (idea, tono, estética, por qué funciona)
                 → el usuario elige uno            [molde NUEVO: concept]
 3. GUION        guion estructurado del comercial elegido: hook → desarrollo → remate/gag → CTA,
                 con timing                        [molde script ADAPTADO]
 4. CAST         (solo FILMADO) hojas de personaje (descripción física EXACTA reutilizable, en
                 inglés p/ prompts) + hoja de locación          [molde NUEVO: cast]
 5. STORYBOARD   escenas numeradas: plano, ángulo, duración, acción, diálogo, personajes,
                 continuidad                       [molde NUEVO: storyboard]
                 ── BIFURCACIÓN por tipo de comercial ──
 6a. PACK FLOW   (comercial FILMADO) prompt maestro + prompt por clip; estados por clip
                 (pendiente/copiado/importado); export/copy    [molde NUEVO: flowpack]  ← SALIDA 1
 6b. RENDER      (comercial ANIMADO) el storyboard se renderiza DIRECTO con el motor de reel
                 animado (mockupReel: Playwright+ffmpeg desde la metadata) — sin Flow
 7. RODAJE       importar los clips bajados de Flow → server/storage; match clip ↔ escena
 8. MONTAJE      timeline AUTO-armada desde el storyboard + música con ducking + voz en off
                 (VoiceStudio) + silencio estratégico + transiciones → EXPORT mp4  ← SALIDA 2
 9. PUBLICAR     caption/hashtags/CTA por plataforma            [molde publish, existe]
```

**Reglas de la UX:**
- Un stepper (vertical u horizontal) SIEMPRE visible con los pasos del pipeline y sus estados
  (iconos SVG, jamás emojis). Click en un paso → esa pantalla. **Los pasos visibles dependen del
  tipo** (`pasosVisibles(tipo)`, fase 1): filmado = 9 (con cast/pack/rodaje); animado = 7 (sin
  cast/pack/rodaje, con render).
- Cada pantalla de paso: lo generado (editable) + `Generar/Regenerar` + `Aprobar y seguir`.
- Un paso no aprobado no bloquea ver los siguientes, pero el stepper muestra qué falta.
- `Audio` (VoiceStudio) y `Editor` dejan de ser tabs sueltas: VoiceStudio se invoca desde MONTAJE
  (la voz del comercial); el editor ES la pantalla de MONTAJE.
- El proyecto puede tener **hasta 3 comerciales** (los 3 approaches GLOBALES — regla de oro: cada
  comercial cuenta TODA la propuesta, NUNCA fragmentar por módulo). El pipeline se recorre por comercial.

## 5. El modelo de datos (la entidad central: `Comercial`)

Cada versión/approach es un `Comercial` que atraviesa el pipeline. Shape de referencia (la fase 1
lo fija en `src/lib/` con tipos + tests):

```ts
interface Comercial {
  id: string;
  titulo: string;                    // "problema-solución: el caos vs el orden"
  tipo: 'filmado' | 'animado';       // bifurcación del paso 6
  estados: Record<PasoId, 'pendiente'|'generado'|'editado'|'aprobado'>;
  concepto?: Concepto;               // paso 2
  guion?: GuionEstructurado;         // paso 3
  cast?: Cast;                       // paso 4
  storyboard?: Escena[];             // paso 5
  packFlow?: PackFlow;               // paso 6a (solo filmado)
  renderRef?: string;                // paso 6b (solo animado): el mp4 renderizado del storyboard
  rodaje?: Toma[];                   // paso 7 (solo filmado; refs a server/storage, NO localStorage)
  montaje?: { plan: MontajePlan; exports: { fileRef: string; createdAt: string }[] };  // paso 8 (ver fase 4)
  publicacion?: PublishPack;         // paso 9
}

interface Concepto { id: string; idea: string; tono: string; estetica: string; referencia: string; porQueFunciona: string }
interface GuionBloque { role: 'hook'|'desarrollo'|'gag'|'cta'; narration: string; visual: string; durSec?: number }
interface GuionEstructurado { blocks: GuionBloque[]; music?: { mood: string } }   // paso 3 (script adaptado)
interface CharacterSheet {
  id: string; nombre: string; rol: string;
  fisicoEn: string;   // descripción EXACTA en inglés — se pega VERBATIM en cada prompt (la clave de consistencia)
  fisicoEs: string;   // para la UI
  vestuario: string; personalidad: string;
}
interface Cast { personajes: CharacterSheet[]; lugar: { nombre: string; descripcionEn: string; luz: string } }
interface Escena {
  n: number; rol: 'hook'|'desarrollo'|'gag'|'cta';
  durSec: number;                    // talking head: 8s MÍNIMO (regla dura ya validada)
  plano: string; angulo: string;     // medium shot / eye-level / etc.
  personajes: string[];              // ids del cast
  accion: string; dialogo: string;   // rioplatense; marca SIEMPRE fonética (ej. "Munifái")
  continuidad: string;               // qué debe matchear con la escena anterior/siguiente
}
interface PackFlow {
  master: string;                    // estilo + personajes + locación consolidados
  clips: { escenaN: number; prompt: string; estado: 'pendiente'|'copiado'|'importado'; tomaId?: string }[];
}
// fileRef = el public_id RELATIVO que devuelve saveAsset (ej. "proj-x/173..-clip.mp4") — NUNCA la URL
// absoluta: el render lo mapea directo a STORAGE_DIR/<rel> sin HTTP; el front lo sirve por /api/storage/<rel>.
interface Toma { id: string; escenaN: number; fileRef: string; durSec: number }
// El shape del MONTAJE es el MontajePlan (definido y detallado en la fase 4 — escenas con trim y
// audio propio, música con ducking, silencios ANCLADOS A ESCENA). Acá solo su lugar en la entidad:
//   montaje?: { plan: MontajePlan; exports: { fileRef: string; createdAt: string }[] }
// Se persiste vía saveProject como todo lo demás; montageStore/px queda como cache de UI derivada.
interface PublishPack { hookOnScreen: string; caption: string; hashtags: string[]; cta: string }  // = salida del molde publish
```

**Persistencia:** los datos del comercial viven en el Project — **hoy solo localStorage; la fase 2
suma el dual-write a `/api/projects` (SQLite, que HOY está huérfano: el front nunca lo llama)**.
Los ARCHIVOS (clips importados, mp3, mp4 final) van SIEMPRE a `server/storage` (`saveAsset`) —
localStorage no banca video.

## 6. Los moldes (server/functions.mjs)

| Molde | Estado | Qué produce |
|-------|--------|-------------|
| `concept` | **NUEVO** (nivel piece) | 2-3 `Concepto` desde el KB + el `angle/creativeBrief` que strategy definió para ESE comercial (así los 3 comerciales no reciben conceptos idénticos) |
| `script` | ADAPTAR | `GuionEstructurado` con roles hook/desarrollo/gag/cta + timing (mantener regla GLOBAL) |
| `cast` | **NUEVO** | `Cast` desde guion+concepto. `fisicoEn` sigue las reglas de casting ya validadas (striking, conventionally beautiful, late 20s-30s, vestida según el rubro) |
| `storyboard` | **NUEVO** | `Escena[]` desde guion+cast. Recibe el `tipo`: filmado → planos/talking heads 8s mínimo con diálogo que COMENTA el producto (~24-30 palabras); animado → escenas orientadas a PANTALLA (screen del KB + título corto + palabra a resaltar), sin cast |
| `flowpack` | **NUEVO** | `PackFlow` desde storyboard+cast+brand. REUSA `VEO_RULES` (battle-tested: realismo no-CGI, medium shot waist-up, push-in sutil, jamás zoom-out, fonética de marca, sin silencios muertos) |
| `publish` | EXISTE | pack de publicación |
| `qa` | ADAPTAR (fase 5) | hoy evalúa SOLO el texto del guion; se extiende para correr sobre el comercial ENTERO antes de exportar |
| `mockup` | ABSORBER | desaparece como paso; su rol lo toma el storyboard (el render animado consume `Escena[]`) |
| `veo` | REEMPLAZAR | lo reemplaza `flowpack` (mismos principios, pero con cast/continuidad) |

**Regla de implementación de moldes:** son PUROS (arman prompt + parsean respuesta), testeables sin
IA — igual que hoy. Cada molde nuevo entra con tests de integridad en vitest.

## 7. Qué se reusa (NO reinventar)

- `runAI` / `/api/run-function` (Claude headless local, Gemini prod) — el motor generativo.
- `VEO_RULES` de `server/functions.mjs` — reglas de prompting battle-tested (2026-06-27).
- `server/mockupReel.mjs` + `/api/mockup-reel` — el render del comercial ANIMADO (Playwright+ffmpeg).
- `server/assemble.mjs` + `/api/assemble` — patrones ffmpeg battle-tested (mezcla voz+música, logo,
  xfade entre videos). OJO: son OTRO endpoint que `/api/render` (= `renderMp4` en `index.mjs`, xfade +
  8 filtros pero SOLO imágenes) — dos sistemas distintos, ambos HOY sin caller en el front.
- Editor v2 (`ReelEditor.tsx`, `reelTimeline`, `montageAudio`, `music.ts`, `exportMix`) — la base del
  paso MONTAJE (timeline, transiciones, ducking en preview). (`MontajeTab` NO: es un placeholder
  muerto sin montar — se borra en fase 4.)
- `VoiceStudio` completo (voces ES locales, cadencia "Agregar vida", presets, export con música) — la voz.
- `KbInspector` + `knowledgeBase.ts` (KB 1.2) — el paso NEGOCIO.
- `saveAsset`/`/api/storage` — archivos.
- SQLite `/api/projects` + localStorage — persistencia.

## 8. Criterios de "salida profesional" (el listón)

Un comercial exportado debe cumplir:
1. **Consistencia**: misma persona (verbatim character sheet) y misma locación en todos los clips.
2. **Narrativa**: hook (≤2s roba atención) → desarrollo → remate/gag → CTA. Global: cuenta TODA la propuesta.
3. **Audio**: música con ducking bajo la voz; silencio estratégico antes del remate; sin cortes de audio abruptos.
4. **Técnica**: 9:16 1080×1920, talking heads ≥8s, sin silencios muertos, marca SIEMPRE fonética en lo hablado.
5. **QA**: el molde `qa` corre sobre el comercial entero y da ≥ un umbral antes de exportar (advertencia, no bloqueo).

## 9. Mapa de fases (docs de esta carpeta)

| Doc | Fase | Shippable |
|-----|------|-----------|
| `02-fase-1-datos-y-moldes.md` | Tipos `Comercial` + moldes concept/cast/storyboard/flowpack + tests | Se prueba por API sin UI |
| `03-fase-2-pipeline-ux.md` | Stepper + pantallas de pasos 1-5 (reemplaza tabs/GuidedPanel) | Pipeline navegable end-to-end hasta storyboard |
| `04-fase-3-pack-y-rodaje.md` | Pantalla Pack Flow (copy/export/estados) + import de clips + match escena↔toma | Salida 1 completa |
| `05-fase-4-montaje-pro.md` | Auto-timeline desde storyboard + música/ducking/silencio + voz + export | Salida 2 completa |
| `06-fase-5-animado-y-pulido.md` | Bifurcación animado (storyboard→mockupReel) + QA holístico + publicar + empty states | Producto redondo |

Cada fase: objetivo, archivos exactos, contratos, criterios de aceptación y verificación
(`npm run build` + `npx tsc --noEmit` + `npx eslint src/` + `npm test` + prueba manual del flujo).
