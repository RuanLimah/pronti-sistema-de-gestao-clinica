import { Patient } from '@/core/domain/entities/Patient'
import { CreatePatientDTO } from '@/core/domain/dtos/CreatePatientDTO'
import { PatientRepository } from '@/core/domain/repositories/PatientRepository'

const patients: Patient[] = []

export class PatientRepositoryMock implements PatientRepository {
  async create(userId: string, data: CreatePatientDTO): Promise<Patient> {
    const now = new Date().toISOString()
    const patient: Patient = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      notes: data.notes ?? null,
      active: true,
      created_at: now,
      updated_at: now
    }

    patients.push(patient)
    return patient
  }

  async listByUser(userId: string): Promise<Patient[]> {
    return patients.filter(p => p.user_id === userId && p.active)
  }

  async deactivate(id: string): Promise<void> {
    const patient = patients.find(p => p.id === id)
    if (patient) {
      patient.active = false
      patient.updated_at = new Date().toISOString()
    }
  }
}
