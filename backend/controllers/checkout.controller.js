const { get, run } = require('../database');
const { isAvailable } = require('../utils/availability');
const { simulateGateway } = require('../utils/paymentGateway');
const { getCart } = require('./cart.controller');



// Este se encarga de procesar el checkout, validando stock, simulando pago y creando la orden
const checkout = async (req, res) => {
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
};

module.exports = { checkout };