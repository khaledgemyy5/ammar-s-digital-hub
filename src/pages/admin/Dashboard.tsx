import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Eye, Download, MousePointerClick, 
  FolderKanban, PenLine, TrendingUp
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your site's performance (last 30 days)
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      {loading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold">{stat.value}</p>
                      )}
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FolderKanban className="w-5 h-5 text-primary" />
                <span>Published Projects</span>
              </div>
              {loading ? (
                <Skeleton className="h-6 w-8" />
              ) : (
                <span className="font-bold">{projectCount}</span>
              )}
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <PenLine className="w-5 h-5 text-primary" />
                <span>Writing Items</span>
              </div>
              {loading ? (
                <Skeleton className="h-6 w-8" />
              ) : (
                <span className="font-bold">{writingCount}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
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
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <a href="/admin/projects">Manage Projects</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/admin/writing">Manage Writing</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/admin/settings">Site Settings</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
