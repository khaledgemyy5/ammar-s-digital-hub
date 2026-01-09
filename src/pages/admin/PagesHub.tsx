import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Mail, Workflow, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pages = [
  {
    id: 'resume',
    title: 'Resume',
    description: 'Configure resume page content, PDF upload, and structured sections',
    icon: FileText,
    path: '/admin/pages/resume',
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'Manage contact information, CTA buttons, and visibility toggles',
    icon: Mail,
    path: '/admin/pages/contact',
  },
  {
    id: 'how-i-work',
    title: 'How I Work',
    description: 'Edit the "How I Work" section items, icons, and visibility',
    icon: Workflow,
    path: '/admin/pages/how-i-work',
  },
];

export default function PagesHub() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pages</h1>
        <p className="text-muted-foreground">Configure individual page settings and content</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page, idx) => {
          const Icon = page.icon;
          return (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => navigate(page.path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1">{page.title}</CardTitle>
                  <CardDescription>{page.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
