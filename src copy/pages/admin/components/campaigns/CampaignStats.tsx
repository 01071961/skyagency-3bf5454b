import { motion } from 'framer-motion';
import { 
  Send, Eye, MousePointer, TrendingUp, 
  FileText, Users, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsProps {
  campaigns: Array<{
    status: string;
    total_recipients: number;
    sent_count: number;
    opened_count: number;
    clicked_count: number;
  }>;
}

const CampaignStats = ({ campaigns }: StatsProps) => {
  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;
  const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;
  
  const totalSent = campaigns.reduce((acc, c) => acc + c.sent_count, 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + c.opened_count, 0);
  const totalClicked = campaigns.reduce((acc, c) => acc + c.clicked_count, 0);
  
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const avgClickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;

  const stats = [
    {
      label: 'Total de Campanhas',
      value: totalCampaigns,
      icon: FileText,
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
      trend: null,
    },
    {
      label: 'E-mails Enviados',
      value: totalSent.toLocaleString('pt-BR'),
      icon: Send,
      color: 'from-secondary/20 to-secondary/5',
      iconColor: 'text-secondary',
      trend: { value: 12, positive: true },
    },
    {
      label: 'Taxa de Abertura',
      value: `${avgOpenRate}%`,
      icon: Eye,
      color: 'from-accent/20 to-accent/5',
      iconColor: 'text-accent',
      trend: { value: 5, positive: true },
    },
    {
      label: 'Taxa de Cliques',
      value: `${avgClickRate}%`,
      icon: MousePointer,
      color: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-400',
      trend: { value: 3, positive: false },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/20 transition-colors group">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground tracking-tight">
                    {stat.value}
                  </p>
                  {stat.trend && (
                    <div className={`flex items-center gap-1 text-xs ${
                      stat.trend.positive ? 'text-emerald-400' : 'text-destructive'
                    }`}>
                      {stat.trend.positive ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      <span>{stat.trend.value}% vs mês anterior</span>
                    </div>
                  )}
                </div>
                
                <div className={`p-3 rounded-xl bg-muted/50 ${stat.iconColor}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default CampaignStats;
