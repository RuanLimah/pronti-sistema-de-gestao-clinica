import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MoreVertical, 
  CheckCircle, 
  PauseCircle, 
  Ban, 
  Crown, 
  Settings, 
  History,
  Mail,
  Phone,
  Calendar,
  Clock
} from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import { Doctor, DoctorStatus } from "@/types/admin";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DoctorCardProps {
  doctor: Doctor;
  onViewDetails: (doctor: Doctor) => void;
  onViewHistory: (doctor: Doctor) => void;
}

export function DoctorCard({ doctor, onViewDetails, onViewHistory }: DoctorCardProps) {
  const updateDoctorStatus = useAdminStore(state => state.updateDoctorStatus);
  const updateDoctorPlan = useAdminStore(state => state.updateDoctorPlan);
  
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; status: DoctorStatus | null }>({ 
    open: false, 
    status: null 
  });
  const [motivo, setMotivo] = useState("");

  const handleStatusChange = (newStatus: DoctorStatus) => {
    if (newStatus === 'ativo') {
      updateDoctorStatus(doctor.id, newStatus);
    } else {
      setStatusDialog({ open: true, status: newStatus });
    }
  };

  const confirmStatusChange = () => {
    if (statusDialog.status) {
      updateDoctorStatus(doctor.id, statusDialog.status, motivo);
      setStatusDialog({ open: false, status: null });
      setMotivo("");
    }
  };

  const getStatusBadge = (status: DoctorStatus) => {
    const configs = {
      ativo: { className: 'bg-success/10 text-success border-success/20', icon: CheckCircle, label: 'Ativo' },
      suspenso: { className: 'bg-warning/10 text-warning border-warning/20', icon: PauseCircle, label: 'Suspenso' },
      bloqueado: { className: 'bg-destructive/10 text-destructive border-destructive/20', icon: Ban, label: 'Bloqueado' },
    };
    const config = configs[status];
    return (
      <Badge variant="outline" className={`${config.className} gap-1`}>
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPlanBadge = (plano: string) => {
    switch (plano) {
      case 'premium':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        );
      case 'profissional':
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
            Profissional
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground gap-1">
            Básico
          </Badge>
        );
    }
  };

  const initials = doctor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const ultimoAcesso = formatDistanceToNow(new Date(doctor.ultimoAcesso), { addSuffix: true, locale: ptBR });

  return (
    <>
      <Card className={`card-interactive ${doctor.status === 'bloqueado' ? 'opacity-60' : ''}`}>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar and Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar className="h-12 w-12 md:h-14 md:w-14 shrink-0">
                <AvatarImage src={doctor.foto} alt={doctor.nome} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-semibold truncate">{doctor.nome}</h4>
                  {getStatusBadge(doctor.status)}
                  {getPlanBadge(doctor.plano)}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{doctor.email}</span>
                  </span>
                  {doctor.telefone && (
                    <span className="flex items-center gap-1 hidden sm:flex">
                      <Phone className="h-3 w-3" />
                      {doctor.telefone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    CRP {doctor.crp}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Clock className="h-3 w-3" />
                  Último acesso {ultimoAcesso}
                </div>

                {(doctor.suspensaoMotivo || doctor.bloqueioMotivo) && (
                  <p className="text-xs text-destructive mt-2 bg-destructive/5 px-2 py-1 rounded">
                    {doctor.suspensaoMotivo || doctor.bloqueioMotivo}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:ml-4 justify-end sm:justify-start">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewDetails(doctor)}
                className="hidden sm:flex"
              >
                <Settings className="h-4 w-4 mr-1" />
                Gerenciar
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuItem onClick={() => onViewDetails(doctor)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar Módulos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewHistory(doctor)}>
                    <History className="h-4 w-4 mr-2" />
                    Ver Histórico
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => updateDoctorPlan(doctor.id, 'basico')}
                    disabled={doctor.plano === 'basico'}
                  >
                    Plano Básico
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => updateDoctorPlan(doctor.id, 'profissional')}
                    disabled={doctor.plano === 'profissional'}
                  >
                    Plano Profissional
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => updateDoctorPlan(doctor.id, 'premium')}
                    disabled={doctor.plano === 'premium'}
                  >
                    Plano Premium
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {doctor.status !== 'ativo' && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange('ativo')}
                      className="text-success"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Ativar
                    </DropdownMenuItem>
                  )}
                  {doctor.status !== 'suspenso' && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange('suspenso')}
                      className="text-warning"
                    >
                      <PauseCircle className="h-4 w-4 mr-2" />
                      Suspender
                    </DropdownMenuItem>
                  )}
                  {doctor.status !== 'bloqueado' && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange('bloqueado')}
                      className="text-destructive"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Bloquear
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => !open && setStatusDialog({ open: false, status: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusDialog.status === 'suspenso' ? 'Suspender' : 'Bloquear'} Médico
            </DialogTitle>
            <DialogDescription>
              {statusDialog.status === 'suspenso' 
                ? 'O médico terá acesso limitado ao sistema até ser reativado.'
                : 'O médico perderá todo o acesso ao sistema e seus módulos serão desativados.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Médico</Label>
              <p className="text-sm font-medium">{doctor.nome}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Textarea
                id="motivo"
                placeholder="Descreva o motivo da ação..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setStatusDialog({ open: false, status: null })}>
              Cancelar
            </Button>
            <Button 
              variant={statusDialog.status === 'bloqueado' ? 'destructive' : 'default'}
              onClick={confirmStatusChange}
            >
              Confirmar {statusDialog.status === 'suspenso' ? 'Suspensão' : 'Bloqueio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
