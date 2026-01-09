import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SupabaseStatus } from '@/components/ui/SupabaseStatus';
import { getWritingItems } from '@/lib/db';
import { trackPageView, trackWritingClick } from '@/lib/analytics';
import type { WritingItem } from '@/types/database';
import { format } from 'date-fns';

export default function Writing() {
  const [items, setItems] = useState<WritingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackPageView('/writing');
    
    getWritingItems().then((itms) => {
      // Sort items: featured first, then by published_at (newest), then order_index
      const sorted = itms.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        // Then by published_at (newest first)
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        // Fallback to order_index
        return (a.order_index || 0) - (b.order_index || 0);
      });
      setItems(sorted);
      setLoading(false);
    });
  }, []);

  const getLanguageDir = (lang: WritingItem['language']): 'rtl' | 'ltr' => {
    return lang === 'AR' ? 'rtl' : 'ltr';
  };

  const handleItemClick = (url: string) => {
    trackWritingClick(url);
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  return (
    <div className="section-spacing">
      <div className="container-content">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Selected Writing</h1>
          <p className="text-muted-foreground">
            Articles on product, AI, and technology.
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className="mb-6">
          <SupabaseStatus />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-0 divide-y divide-border/30">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="py-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No writing yet.
          </div>
        )}

        {/* Writing Items - Simple rows */}
        {!loading && items.length > 0 && (
          <div className="divide-y divide-border/30">
            {items.map((item) => {
              const dateStr = formatDate(item.published_at);
              const meta = [dateStr, item.platform_label].filter(Boolean).join(' • ');
              
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleItemClick(item.url)}
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
        )}
      </div>
    </div>
  );
}
