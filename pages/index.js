// pages/index.js

import React from 'react';

export async function getStaticProps() {
  try {
    const res = await fetch(
      'https://api.easybroker.com/v1/properties?operation_type=sale&limit=20',
      {
        headers: {
          'X-Authorization': process.env.EASYBROKER_API_KEY
        }
      }
    );

    if (!res.ok) {
      throw new Error(`Error en la API: ${res.status}`);
    }

    const data = await res.json();

    return {
      props: {
        properties: data.content || []
      },
      revalidate: 60 // Revalidar cada minuto
    };
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    return {
      props: {
        properties: []
      }
    };
  }
}

export default function Home({ properties }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Propiedades en venta</h1>
      {properties.length === 0 ? (
        <p>No se encontraron propiedades.</p>
      ) : (
        <ul>
          {properties.map((property) => (
            <li key={property.public_id}>
              <strong>{property.title}</strong>
              <p>{property.location?.name}</p>
              <p>{property.price ? `$${property.price.toLocaleString()}` : 'Precio no disponible'}</p>
              {property.title_image_full && (
                <img
                  src={property.title_image_full}
                  alt={property.title}
                  style={{ width: '300px', marginTop: '10px' }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
