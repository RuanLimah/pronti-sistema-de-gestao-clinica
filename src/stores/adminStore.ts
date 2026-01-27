import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type DoctorStatus = 'ativo' | 'suspenso' | 'bloqueado';

export interface DoctorModules {
  agenda: boolean;
  financeiro: boolean;
  whatsapp: boolean;
  relatorios: boolean;
  prontuario: boolean;
}

export interface Doctor {
  id: string;
  nome: string;
  email: string;
  crp: string;
  telefone?: string;
  foto?: string;
  status: DoctorStatus;
  plano: 'basico' | 'profissional' | 'premium';
  modules: DoctorModules;
  ultimoAcesso: Date;
  criadoEm: Date;
  suspensaoMotivo?: string;
  bloqueioMotivo?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminNome: string;
  doctorId: string;
  doctorNome: string;
  acao: 'status_alterado' | 'plano_alterado' | 'modulo_alterado' | 'medico_criado' | 'medico_deletado';
  detalhes: string;
  valorAnterior?: string;
  valorNovo?: string;
  criadoEm: Date;
}

interface AdminStore {
  doctors: Doctor[];
  auditLogs: AuditLog[];
  
  // Doctor actions
  getDoctors: () => Doctor[];
  getDoctorById: (id: string) => Doctor | undefined;
  updateDoctorStatus: (id: string, status: DoctorStatus, motivo?: string, adminId?: string, adminNome?: string) => void;
  updateDoctorPlan: (id: string, plano: 'basico' | 'profissional' | 'premium', adminId?: string, adminNome?: string) => void;
  updateDoctorModule: (id: string, module: keyof DoctorModules, enabled: boolean, adminId?: string, adminNome?: string) => void;
  addDoctor: (doctor: Omit<Doctor, 'id' | 'criadoEm' | 'ultimoAcesso' | 'modules'>, adminId?: string, adminNome?: string) => void;
  deleteDoctor: (id: string, adminId?: string, adminNome?: string) => void;
  
  // Audit actions
  getAuditLogs: () => AuditLog[];
  getAuditLogsByDoctor: (doctorId: string) => AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'criadoEm'>) => void;
  
  // Stats
  getStats: () => {
    total: number;
    ativos: number;
    suspensos: number;
    bloqueados: number;
    porPlano: { basico: number; profissional: number; premium: number };
  };
}

// Mock initial data
const initialDoctors: Doctor[] = [
  {
    id: 'medico-1',
    nome: 'Dra. Ana Silva',
    email: 'dra.ana@pronti.com',
    crp: '06/123456',
    telefone: '(11) 99999-1111',
    status: 'ativo',
    plano: 'profissional',
    modules: { agenda: true, financeiro: true, whatsapp: true, relatorios: true, prontuario: true },
    ultimoAcesso: new Date(),
    criadoEm: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'medico-2',
    nome: 'Dr. Carlos Mendes',
    email: 'dr.carlos@pronti.com',
    crp: '06/789012',
    telefone: '(11) 99999-2222',
    status: 'ativo',
    plano: 'basico',
    modules: { agenda: true, financeiro: true, whatsapp: false, relatorios: false, prontuario: true },
    ultimoAcesso: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    criadoEm: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'medico-3',
    nome: 'Dra. Maria Santos',
    email: 'dra.maria@pronti.com',
    crp: '06/345678',
    telefone: '(11) 99999-3333',
    status: 'suspenso',
    plano: 'profissional',
    suspensaoMotivo: 'Inadimplência há 30 dias',
    modules: { agenda: true, financeiro: true, whatsapp: true, relatorios: true, prontuario: true },
    ultimoAcesso: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    criadoEm: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'medico-4',
    nome: 'Dr. Pedro Lima',
    email: 'dr.pedro@pronti.com',
    crp: '06/901234',
    telefone: '(11) 99999-4444',
    status: 'bloqueado',
    plano: 'basico',
    bloqueioMotivo: 'Violação dos termos de uso',
    modules: { agenda: false, financeiro: false, whatsapp: false, relatorios: false, prontuario: false },
    ultimoAcesso: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    criadoEm: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'medico-5',
    nome: 'Dra. Juliana Costa',
    email: 'dra.juliana@pronti.com',
    crp: '06/567890',
    telefone: '(11) 99999-5555',
    status: 'ativo',
    plano: 'premium',
    modules: { agenda: true, financeiro: true, whatsapp: true, relatorios: true, prontuario: true },
    ultimoAcesso: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    criadoEm: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    adminId: 'admin-1',
    adminNome: 'Administrador',
    doctorId: 'medico-3',
    doctorNome: 'Dra. Maria Santos',
    acao: 'status_alterado',
    detalhes: 'Status alterado para suspenso',
    valorAnterior: 'ativo',
    valorNovo: 'suspenso',
    criadoEm: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'audit-2',
    adminId: 'admin-1',
    adminNome: 'Administrador',
    doctorId: 'medico-4',
    doctorNome: 'Dr. Pedro Lima',
    acao: 'status_alterado',
    detalhes: 'Status alterado para bloqueado',
    valorAnterior: 'suspenso',
    valorNovo: 'bloqueado',
    criadoEm: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
];

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      doctors: initialDoctors,
      auditLogs: initialAuditLogs,

      getDoctors: () => get().doctors,
      
      getDoctorById: (id) => get().doctors.find(d => d.id === id),

      updateDoctorStatus: (id, status, motivo, adminId = 'admin-1', adminNome = 'Administrador') => {
        const doctor = get().doctors.find(d => d.id === id);
        if (!doctor) return;

        const valorAnterior = doctor.status;
        
        set(state => ({
          doctors: state.doctors.map(d => {
            if (d.id !== id) return d;
            
            const updates: Partial<Doctor> = { status };
            
            if (status === 'suspenso') {
              updates.suspensaoMotivo = motivo;
              updates.bloqueioMotivo = undefined;
            } else if (status === 'bloqueado') {
              updates.bloqueioMotivo = motivo;
              updates.suspensaoMotivo = undefined;
              // Disable all modules when blocked
              updates.modules = { agenda: false, financeiro: false, whatsapp: false, relatorios: false, prontuario: false };
            } else {
              updates.suspensaoMotivo = undefined;
              updates.bloqueioMotivo = undefined;
            }
            
            return { ...d, ...updates };
          }),
        }));

        get().addAuditLog({
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

      updateDoctorPlan: (id, plano, adminId = 'admin-1', adminNome = 'Administrador') => {
        const doctor = get().doctors.find(d => d.id === id);
        if (!doctor) return;

        const valorAnterior = doctor.plano;
        
        set(state => ({
          doctors: state.doctors.map(d => 
            d.id === id ? { ...d, plano } : d
          ),
        }));

        get().addAuditLog({
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

      updateDoctorModule: (id, module, enabled, adminId = 'admin-1', adminNome = 'Administrador') => {
        const doctor = get().doctors.find(d => d.id === id);
        if (!doctor) return;
        
        set(state => ({
          doctors: state.doctors.map(d => 
            d.id === id 
              ? { ...d, modules: { ...d.modules, [module]: enabled } }
              : d
          ),
        }));

        get().addAuditLog({
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

      addDoctor: (doctorData, adminId = 'admin-1', adminNome = 'Administrador') => {
        const newDoctor: Doctor = {
          ...doctorData,
          id: `medico-${Date.now()}`,
          criadoEm: new Date(),
          ultimoAcesso: new Date(),
          modules: { agenda: true, financeiro: true, whatsapp: false, relatorios: false, prontuario: true },
        };

        set(state => ({
          doctors: [...state.doctors, newDoctor],
        }));

        get().addAuditLog({
          adminId,
          adminNome,
          doctorId: newDoctor.id,
          doctorNome: newDoctor.nome,
          acao: 'medico_criado',
          detalhes: `Médico "${newDoctor.nome}" criado com plano ${newDoctor.plano}`,
        });
      },

      deleteDoctor: (id, adminId = 'admin-1', adminNome = 'Administrador') => {
        const doctor = get().doctors.find(d => d.id === id);
        if (!doctor) return;

        set(state => ({
          doctors: state.doctors.filter(d => d.id !== id),
        }));

        get().addAuditLog({
          adminId,
          adminNome,
          doctorId: id,
          doctorNome: doctor.nome,
          acao: 'medico_deletado',
          detalhes: `Médico "${doctor.nome}" removido do sistema`,
        });
      },

      getAuditLogs: () => get().auditLogs.sort((a, b) => 
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      ),
      
      getAuditLogsByDoctor: (doctorId) => 
        get().auditLogs
          .filter(log => log.doctorId === doctorId)
          .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()),

      addAuditLog: (log) => {
        const newLog: AuditLog = {
          ...log,
          id: `audit-${Date.now()}`,
          criadoEm: new Date(),
        };

        set(state => ({
          auditLogs: [newLog, ...state.auditLogs],
        }));
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
    }
  )
);
