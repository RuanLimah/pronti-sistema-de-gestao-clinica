import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminService } from "../services/adminService";
import { AdminStats, AdminAuditLog } from "../types";
import { Loader2, DollarSign, Users, UserCheck, UserX } from "lucide-react";

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [statsData, logsData] = await Promise.all([
        adminService.getStats(),
        adminService.getAuditLogs()
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (error) {
      console.error("Erro ao carregar dashboard", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h2>
        <p className="text-muted-foreground">Visão geral do SaaS e métricas principais.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Estimativa baseada em assinaturas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Free</CardTitle>
            <UserX className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.freeClients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Atividades (Auditoria)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {log.acao} - <span className="text-muted-foreground">{log.entidade}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                    {log.detalhes && (
                      <pre className="text-[10px] bg-muted p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(log.detalhes, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
