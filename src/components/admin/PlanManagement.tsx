// ============= PRONTI - Gestão de Planos =============

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Crown,
  Edit2,
  Trash2,
  Plus,
  Users,
  FileText,
  Zap,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminStore } from '@/stores/adminStore';
import { Plan } from '@/types/admin';

const tierColors = {
  gratuito: 'bg-muted text-muted-foreground',
  essencial: 'bg-primary/10 text-primary',
  profissional: 'bg-success/10 text-success',
  clinica: 'bg-warning/10 text-warning',
  // Default fallback
  default: 'bg-slate-100 text-slate-600',
};

export function PlanManagement() {
  const { plans, fetchPlans, updatePlan, createPlan, deletePlan } = useAdminStore();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [marketingFeaturesText, setMarketingFeaturesText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const totalAssinantes = useMemo(() => 
    plans.reduce((acc, plan) => acc + plan.assinantes, 0),
    [plans]
  );

  const totalMRR = useMemo(() => 
    plans.reduce((acc, plan) => acc + (plan.valor * plan.assinantes), 0),
    [plans]
  );

  const handleEditPlan = (plan: Plan) => {
    setIsCreating(false);
    setEditingPlan({ ...plan });
    setMarketingFeaturesText(plan.marketing_features?.map(f => f.text).join('\n') || '');
    setDialogOpen(true);
  };

  const handleCreatePlanClick = () => {
    setIsCreating(true);
    setEditingPlan({
      id: '', // Placeholder
      nome: 'Novo Plano',
      tier: 'gratuito', // Default
      valor: 0,
      limites: {
        maxPacientes: 10,
        maxProntuarios: null,
        maxUsuarios: 1
      },
      recursos: [
        { key: 'agenda', label: 'Agenda', enabled: true },
        { key: 'prontuario', label: 'Prontuário', enabled: true },
        { key: 'financeiro', label: 'Financeiro', enabled: false },
        { key: 'relatorios', label: 'Relatórios', enabled: false },
        { key: 'suporte_email', label: 'Suporte por Email', enabled: false },
        { key: 'auditoria', label: 'Auditoria', enabled: false },
        { key: 'export_pdf', label: 'Exportação PDF', enabled: false },
        { key: 'financeiro_avancado', label: 'Financeiro Avançado', enabled: false },
        { key: 'relatorios_completos', label: 'Relatórios Completos', enabled: false },
        { key: 'auditoria_completa', label: 'Auditoria Completa', enabled: false },
        { key: 'suporte_prioritario', label: 'Suporte Prioritário', enabled: false },
        { key: 'relatorios_gerenciais', label: 'Relatórios Gerenciais', enabled: false },
        { key: 'api', label: 'API de Integração', enabled: false },
        { key: 'suporte_dedicado', label: 'Suporte Dedicado', enabled: false },
        { key: 'treinamento', label: 'Treinamento', enabled: false },
        { key: 'multi_usuario', label: 'Múltiplos Usuários', enabled: false },
      ],
      ativo: true,
      assinantes: 0,
      subtitle: '',
      highlighted: false,
      marketing_features: []
    });
    setMarketingFeaturesText('');
    setDialogOpen(true);
  };

  const handleDeletePlanClick = (plan: Plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    
    try {
      await deletePlan(planToDelete.id);
      toast({
        title: 'Plano excluído',
        description: `O plano "${planToDelete.nome}" foi removido com sucesso.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o plano. Verifique se existem assinantes vinculados.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    
    const marketingFeatures = marketingFeaturesText
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(text => ({
        text: text.trim(),
        included: true // Default to true
      }));

    const planToSave = {
      ...editingPlan,
      marketing_features: marketingFeatures
    };

    try {
      if (isCreating) {
        // Remove ID and assinantes for creation
        const { id, assinantes, ...createData } = planToSave;
        await createPlan(createData);
        toast({
          title: 'Plano criado',
          description: `O plano "${editingPlan.nome}" foi criado com sucesso.`,
        });
      } else {
        await updatePlan(planToSave);
        toast({
          title: 'Plano atualizado',
          description: `O plano "${editingPlan.nome}" foi atualizado com sucesso.`,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o plano.',
        variant: 'destructive',
      });
    }
    
    setDialogOpen(false);
    setEditingPlan(null);
  };

  const handleToggleFeature = (featureKey: string) => {
    if (!editingPlan) return;
    
    setEditingPlan({
      ...editingPlan,
      recursos: editingPlan.recursos.map(r => 
        r.key === featureKey ? { ...r, enabled: !r.enabled } : r
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Gestão de Planos</h2>
        <Button onClick={handleCreatePlanClick}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Planos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">planos configurados</p>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Assinantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssinantes}</div>
            <p className="text-xs text-muted-foreground">profissionais ativos</p>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">receita mensal</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className={`card-interactive relative ${!plan.ativo && 'opacity-60'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className={tierColors[plan.tier] || tierColors.default}>
                  {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeletePlanClick(plan)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                {plan.nome}
              </CardTitle>
              <CardDescription>
                {plan.valor === 0 
                  ? 'Grátis' 
                  : `R$ ${plan.valor.toFixed(2)}/mês`
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Limites */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Pacientes
                  </span>
                  <span className="font-medium">
                    {plan.limites.maxPacientes ?? '∞'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Prontuários
                  </span>
                  <span className="font-medium">
                    {plan.limites.maxProntuarios ?? '∞'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                    Usuários
                  </span>
                  <span className="font-medium">{plan.limites.maxUsuarios}</span>
                </div>
              </div>
              
              {/* Recursos */}
              <div className="space-y-1.5 pt-2 border-t">
                {plan.recursos.slice(0, 4).map((recurso) => (
                  <div key={recurso.key} className="flex items-center gap-2 text-xs">
                    {recurso.enabled ? (
                      <Check className="h-3 w-3 text-success" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={!recurso.enabled ? 'text-muted-foreground' : ''}>
                      {recurso.label}
                    </span>
                  </div>
                ))}
                {plan.recursos.length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{plan.recursos.length - 4} recursos
                  </span>
                )}
              </div>
              
              {/* Assinantes */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Assinantes</span>
                  <Badge variant="secondary">{plan.assinantes}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Novo Plano' : 'Editar Plano'}</DialogTitle>
            <DialogDescription>
              {isCreating 
                ? 'Preencha as informações para criar um novo plano.' 
                : `Altere as configurações do plano "${editingPlan?.nome}"`
              }
            </DialogDescription>
          </DialogHeader>
          
          {editingPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Plano</Label>
                  <Input
                    id="nome"
                    value={editingPlan.nome}
                    onChange={(e) => setEditingPlan({ ...editingPlan, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={editingPlan.valor}
                    onChange={(e) => setEditingPlan({ ...editingPlan, valor: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              {/* Only show tier/type for new plans, or maybe just hidden for now as it maps to type */}
              {isCreating && (
                <div className="space-y-2">
                   <Label htmlFor="tier">Identificador (Slug)</Label>
                   <Input
                     id="tier"
                     value={editingPlan.tier}
                     onChange={(e) => setEditingPlan({ ...editingPlan, tier: e.target.value.toLowerCase().replace(/\s+/g, '_') as any })}
                     placeholder="ex: novo_plano"
                   />
                   <p className="text-xs text-muted-foreground">Identificador único do sistema (sem espaços)</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxPacientes">Max Pacientes</Label>
                  <Input
                    id="maxPacientes"
                    type="number"
                    placeholder="∞"
                    value={editingPlan.limites.maxPacientes ?? ''}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      limites: {
                        ...editingPlan.limites,
                        maxPacientes: e.target.value ? parseInt(e.target.value) : null,
                      },
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxProntuarios">Max Prontuários</Label>
                  <Input
                    id="maxProntuarios"
                    type="number"
                    placeholder="∞"
                    value={editingPlan.limites.maxProntuarios ?? ''}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      limites: {
                        ...editingPlan.limites,
                        maxProntuarios: e.target.value ? parseInt(e.target.value) : null,
                      },
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsuarios">Max Usuários</Label>
                  <Input
                    id="maxUsuarios"
                    type="number"
                    value={editingPlan.limites.maxUsuarios}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      limites: {
                        ...editingPlan.limites,
                        maxUsuarios: parseInt(e.target.value) || 1,
                      },
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Informações de Marketing (Landing Page)</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtítulo</Label>
                  <Input
                    id="subtitle"
                    value={editingPlan.subtitle || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, subtitle: e.target.value })}
                    placeholder="Ex: Para conhecer, COMEÇAR, etc."
                  />
                </div>

                <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Destaque (Mais popular)</span>
                  <Switch
                    checked={editingPlan.highlighted || false}
                    onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, highlighted: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketingFeatures">Features de Marketing (uma por linha)</Label>
                  <Textarea
                    id="marketingFeatures"
                    value={marketingFeaturesText}
                    onChange={(e) => setMarketingFeaturesText(e.target.value)}
                    rows={6}
                    placeholder="Agenda básica&#10;Até 10 pacientes&#10;..."
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Recursos Habilitados (Sistema)</Label>
                <div className="space-y-2">
                  {editingPlan.recursos.map((recurso) => (
                    <div key={recurso.key} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">{recurso.label}</span>
                      <Switch
                        checked={recurso.enabled}
                        onCheckedChange={() => handleToggleFeature(recurso.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Plano Ativo</span>
                <Switch
                  checked={editingPlan.ativo}
                  onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, ativo: checked })}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Plano
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o plano "{planToDelete?.nome}"?
              Esta ação não pode ser desfeita e pode afetar usuários vinculados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
