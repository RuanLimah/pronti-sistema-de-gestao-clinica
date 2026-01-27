import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Calendar, TrendingUp, TrendingDown, Users, DollarSign, XCircle, FileText, Clock, Mail, History, RefreshCw } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { useDataStore } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";
import { jsPDF } from 'jspdf';

type PeriodoFiltro = 'dia' | 'semana' | 'mes' | 'trimestre' | 'semestre' | 'ano' | 'personalizado';

interface RelatorioGerado {
  id: string;
  tipo: 'geral' | 'financeiro' | 'pacientes' | 'atendimentos';
  periodo: string;
  dataGeracao: Date;
  enviado: boolean;
}

export default function Relatorios() {
  const { user } = useAuthStore();
  const { 
    getPacientesByMedico, 
    getAtendimentosByMedico, 
    getPagamentosByMedico,
    getProntuariosByPaciente,
    getConfiguracoesByMedico,
  } = useDataStore();

  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const [dataInicioPers, setDataInicioPers] = useState('');
  const [dataFimPers, setDataFimPers] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState<'geral' | 'financeiro' | 'pacientes' | 'atendimentos'>('geral');
  
  // Histórico de relatórios (simulado para MVP)
  const [historico, setHistorico] = useState<RelatorioGerado[]>([]);

  const medicoId = user?.id || '';
  const config = getConfiguracoesByMedico(medicoId);

  // Calcular datas do período
  const { dataInicio, dataFim, periodoLabel } = useMemo(() => {
    const hoje = new Date();
    let inicio = new Date();
    let fim = new Date();
    let label = '';

    switch (periodo) {
      case 'dia':
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        label = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        break;
      case 'semana':
        const diaSemana = hoje.getDay();
        inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - diaSemana);
        inicio.setHours(0, 0, 0, 0);
        fim = new Date(inicio);
        fim.setDate(inicio.getDate() + 6);
        fim.setHours(23, 59, 59, 999);
        label = `Semana de ${inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} a ${fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
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
      case 'semestre':
        const semestre = Math.floor(hoje.getMonth() / 6);
        inicio = new Date(hoje.getFullYear(), semestre * 6, 1);
        fim = new Date(hoje.getFullYear(), semestre * 6 + 6, 0, 23, 59, 59, 999);
        label = `${semestre + 1}º Semestre ${hoje.getFullYear()}`;
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        fim = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59, 999);
        label = `Ano ${hoje.getFullYear()}`;
        break;
      case 'personalizado':
        if (dataInicioPers && dataFimPers) {
          inicio = new Date(dataInicioPers);
          fim = new Date(dataFimPers);
          fim.setHours(23, 59, 59, 999);
          label = `${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`;
        } else {
          inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
          label = 'Período personalizado';
        }
        break;
    }

    return { dataInicio: inicio, dataFim: fim, periodoLabel: label };
  }, [periodo, dataInicioPers, dataFimPers]);

  // Dados do período
  const pacientes = useMemo(() => getPacientesByMedico(medicoId), [medicoId, getPacientesByMedico]);
  
  const atendimentos = useMemo(() => {
    return getAtendimentosByMedico(medicoId).filter(a => {
      const dataAtend = new Date(a.data);
      return dataAtend >= dataInicio && dataAtend <= dataFim;
    });
  }, [medicoId, dataInicio, dataFim, getAtendimentosByMedico]);

  const pagamentos = useMemo(() => {
    return getPagamentosByMedico(medicoId).filter(p => {
      const dataPag = new Date(p.data);
      return dataPag >= dataInicio && dataPag <= dataFim;
    });
  }, [medicoId, dataInicio, dataFim, getPagamentosByMedico]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalAtendimentos = atendimentos.length;
    const realizados = atendimentos.filter(a => a.status === 'realizado').length;
    const cancelados = atendimentos.filter(a => a.status === 'cancelado').length;
    const agendados = atendimentos.filter(a => a.status === 'agendado').length;
    const faturamento = pagamentos.reduce((sum, p) => sum + p.valor, 0);
    const recebido = pagamentos.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.valor, 0);
    const pendente = pagamentos.filter(p => p.status === 'pendente').reduce((sum, p) => sum + p.valor, 0);
    const pacientesAtivos = pacientes.filter(p => p.status === 'ativo').length;
    const taxaFaltas = totalAtendimentos > 0 ? ((cancelados / totalAtendimentos) * 100) : 0;

    return {
      totalAtendimentos,
      realizados,
      cancelados,
      agendados,
      faturamento,
      recebido,
      pendente,
      pacientesAtivos,
      taxaFaltas,
    };
  }, [atendimentos, pagamentos, pacientes]);

  // Dados para gráficos
  const statusData = useMemo(() => [
    { name: "Realizados", value: stats.realizados, color: "hsl(152, 60%, 42%)" },
    { name: "Agendados", value: stats.agendados, color: "hsl(172, 66%, 40%)" },
    { name: "Cancelados", value: stats.cancelados, color: "hsl(0, 72%, 51%)" },
  ].filter(d => d.value > 0), [stats]);

  const paymentData = useMemo(() => {
    const porForma: Record<string, number> = {};
    pagamentos.filter(p => p.status === 'pago').forEach(p => {
      porForma[p.formaPagamento] = (porForma[p.formaPagamento] || 0) + p.valor;
    });
    
    const formaLabels: Record<string, string> = {
      pix: 'PIX',
      cartao: 'Cartão',
      dinheiro: 'Dinheiro',
      transferencia: 'Transferência',
      convenio: 'Convênio',
    };

    const cores = ["hsl(172, 66%, 40%)", "hsl(38, 92%, 50%)", "hsl(152, 60%, 42%)", "hsl(220, 70%, 50%)", "hsl(280, 60%, 50%)"];
    
    return Object.entries(porForma).map(([forma, valor], i) => ({
      name: formaLabels[forma] || forma,
      value: Math.round((valor / stats.recebido) * 100) || 0,
      total: valor,
      color: cores[i % cores.length],
    }));
  }, [pagamentos, stats.recebido]);

  // Dados mensais para gráfico de evolução
  const monthlyData = useMemo(() => {
    const meses: Record<string, { atendimentos: number; faturamento: number }> = {};
    
    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const key = data.toLocaleDateString('pt-BR', { month: 'short' });
      meses[key] = { atendimentos: 0, faturamento: 0 };
    }

    getAtendimentosByMedico(medicoId).forEach(a => {
      const data = new Date(a.data);
      const key = data.toLocaleDateString('pt-BR', { month: 'short' });
      if (meses[key]) {
        meses[key].atendimentos++;
      }
    });

    getPagamentosByMedico(medicoId).filter(p => p.status === 'pago').forEach(p => {
      const data = new Date(p.data);
      const key = data.toLocaleDateString('pt-BR', { month: 'short' });
      if (meses[key]) {
        meses[key].faturamento += p.valor;
      }
    });

    return Object.entries(meses).map(([month, data]) => ({
      month,
      ...data,
    }));
  }, [medicoId, getAtendimentosByMedico, getPagamentosByMedico]);

  // Gerar PDF completo
  const handleExportPdf = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(23, 120, 108);
    doc.text('PRONTI', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Relatório Completo', 20, 27);
    doc.text(`Período: ${periodoLabel}`, 20, 34);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 41);
    
    // Linha divisória
    doc.setDrawColor(23, 120, 108);
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);
    
    let yPos = 60;
    
    // Resumo Geral
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('📊 Resumo Geral', 20, yPos);
    yPos += 12;
    
    doc.setFontSize(11);
    doc.text(`Total de Atendimentos: ${stats.totalAtendimentos}`, 25, yPos); yPos += 7;
    doc.text(`Realizados: ${stats.realizados}`, 25, yPos); yPos += 7;
    doc.text(`Cancelados: ${stats.cancelados}`, 25, yPos); yPos += 7;
    doc.text(`Taxa de Faltas: ${stats.taxaFaltas.toFixed(1)}%`, 25, yPos); yPos += 12;
    
    // Financeiro
    doc.setFontSize(14);
    doc.text('💰 Financeiro', 20, yPos);
    yPos += 12;
    
    doc.setFontSize(11);
    doc.text(`Faturamento Total: R$ ${stats.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, yPos); yPos += 7;
    doc.text(`Recebido: R$ ${stats.recebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, yPos); yPos += 7;
    doc.text(`Pendente: R$ ${stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, yPos); yPos += 12;
    
    // Pacientes
    doc.setFontSize(14);
    doc.text('👥 Pacientes', 20, yPos);
    yPos += 12;
    
    doc.setFontSize(11);
    doc.text(`Total de Pacientes: ${pacientes.length}`, 25, yPos); yPos += 7;
    doc.text(`Pacientes Ativos: ${stats.pacientesAtivos}`, 25, yPos); yPos += 7;
    doc.text(`Pacientes Inativos: ${pacientes.length - stats.pacientesAtivos}`, 25, yPos); yPos += 15;

    // Lista de Pacientes
    if (tipoRelatorio === 'pacientes' || tipoRelatorio === 'geral') {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('📋 Lista de Pacientes', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(9);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos - 5, 170, 8, 'F');
      doc.text('Nome', 22, yPos);
      doc.text('Telefone', 80, yPos);
      doc.text('Status', 130, yPos);
      doc.text('Valor', 160, yPos);
      yPos += 8;
      
      pacientes.slice(0, 20).forEach(p => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(p.nome.substring(0, 25), 22, yPos);
        doc.text(p.telefone, 80, yPos);
        doc.text(p.status === 'ativo' ? 'Ativo' : 'Inativo', 130, yPos);
        doc.text(p.valorConsulta ? `R$ ${p.valorConsulta.toFixed(2)}` : '-', 160, yPos);
        yPos += 6;
      });
    }

    // Atendimentos
    if (tipoRelatorio === 'atendimentos' || tipoRelatorio === 'geral') {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      yPos += 10;
      doc.setFontSize(14);
      doc.text('📅 Atendimentos do Período', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(9);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos - 5, 170, 8, 'F');
      doc.text('Data', 22, yPos);
      doc.text('Hora', 55, yPos);
      doc.text('Paciente', 80, yPos);
      doc.text('Status', 140, yPos);
      doc.text('Valor', 170, yPos);
      yPos += 8;
      
      atendimentos.slice(0, 30).forEach(a => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const paciente = pacientes.find(p => p.id === a.pacienteId);
        doc.text(new Date(a.data).toLocaleDateString('pt-BR'), 22, yPos);
        doc.text(a.hora, 55, yPos);
        doc.text((paciente?.nome || 'N/A').substring(0, 25), 80, yPos);
        doc.text(a.status, 140, yPos);
        doc.text(a.valor ? `R$ ${a.valor.toFixed(0)}` : '-', 170, yPos);
        yPos += 6;
      });
    }

    // Pagamentos
    if (tipoRelatorio === 'financeiro' || tipoRelatorio === 'geral') {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      yPos += 10;
      doc.setFontSize(14);
      doc.text('💳 Pagamentos do Período', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(9);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos - 5, 170, 8, 'F');
      doc.text('Data', 22, yPos);
      doc.text('Paciente', 55, yPos);
      doc.text('Valor', 120, yPos);
      doc.text('Forma', 145, yPos);
      doc.text('Status', 175, yPos);
      yPos += 8;
      
      pagamentos.slice(0, 30).forEach(p => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const paciente = pacientes.find(pac => pac.id === p.pacienteId);
        doc.text(new Date(p.data).toLocaleDateString('pt-BR'), 22, yPos);
        doc.text((paciente?.nome || 'N/A').substring(0, 25), 55, yPos);
        doc.text(`R$ ${p.valor.toFixed(2)}`, 120, yPos);
        doc.text(p.formaPagamento.toUpperCase(), 145, yPos);
        doc.text(p.status === 'pago' ? 'Pago' : 'Pendente', 175, yPos);
        yPos += 6;
      });
    }
    
    // Footer em todas as páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `PRONTI - Relatório Profissional | Página ${i} de ${pageCount}`,
        20,
        285
      );
    }
    
    const filename = `relatorio-${tipoRelatorio}-${periodoLabel.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);

    // Adicionar ao histórico
    const novoRelatorio: RelatorioGerado = {
      id: Date.now().toString(),
      tipo: tipoRelatorio,
      periodo: periodoLabel,
      dataGeracao: new Date(),
      enviado: false,
    };
    setHistorico(prev => [novoRelatorio, ...prev]);

    toast({
      title: "Relatório exportado",
      description: `O PDF foi gerado com sucesso: ${filename}`,
    });
    
    setExportDialogOpen(false);
  };

  // Simular envio por email
  const handleEnviarEmail = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O envio automático por e-mail estará disponível em breve. Configure o envio semanal nas Configurações.",
    });
  };

  return (
    <DashboardLayout title="Relatórios" subtitle="Análise de desempenho e métricas">
      <div className="space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Hoje</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="trimestre">Trimestre</SelectItem>
                <SelectItem value="semestre">Semestre</SelectItem>
                <SelectItem value="ano">Este Ano</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            {periodo === 'personalizado' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dataInicioPers}
                  onChange={(e) => setDataInicioPers(e.target.value)}
                  className="w-36"
                />
                <span className="text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={dataFimPers}
                  onChange={(e) => setDataFimPers(e.target.value)}
                  className="w-36"
                />
              </div>
            )}
            
            <Badge variant="outline" className="text-sm">
              {periodoLabel}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEnviarEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar por E-mail
            </Button>
            <Button variant="hero" onClick={() => setExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Atendimentos</p>
                  <p className="text-xl sm:text-3xl font-bold font-display">{stats.totalAtendimentos}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.realizados} realizados
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center hidden sm:flex">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Faturamento</p>
                  <p className="text-xl sm:text-3xl font-bold font-display text-success">
                    R$ {stats.recebido.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} pendente
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-success/10 flex items-center justify-center hidden sm:flex">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pacientes Ativos</p>
                  <p className="text-xl sm:text-3xl font-bold font-display">{stats.pacientesAtivos}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    de {pacientes.length} total
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center hidden sm:flex">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Taxa de Cancelamento</p>
                  <p className="text-xl sm:text-3xl font-bold font-display">{stats.taxaFaltas.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.cancelados} cancelados
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-destructive/10 flex items-center justify-center hidden sm:flex">
                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Evolution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução Mensal (Últimos 6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="atendimentos" fill="hsl(172, 66%, 40%)" radius={[4, 4, 0, 0]} name="Atendimentos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Faturamento Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Faturamento"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="faturamento"
                      stroke="hsl(152, 60%, 42%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(152, 60%, 42%)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status dos Atendimentos</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Nenhum atendimento no período selecionado
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  <div className="h-[180px] w-[180px] sm:h-[200px] sm:w-[200px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-col gap-3 w-full sm:w-auto">
                    {statusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 sm:gap-3">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                        <span className="text-sm font-semibold ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Nenhum pagamento recebido no período
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  <div className="h-[180px] w-[180px] sm:h-[200px] sm:w-[200px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {paymentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value}%`, ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 sm:flex sm:flex-col gap-3 w-full sm:w-auto">
                    {paymentData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 sm:gap-3">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                        <span className="text-sm font-semibold ml-auto">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Relatórios */}
        {historico.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5" />
                Histórico de Relatórios Gerados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Data de Geração</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.slice(0, 5).map((rel) => (
                    <TableRow key={rel.id}>
                      <TableCell className="capitalize">{rel.tipo}</TableCell>
                      <TableCell>{rel.periodo}</TableCell>
                      <TableCell>
                        {new Date(rel.dataGeracao).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regerar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Exportar PDF */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Relatório PDF</DialogTitle>
            <DialogDescription>
              Escolha o tipo de relatório que deseja gerar para o período: {periodoLabel}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select value={tipoRelatorio} onValueChange={(v) => setTipoRelatorio(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Relatório Completo (Tudo)
                    </div>
                  </SelectItem>
                  <SelectItem value="financeiro">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Apenas Financeiro
                    </div>
                  </SelectItem>
                  <SelectItem value="pacientes">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Apenas Pacientes
                    </div>
                  </SelectItem>
                  <SelectItem value="atendimentos">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Apenas Atendimentos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-medium">O relatório incluirá:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {tipoRelatorio === 'geral' && (
                  <>
                    <li>Resumo geral de métricas</li>
                    <li>Lista de pacientes</li>
                    <li>Atendimentos do período</li>
                    <li>Pagamentos e financeiro</li>
                  </>
                )}
                {tipoRelatorio === 'financeiro' && (
                  <>
                    <li>Resumo financeiro</li>
                    <li>Lista de pagamentos</li>
                    <li>Totais por forma de pagamento</li>
                  </>
                )}
                {tipoRelatorio === 'pacientes' && (
                  <>
                    <li>Lista completa de pacientes</li>
                    <li>Status e valores de consulta</li>
                  </>
                )}
                {tipoRelatorio === 'atendimentos' && (
                  <>
                    <li>Lista de atendimentos</li>
                    <li>Status e valores</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleExportPdf}>
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
