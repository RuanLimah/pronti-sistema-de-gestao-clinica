import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Filter,
  Calendar,
  Save,
  Clock,
} from "lucide-react";
import { Prontuario } from "@/stores/dataStore";
import { toast } from "@/hooks/use-toast";

interface EvolucoesListProps {
  prontuarios: Prontuario[];
  pacienteNome: string;
  onAdd: (texto: string) => void;
  onEdit: (id: string, texto: string) => void;
  onDelete: (id: string) => void;
}

type FiltroTipo = 'todos' | 'dia' | 'mes' | 'ano';

export function EvolucoesList({
  prontuarios,
  pacienteNome,
  onAdd,
  onEdit,
  onDelete,
}: EvolucoesListProps) {
  // Estados de filtro
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [filtroData, setFiltroData] = useState('');
  
  // Estado de carregamento
  const [loading, setLoading] = useState(false);

  // Modal de nova anotação
  const [novaAnotacaoOpen, setNovaAnotacaoOpen] = useState(false);
  const [novaAnotacao, setNovaAnotacao] = useState("");

  // Modal de edição
  const [editOpen, setEditOpen] = useState(false);
  const [evolucaoEditando, setEvolucaoEditando] = useState<Prontuario | null>(null);
  const [textoEdit, setTextoEdit] = useState("");

  // Dialog de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [evolucaoToDelete, setEvolucaoToDelete] = useState<Prontuario | null>(null);

  // Filtrar evoluções
  const evolucoesFiltradas = useMemo(() => {
    if (filtroTipo === 'todos') return prontuarios;

    return prontuarios.filter(p => {
      const dataEvolucao = new Date(p.criadoEm);
      
      if (filtroTipo === 'dia' && filtroData) {
        const dataFiltro = new Date(filtroData);
        return dataEvolucao.toDateString() === dataFiltro.toDateString();
      }
      
      if (filtroTipo === 'mes' && filtroData) {
        const [ano, mes] = filtroData.split('-');
        return dataEvolucao.getFullYear() === parseInt(ano) && 
               dataEvolucao.getMonth() === parseInt(mes) - 1;
      }
      
      if (filtroTipo === 'ano' && filtroData) {
        return dataEvolucao.getFullYear() === parseInt(filtroData);
      }
      
      return true;
    });
  }, [prontuarios, filtroTipo, filtroData]);

  const handleAddAnotacao = async () => {
    if (!novaAnotacao.trim()) {
      toast({
        title: "Erro",
        description: "A anotação não pode estar vazia.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onAdd(novaAnotacao);
      setNovaAnotacao("");
      setNovaAnotacaoOpen(false);
      toast({
        title: "Evolução registrada",
        description: "A anotação foi adicionada ao prontuário.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar anotação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (evolucao: Prontuario) => {
    setEvolucaoEditando(evolucao);
    setTextoEdit(evolucao.texto);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!evolucaoEditando || !textoEdit.trim()) {
      toast({
        title: "Erro",
        description: "O texto da evolução não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onEdit(evolucaoEditando.id, textoEdit);
      setEditOpen(false);
      setEvolucaoEditando(null);
      setTextoEdit("");
      toast({
        title: "Evolução atualizada",
        description: "A anotação foi editada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao editar anotação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (evolucao: Prontuario) => {
    setEvolucaoToDelete(evolucao);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (evolucaoToDelete) {
      setLoading(true);
      try {
        await onDelete(evolucaoToDelete.id);
        toast({
          title: "Evolução excluída",
          description: "A anotação foi removida do prontuário.",
        });
        setDeleteOpen(false);
        setEvolucaoToDelete(null);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir anotação. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Evoluções Clínicas
            {prontuarios.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {prontuarios.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {/* Dropdown de Filtros */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-3 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Filtrar por:</Label>
                  <Select 
                    value={filtroTipo} 
                    onValueChange={(v) => {
                      setFiltroTipo(v as FiltroTipo);
                      setFiltroData('');
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="dia">Por Dia</SelectItem>
                      <SelectItem value="mes">Por Mês</SelectItem>
                      <SelectItem value="ano">Por Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {filtroTipo === 'dia' && (
                  <div className="space-y-2">
                    <Label className="text-xs">Data:</Label>
                    <Input 
                      type="date" 
                      className="h-8 text-xs"
                      value={filtroData}
                      onChange={(e) => setFiltroData(e.target.value)}
                    />
                  </div>
                )}
                {filtroTipo === 'mes' && (
                  <div className="space-y-2">
                    <Label className="text-xs">Mês/Ano:</Label>
                    <Input 
                      type="month" 
                      className="h-8 text-xs"
                      value={filtroData}
                      onChange={(e) => setFiltroData(e.target.value)}
                    />
                  </div>
                )}
                {filtroTipo === 'ano' && (
                  <div className="space-y-2">
                    <Label className="text-xs">Ano:</Label>
                    <Input 
                      type="number" 
                      className="h-8 text-xs"
                      placeholder="2024"
                      min={2000}
                      max={2100}
                      value={filtroData}
                      onChange={(e) => setFiltroData(e.target.value)}
                    />
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="hero" size="sm" onClick={() => setNovaAnotacaoOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {evolucoesFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>
                {prontuarios.length === 0 
                  ? "Nenhuma evolução registrada." 
                  : "Nenhuma evolução encontrada com o filtro selecionado."}
              </p>
              {prontuarios.length === 0 && (
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => setNovaAnotacaoOpen(true)}
                >
                  Adicionar primeira anotação
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {evolucoesFiltradas.map((prontuario) => (
                  <div 
                    key={prontuario.id} 
                    className="border-l-2 border-primary/30 pl-4 pb-4 group relative"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(prontuario.criadoEm).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(prontuario.criadoEm).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {prontuario.atualizadoEm && (
                          <Badge variant="outline" className="text-xs">
                            editado
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(prontuario)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleOpenDelete(prontuario)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{prontuario.texto}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Anotação */}
      <Dialog open={novaAnotacaoOpen} onOpenChange={setNovaAnotacaoOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Evolução</DialogTitle>
            <DialogDescription>
              Registre uma nova anotação clínica para {pacienteNome}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={novaAnotacao}
              onChange={(e) => setNovaAnotacao(e.target.value)}
              placeholder="Descreva a evolução do paciente, observações da sessão, progressos, etc..."
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Data: {new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAnotacaoOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleAddAnotacao} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Anotação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Evolução */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Evolução</DialogTitle>
            <DialogDescription>
              Edite a anotação clínica
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={textoEdit}
              onChange={(e) => setTextoEdit(e.target.value)}
              placeholder="Texto da evolução..."
              className="min-h-[200px]"
            />
            {evolucaoEditando && (
              <p className="text-xs text-muted-foreground mt-2">
                Criada em: {new Date(evolucaoEditando.criadoEm).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleSaveEdit} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Evolução</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta anotação clínica? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
