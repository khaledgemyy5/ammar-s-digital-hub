import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ProjectCustomSection,
  CustomSectionType,
  CUSTOM_SECTION_TYPES,
  CODE_LANGUAGES,
  CodeLanguage,
  createEmptySection,
  isAllowedEmbedDomain,
  validateCustomSections,
  sanitizeMarkdown,
} from '@/types/customSection';

interface CustomSectionsEditorProps {
  sections: ProjectCustomSection[];
  onChange: (sections: ProjectCustomSection[]) => void;
}

const TYPE_LABELS: Record<CustomSectionType, string> = {
  markdown: 'Markdown',
  bullets: 'Bullets',
  code: 'Code',
  embed: 'Embed',
};

export function CustomSectionsEditor({ sections, onChange }: CustomSectionsEditorProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const canAddSection = sections.length < 2;
  const embedCount = sections.filter(s => s.type === 'embed').length;
  const canAddEmbed = embedCount < 1;

  const addSection = (type: CustomSectionType) => {
    if (!canAddSection) return;
    if (type === 'embed' && !canAddEmbed) return;
    
    const newSection = createEmptySection(type, sections.length);
    const newSections = [...sections, newSection];
    onChange(newSections);
    validateAndSetErrors(newSections);
  };

  const updateSection = (id: string, updates: Partial<ProjectCustomSection>) => {
    const newSections = sections.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    onChange(newSections);
    validateAndSetErrors(newSections);
  };

  const removeSection = (id: string) => {
    const newSections = sections.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx }));
    onChange(newSections);
    validateAndSetErrors(newSections);
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;

    const newSections = [...sections];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];
    newSections.forEach((s, i) => s.order = i);
    onChange(newSections);
  };

  const validateAndSetErrors = (secs: ProjectCustomSection[]) => {
    const { errors } = validateCustomSections(secs);
    setValidationErrors(errors);
  };

  const handleEmbedUrlChange = (id: string, url: string) => {
    const isAllowed = isAllowedEmbedDomain(url);
    updateSection(id, { 
      embed: { url, isAllowed } 
    });
  };

  const renderEditor = (section: ProjectCustomSection) => {
    switch (section.type) {
      case 'markdown':
        return (
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Markdown Content (HTML/scripts sanitized)
            </Label>
            <Textarea
              value={section.markdown || ''}
              onChange={(e) => updateSection(section.id, { markdown: sanitizeMarkdown(e.target.value) })}
              placeholder="Write markdown content..."
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        );
      
      case 'bullets':
        return (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Bullet Points</Label>
            {(section.bullets || ['']).map((bullet, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={bullet}
                  onChange={(e) => {
                    const newBullets = [...(section.bullets || [''])];
                    newBullets[idx] = e.target.value;
                    updateSection(section.id, { bullets: newBullets });
                  }}
                  placeholder={`Bullet ${idx + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newBullets = (section.bullets || []).filter((_, i) => i !== idx);
                    updateSection(section.id, { bullets: newBullets.length ? newBullets : [''] });
                  }}
                  disabled={(section.bullets || []).length <= 1}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            {(section.bullets || []).length < 20 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateSection(section.id, { bullets: [...(section.bullets || []), ''] });
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Bullet
              </Button>
            )}
          </div>
        );
      
      case 'code':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Language</Label>
              <Select
                value={section.code?.language || 'javascript'}
                onValueChange={(v) => updateSection(section.id, { 
                  code: { ...(section.code || { content: '' }), language: v as CodeLanguage } 
                })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CODE_LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Code</Label>
              <Textarea
                value={section.code?.content || ''}
                onChange={(e) => updateSection(section.id, { 
                  code: { ...(section.code || { language: 'javascript' as CodeLanguage }), content: e.target.value } 
                })}
                placeholder="// Write code here..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );
      
      case 'embed':
        const isAllowed = section.embed?.isAllowed ?? false;
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Embed URL (YouTube, Loom, Figma, Google Docs, Drive, GitHub)
              </Label>
              <Input
                value={section.embed?.url || ''}
                onChange={(e) => handleEmbedUrlChange(section.id, e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            {section.embed?.url && (
              <div className="flex items-center gap-2">
                {isAllowed ? (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/10 text-green-600">
                    <Check className="w-3 h-3" />
                    Allowed domain - will embed
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-amber-500/10 text-amber-600">
                    <ExternalLink className="w-3 h-3" />
                    Domain not allowed - will show link button
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Custom Sections (max 2)</span>
          <Badge variant="outline">{sections.length}/2</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {sections.sort((a, b) => a.order - b.order).map((section, idx) => (
          <div key={section.id} className="p-4 border rounded-lg space-y-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveSection(section.id, 'up')}
                  disabled={idx === 0}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveSection(section.id, 'down')}
                  disabled={idx === sections.length - 1}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              
              <Input
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                placeholder="Section Title"
                className="flex-1"
              />
              
              <Select
                value={section.type}
                onValueChange={(v) => {
                  const newType = v as CustomSectionType;
                  if (newType === 'embed' && !canAddEmbed && section.type !== 'embed') {
                    return; // Can't change to embed if already have one
                  }
                  const base = createEmptySection(newType, section.order);
                  updateSection(section.id, { 
                    type: newType,
                    markdown: base.markdown,
                    bullets: base.bullets,
                    code: base.code,
                    embed: base.embed,
                  });
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOM_SECTION_TYPES.map(type => (
                    <SelectItem 
                      key={type} 
                      value={type}
                      disabled={type === 'embed' && !canAddEmbed && section.type !== 'embed'}
                    >
                      {TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={section.enabled}
                  onCheckedChange={(checked) => updateSection(section.id, { enabled: checked })}
                />
                <span className="text-xs text-muted-foreground">Visible</span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSection(section.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            
            {renderEditor(section)}
          </div>
        ))}
        
        {canAddSection && (
          <div className="flex gap-2 flex-wrap">
            {CUSTOM_SECTION_TYPES.map(type => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => addSection(type)}
                disabled={type === 'embed' && !canAddEmbed}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add {TYPE_LABELS[type]}
              </Button>
            ))}
          </div>
        )}
        
        {!canAddSection && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Maximum 2 custom sections reached
          </p>
        )}
      </CardContent>
    </Card>
  );
}