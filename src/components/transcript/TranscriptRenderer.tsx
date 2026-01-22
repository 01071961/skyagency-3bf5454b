import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Award, Calendar, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface TranscriptRendererProps {
  productId?: string;
  showDownload?: boolean;
}

interface ModuleHistory {
  id: string;
  modulo_id: string;
  media_final: number | null;
  situacao: string;
  conceito: string | null;
  frequencia: number | null;
  module: {
    name: string;
    duration_hours: number | null;
  } | null;
}

interface TranscriptTemplate {
  id: string;
  name: string;
  layout: {
    style?: 'academic' | 'compact' | 'corporate';
    showModuleDetails?: boolean;
    showGrades?: boolean;
    showFrequency?: boolean;
  };
}

export function TranscriptRenderer({ productId, showDownload = true }: TranscriptRendererProps) {
  const { user } = useAuth();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', user?.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch company settings with template
  const { data: company } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('*, transcript_template:transcript_templates(*)')
        .limit(1)
        .maybeSingle();
      return data;
    }
  });

  // Fetch module history
  const { data: history, isLoading } = useQuery({
    queryKey: ['historico-modulos', user?.id, productId],
    queryFn: async () => {
      let query = supabase
        .from('historico_modulos')
        .select(`
          id,
          modulo_id,
          media_final,
          situacao,
          conceito,
          frequencia,
          module:product_modules(name, duration_hours)
        `)
        .eq('user_id', user?.id);
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as ModuleHistory[];
    },
    enabled: !!user?.id
  });

  // Calculate overall metrics
  const calculateMetrics = () => {
    if (!history || history.length === 0) return null;

    const completed = history.filter(h => h.situacao === 'aprovado');
    const totalHours = history.reduce((acc, h) => acc + (h.module?.duration_hours || 0), 0);
    const avgGrade = history.filter(h => h.media_final).reduce((acc, h, _, arr) => 
      acc + (h.media_final || 0) / arr.length, 0);
    const avgFrequency = history.filter(h => h.frequencia).reduce((acc, h, _, arr) => 
      acc + (h.frequencia || 0) / arr.length, 0);

    return {
      totalModules: history.length,
      completedModules: completed.length,
      totalHours,
      avgGrade: avgGrade.toFixed(1),
      avgFrequency: avgFrequency.toFixed(0)
    };
  };

  const metrics = calculateMetrics();
  const template = (company as any)?.transcript_template as TranscriptTemplate | null;
  const templateLayout = template?.layout || { style: 'academic', showModuleDetails: true, showGrades: true, showFrequency: true };

  // Generate PDF transcript
  const downloadTranscript = async () => {
    if (!history || !profile) {
      toast.error('Dados incompletos');
      return;
    }

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(company?.company_name || 'SKY Brasil Academy', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('HISTÓRICO ESCOLAR', pageWidth / 2, 30, { align: 'center' });

      // Student info
      doc.setFontSize(10);
      let yPos = 45;
      doc.text(`Aluno: ${profile.name}`, 20, yPos);
      yPos += 6;
      doc.text(`Email: ${profile.email}`, 20, yPos);
      yPos += 6;
      doc.text(`Data de emissão: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 20, yPos);

      // Table header
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
      doc.text('Módulo', 20, yPos);
      if (templateLayout.showGrades) {
        doc.text('Nota', 130, yPos);
      }
      doc.text('Conceito', 150, yPos);
      doc.text('Situação', 175, yPos);

      // Table rows
      doc.setFont('helvetica', 'normal');
      yPos += 10;

      history.forEach((item) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(item.module?.name || 'Módulo', 20, yPos, { maxWidth: 100 });
        if (templateLayout.showGrades && item.media_final !== null) {
          doc.text(item.media_final.toFixed(1), 130, yPos);
        }
        doc.text(item.conceito || '-', 150, yPos);
        doc.text(item.situacao === 'aprovado' ? 'Aprovado' : 'Cursando', 175, yPos);
        yPos += 8;
      });

      // Summary
      if (metrics) {
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMO', 20, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 8;
        doc.text(`Total de módulos: ${metrics.totalModules}`, 20, yPos);
        yPos += 6;
        doc.text(`Módulos concluídos: ${metrics.completedModules}`, 20, yPos);
        yPos += 6;
        doc.text(`Carga horária total: ${metrics.totalHours}h`, 20, yPos);
        yPos += 6;
        if (templateLayout.showGrades) {
          doc.text(`Média geral: ${metrics.avgGrade}`, 20, yPos);
          yPos += 6;
        }
        if (templateLayout.showFrequency) {
          doc.text(`Frequência média: ${metrics.avgFrequency}%`, 20, yPos);
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        'Documento gerado eletronicamente - Verificação disponível no portal do aluno',
        pageWidth / 2, 
        285, 
        { align: 'center' }
      );

      doc.save(`historico-escolar-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Histórico baixado!');
    } catch (error) {
      console.error('Error generating transcript:', error);
      toast.error('Erro ao gerar histórico');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Sem histórico disponível</h3>
          <p className="text-sm text-muted-foreground">
            Complete módulos para visualizar seu histórico escolar
          </p>
        </CardContent>
      </Card>
    );
  }

  const getSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Aprovado</Badge>;
      case 'reprovado':
        return <Badge variant="destructive">Reprovado</Badge>;
      default:
        return <Badge variant="secondary">Cursando</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Histórico Escolar
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Seu desempenho acadêmico completo
          </p>
        </div>
        {showDownload && (
          <Button onClick={downloadTranscript} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Summary */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{metrics.totalModules}</div>
              <div className="text-xs text-muted-foreground">Módulos</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{metrics.completedModules}</div>
              <div className="text-xs text-muted-foreground">Concluídos</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{metrics.totalHours}h</div>
              <div className="text-xs text-muted-foreground">Carga Horária</div>
            </div>
            {templateLayout.showGrades && (
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{metrics.avgGrade}</div>
                <div className="text-xs text-muted-foreground">Média Geral</div>
              </div>
            )}
            {templateLayout.showFrequency && (
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{metrics.avgFrequency}%</div>
                <div className="text-xs text-muted-foreground">Frequência</div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Module List */}
        <div className="space-y-3">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium">{item.module?.name || 'Módulo'}</div>
                {templateLayout.showModuleDetails && item.module?.duration_hours && (
                  <div className="text-xs text-muted-foreground">
                    {item.module.duration_hours}h de carga horária
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                {templateLayout.showGrades && item.media_final !== null && (
                  <div className="text-right">
                    <div className="font-bold">{item.media_final.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Nota</div>
                  </div>
                )}
                {item.conceito && (
                  <div className="text-center">
                    <Badge variant="outline" className="font-bold">
                      {item.conceito}
                    </Badge>
                  </div>
                )}
                {getSituacaoBadge(item.situacao)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
