// /pages/index.js
import { useEffect, useState } from 'react';

function formatCurrency(n, currency = 'MXN') {
  if (typeof n !== 'number') return 'Precio a consultar';
  try {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${n.toLocaleString('es-MX')} ${currency}`;
  }
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Metadatos para selects
  const [tipos, setTipos] = useState([]);            // ['Todos','Casa','Departamento',...]
  const [opsDisponibles, setOpsDisponibles] = useState([]); // ['rental','sale']
  const [monedas, setMonedas] = useState([]);        // ['Todas','MXN','USD','EUR',...]

  // Filtros UI
  const [filtro, setFiltro] = useState({
    operacionUI: 'Todas',    // 'Todas' | 'Renta' | 'Venta'
    tipoUI: 'Todos',         // 'Todos' | (tipos reales de EB)
    monedaUI: 'Todas',       // 'Todas' | 'MXN' | 'USD' | 'EUR'
    precioMin: '',
    precioMax: ''
  });

  const onChange = (e) => setFiltro((f) => ({ ...f, [e.target.name]: e.target.value }));

  // UI → API
  const uiToApiOperation = (ui) => (ui === 'Renta' ? 'rental' : ui === 'Venta' ? 'sale' : '');
  const uiToApiCurrency = (ui) => (ui === 'Todas' ? '' : ui); // MXN|USD|EUR|''

  // Cargar tipos/monedas disponibles
  const fetchTipos = async () => {
    try {
      const r = await fetch('/api/propiedades?meta=types');
      const d = await r.json();
      setTipos(['Todos', ...(d.types || [])]);
      setOpsDisponibles(d.operations || []);
      const currs = (d.currencies || []).filter(Boolean).map((c) => String(c).toUpperCase());
      const base = new Set(['MXN','USD','EUR', ...currs]);
      setMonedas(['Todas', ...Array.from(base)]);
    } catch (e) {
      console.error(e);
      setTipos(['Todos','Casa','Departamento']);
      setOpsDisponibles(['rental','sale']);
      setMonedas(['Todas','MXN','USD','EUR']);
    }
  };

  // Traer propiedades
  const fetchProps = async (withFilters = false) => {
    setLoading(true); setErr('');
    try {
      const params = new URLSearchParams();

      if (withFilters) {
        const op = uiToApiOperation(filtro.operacionUI);
        const tipoUi = filtro.tipoUI;
        const tp = tipoUi && tipoUi !== 'Todos' ? tipoUi.toLowerCase() : '';
        const curr = uiToApiCurrency(filtro.monedaUI);
        const min = filtro.precioMin.trim();
        const max = filtro.precioMax.trim();

        if (op) params.set('operation', op);
        if (tp) params.set('type', tp);
        if (curr) params.set('currency', curr);         // 👈 moneda
        if (min) params.set('priceMin', parseInt(min, 10));
        if (max) params.set('priceMax', parseInt(max, 10));
      }

      const url = `/api/propiedades${params.toString() ? `?${params.toString()}` : ''}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setItems(d.items || []);
    } catch (e) {
      console.error(e);
      setErr('Ocurrió un error cargando las propiedades.');
    } finally {
      setLoading(false);
    }
  };

  // Inicial
  useEffect(() => {
    fetchTipos();
    fetchProps(false); // sin filtros al cargar
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 40, marginBottom: 24 }}>Propiedades disponibles en venta o renta</h1>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <select name="operacionUI" value={filtro.operacionUI} onChange={onChange} style={{ padding: 8 }}>
          <option value="Todas">Todas</option>
          {opsDisponibles.includes('rental') && <option value="Renta">Renta</option>}
          {opsDisponibles.includes('sale') && <option value="Venta">Venta</option>}
        </select>

        <select name="tipoUI" value={filtro.tipoUI} onChange={onChange} style={{ padding: 8 }}>
          {tipos.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select name="monedaUI" value={filtro.monedaUI} onChange={onChange} style={{ padding: 8 }}>
          {monedas.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <input
          name="precioMin"
          value={filtro.precioMin}
          onChange={onChange}
          placeholder="Precio mínimo"
          inputMode="numeric"
          style={{ padding: 8 }}
        />
        <input
          name="precioMax"
          value={filtro.precioMax}
          onChange={onChange}
          placeholder="Precio máximo"
          inputMode="numeric"
          style={{ padding: 8 }}
        />

        <button onClick={() => fetchProps(true)} style={{ padding: '8px 14px', cursor: 'pointer' }}>
          Aplicar
        </button>
        <button
          onClick={() => {
            setFiltro({ operacionUI: 'Todas', tipoUI: 'Todos', monedaUI: 'Todas', precioMin: '', precioMax: '' });
            fetchProps(false);
          }}
          style={{ padding: '8px 14px', cursor: 'pointer' }}
        >
          Limpiar
        </button>
      </div>

      {/* Estado */}
      {loading && <p>Cargando propiedades…</p>}
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      {!loading && !err && items.length === 0 && <p>No se encontraron propiedades disponibles.</p>}

      {/* Grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16
      }}>
        {items.map((p) => (
          <article key={p.id} style={{
            border: '1px solid #eee',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            {p.image ? (
              <img src={p.image} alt={p.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: 180, background: '#f5f5f5' }} />
            )}
            <div style={{ padding: 12 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>{p.title || p.property_type}</h3>
              <div style={{ color: '#666', fontSize: 14, marginBottom: 6 }}>{p.location}</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {p.operation?.toUpperCase()} • {formatCurrency(p.amount, p.currency)}
              </div>
              <div style={{ color: '#444', fontSize: 14 }}>
                {p.bedrooms ?? '-'} rec • {p.bathrooms ?? '-'} baños • {p.parking_spaces ?? '-'} est
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
