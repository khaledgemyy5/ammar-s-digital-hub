import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, FolderKanban, PenLine, 
  BarChart3, LogOut, Menu, X, ExternalLink, Activity,
  Home, Palette, Search, FileText, Rocket
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AdminGuard } from './AdminGuard';

const navItems = [
  { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Home Layout', path: '/admin/home-layout', icon: Home },
  { label: 'Projects', path: '/admin/projects', icon: FolderKanban },
  { label: 'Writing', path: '/admin/writing', icon: PenLine },
  { label: 'Pages', path: '/admin/pages', icon: FileText },
  { label: 'Theme', path: '/admin/theme', icon: Palette },
  { label: 'SEO', path: '/admin/seo', icon: Search },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Don't show layout for setup/login pages
  if (location.pathname === '/admin/setup' || location.pathname === '/admin/login') {
    return <Outlet />;
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        {/* Top Bar */}
        <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-50 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/admin/dashboard" className="font-heading text-lg font-semibold">
              Admin
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Preview</span>
              </a>
            </Button>
            <Button size="sm" className="gap-2">
              <Rocket className="w-4 h-4" />
              <span className="hidden sm:inline">Publish</span>
            </Button>
          </div>
        </header>

        {/* Sidebar */}
        <aside className={`
          fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-60 bg-background border-r border-border z-40
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                      transition-colors
                      ${isActive 
                        ? 'bg-accent text-accent-foreground font-medium' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-border space-y-2">
              <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">
                {user?.email}
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Log out
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="lg:ml-60 pt-14 min-h-screen">
          <div className="p-6 lg:p-8 max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
