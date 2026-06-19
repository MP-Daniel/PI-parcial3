# MiniShop — Parcial 3

Tienda de productos con **frontend y backend separados**, ampliada desde el Parcial 1
sin cambiar la arquitectura: **Express 5 + SQLite (sqlite3) + JWT/bcrypt** en el backend
y **React 19 + React Router 7 + Axios + CSS plano** en el frontend.

---

## Cómo ejecutar

### 1) Backend (puerto 5000)
```bash
cd backend
npm install
npm start          # o: node server.js
```
Al arrancar por primera vez, la base de datos existente se **migra en sitio**
(agrega columnas y tablas nuevas sin perder los datos anteriores) y se crean
los usuarios y el producto de demostración.

### 2) Frontend (puerto 5173)
```bash
cd frontend
npm install
npm run dev
```
Abrir el navegador en la URL que muestra Vite (por defecto http://localhost:5173).

---

## Credenciales de prueba

| Rol     | Usuario   | Contraseña   |
|---------|-----------|--------------|
| Admin   | `admin`   | `admin123`   |
| Cliente | `cliente` | `cliente123` |

También se puede crear una cuenta nueva desde **Registrarse**.

---

## Funcionalidades nuevas (Parcial 3)

- **Registro de clientes** y sesión por JWT (además del login de admin existente).
- **Carrito de compras** con control de cantidades y subtotales en tiempo real.
- **Pasarela de pago simulada** (académica): valida los campos de la tarjeta,
  aplica el algoritmo de **Luhn**, simula aprobación/rechazo, genera un
  `transaction_id` y guarda los últimos 4 dígitos. No procesa pagos reales.
- **Configuración de perfil**: datos personales (nombre, correo, teléfono,
  dirección) y cambio de contraseña.
- **Favoritos (wishlist)**: marcar/quitar productos.
- **Historial de favoritos**: registro de cada vez que se agrega o quita un producto.
- **Historial de compras**: órdenes con su detalle, método de pago y transacción.
- **Gestión de stock y límite de stock** desde el panel de administración.
- **Regla de stock bajo**: cuando `stock <= límite de stock` (o stock 0), el
  producto **sigue visible** en el catálogo pero **no se puede comprar**
  (botón bloqueado y etiqueta "Stock bajo"/"Agotado"). La validación es
  autoritativa en el backend (se revalida en el checkout).
- **Panel admin** con tarjetas de resumen: ventas, ingresos y productos con stock bajo.

---

## Tarjetas de prueba (pasarela simulada)

| Resultado  | Número                | Vence | CVV |
|------------|-----------------------|-------|-----|
| Aprobada   | `4242 4242 4242 4242` | 12/30 | 123 |
| Rechazada  | `4000 0000 0000 0002` | 12/30 | 123 |

Cualquier número que no pase la validación de Luhn o con fecha vencida es rechazado.
En la pantalla de pago hay botones para autocompletar estas tarjetas.

---

## Modelo de datos (resumen)

- `users`: + `full_name`, `email`, `phone`, `address`, `created_at`
- `products`: + `stock_limit`, `created_at`
- `cart_items`: carrito por usuario
- `orders` / `order_items`: historial de compras
- `wishlist`: favoritos actuales
- `wishlist_history`: bitácora de favoritos (added/removed)

---

## Endpoints principales (backend)

```
POST   /api/auth/login            POST /api/auth/register
GET    /api/profile               PUT  /api/profile        PUT /api/profile/password
GET    /api/products              POST/PUT/DELETE /api/products[/:id]   (admin)
GET    /api/cart                  POST /api/cart           PUT/DELETE /api/cart/:id
POST   /api/checkout              (pasarela simulada + transacción)
GET    /api/orders                (historial de compras)
GET    /api/wishlist              POST /api/wishlist       DELETE /api/wishlist/:id
GET    /api/wishlist/history
GET    /api/admin/orders          (resumen de ventas, admin)
```

> Nota académica: la pasarela de pago es una **simulación**. No se conecta a
> ningún proveedor real ni se almacenan datos sensibles de tarjeta.
