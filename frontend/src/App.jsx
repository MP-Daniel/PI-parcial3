import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';

// Lee la sesión guardada de forma síncrona (evita un efecto y parpadeos).
function readSession() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  return token && role && username ? { role, username } : null;
}

export default function App() {
  const [user, setUser] = useState(readSession);

  // Envuelve rutas que requieren sesión iniciada.
  const requireAuth = (element) => (user ? element : <Navigate to="/login" />);

  return (
    <BrowserRouter>
      <CartProvider user={user}>
        <Navbar user={user} setUser={setUser} />
        <main>
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/cart" element={requireAuth(<Cart />)} />
            <Route path="/checkout" element={requireAuth(<Checkout />)} />
            <Route path="/profile" element={requireAuth(<Profile />)} />
            <Route path="/wishlist" element={requireAuth(<Wishlist user={user} />)} />
            <Route path="/orders" element={requireAuth(<Orders />)} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </CartProvider>
    </BrowserRouter>
  );
}
