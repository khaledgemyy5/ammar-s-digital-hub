import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { 
  ExperienceSnapshotFullConfig,
  ExperienceSnapshotItem 
} from '@/types/experienceSnapshot';
import { defaultExperienceSnapshotConfig } from '@/types/experienceSnapshot';

interface ExperienceSnapshotProps {
  config?: ExperienceSnapshotFullConfig;
}

export function ExperienceSnapshot({ config }: ExperienceSnapshotProps) {
  // Use provided config or defaults
  const fullConfig = config || defaultExperienceSnapshotConfig;
  
  // Filter to only enabled items
  const visibleItems = fullConfig.items.filter(item => item.enabled).slice(0, 3);
  
  // Auto-hide if section is disabled or no visible items
  if (!fullConfig.enabled || visibleItems.length === 0) {
    return null;
  }

  const { showTitle, title, cta, timelineStyle } = fullConfig;

  return (
    <section id="experience" className="section-spacing-sm bg-secondary/30">
      <div className="container-content">
        {/* Header with Title and CTA */}
        <div className="flex items-center justify-between mb-10">
          {showTitle && (
            <h2 className="text-2xl md:text-3xl">{title}</h2>
          )}
          {!showTitle && <div />}
          
          {cta.enabled && (
            <Link 
              to={cta.href} 
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              {cta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="relative">
          {/* Timeline line - conditionally rendered */}
          {timelineStyle.showTimelineLine && (
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border hidden md:block" />
          )}

          <div className="space-y-8">
            {visibleItems.map((item, index) => (
              <ExperienceItemRow
                key={item.id}
                item={item}
                index={index}
                showDot={timelineStyle.showDots}
                showLine={timelineStyle.showTimelineLine}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface ExperienceItemRowProps {
  item: ExperienceSnapshotItem;
  index: number;
  showDot: boolean;
  showLine: boolean;
}

function ExperienceItemRow({ item, index, showDot, showLine }: ExperienceItemRowProps) {
  const hasLink = item.linkEnabled && item.linkHref;

  const content = (
    <>
      <h3 className={`text-lg font-semibold font-heading ${item.highlight ? 'text-primary' : ''}`}>
        {item.roleTitle}
        {hasLink && (
          <ExternalLink className="w-3 h-3 inline ml-1 opacity-50" />
        )}
      </h3>
      <p className="text-primary font-medium mb-2">{item.orgName}</p>
      {item.blurb && (
        <p className="text-muted-foreground">{item.blurb}</p>
      )}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`relative ${showLine ? 'pl-0 md:pl-8' : ''}`}
    >
      {/* Timeline dot - conditionally rendered */}
      {showDot && showLine && (
        <div 
          className={`
            absolute left-0 top-2 w-2 h-2 rounded-full hidden md:block transform -translate-x-1/2
            ${item.highlight ? 'bg-primary ring-4 ring-primary/20' : 'bg-primary'}
          `}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
        <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[120px]">
          {item.dateRange}
        </span>
        <div className={hasLink ? 'group' : ''}>
          {hasLink ? (
            <a 
              href={item.linkHref} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity"
            >
              {content}
            </a>
          ) : (
            content
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ExperienceSnapshot;
