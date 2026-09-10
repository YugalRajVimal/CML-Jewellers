"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiClient } from "./api-client";
import { useAuth } from "./auth-context";

const CommerceContext = createContext({ cartCount: 0, wishlistCount: 0, refresh: () => {} });

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) { setCartCount(0); setWishlistCount(0); return; }
    try {
      const [cart, wishlist] = await Promise.all([
        apiClient.get<{ items: unknown[] }>("/cart"),
        apiClient.get<unknown[]>("/wishlist"),
      ]);
      setCartCount(cart.items.reduce((n: number, i: any) => n + i.quantity, 0));
      setWishlistCount(wishlist.length);
    } catch { /* ignore — badge just stays at last known value */ }
  }, [isLoggedIn]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <CommerceContext.Provider value={{ cartCount, wishlistCount, refresh }}>
      {children}
    </CommerceContext.Provider>
  );
}

export const useCommerce = () => useContext(CommerceContext);