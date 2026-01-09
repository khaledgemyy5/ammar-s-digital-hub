import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  GripVertical, Plus, Trash2, Eye, EyeOff, Link as LinkIcon, ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExperienceSnapshotFullConfig, 
  ExperienceSnapshotItem,
  createEmptyItem,
  sanitizeBlurb,
  validateConfig,
  defaultExperienceSnapshotConfig
} from '@/types/experienceSnapshot';

interface ExperienceSnapshotEditorProps {
  config: ExperienceSnapshotFullConfig;
  onChange: (config: ExperienceSnapshotFullConfig) => void;
}

export function ExperienceSnapshotEditor({ config, onChange }: ExperienceSnapshotEditorProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateConfig = (updates: Partial<ExperienceSnapshotFullConfig>) => {
    const newConfig = { ...config, ...updates };
    const validation = validateConfig(newConfig);
    setValidationErrors(validation.errors);
    onChange(newConfig);
  };

  const updateCTA = (updates: Partial<ExperienceSnapshotFullConfig['cta']>) => {
    updateConfig({ cta: { ...config.cta, ...updates } });
  };

  const updateTimelineStyle = (updates: Partial<ExperienceSnapshotFullConfig['timelineStyle']>) => {
    updateConfig({ timelineStyle: { ...config.timelineStyle, ...updates } });
  };

  const updateItem = (id: string, updates: Partial<ExperienceSnapshotItem>) => {
    const newItems = config.items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    updateConfig({ items: newItems });
  };

  const addItem = () => {
    if (config.items.length >= 3) return;
    const newItem = createEmptyItem();
    updateConfig({ items: [...config.items, newItem] });
  };

  const removeItem = (id: string) => {
    updateConfig({ items: config.items.filter(item => item.id !== id) });
  };

  const handleReorder = (newItems: ExperienceSnapshotItem[]) => {
    updateConfig({ items: newItems });
  };

  const handleBlurbChange = (id: string, value: string) => {
    // Sanitize to single line and limit to 180 chars
    const sanitized = sanitizeBlurb(value);
    updateItem(id, { blurb: sanitized });
  };

  const canAddItem = config.items.length < 3;
  const enabledItemsCount = config.items.filter(item => item.enabled).length;

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, i) => (
                <li key={i} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Section Toggle & Title */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Section Settings</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Enabled</Label>
              <Switch
                checked={config.enabled}
                onCheckedChange={(enabled) => updateConfig({ enabled })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Switch
              checked={config.showTitle}
              onCheckedChange={(showTitle) => updateConfig({ showTitle })}
              id="show-title"
            />
            <div className="flex-1">
              <Label htmlFor="section-title">Section Title</Label>
              <Input
                id="section-title"
                value={config.title}
                onChange={(e) => updateConfig({ title: e.target.value })}
                placeholder="Experience Snapshot"
                className="mt-1"
                disabled={!config.showTitle}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">CTA Button</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Show CTA</Label>
              <Switch
                checked={config.cta.enabled}
                onCheckedChange={(enabled) => updateCTA({ enabled })}
              />
            </div>
          </div>
        </CardHeader>
        {config.cta.enabled && (
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Button Label</Label>
              <Input
                value={config.cta.label}
                onChange={(e) => updateCTA({ label: e.target.value })}
                placeholder="Full Resume"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Button Link</Label>
              <Input
                value={config.cta.href}
                onChange={(e) => updateCTA({ href: e.target.value })}
                placeholder="/resume"
                className="mt-1"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Timeline Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Timeline Style</CardTitle>
          <CardDescription>Control the visual appearance of the timeline</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={config.timelineStyle.showTimelineLine}
              onCheckedChange={(showTimelineLine) => updateTimelineStyle({ showTimelineLine })}
              id="timeline-line"
            />
            <Label htmlFor="timeline-line">Show Timeline Line</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.timelineStyle.showDots}
              onCheckedChange={(showDots) => updateTimelineStyle({ showDots })}
              id="timeline-dots"
            />
            <Label htmlFor="timeline-dots">Show Timeline Dots</Label>
          </div>
        </CardContent>
      </Card>

      {/* Experience Items */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Experience Items</CardTitle>
              <CardDescription>
                {config.items.length}/3 items ({enabledItemsCount} visible)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={!canAddItem}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {config.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No experience items yet.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Your First Experience
              </Button>
            </div>
          ) : (
            <Reorder.Group 
              axis="y" 
              values={config.items} 
              onReorder={handleReorder}
              className="space-y-3"
            >
              {config.items.map((item) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <motion.div
                    layout
                    className={`
                      rounded-lg border p-4
                      ${item.enabled ? 'bg-card border-border' : 'bg-muted/50 border-muted opacity-60'}
                      ${item.highlight ? 'ring-2 ring-primary/20' : ''}
                    `}
                  >
                    {/* Item Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      
                      <div className="flex-1 flex items-center gap-2">
                        <span className="font-medium truncate">
                          {item.roleTitle || 'New Experience'}
                        </span>
                        {item.highlight && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Highlighted
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => updateItem(item.id, { enabled: !item.enabled })}
                        className="p-1.5 rounded hover:bg-muted"
                        title={item.enabled ? 'Hide' : 'Show'}
                      >
                        {item.enabled ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Item Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Role Title *</Label>
                        <Input
                          value={item.roleTitle}
                          onChange={(e) => updateItem(item.id, { roleTitle: e.target.value })}
                          placeholder="Senior Product Manager"
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Organization *</Label>
                        <Input
                          value={item.orgName}
                          onChange={(e) => updateItem(item.id, { orgName: e.target.value })}
                          placeholder="Company Name"
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Date Range *</Label>
                        <Input
                          value={item.dateRange}
                          onChange={(e) => updateItem(item.id, { dateRange: e.target.value })}
                          placeholder="2022 – Present"
                          className="mt-1 h-9"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Highlight</Label>
                          <div className="mt-1 flex items-center gap-2">
                            <Switch
                              checked={item.highlight}
                              onCheckedChange={(highlight) => updateItem(item.id, { highlight })}
                            />
                            <span className="text-xs text-muted-foreground">
                              Emphasize this item
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label className="text-xs">
                        Description ({item.blurb.length}/180)
                      </Label>
                      <Textarea
                        value={item.blurb}
                        onChange={(e) => handleBlurbChange(item.id, e.target.value)}
                        placeholder="One-line description of your role and impact..."
                        className="mt-1 resize-none"
                        rows={2}
                      />
                    </div>

                    {/* Optional Link */}
                    <div className="mt-3 flex items-center gap-3">
                      <Switch
                        checked={item.linkEnabled}
                        onCheckedChange={(linkEnabled) => updateItem(item.id, { linkEnabled })}
                        id={`link-${item.id}`}
                      />
                      <Label htmlFor={`link-${item.id}`} className="text-xs">
                        <LinkIcon className="w-3 h-3 inline mr-1" />
                        Link to project/company
                      </Label>
                      {item.linkEnabled && (
                        <div className="flex-1">
                          <Input
                            value={item.linkHref}
                            onChange={(e) => updateItem(item.id, { linkHref: e.target.value })}
                            placeholder="https://..."
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}

          {!canAddItem && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Maximum 3 items allowed
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview Link */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-1" />
            Preview Site
          </a>
        </Button>
      </div>
    </div>
  );
}

export default ExperienceSnapshotEditor;
