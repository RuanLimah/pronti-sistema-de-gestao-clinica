// ============= Componente de Limites de Uso =============

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { Users, Calendar, HardDrive, AlertTriangle, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageLimitsProps {
  showUpgrade?: boolean;
  onUpgradeClick?: () => void;
}

export function UsageLimits({ showUpgrade = true, onUpgradeClick }: UsageLimitsProps) {
  const { features, limites, subscription, isTrialActive, trialDaysRemaining } = useSubscriptionFeatures();
  
  const getLimitColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-warning';
    return 'text-success';
  };
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-primary';
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Uso do Plano</CardTitle>
            <CardDescription>
              Plano {features.planNome}
              {isTrialActive && trialDaysRemaining !== null && (
                <Badge variant="secondary" className="ml-2">
                  Trial: {trialDaysRemaining} dias restantes
                </Badge>
              )}
            </CardDescription>
          </div>
          {showUpgrade && features.planTier !== 'clinica' && (
            <Button variant="outline" size="sm" onClick={onUpgradeClick}>
              <Crown className="h-4 w-4 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pacientes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pacientes Ativos</span>
            </div>
            <span className={cn('text-sm font-medium', getLimitColor(limites.pacientes.percentual))}>
              {limites.pacientes.atual}
              {limites.pacientes.max !== null && ` / ${limites.pacientes.max}`}
              {limites.pacientes.max === null && (
                <Badge variant="outline" className="ml-2 text-xs">Ilimitado</Badge>
              )}
            </span>
          </div>
          {limites.pacientes.max !== null && (
            <Progress 
              value={limites.pacientes.percentual} 
              className={cn('h-2', getProgressColor(limites.pacientes.percentual))}
            />
          )}
          {limites.pacientes.percentual >= 90 && limites.pacientes.max !== null && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" />
              Limite quase atingido. Considere fazer upgrade.
            </div>
          )}
        </div>
        
        {/* Atendimentos */}
        {features.maxAtendimentosMes !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Atendimentos/Mês</span>
              </div>
              <span className={cn('text-sm font-medium', getLimitColor(limites.atendimentos.percentual))}>
                {limites.atendimentos.atual}
                {limites.atendimentos.max !== null && ` / ${limites.atendimentos.max}`}
              </span>
            </div>
            {limites.atendimentos.max !== null && (
              <Progress 
                value={limites.atendimentos.percentual} 
                className={cn('h-2', getProgressColor(limites.atendimentos.percentual))}
              />
            )}
            {limites.atendimentos.percentual >= 90 && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Limite de atendimentos quase atingido.
              </div>
            )}
          </div>
        )}
        
        {features.maxAtendimentosMes === null && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Atendimentos/Mês</span>
            </div>
            <Badge variant="outline">Ilimitado</Badge>
          </div>
        )}
        
        {/* Armazenamento */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Armazenamento</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {(features.armazenamentoUsadoMB / 1000).toFixed(2)} GB / {(features.maxArmazenamentoMB / 1000).toFixed(0)} GB
            </span>
          </div>
          <Progress 
            value={(features.armazenamentoUsadoMB / features.maxArmazenamentoMB) * 100} 
            className="h-2"
          />
        </div>
        
        {/* Recursos principais */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Recursos do plano:</p>
          <div className="flex flex-wrap gap-2">
            {features.canUseProntuarioCompleto && (
              <Badge variant="secondary">Prontuário Completo</Badge>
            )}
            {features.canUseWhatsappAuto && (
              <Badge variant="secondary">WhatsApp Auto</Badge>
            )}
            {features.canExportPdf && (
              <Badge variant="secondary">Export PDF</Badge>
            )}
            {features.canUseRelatoriosAvancados && (
              <Badge variant="secondary">Relatórios Avançados</Badge>
            )}
            {features.canAddUsuarios && (
              <Badge variant="secondary">Multi-usuários</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
