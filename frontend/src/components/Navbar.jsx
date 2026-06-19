import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, LogOut, LayoutDashboard, LogIn, ShoppingCart, Heart, User, Package } from 'lucide-react';
import { useCart } from '../context/cartStore';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const cart = useCart();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setUser(null);
    cart?.refresh();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <ShoppingBag size={24} color="var(--primary)" />
          <span>MiniShop</span>
        </Link>
        <div className="navbar-links">
          {user ? (
            <>
              <Link to="/cart" className="icon-link" title="Carrito">
                <ShoppingCart size={20} />
                {cart?.count > 0 && <span className="cart-badge">{cart.count}</span>}
              </Link>
              <Link to="/wishlist" className="icon-link" title="Favoritos">
                <Heart size={20} />
              </Link>
              <Link to="/orders" className="icon-link" title="Mis compras">
                <Package size={20} />
              </Link>
              <Link to="/profile" className="icon-link" title="Perfil">
                <User size={20} />
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>
                  <LayoutDashboard size={16} /> Admin
                </Link>
              )}
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Hola, <strong>{user.username}</strong>
              </span>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>
                <LogOut size={16} /> Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-outline" style={{ padding: '0.4rem 0.9rem' }}>
                Registrarse
              </Link>
              <Link to="/login" className="btn">
                <LogIn size={18} /> Entrar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
