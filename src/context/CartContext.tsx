import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, WCProduct } from "@/types/woocommerce";
import { storeApi } from "@/services/storeApi";
import { useLanguage } from "./LanguageContext";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  coupon: string | null;
  discount: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: WCProduct, quantity?: number) => void;
  updateItem: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  applyCoupon: (code: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "zebiza_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [coupon, setCoupon] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback(
    (product: WCProduct, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i,
          );
        }
        return [
          ...prev,
          {
            key: `local-${product.id}`,
            productId: product.id,
            name: product.name,
            slug: product.slug,
            image: product.images[0]?.src ?? "",
            price: Number(product.price),
            quantity,
          },
        ];
      });
      setIsOpen(true);
      // Best-effort sync to the WooCommerce Store API (no-op when unconfigured).
      void storeApi.addItem(product.id, quantity, lang);
    },
    [lang],
  );

  const updateItem = useCallback(
    (key: string, quantity: number) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.key !== key)
          : prev.map((i) => (i.key === key ? { ...i, quantity } : i)),
      );
      void storeApi.updateItem(key, quantity, lang);
    },
    [lang],
  );

  const removeItem = useCallback(
    (key: string) => {
      setItems((prev) => prev.filter((i) => i.key !== key));
      void storeApi.removeItem(key, lang);
    },
    [lang],
  );

  const applyCoupon = useCallback(
    (code: string) => {
      setCoupon(code || null);
      if (code) void storeApi.applyCoupon(code, lang);
    },
    [lang],
  );

  const clear = useCallback(() => {
    setItems([]);
    setCoupon(null);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = coupon ? Math.round(subtotal * 0.1) : 0;
    return {
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      coupon,
      discount,
      total: subtotal - discount,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      clear,
    };
  }, [items, coupon, isOpen, addItem, updateItem, removeItem, applyCoupon, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
