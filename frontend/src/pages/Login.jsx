import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api';
import { LogIn } from 'lucide-react';

export default function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token, role, username: returnedUser } = await auth.login(username, password);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', returnedUser);
      
      setUser({ role, username: returnedUser });
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h2 className="auth-title">Iniciar Sesión</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input 
              type="text" 
              className="form-control" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. admin"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required 
            />
          </div>
          
          {error && <div className="error-msg">{error}</div>}
          
          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
            disabled={loading}
          >
            <LogIn size={18} /> {loading ? 'Cargando...' : 'Acceder'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          ¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
