// /pages/api/propiedades.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.EASYBROKER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Falta EASYBROKER_API_KEY en Vercel' });
    }

    const {
      operation = '',   // 'renta'|'rental'|'rent'|'venta'|'sale'|''
      type = '',        // 'departamento','casa','oficina','bodega', etc. (tal como lo entrega EB; comparamos en lower)
      priceMin = '',
      priceMax = '',
      currency = '',    // 'MXN' | 'USD' | 'EUR' | '' (todas)
      meta = ''         // 'types' -> devuelve metadata (tipos/operaciones/monedas) en lugar de items
    } = req.query;

    const headers = { 'X-Authorization': apiKey, Accept: 'application/json' };
    const BASE_URL = 'https://api.easybroker.com/v1/properties';

    // ---------- Paginación robusta ----------
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
      const content = data.content || data.properties || [];
      all = all.concat(content);

      const nextByField = data?.pagination?.next_page;
      const hasMoreByTotals =
        data?.pagination?.page < data?.pagination?.total_pages;

      if (!nextByField && !hasMoreByTotals) break;
      page = nextByField || (data?.pagination?.page + 1);
    }

    // ---------- Solo metadata (para poblar filtros dinámicos) ----------
    if (String(meta).toLowerCase() === 'types') {
      const typeSet = new Set();
      const opSet = new Set();
      const currSet = new Set();

      all.forEach((p) => {
        const pt = (p.property_type || '').trim();
        if (pt) typeSet.add(pt);

        const ops = Array.isArray(p.operations) ? p.operations : [];
        ops.forEach((o) => {
          const t = String(o.type || '').toLowerCase();  // 'rental' | 'sale'
          if (t) opSet.add(t);
          const c = String(o.currency || '').toUpperCase(); // 'MXN' | 'USD' | 'EUR'...
          if (c) currSet.add(c);
        });
      });

      return res.status(200).json({
        types: Array.from(typeSet).sort(),
        operations: Array.from(opSet).sort(),
        currencies: Array.from(currSet).sort()
      });
    }

    // ---------- Normalizaciones ----------
    const normalizeOp = (op) => {
      const v = String(op || '').toLowerCase().trim();
      if (['renta', 'rent', 'rental'].includes(v)) return 'rental';
      if (['venta', 'sale', 'sell'].includes(v)) return 'sale';
      return '';
    };
    const opWanted = normalizeOp(operation);
    const typeWanted = String(type || '').toLowerCase().trim();
    const currencyWanted = String(currency || '').toUpperCase().trim(); // MXN|USD|EUR|''

    const min = priceMin ? parseInt(priceMin, 10) : null;
    const max = priceMax ? parseInt(priceMax, 10) : null;

    // ---------- Filtros ----------
    const filtered = all.filter((p) => {
      const ops = Array.isArray(p.operations) ? p.operations : [];
      const propType = String(p.property_type || '').toLowerCase();

      // Operación
      const opMatch =
        !opWanted || ops.some((o) => String(o.type || '').toLowerCase() === opWanted);

      // Tipo
      const typeMatch = !typeWanted || propType === typeWanted;

      // Conjunto candidato para precio/moneda
      let cand = ops;
      if (opWanted) cand = cand.filter((o) => String(o.type || '').toLowerCase() === opWanted);
      if (currencyWanted) cand = cand.filter((o) => String(o.currency || '').toUpperCase() === currencyWanted);

      const opForPrice = cand[0] || ops[0];
      const price =
        opForPrice && typeof opForPrice.amount === 'number'
          ? opForPrice.amount
          : null;

      // Si se pidió moneda específica, y ninguna operación coincide, no pasa
      const currencyMatch = !currencyWanted ||
        (opForPrice && String(opForPrice.currency || '').toUpperCase() === currencyWanted);

      // Rango de precio (SIN conversión de moneda)
      let okPrice = true;
      if (min !== null && price !== null) okPrice = okPrice && price >= min;
      if (max !== null && price !== null) okPrice = okPrice && price <= max;

      return opMatch && typeMatch && currencyMatch && okPrice;
    });

    // ---------- Mapeo de salida ----------
    const items = filtered.map((p) => {
      const ops = Array.isArray(p.operations) ? p.operations : [];
      // Selecciona operación priorizando lo solicitado
      let sel = ops[0] || null;
      if (opWanted) {
        sel = ops.find((o) => String(o.type || '').toLowerCase() === opWanted) || sel;
      }
      if (currencyWanted) {
        sel = (ops.find((o) =>
          String(o.type || '').toLowerCase() === (opWanted || String(sel?.type || '').toLowerCase()) &&
          String(o.currency || '').toUpperCase() === currencyWanted
        )) || sel;
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
        currency: String(sel?.currency || 'MXN').toUpperCase(),
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
