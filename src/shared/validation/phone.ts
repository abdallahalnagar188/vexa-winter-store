import { z } from 'zod';
import { normalizeArabicDigits } from '@/lib/format';

export const EG_PHONE_REGEX = /^01[0125][0-9]{8}$/;

export function normalizeEgPhone(raw: string): string {
  const clean = normalizeArabicDigits(raw).replace(/[\s\-()]/g, '');
  if (/^\+?20[0-9]{10}$/.test(clean)) {
    return '0' + clean.replace(/^\+?20/, '');
  }
  if (/^0020[0-9]{10}$/.test(clean)) {
    return '0' + clean.slice(4);
  }
  return clean;
}

export const egPhoneSchema = z
  .string()
  .transform((v) => normalizeEgPhone(v))
  .refine((v) => EG_PHONE_REGEX.test(v), {
    message: 'invalid_phone',
  });

export const optionalEgPhoneSchema = z
  .string()
  .transform((v) => {
    if (!v.trim()) return '';
    return normalizeEgPhone(v);
  })
  .refine((v) => v === '' || EG_PHONE_REGEX.test(v), {
    message: 'invalid_phone',
  });
