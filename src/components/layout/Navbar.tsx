import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, FileText, Home, Briefcase, FolderOpen, PenLine, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NavLink as NavLinkType, ButtonConfig } from '@/types/database';
import { DynamicButton } from '@/components/ui/DynamicButton';
import { useAnchorNavigation } from '@/hooks/useAnchorNavigation';

interface NavbarProps {
  navLinks?: NavLinkType[];
  ctaButtons?: ButtonConfig[];
  resumeEnabled?: boolean;
  siteName?: string;
  hasProjects?: boolean;
  hasWriting?: boolean;
}

// Default nav links with new order
const defaultLinks: NavLinkType[] = [
  { id: 'home', label: 'Home', path: '/', type: 'route', visible: true, order: 0 },
  { id: 'resume', label: 'Resume', path: '/resume', type: 'route', visible: true, order: 1 },
  { id: 'projects', label: 'Projects', path: '/projects', type: 'route', visible: true, order: 2, autoHideIfEmpty: true },
  { id: 'writing', label: 'Selected Writing', path: '/writing', type: 'route', visible: true, order: 3, autoHideIfEmpty: true },
  { id: 'how-i-work', label: 'How I Work', path: '/#how-i-work', type: 'anchor', visible: true, order: 4 },
];

// Icon mapping for mobile menu
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  resume: FileText,
  projects: FolderOpen,
  writing: PenLine,
  'how-i-work': Briefcase,
  external: ExternalLink,
};

export function Navbar({ 
  navLinks = defaultLinks, 
  ctaButtons,
  resumeEnabled = true,
  siteName = 'Ammar Jaber',
  hasProjects = true,
  hasWriting = true,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { navigateToAnchor } = useAnchorNavigation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle nav link click (supports anchor navigation)
  const handleLinkClick = (link: NavLinkType) => {
    if (link.type === 'anchor' || link.path.includes('#')) {
      navigateToAnchor(link.path, () => setIsOpen(false));
    } else if (link.type === 'external') {
      window.open(link.path, '_blank', 'noopener,noreferrer');
      setIsOpen(false);
    } else {
      setIsOpen(false);
    }
  };

  // Filter visible links and apply autoHideIfEmpty
  const visibleLinks = navLinks
    .filter(link => {
      if (!link.visible) return false;
      
      // Check autoHideIfEmpty
      if (link.autoHideIfEmpty) {
        if (link.path === '/projects' && !hasProjects) return false;
        if (link.path === '/writing' && !hasWriting) return false;
      }
      
      return true;
    })
    .sort((a, b) => a.order - b.order);

  // Get icon for a link
  const getIcon = (link: NavLinkType) => {
    if (link.type === 'external') return iconMap.external;
    return iconMap[link.id] || Home;
  };

  // Check if link is active
  const isActive = (link: NavLinkType) => {
    if (link.type === 'anchor') {
      return location.pathname === '/' && location.hash === `#${link.path.split('#')[1]}`;
    }
    return location.pathname === link.path;
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/95 backdrop-blur-md shadow-sm border-b border-border' 
          : 'bg-transparent'
      }`}
    >
      <div className="container-content">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile: Burger + Name on left */}
          <div className="flex items-center gap-2 md:hidden flex-1">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-foreground hover:text-primary transition-colors"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link 
              to="/" 
              className="font-heading text-lg font-semibold text-foreground hover:text-primary transition-colors"
            >
              {siteName}
            </Link>
          </div>

          {/* Desktop: Logo/Name */}
          <Link 
            to="/" 
            className="hidden md:block font-heading text-xl md:text-2xl font-semibold text-foreground hover:text-primary transition-colors"
          >
            {siteName}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {visibleLinks.map((link) => (
                <li key={link.id}>
                  {link.type === 'anchor' ? (
                    <button
                      onClick={() => handleLinkClick(link)}
                      className={`text-sm font-medium transition-colors link-underline ${
                        isActive(link)
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {link.label}
                    </button>
                  ) : link.type === 'external' ? (
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium transition-colors link-underline text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link
                      to={link.path}
                      className={`text-sm font-medium transition-colors link-underline ${
                        isActive(link)
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {ctaButtons && ctaButtons.filter(b => b.visible !== false).map((btn, i) => (
              <DynamicButton key={i} config={btn} size="sm" />
            ))}
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="container-content py-4">
              <ul className="flex flex-col gap-1">
                {visibleLinks.map((link) => {
                  const Icon = getIcon(link);
                  const active = isActive(link);
                  
                  return (
                    <li key={link.id}>
                      {link.type === 'anchor' ? (
                        <button
                          onClick={() => handleLinkClick(link)}
                          className={`w-full flex items-center gap-3 py-3 px-2 text-base font-medium transition-colors rounded-lg hover:bg-muted ${
                            active
                              ? 'text-foreground bg-muted'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {link.label}
                        </button>
                      ) : link.type === 'external' ? (
                        <a
                          href={link.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsOpen(false)}
                          className="w-full flex items-center gap-3 py-3 px-2 text-base font-medium transition-colors rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Icon className="w-5 h-5" />
                          {link.label}
                          <ExternalLink className="w-4 h-4 ml-auto" />
                        </a>
                      ) : (
                        <Link
                          to={link.path}
                          onClick={() => setIsOpen(false)}
                          className={`w-full flex items-center gap-3 py-3 px-2 text-base font-medium transition-colors rounded-lg hover:bg-muted ${
                            active
                              ? 'text-foreground bg-muted'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
