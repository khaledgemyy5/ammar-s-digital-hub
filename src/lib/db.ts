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
  { id: 'home', label: 'Home', path: '/', type: 'route', visible: true, order: 0 },
  { id: 'resume', label: 'Resume', path: '/resume', type: 'route', visible: true, order: 1 },
  { id: 'projects', label: 'Projects', path: '/projects', type: 'route', visible: true, order: 2, autoHideIfEmpty: true },
  { id: 'writing', label: 'Selected Writing', path: '/writing', type: 'route', visible: true, order: 3, autoHideIfEmpty: true },
  { id: 'how-i-work', label: 'How I Work', path: '/#how-i-work', type: 'anchor', visible: true, order: 4 },
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
    // Try to get full settings (admin-only) first, fall back to public view
    const { data, error } = await (supabase as any)
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      // If access denied, fall back to public view
      const publicData = await getPublicSiteSettings();
      if (publicData) {
        return publicData as SiteSettings;
      }
      throw error;
    }
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
    // Use the secure public_site_settings view which excludes sensitive fields
    // (admin_user_id, bootstrap_token_hash) - base table requires admin access
    const { data, error } = await (supabase as any)
      .from('public_site_settings')
      .select('*')
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
    const { data, error } = await (supabase as any)
      .from('projects')
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
    const { data, error } = await (supabase as any)
      .from('projects')
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
    const { data, error } = await (supabase as any)
      .from('projects')
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
    const { data, error } = await (supabase as any)
      .from('projects')
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
    const { error } = await (supabase as any)
      .from('projects')
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
    const { data, error } = await (supabase as any)
      .from('writing_categories')
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
    const { data, error } = await (supabase as any)
      .from('writing_items')
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
    const { data, error } = await (supabase as any)
      .from('writing_items')
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
    const { data, error } = await (supabase as any)
      .from('writing_categories')
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
    const { data, error } = await (supabase as any)
      .from('writing_items')
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
    const { data, error } = await (supabase as any)
      .from('site_settings')
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

// ============ Admin Writing ============

export async function createWritingCategory(
  category: Omit<WritingCategory, 'id' | 'created_at' | 'updated_at'>
): Promise<WritingCategory | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await (supabase as any)
      .from('writing_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    clearCache();
    return data as WritingCategory;
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
}

export async function updateWritingCategory(id: string, updates: Partial<WritingCategory>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await (supabase as any)
      .from('writing_categories')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    clearCache();
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    return false;
  }
}

export async function deleteWritingCategory(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await (supabase as any)
      .from('writing_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    clearCache();
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
}

export async function createWritingItem(
  item: Omit<WritingItem, 'id' | 'created_at' | 'updated_at'>
): Promise<WritingItem | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await (supabase as any)
      .from('writing_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    clearCache();
    return data as WritingItem;
  } catch (error) {
    console.error('Error creating item:', error);
    return null;
  }
}

export async function updateWritingItem(id: string, updates: Partial<WritingItem>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await (supabase as any)
      .from('writing_items')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    clearCache();
    return true;
  } catch (error) {
    console.error('Error updating item:', error);
    return false;
  }
}

export async function deleteWritingItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await (supabase as any)
      .from('writing_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    clearCache();
    return true;
  } catch (error) {
    console.error('Error deleting item:', error);
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
