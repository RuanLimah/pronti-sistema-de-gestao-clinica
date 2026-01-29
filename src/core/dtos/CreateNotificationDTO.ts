import { NotificationType } from "../domain/entities/Notification";

export interface CreateNotificationDTO {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}
