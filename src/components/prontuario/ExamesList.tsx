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
            !exame.arquivo.nome.toLowerCase().includes(search)
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
    const link = document.createElement("a");
    link.href = exame.arquivo.url;
    link.download = exame.arquivo.nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (exame: ExameMedico) => {
    if (isImageFile(exame.arquivo.tipo)) {
      setViewExame(exame);
    } else {
      // Para PDFs e outros, abrir em nova aba
      window.open(exame.arquivo.url, "_blank");
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
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    {/* Ícone / Thumbnail */}
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {isImageFile(exame.arquivo.tipo) ? (
                        <img
                          src={exame.arquivo.url}
                          alt={exame.nome}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{getFileIcon(exame.arquivo.tipo)}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {exame.nome}
                        </p>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {getTipoIcon(exame.tipo)} {getTipoLabel(exame.tipo)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(exame.criadoEm).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <File className="h-3 w-3" />
                          {formatFileSize(exame.arquivo.tamanho)}
                        </span>
                      </div>
                      {exame.descricao && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {exame.descricao}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleView(exame)}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(exame)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
              {viewExame?.nome}
            </DialogTitle>
          </DialogHeader>
          {viewExame && (
            <div className="flex flex-col items-center gap-4">
              <img
                src={viewExame.arquivo.url}
                alt={viewExame.nome}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {new Date(viewExame.criadoEm).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span>{formatFileSize(viewExame.arquivo.tamanho)}</span>
              </div>
              {viewExame.descricao && (
                <p className="text-sm text-center text-muted-foreground">
                  {viewExame.descricao}
                </p>
              )}
              <Button onClick={() => handleDownload(viewExame)}>
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
