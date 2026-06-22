
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { get, run } = require('../database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants');

/* ============================== AUTH =============================== */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Faltan credenciales' });

    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Registro de cliente
const register = async (req, res) => {
  try {
    const { username, password, full_name, email } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Usuario y contraseña son obligatorios' });
    if (password.length < 4) return res.status(400).json({ message: 'La contraseña debe tener al menos 4 caracteres' });

    const exists = await get('SELECT id FROM users WHERE username = ?', [username]);
    if (exists) return res.status(400).json({ message: 'El usuario ya existe' });

    const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    const result = await run(
      'INSERT INTO users (username, password, role, full_name, email) VALUES (?, ?, ?, ?, ?)',
      [username, hash, 'client', full_name || null, email || null]
    );
    const token = jwt.sign({ id: result.lastID, username, role: 'client' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({ token, role: 'client', username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  login,
  register
};