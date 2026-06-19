import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api';
import { UserPlus } from 'lucide-react';

export default function Register({ setUser }) {
  const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { token, role, username } = await auth.register(form);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      setUser({ role, username });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h2 className="auth-title">Crear cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario *</label>
            <input className="form-control" required value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Ej. juan123" />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input className="form-control" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Juan Pérez" />
          </div>
          <div className="form-group">
            <label className="form-label">Correo</label>
            <input type="email" className="form-control" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="juan@correo.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña *</label>
            <input type="password" className="form-control" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 4 caracteres" />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }} disabled={loading}>
            <UserPlus size={18} /> {loading ? 'Creando...' : 'Registrarme'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
