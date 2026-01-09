import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Linkedin, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getPublicSiteSettings } from '@/lib/db';
import { trackPageView, trackContactClick } from '@/lib/analytics';
import { 
  ContactConfig, 
  defaultContactConfig, 
  migrateToContactConfig,
  isContactPageEmpty 
} from '@/types/contact';

export default function Contact() {
  const [config, setConfig] = useState<ContactConfig>(defaultContactConfig);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    trackPageView('/contact');
    
    getPublicSiteSettings().then((settings) => {
      if (settings?.pages?.contact) {
        const oldContact = settings.pages.contact as any;
        
        // Check if it's new format or old format
        if (oldContact.header && oldContact.contactInfo && oldContact.ctas) {
          setConfig({ ...defaultContactConfig, ...oldContact });
        } else {
          // Old format - migrate
          setConfig(migrateToContactConfig(oldContact));
        }
      }
      setLoading(false);
    });
  }, []);

  // Handle disabled page
  if (!loading && !config.enabled) {
    return (
      <div className="section-spacing">
        <div className="container-content text-center">
          <h1 className="mb-4">Contact</h1>
          <p className="text-muted-foreground">
            Contact page is currently disabled.
          </p>
          <Button onClick={() => navigate('/')} variant="outline" className="mt-6">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Handle empty page with autoHideIfEmpty
  const isEmpty = isContactPageEmpty(config);
  if (!loading && config.autoHideIfEmpty && isEmpty) {
    return (
      <div className="section-spacing">
        <div className="container-content text-center max-w-2xl">
          <h1 className="mb-4">Contact</h1>
          <p className="text-muted-foreground">
            No contact information is available at the moment.
          </p>
          <Button onClick={() => navigate('/')} variant="outline" className="mt-6">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const handleClick = (type: 'email' | 'linkedin' | 'calendar') => {
    trackContactClick(type);
  };

  // Check if we should show contact info cards
  const shouldShowEmail = config.contactInfo.show && 
    config.contactInfo.email.show && 
    config.contactInfo.email.value.trim();
    
  const shouldShowLinkedin = config.contactInfo.show && 
    config.contactInfo.linkedin.show && 
    config.contactInfo.linkedin.value.trim();
    
  const shouldShowCalendar = config.contactInfo.show && 
    config.contactInfo.calendar.show && 
    config.contactInfo.calendar.value.trim();

  // Check if we should show CTA buttons
  const shouldShowEmailButton = config.ctas.show && 
    config.ctas.emailButton.show && 
    config.contactInfo.email.value.trim();
    
  const shouldShowLinkedinButton = config.ctas.show && 
    config.ctas.linkedinButton.show && 
    config.contactInfo.linkedin.value.trim();
    
  const shouldShowCalendarButton = config.ctas.show && 
    config.ctas.calendarButton.show && 
    config.contactInfo.calendar.value.trim();

  const visibleCustomButtons = config.ctas.show && 
    config.ctas.customButtons.show 
      ? config.ctas.customButtons.buttons.filter(b => b.visible && b.url.trim())
      : [];

  const hasAnyContactInfo = shouldShowEmail || shouldShowLinkedin || shouldShowCalendar;
  const hasAnyCtas = shouldShowEmailButton || shouldShowLinkedinButton || shouldShowCalendarButton || visibleCustomButtons.length > 0;

  return (
    <div className="section-spacing">
      <div className="container-content max-w-2xl">
        {/* Header */}
        {config.header.show && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            {config.header.showTitle && config.header.title && (
              <h1 className="mb-4">{config.header.title}</h1>
            )}
            {config.header.showSubtitle && config.header.subtitle && (
              <p className="text-lg text-muted-foreground">
                {config.header.subtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        )}

        {/* Contact Info Cards */}
        {!loading && hasAnyContactInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Email Card */}
            {shouldShowEmail && (
              <a
                href={`mailto:${config.contactInfo.email.value}`}
                onClick={() => handleClick('email')}
                className="group flex items-center gap-4 p-6 border border-border rounded-lg bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {config.contactInfo.email.label}
                  </p>
                  <p className="text-muted-foreground truncate">
                    {config.contactInfo.email.value}
                  </p>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            )}

            {/* LinkedIn Card */}
            {shouldShowLinkedin && (
              <a
                href={config.contactInfo.linkedin.value}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClick('linkedin')}
                className="group flex items-center gap-4 p-6 border border-border rounded-lg bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Linkedin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {config.contactInfo.linkedin.label}
                  </p>
                  <p className="text-muted-foreground truncate">Connect with me</p>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            )}

            {/* Calendar Card */}
            {shouldShowCalendar && (
              <a
                href={config.contactInfo.calendar.value}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClick('calendar')}
                className="group flex items-center gap-4 p-6 border border-border rounded-lg bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {config.contactInfo.calendar.label}
                  </p>
                  <p className="text-muted-foreground truncate">Book a time that works for you</p>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            )}
          </motion.div>
        )}

        {/* CTA Buttons */}
        {!loading && hasAnyCtas && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3 mt-8 justify-center"
          >
            {shouldShowEmailButton && (
              <Button
                variant="default"
                asChild
              >
                <a 
                  href={`mailto:${config.contactInfo.email.value}`}
                  onClick={() => handleClick('email')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {config.ctas.emailButton.label}
                </a>
              </Button>
            )}
            
            {shouldShowLinkedinButton && (
              <Button
                variant="outline"
                asChild
              >
                <a 
                  href={config.contactInfo.linkedin.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleClick('linkedin')}
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  {config.ctas.linkedinButton.label}
                </a>
              </Button>
            )}
            
            {shouldShowCalendarButton && (
              <Button
                variant="outline"
                asChild
              >
                <a 
                  href={config.contactInfo.calendar.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleClick('calendar')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {config.ctas.calendarButton.label}
                </a>
              </Button>
            )}
            
            {/* Custom Buttons */}
            {visibleCustomButtons.map((btn) => (
              <Button
                key={btn.id}
                variant={btn.style === 'primary' ? 'default' : btn.style === 'ghost' ? 'ghost' : 'outline'}
                asChild
              >
                <a 
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {btn.label}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !hasAnyContactInfo && !hasAnyCtas && !config.header.show && (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">
              Contact information will appear here once configured.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
