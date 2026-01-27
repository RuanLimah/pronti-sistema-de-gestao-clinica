// ============= PRONTI - Enhanced Audit Store (LGPD Compliance) =============

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EnhancedAuditLogEntry,
  SystemRole,
  AuditableAction,
  AuditableEntity,
  AuditScreen,
  AuditSeverityLevel,
  determineSeverityLevel,
  isSensitiveAccess,
  formatAuditLogDescription,
} from '@/types/rbac';

interface AuditFilters {
  userId?: string;
  userRole?: SystemRole;
  action?: AuditableAction;
  entity?: AuditableEntity;
  screen?: AuditScreen;
  severity?: AuditSeverityLevel;
  startDate?: Date;
  endDate?: Date;
  sensitiveOnly?: boolean;
  searchTerm?: string;
}

interface AuditStatistics {
  totalLogs: number;
  logsPorAcao: Partial<Record<AuditableAction, number>>;
  logsPorEntidade: Partial<Record<AuditableEntity, number>>;
  logsPorTela: Partial<Record<AuditScreen, number>>;
  logsPorRole: Partial<Record<SystemRole, number>>;
  logsCriticos: number;
  acessosSensiveis: number;
  exportacoes: number;
  loginsPeriodo: number;
}

interface EnhancedAuditStore {
  logs: EnhancedAuditLogEntry[];
  
  // Getters
  getLogs: (filters?: AuditFilters) => EnhancedAuditLogEntry[];
  getLogById: (id: string) => EnhancedAuditLogEntry | undefined;
  getLogsByUser: (userId: string, limit?: number) => EnhancedAuditLogEntry[];
  getLogsByEntity: (entity: AuditableEntity, entityId: string) => EnhancedAuditLogEntry[];
  getRecentLogs: (limit?: number) => EnhancedAuditLogEntry[];
  getCriticalLogs: (startDate?: Date, endDate?: Date) => EnhancedAuditLogEntry[];
  getSensitiveAccessLogs: (startDate?: Date, endDate?: Date) => EnhancedAuditLogEntry[];
  
  // Estatísticas
  getStatistics: (startDate?: Date, endDate?: Date) => AuditStatistics;
  
  // Core log action
  log: (entry: Omit<EnhancedAuditLogEntry, 'id' | 'timestamp' | 'severity' | 'sensitiveDataAccessed' | 'dataExported' | 'descricao'> & { descricao?: string }) => EnhancedAuditLogEntry;
  
  // Helpers específicos
  logAction: (
    userId: string,
    userEmail: string,
    userNome: string,
    userRole: SystemRole,
    action: AuditableAction,
    entity: AuditableEntity,
    entityId: string,
    screen: AuditScreen,
    options?: {
      entityNome?: string;
      oldData?: Record<string, unknown>;
      newData?: Record<string, unknown>;
      changedFields?: string[];
      ipAddress?: string;
      userAgent?: string;
    }
  ) => EnhancedAuditLogEntry;
  
  // Helpers de log comuns
  logLogin: (userId: string, userEmail: string, userNome: string, userRole: SystemRole, ipAddress?: string, userAgent?: string) => void;
  logLogout: (userId: string, userEmail: string, userNome: string, userRole: SystemRole) => void;
  logProntuarioAccess: (userId: string, userEmail: string, userNome: string, prontuarioId: string, pacienteNome: string, screen: AuditScreen) => void;
  logProntuarioEdit: (userId: string, userEmail: string, userNome: string, prontuarioId: string, pacienteNome: string, changedFields: string[]) => void;
  logExport: (userId: string, userEmail: string, userNome: string, userRole: SystemRole, entity: AuditableEntity, entityId: string, entityNome: string, screen: AuditScreen) => void;
  logPlanChange: (userId: string, userEmail: string, userNome: string, userRole: SystemRole, targetUserId: string, oldPlan: string, newPlan: string) => void;
  logStatusChange: (userId: string, userEmail: string, userNome: string, userRole: SystemRole, targetUserId: string, targetNome: string, oldStatus: string, newStatus: string, motivo?: string) => void;
  
  // Limpeza (LGPD - exclusão após período de retenção)
  cleanOldLogs: (olderThanDays: number) => number;
  
  // Utils
  generateId: () => string;
  getClientIP: () => string;
  getUserAgent: () => string;
}

// Helper para obter IP (mock - em produção viria do backend)
const getClientIPAddress = (): string => {
  // Em produção, isso viria do servidor
  return '192.168.1.' + Math.floor(Math.random() * 255);
};

const getUserAgentString = (): string => {
  return typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
};

// Mock initial data for demonstration
const generateMockLogs = (): EnhancedAuditLogEntry[] => {
  const now = new Date();
  const logs: EnhancedAuditLogEntry[] = [];
  
  const users = [
    { id: 'admin-1', email: 'admin@pronti.com', nome: 'Administrador', role: 'admin' as SystemRole },
    { id: 'super-1', email: 'super@pronti.com', nome: 'Super Admin', role: 'super_admin' as SystemRole },
    { id: 'medico-1', email: 'dra.ana@pronti.com', nome: 'Dra. Ana Silva', role: 'profissional' as SystemRole },
    { id: 'medico-2', email: 'dr.carlos@pronti.com', nome: 'Dr. Carlos Mendes', role: 'profissional' as SystemRole },
  ];
  
  const actions: { action: AuditableAction; entity: AuditableEntity; screen: AuditScreen }[] = [
    { action: 'login', entity: 'sessao', screen: 'login' },
    { action: 'visualizar', entity: 'prontuario', screen: 'prontuario' },
    { action: 'editar', entity: 'paciente', screen: 'pacientes' },
    { action: 'criar', entity: 'prontuario', screen: 'prontuario' },
    { action: 'exportar', entity: 'prontuario', screen: 'relatorios' },
    { action: 'alterar_plano', entity: 'plano', screen: 'admin' },
    { action: 'suspender', entity: 'usuario', screen: 'admin' },
  ];
  
  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const actionData = actions[Math.floor(Math.random() * actions.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(timestamp.getHours() - hoursAgo);
    
    const severity = determineSeverityLevel(actionData.action, actionData.entity);
    const sensitiveDataAccessed = isSensitiveAccess(actionData.entity, actionData.action);
    
    logs.push({
      id: `audit-${Date.now()}-${i}`,
      userId: user.id,
      userEmail: user.email,
      userNome: user.nome,
      userRole: user.role,
      action: actionData.action,
      entity: actionData.entity,
      entityId: `entity-${i}`,
      entityNome: actionData.entity === 'prontuario' ? 'Prontuário #' + i : undefined,
      timestamp,
      ipAddress: getClientIPAddress(),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      screen: actionData.screen,
      severity,
      sensitiveDataAccessed,
      dataExported: actionData.action === 'exportar',
      descricao: formatAuditLogDescription(actionData.action, actionData.entity, undefined, undefined),
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const useEnhancedAuditStore = create<EnhancedAuditStore>()(
  persist(
    (set, get) => ({
      logs: generateMockLogs(),
      
      generateId: () => `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      getClientIP: getClientIPAddress,
      getUserAgent: getUserAgentString,
      
      // ==================== GETTERS ====================
      
      getLogs: (filters) => {
        let logs = [...get().logs];
        
        if (!filters) {
          return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        
        if (filters.userId) {
          logs = logs.filter(l => l.userId === filters.userId);
        }
        
        if (filters.userRole) {
          logs = logs.filter(l => l.userRole === filters.userRole);
        }
        
        if (filters.action) {
          logs = logs.filter(l => l.action === filters.action);
        }
        
        if (filters.entity) {
          logs = logs.filter(l => l.entity === filters.entity);
        }
        
        if (filters.screen) {
          logs = logs.filter(l => l.screen === filters.screen);
        }
        
        if (filters.severity) {
          logs = logs.filter(l => l.severity === filters.severity);
        }
        
        if (filters.startDate) {
          logs = logs.filter(l => new Date(l.timestamp) >= filters.startDate!);
        }
        
        if (filters.endDate) {
          logs = logs.filter(l => new Date(l.timestamp) <= filters.endDate!);
        }
        
        if (filters.sensitiveOnly) {
          logs = logs.filter(l => l.sensitiveDataAccessed);
        }
        
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          logs = logs.filter(l =>
            l.descricao.toLowerCase().includes(term) ||
            l.userEmail.toLowerCase().includes(term) ||
            l.userNome.toLowerCase().includes(term) ||
            l.entityNome?.toLowerCase().includes(term)
          );
        }
        
        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },
      
      getLogById: (id) => get().logs.find(l => l.id === id),
      
      getLogsByUser: (userId, limit = 50) => {
        return get().getLogs({ userId }).slice(0, limit);
      },
      
      getLogsByEntity: (entity, entityId) => {
        return get().getLogs({ entity }).filter(l => l.entityId === entityId);
      },
      
      getRecentLogs: (limit = 100) => {
        return get().getLogs().slice(0, limit);
      },
      
      getCriticalLogs: (startDate, endDate) => {
        return get().getLogs({ severity: 'critical', startDate, endDate });
      },
      
      getSensitiveAccessLogs: (startDate, endDate) => {
        return get().getLogs({ sensitiveOnly: true, startDate, endDate });
      },
      
      // ==================== ESTATÍSTICAS ====================
      
      getStatistics: (startDate, endDate) => {
        const logs = get().getLogs({ startDate, endDate });
        
        const logsPorAcao: Partial<Record<AuditableAction, number>> = {};
        const logsPorEntidade: Partial<Record<AuditableEntity, number>> = {};
        const logsPorTela: Partial<Record<AuditScreen, number>> = {};
        const logsPorRole: Partial<Record<SystemRole, number>> = {};
        
        logs.forEach(log => {
          logsPorAcao[log.action] = (logsPorAcao[log.action] || 0) + 1;
          logsPorEntidade[log.entity] = (logsPorEntidade[log.entity] || 0) + 1;
          logsPorTela[log.screen] = (logsPorTela[log.screen] || 0) + 1;
          logsPorRole[log.userRole] = (logsPorRole[log.userRole] || 0) + 1;
        });
        
        return {
          totalLogs: logs.length,
          logsPorAcao,
          logsPorEntidade,
          logsPorTela,
          logsPorRole,
          logsCriticos: logs.filter(l => l.severity === 'critical').length,
          acessosSensiveis: logs.filter(l => l.sensitiveDataAccessed).length,
          exportacoes: logs.filter(l => l.action === 'exportar').length,
          loginsPeriodo: logs.filter(l => l.action === 'login').length,
        };
      },
      
      // ==================== CORE LOG ====================
      
      log: (entry) => {
        const severity = determineSeverityLevel(entry.action, entry.entity);
        const descricao = entry.descricao || formatAuditLogDescription(
          entry.action,
          entry.entity,
          entry.entityNome,
          entry.changedFields
        );
        const sensitiveDataAccessed = isSensitiveAccess(entry.entity, entry.action);
        const dataExported = entry.action === 'exportar';
        
        const logEntry: EnhancedAuditLogEntry = {
          ...entry,
          id: get().generateId(),
          severity,
          descricao,
          sensitiveDataAccessed,
          dataExported,
          timestamp: new Date(),
          ipAddress: entry.ipAddress || get().getClientIP(),
          userAgent: entry.userAgent || get().getUserAgent(),
        };
        
        set(state => ({
          logs: [logEntry, ...state.logs],
        }));
        
        return logEntry;
      },
      
      // ==================== HELPERS ====================
      
      logAction: (userId, userEmail, userNome, userRole, action, entity, entityId, screen, options = {}) => {
        return get().log({
          userId,
          userEmail,
          userNome,
          userRole,
          action,
          entity,
          entityId,
          screen,
          ...options,
        });
      },
      
      logLogin: (userId, userEmail, userNome, userRole, ipAddress, userAgent) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userRole,
          action: 'login',
          entity: 'sessao',
          entityId: userId,
          screen: 'login',
          ipAddress,
          userAgent,
          descricao: `Login realizado: ${userNome} (${userEmail})`,
        });
      },
      
      logLogout: (userId, userEmail, userNome, userRole) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userRole,
          action: 'logout',
          entity: 'sessao',
          entityId: userId,
          screen: 'dashboard',
          descricao: `Logout realizado: ${userNome}`,
        });
      },
      
      logProntuarioAccess: (userId, userEmail, userNome, prontuarioId, pacienteNome, screen) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userRole: 'profissional',
          action: 'visualizar',
          entity: 'prontuario',
          entityId: prontuarioId,
          entityNome: `Prontuário de ${pacienteNome}`,
          screen,
          descricao: `Visualização de prontuário: ${pacienteNome}`,
        });
      },
      
      logProntuarioEdit: (userId, userEmail, userNome, prontuarioId, pacienteNome, changedFields) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userRole: 'profissional',
          action: 'editar',
          entity: 'prontuario',
          entityId: prontuarioId,
          entityNome: `Prontuário de ${pacienteNome}`,
          screen: 'prontuario',
          changedFields,
          descricao: `Edição de prontuário: ${pacienteNome} (campos: ${changedFields.join(', ')})`,
        });
      },
      
      logExport: (userId, userEmail, userNome, userRole, entity, entityId, entityNome, screen) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userRole,
          action: 'exportar',
          entity,
          entityId,
          entityNome,
          screen,
          descricao: `Exportação de dados: ${entityNome}`,
        });
      },
      
      logPlanChange: (userId, userEmail, userNome, userRole, targetUserId, oldPlan, newPlan) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userRole,
          action: 'alterar_plano',
          entity: 'plano',
          entityId: targetUserId,
          screen: 'admin',
          oldData: { plano: oldPlan },
          newData: { plano: newPlan },
          descricao: `Alteração de plano: ${oldPlan} → ${newPlan}`,
        });
      },
      
      logStatusChange: (userId, userEmail, userNome, userRole, targetUserId, targetNome, oldStatus, newStatus, motivo) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userRole,
          action: newStatus === 'suspenso' ? 'suspender' : newStatus === 'bloqueado' ? 'bloquear' : 'alterar_status',
          entity: 'usuario',
          entityId: targetUserId,
          entityNome: targetNome,
          screen: 'admin',
          oldData: { status: oldStatus },
          newData: { status: newStatus, motivo },
          descricao: `Status alterado: ${targetNome} (${oldStatus} → ${newStatus})${motivo ? ` - ${motivo}` : ''}`,
        });
      },
      
      // ==================== LIMPEZA ====================
      
      cleanOldLogs: (olderThanDays) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        
        const initialCount = get().logs.length;
        
        set(state => ({
          logs: state.logs.filter(l => new Date(l.timestamp) >= cutoffDate),
        }));
        
        return initialCount - get().logs.length;
      },
    }),
    {
      name: 'pronti-enhanced-audit',
    }
  )
);
