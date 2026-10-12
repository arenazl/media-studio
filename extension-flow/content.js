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
    async esperarGeneracion({ maxSeg = 300, atascadoSeg = 150 } = {}) {
      const t0 = Date.now();
      const seg = () => Math.round((Date.now() - t0) / 1000);
      const pctActual = () => { const m = (document.body.innerText || '').match(/\b(\d{1,2})\s?%/); return m ? Number(m[1]) : null; };
      const tileConError = () => { const t = q(SEL.tile)[0]; return !!t && /\berror\b|no se pudo|volver a intentar|algo sali[oó] mal|try again|failed/i.test(textoDe(t)); };
      await espera(4000);
      let ultimoPct = null, desdePct = Date.now();
      while (Date.now() - t0 < maxSeg * 1000) {
        if (tileConError()) return { seg: seg(), terminado: false, conError: true };
        if (!porcentajeEnPantalla()) break;
        const p = pctActual();
        if (p !== ultimoPct) { ultimoPct = p; desdePct = Date.now(); }
        else if (Date.now() - desdePct > atascadoSeg * 1000) return { seg: seg(), terminado: false, atascado: true, pct: p };
        await espera(2000);
      }
      await espera(1500);
      return { seg: seg(), terminado: !porcentajeEnPantalla(), conError: tileConError() };
    },

    // las URLs de los archivos de video de los clips de la grilla, del más nuevo al más viejo. Sin menú ni clicks: la
    // descarga la hace el background con chrome.downloads, esté o no la pestaña a la vista (2026-10-11: el menú de clic
    // derecho no apareció con la ventana de Flow al fondo y se cortó la rutina entera)
    async urlsDeClips() {
      const esVideo = (t) => /play_circle/.test(textoDe(t)) || !!t.querySelector('video');
      const urlDe = (t) => { const v = t.querySelector('video'); if (!v) return ''; const src = v.currentSrc || v.src || (v.querySelector('source') || {}).src || ''; return /^https?:/.test(src) ? src : ''; };
      // Flow arma el <video> de un clip recién cuando el mouse pasa por encima: se simula el paso del mouse en el tile
      const pasar = (t, tipos) => { for (const el of [t, ...t.querySelectorAll('*')].slice(0, 15)) for (const tipo of tipos) el.dispatchEvent(new MouseEvent(tipo, { bubbles: /over|out/.test(tipo), cancelable: true, view: window })); };
      const tiles = q(SEL.tile).filter(esVideo);
      const urls = [];
      for (const t of tiles) {
        let u = urlDe(t);
        if (!u) {
          pasar(t, ['pointerover', 'pointerenter', 'mouseover', 'mouseenter']);
          for (let i = 0; i < 12 && !(u = urlDe(t)); i++) await espera(300);
          pasar(t, ['pointerout', 'pointerleave', 'mouseout', 'mouseleave']);
        }
        urls.push(u);
      }
      // del más nuevo al más viejo; '' donde Flow no dio el video
      return { total: tiles.length, urls, sinUrl: urls.filter((u) => !u).length };
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
