// components/PropertyFilters.js
import React from "react";

const PropertyFilters = ({ filters, setFilters }) => {
  const handleChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      <select
        value={filters.operation_type || ""}
        onChange={(e) => handleChange("operation_type", e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">Operación</option>
        <option value="sale">Venta</option>
        <option value="rent">Renta</option>
      </select>

      <input
        type="number"
        placeholder="Recámaras"
        value={filters.bedrooms || ""}
        onChange={(e) => handleChange("bedrooms", e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="number"
        placeholder="Baños"
        value={filters.bathrooms || ""}
        onChange={(e) => handleChange("bathrooms", e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="number"
        placeholder="Medios baños"
        value={filters.half_bathrooms || ""}
        onChange={(e) => handleChange("half_bathrooms", e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="number"
        placeholder="Piso"
        value={filters.floor || ""}
        onChange={(e) => handleChange("floor", e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="number"
        placeholder="m² construcción"
        value={filters.construction_size || ""}
        onChange={(e) => handleChange("construction_size", e.target.value)}
        className="border p-2 rounded"
      />

      <select
        value={filters.terrace || ""}
        onChange={(e) => handleChange("terrace", e.target.value === "true")}
        className="border p-2 rounded"
      >
        <option value="">¿Terraza?</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>

      <select
        value={filters.balcony || ""}
        onChange={(e) => handleChange("balcony", e.target.value === "true")}
        className="border p-2 rounded"
      >
        <option value="">¿Balcón?</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>

      <input
        type="number"
        placeholder="Estacionamientos"
        value={filters.parking_spaces || ""}
        onChange={(e) => handleChange("parking_spaces", e.target.value)}
        className="border p-2 rounded"
      />
    </div>
  );
};

export default PropertyFilters;
