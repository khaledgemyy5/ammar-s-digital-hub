import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useEffect, useState } from 'react';
import { getPublicSiteSettings } from '@/lib/db';
import type { SiteSettings, NavLink } from '@/types/database';

export function MainLayout() {
  const [settings, setSettings] = useState<Partial<SiteSettings> | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const data = await getPublicSiteSettings();
      if (data) {
        setSettings(data);
      }
    }
    loadSettings();
  }, []);

  const navLinks = (settings?.nav_config as NavLink[]) || undefined;
  const resumeEnabled = settings?.pages?.resume?.enabled ?? true;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        navLinks={navLinks} 
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
