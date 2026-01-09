import { useEffect, useState } from 'react';
import { HeroSection } from '@/components/sections/HeroSection';
import { ExperienceSnapshot } from '@/components/sections/ExperienceSnapshot';
import { FeaturedProjects } from '@/components/sections/FeaturedProjects';
import { HowIWork } from '@/components/sections/HowIWork';
import { WritingPreview } from '@/components/sections/WritingPreview';
import { ContactCTA } from '@/components/sections/ContactCTA';
import { trackPageView } from '@/lib/analytics';
import { getFeaturedProjects, getFeaturedWriting, getPublicSiteSettings } from '@/lib/db';
import type { 
  Project, WritingItem, HomeSection, SiteSettings,
  HeroConfig, ExperienceSnapshotConfig, HowIWorkConfig, 
  FeaturedProjectsConfig, WritingPreviewConfig, ContactCTAConfig 
} from '@/types/database';

const defaultSections: HomeSection[] = [
  { id: 'hero', visible: true, order: 0 },
  { id: 'experience_snapshot', visible: true, order: 1, limit: 3 },
  { id: 'featured_projects', visible: true, order: 2, limit: 3 },
  { id: 'how_i_work', visible: true, order: 3 },
  { id: 'selected_writing_preview', visible: true, order: 4, limit: 3 },
  { id: 'contact_cta', visible: true, order: 5 },
];

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [writing, setWriting] = useState<WritingItem[]>([]);
  const [sections, setSections] = useState<HomeSection[]>(defaultSections);
  const [settings, setSettings] = useState<Partial<SiteSettings> | null>(null);

  useEffect(() => {
    trackPageView('/');
    
    async function loadData() {
      const [projectsData, writingData, siteSettings] = await Promise.all([
        getFeaturedProjects(3),
        getFeaturedWriting(3),
        getPublicSiteSettings()
      ]);
      
      setProjects(projectsData);
      setWriting(writingData);
      if (siteSettings) {
        setSettings(siteSettings);
        if (siteSettings.home_sections && Array.isArray(siteSettings.home_sections)) {
          setSections(siteSettings.home_sections as HomeSection[]);
        }
      }
    }
    
    loadData();
  }, []);

  // Helper to check if section is visible
  const isSectionVisible = (id: string) => {
    const section = sections.find(s => s.id === id);
    return section?.visible ?? true;
  };

  // Get section config
  const getSectionConfig = <T,>(id: string): T | undefined => {
    const section = sections.find(s => s.id === id);
    return section?.config as T | undefined;
  };

  // Get section title override
  const getSectionTitle = (id: string, defaultTitle: string) => {
    const section = sections.find(s => s.id === id);
    return section?.titleOverride || defaultTitle;
  };

  // Get section limit
  const getSectionLimit = (id: string, defaultLimit: number = 3) => {
    const section = sections.find(s => s.id === id);
    return section?.limit || defaultLimit;
  };

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  const renderSection = (sectionDef: HomeSection) => {
    const id = sectionDef.id;
    if (!isSectionVisible(id)) return null;

    switch (id) {
      case 'hero':
        return (
          <HeroSection 
            key={id} 
            config={getSectionConfig<HeroConfig>(id)}
          />
        );
      
      case 'experience_snapshot': {
        const config = getSectionConfig<ExperienceSnapshotConfig>(id);
        return (
          <ExperienceSnapshot 
            key={id} 
            title={getSectionTitle(id, 'Experience Snapshot')}
            experiences={config?.items?.map(item => ({
              title: item.role,
              company: item.company,
              period: item.years,
              description: item.description
            }))}
          />
        );
      }
      
      case 'featured_projects': {
        const config = getSectionConfig<FeaturedProjectsConfig>(id);
        const limit = config?.limit || getSectionLimit(id, 3);
        return (
          <FeaturedProjects 
            key={id} 
            projects={projects.slice(0, limit)} 
            title={getSectionTitle(id, 'Featured Projects')} 
          />
        );
      }
      
      case 'how_i_work': {
        const config = getSectionConfig<HowIWorkConfig>(id);
        return (
          <HowIWork 
            key={id} 
            title={getSectionTitle(id, 'How I Work')}
            principles={config?.bullets?.map(bullet => ({
              icon: undefined, // Would need to map icon string to component
              title: bullet.title,
              description: bullet.description
            }))}
          />
        );
      }
      
      case 'selected_writing_preview':
      case 'writing_preview': {
        const config = getSectionConfig<WritingPreviewConfig>(id);
        const limit = config?.limit || getSectionLimit(id, 3);
        if (writing.length === 0) return null;
        return (
          <WritingPreview 
            key={id} 
            items={writing.slice(0, limit)} 
            title={getSectionTitle(id, 'Selected Writing')} 
          />
        );
      }
      
      case 'contact_cta': {
        const config = getSectionConfig<ContactCTAConfig>(id);
        return (
          <ContactCTA 
            key={id}
            title={config?.headline}
            subtitle={config?.body}
            email={settings?.pages?.contact?.email}
            linkedin={settings?.pages?.contact?.linkedin}
            calendar={settings?.pages?.contact?.calendar}
          />
        );
      }
      
      default:
        return null;
    }
  };

  return (
    <>
      {sortedSections.map(section => renderSection(section))}
    </>
  );
};

export default Index;
