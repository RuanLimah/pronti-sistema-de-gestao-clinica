// ============= PRONTI - Sistema RBAC (Role-Based Access Control) =============

/**
 * Papéis do sistema hierárquicos
 * - profissional: Acessa apenas seus próprios pacientes e prontuários
 * - admin: Gerencia contas, planos, assinaturas (SEM acesso a conteúdo clínico)
 * - super_admin: Controle total, auditoria e métricas do negócio
 */
export type SystemRole = 'profissional' | 'admin' | 'super_admin';

/**
 * Tipos de entidades que podem ser auditadas
 */
export type AuditableEntity = 
  | 'prontuario'
  | 'exame'
  | 'paciente'
  | 'documento'
  | 'usuario'
  | 'plano'
  | 'addon'
  | 'assinatura'
  | 'configuracao'
  | 'sessao'
  | 'pagamento';

/**
 * Tipos de ações auditáveis
 */
export type AuditableAction = 
  | 'criar'
  | 'visualizar'
  | 'editar'
  | 'excluir'
  | 'exportar'
  | 'upload'
  | 'download'
  | 'login'
  | 'logout'
  | 'alterar_plano'
  | 'alterar_status'
  | 'alterar_permissao'
  | 'suspender'
  | 'reativar'
  | 'bloquear';

/**
 * Telas/origens possíveis para auditoria
 */
export type AuditScreen = 
  | 'dashboard'
  | 'prontuario'
  | 'pacientes'
  | 'agenda'
  | 'financeiro'
  | 'relatorios'
  | 'configuracoes'
  | 'admin'
  | 'auditoria'
  | 'busca'
  | 'whatsapp'
  | 'login'
  | 'api';

/**
 * Severidade do log de auditoria
 */
export type AuditSeverityLevel = 'info' | 'warning' | 'critical';

/**
 * Entrada completa de log de auditoria (LGPD compliant)
 */
export interface EnhancedAuditLogEntry {
  id: string;
  
  // Quem realizou a ação
  userId: string;
  userEmail: string;
  userNome: string;
  userRole: SystemRole;
  
  // Tipo de ação
  action: AuditableAction;
  
  // Qual dado foi acessado
  entity: AuditableEntity;
  entityId: string;
  entityNome?: string;
  
  // Data e hora
  timestamp: Date;
  
  // IP do usuário
  ipAddress?: string;
  userAgent?: string;
  
  // Tela / origem da ação
  screen: AuditScreen;
  
  // Dados alterados
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  changedFields?: string[];
  
  // Metadados de segurança
  severity: AuditSeverityLevel;
  sensitiveDataAccessed: boolean;
  dataExported: boolean;
  
  // Descrição legível
  descricao: string;
  
  // LGPD
  consentimentoId?: string;
}

/**
 * Permissões granulares por role
 */
export interface RolePermissions {
  // Prontuários
  canViewOwnProntuarios: boolean;
  canViewAllProntuarios: boolean;
  canEditProntuarios: boolean;
  canDeleteProntuarios: boolean;
  canExportProntuarios: boolean;
  
  // Pacientes
  canViewOwnPacientes: boolean;
  canViewAllPacientes: boolean;
  canEditPacientes: boolean;
  canDeletePacientes: boolean;
  
  // Admin
  canViewAdminPanel: boolean;
  canManageUsers: boolean;
  canManagePlans: boolean;
  canManageAddons: boolean;
  canSuspendUsers: boolean;
  canBlockUsers: boolean;
  
  // Super Admin
  canViewAuditLogs: boolean;
  canViewAllMetrics: boolean;
  canManageAdmins: boolean;
  canViewClinicalStats: boolean; // Apenas estatísticas, não conteúdo
}

/**
 * Mapeamento de permissões por role
 */
export const ROLE_PERMISSIONS: Record<SystemRole, RolePermissions> = {
  profissional: {
    canViewOwnProntuarios: true,
    canViewAllProntuarios: false,
    canEditProntuarios: true,
    canDeleteProntuarios: false, // Prontuário nunca deve ser deletado
    canExportProntuarios: true,
    
    canViewOwnPacientes: true,
    canViewAllPacientes: false,
    canEditPacientes: true,
    canDeletePacientes: false, // Paciente pode ser inativado, não deletado
    
    canViewAdminPanel: false,
    canManageUsers: false,
    canManagePlans: false,
    canManageAddons: false,
    canSuspendUsers: false,
    canBlockUsers: false,
    
    canViewAuditLogs: false,
    canViewAllMetrics: false,
    canManageAdmins: false,
    canViewClinicalStats: false,
  },
  
  admin: {
    canViewOwnProntuarios: false, // Admin NÃO acessa prontuários
    canViewAllProntuarios: false,
    canEditProntuarios: false,
    canDeleteProntuarios: false,
    canExportProntuarios: false,
    
    canViewOwnPacientes: false, // Admin NÃO acessa pacientes
    canViewAllPacientes: false, // Apenas pode ver QUANTIDADE
    canEditPacientes: false,
    canDeletePacientes: false,
    
    canViewAdminPanel: true,
    canManageUsers: true,
    canManagePlans: true,
    canManageAddons: true,
    canSuspendUsers: true,
    canBlockUsers: true,
    
    canViewAuditLogs: false, // Apenas Super Admin
    canViewAllMetrics: true,
    canManageAdmins: false,
    canViewClinicalStats: true, // Estatísticas agregadas apenas
  },
  
  super_admin: {
    canViewOwnProntuarios: false, // Super Admin também NÃO acessa prontuários
    canViewAllProntuarios: false,
    canEditProntuarios: false,
    canDeleteProntuarios: false,
    canExportProntuarios: false,
    
    canViewOwnPacientes: false,
    canViewAllPacientes: false,
    canEditPacientes: false,
    canDeletePacientes: false,
    
    canViewAdminPanel: true,
    canManageUsers: true,
    canManagePlans: true,
    canManageAddons: true,
    canSuspendUsers: true,
    canBlockUsers: true,
    
    canViewAuditLogs: true, // EXCLUSIVO do Super Admin
    canViewAllMetrics: true,
    canManageAdmins: true,
    canViewClinicalStats: true,
  },
};

/**
 * Helper para verificar permissão
 */
export function hasPermission(role: SystemRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Helper para verificar se role pode acessar dados clínicos
 */
export function canAccessClinicalData(role: SystemRole): boolean {
  return role === 'profissional';
}

/**
 * Helper para verificar se role pode ver auditoria
 */
export function canViewAudit(role: SystemRole): boolean {
  return role === 'super_admin';
}

/**
 * Labels para exibição
 */
export const ROLE_LABELS: Record<SystemRole, string> = {
  profissional: 'Profissional',
  admin: 'Administrador',
  super_admin: 'Super Administrador',
};

export const ACTION_LABELS: Record<AuditableAction, string> = {
  criar: 'Criação',
  visualizar: 'Visualização',
  editar: 'Edição',
  excluir: 'Exclusão',
  exportar: 'Exportação',
  upload: 'Upload',
  download: 'Download',
  login: 'Login',
  logout: 'Logout',
  alterar_plano: 'Alteração de Plano',
  alterar_status: 'Alteração de Status',
  alterar_permissao: 'Alteração de Permissão',
  suspender: 'Suspensão',
  reativar: 'Reativação',
  bloquear: 'Bloqueio',
};

export const ENTITY_LABELS: Record<AuditableEntity, string> = {
  prontuario: 'Prontuário',
  exame: 'Exame',
  paciente: 'Paciente',
  documento: 'Documento',
  usuario: 'Usuário',
  plano: 'Plano',
  addon: 'Add-on',
  assinatura: 'Assinatura',
  configuracao: 'Configuração',
  sessao: 'Sessão',
  pagamento: 'Pagamento',
};

export const SCREEN_LABELS: Record<AuditScreen, string> = {
  dashboard: 'Dashboard',
  prontuario: 'Prontuário',
  pacientes: 'Pacientes',
  agenda: 'Agenda',
  financeiro: 'Financeiro',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
  admin: 'Painel Admin',
  auditoria: 'Auditoria',
  busca: 'Busca',
  whatsapp: 'WhatsApp',
  login: 'Login',
  api: 'API',
};

/**
 * Determinar severidade baseado na ação e entidade
 */
export function determineSeverityLevel(action: AuditableAction, entity: AuditableEntity): AuditSeverityLevel {
  // Ações críticas
  if (['excluir', 'bloquear', 'alterar_permissao'].includes(action)) {
    return 'critical';
  }
  
  // Ações de aviso
  if (['exportar', 'suspender', 'alterar_plano', 'alterar_status'].includes(action)) {
    return 'warning';
  }
  
  // Acesso a dados sensíveis
  if (['prontuario', 'exame'].includes(entity) && ['visualizar', 'download'].includes(action)) {
    return 'warning';
  }
  
  return 'info';
}

/**
 * Verificar se ação envolve dados sensíveis
 */
export function isSensitiveAccess(entity: AuditableEntity, action: AuditableAction): boolean {
  const sensitiveEntities: AuditableEntity[] = ['prontuario', 'exame', 'paciente'];
  const sensitiveActions: AuditableAction[] = ['visualizar', 'exportar', 'download', 'editar'];
  
  return sensitiveEntities.includes(entity) && sensitiveActions.includes(action);
}

/**
 * Formatar descrição do log
 */
export function formatAuditLogDescription(
  action: AuditableAction,
  entity: AuditableEntity,
  entityNome?: string,
  changedFields?: string[]
): string {
  const actionLabel = ACTION_LABELS[action];
  const entityLabel = ENTITY_LABELS[entity];
  
  let description = `${actionLabel} de ${entityLabel}`;
  
  if (entityNome) {
    description += `: ${entityNome}`;
  }
  
  if (changedFields && changedFields.length > 0) {
    description += ` (campos: ${changedFields.join(', ')})`;
  }
  
  return description;
}
