import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SupabaseStatus } from '@/components/ui/SupabaseStatus';
import { getWritingItems, getWritingCategories } from '@/lib/db';
import { trackPageView, trackWritingClick } from '@/lib/analytics';
import type { WritingItem, WritingCategory } from '@/types/database';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Writing() {
  const [items, setItems] = useState<WritingItem[]>([]);
  const [categories, setCategories] = useState<WritingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    trackPageView('/writing');
    
    Promise.all([
      getWritingItems(),
      getWritingCategories()
    ]).then(([itms, cats]) => {
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
      setCategories(cats);
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

  // Filter items by category
  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(item => item.category_id === activeCategory);

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

        {/* Category Tabs */}
        {!loading && categories.length > 0 && (
          <div className="mb-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeCategory === 'all'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

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
        {!loading && filteredItems.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {activeCategory === 'all' ? 'No writing yet.' : 'No writing in this category.'}
            </p>
            {activeCategory !== 'all' && (
              <button
                onClick={() => setActiveCategory('all')}
                className="text-sm text-primary hover:underline"
              >
                View all writing
              </button>
            )}
          </div>
        )}

        {/* Writing Items - Simple rows */}
        {!loading && filteredItems.length > 0 && (
          <div className="divide-y divide-border/30">
            {filteredItems.map((item) => {
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
