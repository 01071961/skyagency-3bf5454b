import { motion } from 'framer-motion';
import { Eye, Copy, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  subject: string;
  variables: string[];
}

interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
  onPreview: () => void;
}

const TemplateCard = ({ template, onSelect, onPreview }: TemplateCardProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Onboarding':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Transacional':
        return 'bg-secondary/10 text-secondary border-secondary/30';
      case 'Marketing':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'Automação':
        return 'bg-accent/10 text-accent border-accent/30';
      case 'Engajamento':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
      case 'Comunicação':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted/50 text-muted-foreground';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/40 transition-all duration-300 cursor-pointer h-full">
        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <CardContent className="p-5 relative flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
              <template.icon className="w-5 h-5 text-primary" />
            </div>
            <Badge variant="outline" className={getCategoryColor(template.category)}>
              {template.category}
            </Badge>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2 mb-4">
            <h3 className="font-semibold text-foreground">{template.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          </div>

          {/* Variables preview */}
          <div className="flex flex-wrap gap-1 mb-4">
            {template.variables.slice(0, 3).map((variable) => (
              <span
                key={variable}
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
              >
                {`{{${variable}}}`}
              </span>
            ))}
            {template.variables.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                +{template.variables.length - 3}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Usar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TemplateCard;
