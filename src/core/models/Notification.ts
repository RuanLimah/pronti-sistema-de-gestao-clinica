export type NotificationType =
  | 'appointment_created'
  | 'appointment_canceled'
  | 'payment_confirmed'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  message: string
  read: boolean
  created_at: string
}
