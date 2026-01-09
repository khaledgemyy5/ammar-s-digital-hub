import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackWritingClick } from '@/lib/analytics';
import type { WritingItem } from '@/types/database';

interface WritingPreviewProps {
  title?: string;
  items?: WritingItem[];
}

export function WritingPreview({
  title = 'Selected Writing',
  items = []
}: WritingPreviewProps) {
  // Auto-hide if no items
  if (!items || items.length === 0) {
    return null;
  }

  // Show max 3 items, sorted by featured first then order_index
  const displayItems = [...items]
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.order_index || 0) - (b.order_index || 0);
    })
    .slice(0, 3);

  const handleClick = (url: string) => {
    trackWritingClick(url);
  };

  const getLanguageDir = (lang: WritingItem['language']): 'rtl' | 'ltr' => {
    return lang === 'AR' ? 'rtl' : 'ltr';
  };

  return (
    <section className="section-spacing">
      <div className="container-content">
        {/* Header with View all link */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl">{title}</h2>
          <Link 
            to="/writing" 
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* One-line rows */}
        <div className="divide-y divide-border/50">
          {displayItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick(item.url || '')}
              className="group flex items-center justify-between py-3 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
            >
              {/* Title - truncated, RTL aware */}
              <span 
                className="flex-1 min-w-0 truncate font-medium group-hover:text-primary transition-colors"
                dir={getLanguageDir(item.language)}
              >
                {item.title}
              </span>

              {/* Right side: Platform + Language + Arrow */}
              <span className="flex items-center gap-2 flex-shrink-0 ml-4 text-muted-foreground">
                {/* Platform label */}
                <span className="text-sm hidden sm:inline">
                  {item.platform_label}
                </span>
                <span className="text-xs sm:hidden">
                  {item.platform_label?.slice(0, 8)}
                </span>
                
                {/* Language badge - tiny */}
                {item.language && item.language !== 'AUTO' && (
                  <span className="text-[10px] uppercase tracking-wider opacity-60">
                    {item.language}
                  </span>
                )}
                
                {/* Arrow */}
                <ArrowUpRight className="w-4 h-4 group-hover:text-primary transition-colors" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WritingPreview;
