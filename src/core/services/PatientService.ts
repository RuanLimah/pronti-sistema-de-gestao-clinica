import { CreatePatientDTO } from '@/core/domain/dtos/CreatePatientDTO'
import { Patient } from '@/core/domain/entities/Patient'
import { PatientRepository } from '@/core/domain/repositories/PatientRepository'

export class PatientService {
  constructor(private repository: PatientRepository) {}

  async create(userId: string, data: CreatePatientDTO): Promise<Patient> {
    if (!data.name.trim()) throw new Error('Nome é obrigatório')
    if (!data.phone.trim()) throw new Error('Telefone é obrigatório')
    return this.repository.create(userId, data)
  }

  async list(userId: string): Promise<Patient[]> {
    return this.repository.listByUser(userId)
  }

  async deactivate(id: string): Promise<void> {
    return this.repository.deactivate(id)
  }
}
