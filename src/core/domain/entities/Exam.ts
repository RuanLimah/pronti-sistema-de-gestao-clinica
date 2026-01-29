
export interface Exam {
  id: string;
  client_id: string;
  patient_id: string;
  name: string;
  type: 'laboratorio' | 'imagem' | 'laudo' | 'receita' | 'atestado' | 'encaminhamento' | 'outro';
  description?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}
