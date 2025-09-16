// /pages/api/propiedades.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.EASYBROKER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Falta EASYBROKER_API_KEY en Vercel' });
    }

    const {
      operation = '',   // 'renta'|'rental'|'rent'|'venta'|'sale'|''
      type = '',        // 'departamento','casa','oficina',...
      priceMin = '',
      priceMax = '',
      currency = '',    // 'MXN'|'USD'|'EUR'|''
      status = '',      // ver normalizeStatus() abajo
      meta = ''         // 'types' => devuelve metadatos
    } = req.query;

    const headers = { 'X-Authorization': apiKey, Accept: 'application/json' };
    const BASE_URL = 'https://api.easybroker.com/v1/properties';

    // -------- Helpers --------
    const normalizeOp = (op) => {
      const v = String(op || '').toLowerCase().trim();
      if (['renta','rent','rental'].includes(v)) return 'rental';
      if (['venta','sale','sell'].includes(v)) return 'sale';
      return '';
    };

    const normalizeCurrency = (c) => {
      const v = String(c || '').toUpperCase().replace(/\s+/g,'').replace(/\./g,'');
      if (['MXN','MN','MX$','MXN$','PESOSMXN','MNMEX'].includes(v)) return 'MXN';
      if (['USD','US$','USD$','DOLARES','DÓLARES'].includes(v)) return 'USD';
      if (['EUR','€','EUR$'].includes(v)) return 'EUR';
      if (v === '$' || v === '$MXN' || v === '$M') return 'MXN';
      return v || 'MXN';
    };

    // Mapear las etiquetas de EB (UI) a etiquetas internas normalizadas
    // Usamos etiquetas "amigables" para UI: published, not_published, reserved, sold_rented, suspended, flagged
    const normalizeStatus = (s) => {
      const v = String(s || '').toLowerCase().trim();
      if (['publicada','published','publish','publicadas'].includes(v)) return 'published';
      if (['no publicada','nopublicada','not_published','draft','no-publicada'].includes(v)) return 'not_published';
      if (['reservada','reserved','reserva'].includes(v)) return 'reserved';
      if (['vendida o rentada','vendida','rentada','sold','rented','sold_rented','vendida-rentada'].includes(v)) return 'sold_rented';
      if (['suspendida','suspended'].includes(v)) return 'suspended';
      if (['marcada para revisión','flagged','review','revisión','marcada','flagged_for_review'].includes(v)) return 'flagged';
      return ''; // todas
    };

    const opWanted = normalizeOp(operation);
    const typeWanted = String(type || '').toLowerCase().trim();
    const currencyWanted = currency ? normalizeCurrency(currency) : '';
    const statusWanted = normalizeStatus(status); // '' = todos

    const min = priceMin ? parseInt(priceMin, 10) : null;
    const max = priceMax ? parseInt(priceMax, 10) : null;

    // -------- Paginación (si pides solo 'published' lo filtramos desde la query) --------
    let page = 1;
    const limit = 50;
    let all = [];

    while (true) {
      // Si el usuario pidió 'published', pedimos solo publicadas
