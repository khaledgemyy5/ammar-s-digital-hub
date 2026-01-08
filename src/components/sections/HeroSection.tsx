import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';

interface HeroSectionProps {
  name?: string;
  tagline?: string;
  description?: string;
  resumeUrl?: string;
}

export function HeroSection({
  name = 'Ammar Jaber',
  tagline = 'Technical Product Manager',
  description = 'Ex-LLM/Software Engineer building products that bridge the gap between cutting-edge technology and real user needs. I specialize in turning complex technical capabilities into intuitive, impactful solutions.',
  resumeUrl = '/resume'
}: HeroSectionProps) {
  return (
    <section className="section-spacing">
      <div className="container-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          {/* Name */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-medium text-primary mb-4 tracking-wide uppercase"
          >
            {tagline}
          </motion.p>

          {/* Headline */}
          <h1 className="mb-6 text-balance">
            Hi, I'm <span className="text-primary">{name}</span>
          </h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed"
          >
            {description}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button asChild size="lg">
              <Link to="/projects" className="flex items-center gap-2">
                View Projects
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to={resumeUrl} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Resume
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
