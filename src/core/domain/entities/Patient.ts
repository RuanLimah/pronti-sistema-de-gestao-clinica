export interface Patient {
  id: string
  user_id: string
  name: string
  phone: string
  email?: string | null
  notes?: string | null
  active: boolean
  birth_date?: string | null
  cpf?: string | null
  address?: string | null
  consultation_value?: number | null
  lgpd_consent?: boolean
  lgpd_consent_date?: string | null
  last_appointment?: string | null
  total_appointments?: number
  created_at: string
  updated_at: string
  
  // Clinical data
  main_complaint?: string | null
  current_illness_history?: string | null
  personal_history?: string | null
  family_history?: string | null
  allergies?: string | null
  medications?: string | null
}
