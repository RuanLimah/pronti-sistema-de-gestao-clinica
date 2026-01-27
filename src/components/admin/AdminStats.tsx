import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, PauseCircle, Ban, Crown, Briefcase, User } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";

export function AdminStats() {
  const doctors = useAdminStore(state => state.doctors);
  
  const stats = useMemo(() => ({
    total: doctors.length,
    ativos: doctors.filter(d => d.status === 'ativo').length,
    suspensos: doctors.filter(d => d.status === 'suspenso').length,
    bloqueados: doctors.filter(d => d.status === 'bloqueado').length,
    porPlano: {
      basico: doctors.filter(d => d.plano === 'basico').length,
      profissional: doctors.filter(d => d.plano === 'profissional').length,
      premium: doctors.filter(d => d.plano === 'premium').length,
    },
  }), [doctors]);

  const statCards = [
    { 
      label: 'Total Médicos', 
      value: stats.total, 
      icon: Users, 
      color: 'bg-primary/10 text-primary',
      trend: null 
    },
    { 
      label: 'Ativos', 
      value: stats.ativos, 
      icon: CheckCircle, 
      color: 'bg-success/10 text-success',
      trend: Math.round((stats.ativos / stats.total) * 100) + '%'
    },
    { 
      label: 'Suspensos', 
      value: stats.suspensos, 
      icon: PauseCircle, 
      color: 'bg-warning/10 text-warning',
      trend: null
    },
    { 
      label: 'Bloqueados', 
      value: stats.bloqueados, 
      icon: Ban, 
      color: 'bg-destructive/10 text-destructive',
      trend: null
    },
  ];

  const planCards = [
    { label: 'Premium', value: stats.porPlano.premium, icon: Crown, color: 'text-amber-500' },
    { label: 'Profissional', value: stats.porPlano.profissional, icon: Briefcase, color: 'text-primary' },
    { label: 'Básico', value: stats.porPlano.basico, icon: User, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="card-interactive">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`p-2 md:p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.label}</p>
                </div>
                {stat.trend && (
                  <span className="ml-auto text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full hidden sm:block">
                    {stat.trend}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Distribution */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Distribuição por Plano</h3>
          <div className="flex items-center gap-6 flex-wrap">
            {planCards.map((plan) => (
              <div key={plan.label} className="flex items-center gap-2">
                <plan.icon className={`h-5 w-5 ${plan.color}`} />
                <span className="font-medium">{plan.value}</span>
                <span className="text-sm text-muted-foreground">{plan.label}</span>
              </div>
            ))}
          </div>
          
          {/* Progress bar visualization */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden flex">
            {stats.total > 0 && (
              <>
                <div 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${(stats.porPlano.premium / stats.total) * 100}%` }} 
                />
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${(stats.porPlano.profissional / stats.total) * 100}%` }} 
                />
                <div 
                  className="h-full bg-muted-foreground/40 transition-all duration-500" 
                  style={{ width: `${(stats.porPlano.basico / stats.total) * 100}%` }} 
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
