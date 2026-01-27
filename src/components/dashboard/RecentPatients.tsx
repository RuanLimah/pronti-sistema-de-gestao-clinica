import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, FileText, Calendar, MessageSquare } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";

export function RecentPatients() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getPacientesByMedico, getAtendimentosByPaciente } = useDataStore();

  const medicoId = user?.id || "";
  const pacientes = getPacientesByMedico(medicoId)
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, 5);

  const handleVerTodos = () => {
    navigate("/pacientes");
  };

  const handleVerProntuario = (pacienteId: string) => {
    navigate(`/pacientes/${pacienteId}/prontuario`);
  };

  const handleAgendar = (pacienteId: string) => {
    navigate("/agenda", { state: { pacienteId } });
  };

  const handleWhatsApp = (telefone: string, nome: string) => {
    const tel = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá ${nome}! Tudo bem?`);
    window.open(`https://wa.me/55${tel}?text=${mensagem}`, '_blank');
  };

  const getLastSession = (pacienteId: string) => {
    const atendimentos = getAtendimentosByPaciente(pacienteId)
      .filter(a => a.status === 'realizado')
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
    if (atendimentos.length === 0) return "Sem sessões";
    
    const ultima = new Date(atendimentos[0].data);
    const hoje = new Date();
    const diffDays = Math.floor((hoje.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return `Hoje, ${atendimentos[0].hora}`;
    if (diffDays === 1) return `Ontem, ${atendimentos[0].hora}`;
    return ultima.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  const getSessionsCount = (pacienteId: string) => {
    return getAtendimentosByPaciente(pacienteId).filter(a => a.status === 'realizado').length;
  };

  if (pacientes.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Pacientes Recentes</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary" onClick={handleVerTodos}>
            Ver todos
          </Button>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground text-center">
            Nenhum paciente cadastrado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Pacientes Recentes</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary" onClick={handleVerTodos}>
          Ver todos
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {pacientes.map((paciente, index) => (
          <div
            key={paciente.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 group cursor-pointer"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => handleVerProntuario(paciente.id)}
          >
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-medium">
                {paciente.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{paciente.nome}</p>
              <p className="text-sm text-muted-foreground">
                {getLastSession(paciente.id)} • {getSessionsCount(paciente.id)} sessões
              </p>
            </div>

            <Badge variant={paciente.status === 'ativo' ? "success" : "secondary"} className="hidden sm:flex">
              {paciente.status === 'ativo' ? "Ativo" : "Inativo"}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleVerProntuario(paciente.id);
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Prontuário
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleAgendar(paciente.id);
                }}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Consulta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleWhatsApp(paciente.telefone, paciente.nome);
                }}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
