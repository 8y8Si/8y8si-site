// pages/index.js
import React from 'react';
import { useRouter } from 'next/router';
import PropertyFilters from '../components/PropertyFilters';

export default function Home({ propiedades }) {
  const router = useRouter();

  const handleFilter = (filters) => {
    router.push({
      pathname: '/',
      query: filters,
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Propiedades disponibles en venta o renta</h1>
      <PropertyFilters onFilter={handleFilter} />
      {propiedades.length === 0 ? (
        <p>No se encontraron propiedades disponibles.</p>
      ) : (
        <ul>
          {propiedades.map((propiedad) => (
            <li key={propiedad.public_id} style={{ marginBottom: 30 }}>
              <h2>{propiedad.title}</h2>
              {propiedad.title_image_full && (
                <img src={propiedad.title_image_full} alt={propiedad.title} width={300} />
              )}
              <p>Operación: {propiedad.operations?.[0]?.type || 'No disponible'}</p>
              <p>Precio: {propiedad.operations?.[0]?.formatted_amount || 'No disponible'}</p>
              <p>Recámaras: {propiedad.bedrooms || 'N/D'}</p>
              <p>Baños: {propiedad.bathrooms || 'N/D'}</p>
              <p>Medios Baños: {propiedad.half_bathrooms || 'N/D'}</p>
              <p>Estacionamientos: {propiedad.parking_spaces || 'N/D'}</p>
              <p>Metros construcción: {propiedad.construction_size || 'N/D'}</p>
              <p>Piso: {propiedad.floor || 'N/D'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const apiKey = process.env.EASYBROKER_API_KEY;
  const { query } = context;
  const searchParams = new URLSearchParams();

  searchParams.append('search[statuses][]', 'published');
  searchParams.append('limit', '50');

  if (query.operation_type) searchParams.append('search[operation_type]', query.operation_type);
  if (query.min_price) searchParams.append('search[min_price]', query.min_price);
  if (query.max_price) searchParams.append('search[max_price]', query.max_price);
  if (query.bedrooms) searchParams.append('search[bedrooms]', query.bedrooms);
  if (query.bathrooms) searchParams.append('search[bathrooms]', query.bathrooms);
  if (query.half_bathrooms) searchParams.append('search[half_bathrooms]', query.half_bathrooms);
  if (query.floor) searchParams.append('search[floor]', query.floor);
  if (query.parking_spaces) searchParams.append('search[parking_spaces]', query.parking_spaces);
  if (query.min_size) searchParams.append('search[min_construction_size]', query.min_size);

  const url = `https://api.easybroker.com/v1/properties?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      'X-Authorization': apiKey,
      Accept: 'application/json',
    },
  });

  const data = await res.json();

  return {
    props: {
      propiedades: data.content || [],
    },
  };
}
