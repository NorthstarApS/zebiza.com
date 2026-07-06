// Shared domain types modelled on the WooCommerce REST API shapes we consume.

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
  category?: string;
  search?: string;
  onSale?: boolean;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  orderby?: "popularity" | "date" | "price" | "price-desc" | "saving" | "relevance";
  perPage?: number;
  tag?: string;
}
