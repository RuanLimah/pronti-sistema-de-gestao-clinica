export type PaymentMethod = 'pix' | 'card' | 'cash'
export type PaymentStatus = 'paid' | 'pending'

export interface Payment {
  id: string
  appointment_id: string
  patient_id: string
  value: number
  method: PaymentMethod
  status: PaymentStatus
  created_at: string
  updated_at: string
}
