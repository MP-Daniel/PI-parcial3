const { get, all, run } = require('../database');
const { withAvailability } = require('../utils/availability');



/* ============================ PRODUCTOS =========================== */
const getProducts = async (req, res) => {
  try {
    const rows = await all('SELECT * FROM products ORDER BY id');
    res.json(rows.map(withAvailability));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const row = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(withAvailability(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createProduct = async (req, res) => {
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
};

const updateProduct = async (req, res) => {
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
};

const deleteProduct = async (req, res) => {
  try {
    await run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
