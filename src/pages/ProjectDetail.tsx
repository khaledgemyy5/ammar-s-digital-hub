import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Lock, Star, Lightbulb, ExternalLink, 
  FileText, GitBranch, Map, Play, Github,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getProjectBySlug, getPublishedProjects } from '@/lib/db';
import { trackEvent } from '@/lib/analytics';
import type { Project, ProjectSection } from '@/types/database';

const defaultSections: ProjectSection[] = [
  { id: 'snapshot', visible: true, order: 0 },
  { id: 'problem_framing', visible: true, order: 1 },
  { id: 'your_role', visible: true, order: 2 },
  { id: 'options_considered', visible: true, order: 3 },
  { id: 'approach_decisions', visible: true, order: 4 },
  { id: 'outcome_learnings', visible: true, order: 5 },
  { id: 'context', visible: false, order: 6 },
  { id: 'constraints_risks', visible: false, order: 7 },
  { id: 'execution_timeline', visible: false, order: 8 },
  { id: 'evidence_pack', visible: true, order: 9 },
  { id: 'media', visible: true, order: 10 },
  { id: 'decision_log', visible: false, order: 11 },
  { id: 'signals_measurement', visible: false, order: 12 },
  { id: 'stakeholders', visible: false, order: 13 },
  { id: 'assumptions', visible: false, order: 14 },
  { id: 'next_steps', visible: false, order: 15 },
  { id: 'custom_sections', visible: true, order: 16 },
];

const EVIDENCE_ICONS: Record<string, React.ElementType> = {
  prd: FileText,
  spec: FileText,
  roadmap: Map,
  demo: Play,
  github: Github,
  other: ExternalLink,
};

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    trackEvent('project_view', { path: `/projects/${slug}` });

    Promise.all([
      getProjectBySlug(slug),
      getPublishedProjects()
    ]).then(([proj, allProjects]) => {
      if (!proj) {
        setNotFound(true);
      } else {
        setProject(proj);
        // Find related projects by shared tags
        const related = allProjects
          .filter(p => p.id !== proj.id)
          .filter(p => p.tags?.some(tag => proj.tags?.includes(tag)))
          .slice(0, 3);
        setRelatedProjects(related);
      }
      setLoading(false);
    });
  }, [slug]);

  const getSections = (): ProjectSection[] => {
    if (project?.sections_config && project.sections_config.length > 0) {
      return [...project.sections_config].sort((a, b) => a.order - b.order);
    }
    return defaultSections;
  };

  const isSectionVisible = (id: string): boolean => {
    const section = getSections().find(s => s.id === id);
    return section?.visible ?? false;
  };

  const renderSnapshot = () => {
    const snapshot = project?.content?.snapshot;
    if (!snapshot) return null;

    const items = [
      { label: 'Problem', value: snapshot.problem },
      { label: 'Role', value: snapshot.role },
      { label: 'Approach', value: snapshot.approach },
      { label: 'Outcome', value: snapshot.outcome },
    ].filter(item => item.value);

    if (items.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/50 rounded-lg">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-sm font-medium text-muted-foreground mb-1">{item.label}</p>
            <p className="text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderSection = (id: string) => {
    if (!isSectionVisible(id) || !project?.content) return null;

    switch (id) {
      case 'snapshot':
        return renderSnapshot();

      case 'problem_framing':
        return project.content.problem_framing ? (
          <Section title="Problem Framing">
            <p className="text-muted-foreground whitespace-pre-wrap">{project.content.problem_framing}</p>
          </Section>
        ) : null;

      case 'your_role':
        return project.content.your_role ? (
          <Section title="My Role">
            <p className="text-muted-foreground whitespace-pre-wrap">{project.content.your_role}</p>
          </Section>
        ) : null;

      case 'options_considered':
        return project.content.options_considered?.length ? (
          <Section title="Options Considered & Trade-offs">
            <div className="space-y-4">
              {project.content.options_considered.map((opt, i) => (
                <div key={i} className="p-4 border border-border rounded-lg">
                  <p className="font-medium mb-2">{opt.option}</p>
                  <p className="text-sm text-muted-foreground">{opt.tradeoffs}</p>
                </div>
              ))}
            </div>
          </Section>
        ) : null;

      case 'approach_decisions':
        return project.content.approach_decisions ? (
          <Section title="Approach & Key Decisions">
            <p className="text-muted-foreground whitespace-pre-wrap">{project.content.approach_decisions}</p>
          </Section>
        ) : null;

      case 'outcome_learnings':
        return project.content.outcome_learnings ? (
          <Section title="Outcome & Learnings">
            <p className="text-muted-foreground whitespace-pre-wrap">{project.content.outcome_learnings}</p>
          </Section>
        ) : null;

      case 'context':
        return project.content.context ? (
          <Section title="Context">
            <p className="text-muted-foreground whitespace-pre-wrap">{project.content.context}</p>
          </Section>
        ) : null;

      case 'constraints_risks':
        return project.content.constraints_risks?.length ? (
          <Section title="Constraints & Risks">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {project.content.constraints_risks.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>
        ) : null;

      case 'execution_timeline':
        return project.content.execution_timeline ? (
          <Section title="Execution Timeline">
            <p className="text-muted-foreground whitespace-pre-wrap">{project.content.execution_timeline}</p>
          </Section>
        ) : null;

      case 'evidence_pack':
        return project.content.evidence_pack?.length ? (
          <Section title="Evidence & Links">
            <div className="flex flex-wrap gap-3">
              {project.content.evidence_pack.map((item, i) => {
                const Icon = EVIDENCE_ICONS[item.type] || ExternalLink;
                return (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </Section>
        ) : null;

      case 'media':
        return project.media?.items?.length ? (
          <Section title="Media">
            <div className="grid gap-6">
              {project.media.items.slice(0, 3).map((item, i) => (
                <div key={i} className="space-y-2">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.caption || `Project image ${i + 1}`}
                      className="w-full rounded-lg border border-border"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      className="w-full rounded-lg border border-border"
                      preload="metadata"
                    />
                  )}
                  {item.caption && (
                    <p className="text-sm text-muted-foreground text-center">{item.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        ) : null;

      case 'decision_log':
        return project.content.decision_log?.length ? (
          <Section title="Decision Log">
            <div className="space-y-4">
              {project.content.decision_log.map((entry, i) => (
                <div key={i} className="p-4 border border-border rounded-lg">
                  <p className="font-medium mb-2">{entry.decision}</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium">Trade-off:</span> {entry.tradeoff}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Outcome:</span> {entry.outcome}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        ) : null;

      case 'signals_measurement':
        return project.content.signals_measurement?.length ? (
          <Section title="Signals & Measurement">
            <div className="space-y-4">
              {project.content.signals_measurement.map((item, i) => (
                <div key={i} className="p-4 border border-border rounded-lg">
                  <p className="font-medium mb-2">{item.signal}</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium">Why:</span> {item.why}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Change:</span> {item.change}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        ) : null;

      case 'stakeholders':
        return project.content.stakeholders?.length ? (
          <Section title="Stakeholders & Collaboration">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {project.content.stakeholders.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>
        ) : null;

      case 'assumptions':
        return project.content.assumptions?.length ? (
          <Section title="Assumptions & Unknowns">
            <div className="space-y-4">
              {project.content.assumptions.map((item, i) => (
                <div key={i} className="p-4 border border-border rounded-lg">
                  <p className="font-medium mb-2">{item.assumption}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Validation:</span> {item.validation}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        ) : null;

      case 'next_steps':
        return project.content.next_steps?.length ? (
          <Section title="Next Steps">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {project.content.next_steps.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>
        ) : null;

      case 'custom_sections':
        return project.content.custom_sections?.length ? (
          <>
            {project.content.custom_sections.map((custom, i) => {
              const isBullets = custom.kind === 'bullets' || custom.type === 'bullets';
              const content = custom.contentText || custom.content || '';
              const bulletItems = custom.bullets || content.split('\n').filter(Boolean);
              
              return (
                <Section key={i} title={custom.title}>
                  {isBullets ? (
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      {bulletItems.map((line, j) => (
                        <li key={j}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground whitespace-pre-wrap">{content}</p>
                  )}
                </Section>
              );
            })}
          </>
        ) : null;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="section-spacing">
        <div className="container-content max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-6 w-24 mb-4" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-2/3 mb-8" />
          <div className="flex gap-2 mb-12">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="section-spacing">
        <div className="container-content text-center">
          <h1 className="mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-spacing">
      <div className="container-content max-w-4xl">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
        </motion.div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {project.featured && (
              <Badge className="badge-featured flex items-center gap-1">
                <Star className="w-3 h-3" />
                Featured
              </Badge>
            )}
            {project.status === 'CONFIDENTIAL' && (
              <Badge variant="secondary" className="badge-confidential flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Confidential
              </Badge>
            )}
            {project.status === 'CONCEPT' && (
              <Badge variant="secondary" className="badge-concept flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Concept
              </Badge>
            )}
            {project.status === 'PUBLIC' && (
              <Badge variant="secondary" className="badge-public">
                Public
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-4">{project.title}</h1>

          {/* Summary */}
          <p className="text-lg text-muted-foreground mb-6">{project.summary}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {project.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </motion.header>

        {/* Confidential Banner */}
        {project.status === 'CONFIDENTIAL' && (
          <Alert className="mb-8 border-[hsl(var(--status-confidential))] bg-[hsl(var(--status-confidential)/0.1)]">
            <Lock className="h-4 w-4 text-[hsl(var(--status-confidential))]" />
            <AlertDescription className="text-[hsl(var(--status-confidential))]">
              {project.confidential_message || 
                'This project contains confidential information. Details have been intentionally limited to protect sensitive data.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Content Sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-10"
        >
          {getSections().map((section) => (
            <div key={section.id}>{renderSection(section.id)}</div>
          ))}
        </motion.div>

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <>
            <Separator className="my-12" />
            <section>
              <h3 className="mb-6">Related Projects</h3>
              <div className="grid gap-4">
                {relatedProjects.map((related) => (
                  <Link
                    key={related.id}
                    to={`/projects/${related.slug}`}
                    className="group flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-accent/30 transition-colors"
                  >
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {related.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {related.summary}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// Section wrapper component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-4">{title}</h4>
      {children}
    </section>
  );
}
