import React from 'react';

export default function Home({ propiedades }) {
  return (
    <div>
      <h1>Propiedades publicadas (sin filtro de tipo de operación)</h1>
      {propiedades.length === 0 ? (
        <p>No se encontraron propiedades.</p>
      ) : (
        <ul>
          {propiedades.map((propiedad) => (
            <li key={propiedad.public_id}>
              <h2>{propiedad.title || 'Sin título'}</h2>
              {propiedad.title_image_full && (
                <img
                  src={propiedad.title_image_full}
                  alt={propiedad.title}
                  width={300}
                />
              )}
              <p>
                <strong>ID:</strong> {propiedad.public_id}<br />
                <strong>Tipo:</strong> {propiedad.operation_type}<br />
                <strong>Ubicación:</strong> {propiedad.location?.name || 'No disponible'}
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
    return { props: { propiedades: [] } };
  }

  try {
    const res = await fetch("https://api.easybroker.com/v1/properties?search[statuses][]=published", {
      headers: {
        "X-Authorization": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("❌ Error en respuesta:", errorData);
      throw new Error(`Error ${res.status}`);
    }

    const data = await res.json();

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
