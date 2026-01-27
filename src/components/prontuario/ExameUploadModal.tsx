import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, Image, Save, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  ExameMedico,
  TipoExame,
  TIPOS_EXAME,
  FORMATOS_ACEITOS,
  MAX_FILE_SIZE,
  formatFileSize,
  isImageFile,
} from "@/types/exames";

interface ExameUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  medicoId?: string;
  onUpload: (exame: Omit<ExameMedico, 'id' | 'criadoEm'>) => void;
}

export function ExameUploadModal({
  open,
  onOpenChange,
  pacienteId,
  medicoId,
  onUpload,
}: ExameUploadModalProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoExame>("laboratorio");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setNome("");
    setTipo("laboratorio");
    setDescricao("");
    setArquivo(null);
    setPreview(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleFileSelect = (file: File) => {
    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: `O tamanho máximo permitido é ${formatFileSize(MAX_FILE_SIZE)}`,
        variant: "destructive",
      });
      return;
    }

    // Validar formato
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!FORMATOS_ACEITOS.todos.includes(extension)) {
      toast({
        title: "Formato não suportado",
        description: "Formatos aceitos: PDF, DOC, DOCX, JPG, PNG, WEBP, GIF",
        variant: "destructive",
      });
      return;
    }

    setArquivo(file);
    
    // Auto-fill nome se vazio
    if (!nome) {
      const nomeArquivo = file.name.replace(/\.[^/.]+$/, "");
      setNome(nomeArquivo);
    }

    // Preview para imagens
    if (isImageFile(file.type)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do exame.",
        variant: "destructive",
      });
      return;
    }

    if (!arquivo) {
      toast({
        title: "Arquivo obrigatório",
        description: "Selecione um arquivo para upload.",
        variant: "destructive",
      });
      return;
    }

    // Criar URL local (será substituído por Supabase Storage)
    const localUrl = URL.createObjectURL(arquivo);

    onUpload({
      pacienteId,
      medicoId,
      nome: nome.trim(),
      tipo,
      descricao: descricao.trim() || undefined,
      arquivo: {
        nome: arquivo.name,
        tipo: arquivo.type,
        tamanho: arquivo.size,
        url: localUrl,
      },
    });

    toast({
      title: "Exame anexado",
      description: "O arquivo foi adicionado ao prontuário.",
    });

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Exame
          </DialogTitle>
          <DialogDescription>
            Anexe exames, laudos, receitas ou outros documentos médicos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Área de Drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5"
                : arquivo
                ? "border-primary/50 bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={FORMATOS_ACEITOS.todos.join(",")}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {arquivo ? (
              <div className="flex flex-col items-center gap-3">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-32 max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <FileText className="h-12 w-12 text-primary" />
                )}
                <div className="flex flex-col items-center">
                  <p className="font-medium text-sm truncate max-w-[300px]">
                    {arquivo.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(arquivo.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArquivo(null);
                    setPreview(null);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    Arraste um arquivo ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX, JPG, PNG, WEBP (máx. 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Nome do Exame */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Exame *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Hemograma Completo"
            />
          </div>

          {/* Tipo do Exame */}
          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoExame)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Observações sobre o exame..."
              className="min-h-[80px]"
            />
          </div>

          {/* Info sobre data */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <AlertCircle className="h-4 w-4" />
            <span>
              Data do upload: {new Date().toLocaleDateString('pt-BR')} às{' '}
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="hero" onClick={handleSubmit} disabled={!arquivo}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Exame
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
