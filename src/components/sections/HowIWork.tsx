import { motion } from 'framer-motion';
import { 
  Target, Compass, Layers, Check, Sparkles, 
  Workflow, Users, BarChart3, Lightbulb, Zap,
  Brain, Rocket, Shield, Code2, Database
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { IconName, HowIWorkFullConfig, HowIWorkItem, defaultHowIWorkConfig } from '@/types/howIWork';

// Icon mapping
const ICON_MAP: Record<IconName, LucideIcon> = {
  target: Target,
  compass: Compass,
  layers: Layers,
  check: Check,
  sparkles: Sparkles,
  workflow: Workflow,
  users: Users,
  chart: BarChart3,
  lightbulb: Lightbulb,
  zap: Zap,
  brain: Brain,
  rocket: Rocket,
  shield: Shield,
  code: Code2,
  database: Database,
};

// Legacy support for old config format
interface LegacyWorkPrinciple {
  title: string;
  description: string;
}

interface LegacyHowIWorkConfig {
  bullets?: LegacyWorkPrinciple[];
}

interface HowIWorkProps {
  title?: string;
  config?: HowIWorkFullConfig | LegacyHowIWorkConfig;
}

export function HowIWork({ title = 'How I Work', config }: HowIWorkProps) {
  // Determine if we have new or legacy config
  let items: HowIWorkItem[] = [];
  
  if (config && 'items' in config && Array.isArray(config.items)) {
    // New format
    items = config.items.filter(item => item.visible).sort((a, b) => a.order - b.order);
  } else if (config && 'bullets' in config && Array.isArray(config.bullets)) {
    // Legacy format - convert to items
    const defaultIcons: IconName[] = ['chart', 'users', 'code', 'lightbulb'];
    items = config.bullets.map((bullet, idx) => ({
      id: `legacy-${idx}`,
      title: bullet.title,
      description: bullet.description,
      icon: defaultIcons[idx % defaultIcons.length],
      visible: true,
      order: idx,
    }));
  } else {
    // Use default config
    items = defaultHowIWorkConfig.items.filter(item => item.visible);
  }

  if (items.length === 0) return null;

  return (
    <section id="how-i-work" className="section-spacing-sm bg-secondary/30">
      <div className="container-content">
        <h2 className="text-2xl md:text-3xl mb-10">{title}</h2>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {items.map((item, index) => {
            const Icon = ICON_MAP[item.icon] || Lightbulb;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
                dir="auto" // Auto RTL detection for Arabic
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                  <Icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
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