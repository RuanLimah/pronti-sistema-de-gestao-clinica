import { Notification } from "../entities/Notification";
import { CreateNotificationDTO } from "../../dtos/CreateNotificationDTO";

export interface NotificationRepository {
  create(clientId: string, data: CreateNotificationDTO): Promise<Notification>;
  listByUser(clientId: string): Promise<Notification[]>;
  listUnread(clientId: string): Promise<Notification[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(clientId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
