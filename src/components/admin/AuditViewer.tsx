// ============= PRONTI - Visualizador de Auditoria (Super Admin Only) =============

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Filter,
  Shield,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Monitor,
  RefreshCw,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useEnhancedAuditStore } from '@/stores/enhancedAuditStore';
import {
  SystemRole,
  AuditableAction,
  AuditableEntity,
  AuditScreen,
  AuditSeverityLevel,
  ROLE_LABELS,
  ACTION_LABELS,
  ENTITY_LABELS,
  SCREEN_LABELS,
} from '@/types/rbac';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const severityConfig = {
  info: { label: 'Info', color: 'bg-muted text-muted-foreground', icon: Eye },
  warning: { label: 'Aviso', color: 'bg-warning/10 text-warning', icon: AlertTriangle },
  critical: { label: 'Crítico', color: 'bg-destructive/10 text-destructive', icon: Shield },
};

export function AuditViewer() {
  const { getLogs, getStatistics } = useEnhancedAuditStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<SystemRole | 'todos'>('todos');
  const [actionFilter, setActionFilter] = useState<AuditableAction | 'todos'>('todos');
  const [entityFilter, setEntityFilter] = useState<AuditableEntity | 'todos'>('todos');
  const [severityFilter, setSeverityFilter] = useState<AuditSeverityLevel | 'todos'>('todos');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    let logs = getLogs();
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      logs = logs.filter(l =>
        l.descricao.toLowerCase().includes(term) ||
        l.userEmail.toLowerCase().includes(term) ||
        l.userNome.toLowerCase().includes(term) ||
        l.entityNome?.toLowerCase().includes(term) ||
        l.ipAddress?.includes(term)
      );
    }
    
    if (roleFilter !== 'todos') {
      logs = logs.filter(l => l.userRole === roleFilter);
    }
    
    if (actionFilter !== 'todos') {
      logs = logs.filter(l => l.action === actionFilter);
    }
    
    if (entityFilter !== 'todos') {
      logs = logs.filter(l => l.entity === entityFilter);
    }
    
    if (severityFilter !== 'todos') {
      logs = logs.filter(l => l.severity === severityFilter);
    }
    
    return logs;
  }, [getLogs, searchTerm, roleFilter, actionFilter, entityFilter, severityFilter]);

  const stats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return getStatistics(thirtyDaysAgo, new Date());
  }, [getStatistics]);

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('todos');
    setActionFilter('todos');
    setEntityFilter('todos');
    setSeverityFilter('todos');
  };

  const hasActiveFilters = searchTerm || roleFilter !== 'todos' || actionFilter !== 'todos' || entityFilter !== 'todos' || severityFilter !== 'todos';

  const toggleExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent rounded-xl border border-destructive/20">
        <div className="p-3 rounded-xl bg-destructive text-destructive-foreground">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-semibold">Auditoria do Sistema</h2>
          <p className="text-sm text-muted-foreground">
            Logs imutáveis de todas as ações - Acesso exclusivo Super Admin
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-interactive">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total (30 dias)</p>
                <p className="text-2xl font-bold">{stats.totalLogs}</p>
              </div>
              <FileText className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Críticos</p>
                <p className="text-2xl font-bold text-destructive">{stats.logsCriticos}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dados Sensíveis</p>
                <p className="text-2xl font-bold text-warning">{stats.acessosSensiveis}</p>
              </div>
              <Eye className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-interactive">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exportações</p>
                <p className="text-2xl font-bold">{stats.exportacoes}</p>
              </div>
              <Download className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, email, nome ou IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as SystemRole | 'todos')}>
                <SelectTrigger className="w-[140px]">
                  <User className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as AuditableAction | 'todos')}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="criar">Criação</SelectItem>
                  <SelectItem value="visualizar">Visualização</SelectItem>
                  <SelectItem value="editar">Edição</SelectItem>
                  <SelectItem value="excluir">Exclusão</SelectItem>
                  <SelectItem value="exportar">Exportação</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as AuditSeverityLevel | 'todos')}>
                <SelectTrigger className="w-[130px]">
                  <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
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
              Exibindo {filteredLogs.length} logs
            </p>
          )}
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Logs de Auditoria
          </CardTitle>
          <CardDescription>
            Registros imutáveis ordenados por data (mais recentes primeiro)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="divide-y">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-medium mb-1">Nenhum log encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    Tente ajustar os filtros de busca
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const SeverityIcon = severityConfig[log.severity].icon;
                  const isExpanded = expandedLogId === log.id;
                  
                  return (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${severityConfig[log.severity].color}`}>
                          <SeverityIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{log.descricao}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {ROLE_LABELS[log.userRole]}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {log.userNome} ({log.userEmail})
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(log.timestamp), "dd/MM/yy HH:mm", { locale: ptBR })}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleExpand(log.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge className="text-xs bg-primary/10 text-primary">
                              {ACTION_LABELS[log.action]}
                            </Badge>
                            <Badge className="text-xs bg-secondary text-secondary-foreground">
                              {ENTITY_LABELS[log.entity]}
                            </Badge>
                            <Badge className="text-xs bg-muted text-muted-foreground">
                              <Monitor className="h-3 w-3 mr-1" />
                              {SCREEN_LABELS[log.screen]}
                            </Badge>
                            {log.sensitiveDataAccessed && (
                              <Badge className="text-xs bg-warning/10 text-warning">
                                Dados sensíveis
                              </Badge>
                            )}
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-muted-foreground">ID do Log:</span>
                                  <p className="font-mono">{log.id}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Entity ID:</span>
                                  <p className="font-mono">{log.entityId}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">IP:</span>
                                  <p className="font-mono">{log.ipAddress || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Timestamp:</span>
                                  <p>{format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
                                </div>
                              </div>
                              
                              {log.oldData && (
                                <div>
                                  <span className="text-muted-foreground">Dados Anteriores:</span>
                                  <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                                    {JSON.stringify(log.oldData, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {log.newData && (
                                <div>
                                  <span className="text-muted-foreground">Dados Novos:</span>
                                  <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                                    {JSON.stringify(log.newData, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {log.userAgent && (
                                <div>
                                  <span className="text-muted-foreground">User Agent:</span>
                                  <p className="font-mono text-xs break-all">{log.userAgent}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
