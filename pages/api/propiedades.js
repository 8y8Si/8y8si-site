// /pages/api/propiedades.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.EASYBROKER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Falta EASYBROKER_API_KEY en Vercel' });
    }

    const {
      operation = '',   // 'renta'|'rental'|'rent'|'venta'|'sale'|'' (todas)
      type = '',        // ej. 'departamento','casa','oficina'... (comparamos en lower)
      priceMin = '',
      priceMax = '',
      currency = '',    // 'MXN'|'USD'|'EUR'|'' (todas)
      meta = ''         // 'types' => devuelve solo metadatos (tipos/operaciones/monedas)
    } = req.query;

    const headers = { 'X-Authorization': apiKey, Accept: 'application/json' };
    const BASE_URL = 'https://api.easybroker.com/v1/properties';

    // -------- Paginación robusta (trae todo status=published) --------
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

    // -------- Metadatos para poblar filtros dinámicos --------
    if (String(meta).toLowerCase() === 'types') {
      const types = new Set();
      const ops = new Set();
      const currs = new Set();
      all.forEach(p => {
        const pt = (p.property_type || '').trim();
        if (pt) types.add(pt);
        const o = Array.isArray(p.operations) ? p.operations : [];
        o.forEach(x => {
          const t = String(x.type || '').toLowerCase();
          if (t) ops.add(t);
          const c = normalizeCurrency(x.currency);
          if (c) currs.add(c);
        });
      });
      return res.status(200).json({
        types: Array.from(types).sort(),           // Ej: ['Casa','Departamento','Oficina',...]
        operations: Array.from(ops).sort(),        // ['rental','sale']
        currencies: Array.from(currs).sort()       // ['MXN','USD','EUR',...]
      });
    }

    // -------- Normalizaciones de filtros --------
    const opWanted = normalizeOp(operation);
    const typeWanted = String(type || '').toLowerCase().trim();
    const currencyWanted = currency ? normalizeCurrency(currency) : ''; // MXN|USD|EUR|''

    const min = priceMin ? parseInt(priceMin, 10) : null;
    const max = priceMax ? parseInt(priceMax, 10) : null;

    // -------- Filtro servidor --------
    const filtered = all.filter((p) => {
      const ops = Array.isArray(p.operations) ? p.operations : [];
      const propType = String(p.property_type || '').toLowerCase();

      const opMatch =
        !opWanted || ops.some(o => String(o.type || '').toLowerCase() === opWanted);

      const typeMatch = !typeWanted || propType === typeWanted;

      let cand = ops;
      if (opWanted) cand = cand.filter(o => String(o.type || '').toLowerCase() === opWanted);
      if (currencyWanted) cand = cand.filter(o => normalizeCurrency(o.currency) === currencyWanted);

      const sel = cand[0] || ops[0];
      const price = (sel && typeof sel.amount === 'number') ? sel.amount : null;
      const currOk = !currencyWanted || (sel && normalizeCurrency(sel.currency) === currencyWanted);

      let okPrice = true;
      if (min !== null && price !== null) okPrice = okPrice && price >= min;
      if (max !== null && price !== null) okPrice = okPrice && price <= max;

      return opMatch && typeMatch && currOk && okPrice;
    });

    // -------- Mapeo uniforme para el frontend --------
    const items = filtered.map((p) => {
      const ops = Array.isArray(p.operations) ? p.operations : [];
      let sel = ops[0] || null;
      if (opWanted) sel = ops.find(o => String(o.type || '').toLowerCase() === opWanted) || sel;
      if (currencyWanted) {
        const byCurr = ops.find(o =>
          (!opWanted || String(o.type || '').toLowerCase() === opWanted) &&
          normalizeCurrency(o.currency) === currencyWanted
        );
        sel = byCurr || sel;
      }

      const img =
        p.title_image_full ||
        p.title_image ||
        (Array.isArray(p.property_images) && p.property_images[0]?.url) ||
        (p.photos && p.photos[0]?.url) ||
        null;

      return {
        id: p.public_id || p.id,
        title: p.title || '',
        location: p.location || p.address || '',
        property_type: p.property_type || '',
        operation: sel?.type || '',
        amount: sel?.amount ?? null,
        currency: normalizeCurrency(sel?.currency || 'MXN'),
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        parking_spaces: p.parking_spaces ?? null,
        constructed_area: p.construction_size ?? p.construction_m2 ?? null,
        image: img
      };
    });

    return res.status(200).json({ count: items.length, items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
