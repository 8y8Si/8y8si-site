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
              <p>
                Precio:{' '}
                {propiedad.public_price
                  ? `$${Number(propiedad.public_price).toLocaleString()}`
                  : 'No disponible'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export async function getServerSideProps() {
  const apiKey = process.env.EASYBROKER_API_KEY;

  if (!apiKey) {
    console.error("❌ EASYBROKER_API_KEY no está definida");
    return {
      props: {
        propiedades: [],
      },
    };
  }

  const propiedades = [];
  let page = 1;
  const limit = 50;
  let hasMore = true;

  try {
    while (hasMore) {
      const res = await fetch(
        `https://api.easybroker.com/v1/properties?search[statuses][]=published&page=${page}&limit=${limit}`,
        {
          headers: {
            "X-Authorization": apiKey,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Error en respuesta:", errorData);
        throw new Error(`Error ${res.status}`);
      }

      const data = await res.json();
      propiedades.push(...data.content);

      if (data.pagination && data.pagination.total_pages > page) {
        page++;
      } else {
        hasMore = false;
      }
    }

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
