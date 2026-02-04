import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Doctor, AuditLog, Plan, Addon, DoctorModules, DoctorStatus } from '@/types/admin';
import { SupabaseAdminRepository } from '@/core/infra/repositories/SupabaseAdminRepository';

const adminRepo = new SupabaseAdminRepository();

interface AdminStore {
  doctors: Doctor[];
  auditLogs: AuditLog[];
  plans: Plan[];
  addons: Addon[];
  isLoading: boolean;
  
  // Data Fetching
  fetchDoctors: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  fetchAddons: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  fetchAll: () => Promise<void>;

  // Doctor actions
  getDoctors: () => Doctor[];
  getDoctorById: (id: string) => Doctor | undefined;
  updateDoctorStatus: (id: string, status: DoctorStatus, motivo?: string, adminId?: string, adminNome?: string) => Promise<void>;
  updateDoctorPlan: (id: string, plano: any, adminId?: string, adminNome?: string) => Promise<void>;
  updateDoctorModule: (id: string, module: keyof DoctorModules, enabled: boolean, adminId?: string, adminNome?: string) => Promise<void>;
  toggleDoctorAddon: (id: string, addonSlug: string, enabled: boolean, adminId?: string, adminNome?: string) => Promise<void>;
  addDoctor: (doctor: Omit<Doctor, 'id' | 'criadoEm' | 'ultimoAcesso' | 'modules'>, adminId?: string, adminNome?: string) => Promise<void>;
  updateDoctorLimits: (id: string, limits: Partial<Plan['limites']>, adminId?: string, adminNome?: string) => Promise<void>;
  deleteDoctor: (id: string, adminId?: string, adminNome?: string) => Promise<void>;
  
  // Plan actions
  updatePlan: (plan: Plan) => Promise<void>;
  createPlan: (plan: Omit<Plan, 'id' | 'assinantes'>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;

  // Addon actions
  updateAddon: (addon: Addon) => Promise<void>;
  createAddon: (addon: Omit<Addon, 'id' | 'assinantes'>) => Promise<void>;

  // Audit actions
  getAuditLogs: () => AuditLog[];
  getAuditLogsByDoctor: (doctorId: string) => AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'criadoEm'>) => Promise<void>;
  
  // Stats
  getStats: () => {
    total: number;
    ativos: number;
    suspensos: number;
    bloqueados: number;
    porPlano: { basico: number; profissional: number; premium: number };
  };
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      doctors: [],
      auditLogs: [],
      plans: [],
      addons: [],
      isLoading: false,

      fetchDoctors: async () => {
        set({ isLoading: true });
        try {
          const doctors = await adminRepo.listDoctors();
          set({ doctors });
        } catch (error) {
          console.error('Error fetching doctors:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchPlans: async () => {
        set({ isLoading: true });
        try {
          const plans = await adminRepo.listPlans();
          set({ plans });
        } catch (error) {
          console.error('Error fetching plans:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchAddons: async () => {
        set({ isLoading: true });
        try {
          const addons = await adminRepo.listAddons();
          set({ addons });
        } catch (error) {
          console.error('Error fetching addons:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchAuditLogs: async () => {
        set({ isLoading: true });
        try {
          const auditLogs = await adminRepo.listAuditLogs();
          set({ auditLogs });
        } catch (error) {
          console.error('Error fetching audit logs:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchAll: async () => {
        set({ isLoading: true });
        try {
          const [doctors, plans, addons, auditLogs] = await Promise.all([
            adminRepo.listDoctors(),
            adminRepo.listPlans(),
            adminRepo.listAddons(),
            adminRepo.listAuditLogs(),
          ]);
          set({ doctors, plans, addons, auditLogs });
        } catch (error) {
          console.error('Error fetching admin data:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      getDoctors: () => get().doctors,
      
      getDoctorById: (id) => get().doctors.find(d => d.id === id),

      updateDoctorStatus: async (id, status, motivo, adminId = 'admin-1', adminNome = 'Administrador') => {
        const doctor = get().doctors.find(d => d.id === id);
        if (!doctor) return;

        const valorAnterior = doctor.status;
        
        // Optimistic update
        set(state => ({
          doctors: state.doctors.map(d => {
            if (d.id !== id) return d;
            return { ...d, status, suspensaoMotivo: status === 'suspenso' ? motivo : undefined, bloqueioMotivo: status === 'bloqueado' ? motivo : undefined };
          }),
        }));

        try {
          await adminRepo.updateClientStatus(id, status);
        } catch (error) {
          console.error('Error updating client status:', error);
          // Revert optimistic update?
        }

        await get().addAuditLog({
          adminId,
          adminNome,
          doctorId: id,
          doctorNome: doctor.nome,
          acao: 'status_alterado',
          detalhes: `Status alterado de ${valorAnterior} para ${status}${motivo ? ` - Motivo: ${motivo}` : ''}`,
          valorAnterior,
          valorNovo: status,
        });
      },

      updateDoctorPlan: async (id, plano, adminId = 'admin-1', adminNome = 'Administrador') => {
        const doctor = get().doctors.find(d => d.id === id);
        if (!doctor) return;

        const valorAnterior = doctor.plano;
        
        set(state => ({
          doctors: state.doctors.map(d => 
            d.id === id ? { ...d, plano } : d
          ),
        }));

        try {
          await adminRepo.updateClientPlan(id, plano);
        } catch (error) {
          console.error('Error updating client plan:', error);
        }
        
        await get().addAuditLog({
          adminId,
          adminNome,
          doctorId: id,
          doctorNome: doctor.nome,
          acao: 'plano_alterado',
          detalhes: `Plano alterado de ${valorAnterior} para ${plano}`,
          valorAnterior,
          valorNovo: plano,
        });
      },

      updateDoctorModule: async (id, module, enabled, adminId = 'admin-1', adminNome = 'Administrador') => {
        const doctor = get().doctors.find(d => d.id === id);
        if (!doctor) return;
        
        const newModules = { ...doctor.modules, [module]: enabled };

        set(state => ({
          doctors: state.doctors.map(d => 
            d.id === id 
              ? { ...d, modules: newModules }
              : d
          ),
        }));

        try {
          await adminRepo.updateClientModules(id, newModules);
        } catch (error) {
          console.error('Error updating client modules:', error);
        }

        await get().addAuditLog({
          adminId,
          adminNome,
          doctorId: id,
          doctorNome: doctor.nome,
          acao: 'modulo_alterado',
          detalhes: `Módulo "${module}" ${enabled ? 'ativado' : 'desativado'}`,
          valorAnterior: String(!enabled),
          valorNovo: String(enabled),
        });
      },

      updateDoctorLimits: async (id, limits, adminId = 'admin-1', adminNome = 'Administrador') => {
        const doctor = get().doctors.find(d => d.id === id);
        if (!doctor) return;

        set(state => ({
          doctors: state.doctors.map(d =>
            d.id === id
              ? { ...d, customLimits: limits }
              : d
          ),
        }));

        try {
          await adminRepo.updateClientLimits(id, limits);
        } catch (error) {
          console.error('Error updating client limits:', error);
        }

        await get().addAuditLog({
          adminId,
          adminNome,
          doctorId: id,
          doctorNome: doctor.nome,
          acao: 'plano_alterado', // Using similar action type
          detalhes: `Limites personalizados atualizados`,
          valorAnterior: JSON.stringify(doctor.customLimits || {}),
          valorNovo: JSON.stringify(limits),
        });
      },

      toggleDoctorAddon: async (id, addonSlug, enabled, adminId = 'admin-1', adminNome = 'Administrador') => {
        const doctor = get().doctors.find(d => d.id === id);
        if (!doctor) return;
        
        // Optimistic update
        const newAddons = enabled 
          ? [...(doctor.addons || []), addonSlug]
          : (doctor.addons || []).filter(a => a !== addonSlug);

        set(state => ({
          doctors: state.doctors.map(d => 
            d.id === id 
              ? { ...d, addons: newAddons }
              : d
          ),
        }));

        try {
          if (enabled) {
            await adminRepo.addClientAddon(id, addonSlug);
          } else {
            await adminRepo.removeClientAddon(id, addonSlug);
          }
        } catch (error) {
          console.error('Error toggling client addon:', error);
          // Revert on error could be implemented here
        }

        await get().addAuditLog({
          adminId,
          adminNome,
          doctorId: id,
          doctorNome: doctor.nome,
          acao: 'modulo_alterado', // Using similar action type or create new one
          detalhes: `Addon "${addonSlug}" ${enabled ? 'ativado' : 'desativado'}`,
          valorAnterior: String(!enabled),
          valorNovo: String(enabled),
        });
      },

      addDoctor: async (doctorData, adminId = 'admin-1', adminNome = 'Administrador') => {
        // Creating a user requires Auth API which is restricted on client-side.
        // We log a warning for now.
        console.warn('Creating users via Admin Panel is not fully supported without backend function.');
        
        await get().addAuditLog({
          adminId,
          adminNome,
          doctorId: 'new-id',
          doctorNome: doctorData.nome,
          acao: 'medico_criado',
          detalhes: `Tentativa de criar médico "${doctorData.nome}" (Requer Backend)`,
        });
        
        get().fetchDoctors();
      },

      deleteDoctor: async (id, adminId = 'admin-1', adminNome = 'Administrador') => {
        const doctor = get().doctors.find(d => d.id === id);
        if (!doctor) return;

        try {
          await adminRepo.deleteClient(id);
        } catch (error) {
          console.error('Error deleting client:', error);
          return;
        }
        
        set(state => ({
          doctors: state.doctors.filter(d => d.id !== id),
        }));

        await get().addAuditLog({
          adminId,
          adminNome,
          doctorId: id,
          doctorNome: doctor.nome,
          acao: 'medico_deletado',
          detalhes: `Médico "${doctor.nome}" removido do sistema`,
        });
      },

      updatePlan: async (plan) => {
        await adminRepo.updatePlan(plan);
        set(state => ({
          plans: state.plans.map(p => p.id === plan.id ? plan : p)
        }));
      },

      createPlan: async (planData) => {
        const newPlan = await adminRepo.createPlan(planData);
        set(state => ({
          plans: [...state.plans, newPlan]
        }));
      },

      deletePlan: async (id) => {
        await adminRepo.deletePlan(id);
        set(state => ({
          plans: state.plans.filter(p => p.id !== id)
        }));
      },

      updateAddon: async (addon) => {
        await adminRepo.updateAddon(addon);
        set(state => ({
          addons: state.addons.map(a => a.id === addon.id ? addon : a)
        }));
      },

      createAddon: async (addonData) => {
        const newAddon = await adminRepo.createAddon(addonData);
        set(state => ({
          addons: [...state.addons, newAddon]
        }));
      },

      getAuditLogs: () => get().auditLogs.sort((a, b) => 
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      ),
      
      getAuditLogsByDoctor: (doctorId) => 
        get().auditLogs
          .filter(log => log.doctorId === doctorId)
          .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()),

      addAuditLog: async (log) => {
        await adminRepo.createAuditLog(log);
        get().fetchAuditLogs();
      },

      getStats: () => {
        const doctors = get().doctors;
        return {
          total: doctors.length,
          ativos: doctors.filter(d => d.status === 'ativo').length,
          suspensos: doctors.filter(d => d.status === 'suspenso').length,
          bloqueados: doctors.filter(d => d.status === 'bloqueado').length,
          porPlano: {
            basico: doctors.filter(d => d.plano === 'basico').length,
            profissional: doctors.filter(d => d.plano === 'profissional').length,
            premium: doctors.filter(d => d.plano === 'premium').length,
          },
        };
      },
    }),
    {
      name: 'pronti-admin',
      partialize: (state) => ({
        // Persistir apenas configurações que não mudam frequentemente ou não são sensíveis a Date serialization
        // Evitar persistir listas completas que podem conter Dates
        // No caso do admin, as listas são menos críticas para offline first, mas podem causar o mesmo bug
        // doctors, plans, addons podem ser persistidos se tratarmos as datas na reidratação
        // Por segurança, vamos evitar persistir dados dinâmicos complexos
        plans: state.plans,
        addons: state.addons,
        // doctors e auditLogs carregam muitos dados com datas, melhor buscar sempre
      }),
    }
  )
);
