import { Patient } from '../entities/Patient'
import { CreatePatientDTO } from '../dtos/CreatePatientDTO'

export interface PatientRepository {
  create(userId: string, data: CreatePatientDTO): Promise<Patient>
  listByUser(userId: string): Promise<Patient[]>
  deactivate(id: string): Promise<void>
}
