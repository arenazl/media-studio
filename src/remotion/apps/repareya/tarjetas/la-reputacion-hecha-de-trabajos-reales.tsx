// RepareHoy · 08 · Reseñas de Clientes Verificados: la reputación sale de trabajos terminados en la app.
import React from 'react';
import { Fila, Icono, Pastilla, Tarjeta, ease, entra, momento, pulso, type Marca, type TarjetaProps } from '../../_base/Marco';

/** Las estrellas de una reseña: se encienden de a una desde el cuadro `desde`. */
const Estrellas: React.FC<{ f: number; m: Marca; llenas: number; desde?: number }> = ({ f, m, llenas, desde = -1 }) => (
  <div style={{ display: 'flex', gap: 6 }}>
    {Array.from({ length: 5 }, (_, i) => {
      const on = i < llenas;
      const v = desde >= 0 ? ease(f, desde + i * 4, desde + i * 4 + 8) : 1;
      return (
        <div key={i} style={{ opacity: on ? 0.35 + 0.65 * v : 0.35, transform: `scale(${on ? 0.7 + 0.3 * v : 1})` }}>
          <Icono n="estrella" size={30} color={on ? m.alerta : m.texto3} relleno={on} />
        </div>
      );
    })}
  </div>
);

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) la lista verificada que ya estaba: Martín, Gustavo y uno de cuatro estrellas
  const p1 = momento(dur, 0.1), p2 = momento(dur, 0.22), p3 = momento(dur, 0.34);
  // 2) llega arriba la reseña del trabajo recién terminado y empuja a las demás
  const llega = momento(dur, 0.52);
  const abre = ease(f, llega, llega + 14);

  return (
    <Tarjeta
      f={f} m={m} icono="estrella" titulo="Reseñas de Clientes Verificados" bajada="Experiencias reales"
      derecha={<Pastilla m={m} texto="4,8 / 5.0" color={m.alerta} style={{ opacity: 0.75 + 0.25 * pulso(f, 48) }} />}
    >
      <div style={{ height: 150 * abre, overflow: 'hidden', marginBottom: (abre - 1) * 22 }}>
        <Fila
          m={m} icono="usuario" etiqueta="Nicolás Romero" detalle="Cobró como habíamos acordado en el chat, sin sorpresas."
          destacada color={m.exito}
          pastilla={<>
            <Estrellas f={f} m={m} llenas={5} desde={llega + 8} />
            <Pastilla m={m} texto="Contratación Verificada" color={m.exito} />
          </>}
          style={{ ...entra(f, llega, 14) }}
        />
      </div>
      <Fila
        m={m} icono="usuario" etiqueta="Martín Ojeda" detalle="Trabajo hecho con seña protegida"
        pastilla={<><Estrellas f={f} m={m} llenas={5} /><Pastilla m={m} texto="Contratación Verificada" color={m.exito} /></>}
        style={entra(f, p1)}
      />
      <Fila
        m={m} icono="usuario" etiqueta="Gustavo Peralta" detalle="Trabajo hecho con seña protegida"
        pastilla={<><Estrellas f={f} m={m} llenas={5} /><Pastilla m={m} texto="Contratación Verificada" color={m.exito} /></>}
        style={entra(f, p2)}
      />
      <Fila
        m={m} icono="usuario" etiqueta="Andrés Quiroga" detalle="Trabajo hecho con seña protegida"
        pastilla={<><Estrellas f={f} m={m} llenas={4} /><Pastilla m={m} texto="Contratación Verificada" color={m.exito} /></>}
        style={entra(f, p3)}
      />
    </Tarjeta>
  );
};
