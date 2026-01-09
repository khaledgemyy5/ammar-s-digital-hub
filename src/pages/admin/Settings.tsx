import { useEffect, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Save, Loader2, Plus, Trash2, GripVertical, Activity, Globe, Hash, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { adminGetSiteSettings, adminUpdateSiteSettings, clearCache } from '@/lib/db';
import type { NavLink, NavLinkType } from '@/types/database';

const defaultNavLinks: NavLink[] = [
  { id: 'home', label: 'Home', path: '/', type: 'route', visible: true, order: 0 },
  { id: 'resume', label: 'Resume', path: '/resume', type: 'route', visible: true, order: 1 },
  { id: 'projects', label: 'Projects', path: '/projects', type: 'route', visible: true, order: 2, autoHideIfEmpty: true },
  { id: 'writing', label: 'Selected Writing', path: '/writing', type: 'route', visible: true, order: 3, autoHideIfEmpty: true },
  { id: 'how-i-work', label: 'How I Work', path: '/#how-i-work', type: 'anchor', visible: true, order: 4 },
];

// Helper to detect link type from path
function detectLinkType(path: string): NavLinkType {
  if (path.startsWith('https://') || path.startsWith('http://')) return 'external';
  if (path.includes('#')) return 'anchor';
  return 'route';
}

// Helper to validate path based on type
function validatePath(path: string, type: NavLinkType): boolean {
  switch (type) {
    case 'route':
      return path.startsWith('/') && !path.includes('#');
    case 'anchor':
      return path.includes('#');
    case 'external':
      return path.startsWith('https://') || path.startsWith('http://');
    default:
      return true;
  }
}

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
      // Handle both array and object formats
      const links = Array.isArray(data.nav_config) 
        ? data.nav_config 
        : (data.nav_config as { links?: NavLink[] }).links || [];
      
      // Ensure all links have the type field
      const normalizedLinks = links.map((link: NavLink) => ({
        ...link,
        type: link.type || detectLinkType(link.path),
      }));
      
      const sorted = [...normalizedLinks].sort((a, b) => a.order - b.order);
      setNavLinks(sorted);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate all paths
      for (const link of navLinks) {
        if (!validatePath(link.path, link.type)) {
          toast.error(`Invalid path for "${link.label}": ${link.type} links should ${
            link.type === 'route' ? 'start with / and not contain #' :
            link.type === 'anchor' ? 'contain #' :
            'start with https://'
          }`);
          setSaving(false);
          return;
        }
      }

      const updatedLinks = navLinks.map((link, index) => ({
        ...link,
        order: index,
      }));

      const success = await adminUpdateSiteSettings({
        nav_config: updatedLinks,
      });
      
      if (success) {
        clearCache();
        toast.success('Navigation settings saved');
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
      type: 'route',
      visible: true,
      order: navLinks.length,
    };
    setNavLinks([...navLinks, newLink]);
  };

  const updateNavLink = (id: string, updates: Partial<NavLink>) => {
    setNavLinks(prev => prev.map(link => {
      if (link.id !== id) return link;
      
      const updated = { ...link, ...updates };
      
      // Auto-detect type when path changes
      if (updates.path && !updates.type) {
        updated.type = detectLinkType(updates.path);
      }
      
      return updated;
    }));
  };

  const removeNavLink = (id: string) => {
    setNavLinks(prev => prev.filter(link => link.id !== id));
  };

  const getTypeIcon = (type: NavLinkType) => {
    switch (type) {
      case 'route': return <Globe className="w-3 h-3" />;
      case 'anchor': return <Hash className="w-3 h-3" />;
      case 'external': return <ExternalLink className="w-3 h-3" />;
    }
  };

  const getTypeBadgeVariant = (type: NavLinkType) => {
    switch (type) {
      case 'route': return 'default';
      case 'anchor': return 'secondary';
      case 'external': return 'outline';
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
          <h1 className="text-2xl font-bold">Navigation Settings</h1>
          <p className="text-muted-foreground">Configure your site's navigation bar</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Navigation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Links</CardTitle>
          <CardDescription>
            Drag to reorder. Supports routes (/path), anchors (/#section), and external links (https://...).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Reorder.Group axis="y" values={navLinks} onReorder={setNavLinks} className="space-y-2">
            {navLinks.map((link) => (
              <Reorder.Item
                key={link.id}
                value={link}
                className="cursor-grab active:cursor-grabbing"
              >
                <div className={`
                  flex flex-col gap-3 p-4 rounded-lg border border-border
                  ${link.visible ? 'bg-card' : 'bg-muted/50 opacity-60'}
                `}>
                  {/* Row 1: Drag, Label, Path, Type Badge */}
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        value={link.label}
                        onChange={(e) => updateNavLink(link.id, { label: e.target.value })}
                        placeholder="Label"
                        className="h-9 text-sm"
                      />
                      <Input
                        value={link.path}
                        onChange={(e) => updateNavLink(link.id, { path: e.target.value })}
                        placeholder="Path (/, /#section, https://...)"
                        className="h-9 text-sm font-mono"
                      />
                    </div>
                    
                    <Badge variant={getTypeBadgeVariant(link.type)} className="flex items-center gap-1 whitespace-nowrap">
                      {getTypeIcon(link.type)}
                      {link.type}
                    </Badge>
                  </div>
                  
                  {/* Row 2: Options */}
                  <div className="flex items-center gap-4 ml-7 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`visible-${link.id}`}
                        checked={link.visible}
                        onCheckedChange={(checked) => updateNavLink(link.id, { visible: checked })}
                      />
                      <Label htmlFor={`visible-${link.id}`} className="text-sm text-muted-foreground">
                        Visible
                      </Label>
                    </div>
                    
                    {/* Auto-hide option for projects/writing */}
                    {(link.path === '/projects' || link.path === '/writing') && (
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`autohide-${link.id}`}
                          checked={link.autoHideIfEmpty ?? false}
                          onCheckedChange={(checked) => updateNavLink(link.id, { autoHideIfEmpty: checked })}
                        />
                        <Label htmlFor={`autohide-${link.id}`} className="text-sm text-muted-foreground">
                          Auto-hide if empty
                        </Label>
                      </div>
                    )}
                    
                    <Select
                      value={link.type}
                      onValueChange={(value: NavLinkType) => updateNavLink(link.id, { type: value })}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="route">Route (/)</SelectItem>
                        <SelectItem value="anchor">Anchor (#)</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeNavLink(link.id)}
                      className="h-8 w-8 ml-auto"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
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
