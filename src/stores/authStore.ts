import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Plan, Subscription, FeatureFlags, PlanType } from '@/types';

// Roles do sistema
export type SystemRole = 'admin' | 'cliente';

interface AuthStore {
  user: User | null;
  plan: Plan | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Role do sistema
  systemRole: SystemRole | null;
  clienteId: string | null; // ID do cliente quando role = 'cliente'
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setPlan: (plan: Plan | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  getFeatureFlags: () => FeatureFlags;
  hasFeature: (feature: keyof FeatureFlags) => boolean;
  checkPlanLimit: (feature: string, currentCount?: number) => { allowed: boolean; message?: string };
  
  // Role checks
  isAdmin: () => boolean;
  isCliente: () => boolean;
  getClienteId: () => string | null;
}

// Planos mock para desenvolvimento
const mockPlans: Record<PlanType, Plan> = {
  basico: {
    id: '1',
    nome: 'Básico',
    tipo: 'basico',
    valor: 49.90,
    ativo: true,
    recursos: {
      maxPacientes: 20,
      agendaCompleta: false,
      financeiroAvancado: false,
      whatsappAutomatico: false,
      relatoriosFiltros: false,
      exportacaoPdf: false,
      automacoesCompletas: false,
      relatoriosAvancados: false,
    },
  },
  profissional: {
    id: '2',
    nome: 'Profissional',
    tipo: 'profissional',
    valor: 99.90,
    ativo: true,
    recursos: {
      maxPacientes: null,
      agendaCompleta: true,
      financeiroAvancado: true,
      whatsappAutomatico: true,
      relatoriosFiltros: true,
      exportacaoPdf: true,
      automacoesCompletas: false,
      relatoriosAvancados: false,
    },
  },
  premium: {
    id: '3',
    nome: 'Premium',
    tipo: 'premium',
    valor: 199.90,
    ativo: true,
    recursos: {
      maxPacientes: null,
      agendaCompleta: true,
      financeiroAvancado: true,
      whatsappAutomatico: true,
      relatoriosFiltros: true,
      exportacaoPdf: true,
      automacoesCompletas: true,
      relatoriosAvancados: true,
    },
  },
};

// Usuários mock para desenvolvimento
const mockUsers: Record<string, { user: User; password: string; planType: PlanType; systemRole: SystemRole; clienteId?: string }> = {
  'admin@pronti.com': {
    user: {
      id: 'admin-1',
      nome: 'Administrador',
      email: 'admin@pronti.com',
      tipo: 'admin',
      status: 'ativo',
      criadoEm: new Date(),
    },
    password: 'admin123',
    planType: 'premium',
    systemRole: 'admin',
  },
  'super@pronti.com': {
    user: {
      id: 'super-1',
      nome: 'Super Admin',
      email: 'super@pronti.com',
      tipo: 'admin',
      status: 'ativo',
      criadoEm: new Date(),
    },
    password: 'super123',
    planType: 'premium',
    systemRole: 'admin',
  },
  'dra.ana@pronti.com': {
    user: {
      id: 'medico-1',
      nome: 'Dra. Ana Silva',
      email: 'dra.ana@pronti.com',
      tipo: 'medico',
      status: 'ativo',
      crp: '06/123456',
      criadoEm: new Date(),
    },
    password: 'ana123',
    planType: 'profissional',
    systemRole: 'cliente',
    clienteId: 'cliente-1',
  },
  'dr.carlos@pronti.com': {
    user: {
      id: 'medico-2',
      nome: 'Dr. Carlos Mendes',
      email: 'dr.carlos@pronti.com',
      tipo: 'medico',
      status: 'ativo',
      crp: '06/789012',
      criadoEm: new Date(),
    },
    password: 'carlos123',
    planType: 'basico',
    systemRole: 'cliente',
    clienteId: 'cliente-2',
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      plan: null,
      subscription: null,
      isAuthenticated: false,
      isLoading: false,
      systemRole: null,
      clienteId: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const userData = mockUsers[email.toLowerCase()];
        
        if (!userData || userData.password !== password) {
          set({ isLoading: false });
          return false;
        }

        if (userData.user.status === 'bloqueado') {
          set({ isLoading: false });
          return false;
        }

        const plan = mockPlans[userData.planType];
        const subscription: Subscription = {
          id: `sub-${userData.user.id}`,
          medicoId: userData.user.id,
          planoId: plan.id,
          plano: plan,
          status: 'ativa',
          dataInicio: new Date(),
          criadoEm: new Date(),
        };

        set({
          user: userData.user,
          plan,
          subscription,
          isAuthenticated: true,
          isLoading: false,
          systemRole: userData.systemRole,
          clienteId: userData.clienteId || null,
        });

        return true;
      },

      logout: () => {
        set({
          user: null,
          plan: null,
          subscription: null,
          isAuthenticated: false,
          systemRole: null,
          clienteId: null,
        });
      },

      setUser: (user) => set({ user }),
      setPlan: (plan) => set({ plan }),
      setSubscription: (subscription) => set({ subscription }),
      
      isAdmin: () => get().systemRole === 'admin',
      isCliente: () => get().systemRole === 'cliente',
      getClienteId: () => get().clienteId,

      getFeatureFlags: () => {
        const { plan } = get();
        if (!plan) {
          return {
            canAddPatient: false,
            patientsRemaining: 0,
            hasAdvancedSchedule: false,
            hasAdvancedFinancial: false,
            hasWhatsAppAuto: false,
            hasReportFilters: false,
            hasPdfExport: false,
            hasAutomations: false,
            hasAdvancedReports: false,
          };
        }

        return {
          canAddPatient: true,
          patientsRemaining: plan.recursos.maxPacientes,
          hasAdvancedSchedule: plan.recursos.agendaCompleta,
          hasAdvancedFinancial: plan.recursos.financeiroAvancado,
          hasWhatsAppAuto: plan.recursos.whatsappAutomatico,
          hasReportFilters: plan.recursos.relatoriosFiltros,
          hasPdfExport: plan.recursos.exportacaoPdf,
          hasAutomations: plan.recursos.automacoesCompletas,
          hasAdvancedReports: plan.recursos.relatoriosAvancados,
        };
      },

      hasFeature: (feature) => {
        const flags = get().getFeatureFlags();
        const value = flags[feature];
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value > 0;
        return value !== null;
      },

      checkPlanLimit: (feature, currentCount = 0) => {
        const { plan } = get();
        if (!plan) {
          return { allowed: false, message: 'Nenhum plano ativo' };
        }

        switch (feature) {
          case 'pacientes':
            if (plan.recursos.maxPacientes === null) {
              return { allowed: true };
            }
            if (currentCount >= plan.recursos.maxPacientes) {
              return { 
                allowed: false, 
                message: `Limite de ${plan.recursos.maxPacientes} pacientes atingido. Faça upgrade para o plano Profissional.` 
              };
            }
            return { allowed: true };

          case 'whatsapp_auto':
            if (!plan.recursos.whatsappAutomatico) {
              return { 
                allowed: false, 
                message: 'Recurso disponível no plano Profissional ou superior.' 
              };
            }
            return { allowed: true };

          case 'export_pdf':
            if (!plan.recursos.exportacaoPdf) {
              return { 
                allowed: false, 
                message: 'Exportação PDF disponível no plano Profissional ou superior.' 
              };
            }
            return { allowed: true };

          case 'automacoes':
            if (!plan.recursos.automacoesCompletas) {
              return { 
                allowed: false, 
                message: 'Automações completas disponíveis no plano Premium.' 
              };
            }
            return { allowed: true };

          default:
            return { allowed: true };
        }
      },
    }),
    {
      name: 'pronti-auth',
      partialize: (state) => ({
        user: state.user,
        plan: state.plan,
        subscription: state.subscription,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
