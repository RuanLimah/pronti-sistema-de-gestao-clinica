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
  Lock,
  AlertCircle,
} from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import { Addon } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";

const addonIcons: Record<string, React.ReactNode> = {
  whatsapp_avancado: <MessageSquare className="h-5 w-5" />,
  armazenamento_extra: <HardDrive className="h-5 w-5" />,
  relatorios_avancados: <BarChart3 className="h-5 w-5" />,
  // Fallback icon
  default: <Zap className="h-5 w-5" />,
};

export function AddonCentralManager() {
  const { toast } = useToast();
  const {
    addons,
    doctors: clients,
    updateAddon,
    toggleDoctorAddon,
  } = useAdminStore();
  
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [editPriceDialog, setEditPriceDialog] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  
  const handleToggleGlobalStatus = async (addon: Addon) => {
    const updatedAddon = { ...addon, ativo: !addon.ativo };
    await updateAddon(updatedAddon);
    
    toast({
      title: updatedAddon.ativo ? "Add-on ativado" : "Add-on desativado",
      description: `O add-on foi ${updatedAddon.ativo ? 'ativado' : 'desativado'} globalmente.`,
    });
  };
  
  const handleUpdatePrice = async () => {
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
    
    const updatedAddon = { ...selectedAddon, valor };
    await updateAddon(updatedAddon);
    
    toast({
      title: "Preço atualizado",
      description: `Novo valor: R$ ${valor.toFixed(2)}`,
    });
    setEditPriceDialog(false);
    setSelectedAddon(null);
    setNewPrice("");
  };
  
  const handleToggleClientAddon = async (clienteId: string, addonSlug: string, ativar: boolean) => {
    await toggleDoctorAddon(clienteId, addonSlug, ativar);
    
    const client = clients.find(c => c.id === clienteId);
    const addon = addons.find(a => a.slug === addonSlug);
    
    toast({
      title: ativar ? "Add-on ativado" : "Add-on desativado",
      description: `${addon?.nome || addonSlug} ${ativar ? 'ativado' : 'desativado'} para ${client?.nome || 'cliente'}`,
    });
  };
  
  // Calcular métricas
  const totalRevenue = clients.reduce((sum, client) => {
    if (client.status !== 'ativo') return sum;
    const clientRevenue = (client.addons || []).reduce((acc, slug) => {
      const addon = addons.find(a => a.slug === slug);
      return acc + (addon?.valor || 0);
    }, 0);
    return sum + clientRevenue;
  }, 0);
  
  const totalActiveAddons = clients.reduce((sum, client) => sum + (client.addons?.length || 0), 0);

  // Stats per addon
  const addonStats = addons.map(addon => ({
    ...addon,
    totalAtivos: clients.filter(c => c.addons?.includes(addon.slug)).length
  }));
  
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
              {clients.length > 0 && addons.length > 0 ? Math.round((totalActiveAddons / (clients.length * addons.length)) * 100) : 0}%
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
                  const stat = addonStats.find(s => s.slug === addon.slug);
                  
                  return (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${addon.ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {addonIcons[addon.slug] || addonIcons.default}
                        </div>
                        <div>
                          <h4 className="font-medium">{addon.nome}</h4>
                          <p className="text-sm text-muted-foreground">{addon.descricao}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">
                              {stat?.totalAtivos || 0} ativos
                            </Badge>
                            <Badge variant="secondary">
                              {addon.categoria}
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
                            onCheckedChange={() => handleToggleGlobalStatus(addon)}
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
                      <TableHead key={addon.id} className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {addonIcons[addon.slug] || addonIcons.default}
                          <span className="text-xs">{addon.nome.split(' ')[0]}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => {
                    return (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.nome}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.plano}</Badge>
                        </TableCell>
                        {addons.map(addon => {
                          const isActive = client.addons?.includes(addon.slug);
                          const isBlocked = !addon.ativo; // If globally inactive, maybe block? Or just show inactive?
                          
                          // Logic: if addon is globally inactive, you might not be able to enable it for clients.
                          // But for now, let's assume global active controls visibility/new sales, but existing might stay?
                          // Let's assume if globally inactive, we can still toggle for existing?
                          // Better: if blocked by plan (future feature), show lock.
                          
                          return (
                            <TableCell key={addon.id} className="text-center">
                              {/* Future: check plan restrictions */}
                              <div className="flex justify-center">
                                <Switch
                                  checked={isActive}
                                  onCheckedChange={(checked) => 
                                    handleToggleClientAddon(client.id, addon.slug, checked)
                                  }
                                />
                              </div>
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
