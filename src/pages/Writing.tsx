import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Star, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SupabaseStatus } from '@/components/ui/SupabaseStatus';
import { getWritingCategories, getWritingItems } from '@/lib/db';
import { trackPageView, trackWritingClick } from '@/lib/analytics';
import type { WritingCategory, WritingItem } from '@/types/database';

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
      setCategories(cats);
      setItems(itms);
      setLoading(false);
    });
  }, []);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return items;
    return items.filter(item => item.category_id === activeCategory);
  }, [items, activeCategory]);

  const getLanguageDir = (lang: WritingItem['language']): 'rtl' | 'ltr' | 'auto' => {
    if (lang === 'AR') return 'rtl';
    if (lang === 'EN') return 'ltr';
    return 'auto';
  };

  const handleItemClick = (url: string) => {
    trackWritingClick(url);
  };

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return 'Uncategorized';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Uncategorized';
  };

  return (
    <div className="section-spacing">
      <div className="container-content">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="mb-4">Selected Writing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Articles, essays, and thoughts on product management, AI/LLM development, 
            startups, and technology.
          </p>
        </motion.div>

        {/* Supabase Status Banner */}
        <div className="mb-8">
          <SupabaseStatus />
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2 mb-10"
          >
            <Button
              variant={!activeCategory ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(null)}
              className="rounded-full"
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="rounded-full"
              >
                {cat.name}
              </Button>
            ))}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 border border-dashed border-border rounded-lg"
          >
            <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No writing found</p>
            <p className="text-sm text-muted-foreground">
              {activeCategory 
                ? 'No articles match this category.'
                : 'Articles will appear here once added to the database.'
              }
            </p>
          </motion.div>
        )}

        {/* Writing Items List */}
        {!loading && filteredItems.length > 0 && (
          <div className="space-y-4">
            {filteredItems.map((item, index) => (
              <motion.a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleItemClick(item.url)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group flex items-start md:items-center justify-between p-5 border border-border rounded-lg bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-300"
              >
                <div className="flex-1 min-w-0 pr-4">
                  {/* Title with RTL support */}
                  <h3 
                    className="font-medium text-lg group-hover:text-primary transition-colors mb-2"
                    dir={getLanguageDir(item.language)}
                  >
                    {item.title}
                  </h3>
                  
                  {/* Why This Matters */}
                  {item.show_why && item.why_this_matters && (
                    <p 
                      className="text-sm text-muted-foreground mb-3 line-clamp-2"
                      dir={getLanguageDir(item.language)}
                    >
                      {item.why_this_matters}
                    </p>
                  )}

                  {/* Meta Row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Category */}
                    {!activeCategory && (
                      <span className="text-sm text-muted-foreground">
                        {getCategoryName(item.category_id)}
                      </span>
                    )}
                    
                    {/* Platform */}
                    <span className="text-sm text-muted-foreground">
                      {item.platform_label}
                    </span>

                    {/* Language Badge */}
                    {item.language && item.language !== 'AUTO' && (
                      <Badge variant="outline" className="text-xs">
                        {item.language}
                      </Badge>
                    )}

                    {/* Featured Badge */}
                    {item.featured && (
                      <Badge className="badge-featured flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>

                {/* External Link Icon */}
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
