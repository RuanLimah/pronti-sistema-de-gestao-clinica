import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Lock,
  Bell,
  Clock,
  Shield,
  Upload,
  DollarSign,
  Save,
  Check,
  X,
} from "lucide-react";
import { useDataStore, Configuracoes as ConfigType } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const { user } = useAuthStore();
  const { 
    getConfiguracoesByMedico, 
    initConfiguracoes, 
    updateConfiguracoes,
    getPacientesByMedico,
    updatePaciente,
    getPacienteById,
  } = useDataStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados do perfil
  const [perfilNome, setPerfilNome] = useState("");
  const [perfilEmail, setPerfilEmail] = useState("");
  const [perfilCrp, setPerfilCrp] = useState("");
  const [perfilTelefone, setPerfilTelefone] = useState("");
  const [perfilEspecialidades, setPerfilEspecialidades] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [perfilSaving, setPerfilSaving] = useState(false);

  // Estados das configurações
  const [config, setConfig] = useState<Partial<ConfigType>>({});
  const [configSaving, setConfigSaving] = useState(false);

  // Dialog valor customizado por paciente
  const [valorPacienteOpen, setValorPacienteOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState("");
  const [valorCustomizado, setValorCustomizado] = useState("");

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.id) {
      // Inicializar configurações se não existirem
      const existingConfig = getConfiguracoesByMedico(user.id);
      if (!existingConfig) {
        initConfiguracoes(user.id);
      }
      
      const currentConfig = getConfiguracoesByMedico(user.id);
      if (currentConfig) {
        setConfig(currentConfig);
        setAvatarUrl(currentConfig.avatarUrl);
      }

      // Carregar dados do perfil
      setPerfilNome(user.nome || "");
      setPerfilEmail(user.email || "");
      setPerfilCrp((user as any).crp || "");
      setPerfilTelefone((user as any).telefone || "");
      setPerfilEspecialidades((user as any).especialidades || "");
    }
  }, [user?.id]);

  const pacientes = user?.id ? getPacientesByMedico(user.id) : [];

  const handleSavePerfil = async () => {
    if (!user?.id) return;
    
    setPerfilSaving(true);
    try {
      // Aqui salvaria no backend - por enquanto apenas simula
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Perfil salvo",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } finally {
      setPerfilSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!user?.id) return;
    
    setConfigSaving(true);
    try {
      updateConfiguracoes(user.id, config);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSaveNotificacoes = () => {
    if (!user?.id) return;
    
    updateConfiguracoes(user.id, {
      notificacaoLembrete: config.notificacaoLembrete,
      notificacaoAgendamento: config.notificacaoAgendamento,
      notificacaoPagamento: config.notificacaoPagamento,
      notificacaoRelatorio: config.notificacaoRelatorio,
    });
    
    toast({
      title: "Preferências salvas",
      description: "Suas preferências de notificação foram atualizadas.",
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 2MB.",
        variant: "destructive",
      });
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo inválido",
        description: "Apenas imagens são permitidas.",
        variant: "destructive",
      });
      return;
    }

    // Converter para base64 e salvar
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarUrl(base64);
      
      if (user?.id) {
        updateConfiguracoes(user.id, { avatarUrl: base64 });
        toast({
          title: "Foto atualizada",
          description: "Sua foto de perfil foi alterada.",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveValorPaciente = () => {
    if (!selectedPacienteId) return;
    
    const valor = parseFloat(valorCustomizado);
    if (isNaN(valor) || valor < 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor válido.",
        variant: "destructive",
      });
      return;
    }

    updatePaciente(selectedPacienteId, { valorConsulta: valor });
    setValorPacienteOpen(false);
    setSelectedPacienteId("");
    setValorCustomizado("");
    
    toast({
      title: "Valor atualizado",
      description: "O valor da consulta foi personalizado para este paciente.",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DashboardLayout title="Configurações" subtitle="Gerencie suas preferências">
      <div className="max-w-4xl space-y-6 animate-fade-in">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Perfil Profissional</CardTitle>
            </div>
            <CardDescription>
              Informações exibidas para seus pacientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl font-semibold">
                  {getInitials(perfilNome || user?.nome || "U")}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Alterar Foto
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG ou GIF. Máximo 2MB.
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input 
                  value={perfilNome}
                  onChange={(e) => setPerfilNome(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label>CRP</Label>
                <Input 
                  value={perfilCrp}
                  onChange={(e) => setPerfilCrp(e.target.value)}
                  placeholder="06/123456"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input 
                  type="email" 
                  value={perfilEmail}
                  onChange={(e) => setPerfilEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={perfilTelefone}
                  onChange={(e) => setPerfilTelefone(e.target.value)}
                  placeholder="(11) 98765-4321"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Especialidades</Label>
              <Input 
                value={perfilEspecialidades}
                onChange={(e) => setPerfilEspecialidades(e.target.value)}
                placeholder="Psicologia Clínica, Terapia Cognitivo-Comportamental"
              />
            </div>

            <Button variant="hero" onClick={handleSavePerfil} disabled={perfilSaving}>
              {perfilSaving ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Schedule Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Configurações de Agenda</CardTitle>
            </div>
            <CardDescription>
              Defina seus horários de atendimento e valores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Duração da Sessão (min)</Label>
                <Input 
                  type="number" 
                  value={config.duracaoSessao || 50}
                  onChange={(e) => setConfig({ ...config, duracaoSessao: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Intervalo entre Sessões (min)</Label>
                <Input 
                  type="number" 
                  value={config.intervaloSessoes || 10}
                  onChange={(e) => setConfig({ ...config, intervaloSessoes: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  Valor Padrão (R$)
                </Label>
                <Input 
                  type="number" 
                  value={config.valorPadraoConsulta || 200}
                  onChange={(e) => setConfig({ ...config, valorPadraoConsulta: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Horário de Atendimento</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Início</Label>
                  <Input 
                    type="time" 
                    value={config.horarioInicio || "08:00"}
                    onChange={(e) => setConfig({ ...config, horarioInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Término</Label>
                  <Input 
                    type="time" 
                    value={config.horarioFim || "18:00"}
                    onChange={(e) => setConfig({ ...config, horarioFim: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Valor customizado por paciente */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Valor por Paciente</Label>
                  <p className="text-sm text-muted-foreground">
                    Defina valores personalizados para pacientes específicos
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setValorPacienteOpen(true)}>
                  Personalizar
                </Button>
              </div>

              {pacientes.filter(p => p.valorConsulta && p.valorConsulta !== config.valorPadraoConsulta).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Valores personalizados:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {pacientes
                      .filter(p => p.valorConsulta && p.valorConsulta !== config.valorPadraoConsulta)
                      .map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm">{p.nome}</span>
                          <span className="text-sm font-medium text-success">
                            R$ {p.valorConsulta?.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <Button variant="hero" onClick={handleSaveConfig} disabled={configSaving}>
              {configSaving ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Notificações</CardTitle>
            </div>
            <CardDescription>
              Gerencie como você recebe alertas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Lembrete de atendimento</p>
                <p className="text-sm text-muted-foreground">30 minutos antes</p>
              </div>
              <Switch 
                checked={config.notificacaoLembrete ?? true}
                onCheckedChange={(checked) => setConfig({ ...config, notificacaoLembrete: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Novo agendamento</p>
                <p className="text-sm text-muted-foreground">Quando um paciente agendar</p>
              </div>
              <Switch 
                checked={config.notificacaoAgendamento ?? true}
                onCheckedChange={(checked) => setConfig({ ...config, notificacaoAgendamento: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Pagamento pendente</p>
                <p className="text-sm text-muted-foreground">Após 3 dias</p>
              </div>
              <Switch 
                checked={config.notificacaoPagamento ?? true}
                onCheckedChange={(checked) => setConfig({ ...config, notificacaoPagamento: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Relatório semanal</p>
                <p className="text-sm text-muted-foreground">Todo domingo às 20h</p>
              </div>
              <Switch 
                checked={config.notificacaoRelatorio ?? true}
                onCheckedChange={(checked) => setConfig({ ...config, notificacaoRelatorio: checked })}
              />
            </div>

            <Button variant="outline" onClick={handleSaveNotificacoes}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Preferências
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Segurança</CardTitle>
            </div>
            <CardDescription>
              Proteja sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Alterar Senha</p>
                  <p className="text-sm text-muted-foreground">Última alteração há 30 dias</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Alterar</Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Autenticação em Duas Etapas</p>
                  <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                </div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Valor por Paciente */}
      <Dialog open={valorPacienteOpen} onOpenChange={setValorPacienteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valor Personalizado</DialogTitle>
            <DialogDescription>
              Defina um valor de consulta específico para um paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={selectedPacienteId} onValueChange={setSelectedPacienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.filter(p => p.status === 'ativo').map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                      {p.valorConsulta && (
                        <span className="text-muted-foreground ml-2">
                          (R$ {p.valorConsulta.toFixed(2)})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor da Consulta (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={valorCustomizado}
                onChange={(e) => setValorCustomizado(e.target.value)}
                placeholder={config.valorPadraoConsulta?.toString() || "200.00"}
              />
              <p className="text-xs text-muted-foreground">
                Valor padrão: R$ {config.valorPadraoConsulta?.toFixed(2) || "200.00"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValorPacienteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleSaveValorPaciente}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
