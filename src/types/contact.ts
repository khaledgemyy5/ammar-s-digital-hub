import { z } from 'zod';

// ============ Contact Config Types ============

export interface ContactInfoField {
  value: string;
  show: boolean;
  label: string;
}

export interface ContactCustomButton {
  id: string;
  label: string;
  url: string;
  visible: boolean;
  style: 'primary' | 'secondary' | 'ghost';
  order: number;
}

export interface ContactConfig {
  enabled: boolean;
  autoHideIfEmpty: boolean;
  
  header: {
    show: boolean;
    title: string;
    subtitle: string;
    showTitle: boolean;
    showSubtitle: boolean;
  };
  
  contactInfo: {
    show: boolean;
    email: ContactInfoField;
    linkedin: ContactInfoField;
    calendar: ContactInfoField;
  };
  
  ctas: {
    show: boolean;
    emailButton: { show: boolean; label: string };
    linkedinButton: { show: boolean; label: string };
    calendarButton: { show: boolean; label: string };
    customButtons: {
      show: boolean;
      buttons: ContactCustomButton[];
    };
  };
}

// ============ Zod Schemas for Validation ============

const urlSchema = z.string().refine(
  (val) => !val || val.startsWith('https://') || val.startsWith('http://'),
  { message: 'URL must start with https:// or http://' }
);

const emailSchema = z.string().refine(
  (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  { message: 'Invalid email format' }
);

export const contactInfoFieldSchema = z.object({
  value: z.string(),
  show: z.boolean(),
  label: z.string().min(1, 'Label is required').max(50, 'Label must be less than 50 characters'),
});

export const contactCustomButtonSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Label is required').max(50, 'Label must be less than 50 characters'),
  url: urlSchema,
  visible: z.boolean(),
  style: z.enum(['primary', 'secondary', 'ghost']),
  order: z.number(),
});

export const contactConfigSchema = z.object({
  enabled: z.boolean(),
  autoHideIfEmpty: z.boolean(),
  
  header: z.object({
    show: z.boolean(),
    title: z.string().max(100, 'Title must be less than 100 characters'),
    subtitle: z.string().max(500, 'Subtitle must be less than 500 characters'),
    showTitle: z.boolean(),
    showSubtitle: z.boolean(),
  }),
  
  contactInfo: z.object({
    show: z.boolean(),
    email: z.object({
      value: emailSchema,
      show: z.boolean(),
      label: z.string().max(50),
    }),
    linkedin: z.object({
      value: urlSchema,
      show: z.boolean(),
      label: z.string().max(50),
    }),
    calendar: z.object({
      value: urlSchema,
      show: z.boolean(),
      label: z.string().max(50),
    }),
  }),
  
  ctas: z.object({
    show: z.boolean(),
    emailButton: z.object({ show: z.boolean(), label: z.string().max(50) }),
    linkedinButton: z.object({ show: z.boolean(), label: z.string().max(50) }),
    calendarButton: z.object({ show: z.boolean(), label: z.string().max(50) }),
    customButtons: z.object({
      show: z.boolean(),
      buttons: z.array(contactCustomButtonSchema),
    }),
  }),
});

// ============ Default Config ============

export const defaultContactConfig: ContactConfig = {
  enabled: true,
  autoHideIfEmpty: false,
  
  header: {
    show: true,
    title: "Get in Touch",
    subtitle: "I'm always open to discussing new projects, opportunities, or just having a conversation about product and technology.",
    showTitle: true,
    showSubtitle: true,
  },
  
  contactInfo: {
    show: true,
    email: { value: '', show: true, label: 'Email' },
    linkedin: { value: '', show: true, label: 'LinkedIn' },
    calendar: { value: '', show: true, label: 'Schedule a Meeting' },
  },
  
  ctas: {
    show: true,
    emailButton: { show: true, label: 'Email Me' },
    linkedinButton: { show: true, label: 'Connect on LinkedIn' },
    calendarButton: { show: true, label: 'Book a Time' },
    customButtons: {
      show: true,
      buttons: [],
    },
  },
};

// ============ Helper Functions ============

export function isContactPageEmpty(config: ContactConfig): boolean {
  // Check if header has any visible content
  const hasVisibleHeader = config.header.show && (
    (config.header.showTitle && config.header.title.trim()) ||
    (config.header.showSubtitle && config.header.subtitle.trim())
  );
  
  // Check if any contact info is visible and has value
  const hasVisibleContactInfo = config.contactInfo.show && (
    (config.contactInfo.email.show && config.contactInfo.email.value.trim()) ||
    (config.contactInfo.linkedin.show && config.contactInfo.linkedin.value.trim()) ||
    (config.contactInfo.calendar.show && config.contactInfo.calendar.value.trim())
  );
  
  // Check if any CTA buttons are visible
  const hasVisibleCtas = config.ctas.show && (
    (config.ctas.emailButton.show && config.contactInfo.email.value.trim()) ||
    (config.ctas.linkedinButton.show && config.contactInfo.linkedin.value.trim()) ||
    (config.ctas.calendarButton.show && config.contactInfo.calendar.value.trim()) ||
    (config.ctas.customButtons.show && config.ctas.customButtons.buttons.some(b => b.visible && b.url.trim()))
  );
  
  // Page is empty if nothing is visible
  return !hasVisibleHeader && !hasVisibleContactInfo && !hasVisibleCtas;
}

export function shouldShowContactInNav(config: ContactConfig): boolean {
  if (!config.enabled) return false;
  if (config.autoHideIfEmpty && isContactPageEmpty(config)) return false;
  return true;
}

// Migrate old PageConfig.contact to new ContactConfig
export function migrateToContactConfig(oldConfig: {
  enabled?: boolean;
  email?: string;
  linkedin?: string;
  calendar?: string;
  buttons?: Array<{ label: string; target: string; actionType: string; variant: string; visible: boolean }>;
}): ContactConfig {
  return {
    ...defaultContactConfig,
    enabled: oldConfig.enabled ?? true,
    contactInfo: {
      ...defaultContactConfig.contactInfo,
      email: { 
        value: oldConfig.email || '', 
        show: !!oldConfig.email, 
        label: 'Email' 
      },
      linkedin: { 
        value: oldConfig.linkedin || '', 
        show: !!oldConfig.linkedin, 
        label: 'LinkedIn' 
      },
      calendar: { 
        value: oldConfig.calendar || '', 
        show: !!oldConfig.calendar, 
        label: 'Schedule a Meeting' 
      },
    },
    ctas: {
      ...defaultContactConfig.ctas,
      emailButton: { show: !!oldConfig.email, label: 'Email Me' },
      linkedinButton: { show: !!oldConfig.linkedin, label: 'Connect on LinkedIn' },
      calendarButton: { show: !!oldConfig.calendar, label: 'Book a Time' },
      customButtons: {
        show: (oldConfig.buttons?.length ?? 0) > 0,
        buttons: (oldConfig.buttons || []).map((btn, idx) => ({
          id: `custom-${idx}`,
          label: btn.label,
          url: btn.target,
          visible: btn.visible,
          style: (btn.variant === 'primary' ? 'primary' : btn.variant === 'ghost' ? 'ghost' : 'secondary') as 'primary' | 'secondary' | 'ghost',
          order: idx,
        })),
      },
    },
  };
}
