// /pages/api/propiedades.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.EASYBROKER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Falta EASYBROKER_API_KEY en Vercel' });

    const {
      operation = '',   // acepta 'renta'|'rental'|'rent' y 'venta'|'sale'
      type = '',        // acepta 'departamento'|'casa'... (coincidirá con lo que devuelva EB)
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
      if (!r.ok) throw new Error(`EasyBroker ${r.status} ${await r.text()}`);
      const data = await r.json();

      all = all.concat(data.content || data.properties || []);

      const nextByField = data?.pagination?.next_page;
      const hasMoreByTotals = data?.pagination?.page < data?.pagination?.total_pages;
      if (!nextByField && !hasMoreByTotals) break;

      page = nextByField || (data?.pagination?.page + 1);
    }

    // --- Normalización de operación (mapea a lo que devuelve EB) ---
    const normalizeOp = (op) => {
      const v = (op || '').toLowerCase().trim();
      if (['renta', 'rent', 'rental'].includes(v)) return 'rental';
      if (['venta', 'sale', 'sell'].includes(v)) return 'sale';
      return '';
    };
    const opWanted = normalizeOp(operation);

    // --- Normalización de tipo (compara en minúsculas tal cual lo entrega EB) ---
    const typeWanted = (type || '').toLowerCase().trim();

    const min = priceMin ? parseInt(priceMin, 10) : null;
    const max = priceMax ? parseInt(priceMax, 10) : null;

    const filtered = all.filter((p) => {
      const ops = Array.isArray(p.operations) ? p.operations : [];
      const propType = (p.property_type || '').toLowerCase();

      // operación
      const opMatch = !opWanted || ops.some((o) => (o.type || '').toLowerCase() === opWanted);

      // tipo (coincidencia exacta con lo que entrega EB: 'departamento', 'casa', etc.)
      const typeMatch = !typeWanted || propType === typeWanted;

      // precio (usa la operación pedida; si no, la primera disponible)
      let okPrice = true;
      let cand = ops;
      if (opWanted) cand = ops.filter((o) => (o.type || '').toLowerCase() === opWanted);
      const opForPrice = cand[0] || ops[0];
      const price = (opForPrice && typeof opForPrice.amount === 'number') ? opForPrice.amount : null;

      if (min !== null && price !== null) okPrice = okPrice && price >= min;
      if (max !== null && price !== null) okPrice = okPrice && price <= max;

      return opMatch && typeMatch && okPrice;
    });

    const items = filtered.map((p) => {
      const ops = Array.isArray(p.operations) ? p.operations : [];
      const opSel = opWanted
        ? ops.find((o) => (o.type || '').toLowerCase() === opWanted) || ops[0]
        : ops[0];

      const img =
        p.title_image_full ||
        p.title_image ||
        (Array.isArray(p.property_images) && p.property_images[0]?.url) ||
        (p.photos && p.photos[0]?.url) || null;

      return {
        id: p.public_id || p.id,
        title: p.title || '',
        location: p.location || p.address || '',
        property_type: p.property_type || '',
        operation: opSel?.type || '',
        amount: opSel?.amount ?? null,
        currency: opSel?.currency || 'MXN',
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        parking_spaces: p.parking_spaces ?? null,
        constructed_area: p.construction_size ?? p.construction_m2 ?? null,
        image: img
      };
    });

    res.status(200).json({ count: items.length, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Internal error' });
  }
}
