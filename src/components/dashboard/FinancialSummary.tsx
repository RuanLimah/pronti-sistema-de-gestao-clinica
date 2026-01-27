import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";

export function FinancialSummary() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getPagamentosByMedico } = useDataStore();

  const medicoId = user?.id || "";
  const pagamentos = getPagamentosByMedico(medicoId);

  // Calcular valores do mês atual
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const pagamentosMes = pagamentos.filter((p) => {
    const dataPagamento = new Date(p.data);
    return dataPagamento >= inicioMes && dataPagamento <= fimMes;
  });

  const currentRevenue = pagamentosMes
    .filter((p) => p.status === 'pago')
    .reduce((sum, p) => sum + p.valor, 0);

  const pendingPayments = pagamentosMes
    .filter((p) => p.status === 'pendente')
    .reduce((sum, p) => sum + p.valor, 0);

  const monthlyGoal = 15000;
  const progress = monthlyGoal > 0 ? (currentRevenue / monthlyGoal) * 100 : 0;

  // Calcular distribuição por forma de pagamento
  const paymentDistribution = pagamentosMes
    .filter((p) => p.status === 'pago')
    .reduce((acc, p) => {
      acc[p.formaPagamento] = (acc[p.formaPagamento] || 0) + p.valor;
      return acc;
    }, {} as Record<string, number>);

  const totalPago = currentRevenue || 1; // Evitar divisão por zero
  const paymentMethods = [
    { method: "PIX", key: "pix", amount: paymentDistribution.pix || 0 },
    { method: "Cartão", key: "cartao", amount: paymentDistribution.cartao || 0 },
    { method: "Dinheiro", key: "dinheiro", amount: paymentDistribution.dinheiro || 0 },
    { method: "Transferência", key: "transferencia", amount: paymentDistribution.transferencia || 0 },
  ].map(item => ({
    ...item,
    percentage: Math.round((item.amount / totalPago) * 100) || 0,
  })).filter(item => item.amount > 0);

  const handleVerTudo = () => {
    navigate("/financeiro");
  };

  return (
    <Card>
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary" onClick={handleVerTudo}>
          Ver tudo
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Goal Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Meta Mensal</span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">
              R$ {currentRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-muted-foreground">
              de R$ {monthlyGoal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-success">Recebido</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              R$ {currentRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-xs font-medium text-warning">Pendente</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              R$ {pendingPayments.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Payment Distribution */}
        {paymentMethods.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Formas de Pagamento</p>
            <div className="space-y-2">
              {paymentMethods.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{item.method}</span>
                      <span className="text-muted-foreground">{item.percentage}%</span>
                    </div>
                    <Progress value={item.percentage} className="h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
