import React from 'react';
import { Barra, Fila, Numero, Pastilla, Tarjeta, cuenta, ease, entra, momento, pulso, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) entran las dos obras con su avance
  const o1 = momento(dur, 0.1), o2 = momento(dur, 0.22);
  // 2) las barras crecen hasta su porcentaje
  const b0 = momento(dur, 0.26), b1 = momento(dur, 0.56);
  // 3) el ejecutado cuenta contra lo presupuestado
  const e0 = momento(dur, 0.34), e1 = momento(dur, 0.72);
  // 4) el par se separa en dos columnas y cuenta hasta el final
  const k0 = momento(dur, 0.62), k1 = momento(dur, 0.9);
  const abre = ease(f, k0, k0 + 14);

  return (
    <Tarjeta
      f={f}
      m={m}
      icono="herramienta"
      titulo="Lo que se construye, y cuánto lleva gastado"
      bajada="Obras del barrio · 3 obras a la vista"
      derecha={<Pastilla m={m} texto="En curso 3" color={m.alerta} />}
    >
      <div style={entra(f, o1)}>
        <Fila
          m={m}
          icono="casa"
          etiqueta="Ampliación de la casa"
          detalle="El vecino · fuera de la expensa"
          valor={`${Math.round(cuenta(f, b0, b1, 0, 72))}%`}
          color={m.secundario}
        />
        <Barra m={m} valor={ease(f, b0, b1) * 0.72} color={m.secundario} />
      </div>

      <div style={entra(f, o2)}>
        <Fila
          m={m}
          icono="pin"
          etiqueta="Repavimentación de la calle principal"
          detalle="El barrio · entra en la expensa"
          valor={`${Math.round(cuenta(f, b0 + 8, b1 + 8, 0, 80))}%`}
          color={m.exito}
        />
        <Barra m={m} valor={ease(f, b0 + 8, b1 + 8) * 0.8} color={m.exito} />
      </div>

      <div style={{ display: 'flex', gap: 18, ...entra(f, e0) }}>
        <Numero m={m} etiqueta="Presupuestado" texto="$79,5M" style={{ flex: 1 }} />
        <Numero
          m={m}
          etiqueta="Ejecutado"
          texto={`$${cuenta(f, e0, e1, 0, 55.5).toFixed(1).replace('.', ',')}M`}
          color={m.alerta}
          style={{ flex: 1 }}
        />
      </div>
      <div style={{ fontSize: 30, color: m.texto2, marginTop: -8, ...entra(f, e1 - 6) }}>70% de lo presupuestado</div>

      <div style={{ display: 'flex', gap: 10 + 8 * abre, ...entra(f, k0) }}>
        <Numero
          m={m}
          etiqueta="Entra en la expensa"
          texto={`$${cuenta(f, k0, k1, 0, 4.3).toFixed(1).replace('.', ',')}M`}
          color={m.exito}
          style={{ flex: 1, transform: `translateX(${(1 - abre) * 22}px)` }}
        />
        <Numero
          m={m}
          etiqueta="Fuera de la expensa"
          texto={`$${cuenta(f, k0, k1, 0, 51.2).toFixed(1).replace('.', ',')}M`}
          color={m.secundario}
          style={{ flex: 1, transform: `translateX(${(1 - abre) * -22}px)`, opacity: 0.85 + 0.15 * pulso(f, 30) }}
        />
      </div>
    </Tarjeta>
  );
};
