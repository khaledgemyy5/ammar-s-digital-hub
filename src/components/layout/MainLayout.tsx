import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useEffect, useState } from 'react';
import { getPublicSiteSettings, getWritingItems, getPublishedProjects } from '@/lib/db';
import type { SiteSettings, NavLink, ButtonConfig, NavConfig } from '@/types/database';

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

  // Get nav config - could be array or object
  const getNavConfig = () => {
    const config = settings?.nav_config;
    if (!config) return { links: undefined, ctaButtons: undefined };
    
    // Check if it's a NavConfig object or array
    if (Array.isArray(config)) {
      return { links: config as NavLink[], ctaButtons: undefined };
    }
    
    const navConfig = config as NavConfig;
    return {
      links: navConfig.links,
      ctaButtons: navConfig.ctaButtons
    };
  };

  // Filter nav links based on content availability
  const getFilteredNavLinks = (): NavLink[] | undefined => {
    const { links } = getNavConfig();
    if (!links) return undefined;
    
    return links.map(link => {
      if (link.path === '/writing' && !hasWriting) {
        return { ...link, visible: false };
      }
      if (link.path === '/contact' && settings?.pages?.contact?.enabled === false) {
        return { ...link, visible: false };
      }
      return link;
    });
  };

  const { ctaButtons } = getNavConfig();
  const resumeEnabled = settings?.pages?.resume?.enabled ?? true;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        navLinks={getFilteredNavLinks()} 
        ctaButtons={ctaButtons}
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
