import { supabase, isSupabaseConfigured } from './supabaseClient';

type AnalyticsEventType = 
  | 'page_view' 
  | 'resume_download' 
  | 'contact_click' 
  | 'writing_click' 
  | 'project_view';

interface TrackEventOptions {
  path?: string;
  ref?: string;
}

interface AnalyticsEventRow {
  event: string;
  path: string | null;
  sid: string;
  created_at: string;
}

// Generate or retrieve session ID
function getSessionId(): string {
  const key = 'ammar_resume_sid';
  let sid = sessionStorage.getItem(key);
  
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  
  return sid;
}

// Track event with minimal blocking using Supabase client
export function trackEvent(
  event: AnalyticsEventType,
  options: TrackEventOptions = {}
): void {
  if (!isSupabaseConfigured()) return;

  const eventData = {
    event,
    path: options.path || window.location.pathname,
    ref: options.ref || document.referrer || undefined,
    sid: getSessionId(),
  };

  // Use Supabase client for non-blocking insert
  (async () => {
    try {
      await supabase.from('analytics_events').insert(eventData);
    } catch {
      // Silently fail - analytics should not break the app
    }
  })();
}

// Convenience functions
export function trackPageView(path?: string): void {
  trackEvent('page_view', { path });
}

export function trackResumeDownload(): void {
  trackEvent('resume_download');
}

export function trackContactClick(type: 'email' | 'linkedin' | 'calendar'): void {
  trackEvent('contact_click', { ref: type });
}

export function trackWritingClick(url: string): void {
  trackEvent('writing_click', { ref: url });
}

export function trackProjectView(slug: string): void {
  trackEvent('project_view', { path: `/projects/${slug}` });
}

// Analytics query helpers for admin
export async function getAnalyticsSummary(days: number = 30) {
  if (!isSupabaseConfigured()) return null;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('event, path, sid, created_at')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    if (!data) return null;

    const events = data as AnalyticsEventRow[];

    // Calculate metrics
    const uniqueVisitors = new Set(events.map(e => e.sid)).size;
    const pageViews = events.filter(e => e.event === 'page_view').length;
    const resumeDownloads = events.filter(e => e.event === 'resume_download').length;
    const contactClicks = events.filter(e => e.event === 'contact_click').length;
    const writingClicks = events.filter(e => e.event === 'writing_click').length;
    
    // Top projects
    const projectViews = events
      .filter(e => e.event === 'project_view')
      .reduce((acc, e) => {
        const slug = e.path?.replace('/projects/', '') || 'unknown';
        acc[slug] = (acc[slug] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topProjects = Object.entries(projectViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([slug, views]) => ({ slug, views }));

    return {
      uniqueVisitors,
      pageViews,
      resumeDownloads,
      contactClicks,
      writingClicks,
      topProjects,
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}
