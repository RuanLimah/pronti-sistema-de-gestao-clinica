import { Patient } from '@/core/domain/entities/Patient';
import { CreatePatientDTO } from '@/core/domain/dtos/CreatePatientDTO';
import { PatientRepository } from '@/core/domain/repositories/PatientRepository';
import { supabase } from '@/lib/supabase';

export class SupabasePatientRepository implements PatientRepository {
  async create(userId: string, data: CreatePatientDTO): Promise<Patient> {
    const { data: patient, error } = await supabase
      .from('patients')
      .insert({
        client_id: userId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        observations: data.notes,
        birth_date: data.birth_date,
        cpf: data.cpf,
        address: data.address,
        consultation_value: data.consultation_value,
        lgpd_consent: data.lgpd_consent,
        lgpd_consent_date: data.lgpd_consent ? new Date().toISOString() : null,
        status: 'active',
        // Clinical data
        main_complaint: data.main_complaint,
        current_illness_history: data.current_illness_history,
        personal_history: data.personal_history,
        family_history: data.family_history,
        allergies: data.allergies,
        medications: data.medications
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating patient: ${error.message}`);
    }

    return this.mapToEntity(patient);
  }

  async listByUser(userId: string): Promise<Patient[]> {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .eq('client_id', userId)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Error listing patients: ${error.message}`);
    }

    return patients.map(this.mapToEntity);
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      throw new Error(`Error deactivating patient: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<CreatePatientDTO>): Promise<Patient> {
    const updateData: any = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      observations: data.notes,
      birth_date: data.birth_date,
      cpf: data.cpf,
      address: data.address,
      consultation_value: data.consultation_value,
      lgpd_consent: data.lgpd_consent,
      updated_at: new Date().toISOString(),
      // Clinical data
      main_complaint: data.main_complaint,
      current_illness_history: data.current_illness_history,
      personal_history: data.personal_history,
      family_history: data.family_history,
      allergies: data.allergies,
      medications: data.medications
    };

    // Remove undefined keys
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { data: patient, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating patient: ${error.message}`);
    }

    return this.mapToEntity(patient);
  }

  private mapToEntity(dbRow: any): Patient {
    return {
      id: dbRow.id,
      user_id: dbRow.client_id,
      name: dbRow.name,
      phone: dbRow.phone,
      email: dbRow.email,
      notes: dbRow.observations,
      active: dbRow.status === 'active',
      birth_date: dbRow.birth_date,
      cpf: dbRow.cpf,
      address: dbRow.address,
      consultation_value: dbRow.consultation_value,
      lgpd_consent: dbRow.lgpd_consent,
      lgpd_consent_date: dbRow.lgpd_consent_date,
      last_appointment: dbRow.last_appointment,
      total_appointments: dbRow.total_appointments,
      created_at: dbRow.created_at,
      updated_at: dbRow.updated_at || dbRow.created_at,
      // Clinical data
      main_complaint: dbRow.main_complaint,
      current_illness_history: dbRow.current_illness_history,
      personal_history: dbRow.personal_history,
      family_history: dbRow.family_history,
      allergies: dbRow.allergies,
      medications: dbRow.medications,
    };
  }
}
