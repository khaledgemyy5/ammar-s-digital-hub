import { useEffect, useState } from 'react';
import { Save, Loader2, Sun, Moon, Monitor, Check, Upload, Eye, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { adminGetSiteSettings, saveDraftSettings, publishSettings, getDraftState, clearCache, type DraftState } from '@/lib/db';
import { useTheme } from '@/contexts/ThemeContext';
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
  { value: '#0B1F3A', label: 'Navy' },
  { value: '#10B981', label: 'Green' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#14B8A6', label: 'Teal' },
];

export default function AdminTheme() {
  const { setTheme: applyTheme, applyTheme: previewTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  
  const [theme, setThemeState] = useState<ThemeConfig>({
    accentColor: '#135BEC',
    defaultMode: 'light',
    font: 'ibm-plex',
  });
  const [originalTheme, setOriginalTheme] = useState<ThemeConfig | null>(null);
  const [draftState, setDraftState] = useState<DraftState | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load current settings and draft state
      const [settings, state] = await Promise.all([
        adminGetSiteSettings(),
        getDraftState(),
      ]);
      
      if (settings?.theme) {
        const loadedTheme = settings.theme as ThemeConfig;
        setThemeState(loadedTheme);
        setOriginalTheme(loadedTheme);
      }
      
      // If we have draft_json with theme, use that instead
      if (state?.draft_json?.theme) {
        const draftTheme = state.draft_json.theme as ThemeConfig;
        setThemeState(draftTheme);
        setOriginalTheme(draftTheme);
      }
      
      setDraftState(state);
    } catch (error) {
      console.error('Error loading theme data:', error);
      toast.error('Failed to load theme settings');
    } finally {
      setLoading(false);
    }
  };

  // Apply theme preview immediately when values change
  const updateTheme = (updates: Partial<ThemeConfig>) => {
    const newTheme = { ...theme, ...updates };
    setThemeState(newTheme);
    // Apply preview immediately
    previewTheme(newTheme);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    console.log('[Theme] Starting save draft...', theme);
    
    try {
      const result = await saveDraftSettings({ theme });
      
      if (result.success) {
        setOriginalTheme(theme);
        // Refresh draft state
        const newState = await getDraftState();
        setDraftState(newState);
        toast.success('Draft saved successfully');
        console.log('[Theme] Draft saved successfully');
      } else {
        toast.error(result.error || 'Failed to save draft');
        console.error('[Theme] Draft save failed:', result.error);
      }
    } catch (err: any) {
      console.error('[Theme] Draft save error:', err);
      toast.error('Error saving draft: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setShowPublishDialog(false);
    console.log('[Theme] Starting publish...');
    
    try {
      // First save any pending changes as draft
      if (hasLocalChanges) {
        const saveResult = await saveDraftSettings({ theme });
        if (!saveResult.success) {
          toast.error('Failed to save draft before publishing: ' + saveResult.error);
          return;
        }
      }
      
      const result = await publishSettings();
      
      if (result.success) {
        // Apply the theme globally
        applyTheme(theme);
        // Clear cache to ensure fresh data
        clearCache();
        // Refresh draft state
        const newState = await getDraftState();
        setDraftState(newState);
        setOriginalTheme(theme);
        toast.success(`Published successfully! Version ${result.version}`);
        console.log('[Theme] Publish success, version:', result.version);
      } else {
        toast.error(result.error || 'Failed to publish');
        console.error('[Theme] Publish failed:', result.error);
      }
    } catch (err: any) {
      console.error('[Theme] Publish error:', err);
      toast.error('Error publishing: ' + (err.message || 'Unknown error'));
    } finally {
      setPublishing(false);
    }
  };

  const handleCancel = () => {
    if (originalTheme) {
      setThemeState(originalTheme);
      previewTheme(originalTheme);
    }
  };

  const handlePreviewDraft = () => {
    // Open public site with preview param
    const previewUrl = `${window.location.origin}/?preview=draft`;
    window.open(previewUrl, '_blank');
  };

  const hasLocalChanges = JSON.stringify(theme) !== JSON.stringify(originalTheme);
  const hasUnpublishedChanges = draftState?.hasUnpublishedChanges || hasLocalChanges;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Draft:</span>
          {hasLocalChanges ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Clock className="w-3 h-3 mr-1" />
              Unsaved Changes
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Saved
            </Badge>
          )}
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Published:</span>
          {draftState?.published_version ? (
            <Badge variant="secondary">
              v{draftState.published_version} • {draftState.published_at 
                ? new Date(draftState.published_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) 
                : 'Never'}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">Not published</Badge>
          )}
        </div>
        {hasUnpublishedChanges && (
          <>
            <div className="h-4 w-px bg-border" />
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Unpublished changes
            </Badge>
          </>
        )}
      </div>

      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Theme</h1>
          <p className="text-muted-foreground">Customize your site's appearance - changes preview instantly</p>
        </div>
        <div className="flex gap-2">
          {hasLocalChanges && (
            <Button variant="ghost" onClick={handleCancel} disabled={saving || publishing}>
              Cancel
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handlePreviewDraft}
            disabled={saving || publishing}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Draft
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSaveDraft} 
            disabled={saving || publishing || !hasLocalChanges}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>
          <Button 
            onClick={() => setShowPublishDialog(true)} 
            disabled={saving || publishing || (!hasUnpublishedChanges && !hasLocalChanges)}
          >
            {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish changes to public site?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make your theme changes visible to all visitors immediately.
              {draftState?.published_version && (
                <span className="block mt-2 text-sm">
                  Current version: v{draftState.published_version} → New version: v{draftState.published_version + 1}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>
              Publish Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6">
        {/* Primary/Accent Color */}
        <Card>
          <CardHeader>
            <CardTitle>Accent Color</CardTitle>
            <CardDescription>Choose a primary accent color for buttons, links, and highlights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateTheme({ accentColor: color.value })}
                  className={`
                    w-12 h-12 rounded-xl transition-all relative group
                    ${theme.accentColor === color.value 
                      ? 'ring-2 ring-offset-2 ring-foreground scale-110' 
                      : 'hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                >
                  {theme.accentColor === color.value && (
                    <Check className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow-md" />
                  )}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {color.label}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Custom:</Label>
                <Input
                  type="color"
                  value={theme.accentColor}
                  onChange={(e) => updateTheme({ accentColor: e.target.value })}
                  className="w-14 h-10 p-1 cursor-pointer rounded-lg"
                />
              </div>
              <Input
                value={theme.accentColor}
                onChange={(e) => updateTheme({ accentColor: e.target.value })}
                className="w-32 font-mono text-sm"
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
                  onClick={() => updateTheme({ font: font.value as ThemeConfig['font'] })}
                  className={`
                    text-left p-4 rounded-lg border transition-all
                    ${theme.font === font.value 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                      : 'border-border hover:bg-muted'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p 
                        className="font-medium"
                        style={{ 
                          fontFamily: font.value === 'ibm-plex' 
                            ? "'IBM Plex Serif', Georgia, serif" 
                            : font.value === 'inter' 
                            ? "'Inter', system-ui, sans-serif"
                            : 'system-ui, sans-serif'
                        }}
                      >
                        {font.label}
                      </p>
                      <p className="text-sm text-muted-foreground">{font.description}</p>
                    </div>
                    {theme.font === font.value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
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
                    onClick={() => updateTheme({ defaultMode: mode.value as ThemeConfig['defaultMode'] })}
                    className={`
                      flex items-center gap-2 px-5 py-3 rounded-lg border transition-all flex-1 justify-center
                      ${theme.defaultMode === mode.value 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-border hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{mode.label}</span>
                    {theme.defaultMode === mode.value && (
                      <Check className="w-4 h-4 text-primary ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>See how your changes look in real-time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 rounded-lg border border-border bg-card">
              <div 
                className="w-full h-2 rounded-full mb-6"
                style={{ backgroundColor: theme.accentColor }}
              />
              <h3 
                className="text-xl font-semibold mb-3"
                style={{ 
                  fontFamily: theme.font === 'ibm-plex' 
                    ? "'IBM Plex Serif', Georgia, serif" 
                    : theme.font === 'inter'
                    ? "'Inter', system-ui, sans-serif"
                    : 'system-ui, sans-serif'
                }}
              >
                Sample Heading
              </h3>
              <p 
                className="text-muted-foreground mb-6" 
                style={{ 
                  fontFamily: "'Inter', system-ui, sans-serif" 
                }}
              >
                This is how your content will look with the selected theme settings.
                The accent color is applied to buttons, links, and interactive elements.
              </p>
              <div className="flex gap-3">
                <button
                  className="px-5 py-2.5 rounded-lg text-white font-medium transition-colors"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  Primary Button
                </button>
                <button
                  className="px-5 py-2.5 rounded-lg font-medium border transition-colors"
                  style={{ 
                    borderColor: theme.accentColor, 
                    color: theme.accentColor 
                  }}
                >
                  Secondary Button
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}