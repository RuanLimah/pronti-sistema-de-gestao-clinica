import { Patient } from '../models/Patient'
import { v4 as uuid } from 'uuid'

// eslint-disable-next-line prefer-const
let patients: Patient[] = []


export const PatientRepository = {
  listByUser(userId: string) {
    return patients.filter(p => p.user_id === userId)
  },

  getById(id: string) {
    return patients.find(p => p.id === id)
  },

  create(data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) {
    const now = new Date().toISOString()
    const patient: Patient = {
      ...data,
      id: uuid(),
      created_at: now,
      updated_at: now
    }
    patients.push(patient)
    return patient
  },

  update(id: string, data: Partial<Patient>) {
    const index = patients.findIndex(p => p.id === id)
    if (index === -1) return null

    patients[index] = {
      ...patients[index],
      ...data,
      updated_at: new Date().toISOString()
    }

    return patients[index]
  }
}
    