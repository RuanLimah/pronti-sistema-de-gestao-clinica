import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  Search,
  Download,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit,
  Calendar,
  CreditCard,
  Banknote,
  Wallet,
  Building,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataStore, Pagamento } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";
import { exportFinancialPdf } from "@/lib/pdfExport";

type FormaPagamento = 'pix' | 'cartao' | 'dinheiro' | 'transferencia' | 'convenio';

const formasPagamento: { value: FormaPagamento; label: string; icon: React.ReactNode }[] = [
  { value: 'pix', label: 'PIX', icon: <Wallet className="h-4 w-4" /> },
  { value: 'cartao', label: 'Cartão', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="h-4 w-4" /> },
  { value: 'transferencia', label: 'Transferência', icon: <Building className="h-4 w-4" /> },
  { value: 'convenio', label: 'Convênio', icon: <Building className="h-4 w-4" /> },
];

type PeriodoFiltro = 'hoje' | 'semana' | 'mes' | 'trimestre' | 'ano' | 'todos';

export default function Financeiro() {
  const { user } = useAuthStore();
  const { 
    getPagamentosByMedico, 
    getPacienteById,
    getAtendimentoById,
    confirmarPagamento, 
    updatePagamento,
    gerarPagamentosAtendimentosPassados,
    getRelatorioFinanceiro,
  } = useDataStore();

  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  
  // Dialogs
  const [editValorOpen, setEditValorOpen] = useState(false);
  const [editFormaOpen, setEditFormaOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<(Pagamento & { pacienteNome?: string }) | null>(null);
  const [novoValor, setNovoValor] = useState("");
  const [novaForma, setNovaForma] = useState<FormaPagamento>("pix");

  // Gerar pagamentos pendentes para atendimentos passados
  useEffect(() => {
    if (user?.id) {
      gerarPagamentosAtendimentosPassados(user.id);
    }
  }, [user?.id, gerarPagamentosAtendimentosPassados]);

  // Calcular datas do período
  const { dataInicio, dataFim, periodoLabel } = useMemo(() => {
    const hoje = new Date();
    let inicio = new Date();
    let fim = new Date();
    let label = '';

    switch (periodo) {
      case 'hoje':
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        label = 'Hoje';
        break;
      case 'semana':
        const diaSemana = hoje.getDay();
        inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - diaSemana);
        inicio.setHours(0, 0, 0, 0);
        fim = new Date(inicio);
        fim.setDate(inicio.getDate() + 6);
        fim.setHours(23, 59, 59, 999);
        label = 'Esta Semana';
        break;
      case 'mes':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
        label = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        break;
      case 'trimestre':
        const trimestre = Math.floor(hoje.getMonth() / 3);
        inicio = new Date(hoje.getFullYear(), trimestre * 3, 1);
        fim = new Date(hoje.getFullYear(), trimestre * 3 + 3, 0, 23, 59, 59, 999);
        label = `${trimestre + 1}º Trimestre ${hoje.getFullYear()}`;
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        fim = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59, 999);
        label = `Ano ${hoje.getFullYear()}`;
        break;
      case 'todos':
        inicio = new Date(2020, 0, 1);
        fim = new Date(2030, 11, 31, 23, 59, 59, 999);
        label = 'Todo o Período';
        break;
    }

    return { dataInicio: inicio, dataFim: fim, periodoLabel: label };
  }, [periodo]);

  // Pagamentos filtrados
  const pagamentos = useMemo(() => {
    if (!user?.id) return [];
    return getPagamentosByMedico(user.id)
      .filter(p => {
        const dataPag = new Date(p.data);
        return dataPag >= dataInicio && dataPag <= dataFim;
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [user?.id, getPagamentosByMedico, dataInicio, dataFim]);

  const pagamentosComDados = useMemo(() => {
    return pagamentos.map(p => {
      const paciente = getPacienteById(p.pacienteId);
      const atendimento = p.atendimentoId ? getAtendimentoById(p.atendimentoId) : null;
      return {
        ...p,
        pacienteNome: paciente?.nome || 'Paciente não encontrado',
        dataAtendimento: atendimento ? new Date(atendimento.data) : new Date(p.data),
      };
    });
  }, [pagamentos, getPacienteById, getAtendimentoById]);

  const filteredPagamentos = useMemo(() => {
    return pagamentosComDados.filter((p) => {
      const matchesFilter = filter === "all" || 
        (filter === "paid" && p.status === "pago") || 
        (filter === "pending" && p.status === "pendente");
      const matchesSearch = p.pacienteNome.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [pagamentosComDados, filter, searchQuery]);

  const stats = useMemo(() => ({
    totalReceived: pagamentos.filter(p => p.status === "pago").reduce((sum, p) => sum + p.valor, 0),
    totalPending: pagamentos.filter(p => p.status === "pendente").reduce((sum, p) => sum + p.valor, 0),
    totalGeral: pagamentos.reduce((sum, p) => sum + p.valor, 0),
    countPending: pagamentos.filter(p => p.status === "pendente").length,
    countPaid: pagamentos.filter(p => p.status === "pago").length,
  }), [pagamentos]);

  const handleConfirmarPagamento = (pagamentoId: string) => {
    confirmarPagamento(pagamentoId);
    toast({
      title: "Pagamento confirmado",
      description: "O pagamento foi registrado com sucesso.",
    });
  };

  const handleEditValor = () => {
    if (!selectedPagamento || !novoValor) return;
    
    const valor = parseFloat(novoValor);
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido.",
        variant: "destructive",
      });
      return;
    }

    updatePagamento(selectedPagamento.id, { valor });
    setEditValorOpen(false);
    setSelectedPagamento(null);
    setNovoValor("");
    toast({
      title: "Valor atualizado",
      description: `O valor foi alterado para R$ ${valor.toFixed(2)}.`,
    });
  };

  const handleEditForma = () => {
    if (!selectedPagamento) return;
    
    updatePagamento(selectedPagamento.id, { formaPagamento: novaForma });
    setEditFormaOpen(false);
    setSelectedPagamento(null);
    toast({
      title: "Forma de pagamento atualizada",
      description: `A forma de pagamento foi alterada para ${formasPagamento.find(f => f.value === novaForma)?.label}.`,
    });
  };

  const handleExportPdf = () => {
    if (!user?.id) return;
    
    const relatorio = getRelatorioFinanceiro(user.id, dataInicio, dataFim);
    
    exportFinancialPdf(
      relatorio.pagamentos.map((p: any) => ({
        pacienteNome: p.pacienteNome,
        valor: p.valor,
        data: new Date(p.data),
        status: p.status,
        formaPagamento: formasPagamento.find(f => f.value === p.formaPagamento)?.label || p.formaPagamento,
      })),
      periodoLabel,
      {
        recebido: relatorio.totalRecebido,
        pendente: relatorio.totalPendente,
        total: relatorio.totalGeral,
      }
    );

    toast({
      title: "Relatório exportado",
      description: "O PDF foi gerado com sucesso.",
    });
  };

  const getFormaIcon = (forma: string) => {
    const found = formasPagamento.find(f => f.value === forma);
    return found?.icon || <Wallet className="h-4 w-4" />;
  };

  const getFormaLabel = (forma: string) => {
    const found = formasPagamento.find(f => f.value === forma);
    return found?.label || forma;
  };

  return (
    <DashboardLayout title="Financeiro" subtitle="Controle seus recebimentos">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="interactive" className="border-l-4 border-l-success">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Recebido</p>
                  <p className="text-3xl font-bold font-display text-success">
                    R$ {stats.totalReceived.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stats.countPaid} pagamentos
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive" className="border-l-4 border-l-warning">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-3xl font-bold font-display text-warning">
                    R$ {stats.totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stats.countPending} pagamentos
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive" className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total do Período</p>
                  <p className="text-3xl font-bold font-display">
                    R$ {stats.totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {periodoLabel}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border bg-muted/50 p-1">
              <Button
                variant={filter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                Todos
              </Button>
              <Button
                variant={filter === "paid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("paid")}
              >
                Pagos
              </Button>
              <Button
                variant={filter === "pending" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                Pendentes
              </Button>
            </div>

            <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="trimestre">Este Trimestre</SelectItem>
                <SelectItem value="ano">Este Ano</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPagamentos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma movimentação encontrada.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPagamentos.map((pagamento, index) => (
                  <div
                    key={pagamento.id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-all gap-3",
                      pagamento.status === "pendente" && "border-warning/30 bg-warning-light/30"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        pagamento.status === "pago" ? "bg-success/10" : "bg-warning/10"
                      )}>
                        {pagamento.status === "pago" ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <Clock className="h-5 w-5 text-warning" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{pagamento.pacienteNome}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          {new Date(pagamento.data).toLocaleDateString('pt-BR')}
                          <span className="flex items-center gap-1">
                            {getFormaIcon(pagamento.formaPagamento)}
                            {getFormaLabel(pagamento.formaPagamento)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 ml-13 sm:ml-0">
                      <Badge variant={pagamento.status === "pago" ? "success" : "pending"}>
                        {pagamento.status === "pago" ? "Pago" : "Pendente"}
                      </Badge>
                      <p className={cn(
                        "font-semibold text-base sm:text-lg min-w-[100px] text-right",
                        pagamento.status === "pago" ? "text-success" : "text-warning"
                      )}>
                        R$ {pagamento.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {pagamento.status === "pendente" && (
                            <>
                              <DropdownMenuItem onClick={() => handleConfirmarPagamento(pagamento.id)}>
                                <CheckCircle className="h-4 w-4 mr-2 text-success" />
                                Confirmar Pagamento
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => {
                            setSelectedPagamento(pagamento);
                            setNovoValor(pagamento.valor.toString());
                            setEditValorOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Valor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedPagamento(pagamento);
                            setNovaForma(pagamento.formaPagamento);
                            setEditFormaOpen(true);
                          }}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Alterar Forma de Pagamento
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Editar Valor */}
      <Dialog open={editValorOpen} onOpenChange={setEditValorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Valor</DialogTitle>
            <DialogDescription>
              Altere o valor do pagamento para {selectedPagamento?.pacienteNome}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Novo Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditValorOpen(false)}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleEditValor}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Forma de Pagamento */}
      <Dialog open={editFormaOpen} onOpenChange={setEditFormaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Forma de Pagamento</DialogTitle>
            <DialogDescription>
              Selecione a nova forma de pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={novaForma} onValueChange={(v) => setNovaForma(v as FormaPagamento)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formasPagamento.map((forma) => (
                    <SelectItem key={forma.value} value={forma.value}>
                      <div className="flex items-center gap-2">
                        {forma.icon}
                        {forma.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFormaOpen(false)}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleEditForma}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
