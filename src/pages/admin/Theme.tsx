import { useEffect, useState } from 'react';
import { Save, Loader2, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { adminGetSiteSettings, adminUpdateSiteSettings, clearCache } from '@/lib/db';
import type { ThemeConfig } from '@/types/database';

const fonts = [
  { value: 'ibm-plex', label: 'IBM Plex Serif + Inter', description: 'Professional, editorial feel' },
  { value: 'inter', label: 'Inter Only', description: 'Clean, modern sans-serif' },
  { value: 'system', label: 'System Default', description: 'Uses system fonts' },
];

const modes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const presetColors = [
  { value: '#135BEC', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#EC4899', label: 'Pink' },
];

export default function AdminTheme() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<ThemeConfig>({
    accentColor: '#135BEC',
    defaultMode: 'light',
    font: 'ibm-plex',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const settings = await adminGetSiteSettings();
    if (settings?.theme) {
      setTheme(settings.theme as ThemeConfig);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await adminUpdateSiteSettings({ theme });

      if (success) {
        clearCache();
        toast.success('Theme saved');
      } else {
        toast.error('Failed to save theme');
      }
    } catch (err) {
      toast.error('Error saving theme');
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-2xl font-bold">Theme</h1>
          <p className="text-muted-foreground">Customize your site's appearance</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Accent Color */}
        <Card>
          <CardHeader>
            <CardTitle>Accent Color</CardTitle>
            <CardDescription>Choose a primary accent color for your site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setTheme({ ...theme, accentColor: color.value })}
                  className={`
                    w-10 h-10 rounded-lg transition-all
                    ${theme.accentColor === color.value 
                      ? 'ring-2 ring-offset-2 ring-foreground' 
                      : 'hover:scale-110'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
            
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Custom:</Label>
                <Input
                  type="color"
                  value={theme.accentColor}
                  onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
              </div>
              <Input
                value={theme.accentColor}
                onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                className="w-32"
                placeholder="#135BEC"
              />
            </div>
          </CardContent>
        </Card>

        {/* Font Family */}
        <Card>
          <CardHeader>
            <CardTitle>Font Family</CardTitle>
            <CardDescription>Select the typography for your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {fonts.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setTheme({ ...theme, font: font.value as ThemeConfig['font'] })}
                  className={`
                    text-left p-4 rounded-lg border transition-colors
                    ${theme.font === font.value 
                      ? 'border-primary bg-accent' 
                      : 'border-border hover:bg-muted'
                    }
                  `}
                >
                  <p className="font-medium">{font.label}</p>
                  <p className="text-sm text-muted-foreground">{font.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Default Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Default Mode</CardTitle>
            <CardDescription>Set the default color scheme for visitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.value}
                    onClick={() => setTheme({ ...theme, defaultMode: mode.value as ThemeConfig['defaultMode'] })}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors
                      ${theme.defaultMode === mode.value 
                        ? 'border-primary bg-accent' 
                        : 'border-border hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 rounded-lg border border-border bg-card">
              <div 
                className="w-full h-2 rounded-full mb-4"
                style={{ backgroundColor: theme.accentColor }}
              />
              <h3 
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: theme.font === 'ibm-plex' ? "'IBM Plex Serif', Georgia, serif" : "'Inter', system-ui, sans-serif" }}
              >
                Sample Heading
              </h3>
              <p className="text-muted-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                This is how your content will look with the selected theme settings.
              </p>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: theme.accentColor }}
              >
                Sample Button
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
