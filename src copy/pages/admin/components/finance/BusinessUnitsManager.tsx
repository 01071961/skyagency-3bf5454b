import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Building2, Code, Award, TrendingUp, Shield, Target, 
  Heart, Users, Settings, Edit, GripVertical, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BusinessUnit {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code,
  award: Award,
  'trending-up': TrendingUp,
  shield: Shield,
  target: Target,
  'building-2': Building2,
  heart: Heart,
};

export default function BusinessUnitsManager() {
  const queryClient = useQueryClient();
  const [selectedUnit, setSelectedUnit] = useState<BusinessUnit | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch business units
  const { data: units, isLoading } = useQuery({
    queryKey: ['business-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_units')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as BusinessUnit[];
    },
  });

  // Fetch stats for each unit
  const { data: unitStats } = useQuery({
    queryKey: ['business-units-stats'],
    queryFn: async () => {
      // Simulated stats - in production, aggregate from relevant tables
      const stats: Record<string, { products: number; students: number; revenue: number }> = {
        certificacoes: { products: 12, students: 450, revenue: 125000 },
        'renda-variavel': { products: 8, students: 280, revenue: 85000 },
        'renda-fixa': { products: 5, students: 150, revenue: 45000 },
        planejamento: { products: 4, students: 120, revenue: 38000 },
        b2b: { products: 3, students: 25, revenue: 250000 },
        'impacto-social': { products: 6, students: 1200, revenue: 0 },
        tecnologia: { products: 2, students: 50, revenue: 15000 },
      };
      return stats;
    },
  });

  // Toggle unit active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('business_units')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['business-units'] });
    },
  });

  // Update unit
  const updateMutation = useMutation({
    mutationFn: async (unit: { id: string; name?: string; description?: string; color?: string; sort_order?: number }) => {
      const { id, ...updateData } = unit;
      const { error } = await supabase
        .from('business_units')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Unidade atualizada!');
      queryClient.invalidateQueries({ queryKey: ['business-units'] });
      setIsEditing(false);
      setSelectedUnit(null);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Building2;
    return IconComponent;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            Unidades de Negócio
          </h2>
          <p className="text-muted-foreground">
            Gerencie as 7 unidades independentes da plataforma Sky Brasil
          </p>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {units?.map((unit, index) => {
          const IconComponent = getIcon(unit.icon);
          const stats = unitStats?.[unit.slug];
          
          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                  !unit.is_active ? 'opacity-60' : ''
                }`}
                onClick={() => {
                  setSelectedUnit(unit);
                  setIsEditing(false);
                }}
              >
                {/* Color bar */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: unit.color }}
                />
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${unit.color}20` }}
                    >
                      <IconComponent 
                        className="w-6 h-6" 
                        style={{ color: unit.color }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={unit.is_active ? 'default' : 'secondary'}>
                        {unit.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Switch 
                        checked={unit.is_active}
                        onCheckedChange={(checked) => {
                          toggleMutation.mutate({ id: unit.id, is_active: checked });
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg mt-3">{unit.name}</CardTitle>
                  {unit.description && (
                    <CardDescription className="line-clamp-2">
                      {unit.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold">{stats?.products || 0}</p>
                      <p className="text-xs text-muted-foreground">Produtos</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold">{stats?.students || 0}</p>
                      <p className="text-xs text-muted-foreground">Alunos</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">
                        {stats?.revenue ? formatCurrency(stats.revenue).replace('R$', '') : '0'}
                      </p>
                      <p className="text-xs text-muted-foreground">Receita</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUnit(unit);
                      setIsEditing(false);
                    }}
                  >
                    Gerenciar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Unit Detail Dialog */}
      <Dialog open={!!selectedUnit} onOpenChange={() => setSelectedUnit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUnit && (
                <>
                  {(() => {
                    const IconComponent = getIcon(selectedUnit.icon);
                    return <IconComponent className="w-5 h-5" style={{ color: selectedUnit.color }} />;
                  })()}
                  {isEditing ? 'Editar ' : ''}{selectedUnit.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUnit && !isEditing && (
            <div className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">{selectedUnit.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Configurações</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Slug:</span>
                        <code className="bg-muted px-2 rounded">{selectedUnit.slug}</code>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Cor:</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: selectedUnit.color }}
                          />
                          <span>{selectedUnit.color}</span>
                        </div>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Ordem:</span>
                        <span>{selectedUnit.sort_order}</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Métricas</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Produtos:</span>
                        <span>{unitStats?.[selectedUnit.slug]?.products || 0}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Alunos:</span>
                        <span>{unitStats?.[selectedUnit.slug]?.students || 0}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Receita:</span>
                        <span className="text-green-600">
                          {formatCurrency(unitStats?.[selectedUnit.slug]?.revenue || 0)}
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedUnit(null)}>
                  Fechar
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Unidade
                </Button>
              </div>
            </div>
          )}
          
          {selectedUnit && isEditing && (
            <EditUnitForm 
              unit={selectedUnit}
              onSave={(data) => updateMutation.mutate({ id: selectedUnit.id, ...data })}
              onCancel={() => setIsEditing(false)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditUnitForm({ 
  unit, 
  onSave, 
  onCancel,
  isLoading 
}: { 
  unit: BusinessUnit; 
  onSave: (data: Partial<BusinessUnit>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    name: unit.name,
    description: unit.description || '',
    color: unit.color,
    sort_order: unit.sort_order,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome da Unidade</Label>
        <Input 
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea 
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cor (hex)</Label>
          <div className="flex gap-2">
            <Input 
              value={form.color}
              onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
            />
            <div 
              className="w-10 h-10 rounded-lg border flex-shrink-0" 
              style={{ backgroundColor: form.color }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Ordem</Label>
          <Input 
            type="number"
            min={1}
            value={form.sort_order}
            onChange={(e) => setForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 1 }))}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(form)} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
}
