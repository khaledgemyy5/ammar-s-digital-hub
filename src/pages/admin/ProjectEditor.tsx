import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Save, ArrowLeft, Loader2, Plus, Trash2, Upload, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { getProjectBySlug, createProject, updateProject, clearCache } from '@/lib/db';
import type { Project, ProjectSection, ProjectContent, ProjectStatus, DetailLevel } from '@/types/database';

const defaultSections: ProjectSection[] = [
  { id: 'snapshot', visible: true, order: 0 },
  { id: 'problem_framing', visible: true, order: 1 },
  { id: 'your_role', visible: true, order: 2 },
  { id: 'options_considered', visible: true, order: 3 },
  { id: 'approach_decisions', visible: true, order: 4 },
  { id: 'outcome_learnings', visible: true, order: 5 },
  { id: 'context', visible: false, order: 6 },
  { id: 'constraints_risks', visible: false, order: 7 },
  { id: 'evidence_pack', visible: true, order: 8 },
  { id: 'media', visible: true, order: 9 },
];

const sectionLabels: Record<string, string> = {
  snapshot: 'Snapshot (Problem, Role, Approach, Outcome)',
  problem_framing: 'Problem Framing',
  your_role: 'Your Role',
  options_considered: 'Options Considered & Trade-offs',
  approach_decisions: 'Approach & Key Decisions',
  outcome_learnings: 'Outcome & Learnings',
  context: 'Context',
  constraints_risks: 'Constraints & Risks',
  evidence_pack: 'Evidence & Links',
  media: 'Media (Images/Videos)',
};

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('PUBLIC');
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('FULL');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [confidentialMessage, setConfidentialMessage] = useState('');
  const [sections, setSections] = useState<ProjectSection[]>(defaultSections);
  const [content, setContent] = useState<ProjectContent>({});
  const [mediaItems, setMediaItems] = useState<Array<{ type: 'image' | 'video'; url: string; caption?: string }>>([]);
  const [evidenceLinks, setEvidenceLinks] = useState<Array<{ label: string; url: string; type: 'prd' | 'spec' | 'roadmap' | 'demo' | 'github' | 'other' }>>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      loadProject(id);
    }
  }, [id, isNew]);

  const loadProject = async (projectId: string) => {
    try {
      // Fetch by ID directly for admin
      const { data, error } = await supabase
        .from('projects' as any)
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) {
        toast.error('Project not found');
        navigate('/admin/projects');
        return;
      }

      const project = data as Project;
      setTitle(project.title);
      setSlug(project.slug);
      setSummary(project.summary || '');
      setTags(project.tags || []);
      setStatus(project.status);
      setDetailLevel(project.detail_level);
      setFeatured(project.featured);
      setPublished(project.published);
      setConfidentialMessage(project.confidential_message || '');
      setSections(project.sections_config || defaultSections);
      setContent(project.content || {});
      setMediaItems(project.media?.items || []);
      setEvidenceLinks(project.content?.evidence_pack || []);
    } catch (err) {
      toast.error('Error loading project');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (isNew) {
      setSlug(generateSlug(value));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const updateSection = (sectionId: string, updates: Partial<ProjectSection>) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    ));
  };

  const updateContent = (key: keyof ProjectContent, value: any) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const addEvidenceLink = () => {
    setEvidenceLinks([...evidenceLinks, { label: '', url: '', type: 'other' }]);
  };

  const updateEvidenceLink = (index: number, updates: Partial<typeof evidenceLinks[0]>) => {
    const updated = [...evidenceLinks];
    updated[index] = { ...updated[index], ...updates };
    setEvidenceLinks(updated);
  };

  const removeEvidenceLink = (index: number) => {
    setEvidenceLinks(evidenceLinks.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (file: File) => {
    if (mediaItems.length >= 3) {
      toast.error('Maximum 3 media items allowed');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `projects/${slug || 'new'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setMediaItems([...mediaItems, { type: 'image', url: publicUrl, caption: '' }]);
      toast.success('Image uploaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeMediaItem = (index: number) => {
    setMediaItems(mediaItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error('Title and slug are required');
      return;
    }

    setSaving(true);
    try {
      const projectData = {
        title,
        slug,
        summary,
        tags,
        status,
        detail_level: detailLevel,
        featured,
        published,
        confidential_message: confidentialMessage || null,
        sections_config: sections,
        content: { ...content, evidence_pack: evidenceLinks },
        media: { items: mediaItems },
      };

      let success;
      if (isNew) {
        const created = await createProject(projectData as any);
        success = !!created;
        if (success && created) {
          navigate(`/admin/projects/${created.id}`);
        }
      } else {
        success = await updateProject(id!, projectData);
      }

      if (success) {
        clearCache();
        toast.success(isNew ? 'Project created' : 'Project saved');
      } else {
        toast.error('Failed to save project');
      }
    } catch (err) {
      toast.error('Error saving project');
      console.error(err);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/projects')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isNew ? 'New Project' : 'Edit Project'}</h1>
            {!isNew && <p className="text-muted-foreground">/{slug}</p>}
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isNew ? 'Create' : 'Save'}
        </Button>
      </div>

      <Tabs defaultValue="metadata" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {/* Metadata Tab */}
        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Slug *</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Summary</Label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
                      <SelectItem value="CONCEPT">Concept</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Detail Level</Label>
                  <Select value={detailLevel} onValueChange={(v) => setDetailLevel(v as DetailLevel)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL">Full</SelectItem>
                      <SelectItem value="SUMMARY">Summary</SelectItem>
                      <SelectItem value="MINIMAL">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {status === 'CONFIDENTIAL' && (
                <div>
                  <Label>Confidential Message</Label>
                  <Textarea
                    value={confidentialMessage}
                    onChange={(e) => setConfidentialMessage(e.target.value)}
                    className="mt-1"
                    placeholder="Details intentionally limited..."
                    rows={2}
                  />
                </div>
              )}

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Switch checked={featured} onCheckedChange={setFeatured} />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={published} onCheckedChange={setPublished} />
                  <Label>Published</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Section Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sections.sort((a, b) => a.order - b.order).map(section => (
                <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span>{sectionLabels[section.id] || section.id}</span>
                  <Switch
                    checked={section.visible}
                    onCheckedChange={(checked) => updateSection(section.id, { visible: checked })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <div className="space-y-6">
            {/* Snapshot */}
            <Card>
              <CardHeader>
                <CardTitle>Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Problem</Label>
                  <Textarea
                    value={content.snapshot?.problem || ''}
                    onChange={(e) => updateContent('snapshot', { ...content.snapshot, problem: e.target.value })}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Textarea
                    value={content.snapshot?.role || ''}
                    onChange={(e) => updateContent('snapshot', { ...content.snapshot, role: e.target.value })}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Approach</Label>
                  <Textarea
                    value={content.snapshot?.approach || ''}
                    onChange={(e) => updateContent('snapshot', { ...content.snapshot, approach: e.target.value })}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Outcome</Label>
                  <Textarea
                    value={content.snapshot?.outcome || ''}
                    onChange={(e) => updateContent('snapshot', { ...content.snapshot, outcome: e.target.value })}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Other Content Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Problem Framing</Label>
                  <Textarea
                    value={content.problem_framing || ''}
                    onChange={(e) => updateContent('problem_framing', e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Your Role</Label>
                  <Textarea
                    value={content.your_role || ''}
                    onChange={(e) => updateContent('your_role', e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Approach & Key Decisions</Label>
                  <Textarea
                    value={content.approach_decisions || ''}
                    onChange={(e) => updateContent('approach_decisions', e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Outcome & Learnings</Label>
                  <Textarea
                    value={content.outcome_learnings || ''}
                    onChange={(e) => updateContent('outcome_learnings', e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Evidence Links */}
            <Card>
              <CardHeader>
                <CardTitle>Evidence & Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {evidenceLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) => updateEvidenceLink(index, { label: e.target.value })}
                      placeholder="Label"
                      className="w-32"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => updateEvidenceLink(index, { url: e.target.value })}
                      placeholder="URL"
                      className="flex-1"
                    />
                    <Select
                      value={link.type}
                      onValueChange={(v) => updateEvidenceLink(index, { type: v as 'prd' | 'spec' | 'roadmap' | 'demo' | 'github' | 'other' })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prd">PRD</SelectItem>
                        <SelectItem value="spec">Spec</SelectItem>
                        <SelectItem value="roadmap">Roadmap</SelectItem>
                        <SelectItem value="demo">Demo</SelectItem>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeEvidenceLink(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addEvidenceLink}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media (max 3)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mediaItems.map((item, index) => (
                  <div key={index} className="relative border rounded-lg overflow-hidden">
                    <img src={item.url} alt={item.caption || ''} className="w-full h-48 object-cover" />
                    <div className="p-2">
                      <Input
                        value={item.caption || ''}
                        onChange={(e) => {
                          const updated = [...mediaItems];
                          updated[index] = { ...updated[index], caption: e.target.value };
                          setMediaItems(updated);
                        }}
                        placeholder="Caption..."
                        className="text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeMediaItem(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {mediaItems.length < 3 && (
                <div>
                  <Label htmlFor="upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">Click to upload image</p>
                        </>
                      )}
                    </div>
                  </Label>
                  <input
                    id="upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
