import { useEffect, useState } from 'react';
import { Save, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { adminGetSiteSettings, adminUpdateSiteSettings, clearCache } from '@/lib/db';
import type { SEOConfig } from '@/types/database';

export default function AdminSEO() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seo, setSeo] = useState<SEOConfig>({
    siteTitle: '',
    siteDescription: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const settings = await adminGetSiteSettings();
    if (settings?.seo) {
      setSeo(settings.seo as SEOConfig);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await adminUpdateSiteSettings({ seo });

      if (success) {
        clearCache();
        toast.success('SEO settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('Error saving settings');
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
          <h1 className="text-2xl font-bold">SEO</h1>
          <p className="text-muted-foreground">Search engine optimization settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meta Tags</CardTitle>
          <CardDescription>Configure how your site appears in search results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Site Title</Label>
            <Input
              value={seo.siteTitle}
              onChange={(e) => setSeo({ ...seo, siteTitle: e.target.value })}
              className="mt-1"
              placeholder="Your Name | Your Role"
              maxLength={60}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted-foreground">Appears in browser tabs and search results</p>
              <span className={`text-xs ${seo.siteTitle.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {seo.siteTitle.length}/60
              </span>
            </div>
          </div>

          <div>
            <Label>Site Description</Label>
            <Textarea
              value={seo.siteDescription}
              onChange={(e) => setSeo({ ...seo, siteDescription: e.target.value })}
              className="mt-1"
              placeholder="A brief description of what you do..."
              rows={3}
              maxLength={160}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted-foreground">Shown below your title in search results</p>
              <span className={`text-xs ${seo.siteDescription.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {seo.siteDescription.length}/160
              </span>
            </div>
          </div>

          <div>
            <Label>Canonical URL</Label>
            <Input
              value={seo.canonicalUrl || ''}
              onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
              className="mt-1"
              placeholder="https://yourdomain.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The primary URL for your site (helps prevent duplicate content issues)
            </p>
          </div>

          <div>
            <Label>OG Image URL</Label>
            <Input
              value={seo.ogImage || ''}
              onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
              className="mt-1"
              placeholder="https://yourdomain.com/og-image.png"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Image shown when sharing on social media (recommended: 1200x630px)
            </p>
          </div>

          <div>
            <Label>Favicon URL</Label>
            <Input
              value={seo.favicon || ''}
              onChange={(e) => setSeo({ ...seo, favicon: e.target.value })}
              className="mt-1"
              placeholder="/favicon.ico"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Small icon shown in browser tabs
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Search Result Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border border-border bg-card max-w-xl">
            <p className="text-primary text-sm truncate">
              {seo.canonicalUrl || 'yourdomain.com'}
            </p>
            <h3 className="text-lg font-medium text-primary hover:underline cursor-pointer truncate mt-1">
              {seo.siteTitle || 'Your Site Title'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {seo.siteDescription || 'Your site description will appear here...'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
