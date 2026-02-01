import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { PlanResources } from '@/types';

export function usePlanFeatures() {
  const { plan, getFeatureFlags, hasFeature, checkPlanLimit } = useAuthStore();
  const { toast } = useToast();

  const features = getFeatureFlags();

  const checkAndNotify = (feature: string, currentCount?: number): boolean => {
    const result = checkPlanLimit(feature, currentCount);
    
    if (!result.allowed && result.message) {
      toast({
        title: 'Recurso não disponível',
        description: result.message,
        variant: 'destructive',
      });
    }
    
    return result.allowed;
  };

  const requireFeature = (feature: keyof PlanResources): boolean => {
    const has = hasFeature(feature);
    
    if (!has) {
      toast({
        title: 'Recurso Premium',
        description: 'Este recurso não está disponível no seu plano atual. Faça upgrade para acessar.',
        variant: 'destructive',
      });
    }
    
    return has;
  };

  return {
    plan,
    features,
    hasFeature,
    checkAndNotify,
    requireFeature,
    isPremium: plan?.tipo === 'premium',
    isProfessional: plan?.tipo === 'profissional' || plan?.tipo === 'premium',
    isBasic: plan?.tipo === 'basico',
  };
}
