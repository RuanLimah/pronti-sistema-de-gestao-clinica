// ============= PRONTI - Sistema de Planos e Monetização =============

// Tipos de plano
export type PlanTier = 'gratuito' | 'essencial' | 'profissional' | 'clinica';
export type AddonType = 'whatsapp_avancado' | 'armazenamento_extra' | 'relatorios_avancados';
export type SubscriptionStatus = 'ativa' | 'trial' | 'cancelada' | 'expirada' | 'suspensa';

// Limites do plano
export interface PlanLimits {
  maxPacientesAtivos: number | null; // null = ilimitado
  maxAtendimentosMes: number | null;
  maxUsuarios: number;
  maxArmazenamentoMB: number;
}

// Recursos do plano
export interface PlanFeatures {
  agenda: boolean;
  agendaCompleta: boolean;
  pacientes: boolean;
  prontuarioBasico: boolean;
  prontuarioCompleto: boolean;
  financeiroSimples: boolean;
  financeiroCompleto: boolean;
  whatsappManual: boolean;
  whatsappAutomatico: boolean;
  envioEmMassa: boolean;
  lembretes: boolean;
  relatoriosPdf: boolean;
  relatoriosAvancados: boolean;
  uploadExames: boolean;
  uploadIlimitado: boolean;
  multiUsuarios: boolean;
  rbac: boolean;
  relatoriosPorProfissional: boolean;
  suportePrioritario: boolean;
}

// Definição do plano
export interface PlanDefinition {
  id: string;
  nome: string;
  tier: PlanTier;
  valor: number;
  valorAnual?: number;
  descricao: string;
  destaque?: boolean;
  limites: PlanLimits;
  recursos: PlanFeatures;
  ordem: number;
}

// Add-on
export interface Addon {
  id: string;
  tipo: AddonType;
  nome: string;
  descricao: string;
  valor: number;
  ativo: boolean;
  recursos: Partial<PlanFeatures>;
  limites?: Partial<PlanLimits>;
}

// Assinatura do médico
export interface DoctorSubscription {
  id: string;
  medicoId: string;
  planoId: string;
  plano: PlanDefinition;
  status: SubscriptionStatus;
  dataInicio: Date;
  dataFim?: Date;
  trialFim?: Date;
  canceladoEm?: Date;
  motivoCancelamento?: string;
  criadoEm: Date;
  atualizadoEm?: Date;
}

// Add-ons contratados
export interface DoctorAddon {
  id: string;
  medicoId: string;
  addonId: string;
  addon: Addon;
  ativo: boolean;
  dataInicio: Date;
  dataFim?: Date;
  criadoEm: Date;
}

// Feature flags calculadas
export interface CalculatedFeatures {
  // Limites
  maxPacientesAtivos: number | null;
  maxAtendimentosMes: number | null;
  maxUsuarios: number;
  maxArmazenamentoMB: number;
  
  // Recursos (combinação plano + add-ons)
  canUseAgenda: boolean;
  canUseAgendaCompleta: boolean;
  canUseProntuarioBasico: boolean;
  canUseProntuarioCompleto: boolean;
  canUseFinanceiroSimples: boolean;
  canUseFinanceiroCompleto: boolean;
  canUseWhatsappManual: boolean;
  canUseWhatsappAuto: boolean;
  canUseEnvioMassa: boolean;
  canUseLembretes: boolean;
  canExportPdf: boolean;
  canUseRelatoriosAvancados: boolean;
  canUploadExames: boolean;
  canUploadIlimitado: boolean;
  canAddUsuarios: boolean;
  canUseRbac: boolean;
  canUseRelatoriosPorProfissional: boolean;
  hasSuportePrioritario: boolean;
  
  // Contadores
  pacientesAtivosCount: number;
  atendimentosMesCount: number;
  armazenamentoUsadoMB: number;
  
  // Verificações de limite
  canAddPaciente: boolean;
  canAddAtendimento: boolean;
  canUploadMais: boolean;
  
  // Info do plano
  planTier: PlanTier;
  planNome: string;
  isTrialActive: boolean;
  trialDaysRemaining: number | null;
}

// Histórico de mudanças de plano
export interface PlanChangeHistory {
  id: string;
  medicoId: string;
  planoAnteriorId: string;
  planoNovoId: string;
  planoAnterior: PlanTier;
  planoNovo: PlanTier;
  motivo?: string;
  criadoPor: string; // user_id (admin ou próprio médico)
  criadoEm: Date;
}

// Uso mensal (para tracking de limites)
export interface MonthlyUsage {
  medicoId: string;
  mes: string; // YYYY-MM
  atendimentosRealizados: number;
  armazenamentoUsadoMB: number;
  mensagensWhatsapp: number;
}

// ============= DEFINIÇÕES DOS PLANOS =============

export const PLANOS: Record<PlanTier, PlanDefinition> = {
  gratuito: {
    id: 'plan_gratuito',
    nome: 'Gratuito',
    tier: 'gratuito',
    valor: 0,
    descricao: 'Para testar e conhecer o sistema',
    ordem: 0,
    limites: {
      maxPacientesAtivos: 10,
      maxAtendimentosMes: 10,
      maxUsuarios: 1,
      maxArmazenamentoMB: 100,
    },
    recursos: {
      agenda: true,
      agendaCompleta: false,
      pacientes: true,
      prontuarioBasico: false,
      prontuarioCompleto: false,
      financeiroSimples: false,
      financeiroCompleto: false,
      whatsappManual: false,
      whatsappAutomatico: false,
      envioEmMassa: false,
      lembretes: false,
      relatoriosPdf: false,
      relatoriosAvancados: false,
      uploadExames: false,
      uploadIlimitado: false,
      multiUsuarios: false,
      rbac: false,
      relatoriosPorProfissional: false,
      suportePrioritario: false,
    },
  },
  essencial: {
    id: 'plan_essencial',
    nome: 'Essencial',
    tier: 'essencial',
    valor: 49.90,
    valorAnual: 479.00,
    descricao: 'Começar - Para profissionais iniciantes',
    ordem: 1,
    limites: {
      maxPacientesAtivos: 50,
      maxAtendimentosMes: null,
      maxUsuarios: 1,
      maxArmazenamentoMB: 500,
    },
    recursos: {
      agenda: true,
      agendaCompleta: true,
      pacientes: true,
      prontuarioBasico: true,
      prontuarioCompleto: false,
      financeiroSimples: true,
      financeiroCompleto: false,
      whatsappManual: true,
      whatsappAutomatico: false,
      envioEmMassa: false,
      lembretes: false,
      relatoriosPdf: false,
      relatoriosAvancados: false,
      uploadExames: true,
      uploadIlimitado: false,
      multiUsuarios: false,
      rbac: false,
      relatoriosPorProfissional: false,
      suportePrioritario: false,
    },
  },
  profissional: {
    id: 'plan_profissional',
    nome: 'Profissional',
    tier: 'profissional',
    valor: 99.90,
    valorAnual: 959.00,
    descricao: 'Crescer - Para profissionais em expansão',
    destaque: true,
    ordem: 2,
    limites: {
      maxPacientesAtivos: 300,
      maxAtendimentosMes: null,
      maxUsuarios: 1,
      maxArmazenamentoMB: 5000,
    },
    recursos: {
      agenda: true,
      agendaCompleta: true,
      pacientes: true,
      prontuarioBasico: true,
      prontuarioCompleto: true,
      financeiroSimples: true,
      financeiroCompleto: true,
      whatsappManual: true,
      whatsappAutomatico: true,
      envioEmMassa: true,
      lembretes: true,
      relatoriosPdf: true,
      relatoriosAvancados: false,
      uploadExames: true,
      uploadIlimitado: true,
      multiUsuarios: false,
      rbac: false,
      relatoriosPorProfissional: false,
      suportePrioritario: false,
    },
  },
  clinica: {
    id: 'plan_clinica',
    nome: 'Clínica',
    tier: 'clinica',
    valor: 199.90,
    valorAnual: 1919.00,
    descricao: 'Escalar - Para clínicas e equipes',
    ordem: 3,
    limites: {
      maxPacientesAtivos: null,
      maxAtendimentosMes: null,
      maxUsuarios: 10,
      maxArmazenamentoMB: 50000,
    },
    recursos: {
      agenda: true,
      agendaCompleta: true,
      pacientes: true,
      prontuarioBasico: true,
      prontuarioCompleto: true,
      financeiroSimples: true,
      financeiroCompleto: true,
      whatsappManual: true,
      whatsappAutomatico: true,
      envioEmMassa: true,
      lembretes: true,
      relatoriosPdf: true,
      relatoriosAvancados: true,
      uploadExames: true,
      uploadIlimitado: true,
      multiUsuarios: true,
      rbac: true,
      relatoriosPorProfissional: true,
      suportePrioritario: true,
    },
  },
};

// ============= DEFINIÇÕES DOS ADD-ONS =============

export const ADDONS: Record<AddonType, Addon> = {
  whatsapp_avancado: {
    id: 'addon_whatsapp',
    tipo: 'whatsapp_avancado',
    nome: 'WhatsApp Automático Avançado',
    descricao: 'Lembretes automáticos, confirmações e mensagens personalizadas',
    valor: 29.90,
    ativo: true,
    recursos: {
      whatsappAutomatico: true,
      envioEmMassa: true,
      lembretes: true,
    },
  },
  armazenamento_extra: {
    id: 'addon_storage',
    tipo: 'armazenamento_extra',
    nome: 'Armazenamento Extra',
    descricao: 'Expansão de espaço para exames e documentos (+10GB)',
    valor: 19.90,
    ativo: true,
    recursos: {},
    limites: {
      maxArmazenamentoMB: 10000, // +10GB
    },
  },
  relatorios_avancados: {
    id: 'addon_reports',
    tipo: 'relatorios_avancados',
    nome: 'Relatórios Avançados',
    descricao: 'Filtros por período, gráficos comparativos e histórico completo',
    valor: 14.90,
    ativo: true,
    recursos: {
      relatoriosAvancados: true,
    },
  },
};

// ============= HELPER FUNCTIONS =============

export function getPlanByTier(tier: PlanTier): PlanDefinition {
  return PLANOS[tier];
}

export function getAddonByType(type: AddonType): Addon {
  return ADDONS[type];
}

export function isTrialExpired(subscription: DoctorSubscription): boolean {
  if (subscription.status !== 'trial' || !subscription.trialFim) return false;
  return new Date() > new Date(subscription.trialFim);
}

export function getTrialDaysRemaining(subscription: DoctorSubscription): number | null {
  if (subscription.status !== 'trial' || !subscription.trialFim) return null;
  const now = new Date();
  const end = new Date(subscription.trialFim);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function canUpgradeTo(currentTier: PlanTier, targetTier: PlanTier): boolean {
  const currentPlan = PLANOS[currentTier];
  const targetPlan = PLANOS[targetTier];
  return targetPlan.ordem > currentPlan.ordem;
}

export function canDowngradeTo(currentTier: PlanTier, targetTier: PlanTier): boolean {
  const currentPlan = PLANOS[currentTier];
  const targetPlan = PLANOS[targetTier];
  return targetPlan.ordem < currentPlan.ordem;
}
