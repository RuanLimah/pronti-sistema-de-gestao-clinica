// ============= Hook de Features baseadas em Plano + Add-ons =============

import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useDataStore } from '@/stores/dataStore';
import { useToast } from '@/hooks/use-toast';
import { CalculatedFeatures, PlanTier, AddonType, PLANOS } from '@/types/plans';

export function useSubscriptionFeatures() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const {
    getSubscription,
    getActiveAddons,
    getCalculatedFeatures,
    canPerformAction,
    hasFeature,
    changePlan,
    addAddon,
    removeAddon,
    grantTrial,
  } = useSubscriptionStore();
  
  const { getPacientesAtivos, getAtendimentosByMedico } = useDataStore();
  
  const medicoId = user?.id || '';
  
  // Calcular contadores atuais
  const pacientesAtivos = useMemo(() => {
    if (!medicoId) return 0;
    return getPacientesAtivos(medicoId).length;
  }, [medicoId, getPacientesAtivos]);
  
  const atendimentosMes = useMemo(() => {
    if (!medicoId) return 0;
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const atendimentos = getAtendimentosByMedico(medicoId);
    return atendimentos.filter(a => {
      const dataAtendimento = new Date(a.data);
      return dataAtendimento >= firstDay && a.status === 'realizado';
    }).length;
  }, [medicoId, getAtendimentosByMedico]);
  
  // Features calculadas
  const features: CalculatedFeatures = useMemo(() => {
    if (!medicoId) {
      return {
        maxPacientesAtivos: 0,
        maxAtendimentosMes: 0,
        maxUsuarios: 0,
        maxArmazenamentoMB: 0,
        canUseAgenda: false,
        canUseAgendaCompleta: false,
        canUseProntuarioBasico: false,
        canUseProntuarioCompleto: false,
        canUseFinanceiroSimples: false,
        canUseFinanceiroCompleto: false,
        canUseWhatsappManual: false,
        canUseWhatsappAuto: false,
        canUseEnvioMassa: false,
        canUseLembretes: false,
        canExportPdf: false,
        canUseRelatoriosAvancados: false,
        canUploadExames: false,
        canUploadIlimitado: false,
        canAddUsuarios: false,
        canUseRbac: false,
        canUseRelatoriosPorProfissional: false,
        hasSuportePrioritario: false,
        pacientesAtivosCount: 0,
        atendimentosMesCount: 0,
        armazenamentoUsadoMB: 0,
        canAddPaciente: false,
        canAddAtendimento: false,
        canUploadMais: false,
        planTier: 'gratuito',
        planNome: 'Gratuito',
        isTrialActive: false,
        trialDaysRemaining: null,
      };
    }
    
    return getCalculatedFeatures(medicoId, pacientesAtivos, atendimentosMes, 0);
  }, [medicoId, pacientesAtivos, atendimentosMes, getCalculatedFeatures]);
  
  // Subscription atual
  const subscription = useMemo(() => {
    if (!medicoId) return null;
    return getSubscription(medicoId);
  }, [medicoId, getSubscription]);
  
  // Add-ons ativos
  const activeAddons = useMemo(() => {
    if (!medicoId) return [];
    return getActiveAddons(medicoId);
  }, [medicoId, getActiveAddons]);
  
  // Verificar e notificar
  const checkAndNotify = useCallback((action: string, currentCount?: number): boolean => {
    if (!medicoId) return false;
    
    const result = canPerformAction(medicoId, action, currentCount);
    
    if (!result.allowed && result.message) {
      toast({
        title: 'Recurso não disponível',
        description: result.message,
        variant: 'destructive',
      });
    }
    
    return result.allowed;
  }, [medicoId, canPerformAction, toast]);
  
  // Verificar feature específica
  const requireFeature = useCallback((feature: keyof CalculatedFeatures): boolean => {
    if (!medicoId) return false;
    
    const has = hasFeature(medicoId, feature);
    
    if (!has) {
      const planName = features.planNome;
      toast({
        title: 'Recurso Premium',
        description: `Este recurso não está disponível no plano ${planName}. Faça upgrade para acessar.`,
        variant: 'destructive',
      });
    }
    
    return has;
  }, [medicoId, hasFeature, features.planNome, toast]);
  
  // Fazer upgrade de plano
  const upgradePlan = useCallback((newTier: PlanTier) => {
    if (!medicoId || !user) return;
    
    changePlan(medicoId, newTier, user.id);
    
    toast({
      title: 'Plano atualizado!',
      description: `Seu plano foi alterado para ${PLANOS[newTier].nome}.`,
    });
  }, [medicoId, user, changePlan, toast]);
  
  // Adicionar add-on
  const activateAddon = useCallback((addonType: AddonType) => {
    if (!medicoId) return;
    
    addAddon(medicoId, addonType);
    
    toast({
      title: 'Add-on ativado!',
      description: 'O recurso adicional foi ativado em sua conta.',
    });
  }, [medicoId, addAddon, toast]);
  
  // Remover add-on
  const deactivateAddon = useCallback((doctorAddonId: string) => {
    removeAddon(doctorAddonId);
    
    toast({
      title: 'Add-on desativado',
      description: 'O recurso adicional foi removido de sua conta.',
    });
  }, [removeAddon, toast]);
  
  // Iniciar trial
  const startTrial = useCallback((days: number = 7) => {
    if (!medicoId) return;
    
    grantTrial(medicoId, days);
    
    toast({
      title: 'Trial ativado!',
      description: `Você tem ${days} dias para testar o plano Profissional.`,
    });
  }, [medicoId, grantTrial, toast]);
  
  return {
    // Estado
    features,
    subscription,
    activeAddons,
    
    // Verificações
    checkAndNotify,
    requireFeature,
    
    // Ações
    upgradePlan,
    activateAddon,
    deactivateAddon,
    startTrial,
    
    // Helpers
    isPlanTier: (tier: PlanTier) => features.planTier === tier,
    isTrialActive: features.isTrialActive,
    trialDaysRemaining: features.trialDaysRemaining,
    
    // Limites formatados
    limites: {
      pacientes: {
        atual: features.pacientesAtivosCount,
        max: features.maxPacientesAtivos,
        percentual: features.maxPacientesAtivos 
          ? (features.pacientesAtivosCount / features.maxPacientesAtivos) * 100 
          : 0,
      },
      atendimentos: {
        atual: features.atendimentosMesCount,
        max: features.maxAtendimentosMes,
        percentual: features.maxAtendimentosMes 
          ? (features.atendimentosMesCount / features.maxAtendimentosMes) * 100 
          : 0,
      },
    },
  };
}
