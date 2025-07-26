// components/PropertyFilters.js
import React, { useState } from 'react';

export default function PropertyFilters({ filters, setFilters }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '2rem' }}>
      <h3>Filtrar propiedades</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <select name="operation_type" value={filters.operation_type} onChange={handleChange}>
          <option value="">Todas</option>
          <option value="sale">Venta</option>
          <option value="rent">Renta</option>
        </select>

        <input
          type="number"
          name="bedrooms"
          placeholder="Recámaras"
          value={filters.bedrooms || ''}
          onChange={handleChange}
        />

        <input
          type="number"
          name="bathrooms"
          placeholder="Baños"
          value={filters.bathrooms || ''}
          onChange={handleChange}
        />

        <input
          type="number"
          name="half_bathrooms"
          placeholder="Medios baños"
          value={filters.half_bathrooms || ''}
          onChange={handleChange}
        />

        <input
          type="number"
          name="floor"
          placeholder="Piso"
          value={filters.floor || ''}
          onChange={handleChange}
        />

        <input
          type="number"
          name="construction_size"
          placeholder="m² construcción"
          value={filters.construction_size || ''}
          onChange={handleChange}
        />

        <select name="balcony" value={filters.balcony || ''} onChange={handleChange}>
          <option value="">¿Balcón?</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>

        <select name="terrace" value={filters.terrace || ''} onChange={handleChange}>
          <option value="">¿Terraza?</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>

        <input
          type="number"
          name="parking_spaces"
          placeholder="Estacionamientos"
          value={filters.parking_spaces || ''}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
