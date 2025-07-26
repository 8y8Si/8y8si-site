import React from 'react';

export default function PropertyFilters({ filters, onFilterChange }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label>
        Tipo de operación:
        <select name="operation" value={filters.operation} onChange={onFilterChange}>
          <option value="">Todos</option>
          <option value="sale">Venta</option>
          <option value="rent">Renta</option>
        </select>
      </label>
      <label>
        Recámaras:
        <input
          type="number"
          name="bedrooms"
          value={filters.bedrooms}
          onChange={onFilterChange}
          placeholder="Min"
          min={0}
        />
      </label>
      <label>
        Baños:
        <input
          type="number"
          name="bathrooms"
          value={filters.bathrooms}
          onChange={onFilterChange}
          placeholder="Min"
          min={0}
        />
      </label>
      <label>
        Medios baños:
        <input
          type="number"
          name="half_bathrooms"
          value={filters.half_bathrooms}
          onChange={onFilterChange}
          placeholder="Min"
          min={0}
        />
      </label>
      <label>
        Piso:
        <input
          type="number"
          name="floor"
          value={filters.floor}
          onChange={onFilterChange}
          placeholder="Número"
          min={0}
        />
      </label>
      <label>
        m² mínimo:
        <input
          type="number"
          name="min_construction_size"
          value={filters.min_construction_size}
          onChange={onFilterChange}
          placeholder="Min"
          min={0}
        />
      </label>
      <label>
        ¿Tiene terraza?
        <select name="terrace" value={filters.terrace} onChange={onFilterChange}>
          <option value="">No filtrar</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      </label>
      <label>
        ¿Tiene balcón?
        <select name="balcony" value={filters.balcony} onChange={onFilterChange}>
          <option value="">No filtrar</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      </label>
      <label>
        Estacionamientos:
        <input
          type="number"
          name="parking_spaces"
          value={filters.parking_spaces}
          onChange={onFilterChange}
          placeholder="Min"
          min={0}
        />
      </label>
    </div>
  );
}
