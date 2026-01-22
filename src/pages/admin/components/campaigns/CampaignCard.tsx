import { motion } from 'framer-motion';
import { 
  Send, Eye, Edit2, Trash2, MoreHorizontal, 
  TrendingUp, Users, MousePointer, BarChart3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
}

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
  onPreview: (html: string) => void;
}

const CampaignCard = ({ campaign, onEdit, onDelete, onPreview }: CampaignCardProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return { 
          label: 'Rascunho', 
          className: 'bg-muted/50 text-muted-foreground border-muted-foreground/30',
          dot: 'bg-muted-foreground'
        };
      case 'scheduled':
        return { 
          label: 'Agendada', 
          className: 'bg-secondary/10 text-secondary border-secondary/30',
          dot: 'bg-secondary'
        };
      case 'sending':
        return { 
          label: 'Enviando', 
          className: 'bg-accent/10 text-accent border-accent/30',
          dot: 'bg-accent animate-pulse'
        };
      case 'sent':
        return { 
          label: 'Enviada', 
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400'
        };
      case 'failed':
        return { 
          label: 'Falhou', 
          className: 'bg-destructive/10 text-destructive border-destructive/30',
          dot: 'bg-destructive'
        };
      default:
        return { 
          label: status, 
          className: 'bg-muted/50 text-muted-foreground',
          dot: 'bg-muted-foreground'
        };
    }
  };

  const getDeliveryRate = () => {
    if (campaign.total_recipients === 0) return 0;
    return Math.round((campaign.sent_count / campaign.total_recipients) * 100);
  };

  const getOpenRate = () => {
    if (campaign.sent_count === 0) return 0;
    return Math.round((campaign.opened_count / campaign.sent_count) * 100);
  };

  const getClickRate = () => {
    if (campaign.opened_count === 0) return 0;
    return Math.round((campaign.clicked_count / campaign.opened_count) * 100);
  };

  const statusConfig = getStatusConfig(campaign.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 mr-4">
              <h3 className="font-semibold text-foreground truncate mb-1">
                {campaign.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {campaign.subject}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusConfig.className}>
                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${statusConfig.dot}`} />
                {statusConfig.label}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem onClick={() => onEdit(campaign)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPreview(campaign.subject)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    onClick={() => onDelete(campaign.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats Grid */}
          {campaign.status === 'sent' && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Users className="w-3 h-3" />
                </div>
                <p className="text-lg font-bold text-foreground">{campaign.sent_count}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Enviados</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Eye className="w-3 h-3" />
                </div>
                <p className="text-lg font-bold text-secondary">{getOpenRate()}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Aberturas</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <MousePointer className="w-3 h-3" />
                </div>
                <p className="text-lg font-bold text-primary">{getClickRate()}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cliques</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <TrendingUp className="w-3 h-3" />
                </div>
                <p className="text-lg font-bold text-accent">{getDeliveryRate()}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entrega</p>
              </div>
            </div>
          )}

          {/* Progress bar for delivery */}
          {campaign.status === 'sent' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Taxa de entrega</span>
                <span>{getDeliveryRate()}%</span>
              </div>
              <Progress value={getDeliveryRate()} className="h-1.5 bg-muted/50" />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
            <span>
              {campaign.sent_at 
                ? `Enviada em ${format(new Date(campaign.sent_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}`
                : `Criada em ${format(new Date(campaign.created_at), "dd 'de' MMM", { locale: ptBR })}`
              }
            </span>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{campaign.total_recipients} destinatários</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CampaignCard;
