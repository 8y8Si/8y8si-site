// pages/index.js
import React, { useEffect, useState } from 'react';
import PropertyFilters from '../components/PropertyFilters';

export default function Home() {
  const [propiedades, setPropiedades] = useState([]);
  const [filters, setFilters] = useState({});

  useEffect(() => {
  const fetchPropiedades = async () => {
    const apiKey = process.env.NEXT_PUBLIC_EASYBROKER_API_KEY;
    const params = new URLSearchParams();

    params.append('search[statuses][]', 'published');
    params.append('search[archived]', 'false');
    params.append('limit', '100');

    if (filters.operation_type) {
      params.append('search[operation_types][]', filters.operation_type);
    }
    if (filters.bedrooms) {
      params.append('search[bedrooms]', filters.bedrooms);
    }
    if (filters.bathrooms) {
      params.append('search[bathrooms]', filters.bathrooms);
    }
    if (filters.half_bathrooms) {
      params.append('search[half_bathrooms]', filters.half_bathrooms);
    }
    if (filters.floor) {
      params.append('search[floor]', filters.floor);
    }
    if (filters.construction_size) {
      params.append('search[construction_size]', filters.construction_size);
    }
    if (filters.balcony) {
      params.append('search[features][]', 'balcony');
    }
    if (filters.terrace) {
      params.append('search[features][]', 'terrace');
    }
    if (filters.parking_spaces) {
      params.append('search[parking_spaces]', filters.parking_spaces);
    }

    try {
      const res = await fetch(`https://api.easybroker.com/v1/properties?${params.toString()}`, {
        headers: {
          'X-Authorization': apiKey,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setPropiedades(data.content || []);
    } catch (error) {
      console.error('Error al obtener propiedades:', error);
      setPropiedades([]);
    }
  };

  fetchPropiedades();
}, [filters]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Propiedades disponibles en venta o renta</h1>
      <PropertyFilters filters={filters} setFilters={setFilters} />
      {propiedades.length === 0 ? (
        <p>No se encontraron propiedades disponibles.</p>
      ) : (
        <ul>
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
              <p>Operación: {propiedad.operation_type}</p>
              <p>
                Precio: {propiedad.public_price ? `$${propiedad.public_price}` : 'No disponible'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
