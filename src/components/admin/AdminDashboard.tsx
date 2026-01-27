// ============= PRONTI - Dashboard Admin com Gráficos em Tempo Real =============

import { useMemo } from 'react';
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

// Mock data for charts
const mrrData = [
  { mes: 'Jul', mrr: 12500 },
  { mes: 'Ago', mrr: 14200 },
  { mes: 'Set', mrr: 15800 },
  { mes: 'Out', mrr: 17400 },
  { mes: 'Nov', mrr: 19100 },
  { mes: 'Dez', mrr: 21500 },
  { mes: 'Jan', mrr: 24200 },
];

const subscribersByPlanData = [
  { plano: 'Gratuito', assinantes: 45, cor: 'hsl(220, 15%, 65%)' },
  { plano: 'Essencial', assinantes: 120, cor: 'hsl(172, 66%, 40%)' },
  { plano: 'Profissional', assinantes: 85, cor: 'hsl(152, 60%, 42%)' },
  { plano: 'Clínica', assinantes: 28, cor: 'hsl(38, 92%, 50%)' },
];

const planDistributionData = [
  { name: 'Gratuito', value: 45, color: 'hsl(220, 15%, 65%)' },
  { name: 'Essencial', value: 120, color: 'hsl(172, 66%, 40%)' },
  { name: 'Profissional', value: 85, color: 'hsl(152, 60%, 42%)' },
  { name: 'Clínica', value: 28, color: 'hsl(38, 92%, 50%)' },
];

const topAddonsData = [
  { addon: 'WhatsApp Auto', vendas: 89, receita: 2662.10 },
  { addon: 'Relatórios Avançados', vendas: 72, receita: 1072.80 },
  { addon: 'Armazenamento Extra', vendas: 56, receita: 1114.40 },
  { addon: 'Backup Avançado', vendas: 45, receita: 1120.50 },
  { addon: 'Multi-profissional', vendas: 28, receita: 1117.20 },
];

export function AdminDashboard() {
  // Calculate metrics
  const metrics = useMemo(() => {
    const currentMRR = mrrData[mrrData.length - 1].mrr;
    const previousMRR = mrrData[mrrData.length - 2].mrr;
    const mrrGrowth = ((currentMRR - previousMRR) / previousMRR) * 100;
    
    const totalSubscribers = subscribersByPlanData.reduce((acc, p) => acc + p.assinantes, 0);
    const paidSubscribers = subscribersByPlanData
      .filter(p => p.plano !== 'Gratuito')
      .reduce((acc, p) => acc + p.assinantes, 0);
    
    // Mock churn calculation
    const churnRate = 2.3;
    
    return {
      currentMRR,
      mrrGrowth,
      totalSubscribers,
      paidSubscribers,
      churnRate,
      conversionRate: (paidSubscribers / totalSubscribers) * 100,
    };
  }, []);

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
            <div className="text-2xl font-bold text-success">+{metrics.mrrGrowth.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Comparado ao mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Churn Rate
            </CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <TrendingDown className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.churnRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de cancelamento mensal
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
              Evolução do MRR
            </CardTitle>
            <CardDescription>Receita Mensal Recorrente (últimos 7 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mrrData}>
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
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
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

        {/* Subscribers by Plan Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Assinantes por Plano
            </CardTitle>
            <CardDescription>Distribuição atual de assinantes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subscribersByPlanData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="plano" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value, 'Assinantes']}
                />
                <Bar 
                  dataKey="assinantes" 
                  radius={[4, 4, 0, 0]}
                >
                  {subscribersByPlanData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Distribuição de Planos
            </CardTitle>
            <CardDescription>Percentual de assinantes por tipo de plano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {planDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value, 'Assinantes']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Add-ons Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Add-ons Mais Vendidos
            </CardTitle>
            <CardDescription>Ranking de add-ons por número de vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAddonsData.map((addon, index) => (
                <div key={addon.addon} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{addon.addon}</p>
                    <p className="text-xs text-muted-foreground">
                      {addon.vendas} assinantes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">
                      R$ {addon.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">/mês</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
          <CardDescription>Visão geral da saúde financeira do SaaS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Receita Planos</p>
              <p className="text-xl font-bold">
                R$ {(120 * 49.90 + 85 * 99.90 + 28 * 199.90).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Receita Add-ons</p>
              <p className="text-xl font-bold">
                R$ {topAddonsData.reduce((acc, a) => acc + a.receita, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-xl font-bold">
                R$ {(metrics.currentMRR / metrics.paidSubscribers).toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">LTV Estimado</p>
              <p className="text-xl font-bold">
                R$ {((metrics.currentMRR / metrics.paidSubscribers) * (1 / (metrics.churnRate / 100))).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
