// Orquestación de campaña (2026-10-10, Lucas: "campañas lógicas, enfoques, buen material crudo"; "no generemos todavía:
// entendamos la orquestación, curemos eso"). A partir del kit de una app arma el PLAN de la campaña sin llamar al modelo:
// qué piezas, para qué objetivo y a qué audiencia, con qué ángulo y tono, y cada momento de cada pieza con su material
// (filmada en Flow, mockup de la pantalla real, texto o placa) y el dato del kit que le toca. Determinístico: mismo kit y
// mismo formato, mismo plan. Las reglas viven en server/orquestacion-v1.json y se curan ahí; este archivo sólo las aplica.
// El modelo, después, escribe ADENTRO de este plan (cableado pendiente de la curación).
import { readFileSync } from 'node:fs';

export const REGLAS = JSON.parse(readFileSync(new URL('./orquestacion-v1.json', import.meta.url), 'utf8'));

// ── texto ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const S = (v) => (typeof v === 'string' ? v.trim() : '');
const arr = (v) => (Array.isArray(v) ? v.filter((x) => x !== undefined && x !== null && x !== '') : []);
const norm = (s) => S(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]+/g, ' ').trim();
const VACIAS = new Set(['para', 'como', 'cuando', 'desde', 'hasta', 'entre', 'sobre', 'tiene', 'esta', 'este', 'esto', 'esas', 'esos', 'todo', 'cada', 'solo', 'sola', 'unos', 'unas', 'pero', 'porque', 'donde', 'queda', 'tus', 'sus', 'que', 'los', 'las', 'del', 'con', 'por', 'una', 'uno', 'app']);
// raíces de 4 letras de las palabras con contenido: "armar el plan de pagos" y "arma el plan de pagos" comparten 3 de 3
const raices = (s) => [...new Set(norm(s).split(' ').filter((w) => w.length >= 4 && !VACIAS.has(w)).map((w) => w.slice(0, 4)))];
const parecido = (a, b) => { const ra = raices(a); if (!ra.length) return 0; const rb = new Set(raices(b)); return ra.filter((r) => rb.has(r)).length / ra.length; };
const archivoDe = (s) => S(s).replace(/^.*\/file\//, '').replace(/^\/+/, '');

// ── el kit, en una forma sola ────────────────────────────────────────────────────────────────────────────────────────
export function leerKit(kb = {}) {
  const t = kb.thesis || {};
  const pantallas = arr(kb.screens).map((s, i) => ({
    i, label: S(s.label) || `Pantalla ${i + 1}`, archivo: archivoDe(s.image || s.archivo || s.file), queDemuestra: S(s.headline),
    zonaClave: S(s.zona_clave), microAnimacion: S(s.micro_animation), patron: S(s.pattern),
  }));
  const momentos = arr(kb.moments).map((m, i) => ({ i, nombre: S(m.nombre) || `Momento ${i + 1}`, audiencia: norm(m.audiencia), historia: S(m.historia), remate: S(m.remate), pantallas: arr(m.pantallas).map(archivoDe) }));
  return {
    nombre: S(kb.business?.name) || S(kb.brand?.name) || 'la app',
    tesis: { fuerte: S(t.strong), comparacion: S(t.comparison), enemigo: S(t.enemy), momentoMagico: S(t.magic_moment), venderPrimero: S(t.sell_first) },
    dolores: arr(kb.pains).map(S).filter(Boolean).concat(arr(kb.objections).map((o) => S(o?.objection)).filter(Boolean)),
    doloresPorAudiencia: kb.pains_by_audience && typeof kb.pains_by_audience === 'object' ? kb.pains_by_audience : {},
    diferenciales: arr(kb.differentiators).map(S).filter(Boolean),
    noDecir: arr(kb.do_not_say).map(S).filter(Boolean),
    cta: { principal: S(kb.cta?.primary), secundario: S(kb.cta?.secondary), url: S(kb.cta?.url) },
    oferta: S(arr(kb.pricing?.promotions)[0]),
    testimoniosAutorizados: arr(kb.testimonials).some((x) => x && (x.autorizado || x.authorized)),
    pantallas, momentos,
  };
}

// Lo que le falta al kit para que la regla trabaje entera. Se muestra; nunca se inventa.
function faltasDelKit(k) {
  const f = [];
  if (!k.tesis.fuerte && !k.tesis.enemigo && !k.tesis.momentoMagico) f.push('Falta la tesis: sin enemigo ni momento mágico, Antes y después y Marca no se pueden elegir.');
  else {
    if (!k.tesis.enemigo) f.push('Falta el enemigo de la tesis.');
    if (!k.tesis.momentoMagico) f.push('Falta el momento mágico de la tesis: la solución usa la primera pantalla del momento.');
    if (!k.tesis.venderPrimero) f.push('Falta "a quién le hablamos primero": la audiencia principal sale del orden de los momentos.');
  }
  if (!k.momentos.length) f.push('Faltan los momentos: no hay recorrido por audiencia, las pantallas van en el orden del kit.');
  if (k.momentos.length && k.momentos.every((m) => !m.audiencia)) f.push('Los momentos no dicen a qué audiencia corresponden: se arma una sola audiencia.');
  const archivos = new Set(k.pantallas.map((p) => p.archivo));
  for (const m of k.momentos) for (const a of m.pantallas) if (a && !archivos.has(a)) f.push(`El momento "${m.nombre}" nombra una pantalla que no está en el kit: ${a}.`);
  if (!k.dolores.length) f.push('Faltan los dolores del cliente: Problema y solución y Demo no tienen con qué abrir.');
  if (!k.cta.principal) f.push('Falta el CTA del kit: la placa queda con el nombre de la marca solo.');
  const muestra = [k.cta.principal, k.cta.secundario, ...k.dolores, ...k.diferenciales, ...k.pantallas.map((p) => p.queDemuestra)].join(' ');
  if (muestra.length > 200 && !/[áéíóúñÁÉÍÓÚÑ]/.test(muestra)) f.push('El kit está escrito sin tildes ni eñes: el CTA de la placa y los textos en pantalla saldrían así ("sena" por "seña").');
  return f;
}

// ── audiencias: las de los momentos, la principal primero ────────────────────────────────────────────────────────────
function audienciasDe(k) {
  const ids = [...new Set(k.momentos.map((m) => m.audiencia).filter(Boolean))];
  if (!ids.length) {
    return [{ id: 'principal', label: 'Público principal', principal: true, momento: k.momentos[0] || null, pantallas: pantallasDeMomento(k, k.momentos[0]) }];
  }
  const vp = norm(k.tesis.venderPrimero);
  const pos = (id) => { const i = vp.indexOf(id); return i < 0 ? Infinity : i; };
  ids.sort((a, b) => pos(a) - pos(b) || ids.indexOf(a) - ids.indexOf(b));
  return ids.map((id, n) => {
    const momento = k.momentos.find((m) => m.audiencia === id) || null;
    return { id, label: id.charAt(0).toUpperCase() + id.slice(1), principal: n === 0, momento, pantallas: pantallasDeMomento(k, momento, id) };
  });
}
function pantallasDeMomento(k, momento, audiencia) {
  const porArchivo = new Map(k.pantallas.map((p) => [p.archivo, p]));
  const delMomento = momento ? momento.pantallas.map((a) => porArchivo.get(a)).filter(Boolean) : [];
  if (delMomento.length) return delMomento;
  // sin pantallas válidas en el momento: las que nombran a la audiencia en el archivo o el título; si no, todas
  if (audiencia) { const suyas = k.pantallas.filter((p) => norm(`${p.archivo} ${p.label}`).includes(audiencia)); if (suyas.length) return suyas; }
  return k.pantallas.slice();
}
// La parte del momento mágico (o del enemigo) que habla de esta audiencia: "Para el cliente, ... Para el proveedor, ..."
const nombraA = (frase, id) => new RegExp(`(^| )(para el|para la|al|a la|el|la|del|de la) ${id}( |$)`).test(norm(frase));
function parteDe(texto, aud, todas) {
  if (!texto || !aud || todas.length < 2) return texto;
  const frases = texto.split(/(?<=\.)\s+/);
  const mias = frases.filter((f) => nombraA(f, aud.id));
  const ajenas = todas.filter((a) => a.id !== aud.id).map((a) => a.id);
  const limpias = frases.filter((f) => !ajenas.some((x) => nombraA(f, x)));
  return (mias.length ? mias : limpias.length ? limpias : frases).join(' ');
}

// ── la pieza ─────────────────────────────────────────────────────────────────────────────────────────────────────────
function cumple(angulo, k, aud, formatoId, reglas = REGLAS) {
  const r = angulo.requiere || {};
  const dolores = doloresDe(k, aud);
  const motivos = [];
  if (r.dolores && dolores.length < r.dolores) motivos.push(`necesita ${r.dolores} dolor(es) de ${aud.label.toLowerCase()} y el kit tiene ${dolores.length}`);
  if (r.enemigo && !k.tesis.enemigo) motivos.push('necesita el enemigo de la tesis');
  if (r.fuerte && !k.tesis.fuerte) motivos.push('necesita el fuerte de la tesis');
  if (r.diferenciales && k.diferenciales.length < r.diferenciales) motivos.push(`necesita ${r.diferenciales} diferenciales`);
  if (r.pantallasDelMomento && aud.pantallas.length < r.pantallasDelMomento) motivos.push(`necesita ${r.pantallasDelMomento} pantallas en el momento de ${aud.label.toLowerCase()} y hay ${aud.pantallas.length}`);
  if (r.testimoniosAutorizados && !k.testimoniosAutorizados) motivos.push('necesita testimonios autorizados en el kit');
  if (r.pantallaVisible && formatoId && (reglas.material[formatoId] || {}).producto !== 'mockup') motivos.push('necesita que la pantalla se vea, y este formato no lleva mockups');
  return motivos;
}
function doloresDe(k, aud) {
  const propios = arr(k.doloresPorAudiencia[aud.id]).map(S).filter(Boolean);
  if (propios.length) return propios;
  return aud.principal ? k.dolores : [];
}
function tonoPara(angulo, tonoId, reglas) {
  const prohibido = (t) => reglas.combinaciones.no.find((c) => c.angulo === angulo.id && c.tono === t);
  if (!prohibido(tonoId)) return { tono: tonoId, cambio: null };
  const alternativa = reglas.tonos.map((t) => t.id).find((t) => t !== 'humor' && !prohibido(t));
  return { tono: alternativa, cambio: prohibido(tonoId).porque };
}
function repartir(momentos, total, reglas) {
  const fijo = momentos.filter((m) => m.material === 'placa').reduce((s, m) => s + reglas.materiales.placa.dur.base, 0);
  const libres = momentos.filter((m) => m.material !== 'placa');
  const peso = (m) => reglas.materiales[m.material].dur.base * (m.peso || 1);
  const suma = libres.reduce((s, m) => s + peso(m), 0) || 1;
  const factor = (total - fijo) / suma;
  const medio = (x) => Math.round(x * 2) / 2;
  for (const m of momentos) {
    const d = reglas.materiales[m.material].dur;
    m.dur = m.material === 'placa' ? d.base : Math.min(d.max, Math.max(d.min, medio(peso(m) * factor)));
  }
  // el redondeo se corrige en los momentos que tienen margen, del primero al último
  let dif = medio(total - momentos.reduce((s, m) => s + m.dur, 0));
  for (const m of [...libres, ...momentos.filter((x) => x.material === 'placa')]) {
    if (!dif) break;
    const d = reglas.materiales[m.material].dur;
    const nuevo = Math.min(d.max, Math.max(d.min, m.dur + dif));
    dif = medio(dif - (nuevo - m.dur)); m.dur = nuevo;
  }
  return momentos.reduce((s, m) => s + m.dur, 0);
}

export function armarPieza(kb, { objetivo, audiencia, angulo: anguloForzado, tono: tonoForzado, formatoId = 'reel-hibrido-9-16', usados = new Set(), doloresUsados = new Set(), indice = 0 } = {}, reglas = REGLAS) {
  const k = kb && kb.pantallas && kb.tesis ? kb : leerKit(kb);
  const auds = audienciasDe(k);
  const aud = auds.find((a) => a.id === audiencia) || auds[0];
  const obj = reglas.objetivos.find((o) => o.id === objetivo) || reglas.objetivos[0];
  const avisos = [];

  // 1. ángulo: el pedido, o el primero de la lista del objetivo que cumpla y no se haya usado para esta audiencia
  const descartes = [];
  let angulo = anguloForzado ? reglas.angulos.find((a) => a.id === anguloForzado) : null;
  if (angulo) { const m = cumple(angulo, k, aud, formatoId, reglas); if (m.length) avisos.push(`Ángulo pisado a mano: ${m.join('; ')}.`); }
  else {
    for (const id of obj.angulos) {
      const a = reglas.angulos.find((x) => x.id === id);
      if (!a) continue;
      if (reglas.campana.noRepetirAngulo && usados.has(`${aud.id}:${id}`)) { descartes.push({ angulo: a.label, porque: `ya lo usa otra pieza de ${aud.label.toLowerCase()}` }); continue; }
      const m = cumple(a, k, aud, formatoId, reglas);
      if (m.length) { descartes.push({ angulo: a.label, porque: m.join('; ') }); continue; }
      angulo = a; break;
    }
    if (!angulo) {
      const repetible = obj.angulos.map((id) => reglas.angulos.find((x) => x.id === id)).find((a) => a && !cumple(a, k, aud, formatoId, reglas).length);
      if (repetible) { angulo = repetible; avisos.push(`Se repite ${angulo.label}: es el único ángulo del objetivo que el kit permite.`); }
      else { angulo = reglas.angulos.find((a) => a.id === obj.angulos[0]); avisos.push(`Ningún ángulo del objetivo cumple con el kit: queda ${angulo.label} con faltantes.`); }
    }
  }

  // 2. tono: el pedido o el del objetivo; si la combinación está prohibida, el siguiente permitido
  const t = tonoPara(angulo, tonoForzado || obj.tono, reglas);
  if (t.cambio) avisos.push(`Tono cambiado: ${t.cambio}`);
  const tono = reglas.tonos.find((x) => x.id === t.tono);
  const reparo = reglas.combinaciones.reparo.find((c) => c.angulo === angulo.id && c.tono === tono.id);
  if (reparo) avisos.push(`Con reparo: ${reparo.porque}`);

  // 3. momentos: material por formato y el dato del kit que le toca a cada uno
  const mapa = reglas.material[formatoId] || reglas.material['reel-hibrido-9-16'];
  const dolores = doloresDe(k, aud);
  const usadas = new Set();
  const enemigo = parteDe(k.tesis.enemigo, aud, auds);
  const magico = parteDe(k.tesis.momentoMagico, aud, auds);
  const pantallaMagica = () => {
    const mejor = aud.pantallas.map((p) => ({ p, s: parecido(p.label, magico) })).sort((a, b) => b.s - a.s)[0];
    return mejor && mejor.s >= 0.5 ? mejor.p : null;
  };
  const siguienteLibre = () => aud.pantallas.find((p) => !usadas.has(p.archivo)) || null;
  const paraDiferencial = (d) => [...aud.pantallas, ...k.pantallas].filter((p) => !usadas.has(p.archivo)).map((p) => ({ p, s: parecido(d, `${p.label} ${p.queDemuestra}`) })).sort((a, b) => b.s - a.s)[0]?.p || null;

  let dolorUsado = '';
  const respuestaA = (dolor) => {
    const mejor = aud.pantallas.filter((p) => !usadas.has(p.archivo)).map((p) => ({ p, s: parecido(dolor, `${p.label} ${p.queDemuestra} ${p.zonaClave}`) })).sort((a, b) => b.s - a.s)[0];
    return mejor && mejor.s > 0 ? mejor.p : null;   // con una raíz compartida alcanza: el dolor y la pantalla hablan de lo mismo
  };
  if (!aud.principal && !arr(k.doloresPorAudiencia[aud.id]).length) avisos.push(`Falta el dolor propio de ${aud.label.toLowerCase()} en el kit: lo que la pieza cuenta del problema sale de la tesis general.`);
  const momentos = angulo.momentos.map((m) => {
    const material = mapa[m.tipo];
    const out = { id: m.id, label: m.label, tipo: m.tipo, material, materialLabel: reglas.materiales[material].label, dice: m.dice, peso: m.peso || 1, fuente: m.fuente, dato: '', pantalla: null };
    const [fuente, n] = String(m.fuente).split(':');
    if (fuente === 'dolor' || fuente === 'dolorDeLasPantallas') {
      const libres = dolores.filter((d) => !doloresUsados.has(d));
      const pool = libres.length ? libres : dolores;
      if (fuente === 'dolorDeLasPantallas' && pool.length) {
        const pantallasDemo = aud.pantallas.slice(0, 3).map((p) => `${p.label} ${p.queDemuestra} ${p.zonaClave}`).join(' ');
        out.dato = pool.map((d) => ({ d, s: parecido(d, pantallasDemo) })).sort((x, y) => y.s - x.s)[0].d;
      } else if (pool.length) {
        // el dolor que mejor responde alguna pantalla del kit: así la solución muestra justo lo que el problema pidió
        const mejorRespuesta = (d) => Math.max(0, ...aud.pantallas.filter((p) => !usadas.has(p.archivo)).map((p) => parecido(d, `${p.label} ${p.queDemuestra} ${p.zonaClave}`)));
        out.dato = pool.map((d, i) => ({ d, i, s: mejorRespuesta(d) })).sort((x, y) => y.s - x.s || x.i - y.i)[0].d;
      } else out.dato = enemigo;
      if (!dolores.length) avisos.push(`"${m.label}" usa el enemigo: el kit no tiene dolores de ${aud.label.toLowerCase()}.`);
      else if (!libres.length) avisos.push(`"${m.label}" repite un dolor: el kit tiene menos dolores que piezas.`);
      if (dolores.length) doloresUsados.add(out.dato);
      dolorUsado = out.dato;
    } else if (fuente === 'enemigo') {
      out.dato = enemigo;
      // el enemigo de la tesis está escrito desde la audiencia principal: la segunda usa otro dolor suyo, si lo tiene
      const propios = arr(k.doloresPorAudiencia[aud.id]).map(S).filter((d) => d && d !== dolorUsado && !doloresUsados.has(d));
      if (!aud.principal && propios.length) { out.dato = propios[0]; doloresUsados.add(propios[0]); }
      else if (!enemigo) {
        const otro = dolores.find((d) => !doloresUsados.has(d) && d !== dolorUsado) || dolores.find((d) => d !== dolorUsado);
        if (otro) { out.dato = otro; doloresUsados.add(otro); avisos.push(`"${m.label}" usa otro dolor: el kit no tiene el enemigo de la tesis.`); }
      }
    } else if (fuente === 'remate') out.dato = aud.momento?.remate || '';
    else if (fuente === 'fuerte') out.dato = k.tesis.fuerte;
    else if (fuente === 'momentoMagico') {
      out.pantalla = pantallaMagica() || siguienteLibre();
      if (out.pantalla && out.pantalla !== pantallaMagica()) avisos.push(`"${m.label}": ninguna pantalla coincide con el momento mágico; va ${out.pantalla.label}.`);
      out.dato = magico;
    } else if (fuente === 'respuestaAlDolor') {
      out.pantalla = respuestaA(dolorUsado) || pantallaMagica() || siguienteLibre();
      if (out.pantalla && !respuestaA(dolorUsado)) avisos.push(`"${m.label}": ninguna pantalla responde claro al dolor; va ${out.pantalla.label}.`);
      out.dato = out.pantalla ? `${out.pantalla.queDemuestra}` : '';
    } else if (fuente === 'pantallaDelMomento') {
      out.pantalla = aud.pantallas.filter((p) => !usadas.has(p.archivo))[0] || null;
      out.dato = out.pantalla?.queDemuestra || '';
    } else if (fuente === 'diferencial') {
      const d = k.diferenciales[(Number(n) || 1) - 1] || '';
      out.pantalla = paraDiferencial(d);
      out.dato = d;
    } else if (fuente === 'cta') {
      const cta = aud.principal ? k.cta.principal : (k.cta.secundario || k.cta.principal);
      out.dato = [cta || `Conocé ${k.nombre}`, obj.id === 'conversion' && aud.principal && k.oferta ? k.oferta : ''].filter(Boolean).join(' · ');
    }
    if (out.pantalla) usadas.add(out.pantalla.archivo);
    if (m.tipo === 'producto' && !out.pantalla) avisos.push(`"${m.label}" no tiene pantalla en el kit.`);
    if (!out.dato && m.tipo !== 'producto') avisos.push(`"${m.label}" no tiene dato en el kit (${m.fuente}).`);
    return out;
  });

  // 4. duración
  const objetivoDur = reglas.duracionPorFormato[formatoId] || 20;
  const total = repartir(momentos, objetivoDur, reglas);
  if (total !== objetivoDur) avisos.push(`La duración queda en ${total} s: los momentos no estiran hasta ${objetivoDur} s sin pasarse de su máximo.`);

  usados.add(`${aud.id}:${angulo.id}`);
  const tomasFlow = momentos.filter((m) => m.material === 'filmada' || m.material === 'consecuencia').length;
  return {
    objetivo: { id: obj.id, label: obj.label, pregunta: obj.pregunta, meta: obj.meta },
    audiencia: { id: aud.id, label: aud.label, principal: aud.principal, momento: aud.momento?.nombre || '' },
    angulo: { id: angulo.id, label: angulo.label, industria: angulo.industria, descartes },
    tono: { id: tono.id, label: tono.label, industria: tono.industria },
    formato: formatoId, duracion: total, momentos, avisos,
    material: {
      flow: tomasFlow,
      mockups: momentos.filter((m) => m.material === 'mockup' && m.pantalla).map((m) => m.pantalla.label),
      textos: momentos.filter((m) => m.material === 'texto').length,
      placa: momentos.find((m) => m.material === 'placa')?.dato || '',
    },
    // para cablear después con el pipeline de hoy (concept/3.0): sin cambiar los moldes todavía
    pipeline: { perfil: { awareness: 'awareness', consideracion: 'demo', conversion: 'conversion' }[obj.id], enfoque: angulo.enfoqueV3, tratamiento: tono.id },
  };
}

export function planDeCampana(kb, { formatoId = 'reel-hibrido-9-16' } = {}, reglas = REGLAS) {
  const k = leerKit(kb);
  const auds = audienciasDe(k);
  const usados = new Set();
  const doloresUsados = new Set();
  const piezas = [];
  auds.forEach((aud, ai) => {
    const permitidos = (reglas.campana.objetivosPorFormato || {})[formatoId];
    const objetivos = (aud.principal ? reglas.campana.audienciaPrincipal.objetivos : (ai === 1 ? reglas.campana.audienciaSecundaria.objetivos : []))
      .filter((o) => !permitidos || permitidos.includes(o));
    objetivos.forEach((objetivo, oi) => piezas.push({ n: piezas.length + 1, ...armarPieza(k, { objetivo, audiencia: aud.id, formatoId, usados, doloresUsados, indice: oi }, reglas) }));
  });
  const todas = piezas.flatMap((p) => p.momentos.map((m) => ({ ...m, pieza: p.n, audiencia: p.audiencia.label })));
  const filmadas = todas.filter((m) => m.material === 'filmada' || m.material === 'consecuencia');
  const mockups = [...new Map(todas.filter((m) => m.material === 'mockup' && m.pantalla).map((m) => [m.pantalla.archivo, m.pantalla])).values()];
  const materialCrudo = {
    flow: filmadas.length,
    personajes: [...new Set(filmadas.map((m) => m.audiencia))],
    mockups: mockups.map((p) => ({ label: p.label, archivo: p.archivo, zonaClave: p.zonaClave, microAnimacion: p.microAnimacion, piezas: [...new Set(todas.filter((m) => m.material === 'mockup' && m.pantalla?.archivo === p.archivo).map((m) => m.pieza))] })),
    textos: todas.filter((m) => m.material === 'texto').length,
    placas: piezas.length,
  };
  return {
    version: reglas.version, app: k.nombre, formato: formatoId,
    audiencias: auds.map((a) => ({ id: a.id, label: a.label, principal: a.principal, momento: a.momento?.nombre || '', pantallas: a.pantallas.map((p) => p.label) })),
    piezas, materialCrudo, faltas: faltasDelKit(k), noDecir: k.noDecir,
    notas: (reglas.campana.objetivosPorFormato || {})[formatoId] ? [reglas.campana.notaFormato] : [],
  };
}
