// ============= PRONTI - Hook RBAC (Role-Based Access Control) =============

import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  SystemRole,
  RolePermissions,
  ROLE_PERMISSIONS,
  hasPermission,
  canAccessClinicalData,
  canViewAudit,
} from '@/types/rbac';

interface UseRBACReturn {
  // Current user role
  role: SystemRole;
  roleLabel: string;
  
  // Permission checks
  permissions: RolePermissions;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  
  // Role checks
  isProfissional: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  
  // Special access checks
  canAccessClinicalData: boolean;
  canViewAuditLogs: boolean;
  canManageUsers: boolean;
  canManagePlans: boolean;
  canManageAddons: boolean;
  
  // Data access helpers
  canAccessPatient: (patientOwnerId: string) => boolean;
  canAccessProntuario: (prontuarioOwnerId: string) => boolean;
  canEditProntuario: (prontuarioOwnerId: string) => boolean;
  canExportData: (dataType: 'prontuario' | 'paciente' | 'relatorio') => boolean;
}

const ROLE_LABELS: Record<SystemRole, string> = {
  profissional: 'Profissional',
  admin: 'Administrador',
  super_admin: 'Super Administrador',
};

export function useRBAC(): UseRBACReturn {
  const { user } = useAuthStore();
  
  // Determine user role from auth store
  // In production, this would come from the server
  const role: SystemRole = useMemo(() => {
    if (!user) return 'profissional';
    
    // Map existing user types to new RBAC roles
    if (user.tipo === 'admin') {
      // Check if user is super admin (would be in a separate field in production)
      // For now, we'll use email as a simple check
      if (user.email === 'super@pronti.com') {
        return 'super_admin';
      }
      return 'admin';
    }
    
    return 'profissional';
  }, [user]);
  
  const roleLabel = ROLE_LABELS[role];
  
  // Get all permissions for current role
  const permissions = useMemo(() => ROLE_PERMISSIONS[role], [role]);
  
  // Role checks
  const isProfissional = role === 'profissional';
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  
  // Special access checks
  const canAccessClinicalDataFlag = canAccessClinicalData(role);
  const canViewAuditLogsFlag = canViewAudit(role);
  const canManageUsersFlag = permissions.canManageUsers;
  const canManagePlansFlag = permissions.canManagePlans;
  const canManageAddonsFlag = permissions.canManageAddons;
  
  // Permission check function
  const checkPermission = useCallback((permission: keyof RolePermissions): boolean => {
    return hasPermission(role, permission);
  }, [role]);
  
  // Check if user can access a specific patient
  const canAccessPatient = useCallback((patientOwnerId: string): boolean => {
    if (!user) return false;
    
    // Admins cannot access patient data
    if (role === 'admin' || role === 'super_admin') {
      return false;
    }
    
    // Professionals can only access their own patients
    if (role === 'profissional') {
      return patientOwnerId === user.id;
    }
    
    return false;
  }, [user, role]);
  
  // Check if user can access a specific prontuario
  const canAccessProntuario = useCallback((prontuarioOwnerId: string): boolean => {
    if (!user) return false;
    
    // Admins cannot access prontuario content
    if (role === 'admin' || role === 'super_admin') {
      return false;
    }
    
    // Professionals can only access their own prontuarios
    if (role === 'profissional') {
      return prontuarioOwnerId === user.id;
    }
    
    return false;
  }, [user, role]);
  
  // Check if user can edit a specific prontuario
  const canEditProntuario = useCallback((prontuarioOwnerId: string): boolean => {
    if (!user) return false;
    
    // Only professionals can edit prontuarios
    if (role !== 'profissional') {
      return false;
    }
    
    // Only the owner can edit
    return prontuarioOwnerId === user.id;
  }, [user, role]);
  
  // Check if user can export specific data types
  const canExportData = useCallback((dataType: 'prontuario' | 'paciente' | 'relatorio'): boolean => {
    if (!user) return false;
    
    switch (dataType) {
      case 'prontuario':
        return role === 'profissional' && permissions.canExportProntuarios;
      case 'paciente':
        return role === 'profissional';
      case 'relatorio':
        return true; // All roles can export reports (with appropriate content)
      default:
        return false;
    }
  }, [user, role, permissions]);
  
  return {
    role,
    roleLabel,
    permissions,
    hasPermission: checkPermission,
    isProfissional,
    isAdmin,
    isSuperAdmin,
    canAccessClinicalData: canAccessClinicalDataFlag,
    canViewAuditLogs: canViewAuditLogsFlag,
    canManageUsers: canManageUsersFlag,
    canManagePlans: canManagePlansFlag,
    canManageAddons: canManageAddonsFlag,
    canAccessPatient,
    canAccessProntuario,
    canEditProntuario,
    canExportData,
  };
}
