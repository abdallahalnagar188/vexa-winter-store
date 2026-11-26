import { describe, expect, it } from 'vitest';
import { normalizeEgPhone } from './phone';
import { checkoutSchema } from './checkoutSchema';
import { buildCourierMessage } from '@/shared/constants/orderStatus';

describe('Egyptian phone normalization & checkout validation', () => {
  it('normalizes Arabic-Indic digits and +20 / 0020 prefixes', () => {
    expect(normalizeEgPhone('٠١٠١٢٣٤٥٦٧٨')).toBe('01012345678');
    expect(normalizeEgPhone('+20 111-234-5678')).toBe('01112345678');
    expect(normalizeEgPhone('00201234567890')).toBe('01234567890');
  });

  it('accepts valid Egyptian mobile & governorate checkout payload', () => {
    const parsed = checkoutSchema.safeParse({
      customer_name: 'أحمد محمود علي',
      phone: '+201012345678',
      phone_secondary: '',
      governorate_id: 1,
      city_area: 'المعادي',
      address_details: 'شارع 9، عمارة 12، الدور الرابع',
      notes: '',
      website: '',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phone).toBe('01012345678');
    }
  });

  it('rejects invalid phone numbers', () => {
    const parsed = checkoutSchema.safeParse({
      customer_name: 'أحمد محمود',
      phone: '01912345678',
      phone_secondary: '',
      governorate_id: 1,
      city_area: 'المعادي',
      address_details: 'شارع 9، عمارة 12',
    });
    expect(parsed.success).toBe(false);
  });

  it('formats Arabic courier copy message cleanly', () => {
    const msg = buildCourierMessage({
      id: '1',
      order_ref: 'WNT-123456',
      status: 'new',
      customer_name: 'سارة علي',
      phone: '01012345678',
      phone_secondary: '01112345678',
      governorate_id: 1,
      governorate_name: 'القاهرة',
      city_area: 'مدينة نصر',
      address_details: 'شارع عباس العقاد',
      notes: 'الاتصال قبل الوصول',
      internal_notes: null,
      subtotal_original: 2300,
      discount_total: 230,
      shipping_fee: 60,
      total_cod: 2130,
      stock_restocked: false,
      created_at: '2026-11-26T00:00:00Z',
      updated_at: '2026-11-26T00:00:00Z',
      order_items: [
        {
          id: 'i1',
          order_id: '1',
          product_id: 'p1',
          variant_id: 'v1',
          product_title: 'هودي شتوي',
          size: 'L',
          color: 'زيتوني',
          image_url: null,
          unit_price: 1150,
          quantity: 2,
          line_original: 2300,
          line_discount: 230,
          line_total: 2070,
          tier_min_qty: 2,
        },
      ],
    });
    expect(msg).toContain('WNT-123456');
    expect(msg).toContain('2 × هودي شتوي (L / زيتوني)');
    expect(msg).toContain('2130 ج.م');
    expect(msg).toContain('موبايل تاني: 01112345678');
  });
});
