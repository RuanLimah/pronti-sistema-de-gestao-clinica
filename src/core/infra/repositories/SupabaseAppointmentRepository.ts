
import { Appointment, AppointmentStatus } from "@/core/domain/entities/Appointment";
import { AppointmentRepository, CreateAppointmentDTO } from "@/core/domain/repositories/AppointmentRepository";
import { supabase } from "@/lib/supabase";

export class SupabaseAppointmentRepository implements AppointmentRepository {
  async create(userId: string, data: CreateAppointmentDTO): Promise<Appointment> {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        client_id: userId,
        patient_id: data.patient_id,
        date: data.date,
        time: data.time,
        notes: data.notes,
        status: 'agendado'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase Error (Create Appointment):', error);
      throw new Error(`Error creating appointment: ${error.message}`);
    }
    return this.mapToEntity(appointment);
  }

  async listByUser(userId: string): Promise<Appointment[]> {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', userId);

    if (error) throw new Error(`Error listing appointments: ${error.message}`);
    return appointments.map((a) => this.mapToEntity(a));
  }

  async listByPatient(patientId: string): Promise<Appointment[]> {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId);

    if (error) throw new Error(`Error listing appointments by patient: ${error.message}`);
    return appointments.map((a) => this.mapToEntity(a));
  }

  async listByDate(userId: string, date: string): Promise<Appointment[]> {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', userId)
      .eq('date', date);

    if (error) throw new Error(`Error listing appointments by date: ${error.message}`);
    return appointments.map((a) => this.mapToEntity(a));
  }

  async approve(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'realizado' }) // Mapping approved -> realizado
      .eq('id', id);
    if (error) throw new Error(`Error approving appointment: ${error.message}`);
  }

  async reject(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelado' }) // Mapping rejected -> cancelado
      .eq('id', id);
    if (error) throw new Error(`Error rejecting appointment: ${error.message}`);
  }

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelado' })
      .eq('id', id);
    if (error) throw new Error(`Error cancelling appointment: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Error deleting appointment: ${error.message}`);
  }

  async update(id: string, data: Partial<CreateAppointmentDTO>): Promise<Appointment> {
    const updateData: any = {};
    if (data.date) updateData.date = data.date;
    if (data.time) updateData.time = data.time;
    if (data.notes) updateData.notes = data.notes;
    updateData.updated_at = new Date().toISOString();

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error updating appointment: ${error.message}`);
    return this.mapToEntity(appointment);
  }

  async markReminderSent(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ 
        whatsapp_reminder_sent: true,
        whatsapp_reminder_sent_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw new Error(`Error marking reminder sent: ${error.message}`);
  }

  private mapToEntity(data: any): Appointment {
    return {
      id: data.id,
      user_id: data.client_id,
      patient_id: data.patient_id,
      date: data.date,
      time: data.time,
      status: this.mapStatus(data.status ?? 'pending'),
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  private mapStatus(status: string): AppointmentStatus {
    switch (status) {
      case 'agendado': return 'pending';
      case 'realizado': return 'approved';
      case 'cancelado': return 'cancelled';
      default: return 'pending';
    }
  }
}
