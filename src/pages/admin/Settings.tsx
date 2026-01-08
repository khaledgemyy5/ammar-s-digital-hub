import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { adminGetSiteSettings, adminUpdateSiteSettings, clearCache } from '@/lib/db';
import type { SiteSettings, NavLink, HomeSection, ThemeConfig, SEOConfig, PageConfig } from '@/types/database';

const defaultNavLinks: NavLink[] = [
  { id: 'experience', label: 'Experience', path: '/#experience', visible: true, order: 0 },
  { id: 'projects', label: 'Projects', path: '/projects', visible: true, order: 1 },
  { id: 'how-i-work', label: 'How I Work', path: '/#how-i-work', visible: true, order: 2 },
  { id: 'writing', label: 'Writing', path: '/writing', visible: true, order: 3 },
  { id: 'contact', label: 'Contact', path: '/contact', visible: true, order: 4 },
];

const defaultHomeSections: HomeSection[] = [
  { id: 'hero', visible: true, order: 0 },
  { id: 'experience_snapshot', visible: true, order: 1 },
  { id: 'featured_projects', visible: true, order: 2, limit: 3 },
  { id: 'how_i_work', visible: true, order: 3 },
  { id: 'selected_writing_preview', visible: true, order: 4, limit: 3 },
  { id: 'contact_cta', visible: true, order: 5 },
];

const sectionLabels: Record<string, string> = {
  hero: 'Hero Section',
  experience_snapshot: 'Experience Snapshot',
  featured_projects: 'Featured Projects',
  how_i_work: 'How I Work',
  selected_writing_preview: 'Selected Writing',
  contact_cta: 'Contact CTA',
};

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  // Form state
  const [navLinks, setNavLinks] = useState<NavLink[]>(defaultNavLinks);
  const [homeSections, setHomeSections] = useState<HomeSection[]>(defaultHomeSections);
  const [theme, setTheme] = useState<ThemeConfig>({
    accentColor: '#135BEC',
    defaultMode: 'light',
    font: 'ibm-plex',
  });
  const [seo, setSeo] = useState<SEOConfig>({
    siteTitle: 'Ammar Jaber | Technical Product Manager',
    siteDescription: 'Technical Product Manager with experience in LLM and Software Engineering.',
  });
  const [pages, setPages] = useState<PageConfig>({
    resume: { enabled: true, showCopyText: true, showDownload: true },
    contact: { enabled: true },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await adminGetSiteSettings();
    if (data) {
      setSettings(data);
      setNavLinks((data.nav_config as NavLink[]) || defaultNavLinks);
      setHomeSections((data.home_sections as HomeSection[]) || defaultHomeSections);
      setTheme((data.theme as ThemeConfig) || theme);
      setSeo((data.seo as SEOConfig) || seo);
      setPages((data.pages as PageConfig) || pages);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await adminUpdateSiteSettings({
        nav_config: navLinks,
        home_sections: homeSections,
        theme,
        seo,
        pages,
      });
      
      if (success) {
        clearCache();
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const addNavLink = () => {
    const newLink: NavLink = {
      id: `link-${Date.now()}`,
      label: 'New Link',
      path: '/',
      visible: true,
      order: navLinks.length,
    };
    setNavLinks([...navLinks, newLink]);
  };

  const updateNavLink = (index: number, updates: Partial<NavLink>) => {
    const updated = [...navLinks];
    updated[index] = { ...updated[index], ...updates };
    setNavLinks(updated);
  };

  const removeNavLink = (index: number) => {
    setNavLinks(navLinks.filter((_, i) => i !== index));
  };

  const updateHomeSection = (id: string, updates: Partial<HomeSection>) => {
    setHomeSections(prev => prev.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">Configure your site's appearance and content</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="navigation" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="home">Home Layout</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>

        {/* Navigation Tab */}
        <TabsContent value="navigation">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Links</CardTitle>
              <CardDescription>Configure the links that appear in your site's navigation bar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-4 border border-border rounded-lg"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <Input
                    value={link.label}
                    onChange={(e) => updateNavLink(index, { label: e.target.value })}
                    placeholder="Label"
                    className="w-32"
                  />
                  <Input
                    value={link.path}
                    onChange={(e) => updateNavLink(index, { path: e.target.value })}
                    placeholder="Path"
                    className="flex-1"
                  />
                  <Switch
                    checked={link.visible}
                    onCheckedChange={(checked) => updateNavLink(index, { visible: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeNavLink(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </motion.div>
              ))}
              <Button variant="outline" onClick={addNavLink}>
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Home Layout Tab */}
        <TabsContent value="home">
          <Card>
            <CardHeader>
              <CardTitle>Home Page Sections</CardTitle>
              <CardDescription>Toggle and configure sections on the home page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {homeSections.sort((a, b) => a.order - b.order).map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1">
                    <p className="font-medium">{sectionLabels[section.id] || section.id}</p>
                  </div>
                  {(section.id === 'featured_projects' || section.id === 'selected_writing_preview') && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Limit:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={6}
                        value={section.limit || 3}
                        onChange={(e) => updateHomeSection(section.id, { limit: parseInt(e.target.value) || 3 })}
                        className="w-16"
                      />
                    </div>
                  )}
                  <Switch
                    checked={section.visible}
                    onCheckedChange={(checked) => updateHomeSection(section.id, { visible: checked })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>Customize the look and feel of your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 max-w-md">
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={theme.accentColor}
                      onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Default Mode</Label>
                  <Select
                    value={theme.defaultMode}
                    onValueChange={(value: 'light' | 'dark' | 'system') => 
                      setTheme({ ...theme, defaultMode: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Font Family</Label>
                  <Select
                    value={theme.font}
                    onValueChange={(value: 'inter' | 'ibm-plex' | 'system') => 
                      setTheme({ ...theme, font: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ibm-plex">IBM Plex Serif + Inter</SelectItem>
                      <SelectItem value="inter">Inter Only</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Configure search engine optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div>
                <Label>Site Title</Label>
                <Input
                  value={seo.siteTitle}
                  onChange={(e) => setSeo({ ...seo, siteTitle: e.target.value })}
                  className="mt-1"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">{seo.siteTitle.length}/60 characters</p>
              </div>
              
              <div>
                <Label>Site Description</Label>
                <Textarea
                  value={seo.siteDescription}
                  onChange={(e) => setSeo({ ...seo, siteDescription: e.target.value })}
                  className="mt-1"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">{seo.siteDescription.length}/160 characters</p>
              </div>
              
              <div>
                <Label>OG Image URL (optional)</Label>
                <Input
                  value={seo.ogImage || ''}
                  onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                  className="mt-1"
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <Label>Canonical URL (optional)</Label>
                <Input
                  value={seo.canonicalUrl || ''}
                  onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
                  className="mt-1"
                  placeholder="https://ammarjaber.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resume Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Resume Page</Label>
                  <Switch
                    checked={pages.resume.enabled}
                    onCheckedChange={(checked) => 
                      setPages({ ...pages, resume: { ...pages.resume, enabled: checked } })
                    }
                  />
                </div>
                <div>
                  <Label>PDF Download URL</Label>
                  <Input
                    value={pages.resume.pdfUrl || ''}
                    onChange={(e) => 
                      setPages({ ...pages, resume: { ...pages.resume, pdfUrl: e.target.value } })
                    }
                    className="mt-1"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Copy Text Button</Label>
                  <Switch
                    checked={pages.resume.showCopyText}
                    onCheckedChange={(checked) => 
                      setPages({ ...pages, resume: { ...pages.resume, showCopyText: checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Download Button</Label>
                  <Switch
                    checked={pages.resume.showDownload}
                    onCheckedChange={(checked) => 
                      setPages({ ...pages, resume: { ...pages.resume, showDownload: checked } })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Contact Page</Label>
                  <Switch
                    checked={pages.contact.enabled}
                    onCheckedChange={(checked) => 
                      setPages({ ...pages, contact: { ...pages.contact, enabled: checked } })
                    }
                  />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input
                    value={pages.contact.email || ''}
                    onChange={(e) => 
                      setPages({ ...pages, contact: { ...pages.contact, email: e.target.value } })
                    }
                    className="mt-1"
                    placeholder="hello@example.com"
                  />
                </div>
                <div>
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={pages.contact.linkedin || ''}
                    onChange={(e) => 
                      setPages({ ...pages, contact: { ...pages.contact, linkedin: e.target.value } })
                    }
                    className="mt-1"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <Label>Calendar Booking URL</Label>
                  <Input
                    value={pages.contact.calendar || ''}
                    onChange={(e) => 
                      setPages({ ...pages, contact: { ...pages.contact, calendar: e.target.value } })
                    }
                    className="mt-1"
                    placeholder="https://calendly.com/..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
