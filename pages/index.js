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

// Mapa de etiquetas internas -> texto en español para mostrar en UI
const STATUS_LABEL = {
  'published': 'Publicada',
  'not_published': 'No publicada',
  'reserved': 'Reservada',
  'sold_rented': 'Vendida o Rentada',
  'suspended': 'Suspendida',
  'flagged': 'Marcada para revisión'
};

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Metadatos para selects
  const [tipos, setTipos] = useState([]);
  const [opsDisponibles, setOpsDisponibles] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // Filtros UI
  const [filtro, setFiltro] = useState({
    operacionUI: 'Todas',    // 'Todas' | 'Renta' | 'Venta'
    tipoUI: 'Todos',         // 'Todos' | tipos reales
    monedaUI: 'Todas',       // 'Todas' | 'MXN' | 'USD' | 'EUR'
    statusUI: 'Todos',       // 'Todos' | (las claves internas: published, reserved, ...)
    precioMin: '',
    precioMax: ''
  });

  const onChange = (e) => setFiltro((f) => ({ ...f, [e.target.name]: e.target.value }));

  /
