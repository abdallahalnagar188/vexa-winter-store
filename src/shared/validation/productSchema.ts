import { z } from 'zod';

export const productSchema = z.object({
  title_ar: z.string().trim().min(2, 'مطلوب').max(120),
  title_en: z.string().trim().max(120).optional().nullable(),
  slug: z
    .string()
    .trim()
    .min(2, 'مطلوب')
    .regex(/^[a-z0-9-]+$/, 'حروف إنجليزية صغيرة وأرقام وشرطة فقط'),
  category_id: z.string().uuid().optional().nullable(),
  description_ar: z.string().trim().max(2000).optional().nullable(),
  description_en: z.string().trim().max(2000).optional().nullable(),
  base_price: z.number().int().min(1, 'السعر يجب أن يكون أكبر من 0'),
  is_new: z.boolean(),
  is_active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
