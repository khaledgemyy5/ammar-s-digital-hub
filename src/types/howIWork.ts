import { z } from 'zod';

// ============ Available Icons ============

export const AVAILABLE_ICONS = [
  'target',
  'compass',
  'layers',
  'check',
  'sparkles',
  'workflow',
  'users',
  'chart',
  'lightbulb',
  'zap',
  'brain',
  'rocket',
  'shield',
  'code',
  'database',
] as const;

export type IconName = typeof AVAILABLE_ICONS[number];

// ============ How I Work Item ============

export interface HowIWorkItem {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  visible: boolean;
  order: number;
}

// ============ How I Work Config ============

export interface HowIWorkFullConfig {
  enabled: boolean;
  titleOverride?: string;
  items: HowIWorkItem[];
}

// ============ Default Config ============

export const defaultHowIWorkConfig: HowIWorkFullConfig = {
  enabled: true,
  items: [
    {
      id: 'item-1',
      title: 'Data-Driven Strategy',
      description: 'I ground every product decision in data. From user research to A/B testing, evidence beats assumptions.',
      icon: 'chart',
      visible: true,
      order: 0,
    },
    {
      id: 'item-2', 
      title: 'User-Centric Design',
      description: 'Products succeed when they solve real problems. I obsess over understanding user needs and pain points.',
      icon: 'users',
      visible: true,
      order: 1,
    },
    {
      id: 'item-3',
      title: 'Engineering Fluency',
      description: 'My technical background means I can have deep conversations with engineers and make realistic tradeoffs.',
      icon: 'code',
      visible: true,
      order: 2,
    },
    {
      id: 'item-4',
      title: 'Clarity Over Complexity',
      description: 'The best solutions are often the simplest. I focus on reducing complexity while maximizing impact.',
      icon: 'lightbulb',
      visible: true,
      order: 3,
    },
  ],
};

// ============ Zod Schema ============

export const howIWorkItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description required').max(500, 'Description too long'),
  icon: z.enum(AVAILABLE_ICONS),
  visible: z.boolean(),
  order: z.number(),
});

export const howIWorkConfigSchema = z.object({
  enabled: z.boolean(),
  titleOverride: z.string().max(100).optional(),
  items: z.array(howIWorkItemSchema).min(1, 'At least one item required').max(6, 'Maximum 6 items'),
});

// ============ Helper Functions ============

export function createEmptyHowIWorkItem(order: number): HowIWorkItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: '',
    description: '',
    icon: 'lightbulb',
    visible: true,
    order,
  };
}

// Migrate from old format (HowIWorkConfig with bullets)
export function migrateToHowIWorkConfig(oldConfig: any): HowIWorkFullConfig {
  if (!oldConfig) return defaultHowIWorkConfig;
  
  // If already in new format
  if (oldConfig.items && Array.isArray(oldConfig.items) && oldConfig.items[0]?.icon) {
    return { ...defaultHowIWorkConfig, ...oldConfig };
  }
  
  // Migrate from old bullets format
  if (oldConfig.bullets && Array.isArray(oldConfig.bullets)) {
    const defaultIcons: IconName[] = ['chart', 'users', 'code', 'lightbulb', 'rocket', 'zap'];
    return {
      enabled: true,
      items: oldConfig.bullets.slice(0, 6).map((bullet: any, idx: number) => ({
        id: `migrated-${idx}`,
        title: bullet.title || 'Untitled',
        description: bullet.description || '',
        icon: (bullet.icon && AVAILABLE_ICONS.includes(bullet.icon)) ? bullet.icon : defaultIcons[idx] || 'lightbulb',
        visible: true,
        order: idx,
      })),
    };
  }
  
  return defaultHowIWorkConfig;
}
