// ============= PRONTI - Store de Clientes (Profissionais) =============

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlanTier, PLANOS, AddonType, ADDONS } from '@/types/plans';

// Status do cliente
export type ClientStatus = 'ativo' | 'inativo' | 'suspenso' | 'bloqueado' | 'trial';

// Estrutura de addon do cliente
export interface ClientAddon {
  addonType: AddonType;
  status: 'disponivel' | 'ativo' | 'inativo' | 'bloqueado_por_plano';
  dataAtivacao?: Date;
  dataDesativacao?: Date;
}

// Histórico de ações administrativas
export interface AdminActionHistory {
  id: string;
  clienteId: string;
  acao: string;
  descricao: string;
  adminId: string;
  adminNome: string;
  criadoEm: Date;
  dados?: Record<string, unknown>;
}

// Estrutura do cliente (profissional)
export interface Client {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpfCnpj?: string;
  crp?: string;
  especialidade?: string;
  
  // Status e datas
  status: ClientStatus;
  criadoEm: Date;
  atualizadoEm?: Date;
  
  // Plano
  planoAtual: PlanTier;
  planoDataInicio: Date;
  trialFim?: Date;
  
  // Add-ons
  addons: ClientAddon[];
  
  // Métricas
  totalPacientes: number;
  pacientesAtivos: number;
  atendimentosMes: number;
  armazenamentoUsadoMB: number;
  
  // Pagamento
  ultimoPagamento?: Date;
  proximoVencimento?: Date;
  valorMensal: number;
}

// Histórico de pagamentos
export interface PaymentHistory {
  id: string;
  clienteId: string;
  valor: number;
  tipo: 'plano' | 'addon' | 'upgrade';
  descricao: string;
  status: 'pendente' | 'pago' | 'cancelado' | 'estornado';
  data: Date;
  dataPagamento?: Date;
}

interface ClientStore {
  // Estado
  clients: Client[];
  adminHistory: AdminActionHistory[];
  paymentHistory: PaymentHistory[];
  
  // Getters
  getClient: (id: string) => Client | undefined;
  getClientByEmail: (email: string) => Client | undefined;
  getAllClients: () => Client[];
  getActiveClients: () => Client[];
  getClientAddons: (clienteId: string) => ClientAddon[];
  getClientHistory: (clienteId: string) => AdminActionHistory[];
  getClientPayments: (clienteId: string) => PaymentHistory[];
  
  // Mutações - Cliente
  createClient: (data: Omit<Client, 'id' | 'criadoEm' | 'addons' | 'totalPacientes' | 'pacientesAtivos' | 'atendimentosMes' | 'armazenamentoUsadoMB' | 'valorMensal'>) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  setClientStatus: (id: string, status: ClientStatus, adminId: string, adminNome: string, justificativa?: string) => void;
  
  // Mutações - Plano
  changeClientPlan: (clienteId: string, novoPlano: PlanTier, adminId: string, adminNome: string) => void;
  grantClientTrial: (clienteId: string, dias: number, adminId: string, adminNome: string) => void;
  
  // Mutações - Add-ons
  toggleClientAddon: (clienteId: string, addonType: AddonType, ativar: boolean, adminId: string, adminNome: string) => void;
  updateAddonStatus: (clienteId: string, addonType: AddonType, status: ClientAddon['status']) => void;
  
  // Mutações - Métricas
  updateClientMetrics: (clienteId: string, metrics: Partial<Pick<Client, 'totalPacientes' | 'pacientesAtivos' | 'atendimentosMes' | 'armazenamentoUsadoMB'>>) => void;
  
  // Mutações - Histórico
  addAdminAction: (action: Omit<AdminActionHistory, 'id' | 'criadoEm'>) => void;
  addPayment: (payment: Omit<PaymentHistory, 'id'>) => void;
  
  // Utils
  gerarId: () => string;
  calcularValorMensal: (plano: PlanTier, addons: ClientAddon[]) => number;
}

// Mock de clientes iniciais
const mockClients: Client[] = [
  {
    id: 'cliente-1',
    nome: 'Dra. Ana Silva',
    email: 'dra.ana@pronti.com',
    telefone: '11999887766',
    crp: '06/123456',
    especialidade: 'Psicologia Clínica',
    status: 'ativo',
    criadoEm: new Date('2024-01-15'),
    planoAtual: 'profissional',
    planoDataInicio: new Date('2024-01-15'),
    addons: [
      { addonType: 'whatsapp_avancado', status: 'ativo', dataAtivacao: new Date('2024-02-01') },
      { addonType: 'armazenamento_extra', status: 'disponivel' },
      { addonType: 'relatorios_avancados', status: 'disponivel' },
    ],
    totalPacientes: 45,
    pacientesAtivos: 38,
    atendimentosMes: 72,
    armazenamentoUsadoMB: 1200,
    ultimoPagamento: new Date('2024-12-01'),
    proximoVencimento: new Date('2025-02-01'),
    valorMensal: 129.80,
  },
  {
    id: 'cliente-2',
    nome: 'Dr. Carlos Mendes',
    email: 'dr.carlos@pronti.com',
    telefone: '11988776655',
    crp: '06/789012',
    especialidade: 'Psicologia Organizacional',
    status: 'ativo',
    criadoEm: new Date('2024-03-20'),
    planoAtual: 'essencial',
    planoDataInicio: new Date('2024-03-20'),
    addons: [
      { addonType: 'whatsapp_avancado', status: 'disponivel' },
      { addonType: 'armazenamento_extra', status: 'disponivel' },
      { addonType: 'relatorios_avancados', status: 'disponivel' },
    ],
    totalPacientes: 22,
    pacientesAtivos: 18,
    atendimentosMes: 35,
    armazenamentoUsadoMB: 350,
    ultimoPagamento: new Date('2024-12-05'),
    proximoVencimento: new Date('2025-02-05'),
    valorMensal: 49.90,
  },
  {
    id: 'cliente-3',
    nome: 'Dra. Mariana Costa',
    email: 'mariana.costa@email.com',
    telefone: '21977665544',
    crp: '05/345678',
    especialidade: 'Neuropsicologia',
    status: 'trial',
    criadoEm: new Date('2025-01-10'),
    planoAtual: 'profissional',
    planoDataInicio: new Date('2025-01-10'),
    trialFim: new Date('2025-01-24'),
    addons: [
      { addonType: 'whatsapp_avancado', status: 'bloqueado_por_plano' },
      { addonType: 'armazenamento_extra', status: 'bloqueado_por_plano' },
      { addonType: 'relatorios_avancados', status: 'bloqueado_por_plano' },
    ],
    totalPacientes: 5,
    pacientesAtivos: 5,
    atendimentosMes: 8,
    armazenamentoUsadoMB: 50,
    valorMensal: 0,
  },
  {
    id: 'cliente-4',
    nome: 'Dr. Roberto Lima',
    email: 'roberto.lima@clinica.com',
    telefone: '31966554433',
    especialidade: 'Odontologia',
    status: 'suspenso',
    criadoEm: new Date('2024-06-01'),
    planoAtual: 'essencial',
    planoDataInicio: new Date('2024-06-01'),
    addons: [
      { addonType: 'whatsapp_avancado', status: 'inativo' },
      { addonType: 'armazenamento_extra', status: 'disponivel' },
      { addonType: 'relatorios_avancados', status: 'disponivel' },
    ],
    totalPacientes: 30,
    pacientesAtivos: 0,
    atendimentosMes: 0,
    armazenamentoUsadoMB: 800,
    ultimoPagamento: new Date('2024-11-01'),
    valorMensal: 49.90,
  },
];

const mockHistory: AdminActionHistory[] = [
  {
    id: 'hist-1',
    clienteId: 'cliente-1',
    acao: 'addon_ativado',
    descricao: 'Add-on WhatsApp Automático ativado',
    adminId: 'admin-1',
    adminNome: 'Administrador',
    criadoEm: new Date('2024-02-01'),
  },
  {
    id: 'hist-2',
    clienteId: 'cliente-4',
    acao: 'conta_suspensa',
    descricao: 'Conta suspensa por inadimplência',
    adminId: 'admin-1',
    adminNome: 'Administrador',
    criadoEm: new Date('2024-12-15'),
  },
];

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: mockClients,
      adminHistory: mockHistory,
      paymentHistory: [],
      
      gerarId: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      
      calcularValorMensal: (plano, addons) => {
        const planoValor = PLANOS[plano].valor;
        const addonsValor = addons
          .filter(a => a.status === 'ativo')
          .reduce((sum, a) => sum + ADDONS[a.addonType].valor, 0);
        return planoValor + addonsValor;
      },
      
      // ==================== GETTERS ====================
      
      getClient: (id) => get().clients.find(c => c.id === id),
      
      getClientByEmail: (email) => get().clients.find(c => c.email.toLowerCase() === email.toLowerCase()),
      
      getAllClients: () => get().clients,
      
      getActiveClients: () => get().clients.filter(c => c.status === 'ativo' || c.status === 'trial'),
      
      getClientAddons: (clienteId) => {
        const client = get().getClient(clienteId);
        return client?.addons || [];
      },
      
      getClientHistory: (clienteId) => {
        return get().adminHistory
          .filter(h => h.clienteId === clienteId)
          .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
      },
      
      getClientPayments: (clienteId) => {
        return get().paymentHistory
          .filter(p => p.clienteId === clienteId)
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      },
      
      // ==================== MUTAÇÕES - CLIENTE ====================
      
      createClient: (data) => {
        const id = get().gerarId();
        
        // Inicializar add-ons (todos visíveis, bloqueados por padrão)
        const addons: ClientAddon[] = Object.keys(ADDONS).map(key => ({
          addonType: key as AddonType,
          status: 'disponivel' as const,
        }));
        
        const valorMensal = get().calcularValorMensal(data.planoAtual, addons);
        
        const client: Client = {
          ...data,
          id,
          criadoEm: new Date(),
          addons,
          totalPacientes: 0,
          pacientesAtivos: 0,
          atendimentosMes: 0,
          armazenamentoUsadoMB: 0,
          valorMensal,
        };
        
        set(state => ({
          clients: [...state.clients, client],
        }));
        
        return client;
      },
      
      updateClient: (id, data) => {
        set(state => ({
          clients: state.clients.map(c =>
            c.id === id ? { ...c, ...data, atualizadoEm: new Date() } : c
          ),
        }));
      },
      
      setClientStatus: (id, status, adminId, adminNome, justificativa) => {
        const client = get().getClient(id);
        if (!client) return;
        
        set(state => ({
          clients: state.clients.map(c =>
            c.id === id ? { ...c, status, atualizadoEm: new Date() } : c
          ),
        }));
        
        // Registrar histórico
        get().addAdminAction({
          clienteId: id,
          acao: `status_${status}`,
          descricao: `Status alterado para ${status}${justificativa ? `: ${justificativa}` : ''}`,
          adminId,
          adminNome,
          dados: { statusAnterior: client.status, statusNovo: status, justificativa },
        });
      },
      
      // ==================== MUTAÇÕES - PLANO ====================
      
      changeClientPlan: (clienteId, novoPlano, adminId, adminNome) => {
        const client = get().getClient(clienteId);
        if (!client) return;
        
        const planoAnterior = client.planoAtual;
        const valorMensal = get().calcularValorMensal(novoPlano, client.addons);
        
        set(state => ({
          clients: state.clients.map(c =>
            c.id === clienteId ? {
              ...c,
              planoAtual: novoPlano,
              planoDataInicio: new Date(),
              valorMensal,
              atualizadoEm: new Date(),
            } : c
          ),
        }));
        
        get().addAdminAction({
          clienteId,
          acao: 'plano_alterado',
          descricao: `Plano alterado de ${PLANOS[planoAnterior].nome} para ${PLANOS[novoPlano].nome}`,
          adminId,
          adminNome,
          dados: { planoAnterior, planoNovo: novoPlano },
        });
      },
      
      grantClientTrial: (clienteId, dias, adminId, adminNome) => {
        const trialFim = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
        
        set(state => ({
          clients: state.clients.map(c =>
            c.id === clienteId ? {
              ...c,
              status: 'trial',
              trialFim,
              atualizadoEm: new Date(),
            } : c
          ),
        }));
        
        get().addAdminAction({
          clienteId,
          acao: 'trial_concedido',
          descricao: `Trial de ${dias} dias concedido`,
          adminId,
          adminNome,
          dados: { dias, trialFim },
        });
      },
      
      // ==================== MUTAÇÕES - ADD-ONS ====================
      
      toggleClientAddon: (clienteId, addonType, ativar, adminId, adminNome) => {
        const client = get().getClient(clienteId);
        if (!client) return;
        
        const newStatus: ClientAddon['status'] = ativar ? 'ativo' : 'inativo';
        
        set(state => ({
          clients: state.clients.map(c =>
            c.id === clienteId ? {
              ...c,
              addons: c.addons.map(a =>
                a.addonType === addonType ? {
                  ...a,
                  status: newStatus,
                  dataAtivacao: ativar ? new Date() : a.dataAtivacao,
                  dataDesativacao: !ativar ? new Date() : undefined,
                } : a
              ),
              valorMensal: get().calcularValorMensal(c.planoAtual, c.addons.map(a =>
                a.addonType === addonType ? { ...a, status: newStatus } : a
              )),
              atualizadoEm: new Date(),
            } : c
          ),
        }));
        
        const addon = ADDONS[addonType];
        get().addAdminAction({
          clienteId,
          acao: ativar ? 'addon_ativado' : 'addon_desativado',
          descricao: `Add-on ${addon.nome} ${ativar ? 'ativado' : 'desativado'}`,
          adminId,
          adminNome,
          dados: { addonType, ativo: ativar },
        });
      },
      
      updateAddonStatus: (clienteId, addonType, status) => {
        set(state => ({
          clients: state.clients.map(c =>
            c.id === clienteId ? {
              ...c,
              addons: c.addons.map(a =>
                a.addonType === addonType ? { ...a, status } : a
              ),
              atualizadoEm: new Date(),
            } : c
          ),
        }));
      },
      
      // ==================== MUTAÇÕES - MÉTRICAS ====================
      
      updateClientMetrics: (clienteId, metrics) => {
        set(state => ({
          clients: state.clients.map(c =>
            c.id === clienteId ? { ...c, ...metrics, atualizadoEm: new Date() } : c
          ),
        }));
      },
      
      // ==================== MUTAÇÕES - HISTÓRICO ====================
      
      addAdminAction: (action) => {
        const entry: AdminActionHistory = {
          ...action,
          id: get().gerarId(),
          criadoEm: new Date(),
        };
        
        set(state => ({
          adminHistory: [...state.adminHistory, entry],
        }));
      },
      
      addPayment: (payment) => {
        const entry: PaymentHistory = {
          ...payment,
          id: get().gerarId(),
        };
        
        set(state => ({
          paymentHistory: [...state.paymentHistory, entry],
        }));
      },
    }),
    {
      name: 'pronti-clients',
    }
  )
);
