// /pages/api/propiedades.js
export default async function handler(req, res) {
  try {
    // ⚠️ Debe existir en Vercel como EASYBROKER_API_KEY
    const apiKey = process.env.EASYBROKER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Falta EASYBROKER_API_KEY en Vercel' });
    }

    const {
      operation = '',   // acepta 'renta'|'rental'|'rent' y 'venta'|'sale'
      type = '',        // acepta 'departamento'|'casa'|'oficina'|'bodega'...
      priceMin = '',
      priceMax = ''
    } = req.query;

    const headers = { 'X-Authorization': apiKey, 'Accept': 'application/json' };
    const BASE_URL = 'https://api.easybroker.com/v1/properties';

    // --- Paginación robusta: soporta next_page y/o total_pages ---
    let page = 1;
    const limit = 50;
    let all = [];

    while (true) {
      const url = `${BASE_URL}?status=published&page=${page}&limit=${limit}`;
      const r = await fetch(url, { headers });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`EasyBroker ${r.status} ${txt}`);
      }
      const data = await r.json();

      all = all.concat(data.content || data.properties || []);

      const nextByField = data?.pagination?.next_page;
      const hasMoreByTotals =
        data?.pagination?.page < data?.pagination?.total_pages;

      if (!nextByField && !hasMoreByTotals) break;
      page = nextByField || (data?.pagination?.page + 1);
    }

    // --- Normalización de operación (mapea a lo que devuelve
