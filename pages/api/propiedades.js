export default async function handler(req, res) {
  const apiKey = process.env.EASYBROKER_API_KEY;

  const response = await fetch('https://api.easybroker.com/v1/properties', {
    headers: {
      'X-Authorization': apiKey,
    },
  });

  const data = await response.json();

  // Te regreso todo para verificar que sí jala la API sin filtros
  res.status(200).json(data.content || []);
}
