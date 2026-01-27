export type AppointmentStatus = 'scheduled' | 'completed' | 'canceled'

export interface Appointment {
  id: string
  user_id: string
  patient_id: string
  date: string
  time: string
  status: AppointmentStatus
  price: number
  created_at: string
  updated_at: string
}
