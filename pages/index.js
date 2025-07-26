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
      const op = prop.operations?.[0]?.type || '';
      const tipo = prop.property_type || '';
      const precio = prop.operations?.[0]?.amount || 0;

      return (
        (filtro.operacion === '' || op === filtro.operacion) &&
        (filtro.tipo === '' || tipo === filtro.tipo) &&
        (filtro.precioMin === '' || precio >= parseInt(filtro.precioMin)) &&
        (filtro.precioMax === '' || precio <= parseInt(filtro.precioMax))
      );
    });
  };

  const propiedadesFiltradas = filtrarPropiedades();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Propiedades disponibles en venta o renta</h1>

      <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <select name="operacion" onChange={handleChange}>
          <option value="">Operación</option>
          <option value="sale">Venta</option>
          <option value="rent">Renta</option>
        </select>

        <select name="tipo" onChange={handleChange}>
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
          onChange={handleChange}
        />

        <input
          type="number"
          name="precioMax"
          placeholder="Precio máximo"
          onChange={handleChange}
        />
      </div>

      {propiedadesFiltradas.length === 0 ? (
        <p>No se encontraron propiedades disponibles.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {propiedadesFiltradas.map((propiedad) => {
            const operacion = propiedad.operations?.[0];
            const precio = operacion?.formatted_amount || 'No disponible';

            return (
              <li key={propiedad.id} style={{ marginBottom: "2rem", borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
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

// 🔁 Función para paginar hasta traer todas las propiedades
async function fetchAllProperties(apiKey) {
  const all = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await fetch(`https://api.easybroker.com/v1/properties?search[statuses][]=published&page=${page}&limit=50`, {
      headers: {
        "X-Authorization": apiKey,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("❌ Error en respuesta:", errorData);
      break;
    }

    const data = await res.json();
    totalPages = data.pagination.total_pages;
    all.push(...data.content);
    page++;
  } while (page <= totalPages);

  return all;
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

  try {
    const propiedades = await fetchAllProperties(apiKey);
    return {
      props: {
        propiedades,
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
