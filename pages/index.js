import React from 'react';

export default function Home({ propiedades }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Propiedades en venta</h1>
      {propiedades.length === 0 ? (
        <p>No se encontraron propiedades disponibles.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {propiedades.map((propiedad) => (
            <li key={propiedad.id} style={{ marginBottom: '2rem' }}>
              <h2>{propiedad.title}</h2>
              {propiedad.title_image_full && (
                <img
                  src={propiedad.title_image_full}
                  alt={propiedad.title}
                  width={300}
                />
              )}
              <p>{propiedad.location?.name || 'Ubicación no disponible'}</p>
              <p><strong>Precio:</strong> {propiedad.operations?.[0]?.amount_formatted || 'No disponible'}</p>
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
    const res = await fetch("https://api.easybroker.com/v1/properties?status=published&page=1&limit=50", {
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

    // Filtramos propiedades con imagen y visibles públicamente
    const propiedadesVisibles = data.content.filter(
      (prop) =>
        prop.title_image_full &&
        prop.visibility === 'public' &&
        prop.status === 'published'
    );

    return {
      props: {
        propiedades: propiedadesVisibles,
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
