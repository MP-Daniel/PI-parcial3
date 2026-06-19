import { createContext, useContext } from 'react';

// Contexto y hook en un archivo sin componentes (compatibilidad con Fast Refresh).
export const CartContext = createContext({ count: 0, refresh: () => {} });
export const useCart = () => useContext(CartContext);
