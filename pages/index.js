import { useEffect, useState } from 'react';

export default function Home() {
  const [propiedades, setPropiedades] = useState([]);

  useEffect(() => {
    fetch('/api/propiedades')
      .then(res => res.json())
      .then(data => setPropiedades(data.content || []))
      .catch(err => console.error('Error cargando propiedades:', err));
  }, []);

  return (
    <div>
      <h1>Propiedades</h1>
      {propiedades.length === 0 ? (
        <p>No se encontraron propiedades.</p>
      ) : (
        propiedades.map((prop, i) => (
          <div key={i}>
            <h2>{prop.title}</h2>
            <p>Precio: {prop.price}</p>
            {prop.photos?.[0] && (
              <img src={prop.photos[0]} alt={prop.title} width="300" />
            )}
          </div>
        ))
      )}
    </div>
  );
}
