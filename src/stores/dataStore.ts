// ============= PRONTI - Data Store (Simulação de Banco de Dados) =============
// Estrutura preparada para futura integração com Supabase

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  };
  criadoEm: Date;
  atualizadoEm?: Date;
}

export interface Notificacao {
  id: string;
  medicoId: string;
  tipo: 'agendamento' | 'cancelamento' | 'pagamento' | 'plano' | 'sistema';
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
  getPacientes: () => Paciente[];
  getPacienteById: (id: string) => Paciente | undefined;
  getPacientesByMedico: (medicoId: string) => Paciente[];
  getPacientesAtivos: (medicoId: string) => Paciente[];
  addPaciente: (paciente: Omit<Paciente, 'id' | 'criadoEm'>) => Paciente;
  updatePaciente: (id: string, data: Partial<Paciente>) => void;
  deletePaciente: (id: string) => void;
  togglePacienteStatus: (id: string) => void;

  // === CRUD Atendimentos ===
  getAtendimentos: () => Atendimento[];
  getAtendimentoById: (id: string) => Atendimento | undefined;
  getAtendimentosByMedico: (medicoId: string) => Atendimento[];
  getAtendimentosByPaciente: (pacienteId: string) => Atendimento[];
  getAtendimentosHoje: (medicoId: string) => Atendimento[];
  getProximosAtendimentosHoje: (medicoId: string) => Atendimento[];
  getAtendimentosPorData: (medicoId: string, data: Date) => Atendimento[];
  verificarHorarioDisponivel: (medicoId: string, data: Date, hora: string, excludeId?: string) => boolean;
  addAtendimento: (atendimento: Omit<Atendimento, 'id' | 'criadoEm'>) => { success: boolean; atendimento?: Atendimento; error?: string };
  updateAtendimento: (id: string, data: Partial<Atendimento>) => void;
  deleteAtendimento: (id: string) => void;
  cancelarAtendimento: (id: string) => void;
  realizarAtendimento: (id: string) => void;
  isAtendimentoPassado: (atendimento: Atendimento) => boolean;
  getAtendimentosFuturos: (medicoId: string) => Atendimento[];
  marcarLembreteEnviado: (atendimentoId: string) => void;

  // === CRUD Pagamentos ===
  getPagamentos: () => Pagamento[];
  getPagamentoById: (id: string) => Pagamento | undefined;
  getPagamentosByMedico: (medicoId: string) => Pagamento[];
  getPagamentosByPaciente: (pacienteId: string) => Pagamento[];
  getPagamentosPendentes: (medicoId: string) => Pagamento[];
  getPagamentoByAtendimento: (atendimentoId: string) => Pagamento | undefined;
  addPagamento: (pagamento: Omit<Pagamento, 'id' | 'criadoEm'>) => Pagamento;
  updatePagamento: (id: string, data: Partial<Pagamento>) => void;
  deletePagamento: (id: string) => void;
  confirmarPagamento: (id: string) => void;
  gerarPagamentosAtendimentosPassados: (medicoId: string) => void;

  // === CRUD Prontuários ===
  getProntuarios: () => Prontuario[];
  getProntuarioById: (id: string) => Prontuario | undefined;
  getProntuariosByPaciente: (pacienteId: string) => Prontuario[];
  addProntuario: (prontuario: Omit<Prontuario, 'id' | 'criadoEm'>) => Prontuario;
  updateProntuario: (id: string, data: Partial<Prontuario>) => void;
  deleteProntuario: (id: string) => void;

  // === CRUD Exames ===
  getExames: () => ExameMedico[];
  getExameById: (id: string) => ExameMedico | undefined;
  getExamesByPaciente: (pacienteId: string) => ExameMedico[];
  addExame: (exame: Omit<ExameMedico, 'id' | 'criadoEm'>) => ExameMedico;
  updateExame: (id: string, data: Partial<ExameMedico>) => void;
  deleteExame: (id: string) => void;

  // === CRUD Notificações ===
  getNotificacoes: () => Notificacao[];
  getNotificacaoById: (id: string) => Notificacao | undefined;
  getNotificacoesByMedico: (medicoId: string) => Notificacao[];
  getNotificacoesNaoLidas: (medicoId: string) => Notificacao[];
  addNotificacao: (notificacao: Omit<Notificacao, 'id' | 'data'>) => Notificacao;
  marcarNotificacaoLida: (id: string) => void;
  marcarTodasNotificacoesLidas: (medicoId: string) => void;
  deleteNotificacao: (id: string) => void;

  // === Utilitários ===
  gerarId: () => string;
  limparDados: () => void;
  inicializarDadosMock: (medicoId: string) => void;
  
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
      getUsuarios: () => get().usuarios,
      
      getUsuarioById: (id) => get().usuarios.find((u) => u.id === id),
      
      getUsuarioByEmail: (email) => 
        get().usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase()),

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
        get().configuracoes.find((c) => c.medicoId === medicoId),

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
      getPacientes: () => get().pacientes,
      
      getPacienteById: (id) => get().pacientes.find((p) => p.id === id),
      
      getPacientesByMedico: (medicoId) =>
        get().pacientes.filter((p) => p.medicoId === medicoId),
      
      getPacientesAtivos: (medicoId) =>
        get().pacientes.filter((p) => p.medicoId === medicoId && p.status === 'ativo'),

      addPaciente: (pacienteData) => {
        // Aplicar valor padrão da consulta das configurações se não definido
        const config = get().getConfiguracoesByMedico(pacienteData.medicoId);
        const paciente: Paciente = {
          ...pacienteData,
          valorConsulta: pacienteData.valorConsulta || config?.valorPadraoConsulta || 200,
          id: get().gerarId(),
          criadoEm: new Date(),
        };
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
      },

      updatePaciente: (id, data) => {
        set((state) => ({
          pacientes: state.pacientes.map((p) =>
            p.id === id ? { ...p, ...data, atualizadoEm: new Date() } : p
          ),
        }));
      },

      deletePaciente: (id) => {
        // Excluir também dados relacionados (LGPD)
        set((state) => ({
          pacientes: state.pacientes.filter((p) => p.id !== id),
          atendimentos: state.atendimentos.filter((a) => a.pacienteId !== id),
          pagamentos: state.pagamentos.filter((p) => p.pacienteId !== id),
          prontuarios: state.prontuarios.filter((pr) => pr.pacienteId !== id),
        }));
      },

      togglePacienteStatus: (id) => {
        const paciente = get().getPacienteById(id);
        if (paciente) {
          get().updatePaciente(id, {
            status: paciente.status === 'ativo' ? 'inativo' : 'ativo',
          });
        }
      },

      // ==================== CRUD ATENDIMENTOS ====================
      getAtendimentos: () => get().atendimentos,
      
      getAtendimentoById: (id) => get().atendimentos.find((a) => a.id === id),
      
      getAtendimentosByMedico: (medicoId) =>
        get().atendimentos.filter((a) => a.medicoId === medicoId),
      
      getAtendimentosByPaciente: (pacienteId) =>
        get().atendimentos.filter((a) => a.pacienteId === pacienteId),

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
      marcarLembreteEnviado: (atendimentoId: string) => {
        set((state) => ({
          atendimentos: state.atendimentos.map((a) =>
            a.id === atendimentoId
              ? { ...a, whatsappLembreteSent: true, whatsappLembreteSentAt: new Date() }
              : a
          ),
        }));
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

      addAtendimento: (atendimentoData) => {
        // Validar horário antes de adicionar
        const isDisponivel = get().verificarHorarioDisponivel(
          atendimentoData.medicoId,
          atendimentoData.data,
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

        const atendimento: Atendimento = {
          ...atendimentoData,
          valor,
          id: get().gerarId(),
          criadoEm: new Date(),
        };
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
      },

      updateAtendimento: (id, data) => {
        set((state) => ({
          atendimentos: state.atendimentos.map((a) =>
            a.id === id ? { ...a, ...data, atualizadoEm: new Date() } : a
          ),
        }));
      },

      deleteAtendimento: (id) => {
        set((state) => ({
          atendimentos: state.atendimentos.filter((a) => a.id !== id),
        }));
      },

      cancelarAtendimento: (id) => {
        const atendimento = get().getAtendimentoById(id);
        if (atendimento) {
          get().updateAtendimento(id, { status: 'cancelado' });
          
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
      },

      realizarAtendimento: (id) => {
        get().updateAtendimento(id, { status: 'realizado' });
      },

      // ==================== CRUD PAGAMENTOS ====================
      getPagamentos: () => get().pagamentos,
      
      getPagamentoById: (id) => get().pagamentos.find((p) => p.id === id),
      
      getPagamentosByMedico: (medicoId) => {
        const pacienteIds = get().getPacientesByMedico(medicoId).map((p) => p.id);
        return get().pagamentos.filter((p) => pacienteIds.includes(p.pacienteId));
      },
      
      getPagamentosByPaciente: (pacienteId) =>
        get().pagamentos.filter((p) => p.pacienteId === pacienteId),
      
      getPagamentosPendentes: (medicoId) =>
        get().getPagamentosByMedico(medicoId).filter((p) => p.status === 'pendente'),

      getPagamentoByAtendimento: (atendimentoId) =>
        get().pagamentos.find((p) => p.atendimentoId === atendimentoId),

      addPagamento: (pagamentoData) => {
        const pagamento: Pagamento = {
          ...pagamentoData,
          id: get().gerarId(),
          criadoEm: new Date(),
        };
        set((state) => ({ pagamentos: [...state.pagamentos, pagamento] }));
        return pagamento;
      },

      updatePagamento: (id, data) => {
        set((state) => ({
          pagamentos: state.pagamentos.map((p) =>
            p.id === id ? { ...p, ...data, atualizadoEm: new Date() } : p
          ),
        }));
      },

      deletePagamento: (id) => {
        set((state) => ({
          pagamentos: state.pagamentos.filter((p) => p.id !== id),
        }));
      },

      confirmarPagamento: (id) => {
        const pagamento = get().getPagamentoById(id);
        if (pagamento && pagamento.status === 'pendente') {
          get().updatePagamento(id, { 
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
        
        atendimentos.forEach(atendimento => {
          // Apenas atendimentos passados e não cancelados
          if (atendimento.status === 'cancelado') return;
          if (!get().isAtendimentoPassado(atendimento)) return;
          
          // Verificar se já existe pagamento
          const pagamentoExistente = pagamentos.find(p => p.atendimentoId === atendimento.id);
          if (pagamentoExistente) return;
          
          // Criar pagamento pendente
          const paciente = get().getPacienteById(atendimento.pacienteId);
          get().addPagamento({
            pacienteId: atendimento.pacienteId,
            atendimentoId: atendimento.id,
            valor: atendimento.valor || paciente?.valorConsulta || 200,
            formaPagamento: 'pix',
            status: 'pendente',
            data: new Date(atendimento.data),
          });
        });
      },

      // ==================== CRUD PRONTUÁRIOS ====================
      getProntuarios: () => get().prontuarios,
      
      getProntuarioById: (id) => get().prontuarios.find((pr) => pr.id === id),
      
      getProntuariosByPaciente: (pacienteId) =>
        get().prontuarios.filter((pr) => pr.pacienteId === pacienteId),

      addProntuario: (prontuarioData) => {
        const prontuario: Prontuario = {
          ...prontuarioData,
          id: get().gerarId(),
          criadoEm: new Date(),
        };
        set((state) => ({ prontuarios: [...state.prontuarios, prontuario] }));
        return prontuario;
      },

      updateProntuario: (id, data) => {
        set((state) => ({
          prontuarios: state.prontuarios.map((pr) =>
            pr.id === id ? { ...pr, ...data, atualizadoEm: new Date() } : pr
          ),
        }));
      },

      deleteProntuario: (id) => {
        set((state) => ({
          prontuarios: state.prontuarios.filter((pr) => pr.id !== id),
        }));
      },

      // ==================== CRUD EXAMES ====================
      getExames: () => get().exames,
      
      getExameById: (id) => get().exames.find((e) => e.id === id),
      
      getExamesByPaciente: (pacienteId) =>
        get().exames.filter((e) => e.pacienteId === pacienteId),

      addExame: (exameData) => {
        const exame: ExameMedico = {
          ...exameData,
          id: get().gerarId(),
          criadoEm: new Date(),
        };
        set((state) => ({ exames: [...state.exames, exame] }));
        return exame;
      },

      updateExame: (id, data) => {
        set((state) => ({
          exames: state.exames.map((e) =>
            e.id === id ? { ...e, ...data, atualizadoEm: new Date() } : e
          ),
        }));
      },

      deleteExame: (id) => {
        set((state) => ({
          exames: state.exames.filter((e) => e.id !== id),
        }));
      },

      // ==================== CRUD NOTIFICAÇÕES ====================
      getNotificacoes: () => get().notificacoes,
      
      getNotificacaoById: (id) => get().notificacoes.find((n) => n.id === id),
      
      getNotificacoesByMedico: (medicoId) =>
        get().notificacoes.filter((n) => n.medicoId === medicoId),
      
      getNotificacoesNaoLidas: (medicoId) =>
        get().notificacoes.filter((n) => n.medicoId === medicoId && !n.lida),

      addNotificacao: (notificacaoData) => {
        const notificacao: Notificacao = {
          ...notificacaoData,
          id: get().gerarId(),
          data: new Date(),
        };
        set((state) => ({
          notificacoes: [notificacao, ...state.notificacoes],
        }));
        return notificacao;
      },

      marcarNotificacaoLida: (id) => {
        set((state) => ({
          notificacoes: state.notificacoes.map((n) =>
            n.id === id ? { ...n, lida: true } : n
          ),
        }));
      },

      marcarTodasNotificacoesLidas: (medicoId) => {
        set((state) => ({
          notificacoes: state.notificacoes.map((n) =>
            n.medicoId === medicoId ? { ...n, lida: true } : n
          ),
        }));
      },

      deleteNotificacao: (id) => {
        set((state) => ({
          notificacoes: state.notificacoes.filter((n) => n.id !== id),
        }));
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

      // ==================== DADOS MOCK ====================
      inicializarDadosMock: (medicoId) => {
        const { pacientes } = get();
        
        // Não inicializar se já existem dados para este médico
        if (pacientes.filter((p) => p.medicoId === medicoId).length > 0) {
          return;
        }

        // Inicializar configurações
        get().initConfiguracoes(medicoId);

        const hoje = new Date();
        
        // Pacientes mock
        const pacientesMock: Paciente[] = [
          {
            id: 'pac-1',
            medicoId,
            nome: 'Maria Santos',
            telefone: '11999887766',
            email: 'maria.santos@email.com',
            status: 'ativo',
            valorConsulta: 200,
            queixaPrincipal: 'Ansiedade generalizada',
            alergias: 'Nenhuma conhecida',
            criadoEm: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'pac-2',
            medicoId,
            nome: 'João Oliveira',
            telefone: '11988776655',
            email: 'joao.oliveira@email.com',
            status: 'ativo',
            valorConsulta: 180,
            queixaPrincipal: 'Dificuldade em lidar com luto',
            criadoEm: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'pac-3',
            medicoId,
            nome: 'Ana Costa',
            telefone: '11977665544',
            email: 'ana.costa@email.com',
            status: 'ativo',
            valorConsulta: 200,
            criadoEm: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'pac-4',
            medicoId,
            nome: 'Pedro Lima',
            telefone: '11966554433',
            email: 'pedro.lima@email.com',
            status: 'inativo',
            valorConsulta: 150,
            criadoEm: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'pac-5',
            medicoId,
            nome: 'Carla Mendes',
            telefone: '11955443322',
            email: 'carla.mendes@email.com',
            status: 'ativo',
            valorConsulta: 220,
            criadoEm: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        ];

        // Atendimentos mock
        const atendimentosMock: Atendimento[] = [
          {
            id: 'atend-1',
            pacienteId: 'pac-1',
            medicoId,
            data: hoje,
            hora: '09:00',
            status: 'realizado',
            valor: 200,
            criadoEm: new Date(),
          },
          {
            id: 'atend-2',
            pacienteId: 'pac-2',
            medicoId,
            data: hoje,
            hora: '10:00',
            status: 'agendado',
            valor: 180,
            criadoEm: new Date(),
          },
          {
            id: 'atend-3',
            pacienteId: 'pac-3',
            medicoId,
            data: hoje,
            hora: '11:00',
            status: 'agendado',
            valor: 200,
            criadoEm: new Date(),
          },
          {
            id: 'atend-4',
            pacienteId: 'pac-1',
            medicoId,
            data: hoje,
            hora: '14:00',
            status: 'agendado',
            valor: 200,
            criadoEm: new Date(),
          },
          {
            id: 'atend-5',
            pacienteId: 'pac-5',
            medicoId,
            data: hoje,
            hora: '15:00',
            status: 'agendado',
            valor: 220,
            criadoEm: new Date(),
          },
        ];

        // Pagamentos mock
        const pagamentosMock: Pagamento[] = [
          {
            id: 'pag-1',
            pacienteId: 'pac-1',
            atendimentoId: 'atend-1',
            valor: 200,
            formaPagamento: 'pix',
            status: 'pago',
            data: hoje,
            dataPagamento: hoje,
            criadoEm: new Date(),
          },
          {
            id: 'pag-2',
            pacienteId: 'pac-2',
            atendimentoId: 'atend-2',
            valor: 180,
            formaPagamento: 'cartao',
            status: 'pendente',
            data: hoje,
            criadoEm: new Date(),
          },
          {
            id: 'pag-3',
            pacienteId: 'pac-3',
            atendimentoId: 'atend-3',
            valor: 200,
            formaPagamento: 'dinheiro',
            status: 'pendente',
            data: hoje,
            criadoEm: new Date(),
          },
          {
            id: 'pag-4',
            pacienteId: 'pac-5',
            valor: 220,
            formaPagamento: 'transferencia',
            status: 'pendente',
            data: hoje,
            criadoEm: new Date(),
          },
        ];

        // Prontuários mock
        const prontuariosMock: Prontuario[] = [
          {
            id: 'pront-1',
            pacienteId: 'pac-1',
            medicoId,
            profissionalNome: 'Dra. Ana Silva',
            texto: 'Primeira sessão: Paciente relata ansiedade em situações sociais. Iniciamos trabalho de identificação de gatilhos.',
            criadoEm: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'pront-2',
            pacienteId: 'pac-1',
            medicoId,
            profissionalNome: 'Dra. Ana Silva',
            texto: 'Segunda sessão: Evolução positiva. Paciente conseguiu identificar 3 gatilhos principais.',
            criadoEm: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'pront-3',
            pacienteId: 'pac-2',
            medicoId,
            profissionalNome: 'Dra. Ana Silva',
            texto: 'Sessão inicial: Paciente busca ajuda para lidar com luto recente. Apresenta sintomas depressivos leves.',
            criadoEm: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        ];

        // Notificações mock
        const notificacoesMock: Notificacao[] = [
          {
            id: 'notif-1',
            medicoId,
            tipo: 'agendamento',
            titulo: 'Novo agendamento',
            mensagem: 'Maria Santos agendou para hoje às 14:00',
            lida: false,
            link: '/agenda',
            data: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            id: 'notif-2',
            medicoId,
            tipo: 'pagamento',
            titulo: 'Pagamento confirmado',
            mensagem: 'Pagamento de R$ 200,00 de Maria Santos confirmado',
            lida: true,
            link: '/financeiro',
            data: new Date(Date.now() - 5 * 60 * 60 * 1000),
          },
        ];

        set((state) => ({
          pacientes: [...state.pacientes, ...pacientesMock],
          atendimentos: [...state.atendimentos, ...atendimentosMock],
          pagamentos: [...state.pagamentos, ...pagamentosMock],
          prontuarios: [...state.prontuarios, ...prontuariosMock],
          notificacoes: [...state.notificacoes, ...notificacoesMock],
        }));
      },
    }),
    {
      name: 'pronti-data',
      partialize: (state) => ({
        usuarios: state.usuarios,
        pacientes: state.pacientes,
        atendimentos: state.atendimentos,
        pagamentos: state.pagamentos,
        prontuarios: state.prontuarios,
        notificacoes: state.notificacoes,
        configuracoes: state.configuracoes,
      }),
    }
  )
);
