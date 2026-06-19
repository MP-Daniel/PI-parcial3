import { useState, useEffect, useCallback } from 'react';
import { products, orders as ordersApi } from '../api';
import { Plus, Edit2, Trash2, X, AlertTriangle, DollarSign, ShoppingBag } from 'lucide-react';

export default function AdminDashboard() {
  const [productList, setProductList] = useState([]);
  const [summary, setSummary] = useState({ count: 0, revenue: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', stock: '', stock_limit: '5', image_url: '',
  });

  const loadProducts = useCallback(async () => {
    try { setProductList(await products.getAll()); } catch (err) { console.error(err); }
  }, []);
  const loadSummary = useCallback(async () => {
    try { setSummary((await ordersApi.getAllAdmin()).summary); } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    (async () => { await loadProducts(); await loadSummary(); })();
  }, [loadProducts, loadSummary]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name, description: product.description || '',
        price: product.price, stock: product.stock,
        stock_limit: product.stock_limit ?? 5, image_url: product.image_url || '',
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', price: '', stock: '', stock_limit: '5', image_url: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        stock_limit: parseInt(formData.stock_limit, 10),
      };
      if (editingId) await products.update(editingId, data);
      else await products.create(data);
      closeModal();
      loadProducts();
    } catch (err) {
      alert('Error guardando producto: ' + err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este producto?')) {
      try { await products.delete(id); loadProducts(); }
      catch { alert('Error eliminando producto'); }
    }
  };

  const lowStockCount = productList.filter((p) => !p.available).length;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Gestión de Productos</h1>
        <button className="btn" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><ShoppingBag size={20} /></div>
          <div><div className="stat-value">{summary.count}</div><div className="stat-label">Ventas realizadas</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><DollarSign size={20} /></div>
          <div><div className="stat-value">${Number(summary.revenue).toFixed(2)}</div><div className="stat-label">Ingresos totales</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><AlertTriangle size={20} /></div>
          <div><div className="stat-value">{lowStockCount}</div><div className="stat-label">Productos con stock bajo</div></div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Imagen</th><th>Nombre</th><th>Precio</th>
              <th>Stock</th><th>Límite</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productList.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>
                  <img src={p.image_url || 'https://via.placeholder.com/40'} alt={p.name}
                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }} />
                </td>
                <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{p.name}</td>
                <td>${p.price.toFixed(2)}</td>
                <td>{p.stock}</td>
                <td>{p.stock_limit}</td>
                <td>
                  {p.available
                    ? <span className="product-stock" style={{ background: '#ecfdf5', color: 'var(--success)' }}>Disponible</span>
                    : <span className="product-stock" style={{ background: '#fef2f2', color: 'var(--danger)' }}>
                        {p.stock === 0 ? 'Agotado' : 'Stock bajo'}
                      </span>}
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: 4 }} onClick={() => handleOpenModal(p)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: 4, color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(p.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {productList.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>No hay productos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input required type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">URL de Imagen</label>
                <input type="url" className="form-control" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Precio ($)</label>
                  <input required type="number" step="0.01" className="form-control" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Stock</label>
                  <input required type="number" min="0" className="form-control" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Límite de stock</label>
                  <input required type="number" min="0" className="form-control" value={formData.stock_limit} onChange={(e) => setFormData({ ...formData, stock_limit: e.target.value })} />
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                <AlertTriangle size={13} style={{ verticalAlign: '-2px' }} /> Cuando el <strong>stock</strong> sea igual o menor al <strong>límite</strong>, el producto seguirá visible pero no se podrá comprar.
              </p>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-control" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn">{editingId ? 'Guardar Cambios' : 'Crear Producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
