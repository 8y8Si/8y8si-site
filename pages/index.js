import { useEffect, useState } from 'react';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    operation_type: '', // venta o renta
    property_type: '', // casa, departamento, etc.
    price_min: '',
    price_max: '',
    bedrooms: '',
    bathrooms: '',
    half_bathrooms: '',
    parking_spaces: '',
    floor: '',
    construction_size: '',
    lot_size: '',
    terrace: '',
    balcony: '',
  });

  const fetchProperties = async () => {
    try {
      const queryParams = new URLSearchParams({
        status: 'published',
        ...(filters.operation_type && { operation_type: filters.operation_type }),
        ...(filters.property_type && { property_type: filters.property_type }),
        ...(filters.price_min && { price_min: filters.price_min }),
        ...(filters.price_max && { price_max: filters.price_max }),
      });

      const res = await fetch(`https://api.easybroker.com/v1/properties?${queryParams.toString()}`, {
        headers: {
          'X-Authorization': process.env.NEXT_PUBLIC_EASYBROKER_API_KEY,
        },
      });

      const data = await res.json();
      setProperties(data.content);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Propiedades disponibles en venta o renta</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {/* Filtros principales */}
        <select name="operation_type" onChange={handleChange}>
          <option value="">Operación</option>
          <option value="sale">Venta</option>
          <option value="rent">Renta</option>
        </select>

        <select name="property_type" onChange={handleChange}>
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

        <input
          type="number"
          name="price_min"
          placeholder="Precio mínimo"
          onChange={handleChange}
        />
        <input
          type="number"
          name="price_max"
          placeholder="Precio máximo"
          onChange={handleChange}
        />
      </div>

      {/* Propiedades */}
      {properties.length === 0 ? (
        <p>No se encontraron propiedades disponibles.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {properties.map((prop) => (
            <div key={prop.public_id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
              {prop.title && <h3>{prop.title}</h3>}
              {prop.location && <p><strong>Ubicación:</strong> {prop.location}</p>}
              {prop.price && <p><strong>Precio:</strong> ${prop.price.toLocaleString()}</p>}
              {prop.property_type && <p><strong>Tipo:</strong> {prop.property_type}</p>}
              {prop.photos?.[0]?.url && (
                <img src={prop.photos[0].url} alt={prop.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
