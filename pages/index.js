import React from 'react';

export default function Home({ properties }) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Propiedades en venta</h1>
      {properties.length === 0 ? (
        <p>No se encontraron propiedades.</p>
      ) : (
        <ul>
          {properties.map((prop) => (
            <li key={prop.public_id}>
              <strong>{prop.title}</strong> - {prop.location?.name || 'Sin ubicación'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export async function getStaticProps() {
  try {
    const res = await fetch('https://api.easybroker.com/v1/properties?status=published', {
      headers: {
        'X-Authorization': process.env.EASYBROKER_API_KEY,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Error en fetch:', res.status, errorText);
      return { props: { properties: [] } };
    }

    const data = await res.json();
    return {
      props: {
        properties: data.content || [],
      },
      revalidate: 60, // ISR: actualiza cada 60 segundos
    };
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    return { props: { properties: [] } };
  }
}
