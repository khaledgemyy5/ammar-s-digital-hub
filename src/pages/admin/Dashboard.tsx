import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Eye, Download, MousePointerClick, 
  FolderKanban, PenLine, TrendingUp, ArrowRight, 
  Home, Palette, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAnalyticsSummary } from '@/lib/analytics';
import { getPublishedProjects, getWritingItems } from '@/lib/db';

interface AnalyticsSummary {
  uniqueVisitors: number;
  pageViews: number;
  resumeDownloads: number;
  contactClicks: number;
  writingClicks: number;
  topProjects: Array<{ slug: string; views: number }>;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [projectCount, setProjectCount] = useState(0);
  const [writingCount, setWritingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [analyticsData, projects, writing] = await Promise.all([
        getAnalyticsSummary(30),
        getPublishedProjects(),
        getWritingItems(),
      ]);
      
      setAnalytics(analyticsData);
      setProjectCount(projects.length);
      setWritingCount(writing.length);
      setLoading(false);
    }
    loadData();
  }, []);

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
  ];

  const quickActions = [
    { label: 'Home Layout', path: '/admin/home-layout', icon: Home },
    { label: 'Projects', path: '/admin/projects', icon: FolderKanban },
    { label: 'Writing', path: '/admin/writing', icon: PenLine },
    { label: 'Theme', path: '/admin/theme', icon: Palette },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Overview</h1>
        <p className="text-muted-foreground">
          Last 30 days performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      {loading ? (
                        <Skeleton className="h-7 w-12" />
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
        {/* Content Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link 
              to="/admin/projects"
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <FolderKanban className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Published Projects</span>
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <Skeleton className="h-5 w-6" />
                ) : (
                  <span className="font-semibold">{projectCount}</span>
                )}
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            <Link 
              to="/admin/writing"
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <PenLine className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Writing Items</span>
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <Skeleton className="h-5 w-6" />
                ) : (
                  <span className="font-semibold">{writingCount}</span>
                )}
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : analytics?.topProjects && analytics.topProjects.length > 0 ? (
              <div className="space-y-2">
                {analytics.topProjects.slice(0, 5).map((project, index) => (
                  <div 
                    key={project.slug}
                    className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-muted-foreground w-5">#{index + 1}</span>
                      <span className="text-sm font-medium truncate">{project.slug}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{project.views} views</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No project views yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button key={action.path} variant="outline" size="sm" asChild>
                  <Link to={action.path}>
                    <Icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
