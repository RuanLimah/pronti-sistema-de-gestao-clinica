import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Plan, Subscription, FeatureFlags, PlanType, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';

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
  signup: (email: string, password: string, name: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  
  // Role checks
  isAdmin: () => boolean;
  isCliente: () => boolean;
  getClienteId: () => string | null;
  
  // Feature checks
  getFeatureFlags: () => FeatureFlags;
  hasFeature: (feature: keyof FeatureFlags) => boolean;
  checkPlanLimit: (feature: string, currentCount?: number) => { allowed: boolean; message?: string };
}

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
        
        try {
          const { data: { session }, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error || !session) {
            console.error('Login error:', error);
            set({ isLoading: false });
            return false;
          }

          // Fetch profile and client data
          const userId = session.user.id;
          
          // 1. Fetch Profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (profileError) {
             console.error('Profile fetch error:', profileError);
             // Handle case where profile might not exist yet (though trigger should create it)
          }

          const systemRole = (profile?.role === 'admin' ? 'admin' : 'cliente') as SystemRole;
          
          // 2. Fetch Client Data if role is client
          let clientData = null;
          let planData = null;
          let subscriptionData: Subscription | null = null;

          if (systemRole === 'cliente') {
            const { data: client, error: clientError } = await supabase
              .from('clients')
              .select(`
                *,
                plans (*)
              `)
              .eq('id', userId)
              .single();
              
            if (client) {
              clientData = client;
              const dbPlan = client.plans;
              
              if (dbPlan) {
                 planData = {
                    id: dbPlan.id,
                    nome: dbPlan.name,
                    tipo: dbPlan.type as PlanType,
                    valor: dbPlan.price,
                    ativo: dbPlan.active,
                    recursos: {
                      maxPacientes: dbPlan.limits?.max_patients ?? null,
                      // Map other features based on 'features' array or defaults
                      agendaCompleta: dbPlan.features?.includes('agenda_completa') ?? false,
                      financeiroAvancado: dbPlan.features?.includes('financeiro') ?? false,
                      whatsappAutomatico: dbPlan.features?.includes('whatsapp') ?? false,
                      relatoriosFiltros: true, // Default or check feature list
                      exportacaoPdf: true,
                      automacoesCompletas: dbPlan.features?.includes('automacoes') ?? false,
                      relatoriosAvancados: dbPlan.features?.includes('relatorios_avancados') ?? false,
                    }
                 } as Plan;

                 subscriptionData = {
                   id: `sub-${client.id}`,
                   medicoId: client.id,
                   planoId: dbPlan.id,
                   plano: planData,
                   status: client.status === 'active' ? 'ativa' : 'cancelada', // Map status correctly
                   dataInicio: new Date(client.created_at),
                   criadoEm: new Date(client.created_at),
                 };
              }
            }
          } else {
             // Admin doesn't have a plan usually, or has a 'god mode' plan
             // For now leaving null or setting a dummy admin plan
          }

          const appUser: User = {
            id: userId,
            nome: profile?.full_name || session.user.user_metadata.full_name || email,
            email: email,
            tipo: systemRole === 'admin' ? 'admin' : 'medico', // Map to UserRole
            status: 'ativo',
            criadoEm: new Date(session.user.created_at),
          };

          set({
            user: appUser,
            plan: planData,
            subscription: subscriptionData,
            isAuthenticated: true,
            isLoading: false,
            systemRole: systemRole,
            clienteId: systemRole === 'cliente' ? userId : null,
          });

          return true;

        } catch (err) {
          console.error('Unexpected login error:', err);
          set({ isLoading: false });
          return false;
        }
      },

      signup: async (email, password, name, phone) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
                phone: phone,
              },
            },
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }
          
          // If auto-confirm is off, user can't login yet. 
          // Assuming auto-confirm is on for dev, or user needs to check email.
          set({ isLoading: false });
          return { success: true };

        } catch (err) {
           set({ isLoading: false });
           return { success: false, error: 'Erro inesperado' };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          plan: null,
          subscription: null,
          isAuthenticated: false,
          systemRole: null,
          clienteId: null,
        });
      },

      checkSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
           const { user } = get();
           // If we have a session but no user data in store (or we want to refresh)
           if (!user || !get().isAuthenticated) {
             // We need to fetch user data similar to login
             // We can extract the logic or just re-implement a fetch here
             // For simplicity/safety, let's reuse a fetch logic
             // But we can't call 'login' because it requires password
             
             // Reuse fetch logic:
             try {
                const userId = session.user.id;
                const email = session.user.email || '';
                
                // 1. Fetch Profile
                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userId)
                  .single();

                if (profileError) console.error('Profile fetch error:', profileError);

                const systemRole = (profile?.role === 'admin' ? 'admin' : 'cliente') as SystemRole;
                
                // 2. Fetch Client Data
                let clientData = null;
                let planData = null;
                let subscriptionData: Subscription | null = null;

                if (systemRole === 'cliente') {
                  const { data: client } = await supabase
                    .from('clients')
                    .select(`*, plans (*)`)
                    .eq('id', userId)
                    .single();
                    
                  if (client) {
                    clientData = client;
                    const dbPlan = client.plans;
                    
                    if (dbPlan) {
                       planData = {
                          id: dbPlan.id,
                          nome: dbPlan.name,
                          tipo: dbPlan.type as PlanType,
                          valor: dbPlan.price,
                          ativo: dbPlan.active,
                          recursos: {
                            maxPacientes: dbPlan.limits?.max_patients ?? null,
                            agendaCompleta: dbPlan.features?.includes('agenda_completa') ?? false,
                            financeiroAvancado: dbPlan.features?.includes('financeiro') ?? false,
                            whatsappAutomatico: dbPlan.features?.includes('whatsapp') ?? false,
                            relatoriosFiltros: true,
                            exportacaoPdf: true,
                            automacoesCompletas: dbPlan.features?.includes('automacoes') ?? false,
                            relatoriosAvancados: dbPlan.features?.includes('relatorios_avancados') ?? false,
                          }
                       } as Plan;

                       subscriptionData = {
                         id: `sub-${client.id}`,
                         medicoId: client.id,
                         planoId: dbPlan.id,
                         plano: planData,
                         status: client.status === 'active' ? 'ativa' : 'cancelada',
                         dataInicio: new Date(client.created_at),
                         criadoEm: new Date(client.created_at),
                       };
                    }
                  }
                }

                const appUser: User = {
                  id: userId,
                  nome: profile?.full_name || session.user.user_metadata.full_name || email,
                  email: email,
                  tipo: systemRole === 'admin' ? 'admin' : 'medico',
                  status: 'ativo',
                  criadoEm: new Date(session.user.created_at),
                };

                set({
                  user: appUser,
                  plan: planData,
                  subscription: subscriptionData,
                  isAuthenticated: true,
                  isLoading: false,
                  systemRole: systemRole,
                  clienteId: systemRole === 'cliente' ? userId : null,
                });
             } catch (e) {
               console.error("Error restoring session:", e);
               // Force logout if error?
             }
           }
        } else {
           // if no session, ensure logout state
           if (get().isAuthenticated) {
              set({
                user: null,
                plan: null,
                subscription: null,
                isAuthenticated: false,
                systemRole: null,
                clienteId: null,
              });
           }
        }
      },
      
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
                message: `Limite de ${plan.recursos.maxPacientes} pacientes atingido. Faça upgrade.` 
              };
            }
            return { allowed: true };

          case 'whatsapp_auto':
            if (!plan.recursos.whatsappAutomatico) {
              return { allowed: false, message: 'Recurso indisponível no plano atual.' };
            }
            return { allowed: true };

          case 'export_pdf':
            if (!plan.recursos.exportacaoPdf) {
              return { allowed: false, message: 'Recurso indisponível no plano atual.' };
            }
            return { allowed: true };

          case 'automacoes':
            if (!plan.recursos.automacoesCompletas) {
              return { allowed: false, message: 'Recurso indisponível no plano atual.' };
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
        systemRole: state.systemRole,
        clienteId: state.clienteId,
      }),
    }
  )
);
