// ============= PRONTI - Gerenciamento de Clientes (Admin) =============

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Plus,
  Calendar,
  DollarSign,
  HardDrive,
  Activity,
} from "lucide-react";
import { useClientStore, Client, ClientStatus, AdminActionHistory } from "@/stores/clientStore";
import { usePatientStore } from "@/stores/patientStore";
import { PLANOS, PlanTier, ADDONS } from "@/types/plans";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<ClientStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativo: { label: "Ativo", variant: "default" },
  inativo: { label: "Inativo", variant: "secondary" },
  suspenso: { label: "Suspenso", variant: "destructive" },
  bloqueado: { label: "Bloqueado", variant: "destructive" },
  trial: { label: "Trial", variant: "outline" },
};

export function ClientManagement() {
  const { toast } = useToast();
  const {
    getAllClients,
    getClient,
    getClientHistory,
    setClientStatus,
    changeClientPlan,
    toggleClientAddon,
    grantClientTrial,
  } = useClientStore();
  
  const { getPatientCountByClient, getActivePatientCountByClient } = usePatientStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [planFilter, setPlanFilter] = useState<string>("todos");
  
  // Dialogs
  const [viewDialog, setViewDialog] = useState<Client | null>(null);
  const [historyDialog, setHistoryDialog] = useState<Client | null>(null);
  const [planDialog, setPlanDialog] = useState<Client | null>(null);
  const [addonDialog, setAddonDialog] = useState<Client | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ client: Client; action: 'suspender' | 'bloquear' | 'reativar' } | null>(null);
  const [trialDialog, setTrialDialog] = useState<Client | null>(null);
  
  // Form states
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("essencial");
  const [justificativa, setJustificativa] = useState("");
  const [trialDays, setTrialDays] = useState("7");
  
  const clients = getAllClients();
  
  // Filtros
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || client.status === statusFilter;
    const matchesPlan = planFilter === "todos" || client.planoAtual === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });
  
  const handleStatusChange = () => {
    if (!statusDialog || !justificativa.trim()) {
      toast({
        title: "Erro",
        description: "Justificativa é obrigatória",
        variant: "destructive",
      });
      return;
    }
    
    const newStatus: ClientStatus = statusDialog.action === 'reativar' ? 'ativo' :
                                    statusDialog.action === 'suspender' ? 'suspenso' : 'bloqueado';
    
    setClientStatus(statusDialog.client.id, newStatus, "admin-1", "Administrador", justificativa);
    
    toast({
      title: "Status atualizado",
      description: `Cliente ${statusDialog.action === 'reativar' ? 'reativado' : statusDialog.action === 'suspender' ? 'suspenso' : 'bloqueado'} com sucesso.`,
    });
    
    setStatusDialog(null);
    setJustificativa("");
  };
  
  const handlePlanChange = () => {
    if (!planDialog) return;
    
    changeClientPlan(planDialog.id, selectedPlan, "admin-1", "Administrador");
    
    toast({
      title: "Plano alterado",
      description: `Plano do cliente alterado para ${PLANOS[selectedPlan].nome}.`,
    });
    
    setPlanDialog(null);
  };
  
  const handleToggleAddon = (clienteId: string, addonType: keyof typeof ADDONS, ativar: boolean) => {
    toggleClientAddon(clienteId, addonType, ativar, "admin-1", "Administrador");
    
    toast({
      title: ativar ? "Add-on ativado" : "Add-on desativado",
      description: `${ADDONS[addonType].nome} ${ativar ? 'ativado' : 'desativado'} com sucesso.`,
    });
  };
  
  const handleGrantTrial = () => {
    if (!trialDialog) return;
    
    const days = parseInt(trialDays);
    if (isNaN(days) || days < 1 || days > 90) {
      toast({
        title: "Erro",
        description: "Dias de trial inválido (1-90)",
        variant: "destructive",
      });
      return;
    }
    
    grantClientTrial(trialDialog.id, days, "admin-1", "Administrador");
    
    toast({
      title: "Trial concedido",
      description: `Trial de ${days} dias concedido para ${trialDialog.nome}.`,
    });
    
    setTrialDialog(null);
    setTrialDays("7");
  };
  
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
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {clients.filter(c => c.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Trial</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {clients.filter(c => c.status === 'trial').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {clients.filter(c => c.status === 'ativo').reduce((sum, c) => sum + c.valorMensal, 0).toFixed(2)}
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
                <SelectItem value="trial">Trial</SelectItem>
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
                <SelectItem value="gratuito">Gratuito</SelectItem>
                <SelectItem value="essencial">Essencial</SelectItem>
                <SelectItem value="profissional">Profissional</SelectItem>
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
                <TableHead>Pacientes</TableHead>
                <TableHead>Valor Mensal</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
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
                      {PLANOS[client.planoAtual].nome}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[client.status].variant}>
                      {statusConfig[client.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{getActivePatientCountByClient(client.id)}</span>
                      <span className="text-muted-foreground"> / {getPatientCountByClient(client.id)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">R$ {client.valorMensal.toFixed(2)}</span>
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
                        
                        <DropdownMenuItem onClick={() => setHistoryDialog(client)}>
                          <History className="mr-2 h-4 w-4" />
                          Histórico
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => setPlanDialog(client)}>
                          <Crown className="mr-2 h-4 w-4" />
                          Gerenciar plano
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => setAddonDialog(client)}>
                          <Zap className="mr-2 h-4 w-4" />
                          Gerenciar add-ons
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => setTrialDialog(client)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Conceder trial
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {client.status === 'ativo' || client.status === 'trial' ? (
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
              ))}
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
                  <Label className="text-muted-foreground">Telefone</Label>
                  <p className="font-medium">{viewDialog.telefone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Especialidade</Label>
                  <p className="font-medium">{viewDialog.especialidade || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">CRP</Label>
                  <p className="font-medium">{viewDialog.crp || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={statusConfig[viewDialog.status].variant}>
                    {statusConfig[viewDialog.status].label}
                  </Badge>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Plano e Assinatura</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Plano Atual</Label>
                    <p className="font-medium">{PLANOS[viewDialog.planoAtual].nome}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Valor Mensal</Label>
                    <p className="font-medium">R$ {viewDialog.valorMensal.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Início do Plano</Label>
                    <p className="font-medium">{format(new Date(viewDialog.planoDataInicio), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                  {viewDialog.trialFim && (
                    <div>
                      <Label className="text-muted-foreground">Fim do Trial</Label>
                      <p className="font-medium">{format(new Date(viewDialog.trialFim), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Add-ons</h4>
                <div className="flex flex-wrap gap-2">
                  {viewDialog.addons.map(addon => (
                    <Badge
                      key={addon.addonType}
                      variant={addon.status === 'ativo' ? 'default' : addon.status === 'bloqueado_por_plano' ? 'destructive' : 'outline'}
                    >
                      {ADDONS[addon.addonType].nome}: {addon.status}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Métricas</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{viewDialog.totalPacientes}</p>
                    <p className="text-xs text-muted-foreground">Total Pacientes</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{viewDialog.pacientesAtivos}</p>
                    <p className="text-xs text-muted-foreground">Ativos</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{viewDialog.atendimentosMes}</p>
                    <p className="text-xs text-muted-foreground">Atend./Mês</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{(viewDialog.armazenamentoUsadoMB / 1024).toFixed(1)} GB</p>
                    <p className="text-xs text-muted-foreground">Armazenamento</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Histórico */}
      <Dialog open={!!historyDialog} onOpenChange={() => setHistoryDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Ações - {historyDialog?.nome}</DialogTitle>
          </DialogHeader>
          
          {historyDialog && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {getClientHistory(historyDialog.id).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma ação registrada
                  </p>
                ) : (
                  getClientHistory(historyDialog.id).map((action: AdminActionHistory) => (
                    <div key={action.id} className="flex gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{action.descricao}</p>
                        <div className="flex gap-2 mt-1 text-sm text-muted-foreground">
                          <span>Por: {action.adminNome}</span>
                          <span>•</span>
                          <span>{format(new Date(action.criadoEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Gerenciar Plano */}
      <Dialog open={!!planDialog} onOpenChange={() => setPlanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Plano</DialogTitle>
            <DialogDescription>
              Altere o plano de {planDialog?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plano atual</Label>
              <Badge variant="outline">{planDialog && PLANOS[planDialog.planoAtual].nome}</Badge>
            </div>
            
            <div className="space-y-2">
              <Label>Novo plano</Label>
              <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PLANOS).map(plan => (
                    <SelectItem key={plan.tier} value={plan.tier}>
                      {plan.nome} - R$ {plan.valor.toFixed(2)}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(null)}>Cancelar</Button>
            <Button onClick={handlePlanChange}>Alterar Plano</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Gerenciar Add-ons */}
      <Dialog open={!!addonDialog} onOpenChange={() => setAddonDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Add-ons</DialogTitle>
            <DialogDescription>
              Ative ou desative add-ons para {addonDialog?.nome}
            </DialogDescription>
          </DialogHeader>
          
          {addonDialog && (
            <div className="space-y-4 py-4">
              {addonDialog.addons.map(addon => {
                const addonInfo = ADDONS[addon.addonType];
                const isBlocked = addon.status === 'bloqueado_por_plano';
                const isActive = addon.status === 'ativo';
                
                return (
                  <div key={addon.addonType} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{addonInfo.nome}</p>
                      <p className="text-sm text-muted-foreground">R$ {addonInfo.valor.toFixed(2)}/mês</p>
                    </div>
                    
                    {isBlocked ? (
                      <Badge variant="destructive">Bloqueado pelo plano</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant={isActive ? "default" : "outline"}>
                          {isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button
                          size="sm"
                          variant={isActive ? "destructive" : "default"}
                          onClick={() => handleToggleAddon(addonDialog.id, addon.addonType, !isActive)}
                        >
                          {isActive ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Status (Suspender/Bloquear/Reativar) */}
      <Dialog open={!!statusDialog} onOpenChange={() => { setStatusDialog(null); setJustificativa(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusDialog?.action === 'reativar' ? 'Reativar' :
               statusDialog?.action === 'suspender' ? 'Suspender' : 'Bloquear'} Cliente
            </DialogTitle>
            <DialogDescription>
              {statusDialog?.action === 'reativar'
                ? `Reativar a conta de ${statusDialog?.client.nome}`
                : `${statusDialog?.action === 'suspender' ? 'Suspender' : 'Bloquear'} a conta de ${statusDialog?.client.nome}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Justificativa (obrigatória)</Label>
              <Textarea
                placeholder="Descreva o motivo..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStatusDialog(null); setJustificativa(""); }}>
              Cancelar
            </Button>
            <Button
              variant={statusDialog?.action === 'reativar' ? 'default' : 'destructive'}
              onClick={handleStatusChange}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Conceder Trial */}
      <Dialog open={!!trialDialog} onOpenChange={() => setTrialDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conceder Trial</DialogTitle>
            <DialogDescription>
              Conceder período de trial para {trialDialog?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dias de trial</Label>
              <Input
                type="number"
                min="1"
                max="90"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrialDialog(null)}>Cancelar</Button>
            <Button onClick={handleGrantTrial}>Conceder Trial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
