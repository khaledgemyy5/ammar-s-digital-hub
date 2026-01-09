import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Hook to handle anchor navigation with smooth scrolling
 * - Scrolls to anchor on initial load if hash exists
 * - Handles hash changes
 */
export function useAnchorNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  // Handle initial hash on page load and hash changes
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  /**
   * Navigate to an anchor link
   * - If already on the target page, just scroll
   * - If on different page, navigate first then scroll
   */
  const navigateToAnchor = (path: string, closeMenu?: () => void) => {
    closeMenu?.();

    if (path.includes('#')) {
      const [basePath, hash] = path.split('#');
      const targetPath = basePath || '/';
      const targetId = hash;

      // If we're already on the correct page, just scroll
      if (location.pathname === targetPath) {
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // Navigate to the page first
        navigate(targetPath);
        // Then scroll after navigation completes
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    } else {
      navigate(path);
    }
  };

  return { navigateToAnchor };
}
