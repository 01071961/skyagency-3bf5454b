import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Shield, CheckCircle2, AlertTriangle, XCircle, FileCheck,
  Scale, BookOpen, Users, Clock, TrendingUp, Lock, Eye,
  FileText, RefreshCw, Download, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

// Compliance rules based on CVM and ANCORD regulations
const COMPLIANCE_RULES = [
  {
    id: 'content_accuracy',
    category: 'Conteúdo',
    name: 'Precisão do Conteúdo',
    description: 'Todo conteúdo deve estar atualizado com as regulamentações vigentes da CVM',
    regulation: 'ICVM 558/2015',
    severity: 'high',
  },
  {
    id: 'instructor_certification',
    category: 'Instrutores',
    name: 'Certificação de Instrutores',
    description: 'Instrutores devem possuir as certificações que ensinam',
    regulation: 'ANCORD',
    severity: 'high',
  },
  {
    id: 'student_records',
    category: 'Registros',
    name: 'Registros de Alunos',
    description: 'Manter registros completos de progresso e certificações',
    regulation: 'CVM',
    severity: 'medium',
  },
  {
    id: 'exam_integrity',
    category: 'Simulados',
    name: 'Integridade de Exames',
    description: 'Garantir segurança e validade das avaliações',
    regulation: 'ANCORD',
    severity: 'high',
  },
  {
    id: 'data_protection',
    category: 'Dados',
    name: 'Proteção de Dados',
    description: 'Conformidade com LGPD para dados de alunos',
    regulation: 'LGPD',
    severity: 'high',
  },
  {
    id: 'content_updates',
    category: 'Conteúdo',
    name: 'Atualização Regular',
    description: 'Conteúdo deve ser revisado quando houver mudanças regulatórias',
    regulation: 'CVM',
    severity: 'medium',
  },
  {
    id: 'accessibility',
    category: 'Acessibilidade',
    name: 'Acessibilidade',
    description: 'Plataforma deve ser acessível a pessoas com deficiência',
    regulation: 'Lei 13.146/2015',
    severity: 'medium',
  },
  {
    id: 'conflict_interest',
    category: 'Ética',
    name: 'Conflito de Interesses',
    description: 'Declarar e gerenciar potenciais conflitos de interesse',
    regulation: 'ICVM 558/2015',
    severity: 'high',
  },
];

const SEVERITY_COLORS = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

interface ComplianceCheck {
  id: string;
  rule_id: string;
  status: 'compliant' | 'review_needed' | 'non_compliant' | 'pending';
  notes: string | null;
  checked_by: string | null;
  checked_at: string | null;
  created_at: string;
}

export default function ComplianceManager() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedRule, setSelectedRule] = useState<typeof COMPLIANCE_RULES[0] | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'review_content' | 'verify_instructors' | 'audit_lgpd' | 'update_norms' | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: 'compliant' as 'compliant' | 'review_needed' | 'non_compliant',
    notes: ''
  });

  // Fetch compliance checks from database using raw query to avoid type issues
  const { data: complianceChecks, isLoading } = useQuery({
    queryKey: ['compliance-checks'],
    queryFn: async () => {
      try {
        // Use raw fetch to avoid TypeScript issues with new table
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/compliance_checks?select=*&order=checked_at.desc`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            }
          }
        );
        
        if (!response.ok) {
          console.log('Compliance checks not found, using defaults');
          return [];
        }
        
        const data = await response.json();
        return data as ComplianceCheck[];
      } catch (error) {
        console.log('Error fetching compliance checks:', error);
        return [];
      }
    }
  });

  // Get compliance status for a rule
  const getComplianceStatus = (ruleId: string) => {
    const check = complianceChecks?.find(c => c.rule_id === ruleId);
    if (check) {
      return {
        status: check.status,
        lastCheck: check.checked_at,
        notes: check.notes
      };
    }
    // Default status if no check exists
    return {
      status: 'pending' as const,
      lastCheck: null,
      notes: null
    };
  };

  // Update compliance status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ruleId, status, notes }: { ruleId: string; status: string; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/compliance_checks`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            rule_id: ruleId,
            status,
            notes,
            checked_by: user?.id,
            checked_at: new Date().toISOString(),
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to update compliance status');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-checks'] });
      toast.success('Status de compliance atualizado!');
      setSelectedRule(null);
      setUpdateForm({ status: 'compliant', notes: '' });
    },
    onError: (error) => {
      console.error('Error updating compliance:', error);
      toast.error('Erro ao atualizar status');
    }
  });

  // Calculate stats
  const stats = {
    total: COMPLIANCE_RULES.length,
    compliant: COMPLIANCE_RULES.filter(r => getComplianceStatus(r.id).status === 'compliant').length,
    review: COMPLIANCE_RULES.filter(r => getComplianceStatus(r.id).status === 'review_needed').length,
    nonCompliant: COMPLIANCE_RULES.filter(r => getComplianceStatus(r.id).status === 'non_compliant').length,
    pending: COMPLIANCE_RULES.filter(r => getComplianceStatus(r.id).status === 'pending').length,
  };

  const complianceScore = stats.total > 0 
    ? Math.round((stats.compliant / stats.total) * 100) 
    : 0;

  const categories = ['all', ...new Set(COMPLIANCE_RULES.map(r => r.category))];

  const filteredRules = activeCategory === 'all' 
    ? COMPLIANCE_RULES 
    : COMPLIANCE_RULES.filter(r => r.category === activeCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'review_needed':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'non_compliant':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'Em Conformidade';
      case 'review_needed':
        return 'Revisão Necessária';
      case 'non_compliant':
        return 'Não Conforme';
      default:
        return 'Pendente';
    }
  };

  // Quick action handlers
  const handleQuickAction = async (type: 'review_content' | 'verify_instructors' | 'audit_lgpd' | 'update_norms') => {
    setActionType(type);
    setActionDialogOpen(true);
  };

  const executeQuickAction = async () => {
    if (!actionType) return;
    
    setActionDialogOpen(false);
    
    const actionConfig = {
      review_content: {
        ruleIds: ['content_accuracy', 'content_updates'],
        message: 'Revisão de conteúdos iniciada'
      },
      verify_instructors: {
        ruleIds: ['instructor_certification'],
        message: 'Verificação de instrutores iniciada'
      },
      audit_lgpd: {
        ruleIds: ['data_protection'],
        message: 'Auditoria LGPD iniciada'
      },
      update_norms: {
        ruleIds: ['content_accuracy', 'content_updates', 'exam_integrity'],
        message: 'Atualização de normas iniciada'
      }
    };

    const config = actionConfig[actionType];
    toast.info(config.message);
    
    // Mark related rules as under review
    for (const ruleId of config.ruleIds) {
      await updateStatusMutation.mutateAsync({
        ruleId,
        status: 'review_needed',
        notes: `Verificação iniciada em ${new Date().toLocaleDateString('pt-BR')}`
      });
    }
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    
    try {
      // Generate report content
      const report = {
        generatedAt: new Date().toISOString(),
        complianceScore,
        stats,
        rules: COMPLIANCE_RULES.map(rule => ({
          ...rule,
          ...getComplianceStatus(rule.id)
        }))
      };
      
      // Create downloadable file
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Relatório de compliance gerado com sucesso!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Compliance CVM/ANCORD
          </h2>
          <p className="text-muted-foreground">
            Gestão de conformidade regulatória para educação financeira
          </p>
        </div>
        
        <Button onClick={generateReport} disabled={isGeneratingReport}>
          {isGeneratingReport ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileCheck className="w-4 h-4 mr-2" />
          )}
          Gerar Relatório
        </Button>
      </div>

      {/* Compliance Score */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${complianceScore * 3.52} 352`}
                  className={complianceScore >= 80 ? 'text-green-500' : complianceScore >= 60 ? 'text-yellow-500' : 'text-red-500'}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{complianceScore}%</span>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">Score de Compliance</h3>
              <p className="text-muted-foreground mb-4">
                {complianceScore >= 80 
                  ? 'Excelente! Sua plataforma está em conformidade.'
                  : complianceScore >= 60
                  ? 'Atenção: Alguns itens precisam de revisão.'
                  : stats.pending > 0
                  ? 'Inicie a verificação dos itens pendentes.'
                  : 'Alerta: Ação imediata necessária para conformidade.'}
              </p>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-600">{stats.compliant}</p>
                  <p className="text-xs text-muted-foreground">Conformes</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-yellow-600">{stats.review}</p>
                  <p className="text-xs text-muted-foreground">Em Revisão</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-600">{stats.nonCompliant}</p>
                  <p className="text-xs text-muted-foreground">Não Conformes</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-600">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'all' ? 'Todos' : cat}
          </Button>
        ))}
      </div>

      {/* Compliance Rules */}
      <div className="grid gap-4">
        {filteredRules.map((rule, index) => {
          const status = getComplianceStatus(rule.id);
          
          return (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(status.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {rule.regulation}
                          </Badge>
                          <Badge className={SEVERITY_COLORS[rule.severity as keyof typeof SEVERITY_COLORS]}>
                            {rule.severity === 'high' ? 'Alta' : rule.severity === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Categoria: {rule.category}</span>
                          {status.lastCheck && (
                            <span>
                              Última verificação: {new Date(status.lastCheck).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        {status.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Nota: {status.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline"
                        className={
                          status.status === 'compliant' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : status.status === 'review_needed'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : status.status === 'non_compliant'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }
                      >
                        {getStatusLabel(status.status)}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedRule(rule);
                          setUpdateForm({
                            status: status.status === 'pending' ? 'compliant' : status.status as any,
                            notes: status.notes || ''
                          });
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Revisar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          <CardDescription>Execute verificações automáticas de compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => handleQuickAction('review_content')}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Revisar Conteúdos</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => handleQuickAction('verify_instructors')}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Verificar Instrutores</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => handleQuickAction('audit_lgpd')}
            >
              <Lock className="w-5 h-5" />
              <span className="text-xs">Auditoria LGPD</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => handleQuickAction('update_norms')}
            >
              <Scale className="w-5 h-5" />
              <span className="text-xs">Atualizar Normas</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={!!selectedRule} onOpenChange={(open) => !open && setSelectedRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar Compliance</DialogTitle>
            <DialogDescription>
              {selectedRule?.name} - {selectedRule?.regulation}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select 
                value={updateForm.status} 
                onValueChange={(v) => setUpdateForm(prev => ({ ...prev, status: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliant">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Em Conformidade
                    </div>
                  </SelectItem>
                  <SelectItem value="review_needed">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      Revisão Necessária
                    </div>
                  </SelectItem>
                  <SelectItem value="non_compliant">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Não Conforme
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Notas</Label>
              <Textarea
                value={updateForm.notes}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Adicione observações sobre esta verificação..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRule(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedRule && updateStatusMutation.mutate({
                ruleId: selectedRule.id,
                status: updateForm.status,
                notes: updateForm.notes
              })}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
            <DialogDescription>
              {actionType === 'review_content' && 'Iniciar revisão de todos os conteúdos educacionais?'}
              {actionType === 'verify_instructors' && 'Iniciar verificação das certificações dos instrutores?'}
              {actionType === 'audit_lgpd' && 'Iniciar auditoria de proteção de dados (LGPD)?'}
              {actionType === 'update_norms' && 'Iniciar atualização das normas regulatórias?'}
            </DialogDescription>
          </DialogHeader>
          
          <p className="text-sm text-muted-foreground">
            Os itens relacionados serão marcados como "Em Revisão" até que a verificação seja concluída.
          </p>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={executeQuickAction}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}