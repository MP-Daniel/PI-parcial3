const { get, all, run } = require('../database');
const { isAvailable } = require('../utils/availability');


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

const getUserCart = async (req, res) => {
  try {
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addToCart = async (req, res) => {
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
};

const updateCartItem = async (req, res) => {
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
};

const removeCartItem = async (req, res) => {
  try {
    await run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    await run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json(await getCart(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getCart,
  getUserCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};