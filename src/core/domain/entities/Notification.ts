export type NotificationType =
  | "appointment_pending"
  | "appointment_approved"
  | "appointment_rejected"
  | "appointment_cancelled"
  | "payment_confirmed";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: Date;
  read: boolean;
}
