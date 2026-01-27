import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useDataStore } from "@/stores/dataStore";

export default function Notificacoes() {
  const { user } = useAuthStore();
  const { getNotificacoesByMedico, marcarNotificacaoLida, marcarTodasNotificacoesLidas } = useDataStore();
  
  const notifications = user ? getNotificacoesByMedico(user.id) : [];
  const unreadCount = notifications.filter(n => !n.lida).length;

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'agendamento': return 'bg-primary/10 text-primary';
      case 'cancelamento': return 'bg-destructive/10 text-destructive';
      case 'pagamento': return 'bg-success/10 text-success';
      case 'plano': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'agendamento': return 'Agendamento';
      case 'cancelamento': return 'Cancelamento';
      case 'pagamento': return 'Pagamento';
      case 'plano': return 'Plano';
      default: return 'Sistema';
    }
  };

  return (
    <DashboardLayout title="Notificações" subtitle="Acompanhe todas as suas notificações">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} notificação(ões) não lida(s)` : 'Todas as notificações foram lidas'}
          </p>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => user && marcarTodasNotificacoesLidas(user.id)}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0 divide-y">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 flex items-start gap-4 transition-colors ${!notification.lida ? 'bg-primary/5' : ''}`}
                >
                  <div className={`p-2 rounded-lg ${getTypeColor(notification.tipo)}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{notification.titulo}</h4>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(notification.tipo)}
                      </Badge>
                      {!notification.lida && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.mensagem}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.data).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {!notification.lida && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => marcarNotificacaoLida(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
