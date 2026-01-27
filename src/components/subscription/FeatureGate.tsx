// ============= Feature Gate Component =============
// Bloqueia ou permite acesso a recursos baseado no plano

import { ReactNode } from 'react';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { CalculatedFeatures, PlanTier, PLANOS } from '@/types/plans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap } from 'lucide-react';

interface FeatureGateProps {
  feature: keyof CalculatedFeatures;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  requiredPlan?: PlanTier;
  silentCheck?: boolean; // Não mostra nada se não tiver acesso
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true,
  requiredPlan,
  silentCheck = false,
}: FeatureGateProps) {
  const { features, upgradePlan } = useSubscriptionFeatures();
  
  const hasAccess = features[feature];
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (silentCheck) {
    return null;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showUpgradePrompt) {
    return null;
  }
  
  // Determinar qual plano é necessário
  const neededPlan = requiredPlan || 'profissional';
  const planInfo = PLANOS[neededPlan];
  
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 p-3 rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">Recurso Premium</CardTitle>
        <CardDescription>
          Este recurso está disponível no plano {planInfo.nome}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Badge variant="outline" className="mb-4">
          A partir de R$ {planInfo.valor.toFixed(2).replace('.', ',')}/mês
        </Badge>
        <Button 
          className="w-full"
          onClick={() => upgradePlan(neededPlan)}
        >
          <Crown className="h-4 w-4 mr-2" />
          Fazer Upgrade
        </Button>
      </CardContent>
    </Card>
  );
}

// Versão simplificada para botões/ações
interface FeatureButtonProps {
  feature: keyof CalculatedFeatures;
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  requiredPlan?: PlanTier;
}

export function FeatureButton({
  feature,
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  requiredPlan = 'profissional',
}: FeatureButtonProps) {
  const { features, requireFeature } = useSubscriptionFeatures();
  
  const hasAccess = features[feature];
  
  const handleClick = () => {
    if (hasAccess) {
      onClick?.();
    } else {
      requireFeature(feature);
    }
  };
  
  return (
    <Button 
      variant={hasAccess ? variant : 'outline'}
      size={size}
      className={className}
      onClick={handleClick}
    >
      {!hasAccess && <Lock className="h-4 w-4 mr-2" />}
      {children}
      {!hasAccess && (
        <Badge variant="secondary" className="ml-2 text-xs">
          {PLANOS[requiredPlan].nome}
        </Badge>
      )}
    </Button>
  );
}

// Versão para badges/indicadores
interface FeatureBadgeProps {
  feature: keyof CalculatedFeatures;
  label: string;
  requiredPlan?: PlanTier;
}

export function FeatureBadge({ feature, label, requiredPlan = 'profissional' }: FeatureBadgeProps) {
  const { features } = useSubscriptionFeatures();
  
  const hasAccess = features[feature];
  
  if (hasAccess) {
    return (
      <Badge variant="default" className="gap-1">
        <Zap className="h-3 w-3" />
        {label}
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Lock className="h-3 w-3" />
      {label}
      <span className="text-xs">({PLANOS[requiredPlan].nome})</span>
    </Badge>
  );
}
