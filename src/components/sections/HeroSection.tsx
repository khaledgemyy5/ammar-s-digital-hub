import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, ExternalLink, Mail, ArrowDown } from 'lucide-react';
import type { HeroConfig, ButtonConfig } from '@/types/database';

interface HeroSectionProps {
  config?: HeroConfig;
  // Legacy props
  name?: string;
  tagline?: string;
  description?: string;
  resumeUrl?: string;
}

const defaultConfig: HeroConfig = {
  name: 'Ammar Jaber',
  role: 'Technical Product Manager',
  transitionLine: 'Ex-LLM/Software Engineer',
  introLine1: 'Building products that bridge the gap between cutting-edge technology and real user needs.',
  introLine2: 'I specialize in turning complex technical capabilities into intuitive, impactful solutions.',
  ctas: [
    { id: 'projects', label: 'View Projects', visible: true, actionType: 'internal', target: '/projects', variant: 'primary' },
    { id: 'resume', label: 'Download Resume', visible: true, actionType: 'internal', target: '/resume', variant: 'secondary' },
  ]
};

function renderCTA(cta: ButtonConfig, index: number) {
  if (!cta.visible) return null;
  
  const getIcon = () => {
    switch (cta.actionType) {
      case 'external':
        return <ExternalLink className="w-4 h-4" />;
      case 'download':
        return <Download className="w-4 h-4" />;
      case 'mailto':
        return <Mail className="w-4 h-4" />;
      case 'scroll':
        return <ArrowDown className="w-4 h-4" />;
      default:
        return <ArrowRight className="w-4 h-4" />;
    }
  };

  const variant = cta.variant === 'primary' ? 'default' : 
                  cta.variant === 'secondary' ? 'outline' : 
                  cta.variant === 'ghost' ? 'ghost' : 'outline';

  // External link
  if (cta.actionType === 'external') {
    return (
      <Button key={cta.id || index} asChild variant={variant} size="lg">
        <a href={cta.target} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
          {cta.label}
          {getIcon()}
        </a>
      </Button>
    );
  }

  // Mailto
  if (cta.actionType === 'mailto') {
    return (
      <Button key={cta.id || index} asChild variant={variant} size="lg">
        <a href={`mailto:${cta.target}`} className="flex items-center gap-2">
          {getIcon()}
          {cta.label}
        </a>
      </Button>
    );
  }

  // Download
  if (cta.actionType === 'download') {
    return (
      <Button key={cta.id || index} asChild variant={variant} size="lg">
        <a href={cta.target} download className="flex items-center gap-2">
          {getIcon()}
          {cta.label}
        </a>
      </Button>
    );
  }

  // Scroll
  if (cta.actionType === 'scroll') {
    return (
      <Button 
        key={cta.id || index} 
        variant={variant} 
        size="lg"
        onClick={() => {
          const element = document.getElementById(cta.target);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }}
        className="flex items-center gap-2"
      >
        {cta.label}
        {getIcon()}
      </Button>
    );
  }

  // Internal link (default)
  return (
    <Button key={cta.id || index} asChild variant={variant} size="lg">
      <Link to={cta.target} className="flex items-center gap-2">
        {cta.label}
        {getIcon()}
      </Link>
    </Button>
  );
}

export function HeroSection({
  config,
  name,
  tagline,
  description,
  resumeUrl
}: HeroSectionProps) {
  // Merge config with legacy props
  const heroConfig: HeroConfig = config || {
    name: name || defaultConfig.name,
    role: tagline || defaultConfig.role,
    transitionLine: defaultConfig.transitionLine,
    introLine1: description || defaultConfig.introLine1,
    introLine2: defaultConfig.introLine2,
    ctas: defaultConfig.ctas.map(cta => 
      cta.id === 'resume' && resumeUrl ? { ...cta, target: resumeUrl } : cta
    )
  };

  const fullDescription = heroConfig.introLine2 
    ? `${heroConfig.introLine1} ${heroConfig.introLine2}`
    : heroConfig.introLine1;

  return (
    <section className="section-spacing" id="hero">
      <div className="container-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          {/* Role/Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-medium text-primary mb-4 tracking-wide uppercase"
          >
            {heroConfig.role}
          </motion.p>

          {/* Headline */}
          <h1 className="mb-4 text-balance">
            {(heroConfig.showGreeting !== false) && (
              <>{heroConfig.greetingText || "Hi, I'm"} </>
            )}
            <span className="text-primary">{heroConfig.name}</span>
          </h1>

          {/* Transition Line (optional) */}
          {heroConfig.transitionLine && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-medium text-muted-foreground mb-2"
            >
              {heroConfig.transitionLine}
            </motion.p>
          )}

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed"
          >
            {fullDescription}
          </motion.p>

          {/* Badges (optional) */}
          {heroConfig.badges && heroConfig.badges.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap gap-2 mb-8"
            >
              {heroConfig.badges.map((badge, i) => (
                <span 
                  key={i}
                  className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded-full"
                >
                  {badge}
                </span>
              ))}
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {heroConfig.ctas.map((cta, i) => renderCTA(cta, i))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
