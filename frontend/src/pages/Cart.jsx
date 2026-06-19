import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cart as cartApi } from '../api';
import { useCart } from '../context/cartStore';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, ArrowLeft } from 'lucide-react';

const FALLBACK = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop';

export default function Cart() {
  const [data, setData] = useState({ items: [], total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const cartCtx = useCart();

  const load = useCallback(async () => {
    try { setData(await cartApi.get()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sync = async (fn) => {
    setError('');
    try {
      const updated = await fn();
      setData(updated);
      cartCtx.refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar el carrito');
    }
  };

  const changeQty = (item, delta) => {
    const newQty = item.quantity + delta;
    sync(() => cartApi.setQty(item.product_id, newQty));
  };

  const remove = (item) => sync(() => cartApi.remove(item.product_id));
  const clear = () => sync(() => cartApi.clear());

  if (loading) return <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>Cargando carrito...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Mi Carrito</h1>
        <button className="btn btn-outline" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Seguir comprando
        </button>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {data.items.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={48} color="var(--text-muted)" />
          <p>Tu carrito está vacío.</p>
          <button className="btn" onClick={() => navigate('/')}>Ver productos</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {data.items.map((item) => (
              <div className="cart-row" key={item.product_id}>
                <img src={item.image_url || FALLBACK} alt={item.name} className="cart-thumb"
                  onError={(e) => { e.target.src = FALLBACK; }} />
                <div style={{ flex: 1 }}>
                  <h3 className="product-title" style={{ marginBottom: '0.25rem' }}>{item.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>${item.price.toFixed(2)} c/u</p>
                </div>
                <div className="qty-control">
                  <button onClick={() => changeQty(item, -1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => changeQty(item, 1)} disabled={item.quantity >= item.stock}><Plus size={14} /></button>
                </div>
                <div style={{ minWidth: 90, textAlign: 'right', fontWeight: 700 }}>${item.subtotal.toFixed(2)}</div>
                <button className="btn-icon-danger" onClick={() => remove(item)} title="Eliminar">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button className="btn btn-outline" style={{ marginTop: '1rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={clear}>
              <Trash2 size={16} /> Vaciar carrito
            </button>
          </div>

          <div className="cart-summary card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>Resumen</h3>
            <div className="summary-row"><span>Productos ({data.count})</span><span>${data.total.toFixed(2)}</span></div>
            <div className="summary-row"><span>Envío</span><span style={{ color: 'var(--success)' }}>Gratis</span></div>
            <div className="summary-divider" />
            <div className="summary-row summary-total"><span>Total</span><span>${data.total.toFixed(2)}</span></div>
            <button className="btn" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => navigate('/checkout')}>
              <CreditCard size={18} /> Proceder al pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
