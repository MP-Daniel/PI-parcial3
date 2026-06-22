
const { all, get, run } = require('../database');
const { withAvailability } = require('../utils/availability');


/* ============================ WISHLIST =========================== */
const getWishlist = async (req, res) => {
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
};

const addToWishlist = async (req, res) => {
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
};

const removeFromWishlist = async (req, res) => {
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
};

const getWishlistHistory = async (req, res) => {
  try {
    const rows = await all(
      'SELECT product_name, action, created_at FROM wishlist_history WHERE user_id = ? ORDER BY id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getWishlistHistory 
};