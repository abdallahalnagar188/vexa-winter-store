import type { DiscountType, OrderStatus } from './database';

export interface Category {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
  show_in_header: boolean;
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

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AppliedCoupon {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
}

export interface CustomerRiskStat {
  phone: string;
  total_orders: number;
  delivered_count: number;
  returned_count: number;
  cancelled_count: number;
}

export interface DashboardAnalytics {
  unique_visits: number;
  page_views: number;
  product_views: number;
  add_to_cart_count: number;
  orders_count: number;
  valid_orders_count: number;
  conversion_rate_pct: number;
  delivered_revenue: number;
  shipping_pending_cod: number;
  aov: number;
  delivery_rate_pct: number;
  return_rate_pct: number;
  pipeline: {
    new: number;
    confirmed: number;
    sent_to_shipping: number;
    delivered: number;
    returned: number;
    cancelled: number;
  };
  top_viewed_products: {
    product_id: string;
    title_ar: string;
    title_en: string | null;
    slug: string | null;
    views: number;
  }[];
  top_selling_products: {
    product_id: string | null;
    title_ar: string;
    size: string;
    units_sold: number;
    revenue: number;
  }[];
  top_governorates: {
    governorate_name: string;
    orders_count: number;
    revenue: number;
  }[];
  series: {
    date: string;
    orders_count: number;
    delivered_revenue: number;
    total_revenue: number;
    unique_visits: number;
  }[];
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

export interface HomepageHero {
  id: string;
  badge_ar: string;
  badge_en: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  primary_cta_ar: string;
  primary_cta_en: string;
  primary_cta_link: string;
  secondary_cta_ar: string;
  secondary_cta_en: string;
  secondary_cta_link: string;
  hero_image_url: string;
  floating_tag_title_ar: string;
  floating_tag_title_en: string;
  floating_tag_badge_ar: string;
  floating_tag_badge_en: string;
  stat_1_value: string;
  stat_1_label_ar: string;
  stat_1_label_en: string;
  stat_2_value: string;
  stat_2_label_ar: string;
  stat_2_label_en: string;
  stat_3_value: string;
  stat_3_label_ar: string;
  stat_3_label_en: string;
  display_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface HomepageMarqueeItem {
  id: string;
  text_ar: string;
  text_en: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface HomepagePromoBanner {
  id: string;
  badge_ar: string;
  badge_en: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  cta_ar: string;
  cta_en: string;
  cta_link: string;
  background_image_url: string;
  overlay_opacity: number;
  pill_tags_ar: string[];
  pill_tags_en: string[];
  is_active: boolean;
  updated_at: string;
}

export interface HomepageCategoryCard {
  id: string;
  category_slug: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  cover_image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface HomepageContentBundle {
  heroes: HomepageHero[];
  marqueeItems: HomepageMarqueeItem[];
  promoBanner: HomepagePromoBanner | null;
  categoryCards: HomepageCategoryCard[];
}

export interface CartItem {
  cartItemKey: string;
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
  coupon_code?: string | null;
  coupon_discount?: number;
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
  subtotal: number;
  bundle_discount: number;
  coupon_code: string | null;
  coupon_discount: number;
  shipping_fee: number;
  total_cod: number;
  items: {
    title: string;
    size: string;
    color: string;
    quantity: number;
  }[];
}
