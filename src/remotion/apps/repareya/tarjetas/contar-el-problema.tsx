// RepareHoy · Contar el problema (pantalla 01). Lo que cuenta: pedir un arreglo es contarlo en tus palabras,
// en cuatro pasos cortos, sin saber qué oficio necesitás. Datos tal cual los estados 01-a / 01-b / 01-c.
import React from 'react';
import { Aviso, Barra, Boton, Fila, Numero, Pastilla, Tarjeta, Toque, cuenta, ease, entra, lin, momento, pesos, pulso, type TarjetaProps } from '../../_base/Marco';

const DESC = 'Se me llueve el techo del lavadero cuando llueve fuerte.';

export const Mockup: React.FC<TarjetaProps> = ({ f, dur, m }) => {
  // 1) la barra de pasos avanza: Tipo de trabajo, Detalles, Lugar, Resumen
  const b1 = momento(dur, 0.12), b2 = momento(dur, 0.30), b3 = momento(dur, 0.46), b4 = momento(dur, 0.66);
  const pasos = 0.25 * ease(f, b1, b1 + 8) + 0.25 * ease(f, b2, b2 + 8) + 0.25 * ease(f, b3, b3 + 8) + 0.25 * ease(f, b4, b4 + 8);
  // 2) se elige el tipo de trabajo y después se tipea la descripción
  const tipo = momento(dur, 0.10);
  const lugar = momento(dur, 0.28);
  const t0 = momento(dur, 0.34), t1 = momento(dur, 0.56);
  const escrito = DESC.slice(0, Math.round(DESC.length * lin(f, t0, t1)));
  // 3) el lugar sale y entra el resumen (superficie, presupuesto máx)
  const salida = momento(dur, 0.62);
  const res = salida + 8;
  // 4) Crear solicitud → Publicando… → solicitud publicada
  const apreta = momento(dur, 0.74);
  const publicando = momento(dur, 0.78);
  const salBoton = momento(dur, 0.86);
  const aviso = salBoton + 8;
  const paso = f < b2 ? 'Paso 1 de 4 · Tipo de trabajo' : f < b4 ? 'Paso 3 de 4 · Lugar' : 'Paso 4 de 4 · Resumen';
  return (
    <>
      <Tarjeta f={f} m={m} icono="casa" titulo="Contanos qué hay que arreglar" bajada={paso} derecha={<Pastilla m={m} texto="Resumen" color={f >= b4 ? m.acento : m.texto3} />}>
        <Barra m={m} valor={pasos} tramos={4} />
        <Fila
          m={m} icono="casa" etiqueta="Humedad y filtraciones" detalle="Tipo de trabajo"
          destacada color={m.acento}
          pastilla={<Pastilla m={m} texto="Elegido" color={m.acento} style={{ opacity: 0.7 + 0.3 * pulso(f, 30) }} />}
          style={entra(f, tipo)}
        />
        {f < res ? (
          <Fila
            m={m} icono="pin" etiqueta="Humedad en el techo del lavadero"
            detalle={escrito + (f < t1 ? '|' : '')}
            pastilla={<Pastilla m={m} texto="Villa Urquiza" color={m.info} />}
            style={{ ...entra(f, lugar), opacity: ease(f, lugar, lugar + 12) * (1 - ease(f, salida, salida + 8)) }}
          />
        ) : (
          <div style={{ display: 'flex', gap: 18, ...entra(f, res) }}>
            <Numero m={m} etiqueta="Superficie" texto="12 m2" style={{ flex: 1 }} />
            <Numero m={m} etiqueta="Presupuesto máx" texto={pesos(cuenta(f, res, momento(dur, 0.82), 0, 400000))} color={m.acento} style={{ flex: 1 }} />
          </div>
        )}
        {f < aviso ? (
          <Boton
            m={m} icono="flecha" texto={f < publicando ? 'Crear solicitud' : 'Publicando…'}
            apretado={ease(f, apreta, apreta + 6) * (1 - ease(f, apreta + 10, apreta + 18))}
            style={{ ...entra(f, momento(dur, 0.66)), opacity: ease(f, momento(dur, 0.66), momento(dur, 0.66) + 12) * (1 - ease(f, salBoton, salBoton + 8)) }}
          />
        ) : (
          <Aviso m={m} titulo="¡Solicitud publicada!" texto="Los proveedores de tu zona la van a cotizar." color={m.exito} style={entra(f, aviso)} />
        )}
      </Tarjeta>
      <Toque x={540} y={896} apreta={ease(f, apreta, apreta + 6)} visible={ease(f, apreta - 12, apreta) * (1 - ease(f, apreta + 14, apreta + 24))} />
    </>
  );
};
