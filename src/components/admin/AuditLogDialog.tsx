import { useMemo } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  UserCog, 
  CreditCard, 
  Settings, 
  UserPlus, 
  UserMinus,
  ArrowRight
} from "lucide-react";
import { Doctor, AuditLog, useAdminStore } from "@/stores/adminStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLogDialogProps {
  doctor: Doctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const acaoConfig: Record<AuditLog['acao'], { icon: React.ElementType; color: string; label: string }> = {
  status_alterado: { icon: UserCog, color: 'text-blue-500 bg-blue-500/10', label: 'Status' },
  plano_alterado: { icon: CreditCard, color: 'text-purple-500 bg-purple-500/10', label: 'Plano' },
  modulo_alterado: { icon: Settings, color: 'text-primary bg-primary/10', label: 'Módulo' },
  medico_criado: { icon: UserPlus, color: 'text-success bg-success/10', label: 'Criação' },
  medico_deletado: { icon: UserMinus, color: 'text-destructive bg-destructive/10', label: 'Remoção' },
};

export function AuditLogDialog({ doctor, open, onOpenChange }: AuditLogDialogProps) {
  const auditLogs = useAdminStore(state => state.auditLogs);
  
  const logs = useMemo(() => {
    if (!doctor) return [];
    return auditLogs
      .filter(log => log.doctorId === doctor.id)
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [auditLogs, doctor]);

  if (!doctor) return null;

  const initials = doctor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Histórico de Auditoria</DialogTitle>
          <DialogDescription>
            Todas as ações administrativas realizadas neste médico.
          </DialogDescription>
        </DialogHeader>
        
        {/* Doctor Info */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Avatar className="h-12 w-12">
            <AvatarImage src={doctor.foto} alt={doctor.nome} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{doctor.nome}</h4>
            <p className="text-sm text-muted-foreground">{doctor.email}</p>
          </div>
        </div>

        {/* Audit Logs */}
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum registro de auditoria encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const config = acaoConfig[log.acao];
                const Icon = config.icon;
                
                return (
                  <div key={log.id} className="relative pl-8 pb-4 border-l-2 border-muted last:pb-0">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 -translate-x-1/2 p-1.5 rounded-full ${config.color}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.criadoEm), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      
                      <p className="text-sm">{log.detalhes}</p>
                      
                      {log.valorAnterior && log.valorNovo && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-muted rounded">{log.valorAnterior}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">{log.valorNovo}</span>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        por {log.adminNome}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
