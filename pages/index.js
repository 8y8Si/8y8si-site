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
    const res = await fetch(
      "https://api.easybroker.com/v1/properties?search[statuses][]=published&limit=50",
      {
        headers: {
          "X-Authorization": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error("❌ Error al obtener propiedades publicadas");
    }

    const data = await res.json();

    return {
      props: {
        propiedadesVenta: data.content || [],
        propiedadesRenta: [],
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
