import { useState, useEffect } from 'react';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [operationType, setOperationType] = useState('');
  const [propertyType, setPropertyType] = useState('');

  const fetchProperties = async () => {
    try {
      const params = new URLSearchParams();

      // Solo filtra por operación y tipo de propiedad si se eligen
      if (operationType) params.append('operation_type', operationType);
      if (propertyType) params.append('property_type', propertyType);
      params.append('status', 'published');

      const res = await fetch(`https://api.easybroker.com/v1/properties?${params.toString()}`, {
        headers: {
          'X-Authorization': process.env.NEXT_PUBLIC_EASYBROKER_API_KEY,
        },
      });

      const data = await res.json();
      setProperties(data.content || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [operationType, propertyType]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Propiedades disponibles en venta o renta</h1>

      <div style={{ marginBottom: '1rem' }}>
        <select value={operationType} onChange={(e) => setOperationType(e.target.value)}>
          <option value="">Operación</option>
          <option value="sale">Venta</option>
          <option value="rent">Renta</option>
        </select>

        <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
          <option value="">Tipo de Propiedad</option>
          <option value="Casa">Casa</option>
          <option value="Casa en condominio">Casa en condominio</option>
          <option value="Departamento">Departamento</option>
          <option value="Quinta">Quinta</option>
          <option value="Rancho">Rancho</option>
          <option value="Terreno">Terreno</option>
          <option value="Villa">Villa</option>
          <option value="Bodega comercial">Bodega comercial</option>
          <option value="Casa con uso de suelo">Casa con uso de suelo</option>
          <option value="Edificio">Edificio</option>
          <option value="Huerta">Huerta</option>
          <option value="Local comercial">Local comercial</option>
          <option value="Local en centro comercial">Local en centro comercial</option>
          <option value="Oficina">Oficina</option>
          <option value="Terreno comercial">Terreno comercial</option>
          <option value="Bodega industrial">Bodega industrial</option>
          <option value="Nave industrial">Nave industrial</option>
          <option value="Terreno industrial">Terreno industrial</option>
        </select>
      </div>

      {properties.length === 0 ? (
        <p>No se encontraron propiedades disponibles.</p>
      ) : (
        <ul>
          {properties.map((property) => (
            <li key={property.public_id}>
              <strong>{property.title}</strong><br />
              Precio: {property.operations?.[0]?.prices?.[0]?.amount
                ? `$${property.operations[0].prices[0].amount.toLocaleString()}`
                : 'No disponible'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
