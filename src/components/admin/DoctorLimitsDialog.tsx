
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Crown,
  CheckCircle,
  PauseCircle,
  Ban,
  Users,
  FileText,
  Zap,
} from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import { Doctor } from "@/types/admin";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface DoctorLimitsDialogProps {
  doctor: Doctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DoctorLimitsDialog({ doctor, open, onOpenChange }: DoctorLimitsDialogProps) {
  const updateDoctorLimits = useAdminStore(state => state.updateDoctorLimits);
  const plans = useAdminStore(state => state.plans);
  const { toast } = useToast();

  const [limits, setLimits] = useState<{
    maxPacientes: string;
    maxProntuarios: string;
    maxUsuarios: string;
  }>({
    maxPacientes: "",
    maxProntuarios: "",
    maxUsuarios: "",
  });

  // Get current plan limits
  const currentPlan = doctor ? plans.find(p => p.tier === doctor.plano) : null;

  useEffect(() => {
    if (doctor) {
      setLimits({
        maxPacientes: doctor.customLimits?.maxPacientes?.toString() ?? "",
        maxProntuarios: doctor.customLimits?.maxProntuarios?.toString() ?? "",
        maxUsuarios: doctor.customLimits?.maxUsuarios?.toString() ?? "",
      });
    }
  }, [doctor]);

  if (!doctor) return null;

  const handleSave = async () => {
    const newLimits = {
      maxPacientes: limits.maxPacientes ? parseInt(limits.maxPacientes) : null,
      maxProntuarios: limits.maxProntuarios ? parseInt(limits.maxProntuarios) : null,
      maxUsuarios: limits.maxUsuarios ? parseInt(limits.maxUsuarios) : undefined,
    };

    // Filter out undefined/null if they are not meant to be set (empty string means remove custom limit)
    // Actually, empty string means "no custom limit", so we pass undefined or null?
    // If user clears the input, we want to revert to plan limits.
    // Let's say if input is empty, we remove the custom limit.
    // If input is "0", it's 0.
    
    // But Partial<Plan['limites']> keys are nullable.
    // So we need to decide what empty string means.
    // Let's assume empty string = remove custom limit (revert to plan default)
    
    const cleanLimits: any = {};
    if (limits.maxPacientes !== "") cleanLimits.maxPacientes = parseInt(limits.maxPacientes);
    if (limits.maxProntuarios !== "") cleanLimits.maxProntuarios = parseInt(limits.maxProntuarios);
    if (limits.maxUsuarios !== "") cleanLimits.maxUsuarios = parseInt(limits.maxUsuarios);

    await updateDoctorLimits(doctor.id, cleanLimits);
    
    toast({
      title: "Limites atualizados",
      description: "Os limites personalizados foram salvos com sucesso.",
    });
    
    onOpenChange(false);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      ativo: { className: 'bg-success/10 text-success', icon: CheckCircle, label: 'Ativo' },
      suspenso: { className: 'bg-warning/10 text-warning', icon: PauseCircle, label: 'Suspenso' },
      bloqueado: { className: 'bg-destructive/10 text-destructive', icon: Ban, label: 'Bloqueado' },
    };
    const config = configs[status as keyof typeof configs] || configs.ativo;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Definir Limites Personalizados</DialogTitle>
          <DialogDescription>
            Defina limites específicos para este cliente. Deixe em branco para usar os limites do plano.
          </DialogDescription>
        </DialogHeader>
        
        {/* Doctor Info */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-4">
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

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPacientes" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Máx. Pacientes
              </Label>
              <Input
                id="maxPacientes"
                type="number"
                placeholder={`Plano: ${currentPlan?.limites.maxPacientes ?? '∞'}`}
                value={limits.maxPacientes}
                onChange={(e) => setLimits({ ...limits, maxPacientes: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Limite atual do plano: {currentPlan?.limites.maxPacientes ?? 'Ilimitado'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxProntuarios" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Máx. Prontuários
              </Label>
              <Input
                id="maxProntuarios"
                type="number"
                placeholder={`Plano: ${currentPlan?.limites.maxProntuarios ?? '∞'}`}
                value={limits.maxProntuarios}
                onChange={(e) => setLimits({ ...limits, maxProntuarios: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Limite atual do plano: {currentPlan?.limites.maxProntuarios ?? 'Ilimitado'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUsuarios" className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                Máx. Usuários
              </Label>
              <Input
                id="maxUsuarios"
                type="number"
                placeholder={`Plano: ${currentPlan?.limites.maxUsuarios ?? 1}`}
                value={limits.maxUsuarios}
                onChange={(e) => setLimits({ ...limits, maxUsuarios: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Limite atual do plano: {currentPlan?.limites.maxUsuarios ?? 1}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Limites
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
