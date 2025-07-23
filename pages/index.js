export async function getServerSideProps() {
  const res = await fetch('http://localhost:3000/api/propiedades');
  const propiedades = await res.json();

  return {
    props: { propiedades },
  };
}

export default function Home({ propiedades }) {
  return (
    <div>
      <h1>Propiedades</h1>
      <ul>
        {propiedades.map((prop) => (
          <li key={prop.public_id}>
            <strong>{prop.title}</strong> – {prop.location.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
