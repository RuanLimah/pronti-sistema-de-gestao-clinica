import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CalendarPlus, 
  UserPlus, 
  MessageSquarePlus, 
  Receipt,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataStore, Paciente, Atendimento } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";

type ActionType = "novo-atendimento" | "novo-paciente" | "enviar-lembrete" | "registrar-pagamento";

interface QuickAction {
  icon: typeof CalendarPlus;
  label: string;
  description: string;
  color: "primary" | "success" | "warning" | "destructive";
  action: ActionType;
}

const colorStyles = {
  primary: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  success: "bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground",
  warning: "bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground",
};

const actions: QuickAction[] = [
  {
    icon: CalendarPlus,
    label: "Novo Atendimento",
    description: "Agendar consulta",
    color: "primary",
    action: "novo-atendimento",
  },
  {
    icon: UserPlus,
    label: "Novo Paciente",
    description: "Cadastrar paciente",
    color: "success",
    action: "novo-paciente",
  },
  {
    icon: MessageSquarePlus,
    label: "Enviar Lembrete",
    description: "WhatsApp",
    color: "warning",
    action: "enviar-lembrete",
  },
  {
    icon: Receipt,
    label: "Registrar Pagamento",
    description: "Financeiro",
    color: "primary",
    action: "registrar-pagamento",
  },
];

export function QuickActions() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    getPacientesByMedico, 
    getAtendimentosByMedico,
    addPaciente, 
    addAtendimento, 
    addPagamento,
    verificarHorarioDisponivel
  } = useDataStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionType | null>(null);

  // Form states
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [selectedAtendimento, setSelectedAtendimento] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    data: "",
    hora: "",
    valor: "",
    formaPagamento: "pix" as "pix" | "cartao" | "dinheiro" | "transferencia",
  });

  const medicoId = user?.id || "";
  const pacientes = getPacientesByMedico(medicoId);
  const atendimentos = getAtendimentosByMedico(medicoId).filter(a => a.status === 'agendado' || a.status === 'realizado');

  const handleActionClick = (action: ActionType) => {
    setCurrentAction(action);
    setDialogOpen(true);
    setSelectedPaciente("");
    setSelectedAtendimento("");
    setFormData({
      nome: "",
      telefone: "",
      email: "",
      data: new Date().toISOString().split('T')[0],
      hora: "",
      valor: "",
      formaPagamento: "pix",
    });
  };

  const handleSubmit = async () => {
    if (!medicoId) return;

    switch (currentAction) {
      case "novo-atendimento":
        if (!selectedPaciente || !formData.data || !formData.hora) {
          toast({
            title: "Erro",
            description: "Preencha todos os campos obrigatórios",
            variant: "destructive",
          });
          return;
        }
        
        const paciente = pacientes.find(p => p.id === selectedPaciente);
        const result = await addAtendimento({
          pacienteId: selectedPaciente,
          medicoId,
          data: new Date(formData.data),
          hora: formData.hora,
          status: 'agendado',
          valor: paciente?.valorConsulta || 200,
        });
        
        if (result.success) {
          toast({
            title: "Sucesso",
            description: "Atendimento agendado com sucesso!",
          });
        } else {
          toast({
            title: "Erro ao agendar",
            description: result.error || "Não foi possível agendar o atendimento.",
            variant: "destructive",
            duration: 5000
          });
          return;
        }
        break;

      case "novo-paciente":
        if (!formData.nome || !formData.telefone) {
          toast({
            title: "Erro",
            description: "Nome e telefone são obrigatórios",
            variant: "destructive",
          });
          return;
        }
        try {
          await addPaciente({
            medicoId,
            nome: formData.nome,
            telefone: formData.telefone,
            email: formData.email || undefined,
            status: 'ativo',
            valorConsulta: 200,
          });
          toast({
            title: "Sucesso",
            description: "Paciente cadastrado com sucesso!",
          });
          navigate("/pacientes");
        } catch (error) {
          console.error("Erro ao cadastrar paciente:", error);
          toast({
            title: "Erro",
            description: "Não foi possível cadastrar o paciente.",
            variant: "destructive",
          });
          return;
        }
        break;

      case "enviar-lembrete":
        if (!selectedPaciente) {
          toast({
            title: "Erro",
            description: "Selecione um paciente",
            variant: "destructive",
          });
          return;
        }
        const pacienteLembrete = pacientes.find(p => p.id === selectedPaciente);
        if (pacienteLembrete) {
          const telefone = pacienteLembrete.telefone.replace(/\D/g, '');
          const mensagem = encodeURIComponent(
            `Olá ${pacienteLembrete.nome}! Este é um lembrete da sua consulta. Aguardo você!`
          );
          window.open(`https://wa.me/55${telefone}?text=${mensagem}`, '_blank');
        }
        break;

      case "registrar-pagamento":
        if (!selectedPaciente || !formData.valor) {
          toast({
            title: "Erro",
            description: "Selecione um paciente e informe o valor",
            variant: "destructive",
          });
          return;
        }
        try {
          await addPagamento({
            pacienteId: selectedPaciente,
            atendimentoId: selectedAtendimento || undefined,
            valor: parseFloat(formData.valor),
            formaPagamento: formData.formaPagamento,
            status: 'pendente',
            data: new Date(),
          });
          toast({
            title: "Sucesso",
            description: "Pagamento registrado com sucesso!",
          });
          navigate("/financeiro");
        } catch (error) {
          console.error("Erro ao registrar pagamento:", error);
          toast({
            title: "Erro",
            description: "Não foi possível registrar o pagamento.",
            variant: "destructive",
          });
          return;
        }
        break;
    }

    setDialogOpen(false);
  };

  const getDialogTitle = () => {
    switch (currentAction) {
      case "novo-atendimento": return "Novo Atendimento";
      case "novo-paciente": return "Novo Paciente";
      case "enviar-lembrete": return "Enviar Lembrete";
      case "registrar-pagamento": return "Registrar Pagamento";
      default: return "";
    }
  };

  const pacienteAtendimentos = selectedPaciente
    ? atendimentos.filter(a => a.pacienteId === selectedPaciente)
    : [];

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={action.label}
              onClick={() => handleActionClick(action.action)}
              className="group flex items-center gap-3 p-4 rounded-xl border border-transparent hover:border-border bg-muted/30 hover:bg-muted/50 transition-all duration-200 text-left"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                "p-2.5 rounded-lg transition-all duration-200",
                colorStyles[action.color]
              )}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {currentAction === "novo-paciente" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </>
            )}

            {currentAction === "novo-atendimento" && (
              <>
                <div className="space-y-2">
                  <Label>Paciente *</Label>
                  <Select value={selectedPaciente} onValueChange={setSelectedPaciente}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.filter(p => p.status === 'ativo').map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora">Hora *</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={formData.hora}
                      onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {currentAction === "enviar-lembrete" && (
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <Select value={selectedPaciente} onValueChange={setSelectedPaciente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.filter(p => p.status === 'ativo').map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPaciente && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Uma mensagem de lembrete será enviada via WhatsApp para o paciente selecionado.
                  </p>
                )}
              </div>
            )}

            {currentAction === "registrar-pagamento" && (
              <>
                <div className="space-y-2">
                  <Label>Paciente *</Label>
                  <Select value={selectedPaciente} onValueChange={(value) => {
                    setSelectedPaciente(value);
                    setSelectedAtendimento("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPaciente && pacienteAtendimentos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Vincular a Atendimento (opcional)</Label>
                    <Select value={selectedAtendimento} onValueChange={setSelectedAtendimento}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um atendimento" />
                      </SelectTrigger>
                      <SelectContent>
                        {pacienteAtendimentos.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {new Date(a.data).toLocaleDateString('pt-BR')} - {a.hora}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor *</Label>
                    <Input
                      id="valor"
                      type="number"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      placeholder="200.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select 
                      value={formData.formaPagamento} 
                      onValueChange={(value: "pix" | "cartao" | "dinheiro" | "transferencia") => 
                        setFormData({ ...formData, formaPagamento: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {currentAction === "enviar-lembrete" ? "Abrir WhatsApp" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
