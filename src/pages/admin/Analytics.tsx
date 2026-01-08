import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Eye, Download, MousePointerClick, 
  FileText, ExternalLink, TrendingUp, Loader2,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getAnalyticsSummary } from '@/lib/analytics';
import { supabase } from '@/lib/supabaseClient';

interface DailyData {
  date: string;
  views: number;
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    uniqueVisitors: number;
    pageViews: number;
    resumeDownloads: number;
    contactClicks: number;
    writingClicks: number;
    topProjects: Array<{ slug: string; views: number }>;
  } | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [topPages, setTopPages] = useState<Array<{ path: string; views: number }>>([]);

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const loadAnalytics = async () => {
    setLoading(true);
    
    const summary = await getAnalyticsSummary(days);
    setAnalytics(summary);
    
    // Get daily breakdown
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    try {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('event, path, created_at')
        .gte('created_at', startDate.toISOString())
        .eq('event', 'page_view');

      if (events) {
        // Group by date
        const byDate: Record<string, number> = {};
        const byPath: Record<string, number> = {};
        
        events.forEach((e: any) => {
          const date = new Date(e.created_at).toLocaleDateString();
          byDate[date] = (byDate[date] || 0) + 1;
          byPath[e.path] = (byPath[e.path] || 0) + 1;
        });

        setDailyData(
          Object.entries(byDate)
            .map(([date, views]) => ({ date, views }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        );

        setTopPages(
          Object.entries(byPath)
            .map(([path, views]) => ({ path, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10)
        );
      }
    } catch (err) {
      console.error('Error loading daily analytics:', err);
    }
    
    setLoading(false);
  };

  const stats = [
    { 
      label: 'Unique Visitors', 
      value: analytics?.uniqueVisitors || 0,
      icon: Users,
      color: 'text-primary'
    },
    { 
      label: 'Page Views', 
      value: analytics?.pageViews || 0,
      icon: Eye,
      color: 'text-[hsl(var(--status-public))]'
    },
    { 
      label: 'Resume Downloads', 
      value: analytics?.resumeDownloads || 0,
      icon: Download,
      color: 'text-[hsl(var(--status-confidential))]'
    },
    { 
      label: 'Contact Clicks', 
      value: analytics?.contactClicks || 0,
      icon: MousePointerClick,
      color: 'text-primary'
    },
    { 
      label: 'Writing Clicks', 
      value: analytics?.writingClicks || 0,
      icon: ExternalLink,
      color: 'text-[hsl(var(--status-public))]'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Site performance overview</p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-40">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      {loading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                      )}
                    </div>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : topPages.length > 0 ? (
              <div className="space-y-2">
                {topPages.map((page, index) => (
                  <div 
                    key={page.path}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm text-muted-foreground w-6">#{index + 1}</span>
                      <span className="font-medium truncate">{page.path}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{page.views}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No page views yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Top Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : analytics?.topProjects && analytics.topProjects.length > 0 ? (
              <div className="space-y-2">
                {analytics.topProjects.map((project, index) => (
                  <div 
                    key={project.slug}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm text-muted-foreground w-6">#{index + 1}</span>
                      <span className="font-medium truncate">{project.slug}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{project.views} views</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No project views yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Views Chart (Simple Text Version) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Page Views</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : dailyData.length > 0 ? (
            <div className="h-32 flex items-end gap-1">
              {dailyData.slice(-30).map((day, index) => {
                const maxViews = Math.max(...dailyData.map(d => d.views));
                const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                return (
                  <div
                    key={day.date}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.date}: ${day.views} views`}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No data for this period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
