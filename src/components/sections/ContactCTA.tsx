import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mail, Linkedin, Calendar, ExternalLink } from 'lucide-react';
import { trackContactClick } from '@/lib/analytics';
import { ContactConfig, defaultContactConfig } from '@/types/contact';

interface ContactCTAProps {
  title?: string;
  contactConfig?: ContactConfig;
  // Legacy props for backward compatibility
  config?: {
    headline?: string;
    body?: string;
    email?: string;
    linkedin?: string;
    calendar?: string;
  };
}

export function ContactCTA({
  title,
  contactConfig,
  config
}: ContactCTAProps) {
  // Use new contactConfig if available, otherwise fall back to legacy config
  const useNewConfig = !!contactConfig;
  
  // New config values
  const headerConfig = contactConfig?.header || defaultContactConfig.header;
  const contactInfo = contactConfig?.contactInfo || defaultContactConfig.contactInfo;
  const ctasConfig = contactConfig?.ctas || defaultContactConfig.ctas;
  
  // Legacy fallback values
  const headline = title || config?.headline || headerConfig.title;
  const body = config?.body || headerConfig.subtitle;
  const email = config?.email || contactInfo.email.value;
  const linkedin = config?.linkedin || contactInfo.linkedin.value;
  const calendar = config?.calendar || contactInfo.calendar.value;

  // Determine what to show based on new config
  const shouldShowHeader = useNewConfig ? headerConfig.show : true;
  const shouldShowTitle = useNewConfig ? headerConfig.showTitle : true;
  const shouldShowSubtitle = useNewConfig ? headerConfig.showSubtitle : true;
  
  const shouldShowCtas = useNewConfig ? ctasConfig.show : true;
  
  const shouldShowEmailButton = useNewConfig 
    ? (ctasConfig.show && ctasConfig.emailButton.show && email?.trim())
    : !!email;
    
  const shouldShowLinkedinButton = useNewConfig 
    ? (ctasConfig.show && ctasConfig.linkedinButton.show && linkedin?.trim())
    : !!linkedin;
    
  const shouldShowCalendarButton = useNewConfig 
    ? (ctasConfig.show && ctasConfig.calendarButton.show && calendar?.trim())
    : !!calendar;

  // Custom buttons
  const customButtons = useNewConfig && ctasConfig.show && ctasConfig.customButtons.show
    ? ctasConfig.customButtons.buttons.filter(b => b.visible && b.url.trim()).sort((a, b) => a.order - b.order)
    : [];

  // Get button labels
  const emailLabel = useNewConfig ? ctasConfig.emailButton.label : 'Email Me';
  const linkedinLabel = useNewConfig ? ctasConfig.linkedinButton.label : 'LinkedIn';
  const calendarLabel = useNewConfig ? ctasConfig.calendarButton.label : 'Schedule a Call';

  // Check if anything should be shown
  const hasAnyCtas = shouldShowEmailButton || shouldShowLinkedinButton || shouldShowCalendarButton || customButtons.length > 0;
  const hasHeader = shouldShowHeader && ((shouldShowTitle && headline?.trim()) || (shouldShowSubtitle && body?.trim()));

  // If nothing to show, don't render the section
  if (!hasHeader && !hasAnyCtas) {
    return null;
  }

  return (
    <section id="contact-cta" className="section-spacing bg-primary text-primary-foreground">
      <div className="container-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Header */}
          {shouldShowHeader && (
            <>
              {shouldShowTitle && headline?.trim() && (
                <h2 className="text-3xl md:text-4xl mb-6">{headline}</h2>
              )}
              {shouldShowSubtitle && body?.trim() && (
                <p className="text-lg opacity-90 mb-10">
                  {body}
                </p>
              )}
            </>
          )}

          {/* CTA Buttons */}
          {hasAnyCtas && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {shouldShowEmailButton && (
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => trackContactClick('email')}
                >
                  <a href={`mailto:${email}`} className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {emailLabel}
                  </a>
                </Button>
              )}
              {shouldShowLinkedinButton && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => trackContactClick('linkedin')}
                >
                  <a 
                    href={linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Linkedin className="w-4 h-4" />
                    {linkedinLabel}
                  </a>
                </Button>
              )}
              {shouldShowCalendarButton && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => trackContactClick('calendar')}
                >
                  <a 
                    href={calendar} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    {calendarLabel}
                  </a>
                </Button>
              )}
              
              {/* Custom Buttons */}
              {customButtons.map((btn) => (
                <Button
                  key={btn.id}
                  asChild
                  variant={btn.style === 'primary' ? 'secondary' : 'outline'}
                  size="lg"
                  className={`w-full sm:w-auto ${btn.style !== 'primary' ? 'bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10' : ''}`}
                >
                  <a 
                    href={btn.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    {btn.label}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default ContactCTA;
