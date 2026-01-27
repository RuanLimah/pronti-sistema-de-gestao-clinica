import { Appointment } from "../entities/Appointment";

export interface CreateAppointmentDTO {
  patient_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
}

export interface AppointmentRepository {
  create(userId: string, data: CreateAppointmentDTO): Promise<Appointment>;

  listByUser(userId: string): Promise<Appointment[]>;

  listByDate(userId: string, date: string): Promise<Appointment[]>;

  approve(id: string): Promise<void>;
  reject(id: string): Promise<void>;
  cancel(id: string): Promise<void>;
}
