// Mis solicitudes · la barra de cuatro tramos avanza y el rótulo nombra lo que falta.
// Datos de los estados 09-a/b/c/d: Carpintería Marcelo · Muebles a medida en melamina y madera maciza · $620.000.
import React from 'react';
import { Barra, Fila, Numero, Pastilla, Tarjeta, cuenta, ease, entra, momento, pesos, pulso, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // los cuatro fotogramas clave: pedido → presupuesto → seña → terminado
  const kPedido = momento(dur, 0.1);
  const kPresu = momento(dur, 0.34);
  const kSena = momento(dur, 0.56);
  const kFin = momento(dur, 0.78);

  // la barra avanza tramo por tramo (0,25 → 0,5 → 0,75 → 1)
  const avance =
    0.25 * ease(f, kPedido, kPedido + 12) +
    0.25 * ease(f, kPresu, kPresu + 12) +
    0.25 * ease(f, kSena, kSena + 12) +
    0.25 * ease(f, kFin, kFin + 12);

  const hayPresu = ease(f, kPresu, kPresu + 10);
  const haySena = ease(f, kSena, kSena + 10);
  const hayFin = ease(f, kFin, kFin + 10);

  // el rótulo nombra el paso que falta
  const rotulo = hayFin > 0.5 ? 'Terminado' : haySena > 0.5 ? 'Trabajo agendado' : hayPresu > 0.5 ? 'Esperando tu respuesta' : 'Esperando presupuesto';
  const colorRotulo = hayFin > 0.5 ? m.exito : m.acento;

  // el estado de la solicitud
  const estado = hayFin > 0.5 ? 'FINALIZADO' : haySena > 0.5 ? 'CONFIRMADO' : hayPresu > 0.5 ? 'COTIZADO' : 'SOLICITADO';
  const colorEstado = hayFin > 0.5 ? m.exito : haySena > 0.5 ? m.acento : hayPresu > 0.5 ? m.info : m.alerta;

  // el gasto comprometido cuenta cuando se confirma la seña, y sigue vivo hasta el final
  const g0 = kSena, g1 = momento(dur, 0.9);

  return (
    <Tarjeta
      f={f}
      m={m}
      icono="lista"
      titulo="Mis solicitudes"
      bajada="Cotizaciones recibidas y bookings en curso."
      derecha={<Pastilla m={m} texto="Hoy" color={m.acento} />}
    >
      <Fila
        m={m}
        icono="herramienta"
        etiqueta="Carpintería Marcelo"
        detalle="Muebles a medida en melamina y madera maciza"
        valor={hayPresu > 0.3 ? pesos(cuenta(f, kPresu, kPresu + 18, 0, 620000)) : undefined}
        destacada
        color={colorEstado}
        pastilla={<Pastilla m={m} texto={estado} color={colorEstado} style={{ opacity: hayFin > 0.5 || haySena > 0.5 ? 1 : 0.65 + 0.35 * pulso(f, 24) }} />}
        style={entra(f, kPedido - 6)}
      />

      <div style={{ ...entra(f, kPedido) }}>
        <Barra m={m} valor={avance} tramos={4} color={hayFin > 0.5 ? m.exito : m.acento} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontFamily: m.fuenteTexto, fontSize: 28, color: m.texto3 }}>
          <span style={{ color: m.texto2 }}>Pedido</span>
          <span style={{ color: hayPresu > 0.5 ? m.texto2 : m.texto3 }}>Presupuesto</span>
          <span style={{ color: haySena > 0.5 ? m.texto2 : m.texto3 }}>Seña</span>
          <span style={{ color: hayFin > 0.5 ? m.texto2 : m.texto3 }}>Terminado</span>
        </div>
        <div style={{ marginTop: 14, fontFamily: m.fuenteTexto, fontSize: 34, fontWeight: 700, color: colorRotulo, textAlign: hayFin > 0.5 ? 'right' : haySena > 0.5 ? 'right' : hayPresu > 0.5 ? 'center' : 'left' }}>
          {rotulo}
        </div>
      </div>

      <Fila
        m={m}
        icono="documento"
        etiqueta="Carpintería Marcelo"
        detalle="Restauración y reparación de muebles"
        valor={pesos(98000)}
        pastilla={<Pastilla m={m} texto="COTIZADO" color={m.info} />}
        style={entra(f, kPresu + 10)}
      />

      <div style={{ display: 'flex', gap: 18, ...entra(f, g0) }}>
        <Numero m={m} etiqueta="Cotizaciones" texto="1" style={{ flex: 1 }} />
        <Numero m={m} etiqueta="Gasto comprometido" texto={pesos(cuenta(f, g0, g1, 0, 620000))} color={m.acento} style={{ flex: 2 }} />
      </div>
    </Tarjeta>
  );
};
