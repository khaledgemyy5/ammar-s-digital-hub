import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SupabaseStatus } from '@/components/ui/SupabaseStatus';
import { getPublicSiteSettings } from '@/lib/db';
import { trackPageView, trackResumeDownload } from '@/lib/analytics';

interface ResumeData {
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    period: string;
    highlights: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    link?: string;
  }>;
  skills: {
    [category: string]: string[];
  };
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
}

// Default resume data for display
const defaultResumeData: ResumeData = {
  summary: "Technical Product Manager with 5+ years of experience bridging engineering and business. Previously worked as a Software Engineer and LLM Developer. Specialized in building AI-powered products that solve real user problems.",
  experience: [
    {
      title: "Technical Product Manager",
      company: "Tech Company",
      location: "Remote",
      period: "2022 - Present",
      highlights: [
        "Led product strategy for AI/ML features serving 100K+ users",
        "Reduced time-to-market by 40% through improved cross-functional processes",
        "Defined and tracked KPIs that increased user retention by 25%"
      ]
    },
    {
      title: "Software Engineer",
      company: "Startup Inc",
      location: "San Francisco, CA",
      period: "2020 - 2022",
      highlights: [
        "Built LLM-powered recommendation system from scratch",
        "Architected microservices handling 1M+ daily requests",
        "Mentored junior developers and established coding standards"
      ]
    }
  ],
  projects: [
    {
      name: "AI Product Recommendation Engine",
      description: "Built an LLM-based recommendation system that increased conversion rates by 35%"
    },
    {
      name: "Developer Platform Redesign",
      description: "Led complete redesign serving 50K+ developers, improving onboarding by 60%"
    }
  ],
  skills: {
    "Product": ["Product Strategy", "Roadmapping", "User Research", "A/B Testing", "Analytics"],
    "Technical": ["Python", "TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
    "AI/ML": ["LLMs", "Prompt Engineering", "RAG", "Fine-tuning", "Vector Databases"]
  },
  education: [
    {
      degree: "B.S. Computer Science",
      institution: "University",
      year: "2020"
    }
  ]
};

export default function Resume() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showCopyText, setShowCopyText] = useState(true);
  const [showDownload, setShowDownload] = useState(true);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const resumeData = defaultResumeData;

  useEffect(() => {
    trackPageView('/resume');
    
    getPublicSiteSettings().then((settings) => {
      if (settings?.pages?.resume) {
        setEnabled(settings.pages.resume.enabled ?? true);
        setPdfUrl(settings.pages.resume.pdfUrl || null);
        setShowCopyText(settings.pages.resume.showCopyText ?? true);
        setShowDownload(settings.pages.resume.showDownload ?? true);
      }
      setLoading(false);
    });
  }, []);

  const generatePlainText = (): string => {
    let text = `AMMAR JABER\nTechnical Product Manager\n\n`;
    text += `SUMMARY\n${resumeData.summary}\n\n`;
    
    text += `EXPERIENCE\n`;
    resumeData.experience.forEach(exp => {
      text += `${exp.title} - ${exp.company}${exp.location ? ` (${exp.location})` : ''}\n`;
      text += `${exp.period}\n`;
      exp.highlights.forEach(h => {
        text += `• ${h}\n`;
      });
      text += `\n`;
    });

    text += `PROJECTS\n`;
    resumeData.projects.forEach(proj => {
      text += `${proj.name}\n${proj.description}\n\n`;
    });

    text += `SKILLS\n`;
    Object.entries(resumeData.skills).forEach(([category, skills]) => {
      text += `${category}: ${skills.join(', ')}\n`;
    });
    text += `\n`;

    text += `EDUCATION\n`;
    resumeData.education.forEach(edu => {
      text += `${edu.degree} - ${edu.institution} (${edu.year})\n`;
    });

    return text;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    trackResumeDownload();
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  if (!enabled && !loading) {
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
            {showCopyText && (
              <Button 
                variant="outline" 
                onClick={handleCopyText}
                className="gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </Button>
            )}
            {showDownload && pdfUrl && (
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            )}
          </div>
        </motion.div>

        {/* Supabase Status Banner */}
        <div className="mb-8">
          <SupabaseStatus />
        </div>

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
            <header className="text-center mb-8">
              <h2 className="text-3xl mb-2">Ammar Jaber</h2>
              <p className="text-lg text-primary font-medium">Technical Product Manager</p>
            </header>

            <Separator className="mb-8" />

            {/* Summary */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-primary">Summary</h3>
              <p className="text-muted-foreground leading-relaxed">{resumeData.summary}</p>
            </section>

            <Separator className="mb-8" />

            {/* Experience */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-primary">Experience</h3>
              <div className="space-y-6">
                {resumeData.experience.map((exp, index) => (
                  <div key={index}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{exp.title}</h4>
                        <p className="text-muted-foreground">
                          {exp.company}{exp.location && ` • ${exp.location}`}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{exp.period}</p>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-1">
                      {exp.highlights.map((highlight, i) => (
                        <li key={i}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <Separator className="mb-8" />

            {/* Projects */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-primary">Selected Projects</h3>
              <div className="space-y-4">
                {resumeData.projects.map((proj, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{proj.name}</h4>
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

            <Separator className="mb-8" />

            {/* Skills */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-primary">Skills</h3>
              <div className="space-y-4">
                {Object.entries(resumeData.skills).map(([category, skills]) => (
                  <div key={category}>
                    <h4 className="font-medium mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Separator className="mb-8" />

            {/* Education */}
            <section>
              <h3 className="text-lg font-semibold mb-4 text-primary">Education</h3>
              <div className="space-y-3">
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="font-medium">{edu.degree}</h4>
                      <p className="text-muted-foreground">{edu.institution}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{edu.year}</p>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </div>
    </div>
  );
}
