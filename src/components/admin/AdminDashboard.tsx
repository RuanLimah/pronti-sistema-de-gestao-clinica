import { useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Crown,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAdminStore } from '@/stores/adminStore';
import { format, subMonths, startOfMonth, isAfter, isSameMonth, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminDashboard() {
  const { doctors, plans, addons, fetchAll, isLoading } = useAdminStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Calculate metrics
  const metrics = useMemo(() => {
    // 1. Calculate MRR and Subscribers
    let currentMRR = 0;
    
    doctors.forEach(doc => {
      if (doc.status !== 'ativo') return;

      // Plan value
      const plan = plans.find(p => p.id === doc.plano || p.tier === doc.plano);
      if (plan) {
        currentMRR += plan.valor;
      }

      // Addons value
      if (doc.addons && doc.addons.length > 0) {
        doc.addons.forEach(addonSlug => {
          const addon = addons.find(a => a.slug === addonSlug);
          if (addon) {
            currentMRR += addon.valor;
          }
        });
      }
    });

    const totalSubscribers = doctors.length;
    const paidDoctors = doctors.filter(d => {
      const plan = plans.find(p => p.id === d.plano || p.tier === d.plano);
      return plan && plan.valor > 0;
    });
    const paidSubscribers = paidDoctors.length;

    // 2. Plan Distribution
    const planCounts: Record<string, number> = {};
    plans.forEach(p => {
      planCounts[p.nome] = 0;
    });

    doctors.forEach(d => {
      const plan = plans.find(p => p.id === d.plano || p.tier === d.plano);
      const planName = plan ? plan.nome : d.plano;
      if (planCounts[planName] !== undefined) {
        planCounts[planName]++;
      } else {
        planCounts[planName] = 1;
      }
    });

    const planDistributionData = Object.entries(planCounts)
      .map(([name, value], index) => ({
        name,
        value,
        color: `hsl(${200 + (index * 40)}, 70%, 50%)`
      }))
      .filter(d => d.value > 0);

    // 3. Top Addons
    const addonCounts: Record<string, number> = {};
    addons.forEach(a => {
      addonCounts[a.nome] = 0;
    });

    doctors.forEach(d => {
      if (d.addons) {
        d.addons.forEach(addonSlug => {
          const addon = addons.find(a => a.slug === addonSlug);
          if (addon) {
            addonCounts[addon.nome] = (addonCounts[addon.nome] || 0) + 1;
          }
        });
      }
    });

    const topAddonsData = Object.entries(addonCounts)
      .map(([addon, vendas]) => {
        const addonObj = addons.find(a => a.nome === addon);
        return {
          addon,
          vendas,
          receita: vendas * (addonObj?.valor || 0)
        };
      })
      .filter(a => a.vendas > 0)
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 5);

    // 4. MRR Evolution (Reconstructed from created_at of active users)
    // Generate last 6 months buckets
    const today = new Date();
    const mrrData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthStart = startOfMonth(date);
      const monthLabel = format(date, 'MMM', { locale: ptBR });
      
      // Calculate MRR for this point in time (cumulative)
      let monthMRR = 0;
      doctors.forEach(doc => {
        // Only count if created before or in this month
        // And currently active (approximation, since we don't have churn date)
        if (doc.status === 'ativo' && new Date(doc.criadoEm) <= addMonths(monthStart, 1)) {
           const plan = plans.find(p => p.id === doc.plano || p.tier === doc.plano);
           if (plan) monthMRR += plan.valor;
           
           if (doc.addons) {
             doc.addons.forEach(slug => {
               const addon = addons.find(a => a.slug === slug);
               if (addon) monthMRR += addon.valor;
             });
           }
        }
      });
      
      mrrData.push({ mes: monthLabel, mrr: monthMRR });
    }

    const mrrGrowth = mrrData.length >= 2 
      ? ((mrrData[mrrData.length - 1].mrr - mrrData[mrrData.length - 2].mrr) / (mrrData[mrrData.length - 2].mrr || 1)) * 100 
      : 0;

    return {
      currentMRR,
      mrrGrowth,
      totalSubscribers,
      paidSubscribers,
      churnRate: 0, // Cannot calculate without churn history
      conversionRate: totalSubscribers > 0 ? (paidSubscribers / totalSubscribers) * 100 : 0,
      planDistributionData,
      topAddonsData,
      mrrData
    };
  }, [doctors, plans, addons]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR Total
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.currentMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {metrics.mrrGrowth > 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">+{metrics.mrrGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{metrics.mrrGrowth.toFixed(1)}%</span>
                </>
              )}
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinantes Ativos
            </CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <Users className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSubscribers}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {metrics.paidSubscribers} pagantes
              </Badge>
              <span className="text-xs text-muted-foreground">
                ({metrics.conversionRate.toFixed(1)}% conversão)
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Crescimento Mensal
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {metrics.mrrGrowth > 0 ? '+' : ''}{metrics.mrrGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Comparado ao mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planos e Addons
            </CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <Crown className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.topAddonsData.reduce((acc, curr) => acc + curr.vendas, 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de addons ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Evolution Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Evolução do MRR (Estimada)
            </CardTitle>
            <CardDescription>Receita Mensal Recorrente baseada em usuários ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.mrrData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="mes" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'MRR']}
                />
                <Line 
                  type="monotone" 
                  dataKey="mrr" 
                  stroke="hsl(172, 66%, 40%)" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(172, 66%, 40%)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'hsl(172, 66%, 40%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Distribuição por Plano
            </CardTitle>
            <CardDescription>Base de clientes por plano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.planDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {metrics.planDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Clientes']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning" />
              Add-ons Mais Vendidos
            </CardTitle>
            <CardDescription>Receita por módulo adicional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.topAddonsData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="addon" type="category" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
