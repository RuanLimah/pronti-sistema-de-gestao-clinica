// ============= PRONTI - Painel Administrativo Corporativo =============

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard,
  Users,
  Crown,
  Zap,
  History,
  Shield,
} from "lucide-react";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ClientManagement } from "@/components/admin/ClientManagement";
import { PlanManagement } from "@/components/admin/PlanManagement";
import { AddonCentralManager } from "@/components/admin/AddonCentralManager";
import { AuditViewer } from "@/components/admin/AuditViewer";
import { useAuthStore } from "@/stores/authStore";

export default function Admin() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Simular role do usuário (em produção viria do backend)
  const userRole = user?.tipo === 'admin' ? 'super_admin' : 'admin';
  const isSuperAdmin = userRole === 'super_admin';

  return (
    <DashboardLayout 
      title="Painel Administrativo" 
      subtitle="Gestão completa de clientes, planos e add-ons do sistema"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header with Shield Icon */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
          <div className="p-3 rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold">Área Administrativa</h2>
            <p className="text-sm text-muted-foreground">
              {isSuperAdmin 
                ? 'Controle total: clientes, planos, add-ons e auditoria'
                : 'Gestão de clientes, planos e métricas'
              }
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap gap-1">
            <TabsTrigger 
              value="dashboard" 
              className="gap-2 data-[state=active]:bg-background"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="clients" 
              className="gap-2 data-[state=active]:bg-background"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="plans" 
              className="gap-2 data-[state=active]:bg-background"
            >
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Planos</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="addons" 
              className="gap-2 data-[state=active]:bg-background"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Add-ons</span>
            </TabsTrigger>
            
            {isSuperAdmin && (
              <TabsTrigger 
                value="audit" 
                className="gap-2 data-[state=active]:bg-background"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Auditoria</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-0">
            <AdminDashboard />
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="mt-0">
            <ClientManagement />
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="mt-0">
            <PlanManagement />
          </TabsContent>

          {/* Add-ons Tab */}
          <TabsContent value="addons" className="mt-0">
            <AddonCentralManager />
          </TabsContent>

          {/* Audit Tab (Super Admin Only) */}
          {isSuperAdmin && (
            <TabsContent value="audit" className="mt-0">
              <AuditViewer />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
