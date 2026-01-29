
import { MedicalRecord } from "@/core/domain/entities/MedicalRecord";
import { CreateMedicalRecordDTO, MedicalRecordRepository } from "@/core/domain/repositories/MedicalRecordRepository";
import { supabase } from "@/lib/supabase";

export class SupabaseMedicalRecordRepository implements MedicalRecordRepository {
  async create(userId: string, data: CreateMedicalRecordDTO): Promise<MedicalRecord> {
    const { data: record, error } = await supabase
      .from('medical_records')
      .insert({
        client_id: userId,
        patient_id: data.patient_id,
        content: data.content,
        professional_name: data.professional_name
      })
      .select()
      .single();

    if (error) throw new Error(`Error creating medical record: ${error.message}`);
    return record as MedicalRecord;
  }

  async listByPatient(patientId: string): Promise<MedicalRecord[]> {
    const { data: records, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error listing medical records: ${error.message}`);
    return records as MedicalRecord[];
  }

  async update(id: string, data: Partial<CreateMedicalRecordDTO>): Promise<MedicalRecord> {
    const updateData: any = {};
    if (data.content) updateData.content = data.content;
    if (data.professional_name) updateData.professional_name = data.professional_name;
    updateData.updated_at = new Date().toISOString();

    const { data: record, error } = await supabase
      .from('medical_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error updating medical record: ${error.message}`);
    return record as MedicalRecord;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error deleting medical record: ${error.message}`);
  }
}
