// Shared domain types modelled on WooCommerce Store API shapes we consume.

export interface WCImage {
  id: number;
  src: string;
  alt: string;
}

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  description?: string;
  parent?: number;
  image?: WCImage | null;
}

export interface WCBrand {
  id: number;
  name: string;
  slug: string;
  count?: number;
  description?: string;
  image?: WCImage | null;
}

export type ZBadge =
  | "nyhed"
  | "populaer"
  | "beauty"
  | "gavefund"
  | "saeson"
  | "prisvenligt"
  | "trend"
  | "tilbud";

export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink?: string;
  sku?: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: "instock" | "outofstock" | "onbackorder";
  average_rating: string;
  rating_count: number;
  short_description: string;
  description: string;
  images: WCImage[];
  categories: { id: number; name: string; slug: string }[];
  brand?: { id: number; name: string; slug: string };
  brands?: { id: number; name: string; slug: string }[];
  gtin?: string;
  mpn?: string;
  badges?: ZBadge[];
  fitsWith?: string[];
  goodFind?: string;
}

export interface CartItem {
  key: string;
  productId: number;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
}

export interface ProductQuery {
  category?: string; // slug or numeric id as string
  categoryId?: number;
  search?: string;
  onSale?: boolean;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  orderby?: "popularity" | "date" | "price" | "price-desc" | "saving" | "relevance";
  perPage?: number;
  page?: number;
  tag?: string;
  brand?: string;
  /** When true, exclude likely non-beauty merchandising items. */
  beautyOnly?: boolean;
}

/** Raw Store API product (subset). */
export interface StoreProduct {
  id: number;
  name: string;
  slug: string;
  permalink?: string;
  sku?: string;
  short_description?: string;
  description?: string;
  on_sale: boolean;
  is_in_stock: boolean;
  is_on_backorder?: boolean;
  average_rating?: string;
  review_count?: number;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
  images: { id: number; src: string; alt?: string }[];
  categories?: { id: number; name: string; slug: string }[];
  brands?: { id: number; name: string; slug: string }[];
  tags?: { id: number; name: string; slug: string }[];
}
