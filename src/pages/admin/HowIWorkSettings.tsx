import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { Reorder } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { adminGetSiteSettings, adminUpdateSiteSettings, clearCache } from '@/lib/db';
import { 
  HowIWorkFullConfig, 
  HowIWorkItem, 
  defaultHowIWorkConfig, 
  migrateToHowIWorkConfig,
  createEmptyHowIWorkItem,
  AVAILABLE_ICONS,
  IconName,
} from '@/types/howIWork';

// Icon component mapper
const iconComponents: Record<IconName, React.ElementType> = {
  target: LucideIcons.Target,
  compass: LucideIcons.Compass,
  layers: LucideIcons.Layers,
  check: LucideIcons.Check,
  sparkles: LucideIcons.Sparkles,
  workflow: LucideIcons.Workflow,
  users: LucideIcons.Users,
  chart: LucideIcons.BarChart3,
  lightbulb: LucideIcons.Lightbulb,
  zap: LucideIcons.Zap,
  brain: LucideIcons.Brain,
  rocket: LucideIcons.Rocket,
  shield: LucideIcons.Shield,
  code: LucideIcons.Code2,
  database: LucideIcons.Database,
};

export default function HowIWorkSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<HowIWorkFullConfig>(defaultHowIWorkConfig);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const settings = await adminGetSiteSettings();
    
    // Try to get config from home_sections first
    if (settings?.home_sections) {
      const howIWorkSection = (settings.home_sections as any[]).find(s => s.id === 'how_i_work');
      if (howIWorkSection?.config) {
        const migrated = migrateToHowIWorkConfig(howIWorkSection.config);
        setConfig(migrated);
        setLoading(false);
        return;
      }
    }
    
    // Fallback to pages config if exists
    if ((settings?.pages as any)?.howIWork) {
      const migrated = migrateToHowIWorkConfig((settings.pages as any).howIWork);
      setConfig(migrated);
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    if (config.items.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    setSaving(true);
    try {
      const settings = await adminGetSiteSettings();
      
      // Update the how_i_work section in home_sections
      const homeSections = settings?.home_sections || [];
      const updatedSections = (homeSections as any[]).map((section: any) => {
        if (section.id === 'how_i_work') {
          return {
            ...section,
            visible: config.enabled,
            titleOverride: config.titleOverride,
            config: {
              bullets: config.items.filter(i => i.visible).map(item => ({
                icon: item.icon,
                title: item.title,
                description: item.description,
              })),
            },
          };
        }
        return section;
      });

      // Also save to pages for independent storage
      const currentPages = settings?.pages || {};
      
      const success = await adminUpdateSiteSettings({
        home_sections: updatedSections,
        pages: {
          ...currentPages,
          howIWork: config,
        } as any,
      });

      if (success) {
        clearCache();
        toast.success('How I Work settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    if (config.items.length >= 6) {
      toast.error('Maximum 6 items allowed');
      return;
    }
    setConfig({
      ...config,
      items: [...config.items, createEmptyHowIWorkItem(config.items.length)],
    });
  };

  const updateItem = (id: string, updates: Partial<HowIWorkItem>) => {
    setConfig({
      ...config,
      items: config.items.map(item => item.id === id ? { ...item, ...updates } : item),
    });
  };

  const removeItem = (id: string) => {
    if (config.items.length <= 1) {
      toast.error('At least one item is required');
      return;
    }
    setConfig({
      ...config,
      items: config.items.filter(item => item.id !== id),
    });
  };

  const reorderItems = (newOrder: HowIWorkItem[]) => {
    setConfig({
      ...config,
      items: newOrder.map((item, idx) => ({ ...item, order: idx })),
    });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/pages')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">How I Work</h1>
            <p className="text-muted-foreground">Configure the "How I Work" section on the home page</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Section Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Section</Label>
              <p className="text-sm text-muted-foreground">Show "How I Work" section on the home page</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>

          <Separator />

          <div>
            <Label>Section Title</Label>
            <Input
              value={config.titleOverride || ''}
              onChange={(e) => setConfig({ ...config, titleOverride: e.target.value })}
              placeholder="How I Work"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use the default title
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>Add 3-6 items to describe your work approach</CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={addItem}
              disabled={config.items.length >= 6}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Reorder.Group 
            axis="y" 
            values={config.items} 
            onReorder={reorderItems}
            className="space-y-4"
          >
            {config.items.sort((a, b) => a.order - b.order).map((item) => {
              const IconComponent = iconComponents[item.icon];
              return (
                <Reorder.Item 
                  key={item.id} 
                  value={item}
                  className="p-4 border rounded-lg bg-card cursor-move"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 pt-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {IconComponent && <IconComponent className="w-5 h-5 text-primary" />}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Select
                          value={item.icon}
                          onValueChange={(v) => updateItem(item.id, { icon: v as IconName })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_ICONS.map((iconName) => {
                              const Icon = iconComponents[iconName];
                              return (
                                <SelectItem key={iconName} value={iconName}>
                                  <div className="flex items-center gap-2">
                                    {Icon && <Icon className="w-4 h-4" />}
                                    <span className="capitalize">{iconName}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        
                        <Input
                          value={item.title}
                          onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          placeholder="Title"
                          className="flex-1"
                        />
                        
                        <Switch
                          checked={item.visible}
                          onCheckedChange={(checked) => updateItem(item.id, { visible: checked })}
                        />
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={config.items.length <= 1}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="Description"
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>

          {config.items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No items yet. Add your first item to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
