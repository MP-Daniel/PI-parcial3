import { useState, useCallback, useEffect } from 'react';
import { cart as cartApi } from '../api';
import { CartContext } from './cartStore';

export function CartProvider({ user, children }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setCount(0); return; }
    try {
      const data = await cartApi.get();
      setCount(data.count || 0);
    } catch {
      setCount(0);
    }
  }, [user]);

  // Carga inicial / al cambiar de usuario, sin setState síncrono en el efecto.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) { if (active) setCount(0); return; }
      try {
        const data = await cartApi.get();
        if (active) setCount(data.count || 0);
      } catch {
        if (active) setCount(0);
      }
    })();
    return () => { active = false; };
  }, [user]);

  return (
    <CartContext.Provider value={{ count, refresh }}>
      {children}
    </CartContext.Provider>
  );
}
