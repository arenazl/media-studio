// Puente Flow · content script v3: corre DENTRO de la pestaña de flow.google.com con la sesión del dueño. Ya no
// pregunta nada por su cuenta: el background (background.js) es el que habla con Media Studio y le manda cada paso
// por mensaje; acá se ejecuta sobre la página y se devuelve el resultado. Las esperas también las cronometra el
// background, porque Chrome frena los temporizadores de una pestaña que no está a la vista y la rutina se dormía.
// Selectores relevados en vivo el 2026-10-09 sobre la interfaz real de Flow (Angular Material):
// ver docs/16-montaje-flow/02-rutina-flow-mapa.md.
(() => {
  // el background puede inyectar este archivo a mano (pestaña abierta antes de instalar o recargar la extensión):
  // si ya está corriendo en esta pestaña, no se registra dos veces (ejecutaría cada paso por duplicado)
  if (window.__puenteFlowListo) return;
  window.__puenteFlowListo = true;
  // espera cronometrada por el background (inmune al freno de pestaña oculta); si la extensión se recargó, cae al reloj local
  const espera = (ms) => new Promise((r) => {
    try { chrome.runtime.sendMessage({ tipo: 'espera', ms }, () => { void chrome.runtime.lastError; r(); }); }
    catch { setTimeout(r, ms); }
  });
  const visible = (el) => !!el && el.getClientRects().length > 0;
  const textoDe = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const q = (sel) => [...document.querySelectorAll(sel)].filter(visible);
  const porcentajeEnPantalla = () => /\b\d{1,2}\s?%/.test(document.body.innerText || '');
  const marcado = (el) => el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-selected') === 'true';

  // ── anclas reales de la interfaz ──
  const SEL = {
    caja: 'div.ProseMirror[contenteditable="true"]',
    enviar: 'button[aria-label="Iniciar generación"], button[aria-label="Start generation"]',
    ajustes: 'button[aria-label="Activador de ajustes"], button[aria-label="Settings trigger"]',
    buscador: 'input[placeholder="Buscar recursos"], input[placeholder="Search assets"]',
    opcion: 'button[role="option"]',
    tile: 'flow-grid-tile-container',
    menuitem: 'button[role="menuitem"]',
    radio: 'button[role="radio"]',
    tituloEditable: 'input.editable-text-input',
  };

  function caja() { const c = q(SEL.caja); return c[c.length - 1] || null; }
  function botonTexto(re, root = document) { return [...root.querySelectorAll('button, a, [role="button"], [role="menuitem"]')].filter(visible).find((b) => re.test(textoDe(b))) || null; }
  function hojaTexto(re) {
    const els = [...document.querySelectorAll('span, div, p, b, h1, h2, h3, li, a, button')].filter((e) => visible(e) && e.children.length === 0 && re.test(textoDe(e)));
    return els.sort((a, b) => textoDe(a).length - textoDe(b).length)[0] || null;
  }
  async function esperar(fn, ms, que) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const r = fn(); if (r) return r; await espera(400); } throw new Error(`no apareció ${que} en ${Math.round(ms / 1000)} s`); }
  async function escribir(el, texto) {
    el.focus();
    const ok = document.execCommand('insertText', false, texto);
    if (!ok) { el.textContent = (el.textContent || '') + texto; el.dispatchEvent(new InputEvent('input', { bubbles: true, data: texto, inputType: 'insertText' })); }
    await espera(150);
  }
  async function vaciar(el) { el.focus(); document.execCommand('selectAll', false, null); document.execCommand('delete', false, null); await espera(150); }
  // el editor de personaje (/character) no tiene el menú lateral: si estamos ahí, primero "Volver"
  const enEditorPersonaje = () => /\/character\/?$/.test(location.pathname) && !!caja();
  async function volverDelEditor() {
    const back = q('button').find((b) => /^(Volver|Back)$/i.test(b.getAttribute('aria-label') || ''));
    if (back) { back.click(); await espera(1500); return true; }
    history.back(); await espera(1500); return false;
  }
  // el menú de un proyecto recién creado tarda unos segundos en aparecer: se espera hasta 20 s antes de darlo por ausente
  async function navItem(re) {
    if (enEditorPersonaje()) await volverDelEditor();
    const it = await esperar(() => hojaTexto(re), 20000, `el ítem ${re} del menú`).catch(() => null);
    if (!it) throw new Error(`no encontré el ítem ${re} del menú`);
    (it.closest('a, button, [role="menuitem"], li') || it).click();
    await espera(1200);
  }
  // el texto de un tile de personaje trae el nombre y el icono ("Empleada accessibility_new"): se saca el icono
  const nombreDeTile = (t) => textoDe(t).replace(/\s*accessibility_new\s*$/, '').trim();
  function nombresDeTiles() { return q(SEL.tile).map(nombreDeTile); }
  const mismoNombre = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  const centro = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; };
  // los dos tipos del panel de ajustes y el desplegable del modelo (Veo para video; Imagen, Nano Banana o Gemini para imagen)
  const RE_VIDEO = /V[ií]deo|Video/;
  const RE_IMAGEN = /\bIm[aá]gen(es)?\b|\bImages?\b/i;
  const comboModelo = () => q('button, [role="combobox"]').filter((b) => b.getAttribute('role') !== 'radio')
    .find((b) => /Veo|Omni|Imagen|Nano|Gemini|Banana/i.test(textoDe(b)) && textoDe(b).length < 60 && b.getBoundingClientRect().top > 350) || null;
  const opcionesAbiertas = () => {
    const capa = document.querySelector('.cdk-overlay-container') || document;
    return [...capa.querySelectorAll('[role="option"], [role="menuitem"], [role="menuitemradio"], mat-option, li')].filter(visible);
  };
  // un tile de imagen: tiene una imagen real (no el ícono) y no es un video ni un personaje
  const esVideoTile = (t) => /play_circle/.test(textoDe(t)) || !!t.querySelector('video');
  const imagenDe = (t) => { const im = [...t.querySelectorAll('img')].find((i) => /^https?:/.test(i.currentSrc || i.src || '') && (i.naturalWidth || 0) >= 200); return im ? (im.currentSrc || im.src) : ''; };
  const esImagenTile = (t) => !esVideoTile(t) && !/accessibility_new/.test(textoDe(t)) && !!imagenDe(t);

  const acciones = {
    async estado() { return { url: location.href, titulo: document.title, visible: !document.hidden }; },
    async ir({ url }) { if (location.href !== url) location.href = url; await espera(2000); return { url: location.href }; },

    async nuevoProyecto() {
      const b = await esperar(() => botonTexto(/Nuevo proyecto|New project/i), 30000, '"Nuevo proyecto"');
      b.click();
      const t0 = Date.now();
      while (!/\/project\//.test(location.href) && Date.now() - t0 < 60000) await espera(500);
      await espera(2500);
      return { url: location.href };
    },

    async cerrarAgente() {
      const x = q('button').find((b) => /^(Cerrar|Close)$/i.test(b.getAttribute('aria-label') || ''));
      if (x) { x.click(); await espera(400); return { cerrado: true }; }
      return { cerrado: false };
    },
    async apagarAgente() {
      const b = q('button').find((x) => /^Agente$|^Agent$/i.test(textoDe(x)));
      if (!b) return { habia: false };
      const on = b.getAttribute('aria-pressed') === 'true';
      if (on) { b.click(); await espera(500); }
      return { habia: true, apagado: on };
    },

    async personajeExiste({ nombre }) {
      await navItem(/^Caracteres$|^Characters$/);
      // se espera a que aparezca la grilla de personajes o el editor (proyecto sin personajes), hasta 12 s
      for (let i = 0; i < 24 && !q(SEL.tile).length && !enEditorPersonaje(); i++) await espera(500);
      await espera(800);
      if (enEditorPersonaje() && !q(SEL.tile).length) return { existe: false, editorAbierto: true };
      const nombres = nombresDeTiles();
      const existe = nombres.some((t) => mismoNombre(t, nombre)) || !!hojaTexto(new RegExp(`^${nombre}$`, 'i'));
      return { existe, nombres: nombres.map((t) => t.slice(0, 30)) };
    },

    // ── Personaje nuevo, en tres pasos (relevado en vivo el 2026-10-10, 03:10 ART) ──
    // La flecha "Iniciar generación" del editor de personaje NO responde a un click programado (ni a Enter): sólo a un
    // click real. Por eso acá se prepara (editor abierto + prompt escrito) y se devuelven las coordenadas de la flecha;
    // el background hace el click real por el depurador de Chrome; después se espera la generación y se renombra desde
    // la grilla (menú "Cambiar nombre"), que sí acepta el tipeo programado. El título dentro del editor no lo acepta.
    async prepararPersonaje({ prompt }) {
      if (!enEditorPersonaje()) {
        await navItem(/^Caracteres$|^Characters$/);
        await espera(800);
        if (!enEditorPersonaje()) {
          const nuevo = await esperar(() => botonTexto(/Nuevo personaje|New character/i), 20000, '"Nuevo personaje"');
          nuevo.click();
        }
      }
      await esperar(() => /\/character\/?$/.test(location.pathname) && caja(), 20000, 'el editor de personaje');
      await espera(600);
      const c = caja();
      if (textoDe(c) !== String(prompt || '').replace(/\s+/g, ' ').trim()) { await vaciar(c); await escribir(c, prompt); await espera(400); }
      const btn = await esperar(() => { const b = q(SEL.enviar)[0]; return b && !b.disabled ? b : null; }, 10000, 'la flecha de generar habilitada');
      return { ...centro(btn), url: location.href };
    },
    async esperarPersonaje({ maxSeg = 240 } = {}) {
      const t0 = Date.now();
      // arrancó cuando la página pasa a /character/<id>
      let arranco = false;
      for (let i = 0; i < 60 && !arranco; i++) { await espera(500); arranco = /\/character\/[^/]+/.test(location.pathname); }
      if (!arranco) return { arranco: false, seg: Math.round((Date.now() - t0) / 1000) };
      await espera(3000);
      while (porcentajeEnPantalla() && Date.now() - t0 < maxSeg * 1000) await espera(2000);
      await espera(1500);
      return { arranco: true, terminado: !porcentajeEnPantalla(), seg: Math.round((Date.now() - t0) / 1000), url: location.href };
    },
    async renombrarUltimoPersonaje({ nombre }) {
      await navItem(/^Caracteres$|^Characters$/);
      await espera(800);
      if (nombresDeTiles().some((t) => mismoNombre(t, nombre))) return { ok: true, yaEstaba: true };
      // el recién generado es el que todavía se llama "Personaje sin nombre"; si no hay ninguno, el primero de la grilla
      const tile = await esperar(() => q(SEL.tile).find((t) => /^Personaje sin nombre$|^Untitled/i.test(nombreDeTile(t))) || q(SEL.tile)[0], 15000, 'el personaje en la grilla');
      const r = tile.getBoundingClientRect();
      tile.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 2 }));
      const ren = await esperar(() => q(SEL.menuitem).find((m) => /Cambiar nombre|Rename/i.test(textoDe(m))), 10000, 'el ítem "Cambiar nombre"');
      ren.click();
      const inp = await esperar(() => q(SEL.tituloEditable).find((i) => i.classList.contains('editing')) || q(SEL.tituloEditable).find((i) => /Personaje sin nombre|Untitled/i.test(i.value || '')), 10000, 'el nombre editable del personaje');
      inp.focus(); inp.select();
      document.execCommand('insertText', false, nombre);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      await espera(200);
      for (const tipo of ['keydown', 'keypress', 'keyup']) inp.dispatchEvent(new KeyboardEvent(tipo, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      await espera(1500);
      const tiles = nombresDeTiles();
      return { ok: tiles.some((t) => mismoNombre(t, nombre)), tiles: tiles.map((t) => t.slice(0, 40)) };
    },
    // coordenadas de un control para el click real del background (cuando el click programado no dispara)
    async coordsEnviar() { const b = await esperar(() => q(SEL.enviar)[0], 10000, 'la flecha de generar'); return centro(b); },

    async irAContenido() {
      await navItem(/^Todo el contenido|^All media/i);
      // la grilla puede tardar en cambiar de filtro: se espera hasta ver un video o 6 s
      for (let i = 0; i < 12 && !q(SEL.tile).some((t) => /play_circle/.test(textoDe(t)) || t.querySelector('video')); i++) await espera(500);
      return { url: location.href, tiles: nombresDeTiles().slice(0, 5) };
    },

    // el panel de ajustes: pastillas (role=radio) para Imagen/Vídeo, Fotogramas/Ingredientes, 16:9/9:16 y x1..x4; el
    // modelo es un desplegable. Resolución y duración se verifican leyendo la pastilla ("Vídeo · 720p · 8 s ...").
    // 2026-10-14: tipo, modelos y resolución salen del preset de calidad que elige Lucas (server/calidadFlow.mjs);
    // `modelos` es una lista de expresiones en orden de preferencia: se elige la primera que esté en el desplegable.
    async ajustes({ tipo = 'video', modelos = null, resolucion = '720p', duracion = '8 s', salidas = 'x1', formato = '9:16' } = {}) {
      const esImagen = tipo === 'imagen';
      const prefer = (Array.isArray(modelos) && modelos.length ? modelos : (esImagen ? [] : ['Veo 3\\.1.*Fast'])).map((s) => new RegExp(s, 'i'));
      const trigger = await esperar(() => q(SEL.ajustes)[0], 15000, 'la pastilla de ajustes');
      const abrir = async () => { if (!q(SEL.radio).length) { trigger.click(); await espera(700); } };
      const cerrar = async () => { if (q(SEL.radio).length) { trigger.click(); await espera(400); } };
      await abrir();
      const radio = async (re) => { const r = q(SEL.radio).find((b) => re.test(textoDe(b))); if (r && !marcado(r)) { r.click(); await espera(350); } return !!r; };
      const hayTipo = await radio(esImagen ? RE_IMAGEN : RE_VIDEO);
      if (esImagen && !hayTipo) throw new Error('[antes de enviar] no encontré la opción Imagen en los ajustes de Flow');
      await espera(300);
      if (!esImagen) await radio(/Ingredientes|Ingredients/);
      await radio(new RegExp(`\\b${formato}\\b`));
      const combo = comboModelo();
      if (combo && prefer.length && !prefer.some((re) => re.test(textoDe(combo)))) {
        combo.click(); await espera(600);
        const ops = opcionesAbiertas();
        let op = null;
        for (const re of prefer) { op = ops.find((o) => re.test(textoDe(o))); if (op) break; }
        if (op) { op.click(); await espera(400); }
        // sin opción: el menú se cierra tocando el fondo (un Escape sintético no lo cierra)
        if (q('[role="menu"], [role="listbox"]').length) { const fondo = q('.cdk-overlay-backdrop')[0]; if (fondo) fondo.click(); else combo.click(); await espera(300); }
      }
      if (!esImagen) {
        await radio(new RegExp(`^${resolucion}$`));
        await radio(new RegExp(`^${duracion.replace(' ', '\\s?')}$`));
      }
      await radio(new RegExp(`^${salidas}$`));
      await espera(300);
      await cerrar();
      const pastilla = textoDe(q(SEL.ajustes)[0] || trigger);
      const elegido = comboModelo();
      return { pastilla, tipo, res720: /720p/.test(pastilla), dur8: /\b8\s?s\b/.test(pastilla), resolucion: (/\b(720p|1080p|4K)\b/i.exec(pastilla) || [])[1] || null, modelo: elegido ? textoDe(elegido).replace(/arrow_drop_down/, '').trim() : (combo ? textoDe(combo).replace(/arrow_drop_down/, '').trim() : null) };
    },

    // lo que ofrece el panel de ajustes de ESTA cuenta (2026-10-14): tipos, modelos con su texto tal cual (ahí Flow dice
    // los créditos), resoluciones y duraciones. Con esto se ajustan los presets a lo que hay de verdad.
    async leerAjustes() {
      const trigger = await esperar(() => q(SEL.ajustes)[0], 15000, 'la pastilla de ajustes');
      if (!q(SEL.radio).length) { trigger.click(); await espera(700); }
      const radios = () => q(SEL.radio).map((r) => ({ texto: textoDe(r), marcado: marcado(r) }));
      const leerModelos = async () => {
        const c = comboModelo();
        if (!c) return { actual: null, opciones: [] };
        const actual = textoDe(c);
        c.click(); await espera(700);
        const opciones = opcionesAbiertas().map(textoDe).filter(Boolean);
        const fondo = q('.cdk-overlay-backdrop')[0]; if (fondo) fondo.click(); else c.click();
        await espera(400);
        return { actual, opciones };
      };
      const out = { pastilla: textoDe(trigger), radios: radios() };
      for (const [clave, re] of [['video', RE_VIDEO], ['imagen', RE_IMAGEN]]) {
        const r = q(SEL.radio).find((b) => re.test(textoDe(b)));
        if (!r) { out[clave] = null; continue; }
        r.click(); await espera(600);
        out[clave] = { radios: radios(), modelos: await leerModelos() };
      }
      const rv = q(SEL.radio).find((b) => RE_VIDEO.test(textoDe(b))); if (rv && !marcado(rv)) { rv.click(); await espera(400); }
      if (q(SEL.radio).length) { trigger.click(); await espera(300); }
      return out;
    },

    // las líneas de la página y las etiquetas que coinciden con un texto (2026-10-14: dónde muestra Flow los créditos).
    // `tocar`: antes de leer, toca el botón cuya etiqueta coincide (el de la cuenta, por ejemplo) y después lo cierra.
    async buscarTexto({ re = 'cr[eé]dito', tocar = '' } = {}) {
      const rx = new RegExp(re, 'i');
      let tocado = null;
      if (tocar) {
        const rt = new RegExp(tocar, 'i');
        tocado = [...document.querySelectorAll('button, a, [role="button"], img')].filter(visible).find((b) => rt.test(b.getAttribute('aria-label') || b.getAttribute('title') || b.getAttribute('alt') || textoDe(b)));
        if (tocado) { (tocado.closest('button, a, [role="button"]') || tocado).click(); await espera(1500); }
      }
      const lineas = (document.body.innerText || '').split('\n').map((l) => l.trim()).filter((l) => l && rx.test(l)).slice(0, 30);
      const etiquetas = [...document.querySelectorAll('[aria-label], [title]')].map((e) => e.getAttribute('aria-label') || e.getAttribute('title')).filter((t) => t && rx.test(t)).slice(0, 30);
      const botones = [...document.querySelectorAll('button, a, [role="button"]')].filter(visible).map((b) => b.getAttribute('aria-label') || textoDe(b)).filter(Boolean).slice(0, 60);
      if (tocado) { for (let i = 0; i < 2; i++) { const f = q('.cdk-overlay-backdrop')[0]; if (f) { f.click(); await espera(300); } } document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })); }
      return { lineas, etiquetas, tocado: tocado ? (tocado.getAttribute('aria-label') || textoDe(tocado)).slice(0, 80) : null, botones };
    },

    // el primer tile de la grilla tal cual (para relevar cómo se ve una imagen nueva en la interfaz de Flow)
    async leerTile() {
      const t = q(SEL.tile)[0];
      if (!t) return { hay: false };
      return { hay: true, texto: textoDe(t).slice(0, 300), imgs: [...t.querySelectorAll('img')].map((i) => ({ src: String(i.currentSrc || i.src || '').slice(0, 200), w: i.naturalWidth, h: i.naturalHeight })), videos: t.querySelectorAll('video').length, html: t.outerHTML.slice(0, 2500) };
    },

    // cierra menús y ventanitas que quedaron abiertas (el buscador de @, un desplegable) y vacía la caja de prompt
    async limpiar() {
      for (let i = 0; i < 3; i++) { const f = q('.cdk-overlay-backdrop')[0]; if (!f) break; f.click(); await espera(300); }
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      await espera(300);
      const c = caja(); if (c) await vaciar(c);
      return { ok: true };
    },

    // 2026-10-12: la mención @personaje se reintenta (hasta 3 veces) y vale también si Flow agrega el personaje a la caja
    // sin mostrar el botón "Añadir a petición". Todo error antes de tocar la flecha sale marcado "[antes de enviar]": no se
    // generó nada, el servidor lo puede reintentar sin gastar créditos.
    async generar({ prompt, personajes = [] }) {
      const BOTON_ANADIR = /A[ñn]adir a (la )?petici[oó]n|Agregar a (la )?petici[oó]n|Add to prompt/i;
      const mencionar = async (c, nombre) => {
        const re = new RegExp(`^${nombre}$`, 'i');
        let ultimo = null;
        for (let intento = 1; intento <= 3; intento++) {
          try {
            const largoAntes = textoDe(c).length;
            await escribir(c, '@');
            await esperar(() => q(SEL.buscador)[0], 15000, 'el buscador de recursos');
            const op = await esperar(() => q(SEL.opcion).find((o) => [...o.querySelectorAll('span')].some((s) => re.test(textoDe(s)))), 15000, `el personaje ${nombre} en la lista`);
            op.click(); await espera(600);
            // o aparece el botón para confirmarlo, o Flow ya lo puso en la caja
            const listo = await esperar(() => botonTexto(BOTON_ANADIR) || (new RegExp(nombre, 'i').test(textoDe(c)) && textoDe(c).length > largoAntes ? 'en-la-caja' : null), 15000, '"Añadir a petición"');
            if (listo !== 'en-la-caja') { listo.click(); await espera(600); }
            return;
          } catch (e) {
            ultimo = e;
            // se cierra lo que quedó abierto y se borra el "@" suelto antes de reintentar
            for (let i = 0; i < 3; i++) { const f = q('.cdk-overlay-backdrop')[0]; if (!f) break; f.click(); await espera(300); }
            c.focus(); if (/@\s*$/.test(textoDe(c))) { document.execCommand('delete', false, null); await espera(200); }
            await espera(800 * intento);
          }
        }
        throw new Error(`no pude mencionar a @${nombre}: ${ultimo ? ultimo.message : 'sin detalle'}`);
      };
      let c, antes, enviar;
      try {
        c = await esperar(() => caja(), 15000, 'la caja de prompt');
        await vaciar(c);
        for (const nombre of personajes) await mencionar(c, nombre);
        await escribir(c, (personajes.length ? ' ' : '') + prompt);
        await espera(600);
        antes = q(SEL.tile).length;
        enviar = await esperar(() => q(SEL.enviar)[0], 10000, 'la flecha de generar');
      } catch (e) { throw new Error(`[antes de enviar] ${e.message}`); }
      enviar.click();
      await espera(2500);
      let disparado = porcentajeEnPantalla() || q(SEL.tile).length > antes;
      if (!disparado && textoDe(c).length > 0) { enviar.click(); await espera(2500); disparado = porcentajeEnPantalla() || q(SEL.tile).length > antes; }
      // si el click programado no disparó, el servidor puede pedir un click real en estas coordenadas
      const r2 = enviar.getBoundingClientRect();
      // `antes`: con él el servidor sabe cuántos clips dejó este pedido (x2 deja dos y corría el reparto por escena)
      return { disparado, antes, tiles: q(SEL.tile).length, enviar: { x: Math.round(r2.left + r2.width / 2), y: Math.round(r2.top + r2.height / 2) } };
    },

    // Lucas (2026-10-10): a veces el clip queda "cargando" y Flow tira error; con refrescar la pestaña aparece bien. Acá se
    // detecta el tile con error o el porcentaje clavado; el servidor refresca (acción "recargar") y vuelve a esperar.
    // 2026-10-12: "terminado" recién cuando el porcentaje se fue y no vuelve en 8 s, habiéndolo visto (o pasados 45 s sin
    // verlo nunca). Antes cortaba a los 4 s si el porcentaje todavía no había aparecido y daba por trabado un clip que
    // estaba arrancando (la escena 1 de "El reclamo perdido" quedó pedida dos veces en Flow).
    async esperarGeneracion({ maxSeg = 300, atascadoSeg = 150 } = {}) {
      const t0 = Date.now();
      const seg = () => Math.round((Date.now() - t0) / 1000);
      const pctActual = () => { const m = (document.body.innerText || '').match(/\b(\d{1,2})\s?%/); return m ? Number(m[1]) : null; };
      const tileConError = () => { const t = q(SEL.tile)[0]; return !!t && /\berror\b|no se pudo|volver a intentar|algo sali[oó] mal|try again|failed/i.test(textoDe(t)); };
      await espera(4000);
      let ultimoPct = null, desdePct = Date.now(), vioPct = false, sinPctDesde = null;
      while (Date.now() - t0 < maxSeg * 1000) {
        // con el texto que muestra Flow en el tile, así se sabe por qué lo rechazó (2026-10-12)
        if (tileConError()) return { seg: seg(), terminado: false, conError: true, texto: textoDe(q(SEL.tile)[0]).slice(0, 240) };
        if (porcentajeEnPantalla()) {
          vioPct = true; sinPctDesde = null;
          const p = pctActual();
          if (p !== ultimoPct) { ultimoPct = p; desdePct = Date.now(); }
          else if (Date.now() - desdePct > atascadoSeg * 1000) return { seg: seg(), terminado: false, atascado: true, pct: p };
        } else {
          if (sinPctDesde === null) sinPctDesde = Date.now();
          if (Date.now() - sinPctDesde > 8000 && (vioPct || seg() > 45)) return { seg: seg(), terminado: true, conError: tileConError(), vioPct };
        }
        await espera(2000);
      }
      return { seg: seg(), terminado: false, cargando: true, pct: ultimoPct };
    },

    // las URLs de los archivos de video de los clips de la grilla, del más nuevo al más viejo. Sin menú ni clicks: la
    // descarga la hace el background con chrome.downloads, esté o no la pestaña a la vista (2026-10-11: el menú de clic
    // derecho no apareció con la ventana de Flow al fondo y se cortó la rutina entera)
    // el video del clip más nuevo de la grilla (el que acaba de terminar): se toma apenas termina cada escena, así la
    // bajada no depende de la posición (un clip con error que desaparece al recargar corría el reparto, 2026-10-12)
    async urlDelMasNuevo({ tipo = 'video' } = {}) {
      // 2026-10-14: una foto pedida como imagen (preset Ahorro o Calidad): la URL es la de la imagen del primer tile
      if (tipo === 'imagen') {
        if (!/\/project\//.test(location.pathname)) return { url: '', motivo: 'la pestaña no está en el proyecto' };
        for (let i = 0; i < 20 && !(q(SEL.tile)[0] && esImagenTile(q(SEL.tile)[0])); i++) await espera(500);
        const t = q(SEL.tile)[0];
        if (!t || !esImagenTile(t)) return { url: '', motivo: 'el primer tile no es una imagen' };
        return { url: imagenDe(t), esElPrimero: true };
      }
      const esVideo = (t) => /play_circle/.test(textoDe(t)) || !!t.querySelector('video');
      const urlDe = (t) => { const v = t.querySelector('video'); if (!v) return ''; const src = v.currentSrc || v.src || (v.querySelector('source') || {}).src || ''; return /^https?:/.test(src) ? src : ''; };
      const pasar = (t, tipos) => { for (const el of [t, ...t.querySelectorAll('*')].slice(0, 15)) for (const tipo of tipos) el.dispatchEvent(new MouseEvent(tipo, { bubbles: /over|out/.test(tipo), cancelable: true, view: window })); };
      // sólo en la grilla del proyecto y sólo el PRIMER tile (el más nuevo): si no es un video, no se toma ninguno
      // (2026-10-12: tomar "el primer video" agarró uno de los ejemplos de Flow después de recargar)
      if (!/\/project\//.test(location.pathname)) return { url: '', motivo: 'la pestaña no está en el proyecto' };
      for (let i = 0; i < 10 && !(q(SEL.tile)[0] && esVideo(q(SEL.tile)[0])); i++) await espera(500);
      const t = q(SEL.tile)[0];
      if (!t || !esVideo(t)) return { url: '', motivo: 'el primer tile no es un video' };
      let u = urlDe(t);
      if (!u) {
        pasar(t, ['pointerover', 'pointerenter', 'mouseover', 'mouseenter']);
        for (let i = 0; i < 15 && !(u = urlDe(t)); i++) await espera(300);
        pasar(t, ['pointerout', 'pointerleave', 'mouseout', 'mouseleave']);
      }
      return { url: u || '', esElPrimero: q(SEL.tile)[0] === t };
    },

    async urlsDeClips() {
      const esVideo = (t) => /play_circle/.test(textoDe(t)) || !!t.querySelector('video');
      const urlDe = (t) => { const v = t.querySelector('video'); if (!v) return ''; const src = v.currentSrc || v.src || (v.querySelector('source') || {}).src || ''; return /^https?:/.test(src) ? src : ''; };
      // Flow arma el <video> de un clip recién cuando el mouse pasa por encima: se simula el paso del mouse en el tile
      const pasar = (t, tipos) => { for (const el of [t, ...t.querySelectorAll('*')].slice(0, 15)) for (const tipo of tipos) el.dispatchEvent(new MouseEvent(tipo, { bubbles: /over|out/.test(tipo), cancelable: true, view: window })); };
      // todos los tiles de la grilla, del más nuevo al más viejo: '' en los que no son video (imágenes, clips con error o
      // sin terminar). `todos` permite bajar cada escena por la posición que tuvo cuando se pidió (2026-10-12).
      const todosTiles = q(SEL.tile);
      const todos = [];
      for (const t of todosTiles) {
        if (!esVideo(t)) { todos.push(''); continue; }
        let u = urlDe(t);
        if (!u) {
          pasar(t, ['pointerover', 'pointerenter', 'mouseover', 'mouseenter']);
          for (let i = 0; i < 12 && !(u = urlDe(t)); i++) await espera(300);
          pasar(t, ['pointerout', 'pointerleave', 'mouseout', 'mouseleave']);
        }
        todos.push(u || '');
      }
      const urls = todosTiles.map((t, i) => (esVideo(t) ? todos[i] : null)).filter((u) => u !== null);
      // del más nuevo al más viejo; '' donde Flow no dio el video
      return { total: urls.length, urls, sinUrl: urls.filter((u) => !u).length, todos, totalTiles: todosTiles.length };
    },
  };

  // el background manda { tipo: 'paso', paso: { id, accion, args } } y espera { ok, data | error }
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.tipo !== 'paso') return false;
    const paso = msg.paso || {};
    (async () => {
      try {
        const fn = acciones[paso.accion];
        if (!fn) throw new Error(`acción desconocida: ${paso.accion}`);
        sendResponse({ ok: true, data: await fn(paso.args || {}) });
      } catch (e) {
        sendResponse({ ok: false, error: e && e.message ? e.message : String(e) });
      }
    })();
    return true;
  });
  console.log('[puente-flow] v3 listo en', location.href);
})();
