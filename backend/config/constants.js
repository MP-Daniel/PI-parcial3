
require('dotenv').config();

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
  PORT,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  NODE_ENV,
};