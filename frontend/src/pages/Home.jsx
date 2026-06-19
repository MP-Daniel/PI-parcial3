import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { products as productsApi, cart as cartApi, wishlist as wishlistApi } from '../api';
import { useCart } from '../context/cartStore';
import { ShoppingCart, Heart, Ban } from 'lucide-react';

const FALLBACK = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop';

export default function Home({ user }) {
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState(new Set());
  const [toast, setToast] = useState('');
  const navigate = useNavigate();
  const cart = useCart();

  const loadProducts = useCallback(async () => {
    try { setProductList(await productsApi.getAll()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const loadFavs = useCallback(async () => {
    try { setFavIds(new Set((await wishlistApi.get()).map((p) => p.product_id))); }
    catch { /* sin sesión */ }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { if (user) loadFavs(); }, [user, loadFavs]);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleAddToCart = async (product) => {
    if (!user) return navigate('/login');
    try {
      await cartApi.add(product.id, 1);
      await cart.refresh();
      notify(`"${product.name}" agregado al carrito`);
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo agregar');
    }
  };

  const toggleFav = async (product) => {
    if (!user) return navigate('/login');
    try {
      if (favIds.has(product.id)) {
        await wishlistApi.remove(product.id);
        notify('Quitado de favoritos');
      } else {
        await wishlistApi.add(product.id);
        notify('Agregado a favoritos');
      }
      loadFavs();
    } catch { notify('Error en favoritos'); }
  };

  if (loading) return <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>Cargando catálogo...</div>;

  return (
    <div className="container">
      {toast && <div className="toast">{toast}</div>}
      <div className="products-grid">
        {productList.map((product) => {
          const isFav = favIds.has(product.id);
          const blocked = !product.available;
          return (
            <div className="card" key={product.id}>
              <div style={{ position: 'relative' }}>
                <img
                  src={product.image_url || FALLBACK}
                  alt={product.name}
                  className="product-img"
                  onError={(e) => { e.target.src = FALLBACK; }}
                />
                <button
                  className={`fav-btn ${isFav ? 'fav-active' : ''}`}
                  onClick={() => toggleFav(product)}
                  title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
                </button>
                {blocked && (
                  <span className="badge-low">
                    {product.stock === 0 ? 'Agotado' : 'Stock bajo'}
                  </span>
                )}
              </div>
              <div className="product-content">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-desc">{product.description}</p>
                <div className="product-footer">
                  <span className="product-price">${product.price.toFixed(2)}</span>
                  <span className="product-stock" style={blocked ? { background: '#fef2f2', color: 'var(--danger)' } : {}}>
                    Stock: {product.stock}
                  </span>
                </div>
                {blocked ? (
                  <button className="btn btn-outline" style={{ width: '100%', marginTop: '1.5rem', cursor: 'not-allowed', color: 'var(--text-muted)' }} disabled>
                    <Ban size={18} /> No disponible
                  </button>
                ) : (
                  <button className="btn" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => handleAddToCart(product)}>
                    <ShoppingCart size={18} /> Agregar al carrito
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {productList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          No hay productos disponibles por el momento.
        </div>
      )}
    </div>
  );
}
