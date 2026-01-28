// ============= PRONTI - Store de Pacientes =============

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Status do paciente
export type PatientStatus = 'ativo' | 'inativo' | 'arquivado';

// Estrutura do paciente
export interface PatientRecord {
  id: string;
  clienteId: string; // ID do profissional dono
  
  // Dados pessoais
  nome: string;
  email?: string;
  telefone: string;
  dataNascimento?: Date;
  cpf?: string;
  endereco?: string;
  
  // Status
  status: PatientStatus;
  
  // Dados clínicos básicos (metadata, não conteúdo)
  observacoes?: string;
  valorConsulta?: number;
  
  // LGPD
  consentimentoLgpd: boolean;
  consentimentoData?: Date;
  
  // Datas
  criadoEm: Date;
  atualizadoEm?: Date;
  ultimoAtendimento?: Date;
  
  // Contadores
  totalAtendimentos: number;
}

interface PatientStore {
  // Estado
  patients: PatientRecord[];
  
  // Getters - Isolamento por cliente
  getPatientsByClient: (clienteId: string) => PatientRecord[];
  getActivePatientsByClient: (clienteId: string) => PatientRecord[];
  getPatient: (id: string, clienteId: string) => PatientRecord | undefined;
  
  // Getters - Admin (todos os pacientes - apenas metadados)
  getAllPatientsCount: () => number;
  getPatientCountByClient: (clienteId: string) => number;
  getActivePatientCountByClient: (clienteId: string) => number;
  
  // Mutações
  createPatient: (clienteId: string, data: Omit<PatientRecord, 'id' | 'clienteId' | 'criadoEm' | 'totalAtendimentos'>) => PatientRecord;
  updatePatient: (id: string, clienteId: string, data: Partial<PatientRecord>) => boolean;
  setPatientStatus: (id: string, clienteId: string, status: PatientStatus) => boolean;
  incrementAtendimentos: (id: string, clienteId: string) => void;
  
  // Verificações de permissão
  canAccessPatient: (patientId: string, clienteId: string) => boolean;
  
  // Utils
  gerarId: () => string;
}

// Mock de pacientes iniciais
const mockPatients: PatientRecord[] = [
  // Pacientes da Dra. Ana Silva (cliente-1)
  {
    id: 'pac-1',
    clienteId: 'cliente-1',
    nome: 'João Pedro Santos',
    email: 'joao.santos@email.com',
    telefone: '11999001122',
    dataNascimento: new Date('1985-03-15'),
    status: 'ativo',
    valorConsulta: 250,
    consentimentoLgpd: true,
    consentimentoData: new Date('2024-01-20'),
    criadoEm: new Date('2024-01-20'),
    ultimoAtendimento: new Date('2025-01-15'),
    totalAtendimentos: 24,
  },
  {
    id: 'pac-2',
    clienteId: 'cliente-1',
    nome: 'Maria Fernanda Lima',
    email: 'maria.lima@email.com',
    telefone: '11988002233',
    dataNascimento: new Date('1990-07-22'),
    status: 'ativo',
    valorConsulta: 250,
    consentimentoLgpd: true,
    consentimentoData: new Date('2024-02-10'),
    criadoEm: new Date('2024-02-10'),
    ultimoAtendimento: new Date('2025-01-20'),
    totalAtendimentos: 18,
  },
  {
    id: 'pac-3',
    clienteId: 'cliente-1',
    nome: 'Carlos Eduardo Almeida',
    telefone: '11977003344',
    status: 'inativo',
    consentimentoLgpd: true,
    criadoEm: new Date('2024-03-05'),
    ultimoAtendimento: new Date('2024-09-10'),
    totalAtendimentos: 8,
  },
  
  // Pacientes do Dr. Carlos Mendes (cliente-2)
  {
    id: 'pac-4',
    clienteId: 'cliente-2',
    nome: 'Ana Beatriz Souza',
    email: 'ana.souza@empresa.com',
    telefone: '11966004455',
    status: 'ativo',
    valorConsulta: 200,
    consentimentoLgpd: true,
    consentimentoData: new Date('2024-04-01'),
    criadoEm: new Date('2024-04-01'),
    ultimoAtendimento: new Date('2025-01-18'),
    totalAtendimentos: 12,
  },
  {
    id: 'pac-5',
    clienteId: 'cliente-2',
    nome: 'Roberto Nascimento',
    telefone: '11955005566',
    status: 'ativo',
    consentimentoLgpd: true,
    criadoEm: new Date('2024-05-15'),
    ultimoAtendimento: new Date('2025-01-22'),
    totalAtendimentos: 6,
  },
  
  // Pacientes da Dra. Mariana Costa (cliente-3 - trial)
  {
    id: 'pac-6',
    clienteId: 'cliente-3',
    nome: 'Lucas Oliveira',
    email: 'lucas.oliveira@email.com',
    telefone: '21988001122',
    status: 'ativo',
    consentimentoLgpd: true,
    consentimentoData: new Date('2025-01-12'),
    criadoEm: new Date('2025-01-12'),
    totalAtendimentos: 2,
  },
];

export const usePatientStore = create<PatientStore>()(
  persist(
    (set, get) => ({
      patients: mockPatients,
      
      gerarId: () => `pac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      
      // ==================== GETTERS - ISOLAMENTO POR CLIENTE ====================
      
      getPatientsByClient: (clienteId) => {
        return get().patients.filter(p => p.clienteId === clienteId);
      },
      
      getActivePatientsByClient: (clienteId) => {
        return get().patients.filter(p => p.clienteId === clienteId && p.status === 'ativo');
      },
      
      getPatient: (id, clienteId) => {
        // Só retorna se o paciente pertencer ao cliente
        return get().patients.find(p => p.id === id && p.clienteId === clienteId);
      },
      
      // ==================== GETTERS - ADMIN ====================
      
      getAllPatientsCount: () => get().patients.length,
      
      getPatientCountByClient: (clienteId) => {
        return get().patients.filter(p => p.clienteId === clienteId).length;
      },
      
      getActivePatientCountByClient: (clienteId) => {
        return get().patients.filter(p => p.clienteId === clienteId && p.status === 'ativo').length;
      },
      
      // ==================== MUTAÇÕES ====================
      
      createPatient: (clienteId, data) => {
        const id = get().gerarId();
        
        const patient: PatientRecord = {
          ...data,
          id,
          clienteId,
          criadoEm: new Date(),
          totalAtendimentos: 0,
        };
        
        set(state => ({
          patients: [...state.patients, patient],
        }));
        
        return patient;
      },
      
      updatePatient: (id, clienteId, data) => {
        const patient = get().getPatient(id, clienteId);
        if (!patient) return false; // Não tem permissão ou não existe
        
        set(state => ({
          patients: state.patients.map(p =>
            p.id === id && p.clienteId === clienteId
              ? { ...p, ...data, atualizadoEm: new Date() }
              : p
          ),
        }));
        
        return true;
      },
      
      setPatientStatus: (id, clienteId, status) => {
        const patient = get().getPatient(id, clienteId);
        if (!patient) return false;
        
        set(state => ({
          patients: state.patients.map(p =>
            p.id === id && p.clienteId === clienteId
              ? { ...p, status, atualizadoEm: new Date() }
              : p
          ),
        }));
        
        return true;
      },
      
      incrementAtendimentos: (id, clienteId) => {
        const patient = get().getPatient(id, clienteId);
        if (!patient) return;
        
        set(state => ({
          patients: state.patients.map(p =>
            p.id === id && p.clienteId === clienteId
              ? {
                  ...p,
                  totalAtendimentos: p.totalAtendimentos + 1,
                  ultimoAtendimento: new Date(),
                  atualizadoEm: new Date(),
                }
              : p
          ),
        }));
      },
      
      // ==================== VERIFICAÇÕES ====================
      
      canAccessPatient: (patientId, clienteId) => {
        const patient = get().patients.find(p => p.id === patientId);
        if (!patient) return false;
        return patient.clienteId === clienteId;
      },
    }),
    {
      name: 'pronti-patients',
    }
  )
);
