'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, XCircle, AlertCircle, 
  FileText, DollarSign, Package, Globe, Users, Image,
  Video, Tag, Shield, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewChecklistProps {
  data: {
    name?: string;
    shortDescription?: string;
    description?: string;
    coverImage?: string;
    price?: number;
    pricingType?: string;
    productType?: string;
    tags?: string[];
    guaranteeDays?: number;
    affiliateEnabled?: boolean;
    commissionRate?: number;
    salesPagePublished?: boolean;
    trailerUrl?: string;
  };
  className?: string;
}

interface CheckItem {
  id: string;
  label: string;
  category: string;
  icon: React.ElementType;
  status: 'complete' | 'warning' | 'missing';
  tip?: string;
}

export function ReviewChecklist({ data, className }: ReviewChecklistProps) {
  const checks = useMemo<CheckItem[]>(() => {
    return [
      // Basic Info
      {
        id: 'name',
        label: 'Nome do produto',
        category: 'Básico',
        icon: FileText,
        status: data.name && data.name.length >= 3 ? 'complete' : 'missing',
        tip: 'Nome deve ter pelo menos 3 caracteres'
      },
      {
        id: 'description',
        label: 'Descrição curta',
        category: 'Básico',
        icon: FileText,
        status: data.shortDescription && data.shortDescription.length >= 50 ? 'complete' : 
                data.shortDescription ? 'warning' : 'missing',
        tip: 'Descrição ideal: 50-160 caracteres'
      },
      {
        id: 'cover',
        label: 'Imagem de capa',
        category: 'Básico',
        icon: Image,
        status: data.coverImage ? 'complete' : 'warning',
        tip: 'Recomendado: 1200x630px'
      },
      {
        id: 'tags',
        label: 'Tags/palavras-chave',
        category: 'Básico',
        icon: Tag,
        status: data.tags && data.tags.length >= 2 ? 'complete' : 'warning',
        tip: 'Adicione 2-5 tags relevantes'
      },
      // Pricing
      {
        id: 'price',
        label: 'Preço definido',
        category: 'Preço',
        icon: DollarSign,
        status: data.pricingType === 'free' || (data.price && data.price > 0) ? 'complete' : 'missing',
        tip: 'Configure o preço ou marque como gratuito'
      },
      {
        id: 'guarantee',
        label: 'Garantia configurada',
        category: 'Preço',
        icon: Shield,
        status: data.guaranteeDays && data.guaranteeDays > 0 ? 'complete' : 'warning',
        tip: 'Garantia aumenta conversão'
      },
      // Content
      {
        id: 'trailer',
        label: 'Vídeo de apresentação',
        category: 'Conteúdo',
        icon: Video,
        status: data.trailerUrl ? 'complete' : 'warning',
        tip: 'Vídeos aumentam conversão em até 80%'
      },
      // Sales Page
      {
        id: 'salespage',
        label: 'Página de vendas publicada',
        category: 'Vendas',
        icon: Globe,
        status: data.salesPagePublished ? 'complete' : 'warning',
        tip: 'Publique para aceitar vendas'
      },
      // Affiliates
      {
        id: 'affiliates',
        label: 'Programa de afiliados',
        category: 'Afiliados',
        icon: Users,
        status: data.affiliateEnabled ? 'complete' : 'warning',
        tip: 'Afiliados podem triplicar suas vendas'
      },
    ];
  }, [data]);

  const stats = useMemo(() => {
    const complete = checks.filter(c => c.status === 'complete').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const missing = checks.filter(c => c.status === 'missing').length;
    const percent = Math.round((complete / checks.length) * 100);
    
    return { complete, warnings, missing, total: checks.length, percent };
  }, [checks]);

  const statusIcon = (status: CheckItem['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'missing':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const categories = useMemo(() => {
    const grouped: Record<string, CheckItem[]> = {};
    checks.forEach(check => {
      if (!grouped[check.category]) grouped[check.category] = [];
      grouped[check.category].push(check);
    });
    return grouped;
  }, [checks]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            Checklist de Publicação
          </CardTitle>
          <Badge 
            variant={stats.percent >= 80 ? 'default' : stats.percent >= 50 ? 'secondary' : 'destructive'}
            className="text-xs"
          >
            {stats.complete}/{stats.total} completos
          </Badge>
        </div>
        <Progress value={stats.percent} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(categories).map(([category, items], catIdx) => (
          <motion.div 
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.1 }}
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded text-sm",
                    item.status === 'complete' ? 'bg-green-500/5' :
                    item.status === 'warning' ? 'bg-yellow-500/5' : 'bg-red-500/5'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3 h-3 text-muted-foreground" />
                    <span className={item.status === 'complete' ? 'text-muted-foreground' : ''}>
                      {item.label}
                    </span>
                  </div>
                  {statusIcon(item.status)}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Summary */}
        <div className="pt-3 border-t grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-green-500/10">
            <p className="text-lg font-bold text-green-500">{stats.complete}</p>
            <p className="text-[10px] text-muted-foreground">Completos</p>
          </div>
          <div className="p-2 rounded bg-yellow-500/10">
            <p className="text-lg font-bold text-yellow-500">{stats.warnings}</p>
            <p className="text-[10px] text-muted-foreground">Atenção</p>
          </div>
          <div className="p-2 rounded bg-red-500/10">
            <p className="text-lg font-bold text-red-500">{stats.missing}</p>
            <p className="text-[10px] text-muted-foreground">Pendentes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
