// Orquestación de campaña (server/orquestacion.mjs + server/orquestacion-v1.json): el plan sale del kit, sin modelo.
// El kit de prueba es una versión chica del de RepareHoy (dos audiencias, tesis, momentos con pantallas) y otro sin tesis.
import { describe, it, expect } from 'vitest';
import { planDeCampana, armarPieza, leerKit, REGLAS } from '../../server/orquestacion.mjs';

const pantalla = (archivo: string, label: string, headline: string) => ({ label, headline, zona_clave: `zona de ${label}`, micro_animation: 'algo se mueve', pattern: '', image: `http://localhost:5301/api/media-kit/demo/file/${archivo}` });
const KIT = {
  business: { name: 'Arreglos [DEMO]' },
  thesis: {
    strong: 'Hace de juez entre el que necesita arreglar algo y el que sabe hacerlo.',
    enemy: 'El WhatsApp y la seña a un alias sin respaldo.',
    magic_moment: "Para el cliente, cuando la tira dice 'Te esperan tus proveedores'. Para el proveedor, cuando arma el plan de pagos a su manera.",
    sell_first: 'Al cliente primero. El proveedor viene después.',
  },
  pains: ['Pedís presupuesto por WhatsApp y nadie contesta.', 'Adelantar plata sin garantía: si el trabajo queda mal no hay a quién reclamarle.', 'No sabés si el que viene es matriculado.'],
  differentiators: ['La seña queda retenida hasta que el trabajo está terminado.', 'El plan de pagos lo acuerdan las partes.'],
  do_not_say: ['garantizado'],
  cta: { primary: 'Entrá y contá qué hay que arreglar', secondary: 'Publicá tu oficio gratis' },
  screens: [
    pantalla('s/01-cliente-contar.png', 'Contar el problema', 'pedir un arreglo es contar qué pasa'),
    pantalla('s/02-cliente-esperan.png', 'Te esperan tus proveedores', 'los presupuestos llegan solos'),
    pantalla('s/03-cliente-chat.png', 'La conversación', 'se negocia cómo se paga en el chat'),
    pantalla('s/04-cliente-sena.png', 'Pagar la seña', 'se paga la seña y queda retenida hasta que el trabajo está terminado'),
    pantalla('s/05-proveedor-bandeja.png', 'Bandeja de solicitudes', 'los pedidos llegan ordenados'),
    pantalla('s/06-proveedor-plan.png', 'Armar el plan de pagos', 'el proveedor elige cómo cobrar'),
  ],
  moments: [
    { nombre: 'Cliente', audiencia: 'cliente', historia: 'cuento → me llegan → pago la seña', pantallas: ['s/01-cliente-contar.png', 's/02-cliente-esperan.png', 's/03-cliente-chat.png', 's/04-cliente-sena.png'], remate: 'La seña queda protegida.' },
    { nombre: 'Proveedor', audiencia: 'proveedor', historia: 'me llega → cotizo', pantallas: ['s/05-proveedor-bandeja.png', 's/06-proveedor-plan.png'], remate: 'Tu historial te deja pedir más adelanto.' },
  ],
};

describe('plan de campaña desde el kit', () => {
  const plan = planDeCampana(KIT, { formatoId: 'reel-hibrido-9-16' });

  it('es determinístico: mismo kit y formato, mismo plan', () => {
    expect(JSON.stringify(planDeCampana(KIT, { formatoId: 'reel-hibrido-9-16' }))).toBe(JSON.stringify(plan));
  });
  it('la audiencia principal es la que la tesis nombra primero, con tres objetivos en orden; la segunda tiene su pieza', () => {
    expect(plan.audiencias.map((a: { id: string }) => a.id)).toEqual(['cliente', 'proveedor']);
    expect(plan.piezas.map((p: { objetivo: { id: string }; audiencia: { id: string } }) => `${p.audiencia.id}:${p.objetivo.id}`))
      .toEqual(['cliente:awareness', 'cliente:consideracion', 'cliente:conversion', 'proveedor:conversion']);
  });
  it('no repite ángulo dentro de una audiencia', () => {
    const cliente = plan.piezas.filter((p: { audiencia: { id: string } }) => p.audiencia.id === 'cliente').map((p: { angulo: { id: string } }) => p.angulo.id);
    expect(new Set(cliente).size).toBe(cliente.length);
  });
  it('en el híbrido las personas se filman, el producto es mockup y el cierre es la placa', () => {
    for (const p of plan.piezas) {
      for (const m of p.momentos) expect(m.material).toBe({ persona: 'filmada', producto: 'mockup', marca: 'placa' }[m.tipo as 'persona' | 'producto' | 'marca']);
      expect(p.momentos[p.momentos.length - 1].material).toBe('placa');
    }
  });
  it('Reel Flow no hace Consideración (curado 2026-10-10: va en híbrido)', () => {
    const flow = planDeCampana(KIT, { formatoId: 'reel-9-16' });
    expect(flow.piezas.map((p: { objetivo: { id: string } }) => p.objetivo.id)).not.toContain('consideracion');
    expect(flow.notas.join(' ')).toMatch(/híbrido/);
  });
  it('nunca se filma una pantalla: en Reel Flow el producto es la consecuencia, y la Demo no se elige', () => {
    const flow = planDeCampana(KIT, { formatoId: 'reel-9-16' });
    for (const p of flow.piezas) {
      expect(p.angulo.id).not.toBe('demo');
      for (const m of p.momentos) if (m.tipo === 'producto') expect(m.material).toBe('consecuencia');
    }
  });
  it('cada pieza dura lo del formato', () => {
    for (const p of plan.piezas) expect(p.duracion).toBe(REGLAS.duracionPorFormato['reel-hibrido-9-16']);
  });
  it('la solución muestra la pantalla que responde al dolor de la pieza', () => {
    const conv = plan.piezas.find((p: { objetivo: { id: string }; audiencia: { id: string } }) => p.objetivo.id === 'conversion' && p.audiencia.id === 'cliente');
    expect(conv.angulo.id).toBe('problema-solucion');
    expect(conv.momentos[0].dato).toMatch(/garant/);
    expect(conv.momentos.find((m: { id: string }) => m.id === 'solucion').pantalla.label).toBe('Pagar la seña');
  });
  it('la pieza del proveedor usa sus pantallas, su remate, su parte del momento mágico y el CTA secundario', () => {
    const prov = plan.piezas.find((p: { audiencia: { id: string } }) => p.audiencia.id === 'proveedor');
    const puente = prov.momentos.find((m: { tipo: string }) => m.tipo === 'producto');
    expect(puente.pantalla.label).toBe('Armar el plan de pagos');
    expect(puente.dato).not.toMatch(/cliente/i);
    expect(prov.momentos[prov.momentos.length - 1].dato).toBe('Publicá tu oficio gratis');
    expect(prov.avisos.join(' ')).toMatch(/dolor propio de proveedor/);
  });
  it('los dolores no se repiten entre piezas mientras alcancen', () => {
    const usados = plan.piezas.flatMap((p: { momentos: { fuente: string; dato: string }[] }) => p.momentos.filter((m) => m.fuente.startsWith('dolor')).map((m) => m.dato));
    expect(new Set(usados).size).toBe(usados.length);
  });
  it('el material crudo de la campaña: tomas de Flow, mockups únicos y una placa por pieza', () => {
    expect(plan.materialCrudo.placas).toBe(plan.piezas.length);
    expect(plan.materialCrudo.mockups.length).toBeGreaterThan(0);
    expect(new Set(plan.materialCrudo.mockups.map((m: { archivo: string }) => m.archivo)).size).toBe(plan.materialCrudo.mockups.length);
  });
});

describe('kit incompleto: la regla avisa, no inventa', () => {
  const sinTesis = { ...KIT, thesis: undefined, moments: KIT.moments.map((m) => ({ ...m, audiencia: undefined })) };
  const plan = planDeCampana(sinTesis, { formatoId: 'reel-hibrido-9-16' });
  it('sin tesis: lo dice, una sola audiencia y no elige Antes y después', () => {
    expect(plan.faltas.join(' ')).toMatch(/Falta la tesis/);
    expect(plan.audiencias).toHaveLength(1);
    for (const p of plan.piezas) expect(p.angulo.id).not.toBe('antes-despues');
  });
  it('sin enemigo, Cómo empeora usa otro dolor y avisa', () => {
    const ps = plan.piezas.find((p: { angulo: { id: string } }) => p.angulo.id === 'problema-solucion');
    const ag = ps.momentos.find((m: { id: string }) => m.id === 'agitacion');
    expect(ag.dato).toBeTruthy();
    expect(ps.avisos.join(' ')).toMatch(/enemigo/);
  });
  it('una pantalla que el momento nombra y no existe se reporta', () => {
    const roto = { ...KIT, moments: [{ ...KIT.moments[0], pantallas: ['s/99-no-existe.png'] }] };
    expect(planDeCampana(roto).faltas.join(' ')).toMatch(/99-no-existe/);
  });
});

describe('pisar a mano', () => {
  it('se puede forzar ángulo y tono; una combinación prohibida cambia el tono con aviso', () => {
    const p = armarPieza(leerKit(KIT), { objetivo: 'conversion', audiencia: 'cliente', angulo: 'marca', tono: 'humor' });
    expect(p.angulo.id).toBe('marca');
    expect(p.tono.id).not.toBe('humor');
    expect(p.avisos.join(' ')).toMatch(/Tono cambiado/);
  });
});
