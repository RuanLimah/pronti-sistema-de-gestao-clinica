import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Plan, Subscription, PlanType, UserRole, PlanResources } from '@/types';
import { supabase } from '@/lib/supabase';

// Roles do sistema
export type SystemRole = 'admin' | 'cliente';

import { Session } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  session: Session | null;
  plan: Plan | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Role do sistema
  systemRole: SystemRole | null;
  clienteId: string | null; // ID do cliente quando role = 'cliente'
  
  // State for session token
  sessionToken: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  
  // Role checks
  isAdmin: () => boolean;
  isCliente: () => boolean;
  getClienteId: () => string | null;
  
  // Feature checks
  getFeatureFlags: () => PlanResources;
  hasFeature: (feature: keyof PlanResources) => boolean;
  checkPlanLimit: (feature: string, currentCount?: number) => { allowed: boolean; message?: string };
  
  // Initialization
  isInitialized: boolean;
  initializeAuthListener: () => () => void;
}

// Helper to ensure client record exists
async function ensureClientExists(userId: string, email: string) {
  try {
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', userId)
      .single();

    if (client) return;

    // Get default plan (Free)
    // Priority: 'free' only
    let { data: plan } = await supabase
      .from('plans')
      .select('id')
      .eq('type', 'free')
      .single();

    if (!plan) {
      console.log('Default plan (free) not found. Skipping creation (requires admin).');
      // Create FREE plan if not exists
      /* 
      const { data: newPlan, error: createPlanError } = await supabase
        .from('plans')
        .insert({
          name: 'Plano Gratuito',
          type: 'free',
          price: 0,
          active: true,
          features: ['agenda_simples', 'prontuario_basico'],
          limits: { max_patients: 5, max_medical_records: 50, max_users: 1 }
        })
        .select('id')
        .single();
      
      if (createPlanError || !newPlan) {
        console.error('Error creating default plan:', createPlanError);
        return;
      }
      plan = newPlan;
      */
      return; // Exit if no plan found to avoid client creation error
    }

    // Create client
    const { error } = await supabase.from('clients').insert({
      id: userId,
      email: email,
      plan_id: plan.id,
      role: 'CLIENTE',
      status: 'active',
      subscription_status: 'trial'
    });

    if (error) {
      console.error('Error creating client record:', error);
    }
  } catch (err) {
    console.error('Unexpected error in ensureClientExists:', err);
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      plan: null,
      subscription: null,
      isAuthenticated: false,
      isLoading: true, // Start with loading true
      isInitialized: false,
      systemRole: null,
      clienteId: null,
      sessionToken: null,

      initializeAuthListener: () => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth event:', event);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
             // Ensure session is saved!
             if (session) {
                // Keep existing user if id matches to avoid flickering, but update session
                const { user } = get();
                
                // If we don't have a user or it's a different one, we might need to fetch data
                // BUT first, let's make sure session is stored so tokens are available
                set({ session }); 

                // Automatic Profile Creation (as requested)
                if (event === 'SIGNED_IN' && session.user) {
                   try {
                     const { error: upsertError } = await supabase.from('profiles').upsert({
                       id: session.user.id,
                       email: session.user.email,
                       full_name: session.user.user_metadata.full_name,
                       avatar_url: session.user.user_metadata.avatar_url,
                     }, { onConflict: 'id' });
                     
                     if (upsertError) console.error('Error auto-creating profile:', upsertError);
                   } catch (err) {
                     console.error('Exception auto-creating profile:', err);
                   }
                }

                if (!user || user.id !== session.user.id) {
                   await get().checkSession();
                }
             }
          } else if (event === 'SIGNED_OUT') {
            set({ 
              user: null, 
              session: null,
              plan: null, 
              subscription: null, 
              isAuthenticated: false, 
              systemRole: null, 
              clienteId: null,
              isInitialized: true,
              isLoading: false,
              sessionToken: null
            });
          }
        });
        
        return () => subscription.unsubscribe();
      },

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
          
          // Save session immediately
          set({ session });

          // Fetch profile and client data
          const userId = session.user.id;

          // Ensure client record exists
          // await ensureClientExists(userId, email);
          
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
          
          // Priority 1: app_metadata (Source of Truth for Admin)
          const appMetadata = session.user.app_metadata;
          if (appMetadata?.role === 'admin') {
            systemRole = 'admin';
          } 
          // Priority 2: Profiles table (Legacy/Fallback)
          else if (profile?.role === 'admin') {
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
            session: session, // Ensure session is in final state
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

      loginWithGoogle: async () => {
        set({ isLoading: true });
        // Use window.location.origin to support both localhost and production
        const redirectTo = `${window.location.origin}/auth/callback`;
        console.log("Iniciando login Google. RedirectTo:", redirectTo);
        
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          });
          
          if (error) throw error;
        } catch (error) {
           console.error('Google login error:', error);
           set({ isLoading: false });
           throw error;
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

            // Try to ensure client record exists immediately (best effort)
            // This ensures the user appears in Admin > Clients list even before first login
            // Note: This might fail if RLS prevents insertion, but it's worth a try.
            // await ensureClientExists(data.user.id, email);
            
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
        // Only set loading if not already authenticated (to avoid flickering on refresh if persisted)
        if (!get().isAuthenticated) {
           set({ isLoading: true });
        }
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;

          // Always update session if exists
          if (session) {
             set({ session });
          }

          if (session) {
             // If we already have a user and it matches the session, just ensure isInitialized
             const { user } = get();
             if (user && user.id === session.user.id && get().isAuthenticated) {
                set({ isInitialized: true, isLoading: false });
                return;
             }

             // Reuse fetch logic:
             try {
                const userId = session.user.id;
                const email = session.user.email || '';

                // Ensure client record exists
                // await ensureClientExists(userId, email);
                
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
                
                // Priority 1: app_metadata (Source of Truth for Admin)
                const appMetadata = session.user.app_metadata;
                if (appMetadata?.role === 'admin') {
                   systemRole = 'admin';
                } 
                // Priority 2: Profiles table (Legacy/Fallback)
                else if (profile?.role === 'admin') {
                   systemRole = 'admin';
                } 
                // Priority 3: Hardcoded safety check
                else if (email === 'iruanlimah@gmail.com') {
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
                  session: session, // Update session
                  plan: planData,
                  subscription: subscriptionData,
                  isAuthenticated: true,
                  isLoading: false,
                  isInitialized: true,
                  systemRole: systemRole,
                  clienteId: systemRole === 'cliente' ? userId : null,
                });
             } catch (fetchError) {
                console.error('Error fetching user data in checkSession:', fetchError);
                // Keep session but maybe retry? Or logout?
                // For now, allow it but log error
                set({ isLoading: false, isInitialized: true });
             }
          } else {
             // No session
             set({ 
               user: null, 
               session: null,
               plan: null,
               subscription: null,
               isAuthenticated: false, 
               isLoading: false,
               isInitialized: true 
             });
          }
        } catch (err) {
          console.error('Session check failed:', err);
          set({ 
            user: null, 
            session: null,
            isAuthenticated: false, 
            isLoading: false,
            isInitialized: true
          });
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        try {
            const updates: any = {};
            if (data.nome) updates.nome = data.nome;
            if (data.telefone) updates.telefone = data.telefone;
            if (data.crp) updates.crp = data.crp;
            if (data.especialidades) updates.especialidades = data.especialidades;
            if (data.tipoProfissional) updates.tipo_profissional = data.tipoProfissional;
            if (data.foto) updates.avatar_url = data.foto;
            
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // Update local state
            set((state) => ({
                user: state.user ? { ...state.user, ...data } : null
            }));
            
            // Also update clients table if needed (redundancy)
            if (data.nome || data.telefone) {
                 await supabase.from('clients').update({
                    name: data.nome,
                    phone: data.telefone
                 }).eq('id', user.id);
            }

        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
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
