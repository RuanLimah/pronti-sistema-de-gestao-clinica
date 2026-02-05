import { useEffect, useState } from "react";
import { adminService } from "../services/adminService";
import { AdminPlan, AdminAddon } from "../types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, Plus, Star, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export function AdminPlans() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [addons, setAddons] = useState<AdminAddon[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  
  const [isAddonDialogOpen, setIsAddonDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AdminAddon | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load Plans
      try {
        const plansData = await adminService.getPlans();
        setPlans(plansData);
      } catch (error) {
        console.error("Error loading plans:", error);
        toast.error("Erro ao carregar planos.");
      }

      // Load Addons (independently)
      try {
        const addonsData = await adminService.getAddons();
        setAddons(addonsData);
      } catch (error: any) {
        console.error("Error loading addons:", error);
        if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
          // Check if we are in dev/localhost
          if (window.location.hostname === 'localhost') {
              console.warn("DEV HINT: Addons table missing. Run migration 017_debug_schema.sql");
          }
          toast.warning("Tabela de Addons não encontrada. (Execute migration 017_debug_schema.sql)");
        } else {
          toast.error("Erro ao carregar addons.");
        }
      }

    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- Plans Logic ---
  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      type: formData.get("type") as string,
      subtitle: formData.get("subtitle") as string,
      active: formData.get("active") === "on",
      highlighted: formData.get("highlighted") === "on",
      // Simple parsing for features/limits for demo purposes
      // In a real app, you'd have a more complex form for JSON fields
    };

    try {
      if (editingPlan) {
        await adminService.updatePlan(editingPlan.id, data);
        toast.success("Plano atualizado com sucesso!");
      } else {
        await adminService.createPlan(data);
        toast.success("Plano criado com sucesso!");
      }
      setIsPlanDialogOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar plano.");
    }
  }

  async function handleDeletePlan(id: string) {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;
    try {
      // Optimistic Update: Remove from UI immediately
      setPlans(currentPlans => currentPlans.filter(p => p.id !== id));
      
      await adminService.deletePlan(id);
      toast.success("Plano excluído!");
      
      // Confirm with server data (background refresh)
      loadData();
    } catch (error: any) {
      // Revert Optimistic Update if failed
      console.error("Delete Plan Error:", error);
      loadData(); // Reload original state
      
      if (error?.code === '23503') { // Foreign Key Violation
        toast.error("Não é possível excluir: Existem clientes vinculados a este plano. Desative-o em vez disso.");
      } else if (error?.code === '42501') { // RLS Violation
        toast.error("Permissão negada: Você não tem permissão para excluir planos. Verifique suas permissões de administrador.");
      } else {
        toast.error(`Erro ao excluir plano: ${error.message} (Código: ${error.code || 'N/A'})`);
      }
    }
  }

  async function toggleHighlight(plan: AdminPlan) {
    if (plan.highlighted) return; // Already highlighted
    try {
      await adminService.updatePlan(plan.id, { highlighted: true });
      toast.success(`Plano ${plan.name} destacado!`);
      loadData();
    } catch (error) {
      toast.error("Erro ao destacar plano.");
    }
  }

  // --- Addons Logic ---
  async function handleSaveAddon(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      slug: formData.get("slug") as string,
      category: formData.get("category") as string,
      active: formData.get("active") === "on",
    };

    try {
      if (editingAddon) {
        await adminService.updateAddon(editingAddon.id, data);
        toast.success("Addon atualizado com sucesso!");
      } else {
        await adminService.createAddon(data);
        toast.success("Addon criado com sucesso!");
      }
      setIsAddonDialogOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar addon.");
    }
  }

  async function handleDeleteAddon(id: string) {
    if (!confirm("Tem certeza que deseja excluir este addon?")) return;
    try {
      await adminService.deleteAddon(id);
      toast.success("Addon excluído!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir addon.");
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Planos e Addons</h2>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Planos de Assinatura</TabsTrigger>
          <TabsTrigger value="addons">Addons (Opcionais)</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingPlan(null); setIsPlanDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Plano
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className={`border rounded-xl p-6 relative bg-card ${plan.highlighted ? 'border-primary ring-1 ring-primary' : ''}`}>
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                  </div>
                  <Badge variant={plan.active ? "default" : "secondary"}>
                    {plan.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="text-3xl font-bold mb-6">
                  R$ {plan.price}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="text-sm font-medium">Limites:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Pacientes: {plan.limits?.max_patients === null ? 'Ilimitado' : plan.limits?.max_patients}</li>
                    <li>Usuários: {plan.limits?.max_users}</li>
                  </ul>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingPlan(plan); setIsPlanDialogOpen(true); }}>
                    <Pencil className="h-4 w-4 mr-2" /> Editar
                  </Button>
                  
                  {!plan.highlighted && (
                    <Button variant="ghost" size="icon" onClick={() => toggleHighlight(plan)} title="Destacar este plano">
                      <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-500" />
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleDeletePlan(plan.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="addons">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingAddon(null); setIsAddonDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Addon
            </Button>
          </div>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addons.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell className="font-medium">{addon.name}</TableCell>
                    <TableCell className="font-mono text-xs">{addon.slug}</TableCell>
                    <TableCell>R$ {addon.price}</TableCell>
                    <TableCell>{addon.category}</TableCell>
                    <TableCell>
                      <Badge variant={addon.active ? "outline" : "secondary"}>
                        {addon.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingAddon(addon); setIsAddonDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteAddon(addon.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Plano */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePlan} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" defaultValue={editingPlan?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo (ID interno)</Label>
                <Input id="type" name="type" defaultValue={editingPlan?.type} required placeholder="ex: essencial" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input id="subtitle" name="subtitle" defaultValue={editingPlan?.subtitle} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input id="price" name="price" type="number" step="0.01" defaultValue={editingPlan?.price} required />
              </div>
              <div className="flex items-end space-x-2 pb-2">
                <div className="flex items-center space-x-2">
                  <Switch id="active" name="active" defaultChecked={editingPlan?.active ?? true} />
                  <Label htmlFor="active">Ativo</Label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Switch id="highlighted" name="highlighted" defaultChecked={editingPlan?.highlighted ?? false} />
                  <Label htmlFor="highlighted">Destaque</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Addon */}
      <Dialog open={isAddonDialogOpen} onOpenChange={setIsAddonDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAddon ? "Editar Addon" : "Novo Addon"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAddon} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addon-name">Nome</Label>
              <Input id="addon-name" name="name" defaultValue={editingAddon?.name} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addon-slug">Slug (ID único)</Label>
                <Input id="addon-slug" name="slug" defaultValue={editingAddon?.slug} required placeholder="ex: extra-pdf" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addon-category">Categoria</Label>
                <Input id="addon-category" name="category" defaultValue={editingAddon?.category} placeholder="ex: Relatórios" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addon-price">Preço (R$)</Label>
                <Input id="addon-price" name="price" type="number" step="0.01" defaultValue={editingAddon?.price} required />
              </div>
              <div className="flex items-end space-x-2 pb-2">
                <div className="flex items-center space-x-2">
                  <Switch id="addon-active" name="active" defaultChecked={editingAddon?.active ?? true} />
                  <Label htmlFor="addon-active">Ativo</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
