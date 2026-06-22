
const { all } = require('../database');

/* ===================== HISTORIAL DE COMPRAS ======================= */
const getUserOrders = async (req, res) => {
  try {
    const orders = await all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    for (const o of orders) {
      o.items = await all('SELECT product_name, price, quantity FROM order_items WHERE order_id = ?', [o.id]);
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getUserOrders };