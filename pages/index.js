import React from 'react';

export default function Home({ propiedadesVenta, propiedadesRenta }) {
  return (
    <div>
      <h1>Propiedades disponibles en venta</h1>
      {propiedadesVenta.length === 0 ? (
        <p>No se encontraron propiedades en venta.</p>
      ) : (
        <ul>
          {propiedadesVenta.map((propiedad) => (
            <li key={propiedad.id}>
              <h2>{propiedad.title}</h2>
              {propiedad.title_image_full && (
                <img
                  src={propiedad.title_image_full}
                  alt={propiedad.title}
                  width={300}
                />
              )}
              <p>{propiedad.location}</p>
            </li>
          ))}
        </ul>
      )}

      <h1>Propiedades disponibles en renta</h1>
      {propiedadesRenta.length === 0 ? (
        <p>No se encontraron propiedades en renta.</p>
      ) : (
        <ul>
          {propiedadesRenta.map((propiedad) => (
            <li key={propiedad.id}>
              <h2>{propiedad.title}</h2>
              {propiedad.title_image_full && (
                <img
                  src={propiedad.title_image_full}
                  alt={propiedad.title}
                  width={300}
                />
              )}
              <p>{propiedad.location}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export async function getServerSideProps() {
  const apiKey = process.env.EASYBROKER_API_KEY;

  if (!apiKey) {
    console.error("❌ EASYBROKER_API_KEY no está definida");
    return {
      props: {
        propiedadesVenta: [],
        propiedadesRenta: [],
      },
    };
  }

  try {
    const [resVenta, resRenta] = await Promise.all([
      fetch(
        "https://api.easybroker.com/v1/properties?search[statuses][]=published&search[operation_type]=sale",
        {
          headers: {
            "X-Authorization": apiKey,
            "Content-Type": "application/json",
          },
        }
      ),
      fetch(
        "https://api.easybroker.com/v1/properties?search[statuses][]=published&search[operation_type]=rent",
        {
          headers: {
            "X-Authorization": apiKey,
            "Content-Type": "application/json",
          },
        }
      ),
    ]);

    if (!resVenta.ok || !resRenta.ok) {
      throw new Error("❌ Error al obtener propiedades de EasyBroker");
    }

    const dataVenta = await resVenta.json();
    const dataRenta = await resRenta.json();

    return {
      props: {
        propiedadesVenta: dataVenta.content || [],
        propiedadesRenta: dataRenta.content || [],
      },
    };
  } catch (error) {
    console.error("❌ Error en getServerSideProps:", error.message);
    return {
      props: {
        propiedadesVenta: [],
        propiedadesRenta: [],
      },
    };
  }
}
