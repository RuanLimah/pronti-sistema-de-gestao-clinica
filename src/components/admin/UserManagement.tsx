// ============= PRONTI - Gestão de Usuários Avançada =============

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Ban,
  History,
  Crown,
  MoreVertical,
  Eye,
  RefreshCw,
  Shield,
  AlertTriangle,
  Settings,
  Package,
  ArrowRight,
  Clock,
  CreditCard,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type UserStatus = 'ativo' | 'suspenso' | 'bloqueado';
type UserPlan = 'gratuito' | 'essencial' | 'profissional' | 'clinica';

interface HistoryEntry {
  id: string;
  data: Date;
  tipo: 'plano' | 'addon' | 'status';
  descricao: string;
  valorAnterior?: string;
  valorNovo?: string;
}

interface ProfessionalUser {
  id: string;
  nome: string;
  email: string;
  crp: string;
  telefone?: string;
  foto?: string;
  status: UserStatus;
  plano: UserPlan;
  addons: string[];
  ultimoAcesso: Date;
  criadoEm: Date;
  suspensaoMotivo?: string;
  bloqueioMotivo?: string;
  pacientesAtivos: number;
  prontuariosTotal: number;
  historico: HistoryEntry[];
}

// Mock data
const initialUsers: ProfessionalUser[] = [
  {
    id: 'user-1',
    nome: 'Dra. Ana Silva',
    email: 'dra.ana@pronti.com',
    crp: '06/123456',
    telefone: '(11) 99999-1111',
    status: 'ativo',
    plano: 'profissional',
    addons: ['whatsapp-auto', 'relatorios-avancados'],
    ultimoAcesso: new Date(),
    criadoEm: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    pacientesAtivos: 45,
    prontuariosTotal: 234,
    historico: [
      { id: '1', data: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), tipo: 'plano', descricao: 'Upgrade de plano', valorAnterior: 'Essencial', valorNovo: 'Profissional' },
      { id: '2', data: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), tipo: 'addon', descricao: 'Addon ativado', valorNovo: 'WhatsApp Automático' },
    ],
  },
  {
    id: 'user-2',
    nome: 'Dr. Carlos Mendes',
    email: 'dr.carlos@pronti.com',
    crp: '06/789012',
    telefone: '(11) 99999-2222',
    status: 'ativo',
    plano: 'essencial',
    addons: [],
    ultimoAcesso: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    criadoEm: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    pacientesAtivos: 28,
    prontuariosTotal: 156,
    historico: [
      { id: '1', data: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), tipo: 'status', descricao: 'Conta criada', valorNovo: 'Ativo' },
    ],
  },
  {
    id: 'user-3',
    nome: 'Dra. Maria Santos',
    email: 'dra.maria@pronti.com',
    crp: '06/345678',
    telefone: '(11) 99999-3333',
    status: 'suspenso',
    plano: 'profissional',
    addons: ['whatsapp-auto'],
    ultimoAcesso: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    criadoEm: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    suspensaoMotivo: 'Inadimplência há 30 dias',
    pacientesAtivos: 62,
    prontuariosTotal: 412,
    historico: [
      { id: '1', data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), tipo: 'status', descricao: 'Conta suspensa', valorAnterior: 'Ativo', valorNovo: 'Suspenso' },
    ],
  },
  {
    id: 'user-4',
    nome: 'Dr. Pedro Lima',
    email: 'dr.pedro@pronti.com',
    crp: '06/901234',
    status: 'bloqueado',
    plano: 'gratuito',
    addons: [],
    ultimoAcesso: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    criadoEm: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    bloqueioMotivo: 'Violação dos termos de uso',
    pacientesAtivos: 0,
    prontuariosTotal: 89,
    historico: [
      { id: '1', data: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), tipo: 'status', descricao: 'Conta bloqueada', valorAnterior: 'Ativo', valorNovo: 'Bloqueado' },
    ],
  },
  {
    id: 'user-5',
    nome: 'Dra. Juliana Costa',
    email: 'dra.juliana@pronti.com',
    crp: '06/567890',
    telefone: '(11) 99999-5555',
    status: 'ativo',
    plano: 'clinica',
    addons: ['whatsapp-auto', 'storage-extra', 'relatorios-avancados'],
    ultimoAcesso: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    criadoEm: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    pacientesAtivos: 156,
    prontuariosTotal: 892,
    historico: [
      { id: '1', data: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), tipo: 'status', descricao: 'Conta criada', valorNovo: 'Ativo' },
      { id: '2', data: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), tipo: 'plano', descricao: 'Upgrade de plano', valorAnterior: 'Profissional', valorNovo: 'Clínica' },
    ],
  },
];

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-success/10 text-success', icon: UserCheck },
  suspenso: { label: 'Suspenso', color: 'bg-warning/10 text-warning', icon: AlertTriangle },
  bloqueado: { label: 'Bloqueado', color: 'bg-destructive/10 text-destructive', icon: Ban },
};

const planConfig = {
  gratuito: { label: 'Gratuito', color: 'bg-muted text-muted-foreground', valor: 0 },
  essencial: { label: 'Essencial', color: 'bg-primary/10 text-primary', valor: 79 },
  profissional: { label: 'Profissional', color: 'bg-success/10 text-success', valor: 149 },
  clinica: { label: 'Clínica', color: 'bg-warning/10 text-warning', valor: 299 },
};

const addonsConfig = [
  { id: 'whatsapp-auto', nome: 'WhatsApp Automático', valor: 29.90 },
  { id: 'storage-extra', nome: 'Armazenamento Extra', valor: 19.90 },
  { id: 'relatorios-avancados', nome: 'Relatórios Avançados', valor: 14.90 },
];

type DialogType = 'details' | 'history' | 'plan' | 'addons' | 'action';

export function UserManagement() {
  const [users, setUsers] = useState<ProfessionalUser[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'todos'>('todos');
  const [planFilter, setPlanFilter] = useState<UserPlan | 'todos'>('todos');
  
  const [selectedUser, setSelectedUser] = useState<ProfessionalUser | null>(null);
  const [dialogType, setDialogType] = useState<DialogType | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'block' | 'reactivate' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<UserPlan | ''>('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  
  const { toast } = useToast();

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.crp.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || user.status === statusFilter;
      const matchesPlan = planFilter === 'todos' || user.plano === planFilter;
      
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [users, searchTerm, statusFilter, planFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    ativos: users.filter(u => u.status === 'ativo').length,
    suspensos: users.filter(u => u.status === 'suspenso').length,
    bloqueados: users.filter(u => u.status === 'bloqueado').length,
  }), [users]);

  const openDialog = (type: DialogType, user: ProfessionalUser, action?: 'suspend' | 'block' | 'reactivate') => {
    setSelectedUser(user);
    setDialogType(type);
    setMotivo('');
    
    if (type === 'plan') {
      setSelectedPlan(user.plano);
    }
    if (type === 'addons') {
      setSelectedAddons([...user.addons]);
    }
    if (type === 'action' && action) {
      setActionType(action);
    }
  };

  const closeDialog = () => {
    setSelectedUser(null);
    setDialogType(null);
    setActionType(null);
    setMotivo('');
    setSelectedPlan('');
    setSelectedAddons([]);
  };

  const confirmAction = () => {
    if (!selectedUser || !actionType) return;
    
    const newStatus: UserStatus = 
      actionType === 'reactivate' ? 'ativo' :
      actionType === 'suspend' ? 'suspenso' : 'bloqueado';
    
    const historyEntry: HistoryEntry = {
      id: Date.now().toString(),
      data: new Date(),
      tipo: 'status',
      descricao: actionType === 'reactivate' ? 'Conta reativada' : 
                 actionType === 'suspend' ? 'Conta suspensa' : 'Conta bloqueada',
      valorAnterior: statusConfig[selectedUser.status].label,
      valorNovo: statusConfig[newStatus].label,
    };
    
    setUsers(prev => prev.map(u => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          status: newStatus,
          suspensaoMotivo: actionType === 'suspend' ? motivo : undefined,
          bloqueioMotivo: actionType === 'block' ? motivo : undefined,
          historico: [historyEntry, ...u.historico],
        };
      }
      return u;
    }));
    
    const actionLabels = {
      suspend: 'suspenso',
      block: 'bloqueado',
      reactivate: 'reativado',
    };
    
    toast({
      title: `Usuário ${actionLabels[actionType]}`,
      description: `${selectedUser.nome} foi ${actionLabels[actionType]} com sucesso.`,
    });
    
    closeDialog();
  };

  const savePlanChange = () => {
    if (!selectedUser || !selectedPlan) return;
    
    if (selectedPlan === selectedUser.plano) {
      closeDialog();
      return;
    }
    
    const historyEntry: HistoryEntry = {
      id: Date.now().toString(),
      data: new Date(),
      tipo: 'plano',
      descricao: 'Alteração de plano',
      valorAnterior: planConfig[selectedUser.plano].label,
      valorNovo: planConfig[selectedPlan].label,
    };
    
    setUsers(prev => prev.map(u => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          plano: selectedPlan,
          historico: [historyEntry, ...u.historico],
        };
      }
      return u;
    }));
    
    toast({
      title: 'Plano alterado',
      description: `${selectedUser.nome} agora está no plano ${planConfig[selectedPlan].label}.`,
    });
    
    closeDialog();
  };

  const saveAddonsChange = () => {
    if (!selectedUser) return;
    
    const addedAddons = selectedAddons.filter(a => !selectedUser.addons.includes(a));
    const removedAddons = selectedUser.addons.filter(a => !selectedAddons.includes(a));
    
    const historyEntries: HistoryEntry[] = [];
    
    addedAddons.forEach(addonId => {
      const addon = addonsConfig.find(a => a.id === addonId);
      if (addon) {
        historyEntries.push({
          id: Date.now().toString() + addonId,
          data: new Date(),
          tipo: 'addon',
          descricao: 'Addon ativado',
          valorNovo: addon.nome,
        });
      }
    });
    
    removedAddons.forEach(addonId => {
      const addon = addonsConfig.find(a => a.id === addonId);
      if (addon) {
        historyEntries.push({
          id: Date.now().toString() + addonId,
          data: new Date(),
          tipo: 'addon',
          descricao: 'Addon removido',
          valorAnterior: addon.nome,
        });
      }
    });
    
    setUsers(prev => prev.map(u => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          addons: selectedAddons,
          historico: [...historyEntries, ...u.historico],
        };
      }
      return u;
    }));
    
    toast({
      title: 'Add-ons atualizados',
      description: `Os add-ons de ${selectedUser.nome} foram atualizados.`,
    });
    
    closeDialog();
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(a => a !== addonId)
        : [...prev, addonId]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setPlanFilter('todos');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'todos' || planFilter !== 'todos';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-interactive">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Shield className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-success">{stats.ativos}</p>
              </div>
              <UserCheck className="h-8 w-8 text-success/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspensos</p>
                <p className="text-2xl font-bold text-warning">{stats.suspensos}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bloqueados</p>
                <p className="text-2xl font-bold text-destructive">{stats.bloqueados}</p>
              </div>
              <Ban className="h-8 w-8 text-destructive/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CRP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | 'todos')}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="suspenso">Suspensos</SelectItem>
                  <SelectItem value="bloqueado">Bloqueados</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as UserPlan | 'todos')}>
                <SelectTrigger className="w-[140px]">
                  <Crown className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="gratuito">Gratuito</SelectItem>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="clinica">Clínica</SelectItem>
                </SelectContent>
              </Select>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-3">
              Exibindo {filteredUsers.length} de {users.length} profissionais
            </p>
          )}
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserX className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-medium mb-1">Nenhum profissional encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros de busca
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const StatusIcon = statusConfig[user.status].icon;
            
            return (
              <Card key={user.id} className="card-interactive">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.foto} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {user.nome}
                            <Badge className={statusConfig[user.status].color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[user.status].label}
                            </Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">CRP: {user.crp}</p>
                        </div>
                        
                        {/* Menu de 3 pontinhos */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover w-56">
                            <DropdownMenuItem onClick={() => openDialog('details', user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver mais
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialog('history', user)}>
                              <History className="h-4 w-4 mr-2" />
                              Histórico
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDialog('plan', user)}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Gerenciar plano
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialog('addons', user)}>
                              <Package className="h-4 w-4 mr-2" />
                              Gerenciar add-ons
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'ativo' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => openDialog('action', user, 'suspend')}
                                  className="text-warning"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Suspender
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openDialog('action', user, 'block')}
                                  className="text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Bloquear
                                </DropdownMenuItem>
                              </>
                            )}
                            {(user.status === 'suspenso' || user.status === 'bloqueado') && (
                              <DropdownMenuItem 
                                onClick={() => openDialog('action', user, 'reactivate')}
                                className="text-success"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Reativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge className={planConfig[user.plano].color}>
                          <Crown className="h-3 w-3 mr-1" />
                          {planConfig[user.plano].label}
                        </Badge>
                        
                        {user.addons.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.addons.length} add-ons
                          </Badge>
                        )}
                        
                        <span className="text-xs text-muted-foreground">
                          {user.pacientesAtivos} pacientes • {user.prontuariosTotal} prontuários
                        </span>
                      </div>
                      
                      {(user.suspensaoMotivo || user.bloqueioMotivo) && (
                        <div className="mt-2 p-2 bg-destructive/5 rounded-lg">
                          <p className="text-xs text-destructive">
                            <strong>Motivo:</strong> {user.suspensaoMotivo || user.bloqueioMotivo}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Último acesso: {format(user.ultimoAcesso, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog: Ver mais (Detalhes) */}
      <Dialog open={dialogType === 'details'} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Profissional
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Dados pessoais */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.foto} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedUser.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.nome}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-sm text-muted-foreground">CRP: {selectedUser.crp}</p>
                  {selectedUser.telefone && (
                    <p className="text-sm text-muted-foreground">{selectedUser.telefone}</p>
                  )}
                </div>
              </div>
              
              {/* Status e Plano */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Status da conta</p>
                  <Badge className={statusConfig[selectedUser.status].color}>
                    {statusConfig[selectedUser.status].label}
                  </Badge>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Plano atual</p>
                  <Badge className={planConfig[selectedUser.plano].color}>
                    {planConfig[selectedUser.plano].label}
                  </Badge>
                </div>
              </div>
              
              {/* Add-ons */}
              <div>
                <p className="text-sm font-medium mb-2">Add-ons ativos</p>
                {selectedUser.addons.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.addons.map(addonId => {
                      const addon = addonsConfig.find(a => a.id === addonId);
                      return addon ? (
                        <Badge key={addonId} variant="outline">
                          {addon.nome}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum add-on ativo</p>
                )}
              </div>
              
              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedUser.pacientesAtivos}</p>
                  <p className="text-xs text-muted-foreground">Pacientes ativos</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedUser.prontuariosTotal}</p>
                  <p className="text-xs text-muted-foreground">Prontuários</p>
                </div>
              </div>
              
              {/* Datas */}
              <div className="text-sm text-muted-foreground">
                <p>Cadastro: {format(selectedUser.criadoEm, "dd/MM/yyyy", { locale: ptBR })}</p>
                <p>Último acesso: {format(selectedUser.ultimoAcesso, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Histórico */}
      <Dialog open={dialogType === 'history'} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Ações
            </DialogTitle>
            <DialogDescription>
              Histórico de alterações administrativas para {selectedUser?.nome}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <ScrollArea className="max-h-[400px] pr-4">
              {selectedUser.historico.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum registro no histórico
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedUser.historico.map((entry) => (
                    <div key={entry.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className={`p-2 rounded-lg shrink-0 h-fit ${
                        entry.tipo === 'plano' ? 'bg-primary/10 text-primary' :
                        entry.tipo === 'addon' ? 'bg-success/10 text-success' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {entry.tipo === 'plano' && <CreditCard className="h-4 w-4" />}
                        {entry.tipo === 'addon' && <Package className="h-4 w-4" />}
                        {entry.tipo === 'status' && <Settings className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{entry.descricao}</p>
                        {(entry.valorAnterior || entry.valorNovo) && (
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            {entry.valorAnterior && (
                              <span className="px-2 py-0.5 bg-muted rounded">{entry.valorAnterior}</span>
                            )}
                            {entry.valorAnterior && entry.valorNovo && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            )}
                            {entry.valorNovo && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">{entry.valorNovo}</span>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {format(entry.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Gerenciar Plano */}
      <Dialog open={dialogType === 'plan'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Gerenciar Plano
            </DialogTitle>
            <DialogDescription>
              Alterar o plano de {selectedUser?.nome}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Plano atual</p>
                <Badge className={planConfig[selectedUser.plano].color}>
                  {planConfig[selectedUser.plano].label} - R$ {planConfig[selectedUser.plano].valor}/mês
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Novo plano</Label>
                <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as UserPlan)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="gratuito">Gratuito - R$ 0/mês</SelectItem>
                    <SelectItem value="essencial">Essencial - R$ 79/mês</SelectItem>
                    <SelectItem value="profissional">Profissional - R$ 149/mês</SelectItem>
                    <SelectItem value="clinica">Clínica - R$ 299/mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={savePlanChange}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Gerenciar Add-ons */}
      <Dialog open={dialogType === 'addons'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gerenciar Add-ons
            </DialogTitle>
            <DialogDescription>
              Ativar ou desativar add-ons para {selectedUser?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {addonsConfig.map((addon) => (
              <div key={addon.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{addon.nome}</p>
                  <p className="text-sm text-muted-foreground">R$ {addon.valor.toFixed(2)}/mês</p>
                </div>
                <Switch
                  checked={selectedAddons.includes(addon.id)}
                  onCheckedChange={() => toggleAddon(addon.id)}
                />
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={saveAddonsChange}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ação (Suspender/Bloquear/Reativar) */}
      <Dialog open={dialogType === 'action'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'suspend' && 'Suspender Profissional'}
              {actionType === 'block' && 'Bloquear Profissional'}
              {actionType === 'reactivate' && 'Reativar Profissional'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'suspend' && 
                `Você está prestes a suspender ${selectedUser?.nome}. O profissional perderá acesso temporariamente.`
              }
              {actionType === 'block' && 
                `Você está prestes a bloquear ${selectedUser?.nome}. Esta ação é mais severa e desativa completamente a conta.`
              }
              {actionType === 'reactivate' && 
                `Você está prestes a reativar ${selectedUser?.nome}. O profissional terá seu acesso restaurado.`
              }
            </DialogDescription>
          </DialogHeader>
          
          {actionType !== 'reactivate' && (
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo (obrigatório)</Label>
              <Textarea
                id="motivo"
                placeholder="Descreva o motivo desta ação..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmAction}
              variant={actionType === 'reactivate' ? 'default' : 'destructive'}
              disabled={actionType !== 'reactivate' && !motivo.trim()}
            >
              {actionType === 'suspend' && 'Suspender'}
              {actionType === 'block' && 'Bloquear'}
              {actionType === 'reactivate' && 'Reativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
