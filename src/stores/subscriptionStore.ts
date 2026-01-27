// ============= PRONTI - Store de Assinaturas e Planos =============

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PlanTier,
  AddonType,
  DoctorSubscription,
  DoctorAddon,
  CalculatedFeatures,
  PLANOS,
  ADDONS,
  getTrialDaysRemaining,
  isTrialExpired,
  MonthlyUsage,
  PlanChangeHistory,
} from '@/types/plans';

interface SubscriptionStore {
  // Estado
  subscriptions: DoctorSubscription[];
  doctorAddons: DoctorAddon[];
  monthlyUsage: MonthlyUsage[];
  planHistory: PlanChangeHistory[];
  
  // Getters
  getSubscription: (medicoId: string) => DoctorSubscription | undefined;
  getDoctorAddons: (medicoId: string) => DoctorAddon[];
  getActiveAddons: (medicoId: string) => DoctorAddon[];
  getMonthlyUsage: (medicoId: string, mes?: string) => MonthlyUsage | undefined;
  getPlanHistory: (medicoId: string) => PlanChangeHistory[];
  
  // Feature Flags Calculadas
  getCalculatedFeatures: (medicoId: string, pacientesAtivos: number, atendimentosMes: number, armazenamentoUsadoMB: number) => CalculatedFeatures;
  
  // Verificações rápidas
  canPerformAction: (medicoId: string, action: string, currentCount?: number) => { allowed: boolean; message?: string };
  hasFeature: (medicoId: string, feature: keyof CalculatedFeatures) => boolean;
  
  // Mutações - Assinatura
  createSubscription: (medicoId: string, planTier: PlanTier, trial?: boolean, trialDays?: number) => DoctorSubscription;
  updateSubscription: (subscriptionId: string, data: Partial<DoctorSubscription>) => void;
  cancelSubscription: (subscriptionId: string, motivo?: string) => void;
  reactivateSubscription: (subscriptionId: string) => void;
  changePlan: (medicoId: string, newTier: PlanTier, changedBy: string) => void;
  
  // Mutações - Add-ons
  addAddon: (medicoId: string, addonType: AddonType) => DoctorAddon;
  removeAddon: (doctorAddonId: string) => void;
  toggleAddon: (doctorAddonId: string) => void;
  
  // Mutações - Uso mensal
  incrementUsage: (medicoId: string, field: keyof Omit<MonthlyUsage, 'medicoId' | 'mes'>, amount?: number) => void;
  resetMonthlyUsage: (medicoId: string) => void;
  
  // Admin actions
  grantTrial: (medicoId: string, days: number) => void;
  suspendSubscription: (subscriptionId: string) => void;
  
  // Inicialização
  initializeSubscription: (medicoId: string) => DoctorSubscription;
  
  // Utils
  gerarId: () => string;
  getCurrentMonth: () => string;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      doctorAddons: [],
      monthlyUsage: [],
      planHistory: [],
      
      gerarId: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      
      getCurrentMonth: () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      },
      
      // ==================== GETTERS ====================
      
      getSubscription: (medicoId) => {
        return get().subscriptions.find(s => s.medicoId === medicoId && s.status !== 'cancelada');
      },
      
      getDoctorAddons: (medicoId) => {
        return get().doctorAddons.filter(a => a.medicoId === medicoId);
      },
      
      getActiveAddons: (medicoId) => {
        return get().doctorAddons.filter(a => a.medicoId === medicoId && a.ativo);
      },
      
      getMonthlyUsage: (medicoId, mes) => {
        const targetMonth = mes || get().getCurrentMonth();
        return get().monthlyUsage.find(u => u.medicoId === medicoId && u.mes === targetMonth);
      },
      
      getPlanHistory: (medicoId) => {
        return get().planHistory
          .filter(h => h.medicoId === medicoId)
          .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
      },
      
      // ==================== FEATURE FLAGS ====================
      
      getCalculatedFeatures: (medicoId, pacientesAtivos, atendimentosMes, armazenamentoUsadoMB) => {
        const subscription = get().getSubscription(medicoId);
        const activeAddons = get().getActiveAddons(medicoId);
        
        // Plano padrão se não tiver assinatura
        const plan = subscription?.plano || PLANOS.gratuito;
        const limites = plan.limites;
        const recursos = plan.recursos;
        
        // Combinar recursos de add-ons
        const addonResources = activeAddons.reduce((acc, da) => {
          const addon = ADDONS[da.addon.tipo];
          return { ...acc, ...addon.recursos };
        }, {} as Partial<typeof recursos>);
        
        // Adicionar armazenamento extra de add-ons
        const extraStorage = activeAddons.reduce((acc, da) => {
          const addon = ADDONS[da.addon.tipo];
          return acc + (addon.limites?.maxArmazenamentoMB || 0);
        }, 0);
        
        const combinedResources = { ...recursos, ...addonResources };
        const maxArmazenamento = (limites.maxArmazenamentoMB || 0) + extraStorage;
        
        // Verificar trial
        const isTrialActive = subscription?.status === 'trial' && !isTrialExpired(subscription);
        const trialDaysRemaining = subscription ? getTrialDaysRemaining(subscription) : null;
        
        // Calcular se pode adicionar mais
        const canAddPaciente = limites.maxPacientesAtivos === null || pacientesAtivos < limites.maxPacientesAtivos;
        const canAddAtendimento = limites.maxAtendimentosMes === null || atendimentosMes < limites.maxAtendimentosMes;
        const canUploadMais = armazenamentoUsadoMB < maxArmazenamento;
        
        return {
          // Limites
          maxPacientesAtivos: limites.maxPacientesAtivos,
          maxAtendimentosMes: limites.maxAtendimentosMes,
          maxUsuarios: limites.maxUsuarios,
          maxArmazenamentoMB: maxArmazenamento,
          
          // Recursos
          canUseAgenda: combinedResources.agenda ?? false,
          canUseAgendaCompleta: combinedResources.agendaCompleta ?? false,
          canUseProntuarioBasico: combinedResources.prontuarioBasico ?? false,
          canUseProntuarioCompleto: combinedResources.prontuarioCompleto ?? false,
          canUseFinanceiroSimples: combinedResources.financeiroSimples ?? false,
          canUseFinanceiroCompleto: combinedResources.financeiroCompleto ?? false,
          canUseWhatsappManual: combinedResources.whatsappManual ?? false,
          canUseWhatsappAuto: combinedResources.whatsappAutomatico ?? false,
          canUseEnvioMassa: combinedResources.envioEmMassa ?? false,
          canUseLembretes: combinedResources.lembretes ?? false,
          canExportPdf: combinedResources.relatoriosPdf ?? false,
          canUseRelatoriosAvancados: combinedResources.relatoriosAvancados ?? false,
          canUploadExames: combinedResources.uploadExames ?? false,
          canUploadIlimitado: combinedResources.uploadIlimitado ?? false,
          canAddUsuarios: combinedResources.multiUsuarios ?? false,
          canUseRbac: combinedResources.rbac ?? false,
          canUseRelatoriosPorProfissional: combinedResources.relatoriosPorProfissional ?? false,
          hasSuportePrioritario: combinedResources.suportePrioritario ?? false,
          
          // Contadores
          pacientesAtivosCount: pacientesAtivos,
          atendimentosMesCount: atendimentosMes,
          armazenamentoUsadoMB,
          
          // Verificações
          canAddPaciente,
          canAddAtendimento,
          canUploadMais,
          
          // Info
          planTier: plan.tier,
          planNome: plan.nome,
          isTrialActive,
          trialDaysRemaining,
        };
      },
      
      canPerformAction: (medicoId, action, currentCount = 0) => {
        const subscription = get().getSubscription(medicoId);
        const plan = subscription?.plano || PLANOS.gratuito;
        
        // Verificar se subscription está ativa
        if (subscription?.status === 'suspensa') {
          return { allowed: false, message: 'Sua assinatura está suspensa. Entre em contato com o suporte.' };
        }
        
        if (subscription?.status === 'expirada') {
          return { allowed: false, message: 'Sua assinatura expirou. Renove para continuar usando.' };
        }
        
        // Verificar trial expirado
        if (subscription && isTrialExpired(subscription)) {
          return { allowed: false, message: 'Seu período de teste expirou. Assine um plano para continuar.' };
        }
        
        switch (action) {
          case 'add_paciente':
            if (plan.limites.maxPacientesAtivos !== null && currentCount >= plan.limites.maxPacientesAtivos) {
              return { 
                allowed: false, 
                message: `Limite de ${plan.limites.maxPacientesAtivos} pacientes ativos atingido. Faça upgrade do plano.` 
              };
            }
            break;
            
          case 'add_atendimento':
            if (plan.limites.maxAtendimentosMes !== null) {
              const usage = get().getMonthlyUsage(medicoId);
              const atual = usage?.atendimentosRealizados || 0;
              if (atual >= plan.limites.maxAtendimentosMes) {
                return { 
                  allowed: false, 
                  message: `Limite de ${plan.limites.maxAtendimentosMes} atendimentos/mês atingido. Faça upgrade do plano.` 
                };
              }
            }
            break;
            
          case 'whatsapp_auto':
            const activeAddons = get().getActiveAddons(medicoId);
            const hasWhatsappAddon = activeAddons.some(a => a.addon.tipo === 'whatsapp_avancado');
            if (!plan.recursos.whatsappAutomatico && !hasWhatsappAddon) {
              return { allowed: false, message: 'WhatsApp automático disponível no plano Profissional ou como add-on.' };
            }
            break;
            
          case 'export_pdf':
            if (!plan.recursos.relatoriosPdf) {
              return { allowed: false, message: 'Exportação PDF disponível no plano Profissional ou superior.' };
            }
            break;
            
          case 'relatorios_avancados':
            const hasReportsAddon = get().getActiveAddons(medicoId).some(a => a.addon.tipo === 'relatorios_avancados');
            if (!plan.recursos.relatoriosAvancados && !hasReportsAddon) {
              return { allowed: false, message: 'Relatórios avançados disponíveis no plano Clínica ou como add-on.' };
            }
            break;
            
          case 'prontuario_completo':
            if (!plan.recursos.prontuarioCompleto) {
              return { allowed: false, message: 'Prontuário completo disponível no plano Profissional ou superior.' };
            }
            break;
        }
        
        return { allowed: true };
      },
      
      hasFeature: (medicoId, feature) => {
        const features = get().getCalculatedFeatures(medicoId, 0, 0, 0);
        const value = features[feature];
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value > 0;
        return value !== null;
      },
      
      // ==================== MUTAÇÕES - ASSINATURA ====================
      
      createSubscription: (medicoId, planTier, trial = false, trialDays = 7) => {
        const plan = PLANOS[planTier];
        const now = new Date();
        
        const subscription: DoctorSubscription = {
          id: get().gerarId(),
          medicoId,
          planoId: plan.id,
          plano: plan,
          status: trial ? 'trial' : 'ativa',
          dataInicio: now,
          trialFim: trial ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : undefined,
          criadoEm: now,
        };
        
        set(state => ({
          subscriptions: [...state.subscriptions, subscription],
        }));
        
        return subscription;
      },
      
      updateSubscription: (subscriptionId, data) => {
        set(state => ({
          subscriptions: state.subscriptions.map(s =>
            s.id === subscriptionId ? { ...s, ...data, atualizadoEm: new Date() } : s
          ),
        }));
      },
      
      cancelSubscription: (subscriptionId, motivo) => {
        set(state => ({
          subscriptions: state.subscriptions.map(s =>
            s.id === subscriptionId ? { 
              ...s, 
              status: 'cancelada', 
              canceladoEm: new Date(),
              motivoCancelamento: motivo,
              atualizadoEm: new Date() 
            } : s
          ),
        }));
      },
      
      reactivateSubscription: (subscriptionId) => {
        set(state => ({
          subscriptions: state.subscriptions.map(s =>
            s.id === subscriptionId ? { 
              ...s, 
              status: 'ativa', 
              canceladoEm: undefined,
              motivoCancelamento: undefined,
              atualizadoEm: new Date() 
            } : s
          ),
        }));
      },
      
      changePlan: (medicoId, newTier, changedBy) => {
        const currentSub = get().getSubscription(medicoId);
        const newPlan = PLANOS[newTier];
        
        if (currentSub) {
          // Registrar histórico
          const history: PlanChangeHistory = {
            id: get().gerarId(),
            medicoId,
            planoAnteriorId: currentSub.planoId,
            planoNovoId: newPlan.id,
            planoAnterior: currentSub.plano.tier,
            planoNovo: newTier,
            criadoPor: changedBy,
            criadoEm: new Date(),
          };
          
          set(state => ({
            planHistory: [...state.planHistory, history],
            subscriptions: state.subscriptions.map(s =>
              s.id === currentSub.id ? {
                ...s,
                planoId: newPlan.id,
                plano: newPlan,
                atualizadoEm: new Date(),
              } : s
            ),
          }));
        } else {
          // Criar nova assinatura
          get().createSubscription(medicoId, newTier);
        }
      },
      
      // ==================== MUTAÇÕES - ADD-ONS ====================
      
      addAddon: (medicoId, addonType) => {
        const addon = ADDONS[addonType];
        
        const doctorAddon: DoctorAddon = {
          id: get().gerarId(),
          medicoId,
          addonId: addon.id,
          addon,
          ativo: true,
          dataInicio: new Date(),
          criadoEm: new Date(),
        };
        
        set(state => ({
          doctorAddons: [...state.doctorAddons, doctorAddon],
        }));
        
        return doctorAddon;
      },
      
      removeAddon: (doctorAddonId) => {
        set(state => ({
          doctorAddons: state.doctorAddons.filter(a => a.id !== doctorAddonId),
        }));
      },
      
      toggleAddon: (doctorAddonId) => {
        set(state => ({
          doctorAddons: state.doctorAddons.map(a =>
            a.id === doctorAddonId ? { ...a, ativo: !a.ativo } : a
          ),
        }));
      },
      
      // ==================== MUTAÇÕES - USO ====================
      
      incrementUsage: (medicoId, field, amount = 1) => {
        const mes = get().getCurrentMonth();
        const existing = get().getMonthlyUsage(medicoId, mes);
        
        if (existing) {
          set(state => ({
            monthlyUsage: state.monthlyUsage.map(u =>
              u.medicoId === medicoId && u.mes === mes
                ? { ...u, [field]: (u[field] as number) + amount }
                : u
            ),
          }));
        } else {
          const newUsage: MonthlyUsage = {
            medicoId,
            mes,
            atendimentosRealizados: 0,
            armazenamentoUsadoMB: 0,
            mensagensWhatsapp: 0,
            [field]: amount,
          };
          set(state => ({
            monthlyUsage: [...state.monthlyUsage, newUsage],
          }));
        }
      },
      
      resetMonthlyUsage: (medicoId) => {
        const mes = get().getCurrentMonth();
        set(state => ({
          monthlyUsage: state.monthlyUsage.filter(u => !(u.medicoId === medicoId && u.mes === mes)),
        }));
      },
      
      // ==================== ADMIN ACTIONS ====================
      
      grantTrial: (medicoId, days) => {
        const subscription = get().getSubscription(medicoId);
        const trialFim = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        
        if (subscription) {
          get().updateSubscription(subscription.id, {
            status: 'trial',
            trialFim,
          });
        } else {
          get().createSubscription(medicoId, 'profissional', true, days);
        }
      },
      
      suspendSubscription: (subscriptionId) => {
        set(state => ({
          subscriptions: state.subscriptions.map(s =>
            s.id === subscriptionId ? { ...s, status: 'suspensa', atualizadoEm: new Date() } : s
          ),
        }));
      },
      
      // ==================== INICIALIZAÇÃO ====================
      
      initializeSubscription: (medicoId) => {
        const existing = get().getSubscription(medicoId);
        if (existing) return existing;
        
        // Criar assinatura gratuita por padrão
        return get().createSubscription(medicoId, 'gratuito');
      },
    }),
    {
      name: 'pronti-subscriptions',
    }
  )
);
