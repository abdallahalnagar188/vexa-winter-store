import { z } from 'zod';
import { egPhoneSchema, optionalEgPhoneSchema } from './phone';

const stripControlChars = (val: string) =>
  Array.from(val)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim();

export const checkoutSchema = z.object({
  customer_name: z
    .string()
    .transform(stripControlChars)
    .pipe(z.string().min(3, 'name_min').max(100, 'name_max')),
  phone: egPhoneSchema,
  phone_secondary: optionalEgPhoneSchema,
  governorate_id: z.number().int().min(1, 'gov_required').max(27, 'gov_required'),
  city_area: z
    .string()
    .transform(stripControlChars)
    .pipe(z.string().min(2, 'city_min').max(80, 'city_max')),
  address_details: z
    .string()
    .transform(stripControlChars)
    .pipe(z.string().min(5, 'address_min').max(300, 'address_max')),
  notes: z
    .string()
    .transform(stripControlChars)
    .pipe(z.string().max(300))
    .optional(),
  website: z.string().optional(), // honeypot
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
