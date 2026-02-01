export type NotificationType = 
  | 'sistema' 
  | 'agendamento' 
  | 'pagamento' 
  | 'lembrete'
  | 'cancelamento'
  | 'plano';

export interface Notification {
  id: string;
  client_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  created_at: Date;
  updated_at: Date;
}
