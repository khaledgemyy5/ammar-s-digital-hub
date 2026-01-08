import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NavLink as NavLinkType } from '@/types/database';

interface NavbarProps {
  navLinks?: NavLinkType[];
  resumeEnabled?: boolean;
  siteName?: string;
}

const defaultLinks: NavLinkType[] = [
  { id: 'home', label: 'Home', path: '/', visible: true, order: 0 },
  { id: 'projects', label: 'Projects', path: '/projects', visible: true, order: 1 },
  { id: 'writing', label: 'Writing', path: '/writing', visible: true, order: 2 },
  { id: 'contact', label: 'Contact', path: '/contact', visible: true, order: 3 },
];

export function Navbar({ 
  navLinks = defaultLinks, 
  resumeEnabled = true,
  siteName = 'Ammar Jaber'
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const visibleLinks = navLinks
    .filter(link => link.visible)
    .sort((a, b) => a.order - b.order);

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
          {/* Logo/Name */}
          <Link 
            to="/" 
            className="font-heading text-xl md:text-2xl font-semibold text-foreground hover:text-primary transition-colors"
          >
            {siteName}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {visibleLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    to={link.path}
                    className={`text-sm font-medium transition-colors link-underline ${
                      location.pathname === link.path
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {resumeEnabled && (
              <Button asChild variant="default" size="sm">
                <Link to="/resume" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Resume
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
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
              <ul className="flex flex-col gap-3">
                {visibleLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      to={link.path}
                      className={`block py-2 text-base font-medium transition-colors ${
                        location.pathname === link.path
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {resumeEnabled && (
                  <li className="pt-2">
                    <Button asChild variant="default" className="w-full">
                      <Link to="/resume" className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" />
                        Resume
                      </Link>
                    </Button>
                  </li>
                )}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
