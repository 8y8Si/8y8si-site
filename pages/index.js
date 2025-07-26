import React from 'react';

export default function Home({ propiedades }) {
  return (
    <div>
      <h1>Propiedades disponibles en venta o renta</h1>
      {propiedades.length === 0 ? (
        <p>No se encontraron propiedades disponibles.</p>
      ) : (
        <ul>
          {propiedades.map((propiedad) => (
            <li key={propiedad.id}>
              <h2>{propiedad.title}</h2>
              {propiedad.title_image_full && (
                <img
                  src={propiedad.title_image_full}
                  alt={propiedad.title}
                  width={300}
                />
              )}
              <p>Operación: {propiedad.operation_type}</p>
              <p>Precio: ${propiedad.public_price}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Función que hace la paginación completa
async function fetchAllAvailableProperties(apiKey) {
  let page = 1;
  let allProperties = [];
  let hasMore = true;

  while (hasMore) {
    const url = `https://api.easybroker.com/v1/properties?search[statuses][]=published&search[availability][]=available&limit=100&page=${page}`;

    const res = await fetch(url, {
      headers: {
        'X-Authorization': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`❌ Error en la página ${page}:`, await res.text());
      break;
    }

    const data = await res.json();
    allProperties = allProperties.concat(data.content || []);

    // Si ya no hay más páginas, detenemos el loop
    hasMore = data.pagination && data.pagination.total_pages > page;
    page++;
  }

  return allProperties;
}

export async function getServerSideProps() {
  const apiKey = process.env.EASYBROKER_API_KEY;

  if (!apiKey) {
    console.error('❌ EASYBROKER_API_KEY no está definida');
    return {
      props: {
        propiedades: [],
      },
    };
  }

  try {
    const propiedades = await fetchAllAvailableProperties(apiKey);
    return {
      props: {
        propiedades,
      },
    };
  } catch (error) {
    console.error('❌ Error al obtener propiedades:', error.message);
    return {
      props: {
        propiedades: [],
      },
    };
  }
}
