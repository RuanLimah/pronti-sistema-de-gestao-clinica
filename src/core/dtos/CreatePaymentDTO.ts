export interface CreatePaymentDTO {
  appointment_id: string
  patient_id: string
  value: number
  method: 'pix' | 'card' | 'cash'
}
