// components/PropertyFilters.js

import React from "react";

const PropertyFilters = ({ filters, onChange }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      <select
        value={filters.operation}
        onChange={(e) => onChange("operation", e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">Operación</option>
        <option value="sale">Venta</option>
        <option value="rent">Renta</option>
      </select>

      <input
        type="number"
        placeholder="Recámaras"
        value={filters.bedrooms}
        onChange={(e) => onChange("bedrooms", e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="number"
        placeholder="Baños"
        value={filters.bathrooms}
        onChange={(e) => onChange("bathrooms", e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="number"
        placeholder="Medios baños"
        value={filters.half_bathrooms}
        onChange={(e) => onChange("half_bathrooms", e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="number"
        placeholder="Piso"
        value={filters.floor}
        onChange={(e) => onChange("floor", e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="number"
        placeholder="m² mínimo"
        value={filters.min_m2}
        onChange={(e) => onChange("min_m2", e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="number"
        placeholder="m² máximo"
        value={filters.max_m2}
        onChange={(e) => onChange("max_m2", e.target.value)}
        className="border p-2 rounded"
      />

      <select
        value={filters.has_terrace}
        onChange={(e) => onChange("has_terrace", e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">¿Terraza?</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>

      <select
        value={filters.has_balcony}
        onChange={(e) => onChange("has_balcony", e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">¿Balcón?</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>

      <input
        type="number"
        placeholder="Estacionamientos"
        value={filters.parking_spaces}
        onChange={(e) => onChange("parking_spaces", e.target.value)}
        className="border p-2 rounded"
      />
    </div>
  );
};

export default PropertyFilters;
