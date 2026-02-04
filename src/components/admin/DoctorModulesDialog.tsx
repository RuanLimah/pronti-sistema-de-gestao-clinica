import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  BarChart3, 
  FileText,
  Crown,
  CheckCircle,
  PauseCircle,
  Ban
} from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import { Doctor, DoctorModules } from "@/types/admin";

interface DoctorModulesDialogProps {
  doctor: Doctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const moduleConfig: { key: keyof DoctorModules; label: string; description: string; icon: React.ElementType }[] = [
  { key: 'agenda', label: 'Agenda', description: 'Gerenciamento de consultas e horários', icon: Calendar },
  { key: 'financeiro', label: 'Financeiro', description: 'Controle de pagamentos e faturamento', icon: DollarSign },
  { key: 'whatsapp', label: 'WhatsApp', description: 'Envio automático de mensagens', icon: MessageSquare },
  { key: 'relatorios', label: 'Relatórios', description: 'Relatórios e análises avançadas', icon: BarChart3 },
  { key: 'prontuario', label: 'Prontuário', description: 'Prontuário eletrônico do paciente', icon: FileText },
];

export function DoctorModulesDialog({ doctor, open, onOpenChange }: DoctorModulesDialogProps) {
  const updateDoctorModule = useAdminStore(state => state.updateDoctorModule);

  if (!doctor) return null;

  const handleModuleToggle = (module: keyof DoctorModules, enabled: boolean) => {
    updateDoctorModule(doctor.id, module, enabled);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      ativo: { className: 'bg-success/10 text-success', icon: CheckCircle, label: 'Ativo' },
      suspenso: { className: 'bg-warning/10 text-warning', icon: PauseCircle, label: 'Suspenso' },
      bloqueado: { className: 'bg-destructive/10 text-destructive', icon: Ban, label: 'Bloqueado' },
    };
    const config = configs[status as keyof typeof configs];
    return (
      <Badge variant="secondary" className={`${config.className} gap-1`}>
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPlanBadge = (plano: string) => {
    switch (plano) {
      case 'premium':
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 gap-1">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        );
      case 'profissional':
        return (
          <Badge variant="secondary" className="bg-primary/10 text-primary gap-1">
            Profissional
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground gap-1">
            Básico
          </Badge>
        );
    }
  };

  const initials = doctor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isBlocked = doctor.status === 'bloqueado';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Módulos</DialogTitle>
          <DialogDescription>
            Ative ou desative módulos específicos para este médico.
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
          <div className="flex flex-col gap-1 items-end">
            {getStatusBadge(doctor.status)}
            {getPlanBadge(doctor.plano)}
          </div>
        </div>

        {isBlocked && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            Este médico está bloqueado. Todos os módulos estão desativados automaticamente.
          </div>
        )}

        {/* Modules List */}
        <div className="space-y-4 py-2">
          {moduleConfig.map((module) => {
            const Icon = module.icon;
            const isEnabled = doctor.modules[module.key];
            
            return (
              <div 
                key={module.key} 
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  isEnabled && !isBlocked ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isEnabled && !isBlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <Label htmlFor={module.key} className="font-medium cursor-pointer">
                      {module.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                  </div>
                </div>
                <Switch
                  id={module.key}
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleModuleToggle(module.key, checked)}
                  disabled={isBlocked}
                />
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
