import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orders as ordersApi } from '../api';
import { Package, CreditCard, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export default function Orders() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { ordersApi.getMine().then(setList).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>Cargando compras...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Mis Compras</h1>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <Package size={48} color="var(--text-muted)" />
          <p>Aún no tienes compras registradas.</p>
          <button className="btn" onClick={() => navigate('/')}>Comenzar a comprar</button>
        </div>
      ) : (
        <div className="orders-list">
          {list.map((o) => {
            const isOpen = open === o.id;
            return (
              <div className="card order-card" key={o.id}>
                <div className="order-head" onClick={() => setOpen(isOpen ? null : o.id)}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <strong>Orden #{o.id}</strong>
                      <span className="status-pill"><CheckCircle2 size={13} /> {o.status === 'paid' ? 'Pagado' : o.status}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem' }}>{o.created_at}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>${o.total.toFixed(2)}</span>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isOpen && (
                  <div className="order-detail">
                    {o.items.map((it, i) => (
                      <div className="summary-row" key={i}>
                        <span>{it.product_name} × {it.quantity}</span>
                        <span>${(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="summary-divider" />
                    <div className="order-meta">
                      <span><CreditCard size={14} /> {o.payment_method} •••• {o.card_last4}</span>
                      <span className="txn">{o.transaction_id}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
