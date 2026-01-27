// ============= PRONTI - Sistema de Auditoria (LGPD) =============

export type AuditAction = 
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'ACCESS_SENSITIVE'
  | 'PLAN_CHANGE'
  | 'ADDON_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'SUSPENSION'
  | 'REACTIVATION';

export type AuditEntity = 
  | 'paciente'
  | 'prontuario'
  | 'atendimento'
  | 'pagamento'
  | 'exame'
  | 'usuario'
  | 'configuracao'
  | 'plano'
  | 'addon'
  | 'permissao'
  | 'sessao';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  userNome: string;
  userTipo: 'admin' | 'medico';
  
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityNome?: string;
  
  severity: AuditSeverity;
  
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  changedFields?: string[];
  
  ip?: string;
  userAgent?: string;
  
  descricao: string;
  
  timestamp: Date;
  
  // Metadados para LGPD
  sensitiveDataAccessed?: boolean;
  dataExported?: boolean;
  consentimentoId?: string;
}

// Filtros para consulta de logs
export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  entityId?: string;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  sensitiveOnly?: boolean;
  searchTerm?: string;
}

// Estatísticas de auditoria (para admin)
export interface AuditStats {
  totalLogs: number;
  logsPorAcao: Record<AuditAction, number>;
  logsPorEntidade: Record<AuditEntity, number>;
  logsCriticosPeriodo: number;
  acessosDadosSensiveis: number;
  exportacoesPeriodo: number;
}

// ============= HELPERS =============

export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    CREATE: 'Criação',
    READ: 'Visualização',
    UPDATE: 'Atualização',
    DELETE: 'Exclusão',
    LOGIN: 'Login',
    LOGOUT: 'Logout',
    EXPORT: 'Exportação',
    UPLOAD: 'Upload',
    DOWNLOAD: 'Download',
    ACCESS_SENSITIVE: 'Acesso a Dados Sensíveis',
    PLAN_CHANGE: 'Alteração de Plano',
    ADDON_CHANGE: 'Alteração de Add-on',
    PERMISSION_CHANGE: 'Alteração de Permissão',
    SUSPENSION: 'Suspensão',
    REACTIVATION: 'Reativação',
  };
  return labels[action];
}

export function getEntityLabel(entity: AuditEntity): string {
  const labels: Record<AuditEntity, string> = {
    paciente: 'Paciente',
    prontuario: 'Prontuário',
    atendimento: 'Atendimento',
    pagamento: 'Pagamento',
    exame: 'Exame',
    usuario: 'Usuário',
    configuracao: 'Configuração',
    plano: 'Plano',
    addon: 'Add-on',
    permissao: 'Permissão',
    sessao: 'Sessão',
  };
  return labels[entity];
}

export function getSeverityColor(severity: AuditSeverity): string {
  const colors: Record<AuditSeverity, string> = {
    info: 'text-muted-foreground',
    warning: 'text-warning',
    critical: 'text-destructive',
  };
  return colors[severity];
}

export function shouldLogSensitiveAccess(entity: AuditEntity, action: AuditAction): boolean {
  const sensitiveEntities: AuditEntity[] = ['paciente', 'prontuario', 'exame'];
  const sensitiveActions: AuditAction[] = ['READ', 'EXPORT', 'DOWNLOAD', 'ACCESS_SENSITIVE'];
  
  return sensitiveEntities.includes(entity) && sensitiveActions.includes(action);
}

export function determineSeverity(action: AuditAction, entity: AuditEntity): AuditSeverity {
  // Ações críticas
  if (['DELETE', 'SUSPENSION', 'PERMISSION_CHANGE'].includes(action)) {
    return 'critical';
  }
  
  // Ações de aviso
  if (['EXPORT', 'ACCESS_SENSITIVE', 'PLAN_CHANGE'].includes(action)) {
    return 'warning';
  }
  
  // Acesso a dados sensíveis
  if (['prontuario', 'exame'].includes(entity) && action === 'READ') {
    return 'warning';
  }
  
  return 'info';
}

export function formatAuditDescription(
  action: AuditAction,
  entity: AuditEntity,
  entityNome?: string,
  changedFields?: string[]
): string {
  const actionLabel = getActionLabel(action);
  const entityLabel = getEntityLabel(entity);
  
  let description = `${actionLabel} de ${entityLabel}`;
  
  if (entityNome) {
    description += `: ${entityNome}`;
  }
  
  if (changedFields && changedFields.length > 0) {
    description += ` (campos: ${changedFields.join(', ')})`;
  }
  
  return description;
}
