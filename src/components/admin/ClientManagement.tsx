import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  MoreVertical,
  Eye,
  History,
  Crown,
  Zap,
  UserX,
  UserCheck,
  Ban,
  Users,
  Search,
  Calendar,
  DollarSign,
  Settings,
  Activity,
  Sliders,
  Plus
} from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import { Doctor, DoctorStatus } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DoctorModulesDialog } from "./DoctorModulesDialog";
import { DoctorLimitsDialog } from "./DoctorLimitsDialog";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativo: { label: "Ativo", variant: "default" },
  inativo: { label: "Inativo", variant: "secondary" },
  suspenso: { label: "Suspenso", variant: "destructive" },
  bloqueado: { label: "Bloqueado", variant: "destructive" },
  trial: { label: "Trial", variant: "outline" },
};

export function ClientManagement() {
  const { toast } = useToast();
  const {
    doctors,
    plans,
    addons: availableAddons,
    fetchDoctors,
    fetchPlans,
    fetchAddons,
    updateDoctorStatus,
    updateDoctorPlan,
    toggleDoctorAddon,
    isLoading
  } = useAdminStore();
  
  // Load data on mount
  useEffect(() => {
    fetchDoctors();
    fetchPlans();
    fetchAddons();
  }, [fetchDoctors, fetchPlans, fetchAddons]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [planFilter, setPlanFilter] = useState<string>("todos");
  
  // Dialogs
  const [viewDialog, setViewDialog] = useState<Doctor | null>(null);
  const [planDialog, setPlanDialog] = useState<Doctor | null>(null);
  const [addonDialog, setAddonDialog] = useState<Doctor | null>(null);
  const [modulesDialog, setModulesDialog] = useState<Doctor | null>(null);
  const [limitsDialog, setLimitsDialog] = useState<Doctor | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ client: Doctor; action: 'suspender' | 'bloquear' | 'reativar' } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Form states
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [justificativa, setJustificativa] = useState("");
  
  // Filtros
  const filteredClients = doctors.filter(client => {
    const matchesSearch = client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || client.status === statusFilter;
    const matchesPlan = planFilter === "todos" || client.plano === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });
  
  const handleStatusChange = async () => {
    if (!statusDialog || !justificativa.trim()) {
      toast({
        title: "Erro",
        description: "Justificativa é obrigatória",
        variant: "destructive",
      });
      return;
    }
    
    const newStatus: DoctorStatus = statusDialog.action === 'reativar' ? 'ativo' :
                                    statusDialog.action === 'suspender' ? 'suspenso' : 'bloqueado';
    
    await updateDoctorStatus(statusDialog.client.id, newStatus, justificativa);
    
    toast({
      title: "Status atualizado",
      description: `Cliente ${statusDialog.action === 'reativar' ? 'reativado' : statusDialog.action === 'suspender' ? 'suspenso' : 'bloqueado'} com sucesso.`,
    });
    
    setStatusDialog(null);
    setJustificativa("");
  };
  
  const handlePlanChange = async () => {
    if (!planDialog || !selectedPlan) return;
    
    await updateDoctorPlan(planDialog.id, selectedPlan);
    
    const planName = plans.find(p => p.id === selectedPlan || p.tier === selectedPlan)?.nome || selectedPlan;

    toast({
      title: "Plano alterado",
      description: `Plano do cliente alterado para ${planName}.`,
    });
    
    setPlanDialog(null);
  };
  
  const handleToggleAddon = async (clienteId: string, addonSlug: string, ativar: boolean) => {
    await toggleDoctorAddon(clienteId, addonSlug, ativar);
    
    const addonName = availableAddons.find(a => a.slug === addonSlug)?.nome || addonSlug;

    toast({
      title: ativar ? "Add-on ativado" : "Add-on desativado",
      description: `${addonName} ${ativar ? 'ativado' : 'desativado'} com sucesso.`,
    });
  };

  // Helper to get plan details
  const getPlanDetails = (planIdentifier: string) => {
    return plans.find(p => p.tier === planIdentifier || p.id === planIdentifier) || { nome: planIdentifier, valor: 0 };
  };

  // Calculate stats
  const totalRevenue = doctors.reduce((sum, client) => {
    if (client.status !== 'ativo') return sum;
    const plan = getPlanDetails(client.plano);
    // Add addon prices if needed, for now just plan
    return sum + (plan.valor || 0);
  }, 0);
  
  return (
    <div className="space-y-6">
      {/* Header com métricas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctors.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {doctors.filter(c => c.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bloqueados/Suspensos</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {doctors.filter(c => c.status === 'bloqueado' || c.status === 'suspenso').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>Gerencie os profissionais cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos planos</SelectItem>
                {plans.map(plan => (
                   <SelectItem key={plan.id} value={plan.tier}>{plan.nome}</SelectItem>
                ))}
                <SelectItem value="basico">Básico</SelectItem>
                <SelectItem value="profissional">Profissional</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="clinica">Clínica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Tabela */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Módulos Ativos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-4">Carregando...</TableCell>
                 </TableRow>
              ) : filteredClients.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-4">Nenhum cliente encontrado.</TableCell>
                 </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const planDetails = getPlanDetails(client.plano);
                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.nome}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Crown className="h-3 w-3" />
                          {planDetails.nome}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[client.status]?.variant || 'default'}>
                          {statusConfig[client.status]?.label || client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                           {Object.entries(client.modules).filter(([_, active]) => active).slice(0, 3).map(([key]) => (
                             <Badge key={key} variant="secondary" className="text-xs">{key}</Badge>
                           ))}
                           {Object.values(client.modules).filter(Boolean).length > 3 && (
                             <Badge variant="secondary" className="text-xs">+{Object.values(client.modules).filter(Boolean).length - 3}</Badge>
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => setViewDialog(client)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver mais
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => {
                              setSelectedPlan(client.plano);
                              setPlanDialog(client);
                            }}>
                              <Crown className="mr-2 h-4 w-4" />
                              Gerenciar plano
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => setModulesDialog(client)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Gerenciar módulos
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => setLimitsDialog(client)}>
                              <Sliders className="mr-2 h-4 w-4" />
                              Gerenciar limites
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => setAddonDialog(client)}>
                              <Zap className="mr-2 h-4 w-4" />
                              Gerenciar add-ons
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {client.status === 'ativo' ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setStatusDialog({ client, action: 'suspender' })}
                                  className="text-amber-600"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Suspender
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setStatusDialog({ client, action: 'bloquear' })}
                                  className="text-destructive"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Bloquear
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setStatusDialog({ client, action: 'reativar' })}
                                className="text-green-600"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Reativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Dialog: Ver mais */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          
          {viewDialog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nome</Label>
                  <p className="font-medium">{viewDialog.nome}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{viewDialog.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={statusConfig[viewDialog.status]?.variant || 'default'}>
                    {statusConfig[viewDialog.status]?.label || viewDialog.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Criado em</Label>
                  <p className="font-medium">{format(new Date(viewDialog.criadoEm), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Plano e Módulos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Plano Atual</Label>
                    <p className="font-medium">{getPlanDetails(viewDialog.plano).nome}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Módulos Ativos</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(viewDialog.modules).map(([key, active]) => (
                        <Badge key={key} variant={active ? "default" : "outline"} className="text-xs">
                          {key}: {active ? "Sim" : "Não"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Add-ons Ativos</h4>
                <div className="flex flex-wrap gap-2">
                  {viewDialog.addons && viewDialog.addons.length > 0 ? (
                    viewDialog.addons.map(slug => {
                      const addon = availableAddons.find(a => a.slug === slug);
                      return (
                        <Badge key={slug} variant="secondary">
                          {addon ? addon.nome : slug}
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum add-on ativo.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Gerenciar Plano */}
      <Dialog open={!!planDialog} onOpenChange={() => setPlanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione o novo plano</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                     <SelectItem key={plan.id} value={plan.tier}>{plan.nome} (R$ {plan.valor})</SelectItem>
                  ))}
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="clinica">Clínica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handlePlanChange} className="w-full">
              Confirmar Alteração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Gerenciar Add-ons */}
      <Dialog open={!!addonDialog} onOpenChange={() => setAddonDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Add-ons</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {availableAddons.length === 0 ? (
               <p className="text-center text-muted-foreground">Nenhum add-on disponível no sistema.</p>
            ) : (
               availableAddons.map(addon => {
                 const isAtivo = addonDialog?.addons?.includes(addon.slug);
                 return (
                   <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                     <div>
                       <p className="font-medium">{addon.nome}</p>
                       <p className="text-sm text-muted-foreground">R$ {addon.valor}</p>
                     </div>
                     <Button 
                       variant={isAtivo ? "destructive" : "default"}
                       size="sm"
                       onClick={() => addonDialog && handleToggleAddon(addonDialog.id, addon.slug, !isAtivo)}
                     >
                       {isAtivo ? "Desativar" : "Ativar"}
                     </Button>
                   </div>
                 );
               })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Gerenciar Módulos */}
      <DoctorModulesDialog 
        doctor={modulesDialog} 
        open={!!modulesDialog} 
        onOpenChange={(open) => !open && setModulesDialog(null)} 
      />

      {/* Dialog: Gerenciar Limites */}
      <DoctorLimitsDialog 
        doctor={limitsDialog} 
        open={!!limitsDialog} 
        onOpenChange={(open) => !open && setLimitsDialog(null)} 
      />
      
      {/* Dialog: Novo Cliente Info */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
              <Activity className="h-5 w-5" />
              <p className="text-sm">
                A criação manual de clientes via painel administrativo requer integração com backend.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Para adicionar um novo cliente, peça para o usuário se cadastrar na página de registro ou use a API do Supabase diretamente.
            </p>
            <Button onClick={() => setCreateDialogOpen(false)} className="w-full">
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Status */}
      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusDialog?.action === 'suspender' ? 'Suspender Cliente' : 
               statusDialog?.action === 'bloquear' ? 'Bloquear Cliente' : 'Reativar Cliente'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Justificativa</Label>
              <Input 
                value={justificativa} 
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Motivo da alteração de status..."
              />
            </div>
            
            <Button 
              onClick={handleStatusChange} 
              className="w-full"
              variant={statusDialog?.action === 'bloquear' ? "destructive" : "default"}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

