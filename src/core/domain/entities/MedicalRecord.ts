
export interface MedicalRecord {
  id: string;
  client_id: string;
  patient_id: string;
  professional_name?: string;
  content: string;
  created_at: string;
  updated_at: string;
}
