import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Star, Eye, EyeOff, 
  Lock, Lightbulb, Loader2, Search 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { getAllProjects, updateProject, deleteProject, clearCache } from '@/lib/db';
import type { Project } from '@/types/database';

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = async () => {
    const data = await getAllProjects();
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleTogglePublished = async (project: Project) => {
    const success = await updateProject(project.id, { published: !project.published });
    if (success) {
      clearCache();
      toast.success(project.published ? 'Project unpublished' : 'Project published');
      loadProjects();
    } else {
      toast.error('Failed to update project');
    }
  };

  const handleToggleFeatured = async (project: Project) => {
    const success = await updateProject(project.id, { featured: !project.featured });
    if (success) {
      clearCache();
      toast.success(project.featured ? 'Removed from featured' : 'Added to featured');
      loadProjects();
    } else {
      toast.error('Failed to update project');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);
    const success = await deleteProject(deleteId);
    if (success) {
      clearCache();
      toast.success('Project deleted');
      loadProjects();
    } else {
      toast.error('Failed to delete project');
    }
    setDeleting(false);
    setDeleteId(null);
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'CONFIDENTIAL':
        return <Lock className="w-4 h-4" />;
      case 'CONCEPT':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return null;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">{projects.length} projects total</p>
        </div>
        <Button asChild>
          <Link to="/admin/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="text-center">Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {search ? 'No projects match your search' : 'No projects yet. Create your first project!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-muted-foreground">/{project.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={
                          project.status === 'CONFIDENTIAL' 
                            ? 'badge-confidential' 
                            : project.status === 'CONCEPT' 
                              ? 'badge-concept' 
                              : 'badge-public'
                        }
                      >
                        {getStatusIcon(project.status)}
                        <span className="ml-1">{project.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={project.featured}
                        onCheckedChange={() => handleToggleFeatured(project)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={project.published}
                        onCheckedChange={() => handleTogglePublished(project)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/projects/${project.id}`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteId(project.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
