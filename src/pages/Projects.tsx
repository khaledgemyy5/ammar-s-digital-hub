import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Lock, Star, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SupabaseStatus } from '@/components/ui/SupabaseStatus';
import { getPublishedProjects } from '@/lib/db';
import { trackPageView } from '@/lib/analytics';
import type { Project } from '@/types/database';

// Dynamic tags will be extracted from projects

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    trackPageView('/projects');
    
    getPublishedProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  // Extract unique tags from projects
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach(p => p.tags?.forEach(tag => tagSet.add(tag)));
    return ['All', ...Array.from(tagSet).sort()];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All') return projects;
    return projects.filter(p => 
      p.tags?.some(tag => 
        tag.toLowerCase().includes(activeFilter.toLowerCase())
      )
    );
  }, [projects, activeFilter]);

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'CONFIDENTIAL':
        return (
          <Badge variant="secondary" className="badge-confidential flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Confidential
          </Badge>
        );
      case 'CONCEPT':
        return (
          <Badge variant="secondary" className="badge-concept flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Concept
          </Badge>
        );
      case 'PUBLIC':
      default:
        return (
          <Badge variant="secondary" className="badge-public">
            Public
          </Badge>
        );
    }
  };

  return (
    <div className="section-spacing">
      <div className="container-content">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="mb-4">Projects</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A selection of projects I've led or contributed to across product management, 
            AI/LLM development, and software engineering.
          </p>
        </motion.div>

        {/* Supabase Status Banner */}
        <div className="mb-8">
          <SupabaseStatus />
        </div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={activeFilter === tag ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(tag)}
              className="rounded-full"
            >
              {tag}
            </Button>
          ))}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 md:p-8 border border-border rounded-lg bg-card">
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-8 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 border border-dashed border-border rounded-lg"
          >
            <p className="text-muted-foreground mb-2">No projects found</p>
            <p className="text-sm text-muted-foreground">
              {activeFilter !== 'All' 
                ? `No projects match the "${activeFilter}" filter.`
                : 'Projects will appear here once added to the database.'
              }
            </p>
          </motion.div>
        )}

        {/* Projects Grid */}
        {!loading && filteredProjects.length > 0 && (
          <div className="grid gap-6">
            {filteredProjects.map((project, index) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/projects/${project.slug}`}
                  className="group block p-6 md:p-8 border border-border rounded-lg bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Badges Row */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {project.featured && (
                          <Badge className="badge-featured flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Featured
                          </Badge>
                        )}
                        {getStatusBadge(project.status)}
                      </div>

                      {/* Title */}
                      <h2 className="text-xl md:text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                        {project.title}
                      </h2>

                      {/* Summary */}
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {project.summary}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {project.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags && project.tags.length > 3 && (
                          <Badge variant="outline">
                            +{project.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
