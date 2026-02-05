import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Pacientes from "./pages/Pacientes";
import Financeiro from "./pages/Financeiro";
import WhatsApp from "./pages/WhatsApp";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Assinatura from "./pages/Assinatura";
import Notificacoes from "./pages/Notificacoes";
import { AdminRoute } from "./admin/components/AdminRoute";
import { AdminLayout } from "./admin/components/AdminLayout";
import { AdminDashboard } from "./admin/pages/AdminDashboard";
import { AdminClients } from "./admin/pages/AdminClients";
import { AdminPlans } from "./admin/pages/AdminPlans";
import { AdminAddons } from "./admin/pages/AdminAddons";
import { AdminAudit } from "./admin/pages/AdminAudit";

import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Prontuario from "./pages/pacientes/prontuario";

import { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";

export default function App() {
  const { checkSession, initializeAuthListener, isInitialized } = useAuthStore();

  useEffect(() => {
    // Inicializa o listener de autenticação
    const unsubscribe = initializeAuthListener();
    
    // Verifica a sessão inicial
    checkSession();

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []); // Executa apenas uma vez na montagem

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Landing />} />
          
          {/* Pública */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Dashboard (protegida) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtectedRoute>
                <Agenda />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pacientes"
            element={
              <ProtectedRoute>
                <Pacientes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pacientes/:pacienteId/prontuario"
            element={
              <ProtectedRoute>
                <Prontuario />
              </ProtectedRoute>
            }
          />

          <Route
            path="/financeiro"
            element={
              <ProtectedRoute>
                <Financeiro />
              </ProtectedRoute>
            }
          />

          <Route
            path="/whatsapp"
            element={
              <ProtectedRoute>
                <WhatsApp />
              </ProtectedRoute>
            }
          />

          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <Relatorios />
              </ProtectedRoute>
            }
          />

          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <Configuracoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assinatura"
            element={
              <ProtectedRoute>
                <Assinatura />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificacoes"
            element={
              <ProtectedRoute>
                <Notificacoes />
              </ProtectedRoute>
            }
          />

          {/* Admin Area (Isolated) */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="clientes" element={<AdminClients />} />
              <Route path="planos" element={<AdminPlans />} />
              <Route path="addons" element={<AdminAddons />} />
              <Route path="auditoria" element={<AdminAudit />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
