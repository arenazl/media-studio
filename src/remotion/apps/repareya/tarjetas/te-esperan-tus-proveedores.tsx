import React from 'react';
import { Aviso, Fila, Pastilla, Tarjeta, cuenta, ease, entra, momento, pesos, pulso, type TarjetaProps } from '../../_base/Marco';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) la home arranca sin la tira; llega el primer presupuesto y se enciende el aviso de la barra
  const uno = momento(dur, 0.18);
  // 2) entra el segundo al lado y el aviso de la barra suma uno
  const dos = momento(dur, 0.52);
  // 3) la promesa de la seña queda hasta el final
  const sena = momento(dur, 0.78);

  const dosEntro = ease(f, dos, dos + 10);
  const m1 = momento(dur, 0.22), m1b = momento(dur, 0.46);
  const m2 = momento(dur, 0.56), m2b = momento(dur, 0.8);

  return (
    <Tarjeta
      f={f}
      m={m}
      icono="campana"
      titulo="Te esperan tus proveedores"
      bajada="Carpintería Marcelo · presupuesto listo"
      derecha={<Pastilla m={m} texto="Ver 1 más" color={m.acento} style={{ opacity: ease(f, dos + 6, dos + 18) }} />}
    >
      <Aviso
        m={m}
        icono="campana"
        color={m.error}
        titulo={dosEntro > 0.5 ? '2 trabajos esperan algo tuyo' : '1 trabajo espera algo tuyo'}
        texto="ordenados por urgencia"
        style={{ ...entra(f, uno), opacity: ease(f, uno, uno + 12) * (0.75 + 0.25 * pulso(f, 28)) }}
      />
      <Fila
        m={m}
        icono="herramienta"
        etiqueta="Muebles a medida en melamina y madera maciza"
        detalle="Carpintería Marcelo"
        valor={pesos(cuenta(f, m1, m1b, 0, 620000))}
        destacada
        color={m.acento}
        pastilla={<Pastilla m={m} texto="presupuesto listo" color={m.acento} />}
        style={entra(f, uno + 4)}
      />
      <Fila
        m={m}
        icono="herramienta"
        etiqueta="Restauración y reparación de muebles"
        detalle="Carpintería Marcelo"
        valor={pesos(cuenta(f, m2, m2b, 0, 98000))}
        destacada={dosEntro > 0.2}
        color={m.acento}
        pastilla={<Pastilla m={m} texto="presupuesto listo" color={m.acento} />}
        style={entra(f, dos)}
      />
      <Aviso
        m={m}
        icono="escudo"
        color={m.exito}
        titulo="La seña queda protegida"
        texto="hasta que el trabajo esté hecho"
        style={entra(f, sena)}
      />
    </Tarjeta>
  );
};
