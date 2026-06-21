
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/constants');

/* ============================ MIDDLEWARE ============================ */

// Verifica el token JWT y extrae la información del usuario
const authenticate = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Acceso denegado' });
  try {
    req.user = jwt.verify(token.replace('Bearer ', ''), SECRET_KEY);
    next();
  } catch (err) {
    res.status(400).json({ message: 'Token no válido' });
  }
};

// Verifica que el usuario tenga rol de administrador
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Requiere permisos de administrador' });
  }
  next();
};