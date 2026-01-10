import { useState, useEffect } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { 
  ProjectCustomSection, 
  getEmbedUrl, 
  isAllowedEmbedDomain 
} from '@/types/customSection';

interface CustomSectionRendererProps {
  sections: ProjectCustomSection[];
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      {children}
    </section>
  );
}

interface EmbedViewerProps {
  url: string;
  title: string;
}

function EmbedViewer({ url, title }: EmbedViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isAllowed = isAllowedEmbedDomain(url);
  const embedUrl = getEmbedUrl(url);
  
  // If domain not allowed or no embed URL, show link button
  if (!isAllowed || !embedUrl) {
    return (
      <Button variant="outline" asChild className="gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-4 h-4" />
          Open Link
        </a>
      </Button>
    );
  }
  
  // On mobile, show click-to-load
  if (isMobile && !loaded) {
    return (
      <Button 
        variant="outline" 
        onClick={() => setLoaded(true)}
        className="gap-2 w-full py-8"
      >
        <Play className="w-5 h-5" />
        Click to Load Embed
      </Button>
    );
  }
  
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

// Sanitize HTML content with DOMPurify
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'em', 'a', 'code', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

function renderSectionContent(section: ProjectCustomSection) {
  switch (section.type) {
    case 'markdown':
      // Simple markdown rendering (basic formatting)
      const lines = (section.markdown || '').split('\n');
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {lines.map((line, i) => {
            // Headers (rendered as plain text, not HTML)
            if (line.startsWith('### ')) {
              return <h4 key={i} className="text-base font-semibold mt-4 mb-2">{line.slice(4)}</h4>;
            }
            if (line.startsWith('## ')) {
              return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h3>;
            }
            if (line.startsWith('# ')) {
              return <h2 key={i} className="text-xl font-semibold mt-4 mb-2">{line.slice(2)}</h2>;
            }
            // Bold
            let text = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Italic
            text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
            // Links
            text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>');
            // Inline code
            text = text.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>');
            
            if (!line.trim()) {
              return <br key={i} />;
            }
            
            // Sanitize the HTML before rendering
            const sanitizedHtml = sanitizeHtml(text);
            return <p key={i} className="text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
          })}
        </div>
      );
    
    case 'bullets':
      return (
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          {(section.bullets || []).filter(b => b.trim()).map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      );
    
    case 'code':
      return (
        <div className="relative">
          <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {section.code?.language || 'code'}
          </div>
          <pre className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto">
            <code className="text-sm font-mono text-foreground">
              {section.code?.content || ''}
            </code>
          </pre>
        </div>
      );
    
    case 'embed':
      if (!section.embed?.url) return null;
      return <EmbedViewer url={section.embed.url} title={section.title} />;
    
    default:
      return null;
  }
}

export function CustomSectionRenderer({ sections }: CustomSectionRendererProps) {
  const visibleSections = sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);
  
  if (visibleSections.length === 0) return null;
  
  return (
    <>
      {visibleSections.map(section => (
        <Section key={section.id} title={section.title}>
          {renderSectionContent(section)}
        </Section>
      ))}
    </>
  );
}