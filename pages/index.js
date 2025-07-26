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
  // 🚨 Aquí va tu API Key directamente para pruebas
  const apiKey = 'TU_API_KEY_AQUÍ';

  try {
    const url = `https://api.easybroker.com/v1/properties?limit=50`;

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

    console.log("✅ Propiedades obtenidas:", data.content);

    return {
      props: {
        propiedades: data.content || [],
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
