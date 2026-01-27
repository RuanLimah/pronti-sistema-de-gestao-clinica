import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Phone,
  Calendar,
  SendHorizonal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataStore, Atendimento } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";

const defaultTemplate = `Olá {nome}! 

Lembrete: sua consulta está agendada para {data} às {horario}. 

Confirma sua presença? 
✅ Confirmo
❌ Preciso reagendar

Atenciosamente,
PRONTI - Sistema de Gestão`;

export default function WhatsApp() {
  const { user } = useAuthStore();
  const { 
    getAtendimentosFuturos, 
    getPacienteById, 
    marcarLembreteEnviado,
    isAtendimentoPassado 
  } = useDataStore();
  
  const medicoId = user?.id || "";

  const [template, setTemplate] = useState(defaultTemplate);
  const [autoSend, setAutoSend] = useState(true);
  const [reminderHours, setReminderHours] = useState("24");
  const [isSaving, setIsSaving] = useState(false);

  // Obter atendimentos futuros para mensagens
  const atendimentosFuturos = useMemo(() => {
    return getAtendimentosFuturos(medicoId);
  }, [medicoId, getAtendimentosFuturos]);

  // Mensagens programadas derivadas dos atendimentos
  const scheduledMessages = useMemo(() => {
    return atendimentosFuturos.map((atendimento) => {
      const paciente = getPacienteById(atendimento.pacienteId);
      const horasAntecedencia = parseInt(reminderHours) || 24;
      
      // Calcular quando a mensagem deve ser enviada
      const dataAtendimento = new Date(atendimento.data);
      const [hora, minuto] = atendimento.hora.split(':').map(Number);
      dataAtendimento.setHours(hora, minuto, 0, 0);
      
      const dataEnvio = new Date(dataAtendimento.getTime() - horasAntecedencia * 60 * 60 * 1000);
      const agora = new Date();
      
      // Determinar status
      let status: 'sent' | 'pending' | 'scheduled' = 'scheduled';
      if (atendimento.whatsappLembreteSent) {
        status = 'sent';
      } else if (dataEnvio <= agora) {
        status = 'pending'; // Deveria ter sido enviado mas não foi
      }

      // Montar mensagem personalizada
      const mensagemPersonalizada = template
        .replace('{nome}', paciente?.nome || 'Paciente')
        .replace('{data}', new Date(atendimento.data).toLocaleDateString('pt-BR'))
        .replace('{horario}', atendimento.hora);

      return {
        id: atendimento.id,
        atendimento,
        paciente,
        mensagem: mensagemPersonalizada,
        dataEnvio,
        dataConsulta: dataAtendimento,
        status,
        sentAt: atendimento.whatsappLembreteSentAt,
      };
    });
  }, [atendimentosFuturos, template, reminderHours, getPacienteById]);

  // Stats
  const stats = useMemo(() => ({
    pending: scheduledMessages.filter(m => m.status === 'pending').length,
    scheduled: scheduledMessages.filter(m => m.status === 'scheduled').length,
    sent: scheduledMessages.filter(m => m.status === 'sent').length,
  }), [scheduledMessages]);

  // Enviar mensagem individual
  const handleSendNow = (atendimentoId: string) => {
    const msg = scheduledMessages.find(m => m.id === atendimentoId);
    if (!msg || !msg.paciente) return;

    const tel = msg.paciente.telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(msg.mensagem);
    
    // Abrir WhatsApp
    window.open(`https://wa.me/55${tel}?text=${mensagem}`, '_blank');
    
    // Marcar como enviado
    marcarLembreteEnviado(atendimentoId);
    
    toast({
      title: "Mensagem enviada",
      description: `Lembrete enviado para ${msg.paciente.nome}.`,
    });
  };

  // Enviar para todos pendentes
  const handleSendAll = () => {
    const pendentes = scheduledMessages.filter(m => m.status !== 'sent' && m.paciente);
    
    if (pendentes.length === 0) {
      toast({
        title: "Nenhuma mensagem pendente",
        description: "Todas as mensagens já foram enviadas.",
      });
      return;
    }

    // Enviar cada mensagem (com pequeno delay para não bloquear)
    pendentes.forEach((msg, index) => {
      setTimeout(() => {
        if (msg.paciente) {
          const tel = msg.paciente.telefone.replace(/\D/g, '');
          const mensagem = encodeURIComponent(msg.mensagem);
          window.open(`https://wa.me/55${tel}?text=${mensagem}`, '_blank');
          marcarLembreteEnviado(msg.id);
        }
      }, index * 1000); // 1 segundo entre cada
    });

    toast({
      title: "Enviando mensagens",
      description: `${pendentes.length} mensagens sendo enviadas.`,
    });
  };

  // Salvar configurações
  const handleSaveConfig = () => {
    setIsSaving(true);
    // Simular salvamento (em produção seria persistido)
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Configurações salvas",
        description: "As configurações de mensagem foram atualizadas.",
      });
    }, 500);
  };

  return (
    <DashboardLayout
      title="WhatsApp"
      subtitle="Envie lembretes automáticos para seus pacientes"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="interactive">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold font-display">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agendados</p>
                <p className="text-2xl font-bold font-display">{stats.scheduled}</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enviados</p>
                <p className="text-2xl font-bold font-display">{stats.sent}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração de Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Template da Mensagem</Label>
                <Textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis disponíveis: {"{nome}"}, {"{data}"}, {"{horario}"}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Envio Automático</p>
                    <p className="text-sm text-muted-foreground">
                      Preparar lembretes automaticamente
                    </p>
                  </div>
                </div>
                <Switch checked={autoSend} onCheckedChange={setAutoSend} />
              </div>

              <div className="space-y-2">
                <Label>Horas antes da consulta</Label>
                <Input
                  type="number"
                  value={reminderHours}
                  onChange={(e) => setReminderHours(e.target.value)}
                  className="w-32"
                  min="1"
                  max="72"
                />
                <p className="text-xs text-muted-foreground">
                  As mensagens serão preparadas {reminderHours} horas antes de cada consulta
                </p>
              </div>

              <Button 
                variant="hero" 
                className="w-full" 
                onClick={handleSaveConfig}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>

          {/* Scheduled Messages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Mensagens Programadas</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSendAll}
                disabled={stats.pending + stats.scheduled === 0}
              >
                <SendHorizonal className="h-4 w-4 mr-2" />
                Enviar Todos
              </Button>
            </CardHeader>
            <CardContent>
              {scheduledMessages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma consulta futura agendada.</p>
                  <p className="text-sm">Os lembretes aparecerão aqui automaticamente.</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {scheduledMessages.map((message, index) => (
                      <div
                        key={message.id}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          message.status === "pending" && "bg-warning/5 border-warning/30",
                          message.status === "sent" && "opacity-60 bg-muted/30",
                          message.status === "scheduled" && "hover:bg-muted/30"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center",
                              message.status === 'sent' ? "bg-success/10" : 
                              message.status === 'pending' ? "bg-warning/10" : "bg-primary/10"
                            )}>
                              <MessageSquare className={cn(
                                "h-4 w-4",
                                message.status === 'sent' ? "text-success" :
                                message.status === 'pending' ? "text-warning" : "text-primary"
                              )} />
                            </div>
                            <div>
                              <p className="font-medium">{message.paciente?.nome || 'Paciente'}</p>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {message.paciente?.telefone}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              message.status === "sent"
                                ? "success"
                                : message.status === "pending"
                                ? "pending"
                                : "secondary"
                            }
                          >
                            {message.status === "sent"
                              ? "Enviado"
                              : message.status === "pending"
                              ? "Pendente"
                              : "Agendado"}
                          </Badge>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
                            {message.mensagem}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Consulta: {message.dataConsulta.toLocaleDateString('pt-BR')} às {message.atendimento.hora}
                            </span>
                            {message.status === 'sent' && message.sentAt && (
                              <span className="text-xs text-success flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Enviado em: {new Date(message.sentAt).toLocaleString('pt-BR')}
                              </span>
                            )}
                          </div>
                          {message.status !== "sent" && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSendNow(message.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Enviar Agora
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
