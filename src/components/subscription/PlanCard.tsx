// ============= Card de Plano =============

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Zap, Building } from 'lucide-react';
import { PlanDefinition, PlanTier } from '@/types/plans';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: PlanDefinition;
  currentTier?: PlanTier;
  onSelect?: (tier: PlanTier) => void;
  isLoading?: boolean;
}

const planIcons: Record<PlanTier, React.ReactNode> = {
  gratuito: null,
  essencial: <Zap className="h-5 w-5" />,
  profissional: <Crown className="h-5 w-5" />,
  clinica: <Building className="h-5 w-5" />,
};

const featureLabels: Record<string, string> = {
  agenda: 'Agenda básica',
  agendaCompleta: 'Agenda completa',
  pacientes: 'Gestão de pacientes',
  prontuarioBasico: 'Prontuário básico',
  prontuarioCompleto: 'Prontuário completo',
  financeiroSimples: 'Financeiro simples',
  financeiroCompleto: 'Financeiro completo',
  whatsappManual: 'WhatsApp manual',
  whatsappAutomatico: 'WhatsApp automático',
  envioEmMassa: 'Envio em massa',
  lembretes: 'Lembretes automáticos',
  relatoriosPdf: 'Relatórios em PDF',
  relatoriosAvancados: 'Relatórios avançados',
  uploadExames: 'Upload de exames',
  uploadIlimitado: 'Upload ilimitado',
  multiUsuarios: 'Múltiplos usuários',
  rbac: 'Controle de permissões',
  relatoriosPorProfissional: 'Relatórios por profissional',
  suportePrioritario: 'Suporte prioritário',
};

export function PlanCard({ plan, currentTier, onSelect, isLoading }: PlanCardProps) {
  const isCurrent = currentTier === plan.tier;
  const isUpgrade = currentTier && plan.ordem > (currentTier ? plan.ordem : -1);
  const isDowngrade = currentTier && plan.ordem < (currentTier ? plan.ordem : -1);
  
  const highlightFeatures = [
    'agendaCompleta',
    'prontuarioCompleto',
    'financeiroCompleto',
    'whatsappAutomatico',
    'relatoriosPdf',
    'multiUsuarios',
  ];
  
  return (
    <Card className={cn(
      'relative transition-all duration-300',
      plan.destaque && 'border-primary shadow-lg scale-105',
      isCurrent && 'ring-2 ring-primary'
    )}>
      {plan.destaque && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            Mais Popular
          </Badge>
        </div>
      )}
      
      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <Badge variant="outline" className="bg-background">
            Plano Atual
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-2">
          {planIcons[plan.tier]}
        </div>
        <CardTitle className="text-xl">{plan.nome}</CardTitle>
        <CardDescription>{plan.descricao}</CardDescription>
      </CardHeader>
      
      <CardContent className="text-center">
        <div className="mb-4">
          <span className="text-4xl font-bold">
            {plan.valor === 0 ? 'Grátis' : `R$ ${plan.valor.toFixed(2).replace('.', ',')}`}
          </span>
          {plan.valor > 0 && (
            <span className="text-muted-foreground">/mês</span>
          )}
        </div>
        
        {plan.valorAnual && (
          <p className="text-sm text-muted-foreground mb-4">
            ou R$ {plan.valorAnual.toFixed(2).replace('.', ',')}/ano
            <Badge variant="secondary" className="ml-2 text-xs">
              2 meses grátis
            </Badge>
          </p>
        )}
        
        <div className="space-y-2 text-left">
          {/* Limites */}
          <div className="py-2 border-b">
            <p className="text-sm font-medium mb-1">Limites:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • {plan.limites.maxPacientesAtivos === null 
                    ? 'Pacientes ilimitados' 
                    : `Até ${plan.limites.maxPacientesAtivos} pacientes`}
              </li>
              <li>
                • {plan.limites.maxAtendimentosMes === null 
                    ? 'Atendimentos ilimitados' 
                    : `Até ${plan.limites.maxAtendimentosMes} atend./mês`}
              </li>
              <li>
                • {plan.limites.maxUsuarios === 1 
                    ? '1 usuário' 
                    : `Até ${plan.limites.maxUsuarios} usuários`}
              </li>
            </ul>
          </div>
          
          {/* Recursos */}
          <div className="py-2">
            <p className="text-sm font-medium mb-1">Recursos:</p>
            <ul className="text-sm space-y-1">
              {highlightFeatures.map(feature => {
                const hasFeature = plan.recursos[feature as keyof typeof plan.recursos];
                return (
                  <li 
                    key={feature}
                    className={cn(
                      'flex items-center gap-2',
                      !hasFeature && 'text-muted-foreground'
                    )}
                  >
                    {hasFeature ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    {featureLabels[feature]}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full"
          variant={isCurrent ? 'outline' : plan.destaque ? 'default' : 'secondary'}
          disabled={isCurrent || isLoading}
          onClick={() => onSelect?.(plan.tier)}
        >
          {isCurrent 
            ? 'Plano Atual' 
            : isUpgrade 
              ? 'Fazer Upgrade'
              : isDowngrade
                ? 'Fazer Downgrade'
                : 'Selecionar'
          }
        </Button>
      </CardFooter>
    </Card>
  );
}
