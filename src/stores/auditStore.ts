// ============= PRONTI - Store de Auditoria (LGPD Compliance) =============

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AuditLogEntry,
  AuditLogFilters,
  AuditStats,
  AuditAction,
  AuditEntity,
  determineSeverity,
  formatAuditDescription,
  shouldLogSensitiveAccess,
} from '@/types/audit';

interface AuditStore {
  // Estado
  logs: AuditLogEntry[];
  
  // Getters
  getLogs: (filters?: AuditLogFilters) => AuditLogEntry[];
  getLogById: (id: string) => AuditLogEntry | undefined;
  getLogsByUser: (userId: string, limit?: number) => AuditLogEntry[];
  getLogsByEntity: (entity: AuditEntity, entityId: string) => AuditLogEntry[];
  getRecentLogs: (limit?: number) => AuditLogEntry[];
  getCriticalLogs: (startDate?: Date, endDate?: Date) => AuditLogEntry[];
  getSensitiveAccessLogs: (startDate?: Date, endDate?: Date) => AuditLogEntry[];
  
  // Estatísticas
  getStats: (startDate?: Date, endDate?: Date) => AuditStats;
  
  // Ações
  log: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'severity' | 'descricao'> & { descricao?: string }) => AuditLogEntry;
  
  // Helpers de log específicos
  logCreate: (userId: string, userEmail: string, userNome: string, userTipo: 'admin' | 'medico', entity: AuditEntity, entityId: string, entityNome?: string, newData?: Record<string, unknown>) => void;
  logUpdate: (userId: string, userEmail: string, userNome: string, userTipo: 'admin' | 'medico', entity: AuditEntity, entityId: string, entityNome?: string, oldData?: Record<string, unknown>, newData?: Record<string, unknown>, changedFields?: string[]) => void;
  logDelete: (userId: string, userEmail: string, userNome: string, userTipo: 'admin' | 'medico', entity: AuditEntity, entityId: string, entityNome?: string, oldData?: Record<string, unknown>) => void;
  logAccess: (userId: string, userEmail: string, userNome: string, userTipo: 'admin' | 'medico', entity: AuditEntity, entityId: string, entityNome?: string) => void;
  logExport: (userId: string, userEmail: string, userNome: string, userTipo: 'admin' | 'medico', entity: AuditEntity, entityId: string, entityNome?: string) => void;
  logLogin: (userId: string, userEmail: string, userNome: string, userTipo: 'admin' | 'medico') => void;
  logLogout: (userId: string, userEmail: string, userNome: string, userTipo: 'admin' | 'medico') => void;
  logPlanChange: (userId: string, userEmail: string, userNome: string, userTipo: 'admin' | 'medico', targetUserId: string, oldPlan: string, newPlan: string) => void;
  
  // Limpeza (para LGPD - exclusão após período)
  cleanOldLogs: (olderThanDays: number) => number;
  
  // Utils
  gerarId: () => string;
}

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      logs: [],
      
      gerarId: () => `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      
      // ==================== GETTERS ====================
      
      getLogs: (filters) => {
        let logs = get().logs;
        
        if (!filters) return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        if (filters.userId) {
          logs = logs.filter(l => l.userId === filters.userId);
        }
        
        if (filters.action) {
          logs = logs.filter(l => l.action === filters.action);
        }
        
        if (filters.entity) {
          logs = logs.filter(l => l.entity === filters.entity);
        }
        
        if (filters.entityId) {
          logs = logs.filter(l => l.entityId === filters.entityId);
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
        return get().getLogs({ entity, entityId });
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
      
      getStats: (startDate, endDate) => {
        const logs = get().getLogs({ startDate, endDate });
        
        const logsPorAcao = {} as Record<AuditAction, number>;
        const logsPorEntidade = {} as Record<AuditEntity, number>;
        
        logs.forEach(log => {
          logsPorAcao[log.action] = (logsPorAcao[log.action] || 0) + 1;
          logsPorEntidade[log.entity] = (logsPorEntidade[log.entity] || 0) + 1;
        });
        
        return {
          totalLogs: logs.length,
          logsPorAcao,
          logsPorEntidade,
          logsCriticosPeriodo: logs.filter(l => l.severity === 'critical').length,
          acessosDadosSensiveis: logs.filter(l => l.sensitiveDataAccessed).length,
          exportacoesPeriodo: logs.filter(l => l.action === 'EXPORT').length,
        };
      },
      
      // ==================== AÇÕES ====================
      
      log: (entry) => {
        const severity = determineSeverity(entry.action, entry.entity);
        const descricao = entry.descricao || formatAuditDescription(
          entry.action,
          entry.entity,
          entry.entityNome,
          entry.changedFields
        );
        
        const sensitiveDataAccessed = shouldLogSensitiveAccess(entry.entity, entry.action);
        
        const logEntry: AuditLogEntry = {
          ...entry,
          id: get().gerarId(),
          severity,
          descricao,
          sensitiveDataAccessed,
          timestamp: new Date(),
        };
        
        set(state => ({
          logs: [logEntry, ...state.logs],
        }));
        
        return logEntry;
      },
      
      // ==================== HELPERS DE LOG ====================
      
      logCreate: (userId, userEmail, userNome, userTipo, entity, entityId, entityNome, newData) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userTipo,
          action: 'CREATE',
          entity,
          entityId,
          entityNome,
          newData,
        });
      },
      
      logUpdate: (userId, userEmail, userNome, userTipo, entity, entityId, entityNome, oldData, newData, changedFields) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userTipo,
          action: 'UPDATE',
          entity,
          entityId,
          entityNome,
          oldData,
          newData,
          changedFields,
        });
      },
      
      logDelete: (userId, userEmail, userNome, userTipo, entity, entityId, entityNome, oldData) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userTipo,
          action: 'DELETE',
          entity,
          entityId,
          entityNome,
          oldData,
        });
      },
      
      logAccess: (userId, userEmail, userNome, userTipo, entity, entityId, entityNome) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userTipo,
          action: 'READ',
          entity,
          entityId,
          entityNome,
        });
      },
      
      logExport: (userId, userEmail, userNome, userTipo, entity, entityId, entityNome) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userTipo,
          action: 'EXPORT',
          entity,
          entityId,
          entityNome,
          dataExported: true,
        });
      },
      
      logLogin: (userId, userEmail, userNome, userTipo) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userTipo,
          action: 'LOGIN',
          entity: 'sessao',
          entityId: userId,
        });
      },
      
      logLogout: (userId, userEmail, userNome, userTipo) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userTipo,
          action: 'LOGOUT',
          entity: 'sessao',
          entityId: userId,
        });
      },
      
      logPlanChange: (userId, userEmail, userNome, userTipo, targetUserId, oldPlan, newPlan) => {
        get().log({
          userId,
          userEmail,
          userNome,
          userTipo,
          action: 'PLAN_CHANGE',
          entity: 'plano',
          entityId: targetUserId,
          oldData: { plano: oldPlan },
          newData: { plano: newPlan },
          descricao: `Alteração de plano: ${oldPlan} → ${newPlan}`,
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
      name: 'pronti-audit',
    }
  )
);
