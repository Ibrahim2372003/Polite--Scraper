import { z } from 'zod';

// The shape of one finished record. Defined once, checked against every
// page — this is the recipe the raw ingredients (Stage 3) get turned into.
export const BookSchema = z.object({
  title: z.string().min(1, 'title is empty'),
  product_url: z
    .string()
    .url('product_url is not a valid URL')
    .refine((u) => u.startsWith('https://'), 'product_url must be absolute and start with https://'),
  price_text: z.string().min(1, 'price_text is empty'),
  price_gbp: z.number({ invalid_type_error: 'price_gbp must be a number' }).positive('price_gbp must be a positive number'),
  availability_text: z.string().min(1, 'availability_text is empty'),
  rating_text: z.string().nullable(),
  description: z.string().nullable(), // optional on the page -> null, never invented
  source_page: z
    .string()
    .url('source_page is not a valid URL')
    .refine((u) => u.startsWith('https://'), 'source_page must be absolute and start with https://'),
  fetched_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/, 'fetched_at must be an ISO 8601 UTC timestamp'),
});

/**
 * Validate one record. Never throws — returns a result object so the
 * caller can route good records to books.json and bad ones to
 * errors.json with a human-readable reason.
 */
export function validateRecord(record) {
  const result = BookSchema.safeParse(record);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const reason = result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
  return { ok: false, reason };
}
