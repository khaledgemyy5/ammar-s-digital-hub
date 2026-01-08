import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/types/database';

interface FeaturedProjectsProps {
  title?: string;
  projects?: Project[];
}

// Demo projects for when no data is available
const demoProjects: Partial<Project>[] = [
  {
    slug: 'ai-product-recommendation',
    title: 'AI-Powered Product Recommendation Engine',
    summary: 'Built an LLM-based recommendation system that increased conversion rates by 35% through personalized suggestions.',
    tags: ['AI/LLM', 'Product', 'E-commerce'],
    status: 'PUBLIC',
    featured: true,
  },
  {
    slug: 'developer-platform',
    title: 'Developer Platform & API Redesign',
    summary: 'Led the complete redesign of a developer platform serving 50K+ developers, improving onboarding completion by 60%.',
    tags: ['Product', 'Engineering', 'API'],
    status: 'PUBLIC',
    featured: true,
  },
  {
    slug: 'startup-mvp',
    title: 'Startup MVP: From Zero to Launch',
    summary: 'Took a B2B SaaS product from concept to launch in 12 weeks, acquiring first 100 paying customers.',
    tags: ['Startups', 'Product', 'Growth'],
    status: 'CONFIDENTIAL',
    featured: true,
  },
];

export function FeaturedProjects({
  title = 'Featured Projects',
  projects = demoProjects as Project[]
}: FeaturedProjectsProps) {
  const displayProjects = projects.length > 0 ? projects : demoProjects;

  return (
    <section className="section-spacing">
      <div className="container-content">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl md:text-3xl">{title}</h2>
          <Link 
            to="/projects" 
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            All Projects
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid gap-6">
          {displayProjects.slice(0, 3).map((project, index) => (
            <motion.article
              key={project.slug || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/projects/${project.slug}`}
                className="group block p-6 md:p-8 border border-border rounded-lg bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      {project.status === 'CONFIDENTIAL' && (
                        <Badge variant="secondary" className="badge-confidential flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Confidential
                        </Badge>
                      )}
                      {project.status === 'CONCEPT' && (
                        <Badge variant="secondary" className="badge-concept">
                          Concept
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl md:text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>

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
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedProjects;
