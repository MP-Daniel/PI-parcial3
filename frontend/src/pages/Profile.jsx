import { useState, useEffect } from 'react';
import { profile as profileApi } from '../api';
import { User, Save, KeyRound, CheckCircle2 } from 'lucide-react';

export default function Profile() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '' });
  const [pwd, setPwd] = useState({ current_password: '', new_password: '' });
  const [msg, setMsg] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [error, setError] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const u = await profileApi.get();
      if (!active) return;
      setData(u);
      setForm({ full_name: u.full_name || '', email: u.email || '', phone: u.phone || '', address: u.address || '' });
    })();
    return () => { active = false; };
  }, []);

  const flash = (setter, value) => { setter(value); setTimeout(() => setter(''), 3000); };

  const saveProfile = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await profileApi.update(form);
      setData(res.user);
      flash(setMsg, 'Perfil actualizado correctamente');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    try {
      await profileApi.changePassword(pwd);
      setPwd({ current_password: '', new_password: '' });
      flash(setPwdMsg, 'Contraseña actualizada');
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Error al cambiar la contraseña');
    }
  };

  if (!data) return <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>Cargando perfil...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Configuración de Perfil</h1>
      </div>

      <div className="profile-header card">
        <div className="avatar"><User size={32} /></div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.username}</h2>
          <span className={`role-pill ${data.role === 'admin' ? 'role-admin' : ''}`}>{data.role}</span>
          {data.created_at && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>Miembro desde {data.created_at}</p>}
        </div>
      </div>

      <div className="cart-layout" style={{ marginTop: '2rem' }}>
        <form className="card" style={{ padding: '2rem' }} onSubmit={saveProfile}>
          <h3 className="section-title">Datos personales</h3>
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input className="form-control" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Teléfono</label>
              <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección de envío</label>
            <textarea className="form-control" rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          {error && <div className="error-msg">{error}</div>}
          {msg && <div className="success-msg"><CheckCircle2 size={16} /> {msg}</div>}
          <button type="submit" className="btn" style={{ marginTop: '1rem' }}><Save size={18} /> Guardar cambios</button>
        </form>

        <form className="card" style={{ padding: '2rem', height: 'fit-content' }} onSubmit={changePassword}>
          <h3 className="section-title"><KeyRound size={18} style={{ verticalAlign: '-3px' }} /> Cambiar contraseña</h3>
          <div className="form-group">
            <label className="form-label">Contraseña actual</label>
            <input type="password" className="form-control" required value={pwd.current_password}
              onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Nueva contraseña</label>
            <input type="password" className="form-control" required value={pwd.new_password}
              onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} placeholder="Mínimo 4 caracteres" />
          </div>
          {pwdError && <div className="error-msg">{pwdError}</div>}
          {pwdMsg && <div className="success-msg"><CheckCircle2 size={16} /> {pwdMsg}</div>}
          <button type="submit" className="btn btn-outline" style={{ marginTop: '1rem' }}>Actualizar contraseña</button>
        </form>
      </div>
    </div>
  );
}
