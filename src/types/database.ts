export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enums
export type ProjectStatus = 'PUBLIC' | 'CONFIDENTIAL' | 'CONCEPT';
export type DetailLevel = 'FULL' | 'SUMMARY' | 'MINIMAL';
export type Language = 'AUTO' | 'AR' | 'EN';

// ============ Button Configuration ============
export type ButtonActionType = 'internal' | 'external' | 'download' | 'mailto' | 'scroll';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

export interface ButtonConfig {
  id: string;
  label: string;
  visible: boolean;
  actionType: ButtonActionType;
  target: string; // URL, route, email, or section id
  variant: ButtonVariant;
  icon?: string;
}

// ============ Home Section Configurations ============

export interface HeroConfig {
  name: string;
  role: string;
  transitionLine?: string;
  introLine1: string;
  introLine2?: string;
  badges?: string[];
  ctas: ButtonConfig[];
}

export interface ExperienceItem {
  company: string;
  role: string;
  years: string;
  description?: string;
}

export interface ExperienceSnapshotConfig {
  items: ExperienceItem[];
  ctaLabel: string;
  ctaHref: string;
}

export interface HowIWorkBullet {
  icon?: string;
  title: string;
  description: string;
}

export interface HowIWorkConfig {
  bullets: HowIWorkBullet[];
}

export interface FeaturedProjectsConfig {
  limit: number;
}

export interface WritingPreviewConfig {
  limit: number;
  onlyFeatured: boolean;
}

export interface ContactCTAConfig {
  headline: string;
  body: string;
  buttons: ButtonConfig[];
}

// Union type for section configs
export type SectionConfig = 
  | HeroConfig 
  | ExperienceSnapshotConfig 
  | HowIWorkConfig 
  | FeaturedProjectsConfig 
  | WritingPreviewConfig 
  | ContactCTAConfig
  | Record<string, unknown>;

// Home section with typed config
export interface HomeSection {
  id: string;
  type?: 'hero' | 'experience_snapshot' | 'featured_projects' | 'how_i_work' | 'writing_preview' | 'contact_cta';
  visible: boolean;
  order: number;
  titleOverride?: string;
  config?: SectionConfig;
  // Legacy support
  limit?: number;
}

// Navigation link configuration
export interface NavLink {
  id: string;
  label: string;
  path: string;
  visible: boolean;
  order: number;
  autoHideIfEmpty?: boolean;
}

// Nav configuration with CTA buttons
export interface NavConfig {
  links: NavLink[];
  ctaButtons?: ButtonConfig[];
}

// Theme configuration
export interface ThemeConfig {
  primaryColor?: string;
  accentColor: string;
  defaultMode: 'light' | 'dark' | 'system';
  font: 'inter' | 'ibm-plex' | 'system';
}

// SEO configuration
export interface SEOConfig {
  siteTitle: string;
  siteDescription: string;
  ogImage?: string;
  canonicalUrl?: string;
  favicon?: string;
}

// Resume page content
export interface ResumeContent {
  summary?: string;
  experience?: string;
  projects?: string;
  skills?: string;
  education?: string;
}

// Page-specific settings
export interface PageConfig {
  resume: {
    enabled: boolean;
    pdfUrl?: string;
    showCopyText: boolean;
    showDownload: boolean;
    content?: ResumeContent;
  };
  contact: {
    enabled: boolean;
    email?: string;
    linkedin?: string;
    calendar?: string;
    buttons?: ButtonConfig[];
  };
}

// Site settings (singleton)
export interface SiteSettings {
  id: string;
  nav_config: NavLink[] | NavConfig;
  home_sections: HomeSection[];
  theme: ThemeConfig;
  seo: SEOConfig;
  pages: PageConfig;
  admin_user_id?: string;
  bootstrap_token_hash?: string;
  created_at: string;
  updated_at: string;
}

// ============ Project Types ============

// Project section configuration
export interface ProjectSection {
  id: string;
  visible: boolean;
  order: number;
  titleOverride?: string;
}

// Custom section (max 2 per project)
export interface CustomSection {
  id: string;
  title: string;
  kind?: 'text' | 'bullets';
  type?: 'text' | 'bullets'; // Legacy support
  content?: string; // Legacy support
  contentText?: string;
  bullets?: string[];
}

// Project links
export interface ProjectLinks {
  demo?: string;
  repo?: string;
  docs?: string;
}

// Project chips
export interface ProjectChips {
  role?: string;
  domain?: string;
  stage?: string;
  stack?: string;
}

// Project content structure
export interface ProjectContent {
  snapshot?: {
    problem: string;
    role: string;
    approach: string;
    outcome: string;
  };
  problem_framing?: string;
  your_role?: string;
  options_considered?: Array<{
    option: string;
    tradeoffs: string;
  }>;
  approach_decisions?: string;
  outcome_learnings?: string;
  context?: string;
  constraints_risks?: string[];
  execution_timeline?: string;
  evidence_pack?: Array<{
    label: string;
    url: string;
    type: 'prd' | 'spec' | 'roadmap' | 'demo' | 'github' | 'other';
  }>;
  decision_log?: Array<{
    decision: string;
    tradeoff: string;
    outcome: string;
  }>;
  signals_measurement?: Array<{
    signal: string;
    why: string;
    change: string;
  }>;
  stakeholders?: string[];
  assumptions?: Array<{
    assumption: string;
    validation: string;
  }>;
  next_steps?: string[];
  custom_sections?: CustomSection[];
}

// Project media item (max 3 per project)
export interface ProjectMediaItem {
  type: 'image' | 'video';
  url: string;
  caption?: string; // Optional for legacy support, but UI should require it
}

// Project media
export interface ProjectMedia {
  items: ProjectMediaItem[];
}

// Project metrics
export interface ProjectMetrics {
  [key: string]: string | number;
}

// Project
export interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  status: ProjectStatus;
  detail_level: DetailLevel;
  featured: boolean;
  published: boolean;
  sections_config: ProjectSection[];
  content: ProjectContent;
  metrics?: ProjectMetrics;
  decision_log?: ProjectContent['decision_log'];
  media?: ProjectMedia;
  confidential_message?: string;
  related_projects?: string[];
  chips?: ProjectChips;
  links?: ProjectLinks;
  created_at: string;
  updated_at: string;
}

// ============ Writing Types ============

// Writing category
export interface WritingCategory {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Writing item
export interface WritingItem {
  id: string;
  category_id: string;
  title: string;
  url: string;
  platform_label: string;
  language: Language;
  featured: boolean;
  enabled: boolean;
  order_index: number;
  why_this_matters?: string;
  show_why: boolean;
  created_at: string;
  updated_at: string;
}

// ============ Analytics Types ============

// Analytics event
export interface AnalyticsEvent {
  id: string;
  event: 'page_view' | 'resume_download' | 'contact_click' | 'writing_click' | 'project_view';
  path: string;
  ref?: string;
  sid: string;
  created_at: string;
}

// ============ Database Schema ============

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      site_settings: {
        Row: SiteSettings;
        Insert: Omit<SiteSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SiteSettings, 'id' | 'created_at' | 'updated_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>;
      };
      writing_categories: {
        Row: WritingCategory;
        Insert: Omit<WritingCategory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WritingCategory, 'id' | 'created_at' | 'updated_at'>>;
      };
      writing_items: {
        Row: WritingItem;
        Insert: Omit<WritingItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WritingItem, 'id' | 'created_at' | 'updated_at'>>;
      };
      analytics_events: {
        Row: AnalyticsEvent;
        Insert: Omit<AnalyticsEvent, 'id' | 'created_at'>;
        Update: never;
      };
    };
    Views: {
      public_site_settings: {
        Row: Omit<SiteSettings, 'admin_user_id' | 'bootstrap_token_hash'>;
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      bootstrap_set_admin: {
        Args: { token: string };
        Returns: boolean;
      };
    };
  };
}

// Helper types for component props
export type ProjectWithCategory = Project & {
  category?: WritingCategory;
};

export type WritingItemWithCategory = WritingItem & {
  category?: WritingCategory;
};

// Helper to get nav links from config
export function getNavLinks(config: NavLink[] | NavConfig): NavLink[] {
  if (Array.isArray(config)) {
    return config;
  }
  return config.links || [];
}

// Helper to get nav CTA buttons
export function getNavCtaButtons(config: NavLink[] | NavConfig): ButtonConfig[] {
  if (Array.isArray(config)) {
    return [];
  }
  return config.ctaButtons || [];
}
