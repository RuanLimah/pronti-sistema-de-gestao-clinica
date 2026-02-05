import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Brain,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: Users, label: "Pacientes", path: "/pacientes" },
  { icon: MessageSquare, label: "WhatsApp", path: "/whatsapp" },
  { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
];

const bottomMenuItems = [
  { icon: CreditCard, label: "Assinatura", path: "/assinatura" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      onOpenChange(false);
      navigate("/login");
      toast({
        title: "Saiu com sucesso",
        description: "Você foi desconectado do sistema.",
      });
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar">
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Brain className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground font-display">
              PRONTI
            </span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-2 py-4 space-y-1 mt-auto">
          {bottomMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                location.pathname === item.path
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
