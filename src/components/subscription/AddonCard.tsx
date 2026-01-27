// ============= Card de Add-on =============

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Addon, AddonType } from '@/types/plans';
import { MessageSquare, HardDrive, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddonCardProps {
  addon: Addon;
  isActive?: boolean;
  doctorAddonId?: string;
  onToggle?: (addonType: AddonType, isActive: boolean) => void;
  onRemove?: (doctorAddonId: string) => void;
  disabled?: boolean;
}

const addonIcons: Record<AddonType, React.ReactNode> = {
  whatsapp_avancado: <MessageSquare className="h-5 w-5" />,
  armazenamento_extra: <HardDrive className="h-5 w-5" />,
  relatorios_avancados: <BarChart3 className="h-5 w-5" />,
};

export function AddonCard({ 
  addon, 
  isActive, 
  doctorAddonId,
  onToggle, 
  onRemove,
  disabled 
}: AddonCardProps) {
  const isContracted = doctorAddonId !== undefined;
  
  return (
    <Card className={cn(
      'transition-all duration-300',
      isActive && 'border-primary'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {addonIcons[addon.tipo]}
            </div>
            <div>
              <CardTitle className="text-base">{addon.nome}</CardTitle>
              <CardDescription className="text-xs">
                R$ {addon.valor.toFixed(2).replace('.', ',')}/mês
              </CardDescription>
            </div>
          </div>
          {isContracted && (
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => onToggle?.(addon.tipo, checked)}
              disabled={disabled}
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {addon.descricao}
        </p>
        
        {/* Recursos incluídos */}
        {Object.keys(addon.recursos).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {Object.entries(addon.recursos).map(([key, value]) => (
              value && (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Badge>
              )
            ))}
          </div>
        )}
        
        {/* Limites extras */}
        {addon.limites?.maxArmazenamentoMB && (
          <Badge variant="outline" className="text-xs">
            +{(addon.limites.maxArmazenamentoMB / 1000).toFixed(0)}GB de armazenamento
          </Badge>
        )}
        
        <div className="mt-4">
          {isContracted ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onRemove?.(doctorAddonId!)}
              disabled={disabled}
            >
              Cancelar Add-on
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onToggle?.(addon.tipo, true)}
              disabled={disabled}
            >
              Contratar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
