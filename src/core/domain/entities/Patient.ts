export interface Patient {
  id: string
  user_id: string
  name: string
  phone: string
  email?: string | null
  notes?: string | null
  active: boolean
  created_at: string
  updated_at: string
}
