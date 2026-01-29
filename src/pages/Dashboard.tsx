import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TodayAppointments } from "@/components/dashboard/TodayAppointments";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { Calendar, Users, DollarSign, Clock } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";

export default function Dashboard() {
  const { user } = useAuthStore();
  const { 
    fetchPacientes, 
    fetchAtendimentos,
    fetchPagamentos,
    getEstatisticasDashboard
  } = useDataStore();

  const medicoId = user?.id || "";

  // Inicializar dados reais quando o usuário logar
  useEffect(() => {
    if (medicoId) {
      fetchPacientes(medicoId);
      fetchAtendimentos(medicoId);
      fetchPagamentos(medicoId);
    }
  }, [medicoId, fetchPacientes, fetchAtendimentos, fetchPagamentos]);

  const stats = getEstatisticasDashboard(medicoId);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const greeting = user?.nome ? `Olá, ${user.nome.split(' ')[0]}!` : "Olá!";

  return (
    <DashboardLayout
      title="PRONTI"
      subtitle={`${greeting} Hoje é ${today}`}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Atendimentos Hoje"
            value={stats.atendimentosAgendadosHoje}
            icon={<Calendar className="h-5 w-5" />}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Pacientes Ativos"
            value={stats.pacientesAtivos}
            icon={<Users className="h-5 w-5" />}
            variant="success"
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Faturamento do Mês"
            value={`R$ ${stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-5 w-5" />}
            variant="warning"
            trend={{ value: 15, isPositive: true }}
          />
          <StatsCard
            title="Próximo Atendimento"
            value={stats.proximoAtendimento || "--:--"}
            icon={<Clock className="h-5 w-5" />}
            variant="default"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Appointments */}
          <div className="lg:col-span-2 space-y-6">
            <TodayAppointments />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <QuickActions />
            <FinancialSummary />
          </div>
        </div>

        {/* Recent Patients */}
        <RecentPatients />
      </div>
    </DashboardLayout>
  );
}
