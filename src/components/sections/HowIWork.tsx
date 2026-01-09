import { motion } from 'framer-motion';
import { BarChart3, Users, Code2, Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface WorkPrinciple {
  title: string;
  description: string;
}

interface HowIWorkConfig {
  bullets?: WorkPrinciple[];
}

interface HowIWorkProps {
  title?: string;
  config?: HowIWorkConfig;
}

const defaultPrinciples: WorkPrinciple[] = [
  {
    title: 'Data-Driven Strategy',
    description: 'I ground every product decision in data. From user research to A/B testing, evidence beats assumptions.'
  },
  {
    title: 'User-Centric Design',
    description: 'Products succeed when they solve real problems. I obsess over understanding user needs and pain points.'
  },
  {
    title: 'Engineering Fluency',
    description: 'My technical background means I can have deep conversations with engineers and make realistic tradeoffs.'
  },
  {
    title: 'Clarity Over Complexity',
    description: 'The best solutions are often the simplest. I focus on reducing complexity while maximizing impact.'
  }
];

const iconMap: LucideIcon[] = [BarChart3, Users, Code2, Lightbulb];

export function HowIWork({
  title = 'How I Work',
  config
}: HowIWorkProps) {
  const principles = config?.bullets?.length ? config.bullets : defaultPrinciples;

  return (
    <section id="how-i-work" className="section-spacing-sm bg-secondary/30">
      <div className="container-content">
        <h2 className="text-2xl md:text-3xl mb-10">{title}</h2>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {principles.map((principle, index) => {
            const Icon = iconMap[index % iconMap.length];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                  <Icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{principle.title}</h3>
                  <p className="text-muted-foreground">{principle.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowIWork;
