const { all, get } = require('../database');


/* =================== ADMIN: RESUMEN DE VENTAS ===================== */
const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await all(
      `SELECT o.*, u.username FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC`
    );
    const totals = await get('SELECT COUNT(*) AS count, COALESCE(SUM(total),0) AS revenue FROM orders');
    res.json({ orders, summary: totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllOrdersAdmin };
