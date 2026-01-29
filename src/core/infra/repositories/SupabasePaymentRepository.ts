
import { Payment } from "@/core/domain/entities/Payment";
import { CreatePaymentDTO, PaymentRepository } from "@/core/domain/repositories/PaymentRepository";
import { supabase } from "@/lib/supabase";

export class SupabasePaymentRepository implements PaymentRepository {
  async create(userId: string, data: CreatePaymentDTO): Promise<Payment> {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        client_id: userId,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id,
        amount: data.amount,
        status: data.status,
        method: data.method,
        paid_at: data.paid_at,
        payment_date: data.date, // Mapping to payment_date column
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`Error creating payment: ${error.message}`);
    return this.mapToEntity(payment);
  }

  async listByUser(userId: string): Promise<Payment[]> {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error listing payments: ${error.message}`);
    return payments.map(this.mapToEntity);
  }

  async listByPatient(patientId: string): Promise<Payment[]> {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error listing payments by patient: ${error.message}`);
    return payments.map(this.mapToEntity);
  }

  async update(id: string, data: Partial<CreatePaymentDTO>): Promise<Payment> {
    const updateData: any = {};
    if (data.amount) updateData.amount = data.amount;
    if (data.status) updateData.status = data.status;
    if (data.method) updateData.method = data.method;
    if (data.paid_at) updateData.paid_at = data.paid_at;
    if (data.date) updateData.payment_date = data.date;
    
    const { data: payment, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error updating payment: ${error.message}`);
    return this.mapToEntity(payment);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error deleting payment: ${error.message}`);
  }

  private mapToEntity(data: any): Payment {
    return {
      id: data.id,
      client_id: data.client_id,
      patient_id: data.patient_id,
      appointment_id: data.appointment_id,
      amount: Number(data.amount),
      status: data.status,
      method: data.method || 'dinheiro', // Default or handle null
      date: data.payment_date || data.created_at, // Use payment_date if available
      paid_at: data.paid_at,
      created_at: data.created_at,
      updated_at: data.created_at // or updated_at if available
    };
  }
}
