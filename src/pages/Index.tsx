import { useEffect, useState } from 'react';
import { HeroSection } from '@/components/sections/HeroSection';
import { ExperienceSnapshot } from '@/components/sections/ExperienceSnapshot';
import { FeaturedProjects } from '@/components/sections/FeaturedProjects';
import { HowIWork } from '@/components/sections/HowIWork';
import { WritingPreview } from '@/components/sections/WritingPreview';
import { ContactCTA } from '@/components/sections/ContactCTA';
import { trackPageView } from '@/lib/analytics';
import { getFeaturedProjects, getFeaturedWriting, getPublicSiteSettings } from '@/lib/db';
import type { Project, WritingItem, HomeSection } from '@/types/database';

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [writing, setWriting] = useState<WritingItem[]>([]);
  const [sections, setSections] = useState<HomeSection[]>([]);

  useEffect(() => {
    trackPageView('/');
    
    async function loadData() {
      const [projectsData, writingData, settings] = await Promise.all([
        getFeaturedProjects(3),
        getFeaturedWriting(3),
        getPublicSiteSettings()
      ]);
      
      setProjects(projectsData);
      setWriting(writingData);
      if (settings?.home_sections) {
        setSections(settings.home_sections as HomeSection[]);
      }
    }
    
    loadData();
  }, []);

  // Helper to check if section is visible
  const isSectionVisible = (id: string) => {
    if (sections.length === 0) return true; // Show all by default
    const section = sections.find(s => s.id === id);
    return section?.visible ?? true;
  };

  // Sort sections by order
  const sortedSections = sections.length > 0 
    ? [...sections].sort((a, b) => a.order - b.order)
    : [
        { id: 'hero', visible: true, order: 0 },
        { id: 'experience_snapshot', visible: true, order: 1 },
        { id: 'featured_projects', visible: true, order: 2 },
        { id: 'how_i_work', visible: true, order: 3 },
        { id: 'selected_writing_preview', visible: true, order: 4 },
        { id: 'contact_cta', visible: true, order: 5 },
      ];

  const renderSection = (id: string) => {
    if (!isSectionVisible(id)) return null;

    switch (id) {
      case 'hero':
        return <HeroSection key={id} />;
      case 'experience_snapshot':
        return <ExperienceSnapshot key={id} />;
      case 'featured_projects':
        return <FeaturedProjects key={id} projects={projects} />;
      case 'how_i_work':
        return <HowIWork key={id} />;
      case 'selected_writing_preview':
        return <WritingPreview key={id} items={writing} />;
      case 'contact_cta':
        return <ContactCTA key={id} />;
      default:
        return null;
    }
  };

  return (
    <>
      {sortedSections.map(section => renderSection(section.id))}
    </>
  );
};

export default Index;
