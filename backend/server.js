const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
const { run, get, all } = db;

const app = express();
const PORT = 5001;
const SECRET_KEY = 'supersecretkey_for_simple_app';

app.use(cors());
app.use(express.json());

/* ============================ MIDDLEWARE ============================ */
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

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Requiere permisos de administrador' });
  }
  next();
};

/* Producto disponible para compra: hay stock y está por encima del umbral. */
const isAvailable = (p) => p.stock > 0 && p.stock > p.stock_limit;
const withAvailability = (p) => ({ ...p, available: isAvailable(p), low_stock: !isAvailable(p) });

/* ============================== AUTH =============================== */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Faltan credenciales' });

    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '8h' });
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registro de cliente
app.post('/api/auth/register', async (req, res) => {
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
    const token = jwt.sign({ id: result.lastID, username, role: 'client' }, SECRET_KEY, { expiresIn: '8h' });
    res.status(201).json({ token, role: 'client', username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================= PERFIL ============================== */
app.get('/api/profile', authenticate, async (req, res) => {
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
});

app.put('/api/profile', authenticate, async (req, res) => {
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
});

app.put('/api/profile/password', authenticate, async (req, res) => {
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
});

/* ============================ PRODUCTOS =========================== */
app.get('/api/products', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM products ORDER BY id');
    res.json(rows.map(withAvailability));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const row = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(withAvailability(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, stock_limit, image_url } = req.body;
    const result = await run(
      'INSERT INTO products (name, description, price, stock, stock_limit, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, stock, stock_limit ?? 5, image_url]
    );
    res.status(201).json({ id: result.lastID, name, description, price, stock, stock_limit: stock_limit ?? 5, image_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, stock_limit, image_url } = req.body;
    await run(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, stock_limit = ?, image_url = ? WHERE id = ?',
      [name, description, price, stock, stock_limit ?? 5, image_url, req.params.id]
    );
    res.json({ message: 'Producto actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================= CARRITO ============================ */
const getCart = async (userId) => {
  const rows = await all(
    `SELECT c.product_id, c.quantity,
            p.name, p.price, p.stock, p.stock_limit, p.image_url
     FROM cart_items c JOIN products p ON p.id = c.product_id
     WHERE c.user_id = ? ORDER BY c.id`,
    [userId]
  );
  const items = rows.map((r) => ({
    product_id: r.product_id,
    name: r.name,
    price: r.price,
    quantity: r.quantity,
    image_url: r.image_url,
    stock: r.stock,
    stock_limit: r.stock_limit,
    available: isAvailable(r),
    subtotal: +(r.price * r.quantity).toFixed(2),
  }));
  const total = +items.reduce((s, i) => s + i.subtotal, 0).toFixed(2);
  return { items, total, count: items.reduce((s, i) => s + i.quantity, 0) };
};

app.get('/api/cart', authenticate, async (req, res) => {
  try {
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cart', authenticate, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const p = await get('SELECT * FROM products WHERE id = ?', [product_id]);
    if (!p) return res.status(404).json({ message: 'Producto no encontrado' });
    if (!isAvailable(p)) {
      return res.status(400).json({ message: 'Producto no disponible (stock bajo). No se puede agregar al carrito.' });
    }
    const existing = await get('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    const newQty = (existing ? existing.quantity : 0) + quantity;
    if (newQty > p.stock) {
      return res.status(400).json({ message: `Solo hay ${p.stock} unidades disponibles` });
    }
    if (existing) {
      await run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      await run('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.user.id, product_id, quantity]);
    }
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cart/:productId', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    const p = await get('SELECT * FROM products WHERE id = ?', [req.params.productId]);
    if (!p) return res.status(404).json({ message: 'Producto no encontrado' });
    if (quantity <= 0) {
      await run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
    } else {
      if (quantity > p.stock) return res.status(400).json({ message: `Solo hay ${p.stock} unidades disponibles` });
      await run('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [quantity, req.user.id, req.params.productId]);
    }
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cart/:productId', authenticate, async (req, res) => {
  try {
    await run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cart', authenticate, async (req, res) => {
  try {
    await run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================== PASARELA DE PAGO (SIMULADA) ================= */
// Algoritmo de Luhn (validación académica de número de tarjeta).
const luhnValid = (number) => {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0, even = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (even) { d *= 2; if (d > 9) d -= 9; }
    sum += d; even = !even;
  }
  return sum % 10 === 0;
};

// Simulación del gateway: devuelve aprobación o rechazo con motivo.
const simulateGateway = ({ card_number, card_name, expiry, cvv }) => {
  const num = (card_number || '').replace(/\s/g, '');
  if (!card_name || !num || !expiry || !cvv) return { ok: false, reason: 'Datos de tarjeta incompletos' };
  if (!/^\d{3,4}$/.test(cvv)) return { ok: false, reason: 'CVV inválido' };
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return { ok: false, reason: 'Fecha de expiración inválida (MM/AA)' };

  const [mm, yy] = expiry.split('/').map((x) => parseInt(x, 10));
  if (mm < 1 || mm > 12) return { ok: false, reason: 'Mes de expiración inválido' };
  const exp = new Date(2000 + yy, mm); // primer día del mes siguiente
  if (exp <= new Date()) return { ok: false, reason: 'La tarjeta está vencida' };

  if (!luhnValid(num)) return { ok: false, reason: 'Número de tarjeta inválido (Luhn)' };
  if (num === '4000000000000002') return { ok: false, reason: 'Tarjeta rechazada: fondos insuficientes' };

  const transaction_id = 'TXN-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  return { ok: true, transaction_id, last4: num.slice(-4) };
};

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
