import { z } from 'zod';

// ============ Experience Snapshot Types ============

// Single experience item (max 3 per section)
export interface ExperienceSnapshotItem {
  id: string;
  enabled: boolean;
  dateRange: string; // e.g., "2022 – Present"
  roleTitle: string; // e.g., "Senior Technical Product Manager"
  orgName: string; // e.g., "AI Startup"
  blurb: string; // One-line description (max 180 chars)
  linkEnabled: boolean;
  linkHref: string;
  highlight: boolean; // Optional: highlight first item
}

// CTA configuration
export interface ExperienceSnapshotCTA {
  enabled: boolean;
  label: string; // default: "Full Resume"
  href: string; // default: "/resume"
}

// Timeline style options
export interface ExperienceSnapshotTimelineStyle {
  showTimelineLine: boolean;
  showDots: boolean;
}

// Full Experience Snapshot configuration
export interface ExperienceSnapshotFullConfig {
  enabled: boolean;
  showTitle: boolean;
  title: string;
  cta: ExperienceSnapshotCTA;
  timelineStyle: ExperienceSnapshotTimelineStyle;
  items: ExperienceSnapshotItem[];
}

// ============ Default Configuration ============

export const defaultExperienceSnapshotConfig: ExperienceSnapshotFullConfig = {
  enabled: true,
  showTitle: true,
  title: 'Experience Snapshot',
  cta: {
    enabled: true,
    label: 'Full Resume',
    href: '/resume',
  },
  timelineStyle: {
    showTimelineLine: true,
    showDots: true,
  },
  items: [
    {
      id: '1',
      enabled: true,
      dateRange: '2022 – Present',
      roleTitle: 'Senior Technical Product Manager',
      orgName: 'AI Startup',
      blurb: 'Leading product strategy for LLM-powered features serving 100K+ users.',
      linkEnabled: false,
      linkHref: '',
      highlight: true,
    },
    {
      id: '2',
      enabled: true,
      dateRange: '2020 – 2022',
      roleTitle: 'Product Manager',
      orgName: 'Tech Company',
      blurb: 'Shipped core platform features that increased engagement by 40%.',
      linkEnabled: false,
      linkHref: '',
      highlight: false,
    },
    {
      id: '3',
      enabled: true,
      dateRange: '2018 – 2020',
      roleTitle: 'Software Engineer',
      orgName: 'Enterprise SaaS',
      blurb: 'Built scalable backend services handling 1M+ daily requests.',
      linkEnabled: false,
      linkHref: '',
      highlight: false,
    },
  ],
};

// ============ Zod Validation Schemas ============

export const experienceSnapshotItemSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
  dateRange: z.string().min(1, 'Date range is required').max(50),
  roleTitle: z.string().min(1, 'Role title is required').max(100),
  orgName: z.string().min(1, 'Organization name is required').max(100),
  blurb: z.string().max(180, 'Description must be under 180 characters'),
  linkEnabled: z.boolean(),
  linkHref: z.string().max(500).optional().or(z.literal('')),
  highlight: z.boolean(),
});

export const experienceSnapshotCTASchema = z.object({
  enabled: z.boolean(),
  label: z.string().min(1).max(50),
  href: z.string().min(1).max(200),
});

export const experienceSnapshotTimelineStyleSchema = z.object({
  showTimelineLine: z.boolean(),
  showDots: z.boolean(),
});

export const experienceSnapshotConfigSchema = z.object({
  enabled: z.boolean(),
  showTitle: z.boolean(),
  title: z.string().min(1).max(100),
  cta: experienceSnapshotCTASchema,
  timelineStyle: experienceSnapshotTimelineStyleSchema,
  items: z.array(experienceSnapshotItemSchema).max(3, 'Maximum 3 items allowed'),
});

// ============ Helper Functions ============

export function generateItemId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createEmptyItem(): ExperienceSnapshotItem {
  return {
    id: generateItemId(),
    enabled: true,
    dateRange: '',
    roleTitle: '',
    orgName: '',
    blurb: '',
    linkEnabled: false,
    linkHref: '',
    highlight: false,
  };
}

export function validateConfig(config: ExperienceSnapshotFullConfig): { valid: boolean; errors: string[] } {
  const result = experienceSnapshotConfigSchema.safeParse(config);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}

// Migration helper for legacy ExperienceSnapshotConfig
export function migrateToExperienceSnapshotFullConfig(
  legacyConfig: any
): ExperienceSnapshotFullConfig {
  // If already new format
  if (legacyConfig?.items?.[0]?.id && legacyConfig?.timelineStyle) {
    return {
      ...defaultExperienceSnapshotConfig,
      ...legacyConfig,
    };
  }

  // Convert from old ExperienceSnapshotConfig format
  const oldItems = legacyConfig?.items || [];
  const newItems: ExperienceSnapshotItem[] = oldItems.slice(0, 3).map((item: any, index: number) => ({
    id: generateItemId(),
    enabled: true,
    dateRange: item.years || '',
    roleTitle: item.role || '',
    orgName: item.company || '',
    blurb: item.description || '',
    linkEnabled: false,
    linkHref: '',
    highlight: index === 0,
  }));

  return {
    enabled: true,
    showTitle: true,
    title: 'Experience Snapshot',
    cta: {
      enabled: true,
      label: legacyConfig?.ctaLabel || 'Full Resume',
      href: legacyConfig?.ctaHref || '/resume',
    },
    timelineStyle: {
      showTimelineLine: true,
      showDots: true,
    },
    items: newItems.length > 0 ? newItems : defaultExperienceSnapshotConfig.items,
  };
}

// Sanitize blurb to single line
export function sanitizeBlurb(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').trim().slice(0, 180);
}
