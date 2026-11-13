/**
 * GA4 ecommerce helpers. Fires only when gtag/dataLayer exists (after consent).
 * Product id is the stable WooCommerce product id (same as Merchant feed id).
 */

import type { WCProduct } from "@/types/woocommerce";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function push(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const item = { event, ecommerce: payload };
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push(item);
  }
  if (typeof window.gtag === "function") {
    window.gtag("event", event, payload);
  }
}

function mapItem(product: WCProduct, quantity = 1) {
  return {
    item_id: String(product.id),
    item_name: product.name,
    item_brand: product.brand?.name,
    item_category: product.categories[0]?.name,
    price: Number(product.price),
    quantity,
  };
}

export const analytics = {
  viewItemList(products: WCProduct[], listName: string) {
    push("view_item_list", {
      item_list_name: listName,
      items: products.slice(0, 20).map((p) => mapItem(p)),
    });
  },
  selectItem(product: WCProduct, listName: string) {
    push("select_item", {
      item_list_name: listName,
      items: [mapItem(product)],
    });
  },
  viewItem(product: WCProduct) {
    push("view_item", {
      currency: "DKK",
      value: Number(product.price),
      items: [mapItem(product)],
    });
  },
  addToCart(product: WCProduct, quantity: number) {
    push("add_to_cart", {
      currency: "DKK",
      value: Number(product.price) * quantity,
      items: [mapItem(product, quantity)],
    });
  },
  removeFromCart(productId: number, name: string, price: number, quantity: number) {
    push("remove_from_cart", {
      currency: "DKK",
      value: price * quantity,
      items: [{ item_id: String(productId), item_name: name, price, quantity }],
    });
  },
  viewCart(value: number, items: { id: number; name: string; price: number; quantity: number }[]) {
    push("view_cart", {
      currency: "DKK",
      value,
      items: items.map((i) => ({
        item_id: String(i.id),
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  },
  beginCheckout(value: number, items: { id: number; name: string; price: number; quantity: number }[]) {
    push("begin_checkout", {
      currency: "DKK",
      value,
      items: items.map((i) => ({
        item_id: String(i.id),
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  },
  addShippingInfo(value: number, shippingTier: string) {
    push("add_shipping_info", { currency: "DKK", value, shipping_tier: shippingTier });
  },
  addPaymentInfo(value: number, paymentType: string) {
    push("add_payment_info", { currency: "DKK", value, payment_type: paymentType });
  },
  purchase(orderId: string, value: number, items: { id: number; name: string; price: number; quantity: number }[]) {
    push("purchase", {
      transaction_id: orderId,
      currency: "DKK",
      value,
      items: items.map((i) => ({
        item_id: String(i.id),
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  },
};
