// /pages/index.js
import { useEffect, useState } from 'react';

function formatCurrency(n, currency = 'MXN') {
  if (typeof n !== 'number') return 'Precio a consultar';
  try {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${n?.toLocaleString?.('es-MX') ?? n} ${currency}`;
  }
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [tipos, setTipos] = useState([]);
  const [opsDisponibles, setOpsDisponibles] = useState([]);
  const [monedas, setMonedas] = useState([]);

  const [filtro, setFiltro] = useState({
    operacionUI: 'Todas',   // 'Todas' | 'Renta' | 'Venta'
    tipoUI: 'Todos',        // 'Todos' | lista de tipos
    monedaUI: 'Todas',      // 'Todas' | 'MXN' | 'USD' | 'EUR'
    precioMin: '',
    precioMax: ''
  });

  const onChange = (e) => setFiltro((f) => ({ ...f, [e.target.name]: e.target.value }));

  // UI → API
  const uiToApiOperation = (ui) => (ui === 'Renta' ? 'rental' : ui === 'Venta' ? 'sale' : '');
  const uiToApiCurrency  = (ui) => (ui === 'Todas' ? '' : ui);

  // Metadatos para selects
  const fetchMeta = async () => {
    try {
      const r = await fetch('/api/propiedades?meta=types');
      const d = await r.json();
      setTipos(['Todos', ...(d.types || [])]);
      setOpsDisponibles(d.operations || []);
      const currs = (d.currencies || []).filter(Boolean).map((c) => String(c).toUpperCase());
      const base = new Set(['MXN', 'USD', 'EUR', ...currs]);
      setMonedas(['Todas', ...Array.from(base)]);
    } catch {
      // Defaults seguros
      setTipos(['Todos', 'Casa', 'Departamento']);
      setOpsDisponibles(['rental', 'sale']);
      setMonedas(['Todas', 'MXN', 'USD', 'EUR']);
    }
  };

  // Datos (siempre status=published en el backend)
  const fetchProps = async (withFilters = false) => {
    setLoading(true); setErr('');
    try {
      const params = new URLSearchParams();

      if (withFilters) {
        const op   = uiToApiOperation(filtro.operacionUI);
        const tipo = filtro.tipoUI && filtro.tipoUI !== 'Todos' ? filtro.tipoUI.toLowerCase() : '';
        const curr = uiToApiCurrency(filtro.monedaUI);
        const min  = filtro.precioMin.trim();
        const max  = filtro.precioMax.trim();

        if (op)   params.set('operation', op);
        if (tipo) params.set('type', tipo);
        if (curr) params.set('currency', curr);
        if (min)  params.set('priceMin', parseInt(min, 10));
        if (max)  params.set('priceMax', parseInt(max, 10));
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

  useEffect(() => {
    fetchMeta();
    fetchProps(false);
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 40, marginBottom: 24 }}>Propiedades publicadas en venta o renta</h1>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <select name="operacionUI" value={filtro.operacionUI} onChange={onChange} style={{ padding: 8 }}>
          <option value="Todas">Todas</option>
          {opsDisponibles.includes('rental') && <option value="Renta">Renta</option>}
          {opsDisponibles.includes('sale') && <option value="Venta">Venta</option>}
        </select>

        <select name="tipoUI" value={filtro.tipoUI} onChange={onChange} style={{ padding: 8 }}>
          {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select name="monedaUI" value={filtro.monedaUI} onChange={onChange} style={{ padding: 8 }}>
          {monedas.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <input
          name="precioMin" value={filtro.precioMin} onChange={onChange}
          placeholder="Precio mínimo" inputMode="numeric" style={{ padding: 8 }}
        />
        <input
          name="precioMax" value={filtro.precioMax} onChange={onChange}
          placeholder="Precio máximo" inputMode="numeric" style={{ padding: 8 }}
        />

        <button onClick={() => fetchProps(true)} style={{ padding: '8px 14px', cursor: 'pointer' }}>
          Aplicar
        </button>
        <button
          onClick={() => {
            setFiltro({ operacionUI: 'Todas', tipoUI: 'Todos',
