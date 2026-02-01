import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Plan, Subscription, PlanType, UserRole, PlanResources } from '@/types';
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
  getFeatureFlags: () => PlanResources;
  hasFeature: (feature: keyof PlanResources) => boolean;
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
          }

          // 2. Fetch Client Data
          const { data: client, error: clientError } = await supabase
              .from('clients')
              .select(`
                *,
                plans (*)
              `)
              .eq('id', userId)
              .single();

          // Determine System Role
          let systemRole: SystemRole = 'cliente';
          
          // Priority: Profiles table (as requested)
          if (profile?.role === 'admin') {
            systemRole = 'admin';
          } else if (client?.role === 'ADMIN') {
            // Fallback to legacy client role
            systemRole = 'admin';
          } else if (email === 'iruanlimah@gmail.com') {
             // Hardcoded safety check
             systemRole = 'admin';
          }
          
          // 3. Process Client Data
          let clientData = null;
          let planData = null;
          let subscriptionData: Subscription | null = null;

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

          if (error) throw error;
          
          if (data.user) {
            // Trigger on database should handle profile creation.
            // We can optionally create a client record if needed for legacy support, 
            // but for now we rely on the profiles table as requested.
            
            // If session is returned (Auto Confirm enabled), log them in immediately
            if (data.session) {
               // Reuse login logic or just set state?
               // Safest is to just call login or manually set state.
               // Let's call checkSession to hydrate store
               await get().checkSession();
            }
          }
          
          set({ isLoading: false });
          return { success: true };

        } catch (err: any) {
           console.error('Signup error:', err);
           set({ isLoading: false });
           return { success: false, error: err.message || 'Erro inesperado' };
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

                // 2. Fetch Client Data
                const { data: client } = await supabase
                    .from('clients')
                    .select(`*, plans (*)`)
                    .eq('id', userId)
                    .single();
                    
                // Determine System Role
                let systemRole: SystemRole = 'cliente';
                
                // Priority: Profiles table
                if (profile?.role === 'admin') {
                   systemRole = 'admin';
                } else if (client?.role === 'ADMIN') {
                   systemRole = 'admin';
                } else if (email === 'iruanlimah@gmail.com') {
                   systemRole = 'admin';
                }

                // 3. Process Client Data
                let clientData = null;
                let planData = null;
                let subscriptionData: Subscription | null = null;

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
             } catch (err) {
               console.error('Session restoration error:', err);
               set({ isLoading: false });
             }
           }
        }
      },

      isAdmin: () => get().systemRole === 'admin',
      isCliente: () => get().systemRole === 'cliente',
      getClienteId: () => get().clienteId,
      
      getFeatureFlags: () => {
         const plan = get().plan;
         if (!plan) return {
            maxPacientes: null,
            agendaCompleta: false,
            financeiroAvancado: false,
            whatsappAutomatico: false,
            relatoriosFiltros: false,
            exportacaoPdf: false,
            automacoesCompletas: false,
            relatoriosAvancados: false,
         };
         return plan.recursos;
      },
      
      hasFeature: (feature) => {
         const flags = get().getFeatureFlags();
         return !!flags[feature];
      },
      
      checkPlanLimit: (feature, currentCount = 0) => {
         const plan = get().plan;
         if (!plan) return { allowed: false, message: 'Nenhum plano ativo.' };
         
         if (feature === 'pacientes') {
            const max = plan.recursos.maxPacientes;
            if (max === null) return { allowed: true }; // Unlimited
            if (currentCount >= max) return { allowed: false, message: `Limite de pacientes atingido (${max}). Faça upgrade do plano.` };
         }
         
         return { allowed: true };
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
