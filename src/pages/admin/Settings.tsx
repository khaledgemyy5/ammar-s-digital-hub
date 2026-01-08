import { useEffect, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Save, Loader2, Plus, Trash2, GripVertical, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { adminGetSiteSettings, adminUpdateSiteSettings, clearCache } from '@/lib/db';
import type { NavLink } from '@/types/database';

const defaultNavLinks: NavLink[] = [
  { id: 'experience', label: 'Experience', path: '/#experience', visible: true, order: 0 },
  { id: 'projects', label: 'Projects', path: '/projects', visible: true, order: 1 },
  { id: 'how-i-work', label: 'How I Work', path: '/#how-i-work', visible: true, order: 2 },
  { id: 'writing', label: 'Writing', path: '/writing', visible: true, order: 3 },
  { id: 'contact', label: 'Contact', path: '/contact', visible: true, order: 4 },
];

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navLinks, setNavLinks] = useState<NavLink[]>(defaultNavLinks);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await adminGetSiteSettings();
    if (data?.nav_config) {
      const sorted = [...(data.nav_config as NavLink[])].sort((a, b) => a.order - b.order);
      setNavLinks(sorted);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedLinks = navLinks.map((link, index) => ({
        ...link,
        order: index,
      }));

      const success = await adminUpdateSiteSettings({
        nav_config: updatedLinks,
      });
      
      if (success) {
        clearCache();
        toast.success('Settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const addNavLink = () => {
    const newLink: NavLink = {
      id: `link-${Date.now()}`,
      label: 'New Link',
      path: '/',
      visible: true,
      order: navLinks.length,
    };
    setNavLinks([...navLinks, newLink]);
  };

  const updateNavLink = (id: string, updates: Partial<NavLink>) => {
    setNavLinks(prev => prev.map(link => 
      link.id === id ? { ...link, ...updates } : link
    ));
  };

  const removeNavLink = (id: string) => {
    setNavLinks(prev => prev.filter(link => link.id !== id));
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
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Site configuration</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Links</CardTitle>
          <CardDescription>Configure the links in your site's navigation bar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Reorder.Group axis="y" values={navLinks} onReorder={setNavLinks} className="space-y-2">
            {navLinks.map((link) => (
              <Reorder.Item
                key={link.id}
                value={link}
                className="cursor-grab active:cursor-grabbing"
              >
                <div className={`
                  flex items-center gap-3 p-3 rounded-lg border border-border
                  ${link.visible ? 'bg-card' : 'bg-muted/50 opacity-60'}
                `}>
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={link.label}
                    onChange={(e) => updateNavLink(link.id, { label: e.target.value })}
                    placeholder="Label"
                    className="w-28 h-8 text-sm"
                  />
                  <Input
                    value={link.path}
                    onChange={(e) => updateNavLink(link.id, { path: e.target.value })}
                    placeholder="Path"
                    className="flex-1 h-8 text-sm"
                  />
                  <Switch
                    checked={link.visible}
                    onCheckedChange={(checked) => updateNavLink(link.id, { visible: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeNavLink(link.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          
          <Button variant="outline" size="sm" onClick={addNavLink}>
            <Plus className="w-4 h-4 mr-2" />
            Add Link
          </Button>
        </CardContent>
      </Card>

      {/* System Status Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/admin/status">View System Status</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
