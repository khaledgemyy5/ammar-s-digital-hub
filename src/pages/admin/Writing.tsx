import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Star, Eye, EyeOff, 
  Loader2, Search, GripVertical, Save, X,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { getAllWritingCategories, getAllWritingItems, clearCache, adminGetSiteSettings, adminUpdateSiteSettings } from '@/lib/db';
import type { WritingCategory, WritingItem, Language, SiteSettings } from '@/types/database';

// Page settings interface
interface WritingPageSettings {
  pageTitle: string;
  introText: string;
  enablePage: boolean;
  autoHideIfEmpty: boolean;
}

// Type fix for nullable fields from database
type WritingItemFromDB = Omit<WritingItem, 'category_id' | 'published_at'> & { category_id: string | null; published_at: string | null };

export default function AdminWriting() {
  const [categories, setCategories] = useState<WritingCategory[]>([]);
  const [items, setItems] = useState<WritingItemFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  
  // Page settings
  const [pageSettings, setPageSettings] = useState<WritingPageSettings>({
    pageTitle: 'Selected Writing',
    introText: 'Articles on product, AI, and technology.',
    enablePage: true,
    autoHideIfEmpty: true,
  });
  
  // Category editing
  const [editingCategory, setEditingCategory] = useState<WritingCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [deleteCategory, setDeleteCategory] = useState<string | null>(null);
  
  // Item editing
  const [editingItem, setEditingItem] = useState<WritingItem | null>(null);
  const [itemForm, setItemForm] = useState({
    title: '',
    url: '',
    platform_label: '',
    category_id: '',
    language: 'AUTO' as Language,
    featured: false,
    enabled: true,
    order_index: 0,
    why_this_matters: '',
    show_why: false,
    published_at: '' as string,
  });
  const [deleteItem, setDeleteItem] = useState<string | null>(null);
  
  // Search
  const [search, setSearch] = useState('');

  const loadData = async () => {
    const [cats, itms, settings] = await Promise.all([
      getAllWritingCategories(),
      getAllWritingItems(),
      adminGetSiteSettings(),
    ]);
    setCategories(cats);
    setItems(itms as WritingItemFromDB[]);
    setSiteSettings(settings);
    
    // Load page settings from site_settings.pages.writing
    if (settings?.pages && (settings.pages as any).writing) {
      const w = (settings.pages as any).writing;
      setPageSettings({
        pageTitle: w.pageTitle || 'Selected Writing',
        introText: w.introText || '',
        enablePage: w.enablePage !== false,
        autoHideIfEmpty: w.autoHideIfEmpty !== false,
      });
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // Category CRUD
  const openNewCategory = () => {
    setEditingCategory({ id: 'new' } as WritingCategory);
    setCategoryName('');
    setCategorySlug('');
  };

  const openEditCategory = (cat: WritingCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategorySlug(cat.slug);
  };

  const saveCategory = async () => {
    if (!categoryName.trim() || !categorySlug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory?.id === 'new') {
        const { error } = await (supabase as any)
          .from('writing_categories')
          .insert({
            name: categoryName,
            slug: categorySlug,
            enabled: true,
            order_index: categories.length,
          });
        if (error) throw error;
        toast.success('Category created');
      } else {
        const { error } = await (supabase as any)
          .from('writing_categories')
          .update({ name: categoryName, slug: categorySlug })
          .eq('id', editingCategory!.id);
        if (error) throw error;
        toast.success('Category updated');
      }
      clearCache();
      loadData();
      setEditingCategory(null);
    } catch (err) {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategoryEnabled = async (cat: WritingCategory) => {
    const { error } = await (supabase as any)
      .from('writing_categories')
      .update({ enabled: !cat.enabled })
      .eq('id', cat.id);
    
    if (!error) {
      clearCache();
      loadData();
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;
    
    const { error } = await supabase
      .from('writing_categories' as any)
      .delete()
      .eq('id', deleteCategory);
    
    if (!error) {
      clearCache();
      toast.success('Category deleted');
      loadData();
    } else {
      toast.error('Failed to delete category');
    }
    setDeleteCategory(null);
  };

  // Item CRUD
  const openNewItem = () => {
    setEditingItem({ id: 'new' } as WritingItem);
    setItemForm({
      title: '',
      url: '',
      platform_label: '',
      category_id: categories[0]?.id || '',
      language: 'AUTO',
      featured: false,
      enabled: true,
      order_index: items.length,
      why_this_matters: '',
      show_why: false,
      published_at: '',
    });
  };

  const openEditItem = (item: WritingItemFromDB) => {
    setEditingItem(item as any);
    setItemForm({
      title: item.title,
      url: item.url,
      platform_label: item.platform_label || '',
      category_id: item.category_id || '',
      language: item.language,
      featured: item.featured,
      enabled: item.enabled,
      order_index: item.order_index,
      why_this_matters: item.why_this_matters || '',
      show_why: item.show_why,
      published_at: item.published_at ? item.published_at.split('T')[0] : '',
    });
  };

  const saveItem = async () => {
    if (!itemForm.title.trim() || !itemForm.url.trim()) {
      toast.error('Title and URL are required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: itemForm.title,
        url: itemForm.url,
        platform_label: itemForm.platform_label,
        category_id: itemForm.category_id,
        language: itemForm.language,
        featured: itemForm.featured,
        enabled: itemForm.enabled,
        order_index: itemForm.order_index,
        why_this_matters: itemForm.why_this_matters,
        show_why: itemForm.show_why,
        published_at: itemForm.published_at ? new Date(itemForm.published_at).toISOString() : null,
      };

      if (editingItem?.id === 'new') {
        const { error } = await (supabase as any)
          .from('writing_items')
          .insert(data);
        if (error) throw error;
        toast.success('Item created');
      } else {
        const { error } = await (supabase as any)
          .from('writing_items')
          .update(data)
          .eq('id', editingItem!.id);
        if (error) throw error;
        toast.success('Item updated');
      }
      clearCache();
      loadData();
      setEditingItem(null);
    } catch (err) {
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const toggleItemEnabled = async (item: WritingItemFromDB) => {
    const { error } = await (supabase as any)
      .from('writing_items')
      .update({ enabled: !item.enabled })
      .eq('id', item.id);
    
    if (!error) {
      clearCache();
      loadData();
    }
  };

  const toggleItemFeatured = async (item: WritingItemFromDB) => {
    const { error } = await (supabase as any)
      .from('writing_items')
      .update({ featured: !item.featured })
      .eq('id', item.id);
    
    if (!error) {
      clearCache();
      loadData();
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItem) return;
    
    const { error } = await supabase
      .from('writing_items' as any)
      .delete()
      .eq('id', deleteItem);
    
    if (!error) {
      clearCache();
      toast.success('Item deleted');
      loadData();
    } else {
      toast.error('Failed to delete item');
    }
    setDeleteItem(null);
  };

  const savePageSettings = async () => {
    if (!siteSettings) return;
    
    setSaving(true);
    try {
      const updatedPages = {
        ...siteSettings.pages,
        writing: pageSettings,
      };
      
      const success = await adminUpdateSiteSettings({ pages: updatedPages });
      if (success) {
        clearCache();
        toast.success('Page settings saved');
      } else {
        toast.error('Failed to save page settings');
      }
    } catch {
      toast.error('Failed to save page settings');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryName = (id: string | null) => {
    if (!id) return 'Uncategorized';
    return categories.find(c => c.id === id)?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Writing</h1>
        <p className="text-muted-foreground">Manage categories and writing items</p>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList>
          <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
          <TabsTrigger value="settings">Page Settings</TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search items..."
                  className="pl-10"
                />
              </div>
              <Button onClick={openNewItem}>
                <Plus className="w-4 h-4 mr-2" />
                New Item
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {search ? 'No items match your search' : 'No items yet'}
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" dir="auto">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryName(item.category_id)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{item.platform_label}</span>
                            {item.language !== 'AUTO' && (
                              <Badge variant="outline" className="text-xs">{item.language}</Badge>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={item.featured}
                          onCheckedChange={() => toggleItemFeatured(item)}
                        />
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={() => toggleItemEnabled(item)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => openEditItem(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteItem(item.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openNewCategory}>
                <Plus className="w-4 h-4 mr-2" />
                New Category
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {categories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No categories yet
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-4 p-4">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <div className="flex-1">
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-sm text-muted-foreground">/{cat.slug}</p>
                        </div>
                        <Badge variant="secondary">
                          {items.filter(i => i.category_id === cat.id).length} items
                        </Badge>
                        <Switch
                          checked={cat.enabled}
                          onCheckedChange={() => toggleCategoryEnabled(cat)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => openEditCategory(cat)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteCategory(cat.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Page Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Writing Page Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label>Page Title</Label>
                  <Input
                    value={pageSettings.pageTitle}
                    onChange={(e) => setPageSettings({ ...pageSettings, pageTitle: e.target.value })}
                    className="mt-1"
                    placeholder="Selected Writing"
                  />
                </div>
                <div>
                  <Label>Intro Text</Label>
                  <Textarea
                    value={pageSettings.introText}
                    onChange={(e) => setPageSettings({ ...pageSettings, introText: e.target.value })}
                    className="mt-1"
                    rows={2}
                    placeholder="Articles on product, AI, and technology."
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={pageSettings.enablePage}
                      onCheckedChange={(checked) => setPageSettings({ ...pageSettings, enablePage: checked })}
                    />
                    <Label>Enable Page</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={pageSettings.autoHideIfEmpty}
                      onCheckedChange={(checked) => setPageSettings({ ...pageSettings, autoHideIfEmpty: checked })}
                    />
                    <Label>Auto-hide if empty</Label>
                  </div>
                </div>
              </div>
              <Button onClick={savePageSettings} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory?.id === 'new' ? 'New Category' : 'Edit Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  if (editingCategory?.id === 'new') {
                    setCategorySlug(generateSlug(e.target.value));
                  }
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={categorySlug}
                onChange={(e) => setCategorySlug(generateSlug(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem?.id === 'new' ? 'New Item' : 'Edit Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Title *</Label>
              <Input
                value={itemForm.title}
                onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                className="mt-1"
                dir="auto"
              />
            </div>
            <div>
              <Label>URL *</Label>
              <Input
                value={itemForm.url}
                onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Platform Label</Label>
                <Input
                  value={itemForm.platform_label}
                  onChange={(e) => setItemForm({ ...itemForm, platform_label: e.target.value })}
                  className="mt-1"
                  placeholder="Medium, Personal Blog, etc."
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={itemForm.category_id}
                  onValueChange={(v) => setItemForm({ ...itemForm, category_id: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Published Date</Label>
                <Input
                  type="date"
                  value={itemForm.published_at}
                  onChange={(e) => setItemForm({ ...itemForm, published_at: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Language</Label>
                <Select
                  value={itemForm.language}
                  onValueChange={(v) => setItemForm({ ...itemForm, language: v as Language })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">Auto-detect</SelectItem>
                    <SelectItem value="EN">English</SelectItem>
                    <SelectItem value="AR">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Why This Matters</Label>
              <Textarea
                value={itemForm.why_this_matters}
                onChange={(e) => setItemForm({ ...itemForm, why_this_matters: e.target.value })}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={itemForm.show_why}
                  onCheckedChange={(checked) => setItemForm({ ...itemForm, show_why: checked })}
                />
                <Label>Show "Why This Matters"</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={itemForm.featured}
                  onCheckedChange={(checked) => setItemForm({ ...itemForm, featured: checked })}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={itemForm.enabled}
                  onCheckedChange={(checked) => setItemForm({ ...itemForm, enabled: checked })}
                />
                <Label>Enabled</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={saveItem} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete all items in this category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
