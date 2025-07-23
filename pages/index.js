export async function getServerSideProps() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/propiedades`);
  const propiedades = await res.json();

  return {
    props: { propiedades },
  };
}

export default function Home({ propiedades }) {
  return (
    <div>
      <h1>Propiedades disponibles</h1>
      <ul>
        {propiedades.map((prop) => (
          <li key={prop.public_id}>
            <strong>{prop.title}</strong> — {prop.location.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
