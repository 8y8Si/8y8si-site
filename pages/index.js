// pages/index.js

export async function getServerSideProps(context) {
  const protocol = context.req.headers["x-forwarded-proto"] || "http";
  const host = context.req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/propiedades`);
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
