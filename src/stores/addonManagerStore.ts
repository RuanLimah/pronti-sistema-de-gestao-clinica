// ============= PRONTI - Gerenciador Central de Add-ons =============

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AddonType, ADDONS, PlanTier, PLANOS } from '@/types/plans';

// Estado do addon no sistema
export type AddonSystemStatus = 'disponivel' | 'ativo' | 'inativo' | 'bloqueado_por_plano' | 'manutencao';

// Definição global do addon
export interface GlobalAddon {
  tipo: AddonType;
  nome: string;
  descricao: string;
  valor: number;
  ativo: boolean; // Se o addon está disponível no sistema
  planosDisponiveis: PlanTier[]; // Quais planos podem contratar
  ordem: number;
  icone?: string;
}

// Addon de um cliente específico
export interface ClientAddonStatus {
  clienteId: string;
  addonType: AddonType;
  status: AddonSystemStatus;
  dataAtivacao?: Date;
  dataDesativacao?: Date;
  motivoBloqueio?: string;
}

// Logs de alteração de addon
export interface AddonChangeLog {
  id: string;
  clienteId: string;
  addonType: AddonType;
  acao: 'ativado' | 'desativado' | 'bloqueado' | 'desbloqueado';
  motivo?: string;
  adminId?: string;
  adminNome?: string;
  criadoEm: Date;
}

interface AddonManagerStore {
  // Estado global dos addons
  globalAddons: GlobalAddon[];
  clientAddons: ClientAddonStatus[];
  addonLogs: AddonChangeLog[];
  
  // Getters - Global
  getAllAddons: () => GlobalAddon[];
  getActiveAddons: () => GlobalAddon[];
  getAddonByType: (type: AddonType) => GlobalAddon | undefined;
  
  // Getters - Cliente
  getClientAddonStatus: (clienteId: string, addonType: AddonType) => ClientAddonStatus | undefined;
  getAllClientAddons: (clienteId: string) => ClientAddonStatus[];
  getActiveClientAddons: (clienteId: string) => ClientAddonStatus[];
  canClientUseAddon: (clienteId: string, addonType: AddonType, planoAtual: PlanTier) => boolean;
  
  // Getters - Admin
  getAddonsUsageStats: () => { addonType: AddonType; totalAtivos: number; totalInativos: number }[];
  getAddonLogs: (clienteId?: string, addonType?: AddonType) => AddonChangeLog[];
  
  // Mutações - Global
  setAddonGlobalStatus: (addonType: AddonType, ativo: boolean) => void;
  updateAddonPricing: (addonType: AddonType, valor: number) => void;
  
  // Mutações - Cliente
  initializeClientAddons: (clienteId: string, planoAtual: PlanTier) => void;
  activateAddon: (clienteId: string, addonType: AddonType, adminId?: string, adminNome?: string) => boolean;
  deactivateAddon: (clienteId: string, addonType: AddonType, adminId?: string, adminNome?: string) => boolean;
  blockAddon: (clienteId: string, addonType: AddonType, motivo: string, adminId: string, adminNome: string) => void;
  unblockAddon: (clienteId: string, addonType: AddonType, adminId: string, adminNome: string) => void;
  updateAddonStatusForPlan: (clienteId: string, novoPlano: PlanTier) => void;
  
  // Utils
  gerarId: () => string;
  calcularValorAddons: (clienteId: string) => number;
}

// Inicializar addons globais a partir das definições
const initialGlobalAddons: GlobalAddon[] = [
  {
    tipo: 'whatsapp_avancado',
    nome: ADDONS.whatsapp_avancado.nome,
    descricao: ADDONS.whatsapp_avancado.descricao,
    valor: ADDONS.whatsapp_avancado.valor,
    ativo: true,
    planosDisponiveis: ['essencial', 'profissional', 'clinica'],
    ordem: 1,
    icone: 'MessageSquare',
  },
  {
    tipo: 'armazenamento_extra',
    nome: ADDONS.armazenamento_extra.nome,
    descricao: ADDONS.armazenamento_extra.descricao,
    valor: ADDONS.armazenamento_extra.valor,
    ativo: true,
    planosDisponiveis: ['essencial', 'profissional', 'clinica'],
    ordem: 2,
    icone: 'HardDrive',
  },
  {
    tipo: 'relatorios_avancados',
    nome: ADDONS.relatorios_avancados.nome,
    descricao: ADDONS.relatorios_avancados.descricao,
    valor: ADDONS.relatorios_avancados.valor,
    ativo: true,
    planosDisponiveis: ['profissional', 'clinica'],
    ordem: 3,
    icone: 'BarChart3',
  },
];

export const useAddonManagerStore = create<AddonManagerStore>()(
  persist(
    (set, get) => ({
      globalAddons: initialGlobalAddons,
      clientAddons: [],
      addonLogs: [],
      
      gerarId: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      
      // ==================== GETTERS - GLOBAL ====================
      
      getAllAddons: () => get().globalAddons.sort((a, b) => a.ordem - b.ordem),
      
      getActiveAddons: () => get().globalAddons.filter(a => a.ativo).sort((a, b) => a.ordem - b.ordem),
      
      getAddonByType: (type) => get().globalAddons.find(a => a.tipo === type),
      
      // ==================== GETTERS - CLIENTE ====================
      
      getClientAddonStatus: (clienteId, addonType) => {
        return get().clientAddons.find(
          ca => ca.clienteId === clienteId && ca.addonType === addonType
        );
      },
      
      getAllClientAddons: (clienteId) => {
        const existing = get().clientAddons.filter(ca => ca.clienteId === clienteId);
        
        // Retornar todos os addons globais com status do cliente
        return get().globalAddons.map(ga => {
          const clientStatus = existing.find(e => e.addonType === ga.tipo);
          return clientStatus || {
            clienteId,
            addonType: ga.tipo,
            status: 'disponivel' as AddonSystemStatus,
          };
        });
      },
      
      getActiveClientAddons: (clienteId) => {
        return get().clientAddons.filter(
          ca => ca.clienteId === clienteId && ca.status === 'ativo'
        );
      },
      
      canClientUseAddon: (clienteId, addonType, planoAtual) => {
        const globalAddon = get().getAddonByType(addonType);
        if (!globalAddon || !globalAddon.ativo) return false;
        
        // Verificar se o plano permite
        if (!globalAddon.planosDisponiveis.includes(planoAtual)) return false;
        
        // Verificar status do cliente
        const clientStatus = get().getClientAddonStatus(clienteId, addonType);
        if (clientStatus?.status === 'bloqueado_por_plano') return false;
        
        return true;
      },
      
      // ==================== GETTERS - ADMIN ====================
      
      getAddonsUsageStats: () => {
        const stats: { addonType: AddonType; totalAtivos: number; totalInativos: number }[] = [];
        
        get().globalAddons.forEach(ga => {
          const clientStatuses = get().clientAddons.filter(ca => ca.addonType === ga.tipo);
          stats.push({
            addonType: ga.tipo,
            totalAtivos: clientStatuses.filter(cs => cs.status === 'ativo').length,
            totalInativos: clientStatuses.filter(cs => cs.status === 'inativo').length,
          });
        });
        
        return stats;
      },
      
      getAddonLogs: (clienteId, addonType) => {
        let logs = get().addonLogs;
        
        if (clienteId) {
          logs = logs.filter(l => l.clienteId === clienteId);
        }
        if (addonType) {
          logs = logs.filter(l => l.addonType === addonType);
        }
        
        return logs.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
      },
      
      // ==================== MUTAÇÕES - GLOBAL ====================
      
      setAddonGlobalStatus: (addonType, ativo) => {
        set(state => ({
          globalAddons: state.globalAddons.map(a =>
            a.tipo === addonType ? { ...a, ativo } : a
          ),
        }));
      },
      
      updateAddonPricing: (addonType, valor) => {
        set(state => ({
          globalAddons: state.globalAddons.map(a =>
            a.tipo === addonType ? { ...a, valor } : a
          ),
        }));
      },
      
      // ==================== MUTAÇÕES - CLIENTE ====================
      
      initializeClientAddons: (clienteId, planoAtual) => {
        const existing = get().clientAddons.filter(ca => ca.clienteId === clienteId);
        if (existing.length > 0) return; // Já inicializado
        
        const newAddons: ClientAddonStatus[] = get().globalAddons.map(ga => ({
          clienteId,
          addonType: ga.tipo,
          status: ga.planosDisponiveis.includes(planoAtual) ? 'disponivel' : 'bloqueado_por_plano',
        }));
        
        set(state => ({
          clientAddons: [...state.clientAddons, ...newAddons],
        }));
      },
      
      activateAddon: (clienteId, addonType, adminId, adminNome) => {
        const current = get().getClientAddonStatus(clienteId, addonType);
        
        if (current?.status === 'bloqueado_por_plano') {
          return false;
        }
        
        const existing = get().clientAddons.some(
          ca => ca.clienteId === clienteId && ca.addonType === addonType
        );
        
        if (existing) {
          set(state => ({
            clientAddons: state.clientAddons.map(ca =>
              ca.clienteId === clienteId && ca.addonType === addonType
                ? { ...ca, status: 'ativo', dataAtivacao: new Date() }
                : ca
            ),
          }));
        } else {
          set(state => ({
            clientAddons: [...state.clientAddons, {
              clienteId,
              addonType,
              status: 'ativo',
              dataAtivacao: new Date(),
            }],
          }));
        }
        
        // Log
        set(state => ({
          addonLogs: [...state.addonLogs, {
            id: get().gerarId(),
            clienteId,
            addonType,
            acao: 'ativado',
            adminId,
            adminNome,
            criadoEm: new Date(),
          }],
        }));
        
        return true;
      },
      
      deactivateAddon: (clienteId, addonType, adminId, adminNome) => {
        set(state => ({
          clientAddons: state.clientAddons.map(ca =>
            ca.clienteId === clienteId && ca.addonType === addonType
              ? { ...ca, status: 'inativo', dataDesativacao: new Date() }
              : ca
          ),
        }));
        
        set(state => ({
          addonLogs: [...state.addonLogs, {
            id: get().gerarId(),
            clienteId,
            addonType,
            acao: 'desativado',
            adminId,
            adminNome,
            criadoEm: new Date(),
          }],
        }));
        
        return true;
      },
      
      blockAddon: (clienteId, addonType, motivo, adminId, adminNome) => {
        set(state => ({
          clientAddons: state.clientAddons.map(ca =>
            ca.clienteId === clienteId && ca.addonType === addonType
              ? { ...ca, status: 'bloqueado_por_plano', motivoBloqueio: motivo }
              : ca
          ),
        }));
        
        set(state => ({
          addonLogs: [...state.addonLogs, {
            id: get().gerarId(),
            clienteId,
            addonType,
            acao: 'bloqueado',
            motivo,
            adminId,
            adminNome,
            criadoEm: new Date(),
          }],
        }));
      },
      
      unblockAddon: (clienteId, addonType, adminId, adminNome) => {
        set(state => ({
          clientAddons: state.clientAddons.map(ca =>
            ca.clienteId === clienteId && ca.addonType === addonType
              ? { ...ca, status: 'disponivel', motivoBloqueio: undefined }
              : ca
          ),
        }));
        
        set(state => ({
          addonLogs: [...state.addonLogs, {
            id: get().gerarId(),
            clienteId,
            addonType,
            acao: 'desbloqueado',
            adminId,
            adminNome,
            criadoEm: new Date(),
          }],
        }));
      },
      
      updateAddonStatusForPlan: (clienteId, novoPlano) => {
        set(state => ({
          clientAddons: state.clientAddons.map(ca => {
            if (ca.clienteId !== clienteId) return ca;
            
            const globalAddon = get().getAddonByType(ca.addonType);
            if (!globalAddon) return ca;
            
            // Se o plano não permite, bloquear
            if (!globalAddon.planosDisponiveis.includes(novoPlano)) {
              return { ...ca, status: 'bloqueado_por_plano' as AddonSystemStatus };
            }
            
            // Se estava bloqueado por plano e agora permite, liberar
            if (ca.status === 'bloqueado_por_plano') {
              return { ...ca, status: 'disponivel' as AddonSystemStatus };
            }
            
            return ca;
          }),
        }));
      },
      
      // ==================== UTILS ====================
      
      calcularValorAddons: (clienteId) => {
        const activeAddons = get().getActiveClientAddons(clienteId);
        return activeAddons.reduce((sum, ca) => {
          const addon = get().getAddonByType(ca.addonType);
          return sum + (addon?.valor || 0);
        }, 0);
      },
    }),
    {
      name: 'pronti-addon-manager',
    }
  )
);
