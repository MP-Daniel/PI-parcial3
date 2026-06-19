import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlist as wishlistApi, cart as cartApi } from '../api';
import { useCart } from '../context/cartStore';
import { Heart, Trash2, ShoppingCart, History, Ban, PlusCircle, MinusCircle } from 'lucide-react';

const FALLBACK = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop';

export default function Wishlist() {
  const [tab, setTab] = useState('current');
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();
  const cartCtx = useCart();

  const load = useCallback(async () => {
    try {
      const [w, h] = await Promise.all([wishlistApi.get(), wishlistApi.history()]);
      setItems(w); setHistory(h);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const remove = async (id) => {
    await wishlistApi.remove(id);
    notify('Quitado de favoritos');
    load();
  };

  const addToCart = async (item) => {
    try {
      await cartApi.add(item.product_id, 1);
      cartCtx.refresh();
      notify(`"${item.name}" agregado al carrito`);
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo agregar');
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>Cargando favoritos...</div>;

  return (
    <div className="container">
      {toast && <div className="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Favoritos</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'current' ? 'tab-active' : ''}`} onClick={() => setTab('current')}>
          <Heart size={16} /> Mi lista ({items.length})
        </button>
        <button className={`tab ${tab === 'history' ? 'tab-active' : ''}`} onClick={() => setTab('history')}>
          <History size={16} /> Historial ({history.length})
        </button>
      </div>

      {tab === 'current' && (
        items.length === 0 ? (
          <div className="empty-state">
            <Heart size={48} color="var(--text-muted)" />
            <p>No tienes productos en favoritos.</p>
            <button className="btn" onClick={() => navigate('/')}>Explorar productos</button>
          </div>
        ) : (
          <div className="products-grid" style={{ paddingTop: '1.5rem' }}>
            {items.map((p) => (
              <div className="card" key={p.product_id}>
                <div style={{ position: 'relative' }}>
                  <img src={p.image_url || FALLBACK} alt={p.name} className="product-img"
                    onError={(e) => { e.target.src = FALLBACK; }} />
                  {!p.available && <span className="badge-low">{p.stock === 0 ? 'Agotado' : 'Stock bajo'}</span>}
                </div>
                <div className="product-content">
                  <h3 className="product-title">{p.name}</h3>
                  <div className="product-footer">
                    <span className="product-price">${p.price.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                    {p.available ? (
                      <button className="btn" style={{ flex: 1 }} onClick={() => addToCart(p)}>
                        <ShoppingCart size={16} /> Carrito
                      </button>
                    ) : (
                      <button className="btn btn-outline" style={{ flex: 1, cursor: 'not-allowed', color: 'var(--text-muted)' }} disabled>
                        <Ban size={16} /> No disponible
                      </button>
                    )}
                    <button className="btn-icon-danger" onClick={() => remove(p.product_id)} title="Quitar">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'history' && (
        history.length === 0 ? (
          <div className="empty-state"><History size={48} color="var(--text-muted)" /><p>Sin actividad en favoritos.</p></div>
        ) : (
          <div className="table-container" style={{ marginTop: '1.5rem' }}>
            <table>
              <thead><tr><th>Producto</th><th>Acción</th><th>Fecha</th></tr></thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{h.product_name}</td>
                    <td>
                      {h.action === 'added'
                        ? <span className="action-pill action-add"><PlusCircle size={14} /> Agregado</span>
                        : <span className="action-pill action-remove"><MinusCircle size={14} /> Quitado</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{h.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
