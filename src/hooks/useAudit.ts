// ============= Hook de Auditoria =============

import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAuditStore } from '@/stores/auditStore';
import { AuditEntity } from '@/types/audit';

export function useAudit() {
  const { user } = useAuthStore();
  const {
    logCreate,
    logUpdate,
    logDelete,
    logAccess,
    logExport,
    logLogin,
    logLogout,
    logPlanChange,
    getLogs,
    getStats,
  } = useAuditStore();
  
  const getUserInfo = useCallback(() => {
    if (!user) {
      return {
        userId: 'anonymous',
        userEmail: 'anonymous@system',
        userNome: 'Sistema',
        userTipo: 'admin' as const,
      };
    }
    
    return {
      userId: user.id,
      userEmail: user.email,
      userNome: user.nome,
      userTipo: user.tipo as 'admin' | 'medico',
    };
  }, [user]);
  
  // Log de criação
  const auditCreate = useCallback((
    entity: AuditEntity,
    entityId: string,
    entityNome?: string,
    newData?: Record<string, unknown>
  ) => {
    const { userId, userEmail, userNome, userTipo } = getUserInfo();
    logCreate(userId, userEmail, userNome, userTipo, entity, entityId, entityNome, newData);
  }, [getUserInfo, logCreate]);
  
  // Log de atualização
  const auditUpdate = useCallback((
    entity: AuditEntity,
    entityId: string,
    entityNome?: string,
    oldData?: Record<string, unknown>,
    newData?: Record<string, unknown>,
    changedFields?: string[]
  ) => {
    const { userId, userEmail, userNome, userTipo } = getUserInfo();
    logUpdate(userId, userEmail, userNome, userTipo, entity, entityId, entityNome, oldData, newData, changedFields);
  }, [getUserInfo, logUpdate]);
  
  // Log de exclusão
  const auditDelete = useCallback((
    entity: AuditEntity,
    entityId: string,
    entityNome?: string,
    oldData?: Record<string, unknown>
  ) => {
    const { userId, userEmail, userNome, userTipo } = getUserInfo();
    logDelete(userId, userEmail, userNome, userTipo, entity, entityId, entityNome, oldData);
  }, [getUserInfo, logDelete]);
  
  // Log de acesso
  const auditAccess = useCallback((
    entity: AuditEntity,
    entityId: string,
    entityNome?: string
  ) => {
    const { userId, userEmail, userNome, userTipo } = getUserInfo();
    logAccess(userId, userEmail, userNome, userTipo, entity, entityId, entityNome);
  }, [getUserInfo, logAccess]);
  
  // Log de exportação
  const auditExport = useCallback((
    entity: AuditEntity,
    entityId: string,
    entityNome?: string
  ) => {
    const { userId, userEmail, userNome, userTipo } = getUserInfo();
    logExport(userId, userEmail, userNome, userTipo, entity, entityId, entityNome);
  }, [getUserInfo, logExport]);
  
  // Log de login
  const auditLogin = useCallback(() => {
    const { userId, userEmail, userNome, userTipo } = getUserInfo();
    logLogin(userId, userEmail, userNome, userTipo);
  }, [getUserInfo, logLogin]);
  
  // Log de logout
  const auditLogout = useCallback(() => {
    const { userId, userEmail, userNome, userTipo } = getUserInfo();
    logLogout(userId, userEmail, userNome, userTipo);
  }, [getUserInfo, logLogout]);
  
  // Log de mudança de plano
  const auditPlanChange = useCallback((
    targetUserId: string,
    oldPlan: string,
    newPlan: string
  ) => {
    const { userId, userEmail, userNome, userTipo } = getUserInfo();
    logPlanChange(userId, userEmail, userNome, userTipo, targetUserId, oldPlan, newPlan);
  }, [getUserInfo, logPlanChange]);
  
  return {
    // Ações de log
    auditCreate,
    auditUpdate,
    auditDelete,
    auditAccess,
    auditExport,
    auditLogin,
    auditLogout,
    auditPlanChange,
    
    // Consultas (apenas para admin)
    getLogs,
    getStats,
  };
}
