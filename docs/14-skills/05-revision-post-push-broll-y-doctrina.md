# Revisión post-push (commit 408108c): b-roll, talking head y doctrina — 2026-10-07

> Informe de la otra cuenta del dueño, leído sobre el repo real después del push. Guardado tal cual
> por pedido del dueño. Lo que se aplicó a partir de este informe está registrado en
> `docs/13-optimizacion-generacion/03-baseline-y-avance.md`.

---

Sí, ya tengo el repo y confirmé el commit 408108c. Está efectivamente la reingeniería grande: ProjectFacts, scriptToText, FlowPack compilado, lint técnico, versionado de prompts y la doctrina nueva en Strategy/Script.

Y viendo el código real, antes de que Claude toque el b-roll yo corregiría tres cosas juntas, porque encontré dos inconsistencias que la prueba todavía no estaba mostrando.

## 1. Sí al ajuste del b-roll, pero hay que tocar parser + prompt

La app tiene razón en que un b-roll con 10 palabras de VO no debe durar 8 segundos. Pero cambiar sólo:

```
b-roll entre 4 y 8s
```

no alcanza.

Hoy el parser hace esto: cualquier escena con dialogo menor a 8 s se convierte en 8 s. Eso también captura el b-roll con voz en off, porque el propio prompt dice que ese b-roll lleva el texto en dialogo y personajes: [].

Más interesante todavía: el validator ya usa la definición correcta de talking head: dialogo + personajes.length. O sea, parser y validator hoy no tienen la misma definición.

Yo haría un helper único:

```js
const esTalkingHead = (e) =>
  String(e.dialogo || '').trim() &&
  Array.isArray(e.personajes) &&
  e.personajes.length > 0;
```

Y la regla determinística:

```
Talking head
→ mínimo 8 s.

B-roll sin VO
→ 4–8 s según necesidad visual.

B-roll con VO
→ max(4, ceil(palabras / 2.7)) segundos.
→ máximo 8 s.
→ si no entra en 8 s, dividirlo en dos b-rolls.
```

Ejemplos:

```
10 palabras → 4 s
13 palabras → 5 s
16 palabras → 6 s
19 palabras → 8 s
24 palabras → NO entra: dividir
```

Esto debería bajar esos 44 segundos de manera bastante fuerte sin acelerar artificialmente la voz.

## 2. Encontré una contradicción doctrinal que sí hay que arreglar ahora

Strategy y Script ya usan correctamente:

```
campaña global, pieza con un mensaje principal.
```

Strategy incluso genera messageScope, primaryMessage y supportingFacts. Muy bien.

Pero Concept todavía conserva la regla vieja:

```
campaña: contar TODA la propuesta del negocio en un video
```

y más abajo:

```
El negocio entero adentro ... de punta a punta, no un solo módulo.
```

Eso puede sabotear todo lo que acabamos de arreglar: Strategy dice "esta pieza trata X", Concept vuelve a inflarla con todo Munify, y después Script intenta volver a reducirla.

Ahí tiene que quedar:

```
Si messageScope == brand-global:
    contar el sistema integral.

Si no:
    desarrollar el mensaje principal definido por Strategy.
    Puede usar varias funciones si demuestran esa misma idea.
    Debe quedar claro qué es Munify, pero NO enumerar toda la plataforma.
```

## 3. QA también conserva la doctrina vieja

Esto es incluso más traicionero porque aparece al final.

El QA holístico todavía evalúa fuerte:

```
cuenta TODA la propuesta — regla GLOBAL, jamás un solo módulo
```

Entonces podés producir un reel enfocado excelente y el QA después castigarlo por obedecer Strategy.

Hay que reemplazarlo por algo tipo:

```
ARCO:
respeta el messageScope y el primaryMessage definidos para la pieza.
Una pieza focalizada desarrolla una idea sin dispersarse.
Sólo brand-global debe cubrir explícitamente la propuesta integral.
```

## Y confirmo el idioma

También sigue faltando en Strategy y en el Guion completo. Concept ya tiene "Español rioplatense natural".

Agregaría la regla común que hablamos:

```
Español rioplatense natural, con voseo cuando corresponda, sin emojis ni jerga publicitaria vacía. Si un campo exige explícitamente inglés, respetá el idioma de ese campo.
```

Así Cast no se rompe con fisicoEn/descripcionEn.

## Instrucción concreta para Claude Code

Aplicá el ajuste de b-roll, pero no lo trates como otro parche de prompt. Unificá primero la definición de talking head entre parser y validator; después calculá determinísticamente la duración del b-roll con VO a 2,7 palabras/s, mínimo 4 y máximo 8, dividiendo si no entra. En la misma ronda eliminá las dos reglas GLOBAL que quedaron vivas en Concept y QA, porque contradicen Strategy/Script 2.0. Agregá la regla de idioma común. Corré tests y recién ahí repetí la prueba Munify.

Con eso sí mediría de nuevo. No agregaría ningún otro tornillo todavía.

Y te digo algo: viendo ahora el repo real, la reingeniería quedó bastante coherente. El tipo de problemas que aparecen ya no son "la arquitectura no funciona"; son exactamente estos: dos lugares que todavía conservan una regla vieja y una definición distinta de talking head en dos capas. Eso es mucho más manejable.

---

**Nota de Media Studio (la sesión que lo aplicó):** la regla de idioma ya estaba puesta antes de este
informe, en el preámbulo común de TODOS los moldes de texto (`MOLDE_SYSTEM`, `server/index.mjs`),
que es el system prompt del CLI y no se ve en el repo de prompts. Por eso no aparece en Strategy ni
en Guion: no hace falta repetirla por molde.
