import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getPublicSiteSettings } from '@/lib/db';
import { trackPageView, trackResumeDownload } from '@/lib/analytics';
import { ResumeConfig, defaultResumeConfig, generatePlainTextResume, migrateToResumeConfig } from '@/types/resume';

export default function Resume() {
  const [config, setConfig] = useState<ResumeConfig>(defaultResumeConfig);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    trackPageView('/resume');
    
    getPublicSiteSettings().then((settings) => {
      if (settings?.pages?.resume) {
        const resumeData = settings.pages.resume as any;
        // Migrate if needed
        const migratedConfig = migrateToResumeConfig(resumeData);
        setConfig(migratedConfig);
      }
      setLoading(false);
    });
  }, []);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainTextResume(config));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    trackResumeDownload();
    if (config.pdfUrl) {
      window.open(config.pdfUrl, '_blank');
    }
  };

  if (!config.enabled && !loading) {
    return (
      <div className="section-spacing">
        <div className="container-content text-center">
          <h1 className="mb-4">Resume</h1>
          <p className="text-muted-foreground">
            Resume page is currently disabled.
          </p>
        </div>
      </div>
    );
  }

  const sortedSections = [...config.sections]
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  const getSectionTitle = (id: string, defaultTitle: string) => {
    const section = config.sections.find(s => s.id === id);
    return section?.titleOverride || defaultTitle;
  };

  return (
    <div className="section-spacing">
      <div className="container-content max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="mb-2">Resume</h1>
            <p className="text-muted-foreground">ATS-friendly format</p>
          </div>
          
          <div className="flex gap-3">
            {config.showCopyText && (
              <Button 
                variant="outline" 
                onClick={handleCopyText}
                className="gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </Button>
            )}
            {config.showDownload && config.pdfUrl && (
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            )}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {/* Resume Content */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-lg p-8 md:p-10 print:shadow-none print:border-none"
          >
            {/* Name & Title */}
            {(config.personalInfo.showName || config.personalInfo.showTitle) && (
              <>
                <header className="text-center mb-8">
                  {config.personalInfo.showName && (
                    <h2 className="text-3xl mb-2">{config.personalInfo.name}</h2>
                  )}
                  {config.personalInfo.showTitle && (
                    <p className="text-lg text-primary font-medium">{config.personalInfo.title}</p>
                  )}
                </header>
                <Separator className="mb-8" />
              </>
            )}

            {/* Dynamic Sections */}
            {sortedSections.map((sectionDef, idx) => {
              const showSeparator = idx < sortedSections.length - 1;
              
              switch (sectionDef.id) {
                case 'summary':
                  if (!config.summary) return null;
                  return (
                    <div key="summary">
                      <section className="mb-8">
                        <h3 className="text-lg font-semibold mb-3 text-primary">
                          {getSectionTitle('summary', 'Summary')}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {config.summary}
                        </p>
                      </section>
                      {showSeparator && <Separator className="mb-8" />}
                    </div>
                  );

                case 'experience':
                  if (config.experience.length === 0) return null;
                  return (
                    <div key="experience">
                      <section className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 text-primary">
                          {getSectionTitle('experience', 'Experience')}
                        </h3>
                        <div className="space-y-6">
                          {config.experience.map((exp) => (
                            <div key={exp.id}>
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold">{exp.role}</h4>
                                  <p className="text-muted-foreground">
                                    {exp.company}{exp.location && ` • ${exp.location}`}
                                  </p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {exp.startDate} - {exp.endDate || 'Present'}
                                </p>
                              </div>
                              {exp.bullets.length > 0 && (
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-1">
                                  {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                                    <li key={i}>{bullet}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                      {showSeparator && <Separator className="mb-8" />}
                    </div>
                  );

                case 'projects':
                  if (config.projects.length === 0) return null;
                  return (
                    <div key="projects">
                      <section className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 text-primary">
                          {getSectionTitle('projects', 'Selected Projects')}
                        </h3>
                        <div className="space-y-4">
                          {config.projects.map((proj) => (
                            <div key={proj.id}>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{proj.title}</h4>
                                {proj.link && (
                                  <a 
                                    href={proj.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                              <p className="text-muted-foreground">{proj.description}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                      {showSeparator && <Separator className="mb-8" />}
                    </div>
                  );

                case 'skills':
                  if (config.skills.categories.length === 0) return null;
                  return (
                    <div key="skills">
                      <section className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 text-primary">
                          {getSectionTitle('skills', 'Skills')}
                        </h3>
                        <div className="space-y-4">
                          {config.skills.categories.map((cat) => (
                            <div key={cat.id}>
                              <h4 className="font-medium mb-2">{cat.name}</h4>
                              <div className="flex flex-wrap gap-2">
                                {cat.items.filter(s => s.trim()).map((skill) => (
                                  <Badge key={skill} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                      {showSeparator && <Separator className="mb-8" />}
                    </div>
                  );

                case 'education':
                  if (config.education.length === 0) return null;
                  return (
                    <div key="education">
                      <section className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 text-primary">
                          {getSectionTitle('education', 'Education')}
                        </h3>
                        <div className="space-y-3">
                          {config.education.map((edu) => (
                            <div key={edu.id} className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div>
                                <h4 className="font-medium">{edu.degree}</h4>
                                <p className="text-muted-foreground">{edu.institution}</p>
                                {edu.details && (
                                  <p className="text-sm text-muted-foreground mt-1">{edu.details}</p>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{edu.year}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                      {showSeparator && <Separator className="mb-8" />}
                    </div>
                  );

                case 'certifications':
                  if (config.certifications.length === 0) return null;
                  return (
                    <div key="certifications">
                      <section>
                        <h3 className="text-lg font-semibold mb-4 text-primary">
                          {getSectionTitle('certifications', 'Certifications')}
                        </h3>
                        <div className="space-y-3">
                          {config.certifications.map((cert) => (
                            <div key={cert.id} className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{cert.name}</h4>
                                {cert.url && (
                                  <a 
                                    href={cert.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {cert.issuer} • {cert.year}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  );

                default:
                  return null;
              }
            })}

            {/* Empty State */}
            {sortedSections.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No resume content configured yet.</p>
                <p className="text-sm mt-2">Configure your resume in the admin panel.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}