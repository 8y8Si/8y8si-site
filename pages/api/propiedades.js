// /pages/api/propiedades.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.EASYBROKER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Falta EASYBROKER_API_KEY en Vercel' });
    }

    const {
      operation = '',   // 'renta'|'rental'|'rent'|'venta'|'sale'|'' (indistinto)
      type = '',        // ej. 'departamento','casa','oficina'... (tal como lo entrega EB, en minúsculas)
      priceMin = '',
      priceMax = '',
      meta = ''         // 'types' -> devuelve metadata (tipos/operaciones) en lugar de items
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

      all.forEach((p) => {
        const pt = (p.property_type || '').trim();
        if (pt) typeSet.add(pt); // Conservamos mayúsculas/acentos EXACTOS de EasyBroker

        const ops = Array.isArray(p.operations) ? p.operations : [];
        ops.forEach((o) => {
          const t = String(o.type || '').toLowerCase();
          if (t) opSet.add(t);   // e.g. 'rental', 'sale'
        });
      });

      return res.status(200).json({
        types: Array.from(typeSet).sort(),         // ['Casa','Casa en condominio','Departamento',...]
        operations: Array.from(opSet).sort()       // ['rental','sale']
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
    const min = priceMin ? parseInt(priceMin, 10) : null;
    const max = priceMax ? parseInt(priceMax, 10) : null;

    // ---------- Filtros ----------
    const filtered = all.filter((p) => {
      const ops = Array.isArray(p.operations) ? p.operations : [];
      const propType = String(p.property_type || '').toLowerCase();

      const opMatch =
        !opWanted || ops.some((o) => String(o.type || '').toLowerCase() === opWanted);

      const typeMatch = !typeWanted || propType === typeWanted;

      let okPrice = true;
      let cand = ops;
      if (opWanted) {
        cand = ops.filter((o) => String(o.type || '').toLowerCase() === opWanted);
      }
      const opForPrice = cand[0] || ops[0];
      const price =
        opForPrice && typeof opForPrice.amount === 'number'
          ? opForPrice.amount
          : null;

      if (min !== null && price !== null) okPrice = okPrice && price >= min;
      if (max !== null && price !== null) okPrice = okPrice && price <= max;

      return opMatch && typeMatch && okPrice;
    });

    // ---------- Mapeo de salida ----------
    const items = filtered.map((p) => {
      const ops = Array.isArray(p.operations) ? p.operations : [];
      const opSel = opWanted
        ? (ops.find((o) => String(o.type || '').toLowerCase() === opWanted) || ops[0])
        : ops[0];

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

    return res.status(200).json({ count: items.length, items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
