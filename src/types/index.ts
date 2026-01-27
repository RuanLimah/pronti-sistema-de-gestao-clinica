// ============= PRONTI - Sistema de Gestão para Psicólogos =============

// Enums
export type UserRole = 'admin' | 'medico';
export type UserStatus = 'ativo' | 'inadimplente' | 'bloqueado';
export type PlanType = 'basico' | 'profissional' | 'premium';
export type PatientStatus = 'ativo' | 'inativo';
export type AppointmentStatus = 'agendado' | 'realizado' | 'cancelado' | 'faltou';
export type PaymentStatus = 'pendente' | 'pago' | 'cancelado';
export type PaymentMethod = 'pix' | 'cartao' | 'dinheiro' | 'transferencia';
export type NotificationType = 'agendamento' | 'cancelamento' | 'pagamento' | 'plano' | 'sistema';

// Usuário
export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: UserRole;
  status: UserStatus;
  foto?: string;
  crp?: string;
  telefone?: string;
  criadoEm: Date;
  atualizadoEm?: Date;
}

// Plano
export interface Plan {
  id: string;
  nome: string;
  tipo: PlanType;
  valor: number;
  recursos: PlanResources;
  ativo: boolean;
}

export interface PlanResources {
  maxPacientes: number | null; // null = ilimitado
  agendaCompleta: boolean;
  financeiroAvancado: boolean;
  whatsappAutomatico: boolean;
  relatoriosFiltros: boolean;
  exportacaoPdf: boolean;
  automacoesCompletas: boolean;
  relatoriosAvancados: boolean;
}

// Assinatura
export interface Subscription {
  id: string;
  medicoId: string;
  planoId: string;
  plano?: Plan;
  status: 'ativa' | 'cancelada' | 'expirada';
  dataInicio: Date;
  dataFim?: Date;
  criadoEm: Date;
}

// Histórico de Planos
export interface PlanHistory {
  id: string;
  medicoId: string;
  planoAnterior: PlanType;
  planoNovo: PlanType;
  motivo?: string;
  criadoPor: string;
  criadoEm: Date;
}

// Paciente
export interface Patient {
  id: string;
  medicoId: string;
  nome: string;
  email?: string;
  telefone: string;
  dataNascimento?: Date;
  cpf?: string;
  endereco?: string;
  status: PatientStatus;
  observacoes?: string;
  valorConsulta?: number;
  consentimentoLgpd: boolean;
  consentimentoData?: Date;
  criadoEm: Date;
  atualizadoEm?: Date;
}

// Prontuário
export interface MedicalRecord {
  id: string;
  pacienteId: string;
  texto: string;
  criadoEm: Date;
  atualizadoEm?: Date;
}

// Atendimento
export interface Appointment {
  id: string;
  pacienteId: string;
  medicoId: string;
  paciente?: Patient;
  data: Date;
  hora: string;
  duracao: number; // minutos
  status: AppointmentStatus;
  valor: number;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm?: Date;
}

// Pagamento
export interface Payment {
  id: string;
  pacienteId: string;
  atendimentoId?: string;
  paciente?: Patient;
  atendimento?: Appointment;
  valor: number;
  formaPagamento: PaymentMethod;
  status: PaymentStatus;
  data: Date;
  criadoEm: Date;
}

// Notificação
export interface Notification {
  id: string;
  medicoId: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link?: string;
  data: Date;
}

// Mensagem WhatsApp
export interface WhatsAppMessage {
  id: string;
  pacienteId: string;
  atendimentoId?: string;
  paciente?: Patient;
  tipo: 'lembrete' | 'confirmacao' | 'cancelamento' | 'personalizada';
  mensagem: string;
  agendadoPara: Date;
  enviadoEm?: Date;
  status: 'pendente' | 'enviado' | 'falhou';
}

// Configurações do Médico
export interface DoctorSettings {
  medicoId: string;
  valorPadraoConsulta: number;
  duracaoPadraoConsulta: number;
  horaInicio: string;
  horaFim: string;
  diasAtendimento: number[];
  lembreteAutomatico: boolean;
  antecedenciaLembrete: number; // horas
  mensagemLembrete: string;
  mensagemConfirmacao: string;
  notificacoesEmail: boolean;
  notificacoesPush: boolean;
}

// Stats Dashboard
export interface DashboardStats {
  atendimentosHoje: number;
  pacientesAtivos: number;
  faturamentoMes: number;
  proximoAtendimento?: {
    paciente: string;
    hora: string;
  };
  recebido: number;
  pendente: number;
}

// Relatórios
export interface ReportData {
  periodo: string;
  totalAtendimentos: number;
  atendimentosRealizados: number;
  atendimentosCancelados: number;
  faturamento: number;
  recebido: number;
  pendente: number;
  pacientesAtivos: number;
  taxaFaltas: number;
}

// Auth Context
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  plan: Plan | null;
  subscription: Subscription | null;
}

// Feature Flags baseado no plano
export interface FeatureFlags {
  canAddPatient: boolean;
  patientsRemaining: number | null;
  hasAdvancedSchedule: boolean;
  hasAdvancedFinancial: boolean;
  hasWhatsAppAuto: boolean;
  hasReportFilters: boolean;
  hasPdfExport: boolean;
  hasAutomations: boolean;
  hasAdvancedReports: boolean;
}
