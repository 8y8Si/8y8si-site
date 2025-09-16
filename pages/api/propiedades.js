// /pages/api/propiedades.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.EASYBROKER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Falta EASYBROKER_API_KEY en Vercel' });
    }

    const {
      operation = '',   // 'rental' | 'sale' | ''
      type = '',        // 'departamento','casa','oficina', ...
      priceMin = '',
      priceMax = '',
      currency = '',    // 'MXN' | 'USD' | 'EUR' | ''
      meta = ''         // 'types' => devuelve metadatos
    } = req.query;

    const headers = { 'X-Authorization': apiKey, Accept: 'application/json' };
    const BASE_URL = 'https://api.easybroker.com/v1/properties';

    // ---------- Helpers ----------
    const normalizeOp = (op) => {
      const v = String(op || '').toLowerCase().trim();
      if (['renta', 'rent', 'rental'].includes(v)) return 'rental';
      if (['venta', 'sale', 'sell'].includes(v)) return 'sale';
      if (['rental','sale'].includes(v)) return v;
      return '';
    };

    const normalizeCurrency = (c) => {
      const v = String(c || '').toUpperCase().replace(/\s+/g, '').replace(/\./g, '');
      if (['MXN','MN','MX$','MXN$','PESOSMXN','MNMEX','$','$MXN','$M'].includes(v)) return 'MXN';
      if (['USD','US$','USD$','DOLARES','DÓLARES'].includes(v)) return 'USD';
      if (['EUR','€','EUR$'].includes(v)) return 'EUR';
      return v || 'MXN';
    };

    const opWanted = normalizeOp(operation);
    const typeWanted = String(type || '').toLowerCase().trim();
    const currencyWanted = currency ? normalizeCurrency(currency) : '';
    const min = priceMin ? parseInt(priceMin, 10) : null;
    const max = priceMax ? parseInt(priceMax, 10) : null;

    // ---------- Paginación: SIEMPRE publicadas ----------
    let page = 1;
    const limit = 50;
    let all = [];
    while (true) {
      const url = `${BASE_URL}?page=${page}&limit=${limit}&status=published`;
      const r = await fetch(url, { headers });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`EasyBroker ${r.status} ${txt}`);
      }
      const data = await r.json();
      const content = data.content || data.properties || [];
      all = all.concat(content);

      const nextByField = data?.pagination?.next_page;
      const hasMoreByTotals = data?.pagination?.page < data?.pagination?.total_pages;
      if (!nextByField && !hasMoreByTotals) break;
      page = nextByField || (data?.pagination?.page + 1);
    }

    // ---------- Metadatos para selects ----------
    if (String(meta).toLowerCase() === 'types') {
      const types = new Set();
      const ops = new Set();
      const currs = new Set();

      al
