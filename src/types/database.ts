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

// Home section configuration
export interface HomeSection {
  id: string;
  visible: boolean;
  order: number;
  limit?: number;
  titleOverride?: string;
}

// Navigation link configuration
export interface NavLink {
  id: string;
  label: string;
  path: string;
  visible: boolean;
  order: number;
}

// Theme configuration
export interface ThemeConfig {
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

// Page-specific settings
export interface PageConfig {
  resume: {
    enabled: boolean;
    pdfUrl?: string;
    showCopyText: boolean;
    showDownload: boolean;
  };
  contact: {
    enabled: boolean;
    email?: string;
    linkedin?: string;
    calendar?: string;
  };
}

// Site settings (singleton)
export interface SiteSettings {
  id: string;
  nav_config: NavLink[];
  home_sections: HomeSection[];
  theme: ThemeConfig;
  seo: SEOConfig;
  pages: PageConfig;
  admin_user_id?: string;
  bootstrap_token_hash?: string;
  created_at: string;
  updated_at: string;
}

// Project section configuration
export interface ProjectSection {
  id: string;
  visible: boolean;
  order: number;
  titleOverride?: string;
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
  custom_sections?: Array<{
    title: string;
    content: string;
    type: 'text' | 'bullets';
  }>;
}

// Project media
export interface ProjectMedia {
  items: Array<{
    type: 'image' | 'video';
    url: string;
    caption?: string;
  }>;
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
  created_at: string;
  updated_at: string;
}

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

// Analytics event
export interface AnalyticsEvent {
  id: string;
  event: 'page_view' | 'resume_download' | 'contact_click' | 'writing_click' | 'project_view';
  path: string;
  ref?: string;
  sid: string;
  created_at: string;
}

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
