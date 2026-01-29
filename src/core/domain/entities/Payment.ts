
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'pix' | 'cartao' | 'dinheiro' | 'transferencia' | 'convenio';

export interface Payment {
  id: string;
  client_id: string;
  patient_id: string;
  appointment_id?: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  date: string; // The date of the transaction record
  paid_at?: string; // When it was actually paid
  created_at: string;
  updated_at: string;
}
