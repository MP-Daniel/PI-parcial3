const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

/* ------------------------------------------------------------------ *
 * Helpers basados en Promesas (sin nuevas dependencias).
 * Permiten escribir el checkout transaccional de forma legible.
 * ------------------------------------------------------------------ */
const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

/* Agrega una columna solo si no existe (migración en sitio, idempotente). */
const addColumnIfMissing = (table, column, definition) =>
  run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).catch((err) => {
    if (!/duplicate column name/i.test(err.message)) {
      console.error(`Migración ${table}.${column}:`, err.message);
    }
  });

async function init() {
  // -------- Tablas base (esquema completo para BD nuevas) --------
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    full_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    stock_limit INTEGER NOT NULL DEFAULT 5,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    card_last4 TEXT,
    status TEXT NOT NULL DEFAULT 'paid',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS wishlist_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // -------- Migración en sitio para BD ya existentes --------
  await addColumnIfMissing('users', 'full_name', 'TEXT');
  await addColumnIfMissing('users', 'email', 'TEXT');
  await addColumnIfMissing('users', 'phone', 'TEXT');
  await addColumnIfMissing('users', 'address', 'TEXT');
  await addColumnIfMissing('users', 'created_at', "TEXT");
  await addColumnIfMissing('products', 'stock_limit', 'INTEGER NOT NULL DEFAULT 5');
  await addColumnIfMissing('products', 'created_at', 'TEXT');

  // -------- Seeds --------
  // Admin por defecto
  const admin = await get("SELECT * FROM users WHERE username = 'admin'");
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', bcrypt.genSaltSync(10));
    await run("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)",
      ['admin', hash, 'admin', 'Administrador']);
    console.log('Default admin user created.');
  }

  // Cliente demo para pruebas de Parcial 3
  const cliente = await get("SELECT * FROM users WHERE username = 'cliente'");
  if (!cliente) {
    const hash = bcrypt.hashSync('cliente123', bcrypt.genSaltSync(10));
    await run("INSERT INTO users (username, password, role, full_name, email) VALUES (?, ?, ?, ?, ?)",
      ['cliente', hash, 'client', 'Cliente Demo', 'cliente@minishop.co']);
    console.log('Default client user created.');
  }

  // Producto demo con stock bajo (para demostrar el bloqueo de compra)
  const demoLow = await get("SELECT * FROM products WHERE name = 'Empanada (demo stock bajo)'");
  if (!demoLow) {
    await run(`INSERT INTO products (name, description, price, stock, stock_limit, image_url)
               VALUES (?, ?, ?, ?, ?, ?)`,
      ['Empanada (demo stock bajo)',
       'Producto de ejemplo para demostrar el bloqueo por stock bajo: aparece en el catálogo pero no se puede comprar.',
       1500, 3, 5,
       'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800&auto=format&fit=crop']);
    console.log('Demo low-stock product created.');
  }
}

db.serialize(() => {
  init().catch((err) => console.error('Error inicializando BD:', err));
});

// Exportamos un objeto con los helpers de promesas (run/get/all) y la
// instancia cruda bajo "raw". Importante: NO exportar la instancia directa
// para no sobrescribir sus métodos nativos db.run/db.get/db.all.
module.exports = { run, get, all, raw: db };
