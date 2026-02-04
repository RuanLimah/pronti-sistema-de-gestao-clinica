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
  plano: 'gratuito' | 'essencial' | 'basico' | 'profissional' | 'premium' | 'clinica';
  modules: DoctorModules;
  addons: string[];
  customLimits?: Partial<Plan['limites']>;
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

export interface PlanFeature {
  key: string;
  label: string;
  enabled: boolean;
}

export interface Plan {
  id: string;
  nome: string;
  tier: 'gratuito' | 'essencial' | 'profissional' | 'clinica';
  valor: number;
  limites: {
    maxPacientes: number | null;
    maxProntuarios: number | null;
    maxUsuarios: number;
  };
  recursos: PlanFeature[];
  ativo: boolean;
  assinantes: number;
  subtitle?: string;
  highlighted?: boolean;
  marketing_features?: { text: string; included: boolean }[];
}

export interface Addon {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  valor: number;
  icon: string;
  ativo: boolean;
  assinantes: number;
  categoria: 'comunicacao' | 'armazenamento' | 'relatorios' | 'gestao' | 'personalizacao';
}
