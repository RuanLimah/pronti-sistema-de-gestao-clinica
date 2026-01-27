// ============= PRONTI - Gestão de Usuários =============

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    addons: ['whatsapp-auto', 'advanced-reports'],
    ultimoAcesso: new Date(),
    criadoEm: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    pacientesAtivos: 45,
    prontuariosTotal: 234,
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
  },
  {
    id: 'user-5',
    nome: 'Dra. Juliana Costa',
    email: 'dra.juliana@pronti.com',
    crp: '06/567890',
    telefone: '(11) 99999-5555',
    status: 'ativo',
    plano: 'clinica',
    addons: ['whatsapp-auto', 'storage-extra', 'advanced-reports', 'white-label'],
    ultimoAcesso: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    criadoEm: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    pacientesAtivos: 156,
    prontuariosTotal: 892,
  },
];

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-success/10 text-success', icon: UserCheck },
  suspenso: { label: 'Suspenso', color: 'bg-warning/10 text-warning', icon: AlertTriangle },
  bloqueado: { label: 'Bloqueado', color: 'bg-destructive/10 text-destructive', icon: Ban },
};

const planConfig = {
  gratuito: { label: 'Gratuito', color: 'bg-muted text-muted-foreground' },
  essencial: { label: 'Essencial', color: 'bg-primary/10 text-primary' },
  profissional: { label: 'Profissional', color: 'bg-success/10 text-success' },
  clinica: { label: 'Clínica', color: 'bg-warning/10 text-warning' },
};

export function UserManagement() {
  const [users, setUsers] = useState<ProfessionalUser[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'todos'>('todos');
  const [planFilter, setPlanFilter] = useState<UserPlan | 'todos'>('todos');
  
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'suspend' | 'block' | 'reactivate' | null;
    user: ProfessionalUser | null;
  }>({ open: false, type: null, user: null });
  const [motivo, setMotivo] = useState('');
  
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

  const handleAction = (type: 'suspend' | 'block' | 'reactivate', user: ProfessionalUser) => {
    setActionDialog({ open: true, type, user });
    setMotivo('');
  };

  const confirmAction = () => {
    if (!actionDialog.user || !actionDialog.type) return;
    
    const newStatus: UserStatus = 
      actionDialog.type === 'reactivate' ? 'ativo' :
      actionDialog.type === 'suspend' ? 'suspenso' : 'bloqueado';
    
    setUsers(prev => prev.map(u => {
      if (u.id === actionDialog.user!.id) {
        return {
          ...u,
          status: newStatus,
          suspensaoMotivo: actionDialog.type === 'suspend' ? motivo : undefined,
          bloqueioMotivo: actionDialog.type === 'block' ? motivo : undefined,
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
      title: `Usuário ${actionLabels[actionDialog.type]}`,
      description: `${actionDialog.user.nome} foi ${actionLabels[actionDialog.type]} com sucesso.`,
    });
    
    setActionDialog({ open: false, type: null, user: null });
    setMotivo('');
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
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <History className="h-4 w-4 mr-2" />
                              Histórico
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'ativo' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleAction('suspend', user)}
                                  className="text-warning"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Suspender
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleAction('block', user)}
                                  className="text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Bloquear
                                </DropdownMenuItem>
                              </>
                            )}
                            {(user.status === 'suspenso' || user.status === 'bloqueado') && (
                              <DropdownMenuItem 
                                onClick={() => handleAction('reactivate', user)}
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

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'suspend' && 'Suspender Profissional'}
              {actionDialog.type === 'block' && 'Bloquear Profissional'}
              {actionDialog.type === 'reactivate' && 'Reativar Profissional'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'suspend' && 
                `Você está prestes a suspender ${actionDialog.user?.nome}. O profissional perderá acesso temporariamente.`
              }
              {actionDialog.type === 'block' && 
                `Você está prestes a bloquear ${actionDialog.user?.nome}. Esta ação é mais severa e desativa completamente a conta.`
              }
              {actionDialog.type === 'reactivate' && 
                `Você está prestes a reativar ${actionDialog.user?.nome}. O profissional terá seu acesso restaurado.`
              }
            </DialogDescription>
          </DialogHeader>
          
          {actionDialog.type !== 'reactivate' && (
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
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: null, user: null })}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmAction}
              variant={actionDialog.type === 'reactivate' ? 'default' : 'destructive'}
              disabled={actionDialog.type !== 'reactivate' && !motivo.trim()}
            >
              {actionDialog.type === 'suspend' && 'Suspender'}
              {actionDialog.type === 'block' && 'Bloquear'}
              {actionDialog.type === 'reactivate' && 'Reativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
