import React, { useState } from 'react';

export default function Home({ propiedades }) {
  const [filtro, setFiltro] = useState({
    operacion: '',
    tipo: '',
    precioMin: '',
    precioMax: '',
  });

  const handleChange = (e) => {
    setFiltro({ ...filtro, [e.target.name]: e.target.value });
  };

  const filtrarPropiedades = () => {
    return propiedades.filter((prop) => {
      const operaciones = prop.operations || [];
      const tipo = prop.property_type || '';
      const primeraOperacion = operaciones[0] || {};
      const precio = primeraOperacion.amount || 0;

      const operacionCoincide =
        filtro.operacion === '' ||
        operaciones.some((op) => op.type === filtro.operacion);

      return (
        operacionCoincide &&
        (filtro.tipo === '' || tipo === filtro.tipo) &&
        (filtro.precioMin === '' || precio >= parseInt(filtro.precioMin)) &&
        (filtro.precioMax === '' || precio <= parseInt(filtro.precioMax))
      );
    });
  };

  const propiedadesFiltradas = filtrarPropiedades();

  return (
    <div>
      <h1>Propiedades disponibles en venta o renta</h1>

      <div style={{ marginBottom: "1rem" }}>
        <select name="operacion" value={filtro.operacion} onChange={handleChange}>
          <option value="">Operación</option>
          <option value="sale">Venta</option>
          <option value="rent">Renta</option>
        </select>

        <select name="tipo" value={filtro.tipo} onChange={handleChange}>
          <option value="">Tipo de Propiedad</option>
          <option value="Casa">Casa</option>
          <option value="Casa en condominio">Casa en condominio</option>
          <option value="Departamento">Departamento</option>
          <option value="Quinta">Quinta</option>
          <option value="Rancho">Rancho</option>
          <option value="Terreno">Terreno</option>
          <option value="Villa">Villa</option>
          <option value="Bodega comercial">Bodega comercial</option>
          <option value="Casa con uso de suelo">Casa con uso de suelo</option>
          <option value="Edificio">Edificio</option>
          <option value="Huerta">Huerta</option>
          <option value="Local comercial">Local comercial</option>
          <option value="Local en centro comercial">Local en centro comercial</option>
          <option value="Oficina">Oficina</option>
          <option value="Terreno comercial">Terreno comercial</option>
          <option value="Bodega industrial">Bodega industrial</option>
          <option value="Nave industrial">Nave industrial</option>
          <option value="Terreno industrial">Terreno industrial</option>
        </select>

        <input
          type="number"
          name="precioMin"
          placeholder="Precio mínimo"
          value={filtro.precioMin}
          onChange={handleChange}
        />

        <input
          type="number"
          name="precioMax"
          placeholder="Precio máximo"
          value={filtro.precioMax}
          onChange={handleChange}
        />
      </div>

      {propiedadesFiltradas.length === 0 ? (
        <p>No se encontraron propiedades disponibles.</p>
      ) : (
        <ul>
          {propiedadesFiltradas.map((propiedad) => {
            const operacion = propiedad.operations?.[0];
            const precio = operacion?.formatted_amount || 'No disponible';

            return (
              <li key={propiedad.id} style={{ marginBottom: "2rem" }}>
                <h2>{propiedad.title}</h2>
                {propiedad.title_image_full && (
                  <img
                    src={propiedad.title_image_full}
                    alt={propiedad.title}
                    width={300}
                  />
                )}
                <p>Operación: {operacion?.type || 'No especificado'}</p>
                <p>Precio: {precio}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export async function getServerSideProps() {
  const apiKey = process.env.EASYBROKER_API_KEY || process.env.NEXT_PUBLIC_EASYBROKER_API_KEY;

  if (!apiKey) {
    console.error("❌ EASYBROKER_API_KEY no está definida");
    return {
      props: {
        propiedades: [],
      },
    };
  }

  const allProperties = [];
  let nextPage = `https://api.easybroker.com/v1/properties?search[statuses][]=published&limit=50`;

  try {
    while (nextPage) {
      const res = await fetch(nextPage, {
        headers: {
          "X-Authorization": apiKey,
          "Accept": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Error en respuesta:", errorData);
        throw new Error(`Error ${res.status}`);
      }

      const data = await res.json();
      allProperties.push(...data.content);
      nextPage = data.pagination?.next_page_url || null;
    }

    return {
      props: {
        propiedades: allProperties,
      },
    };
  } catch (error) {
    console.error("❌ Error al obtener propiedades:", error.message);
    return {
      props: {
        propiedades: [],
      },
    };
  }
}
