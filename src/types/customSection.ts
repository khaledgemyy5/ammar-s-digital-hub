import { z } from 'zod';

// ============ Custom Section Types for Projects ============

export const CUSTOM_SECTION_TYPES = ['markdown', 'bullets', 'code', 'embed'] as const;
export type CustomSectionType = typeof CUSTOM_SECTION_TYPES[number];

// Allowed embed domains (whitelist)
export const ALLOWED_EMBED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'loom.com',
  'www.loom.com',
  'figma.com',
  'www.figma.com',
  'docs.google.com',
  'drive.google.com',
  'github.com',
  'www.github.com',
] as const;

// Code language options
export const CODE_LANGUAGES = [
  'javascript',
  'typescript', 
  'python',
  'html',
  'css',
  'json',
  'sql',
  'bash',
  'markdown',
  'yaml',
  'other',
] as const;
export type CodeLanguage = typeof CODE_LANGUAGES[number];

// Check if a URL domain is allowed for embedding
export function isAllowedEmbedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_EMBED_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

// Get embed URL (transforms URLs for embedding)
export function getEmbedUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    
    // YouTube embed transformation
    if (hostname.includes('youtube.com') && parsedUrl.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${parsedUrl.searchParams.get('v')}`;
    }
    if (hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${parsedUrl.pathname}`;
    }
    
    // Loom embed transformation
    if (hostname.includes('loom.com') && parsedUrl.pathname.includes('/share/')) {
      const videoId = parsedUrl.pathname.split('/share/')[1];
      return `https://www.loom.com/embed/${videoId}`;
    }
    
    // Figma embed (keep as is, Figma supports direct embed)
    if (hostname.includes('figma.com')) {
      return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
    }
    
    // Google Docs/Drive - return as preview
    if (hostname === 'docs.google.com' || hostname === 'drive.google.com') {
      if (url.includes('/preview')) return url;
      return url.replace('/view', '/preview').replace('/edit', '/preview');
    }
    
    // GitHub - can't really embed, return null to show link button
    if (hostname.includes('github.com')) {
      return null;
    }
    
    return url;
  } catch {
    return null;
  }
}

// ============ Custom Section Interface ============

export interface ProjectCustomSection {
  id: string;
  type: CustomSectionType;
  title: string;
  enabled: boolean;
  order: number;
  // Content based on type
  markdown?: string;
  bullets?: string[];
  code?: {
    content: string;
    language: CodeLanguage;
  };
  embed?: {
    url: string;
    isAllowed?: boolean; // Computed from URL validation
  };
}

// ============ Zod Schemas for Validation ============

// Sanitize markdown - strip dangerous HTML/scripts
export function sanitizeMarkdown(content: string): string {
  // Remove script tags
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  // Remove inline event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[\"'][^\"']*[\"']/gi, '');
  // Remove inline styles with dangerous content
  sanitized = sanitized.replace(/style\s*=\s*[\"'][^\"']*expression\s*\([^)]*\)[^\"']*[\"']/gi, '');
  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*[\"']javascript:[^\"']*[\"']/gi, 'href=\"#\"');
  return sanitized;
}

const markdownSchema = z.string().max(10000, 'Content too long (max 10000 characters)').transform(sanitizeMarkdown);

const bulletsSchema = z.array(z.string().max(500, 'Bullet too long')).max(20, 'Maximum 20 bullets');

const codeSchema = z.object({
  content: z.string().max(5000, 'Code too long'),
  language: z.enum(CODE_LANGUAGES),
});

const embedSchema = z.object({
  url: z.string().url('Invalid URL').max(500, 'URL too long'),
  isAllowed: z.boolean().optional(),
});

export const projectCustomSectionSchema = z.object({
  id: z.string(),
  type: z.enum(CUSTOM_SECTION_TYPES),
  title: z.string().min(1, 'Title required').max(100, 'Title too long'),
  enabled: z.boolean(),
  order: z.number(),
  markdown: markdownSchema.optional(),
  bullets: bulletsSchema.optional(),
  code: codeSchema.optional(),
  embed: embedSchema.optional(),
});

// Validate custom sections array (max 2, max 1 embed)
export function validateCustomSections(sections: ProjectCustomSection[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (sections.length > 2) {
    errors.push('Maximum 2 custom sections allowed');
  }
  
  const embedCount = sections.filter(s => s.type === 'embed').length;
  if (embedCount > 1) {
    errors.push('Maximum 1 embed section allowed');
  }
  
  // Validate each section
  sections.forEach((section, idx) => {
    try {
      projectCustomSectionSchema.parse(section);
    } catch (err: any) {
      err.errors?.forEach((e: any) => {
        errors.push(`Section ${idx + 1}: ${e.message}`);
      });
    }
  });
  
  return { valid: errors.length === 0, errors };
}

// ============ Create Empty Section ============

export function createEmptySection(type: CustomSectionType, order: number): ProjectCustomSection {
  const base = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: 'New Section',
    enabled: true,
    order,
  };
  
  switch (type) {
    case 'markdown':
      return { ...base, markdown: '' };
    case 'bullets':
      return { ...base, bullets: [''] };
    case 'code':
      return { ...base, code: { content: '', language: 'javascript' } };
    case 'embed':
      return { ...base, embed: { url: '', isAllowed: false } };
    default:
      return base;
  }
}

// ============ Migration Helper ============

// Migrate old custom section format to new format
export function migrateCustomSections(oldSections: any[]): ProjectCustomSection[] {
  if (!Array.isArray(oldSections)) return [];
  
  return oldSections.slice(0, 2).map((old, idx) => {
    // Old format: { id, title, kind, type, content, contentText, bullets }
    const isBullets = old.kind === 'bullets' || old.type === 'bullets';
    const content = old.contentText || old.content || '';
    
    if (isBullets) {
      return {
        id: old.id || `custom-migrated-${idx}`,
        type: 'bullets' as CustomSectionType,
        title: old.title || 'Untitled',
        enabled: true,
        order: idx,
        bullets: old.bullets || content.split('\n').filter(Boolean),
      };
    }
    
    return {
      id: old.id || `custom-migrated-${idx}`,
      type: 'markdown' as CustomSectionType,
      title: old.title || 'Untitled',
      enabled: true,
      order: idx,
      markdown: content,
    };
  });
}
