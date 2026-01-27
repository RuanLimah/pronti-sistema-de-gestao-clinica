export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity: string
  entity_id: string
  created_at: string
}
