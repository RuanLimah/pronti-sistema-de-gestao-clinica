// ============= Tipos para Exames Médicos =============

export interface ExameMedico {
  id: string;
  pacienteId: string;
  medicoId?: string;
  nome: string;
  tipo: TipoExame;
  descricao?: string;
  arquivo: ArquivoExame;
  criadoEm: Date;
  atualizadoEm?: Date;
}

export interface ArquivoExame {
  nome: string;
  tipo: string; // MIME type
  tamanho: number; // bytes
  url: string; // URL local ou Supabase Storage
  file?: File; // Raw file for upload
}

export type TipoExame = 
  | 'laboratorio'
  | 'imagem'
  | 'laudo'
  | 'receita'
  | 'atestado'
  | 'encaminhamento'
  | 'outro';

export const TIPOS_EXAME: { value: TipoExame; label: string; icon: string }[] = [
  { value: 'laboratorio', label: 'Exame Laboratorial', icon: '🧪' },
  { value: 'imagem', label: 'Exame de Imagem', icon: '🩻' },
  { value: 'laudo', label: 'Laudo Médico', icon: '📋' },
  { value: 'receita', label: 'Receita', icon: '💊' },
  { value: 'atestado', label: 'Atestado', icon: '📄' },
  { value: 'encaminhamento', label: 'Encaminhamento', icon: '📨' },
  { value: 'outro', label: 'Outro', icon: '📁' },
];

export const FORMATOS_ACEITOS = {
  documentos: ['.pdf', '.doc', '.docx'],
  imagens: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  todos: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp', '.gif'],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
  if (mimeType.includes('image')) return '🖼️';
  return '📄';
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
