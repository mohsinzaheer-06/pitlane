export interface Category {
  id: number;
  name: string;
  slug: string;
  group_name: 'APPAREL' | 'ACCESSORIES' | 'COLLECTIBLES';
  sort_order: number;
  product_count?: number;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  hero_image: string;
  is_featured: number;
  sort_order: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  alt_text: string;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  size: string;
  color_name: string;
  color_hex: string;
  stock_qty: number;
  price_override_pkr: number | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku_prefix: string;
  description: string;
  material_info: string;
  washing_instructions: string;
  fit_notes: string;
  base_price_pkr: number;
  discount_percent: number;
  effective_price_pkr: number;
  category_id: number;
  category_name: string;
  category_slug: string;
  category_group: 'APPAREL' | 'ACCESSORIES' | 'COLLECTIBLES';
  collection_id: number | null;
  collection_name: string | null;
  collection_slug: string | null;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  is_featured: number;
  is_new_arrival: number;
  is_bestseller: number;
  is_limited_edition: number;
  edition_run: string;
  total_stock: number;
  images: ProductImage[];
  variants: ProductVariant[];
  review_count: number;
  avg_rating: number;
}

export interface Review {
  id: number;
  product_id: number;
  author_name: string;
  author_city: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: number;
  created_at: string;
  product_name?: string;
  product_slug?: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rateFromPkr: number;
  decimals: number;
}

export interface ShippingZoneConfig {
  zoneId: string;
  label: string;
  countries: string[];
  baseRatePkr: number;
  freeOverPkr: number | null;
  taxRatePercent: number;
  estimatedDays: string;
}

export interface CartItem {
  productId: number;
  variantId: number;
  slug: string;
  name: string;
  sku: string;
  size: string;
  colorName: string;
  imageUrl: string;
  unitPricePkr: number;
  quantity: number;
  maxStock: number;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN';
  email_verified: number;
  preferred_currency: string;
  marketing_opt_in: number;
  whatsapp_opt_in: number;
}

export interface OrderRecord {
  id: number;
  order_number: string;
  guest_email: string;
  customer_name: string;
  phone: string;
  country: string;
  city: string;
  postal_code: string;
  street_address: string;
  order_notes: string;
  currency: string;
  exchange_rate: number;
  subtotal_pkr: number;
  shipping_pkr: number;
  discount_pkr: number;
  tax_pkr: number;
  total_pkr: number;
  total_display_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  tracking_code: string;
  courier_name: string;
  coupon_code: string;
  created_at: string;
  items?: Array<{
    id: number;
    product_name: string;
    sku: string;
    size: string;
    color_name: string;
    quantity: number;
    unit_price_pkr: number;
    line_total_pkr: number;
  }>;
}
