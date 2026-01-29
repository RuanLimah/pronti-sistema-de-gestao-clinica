
import { MedicalRecord } from "../entities/MedicalRecord";

export interface CreateMedicalRecordDTO {
  patient_id: string;
  content: string;
  professional_name?: string;
}

export interface MedicalRecordRepository {
  create(userId: string, data: CreateMedicalRecordDTO): Promise<MedicalRecord>;
  listByPatient(patientId: string): Promise<MedicalRecord[]>;
  update(id: string, data: Partial<CreateMedicalRecordDTO>): Promise<MedicalRecord>;
  delete(id: string): Promise<void>;
}
