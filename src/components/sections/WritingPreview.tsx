import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackWritingClick } from '@/lib/analytics';
import type { WritingItem, WritingCategory } from '@/types/database';
import { format } from 'date-fns';

interface WritingPreviewProps {
  title?: string;
  items?: WritingItem[];
  categories?: WritingCategory[];
}

export function WritingPreview({
  title = 'Selected Writing',
  items = [],
  categories = []
}: WritingPreviewProps) {
  // Auto-hide if no items
  if (!items || items.length === 0) {
    return null;
  }

  // Show max 3 items, sorted by featured first, then published_at (newest), then order_index
  const displayItems = [...items]
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      // Then by published_at (newest first)
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      // Fallback to order_index
      return (a.order_index || 0) - (b.order_index || 0);
    })
    .slice(0, 3);

  const handleClick = (url: string) => {
    trackWritingClick(url);
  };

  const getLanguageDir = (lang: WritingItem['language']): 'rtl' | 'ltr' => {
    return lang === 'AR' ? 'rtl' : 'ltr';
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  const getCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return '';
    return categories.find(c => c.id === categoryId)?.name || '';
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

        {/* Simple rows */}
        <div className="divide-y divide-border/30">
          {displayItems.map((item) => {
            const categoryName = getCategoryName(item.category_id);
            const dateStr = formatDate(item.published_at);
            const meta = [categoryName, dateStr, item.platform_label].filter(Boolean).join(' • ');
            
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClick(item.url || '')}
                className="group block py-4 hover:bg-muted/20 -mx-3 px-3 rounded transition-colors"
              >
                {/* Desktop: single line if possible */}
                <div className="hidden sm:flex items-baseline justify-between gap-4">
                  <span 
                    className="flex-1 min-w-0 truncate font-medium group-hover:text-primary transition-colors"
                    dir={getLanguageDir(item.language)}
                  >
                    {item.title}
                  </span>
                  <span className="flex-shrink-0 text-sm text-muted-foreground flex items-center gap-1.5">
                    {meta}
                    <ArrowUpRight className="w-3.5 h-3.5 inline-block" />
                  </span>
                </div>

                {/* Mobile: two lines */}
                <div className="sm:hidden">
                  <div 
                    className="font-medium truncate group-hover:text-primary transition-colors"
                    dir={getLanguageDir(item.language)}
                  >
                    {item.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {meta}
                    <ArrowUpRight className="w-3 h-3 inline-block" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WritingPreview;
