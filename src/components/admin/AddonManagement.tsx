// ============= PRONTI - Gestão de Add-ons =============

import { useState, useMemo } from 'react';
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

interface Addon {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  valor: number;
  icon: string;
  ativo: boolean;
  assinantes: number;
  categoria: 'comunicacao' | 'armazenamento' | 'relatorios' | 'gestao' | 'personalizacao';
}

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

// Mock data
const initialAddons: Addon[] = [
  {
    id: 'addon-1',
    nome: 'WhatsApp Automático',
    slug: 'whatsapp-auto',
    descricao: 'Lembretes automáticos, confirmação de consulta e mensagens personalizadas via WhatsApp.',
    valor: 29.90,
    icon: 'message-square',
    ativo: true,
    assinantes: 89,
    categoria: 'comunicacao',
  },
  {
    id: 'addon-2',
    nome: 'Armazenamento Extra',
    slug: 'storage-extra',
    descricao: 'Expansão de espaço para exames, documentos, PDFs e imagens médicas.',
    valor: 19.90,
    icon: 'hard-drive',
    ativo: true,
    assinantes: 56,
    categoria: 'armazenamento',
  },
  {
    id: 'addon-3',
    nome: 'Relatórios Avançados',
    slug: 'advanced-reports',
    descricao: 'Filtros por período, gráficos comparativos, histórico completo e exportação detalhada.',
    valor: 14.90,
    icon: 'bar-chart',
    ativo: true,
    assinantes: 72,
    categoria: 'relatorios',
  },
  {
    id: 'addon-4',
    nome: 'Multi-profissional',
    slug: 'multi-user',
    descricao: 'Adicione mais profissionais à sua conta com gestão de permissões individualizada.',
    valor: 39.90,
    icon: 'users',
    ativo: true,
    assinantes: 28,
    categoria: 'gestao',
  },
  {
    id: 'addon-5',
    nome: 'White Label',
    slug: 'white-label',
    descricao: 'Personalize o sistema com sua marca, cores e logo próprio.',
    valor: 99.90,
    icon: 'palette',
    ativo: true,
    assinantes: 12,
    categoria: 'personalizacao',
  },
  {
    id: 'addon-6',
    nome: 'Backup Avançado',
    slug: 'advanced-backup',
    descricao: 'Backup diário automático com histórico de 90 dias e recuperação instantânea.',
    valor: 24.90,
    icon: 'shield',
    ativo: true,
    assinantes: 45,
    categoria: 'armazenamento',
  },
];

export function AddonManagement() {
  const [addons, setAddons] = useState<Addon[]>(initialAddons);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

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

  const handleSaveAddon = () => {
    if (!editingAddon) return;
    
    setAddons(prev => 
      prev.map(a => a.id === editingAddon.id ? editingAddon : a)
    );
    
    toast({
      title: 'Add-on atualizado',
      description: `O add-on "${editingAddon.nome}" foi atualizado com sucesso.`,
    });
    
    setDialogOpen(false);
    setEditingAddon(null);
  };

  const handleToggleAddon = (addonId: string) => {
    setAddons(prev => 
      prev.map(a => a.id === addonId ? { ...a, ativo: !a.ativo } : a)
    );
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
