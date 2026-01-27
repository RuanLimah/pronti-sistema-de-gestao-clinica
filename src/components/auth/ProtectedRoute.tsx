import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'medico';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRole && user?.tipo !== requiredRole) {
      // Se requer admin e usuário é médico, redireciona para dashboard
      if (requiredRole === 'admin' && user?.tipo === 'medico') {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.tipo !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
