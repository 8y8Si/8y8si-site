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

  try {
    const url = `https://api.easybroker.com/v1/properties?search[statuses][]=published&limit=200`;

    const res = await fetch(url, {
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

    // 🔍 Filtra manualmente para quitar archivadas
    const propiedadesDisponibles = data.content.filter(
      (propiedad) => !propiedad.archived && propiedad.status === "published"
    );

    return {
      props: {
        propiedades: propiedadesDisponibles,
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
