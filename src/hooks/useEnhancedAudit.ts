// ============= PRONTI - Hook de Auditoria Aprimorado =============

import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useEnhancedAuditStore } from '@/stores/enhancedAuditStore';
import { useRBAC } from '@/hooks/useRBAC';
import {
  AuditableAction,
  AuditableEntity,
  AuditScreen,
} from '@/types/rbac';

interface UseEnhancedAuditReturn {
  // Core logging
  logAction: (
    action: AuditableAction,
    entity: AuditableEntity,
    entityId: string,
    screen: AuditScreen,
    options?: {
      entityNome?: string;
      oldData?: Record<string, unknown>;
      newData?: Record<string, unknown>;
      changedFields?: string[];
    }
  ) => void;
  
  // Convenience methods
  logProntuarioAccess: (prontuarioId: string, pacienteNome: string, screen?: AuditScreen) => void;
  logProntuarioEdit: (prontuarioId: string, pacienteNome: string, changedFields: string[]) => void;
  logProntuarioCreate: (prontuarioId: string, pacienteNome: string) => void;
  logPatientAccess: (patientId: string, patientNome: string, screen?: AuditScreen) => void;
  logPatientEdit: (patientId: string, patientNome: string, changedFields: string[]) => void;
  logPatientCreate: (patientId: string, patientNome: string) => void;
  logExport: (entity: AuditableEntity, entityId: string, entityNome: string, screen?: AuditScreen) => void;
  logLogin: () => void;
  logLogout: () => void;
  
  // Statistics
  getMyRecentLogs: (limit?: number) => ReturnType<typeof useEnhancedAuditStore.getState>['logs'];
  getStatistics: (startDate?: Date, endDate?: Date) => ReturnType<ReturnType<typeof useEnhancedAuditStore.getState>['getStatistics']>;
}

export function useEnhancedAudit(): UseEnhancedAuditReturn {
  const { user } = useAuthStore();
  const { role } = useRBAC();
  const {
    logAction: storeLogAction,
    logLogin: storeLogLogin,
    logLogout: storeLogLogout,
    logProntuarioAccess: storeLogProntuarioAccess,
    logProntuarioEdit: storeLogProntuarioEdit,
    logExport: storeLogExport,
    getLogsByUser,
    getStatistics: storeGetStatistics,
  } = useEnhancedAuditStore();

  // Core logging function
  const logAction = useCallback((
    action: AuditableAction,
    entity: AuditableEntity,
    entityId: string,
    screen: AuditScreen,
    options?: {
      entityNome?: string;
      oldData?: Record<string, unknown>;
      newData?: Record<string, unknown>;
      changedFields?: string[];
    }
  ) => {
    if (!user) return;
    
    storeLogAction(
      user.id,
      user.email,
      user.nome,
      role,
      action,
      entity,
      entityId,
      screen,
      options
    );
  }, [user, role, storeLogAction]);

  // Prontuário methods
  const logProntuarioAccess = useCallback((
    prontuarioId: string,
    pacienteNome: string,
    screen: AuditScreen = 'prontuario'
  ) => {
    if (!user) return;
    storeLogProntuarioAccess(user.id, user.email, user.nome, prontuarioId, pacienteNome, screen);
  }, [user, storeLogProntuarioAccess]);

  const logProntuarioEdit = useCallback((
    prontuarioId: string,
    pacienteNome: string,
    changedFields: string[]
  ) => {
    if (!user) return;
    storeLogProntuarioEdit(user.id, user.email, user.nome, prontuarioId, pacienteNome, changedFields);
  }, [user, storeLogProntuarioEdit]);

  const logProntuarioCreate = useCallback((
    prontuarioId: string,
    pacienteNome: string
  ) => {
    logAction('criar', 'prontuario', prontuarioId, 'prontuario', {
      entityNome: `Prontuário de ${pacienteNome}`,
    });
  }, [logAction]);

  // Patient methods
  const logPatientAccess = useCallback((
    patientId: string,
    patientNome: string,
    screen: AuditScreen = 'pacientes'
  ) => {
    logAction('visualizar', 'paciente', patientId, screen, {
      entityNome: patientNome,
    });
  }, [logAction]);

  const logPatientEdit = useCallback((
    patientId: string,
    patientNome: string,
    changedFields: string[]
  ) => {
    logAction('editar', 'paciente', patientId, 'pacientes', {
      entityNome: patientNome,
      changedFields,
    });
  }, [logAction]);

  const logPatientCreate = useCallback((
    patientId: string,
    patientNome: string
  ) => {
    logAction('criar', 'paciente', patientId, 'pacientes', {
      entityNome: patientNome,
    });
  }, [logAction]);

  // Export method
  const logExport = useCallback((
    entity: AuditableEntity,
    entityId: string,
    entityNome: string,
    screen: AuditScreen = 'relatorios'
  ) => {
    if (!user) return;
    storeLogExport(user.id, user.email, user.nome, role, entity, entityId, entityNome, screen);
  }, [user, role, storeLogExport]);

  // Auth methods
  const logLogin = useCallback(() => {
    if (!user) return;
    storeLogLogin(user.id, user.email, user.nome, role);
  }, [user, role, storeLogLogin]);

  const logLogout = useCallback(() => {
    if (!user) return;
    storeLogLogout(user.id, user.email, user.nome, role);
  }, [user, role, storeLogLogout]);

  // Get user's recent logs
  const getMyRecentLogs = useCallback((limit = 50) => {
    if (!user) return [];
    return getLogsByUser(user.id, limit);
  }, [user, getLogsByUser]);

  // Get statistics
  const getStatistics = useCallback((startDate?: Date, endDate?: Date) => {
    return storeGetStatistics(startDate, endDate);
  }, [storeGetStatistics]);

  return {
    logAction,
    logProntuarioAccess,
    logProntuarioEdit,
    logProntuarioCreate,
    logPatientAccess,
    logPatientEdit,
    logPatientCreate,
    logExport,
    logLogin,
    logLogout,
    getMyRecentLogs,
    getStatistics,
  };
}
