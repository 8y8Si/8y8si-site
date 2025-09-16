// /pages/api/propiedades.js
export default async function handler(req, res) {
  try {
    // ⚠️ La variable debe llamarse EXACTAMENTE así en Vercel: EASYBROKER_API_KEY
    const apiKey = process.env.EASYBROKER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Falta EASYBROKER_API_KEY en Vercel' });
    }

    const {
      operation = '',   // 'rent' | 'sale' | ''
      type = '',        // ej. 'apartment', 'house' (lo que devuelva EB)
      priceMin = '',
      priceMax = '',
      debug = '0'
    } = req.query;

    const headers = { 'X-Authorization': apiKey, 'Accept': 'application/json' };
    const BASE_URL = 'https://api.easybroker.com/v1/properties';

    // -------- Paginación robusta (usa pagination.next_page) --------
    let nextPage = 1;
    const limit = 50;
    let all = [];

    while (nextPage) {
      const url = `${BASE_URL}?status=published&page=${nextPage}&limit=${limit}`;
      const r = await fetch(url, { headers });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`EasyBroker ${r.status} - ${t}`);
      }
      const data = await r.json();
      const content = data.content || data.properties || [];
      all = all.concat(content);

      // EB suele traer esto: data.pagination = { page, total_pages, next_page }
      nextPage = data?.pagination?.next_page || null;
    }

    // -------- Modo DEBUG: ver qué trae tu cuenta --------
    if (debug === '1' || debug === 'true') {
      const opSet = new Set();
      const typeSet = new Set();
      let rentCount = 0, saleCount = 0;

      all.forEach(p => {
        const ops = Array.isArray(p.operations) ? p.operations : [];
        ops.forEach(op => {
          const t = (op.type || '').toLowerCase();
          if (t) opSet.add(t);
          if (t === 'rent') rentCount++;
          if (t === 'sale') saleCount++;
        });
        const pt = (p.property_type || '').toLowerCase();
        if (pt) typeSet.add(pt);
      });

      return res.status(200).json({
        total_recibidas: all.length,
        operaciones_detectadas: Array.from(opSet),
        tipos_detectados: Array.from(typeSet),
        conteo_ops: { rentCount, saleCount, ambas_en_mismo_listing: rentCount && saleCount ? 'posible' : 'revisar' },
        ejemplo_primera: all[0] || null,
      });
    }

    // -------- Filtros --------
    const opWanted = (operation || '').toLowerCase();          // 'rent' | 'sale' | ''
    const parsedMin = priceMin ? parseInt(priceMin, 10) : null;
    const parsedMax = priceMax ? parseInt(priceMax, 10) : null;

    const filtered = all.filter((prop) => {
      const operations = Array.isArray(prop.operations) ? prop.operations : [];

      // Operación: si pides rent/sale, debe existir en operations
      const opMatch = !opWanted || operations.some((op) => (op.type || '').toLowerCase() === opWanted);

      // Tipo (coincidencia exacta en minúsculas con lo que devuelve EB)
      const pType = (prop.property_type || '').toLowerCase();
      const typeMatch = !type || pType === type.toLowerCase();

      // Precio: toma la operación que coincide con opWanted (o la primera si no pediste)
      let priceOk = true;
      let candidateOps = operations;
      if (opWanted) {
        candidateOps = operations.filter((op) => (op.type || '').toLowerCase() === opWanted);
      }
      const opForPrice = candidateOps[0] || operations[0];
      const price = (opForPrice && typeof opForPrice.amount === 'number') ? opForPrice.amount : null;

      if (parsedMin !== null && price !== null) priceOk = priceOk && price >= parsedMin;
      if (parsedMax !== null && price !== null) priceOk = priceOk && price <= parsedMax;

      return opMatch && typeMatch && priceOk;
    });

    // -------- Mapeo de salida --------
    const items = filtered.map((p) => {
      const operations = Array.isArray(p.operations) ? p.operations : [];
      const opSel = opWanted
        ? operations.find((op) => (op.type || '').toLowerCase() === opWanted) || operations[0]
        : operations[0];

      // imagen principal: intenta varias rutas
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

    res.status(200).json({ count: items.length, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Internal error' });
  }
}
