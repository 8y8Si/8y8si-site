// /pages/api/propiedades.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.EASYBROKER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Falta EASYBROKER_API_KEY en Vercel' });
    }

    const {
      operation = '',
      type = '',
      priceMin = '',
      priceMax = '',
      currency = '',
      status = '',
      meta = ''
    } = req.query;

    const headers = { 'X-Authorization': apiKey, Accept: 'application/json' };
    const BASE_URL = 'https://api.easybroker.com/v1/properties';

    const normalizeOp = (op) => {
      const v = String(op || '').toLowerCase().trim();
      if (['renta', 'rent', 'rental'].includes(v)) return 'rental';
      if (['venta', 'sale', 'sell'].includes(v)) return 'sale';
      return '';
    };

    const normalizeCurrency = (c) => {
      const v = String(c || '').toUpperCase().replace(/\s+/g, '').replace(/\./g, '');
      if (['MXN', 'MN', 'MX$', 'MXN$', 'PESOSMXN', 'MNMEX'].includes(v)) return 'MXN';
      if (['USD', 'US$', 'USD$', 'DOLARES', 'DÓLARES'].includes(v)) return 'USD';
      if (['EUR', '€', 'EUR$'].includes(v)) return 'EUR';
      if (v === '$' || v === '$MXN' || v === '$M') return 'MXN';
      return v || 'MXN';
    };

    const normalizeStatus = (s) => {
      const v = String(s || '').toLowerCase().trim();
      if (['publicada','published'].includes(v)) return 'published';
      if (['no publicada','not_published'].includes(v)) return 'not_published';
      if (['reservada','reserved'].includes(v)) return 'reserved';
      if (['vendida o rentada','sold_rented','sold','rented'].includes(v)) return 'sold_rented';
      if (['suspendida','suspended'].includes(v)) return 'suspended';
      if (['marcada para revisión','flagged'].includes(v)) return 'flagged';
      return '';
    };

    const opWanted = normalizeOp(operation);
    const typeWanted = String(type || '').toLowerCase().trim();
    const currencyWanted = currency ? normalizeCurrency(currency) : '';
    const statusWanted = normalizeStatus(status);

    const min = priceMin ? parseInt(priceMin, 10) : null;
    const max = priceMax ? parseInt(priceMax, 10) : null;

    // ---- Paginación ----
    let page = 1;
    const limit = 50;
    let all = [];
    while (true) {
      const qsStatus = statusWanted === 'published' ? '&status=published' : '';
      const url = `${BASE_URL}?page=${page}&limit=${limit}${qsStatus}`;
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

    // ---- Metadatos ----
    if (String(meta).toLowerCase() === 'types') {
      const types = new Set();
      const ops = new Set();
      const currs = new Set();
      const statuses = new Set();

      all.forEach((p) => {
        if (p.property_type) types.add(p.property_type.trim());

        const o = Array.isArray(p.operations) ? p.operations : [];
        o.forEach((x) => {
          if (x.type) ops.add(String(x.type).toLowerCase());
          if (x.currency) currs.add(normalizeCurrency(x.currency));
        });

        const rawStatus = String(p.status ?? '').toLowerCase().trim();
        const norm = normalizeStatus(rawStatus);
        if (norm) statuses.add(norm);
      });

      return res.status(200).json({
        types: Array.from(types).sort(),
        operations: Array.from(ops).sort(),
        currencies: Array.from(currs).sort(),
        statuses: Array.from(statuses).sort()
      });
    }

    // ---- Filtros ----
    const statusFiltered = all.filter((p) => {
      if (!statusWanted || statusWanted === 'published') return true;
      const raw = String(p.status ?? '').toLowerCase().trim();
      const norm = normalizeStatus(raw);
      if (statusWanted === 'sold_rented') {
        return ['sold_rented','sold','rented'].includes(norm) || ['sold','rented'].includes(raw);
      }
      return norm === statusWanted;
    });

    const filtered = statusFiltered.filter((p) => {
      const ops = Array.isArray(p.operations) ? p.operations : [];
      const propType = String(p.property_type || '').toLowerCase();

      const opMatch = !opWanted || ops.some((o) => String(o.type || '').toLowerCase() === opWanted);
      const typeMatch = !typeWanted || propType === typeWanted;

      let cand = ops;
      if (opWanted) cand = cand.filter((o) => String(o.type || '').toLowerCase() === opWanted);
      if (currencyWanted) cand = cand.filter((o) => normalizeCurrency(o.currency) === currencyWanted);

      const sel = cand[0] || ops[0];
      const price = sel?.amount ?? null;
      const currOk = !currencyWanted || (sel && normalizeCurrency(sel.currency) === currencyWanted);

      let okPrice = true;
      if (min !== null && price !== null) okPrice = okPrice && price >= min;
      if (max !== null && price !== null) okPrice = okPrice && price <= max;

      return opMatch && typeMatch && currOk && okPrice;
    });

    const items = filtered.map((p) => {
      const ops = Array.isArray(p.operations) ? p.operations : [];
      let sel = ops[0] || null;
      if (opWanted) sel = ops.find((o) => String(o.type || '').toLowerCase() === opWanted) || sel;
      if (currencyWanted) {
        const byCurr = ops.find(
          (o) =>
            (!opWanted || String(o.type || '').toLowerCase() === opWanted) &&
            normalizeCurrency(o.currency) === currencyWanted
        );
        sel = byCurr || sel;
      }

      const img =
        p.title_image_full ||
        p.title_image ||
        (Array.isArray(p.property_images) && p.property_images[0]?.url) ||
        null;

      const rawStatus = String(p.status ?? '').toLowerCase().trim();

      return {
        id: p.public_id || p.id,
        title: p.title || '',
        location: p.location || '',
        property_type: p.property_type || '',
        operation: sel?.type || '',
        amount: sel?.amount ?? null,
        currency: normalizeCurrency(sel?.currency || 'MXN'),
        status: normalizeStatus(rawStatus) || rawStatus || '',
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        parking_spaces: p.parking_spaces ?? null,
        constructed_area: p.construction_size ?? null,
        image: img
      };
    });

    return res.status(200).json({ count: items.length, items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
