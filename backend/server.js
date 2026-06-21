const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
const { run, get, all } = db;

const app = express();

app.use(cors());
app.use(express.json());















/* ===================== HISTORIAL DE COMPRAS ======================= */
app.get('/api/orders', authenticate, async (req, res) => {
  try {
    const orders = await all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    for (const o of orders) {
      o.items = await all('SELECT product_name, price, quantity FROM order_items WHERE order_id = ?', [o.id]);
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================ WISHLIST =========================== */
app.get('/api/wishlist', authenticate, async (req, res) => {
  try {
    const rows = await all(
      `SELECT w.product_id, w.created_at,
              p.name, p.description, p.price, p.stock, p.stock_limit, p.image_url
       FROM wishlist w JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ? ORDER BY w.id DESC`,
      [req.user.id]
    );
    res.json(rows.map(withAvailability));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wishlist', authenticate, async (req, res) => {
  try {
    const { product_id } = req.body;
    const p = await get('SELECT * FROM products WHERE id = ?', [product_id]);
    if (!p) return res.status(404).json({ message: 'Producto no encontrado' });

    const exists = await get('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    if (!exists) {
      await run('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.user.id, product_id]);
      await run('INSERT INTO wishlist_history (user_id, product_id, product_name, action) VALUES (?, ?, ?, ?)',
        [req.user.id, product_id, p.name, 'added']);
    }
    res.json({ message: 'Agregado a favoritos' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/wishlist/:productId', authenticate, async (req, res) => {
  try {
    const p = await get('SELECT * FROM products WHERE id = ?', [req.params.productId]);
    const removed = await run('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]);
    if (removed.changes > 0) {
      await run('INSERT INTO wishlist_history (user_id, product_id, product_name, action) VALUES (?, ?, ?, ?)',
        [req.user.id, req.params.productId, p ? p.name : 'producto', 'removed']);
    }
    res.json({ message: 'Eliminado de favoritos' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/wishlist/history', authenticate, async (req, res) => {
  try {
    const rows = await all(
      'SELECT product_name, action, created_at FROM wishlist_history WHERE user_id = ? ORDER BY id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =================== ADMIN: RESUMEN DE VENTAS ===================== */
app.get('/api/admin/orders', authenticate, isAdmin, async (req, res) => {
  try {
    const orders = await all(
      `SELECT o.*, u.username FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC`
    );
    const totals = await get('SELECT COUNT(*) AS count, COALESCE(SUM(total),0) AS revenue FROM orders');
    res.json({ orders, summary: totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
