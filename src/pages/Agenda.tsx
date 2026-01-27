import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MoreVertical,
  Filter,
  XCircle,
  Phone,
  MessageSquare,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataStore, Atendimento } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const hours = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

const statusStyles = {
  agendado: "bg-primary-light border-primary/30 text-primary",
  realizado: "bg-success-light border-success/30 text-success opacity-70",
  cancelado: "bg-muted border-muted-foreground/30 text-muted-foreground line-through",
};

const statusLabels = {
  agendado: "Agendado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

type FilterPeriod = 'all' | 'today' | 'tomorrow' | 'week' | 'month';
type FilterStatus = 'all' | 'agendado' | 'realizado' | 'cancelado';

interface Filters {
  period: FilterPeriod;
  status: FilterStatus;
}

export default function Agenda() {
  const { user } = useAuthStore();
  const {
    getAtendimentosPorData,
    getPacienteById,
    getPacientesByMedico,
    addAtendimento,
    cancelarAtendimento,
    verificarHorarioDisponivel,
    isAtendimentoPassado,
  } = useDataStore();

  const medicoId = user?.id || "";

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  
  // Modal de novo atendimento
  const [novoAtendimentoOpen, setNovoAtendimentoOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ data: Date; hora: string } | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [valorConsulta, setValorConsulta] = useState("");
  
  // Modal de cancelamento
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);

  // Modal de filtros
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({ period: 'all', status: 'all' });
  const [tempFilters, setTempFilters] = useState<Filters>({ period: 'all', status: 'all' });

  const pacientes = getPacientesByMedico(medicoId).filter(p => p.status === 'ativo');

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (view === "day") {
      newDate.setDate(selectedDate.getDate() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(selectedDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setSelectedDate(newDate);
  };

  // Verificar se um atendimento já passou (status derivado)
  const getAppointmentDisplayStatus = (appointment: Atendimento): 'agendado' | 'realizado' | 'cancelado' => {
    if (appointment.status === 'cancelado') return 'cancelado';
    if (appointment.status === 'realizado') return 'realizado';
    
    // Se o horário já passou e não foi cancelado, considera como realizado
    if (isAtendimentoPassado(appointment)) {
      return 'realizado';
    }
    
    return 'agendado';
  };

  // Verificar se pode cancelar (não pode cancelar se já passou)
  const canCancel = (appointment: Atendimento): boolean => {
    if (appointment.status !== 'agendado') return false;
    return !isAtendimentoPassado(appointment);
  };

  const getAppointmentForSlot = (date: Date, hour: string): Atendimento | undefined => {
    const atendimentos = getAtendimentosPorData(medicoId, date);
    return atendimentos.find((a) => a.hora === hour);
  };

  // Aplicar filtros de período
  const getFilteredDate = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    switch (filters.period) {
      case 'today':
        return hoje;
      case 'tomorrow': {
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);
        return amanha; }
      default: 
        return selectedDate;
    }
  }, [filters.period, selectedDate]);

  const handleSlotClick = (date: Date, hora: string) => {
    const existingAppointment = getAppointmentForSlot(date, hora);
    if (existingAppointment && existingAppointment.status !== 'cancelado') {
      return; // Slot ocupado
    }
    
    setSelectedSlot({ data: date, hora });
    setNovoAtendimentoOpen(true);
  };

  const handleAddAtendimento = () => {
    if (!selectedSlot || !selectedPaciente) {
      toast({
        title: "Erro",
        description: "Selecione um paciente.",
        variant: "destructive",
      });
      return;
    }

    const result = addAtendimento({
      pacienteId: selectedPaciente,
      medicoId,
      data: selectedSlot.data,
      hora: selectedSlot.hora,
      status: 'agendado',
      valor: valorConsulta ? parseFloat(valorConsulta) : undefined,
    });

    if (result.success) {
      toast({
        title: "Atendimento agendado",
        description: `Consulta marcada para ${selectedSlot.hora}.`,
      });
      setNovoAtendimentoOpen(false);
      setSelectedSlot(null);
      setSelectedPaciente("");
      setValorConsulta("");
    } else {
      toast({
        title: "Erro ao agendar",
        description: result.error || "Não foi possível agendar o atendimento.",
        variant: "destructive",
      });
    }
  };

  const handleCancelClick = (atendimento: Atendimento) => {
    setSelectedAtendimento(atendimento);
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (!selectedAtendimento) return;

    const paciente = getPacienteById(selectedAtendimento.pacienteId);
    cancelarAtendimento(selectedAtendimento.id);

    if (paciente) {
      const tel = paciente.telefone.replace(/\D/g, '');
      const mensagem = encodeURIComponent(
        `Olá ${paciente.nome}, informamos que sua consulta do dia ${new Date(selectedAtendimento.data).toLocaleDateString('pt-BR')} às ${selectedAtendimento.hora} foi cancelada. Entre em contato para reagendar.`
      );
      window.open(`https://wa.me/55${tel}?text=${mensagem}`, '_blank');
    }

    toast({
      title: "Consulta cancelada",
      description: "O paciente foi notificado via WhatsApp.",
    });

    setCancelDialogOpen(false);
    setSelectedAtendimento(null);
  };

  const handlePhoneClick = (telefone: string) => {
    const tel = telefone.replace(/\D/g, '');
    window.open(`tel:+55${tel}`, '_self');
  };

  const handleWhatsAppClick = (telefone: string, nome: string) => {
    const tel = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá ${nome}! Tudo bem?`);
    window.open(`https://wa.me/55${tel}?text=${mensagem}`, '_blank');
  };

  const handleOpenFilters = () => {
    setTempFilters(filters);
    setFilterDialogOpen(true);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    
    // Aplicar filtro de período na data selecionada
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    switch (tempFilters.period) {
      case 'today':
        setSelectedDate(hoje);
        break;
      case 'tomorrow': {
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);
        setSelectedDate(amanha);
        break; }
      case 'week':
        setSelectedDate(hoje);
        setView('week');
        break;
    }
    
    setFilterDialogOpen(false);
    toast({
      title: "Filtros aplicados",
      description: "A agenda foi atualizada conforme os filtros.",
    });
  };

  const handleClearFilters = () => {
    setTempFilters({ period: 'all', status: 'all' });
    setFilters({ period: 'all', status: 'all' });
    setFilterDialogOpen(false);
  };

  const hasActiveFilters = filters.period !== 'all' || filters.status !== 'all';

  const weekDates = getWeekDates();

  // Filtrar slots por status se necessário
  const shouldShowSlot = (appointment: Atendimento | undefined): boolean => {
    if (!appointment) return true;
    if (filters.status === 'all') return true;
    
    const displayStatus = getAppointmentDisplayStatus(appointment);
    return displayStatus === filters.status;
  };

  return (
    <DashboardLayout title="Agenda" subtitle="Gerencie seus atendimentos">
      <div className="space-y-6 animate-fade-in">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm sm:text-lg font-semibold min-w-0 text-center font-display truncate px-2">
              {view === "day"
                ? selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })
                : `${weekDates[0].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} - ${weekDates[6].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`}
            </h2>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())} className="hidden sm:flex">
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border bg-muted/50 p-1">
              <Button
                variant={view === "day" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("day")}
              >
                Dia
              </Button>
              <Button
                variant={view === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("week")}
                className="hidden sm:inline-flex"
              >
                Semana
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn("hidden sm:flex", hasActiveFilters && "border-primary text-primary")}
              onClick={handleOpenFilters}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {(filters.period !== 'all' ? 1 : 0) + (filters.status !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className={cn("sm:hidden h-9 w-9", hasActiveFilters && "border-primary text-primary")}
              onClick={handleOpenFilters}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button 
              variant="hero" 
              size="sm" 
              className="hidden sm:flex"
              onClick={() => {
                setSelectedSlot({ data: selectedDate, hora: '08:00' });
                setNovoAtendimentoOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Atendimento
            </Button>
            <Button 
              variant="hero" 
              size="icon" 
              className="sm:hidden h-9 w-9"
              onClick={() => {
                setSelectedSlot({ data: selectedDate, hora: '08:00' });
                setNovoAtendimentoOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-0">
            {view === "week" ? (
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Week Header */}
                  <div className="grid grid-cols-8 border-b">
                    <div className="p-4 text-sm text-muted-foreground">Horário</div>
                    {weekDates.map((date, i) => {
                      const isToday = formatDate(date) === formatDate(new Date());
                      return (
                        <div
                          key={i}
                          className={cn(
                            "p-4 text-center border-l",
                            isToday && "bg-primary-light"
                          )}
                        >
                          <p className="text-xs text-muted-foreground">{weekDays[i]}</p>
                          <p className={cn(
                            "text-lg font-semibold",
                            isToday && "text-primary"
                          )}>
                            {date.getDate()}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Time Slots */}
                  {hours.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                      <div className="p-4 text-sm text-muted-foreground flex items-start">
                        {hour}
                      </div>
                      {weekDates.map((date, i) => {
                        const appointment = getAppointmentForSlot(date, hour);
                        const paciente = appointment ? getPacienteById(appointment.pacienteId) : null;
                        const isAvailable = !appointment || appointment.status === 'cancelado';
                        const displayStatus = appointment ? getAppointmentDisplayStatus(appointment) : null;
                        
                        if (!shouldShowSlot(appointment)) {
                          return <div key={i} className="p-2 border-l min-h-[60px]" />;
                        }
                        
                        return (
                          <div
                            key={i}
                            className={cn(
                              "p-2 border-l min-h-[60px] transition-colors",
                              isAvailable && "hover:bg-muted/30 cursor-pointer"
                            )}
                            onClick={() => isAvailable && handleSlotClick(date, hour)}
                          >
                            {appointment && appointment.status !== 'cancelado' && (
                              <div
                                className={cn(
                                  "p-2 rounded-lg border text-xs",
                                  statusStyles[displayStatus || 'agendado']
                                )}
                              >
                                <p className="font-medium truncate">{paciente?.nome || 'Paciente'}</p>
                                <p className="opacity-75">{appointment.hora}</p>
                              </div>
                            )}
                            {isAvailable && (
                              <div className="h-full flex items-center justify-center text-muted-foreground/50 hover:text-primary/50">
                                <Plus className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {hours.map((hour) => {
                  const appointment = getAppointmentForSlot(selectedDate, hour);
                  const paciente = appointment ? getPacienteById(appointment.pacienteId) : null;
                  const currentHour = new Date().getHours();
                  const slotHour = parseInt(hour.split(":")[0]);
                  const isNow = slotHour === currentHour && formatDate(selectedDate) === formatDate(new Date());
                  const isAvailable = !appointment || appointment.status === 'cancelado';
                  const displayStatus = appointment ? getAppointmentDisplayStatus(appointment) : null;
                  const canCancelAppointment = appointment ? canCancel(appointment) : false;

                  if (!shouldShowSlot(appointment)) {
                    return null;
                  }

                  return (
                    <div
                      key={hour}
                      className={cn(
                        "flex items-stretch min-h-[80px] transition-colors",
                        isNow && "bg-primary-light/50",
                        isAvailable && "hover:bg-muted/30"
                      )}
                    >
                      <div className="w-16 sm:w-20 p-2 sm:p-4 text-xs sm:text-sm text-muted-foreground flex items-center justify-end pr-2 sm:pr-6 border-r shrink-0">
                        {hour}
                      </div>
                      <div className="flex-1 p-2 sm:p-3 min-w-0">
                        {appointment && appointment.status !== 'cancelado' ? (
                          <div
                            className={cn(
                              "flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl border h-full",
                              statusStyles[displayStatus || 'agendado']
                            )}
                          >
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex">
                              <AvatarFallback className="bg-background text-foreground text-xs sm:text-sm">
                                {paciente?.nome?.split(" ").map(n => n[0]).join("") || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">{paciente?.nome || 'Paciente'}</p>
                              <div className="flex items-center gap-2 text-xs sm:text-sm opacity-75">
                                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span>{hour} • 50 min</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                              <Badge variant={displayStatus === "realizado" ? "completed" : "scheduled"} className="text-xs">
                                {displayStatus === 'realizado' ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Realizado
                                  </span>
                                ) : (
                                  statusLabels[displayStatus || 'agendado']
                                )}
                              </Badge>
                              
                              <div className="flex items-center gap-1">
                                {paciente && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 sm:h-8 sm:w-8"
                                      onClick={() => handlePhoneClick(paciente.telefone)}
                                    >
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 sm:h-8 sm:w-8 text-success"
                                      onClick={() => handleWhatsAppClick(paciente.telefone, paciente.nome)}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {canCancelAppointment && (
                                      <DropdownMenuItem 
                                        onClick={() => handleCancelClick(appointment)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancelar consulta
                                      </DropdownMenuItem>
                                    )}
                                    {paciente && (
                                      <DropdownMenuItem 
                                        onClick={() => handleWhatsAppClick(paciente.telefone, paciente.nome)}
                                      >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Enviar mensagem
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="h-full flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-muted rounded-xl hover:border-primary/30 hover:bg-primary-light/30 cursor-pointer transition-all"
                            onClick={() => handleSlotClick(selectedDate, hour)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Livre
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Filtros */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filtrar Agenda</DialogTitle>
            <DialogDescription>
              Selecione os filtros para visualizar a agenda
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select 
                value={tempFilters.period} 
                onValueChange={(value: FilterPeriod) => setTempFilters({ ...tempFilters, period: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="tomorrow">Amanhã</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={tempFilters.status} 
                onValueChange={(value: FilterStatus) => setTempFilters({ ...tempFilters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="agendado">Agendados</SelectItem>
                  <SelectItem value="realizado">Realizados</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={handleClearFilters} className="w-full sm:w-auto">
              Limpar Filtros
            </Button>
            <Button variant="outline" onClick={() => setFilterDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleApplyFilters} className="w-full sm:w-auto">
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Atendimento */}
      <Dialog open={novoAtendimentoOpen} onOpenChange={setNovoAtendimentoOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Atendimento</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  Agendar para {selectedSlot.data.toLocaleDateString('pt-BR')} às{' '}
                  <Select
                    value={selectedSlot.hora}
                    onValueChange={(value) => setSelectedSlot({ ...selectedSlot, hora: value })}
                  >
                    <SelectTrigger className="w-24 inline-flex h-8 ml-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hora) => {
                        const disponivel = verificarHorarioDisponivel(medicoId, selectedSlot.data, hora);
                        return (
                          <SelectItem 
                            key={hora} 
                            value={hora}
                            disabled={!disponivel}
                          >
                            {hora} {!disponivel && "(ocupado)"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paciente">Paciente</Label>
              <Select value={selectedPaciente} onValueChange={setSelectedPaciente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((paciente) => (
                    <SelectItem key={paciente.id} value={paciente.id}>
                      {paciente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor da Consulta (opcional)</Label>
              <Input
                id="valor"
                type="number"
                placeholder="R$ 0,00"
                value={valorConsulta}
                onChange={(e) => setValorConsulta(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoAtendimentoOpen(false)}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleAddAtendimento}>
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Cancelamento */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Consulta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta consulta? O paciente será notificado via WhatsApp automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancel} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Consulta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
