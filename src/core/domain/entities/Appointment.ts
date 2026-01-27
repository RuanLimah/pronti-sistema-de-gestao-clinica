export type AppointmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface Appointment {
  id: string;
  user_id: string;
  patient_id: string;

  date: string; // YYYY-MM-DD
  time: string; // HH:mm

  status: AppointmentStatus;

  notes?: string | null;

  created_at: string;
  updated_at: string;
}

