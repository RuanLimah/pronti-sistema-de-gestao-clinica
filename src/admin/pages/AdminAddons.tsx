import { useEffect, useState } from "react";
import { adminService } from "../services/adminService";
import { AdminAddon } from "../types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function AdminAddons() {
  const [addons, setAddons] = useState<AdminAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAddon, setEditingAddon] = useState<Partial<AdminAddon> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadAddons();
  }, []);

  async function loadAddons() {
    try {
      setLoading(true);
      const data = await adminService.getAddons();
      setAddons(data);
    } catch (error: any) {
      console.error(error);
      if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
        toast.error("Tabela de Addons não encontrada! Execute a migration '016_ensure_addons_and_refresh.sql' no Supabase.");
      } else {
        toast.error("Erro ao carregar add-ons");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!editingAddon?.nome || editingAddon.preco === undefined) {
      toast.error("Preencha nome e preço");
      return;
    }

    try {
      if (editingAddon.id) {
        await adminService.updateAddon(editingAddon.id, editingAddon);
        toast.success("Add-on atualizado");
      } else {
        await adminService.createAddon(editingAddon as Omit<AdminAddon, 'id'>);
        toast.success("Add-on criado");
      }
      setIsDialogOpen(false);
      loadAddons();
    } catch (error) {
      toast.error("Erro ao salvar add-on");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminService.deleteAddon(id);
      toast.success("Add-on excluído");
      loadAddons();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir add-on");
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Add-ons</h2>
        <Button onClick={() => { setEditingAddon({ ativo: true, preco: 0 }); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Add-on
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addons.map((addon) => (
              <TableRow key={addon.id}>
                <TableCell className="font-medium">{addon.nome}</TableCell>
                <TableCell>R$ {addon.preco}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{addon.slug || '-'}</TableCell>
                <TableCell>{addon.ativo ? "Sim" : "Não"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingAddon(addon); setIsDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Add-on</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza? Esta ação não pode ser desfeita.
                          Add-ons em uso não podem ser excluídos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(addon.id)} className="bg-red-600">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddon?.id ? "Editar Add-on" : "Novo Add-on"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input 
                value={editingAddon?.nome || ''} 
                onChange={(e) => setEditingAddon(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Slug (Código único)</Label>
              <Input 
                value={editingAddon?.slug || ''} 
                onChange={(e) => setEditingAddon(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="ex: whatsapp_auto"
              />
            </div>
            <div className="grid gap-2">
              <Label>Preço (R$)</Label>
              <Input 
                type="number"
                value={editingAddon?.preco || 0} 
                onChange={(e) => setEditingAddon(prev => ({ ...prev, preco: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={editingAddon?.ativo}
                onCheckedChange={(checked) => setEditingAddon(prev => ({ ...prev, ativo: checked }))}
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
