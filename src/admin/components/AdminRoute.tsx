import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function AdminRoute() {
  const { user, systemRole, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  // Check if user is authenticated and is admin
  // We use systemRole which is derived from app_metadata in authStore
  if (!user || systemRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
