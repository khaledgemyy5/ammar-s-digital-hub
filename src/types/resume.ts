import { z } from 'zod';

// ============ Resume Section Types ============

export const RESUME_SECTION_TYPES = ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'] as const;
export type ResumeSectionType = typeof RESUME_SECTION_TYPES[number];

// ============ Resume Entry Types ============

export interface ResumeExperienceEntry {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate?: string; // Empty for "Present"
  bullets: string[];
}

export interface ResumeProjectEntry {
  id: string;
  title: string;
  description: string;
  link?: string;
}

export interface ResumeEducationEntry {
  id: string;
  degree: string;
  institution: string;
  year: string;
  details?: string;
}

export interface ResumeCertificationEntry {
  id: string;
  name: string;
  issuer: string;
  year: string;
  url?: string;
}

// ============ Resume Section ============

export interface ResumeSection {
  id: ResumeSectionType;
  enabled: boolean;
  order: number;
  titleOverride?: string;
}

// ============ Resume Config ============

export interface ResumeConfig {
  enabled: boolean;
  pdfUrl?: string;
  showCopyText: boolean;
  showDownload: boolean;
  
  // Personal info for header
  personalInfo: {
    name: string;
    title: string;
    showName: boolean;
    showTitle: boolean;
  };
  
  // Sections order and visibility
  sections: ResumeSection[];
  
  // Section content
  summary: string;
  experience: ResumeExperienceEntry[];
  projects: ResumeProjectEntry[];
  skills: {
    categories: Array<{
      id: string;
      name: string;
      items: string[];
    }>;
  };
  education: ResumeEducationEntry[];
  certifications: ResumeCertificationEntry[];
}

// ============ Default Config ============

export const defaultResumeConfig: ResumeConfig = {
  enabled: true,
  showCopyText: true,
  showDownload: true,
  
  personalInfo: {
    name: 'Your Name',
    title: 'Your Title',
    showName: true,
    showTitle: true,
  },
  
  sections: [
    { id: 'summary', enabled: true, order: 0 },
    { id: 'experience', enabled: true, order: 1 },
    { id: 'projects', enabled: true, order: 2 },
    { id: 'skills', enabled: true, order: 3 },
    { id: 'education', enabled: true, order: 4 },
    { id: 'certifications', enabled: false, order: 5 },
  ],
  
  summary: '',
  experience: [],
  projects: [],
  skills: { categories: [] },
  education: [],
  certifications: [],
};

// ============ Zod Schemas ============

export const experienceEntrySchema = z.object({
  id: z.string(),
  company: z.string().min(1, 'Company required').max(100),
  role: z.string().min(1, 'Role required').max(100),
  location: z.string().max(100).optional(),
  startDate: z.string().max(50),
  endDate: z.string().max(50).optional(),
  bullets: z.array(z.string().max(500)).max(10),
});

export const projectEntrySchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title required').max(100),
  description: z.string().max(500),
  link: z.string().url().optional().or(z.literal('')),
});

export const educationEntrySchema = z.object({
  id: z.string(),
  degree: z.string().min(1, 'Degree required').max(100),
  institution: z.string().min(1, 'Institution required').max(100),
  year: z.string().max(50),
  details: z.string().max(500).optional(),
});

export const certificationEntrySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name required').max(100),
  issuer: z.string().min(1, 'Issuer required').max(100),
  year: z.string().max(50),
  url: z.string().url().optional().or(z.literal('')),
});

export const resumeConfigSchema = z.object({
  enabled: z.boolean(),
  pdfUrl: z.string().optional(),
  showCopyText: z.boolean(),
  showDownload: z.boolean(),
  personalInfo: z.object({
    name: z.string().max(100),
    title: z.string().max(100),
    showName: z.boolean(),
    showTitle: z.boolean(),
  }),
  sections: z.array(z.object({
    id: z.enum(RESUME_SECTION_TYPES),
    enabled: z.boolean(),
    order: z.number(),
    titleOverride: z.string().max(50).optional(),
  })),
  summary: z.string().max(2000),
  experience: z.array(experienceEntrySchema).max(20),
  projects: z.array(projectEntrySchema).max(10),
  skills: z.object({
    categories: z.array(z.object({
      id: z.string(),
      name: z.string().max(50),
      items: z.array(z.string().max(50)).max(20),
    })).max(10),
  }),
  education: z.array(educationEntrySchema).max(10),
  certifications: z.array(certificationEntrySchema).max(10),
});

// ============ Helper Functions ============

export function generatePlainTextResume(config: ResumeConfig): string {
  let text = '';
  
  if (config.personalInfo.showName) {
    text += `${config.personalInfo.name.toUpperCase()}\n`;
  }
  if (config.personalInfo.showTitle) {
    text += `${config.personalInfo.title}\n`;
  }
  text += '\n';
  
  const sortedSections = [...config.sections]
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);
  
  for (const section of sortedSections) {
    const title = section.titleOverride || section.id.charAt(0).toUpperCase() + section.id.slice(1);
    
    switch (section.id) {
      case 'summary':
        if (config.summary) {
          text += `${title.toUpperCase()}\n${config.summary}\n\n`;
        }
        break;
        
      case 'experience':
        if (config.experience.length > 0) {
          text += `${title.toUpperCase()}\n`;
          config.experience.forEach(exp => {
            text += `${exp.role} - ${exp.company}`;
            if (exp.location) text += ` (${exp.location})`;
            text += '\n';
            text += `${exp.startDate} - ${exp.endDate || 'Present'}\n`;
            exp.bullets.forEach(b => {
              text += `• ${b}\n`;
            });
            text += '\n';
          });
        }
        break;
        
      case 'projects':
        if (config.projects.length > 0) {
          text += `${title.toUpperCase()}\n`;
          config.projects.forEach(proj => {
            text += `${proj.title}\n${proj.description}\n\n`;
          });
        }
        break;
        
      case 'skills':
        if (config.skills.categories.length > 0) {
          text += `${title.toUpperCase()}\n`;
          config.skills.categories.forEach(cat => {
            text += `${cat.name}: ${cat.items.join(', ')}\n`;
          });
          text += '\n';
        }
        break;
        
      case 'education':
        if (config.education.length > 0) {
          text += `${title.toUpperCase()}\n`;
          config.education.forEach(edu => {
            text += `${edu.degree} - ${edu.institution} (${edu.year})\n`;
            if (edu.details) text += `${edu.details}\n`;
          });
          text += '\n';
        }
        break;
        
      case 'certifications':
        if (config.certifications.length > 0) {
          text += `${title.toUpperCase()}\n`;
          config.certifications.forEach(cert => {
            text += `${cert.name} - ${cert.issuer} (${cert.year})\n`;
          });
          text += '\n';
        }
        break;
    }
  }
  
  return text;
}

// Migrate old resume config to new format
export function migrateToResumeConfig(oldConfig: any): ResumeConfig {
  if (!oldConfig) return defaultResumeConfig;
  
  // If already in new format
  if (oldConfig.personalInfo && oldConfig.sections) {
    return { ...defaultResumeConfig, ...oldConfig };
  }
  
  // Migrate from old format
  return {
    ...defaultResumeConfig,
    enabled: oldConfig.enabled ?? true,
    pdfUrl: oldConfig.pdfUrl,
    showCopyText: oldConfig.showCopyText ?? true,
    showDownload: oldConfig.showDownload ?? true,
  };
}
