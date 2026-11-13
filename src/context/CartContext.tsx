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
import { analytics } from "@/lib/analytics";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  coupon: string | null;
  discount: number;
  total: number;
  isOpen: boolean;
  syncing: boolean;
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

function mapStoreCartItems(
  items: {
    key: string;
    id: number;
    quantity: number;
    name: string;
    images?: { src: string }[];
    prices?: { price: string; currency_minor_unit?: number };
    permalink?: string;
  }[],
): CartItem[] {
  return items.map((i) => {
    const unit = i.prices?.currency_minor_unit ?? 2;
    const price = Number(i.prices?.price ?? 0) / Math.pow(10, unit);
    const slug =
      i.permalink?.split("/").filter(Boolean).pop()?.replace(/\/$/, "") ?? String(i.id);
    return {
      key: i.key,
      productId: i.id,
      name: i.name,
      slug,
      image: i.images?.[0]?.src ?? "",
      price,
      quantity: i.quantity,
    };
  });
}

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
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Establish Store API session (nonce + cart token)
  useEffect(() => {
    void storeApi.ensureSession(lang);
  }, [lang]);

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
      analytics.addToCart(product, quantity);
      setSyncing(true);
      void storeApi.addItem(product.id, quantity, lang).then((res) => {
        setSyncing(false);
        if (res.ok && res.data?.items) {
          setItems(mapStoreCartItems(res.data.items));
        }
      });
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
      if (!key.startsWith("local-")) {
        void storeApi.updateItem(key, quantity, lang).then((res) => {
          if (res.ok && res.data?.items) setItems(mapStoreCartItems(res.data.items));
        });
      }
    },
    [lang],
  );

  const removeItem = useCallback(
    (key: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.key === key);
        if (item) analytics.removeFromCart(item.productId, item.name, item.price, item.quantity);
        return prev.filter((i) => i.key !== key);
      });
      if (!key.startsWith("local-")) {
        void storeApi.removeItem(key, lang).then((res) => {
          if (res.ok && res.data?.items) setItems(mapStoreCartItems(res.data.items));
        });
      }
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
      syncing,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      clear,
    };
  }, [items, coupon, isOpen, syncing, addItem, updateItem, removeItem, applyCoupon, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
