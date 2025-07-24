import React from 'react';

export default function Home({ propiedades }) {
  return (
    <div>
      <h1>Propiedades en venta</h1>
      {propiedades.length === 0 ? (
        <p>No se encontraron propiedades.</p>
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
              <p>{propiedad.location}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export async function getStaticProps() {
  const apiKey = process.env.NEXT_PUBLIC_EASYBROKER_API_KEY;

  if (!apiKey) {
    console.error("❌ EASYBROKER_API_KEY no está definida");
    return {
      props: {
        propiedades: [],
      },
    };
  }

  try {
    const res = await fetch("https://api.easybroker.com/v1/properties?status=published", {

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
      revalidate: 3600,
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
