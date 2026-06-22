/**
 * ============================================================
 *  routes/index.js
 *  Define todas las rutas de la API y las conecta con
 *  sus controllers correspondientes.
 * ============================================================
 */

const express = require('express');
const router = express.Router();

const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

const authController = require('../controllers/auth.controller');
const profileController = require('../controllers/profile.controller');
const productsController = require('../controllers/products.controller');
const cartController = require('../controllers/cart.controller');
const checkoutController = require('../controllers/checkout.controller');
const ordersController = require('../controllers/orders.controller');
const wishlistController = require('../controllers/wishlist.controller');
const adminController = require('../controllers/admin.controller');

/* ============================== AUTH =============================== */
router.post('/api/auth/login', authController.login);
router.post('/api/auth/register', authController.register);

/* ============================= PERFIL ============================== */
router.get('/api/profile', authenticate, profileController.getProfile);
router.put('/api/profile', authenticate, profileController.updateProfile);
router.put('/api/profile/password', authenticate, profileController.updatePassword);

/* ============================ PRODUCTOS ============================ */
router.get('/api/products', productsController.getAllProducts);
router.get('/api/products/:id', productsController.getProductById);
router.post('/api/products', authenticate, isAdmin, productsController.createProduct);
router.put('/api/products/:id', authenticate, isAdmin, productsController.updateProduct);
router.delete('/api/products/:id', authenticate, isAdmin, productsController.deleteProduct);

/* ============================= CARRITO ============================= */
router.get('/api/cart', authenticate, cartController.getUserCart);
router.post('/api/cart', authenticate, cartController.addToCart);
router.put('/api/cart/:productId', authenticate, cartController.updateCartItem);
router.delete('/api/cart/:productId', authenticate, cartController.removeCartItem);
router.delete('/api/cart', authenticate, cartController.clearCart);

/* ============================ CHECKOUT ============================= */
router.post('/api/checkout', authenticate, checkoutController.checkout);

/* ============================= ÓRDENES ============================= */
router.get('/api/orders', authenticate, ordersController.getUserOrders);

/* ============================ WISHLIST =============================== */
router.get('/api/wishlist', authenticate, wishlistController.getWishlist);
router.post('/api/wishlist', authenticate, wishlistController.addToWishlist);
router.delete('/api/wishlist/:productId', authenticate, wishlistController.removeFromWishlist);
router.get('/api/wishlist/history', authenticate, wishlistController.getWishlistHistory);

/* =========================== ADMIN ================================= */
router.get('/api/admin/orders', authenticate, isAdmin, adminController.getAllOrdersAdmin);

module.exports = router;