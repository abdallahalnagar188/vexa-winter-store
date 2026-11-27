export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'sent_to_shipping'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type DiscountType = 'percent' | 'fixed';

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name_ar: string;
          name_en: string;
          sort_order: number;
          is_active: boolean;
          show_in_header: boolean;
        };
        Insert: {
          id?: string;
          slug: string;
          name_ar: string;
          name_en: string;
          sort_order?: number;
          is_active?: boolean;
          show_in_header?: boolean;
        };
        Update: {
          id?: string;
          slug?: string;
          name_ar?: string;
          name_en?: string;
          sort_order?: number;
          is_active?: boolean;
          show_in_header?: boolean;
        };
        Relationships: [];
      };
      products: {
        Row: {
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
        };
        Insert: {
          id?: string;
          slug: string;
          category_id?: string | null;
          title_ar: string;
          title_en?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          base_price: number;
          is_new?: boolean;
          is_active?: boolean;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          category_id?: string | null;
          title_ar?: string;
          title_en?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          base_price?: number;
          is_new?: boolean;
          is_active?: boolean;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          storage_path: string | null;
          sort_order: number;
          is_primary: boolean;
          color_name: string | null;
          color_hex: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          storage_path?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          color_name?: string | null;
          color_hex?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          storage_path?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          color_name?: string | null;
          color_hex?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string;
          color_name: string;
          color_hex: string | null;
          sku: string | null;
          stock: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          product_id: string;
          size: string;
          color_name: string;
          color_hex?: string | null;
          sku?: string | null;
          stock?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          product_id?: string;
          size?: string;
          color_name?: string;
          color_hex?: string | null;
          sku?: string | null;
          stock?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      discount_tiers: {
        Row: {
          id: string;
          product_id: string | null;
          min_qty: number;
          discount_type: DiscountType;
          value: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          min_qty: number;
          discount_type: DiscountType;
          value: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          min_qty?: number;
          discount_type?: DiscountType;
          value?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'discount_tiers_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      coupons: {
        Row: {
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
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          min_order_amount?: number;
          max_uses?: number | null;
          used_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: DiscountType;
          discount_value?: number;
          min_order_amount?: number;
          max_uses?: number | null;
          used_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      governorate_shipping: {
        Row: {
          id: number;
          name_ar: string;
          name_en: string;
          fee: number;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id: number;
          name_ar: string;
          name_en: string;
          fee?: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: number;
          name_ar?: string;
          name_en?: string;
          fee?: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      store_settings: {
        Row: {
          key: string;
          value: Json;
          is_public: boolean;
        };
        Insert: {
          key: string;
          value: Json;
          is_public?: boolean;
        };
        Update: {
          key?: string;
          value?: Json;
          is_public?: boolean;
        };
        Relationships: [];
      };
      orders: {
        Row: {
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
          coupon_code: string | null;
          coupon_discount: number;
          shipping_fee: number;
          total_cod: number;
          stock_restocked: boolean;
          idempotency_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_ref: string;
          status?: OrderStatus;
          customer_name: string;
          phone: string;
          phone_secondary?: string | null;
          governorate_id?: number | null;
          governorate_name: string;
          city_area: string;
          address_details: string;
          notes?: string | null;
          internal_notes?: string | null;
          subtotal_original?: number;
          discount_total?: number;
          coupon_code?: string | null;
          coupon_discount?: number;
          shipping_fee?: number;
          total_cod?: number;
          stock_restocked?: boolean;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_ref?: string;
          status?: OrderStatus;
          customer_name?: string;
          phone?: string;
          phone_secondary?: string | null;
          governorate_id?: number | null;
          governorate_name?: string;
          city_area?: string;
          address_details?: string;
          notes?: string | null;
          internal_notes?: string | null;
          subtotal_original?: number;
          discount_total?: number;
          coupon_code?: string | null;
          coupon_discount?: number;
          shipping_fee?: number;
          total_cod?: number;
          stock_restocked?: boolean;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
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
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_title: string;
          size: string;
          color: string;
          image_url?: string | null;
          unit_price: number;
          quantity: number;
          line_original: number;
          line_discount?: number;
          line_total: number;
          tier_min_qty?: number | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_title?: string;
          size?: string;
          color?: string;
          image_url?: string | null;
          unit_price?: number;
          quantity?: number;
          line_original?: number;
          line_discount?: number;
          line_total?: number;
          tier_min_qty?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?: string | null;
          to_status: string;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          from_status?: string | null;
          to_status?: string;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_status_history_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      homepage_hero: {
        Row: {
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
        };
        Insert: {
          id?: string;
          badge_ar: string;
          badge_en: string;
          title_ar: string;
          title_en: string;
          subtitle_ar: string;
          subtitle_en: string;
          primary_cta_ar: string;
          primary_cta_en: string;
          primary_cta_link?: string;
          secondary_cta_ar: string;
          secondary_cta_en: string;
          secondary_cta_link?: string;
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
          display_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['homepage_hero']['Insert']>;
        Relationships: [];
      };
      homepage_marquee_items: {
        Row: {
          id: string;
          text_ar: string;
          text_en: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          text_ar: string;
          text_en: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['homepage_marquee_items']['Insert']>;
        Relationships: [];
      };
      homepage_promo_banner: {
        Row: {
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
        };
        Insert: {
          id?: string;
          badge_ar: string;
          badge_en: string;
          title_ar: string;
          title_en: string;
          subtitle_ar: string;
          subtitle_en: string;
          cta_ar: string;
          cta_en: string;
          cta_link?: string;
          background_image_url: string;
          overlay_opacity?: number;
          pill_tags_ar?: string[];
          pill_tags_en?: string[];
          is_active?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['homepage_promo_banner']['Insert']>;
        Relationships: [];
      };
      homepage_category_cards: {
        Row: {
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
        };
        Insert: {
          id?: string;
          category_slug: string;
          title_ar: string;
          title_en: string;
          subtitle_ar?: string;
          subtitle_en?: string;
          cover_image_url: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['homepage_category_cards']['Insert']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_guest_order: {
        Args: { p: Json };
        Returns: { order_ref: string; total_cod: number; duplicate: boolean };
      };
      track_order: {
        Args: { p_ref: string; p_phone: string };
        Returns: Json;
      };
      validate_coupon: {
        Args: { p_code: string; p_subtotal: number };
        Returns: Json;
      };
      admin_get_customer_risk_stats: {
        Args: { p_phones: string[] };
        Returns: Json;
      };
      admin_update_order_status: {
        Args: {
          p_order_id: string;
          p_new_status: string;
          p_note?: string | null;
          p_restock?: boolean;
        };
        Returns: undefined;
      };
      admin_delete_product: {
        Args: { p_product_id: string };
        Returns: { storage_paths: string[] };
      };
      admin_create_manual_order: {
        Args: { p: Json };
        Returns: { order_id: string; order_ref: string; total_cod: number };
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
