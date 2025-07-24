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
                <img src={propiedad.title_image_full} alt={propiedad.title} width={300} />
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
  const apiKey = process.env.EASYBROKER_API_KEY;

  const res = await fetch("https://api.easybroker.com/v1/properties", {
    headers: {
      "X-Authorization": apiKey,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();

  console.log("🔍 Respuesta de EasyBroker:", data);

  return {
    props: {
      propiedades: data.content || [],
    },
    revalidate: 3600, // vuelve a cargar cada hora
  };
}
