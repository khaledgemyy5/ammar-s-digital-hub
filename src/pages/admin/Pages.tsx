import { useEffect, useState } from 'react';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { adminGetSiteSettings, adminUpdateSiteSettings, clearCache } from '@/lib/db';
import type { PageConfig, ButtonConfig } from '@/types/database';

const defaultPages: PageConfig = {
  resume: { enabled: true, showCopyText: true, showDownload: true },
  contact: { enabled: true, buttons: [] },
};

export default function AdminPages() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<PageConfig>(defaultPages);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const settings = await adminGetSiteSettings();
    if (settings?.pages) {
      setPages({ ...defaultPages, ...(settings.pages as PageConfig) });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await adminUpdateSiteSettings({ pages });

      if (success) {
        clearCache();
        toast.success('Page settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Contact buttons management
  const addContactButton = () => {
    const buttons = pages.contact.buttons || [];
    const newButton: ButtonConfig = {
      label: 'New Button',
      actionType: 'external',
      target: '',
      variant: 'secondary',
      visible: true,
    };
    setPages({ ...pages, contact: { ...pages.contact, buttons: [...buttons, newButton] } });
  };

  const updateContactButton = (index: number, updates: Partial<ButtonConfig>) => {
    const buttons = [...(pages.contact.buttons || [])];
    buttons[index] = { ...buttons[index], ...updates };
    setPages({ ...pages, contact: { ...pages.contact, buttons } });
  };

  const removeContactButton = (index: number) => {
    const buttons = (pages.contact.buttons || []).filter((_, i) => i !== index);
    setPages({ ...pages, contact: { ...pages.contact, buttons } });
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
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-muted-foreground">Configure individual page settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Resume Page */}
        <Card>
          <CardHeader>
            <CardTitle>Resume Page</CardTitle>
            <CardDescription>Configure the resume/CV page settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Resume Page</Label>
                <p className="text-sm text-muted-foreground">Show the resume page in navigation</p>
              </div>
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
                placeholder="https://example.com/resume.pdf"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Link to your PDF resume for download
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Copy Text Button</Label>
                <p className="text-sm text-muted-foreground">Allow visitors to copy resume text</p>
              </div>
              <Switch
                checked={pages.resume.showCopyText}
                onCheckedChange={(checked) => 
                  setPages({ ...pages, resume: { ...pages.resume, showCopyText: checked } })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Download Button</Label>
                <p className="text-sm text-muted-foreground">Show PDF download button</p>
              </div>
              <Switch
                checked={pages.resume.showDownload}
                onCheckedChange={(checked) => 
                  setPages({ ...pages, resume: { ...pages.resume, showDownload: checked } })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Page */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Page</CardTitle>
            <CardDescription>Configure contact information and CTA buttons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Contact Page</Label>
                <p className="text-sm text-muted-foreground">Show the contact page in navigation</p>
              </div>
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
                type="email"
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
                placeholder="https://linkedin.com/in/yourprofile"
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
                placeholder="https://calendly.com/yourname"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Add a calendar booking link (Calendly, Cal.com, etc.)
              </p>
            </div>

            {/* Custom Buttons */}
            <div>
              <Label>Custom CTA Buttons</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Add additional buttons to the contact page
              </p>
              <div className="space-y-2">
                {(pages.contact.buttons || []).map((btn, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <Input
                      value={btn.label}
                      onChange={(e) => updateContactButton(idx, { label: e.target.value })}
                      placeholder="Label"
                      className="w-28 h-8 text-sm"
                    />
                    <Select 
                      value={btn.actionType} 
                      onValueChange={(v) => updateContactButton(idx, { actionType: v as any })}
                    >
                      <SelectTrigger className="w-28 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="external">External URL</SelectItem>
                        <SelectItem value="internal">Internal Page</SelectItem>
                        <SelectItem value="mailto">Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={btn.target}
                      onChange={(e) => updateContactButton(idx, { target: e.target.value })}
                      placeholder="URL or path"
                      className="flex-1 h-8 text-sm"
                    />
                    <Select 
                      value={btn.variant || 'secondary'} 
                      onValueChange={(v) => updateContactButton(idx, { variant: v as any })}
                    >
                      <SelectTrigger className="w-24 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                      </SelectContent>
                    </Select>
                    <Switch
                      checked={btn.visible}
                      onCheckedChange={(checked) => updateContactButton(idx, { visible: checked })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeContactButton(idx)} className="h-8 w-8">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addContactButton}>
                  <Plus className="w-4 h-4 mr-1" /> Add Button
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
