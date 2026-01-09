import { useEffect, useState, useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SupabaseStatus } from '@/components/ui/SupabaseStatus';
import { getWritingCategories, getWritingItems } from '@/lib/db';
import { trackPageView, trackWritingClick } from '@/lib/analytics';
import type { WritingCategory, WritingItem } from '@/types/database';
import { cn } from '@/lib/utils';

export default function Writing() {
  const [categories, setCategories] = useState<WritingCategory[]>([]);
  const [items, setItems] = useState<WritingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    trackPageView('/writing');
    
    Promise.all([
      getWritingCategories(),
      getWritingItems()
    ]).then(([cats, itms]) => {
      // Sort categories by order_index
      setCategories(cats.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
      // Sort items: featured first, then by order_index
      setItems(itms.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (a.order_index || 0) - (b.order_index || 0);
      }));
      setLoading(false);
    });
  }, []);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return items;
    return items.filter(item => item.category_id === activeCategory);
  }, [items, activeCategory]);

  const getLanguageDir = (lang: WritingItem['language']): 'rtl' | 'ltr' => {
    return lang === 'AR' ? 'rtl' : 'ltr';
  };

  const handleItemClick = (url: string) => {
    trackWritingClick(url);
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

        {/* Tabs - Scrollable on mobile */}
        <div className="mb-8 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                !activeCategory
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-0 divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No items in this category
          </div>
        )}

        {/* Writing Items - One-line rows */}
        {!loading && filteredItems.length > 0 && (
          <div className="divide-y divide-border/50">
            {filteredItems.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleItemClick(item.url)}
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
        )}
      </div>
    </div>
  );
}
