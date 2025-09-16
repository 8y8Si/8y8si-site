// /pages/api/propiedades.js

export default async function handler(req, res) {
  try {
    const apiKey = process.env.EASYBROKER_API_KEY;
    const { operation = '', type = '', priceMin = '', priceMax = '' } = req.query;

    const headers = { 'X-Authorization': apiKey };
    const BASE_URL = 'https://api.easybroker.com/v1/properties';

    let page = 1;
    const limit = 50;
    let all = [];

    // 🔹 Paginación: trae todas las páginas publicadas
    while (true) {
      const url = `${BASE_URL}?status=published&page=${page}&limit=${limit}`;
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const t = await response.text();
        throw new Error(`Error EasyBroker: ${response.status} - ${t}`);
      }
      const data = await response.json();
      all = all.concat(data.content || []);

      const hasMore =
        (data.pagination && data.pagination.page < data.pagination.total_pages) ||
        (data.next_page && data.next_page !== null);

      if (!hasMore) break;
      page++;
    }

    // 🔹 Filtrado básico
    const opWanted = operation.toLowerCase(); // 'rent' | 'sale' | ''
    const parsedMin = priceMin ? parseInt(priceMin, 10) : null;
    const parsedMax = priceMax ? parseInt(priceMax, 10) : null;

    const filtered = all.filter((prop) => {
      const operations = Array.isArray(prop.operations) ? prop.operations : [];
      // operación
      const opMatch =
        !opWanted || operations.some((op) => (op.type || '').toLowerCase() === opWanted);
      // tipo
      const typeMatch =
        !type || (prop.property_type || '').toLowerCase() === type.toLowerCase();
      // precio
      let priceOk = true;
      let candidateOps = opWanted
        ? operations.filter((op) => (op.type || '').toLowerCase() === opWanted)
        : operations;
      const opForPrice = candidateOps[0] || operations[0];
      const price = opForPrice?.amount ?? null;
      if (parsedMin !== null && price !== null) priceOk = price >= parsedMin;
      if (parsedMax !== null && price !== null) priceOk = priceOk && price <= parsedMax;

      return opMatch && typeMatch && priceOk;
    });

    res.status(200).json({
      count: filtered.length,
      items: filtered.map((p) => {
        const operations = Array.isArray(p.operations) ? p.operations : [];
        const opSel = opWanted
          ? operations.find((op) => (op.type || '').toLowerCase() === opWanted) || operations[0]
          : operations[0];

        return {
          id: p.public_id,
          title: p.title || '',
          location: p.location || '',
          property_type: p.property_type || '',
          operation: opSel?.type || '',
          amount: opSel?.amount ?? null,
          currency: opSel?.currency || 'MXN',
          bedrooms: p.bedrooms ?? null,
          bathrooms: p.bathrooms ?? null,
          parking_spaces: p.parking_spaces ?? null,
          image:
            p.title_image_full ||
            p.title_image ||
            (Array.isArray(p.property_images) && p.property_images[0]?.url) ||
            null,
        };
      }),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
