import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useEffect, useState } from 'react';
import { getPublicSiteSettings, getWritingItems, getPublishedProjects } from '@/lib/db';
import type { SiteSettings, NavLink } from '@/types/database';

export function MainLayout() {
  const [settings, setSettings] = useState<Partial<SiteSettings> | null>(null);
  const [hasWriting, setHasWriting] = useState(true);
  const [hasProjects, setHasProjects] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const [data, writing, projects] = await Promise.all([
        getPublicSiteSettings(),
        getWritingItems(),
        getPublishedProjects()
      ]);
      
      if (data) {
        setSettings(data);
      }
      setHasWriting(writing.length > 0);
      setHasProjects(projects.length > 0);
    }
    loadSettings();
  }, []);

  // Filter nav links based on content availability
  const getFilteredNavLinks = (): NavLink[] | undefined => {
    const navLinks = (settings?.nav_config as NavLink[]) || undefined;
    if (!navLinks) return undefined;
    
    return navLinks.map(link => {
      // Auto-hide Writing if no items
      if (link.path === '/writing' && !hasWriting) {
        return { ...link, visible: false };
      }
      // Auto-hide Projects if no items (optional, usually keep visible)
      // Auto-hide Contact if disabled
      if (link.path === '/contact' && settings?.pages?.contact?.enabled === false) {
        return { ...link, visible: false };
      }
      return link;
    });
  };

  const resumeEnabled = settings?.pages?.resume?.enabled ?? true;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        navLinks={getFilteredNavLinks()} 
        resumeEnabled={resumeEnabled}
        siteName="Ammar Jaber"
      />
      <main className="flex-1 pt-16 md:pt-20">
        <Outlet />
      </main>
      <Footer
        email={settings?.pages?.contact?.email}
        linkedin={settings?.pages?.contact?.linkedin}
      />
    </div>
  );
}

export default MainLayout;
