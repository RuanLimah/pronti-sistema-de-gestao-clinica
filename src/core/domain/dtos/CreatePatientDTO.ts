export interface CreatePatientDTO {
  name: string
  phone: string
  email?: string
  notes?: string
  birth_date?: string
  cpf?: string
  address?: string
  consultation_value?: number
  lgpd_consent?: boolean
  
  // Clinical data
  main_complaint?: string
  current_illness_history?: string
  personal_history?: string
  family_history?: string
  allergies?: string
  medications?: string
}
