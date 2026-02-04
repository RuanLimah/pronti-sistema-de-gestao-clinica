// ============= PRONTI - Data Store =============
// Integrado com Supabase para persistência de dados

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SupabasePatientRepository } from '@/core/infra/repositories/SupabasePatientRepository';
import { SupabaseAppointmentRepository } from '@/core/infra/repositories/SupabaseAppointmentRepository';
import { SupabaseMedicalRecordRepository } from '@/core/infra/repositories/SupabaseMedicalRecordRepository';
import { SupabasePaymentRepository } from '@/core/infra/repositories/SupabasePaymentRepository';
import { SupabaseExamRepository } from '@/core/infra/repositories/SupabaseExamRepository';
import { SupabaseNotificationRepository } from '@/core/infra/repositories/SupabaseNotificationRepository';

import { Patient as DomainPatient } from '@/core/domain/entities/Patient';
import { Appointment as DomainAppointment } from '@/core/domain/entities/Appointment';
import { MedicalRecord as DomainMedicalRecord } from '@/core/domain/entities/MedicalRecord';
import { Payment as DomainPayment } from '@/core/domain/entities/Payment';
import { Exam as DomainExam } from '@/core/domain/entities/Exam';
import { Notification as DomainNotification } from '@/core/domain/entities/Notification';

const patientRepo = new SupabasePatientRepository();
const appointmentRepo = new SupabaseAppointmentRepository();
const medicalRecordRepo = new SupabaseMedicalRecordRepository();
const paymentRepo = new SupabasePaymentRepository();
const examRepo = new SupabaseExamRepository();
const notificationRepo = new SupabaseNotificationRepository();

async function fetchWithRetry<T>(fetchFn: () => Promise<T>, retries: number = 3): Promise<T> {
  try {
    return await fetchFn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      return fetchWithRetry(fetchFn, retries - 1);
    }
    throw error;
  }
}

const mapToStorePatient = (p: DomainPatient): Paciente => ({
  id: p.id,
  medicoId: p.user_id,
  nome: p.name,
  telefone: p.phone,
  email: p.email || undefined,
  status: p.active ? 'ativo' : 'inativo',
  valorConsulta: p.consultation_value || undefined,
  criadoEm: new Date(p.created_at),
  atualizadoEm: new Date(p.updated_at),
  dataNascimento: p.birth_date || undefined,
  observacoesGerais: p.notes || undefined,
  queixaPrincipal: p.main_complaint || undefined,
  historicoDoencaAtual: p.current_illness_history || undefined,
  antecedentesPessoais: p.personal_history || undefined,
  antecedentesFamiliares: p.family_history || undefined,
  alergias: p.allergies || undefined,
  medicamentosEmUso: p.medications || undefined,
});

const mapToStoreAppointment = (a: DomainAppointment): Atendimento => ({
  id: a.id,
  pacienteId: a.patient_id,
  medicoId: a.user_id,
  data: new Date(a.date + 'T' + a.time), // Combine date and time
  hora: a.time,
  status: a.status === 'pending' ? 'agendado' : a.status === 'approved' ? 'realizado' : 'cancelado',
  observacoes: a.notes || undefined,
  criadoEm: new Date(a.created_at),
  atualizadoEm: new Date(a.updated_at),
});

const mapToStoreMedicalRecord = (r: DomainMedicalRecord): Prontuario => ({
  id: r.id,
  pacienteId: r.patient_id,
  medicoId: r.client_id,
  profissionalNome: r.professional_name,
  texto: r.content,
  criadoEm: new Date(r.created_at),
  atualizadoEm: new Date(r.updated_at),
});

const mapToStorePayment = (p: DomainPayment): Pagamento => ({
  id: p.id,
  pacienteId: p.patient_id,
  atendimentoId: p.appointment_id,
  valor: p.amount,
  formaPagamento: p.method,
  status: p.status === 'paid' ? 'pago' : 'pendente',
  data: new Date(p.date),
  dataPagamento: p.paid_at ? new Date(p.paid_at) : undefined,
  criadoEm: new Date(p.created_at),
  atualizadoEm: new Date(p.updated_at),
});

const mapToStoreExam = (e: DomainExam): ExameMedico => ({
  id: e.id,
  pacienteId: e.patient_id,
  medicoId: e.client_id,
  nome: e.name,
  tipo: e.type,
  descricao: e.description,
  arquivo: {
    nome: e.file_name || e.name,
    tipo: e.file_type || 'application/octet-stream',
    tamanho: e.file_size || 0,
    url: e.file_url || '',
  },
  criadoEm: new Date(e.created_at),
  atualizadoEm: new Date(e.updated_at),
});

const mapToStoreNotification = (n: DomainNotification): Notificacao => ({
  id: n.id,
  medicoId: n.client_id,
  tipo: n.type,
  titulo: n.title,
  mensagem: n.message,
  lida: n.read,
  link: n.link,
  data: new Date(n.created_at),
});

// ============= Tipos das Entidades =============

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: 'admin' | 'medico';
  foto?: string;
  criadoEm: Date;
}

export interface Configuracoes {
  id: string;
  medicoId: string;
  valorPadraoConsulta: number;
  duracaoSessao: number;
  intervaloSessoes: number;
  horarioInicio: string;
  horarioFim: string;
  notificacaoLembrete: boolean;
  notificacaoAgendamento: boolean;
  notificacaoPagamento: boolean;
  notificacaoRelatorio: boolean;
  avatarUrl?: string;
  criadoEm: Date;
  atualizadoEm?: Date;
}

export interface Paciente {
  id: string;
  medicoId: string;
  nome: string;
  telefone: string;
  email?: string;
  dataNascimento?: string;
  status: 'ativo' | 'inativo';
  valorConsulta?: number;
  // Dados clínicos
  queixaPrincipal?: string;
  historicoDoencaAtual?: string;
  antecedentesPessoais?: string;
  antecedentesFamiliares?: string;
  alergias?: string;
  medicamentosEmUso?: string;
  observacoesGerais?: string;
  criadoEm: Date;
  atualizadoEm?: Date;
}

export interface Atendimento {
  id: string;
  pacienteId: string;
  medicoId: string;
  data: Date;
  hora: string;
  status: 'agendado' | 'realizado' | 'cancelado';
  valor?: number;
  observacoes?: string;
  // WhatsApp
  whatsappLembreteSent?: boolean;
  whatsappLembreteSentAt?: Date;
  criadoEm: Date;
  atualizadoEm?: Date;
}

export interface Pagamento {
  id: string;
  pacienteId: string;
  atendimentoId?: string;
  valor: number;
  formaPagamento: 'pix' | 'cartao' | 'dinheiro' | 'transferencia' | 'convenio';
  status: 'pago' | 'pendente';
  data: Date;
  dataPagamento?: Date;
  criadoEm: Date;
  atualizadoEm?: Date;
}

export interface Prontuario {
  id: string;
  pacienteId: string;
  medicoId?: string;
  profissionalNome?: string;
  texto: string;
  criadoEm: Date;
  atualizadoEm?: Date;
}

// Exame Médico
export interface ExameMedico {
  id: string;
  pacienteId: string;
  medicoId?: string;
  nome: string;
  tipo: 'laboratorio' | 'imagem' | 'laudo' | 'receita' | 'atestado' | 'encaminhamento' | 'outro';
  descricao?: string;
  arquivo: {
    nome: string;
    tipo: string;
    tamanho: number;
    url: string;
    file?: File;
  };
  criadoEm: Date;
  atualizadoEm?: Date;
}

export interface Notificacao {
  id: string;
  medicoId: string;
  tipo: 'agendamento' | 'cancelamento' | 'pagamento' | 'plano' | 'sistema' | 'lembrete';
  titulo: string;
  mensagem: string;
  lida: boolean;
  link?: string;
  data: Date;
}

// ============= Interface do Store =============

interface DataStore {
  // Dados
  usuarios: Usuario[];
  pacientes: Paciente[];
  atendimentos: Atendimento[];
  pagamentos: Pagamento[];
  prontuarios: Prontuario[];
  exames: ExameMedico[];
  notificacoes: Notificacao[];
  configuracoes: Configuracoes[];

  // === CRUD Usuários ===
  getUsuarios: () => Usuario[];
  getUsuarioById: (id: string) => Usuario | undefined;
  getUsuarioByEmail: (email: string) => Usuario | undefined;
  addUsuario: (usuario: Omit<Usuario, 'id' | 'criadoEm'>) => Usuario;
  updateUsuario: (id: string, data: Partial<Usuario>) => void;
  deleteUsuario: (id: string) => void;

  // === CRUD Configurações ===
  getConfiguracoesByMedico: (medicoId: string) => Configuracoes | undefined;
  updateConfiguracoes: (medicoId: string, data: Partial<Configuracoes>) => void;
  initConfiguracoes: (medicoId: string) => Configuracoes;

  // === CRUD Pacientes ===
  fetchPacientes: (medicoId: string, isAdmin?: boolean) => Promise<void>;
  fetchPacienteById: (id: string) => Promise<Paciente | null>;
  fetchAtendimentos: (medicoId: string) => Promise<void>;
  fetchAtendimentosByPaciente: (pacienteId: string) => Promise<void>;
  fetchPagamentos: (medicoId: string) => Promise<void>;
  fetchProntuarios: (pacienteId: string) => Promise<void>;
  fetchExames: (pacienteId: string) => Promise<void>;
  
  getPacientes: () => Paciente[];
  getPacienteById: (id: string) => Paciente | undefined;
  getPacientesByMedico: (medicoId: string) => Paciente[];
  getPacientesAtivos: (medicoId: string) => Paciente[];
  addPaciente: (paciente: Omit<Paciente, 'id' | 'criadoEm'>) => Promise<Paciente>;
  updatePaciente: (id: string, data: Partial<Paciente>) => Promise<void>;
  deletePaciente: (id: string) => Promise<void>;
  togglePacienteStatus: (id: string) => Promise<void>;

  // === CRUD Atendimentos ===
  getAtendimentos: () => Atendimento[];
  getAtendimentoById: (id: string) => Atendimento | undefined;
  getAtendimentosByMedico: (medicoId: string) => Atendimento[];
  getAtendimentosByPaciente: (pacienteId: string) => Atendimento[];
  getAtendimentosHoje: (medicoId: string) => Atendimento[];
  getProximosAtendimentosHoje: (medicoId: string) => Atendimento[];
  getAtendimentosPorData: (medicoId: string, data: Date) => Atendimento[];
  verificarHorarioDisponivel: (medicoId: string, data: Date, hora: string, excludeId?: string) => boolean;
  addAtendimento: (atendimento: Omit<Atendimento, 'id' | 'criadoEm'>) => Promise<{ success: boolean; atendimento?: Atendimento; error?: string }>;
  updateAtendimento: (id: string, data: Partial<Atendimento>) => Promise<void>;
  deleteAtendimento: (id: string) => Promise<void>;
  cancelarAtendimento: (id: string) => Promise<void>;
  realizarAtendimento: (id: string) => Promise<void>;
  isAtendimentoPassado: (atendimento: Atendimento) => boolean;
  getAtendimentosFuturos: (medicoId: string) => Atendimento[];
  marcarLembreteEnviado: (atendimentoId: string) => Promise<void>;

  // === CRUD Pagamentos ===
  getPagamentos: () => Pagamento[];
  getPagamentoById: (id: string) => Pagamento | undefined;
  getPagamentosByMedico: (medicoId: string) => Pagamento[];
  getPagamentosByPaciente: (pacienteId: string) => Pagamento[];
  getPagamentosPendentes: (medicoId: string) => Pagamento[];
  getPagamentoByAtendimento: (atendimentoId: string) => Pagamento | undefined;
  addPagamento: (pagamento: Omit<Pagamento, 'id' | 'criadoEm'>) => Promise<Pagamento>;
  updatePagamento: (id: string, data: Partial<Pagamento>) => Promise<void>;
  deletePagamento: (id: string) => Promise<void>;
  confirmarPagamento: (id: string) => Promise<void>;
  gerarPagamentosAtendimentosPassados: (medicoId: string) => void;

  // === CRUD Prontuários ===
  getProntuarios: () => Prontuario[];
  getProntuarioById: (id: string) => Prontuario | undefined;
  getProntuariosByPaciente: (pacienteId: string) => Prontuario[];
  addProntuario: (prontuario: Omit<Prontuario, 'id' | 'criadoEm'>) => Promise<Prontuario>;
  updateProntuario: (id: string, data: Partial<Prontuario>) => Promise<void>;
  deleteProntuario: (id: string) => Promise<void>;

  // === CRUD Exames ===
  getExames: () => ExameMedico[];
  getExameById: (id: string) => ExameMedico | undefined;
  getExamesByPaciente: (pacienteId: string) => ExameMedico[];
  addExame: (exame: Omit<ExameMedico, 'id' | 'criadoEm'>) => Promise<ExameMedico>;
  updateExame: (id: string, data: Partial<ExameMedico>) => Promise<void>;
  deleteExame: (id: string) => Promise<void>;

  // === CRUD Notificações ===
  fetchNotificacoes: (medicoId: string) => Promise<void>;
  getNotificacoes: () => Notificacao[];
  getNotificacaoById: (id: string) => Notificacao | undefined;
  getNotificacoesByMedico: (medicoId: string) => Notificacao[];
  getNotificacoesNaoLidas: (medicoId: string) => Notificacao[];
  addNotificacao: (notificacao: Omit<Notificacao, 'id' | 'data'>) => Promise<Notificacao>;
  marcarNotificacaoLida: (id: string) => Promise<void>;
  marcarTodasNotificacoesLidas: (medicoId: string) => Promise<void>;
  deleteNotificacao: (id: string) => Promise<void>;

  // === Utilitários ===
  gerarId: () => string;
  limparDados: () => void;
  
  // === Estatísticas ===
  getEstatisticasDashboard: (medicoId: string) => {
    atendimentosHoje: number;
    atendimentosAgendadosHoje: number;
    pacientesAtivos: number;
    faturamentoMes: number;
    pendenteMes: number;
    proximoAtendimento: string | null;
  };

  // === Relatórios Financeiros ===
  getRelatorioFinanceiro: (medicoId: string, dataInicio: Date, dataFim: Date) => {
    pagamentos: (Pagamento & { pacienteNome: string })[];
    totalRecebido: number;
    totalPendente: number;
    totalGeral: number;
    porFormaPagamento: { forma: string; total: number }[];
  };
}

// ============= Implementação do Store =============

export const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      // Dados iniciais
      usuarios: [],
      pacientes: [],
      atendimentos: [],
      pagamentos: [],
      prontuarios: [],
      exames: [],
      notificacoes: [],
      configuracoes: [],

      // Gerador de ID único
      gerarId: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

      // ==================== CRUD USUÁRIOS ====================
      getUsuarios: () => get().usuarios || [],
      
      getUsuarioById: (id) => (get().usuarios || []).find((u) => u.id === id),
      
      getUsuarioByEmail: (email) => 
        (get().usuarios || []).find((u) => u.email.toLowerCase() === email.toLowerCase()),

      addUsuario: (usuarioData) => {
        const usuario: Usuario = {
          ...usuarioData,
          id: get().gerarId(),
          criadoEm: new Date(),
        };
        set((state) => ({ usuarios: [...state.usuarios, usuario] }));
        return usuario;
      },

      updateUsuario: (id, data) => {
        set((state) => ({
          usuarios: state.usuarios.map((u) =>
            u.id === id ? { ...u, ...data } : u
          ),
        }));
      },

      deleteUsuario: (id) => {
        set((state) => ({
          usuarios: state.usuarios.filter((u) => u.id !== id),
        }));
      },

      // ==================== CRUD CONFIGURAÇÕES ====================
      getConfiguracoesByMedico: (medicoId) => 
        (get().configuracoes || []).find((c) => c.medicoId === medicoId),

      initConfiguracoes: (medicoId) => {
        const existing = get().getConfiguracoesByMedico(medicoId);
        if (existing) return existing;

        const config: Configuracoes = {
          id: get().gerarId(),
          medicoId,
          valorPadraoConsulta: 200,
          duracaoSessao: 50,
          intervaloSessoes: 10,
          horarioInicio: '08:00',
          horarioFim: '18:00',
          notificacaoLembrete: true,
          notificacaoAgendamento: true,
          notificacaoPagamento: true,
          notificacaoRelatorio: true,
          criadoEm: new Date(),
        };
        set((state) => ({ configuracoes: [...state.configuracoes, config] }));
        return config;
      },

      updateConfiguracoes: (medicoId, data) => {
        const existing = get().getConfiguracoesByMedico(medicoId);
        if (!existing) {
          get().initConfiguracoes(medicoId);
        }
        set((state) => ({
          configuracoes: state.configuracoes.map((c) =>
            c.medicoId === medicoId ? { ...c, ...data, atualizadoEm: new Date() } : c
          ),
        }));
      },

      // ==================== CRUD PACIENTES ====================
      fetchPacientes: async (medicoId, isAdmin) => {
        try {
          const domainPatients = await fetchWithRetry(() => isAdmin 
            ? patientRepo.listAll() 
            : patientRepo.listByUser(medicoId));
          const storePatients = domainPatients.map(mapToStorePatient);
          set({ pacientes: storePatients });
        } catch (error) {
          console.error("Error fetching patients:", error);
          throw error;
        }
      },

      fetchPacienteById: async (id) => {
        try {
          const domainPatient = await fetchWithRetry(() => patientRepo.findById(id));
          if (domainPatient) {
            const storePatient = mapToStorePatient(domainPatient);
            set((state) => {
              const currentPatients = state.pacientes || [];
              const otherPatients = currentPatients.filter(p => p.id !== id);
              return { pacientes: [...otherPatients, storePatient] };
            });
            return storePatient;
          }
          return null;
        } catch (error) {
          console.error("Error fetching patient by id:", error);
          throw error;
        }
      },

      fetchAtendimentos: async (medicoId) => {
        try {
          const domainAppointments = await fetchWithRetry(() => appointmentRepo.listByUser(medicoId));
          const storeAppointments = domainAppointments.map(mapToStoreAppointment);
          set({ atendimentos: storeAppointments });
        } catch (error) {
          console.error("Error fetching appointments:", error);
          throw error;
        }
      },

      fetchAtendimentosByPaciente: async (pacienteId) => {
        if (!pacienteId) return;
        try {
          const domainAppointments = await fetchWithRetry(() => appointmentRepo.listByPatient(pacienteId));
          const storeAppointments = domainAppointments.map(mapToStoreAppointment);
          set((state) => {
             // Keep appointments that are NOT from this patient, add/replace ones from this patient
             const currentAppointments = state.atendimentos || [];
             const otherAppointments = currentAppointments.filter(a => a.pacienteId !== pacienteId);
             return { atendimentos: [...otherAppointments, ...storeAppointments] };
          });
        } catch (error) {
          console.error("Error fetching appointments by patient:", error);
          throw error;
        }
      },

      fetchPagamentos: async (medicoId) => {
        try {
          const domainPayments = await fetchWithRetry(() => paymentRepo.listByUser(medicoId));
          const storePayments = domainPayments.map(mapToStorePayment);
          set({ pagamentos: storePayments });
        } catch (error) {
          console.error("Error fetching payments:", error);
          throw error;
        }
      },

      fetchProntuarios: async (pacienteId) => {
        if (!pacienteId) return;
        try {
          const domainRecords = await fetchWithRetry(() => medicalRecordRepo.listByPatient(pacienteId));
          const storeRecords = domainRecords.map(mapToStoreMedicalRecord);
          // Update only records for this patient, keeping others? 
          // Or just replace? The store is global. 
          // If I navigate between patients, I might want to cache or clear.
          // For simplicity, let's merge/replace.
          set((state) => {
            const currentRecords = state.prontuarios || [];
            const otherRecords = currentRecords.filter(p => p.pacienteId !== pacienteId);
            return { prontuarios: [...otherRecords, ...storeRecords] };
          });
        } catch (error) {
          console.error("Error fetching medical records:", error);
          throw error;
        }
      },

      fetchExames: async (pacienteId) => {
        if (!pacienteId) return;
        try {
          const domainExams = await fetchWithRetry(() => examRepo.listByPatient(pacienteId));
          const storeExams = domainExams.map(mapToStoreExam);
          set((state) => {
            const currentExams = state.exames || [];
            const otherExams = currentExams.filter(e => e.pacienteId !== pacienteId);
            return { exames: [...otherExams, ...storeExams] };
          });
        } catch (error) {
          console.error("Error fetching exams:", error);
          throw error;
        }
      },

      getPacientes: () => get().pacientes || [],
      
      getPacienteById: (id) => (get().pacientes || []).find((p) => p.id === id),
      
      getPacientesByMedico: (medicoId) =>
        (get().pacientes || []).filter((p) => p.medicoId === medicoId),
      
      getPacientesAtivos: (medicoId) =>
        (get().pacientes || []).filter((p) => p.medicoId === medicoId && p.status === 'ativo'),

      addPaciente: async (pacienteData) => {
        // Aplicar valor padrão da consulta das configurações se não definido
        const config = get().getConfiguracoesByMedico(pacienteData.medicoId);
        const valorConsulta = pacienteData.valorConsulta || config?.valorPadraoConsulta || 200;

        try {
          const domainPatient = await patientRepo.create(pacienteData.medicoId, {
            name: pacienteData.nome,
            phone: pacienteData.telefone,
            email: pacienteData.email,
            notes: pacienteData.observacoesGerais,
            birth_date: pacienteData.dataNascimento,
            consultation_value: valorConsulta,
            // Clinical data
            main_complaint: pacienteData.queixaPrincipal,
            current_illness_history: pacienteData.historicoDoencaAtual,
            personal_history: pacienteData.antecedentesPessoais,
            family_history: pacienteData.antecedentesFamiliares,
            allergies: pacienteData.alergias,
            medications: pacienteData.medicamentosEmUso,
          });

          const paciente = mapToStorePatient(domainPatient);
          set((state) => ({ pacientes: [...state.pacientes, paciente] }));
          
          // Criar notificação
          get().addNotificacao({
            medicoId: paciente.medicoId,
            tipo: 'sistema',
            titulo: 'Novo Paciente',
            mensagem: `${paciente.nome} foi adicionado à sua lista de pacientes.`,
            lida: false,
          });
          
          return paciente;
        } catch (error) {
          console.error("Error adding patient:", error);
          throw error;
        }
      },

      updatePaciente: async (id, data) => {
        try {
           // We need to map partial Paciente data to partial CreatePatientDTO
           // This is a bit tricky since data is Partial<Paciente>
           const updateData: any = {};
           if (data.nome) updateData.name = data.nome;
           if (data.telefone) updateData.phone = data.telefone;
           if (data.email) updateData.email = data.email;
           if (data.observacoesGerais) updateData.notes = data.observacoesGerais;
           if (data.dataNascimento) updateData.birth_date = data.dataNascimento;
           if (data.valorConsulta) updateData.consultation_value = data.valorConsulta;
           if (data.queixaPrincipal) updateData.main_complaint = data.queixaPrincipal;
           if (data.historicoDoencaAtual) updateData.current_illness_history = data.historicoDoencaAtual;
           if (data.antecedentesPessoais) updateData.personal_history = data.antecedentesPessoais;
           if (data.antecedentesFamiliares) updateData.family_history = data.antecedentesFamiliares;
           if (data.alergias) updateData.allergies = data.alergias;
           if (data.medicamentosEmUso) updateData.medications = data.medicamentosEmUso;

           if (Object.keys(updateData).length > 0) {
              const domainPatient = await patientRepo.update(id, updateData);
              const updatedPaciente = mapToStorePatient(domainPatient);
              
              set((state) => ({
                pacientes: state.pacientes.map((p) =>
                  p.id === id ? updatedPaciente : p
                ),
              }));
           }
        } catch (error) {
           console.error("Error updating patient:", error);
           throw error;
        }
      },

      deletePaciente: async (id) => {
        try {
          await patientRepo.deactivate(id);
          
          // Excluir também dados relacionados (LGPD) - In memory or cascade?
          // For now, remove from store to reflect UI
          set((state) => ({
            pacientes: state.pacientes.filter((p) => p.id !== id),
            // We might want to keep them if we support "trash", but requirement said "remove"
            atendimentos: state.atendimentos.filter((a) => a.pacienteId !== id),
            pagamentos: state.pagamentos.filter((p) => p.pacienteId !== id),
            prontuarios: state.prontuarios.filter((pr) => pr.pacienteId !== id),
          }));
        } catch (error) {
           console.error("Error deleting patient:", error);
           throw error;
        }
      },

      togglePacienteStatus: async (id) => {
        const paciente = get().getPacienteById(id);
        if (paciente) {
          try {
            if (paciente.status === 'ativo') {
              await patientRepo.deactivate(id);
            } else {
              await patientRepo.activate(id);
            }

            set((state) => ({
              pacientes: state.pacientes.map((p) =>
                p.id === id ? { ...p, status: p.status === 'ativo' ? 'inativo' : 'ativo', atualizadoEm: new Date() } : p
              ),
            }));
          } catch (error) {
            console.error("Error toggling patient status:", error);
            // Optionally revert optimistic update if we did one, but here we await first.
          }
        }
      },

      // ==================== CRUD ATENDIMENTOS ====================
      getAtendimentos: () => get().atendimentos || [],
      
      getAtendimentoById: (id) => (get().atendimentos || []).find((a) => a.id === id),
      
      getAtendimentosByMedico: (medicoId) =>
        (get().atendimentos || []).filter((a) => a.medicoId === medicoId),
      
      getAtendimentosByPaciente: (pacienteId) =>
        (get().atendimentos || []).filter((a) => a.pacienteId === pacienteId),

      getAtendimentosHoje: (medicoId) => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        return get().atendimentos.filter((a) => {
          const dataAtendimento = new Date(a.data);
          dataAtendimento.setHours(0, 0, 0, 0);
          return a.medicoId === medicoId && dataAtendimento >= hoje && dataAtendimento < amanha;
        });
      },

      getAtendimentosPorData: (medicoId, data) => {
        const dataInicio = new Date(data);
        dataInicio.setHours(0, 0, 0, 0);
        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataFim.getDate() + 1);

        return get().atendimentos.filter((a) => {
          const dataAtendimento = new Date(a.data);
          return a.medicoId === medicoId && dataAtendimento >= dataInicio && dataAtendimento < dataFim;
        });
      },

      // Próximos atendimentos de hoje (apenas agendados, futuros, ordenados)
      getProximosAtendimentosHoje: (medicoId) => {
        const agora = new Date();
        const horaAtual = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
        
        return get().getAtendimentosHoje(medicoId)
          .filter(a => a.status === 'agendado' && a.hora > horaAtual)
          .sort((a, b) => a.hora.localeCompare(b.hora));
      },

      // Verificar se um atendimento já passou (derivado)
      isAtendimentoPassado: (atendimento: Atendimento) => {
        const agora = new Date();
        const dataAtendimento = new Date(atendimento.data);
        dataAtendimento.setHours(0, 0, 0, 0);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        if (dataAtendimento < hoje) return true;
        if (dataAtendimento > hoje) return false;
        
        // Mesmo dia, comparar hora
        const horaAtual = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
        return atendimento.hora < horaAtual;
      },

      // Obter atendimentos futuros para WhatsApp
      getAtendimentosFuturos: (medicoId) => {
        const agora = new Date();
        const horaAtual = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
        
        return get().atendimentos.filter(a => {
          if (a.medicoId !== medicoId || a.status === 'cancelado') return false;
          
          const dataAtendimento = new Date(a.data);
          dataAtendimento.setHours(0, 0, 0, 0);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          
          if (dataAtendimento > hoje) return true;
          if (dataAtendimento < hoje) return false;
          return a.hora > horaAtual;
        }).sort((a, b) => {
          const dateCompare = new Date(a.data).getTime() - new Date(b.data).getTime();
          if (dateCompare !== 0) return dateCompare;
          return a.hora.localeCompare(b.hora);
        });
      },

      // Marcar lembrete WhatsApp como enviado
      marcarLembreteEnviado: async (atendimentoId: string) => {
         try {
           await appointmentRepo.markReminderSent(atendimentoId);
           set((state) => ({
             atendimentos: state.atendimentos.map((a) =>
               a.id === atendimentoId
                 ? { ...a, whatsappLembreteSent: true, whatsappLembreteSentAt: new Date() }
                 : a
             ),
           }));
         } catch (error) {
            console.error("Error marking reminder sent:", error);
         }
      },

      // Validação de horário disponível (regra de negócio centralizada)
      verificarHorarioDisponivel: (medicoId, data, hora, excludeId) => {
        const dataInicio = new Date(data);
        dataInicio.setHours(0, 0, 0, 0);
        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataFim.getDate() + 1);

        const atendimentosNaData = get().atendimentos.filter((a) => {
          const dataAtendimento = new Date(a.data);
          dataAtendimento.setHours(0, 0, 0, 0);
          return (
            a.medicoId === medicoId &&
            dataAtendimento >= dataInicio &&
            dataAtendimento < dataFim &&
            a.hora === hora &&
            a.status !== 'cancelado' &&
            a.id !== excludeId
          );
        });

        return atendimentosNaData.length === 0;
      },

      addAtendimento: async (atendimentoData) => {
        // Validar horário antes de adicionar
        const isDisponivel = get().verificarHorarioDisponivel(
          atendimentoData.medicoId,
          new Date(atendimentoData.data),
          atendimentoData.hora
        );

        if (!isDisponivel) {
          return { 
            success: false, 
            error: 'Já existe um atendimento agendado para este horário.' 
          };
        }

        // Aplicar valor do paciente ou padrão
        const paciente = get().getPacienteById(atendimentoData.pacienteId);
        const config = get().getConfiguracoesByMedico(atendimentoData.medicoId);
        const valor = atendimentoData.valor || paciente?.valorConsulta || config?.valorPadraoConsulta || 200;

        try {
          const dateStr = new Date(atendimentoData.data).toISOString().split('T')[0];
          
          const domainAppointment = await appointmentRepo.create(atendimentoData.medicoId, {
            patient_id: atendimentoData.pacienteId,
            date: dateStr,
            time: atendimentoData.hora,
            notes: atendimentoData.observacoes,
          });

          const atendimento = mapToStoreAppointment(domainAppointment);
          atendimento.valor = valor; 

          set((state) => ({ atendimentos: [...state.atendimentos, atendimento] }));

          // Criar notificação
          get().addNotificacao({
            medicoId: atendimento.medicoId,
            tipo: 'agendamento',
            titulo: 'Novo Agendamento',
            mensagem: `Atendimento com ${paciente?.nome || 'Paciente'} agendado para ${new Date(atendimento.data).toLocaleDateString('pt-BR')} às ${atendimento.hora}.`,
            lida: false,
            link: '/agenda',
          });

          return { success: true, atendimento };
        } catch (error: any) {
           console.error("Error adding appointment:", error);
           return { success: false, error: error.message };
        }
      },

      updateAtendimento: async (id, data) => {
        try {
           const updateData: any = {};
           if (data.data) updateData.date = new Date(data.data).toISOString().split('T')[0];
           if (data.hora) updateData.time = data.hora;
           if (data.observacoes) updateData.notes = data.observacoes;
           
           if (Object.keys(updateData).length > 0) {
              const domainAppointment = await appointmentRepo.update(id, updateData);
              const updatedAtendimento = mapToStoreAppointment(domainAppointment);
              
              // Maintain local fields that are not in repo yet (like price if not returned/supported)
              const existing = get().getAtendimentoById(id);
              if (existing) {
                  updatedAtendimento.valor = existing.valor; // Keep value if not updated
              }

              set((state) => ({
                atendimentos: state.atendimentos.map((a) =>
                  a.id === id ? { ...updatedAtendimento, ...data, atualizadoEm: new Date() } : a
                ),
              }));
           } else {
              // Just local update for non-persisted fields or status handled separately
              set((state) => ({
                atendimentos: state.atendimentos.map((a) =>
                  a.id === id ? { ...a, ...data, atualizadoEm: new Date() } : a
                ),
              }));
           }
        } catch (error) {
           console.error("Error updating appointment:", error);
        }
      },

      deleteAtendimento: async (id) => {
        try {
          await appointmentRepo.delete(id); 
          set((state) => ({
            atendimentos: state.atendimentos.filter((a) => a.id !== id),
          }));
        } catch (error) {
           console.error("Error deleting appointment:", error);
        }
      },

      cancelarAtendimento: async (id) => {
        try {
          await appointmentRepo.cancel(id);
          const atendimento = get().getAtendimentoById(id);
          if (atendimento) {
            set((state) => ({
              atendimentos: state.atendimentos.map((a) =>
                a.id === id ? { ...a, status: 'cancelado', atualizadoEm: new Date() } : a
              ),
            }));
            
            const paciente = get().getPacienteById(atendimento.pacienteId);
            get().addNotificacao({
              medicoId: atendimento.medicoId,
              tipo: 'cancelamento',
              titulo: 'Atendimento Cancelado',
              mensagem: `Atendimento com ${paciente?.nome || 'Paciente'} foi cancelado.`,
              lida: false,
              link: '/agenda',
            });
          }
        } catch (error) {
           console.error("Error cancelling appointment:", error);
        }
      },

      realizarAtendimento: async (id) => {
        try {
          await appointmentRepo.approve(id);
          set((state) => ({
            atendimentos: state.atendimentos.map((a) =>
              a.id === id ? { ...a, status: 'realizado', atualizadoEm: new Date() } : a
            ),
          }));
        } catch (error) {
           console.error("Error completing appointment:", error);
        }
      },

      // ==================== CRUD PAGAMENTOS ====================
      getPagamentos: () => get().pagamentos || [],
      
      getPagamentoById: (id) => (get().pagamentos || []).find((p) => p.id === id),
      
      getPagamentosByMedico: (medicoId) => {
        const pacienteIds = get().getPacientesByMedico(medicoId).map((p) => p.id);
        return (get().pagamentos || []).filter((p) => pacienteIds.includes(p.pacienteId));
      },
      
      getPagamentosByPaciente: (pacienteId) =>
        (get().pagamentos || []).filter((p) => p.pacienteId === pacienteId),
      
      getPagamentosPendentes: (medicoId) =>
        get().getPagamentosByMedico(medicoId).filter((p) => p.status === 'pendente'),

      getPagamentoByAtendimento: (atendimentoId) =>
        (get().pagamentos || []).find((p) => p.atendimentoId === atendimentoId),

      addPagamento: async (pagamentoData) => {
        try {
          // Use client_id from session or context? 
          // Here we only have payment data. We need client_id (medicoId).
          // Assuming we can get it from patient or passed context?
          // `pagamentoData` doesn't have `medicoId` explicitly in interface `Pagamento`?
          // `Pagamento` has `pacienteId`. We can get `medicoId` from patient store.
          const paciente = get().getPacienteById(pagamentoData.pacienteId);
          const medicoId = paciente?.medicoId; // Assuming all patients have medicoId loaded
          
          if (!medicoId) throw new Error("Medico ID not found for patient");

          const domainPayment = await paymentRepo.create(medicoId, {
             patient_id: pagamentoData.pacienteId,
             appointment_id: pagamentoData.atendimentoId,
             amount: pagamentoData.valor,
             status: pagamentoData.status === 'pago' ? 'paid' : 'pending',
             method: pagamentoData.formaPagamento,
             paid_at: pagamentoData.dataPagamento?.toISOString(),
             date: pagamentoData.data.toISOString(),
          });

          const pagamento = mapToStorePayment(domainPayment);
          set((state) => ({ pagamentos: [...state.pagamentos, pagamento] }));
          return pagamento;
        } catch (error) {
           console.error("Error adding payment:", error);
           throw error;
        }
      },

      updatePagamento: async (id, data) => {
        try {
          // Map partial data
          // This is tricky for partial updates.
          // For now, let's update local state and warn about repo.
          // Or try to implement repo update if supported.
          // My SupabasePaymentRepository has `update`.
          const updateData: any = {};
          if (data.valor) updateData.amount = data.valor;
          if (data.status) updateData.status = data.status === 'pago' ? 'paid' : 'pending';
          if (data.formaPagamento) updateData.method = data.formaPagamento;
          if (data.dataPagamento) updateData.paid_at = data.dataPagamento.toISOString();
          
          if (Object.keys(updateData).length > 0) {
             const domainPayment = await paymentRepo.update(id, updateData);
             const updatedPayment = mapToStorePayment(domainPayment);
             set((state) => ({
               pagamentos: state.pagamentos.map((p) =>
                 p.id === id ? updatedPayment : p
               ),
             }));
          }
        } catch (error) {
           console.error("Error updating payment:", error);
        }
      },

      deletePagamento: async (id) => {
        try {
          await paymentRepo.delete(id);
          set((state) => ({
            pagamentos: state.pagamentos.filter((p) => p.id !== id),
          }));
        } catch (error) {
           console.error("Error deleting payment:", error);
        }
      },

      confirmarPagamento: async (id) => {
        const pagamento = get().getPagamentoById(id);
        if (pagamento && pagamento.status === 'pendente') {
          await get().updatePagamento(id, { 
            status: 'pago', 
            dataPagamento: new Date() 
          });
          
          const paciente = get().getPacienteById(pagamento.pacienteId);
          const atendimento = pagamento.atendimentoId 
            ? get().getAtendimentoById(pagamento.atendimentoId) 
            : null;
          const medicoId = atendimento?.medicoId || paciente?.medicoId;

          if (medicoId) {
            get().addNotificacao({
              medicoId,
              tipo: 'pagamento',
              titulo: 'Pagamento Confirmado',
              mensagem: `Pagamento de R$ ${pagamento.valor.toFixed(2)} de ${paciente?.nome || 'Paciente'} confirmado.`,
              lida: false,
              link: '/financeiro',
            });
          }
        }
      },

      // Gerar pagamentos para atendimentos passados sem pagamento
      gerarPagamentosAtendimentosPassados: (medicoId) => {
        const atendimentos = get().getAtendimentosByMedico(medicoId);
        const pagamentos = get().getPagamentosByMedico(medicoId);
        
        atendimentos.forEach(async (atendimento) => {
          // Apenas atendimentos passados e não cancelados
          if (atendimento.status === 'cancelado') return;
          if (!get().isAtendimentoPassado(atendimento)) return;
          
          // Verificar se já existe pagamento
          const pagamentoExistente = pagamentos.find(p => p.atendimentoId === atendimento.id);
          if (pagamentoExistente) return;
          
          // Criar pagamento pendente
          const paciente = get().getPacienteById(atendimento.pacienteId);
          try {
             await get().addPagamento({
               pacienteId: atendimento.pacienteId,
               atendimentoId: atendimento.id,
               valor: atendimento.valor || paciente?.valorConsulta || 200,
               formaPagamento: 'pix',
               status: 'pendente',
               data: new Date(atendimento.data),
             });
          } catch (e) {
             console.error("Error auto-generating payment:", e);
          }
        });
      },

      // ==================== CRUD PRONTUÁRIOS ====================
      getProntuarios: () => get().prontuarios || [],
      
      getProntuarioById: (id) => (get().prontuarios || []).find((pr) => pr.id === id),
      
      getProntuariosByPaciente: (pacienteId) =>
        (get().prontuarios || []).filter((pr) => pr.pacienteId === pacienteId),

      addProntuario: async (prontuarioData) => {
        try {
          // Need medicoId (client_id)
          const paciente = get().getPacienteById(prontuarioData.pacienteId);
          const medicoId = prontuarioData.medicoId || paciente?.medicoId;
          
          if (!medicoId) throw new Error("Medico ID required for medical record");

          const domainRecord = await medicalRecordRepo.create(medicoId, {
            patient_id: prontuarioData.pacienteId,
            content: prontuarioData.texto,
            professional_name: prontuarioData.profissionalNome
          });
          
          const prontuario = mapToStoreMedicalRecord(domainRecord);
          set((state) => ({ prontuarios: [...state.prontuarios, prontuario] }));
          
          return prontuario;
        } catch (error) {
           console.error("Error adding medical record:", error);
           throw error;
        }
      },

      updateProntuario: async (id, data) => {
        try {
          const updateData: any = {};
          if (data.texto !== undefined) updateData.content = data.texto;
          if (data.profissionalNome) updateData.professional_name = data.profissionalNome;
          
          if (Object.keys(updateData).length > 0) {
             const domainRecord = await medicalRecordRepo.update(id, updateData);
             const updatedRecord = mapToStoreMedicalRecord(domainRecord);
             set((state) => ({
               prontuarios: state.prontuarios.map((pr) =>
                 pr.id === id ? updatedRecord : pr
               ),
             }));
          }
        } catch (error) {
           console.error("Error updating medical record:", error);
        }
      },

      deleteProntuario: async (id) => {
        const record = get().getProntuarioById(id);
        try {
          await medicalRecordRepo.delete(id);
          set((state) => ({
            prontuarios: state.prontuarios.filter((pr) => pr.id !== id),
          }));
        } catch (error) {
           console.error("Error deleting medical record:", error);
        }
      },

      // ==================== CRUD EXAMES ====================
      getExames: () => get().exames || [],
      
      getExameById: (id) => (get().exames || []).find((e) => e.id === id),
      
      getExamesByPaciente: (pacienteId) =>
        (get().exames || []).filter((e) => e.pacienteId === pacienteId),

      addExame: async (exameData) => {
        try {
           const paciente = get().getPacienteById(exameData.pacienteId);
           const medicoId = exameData.medicoId || paciente?.medicoId;
           if (!medicoId) throw new Error("Medico ID required for exam");

           let fileUrl = exameData.arquivo.url;
           
           // Upload file if exists
           if (exameData.arquivo.file) {
             const fileName = `${exameData.pacienteId}/${Date.now()}-${exameData.arquivo.nome}`;
             fileUrl = await examRepo.uploadFile(exameData.arquivo.file, fileName);
           }

           const domainExam = await examRepo.create(medicoId, {
             patient_id: exameData.pacienteId,
             name: exameData.nome,
             type: exameData.tipo,
             description: exameData.descricao,
             file_url: fileUrl,
             file_name: exameData.arquivo.nome,
             file_type: exameData.arquivo.tipo,
             file_size: exameData.arquivo.tamanho
           });
           
           const exame = mapToStoreExam(domainExam);
           set((state) => ({ exames: [...state.exames, exame] }));
           
           return exame;
        } catch (error) {
           console.error("Error adding exam:", error);
           throw error;
        }
      },

      updateExame: async (id, data) => {
        try {
           const updateData: any = {};
           if (data.nome) updateData.name = data.nome;
           if (data.tipo) updateData.type = data.tipo;
           if (data.descricao) updateData.descricao = data.descricao;
           if (data.arquivo) {
              updateData.file_url = data.arquivo.url;
              updateData.file_name = data.arquivo.nome;
              updateData.file_type = data.arquivo.tipo;
              updateData.file_size = data.arquivo.tamanho;
           }

           if (Object.keys(updateData).length > 0) {
              const domainExam = await examRepo.update(id, updateData);
              const updatedExam = mapToStoreExam(domainExam);
              
              set((state) => ({
              exames: state.exames.map((e) =>
                e.id === id ? updatedExam : e
              ),
            }));
           }
        } catch (error) {
           console.error("Error updating exam:", error);
        }
      },

      deleteExame: async (id) => {
        const exame = get().getExameById(id);
        try {
          await examRepo.delete(id);
          set((state) => ({
            exames: state.exames.filter((e) => e.id !== id),
          }));
        } catch (error) {
           console.error("Error deleting exam:", error);
        }
      },

      // ==================== CRUD NOTIFICAÇÕES ====================
      fetchNotificacoes: async (medicoId) => {
        try {
          const domainNotifications = await notificationRepo.listByUser(medicoId);
          const storeNotifications = domainNotifications.map(mapToStoreNotification);
          set({ notificacoes: storeNotifications });
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      },

      getNotificacoes: () => get().notificacoes || [],
      
      getNotificacaoById: (id) => (get().notificacoes || []).find((n) => n.id === id),
      
      getNotificacoesByMedico: (medicoId) =>
        (get().notificacoes || []).filter((n) => n.medicoId === medicoId),
      
      getNotificacoesNaoLidas: (medicoId) =>
        (get().notificacoes || []).filter((n) => n.medicoId === medicoId && !n.lida),

      addNotificacao: async (notificacaoData) => {
        try {
          const domainNotification = await notificationRepo.create(notificacaoData.medicoId, {
            type: notificacaoData.tipo,
            title: notificacaoData.titulo,
            message: notificacaoData.mensagem,
            link: notificacaoData.link
          });

          const notificacao = mapToStoreNotification(domainNotification);
          set((state) => ({
            notificacoes: [notificacao, ...state.notificacoes],
          }));
          return notificacao;
        } catch (error) {
          console.error("Error adding notification:", error);
          throw error;
        }
      },

      marcarNotificacaoLida: async (id) => {
        try {
          await notificationRepo.markAsRead(id);
          set((state) => ({
            notificacoes: state.notificacoes.map((n) =>
              n.id === id ? { ...n, lida: true } : n
            ),
          }));
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      },

      marcarTodasNotificacoesLidas: async (medicoId) => {
        try {
          await notificationRepo.markAllAsRead(medicoId);
          set((state) => ({
            notificacoes: state.notificacoes.map((n) =>
              n.medicoId === medicoId ? { ...n, lida: true } : n
            ),
          }));
        } catch (error) {
          console.error("Error marking all notifications as read:", error);
        }
      },

      deleteNotificacao: async (id) => {
        try {
          await notificationRepo.delete(id);
          set((state) => ({
            notificacoes: state.notificacoes.filter((n) => n.id !== id),
          }));
        } catch (error) {
          console.error("Error deleting notification:", error);
        }
      },

      // ==================== UTILITÁRIOS ====================
      limparDados: () => {
        set({
          usuarios: [],
          pacientes: [],
          atendimentos: [],
          pagamentos: [],
          prontuarios: [],
          notificacoes: [],
          configuracoes: [],
        });
      },

      // ==================== ESTATÍSTICAS ====================
      getEstatisticasDashboard: (medicoId) => {
        const atendimentosHoje = get().getAtendimentosHoje(medicoId);
        const atendimentosAgendadosHoje = atendimentosHoje.filter(a => a.status === 'agendado');
        const pacientesAtivos = get().getPacientesAtivos(medicoId);
        
        // Calcular faturamento do mês
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        
        const pagamentosMes = get().getPagamentosByMedico(medicoId).filter((p) => {
          const dataPagamento = new Date(p.data);
          return dataPagamento >= inicioMes && dataPagamento <= fimMes;
        });
        
        const faturamentoMes = pagamentosMes
          .filter((p) => p.status === 'pago')
          .reduce((sum, p) => sum + p.valor, 0);
        
        const pendenteMes = pagamentosMes
          .filter((p) => p.status === 'pendente')
          .reduce((sum, p) => sum + p.valor, 0);

        // Próximo atendimento (agendado, hoje, mais próximo)
        const horaAtual = `${hoje.getHours().toString().padStart(2, '0')}:${hoje.getMinutes().toString().padStart(2, '0')}`;
        const proximosAgendados = atendimentosAgendadosHoje
          .filter(a => a.hora >= horaAtual)
          .sort((a, b) => a.hora.localeCompare(b.hora));
        
        const proximoAtendimento = proximosAgendados.length > 0 ? proximosAgendados[0].hora : null;

        return {
          atendimentosHoje: atendimentosHoje.length,
          atendimentosAgendadosHoje: atendimentosAgendadosHoje.length,
          pacientesAtivos: pacientesAtivos.length,
          faturamentoMes,
          pendenteMes,
          proximoAtendimento,
        };
      },

      // ==================== RELATÓRIOS FINANCEIROS ====================
      getRelatorioFinanceiro: (medicoId, dataInicio, dataFim) => {
        const pagamentos = get().getPagamentosByMedico(medicoId).filter((p) => {
          const dataPagamento = new Date(p.data);
          return dataPagamento >= dataInicio && dataPagamento <= dataFim;
        });

        const pagamentosComNome = pagamentos.map(p => {
          const paciente = get().getPacienteById(p.pacienteId);
          return {
            ...p,
            pacienteNome: paciente?.nome || 'Paciente não encontrado',
          };
        });

        const totalRecebido = pagamentos
          .filter(p => p.status === 'pago')
          .reduce((sum, p) => sum + p.valor, 0);

        const totalPendente = pagamentos
          .filter(p => p.status === 'pendente')
          .reduce((sum, p) => sum + p.valor, 0);

        const porFormaPagamento = ['pix', 'cartao', 'dinheiro', 'transferencia', 'convenio'].map(forma => ({
          forma,
          total: pagamentos
            .filter(p => p.formaPagamento === forma && p.status === 'pago')
            .reduce((sum, p) => sum + p.valor, 0),
        })).filter(f => f.total > 0);

        return {
          pagamentos: pagamentosComNome,
          totalRecebido,
          totalPendente,
          totalGeral: totalRecebido + totalPendente,
          porFormaPagamento,
        };
      },


    }),
    {
      name: 'pronti-data',
      partialize: (state) => ({
        // Apenas dados globais e menos voláteis devem ser persistidos
        // Dados sensíveis e dinâmicos (prontuários, exames) NÃO DEVEM ser persistidos
        // pois causam problemas de serialização de Date e riscos LGPD
        usuarios: state.usuarios,
        pacientes: state.pacientes, // Mantemos pacientes para listagens rápidas, mas o detalhe sempre busca do banco
        configuracoes: state.configuracoes,
      }),
    }
  )
);
