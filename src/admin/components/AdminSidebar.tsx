import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Crown, Zap, Shield, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Clientes", href: "/admin/clientes" },
  { icon: Crown, label: "Planos", href: "/admin/planos" },
  { icon: Zap, label: "Add-ons", href: "/admin/addons" },
  { icon: FileText, label: "Auditoria", href: "/admin/auditoria" },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground min-h-screen flex flex-col p-4 border-r border-sidebar-border">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Shield className="h-8 w-8 text-sidebar-primary" />
        <div>
          <h1 className="font-bold text-lg">Admin</h1>
          <p className="text-xs text-sidebar-foreground/70">Gestão Global</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/admin' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <Link to="/dashboard" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground flex items-center gap-2">
          <span>← Voltar ao App</span>
        </Link>
      </div>
    </div>
  );
}
