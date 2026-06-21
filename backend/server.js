const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
const { run, get, all } = db;

const app = express();

app.use(cors());
app.use(express.json());














app.post('/api/checkout', authenticate, async (req, res) => {
  try {
    const cart = await getCart(req.user.id);
    if (cart.items.length === 0) return res.status(400).json({ message: 'El carrito está vacío' });

    // Re-validación autoritativa de stock y disponibilidad
    for (const item of cart.items) {
      const p = await get('SELECT * FROM products WHERE id = ?', [item.product_id]);
      if (!p) return res.status(400).json({ message: `El producto "${item.name}" ya no existe` });
      if (!isAvailable(p)) return res.status(400).json({ message: `"${p.name}" no está disponible (stock bajo)` });
      if (item.quantity > p.stock) return res.status(400).json({ message: `Stock insuficiente para "${p.name}"` });
    }

    // Pasarela simulada
    const payment = simulateGateway(req.body || {});
    if (!payment.ok) return res.status(402).json({ message: payment.reason, declined: true });

    // Transacción: crear orden, items, descontar stock, vaciar carrito
    await run('BEGIN TRANSACTION');
    try {
      const order = await run(
        'INSERT INTO orders (user_id, total, payment_method, transaction_id, card_last4, status) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, cart.total, 'Tarjeta (simulada)', payment.transaction_id, payment.last4, 'paid']
      );
      for (const item of cart.items) {
        await run(
          'INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)',
          [order.lastID, item.product_id, item.name, item.price, item.quantity]
        );
        await run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
      }
      await run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
      await run('COMMIT');

      res.status(201).json({
        message: 'Pago aprobado',
        order_id: order.lastID,
        transaction_id: payment.transaction_id,
        card_last4: payment.last4,
        total: cart.total,
        items: cart.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      });
    } catch (txErr) {
      await run('ROLLBACK');
      throw txErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
