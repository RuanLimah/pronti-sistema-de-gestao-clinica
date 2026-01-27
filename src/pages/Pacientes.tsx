import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  FileText,
  Filter,
  MessageCircle,
  Calendar,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDataStore, Paciente } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";


// Tipos para filtros
interface Filters {
  nome: string;
  status: "todos" | "ativo" | "inativo";
  ordenacao: "nome-asc" | "nome-desc" | "recentes" | "antigos";
  valorMaximo: string;
}

const defaultFilters: Filters = {
  nome: "",
  status: "todos",
  ordenacao: "nome-asc",
  valorMaximo: "",
};

export default function Pacientes() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getPacientesByMedico, addPaciente, deletePaciente, togglePacienteStatus } = useDataStore();

  // Estados do modal de novo paciente
  const [criandoPaciente, setCriandoPaciente] = useState(false);
  const [formPaciente, setFormPaciente] = useState({
    nome: "",
    telefone: "",
    email: "",
    valorConsulta: "",
  });

  // Estados do modal de filtro
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [tempFilters, setTempFilters] = useState<Filters>(defaultFilters);

  // Busca rápida (fora do modal)
  const [searchQuery, setSearchQuery] = useState("");

  // Estado para confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pacienteToDelete, setPacienteToDelete] = useState<Paciente | null>(null);

  // Buscar pacientes do médico logado
  const pacientes = useMemo(() => {
    if (!user?.id) return [];
    return getPacientesByMedico(user.id);
  }, [user?.id, getPacientesByMedico]);

  // Aplicar filtros + busca
  const filteredPatients = useMemo(() => {
    let result = [...pacientes];

    // Busca rápida por nome
    if (searchQuery.trim()) {
      result = result.filter((p) =>
        p.nome.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por nome (do modal)
    if (filters.nome.trim()) {
      result = result.filter((p) =>
        p.nome.toLowerCase().includes(filters.nome.toLowerCase())
      );
    }

    // Filtro por status
    if (filters.status !== "todos") {
      result = result.filter((p) => p.status === filters.status);
    }

    // Filtro por valor máximo da consulta
    if (filters.valorMaximo) {
      const max = parseFloat(filters.valorMaximo);
      if (!isNaN(max)) {
        result = result.filter((p) => (p.valorConsulta ?? 0) <= max);
      }
    }

    // Ordenação
    result.sort((a, b) => {
      switch (filters.ordenacao) {
        case "nome-asc":
          return a.nome.localeCompare(b.nome);
        case "nome-desc":
          return b.nome.localeCompare(a.nome);
        case "recentes":
          return (b.criadoEm ? new Date(b.criadoEm).getTime() : 0) -
                (a.criadoEm ? new Date(a.criadoEm).getTime() : 0);
        case "antigos":
          return (a.criadoEm ? new Date(a.criadoEm).getTime() : 0) -
                (b.criadoEm ? new Date(b.criadoEm).getTime() : 0);
        default:
          return 0;
      }
    });

    return result;
  }, [pacientes, searchQuery, filters]);

  const stats = useMemo(() => ({
    total: pacientes.length,
    active: pacientes.filter((p) => p.status === "ativo").length,
    inactive: pacientes.filter((p) => p.status === "inativo").length,
  }), [pacientes]);

  // Handlers
  function handleVerProntuario(patientId: string) {
    navigate(`/pacientes/${patientId}/prontuario`);
  }

  function handleChangePaciente(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormPaciente((prev) => ({ ...prev, [name]: value }));
  }

  function handleSalvarPaciente() {
    if (!formPaciente.nome.trim() || !formPaciente.telefone.trim()) {
      toast.error("Nome e telefone são obrigatórios");
      return;
    }

    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    addPaciente({
      medicoId: user.id,
      nome: formPaciente.nome,
      telefone: formPaciente.telefone,
      email: formPaciente.email || undefined,
      valorConsulta: formPaciente.valorConsulta ? parseFloat(formPaciente.valorConsulta) : undefined,
      status: "ativo",
    });

    toast.success("Paciente cadastrado com sucesso!");
    setFormPaciente({ nome: "", telefone: "", email: "", valorConsulta: "" });
    setCriandoPaciente(false);
  }

  function handleOpenFilter() {
    setTempFilters(filters);
    setIsFilterOpen(true);
  }

  function handleApplyFilters() {
    setFilters(tempFilters);
    setIsFilterOpen(false);
    toast.success("Filtros aplicados");
  }

  function handleClearFilters() {
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setIsFilterOpen(false);
    toast.info("Filtros limpos");
  }

  function handleWhatsApp(telefone: string, nome: string) {
    const phone = telefone.replace(/\D/g, "");
    const message = encodeURIComponent(`Olá ${nome}! Aqui é do consultório PRONTI.`);
    window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");
  }

  function handleStatusFilter(status: "all" | "active" | "inactive") {
    if (status === "all") {
      setFilters(prev => ({ ...prev, status: "todos" }));
    } else if (status === "active") {
      setFilters(prev => ({ ...prev, status: "ativo" }));
    } else {
      setFilters(prev => ({ ...prev, status: "inativo" }));
    }
  }

  // Excluir paciente
  function handleDeletePaciente(paciente: Paciente) {
    setPacienteToDelete(paciente);
    setDeleteDialogOpen(true);
  }

  function confirmDeletePaciente() {
    if (pacienteToDelete) {
      deletePaciente(pacienteToDelete.id);
      toast.success(`Paciente ${pacienteToDelete.nome} excluído com sucesso!`);
      setPacienteToDelete(null);
      setDeleteDialogOpen(false);
    }
  }

  // Ativar/Inativar paciente
  function handleToggleStatus(paciente: Paciente) {
    togglePacienteStatus(paciente.id);
    const novoStatus = paciente.status === 'ativo' ? 'inativo' : 'ativo';
    toast.success(`Paciente ${paciente.nome} ${novoStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso!`);
  }

  const hasActiveFilters = 
    filters.nome !== "" || 
    filters.status !== "todos" || 
    filters.ordenacao !== "nome-asc" || 
    filters.valorMaximo !== "";

  return (
    <DashboardLayout title="Pacientes" subtitle="Gerencie seus pacientes">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            variant="interactive"
            className={cn("cursor-pointer", filters.status === "todos" && "ring-2 ring-primary")}
            onClick={() => handleStatusFilter("all")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card
            variant="interactive"
            className={cn("cursor-pointer", filters.status === "ativo" && "ring-2 ring-success")}
            onClick={() => handleStatusFilter("active")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <FileText className="h-8 w-8 text-success" />
            </CardContent>
          </Card>

          <Card
            variant="interactive"
            className={cn("cursor-pointer", filters.status === "inativo" && "ring-2 ring-muted-foreground")}
            onClick={() => handleStatusFilter("inactive")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Search + Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pacientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <Button 
              variant={hasActiveFilters ? "default" : "outline"} 
              size="sm" 
              onClick={handleOpenFilter}
              className="gap-2 shrink-0"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtro</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  !
                </Badge>
              )}
            </Button>

          </div>

          <Button variant="hero" size="sm" onClick={() => setCriandoPaciente(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:inline">Novo Paciente</span>
          </Button>
        </div>

        {/* Modal Novo Paciente */}
        <Dialog open={criandoPaciente} onOpenChange={setCriandoPaciente}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Paciente</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo paciente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  name="nome"
                  placeholder="Nome completo"
                  value={formPaciente.nome}
                  onChange={handleChangePaciente}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  placeholder="(00) 00000-0000"
                  value={formPaciente.telefone}
                  onChange={handleChangePaciente}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formPaciente.email}
                  onChange={handleChangePaciente}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorConsulta">Valor da Consulta</Label>
                <Input
                  id="valorConsulta"
                  name="valorConsulta"
                  type="number"
                  placeholder="150.00"
                  value={formPaciente.valorConsulta}
                  onChange={handleChangePaciente}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCriandoPaciente(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarPaciente}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Filtro */}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtrar Pacientes</DialogTitle>
              <DialogDescription>
                Configure os filtros para encontrar pacientes específicos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Busca por nome */}
              <div className="space-y-2">
                <Label htmlFor="filter-nome">🔍 Busca por nome</Label>
                <Input
                  id="filter-nome"
                  placeholder="Digite o nome..."
                  value={tempFilters.nome}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>📌 Status</Label>
                <Select
                  value={tempFilters.status}
                  onValueChange={(value: Filters["status"]) => 
                    setTempFilters(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ordenação */}
              <div className="space-y-2">
                <Label>↕️ Ordenação</Label>
                <Select
                  value={tempFilters.ordenacao}
                  onValueChange={(value: Filters["ordenacao"]) => 
                    setTempFilters(prev => ({ ...prev, ordenacao: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nome-asc">Nome A–Z</SelectItem>
                    <SelectItem value="nome-desc">Nome Z–A</SelectItem>
                    <SelectItem value="recentes">Mais recentes</SelectItem>
                    <SelectItem value="antigos">Mais antigos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valor máximo */}
              <div className="space-y-2">
                <Label htmlFor="filter-valor">💰 Valor máximo da consulta</Label>
                <Input
                  id="filter-valor"
                  type="number"
                  placeholder="Ex: 200"
                  value={tempFilters.valorMaximo}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, valorMaximo: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="ghost" onClick={handleClearFilters} className="w-full sm:w-auto">
                Limpar filtros
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setIsFilterOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleApplyFilters} className="flex-1">
                  Aplicar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Paciente</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o paciente <strong>{pacienteToDelete?.nome}</strong>?
                <br /><br />
                Esta ação é irreversível e irá remover:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Todos os dados do paciente</li>
                  <li>Histórico de atendimentos</li>
                  <li>Evoluções clínicas</li>
                  <li>Registros de pagamentos</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeletePaciente}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir Paciente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Lista de Pacientes */}
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {pacientes.length === 0 
                ? "Nenhum paciente cadastrado. Clique em 'Novo Paciente' para começar."
                : "Nenhum paciente encontrado com os filtros aplicados."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} variant="interactive">
                <CardContent className="p-5">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {patient.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 
                          className="font-medium cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleVerProntuario(patient.id)}
                        >
                          {patient.nome}
                        </h3>
                        <Badge variant={patient.status === "ativo" ? "success" : "secondary"}>
                          {patient.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleVerProntuario(patient.id)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Prontuário
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/agenda")}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar Consulta
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleWhatsApp(patient.telefone, patient.nome)}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Enviar WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(patient)}>
                          {patient.status === 'ativo' ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Inativar Paciente
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Ativar Paciente
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeletePaciente(patient)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Paciente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="text-sm space-y-1 text-muted-foreground">
                    <a 
                      href={`tel:+55${patient.telefone.replace(/\D/g, "")}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <Phone className="h-4 w-4" /> {patient.telefone}
                    </a>
                    {patient.email && (
                      <a 
                        href={`mailto:${patient.email}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4" /> {patient.email}
                      </a>
                    )}
                    {patient.valorConsulta && (
                      <p className="text-xs mt-1">
                        Consulta: R$ {patient.valorConsulta.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate("/agenda")}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Agendar
                    </Button>

                    <Button
                      variant="soft"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleVerProntuario(patient.id)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Prontuário
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
