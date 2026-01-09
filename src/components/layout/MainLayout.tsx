import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useEffect, useState } from 'react';
import { getPublicSiteSettings, getWritingItems, getPublishedProjects } from '@/lib/db';
import type { SiteSettings, NavLink, ButtonConfig, NavConfig } from '@/types/database';
import { 
  ContactConfig, 
  defaultContactConfig, 
  migrateToContactConfig, 
  shouldShowContactInNav 
} from '@/types/contact';

// Default nav links
const defaultNavLinks: NavLink[] = [
  { id: 'home', label: 'Home', path: '/', type: 'route', visible: true, order: 0 },
  { id: 'resume', label: 'Resume', path: '/resume', type: 'route', visible: true, order: 1 },
  { id: 'projects', label: 'Projects', path: '/projects', type: 'route', visible: true, order: 2, autoHideIfEmpty: true },
  { id: 'writing', label: 'Selected Writing', path: '/writing', type: 'route', visible: true, order: 3, autoHideIfEmpty: true },
  { id: 'how-i-work', label: 'How I Work', path: '/#how-i-work', type: 'anchor', visible: true, order: 4 },
];
export function MainLayout() {
  const [settings, setSettings] = useState<Partial<SiteSettings> | null>(null);
  const [hasWriting, setHasWriting] = useState(true);
  const [hasProjects, setHasProjects] = useState(true);
  const [hasContact, setHasContact] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const [data, writing, projects] = await Promise.all([
        getPublicSiteSettings(),
        getWritingItems(),
        getPublishedProjects()
      ]);
      
      if (data) {
        setSettings(data);
        
        // Check contact visibility
        if (data.pages?.contact) {
          const oldContact = data.pages.contact as any;
          let contactConfig: ContactConfig;
          
          if (oldContact.header && oldContact.contactInfo && oldContact.ctas) {
            contactConfig = { ...defaultContactConfig, ...oldContact };
          } else {
            contactConfig = migrateToContactConfig(oldContact);
          }
          
          setHasContact(shouldShowContactInNav(contactConfig));
        }
      }
      setHasWriting(writing.length > 0);
      setHasProjects(projects.length > 0);
    }
    loadSettings();
  }, []);

  // Get nav config - could be array or object
  const getNavConfig = () => {
    const config = settings?.nav_config;
    if (!config) return { links: defaultNavLinks, ctaButtons: undefined };
    
    // Check if it's a NavConfig object or array
    if (Array.isArray(config)) {
      // Ensure all links have type field
      const normalizedLinks = config.map(link => ({
        ...link,
        type: link.type || (link.path.includes('#') ? 'anchor' : link.path.startsWith('http') ? 'external' : 'route'),
      })) as NavLink[];
      return { links: normalizedLinks, ctaButtons: undefined };
    }
    
    const navConfig = config as NavConfig;
    const normalizedLinks = (navConfig.links || []).map(link => ({
      ...link,
      type: link.type || (link.path.includes('#') ? 'anchor' : link.path.startsWith('http') ? 'external' : 'route'),
    })) as NavLink[];
    
    return {
      links: normalizedLinks,
      ctaButtons: navConfig.ctaButtons
    };
  };

  // Filter nav links based on content availability and visibility
  const getFilteredNavLinks = (): NavLink[] => {
    const { links } = getNavConfig();
    if (!links || links.length === 0) return defaultNavLinks;
    
    return links
      .map(link => {
        // Handle contact page visibility
        if (link.path === '/contact' && !hasContact) {
          return { ...link, visible: false };
        }
        return link;
      })
      .sort((a, b) => a.order - b.order);
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
        hasProjects={hasProjects}
        hasWriting={hasWriting}
        hasContact={hasContact}
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
