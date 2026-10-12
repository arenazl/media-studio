// EJEMPLO DEL MÉTODO (lo lee el agente de tarjetas, no se usa en ningún reel): el mockup de Tesorería de Munify, de la
// página de los ocho mockups animados, hecho con las piezas de la plantilla. Lo que cuenta: "los pagos entran uno a uno,
// un pendiente se paga y los saldos cuentan solos". Cada tarjeta de otra app se escribe igual: piezas de la plantilla,
// los datos de SU captura tal cual, y los momentos repartidos en toda la duración con momento(dur, q).
import React from 'react';
import { Fila, Numero, Pastilla, Tarjeta, cuenta, ease, entra, momento, pesos, pulso, type TarjetaProps } from './Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) entran los pagos de a uno
  const p1 = momento(dur, 0.1), p2 = momento(dur, 0.2), p3 = momento(dur, 0.3);
  // 2) el pendiente se paga
  const paga = momento(dur, 0.55);
  const pagado = ease(f, paga, paga + 10);
  // 3) los saldos cuentan solos hasta el final
  const s0 = momento(dur, 0.38), s1 = momento(dur, 0.88);
  return (
    <Tarjeta f={f} m={m} icono="calendario" titulo="Pagos programados" bajada="Tesorería · octubre" derecha={<Pastilla m={m} texto="+ Nuevo" color={m.alerta} />}>
      <Fila m={m} icono="documento" etiqueta="Proveedor de insumos" detalle="vence 12/10" valor="$ 480.000" pastilla={<Pastilla m={m} texto="Programado" color={m.alerta} />} style={entra(f, p1)} />
      <Fila m={m} icono="rayo" etiqueta="Servicio eléctrico" detalle="pagado 03/10" valor="$ 1.250.000" pastilla={<Pastilla m={m} texto="Pagado" color={m.exito} />} style={entra(f, p2)} />
      <Fila
        m={m} icono="tarjeta" etiqueta="Combustible flota" detalle="vence 09/10" valor="$ 320.000"
        destacada={pagado < 1} color={pagado < 0.5 ? m.error : m.exito}
        pastilla={pagado < 0.5
          ? <Pastilla m={m} texto="Pendiente" color={m.error} style={{ opacity: 0.6 + 0.4 * pulso(f, 24) }} />
          : <Pastilla m={m} texto="Pagado" color={m.exito} style={{ transform: `scale(${0.8 + 0.2 * pagado})` }} />}
        style={entra(f, p3)}
      />
      <div style={{ display: 'flex', gap: 18, ...entra(f, s0) }}>
        <Numero m={m} etiqueta="Caja central" texto={pesos(cuenta(f, s0, s1, 0, 4820000))} color={m.exito} style={{ flex: 1 }} />
        <Numero m={m} etiqueta="Banco Provincia" texto={pesos(cuenta(f, s0, s1, 0, 12340000))} color={m.alerta} style={{ flex: 1 }} />
      </div>
    </Tarjeta>
  );
};
