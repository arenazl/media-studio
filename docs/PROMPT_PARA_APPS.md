# Prompt para las apps — generar el brief del negocio

> Este es el **prompt que se le pasa a cada app/cliente** (o a su IA) para que produzca
> el documento del negocio en el formato que necesita el panel de skills. El cliente
> describe **solo hechos**; el marketing lo pone nuestra app. Las **capturas** se
> adjuntan aparte (carpeta de screenshots → mockups).

---

## El prompt (copiar y pegar, reemplazando `[NOMBRE]`)

```
Sos el dueño/responsable de [NOMBRE DEL NEGOCIO]. Generá un documento en markdown que
describa tu negocio con HECHOS — nada de marketing, eslóganes ni adjetivos de venta
(de eso se encarga la herramienta). Completá esta estructura y dejá en blanco lo que
no aplique:

1. EL NEGOCIO — qué hacés/vendés (1–2 frases), rubro, dónde operás.
2. PRODUCTO/SERVICIO — cómo funciona (pasos simples), qué incluye.
3. PÚBLICO — cliente ideal (quién es, a qué se dedica), cómo habla.
4. DOLOR — el problema real del cliente en SUS palabras; qué hace hoy sin vos.
5. POR QUÉ VOS — diferenciador; prueba (números/casos/antigüedad, SOLO si son reales).
6. ACCIÓN (CTA) — qué querés que haga quien ve el video; link/contacto; oferta vigente.
7. MARCA — tono; colores/logo (hex o archivo); cosas a EVITAR; idioma/variante.
8. CAPTURAS — qué pantallas de la app vas a adjuntar y qué muestra cada una.
9. PRESET — reels 9:16 / video 16:9 / solo mockups / solo shorts Flow / mezcla.

Reglas:
- Solo hechos verificables. No inventes datos, números ni testimonios.
- Lenguaje claro, sin jerga. Si no sabés un dato, dejalo en blanco.
- No escribas el marketing (hooks, guiones, ángulos) — eso lo genera la herramienta.

Por separado se adjunta una carpeta con CAPTURAS reales de la app/producto para armar
los mockups (pantallas reales, nítidas).
```

La estructura detallada está en [`BRIEF_NEGOCIO.md`](./BRIEF_NEGOCIO.md) — este prompt
es la versión "pedído" para que cualquiera (o la IA del cliente) genere ese brief.

---

## Qué hace la herramienta con eso
```
brief (hechos) + capturas + preset
  → social-marketing-strategist (estrategia)
  → promo-director (guiones)
  → mockup-designer (mockups de las capturas) · veo-flow-prompter (prompts de video)
  → promo-critic (QA)
  → social-platform-specialist (caption + hashtags por plataforma)
  → EDITOR (compone) → render mp4
```
