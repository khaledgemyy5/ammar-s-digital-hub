import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { trackWritingClick } from '@/lib/analytics';
import type { WritingItem } from '@/types/database';

interface WritingPreviewProps {
  title?: string;
  items?: WritingItem[];
}

// Demo items for when no data is available
const demoItems: Partial<WritingItem>[] = [
  {
    id: '1',
    title: 'Building LLM-Powered Features: A Product Manager Guide',
    url: 'https://medium.com/example',
    platform_label: 'Medium',
    language: 'EN',
    featured: true,
  },
  {
    id: '2',
    title: 'The Art of Technical Product Management',
    url: 'https://blog.example.com',
    platform_label: 'Personal Blog',
    language: 'EN',
    featured: true,
  },
  {
    id: '3',
    title: 'كيف تبني منتجات تقنية ناجحة',
    url: 'https://arabic-platform.com',
    platform_label: 'Arabic Platform',
    language: 'AR',
    featured: true,
  },
];

export function WritingPreview({
  title = 'Selected Writing',
  items = demoItems as WritingItem[]
}: WritingPreviewProps) {
  const displayItems = items.length > 0 ? items : demoItems;

  const handleClick = (url: string) => {
    trackWritingClick(url);
  };

  return (
    <section className="section-spacing">
      <div className="container-content">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl md:text-3xl">{title}</h2>
          <Link 
            to="/writing" 
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            All Writing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {displayItems.slice(0, 3).map((item, index) => (
            <motion.a
              key={item.id || index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick(item.url || '')}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group flex items-center justify-between p-4 md:p-5 border border-border rounded-lg bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-300"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Title with RTL support */}
                <span 
                  className="font-medium group-hover:text-primary transition-colors truncate"
                  dir={item.language === 'AR' ? 'rtl' : 'ltr'}
                >
                  {item.title}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {/* Language Badge */}
                {item.language && item.language !== 'AUTO' && (
                  <Badge variant="outline" className="text-xs">
                    {item.language}
                  </Badge>
                )}

                {/* Platform */}
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {item.platform_label}
                </span>

                {/* External Link Icon */}
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WritingPreview;
