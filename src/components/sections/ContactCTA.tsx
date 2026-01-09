import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mail, Linkedin, Calendar } from 'lucide-react';
import { trackContactClick } from '@/lib/analytics';

interface ContactCTAConfig {
  headline?: string;
  body?: string;
  email?: string;
  linkedin?: string;
  calendar?: string;
}

interface ContactCTAProps {
  title?: string;
  config?: ContactCTAConfig;
}

export function ContactCTA({
  title,
  config
}: ContactCTAProps) {
  const headline = title || config?.headline || "Let's Work Together";
  const body = config?.body || "I'm always open to discussing product management opportunities, interesting projects, or just having a conversation about tech and product strategy.";
  const email = config?.email || 'hello@ammarjaber.com';
  const linkedin = config?.linkedin || 'https://linkedin.com/in/ammarjaber';
  const calendar = config?.calendar || 'https://calendly.com/ammarjaber';

  return (
    <section id="contact-cta" className="section-spacing bg-primary text-primary-foreground">
      <div className="container-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl mb-6">{headline}</h2>
          <p className="text-lg opacity-90 mb-10">
            {body}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {email && (
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => trackContactClick('email')}
              >
                <a href={`mailto:${email}`} className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Me
                </a>
              </Button>
            )}
            {linkedin && (
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
                  LinkedIn
                </a>
              </Button>
            )}
            {calendar && (
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
                  Schedule a Call
                </a>
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default ContactCTA;
