// ============= PRONTI - Gestão de Planos =============

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Plus,
  Users,
  FileText,
  Zap,
  Check,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlanFeature {
  key: string;
  label: string;
  enabled: boolean;
}

interface Plan {
  id: string;
  nome: string;
  tier: 'gratuito' | 'essencial' | 'profissional' | 'clinica';
  valor: number;
  limites: {
    maxPacientes: number | null;
    maxProntuarios: number | null;
    maxUsuarios: number;
  };
  recursos: PlanFeature[];
  ativo: boolean;
  assinantes: number;
}

// Mock data
const initialPlans: Plan[] = [
  {
    id: 'plan-1',
    nome: 'Gratuito',
    tier: 'gratuito',
    valor: 0,
    limites: { maxPacientes: 10, maxProntuarios: 10, maxUsuarios: 1 },
    recursos: [
      { key: 'agenda', label: 'Agenda Básica', enabled: true },
      { key: 'prontuario', label: 'Prontuário Básico', enabled: true },
      { key: 'whatsapp', label: 'WhatsApp Automático', enabled: false },
      { key: 'relatorios', label: 'Relatórios Avançados', enabled: false },
      { key: 'backup', label: 'Backup Avançado', enabled: false },
    ],
    ativo: true,
    assinantes: 45,
  },
  {
    id: 'plan-2',
    nome: 'Essencial',
    tier: 'essencial',
    valor: 49.90,
    limites: { maxPacientes: 50, maxProntuarios: 100, maxUsuarios: 1 },
    recursos: [
      { key: 'agenda', label: 'Agenda Completa', enabled: true },
      { key: 'prontuario', label: 'Prontuário Completo', enabled: true },
      { key: 'financeiro', label: 'Financeiro Simples', enabled: true },
      { key: 'whatsapp', label: 'WhatsApp Manual', enabled: true },
      { key: 'relatorios', label: 'Relatórios Avançados', enabled: false },
    ],
    ativo: true,
    assinantes: 120,
  },
  {
    id: 'plan-3',
    nome: 'Profissional',
    tier: 'profissional',
    valor: 99.90,
    limites: { maxPacientes: 300, maxProntuarios: null, maxUsuarios: 1 },
    recursos: [
      { key: 'agenda', label: 'Agenda Completa', enabled: true },
      { key: 'prontuario', label: 'Prontuário Ilimitado', enabled: true },
      { key: 'financeiro', label: 'Financeiro Completo', enabled: true },
      { key: 'whatsapp', label: 'WhatsApp Automático', enabled: true },
      { key: 'relatorios', label: 'Relatórios PDF', enabled: true },
      { key: 'backup', label: 'Backup Avançado', enabled: true },
    ],
    ativo: true,
    assinantes: 85,
  },
  {
    id: 'plan-4',
    nome: 'Clínica',
    tier: 'clinica',
    valor: 199.90,
    limites: { maxPacientes: null, maxProntuarios: null, maxUsuarios: 10 },
    recursos: [
      { key: 'agenda', label: 'Agenda Completa', enabled: true },
      { key: 'prontuario', label: 'Prontuário Ilimitado', enabled: true },
      { key: 'financeiro', label: 'Financeiro Consolidado', enabled: true },
      { key: 'whatsapp', label: 'WhatsApp Automático', enabled: true },
      { key: 'relatorios', label: 'Relatórios por Profissional', enabled: true },
      { key: 'backup', label: 'Backup Avançado', enabled: true },
      { key: 'rbac', label: 'Controle de Permissões', enabled: true },
      { key: 'multiusuario', label: 'Multi-profissional', enabled: true },
    ],
    ativo: true,
    assinantes: 28,
  },
];

const tierColors = {
  gratuito: 'bg-muted text-muted-foreground',
  essencial: 'bg-primary/10 text-primary',
  profissional: 'bg-success/10 text-success',
  clinica: 'bg-warning/10 text-warning',
};

export function PlanManagement() {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const totalAssinantes = useMemo(() => 
    plans.reduce((acc, plan) => acc + plan.assinantes, 0),
    [plans]
  );

  const totalMRR = useMemo(() => 
    plans.reduce((acc, plan) => acc + (plan.valor * plan.assinantes), 0),
    [plans]
  );

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setDialogOpen(true);
  };

  const handleSavePlan = () => {
    if (!editingPlan) return;
    
    setPlans(prev => 
      prev.map(p => p.id === editingPlan.id ? editingPlan : p)
    );
    
    toast({
      title: 'Plano atualizado',
      description: `O plano "${editingPlan.nome}" foi atualizado com sucesso.`,
    });
    
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
                <Badge className={tierColors[plan.tier]}>
                  {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEditPlan(plan)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
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
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Altere as configurações do plano "{editingPlan?.nome}"
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
                <Label>Recursos Habilitados</Label>
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
    </div>
  );
}
