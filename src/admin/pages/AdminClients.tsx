import { useEffect, useState } from "react";
import { adminService } from "../services/adminService";
import { AdminClient, AdminAddon } from "../types";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, Search, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useAuthStore } from "@/stores/authStore"; // Add import

export function AdminClients() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingClient, setEditingClient] = useState<AdminClient | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    plano: ""
  });

  // Addon management state
  const [isAddonDialogOpen, setIsAddonDialogOpen] = useState(false);
  const [selectedClientForAddons, setSelectedClientForAddons] = useState<AdminClient | null>(null);
  const [clientAddons, setClientAddons] = useState<any[]>([]);
  const [availableAddons, setAvailableAddons] = useState<AdminAddon[]>([]);
  const [selectedAddonToAdd, setSelectedAddonToAdd] = useState<string>("");

  const { session, isInitialized } = useAuthStore();

  useEffect(() => {
    console.log("AdminClients Effect Triggered:", { isInitialized, hasToken: !!session?.access_token });
    
    if (!isInitialized) {
       console.log("Waiting for initialization...");
       return;
    }
    
    if (!session?.access_token) {
       console.warn("Initialized but no token found.");
       setLoading(false); // Stop loading if no token
       return;
    }

    console.log("Starting loadData...");
    loadData();
  }, [isInitialized, session?.access_token]);

  useEffect(() => {
    if (editingClient) {
      setFormData({
        nome: editingClient.nome || "",
        telefone: editingClient.telefone || "",
        plano: editingClient.plano || ""
      });
    }
  }, [editingClient]);

  async function loadData() {
    try {
      setLoading(true);
      
      console.log("Calling adminService.getClients()...");
      const data = await adminService.getClients();
      
      console.log("Service Response:", data);
      setClients(data || []);
    } catch (error: any) {
       console.error("Erro detalhado ao carregar clientes:", error);
       
       let msg = "Erro ao carregar clientes";
       
       // Tentar extrair detalhes do corpo da resposta (se disponível)
       try {
         if (error.context && typeof error.context.json === 'function') {
           const body = await error.context.json();
           console.log("Error Body:", body);
           if (body.details) msg = `Erro: ${body.details}`;
           else if (body.error) msg = `Erro: ${body.error}`;
         } else if (error.message) {
           msg += `: ${error.message}`;
         }
       } catch (e) {
         if (error.message) msg += `: ${error.message}`;
       }

       if (error.context && error.context.status) msg += ` (Status: ${error.context.status})`;
       
       toast.error(msg);
     } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!editingClient) return;

    try {
      await adminService.updateClientProfile(editingClient.id, formData);
      toast.success("Cliente atualizado com sucesso");
      setEditingClient(null);
      loadData();
    } catch (error) {
      toast.error("Erro ao salvar alterações");
      console.error(error);
    }
  };

  const handleDelete = async (clientId: string) => {
    try {
      await adminService.deleteClient(clientId);
      toast.success("Cliente excluído");
      loadData();
    } catch (error) {
      toast.error("Erro ao excluir cliente");
    }
  };

  // Addon Handlers
  async function handleManageAddons(client: AdminClient) {
    setSelectedClientForAddons(client);
    setIsAddonDialogOpen(true);
    setClientAddons([]); // Clear prev
    setSelectedAddonToAdd("");
    
    // Load Client Addons
    try {
      const cAddons = await adminService.getClientAddons(client.id);
      setClientAddons(cAddons || []);
    } catch (error: any) {
      console.error("Erro ao carregar addons do cliente:", error);
      if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
        toast.warning("Funcionalidade de Addons indisponível (Tabela não encontrada).");
      } else {
        toast.error("Erro ao carregar addons do cliente.");
      }
    }

    // Load Available Addons
    try {
      const allAddons = await adminService.getAddons();
      setAvailableAddons(allAddons.filter(a => a.active) || []);
    } catch (error: any) {
      console.error("Erro ao carregar addons disponíveis:", error);
      // Suppress toast if it's the same error as above to avoid duplication, or just log it
    }
  }

  async function handleAddAddon() {
    if (!selectedClientForAddons || !selectedAddonToAdd) return;
    try {
      await adminService.addClientAddon(selectedClientForAddons.id, selectedAddonToAdd);
      toast.success("Addon adicionado!");
      
      // Refresh list
      const cAddons = await adminService.getClientAddons(selectedClientForAddons.id);
      setClientAddons(cAddons || []);
      setSelectedAddonToAdd("");
    } catch (error) {
      toast.error("Erro ao adicionar addon.");
    }
  }

  async function handleRemoveAddon(id: string) {
    if (!selectedClientForAddons) return;
    try {
      await adminService.removeClientAddon(id, selectedClientForAddons.id);
      toast.success("Addon removido!");
      
      // Refresh list
      const cAddons = await adminService.getClientAddons(selectedClientForAddons.id);
      setClientAddons(cAddons || []);
    } catch (error) {
      toast.error("Erro ao remover addon.");
    }
  }

  const filteredClients = clients.filter(c => 
    c.email.toLowerCase().includes(search.toLowerCase()) || 
    (c.nome && c.nome.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h2>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome ou email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente / Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">{client.nome || 'Sem nome'}</div>
                    <div className="text-xs text-muted-foreground">{client.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.role === 'admin' ? 'default' : 'secondary'}>
                      {client.role?.toUpperCase() || 'USER'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.telefone || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.plano || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>Cad: {new Date(client.created_at).toLocaleDateString()}</div>
                      {client.last_sign_in_at && (
                        <div className="text-muted-foreground">Últ. login: {new Date(client.last_sign_in_at).toLocaleDateString()}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleManageAddons(client)}>
                        <Plus className="h-4 w-4 mr-1" /> Addons
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingClient(client)}>
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Cliente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário e todos os dados associados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(client.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Atualize as informações do cliente abaixo.
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone" className="text-right">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plano" className="text-right">
                Plano
              </Label>
              <Input
                id="plano"
                value={formData.plano}
                onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Addons Dialog */}
      <Dialog open={isAddonDialogOpen} onOpenChange={setIsAddonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Addons - {selectedClientForAddons?.nome || selectedClientForAddons?.email}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add New */}
            <div className="flex gap-2 items-end border-b pb-4">
              <div className="grid w-full gap-1.5">
                <Label>Adicionar novo addon</Label>
                <Select value={selectedAddonToAdd} onValueChange={setSelectedAddonToAdd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um addon..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAddons.map(addon => (
                      <SelectItem key={addon.id} value={addon.id}>
                        {addon.name} (R$ {addon.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddAddon} disabled={!selectedAddonToAdd}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar
              </Button>
            </div>

            {/* List */}
            <div>
              <Label className="mb-2 block">Addons Ativos</Label>
              {clientAddons.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum addon vinculado.</p>
              ) : (
                <div className="grid gap-2">
                  {clientAddons.map((ca: any) => (
                    <div key={ca.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                      <div>
                        <div className="font-medium">{ca.addon?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Adicionado em {new Date(ca.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-semibold">R$ {ca.addon?.price}</div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveAddon(ca.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
