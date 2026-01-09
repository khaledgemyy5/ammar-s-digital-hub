import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Linkedin, Calendar, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SupabaseStatus } from '@/components/ui/SupabaseStatus';
import { getPublicSiteSettings } from '@/lib/db';
import { trackPageView, trackContactClick } from '@/lib/analytics';
import { DynamicButton } from '@/components/ui/DynamicButton';
import type { ButtonConfig } from '@/types/database';

export default function Contact() {
  const [email, setEmail] = useState<string | null>(null);
  const [linkedin, setLinkedin] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<string | null>(null);
  const [buttons, setButtons] = useState<ButtonConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    trackPageView('/contact');
    
    getPublicSiteSettings().then((settings) => {
      if (settings?.pages?.contact) {
        setEnabled(settings.pages.contact.enabled ?? true);
        setEmail(settings.pages.contact.email || null);
        setLinkedin(settings.pages.contact.linkedin || null);
        setCalendar(settings.pages.contact.calendar || null);
        setButtons(settings.pages.contact.buttons || []);
      }
      setLoading(false);
    });
  }, []);

  const handleClick = (type: 'email' | 'linkedin' | 'calendar') => {
    trackContactClick(type);
  };

  if (!enabled && !loading) {
    return (
      <div className="section-spacing">
        <div className="container-content text-center">
          <h1 className="mb-4">Contact</h1>
          <p className="text-muted-foreground">
            Contact page is currently disabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-spacing">
      <div className="container-content max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="mb-4">Get in Touch</h1>
          <p className="text-lg text-muted-foreground">
            I'm always open to discussing new projects, opportunities, or just having a 
            conversation about product and technology.
          </p>
        </motion.div>

        {/* Supabase Status Banner */}
        <div className="mb-8">
          <SupabaseStatus />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        )}

        {/* Contact Methods */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Email */}
            {email && (
              <a
                href={`mailto:${email}`}
                onClick={() => handleClick('email')}
                className="group flex items-center gap-4 p-6 border border-border rounded-lg bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    Email
                  </p>
                  <p className="text-muted-foreground truncate">{email}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            )}

            {/* LinkedIn */}
            {linkedin && (
              <a
                href={linkedin}
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
                    LinkedIn
                  </p>
                  <p className="text-muted-foreground truncate">Connect with me</p>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            )}

            {/* Calendar */}
            {calendar && (
              <a
                href={calendar}
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
                    Schedule a Meeting
                  </p>
                  <p className="text-muted-foreground truncate">Book a time that works for you</p>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            )}

            {/* Custom CTA Buttons */}
            {buttons.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-4">
                {buttons.filter(b => b.visible !== false).map((btn, i) => (
                  <DynamicButton key={i} config={btn} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!email && !linkedin && !calendar && buttons.length === 0 && (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">
                  Contact information will appear here once configured.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
