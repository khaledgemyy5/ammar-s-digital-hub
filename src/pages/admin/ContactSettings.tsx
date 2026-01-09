import { useEffect, useState } from 'react';
import { Save, Loader2, Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { adminGetSiteSettings, adminUpdateSiteSettings, clearCache } from '@/lib/db';
import { 
  ContactConfig, 
  ContactCustomButton,
  defaultContactConfig, 
  contactConfigSchema,
  migrateToContactConfig,
  isContactPageEmpty,
} from '@/types/contact';

export default function ContactSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ContactConfig>(defaultContactConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const settings = await adminGetSiteSettings();
    if (settings?.pages?.contact) {
      const oldContact = settings.pages.contact as any;
      
      // Check if it's new format or old format
      if (oldContact.header && oldContact.contactInfo && oldContact.ctas) {
        // New format
        setConfig({ ...defaultContactConfig, ...oldContact });
      } else {
        // Old format - migrate
        const migrated = migrateToContactConfig(oldContact);
        setConfig(migrated);
      }
    }
    setLoading(false);
  };

  const validateConfig = (): boolean => {
    try {
      contactConfigSchema.parse(config);
      setErrors({});
      return true;
    } catch (err: any) {
      const newErrors: Record<string, string> = {};
      err.errors?.forEach((e: any) => {
        const path = e.path.join('.');
        newErrors[path] = e.message;
      });
      setErrors(newErrors);
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      toast.error('Please fix validation errors');
      return;
    }

    setSaving(true);
    try {
      const settings = await adminGetSiteSettings();
      const currentPages = settings?.pages || { 
        resume: { enabled: true, showCopyText: true, showDownload: true },
        contact: { enabled: true }
      };
      
      const success = await adminUpdateSiteSettings({
        pages: {
          resume: currentPages.resume || { enabled: true, showCopyText: true, showDownload: true },
          contact: config as any,
        },
      });
      if (success) {
        clearCache();
        toast.success('Contact settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Custom button management
  const addCustomButton = () => {
    const newButton: ContactCustomButton = {
      id: `btn-${Date.now()}`,
      label: 'New Button',
      url: '',
      visible: true,
      style: 'secondary',
      order: config.ctas.customButtons.buttons.length,
    };
    setConfig({
      ...config,
      ctas: {
        ...config.ctas,
        customButtons: {
          ...config.ctas.customButtons,
          buttons: [...config.ctas.customButtons.buttons, newButton],
        },
      },
    });
  };

  const updateCustomButton = (id: string, updates: Partial<ContactCustomButton>) => {
    setConfig({
      ...config,
      ctas: {
        ...config.ctas,
        customButtons: {
          ...config.ctas.customButtons,
          buttons: config.ctas.customButtons.buttons.map(btn =>
            btn.id === id ? { ...btn, ...updates } : btn
          ),
        },
      },
    });
  };

  const removeCustomButton = (id: string) => {
    setConfig({
      ...config,
      ctas: {
        ...config.ctas,
        customButtons: {
          ...config.ctas.customButtons,
          buttons: config.ctas.customButtons.buttons.filter(btn => btn.id !== id),
        },
      },
    });
  };

  const reorderButtons = (newOrder: ContactCustomButton[]) => {
    setConfig({
      ...config,
      ctas: {
        ...config.ctas,
        customButtons: {
          ...config.ctas.customButtons,
          buttons: newOrder.map((btn, idx) => ({ ...btn, order: idx })),
        },
      },
    });
  };

  const isEmpty = isContactPageEmpty(config);

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
        <div>
          <h1 className="text-2xl font-bold">Contact Page</h1>
          <p className="text-muted-foreground">Configure all aspects of the contact page</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Empty Warning */}
      {isEmpty && config.autoHideIfEmpty && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Contact page will be hidden from navigation because it's empty and "Auto-hide if empty" is enabled.
          </AlertDescription>
        </Alert>
      )}

      {/* Page Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Page Settings</CardTitle>
          <CardDescription>Control page visibility and behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Contact Page</Label>
              <p className="text-sm text-muted-foreground">Show the contact page and its navigation link</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-hide if Empty</Label>
              <p className="text-sm text-muted-foreground">
                Hide from navigation if no content is visible
              </p>
            </div>
            <Switch
              checked={config.autoHideIfEmpty}
              onCheckedChange={(checked) => setConfig({ ...config, autoHideIfEmpty: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Header Section</CardTitle>
              <CardDescription>Page title and description</CardDescription>
            </div>
            <Switch
              checked={config.header.show}
              onCheckedChange={(checked) => 
                setConfig({ ...config, header: { ...config.header, show: checked } })
              }
            />
          </div>
        </CardHeader>
        {config.header.show && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Show Title</Label>
              <Switch
                checked={config.header.showTitle}
                onCheckedChange={(checked) => 
                  setConfig({ ...config, header: { ...config.header, showTitle: checked } })
                }
              />
            </div>
            {config.header.showTitle && (
              <div>
                <Label>Title</Label>
                <Input
                  value={config.header.title}
                  onChange={(e) => 
                    setConfig({ ...config, header: { ...config.header, title: e.target.value } })
                  }
                  className="mt-1"
                  placeholder="Get in Touch"
                />
                {errors['header.title'] && (
                  <p className="text-xs text-destructive mt-1">{errors['header.title']}</p>
                )}
              </div>
            )}
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <Label>Show Subtitle</Label>
              <Switch
                checked={config.header.showSubtitle}
                onCheckedChange={(checked) => 
                  setConfig({ ...config, header: { ...config.header, showSubtitle: checked } })
                }
              />
            </div>
            {config.header.showSubtitle && (
              <div>
                <Label>Subtitle</Label>
                <Textarea
                  value={config.header.subtitle}
                  onChange={(e) => 
                    setConfig({ ...config, header: { ...config.header, subtitle: e.target.value } })
                  }
                  className="mt-1"
                  rows={3}
                  placeholder="I'm always open to discussing new projects..."
                />
                {errors['header.subtitle'] && (
                  <p className="text-xs text-destructive mt-1">{errors['header.subtitle']}</p>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Contact Info Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Email, LinkedIn, and calendar links</CardDescription>
            </div>
            <Switch
              checked={config.contactInfo.show}
              onCheckedChange={(checked) => 
                setConfig({ ...config, contactInfo: { ...config.contactInfo, show: checked } })
              }
            />
          </div>
        </CardHeader>
        {config.contactInfo.show && (
          <CardContent className="space-y-6">
            {/* Email */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Email</Label>
                <Switch
                  checked={config.contactInfo.email.show}
                  onCheckedChange={(checked) => 
                    setConfig({ 
                      ...config, 
                      contactInfo: { 
                        ...config.contactInfo, 
                        email: { ...config.contactInfo.email, show: checked } 
                      } 
                    })
                  }
                />
              </div>
              {config.contactInfo.email.show && (
                <div className="grid gap-2 pl-4 border-l-2 border-muted">
                  <div>
                    <Label className="text-sm">Email Address</Label>
                    <Input
                      type="email"
                      value={config.contactInfo.email.value}
                      onChange={(e) => 
                        setConfig({ 
                          ...config, 
                          contactInfo: { 
                            ...config.contactInfo, 
                            email: { ...config.contactInfo.email, value: e.target.value } 
                          } 
                        })
                      }
                      className="mt-1"
                      placeholder="hello@example.com"
                    />
                    {errors['contactInfo.email.value'] && (
                      <p className="text-xs text-destructive mt-1">{errors['contactInfo.email.value']}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm">Display Label</Label>
                    <Input
                      value={config.contactInfo.email.label}
                      onChange={(e) => 
                        setConfig({ 
                          ...config, 
                          contactInfo: { 
                            ...config.contactInfo, 
                            email: { ...config.contactInfo.email, label: e.target.value } 
                          } 
                        })
                      }
                      className="mt-1"
                      placeholder="Email"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* LinkedIn */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">LinkedIn</Label>
                <Switch
                  checked={config.contactInfo.linkedin.show}
                  onCheckedChange={(checked) => 
                    setConfig({ 
                      ...config, 
                      contactInfo: { 
                        ...config.contactInfo, 
                        linkedin: { ...config.contactInfo.linkedin, show: checked } 
                      } 
                    })
                  }
                />
              </div>
              {config.contactInfo.linkedin.show && (
                <div className="grid gap-2 pl-4 border-l-2 border-muted">
                  <div>
                    <Label className="text-sm">LinkedIn URL</Label>
                    <Input
                      value={config.contactInfo.linkedin.value}
                      onChange={(e) => 
                        setConfig({ 
                          ...config, 
                          contactInfo: { 
                            ...config.contactInfo, 
                            linkedin: { ...config.contactInfo.linkedin, value: e.target.value } 
                          } 
                        })
                      }
                      className="mt-1"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                    {errors['contactInfo.linkedin.value'] && (
                      <p className="text-xs text-destructive mt-1">{errors['contactInfo.linkedin.value']}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm">Display Label</Label>
                    <Input
                      value={config.contactInfo.linkedin.label}
                      onChange={(e) => 
                        setConfig({ 
                          ...config, 
                          contactInfo: { 
                            ...config.contactInfo, 
                            linkedin: { ...config.contactInfo.linkedin, label: e.target.value } 
                          } 
                        })
                      }
                      className="mt-1"
                      placeholder="LinkedIn"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Calendar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Calendar</Label>
                <Switch
                  checked={config.contactInfo.calendar.show}
                  onCheckedChange={(checked) => 
                    setConfig({ 
                      ...config, 
                      contactInfo: { 
                        ...config.contactInfo, 
                        calendar: { ...config.contactInfo.calendar, show: checked } 
                      } 
                    })
                  }
                />
              </div>
              {config.contactInfo.calendar.show && (
                <div className="grid gap-2 pl-4 border-l-2 border-muted">
                  <div>
                    <Label className="text-sm">Calendar URL</Label>
                    <Input
                      value={config.contactInfo.calendar.value}
                      onChange={(e) => 
                        setConfig({ 
                          ...config, 
                          contactInfo: { 
                            ...config.contactInfo, 
                            calendar: { ...config.contactInfo.calendar, value: e.target.value } 
                          } 
                        })
                      }
                      className="mt-1"
                      placeholder="https://calendly.com/yourname"
                    />
                    {errors['contactInfo.calendar.value'] && (
                      <p className="text-xs text-destructive mt-1">{errors['contactInfo.calendar.value']}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm">Display Label</Label>
                    <Input
                      value={config.contactInfo.calendar.label}
                      onChange={(e) => 
                        setConfig({ 
                          ...config, 
                          contactInfo: { 
                            ...config.contactInfo, 
                            calendar: { ...config.contactInfo.calendar, label: e.target.value } 
                          } 
                        })
                      }
                      className="mt-1"
                      placeholder="Schedule a Meeting"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* CTA Buttons Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CTA Buttons</CardTitle>
              <CardDescription>Action buttons displayed on the contact page</CardDescription>
            </div>
            <Switch
              checked={config.ctas.show}
              onCheckedChange={(checked) => 
                setConfig({ ...config, ctas: { ...config.ctas, show: checked } })
              }
            />
          </div>
        </CardHeader>
        {config.ctas.show && (
          <CardContent className="space-y-4">
            {/* Standard Buttons */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Standard Buttons</Label>
              
              {/* Email Button */}
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Switch
                  checked={config.ctas.emailButton.show}
                  onCheckedChange={(checked) => 
                    setConfig({ 
                      ...config, 
                      ctas: { 
                        ...config.ctas, 
                        emailButton: { ...config.ctas.emailButton, show: checked } 
                      } 
                    })
                  }
                />
                <div className="flex-1">
                  <Label className="text-sm">Email Button</Label>
                  {config.ctas.emailButton.show && (
                    <Input
                      value={config.ctas.emailButton.label}
                      onChange={(e) => 
                        setConfig({ 
                          ...config, 
                          ctas: { 
                            ...config.ctas, 
                            emailButton: { ...config.ctas.emailButton, label: e.target.value } 
                          } 
                        })
                      }
                      className="mt-1 h-8"
                      placeholder="Email Me"
                    />
                  )}
                </div>
              </div>
              
              {/* LinkedIn Button */}
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Switch
                  checked={config.ctas.linkedinButton.show}
                  onCheckedChange={(checked) => 
                    setConfig({ 
                      ...config, 
                      ctas: { 
                        ...config.ctas, 
                        linkedinButton: { ...config.ctas.linkedinButton, show: checked } 
                      } 
                    })
                  }
                />
                <div className="flex-1">
                  <Label className="text-sm">LinkedIn Button</Label>
                  {config.ctas.linkedinButton.show && (
                    <Input
                      value={config.ctas.linkedinButton.label}
                      onChange={(e) => 
                        setConfig({ 
                          ...config, 
                          ctas: { 
                            ...config.ctas, 
                            linkedinButton: { ...config.ctas.linkedinButton, label: e.target.value } 
                          } 
                        })
                      }
                      className="mt-1 h-8"
                      placeholder="Connect on LinkedIn"
                    />
                  )}
                </div>
              </div>
              
              {/* Calendar Button */}
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Switch
                  checked={config.ctas.calendarButton.show}
                  onCheckedChange={(checked) => 
                    setConfig({ 
                      ...config, 
                      ctas: { 
                        ...config.ctas, 
                        calendarButton: { ...config.ctas.calendarButton, show: checked } 
                      } 
                    })
                  }
                />
                <div className="flex-1">
                  <Label className="text-sm">Calendar Button</Label>
                  {config.ctas.calendarButton.show && (
                    <Input
                      value={config.ctas.calendarButton.label}
                      onChange={(e) => 
                        setConfig({ 
                          ...config, 
                          ctas: { 
                            ...config.ctas, 
                            calendarButton: { ...config.ctas.calendarButton, label: e.target.value } 
                          } 
                        })
                      }
                      className="mt-1 h-8"
                      placeholder="Book a Time"
                    />
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Custom Buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Custom Buttons</Label>
                <Switch
                  checked={config.ctas.customButtons.show}
                  onCheckedChange={(checked) => 
                    setConfig({ 
                      ...config, 
                      ctas: { 
                        ...config.ctas, 
                        customButtons: { ...config.ctas.customButtons, show: checked } 
                      } 
                    })
                  }
                />
              </div>
              
              {config.ctas.customButtons.show && (
                <div className="space-y-2">
                  {config.ctas.customButtons.buttons.length > 0 ? (
                    <Reorder.Group
                      axis="y"
                      values={config.ctas.customButtons.buttons}
                      onReorder={reorderButtons}
                      className="space-y-2"
                    >
                      {config.ctas.customButtons.buttons.map((btn) => (
                        <Reorder.Item
                          key={btn.id}
                          value={btn}
                          className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Switch
                            checked={btn.visible}
                            onCheckedChange={(checked) => updateCustomButton(btn.id, { visible: checked })}
                          />
                          <Input
                            value={btn.label}
                            onChange={(e) => updateCustomButton(btn.id, { label: e.target.value })}
                            placeholder="Label"
                            className="w-28 h-8 text-sm"
                          />
                          <Input
                            value={btn.url}
                            onChange={(e) => updateCustomButton(btn.id, { url: e.target.value })}
                            placeholder="https://..."
                            className="flex-1 h-8 text-sm"
                          />
                          <Select
                            value={btn.style}
                            onValueChange={(v) => updateCustomButton(btn.id, { style: v as any })}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCustomButton(btn.id)}
                            className="h-8 w-8 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                      No custom buttons yet
                    </p>
                  )}
                  <Button variant="outline" size="sm" onClick={addCustomButton}>
                    <Plus className="w-4 h-4 mr-1" /> Add Button
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
