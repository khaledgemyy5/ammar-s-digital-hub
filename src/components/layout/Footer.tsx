import { forwardRef } from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';

interface FooterProps {
  email?: string;
  linkedin?: string;
  github?: string;
  siteName?: string;
}

export const Footer = forwardRef<HTMLElement, FooterProps>(function Footer({
  email = 'hello@ammarjaber.com',
  linkedin = 'https://linkedin.com/in/ammarjaber',
  github = 'https://github.com/ammarjaber',
  siteName = 'Ammar Jaber'
}, ref) {
  const currentYear = new Date().getFullYear();

  return (
    <footer ref={ref} className="border-t border-border bg-secondary/30">
      <div className="container-content py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} {siteName}. All rights reserved.
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {github && (
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            )}
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
