// ============= PRONTI - Gerenciador Central de Add-ons (Admin) =============

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
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  MessageSquare,
  HardDrive,
  BarChart3,
  Settings,
  Users,
  TrendingUp,
  DollarSign,
  Check,
  X,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useAddonManagerStore, GlobalAddon, AddonSystemStatus } from "@/stores/addonManagerStore";
import { useClientStore } from "@/stores/clientStore";
import { ADDONS, AddonType } from "@/types/plans";
import { useToast } from "@/hooks/use-toast";

const addonIcons: Record<AddonType, React.ReactNode> = {
  whatsapp_avancado: <MessageSquare className="h-5 w-5" />,
  armazenamento_extra: <HardDrive className="h-5 w-5" />,
  relatorios_avancados: <BarChart3 className="h-5 w-5" />,
};

const statusLabels: Record<AddonSystemStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  disponivel: { label: "Disponível", variant: "outline" },
  ativo: { label: "Ativo", variant: "default" },
  inativo: { label: "Inativo", variant: "secondary" },
  bloqueado_por_plano: { label: "Bloqueado", variant: "destructive" },
  manutencao: { label: "Manutenção", variant: "secondary" },
};

export function AddonCentralManager() {
  const { toast } = useToast();
  const {
    getAllAddons,
    getAddonsUsageStats,
    setAddonGlobalStatus,
    updateAddonPricing,
    getAllClientAddons,
    activateAddon,
    deactivateAddon,
  } = useAddonManagerStore();
  
  const { getAllClients, getClient } = useClientStore();
  
  const [selectedAddon, setSelectedAddon] = useState<GlobalAddon | null>(null);
  const [editPriceDialog, setEditPriceDialog] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [clientAddonDialog, setClientAddonDialog] = useState<{ clienteId: string; addonType: AddonType } | null>(null);
  
  const addons = getAllAddons();
  const stats = getAddonsUsageStats();
  const clients = getAllClients();
  
  const handleToggleGlobalStatus = (addonType: AddonType, currentStatus: boolean) => {
    setAddonGlobalStatus(addonType, !currentStatus);
    toast({
      title: !currentStatus ? "Add-on ativado" : "Add-on desativado",
      description: `O add-on foi ${!currentStatus ? 'ativado' : 'desativado'} globalmente.`,
    });
  };
  
  const handleUpdatePrice = () => {
    if (!selectedAddon || !newPrice) return;
    
    const valor = parseFloat(newPrice.replace(",", "."));
    if (isNaN(valor) || valor < 0) {
      toast({
        title: "Erro",
        description: "Valor inválido",
        variant: "destructive",
      });
      return;
    }
    
    updateAddonPricing(selectedAddon.tipo, valor);
    toast({
      title: "Preço atualizado",
      description: `Novo valor: R$ ${valor.toFixed(2)}`,
    });
    setEditPriceDialog(false);
    setSelectedAddon(null);
    setNewPrice("");
  };
  
  const handleToggleClientAddon = (clienteId: string, addonType: AddonType, ativar: boolean) => {
    if (ativar) {
      activateAddon(clienteId, addonType, "admin-1", "Administrador");
    } else {
      deactivateAddon(clienteId, addonType, "admin-1", "Administrador");
    }
    
    const client = getClient(clienteId);
    toast({
      title: ativar ? "Add-on ativado" : "Add-on desativado",
      description: `${ADDONS[addonType].nome} ${ativar ? 'ativado' : 'desativado'} para ${client?.nome || 'cliente'}`,
    });
  };
  
  // Calcular métricas
  const totalRevenue = stats.reduce((sum, s) => {
    const addon = addons.find(a => a.tipo === s.addonType);
    return sum + (s.totalAtivos * (addon?.valor || 0));
  }, 0);
  
  const totalActiveAddons = stats.reduce((sum, s) => sum + s.totalAtivos, 0);
  
  return (
    <div className="space-y-6">
      {/* Header com métricas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Add-ons Ativos</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveAddons}</div>
            <p className="text-xs text-muted-foreground">Em {clients.length} clientes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Add-ons</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Receita mensal estimada</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Add-ons Disponíveis</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{addons.filter(a => a.ativo).length}</div>
            <p className="text-xs text-muted-foreground">De {addons.length} cadastrados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Adoção</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.length > 0 ? Math.round((totalActiveAddons / (clients.length * addons.length)) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Média de adesão</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="global" className="space-y-4">
        <TabsList>
          <TabsTrigger value="global" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuração Global
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Por Cliente
          </TabsTrigger>
        </TabsList>
        
        {/* Tab: Configuração Global */}
        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Add-ons</CardTitle>
              <CardDescription>
                Configure os add-ons disponíveis no sistema, preços e status global
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {addons.map((addon) => {
                  const stat = stats.find(s => s.addonType === addon.tipo);
                  
                  return (
                    <div
                      key={addon.tipo}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${addon.ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {addonIcons[addon.tipo]}
                        </div>
                        <div>
                          <h4 className="font-medium">{addon.nome}</h4>
                          <p className="text-sm text-muted-foreground">{addon.descricao}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">
                              {stat?.totalAtivos || 0} ativos
                            </Badge>
                            <Badge variant="secondary">
                              Planos: {addon.planosDisponiveis.join(', ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold">R$ {addon.valor.toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAddon(addon);
                              setNewPrice(addon.valor.toFixed(2));
                              setEditPriceDialog(true);
                            }}
                          >
                            Editar preço
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {addon.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                          <Switch
                            checked={addon.ativo}
                            onCheckedChange={() => handleToggleGlobalStatus(addon.tipo, addon.ativo)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Por Cliente */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add-ons por Cliente</CardTitle>
              <CardDescription>
                Visualize e gerencie os add-ons de cada cliente individualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    {addons.map(addon => (
                      <TableHead key={addon.tipo} className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {addonIcons[addon.tipo]}
                          <span className="text-xs">{addon.nome.split(' ')[0]}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => {
                    const clientAddons = getAllClientAddons(client.id);
                    
                    return (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.nome}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.planoAtual}</Badge>
                        </TableCell>
                        {addons.map(addon => {
                          const clientAddon = clientAddons.find(ca => ca.addonType === addon.tipo);
                          const status = clientAddon?.status || 'disponivel';
                          const isBlocked = status === 'bloqueado_por_plano';
                          const isActive = status === 'ativo';
                          
                          return (
                            <TableCell key={addon.tipo} className="text-center">
                              {isBlocked ? (
                                <div className="flex justify-center">
                                  <Badge variant="destructive" className="gap-1">
                                    <Lock className="h-3 w-3" />
                                    Bloqueado
                                  </Badge>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <Switch
                                    checked={isActive}
                                    onCheckedChange={(checked) => 
                                      handleToggleClientAddon(client.id, addon.tipo, checked)
                                    }
                                  />
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog: Editar Preço */}
      <Dialog open={editPriceDialog} onOpenChange={setEditPriceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Preço do Add-on</DialogTitle>
            <DialogDescription>
              Altere o valor mensal do add-on {selectedAddon?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Novo valor (R$)</Label>
              <Input
                type="text"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                A alteração afetará apenas novas contratações.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPriceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePrice}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
