import { useEffect, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { adminGetSiteSettings, adminUpdateSiteSettings, clearCache } from '@/lib/db';
import type { HomeSection } from '@/types/database';

const sectionLabels: Record<string, string> = {
  hero: 'Hero Section',
  experience_snapshot: 'Experience Snapshot',
  featured_projects: 'Featured Projects',
  how_i_work: 'How I Work',
  selected_writing_preview: 'Selected Writing',
  contact_cta: 'Contact CTA',
};

const sectionDescriptions: Record<string, string> = {
  hero: 'Main banner with headline and intro',
  experience_snapshot: 'Quick overview of your experience',
  featured_projects: 'Showcase featured projects',
  how_i_work: 'Your working style and approach',
  selected_writing_preview: 'Featured writing items',
  contact_cta: 'Call to action for contact',
};

export default function AdminHomeLayout() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<HomeSection[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const settings = await adminGetSiteSettings();
    if (settings?.home_sections) {
      // Ensure proper ordering
      const sorted = [...(settings.home_sections as HomeSection[])].sort((a, b) => a.order - b.order);
      setSections(sorted);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update order based on array position
      const updatedSections = sections.map((section, index) => ({
        ...section,
        order: index,
      }));

      const success = await adminUpdateSiteSettings({
        home_sections: updatedSections,
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

  const toggleVisibility = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
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
          <p className="text-muted-foreground">Drag to reorder sections, toggle visibility</p>
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
            Drag and drop to reorder sections. Use the toggle to show/hide sections.
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
                <motion.div
                  layout
                  className={`
                    flex items-center gap-4 p-4 rounded-lg border border-border
                    ${section.visible ? 'bg-card' : 'bg-muted/50 opacity-60'}
                  `}
                >
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
                    onClick={() => toggleVisibility(section.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      section.visible 
                        ? 'text-foreground hover:bg-muted' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {section.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </CardContent>
      </Card>
    </div>
  );
}
