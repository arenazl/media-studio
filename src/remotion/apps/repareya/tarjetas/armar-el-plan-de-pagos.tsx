// RepareHoy · "¿Cómo cobrás este trabajo?" (06 · armar el plan de pagos)
// Datos de los estados 06-a (Mitad y mitad, $310.000 + $310.000, aviso rojo) y 06-b (Contra avance, 3 etapas, aviso verde).
import React from 'react';
import { Aviso, Boton, Fila, Pastilla, Tarjeta, Toque, cuenta, ease, entra, momento, pesos, pulso, type TarjetaProps } from '../../_base/Marco';

/** La pieza se va: se desvanece y colapsa su lugar antes de que entre la que sigue. */
const sale = (f: number, a: number, largo = 10): React.CSSProperties => {
  const s = ease(f, a, a + largo);
  return { opacity: 1 - s, maxHeight: (1 - s) * 180, marginBottom: -s * 22, overflow: 'hidden', transform: `translateY(${-s * 18}px)` };
};

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) prueba "Mitad y mitad": dos pagos de $310.000 y el aviso rojo
  const p1 = momento(dur, 0.10), p2 = momento(dur, 0.18), avi = momento(dur, 0.28);
  // 2) pasa a "Contra avance": los montos se reparten y la línea se vuelve verde
  const sw = momento(dur, 0.46);
  const p3 = momento(dur, 0.58);
  const ok = ease(f, sw, sw + 12);
  const verde = ok > 0.5;
  // 3) las etapas del medio dejan lugar al botón y lo aprieta
  const fuera = momento(dur, 0.80), btn = momento(dur, 0.85), toca = momento(dur, 0.92);
  const apretado = ease(f, toca, toca + 8) * (1 - ease(f, toca + 14, toca + 22));

  return (
    <Tarjeta
      f={f} m={m} icono="tarjeta" titulo="¿Cómo cobrás este trabajo?" bajada="Total $620.000"
      derecha={<Pastilla m={m} texto={verde ? 'Contra avance' : 'Mitad y mitad'} color={verde ? m.acento : m.texto2} style={{ transform: `scale(${0.9 + 0.1 * (verde ? ok : 1)})` }} />}
    >
      <Fila
        m={m} icono="herramienta" etiqueta="1  Materiales y arranque" detalle={verde ? 'Un pago por etapa' : 'Arranque y entrega'}
        valor={pesos(cuenta(f, sw, sw + 14, 310000, 124000))} destacada color={verde ? m.exito : m.error}
        style={entra(f, p1)}
      />
      <Fila
        m={m} icono="grafico" etiqueta={ok > 0.5 ? '2  Avance de obra' : '2  Saldo final'}
        valor={pesos(cuenta(f, sw, sw + 14, 310000, 248000))}
        style={{ ...entra(f, p2), ...sale(f, fuera) }}
      />
      <Fila
        m={m} icono="documento" etiqueta="3  Saldo final" valor={pesos(248000)}
        style={{ ...entra(f, p3), ...sale(f, fuera + 4) }}
      />
      <Aviso
        m={m}
        titulo={verde ? 'Primer pago 20%. Podés pedir hasta 40%.' : 'El primer pago es el 50% del total y el máximo para vos es 40%.'}
        texto={verde ? 'Un pago por etapa · Etapas: 3' : 'Bajá el primer pago o repartilo en más etapas.'}
        color={verde ? m.exito : m.error}
        icono={verde ? 'check' : 'campana'}
        style={{ ...entra(f, avi), opacity: ease(f, avi, avi + 12) * (verde ? 1 : 0.75 + 0.25 * pulso(f, 24)) }}
      />
      <Boton m={m} texto="Mandar propuesta" icono="flecha" color={m.acento} apretado={apretado} style={entra(f, btn)} />
      <Toque x={540} y={812} apreta={apretado} visible={ease(f, btn + 8, btn + 16)} />
    </Tarjeta>
  );
};
