
import { Exam } from "@/core/domain/entities/Exam";
import { CreateExamDTO, ExamRepository } from "@/core/domain/repositories/ExamRepository";
import { supabase } from "@/lib/supabase";

export class SupabaseExamRepository implements ExamRepository {
  async create(userId: string, data: CreateExamDTO): Promise<Exam> {
    const { data: exam, error } = await supabase
      .from('exams')
      .insert({
        client_id: userId,
        patient_id: data.patient_id,
        name: data.name,
        type: data.type,
        description: data.description,
        file_url: data.file_url,
        file_name: data.file_name,
        file_type: data.file_type,
        file_size: data.file_size
      })
      .select()
      .single();

    if (error) throw new Error(`Error creating exam: ${error.message}`);
    return exam as Exam;
  }

  async listByPatient(patientId: string): Promise<Exam[]> {
    const { data: exams, error } = await supabase
      .from('exams')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error listing exams: ${error.message}`);
    return exams as Exam[];
  }

  async update(id: string, data: Partial<CreateExamDTO>): Promise<Exam> {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.type) updateData.type = data.type;
    if (data.description) updateData.description = data.description;
    if (data.file_url) updateData.file_url = data.file_url;
    if (data.file_name) updateData.file_name = data.file_name;
    if (data.file_type) updateData.file_type = data.file_type;
    if (data.file_size) updateData.file_size = data.file_size;
    updateData.updated_at = new Date().toISOString();

    const { data: exam, error } = await supabase
      .from('exams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error updating exam: ${error.message}`);
    return exam as Exam;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error deleting exam: ${error.message}`);
  }
}
