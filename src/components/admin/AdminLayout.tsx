import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, FolderKanban, PenLine, 
  BarChart3, LogOut, Menu, X, ExternalLink, Activity
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AdminGuard } from './AdminGuard';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
  { label: 'Projects', path: '/admin/projects', icon: FolderKanban },
  { label: 'Writing', path: '/admin/writing', icon: PenLine },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'System Status', path: '/admin/status', icon: Activity },
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
      <div className="min-h-screen bg-muted/30">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-heading font-semibold">Admin</span>
          <Button variant="ghost" size="icon" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-5 h-5" />
            </a>
          </Button>
        </header>

        {/* Sidebar */}
        <aside className={`
          fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-40
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-border">
              <Link to="/admin/dashboard" className="font-heading text-xl font-semibold">
                Admin Panel
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <a href="/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Preview Site
                </a>
              </Button>
              
              <div className="px-3 py-2 text-xs text-muted-foreground truncate">
                {user?.email}
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
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
        <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
