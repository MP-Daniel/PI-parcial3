/* Producto disponible para compra: hay stock y está por encima del umbral. */
const isAvailable = (p) => p.stock > 0 && p.stock > p.stock_limit;



const withAvailability = (p) => ({
     ...p, 
     available: isAvailable(p), 
    low_stock: !isAvailable(p) });

module.exports = {
    isAvailable,
    withAvailability
}