import { z } from 'zod';

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Sanitize text to prevent XSS
export function safeText(text: string, maxLength: number = 1000): string {
  if (!text) return '';
  
  return text
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

// Sanitize error messages for display
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose stack traces or sensitive info
    const message = error.message;
    if (message.includes('password') || message.includes('token') || message.includes('key')) {
      return 'An authentication error occurred. Please try again.';
    }
    return safeText(message, 200);
  }
  return 'An unexpected error occurred.';
}

// Validation schemas
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be less than 100 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens');

export const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title must be less than 200 characters');

export const urlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine(url => isValidUrl(url), 'Must be an HTTP or HTTPS URL');

export const emailSchema = z
  .string()
  .email('Must be a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const projectSchema = z.object({
  slug: slugSchema,
  title: titleSchema,
  summary: z.string().max(500, 'Summary must be less than 500 characters'),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed'),
  status: z.enum(['PUBLIC', 'CONFIDENTIAL', 'CONCEPT']),
  detail_level: z.enum(['FULL', 'SUMMARY', 'MINIMAL']),
  featured: z.boolean(),
  published: z.boolean(),
});

export const writingItemSchema = z.object({
  title: titleSchema,
  url: urlSchema,
  platform_label: z.string().max(50, 'Platform label must be less than 50 characters'),
  language: z.enum(['AUTO', 'AR', 'EN']),
  featured: z.boolean(),
  enabled: z.boolean(),
  why_this_matters: z.string().max(500).optional(),
  show_why: z.boolean(),
});

// Rate limiting helper (simple in-memory, for client-side only)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
