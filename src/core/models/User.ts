export type UserRole = 'admin' | 'doctor'
export type UserPlan = 'basic' | 'pro' | 'premium'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  plan: UserPlan
  active: boolean
  created_at: string
  updated_at: string
}
