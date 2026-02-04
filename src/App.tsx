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
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Pacientes from "./pages/Pacientes";
import Financeiro from "./pages/Financeiro";
import WhatsApp from "./pages/WhatsApp";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Notificacoes from "./pages/Notificacoes";
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
          <Route path="/login" element={<Login />} />

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
            path="/notificacoes"
            element={
              <ProtectedRoute>
                <Notificacoes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
