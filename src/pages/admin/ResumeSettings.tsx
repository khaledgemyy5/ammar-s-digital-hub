import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, Loader2, ArrowLeft, Plus, Trash2, Upload, X, GripVertical, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { adminGetSiteSettings, adminUpdateSiteSettings, clearCache } from '@/lib/db';
import { 
  ResumeConfig, 
  defaultResumeConfig, 
  migrateToResumeConfig,
  ResumeExperienceEntry,
  ResumeProjectEntry,
  ResumeEducationEntry,
  ResumeCertificationEntry,
  RESUME_SECTION_TYPES,
} from '@/types/resume';

export default function ResumeSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState<ResumeConfig>(defaultResumeConfig);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const settings = await adminGetSiteSettings();
    if (settings?.pages?.resume) {
      const migrated = migrateToResumeConfig(settings.pages.resume);
      setConfig(migrated);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = await adminGetSiteSettings();
      const currentPages = settings?.pages || { resume: {}, contact: {} };
      
      const success = await adminUpdateSiteSettings({
        pages: {
          resume: config as any,
          contact: currentPages.contact || { enabled: true },
        } as any,
      });

      if (success) {
        clearCache();
        toast.success('Resume settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileName = `resume-${Date.now()}.pdf`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setConfig({ ...config, pdfUrl: publicUrl });
      toast.success('Resume PDF uploaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload PDF');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePdf = () => {
    setConfig({ ...config, pdfUrl: undefined });
  };

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  // Experience CRUD
  const addExperience = () => {
    const newEntry: ResumeExperienceEntry = {
      id: `exp-${Date.now()}`,
      company: '',
      role: '',
      startDate: '',
      bullets: [''],
    };
    setConfig({ ...config, experience: [...config.experience, newEntry] });
  };

  const updateExperience = (id: string, updates: Partial<ResumeExperienceEntry>) => {
    setConfig({
      ...config,
      experience: config.experience.map(e => e.id === id ? { ...e, ...updates } : e),
    });
  };

  const removeExperience = (id: string) => {
    setConfig({ ...config, experience: config.experience.filter(e => e.id !== id) });
  };

  // Projects CRUD
  const addProject = () => {
    const newEntry: ResumeProjectEntry = {
      id: `proj-${Date.now()}`,
      title: '',
      description: '',
    };
    setConfig({ ...config, projects: [...config.projects, newEntry] });
  };

  const updateProject = (id: string, updates: Partial<ResumeProjectEntry>) => {
    setConfig({
      ...config,
      projects: config.projects.map(p => p.id === id ? { ...p, ...updates } : p),
    });
  };

  const removeProject = (id: string) => {
    setConfig({ ...config, projects: config.projects.filter(p => p.id !== id) });
  };

  // Skills CRUD
  const addSkillCategory = () => {
    const newCat = {
      id: `cat-${Date.now()}`,
      name: '',
      items: [''],
    };
    setConfig({
      ...config,
      skills: { categories: [...config.skills.categories, newCat] },
    });
  };

  const updateSkillCategory = (id: string, updates: Partial<{ name: string; items: string[] }>) => {
    setConfig({
      ...config,
      skills: {
        categories: config.skills.categories.map(c => c.id === id ? { ...c, ...updates } : c),
      },
    });
  };

  const removeSkillCategory = (id: string) => {
    setConfig({
      ...config,
      skills: { categories: config.skills.categories.filter(c => c.id !== id) },
    });
  };

  // Education CRUD
  const addEducation = () => {
    const newEntry: ResumeEducationEntry = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      year: '',
    };
    setConfig({ ...config, education: [...config.education, newEntry] });
  };

  const updateEducation = (id: string, updates: Partial<ResumeEducationEntry>) => {
    setConfig({
      ...config,
      education: config.education.map(e => e.id === id ? { ...e, ...updates } : e),
    });
  };

  const removeEducation = (id: string) => {
    setConfig({ ...config, education: config.education.filter(e => e.id !== id) });
  };

  // Certifications CRUD
  const addCertification = () => {
    const newEntry: ResumeCertificationEntry = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      year: '',
    };
    setConfig({ ...config, certifications: [...config.certifications, newEntry] });
  };

  const updateCertification = (id: string, updates: Partial<ResumeCertificationEntry>) => {
    setConfig({
      ...config,
      certifications: config.certifications.map(c => c.id === id ? { ...c, ...updates } : c),
    });
  };

  const removeCertification = (id: string) => {
    setConfig({ ...config, certifications: config.certifications.filter(c => c.id !== id) });
  };

  // Update section visibility/order
  const updateSectionConfig = (id: string, updates: Partial<{ enabled: boolean; titleOverride: string }>) => {
    setConfig({
      ...config,
      sections: config.sections.map(s => s.id === id ? { ...s, ...updates } : s),
    });
  };

  const reorderSections = (newOrder: typeof config.sections) => {
    setConfig({
      ...config,
      sections: newOrder.map((s, idx) => ({ ...s, order: idx })),
    });
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/pages')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Resume Settings</h1>
            <p className="text-muted-foreground">Configure resume page content and structure</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Page Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Page Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Resume Page</Label>
              <p className="text-sm text-muted-foreground">Show the resume page in navigation</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>

          <Separator />

          {/* PDF Upload */}
          <div className="space-y-2">
            <Label>Resume PDF</Label>
            <div className="flex items-center gap-3">
              {config.pdfUrl ? (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg flex-1">
                  <span className="text-sm truncate flex-1">{config.pdfUrl}</span>
                  <Button variant="ghost" size="icon" onClick={removePdf}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload PDF
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a PDF resume for the download button (max 5MB)
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Show Copy Text Button</Label>
              <Switch
                checked={config.showCopyText}
                onCheckedChange={(checked) => setConfig({ ...config, showCopyText: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Download Button</Label>
              <Switch
                checked={config.showDownload}
                onCheckedChange={(checked) => setConfig({ ...config, showDownload: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Name and title displayed at the top of the resume</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Name</Label>
                <Switch
                  checked={config.personalInfo.showName}
                  onCheckedChange={(checked) => 
                    setConfig({ 
                      ...config, 
                      personalInfo: { ...config.personalInfo, showName: checked } 
                    })
                  }
                />
              </div>
              <Input
                value={config.personalInfo.name}
                onChange={(e) => 
                  setConfig({ 
                    ...config, 
                    personalInfo: { ...config.personalInfo, name: e.target.value } 
                  })
                }
                placeholder="Your Name"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Title</Label>
                <Switch
                  checked={config.personalInfo.showTitle}
                  onCheckedChange={(checked) => 
                    setConfig({ 
                      ...config, 
                      personalInfo: { ...config.personalInfo, showTitle: checked } 
                    })
                  }
                />
              </div>
              <Input
                value={config.personalInfo.title}
                onChange={(e) => 
                  setConfig({ 
                    ...config, 
                    personalInfo: { ...config.personalInfo, title: e.target.value } 
                  })
                }
                placeholder="Your Title"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections Order */}
      <Card>
        <CardHeader>
          <CardTitle>Sections Order & Visibility</CardTitle>
          <CardDescription>Drag to reorder, toggle to show/hide sections</CardDescription>
        </CardHeader>
        <CardContent>
          <Reorder.Group 
            axis="y" 
            values={config.sections} 
            onReorder={reorderSections}
            className="space-y-2"
          >
            {config.sections.sort((a, b) => a.order - b.order).map((section) => (
              <Reorder.Item 
                key={section.id} 
                value={section}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-move"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 capitalize">{section.id}</span>
                <Input
                  value={section.titleOverride || ''}
                  onChange={(e) => updateSectionConfig(section.id, { titleOverride: e.target.value })}
                  placeholder="Title override"
                  className="w-40 h-8 text-sm"
                />
                <Switch
                  checked={section.enabled}
                  onCheckedChange={(checked) => updateSectionConfig(section.id, { enabled: checked })}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Collapsible open={expandedSections.has('summary')} onOpenChange={() => toggleSection('summary')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle>Summary</CardTitle>
                {expandedSections.has('summary') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Textarea
                value={config.summary}
                onChange={(e) => setConfig({ ...config, summary: e.target.value })}
                placeholder="Write a brief professional summary..."
                rows={4}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Experience Section */}
      <Collapsible open={expandedSections.has('experience')} onOpenChange={() => toggleSection('experience')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Experience</CardTitle>
                  <Badge variant="secondary">{config.experience.length}</Badge>
                </div>
                {expandedSections.has('experience') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {config.experience.map((exp) => (
                <div key={exp.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{exp.role || exp.company || 'New Experience'}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeExperience(exp.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      placeholder="Company"
                    />
                    <Input
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                      placeholder="Role"
                    />
                    <Input
                      value={exp.location || ''}
                      onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                      placeholder="Location"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                        placeholder="Start Date"
                        className="flex-1"
                      />
                      <Input
                        value={exp.endDate || ''}
                        onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        placeholder="End Date"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Highlights</Label>
                    {exp.bullets.map((bullet, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={bullet}
                          onChange={(e) => {
                            const newBullets = [...exp.bullets];
                            newBullets[idx] = e.target.value;
                            updateExperience(exp.id, { bullets: newBullets });
                          }}
                          placeholder={`Bullet ${idx + 1}`}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newBullets = exp.bullets.filter((_, i) => i !== idx);
                            updateExperience(exp.id, { bullets: newBullets });
                          }}
                          disabled={exp.bullets.length <= 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateExperience(exp.id, { bullets: [...exp.bullets, ''] })}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Bullet
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addExperience}>
                <Plus className="w-4 h-4 mr-2" /> Add Experience
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Projects Section */}
      <Collapsible open={expandedSections.has('projects')} onOpenChange={() => toggleSection('projects')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Projects</CardTitle>
                  <Badge variant="secondary">{config.projects.length}</Badge>
                </div>
                {expandedSections.has('projects') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {config.projects.map((proj) => (
                <div key={proj.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={proj.title}
                      onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                      placeholder="Project Title"
                      className="flex-1 mr-2"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeProject(proj.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <Textarea
                    value={proj.description}
                    onChange={(e) => updateProject(proj.id, { description: e.target.value })}
                    placeholder="Brief description"
                    rows={2}
                  />
                  <Input
                    value={proj.link || ''}
                    onChange={(e) => updateProject(proj.id, { link: e.target.value })}
                    placeholder="Link (optional)"
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addProject}>
                <Plus className="w-4 h-4 mr-2" /> Add Project
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Skills Section */}
      <Collapsible open={expandedSections.has('skills')} onOpenChange={() => toggleSection('skills')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Skills</CardTitle>
                  <Badge variant="secondary">{config.skills.categories.length} categories</Badge>
                </div>
                {expandedSections.has('skills') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {config.skills.categories.map((cat) => (
                <div key={cat.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={cat.name}
                      onChange={(e) => updateSkillCategory(cat.id, { name: e.target.value })}
                      placeholder="Category Name"
                      className="w-48"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeSkillCategory(cat.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-muted p-1 rounded">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const newItems = [...cat.items];
                            newItems[idx] = e.target.value;
                            updateSkillCategory(cat.id, { items: newItems });
                          }}
                          className="w-24 h-6 text-xs border-0 bg-transparent"
                          placeholder="Skill"
                        />
                        <button
                          onClick={() => {
                            const newItems = cat.items.filter((_, i) => i !== idx);
                            updateSkillCategory(cat.id, { items: newItems });
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6"
                      onClick={() => updateSkillCategory(cat.id, { items: [...cat.items, ''] })}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addSkillCategory}>
                <Plus className="w-4 h-4 mr-2" /> Add Skill Category
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Education Section */}
      <Collapsible open={expandedSections.has('education')} onOpenChange={() => toggleSection('education')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Education</CardTitle>
                  <Badge variant="secondary">{config.education.length}</Badge>
                </div>
                {expandedSections.has('education') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {config.education.map((edu) => (
                <div key={edu.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{edu.degree || edu.institution || 'New Education'}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeEducation(edu.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                      placeholder="Degree"
                    />
                    <Input
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                      placeholder="Institution"
                    />
                    <Input
                      value={edu.year}
                      onChange={(e) => updateEducation(edu.id, { year: e.target.value })}
                      placeholder="Year"
                    />
                  </div>
                  <Textarea
                    value={edu.details || ''}
                    onChange={(e) => updateEducation(edu.id, { details: e.target.value })}
                    placeholder="Additional details (optional)"
                    rows={2}
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addEducation}>
                <Plus className="w-4 h-4 mr-2" /> Add Education
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Certifications Section */}
      <Collapsible open={expandedSections.has('certifications')} onOpenChange={() => toggleSection('certifications')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Certifications</CardTitle>
                  <Badge variant="secondary">{config.certifications.length}</Badge>
                </div>
                {expandedSections.has('certifications') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {config.certifications.map((cert) => (
                <div key={cert.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{cert.name || 'New Certification'}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeCertification(cert.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      value={cert.name}
                      onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                      placeholder="Certification Name"
                    />
                    <Input
                      value={cert.issuer}
                      onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                      placeholder="Issuer"
                    />
                    <Input
                      value={cert.year}
                      onChange={(e) => updateCertification(cert.id, { year: e.target.value })}
                      placeholder="Year"
                    />
                  </div>
                  <Input
                    value={cert.url || ''}
                    onChange={(e) => updateCertification(cert.id, { url: e.target.value })}
                    placeholder="URL (optional)"
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addCertification}>
                <Plus className="w-4 h-4 mr-2" /> Add Certification
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
