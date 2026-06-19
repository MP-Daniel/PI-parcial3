import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cart as cartApi, checkout as checkoutApi } from '../api';
import { useCart } from '../context/cartStore';
import { CreditCard, Lock, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function Checkout() {
  const [cartData, setCartData] = useState({ items: [], total: 0, count: 0 });
  const [form, setForm] = useState({ card_name: '', card_number: '', expiry: '', cvv: '' });
  const [status, setStatus] = useState('idle'); // idle | processing | approved | declined
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const cartCtx = useCart();

  useEffect(() => {
    cartApi.get().then((d) => {
      setCartData(d);
      if (d.items.length === 0) navigate('/cart');
    });
  }, [navigate]);

  // Formateadores de entrada (solo visual, académico)
  const onCardNumber = (v) =>
    setForm({ ...form, card_number: v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim() });
  const onExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    setForm({ ...form, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d });
  };
  const onCvv = (v) => setForm({ ...form, cvv: v.replace(/\D/g, '').slice(0, 4) });

  const fillTest = (type) => {
    setForm({
      card_name: 'CLIENTE DEMO',
      card_number: type === 'ok' ? '4242 4242 4242 4242' : '4000 0000 0000 0002',
      expiry: '12/30',
      cvv: '123',
    });
  };

  const pay = async () => {
    setError('');
    setStatus('processing');
    // Retardo artificial para simular la pasarela (académico)
    await new Promise((r) => setTimeout(r, 1600));
    try {
      const res = await checkoutApi.pay(form);
      setResult(res);
      setStatus('approved');
      cartCtx.refresh();
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 402) {
        setStatus('declined');
        setError(data?.message || 'Pago rechazado');
      } else {
        setStatus('idle');
        setError(data?.message || 'Error al procesar el pago');
      }
    }
  };

  // ---------- Pantalla de éxito ----------
  if (status === 'approved' && result) {
    return (
      <div className="container">
        <div className="card receipt">
          <CheckCircle2 size={64} color="var(--success)" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>¡Pago aprobado!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Tu compra se registró correctamente.</p>

          <div className="receipt-box">
            <div className="summary-row"><span>Orden N°</span><strong>#{result.order_id}</strong></div>
            <div className="summary-row"><span>Transacción</span><strong>{result.transaction_id}</strong></div>
            <div className="summary-row"><span>Tarjeta</span><strong>•••• {result.card_last4}</strong></div>
            <div className="summary-divider" />
            {result.items.map((it, i) => (
              <div className="summary-row" key={i}>
                <span>{it.name} × {it.quantity}</span>
                <span>${(it.price * it.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="summary-divider" />
            <div className="summary-row summary-total"><span>Total pagado</span><span>${result.total.toFixed(2)}</span></div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => navigate('/orders')}>Ver mis compras</button>
            <button className="btn" onClick={() => navigate('/')}>Seguir comprando</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Formulario de pago ----------
  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Pago</h1>
        <button className="btn btn-outline" onClick={() => navigate('/cart')} disabled={status === 'processing'}>
          <ArrowLeft size={18} /> Volver al carrito
        </button>
      </div>

      <div className="cart-layout">
        <div className="card" style={{ padding: '2rem' }}>
          <div className="gateway-header">
            <Lock size={16} /> Pasarela de pago segura (simulada)
          </div>

          {/* Tarjeta de crédito visual */}
          <div className="credit-card">
            <div className="cc-chip" />
            <div className="cc-number">{form.card_number || '•••• •••• •••• ••••'}</div>
            <div className="cc-bottom">
              <div><span className="cc-label">Titular</span><div>{form.card_name || 'NOMBRE APELLIDO'}</div></div>
              <div><span className="cc-label">Vence</span><div>{form.expiry || 'MM/AA'}</div></div>
            </div>
          </div>

          <div className="test-cards">
            <span>Tarjetas de prueba:</span>
            <button type="button" className="chip chip-ok" onClick={() => fillTest('ok')}>Aprobar 4242…</button>
            <button type="button" className="chip chip-bad" onClick={() => fillTest('bad')}>Rechazar 4000…0002</button>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre del titular</label>
            <input className="form-control" value={form.card_name}
              onChange={(e) => setForm({ ...form, card_name: e.target.value.toUpperCase() })}
              placeholder="COMO APARECE EN LA TARJETA" disabled={status === 'processing'} />
          </div>
          <div className="form-group">
            <label className="form-label">Número de tarjeta</label>
            <input className="form-control" value={form.card_number} inputMode="numeric"
              onChange={(e) => onCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" disabled={status === 'processing'} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Expiración (MM/AA)</label>
              <input className="form-control" value={form.expiry} inputMode="numeric"
                onChange={(e) => onExpiry(e.target.value)} placeholder="12/30" disabled={status === 'processing'} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">CVV</label>
              <input className="form-control" value={form.cvv} inputMode="numeric"
                onChange={(e) => onCvv(e.target.value)} placeholder="123" disabled={status === 'processing'} />
            </div>
          </div>

          {status === 'declined' && (
            <div className="error-msg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <XCircle size={18} /> {error}
            </div>
          )}
          {error && status !== 'declined' && <div className="error-msg">{error}</div>}

          <button className="btn" style={{ width: '100%', marginTop: '1.5rem' }} onClick={pay} disabled={status === 'processing'}>
            {status === 'processing'
              ? <><Loader2 size={18} className="spin" /> Procesando pago...</>
              : <><CreditCard size={18} /> Pagar ${cartData.total.toFixed(2)}</>}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Demostración académica. No se procesan pagos reales ni se almacenan datos de tarjeta.
          </p>
        </div>

        <div className="cart-summary card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>Tu pedido</h3>
          {cartData.items.map((it) => (
            <div className="summary-row" key={it.product_id}>
              <span>{it.name} × {it.quantity}</span><span>${it.subtotal.toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-divider" />
          <div className="summary-row summary-total"><span>Total</span><span>${cartData.total.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
