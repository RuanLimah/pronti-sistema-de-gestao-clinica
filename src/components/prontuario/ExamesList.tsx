import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Filter,
  Search,
  Calendar,
  File,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  ExameMedico,
  TipoExame,
  TIPOS_EXAME,
  formatFileSize,
  getFileIcon,
  isImageFile,
} from "@/types/exames";

interface ExamesListProps {
  exames: ExameMedico[];
  onAddClick: () => void;
  onDelete: (id: string) => void;
}

export function ExamesList({ exames, onAddClick, onDelete }: ExamesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoExame | "todos">("todos");
  const [filtroData, setFiltroData] = useState("");
  const [viewExame, setViewExame] = useState<ExameMedico | null>(null);
  const [deleteExame, setDeleteExame] = useState<ExameMedico | null>(null);

  // Helper para formatar datas com segurança
  const formatDate = (date: Date | string | undefined, options?: Intl.DateTimeFormatOptions) => {
    if (!date) return 'Data inválida';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Data inválida';
      return d.toLocaleDateString('pt-BR', options);
    } catch (e) {
      return 'Data inválida';
    }
  };

  // Filtrar exames
  const examesFiltrados = useMemo(() => {
    return exames
      .filter((exame) => {
        // Filtro por texto
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          if (
            !exame.nome.toLowerCase().includes(search) &&
            !exame.descricao?.toLowerCase().includes(search) &&
            !exame.arquivo?.nome?.toLowerCase().includes(search)
          ) {
            return false;
          }
        }

        // Filtro por tipo
        if (filtroTipo !== "todos" && exame.tipo !== filtroTipo) {
          return false;
        }

        // Filtro por data
        if (filtroData) {
          const dataExame = new Date(exame.criadoEm);
          const [ano, mes] = filtroData.split("-");
          if (
            dataExame.getFullYear() !== parseInt(ano) ||
            dataExame.getMonth() !== parseInt(mes) - 1
          ) {
            return false;
          }
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );
  }, [exames, searchTerm, filtroTipo, filtroData]);

  const handleDownload = (exame: ExameMedico) => {
    if (!exame.arquivo?.url) {
      console.error("URL do arquivo não encontrada");
      return;
    }
    const link = document.createElement("a");
    link.href = exame.arquivo.url;
    link.download = exame.arquivo.nome || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (exame: ExameMedico) => {
    if (!exame?.arquivo) {
       console.error("Exame sem arquivo");
       return;
    }

    const tipo = exame.arquivo.tipo || '';
    const url = exame.arquivo.url;

    if (!url) {
      console.error("URL do arquivo não encontrada");
      return;
    }

    if (isImageFile(tipo)) {
      setViewExame(exame);
    } else {
      // Para PDFs e outros, abrir em nova aba
      window.open(url, "_blank");
    }
  };

  const confirmDelete = () => {
    if (deleteExame) {
      onDelete(deleteExame.id);
      setDeleteExame(null);
    }
  };

  const getTipoLabel = (tipo: TipoExame) => {
    return TIPOS_EXAME.find((t) => t.value === tipo)?.label || tipo;
  };

  const getTipoIcon = (tipo: TipoExame) => {
    return TIPOS_EXAME.find((t) => t.value === tipo)?.icon || "📄";
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Exames e Documentos
            {exames.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {exames.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="hero" size="sm" onClick={onAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros */}
          {exames.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar exames..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filtroTipo}
                  onValueChange={(v) => setFiltroTipo(v as TipoExame | "todos")}
                >
                  <SelectTrigger className="w-[160px] h-9">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {TIPOS_EXAME.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="month"
                  value={filtroData}
                  onChange={(e) => setFiltroData(e.target.value)}
                  className="w-[150px] h-9"
                  placeholder="Mês/Ano"
                />
                {(searchTerm || filtroTipo !== "todos" || filtroData) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setFiltroTipo("todos");
                      setFiltroData("");
                    }}
                    className="h-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Lista de Exames */}
          {examesFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>
                {exames.length === 0
                  ? "Nenhum exame anexado."
                  : "Nenhum exame encontrado com os filtros selecionados."}
              </p>
              {exames.length === 0 && (
                <Button variant="link" className="mt-2" onClick={onAddClick}>
                  Anexar primeiro exame
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-3">
                {examesFiltrados.map((exame) => (
                  <div
                    key={exame.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Ícone / Thumbnail */}
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-border/50">
                        {isImageFile(exame.arquivo?.tipo || '') ? (
                          <img
                            src={exame.arquivo?.url}
                            alt={exame.nome}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Fallback se a imagem falhar
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <span className="text-2xl">{getFileIcon(exame.arquivo?.tipo || '')}</span>
                        )}
                        {/* Fallback oculto inicialmente */}
                        <span className="hidden text-2xl">📄</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate max-w-[200px] sm:max-w-[300px]" title={exame.nome}>
                            {exame.nome}
                          </p>
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 flex-shrink-0">
                            {getTipoLabel(exame.tipo)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="h-3 w-3" />
                            {formatDate(exame.criadoEm)}
                          </span>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <File className="h-3 w-3" />
                            {formatFileSize(exame.arquivo?.tamanho || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center justify-end gap-1 sm:gap-2 flex-shrink-0 pl-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleView(exame)}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleDownload(exame)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(exame)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(exame)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteExame(exame)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização de Imagem */}
      <Dialog open={!!viewExame} onOpenChange={() => setViewExame(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {viewExame?.nome || 'Visualização de Exame'}
            </DialogTitle>
          </DialogHeader>
          {viewExame && viewExame.arquivo && (
            <div className="flex flex-col items-center gap-4">
              {viewExame.arquivo.url ? (
                <img
                  src={viewExame.arquivo.url}
                  alt={viewExame.nome}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  onError={(e) => {
                     (e.target as HTMLImageElement).src = ''; // Clear source
                     (e.target as HTMLImageElement).alt = 'Erro ao carregar imagem';
                  }}
                />
              ) : (
                <div className="h-64 w-full flex items-center justify-center bg-muted rounded-lg">
                  <span className="text-muted-foreground">Imagem não disponível</span>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {formatDate(viewExame.criadoEm, {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span>{formatFileSize(viewExame.arquivo.tamanho || 0)}</span>
              </div>
              {viewExame.descricao && (
                <p className="text-sm text-center text-muted-foreground">
                  {viewExame.descricao}
                </p>
              )}
              <Button 
                onClick={() => handleDownload(viewExame)}
                disabled={!viewExame.arquivo.url}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteExame} onOpenChange={() => setDeleteExame(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Exame</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteExame?.nome}"? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
