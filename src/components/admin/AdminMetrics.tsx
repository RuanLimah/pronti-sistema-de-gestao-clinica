// ============= Admin Metrics Dashboard =============

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useAuditStore } from '@/stores/auditStore';
import { useDataStore } from '@/stores/dataStore';
import { PLANOS, PlanTier } from '@/types/plans';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Shield,
  AlertTriangle,
  Crown,
} from 'lucide-react';

export function AdminMetrics() {
  const { subscriptions, doctorAddons } = useSubscriptionStore();
  const { getStats } = useAuditStore();
  const { usuarios, pacientes, atendimentos } = useDataStore();
  
  // Calcular MRR (Monthly Recurring Revenue)
  const mrr = useMemo(() => {
    const activeSubscriptions = subscriptions.filter(s => 
      s.status === 'ativa' || s.status === 'trial'
    );
    
    const subscriptionRevenue = activeSubscriptions.reduce((acc, sub) => {
      return acc + sub.plano.valor;
    }, 0);
    
    const addonRevenue = doctorAddons.filter(a => a.ativo).reduce((acc, addon) => {
      return acc + addon.addon.valor;
    }, 0);
    
    return subscriptionRevenue + addonRevenue;
  }, [subscriptions, doctorAddons]);
  
  // Distribuição de planos
  const planDistribution = useMemo(() => {
    const distribution: Record<PlanTier, number> = {
      gratuito: 0,
      essencial: 0,
      profissional: 0,
      clinica: 0,
    };
    
    subscriptions.forEach(sub => {
      if (sub.status === 'ativa' || sub.status === 'trial') {
        distribution[sub.plano.tier]++;
      }
    });
    
    return distribution;
  }, [subscriptions]);
  
  // Médicos ativos/inativos
  const doctorStats = useMemo(() => {
    const medicos = usuarios.filter(u => u.tipo === 'medico');
    const ativos = subscriptions.filter(s => s.status === 'ativa' || s.status === 'trial').length;
    const inativos = medicos.length - ativos;
    
    return { total: medicos.length, ativos, inativos };
  }, [usuarios, subscriptions]);
  
  // Trials ativos
  const trialCount = useMemo(() => {
    return subscriptions.filter(s => s.status === 'trial').length;
  }, [subscriptions]);
  
  // Estatísticas de auditoria
  const auditStats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return getStats(thirtyDaysAgo, new Date());
  }, [getStats]);
  
  // Total de pacientes e atendimentos
  const totalPacientes = pacientes.filter(p => p.status === 'ativo').length;
  const totalAtendimentos = atendimentos.filter(a => a.status === 'realizado').length;
  
  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita Mensal Recorrente
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Médicos Ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctorStats.ativos}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {doctorStats.inativos} inativos
              </Badge>
              {trialCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {trialCount} trials
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pacientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPacientes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              pacientes ativos no sistema
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atendimentos</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAtendimentos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              atendimentos realizados
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Distribuição de Planos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Distribuição de Planos
          </CardTitle>
          <CardDescription>Médicos por tipo de plano</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(Object.entries(PLANOS) as [PlanTier, typeof PLANOS[PlanTier]][]).map(([tier, plan]) => {
              const count = planDistribution[tier];
              const total = doctorStats.ativos || 1;
              const percentage = (count / total) * 100;
              
              return (
                <div key={tier} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plan.nome}</span>
                      <Badge variant={tier === 'gratuito' ? 'outline' : 'default'}>
                        {count}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      R$ {plan.valor.toFixed(2)}/mês
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Auditoria e Segurança */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Auditoria (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total de logs</span>
                <Badge variant="outline">{auditStats.totalLogs}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Acessos a dados sensíveis</span>
                <Badge variant="secondary">{auditStats.acessosDadosSensiveis}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Exportações</span>
                <Badge variant="secondary">{auditStats.exportacoesPeriodo}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-destructive">Eventos críticos</span>
                <Badge variant="destructive">{auditStats.logsCriticosPeriodo}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trialCount > 0 && (
                <div className="flex items-start gap-2 p-2 bg-warning-light rounded-lg">
                  <Calendar className="h-4 w-4 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{trialCount} trials ativos</p>
                    <p className="text-xs text-muted-foreground">
                      Acompanhe as conversões
                    </p>
                  </div>
                </div>
              )}
              
              {doctorStats.inativos > 0 && (
                <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                  <TrendingDown className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{doctorStats.inativos} médicos inativos</p>
                    <p className="text-xs text-muted-foreground">
                      Considere campanhas de reativação
                    </p>
                  </div>
                </div>
              )}
              
              {auditStats.logsCriticosPeriodo > 5 && (
                <div className="flex items-start gap-2 p-2 bg-destructive-light rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Alto volume de eventos críticos</p>
                    <p className="text-xs text-muted-foreground">
                      Verifique os logs de auditoria
                    </p>
                  </div>
                </div>
              )}
              
              {trialCount === 0 && doctorStats.inativos === 0 && auditStats.logsCriticosPeriodo <= 5 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum alerta no momento
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
