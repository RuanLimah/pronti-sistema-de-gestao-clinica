import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  UserCog, 
  CreditCard, 
  Settings, 
  UserPlus, 
  UserMinus,
  ArrowRight,
  History
} from "lucide-react";
import { AuditLog, useAdminStore } from "@/stores/adminStore";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const acaoConfig: Record<AuditLog['acao'], { icon: React.ElementType; color: string; label: string }> = {
  status_alterado: { icon: UserCog, color: 'text-blue-500 bg-blue-500/10', label: 'Status' },
  plano_alterado: { icon: CreditCard, color: 'text-purple-500 bg-purple-500/10', label: 'Plano' },
  modulo_alterado: { icon: Settings, color: 'text-primary bg-primary/10', label: 'Módulo' },
  medico_criado: { icon: UserPlus, color: 'text-success bg-success/10', label: 'Criação' },
  medico_deletado: { icon: UserMinus, color: 'text-destructive bg-destructive/10', label: 'Remoção' },
};

interface AuditLogListProps {
  limit?: number;
}

export function AuditLogList({ limit }: AuditLogListProps) {
  const auditLogs = useAdminStore(state => state.auditLogs);
  
  const logs = useMemo(() => {
    const sorted = [...auditLogs].sort((a, b) => 
      new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }, [auditLogs, limit]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma atividade registrada.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-4">
              {logs.map((log) => {
                const config = acaoConfig[log.acao];
                const Icon = config.icon;
                const timeAgo = formatDistanceToNow(new Date(log.criadoEm), { addSuffix: true, locale: ptBR });
                
                return (
                  <div key={log.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-lg shrink-0 h-fit ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium truncate">{log.doctorNome}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">{log.detalhes}</p>
                      
                      {log.valorAnterior && log.valorNovo && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-muted rounded truncate max-w-[80px]">{log.valorAnterior}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded truncate max-w-[80px]">{log.valorNovo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
