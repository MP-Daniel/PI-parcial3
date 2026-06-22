import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ------------------------------- AUTH ------------------------------ */
export const auth = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
};

/* ----------------------------- PRODUCTOS --------------------------- */
export const products = {
  getAll: async () => (await api.get('/products')).data,
  getOne: async (id) => (await api.get(`/products/${id}`)).data,
  create: async (data) => (await api.post('/products', data)).data,
  update: async (id, data) => (await api.put(`/products/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/products/${id}`)).data,
};

/* ------------------------------ PERFIL ----------------------------- */
export const profile = {
  get: async () => (await api.get('/profile')).data,
  update: async (data) => (await api.put('/profile', data)).data,
  changePassword: async (data) => (await api.put('/profile/password', data)).data,
};

/* ------------------------------ CARRITO ---------------------------- */
export const cart = {
  get: async () => (await api.get('/cart')).data,
  add: async (product_id, quantity = 1) => (await api.post('/cart', { product_id, quantity })).data,
  setQty: async (product_id, quantity) => (await api.put(`/cart/${product_id}`, { quantity })).data,
  remove: async (product_id) => (await api.delete(`/cart/${product_id}`)).data,
  clear: async () => (await api.delete('/cart')).data,
};

/* ----------------------------- CHECKOUT ---------------------------- */
export const checkout = {
  pay: async (paymentData) => (await api.post('/checkout', paymentData)).data,
};

/* ------------------------------ ÓRDENES ---------------------------- */
export const orders = {
  getMine: async () => (await api.get('/orders')).data,
  getAllAdmin: async () => (await api.get('/admin/orders')).data,
};

/* ----------------------------- WISHLIST ---------------------------- */
export const wishlist = {
  get: async () => (await api.get('/wishlist')).data,
  add: async (product_id) => (await api.post('/wishlist', { product_id })).data,
  remove: async (product_id) => (await api.delete(`/wishlist/${product_id}`)).data,
  history: async () => (await api.get('/wishlist/history')).data,
};

export default api;
