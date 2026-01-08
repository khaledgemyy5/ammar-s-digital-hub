import { supabase, isSupabaseConfigured } from './supabaseClient';
import type {
  SiteSettings,
  Project,
  WritingCategory,
  WritingItem,
  HomeSection,
  NavLink,
} from '@/types/database';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}

// Default configurations for when database is not available
const defaultNavConfig: NavLink[] = [
  { id: 'home', label: 'Home', path: '/', visible: true, order: 0 },
  { id: 'projects', label: 'Projects', path: '/projects', visible: true, order: 1 },
  { id: 'writing', label: 'Writing', path: '/writing', visible: true, order: 2 },
  { id: 'contact', label: 'Contact', path: '/contact', visible: true, order: 3 },
];

const defaultHomeSections: HomeSection[] = [
  { id: 'hero', visible: true, order: 0 },
  { id: 'experience_snapshot', visible: true, order: 1, limit: 3 },
  { id: 'featured_projects', visible: true, order: 2, limit: 3 },
  { id: 'how_i_work', visible: true, order: 3 },
  { id: 'selected_writing_preview', visible: true, order: 4, limit: 3 },
  { id: 'contact_cta', visible: true, order: 5 },
];

const defaultSiteSettings: Omit<SiteSettings, 'id' | 'created_at' | 'updated_at' | 'admin_user_id' | 'bootstrap_token_hash'> = {
  nav_config: defaultNavConfig,
  home_sections: defaultHomeSections,
  theme: {
    accentColor: '#135BEC',
    defaultMode: 'light',
    font: 'ibm-plex',
  },
  seo: {
    siteTitle: 'Ammar Jaber | Technical Product Manager',
    siteDescription: 'Technical Product Manager with experience in LLM and Software Engineering. Building products that matter.',
  },
  pages: {
    resume: {
      enabled: true,
      showCopyText: true,
      showDownload: true,
    },
    contact: {
      enabled: true,
    },
  },
};

// ============ Site Settings ============

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const cacheKey = 'site_settings';
  const cached = getCached<SiteSettings>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured()) {
    return {
      id: 'default',
      ...defaultSiteSettings,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as SiteSettings;
  }

  try {
    const { data, error } = await supabase
      .from('site_settings' as any)
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) setCache(cacheKey, data as SiteSettings);
    return data as SiteSettings | null;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
}

export async function getPublicSiteSettings(): Promise<Omit<SiteSettings, 'admin_user_id' | 'bootstrap_token_hash'> | null> {
  const cacheKey = 'public_site_settings';
  const cached = getCached<Omit<SiteSettings, 'admin_user_id' | 'bootstrap_token_hash'>>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured()) {
    return {
      id: 'default',
      ...defaultSiteSettings,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase
      .from('site_settings' as any)
      .select('id, nav_config, home_sections, theme, seo, pages, created_at, updated_at')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) setCache(cacheKey, data as Omit<SiteSettings, 'admin_user_id' | 'bootstrap_token_hash'>);
    return data as Omit<SiteSettings, 'admin_user_id' | 'bootstrap_token_hash'> | null;
  } catch (error) {
    console.error('Error fetching public site settings:', error);
    return null;
  }
}

export async function updateSiteSettings(id: string, updates: Partial<SiteSettings>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await (supabase as any)
      .from('site_settings')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    clearCache();
    return true;
  } catch (error) {
    console.error('Error updating site settings:', error);
    return false;
  }
}

// ============ Projects ============

export async function getPublishedProjects(): Promise<Project[]> {
  const cacheKey = 'published_projects';
  const cached = getCached<Project[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('projects' as any)
      .select('*')
      .eq('published', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data) setCache(cacheKey, data as Project[]);
    return (data as Project[]) || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function getFeaturedProjects(limit: number = 3): Promise<Project[]> {
  const cacheKey = `featured_projects_${limit}`;
  const cached = getCached<Project[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('projects' as any)
      .select('*')
      .eq('published', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (data) setCache(cacheKey, data as Project[]);
    return (data as Project[]) || [];
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    return [];
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const cacheKey = `project_${slug}`;
  const cached = getCached<Project>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('projects' as any)
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error) throw error;
    if (data) setCache(cacheKey, data as Project);
    return data as Project | null;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export async function getAllProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('projects' as any)
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Project[]) || [];
  } catch (error) {
    console.error('Error fetching all projects:', error);
    return [];
  }
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await (supabase as any)
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    clearCache();
    return data as Project;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await (supabase as any)
      .from('projects')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    clearCache();
    return true;
  } catch (error) {
    console.error('Error updating project:', error);
    return false;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('projects' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
    clearCache();
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

// ============ Writing ============

export async function getWritingCategories(): Promise<WritingCategory[]> {
  const cacheKey = 'writing_categories';
  const cached = getCached<WritingCategory[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('writing_categories' as any)
      .select('*')
      .eq('enabled', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    if (data) setCache(cacheKey, data as WritingCategory[]);
    return (data as WritingCategory[]) || [];
  } catch (error) {
    console.error('Error fetching writing categories:', error);
    return [];
  }
}

export async function getWritingItems(): Promise<WritingItem[]> {
  const cacheKey = 'writing_items';
  const cached = getCached<WritingItem[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('writing_items' as any)
      .select('*')
      .eq('enabled', true)
      .order('featured', { ascending: false })
      .order('order_index', { ascending: true });

    if (error) throw error;
    if (data) setCache(cacheKey, data as WritingItem[]);
    return (data as WritingItem[]) || [];
  } catch (error) {
    console.error('Error fetching writing items:', error);
    return [];
  }
}

export async function getFeaturedWriting(limit: number = 3): Promise<WritingItem[]> {
  const cacheKey = `featured_writing_${limit}`;
  const cached = getCached<WritingItem[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('writing_items' as any)
      .select('*')
      .eq('enabled', true)
      .eq('featured', true)
      .order('order_index', { ascending: true })
      .limit(limit);

    if (error) throw error;
    if (data) setCache(cacheKey, data as WritingItem[]);
    return (data as WritingItem[]) || [];
  } catch (error) {
    console.error('Error fetching featured writing:', error);
    return [];
  }
}

export async function getAllWritingCategories(): Promise<WritingCategory[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('writing_categories' as any)
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data as WritingCategory[]) || [];
  } catch (error) {
    console.error('Error fetching all writing categories:', error);
    return [];
  }
}

export async function getAllWritingItems(): Promise<WritingItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('writing_items' as any)
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data as WritingItem[]) || [];
  } catch (error) {
    console.error('Error fetching all writing items:', error);
    return [];
  }
}

// ============ Admin helpers ============

export async function adminGetSiteSettings(): Promise<SiteSettings | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('site_settings' as any)
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as SiteSettings | null;
  } catch (error) {
    console.error('Error fetching admin site settings:', error);
    return null;
  }
}

export async function adminUpdateSiteSettings(updates: Partial<SiteSettings>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // Get the current settings ID first
    const current = await adminGetSiteSettings();
    if (!current) return false;

    const { error } = await (supabase as any)
      .from('site_settings')
      .update(updates)
      .eq('id', current.id);

    if (error) throw error;
    clearCache();
    return true;
  } catch (error) {
    console.error('Error updating admin site settings:', error);
    return false;
  }
}

// ============ Bootstrap ============

export async function bootstrapSetAdmin(token: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { data, error } = await (supabase as any).rpc('bootstrap_set_admin', { token });

    if (error) throw error;
    clearCache();
    return data === true;
  } catch (error) {
    console.error('Error bootstrapping admin:', error);
    return false;
  }
}
