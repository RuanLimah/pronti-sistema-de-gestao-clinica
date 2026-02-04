// ============= PRONTI - Gestão de Add-ons =============

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  HardDrive,
  BarChart3,
  Users,
  Palette,
  Shield,
  Edit2,
  Plus,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminStore } from '@/stores/adminStore';
import { Addon } from '@/types/admin';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'message-square': MessageSquare,
  'hard-drive': HardDrive,
  'bar-chart': BarChart3,
  'users': Users,
  'palette': Palette,
  'shield': Shield,
};

const categoryColors = {
  comunicacao: 'bg-primary/10 text-primary',
  armazenamento: 'bg-warning/10 text-warning',
  relatorios: 'bg-success/10 text-success',
  gestao: 'bg-accent text-accent-foreground',
  personalizacao: 'bg-muted text-muted-foreground',
};

const categoryLabels = {
  comunicacao: 'Comunicação',
  armazenamento: 'Armazenamento',
  relatorios: 'Relatórios',
  gestao: 'Gestão',
  personalizacao: 'Personalização',
};

export function AddonManagement() {
  const { addons, fetchAddons, updateAddon } = useAdminStore();
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  const totalAssinantes = useMemo(() => 
    addons.reduce((acc, addon) => acc + addon.assinantes, 0),
    [addons]
  );

  const totalMRR = useMemo(() => 
    addons.reduce((acc, addon) => acc + (addon.valor * addon.assinantes), 0),
    [addons]
  );

  const topAddons = useMemo(() => 
    [...addons].sort((a, b) => b.assinantes - a.assinantes).slice(0, 3),
    [addons]
  );

  const handleEditAddon = (addon: Addon) => {
    setEditingAddon({ ...addon });
    setDialogOpen(true);
  };

  const handleSaveAddon = async () => {
    if (!editingAddon) return;
    
    await updateAddon(editingAddon);
    
    toast({
      title: 'Add-on atualizado',
      description: `O add-on "${editingAddon.nome}" foi atualizado com sucesso.`,
    });
    
    setDialogOpen(false);
    setEditingAddon(null);
  };

  const handleToggleAddon = async (addonId: string) => {
    const addon = addons.find(a => a.id === addonId);
    if (!addon) return;
    
    await updateAddon({ ...addon, ativo: !addon.ativo });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Add-ons Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {addons.filter(a => a.ativo).length}
            </div>
            <p className="text-xs text-muted-foreground">de {addons.length} total</p>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinaturas de Add-ons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssinantes}</div>
            <p className="text-xs text-muted-foreground">contratações ativas</p>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              MRR Add-ons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">receita mensal</p>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Mais Vendido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{topAddons[0]?.nome}</div>
            <p className="text-xs text-muted-foreground">{topAddons[0]?.assinantes} assinantes</p>
          </CardContent>
        </Card>
      </div>

      {/* Add-ons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {addons.map((addon) => {
          const IconComponent = iconMap[addon.icon] || Shield;
          
          return (
            <Card 
              key={addon.id} 
              className={`card-interactive relative overflow-hidden ${!addon.ativo && 'opacity-60'}`}
            >
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{addon.nome}</CardTitle>
                      <Badge className={`mt-1 ${categoryColors[addon.categoria]}`}>
                        {categoryLabels[addon.categoria]}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditAddon(addon)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {addon.descricao}
                </p>
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      R$ {addon.valor.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">/mês</p>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      {addon.assinantes} assinantes
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Ativo</span>
                      <Switch
                        checked={addon.ativo}
                        onCheckedChange={() => handleToggleAddon(addon.id)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Add New Addon Card */}
        <Card className="card-interactive border-dashed flex items-center justify-center min-h-[280px]">
          <Button variant="ghost" className="flex flex-col gap-2 h-auto py-8">
            <Plus className="h-8 w-8 text-muted-foreground" />
            <span className="text-muted-foreground">Adicionar Add-on</span>
          </Button>
        </Card>
      </div>

      {/* Edit Addon Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Add-on</DialogTitle>
            <DialogDescription>
              Altere as configurações do add-on "{editingAddon?.nome}"
            </DialogDescription>
          </DialogHeader>
          
          {editingAddon && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Add-on</Label>
                <Input
                  id="nome"
                  value={editingAddon.nome}
                  onChange={(e) => setEditingAddon({ ...editingAddon, nome: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={editingAddon.descricao}
                  onChange={(e) => setEditingAddon({ ...editingAddon, descricao: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$/mês)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={editingAddon.valor}
                    onChange={(e) => setEditingAddon({ ...editingAddon, valor: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={editingAddon.slug}
                    onChange={(e) => setEditingAddon({ ...editingAddon, slug: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Add-on Ativo</p>
                  <p className="text-xs text-muted-foreground">
                    Desativar impedirá novas assinaturas
                  </p>
                </div>
                <Switch
                  checked={editingAddon.ativo}
                  onCheckedChange={(checked) => setEditingAddon({ ...editingAddon, ativo: checked })}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAddon}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
