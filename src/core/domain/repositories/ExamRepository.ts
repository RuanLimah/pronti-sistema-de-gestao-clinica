
import { Exam } from "../entities/Exam";

export interface CreateExamDTO {
  patient_id: string;
  name: string;
  type: 'laboratorio' | 'imagem' | 'laudo' | 'receita' | 'atestado' | 'encaminhamento' | 'outro';
  description?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}

export interface ExamRepository {
  create(userId: string, data: CreateExamDTO): Promise<Exam>;
  listByPatient(patientId: string): Promise<Exam[]>;
  update(id: string, data: Partial<CreateExamDTO>): Promise<Exam>;
  delete(id: string): Promise<void>;
  uploadFile(file: File, path: string): Promise<string>;
}
