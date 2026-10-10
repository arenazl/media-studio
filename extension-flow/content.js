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
  async function navItem(re) { const it = hojaTexto(re); if (!it) throw new Error(`no encontré el ítem ${re} del menú`); (it.closest('a, button, [role="menuitem"], li') || it).click(); await espera(1200); }
  function nombresDeTiles() { return q(SEL.tile).map((t) => textoDe(t)); }

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
      await espera(1000);
      const re = new RegExp(`^${nombre}$`, 'i');
      const existe = nombresDeTiles().some((t) => re.test(t)) || !!hojaTexto(re);
      return { existe };
    },

    async crearPersonaje({ nombre, prompt }) {
      await navItem(/^Caracteres$|^Characters$/);
      await espera(800);
      const nuevo = await esperar(() => botonTexto(/Nuevo personaje|New character/i), 20000, '"Nuevo personaje"');
      nuevo.click();
      await esperar(() => /\/character/.test(location.href) && caja(), 20000, 'el editor de personaje');
      await espera(600);
      const c = caja();
      await vaciar(c);
      await escribir(c, prompt);
      await espera(300);
      (await esperar(() => q(SEL.enviar)[0], 10000, 'la flecha de generar')).click();
      // generando: aparece el título editable "Personaje sin nombre"; termina cuando no hay porcentaje en pantalla
      const titulo = await esperar(() => q(SEL.tituloEditable).find((i) => /Personaje sin nombre|Untitled character/i.test(i.value || '')), 240000, 'el título del personaje');
      const t0 = Date.now();
      while (porcentajeEnPantalla() && Date.now() - t0 < 240000) await espera(2000);
      await espera(1500);
      titulo.focus(); titulo.select();
      document.execCommand('insertText', false, nombre);
      titulo.dispatchEvent(new Event('input', { bubbles: true }));
      titulo.dispatchEvent(new Event('change', { bubbles: true }));
      titulo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      titulo.blur();
      await espera(800);
      const listo = botonTexto(/^Listo$|^Done$/);
      if (listo) { listo.click(); await espera(1500); }
      else { history.back(); await espera(1500); }
      return { nombre, titulo: titulo.value };
    },

    async irAContenido() { await navItem(/^Todo el contenido|^All media/i); return { url: location.href }; },

    // el panel de ajustes: pastillas (role=radio) para Imagen/Vídeo, Fotogramas/Ingredientes, 16:9/9:16 y x1..x4; el
    // modelo es un desplegable. Resolución y duración se verifican leyendo la pastilla ("Vídeo · 720p · 8 s ...").
    async ajustes({ duracion = '8 s', salidas = 'x1', formato = '9:16' } = {}) {
      const trigger = await esperar(() => q(SEL.ajustes)[0], 15000, 'la pastilla de ajustes');
      const abrir = async () => { if (!q(SEL.radio).length) { trigger.click(); await espera(700); } };
      const cerrar = async () => { if (q(SEL.radio).length) { trigger.click(); await espera(400); } };
      await abrir();
      const radio = async (re) => { const r = q(SEL.radio).find((b) => re.test(textoDe(b))); if (r && !marcado(r)) { r.click(); await espera(350); } return !!r; };
      await radio(/V[ií]deo|Video/);
      await espera(300);
      await radio(/Ingredientes|Ingredients/);
      await radio(new RegExp(`\\b${formato}\\b`));
      const combo = q('button, [role="combobox"]').find((b) => /Veo|Omni/i.test(textoDe(b)) && textoDe(b).length < 40 && b.getBoundingClientRect().top > 350);
      if (combo && !/Veo 3\.1.*Fast/i.test(textoDe(combo))) {
        combo.click(); await espera(600);
        const ops = q('[role="option"], [role="menuitem"], mat-option, li');
        const op = ops.find((o) => /Veo 3\.1.*Fast/i.test(textoDe(o))) || ops.find((o) => /Veo 3\.1/i.test(textoDe(o)));
        if (op) { op.click(); await espera(400); }
        // sin opción: el menú se cierra tocando el fondo (un Escape sintético no lo cierra)
        if (q('[role="menu"]').length) { const fondo = q('.cdk-overlay-backdrop')[0]; if (fondo) fondo.click(); else combo.click(); await espera(300); }
      }
      await radio(/^720p$/);
      await radio(new RegExp(`^${duracion.replace(' ', '\\s?')}$`));
      await radio(new RegExp(`^${salidas}$`));
      await espera(300);
      await cerrar();
      const pastilla = textoDe(q(SEL.ajustes)[0] || trigger);
      return { pastilla, res720: /720p/.test(pastilla), dur8: /\b8\s?s\b/.test(pastilla), modelo: combo ? textoDe(combo).replace(/arrow_drop_down/, '').trim() : null };
    },

    async generar({ prompt, personajes = [] }) {
      const c = await esperar(() => caja(), 15000, 'la caja de prompt');
      await vaciar(c);
      for (const nombre of personajes) {
        await escribir(c, '@');
        await esperar(() => q(SEL.buscador)[0], 15000, 'el buscador de recursos');
        const re = new RegExp(`^${nombre}$`, 'i');
        const op = await esperar(() => q(SEL.opcion).find((o) => [...o.querySelectorAll('span')].some((s) => re.test(textoDe(s)))), 15000, `el personaje ${nombre} en la lista`);
        op.click(); await espera(600);
        (await esperar(() => botonTexto(/Añadir a petición|Add to prompt/i), 15000, '"Añadir a petición"')).click();
        await espera(600);
      }
      await escribir(c, (personajes.length ? ' ' : '') + prompt);
      await espera(600);
      const antes = q(SEL.tile).length;
      const enviar = await esperar(() => q(SEL.enviar)[0], 10000, 'la flecha de generar');
      enviar.click();
      await espera(2500);
      let disparado = porcentajeEnPantalla() || q(SEL.tile).length > antes;
      if (!disparado && textoDe(c).length > 0) { enviar.click(); await espera(2500); disparado = porcentajeEnPantalla() || q(SEL.tile).length > antes; }
      return { disparado, tiles: q(SEL.tile).length };
    },

    async esperarGeneracion({ maxSeg = 300 } = {}) {
      const t0 = Date.now();
      await espera(4000);
      while (porcentajeEnPantalla() && Date.now() - t0 < maxSeg * 1000) await espera(2000);
      await espera(1500);
      return { seg: Math.round((Date.now() - t0) / 1000), terminado: !porcentajeEnPantalla() };
    },

    // el clip más nuevo es el primer tile de la grilla; el menú contextual trae "Descargar" directo (calidad original)
    async descargarUltimo() {
      const tile = await esperar(() => q(SEL.tile)[0], 10000, 'el clip en la grilla');
      const r = tile.getBoundingClientRect();
      tile.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 2 }));
      const item = await esperar(() => q(SEL.menuitem).find((m) => /^(download\s*)?(Descargar|Download)$/i.test(textoDe(m))), 10000, 'el ítem Descargar');
      item.click();
      // "Descargar" abre un submenú: 270p GIF · 720p Tamaño original · 1080p/4K Resolución mejorada (esas dos gastan créditos)
      const original = await esperar(() => q(SEL.menuitem).find((m) => /Tama[ñn]o original|Original size/i.test(textoDe(m)))
        || q(SEL.menuitem).find((m) => /^720p/.test(textoDe(m)) && !/mejorada|upscal/i.test(textoDe(m))), 10000, 'la opción "Tamaño original" del submenú de descarga');
      const calidad = textoDe(original);
      original.click();
      await espera(800);
      return { pedido: true, calidad, tile: textoDe(tile).slice(0, 60) };
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
