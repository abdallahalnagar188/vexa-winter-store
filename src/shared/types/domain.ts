import type { DiscountType, OrderStatus } from './database';

export interface Category {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
  is_primary: boolean;
  /** Color variant this image belongs to. null = shown for all colors (fallback). */
  color_name: string | null;
  color_hex: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color_name: string;
  color_hex: string | null;
  sku: string | null;
  stock: number;
  is_active: boolean;
}

export interface ProductWithDetails {
  id: string;
  slug: string;
  category_id: string | null;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  base_price: number;
  is_new: boolean;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  product_images: ProductImage[];
  product_variants: ProductVariant[];
}

export interface DiscountTier {
  id: string;
  product_id: string | null;
  min_qty: number;
  discount_type: DiscountType;
  value: number;
  is_active: boolean;
}

export interface GovernorateShipping {
  id: number;
  name_ar: string;
  name_en: string;
  fee: number;
  is_active: boolean;
  sort_order: number;
}

export interface CartSnapshot {
  titleAr: string;
  titleEn: string | null;
  size: string;
  colorName: string;
  colorHex: string | null;
  imageUrl: string | null;
  slug: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  quantity: number;
  snapshot: CartSnapshot;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_title: string;
  size: string;
  color: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_original: number;
  line_discount: number;
  line_total: number;
  tier_min_qty: number | null;
}

export interface OrderStatusHistoryRow {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface OrderRecord {
  id: string;
  order_ref: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  phone_secondary: string | null;
  governorate_id: number | null;
  governorate_name: string;
  city_area: string;
  address_details: string;
  notes: string | null;
  internal_notes: string | null;
  subtotal_original: number;
  discount_total: number;
  shipping_fee: number;
  total_cod: number;
  stock_restocked: boolean;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  order_status_history?: OrderStatusHistoryRow[];
}

export interface TrackedOrder {
  order_ref: string;
  status: OrderStatus;
  created_at: string;
  governorate: string;
  total_cod: number;
  items: {
    title: string;
    size: string;
    color: string;
    quantity: number;
  }[];
}
