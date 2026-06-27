'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
}

export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: 'SUPER_ADMIN' | 'STORE_OWNER' | 'STORE_ADMIN' | 'CUSTOMER' | 'ADMIN';
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  barcode: string | null;
  nomenclatureCode: string | null;
  description: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  unit: string;
  image: string | null;
  categoryId: string | null;
  isActive: boolean;
  category?: Category | null;
}

export interface CartItem {
  id?: string;
  productId: string;
  product: Product;
  quantity: number;
}

interface AppContextType {
  store: any;
  fetchStore: () => Promise<void>;
  user: User | null;
  loadingUser: boolean;
  cart: CartItem[];
  loadingCart: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  fetchUser: () => Promise<void>;
  fetchCart: () => Promise<void>;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  logout: () => Promise<void>;
  cartCount: number;
  totalAmount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const getStoreSlug = () => {
    if (typeof window === 'undefined') return '';
    const parts = window.location.pathname.split('/');
    if (parts[1] === 'store' || parts[1] === 'miniapp') {
      return parts[2] || '';
    }
    return '';
  };

  const storeFetch = async (url: string, init?: RequestInit) => {
    const slug = getStoreSlug();
    const headers = new Headers(init?.headers);
    if (slug) {
      headers.set('x-store-slug', slug);
    }
    return fetch(url, {
      ...init,
      headers
    });
  };
  const [store, setStore] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);

  const fetchStore = async () => {
    try {
      const res = await storeFetch('/api/store');
      if (res.ok) {
        const data = await res.json();
        setStore(data.store);
      }
    } catch (e) {
      console.error("Error fetching store:", e);
    }
  };
  const [loadingUser, setLoadingUser] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await storeFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchCart = async () => {
    if (user) {
      setLoadingCart(true);
      try {
        const res = await storeFetch('/api/cart');
        if (res.ok) {
          const data = await res.json();
          const items = data.cartItems.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            product: item.product,
            quantity: Number(item.quantity),
          }));
          setCart(items);
        }
      } catch (e) {
        console.error('Error fetching cart:', e);
      } finally {
        setLoadingCart(false);
      }
    } else {
      const localCart = localStorage.getItem('guest_cart');
      if (localCart) {
        try {
          setCart(JSON.parse(localCart));
        } catch (e) {
          setCart([]);
        }
      } else {
        setCart([]);
      }
    }
  };

  useEffect(() => {
    fetchStore();
    fetchUser();
  }, []);

  useEffect(() => {
    fetchCart();
  }, [user]);

  const syncCartAfterLogin = async () => {
    const localCart = localStorage.getItem('guest_cart');
    if (localCart && user) {
      try {
        const items = JSON.parse(localCart) as CartItem[];
        for (const item of items) {
          await storeFetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
          });
        }
        localStorage.removeItem('guest_cart');
        fetchCart();
      } catch (e) {
        console.error('Error syncing cart:', e);
      }
    }
  };

  useEffect(() => {
    if (user) {
      syncCartAfterLogin();
    }
  }, [user]);

  const addToCart = async (product: Product, quantity: number) => {
    const existing = cart.find((item) => item.productId === product.id);
    const newQty = existing ? existing.quantity + quantity : quantity;

    if (newQty > product.stock) {
      alert(`Недостаточно товара на складе. Доступно: ${product.stock} ${product.unit}`);
      return;
    }

    if (user) {
      try {
        const res = await storeFetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: newQty }),
        });
        if (res.ok) {
          fetchCart();
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const updated = existing
        ? cart.map((item) => (item.productId === product.id ? { ...item, quantity: newQty } : item))
        : [...cart, { productId: product.id, product, quantity }];
      setCart(updated);
      localStorage.setItem('guest_cart', JSON.stringify(updated));
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    if (quantity > item.product.stock) {
      alert(`Недостаточно товара на складе. Доступно: ${item.product.stock} ${item.product.unit}`);
      return;
    }

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (user) {
      try {
        const res = await storeFetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity }),
        });
        if (res.ok) {
          fetchCart();
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const updated = cart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      setCart(updated);
      localStorage.setItem('guest_cart', JSON.stringify(updated));
    }
  };

  const removeFromCart = async (productId: string) => {
    if (user) {
      try {
        const res = await storeFetch(`/api/cart?productId=${productId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchCart();
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const updated = cart.filter((item) => item.productId !== productId);
      setCart(updated);
      localStorage.setItem('guest_cart', JSON.stringify(updated));
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        const res = await storeFetch('/api/cart', {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchCart();
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setCart([]);
      localStorage.removeItem('guest_cart');
    }
  };

  const logout = async () => {
    try {
      await storeFetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setCart([]);
      localStorage.removeItem('guest_cart');
    } catch (e) {
      console.error(e);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  return (
    <AppContext.Provider
      value={{
        store,
        fetchStore,
        user,
        loadingUser,
        cart,
        loadingCart,
        showLoginModal,
        setShowLoginModal,
        fetchUser,
        fetchCart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        logout,
        cartCount,
        totalAmount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
