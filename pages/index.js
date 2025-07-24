export async function getServerSideProps() {
  const apiKey = process.env.EASYBROKER_API_KEY;

  if (!apiKey) {
    console.error("❌ EASYBROKER_API_KEY no está definida");
    return {
      props: {
        propiedades: [],
      },
    };
  }

  try {
    const res = await fetch("https://api.easybroker.com/v1/properties?status=published", {
      headers: {
        "X-Authorization": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("❌ Error en respuesta:", errorData);
      throw new Error(`Error ${res.status}`);
    }

    const data = await res.json();

    const propiedadesDisponibles = data.content?.filter(
      (p) =>
        p.operation_status === 'disponible' &&
        p.archived === false
    ) || [];

    return {
      props: {
        propiedades: propiedadesDisponibles,
      },
    };
  } catch (error) {
    console.error("❌ Error al obtener propiedades:", error.message);
    return {
      props: {
        propiedades: [],
      },
    };
  }
}
