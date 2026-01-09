import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, Mail, ArrowDown } from 'lucide-react';
import type { ButtonConfig } from '@/types/database';

interface DynamicButtonProps {
  config: ButtonConfig;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick?: () => void;
}

export function DynamicButton({ config, className, size = 'default', onClick }: DynamicButtonProps) {
  if (config.visible === false) return null;

  const getVariant = () => {
    switch (config.variant) {
      case 'primary':
        return 'default';
      case 'secondary':
        return 'secondary';
      case 'ghost':
        return 'ghost';
      case 'outline':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (config.actionType) {
      case 'external':
        return <ExternalLink className="w-4 h-4 ml-2" />;
      case 'download':
        return <Download className="w-4 h-4 ml-2" />;
      case 'mailto':
        return <Mail className="w-4 h-4 ml-2" />;
      case 'scroll':
        return <ArrowDown className="w-4 h-4 ml-2" />;
      default:
        return null;
    }
  };

  const handleClick = () => {
    onClick?.();
    
    if (config.actionType === 'scroll' && config.target) {
      const element = document.getElementById(config.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Mailto link
  if (config.actionType === 'mailto') {
    return (
      <Button
        variant={getVariant()}
        size={size}
        className={className}
        asChild
        onClick={handleClick}
      >
        <a href={`mailto:${config.target}`}>
          {config.label}
          {getIcon()}
        </a>
      </Button>
    );
  }

  // External link
  if (config.actionType === 'external') {
    return (
      <Button
        variant={getVariant()}
        size={size}
        className={className}
        asChild
        onClick={handleClick}
      >
        <a href={config.target} target="_blank" rel="noopener noreferrer">
          {config.label}
          {getIcon()}
        </a>
      </Button>
    );
  }

  // Download link
  if (config.actionType === 'download') {
    return (
      <Button
        variant={getVariant()}
        size={size}
        className={className}
        asChild
        onClick={handleClick}
      >
        <a href={config.target} download>
          {config.label}
          {getIcon()}
        </a>
      </Button>
    );
  }

  // Internal link
  if (config.actionType === 'internal') {
    return (
      <Button
        variant={getVariant()}
        size={size}
        className={className}
        asChild
        onClick={handleClick}
      >
        <Link to={config.target}>
          {config.label}
          {getIcon()}
        </Link>
      </Button>
    );
  }

  // Scroll or default button
  return (
    <Button
      variant={getVariant()}
      size={size}
      className={className}
      onClick={handleClick}
    >
      {config.label}
      {getIcon()}
    </Button>
  );
}
