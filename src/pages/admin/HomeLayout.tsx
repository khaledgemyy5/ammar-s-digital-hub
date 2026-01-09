import { useEffect, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  GripVertical, Save, Loader2, Eye, EyeOff, Plus, Trash2, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { adminGetSiteSettings, adminUpdateSiteSettings, clearCache } from '@/lib/db';
import type { HomeSection, ButtonConfig, HeroConfig, PageConfig } from '@/types/database';
import { ExperienceSnapshotEditor } from '@/components/admin/ExperienceSnapshotEditor';
import { 
  ExperienceSnapshotFullConfig, 
  defaultExperienceSnapshotConfig,
  migrateToExperienceSnapshotFullConfig 
} from '@/types/experienceSnapshot';

const sectionLabels: Record<string, string> = {
  hero: 'Hero Section',
  experience_snapshot: 'Experience Snapshot',
  featured_projects: 'Featured Projects',
  how_i_work: 'How I Work',
  selected_writing_preview: 'Selected Writing',
  contact_cta: 'Contact CTA',
};

const sectionDescriptions: Record<string, string> = {
  hero: 'Main banner with headline, intro, and CTAs',
  experience_snapshot: 'Quick overview of your experience',
  featured_projects: 'Showcase featured projects',
  how_i_work: 'Your working style and approach',
  selected_writing_preview: 'Featured writing items',
  contact_cta: 'Call to action for contact',
};

const defaultHeroConfig: HeroConfig = {
  name: 'Ammar Jaber',
  role: 'Technical Product Manager',
  transitionLine: 'From Software Engineering & LLM to Product',
  introLine1: 'I build products that matter.',
  introLine2: 'Currently focused on AI-powered experiences.',
  badges: ['Product Strategy', 'LLM/AI', 'Technical Leadership'],
  ctas: [
    { label: 'View Resume', actionType: 'internal', target: '/resume', variant: 'primary', visible: true },
    { label: 'See Projects', actionType: 'internal', target: '/projects', variant: 'secondary', visible: true },
  ],
};

export default function AdminHomeLayout() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [experienceConfig, setExperienceConfig] = useState<ExperienceSnapshotFullConfig>(defaultExperienceSnapshotConfig);
  const [pages, setPages] = useState<Partial<PageConfig>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const settings = await adminGetSiteSettings();
    if (settings?.home_sections) {
      const sorted = [...(settings.home_sections as HomeSection[])].sort((a, b) => a.order - b.order);
      // Ensure hero has config
      const withDefaults = sorted.map(s => {
        if (s.id === 'hero' && !s.config) {
          return { ...s, config: defaultHeroConfig };
        }
        return s;
      });
      setSections(withDefaults);
    }
    
    // Load pages config
    if (settings?.pages) {
      setPages(settings.pages as PageConfig);
      
      // Load experience config from pages or section config
      if (settings.pages.experienceSnapshot) {
        setExperienceConfig(migrateToExperienceSnapshotFullConfig(settings.pages.experienceSnapshot));
      } else {
        const expSection = (settings.home_sections as HomeSection[])?.find(s => s.id === 'experience_snapshot');
        if (expSection?.config) {
          setExperienceConfig(migrateToExperienceSnapshotFullConfig(expSection.config));
        }
      }
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedSections = sections.map((section, index) => ({
        ...section,
        order: index,
      }));

      // Update experience snapshot visibility based on config
      const finalSections = updatedSections.map(s => {
        if (s.id === 'experience_snapshot') {
          return { ...s, visible: experienceConfig.enabled };
        }
        return s;
      });

      const success = await adminUpdateSiteSettings({
        home_sections: finalSections,
        pages: {
          ...pages,
          experienceSnapshot: experienceConfig,
        } as PageConfig,
      });

      if (success) {
        clearCache();
        toast.success('Home layout saved');
      } else {
        toast.error('Failed to save layout');
      }
    } catch (err) {
      toast.error('Error saving layout');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (id: string, updates: Partial<HomeSection>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateSectionConfig = (id: string, configUpdates: any) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, config: { ...(s.config || {}), ...configUpdates } } : s
    ));
  };

  const toggleVisibility = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  // Hero CTA management
  const addHeroCTA = () => {
    const heroSection = sections.find(s => s.id === 'hero');
    const ctas = (heroSection?.config as HeroConfig)?.ctas || [];
    const newCTA: ButtonConfig = {
      label: 'New Button',
      actionType: 'internal',
      target: '/',
      variant: 'secondary',
      visible: true,
    };
    updateSectionConfig('hero', { ctas: [...ctas, newCTA] });
  };

  const updateHeroCTA = (index: number, updates: Partial<ButtonConfig>) => {
    const heroSection = sections.find(s => s.id === 'hero');
    const ctas = [...((heroSection?.config as HeroConfig)?.ctas || [])];
    ctas[index] = { ...ctas[index], ...updates };
    updateSectionConfig('hero', { ctas });
  };

  const removeHeroCTA = (index: number) => {
    const heroSection = sections.find(s => s.id === 'hero');
    const ctas = ((heroSection?.config as HeroConfig)?.ctas || []).filter((_, i) => i !== index);
    updateSectionConfig('hero', { ctas });
  };

  // Hero badges management
  const addHeroBadge = () => {
    const heroSection = sections.find(s => s.id === 'hero');
    const badges = (heroSection?.config as HeroConfig)?.badges || [];
    updateSectionConfig('hero', { badges: [...badges, 'New Badge'] });
  };

  const updateHeroBadge = (index: number, value: string) => {
    const heroSection = sections.find(s => s.id === 'hero');
    const badges = [...((heroSection?.config as HeroConfig)?.badges || [])];
    badges[index] = value;
    updateSectionConfig('hero', { badges });
  };

  const removeHeroBadge = (index: number) => {
    const heroSection = sections.find(s => s.id === 'hero');
    const badges = ((heroSection?.config as HeroConfig)?.badges || []).filter((_, i) => i !== index);
    updateSectionConfig('hero', { badges });
  };

  // How I Work bullets management
  const updateHowIWorkBullet = (index: number, field: 'title' | 'description', value: string) => {
    const section = sections.find(s => s.id === 'how_i_work');
    const bullets = [...((section?.config as any)?.bullets || [])];
    bullets[index] = { ...bullets[index], [field]: value };
    updateSectionConfig('how_i_work', { bullets });
  };

  const addHowIWorkBullet = () => {
    const section = sections.find(s => s.id === 'how_i_work');
    const bullets = (section?.config as any)?.bullets || [];
    updateSectionConfig('how_i_work', { 
      bullets: [...bullets, { title: 'New Principle', description: 'Description here' }] 
    });
  };

  const removeHowIWorkBullet = (index: number) => {
    const section = sections.find(s => s.id === 'how_i_work');
    const bullets = ((section?.config as any)?.bullets || []).filter((_: any, i: number) => i !== index);
    updateSectionConfig('how_i_work', { bullets });
  };

  // Contact CTA management
  const updateContactCTA = (field: string, value: string) => {
    updateSectionConfig('contact_cta', { [field]: value });
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
          <h1 className="text-2xl font-bold">Home Layout</h1>
          <p className="text-muted-foreground">Drag to reorder, click to expand and edit content</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Home Page Sections</CardTitle>
          <CardDescription>
            Configure each section's content, visibility, and order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Reorder.Group axis="y" values={sections} onReorder={setSections} className="space-y-2">
            {sections.map((section) => (
              <Reorder.Item
                key={section.id}
                value={section}
                className="cursor-grab active:cursor-grabbing"
              >
                <Collapsible 
                  open={expandedSection === section.id}
                  onOpenChange={(open) => setExpandedSection(open ? section.id : null)}
                >
                  <motion.div
                    layout
                    className={`
                      rounded-lg border border-border
                      ${section.visible ? 'bg-card' : 'bg-muted/50 opacity-60'}
                    `}
                  >
                    {/* Section Header */}
                    <div className="flex items-center gap-4 p-4">
                      <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{sectionLabels[section.id] || section.id}</p>
                          {!section.visible && (
                            <span className="text-xs text-muted-foreground">(hidden)</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sectionDescriptions[section.id]}
                        </p>
                      </div>

                      {/* Limit input for sections that support it */}
                      {(section.id === 'featured_projects' || section.id === 'selected_writing_preview' || section.id === 'experience_snapshot') && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Limit:</Label>
                          <Input
                            type="number"
                            min={1}
                            max={6}
                            value={section.limit || 3}
                            onChange={(e) => updateSection(section.id, { limit: parseInt(e.target.value) || 3 })}
                            className="w-16 h-8 text-sm"
                          />
                        </div>
                      )}

                      {/* Title override */}
                      <Input
                        value={section.titleOverride || ''}
                        onChange={(e) => updateSection(section.id, { titleOverride: e.target.value || undefined })}
                        placeholder="Custom title..."
                        className="w-40 h-8 text-sm"
                      />

                      {/* Visibility toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(section.id); }}
                        className={`p-2 rounded-lg transition-colors ${
                          section.visible 
                            ? 'text-foreground hover:bg-muted' 
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {section.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>

                      {/* Expand button for editable sections */}
                      {(section.id === 'hero' || section.id === 'how_i_work' || section.id === 'contact_cta' || section.id === 'experience_snapshot') && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {expandedSection === section.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>

                    {/* Expanded Content */}
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t border-border space-y-4">
                        {/* Hero Section Config */}
                        {section.id === 'hero' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Name</Label>
                                <Input
                                  value={(section.config as HeroConfig)?.name || ''}
                                  onChange={(e) => updateSectionConfig('hero', { name: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label>Role</Label>
                                <Input
                                  value={(section.config as HeroConfig)?.role || ''}
                                  onChange={(e) => updateSectionConfig('hero', { role: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                            </div>

                            {/* Greeting Settings */}
                            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                              <Switch
                                checked={(section.config as HeroConfig)?.showGreeting !== false}
                                onCheckedChange={(checked) => updateSectionConfig('hero', { showGreeting: checked })}
                              />
                              <div className="flex-1">
                                <Label className="text-sm">Show greeting text</Label>
                                {(section.config as HeroConfig)?.showGreeting !== false && (
                                  <Input
                                    value={(section.config as HeroConfig)?.greetingText || "Hi, I'm"}
                                    onChange={(e) => updateSectionConfig('hero', { greetingText: e.target.value })}
                                    className="mt-1 h-8"
                                    placeholder="Hi, I'm"
                                  />
                                )}
                              </div>
                            </div>

                            <div>
                              <Label>Transition Line</Label>
                              <Input
                                value={(section.config as HeroConfig)?.transitionLine || ''}
                                onChange={(e) => updateSectionConfig('hero', { transitionLine: e.target.value })}
                                className="mt-1"
                                placeholder="From X to Y..."
                              />
                            </div>

                            <div>
                              <Label>Intro Line 1</Label>
                              <Textarea
                                value={(section.config as HeroConfig)?.introLine1 || ''}
                                onChange={(e) => updateSectionConfig('hero', { introLine1: e.target.value })}
                                className="mt-1"
                                rows={2}
                              />
                            </div>

                            <div>
                              <Label>Intro Line 2 (optional)</Label>
                              <Textarea
                                value={(section.config as HeroConfig)?.introLine2 || ''}
                                onChange={(e) => updateSectionConfig('hero', { introLine2: e.target.value })}
                                className="mt-1"
                                rows={2}
                              />
                            </div>

                            {/* Badges */}
                            <div>
                              <Label>Badges</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {((section.config as HeroConfig)?.badges || []).map((badge, idx) => (
                                  <div key={idx} className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                                    <Input
                                      value={badge}
                                      onChange={(e) => updateHeroBadge(idx, e.target.value)}
                                      className="h-6 w-24 text-xs border-0 bg-transparent p-0"
                                    />
                                    <button onClick={() => removeHeroBadge(idx)} className="text-muted-foreground hover:text-destructive">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={addHeroBadge}>
                                  <Plus className="w-3 h-3 mr-1" /> Add
                                </Button>
                              </div>
                            </div>

                            {/* CTAs */}
                            <div>
                              <Label>CTA Buttons</Label>
                              <div className="space-y-2 mt-2">
                                {((section.config as HeroConfig)?.ctas || []).map((cta, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                    <Input
                                      value={cta.label}
                                      onChange={(e) => updateHeroCTA(idx, { label: e.target.value })}
                                      placeholder="Label"
                                      className="w-28 h-8 text-sm"
                                    />
                                    <Select 
                                      value={cta.actionType} 
                                      onValueChange={(v) => updateHeroCTA(idx, { actionType: v as any })}
                                    >
                                      <SelectTrigger className="w-28 h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="internal">Internal</SelectItem>
                                        <SelectItem value="external">External</SelectItem>
                                        <SelectItem value="scroll">Scroll To</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      value={cta.target}
                                      onChange={(e) => updateHeroCTA(idx, { target: e.target.value })}
                                      placeholder="Target"
                                      className="flex-1 h-8 text-sm"
                                    />
                                    <Select 
                                      value={cta.variant || 'primary'} 
                                      onValueChange={(v) => updateHeroCTA(idx, { variant: v as any })}
                                    >
                                      <SelectTrigger className="w-24 h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="primary">Primary</SelectItem>
                                        <SelectItem value="secondary">Secondary</SelectItem>
                                        <SelectItem value="ghost">Ghost</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Switch
                                      checked={cta.visible}
                                      onCheckedChange={(checked) => updateHeroCTA(idx, { visible: checked })}
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => removeHeroCTA(idx)} className="h-8 w-8">
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={addHeroCTA}>
                                  <Plus className="w-4 h-4 mr-1" /> Add Button
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* How I Work Config */}
                        {section.id === 'how_i_work' && (
                          <div className="space-y-3">
                            <Label>Work Principles (Bullets)</Label>
                            {((section.config as any)?.bullets || []).map((bullet: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={bullet.title || ''}
                                    onChange={(e) => updateHowIWorkBullet(idx, 'title', e.target.value)}
                                    placeholder="Title"
                                    className="h-8 text-sm"
                                  />
                                  <Textarea
                                    value={bullet.description || ''}
                                    onChange={(e) => updateHowIWorkBullet(idx, 'description', e.target.value)}
                                    placeholder="Description"
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeHowIWorkBullet(idx)} className="h-8 w-8">
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addHowIWorkBullet}>
                              <Plus className="w-4 h-4 mr-1" /> Add Principle
                            </Button>
                          </div>
                        )}

                        {/* Experience Snapshot Config */}
                        {section.id === 'experience_snapshot' && (
                          <ExperienceSnapshotEditor
                            config={experienceConfig}
                            onChange={setExperienceConfig}
                          />
                        )}

                        {/* Contact CTA Config */}
                        {section.id === 'contact_cta' && (
                          <div className="space-y-4">
                            <div>
                              <Label>Headline</Label>
                              <Input
                                value={(section.config as any)?.headline || "Let's Work Together"}
                                onChange={(e) => updateContactCTA('headline', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Body Text</Label>
                              <Textarea
                                value={(section.config as any)?.body || ''}
                                onChange={(e) => updateContactCTA('body', e.target.value)}
                                className="mt-1"
                                rows={3}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </motion.div>
                </Collapsible>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </CardContent>
      </Card>
    </div>
  );
}
