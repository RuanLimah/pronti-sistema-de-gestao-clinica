import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Clock, MoreVertical, Phone, MessageSquare, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataStore, Atendimento } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";

const statusConfig = {
  agendado: { label: "Agendado", variant: "scheduled" as const },
  realizado: { label: "Realizado", variant: "completed" as const },
  cancelado: { label: "Cancelado", variant: "cancelled" as const },
};

export function TodayAppointments() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    getProximosAtendimentosHoje, 
    getPacienteById, 
    cancelarAtendimento 
  } = useDataStore();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const medicoId = user?.id || "";
  
  // Timer para atualização automática a cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, []);
  
  // Atendimentos futuros (filtra os que já passaram)
  const proximosAtendimentos = useMemo(() => {
    // Recalcula quando currentTime muda
    return getProximosAtendimentosHoje(medicoId);
  }, [medicoId, currentTime, getProximosAtendimentosHoje]);

  const handlePhoneClick = (telefone: string) => {
    const tel = telefone.replace(/\D/g, '');
    window.open(`tel:+55${tel}`, '_self');
  };

  const handleWhatsAppClick = (telefone: string, nome: string) => {
    const tel = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá ${nome}! Tudo bem?`);
    window.open(`https://wa.me/55${tel}?text=${mensagem}`, '_blank');
  };

  const handleCancelClick = (atendimento: Atendimento) => {
    setSelectedAtendimento(atendimento);
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (!selectedAtendimento) return;

    const paciente = getPacienteById(selectedAtendimento.pacienteId);
    
    // Cancelar atendimento
    cancelarAtendimento(selectedAtendimento.id);

    // Abrir WhatsApp com mensagem de cancelamento
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

  const handleVerTodos = () => {
    navigate("/agenda");
  };

  if (proximosAtendimentos.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Próximos Atendimentos</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary" onClick={handleVerTodos}>
            Ver todos
          </Button>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            Nenhum atendimento pendente para hoje.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Próximos Atendimentos</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary" onClick={handleVerTodos}>
            Ver todos
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {proximosAtendimentos.map((atendimento, index) => {
            const paciente = getPacienteById(atendimento.pacienteId);
            if (!paciente) return null;

            const currentHour = currentTime.getHours();
            const appointmentHour = parseInt(atendimento.hora.split(":")[0]);
            const isNow = appointmentHour === currentHour && atendimento.status === 'agendado';

            return (
              <div
                key={atendimento.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg transition-all duration-200",
                  isNow && "bg-primary/10 border border-primary/30 shadow-sm",
                  !isNow && "hover:bg-muted/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                  <AvatarFallback className={cn(
                    "text-sm font-medium",
                    isNow ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}>
                    {paciente.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {paciente.nome}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{atendimento.hora} • 50min</span>
                  </div>
                </div>

                <Badge variant={statusConfig[atendimento.status].variant}>
                  {statusConfig[atendimento.status].label}
                </Badge>

                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handlePhoneClick(paciente.telefone)}
                    title="Ligar"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-success"
                    onClick={() => handleWhatsAppClick(paciente.telefone, paciente.nome)}
                    title="WhatsApp"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleCancelClick(atendimento)}
                        className="text-destructive focus:text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar consulta
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleWhatsAppClick(paciente.telefone, paciente.nome)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Enviar mensagem
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

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
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar Consulta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
