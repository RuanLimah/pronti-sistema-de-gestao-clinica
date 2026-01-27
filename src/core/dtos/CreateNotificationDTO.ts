export interface CreateNotificationDTO {
  type: 'appointment_created' | 'appointment_canceled' | 'payment_confirmed'
  message: string
}
