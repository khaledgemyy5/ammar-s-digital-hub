import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ExperienceSnapshotConfig, ExperienceItem } from '@/types/database';

interface ExperienceSnapshotProps {
  title?: string;
  config?: ExperienceSnapshotConfig;
  limit?: number;
}

const defaultExperiences: ExperienceItem[] = [
  {
    role: 'Senior Technical Product Manager',
    company: 'AI Startup',
    years: '2022 – Present',
    description: 'Leading product strategy for LLM-powered features serving 100K+ users.'
  },
  {
    role: 'Product Manager',
    company: 'Tech Company',
    years: '2020 – 2022',
    description: 'Shipped core platform features that increased engagement by 40%.'
  },
  {
    role: 'Software Engineer',
    company: 'Enterprise SaaS',
    years: '2018 – 2020',
    description: 'Built scalable backend services handling 1M+ daily requests.'
  }
];

export function ExperienceSnapshot({
  title = 'Experience Snapshot',
  config,
  limit = 3
}: ExperienceSnapshotProps) {
  const experiences = (config?.items?.length ? config.items : defaultExperiences).slice(0, limit);
  const ctaLabel = config?.ctaLabel || 'Full Resume';
  const ctaHref = config?.ctaHref || '/resume';

  return (
    <section id="experience" className="section-spacing-sm bg-secondary/30">
      <div className="container-content">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl md:text-3xl">{title}</h2>
          <Link 
            to={ctaHref} 
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border hidden md:block" />

          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-0 md:pl-8"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-2 w-2 h-2 bg-primary rounded-full hidden md:block transform -translate-x-1/2" />

                <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                  <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[120px]">
                    {exp.years}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold font-heading">
                      {exp.role}
                    </h3>
                    <p className="text-primary font-medium mb-2">{exp.company}</p>
                    <p className="text-muted-foreground">{exp.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExperienceSnapshot;
