
import { Payment, PaymentMethod, PaymentStatus } from "../entities/Payment";

export interface CreatePaymentDTO {
  patient_id: string;
  appointment_id?: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  paid_at?: string;
  date?: string;
}

export interface PaymentRepository {
  create(userId: string, data: CreatePaymentDTO): Promise<Payment>;
  listByUser(userId: string): Promise<Payment[]>;
  listByPatient(patientId: string): Promise<Payment[]>;
  update(id: string, data: Partial<CreatePaymentDTO>): Promise<Payment>;
  delete(id: string): Promise<void>;
}
