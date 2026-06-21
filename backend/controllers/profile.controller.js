
const bcrypt = require('bcryptjs');
const { get, run } = require('../database');


/* ============================= PERFIL ============================== */
const getProfile = async (req, res) => {
  try {
    const user = await get(
      'SELECT id, username, role, full_name, email, phone, address, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, email, phone, address } = req.body;
    await run(
      'UPDATE users SET full_name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [full_name || null, email || null, phone || null, address || null, req.user.id]
    );
    const user = await get(
      'SELECT id, username, role, full_name, email, phone, address, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ message: 'Perfil actualizado', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password || new_password.length < 4) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 4 caracteres' });
    }
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!bcrypt.compareSync(current_password || '', user.password)) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }
    const hash = bcrypt.hashSync(new_password, bcrypt.genSaltSync(10));
    await run('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};